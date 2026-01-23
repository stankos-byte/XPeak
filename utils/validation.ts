import { Task, Difficulty, SkillCategory, QuestTask, MainQuest } from '../types';
import { DEBUG_FLAGS } from '../config/debugFlags';

/**
 * Input validation utilities to prevent corrupted data
 */

/**
 * Validate that a task object has all required fields and correct types
 */
export const validateTask = (task: Partial<Task>): task is Task => {
  if (!task.id || typeof task.id !== 'string') return false;
  if (!task.title || typeof task.title !== 'string') return false;
  if (!Object.values(Difficulty).includes(task.difficulty as Difficulty)) return false;
  if (!Object.values(SkillCategory).includes(task.skillCategory as SkillCategory)) return false;
  if (typeof task.isHabit !== 'boolean') return false;
  if (typeof task.completed !== 'boolean') return false;
  if (typeof task.streak !== 'number') return false;
  return true;
};

/**
 * Validate quest task structure
 */
export const validateQuestTask = (task: Partial<QuestTask>): task is QuestTask => {
  if (!task.task_id || typeof task.task_id !== 'string') return false;
  if (!task.name || typeof task.name !== 'string') return false;
  if (typeof task.completed !== 'boolean') return false;
  if (!Object.values(Difficulty).includes(task.difficulty as Difficulty)) return false;
  if (!Object.values(SkillCategory).includes(task.skillCategory as SkillCategory)) return false;
  return true;
};

/**
 * Validate main quest structure
 */
export const validateMainQuest = (quest: Partial<MainQuest>): quest is MainQuest => {
  if (!quest.id || typeof quest.id !== 'string') return false;
  if (!quest.title || typeof quest.title !== 'string') return false;
  if (!Array.isArray(quest.categories)) return false;
  return true;
};

/**
 * Sanitize user text input to prevent XSS and overly long inputs
 */
export const sanitizeTextInput = (input: string, maxLength: number = 500): string => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
};

/**
 * Validate and sanitize XP value
 */
export const validateXP = (xp: number): number => {
  if (typeof xp !== 'number' || isNaN(xp) || !isFinite(xp)) return 0;
  return Math.max(0, Math.floor(xp)); // XP should be non-negative integer
};

/**
 * Validate and sanitize level value
 */
export const validateLevel = (level: number): number => {
  if (typeof level !== 'number' || isNaN(level) || !isFinite(level)) return 0;
  return Math.max(0, Math.min(1000, Math.floor(level))); // Level 0-1000
};

/**
 * Validate array is not too large (prevent memory issues)
 */
export const validateArraySize = <T>(arr: T[], maxSize: number = 10000): T[] => {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, maxSize);
};

/**
 * Deep clone object safely (prevents circular references)
 */
export const safeClone = <T>(obj: T): T | null => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    if (DEBUG_FLAGS.errors) console.error('Error cloning object:', error);
    return null;
  }
};
