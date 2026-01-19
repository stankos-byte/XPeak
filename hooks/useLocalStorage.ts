import { useState, useEffect, useCallback } from 'react';
import { persistenceService } from '../services/persistenceService';

/**
 * Hook for syncing state with localStorage
 * Automatically saves to localStorage on state changes (debounced)
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return persistenceService.get(key, initialValue);
  });

  // Update localStorage whenever state changes (debounced)
  useEffect(() => {
    persistenceService.set(key, storedValue);
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
    return persistenceService.get(key, initialValue);
  });

  const [hasLoaded, setHasLoaded] = useState(false);

  // Save to localStorage (debounced)
  useEffect(() => {
    if (hasLoaded) {
      persistenceService.set(key, value);
    } else {
      setHasLoaded(true);
    }
  }, [key, value, hasLoaded]);

  // Manual reload from localStorage
  const reload = useCallback(() => {
    setValue(persistenceService.get(key, initialValue));
  }, [key, initialValue]);

  return [value, setValue, reload];
}
