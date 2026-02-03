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
  updateUserGoals, 
  updateUserTemplates, 
  updateUserLayout,
  updateUserIdentity,
  saveHistoryEntry,
  getHistory,
  migrateLocalStorageToFirestore,
  getTasks,
  getQuests
} from '../services/firestoreDataService';
import { getUserDocument } from '../services/firestoreUserService';

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
    totalXP: 0, 
    level: 0, 
    skills, 
    history: [], 
    identity: '', 
    goals: [], 
    templates: [], 
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
      try {
        // Get user document from Firestore
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

          const userProfile: UserProfile = {
            name: firestoreUser.name,
            totalXP: firestoreUser.totalXP,
            level: firestoreUser.level,
            skills: firestoreSkills,
            history: history,
            identity: firestoreUser.identity || '',
            goals: firestoreUser.goals || [],
            templates: firestoreUser.templates || [],
            layout: firestoreUser.layout || DEFAULT_LAYOUT
          };

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
            isSyncingRef.current = false;
            
            console.log('✅ Migration complete! All data synced to cloud.');
          } else {
            isSyncingRef.current = true;
            setUser(userProfile);
            isSyncingRef.current = false;
          }
        }
        
        initialLoadCompleteRef.current = true;
      } catch (error) {
        console.error('Failed to load user data from Firestore:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [authUser]);

  // Save to localStorage when not authenticated (fallback)
  useEffect(() => { 
    if (isSyncingRef.current) return;
    
    if (!authUser) {
      persistenceService.set(STORAGE_KEYS.USER, user, null); 
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
      if (authUser) {
        // Convert skills to Firestore format
        const firestoreSkills = Object.fromEntries(
          Object.entries(newSkills).map(([key, value]) => [key, { xp: value.xp, level: value.level }])
        ) as Record<SkillCategory, { xp: number; level: number }>;

        updateUserProfile(authUser.uid, {
          totalXP: newTotalXP,
          level: newLevel,
          skills: firestoreSkills
        }).catch(console.error);

        // Save the history entry
        const dateKey = new Date().toISOString().split('T')[0];
        const historyEntry = activeHistory.find(h => h.date === dateKey);
        if (historyEntry) {
          saveHistoryEntry(authUser.uid, historyEntry).catch(console.error);
        }
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
      updateUserIdentity(authUser.uid, identity).catch(console.error);
    }
  }, [authUser]);

  const addGoal = useCallback((title: string) => {
    setUser(prev => {
      const newGoals = [{ id: crypto.randomUUID(), title, completed: false }, ...prev.goals];
      
      // Save to Firestore if authenticated
      if (authUser) {
        updateUserGoals(authUser.uid, newGoals).catch(console.error);
      }
      
      return { ...prev, goals: newGoals };
    });
  }, [authUser]);

  const toggleGoal = useCallback((id: string) => {
    setUser(prev => {
      const newGoals = prev.goals.map((g: Goal) => g.id === id ? { ...g, completed: !g.completed } : g);
      
      // Save to Firestore if authenticated
      if (authUser) {
        updateUserGoals(authUser.uid, newGoals).catch(console.error);
      }
      
      return { ...prev, goals: newGoals };
    });
  }, [authUser]);

  const deleteGoal = useCallback((id: string) => {
    setUser(prev => {
      const newGoals = prev.goals.filter((g: Goal) => g.id !== id);
      
      // Save to Firestore if authenticated
      if (authUser) {
        updateUserGoals(authUser.uid, newGoals).catch(console.error);
      }
      
      return { ...prev, goals: newGoals };
    });
  }, [authUser]);

  const updateLayout = useCallback((layout: ProfileLayout) => {
    setUser(prev => ({ ...prev, layout }));
    
    // Save to Firestore if authenticated
    if (authUser) {
      updateUserLayout(authUser.uid, layout).catch(console.error);
    }
  }, [authUser]);

  const saveTemplate = useCallback((template: TaskTemplate) => {
    setUser(prev => {
      const newTemplates = [template, ...prev.templates];
      
      // Save to Firestore if authenticated
      if (authUser) {
        updateUserTemplates(authUser.uid, newTemplates).catch(console.error);
      }
      
      return { ...prev, templates: newTemplates };
    });
  }, [authUser]);

  const deleteTemplate = useCallback((id: string) => {
    setUser(prev => {
      const newTemplates = prev.templates.filter((t: TaskTemplate) => t.id !== id);
      
      // Save to Firestore if authenticated
      if (authUser) {
        updateUserTemplates(authUser.uid, newTemplates).catch(console.error);
      }
      
      return { ...prev, templates: newTemplates };
    });
  }, [authUser]);

  return {
    user,
    setUser,
    levelProgress,
    applyGlobalXPChange,
    updateIdentity,
    addGoal,
    toggleGoal,
    deleteGoal,
    updateLayout,
    saveTemplate,
    deleteTemplate,
    showLevelUp,
    setShowLevelUp,
    xpPopups,
    flashKey,
    isLoading,
  };
};
