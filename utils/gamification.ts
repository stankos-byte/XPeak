import { Task, XPResult, Difficulty } from '../types';
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
