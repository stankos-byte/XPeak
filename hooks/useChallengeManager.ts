import { useState, useCallback, useEffect } from 'react';
import { Friend, FriendChallenge, ChallengeQuestCategory, ChallengeQuestTask, ChallengeModeType, UserProfile, SkillCategory } from '../types';
import { calculateXP, calculateLevel, calculateChallengeXP } from '../utils/gamification';
import { socialService, INITIAL_OPERATIVES, INITIAL_CONTRACTS } from '../services/socialService';
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
  // Initialize with cached data or fallback to mock data
  const [challenges, setChallenges] = useState<FriendChallenge[]>(() => {
    const cached = socialService.getContracts();
    return cached.length > 0 ? cached : INITIAL_CONTRACTS;
  });
  const [friends, setFriends] = useState<Friend[]>(() => {
    const cached = socialService.getOperatives();
    return cached.length > 0 ? cached : INITIAL_OPERATIVES;
  });
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<FriendChallenge | null>(null);

  // Initialize service and subscribe to real-time updates
  useEffect(() => {
    let isMounted = true;

    // Initialize service (loads from cache or fetches)
    socialService.initialize().then(({ operatives, contracts }) => {
      if (isMounted) {
        setFriends(operatives);
        setChallenges(contracts);
      }
    }).catch((error) => {
      if (DEBUG_FLAGS.challenges) console.error(error);
    });

    // Subscribe to operatives updates (ready for Firestore onSnapshot)
    const unsubscribeOperatives = socialService.onOperativesChange((operatives) => {
      if (isMounted) {
        setFriends(operatives);
      }
    });

    // Subscribe to contracts updates (ready for Firestore onSnapshot)
    const unsubscribeContracts = socialService.onContractsChange((contracts) => {
      if (isMounted) {
        setChallenges(contracts);
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      isMounted = false;
      unsubscribeOperatives();
      unsubscribeContracts();
    };
  }, []);

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
      
    // Update service with new challenges state
    socialService.updateContracts(updated);
    return updated;
    });
  }, []);

  const handleCreateChallenge = useCallback((data: { title: string; description: string; partnerIds: string[]; categories: ChallengeQuestCategory[]; mode: ChallengeModeType }) => {
    if (editingChallenge) {
      // Update existing challenge
      setChallenges((prev: FriendChallenge[]) => {
        const updated = prev.map((c: FriendChallenge) => c.id === editingChallenge.id ? {
          ...c,
          title: data.title,
          description: data.description || '',
          partnerIds: data.partnerIds,
          mode: data.mode || 'competitive',
          categories: data.categories || []
        } : c);
        socialService.updateContracts(updated);
        return updated;
      });
      setEditingChallenge(null);
    } else {
      // Create new challenge
      const newChallenge: FriendChallenge = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description || '',
        partnerIds: data.partnerIds,
        mode: data.mode || 'competitive',
        categories: data.categories || [],
        timeLeft: '7d' // Default duration
      };
      setChallenges((prev: FriendChallenge[]) => {
        const updated = [...prev, newChallenge];
        socialService.updateContracts(updated);
        return updated;
      });
    }
  }, [editingChallenge]);

  const handleEditChallenge = useCallback((challenge: FriendChallenge) => {
    setEditingChallenge(challenge);
    setIsChallengeModalOpen(true);
  }, []);

  const handleDeleteChallenge = useCallback((id: string) => {
    setChallenges((prev: FriendChallenge[]) => {
      const updated = prev.filter((c: FriendChallenge) => c.id !== id);
      socialService.updateContracts(updated);
      return updated;
    });
  }, []);

  const handleAiCreateChallenge = useCallback((challenge: Partial<FriendChallenge>) => {
    setChallenges((prev: FriendChallenge[]) => {
      const updated = [...prev, {
        id: crypto.randomUUID(),
        title: challenge.title || 'New Challenge',
        description: challenge.description || 'Defeat your opponent.',
        partnerIds: challenge.partnerIds || ['1'],
        mode: challenge.mode || 'competitive',
        categories: challenge.categories || [],
        timeLeft: '7d'
      }];
      socialService.updateContracts(updated);
      return updated;
    });
  }, []);

  return {
    challenges,
    setChallenges: (value: React.SetStateAction<FriendChallenge[]>) => {
      setChallenges((prev) => {
        const updated = typeof value === 'function' ? value(prev) : value;
        socialService.updateContracts(updated);
        return updated;
      });
    },
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
