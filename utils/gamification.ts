import { Task, XPResult, Difficulty, FriendChallenge, ChallengeQuestTask, QuestCategory, MainQuest, QuestTask } from '../types';
import { BASE_XP, DIFFICULTY_MULTIPLIERS } from '../constants';

/**
 * Returns the XP required to complete the given level and reach the next one.
 * Based on user-provided tiered thresholds.
 */
export const getXPRequirement = (level: number): number => {
  if (level < 1) return 50; // 0 -> 1 takes 50xp
  if (level < 5) return 100;
  if (level < 10) return 200;
  if (level < 15) return 350;
  if (level < 20) return 600;
  if (level < 30) return 900;
  if (level < 40) return 1300;
  if (level < 50) return 2000;
  if (level < 60) return 2500;
  return 3000;
};

/**
 * Calculates total cumulative XP required to reach a specific target level.
 */
export const xpForLevel = (targetLevel: number): number => {
  let total = 0;
  // Accumulate XP required for all levels below targetLevel
  for (let i = 0; i < targetLevel; i++) {
    total += getXPRequirement(i);
  }
  return total;
};

/**
 * Calculates current level based on total XP by iterating through tiered thresholds.
 */
export const calculateLevel = (totalXP: number): number => {
  let level = 0;
  // While total XP is enough to have finished the current level and reached the next
  while (totalXP >= xpForLevel(level + 1)) {
    level++;
    if (level > 1000) break; // Safety cap
  }
  return level;
};

/**
 * Calculates XP for a completed task.
 * Returns fixed values: Easy=10, Medium=15, Hard=20, Epic=30.
 */
export const calculateXP = (task: Task): XPResult => {
  const base = BASE_XP;
  const diffMult = DIFFICULTY_MULTIPLIERS[task.difficulty];
  
  // Requirement: Easy=10, Medium=15, Hard=20, Epic=30
  const total = Math.floor(base * diffMult);

  return {
    total,
    breakdown: {
      base,
      difficultyMult: diffMult,
      streakMult: 1,
      bonus: 0
    }
  };
};

/**
 * Calculates progress within the current level.
 */
export const getLevelProgress = (totalXP: number, currentLevel: number) => {
  const currentLevelBaseXP = xpForLevel(currentLevel);
  const nextLevelThresholdXP = getXPRequirement(currentLevel);
  
  const xpIntoLevel = totalXP - currentLevelBaseXP;
  const progressPercentage = Math.min(100, Math.max(0, (xpIntoLevel / nextLevelThresholdXP) * 100));
  
  return {
    current: Math.max(0, xpIntoLevel),
    max: nextLevelThresholdXP,
    percentage: progressPercentage
  };
};

/**
 * Calculates XP for a single challenge task based on difficulty.
 * Easy=10, Medium=15, Hard=20, Epic=30
 */
const getTaskXP = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case Difficulty.EASY:
      return 10;
    case Difficulty.MEDIUM:
      return 15;
    case Difficulty.HARD:
      return 20;
    case Difficulty.EPIC:
      return 30;
    default:
      return 10;
  }
};

/**
 * Calculates completion bonus based on total task count.
 * 0-5 tasks: +35 XP
 * 6-10 tasks: +75 XP
 * 11+ tasks: +110 XP
 */
const getCompletionBonus = (taskCount: number): number => {
  if (taskCount <= 5) return 35;
  if (taskCount <= 10) return 75;
  return 110;
};

/**
 * Calculates total XP for a competitive challenge (winner-takes-all).
 * Sum of all task XP + completion bonus based on task count.
 */
export const calculateCompetitiveXP = (challenge: FriendChallenge): number => {
  // Sum all task XP
  let totalTaskXP = 0;
  let totalTasks = 0;
  
  challenge.categories.forEach(category => {
    category.tasks.forEach(task => {
      totalTaskXP += getTaskXP(task.difficulty);
      totalTasks++;
    });
  });
  
  // Add completion bonus for competitive mode
  const completionBonus = getCompletionBonus(totalTasks);
  
  return totalTaskXP + completionBonus;
};

/**
 * Calculates total XP for a co-op mission (no bonus).
 * Sum of all task XP only.
 */
export const calculateCoopXP = (challenge: FriendChallenge): number => {
  let totalTaskXP = 0;
  
  challenge.categories.forEach(category => {
    category.tasks.forEach(task => {
      totalTaskXP += getTaskXP(task.difficulty);
    });
  });
  
  return totalTaskXP; // No completion bonus for co-op
};

/**
 * Calculates total XP for any challenge based on its mode.
 */
export const calculateChallengeXP = (challenge: FriendChallenge): number => {
  if (challenge.mode === 'coop') {
    return calculateCoopXP(challenge);
  }
  return calculateCompetitiveXP(challenge);
};

/**
 * Gets skill XP breakdown for a specific user in a co-op mission.
 * Only counts XP from tasks they personally completed.
 */
export const calculateUserSkillXP = (
  challenge: FriendChallenge,
  userId: string
): Record<string, number> => {
  const skillXP: Record<string, number> = {};
  
  challenge.categories.forEach(category => {
    category.tasks.forEach(task => {
      // Only count tasks completed by this user
      if (task.completedBy === userId && task.status === 'completed') {
        const xp = getTaskXP(task.difficulty);
        const category = task.skillCategory;
        skillXP[category] = (skillXP[category] || 0) + xp;
      }
    });
  });
  
  return skillXP;
};

/**
 * Checks if a quest category is complete (all tasks completed)
 */
export const isCategoryComplete = (category: QuestCategory): boolean => 
  category.tasks.length > 0 && category.tasks.every(t => t.status === 'completed');

/**
 * Checks if a quest is complete (all categories complete)
 */
export const isQuestComplete = (quest: MainQuest): boolean => 
  quest.categories.length > 0 && quest.categories.every(cat => isCategoryComplete(cat));

/**
 * Gets quest bonus amount based on category count
 */
export const getQuestBonusAmount = (categoryCount: number): number => {
  if (categoryCount < 1) return 0;
  if (categoryCount < 3) return 80;
  if (categoryCount <= 5) return 120;
  return 180;
};
