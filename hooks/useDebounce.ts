import { useCallback, useRef } from 'react';

/**
 * Custom hook to debounce function calls.
 * Prevents a function from being called multiple times in rapid succession.
 * 
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced version of the callback
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDebouncing = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      // If already debouncing, clear the previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // If we're in the debounce period, ignore the call
      if (isDebouncing.current) {
        return;
      }

      // Set debouncing flag
      isDebouncing.current = true;

      // Execute the callback after delay
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        isDebouncing.current = false;
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Alternative hook for immediate execution with cooldown period.
 * Executes immediately on first call, then prevents subsequent calls for the delay period.
 * This is better for buttons where you want immediate feedback but prevent spam.
 * 
 * @param callback - The function to throttle
 * @param delay - Cooldown period in milliseconds (default: 300ms)
 * @returns Throttled version of the callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      // If enough time has passed since last call, execute
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  );
}
