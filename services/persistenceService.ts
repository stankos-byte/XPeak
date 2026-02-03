/**
 * PersistenceService - Storage-agnostic service with debounced writes
 * 
 * This service debounces writes to prevent excessive storage operations.
 * Currently uses localStorage, but can be easily swapped to Firebase or other backends.
 * 
 * Keys are scoped by user ID to prevent data leakage between users on same browser.
 * 
 * Usage:
 *   const persistence = new PersistenceService(localStorageAdapter);
 *   persistence.set('key', value, uid); // Debounced - waits 1000ms after last change
 *   const value = persistence.get('key', defaultValue, uid);
 */

import { DEBUG_FLAGS } from '../config/debugFlags';
import { storage } from './localStorage';

export interface StorageAdapter {
  /**
   * Get a value from storage
   * @param key The storage key (will be scoped by uid)
   * @param defaultValue Value to return if key doesn't exist
   * @param uid Optional user ID for scoping
   */
  get<T>(key: string, defaultValue: T, uid?: string | null): T;

  /**
   * Set a value in storage (synchronous)
   * @param key The storage key (will be scoped by uid)
   * @param value The value to store
   * @param uid Optional user ID for scoping
   * @returns true if successful, false otherwise
   */
  set<T>(key: string, value: T, uid?: string | null): boolean | Promise<boolean>;
}

/**
 * localStorage adapter implementation using the storage service for consistent key scoping
 */
export class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string, defaultValue: T, uid?: string | null): T {
    return storage.get(key, defaultValue, uid);
  }

  set<T>(key: string, value: T, uid?: string | null): boolean {
    return storage.set(key, value, uid);
  }
}

/**
 * PersistenceService with debounced writes
 * 
 * Waits 1000ms after the last change before writing to storage.
 * This prevents excessive writes during rapid state changes.
 * Keys are scoped by user ID for data isolation.
 */
export class PersistenceService {
  private adapter: StorageAdapter;
  private debounceDelay: number;
  private pendingWrites: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private pendingValues: Map<string, { value: any; uid?: string | null }> = new Map();

  constructor(adapter: StorageAdapter, debounceDelay: number = 1000) {
    this.adapter = adapter;
    this.debounceDelay = debounceDelay;
  }

  /**
   * Get a value from storage (synchronous, no debouncing)
   * @param key Base storage key
   * @param defaultValue Default value if not found
   * @param uid Optional user ID for scoping
   */
  get<T>(key: string, defaultValue: T, uid?: string | null): T {
    return this.adapter.get(key, defaultValue, uid);
  }

  /**
   * Set a value in storage (debounced)
   * The write will be delayed by debounceDelay ms after the last call.
   * @param key Base storage key
   * @param value Value to store
   * @param uid Optional user ID for scoping
   */
  set<T>(key: string, value: T, uid?: string | null): void {
    // Create a composite key for the pending map that includes uid
    const pendingKey = uid ? `${key}_${uid}` : key;
    
    // Store the latest value with uid
    this.pendingValues.set(pendingKey, { value, uid });

    // Clear existing timeout for this key
    const existingTimeout = this.pendingWrites.get(pendingKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.flushKey(pendingKey);
    }, this.debounceDelay);

    this.pendingWrites.set(pendingKey, timeout);
  }

  /**
   * Immediately flush a specific pending key to storage
   */
  flushKey(pendingKey: string): void {
    const pending = this.pendingValues.get(pendingKey);
    if (pending === undefined) return;

    // Extract the base key from pendingKey (remove uid suffix if present)
    const baseKey = pending.uid ? pendingKey.replace(`_${pending.uid}`, '') : pendingKey;
    
    const result = this.adapter.set(baseKey, pending.value, pending.uid);
    
    // Handle promise result if adapter returns Promise
    if (result instanceof Promise) {
      result.catch((error) => {
        if (DEBUG_FLAGS.storage) console.error(`Error flushing "${baseKey}" to storage:`, error);
      });
    }

    // Clean up
    this.pendingValues.delete(pendingKey);
    this.pendingWrites.delete(pendingKey);
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
   * @param key Base storage key
   * @param uid Optional user ID for scoping
   */
  remove(key: string, uid?: string | null): void {
    const pendingKey = uid ? `${key}_${uid}` : key;
    
    // Cancel any pending write for this key
    const timeout = this.pendingWrites.get(pendingKey);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingWrites.delete(pendingKey);
    }
    this.pendingValues.delete(pendingKey);

    // Use the storage service for removal (handles scoping)
    storage.remove(key, uid);
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
