import { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Friend, FriendChallenge, ChallengeQuestCategory, ChallengeQuestTask, ChallengeModeType, UserProfile, SkillCategory } from '../types';
import { calculateXP, calculateLevel, calculateChallengeXP } from '../utils/gamification';
import { auth } from '../config/firebase';
import { getUserChallenges, createChallenge, updateChallenge, deleteChallenge, subscribeToChallenges, subscribeToFriends } from '../services/firestoreService';
import { DEBUG_FLAGS } from '../config/debugFlags';

interface UseChallengeManagerReturn {
  challenges: FriendChallenge[];
  setChallenges: React.Dispatch<React.SetStateAction<FriendChallenge[]>>;
  friends: Friend[];
  isChallengeModalOpen: boolean;
  setIsChallengeModalOpen: (open: boolean) => void;
  challengeToDelete: string | null;
  setChallengeToDelete: (id: string | null) => void;
  editingChallenge: FriendChallenge | null;
  setEditingChallenge: (challenge: FriendChallenge | null) => void;
  handleToggleChallengeTask: (challengeId: string, categoryId: string, taskId: string, user: UserProfile, setUser: React.Dispatch<React.SetStateAction<UserProfile>>, onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void) => void;
  handleCreateChallenge: (data: { title: string; description: string; partnerIds: string[]; categories: ChallengeQuestCategory[]; mode: ChallengeModeType }) => void;
  handleEditChallenge: (challenge: FriendChallenge) => void;
  handleDeleteChallenge: (id: string) => void;
  handleAiCreateChallenge: (challenge: Partial<FriendChallenge>) => void;
}

