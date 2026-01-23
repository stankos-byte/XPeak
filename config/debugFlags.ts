/**
 * Debug Flags Configuration
 * 
 * Centralized control for console logging across different features.
 * Set flags to true to enable logging for specific features, false to disable.
 * 
 * Usage:
 *   import { DEBUG_FLAGS } from '../config/debugFlags';
 *   if (DEBUG_FLAGS.tasks) console.log('Task Created:', data);
 */

export const DEBUG_FLAGS = {
  // Authentication & User Management
  auth: false,
  
  // Task Management
  tasks: false,
  
  // AI/Oracle Features (Quest Oracle, Smart Audit, AI Assistant)
  oracle: false,
  
  // Challenge Management
  challenges: false,
  
  // Quest Management
  quests: false,
  
  // Social Features (Friends, Notifications)
  social: false,
  
  // Storage Operations (localStorage, persistence)
  storage: false,
  
  // Timer Features
  timer: false,
  
  // General Errors & Validation
  errors: false,
} as const;
