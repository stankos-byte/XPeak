/**
 * Safe localStorage service with error handling
 * Prevents crashes from localStorage failures (quota exceeded, privacy mode, etc.)
 */

export const STORAGE_KEYS = {
  USER: 'lvlup_user',
  TASKS: 'lvlup_tasks',
  QUESTS: 'lvlup_quests',
  EXPANDED_NODES: 'lvlup_expanded_nodes',
} as const;

class StorageService {
  /**
   * Safely get item from localStorage with fallback
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading "${key}" from localStorage:`, error);
      return defaultValue;
    }
  }

  /**
   * Safely set item in localStorage
   * Returns true if successful, false otherwise
   */
  set<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error writing "${key}" to localStorage:`, error);
      
      // Check if quota exceeded
      if (error instanceof DOMException && (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        console.warn('localStorage quota exceeded. Consider cleaning up old data.');
      }
      
      return false;
    }
  }

  /**
   * Safely remove item from localStorage
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing "${key}" from localStorage:`, error);
      return false;
    }
  }

  /**
   * Clear all app-related localStorage items
   */
  clearAll(): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
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
