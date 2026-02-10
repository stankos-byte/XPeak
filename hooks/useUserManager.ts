import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, SkillCategory, Goal, ProfileLayout, TaskTemplate, DailyActivity, Task, MainQuest } from '../types';
import { calculateLevel, getLevelProgress } from '../utils/gamification';
import { storage, STORAGE_KEYS } from '../services/localStorage';
import { persistenceService } from '../services/persistenceService';
import { gameToast } from '../components/ui/GameToast';
import { addHistoryEntry, processHistory, ArchivedHistory, migrateToDailyAggregates, HistoryEntry } from '../services/historyService';
import { useAuth } from '../contexts/AuthContext';
import { 
  updateUserProfile, 
  updateUserLayout,
  updateUserIdentity,
  saveHistoryEntry,
  getHistory,
  migrateLocalStorageToFirestore,
  getTasks,
  getQuests,
  getGoals,
  subscribeGoals,
  saveGoal,
  updateGoalData,
  deleteGoalData,
  getTemplates,
  subscribeTemplates,
  saveTemplate,
  deleteTemplateData
} from '../services/firestoreDataService';
import { getUserDocument, updateUserNickname } from '../services/firestoreUserService';

const DEFAULT_LAYOUT: ProfileLayout = { 
  widgets: [
    { id: 'identity', enabled: true, order: 0 }, 
    { id: 'skillMatrix', enabled: true, order: 1 }, 
    { id: 'evolution', enabled: true, order: 2 }, 
    { id: 'calendar', enabled: true, order: 3 }, 
    { id: 'friends', enabled: true, order: 4 },
    { id: 'tasks', enabled: true, order: 5 }
  ] 
};

const getDefaultUser = (): UserProfile => {
  const skills = {} as Record<SkillCategory, { category: SkillCategory; xp: number; level: number }>;
  Object.values(SkillCategory).forEach(cat => {
    skills[cat] = { category: cat, xp: 0, level: 0 };
  });
  return { 
    name: 'Protocol-01',
    nickname: 'Protocol-01',
    totalXP: 0, 
    level: 0, 
    skills, 
    history: [], 
    identity: '', 
    layout: DEFAULT_LAYOUT 
  };
};

const getInitialUserLocal = (): UserProfile => {
  // Load from localStorage scoped by anonymous session (null uid)
  const saved = storage.get<UserProfile | null>(STORAGE_KEYS.USER, null, null);
  
  if (saved) {
    // Migration: Ensure all default widgets exist
    const existingIds = new Set(saved.layout?.widgets?.map((w) => w.id) || []);
    const newWidgets = DEFAULT_LAYOUT.widgets.filter(w => !existingIds.has(w.id));
    
    const layout = saved.layout ? {
        ...saved.layout,
        widgets: [...saved.layout.widgets, ...newWidgets]
    } : DEFAULT_LAYOUT;

    // Migrate legacy history format to daily aggregates if needed
    let historyToProcess = saved.history || [];
    
    // Check if history is in legacy format (has taskId property) and migrate
    if (historyToProcess.length > 0 && 'taskId' in historyToProcess[0]) {
      // Legacy format detected - migrate to daily aggregates
      historyToProcess = migrateToDailyAggregates(historyToProcess as HistoryEntry[]);
    }
    
    // Process history to ensure it's within limits and archive old entries
    // Note: This limits to 30 days and archives older entries to prevent app slowdown
    // Only applies to anonymous users (localStorage data)
    const { activeHistory, archivedData } = processHistory(historyToProcess);
    
    // Store archived data if any exists (scoped by anonymous session)
    if (archivedData) {
      const existingArchives = storage.get<ArchivedHistory[]>(STORAGE_KEYS.ARCHIVED_HISTORY, [], null);
      persistenceService.set(STORAGE_KEYS.ARCHIVED_HISTORY, [...existingArchives, archivedData], null);
    }

    return { ...saved, layout, history: activeHistory };
  }
  
  return getDefaultUser();
};