export const useChallengeManager = (
  onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void
): UseChallengeManagerReturn => {
  const [challenges, setChallenges] = useState<FriendChallenge[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<FriendChallenge | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize challenges and friends from Firestore on mount and auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const [firestoreChallenges, firestoreFriends] = await Promise.all([
            getUserChallenges(firebaseUser.uid),
            // Friends will be loaded via subscription
            Promise.resolve([])
          ]);
          setChallenges(firestoreChallenges);
        } catch (error) {
          if (DEBUG_FLAGS.challenges) console.error('Error loading challenges:', error);
          setChallenges([]);
        }
      } else {
        setChallenges([]);
        setFriends([]);
      }
      setIsInitialized(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to real-time challenge updates
  useEffect(() => {
    if (!isInitialized || !auth.currentUser) return;

    const unsubscribeChallenges = subscribeToChallenges((firestoreChallenges) => {
      setChallenges(firestoreChallenges);
    });

    const unsubscribeFriends = subscribeToFriends((firestoreFriends) => {
      setFriends(firestoreFriends);
    });

    return () => {
      unsubscribeChallenges();
      unsubscribeFriends();
    };
  }, [isInitialized]);

  const handleToggleChallengeTask = useCallback((
    challengeId: string, 
    categoryId: string, 
    taskId: string,
    user: UserProfile,
    setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
    onXPChange: (amount: number, historyId: string, popups: Record<string, number>, skillCategory?: SkillCategory, skillAmount?: number) => void
  ) => {
    setChallenges((prev: FriendChallenge[]) => {
      const updated = prev.map((challenge: FriendChallenge) => {
      if (challenge.id !== challengeId) return challenge;
      if (challenge.completedBy) return challenge; // Already completed, no changes

      const isCoop = challenge.mode === 'coop';

      // Toggle the task status based on mode
      const updatedCategories = challenge.categories.map((cat: ChallengeQuestCategory) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          tasks: cat.tasks.map((task: ChallengeQuestTask) => {
            if (task.task_id !== taskId) return task;
            
            if (isCoop) {
              // Co-op: toggle unified status and track who completed it
              const newStatus = task.status === 'completed' ? 'pending' : 'completed';
              return { 
                ...task, 
                status: newStatus,
                completedBy: newStatus === 'completed' ? user.name : undefined
              } as ChallengeQuestTask;
            } else {
              // Competitive: toggle myStatus only
              const newStatus = task.myStatus === 'completed' ? 'pending' : 'completed';
              return { ...task, myStatus: newStatus } as ChallengeQuestTask;
            }
          })
        };
      });

      const updatedChallenge = { ...challenge, categories: updatedCategories };

      // Check if all tasks are now completed
      const allTasksCompleted = isCoop
        ? updatedCategories.every((cat: ChallengeQuestCategory) => cat.tasks.every((task: ChallengeQuestTask) => task.status === 'completed'))
        : updatedCategories.every((cat: ChallengeQuestCategory) => cat.tasks.every((task: ChallengeQuestTask) => task.myStatus === 'completed'));

      // If all tasks completed, award XP and mark challenge as complete
      if (allTasksCompleted && !challenge.completedBy) {
        const challengeXP = calculateChallengeXP(updatedChallenge);
        
        if (isCoop) {
          // Co-op: Award total XP to user
          onXPChange(challengeXP, `challenge-${challengeId}`, { [`challenge-${challengeId}`]: challengeXP });
          
          // Award skill XP only for tasks completed by this user
          updatedCategories.forEach((cat: ChallengeQuestCategory) => {
            cat.tasks.forEach((task: ChallengeQuestTask) => {
              if (task.completedBy === user.name && task.status === 'completed') {
                const taskXP = calculateXP({ difficulty: task.difficulty } as any).total;
                const skill = user.skills[task.skillCategory];
                if (skill) {
                  const newSkillXP = skill.xp + taskXP;
                  setUser(prev => ({
                    ...prev,
                    skills: {
                      ...prev.skills,
                      [task.skillCategory]: {
                        ...skill,
                        xp: newSkillXP,
                        level: calculateLevel(newSkillXP)
                      }
                    }
                  }));
                }
              }
            });
          });
        } else {
          // Competitive: Award all XP (total + skill) to winner
          onXPChange(challengeXP, `challenge-${challengeId}`, { [`challenge-${challengeId}`]: challengeXP });
        }
        
        // Mark challenge as complete
        return {
          ...updatedChallenge,
          completedBy: user.name,
          completedAt: new Date().toISOString()
        };
      }

      return updatedChallenge;
    });
      
    // Save to Firestore
    if (auth.currentUser) {
      const challenge = updated.find(c => c.id === challengeId);
      if (challenge) {
        updateChallenge(challengeId, challenge).catch((error) => {
          console.error('Error updating challenge:', error);
        });
      }
    }
    
    return updated;
    });
  }, []);

  const handleCreateChallenge = useCallback(async (data: { title: string; description: string; partnerIds: string[]; categories: ChallengeQuestCategory[]; mode: ChallengeModeType }) => {
    if (!auth.currentUser) return;

    if (editingChallenge) {
      // Update existing challenge
      try {
        await updateChallenge(editingChallenge.id, {
          title: data.title,
          description: data.description || '',
          partnerIds: data.partnerIds,
          mode: data.mode || 'competitive',
          categories: data.categories || []
        });
        // Real-time listener will update challenges automatically
        setEditingChallenge(null);
      } catch (error) {
        console.error('Error updating challenge:', error);
      }
    } else {
      // Create new challenge
      try {
        await createChallenge({
          title: data.title,
          description: data.description || '',
          partnerIds: data.partnerIds,
          mode: data.mode || 'competitive',
          categories: data.categories || [],
          timeLeft: '7d'
        });
        // Real-time listener will update challenges automatically
      } catch (error) {
        console.error('Error creating challenge:', error);
      }
    }
  }, [editingChallenge]);

  const handleEditChallenge = useCallback((challenge: FriendChallenge) => {
    setEditingChallenge(challenge);
    setIsChallengeModalOpen(true);
  }, []);

  const handleDeleteChallenge = useCallback(async (id: string) => {
    if (!auth.currentUser) return;

    try {
      await deleteChallenge(id);
      // Real-time listener will update challenges automatically
    } catch (error) {
      console.error('Error deleting challenge:', error);
    }
  }, []);

  const handleAiCreateChallenge = useCallback(async (challenge: Partial<FriendChallenge>) => {
    if (!auth.currentUser) return;

    try {
      await createChallenge({
        title: challenge.title || 'New Challenge',
        description: challenge.description || 'Defeat your opponent.',
        partnerIds: challenge.partnerIds || [],
        mode: challenge.mode || 'competitive',
        categories: challenge.categories || [],
        timeLeft: '7d'
      });
      // Real-time listener will update challenges automatically
    } catch (error) {
      console.error('Error creating AI challenge:', error);
    }
  }, []);

  return {
    challenges,
    setChallenges,
    friends,
    isChallengeModalOpen,
    setIsChallengeModalOpen,
    challengeToDelete,
    setChallengeToDelete,
    editingChallenge,
    setEditingChallenge,
    handleToggleChallengeTask,
    handleCreateChallenge,
    handleEditChallenge,
    handleDeleteChallenge,
    handleAiCreateChallenge,
  };
};
