import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/localStorage';

/**
 * Hook for syncing state with localStorage
 * Automatically saves to localStorage on state changes
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return storage.get(key, initialValue);
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    storage.set(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

/**
 * Hook for lazy-loading from localStorage
 * Only reads once on mount, useful for expensive operations
 */
export function useLazyLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [value, setValue] = useState<T>(() => {
    return storage.get(key, initialValue);
  });

  const [hasLoaded, setHasLoaded] = useState(false);

  // Save to localStorage
  useEffect(() => {
    if (hasLoaded) {
      storage.set(key, value);
    } else {
      setHasLoaded(true);
    }
  }, [key, value, hasLoaded]);

  // Manual reload from localStorage
  const reload = useCallback(() => {
    setValue(storage.get(key, initialValue));
  }, [key, initialValue]);

  return [value, setValue, reload];
}
