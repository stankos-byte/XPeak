/**
 * PersistenceService - Storage-agnostic service with debounced writes
 * 
 * This service debounces writes to prevent excessive storage operations.
 * Currently uses localStorage, but can be easily swapped to Firebase or other backends.
 * 
 * Usage:
 *   const persistence = new PersistenceService(localStorageAdapter);
 *   persistence.set('key', value); // Debounced - waits 1000ms after last change
 *   const value = persistence.get('key', defaultValue);
 */

export interface StorageAdapter {
  /**
   * Get a value from storage
   * @param key The storage key
   * @param defaultValue Value to return if key doesn't exist
   */
  get<T>(key: string, defaultValue: T): T;

  /**
   * Set a value in storage (synchronous)
   * @param key The storage key
   * @param value The value to store
   * @returns true if successful, false otherwise
   */
  set<T>(key: string, value: T): boolean | Promise<boolean>;
}

/**
 * localStorage adapter implementation
 */
export class LocalStorageAdapter implements StorageAdapter {
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
}

/**
 * PersistenceService with debounced writes
 * 
 * Waits 1000ms after the last change before writing to storage.
 * This prevents excessive writes during rapid state changes.
 */
export class PersistenceService {
  private adapter: StorageAdapter;
  private debounceDelay: number;
  private pendingWrites: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private pendingValues: Map<string, any> = new Map();

  constructor(adapter: StorageAdapter, debounceDelay: number = 1000) {
    this.adapter = adapter;
    this.debounceDelay = debounceDelay;
  }

  /**
   * Get a value from storage (synchronous, no debouncing)
   */
  get<T>(key: string, defaultValue: T): T {
    return this.adapter.get(key, defaultValue);
  }

  /**
   * Set a value in storage (debounced)
   * The write will be delayed by debounceDelay ms after the last call.
   */
  set<T>(key: string, value: T): void {
    // Store the latest value
    this.pendingValues.set(key, value);

    // Clear existing timeout for this key
    const existingTimeout = this.pendingWrites.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.flushKey(key);
    }, this.debounceDelay);

    this.pendingWrites.set(key, timeout);
  }

  /**
   * Immediately flush a specific key to storage
   */
  flushKey(key: string): void {
    const value = this.pendingValues.get(key);
    if (value === undefined) return;

    const result = this.adapter.set(key, value);
    
    // Handle promise result if adapter returns Promise
    if (result instanceof Promise) {
      result.catch((error) => {
        console.error(`Error flushing "${key}" to storage:`, error);
      });
    }

    // Clean up
    this.pendingValues.delete(key);
    this.pendingWrites.delete(key);
  }

  /**
   * Immediately flush all pending writes to storage
   * Useful for cleanup (e.g., before page unload)
   */
  flushAll(): void {
    // Clear all timeouts
    this.pendingWrites.forEach((timeout) => clearTimeout(timeout));
    this.pendingWrites.clear();

    // Flush all pending values
    const keys = Array.from(this.pendingValues.keys());
    keys.forEach((key) => this.flushKey(key));
  }

  /**
   * Remove a key from storage (immediate, no debouncing)
   */
  remove(key: string): void {
    // Cancel any pending write for this key
    const timeout = this.pendingWrites.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingWrites.delete(key);
    }
    this.pendingValues.delete(key);

    // For localStorage, we can use the existing storage service
    // For other adapters, we'd need to add a remove method to the interface
    if (this.adapter instanceof LocalStorageAdapter) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing "${key}" from storage:`, error);
      }
    }
  }

  /**
   * Check if there are any pending writes
   */
  hasPendingWrites(): boolean {
    return this.pendingWrites.size > 0;
  }
}

// Export a singleton instance using localStorage adapter
// This can be easily swapped to a Firebase adapter later
export const persistenceService = new PersistenceService(new LocalStorageAdapter(), 1000);

// Flush all pending writes before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    persistenceService.flushAll();
  });
}