interface UseUserManagerReturn {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  levelProgress: { current: number; max: number; percentage: number };
  applyGlobalXPChange: (
    amount: number, 
    historyId: string, 
    popups: Record<string, number>, 
    skillCategory?: SkillCategory, 
    skillAmount?: number
  ) => void;
  updateIdentity: (identity: string) => void;
  updateNickname: (nickname: string) => void;
  addGoal: (title: string) => void;
  toggleGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  updateLayout: (layout: ProfileLayout) => void;
  saveTemplate: (template: TaskTemplate) => void;
  deleteTemplate: (id: string) => void;
  showLevelUp: { show: boolean; level: number } | null;
  setShowLevelUp: (value: { show: boolean; level: number } | null) => void;
  xpPopups: Record<string, number>;
  flashKey: number;
  isLoading: boolean;
}

export const useUserManager = (): UseUserManagerReturn => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile>(getInitialUserLocal);
  const [xpPopups, setXpPopups] = useState<Record<string, number>>({});
  const [flashKey, setFlashKey] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState<{ show: boolean; level: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Separate state for goals and templates (now in subcollections)
  const [goals, setGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  
  // Track if we're syncing from Firestore
  const isSyncingRef = useRef(false);
  const initialLoadCompleteRef = useRef(false);
  // Track if migration has been attempted
  const migrationAttemptedRef = useRef(false);

  // Load user data from Firestore when authenticated
  useEffect(() => {
    if (!authUser) {
      initialLoadCompleteRef.current = false;
      migrationAttemptedRef.current = false;
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      
      // IMMEDIATE: Load cached data from localStorage first for instant UI
      // This provides immediate feedback while network request completes
      const cachedUserKey = `${STORAGE_KEYS.USER}_cached_${authUser.uid}`;
      const cachedUser = storage.get<Partial<UserProfile> | null>(cachedUserKey, null, authUser.uid);
      if (cachedUser && cachedUser.totalXP !== undefined) {
        console.log('📦 Loading cached data:', { 
          historyDays: cachedUser.history?.length || 0, 
          totalXP: cachedUser.totalXP 
        });
        // Show cached data immediately (including history if available)
        isSyncingRef.current = true;
        setUser(prev => ({
          ...prev,
          name: cachedUser.name || prev.name,
          nickname: cachedUser.nickname || prev.nickname,
          totalXP: cachedUser.totalXP,
          level: cachedUser.level || 0,
          identity: cachedUser.identity || prev.identity,
          history: cachedUser.history || prev.history // Include cached history
        }));
        isSyncingRef.current = false;
      } else {
        console.log('📭 No cache found for user:', authUser.uid);
      }
      
      try {
        // NETWORK: Now fetch fresh data from Firestore
        const firestoreUser = await getUserDocument(authUser.uid);
        
        if (firestoreUser) {
          // Convert Firestore user to UserProfile format
          const firestoreSkills = {} as Record<SkillCategory, { category: SkillCategory; xp: number; level: number }>;
          Object.entries(firestoreUser.skills).forEach(([key, value]) => {
            firestoreSkills[key as SkillCategory] = {
              category: key as SkillCategory,
              xp: value.xp,
              level: value.level
            };
          });

          // Get history from subcollection
          const history = await getHistory(authUser.uid);
          console.log('🔥 Loaded from Firestore:', { 
            historyDays: history.length, 
            totalXP: firestoreUser.totalXP 
          });

          // Migration: If nickname is missing, use name as default and update Firestore
          const nickname = firestoreUser.nickname || firestoreUser.name;
          if (!firestoreUser.nickname) {
            console.log('🔄 Migrating user: Adding nickname field from name');
            updateUserNickname(authUser.uid, nickname).catch(error => {
              console.error('Failed to migrate nickname:', error);
            });
          }

          const userProfile: UserProfile = {
            uid: authUser.uid,
            name: firestoreUser.name,
            nickname: nickname,
            totalXP: firestoreUser.totalXP,
            level: firestoreUser.level,
            skills: firestoreSkills,
            history: history,
            identity: firestoreUser.identity || '',
            layout: firestoreUser.layout || DEFAULT_LAYOUT
          };

          // Load goals and templates from subcollections
          const goalsData = await getGoals(authUser.uid);
          const templatesData = await getTemplates(authUser.uid);
          setGoals(goalsData);
          setTemplates(templatesData);

          // Check if we should migrate localStorage data
          // Migrate if Firestore is empty but localStorage has data (tasks, quests, or user profile)
          const localUser = getInitialUserLocal();
          const localTasks = storage.get<Task[]>(STORAGE_KEYS.TASKS, [], null);
          const localQuests = storage.get<MainQuest[]>(STORAGE_KEYS.QUESTS, [], null);
          
          // Check what Firestore has
          const firestoreTasks = await getTasks(authUser.uid);
          const firestoreQuests = await getQuests(authUser.uid);
          
          const hasLocalData = localUser.totalXP > 0 || localTasks.length > 0 || localQuests.length > 0;
          const firestoreIsEmpty = firestoreUser.totalXP === 0 && firestoreTasks.length === 0 && firestoreQuests.length === 0;
          
          if (!migrationAttemptedRef.current && firestoreIsEmpty && hasLocalData) {
            migrationAttemptedRef.current = true;
            console.log('📦 Detected localStorage data to migrate...');
            console.log(`   - User XP: ${localUser.totalXP}`);
            console.log(`   - Tasks: ${localTasks.length}`);
            console.log(`   - Quests: ${localQuests.length}`);
            
            // Migrate ALL localStorage data to Firestore (including tasks and quests)
            await migrateLocalStorageToFirestore(authUser.uid, {
              userProfile: {
                totalXP: localUser.totalXP,
                level: localUser.level,
                skills: Object.fromEntries(
                  Object.entries(localUser.skills).map(([key, value]) => [key, { xp: value.xp, level: value.level }])
                ) as Record<SkillCategory, { xp: number; level: number }>,
                identity: localUser.identity,
                goals: localUser.goals,
                templates: localUser.templates,
                layout: localUser.layout
              },
              history: localUser.history,
              tasks: localTasks,
              quests: localQuests
            });

            // Use the local data since we just migrated it
            isSyncingRef.current = true;
            setUser(localUser);
            // Explicitly save to cache after migration
            setTimeout(() => {
              isSyncingRef.current = false;
              const cachedUserKey = `${STORAGE_KEYS.USER}_cached_${authUser.uid}`;
              const cacheData = {
                name: localUser.name,
                nickname: localUser.nickname,
                totalXP: localUser.totalXP,
                level: localUser.level,
                identity: localUser.identity,
                history: localUser.history
              };
              storage.set(cachedUserKey, cacheData, authUser.uid);
            }, 0);
            
            console.log('✅ Migration complete! All data synced to cloud.');
          } else {
            isSyncingRef.current = true;
            setUser(userProfile);
            // Explicitly save to cache after loading from Firestore
            setTimeout(() => {
              isSyncingRef.current = false;
              // Save fresh Firestore data to cache for next refresh
              const cachedUserKey = `${STORAGE_KEYS.USER}_cached_${authUser.uid}`;
              const cacheData = {
                name: userProfile.name,
                nickname: userProfile.nickname,
                totalXP: userProfile.totalXP,
                level: userProfile.level,
                identity: userProfile.identity,
                history: userProfile.history
              };
              storage.set(cachedUserKey, cacheData, authUser.uid);
              console.log('💾 Saved to cache:', { 
                historyDays: cacheData.history?.length || 0, 
                totalXP: cacheData.totalXP 
              });
            }, 0);
          }
        }
        
        initialLoadCompleteRef.current = true;
      } catch (error: any) {
        console.error('Failed to load user data from Firestore:', error);
        
        // If permission denied, keep using cached local data instead of resetting
        if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
          console.warn('⚠️ Sync Error: Permission denied. Using cached local data.');
          // Don't overwrite user state - keep the cached data that was loaded at line 165
          // User will continue with cached data until permissions are fixed
        } else {
          // For other errors, still use cached data if available
          console.warn('⚠️ Sync Error: Unable to load from Firestore. Using cached local data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [authUser]);

  // Subscribe to real-time updates for goals and templates
  useEffect(() => {
    if (!authUser) {
      // Load from localStorage for non-authenticated users
      const localGoals = storage.get<Goal[]>('goals', [], null);
      const localTemplates = storage.get<TaskTemplate[]>('templates', [], null);
      setGoals(localGoals);
      setTemplates(localTemplates);
      return;
    }

    // Subscribe to goals changes
    const unsubscribeGoals = subscribeGoals(authUser.uid, (goalsData) => {
      setGoals(goalsData);
    });

    // Subscribe to templates changes
    const unsubscribeTemplates = subscribeTemplates(authUser.uid, (templatesData) => {
      setTemplates(templatesData);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeGoals();
      unsubscribeTemplates();
    };
  }, [authUser]);

  // Save goals and templates to localStorage when not authenticated (fallback)
  useEffect(() => {
    if (isSyncingRef.current || !initialLoadCompleteRef.current) return;
    
    if (!authUser) {
      persistenceService.set('goals', goals, null);
      persistenceService.set('templates', templates, null);
    }
  }, [goals, templates, authUser]);

  // Save to localStorage when not authenticated (fallback)
  useEffect(() => { 
    if (isSyncingRef.current) {
      console.log('⏸️ Cache save blocked - syncing in progress');
      return;
    }
    
    if (!authUser) {
      persistenceService.set(STORAGE_KEYS.USER, user, null); 
    } else {
      // Cache authenticated user data for instant loading on refresh
      const cachedUserKey = `${STORAGE_KEYS.USER}_cached_${authUser.uid}`;
      const cacheData = {
        name: user.name,
        nickname: user.nickname,
        totalXP: user.totalXP,
        level: user.level,
        identity: user.identity,
        history: user.history // Include history in cache to prevent data loss
      };
      storage.set(cachedUserKey, cacheData, authUser.uid);
      console.log('💾 Auto-saved to cache (useEffect):', { 
        historyDays: cacheData.history?.length || 0, 
        totalXP: cacheData.totalXP 
      });
    }
  }, [user, authUser]);

  const levelProgress = getLevelProgress(user.totalXP, user.level);

  const applyGlobalXPChange = useCallback((
    amount: number, 
    historyId: string, 
    popups: Record<string, number>, 
    skillCategory?: SkillCategory, 
    skillAmount?: number
  ) => {
    setUser(prev => {
      const newTotalXP = Math.max(0, prev.totalXP + amount);
      const newLevel = calculateLevel(newTotalXP);
      
      if (amount > 0 && newLevel > prev.level) {
        setShowLevelUp({ show: true, level: newLevel });
        gameToast.levelUp(newLevel);
        setTimeout(() => setShowLevelUp(null), 3000);
      }

      let newSkills = prev.skills;
      if (skillCategory && skillCategory !== SkillCategory.MISC) {
        const amountToGrant = skillAmount !== undefined ? skillAmount : amount;
        const skill = prev.skills[skillCategory];
        const newSkillXP = Math.max(0, skill.xp + amountToGrant);
        newSkills = {
          ...prev.skills,
          [skillCategory]: {
            ...skill,
            xp: newSkillXP,
            level: calculateLevel(newSkillXP)
          }
        };
      }

      // Use history service to add new entry and manage archiving
      const newEntry = { date: new Date().toISOString(), xpGained: amount, taskId: historyId };
      const { activeHistory, archivedData } = addHistoryEntry(prev.history, newEntry);
      
      // Store archived data if any exists (for now in localStorage, later in Firebase)
      if (archivedData) {
        const existingArchives = storage.get<ArchivedHistory[]>(STORAGE_KEYS.ARCHIVED_HISTORY, [], authUser?.uid || null);
        persistenceService.set(STORAGE_KEYS.ARCHIVED_HISTORY, [...existingArchives, archivedData], authUser?.uid || null);
      }

      // Save to Firestore if authenticated
      if (authUser?.uid) {
        console.log('💾 Saving XP change for user:', authUser.uid, { newXP: newTotalXP, newLevel });
        // Convert skills to Firestore format
        const firestoreSkills = Object.fromEntries(
          Object.entries(newSkills).map(([key, value]) => [key, { xp: value.xp, level: value.level }])
        ) as Record<SkillCategory, { xp: number; level: number }>;

        updateUserProfile(authUser.uid, {
          totalXP: newTotalXP,
          level: newLevel,
          skills: firestoreSkills
        }).catch((error) => {
          console.error('❌ Failed to save user profile:', error);
          console.error('   User ID:', authUser?.uid);
          console.error('   Error details:', error);
        });

        // Save the history entry
        const dateKey = new Date().toISOString().split('T')[0];
        const historyEntry = activeHistory.find(h => h.date === dateKey);
        if (historyEntry) {
          console.log('💾 Saving history entry for date:', dateKey);
          saveHistoryEntry(authUser.uid, historyEntry).catch((error) => {
            console.error('❌ Failed to save history entry to Firestore:', error);
            console.error('   User ID:', authUser?.uid);
            console.error('   Date:', dateKey);
            console.error('   Entry:', historyEntry);
            console.error('   Error details:', error);
          });
        }
      } else {
        console.warn('⚠️ Cannot save XP change - user not authenticated');
        console.warn('   authUser:', authUser);
      }

      return {
        ...prev,
        totalXP: newTotalXP,
        level: newLevel,
        skills: newSkills,
        history: activeHistory
      };
    });

    // Show toast notification for XP changes
    if (amount > 0) {
      const category = skillCategory && skillCategory !== SkillCategory.MISC ? skillCategory : undefined;
      gameToast.xp(amount, category ? `${category} skill boost` : undefined);
    }

    setXpPopups((prev: Record<string, number>) => ({ ...prev, ...popups }));
    setFlashKey((k: number) => k + 1);
    const popupKeys = Object.keys(popups);
    setTimeout(() => setXpPopups((p: Record<string, number>) => { 
      const n = { ...p }; 
      popupKeys.forEach((k: string) => delete n[k]); 
      return n; 
    }), 1500);
  }, [authUser]);

  const updateIdentity = useCallback((identity: string) => {
    setUser(prev => ({ ...prev, identity }));
    
    // Save to Firestore if authenticated
    if (authUser) {
      updateUserIdentity(authUser.uid, identity).catch((error) => {
        console.error('Failed to update user identity in Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    }
  }, [authUser]);

  const updateNickname = useCallback((nickname: string) => {
    setUser(prev => ({ ...prev, nickname }));
    
    // Save to Firestore if authenticated
    if (authUser) {
      updateUserNickname(authUser.uid, nickname).catch((error) => {
        console.error('Failed to update user nickname in Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    }
  }, [authUser]);

  const addGoal = useCallback((title: string) => {
    const newGoal: Goal = { id: crypto.randomUUID(), title, completed: false };
    
    if (authUser) {
      // Save to Firestore subcollection
      saveGoal(authUser.uid, newGoal).catch((error) => {
        console.error('Failed to save goal to Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    } else {
      // Update local state for non-authenticated users
      setGoals(prev => [newGoal, ...prev]);
    }
  }, [authUser]);

  const toggleGoal = useCallback((id: string) => {
    if (authUser) {
      // Update in Firestore subcollection
      const goal = goals.find(g => g.id === id);
      if (goal) {
        updateGoalData(authUser.uid, id, { completed: !goal.completed }).catch((error) => {
          console.error('Failed to update goal in Firestore:', error);
          // Note: UI is already updated optimistically. Consider adding toast notification for failures.
        });
      }
    } else {
      // Update local state for non-authenticated users
      setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
    }
  }, [authUser, goals]);

  const deleteGoal = useCallback((id: string) => {
    if (authUser) {
      // Delete from Firestore subcollection
      deleteGoalData(authUser.uid, id).catch((error) => {
        console.error('Failed to delete goal from Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    } else {
      // Update local state for non-authenticated users
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  }, [authUser]);

  const updateLayout = useCallback((layout: ProfileLayout) => {
    setUser(prev => ({ ...prev, layout }));
    
    // Save to Firestore if authenticated
    if (authUser) {
      updateUserLayout(authUser.uid, layout).catch((error) => {
        console.error('Failed to update user layout in Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    }
  }, [authUser]);

  const saveTemplateFunc = useCallback((template: TaskTemplate) => {
    if (authUser) {
      // Save to Firestore subcollection
      saveTemplate(authUser.uid, template).catch(console.error);
    } else {
      // Update local state for non-authenticated users
      setTemplates(prev => [template, ...prev]);
    }
  }, [authUser]);

  const deleteTemplate = useCallback((id: string) => {
    if (authUser) {
      // Delete from Firestore subcollection
      deleteTemplateData(authUser.uid, id).catch((error) => {
        console.error('Failed to delete template from Firestore:', error);
        // Note: UI is already updated optimistically. Consider adding toast notification for failures.
      });
    } else {
      // Update local state for non-authenticated users
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  }, [authUser]);

  // Merge goals and templates into user object for components that expect it
  const userWithSubcollections = {
    ...user,
    goals,
    templates,
  };

  return {
    user: userWithSubcollections,
    setUser,
    levelProgress,
    applyGlobalXPChange,
    updateIdentity,
    updateNickname,
    addGoal,
    toggleGoal,
    deleteGoal,
    updateLayout,
    saveTemplate: saveTemplateFunc,
    deleteTemplate,
    showLevelUp,
    setShowLevelUp,
    xpPopups,
    flashKey,
    isLoading,
  };
};
