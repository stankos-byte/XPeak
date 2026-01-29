import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile, SkillCategory, Goal, ProfileLayout, TaskTemplate } from '../types';
import { calculateLevel, getLevelProgress } from '../utils/gamification';
import { auth } from '../config/firebase';
import { getUser, setUser as saveUserToFirestore, subscribeToUser, setHistoryEntry } from '../services/firestoreService';
import { gameToast } from '../components/ui/GameToast';
import { addHistoryEntry, processHistory, HistoryEntry } from '../services/historyService';

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
}

export const useUserManager = (): UseUserManagerReturn => {
  const [user, setUserState] = useState<UserProfile>(getDefaultUser);
  const [xpPopups, setXpPopups] = useState<Record<string, number>>({});
  const [flashKey, setFlashKey] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState<{ show: boolean; level: number } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user from Firestore on mount and auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Try to get user from Firestore
          const firestoreUser = await getUser(firebaseUser.uid);
          
          if (firestoreUser) {
            // Ensure all default widgets exist
            const existingIds = new Set(firestoreUser.layout?.widgets?.map((w) => w.id) || []);
            const newWidgets = DEFAULT_LAYOUT.widgets.filter(w => !existingIds.has(w.id));
            
            const layout = firestoreUser.layout ? {
                ...firestoreUser.layout,
                widgets: [...firestoreUser.layout.widgets, ...newWidgets]
            } : DEFAULT_LAYOUT;

            const { activeHistory } = processHistory(firestoreUser.history || []);
            
            setUserState({ ...firestoreUser, layout, history: activeHistory });
          } else {
            // User document doesn't exist, use default
            setUserState(getDefaultUser());
          }
        } catch (error) {
          console.error('Error loading user:', error);
          setUserState(getDefaultUser());
        }
      } else {
        // Not authenticated, use default user
        setUserState(getDefaultUser());
      }
      setIsInitialized(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to real-time user updates
  useEffect(() => {
    if (!isInitialized || !auth.currentUser) return;

    const unsubscribe = subscribeToUser((firestoreUser) => {
      if (firestoreUser) {
        // Ensure all default widgets exist
        const existingIds = new Set(firestoreUser.layout?.widgets?.map((w) => w.id) || []);
        const newWidgets = DEFAULT_LAYOUT.widgets.filter(w => !existingIds.has(w.id));
        
        const layout = firestoreUser.layout ? {
            ...firestoreUser.layout,
            widgets: [...firestoreUser.layout.widgets, ...newWidgets]
        } : DEFAULT_LAYOUT;

        setUserState({ ...firestoreUser, layout });
      }
    });

    return () => unsubscribe();
  }, [isInitialized]);

  // Save to Firestore when user changes (debounced with a small delay)
  useEffect(() => {
    if (!isInitialized || !auth.currentUser) return;

    const timeoutId = setTimeout(() => {
      saveUserToFirestore(user).catch((error) => {
        console.error('Error saving user to Firestore:', error);
      });
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [user, isInitialized]);

  // Wrapper to update both local state and Firestore
  const setUser = useCallback((newUser: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setUserState((prev) => {
      return typeof newUser === 'function' ? newUser(prev) : newUser;
    });
  }, []);

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
      const { activeHistory } = addHistoryEntry(prev.history, newEntry);
      
      // Save history entry to Firestore
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = activeHistory.find(h => h.date === today);
      if (todayEntry) {
        setHistoryEntry(todayEntry).catch((error) => {
          console.error('Error saving history entry:', error);
        });
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
  }, []);

  const updateIdentity = useCallback((identity: string) => {
    setUser(prev => ({ ...prev, identity }));
  }, []);

  const addGoal = useCallback((title: string) => {
    setUser(prev => ({ 
      ...prev, 
      goals: [{ id: crypto.randomUUID(), title, completed: false }, ...prev.goals] 
    }));
  }, []);

  const toggleGoal = useCallback((id: string) => {
    setUser(prev => ({ 
      ...prev, 
      goals: prev.goals.map((g: Goal) => g.id === id ? { ...g, completed: !g.completed } : g) 
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setUser(prev => ({ 
      ...prev, 
      goals: prev.goals.filter((g: Goal) => g.id !== id) 
    }));
  }, []);

  const updateLayout = useCallback((layout: ProfileLayout) => {
    setUser(prev => ({ ...prev, layout }));
  }, []);

  const saveTemplate = useCallback((template: TaskTemplate) => {
    setUser(prev => ({
      ...prev,
      templates: [template, ...prev.templates]
    }));
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setUser(prev => ({
      ...prev,
      templates: prev.templates.filter((t: TaskTemplate) => t.id !== id)
    }));
  }, []);

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
  };
};
