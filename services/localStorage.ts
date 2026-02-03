/**
 * Safe localStorage service with error handling
 * Prevents crashes from localStorage failures (quota exceeded, privacy mode, etc.)
 * 
 * Keys are scoped by user ID to prevent data leakage between users on same browser.
 * Anonymous users get a generated session ID.
 */

import { DEBUG_FLAGS } from '../config/debugFlags';

// Key for storing anonymous session ID (not scoped)
const ANON_SESSION_KEY = 'lvlup_anon_session';

export const STORAGE_KEYS = {
  USER: 'xpeak_user',
  TASKS: 'xpeak_tasks',
  QUESTS: 'xpeak_quests',
  EXPANDED_NODES: 'xpeak_expanded_nodes',
  ARCHIVED_HISTORY: 'xpeak_archived_history',
} as const;

class StorageService {
  /**
   * Get or generate anonymous session ID for users who aren't logged in.
   * This ensures different anonymous users on the same browser don't share data.
   */
  private getAnonymousSessionId(): string {
    try {
      let sessionId = localStorage.getItem(ANON_SESSION_KEY);
      if (!sessionId) {
        sessionId = 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem(ANON_SESSION_KEY, sessionId);
      }
      return sessionId;
    } catch {
      // Fallback if localStorage fails
      return 'anon_fallback';
    }
  }

  /**
   * Get the scoped key for a given base key and uid.
   * If uid is provided, uses that. Otherwise uses anonymous session ID.
   */
  getScopedKey(baseKey: string, uid?: string | null): string {
    const scopeId = uid || this.getAnonymousSessionId();
    return `${baseKey}_${scopeId}`;
  }

  /**
   * Safely get item from localStorage with fallback.
   * @param key - Base storage key
   * @param defaultValue - Default value if key not found
   * @param uid - Optional user ID for scoping (uses anonymous session if not provided)
   */
  get<T>(key: string, defaultValue: T, uid?: string | null): T {
    try {
      const scopedKey = this.getScopedKey(key, uid);
      const item = localStorage.getItem(scopedKey);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      if (DEBUG_FLAGS.storage) console.error(`Error reading "${key}" from localStorage:`, error);
      return defaultValue;
    }
  }

  /**
   * Safely set item in localStorage.
   * Returns true if successful, false otherwise.
   * @param key - Base storage key
   * @param value - Value to store
   * @param uid - Optional user ID for scoping (uses anonymous session if not provided)
   */
  set<T>(key: string, value: T, uid?: string | null): boolean {
    try {
      const scopedKey = this.getScopedKey(key, uid);
      const serialized = JSON.stringify(value);
      localStorage.setItem(scopedKey, serialized);
      return true;
    } catch (error) {
      if (DEBUG_FLAGS.storage) console.error(`Error writing "${key}" to localStorage:`, error);
      
      // Check if quota exceeded
      if (error instanceof DOMException && (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        if (DEBUG_FLAGS.storage) console.warn('localStorage quota exceeded. Consider cleaning up old data.');
      }
      
      return false;
    }
  }

  /**
   * Safely remove item from localStorage.
   * @param key - Base storage key
   * @param uid - Optional user ID for scoping (uses anonymous session if not provided)
   */
  remove(key: string, uid?: string | null): boolean {
    try {
      const scopedKey = this.getScopedKey(key, uid);
      localStorage.removeItem(scopedKey);
      return true;
    } catch (error) {
      if (DEBUG_FLAGS.storage) console.error(`Error removing "${key}" from localStorage:`, error);
      return false;
    }
  }

  /**
   * Clear all app-related localStorage items for a specific user/session.
   * @param uid - Optional user ID (uses anonymous session if not provided)
   */
  clearAll(uid?: string | null): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        const scopedKey = this.getScopedKey(key, uid);
        localStorage.removeItem(scopedKey);
      });
      return true;
    } catch (error) {
      if (DEBUG_FLAGS.storage) console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Clear anonymous session and generate a new one.
   * Call this on logout to ensure next anonymous user gets fresh data.
   */
  resetAnonymousSession(): void {
    try {
      // First clear data for the current anonymous session
      const currentSessionId = localStorage.getItem(ANON_SESSION_KEY);
      if (currentSessionId) {
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(`${key}_${currentSessionId}`);
        });
      }
      // Remove the session ID so a new one will be generated
      localStorage.removeItem(ANON_SESSION_KEY);
    } catch (error) {
      if (DEBUG_FLAGS.storage) console.error('Error resetting anonymous session:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new StorageService();
