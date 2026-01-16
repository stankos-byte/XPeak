import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format a date string for display
 * Shows "Today", "Yesterday", or the formatted date
 */
export function formatDate(dateString: string | null, pattern: string = 'MMM d, yyyy'): string {
  if (!dateString) return 'N/A';
  
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  
  return format(date, pattern);
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  const date = parseISO(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format a date for task history display
 */
export function formatCompletedDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return 'Today';
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  return format(date, 'MMM d');
}

/**
 * Get a short time format (e.g., "2:30 PM")
 */
export function formatTime(dateString: string): string {
  return format(parseISO(dateString), 'h:mm a');
}
