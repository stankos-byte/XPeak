import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function for conditional class names
 * Combines clsx for conditional logic
 * 
 * Usage:
 * cn('base-class', condition && 'conditional-class', { 'object-class': boolean })
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
