
import { Difficulty, SkillCategory } from './types';

export const BASE_XP = 10;

export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  [Difficulty.EASY]: 1.0,
  [Difficulty.MEDIUM]: 1.5,
  [Difficulty.HARD]: 2.0,
  [Difficulty.EPIC]: 3.0,
};

// Skill Colors for UI
export const SKILL_COLORS: Record<SkillCategory, string> = {
  [SkillCategory.PHYSICAL]: '#ef4444',    // Red
  [SkillCategory.MENTAL]: '#3b82f6',      // Blue
  [SkillCategory.PROFESSIONAL]: '#f59e0b', // Amber
  [SkillCategory.SOCIAL]: '#10b981',      // Emerald
  [SkillCategory.CREATIVE]: '#8b5cf6',    // Violet
  [SkillCategory.MISC]: '#71717a',        // Zinc/Gray
};

// Leveling Curve Constant
// XP = CONST * (Level ^ EXP)
export const LEVEL_CONSTANT = 100;
export const LEVEL_EXPONENT = 1.5;
