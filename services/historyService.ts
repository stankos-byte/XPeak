/**
 * History Service
 * Manages user history with daily activity aggregates for efficient storage and calendar visualization.
 * Limits active history to the most recent 365 days (1 year) for performance.
 * Older entries are prepared for long-term storage in archive collections.
 */

import { DailyActivity } from '../types';

// Legacy entry format (for migration)
export interface HistoryEntry {
  date: string;
  xpGained: number;
  taskId: string;
}

export interface ArchivedHistory {
  entries: HistoryEntry[];
  archivedAt: string;
  userId?: string;
  totalEntries: number;
}

const MAX_ACTIVE_DAYS = 365; // Keep 1 year of daily aggregates active

/**
 * Converts a date string (ISO or any format) to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Aggregates individual history entries into daily activity summaries
 */
export function aggregateByDate(entries: HistoryEntry[]): DailyActivity[] {
  const dailyMap = new Map<string, { totalXP: number; taskIds: Set<string> }>();

  entries.forEach(entry => {
    const dateKey = normalizeDate(entry.date);
    const existing = dailyMap.get(dateKey) || { totalXP: 0, taskIds: new Set<string>() };
    
    existing.totalXP += entry.xpGained;
    if (entry.taskId) {
      existing.taskIds.add(entry.taskId);
    }
    
    dailyMap.set(dateKey, existing);
  });

  // Convert map to array and sort by date (most recent first)
  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalXP: data.totalXP,
      taskCount: data.taskIds.size,
      taskIds: Array.from(data.taskIds),
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
}

/**
 * Limits the active history array to the most recent days.
 * Returns the active history (limited) and any entries that should be archived.
 * 
 * @param history - Daily activity array from user profile
 * @returns Object containing limited active history and entries to archive
 */
export function limitActiveHistory(history: DailyActivity[]): {
  activeHistory: DailyActivity[];
  entriesToArchive: DailyActivity[];
} {
  if (history.length <= MAX_ACTIVE_DAYS) {
    return {
      activeHistory: history,
      entriesToArchive: [],
    };
  }

  // Keep the most recent MAX_ACTIVE_DAYS entries as active
  const activeHistory = history.slice(0, MAX_ACTIVE_DAYS);
  
  // Everything beyond that should be archived
  const entriesToArchive = history.slice(MAX_ACTIVE_DAYS);

  return {
    activeHistory,
    entriesToArchive,
  };
}

/**
 * Prepares history entries for long-term storage in archive collections.
 * This function formats the data for efficient storage in Firebase's 'heavy' archive collection.
 * 
 * @param entries - Daily activity entries to archive (converted to legacy format for compatibility)
 * @param userId - Optional user ID for multi-user support
 * @returns Formatted archive data ready for storage
 */
export function archiveData(
  entries: DailyActivity[],
  userId?: string
): ArchivedHistory {
  // Convert daily aggregates back to individual entries for archiving
  // This preserves detailed information in archives
  const legacyEntries: HistoryEntry[] = [];
  entries.forEach(daily => {
    // Distribute XP evenly across tasks if we have taskIds, otherwise create single entry
    if (daily.taskIds && daily.taskIds.length > 0) {
      const xpPerTask = daily.totalXP / daily.taskIds.length;
      daily.taskIds.forEach(taskId => {
        legacyEntries.push({
          date: daily.date,
          xpGained: xpPerTask,
          taskId,
        });
      });
    } else {
      legacyEntries.push({
        date: daily.date,
        xpGained: daily.totalXP,
        taskId: 'unknown',
      });
    }
  });

  return {
    entries: legacyEntries,
    archivedAt: new Date().toISOString(),
    userId,
    totalEntries: legacyEntries.length,
  };
}

/**
 * Adds a new history entry and aggregates it with existing daily activity.
 * Automatically archives old entries when the limit is exceeded.
 * 
 * @param currentHistory - Current daily activity array
 * @param newEntry - New history entry to add
 * @returns Object with updated active history and any archived entries
 */
export function addHistoryEntry(
  currentHistory: DailyActivity[],
  newEntry: HistoryEntry
): {
  activeHistory: DailyActivity[];
  archivedData: ArchivedHistory | null;
} {
  const dateKey = normalizeDate(newEntry.date);
  
  // Find existing entry for this date
  const existingIndex = currentHistory.findIndex(h => h.date === dateKey);
  
  let updatedHistory: DailyActivity[];
  
  if (existingIndex >= 0) {
    // Update existing daily entry
    const existing = currentHistory[existingIndex];
    const taskIds = new Set(existing.taskIds || []);
    if (newEntry.taskId) {
      taskIds.add(newEntry.taskId);
    }
    
    updatedHistory = [...currentHistory];
    updatedHistory[existingIndex] = {
      date: dateKey,
      totalXP: existing.totalXP + newEntry.xpGained,
      taskCount: taskIds.size,
      taskIds: Array.from(taskIds),
    };
  } else {
    // Add new daily entry at the beginning (most recent first)
    const newDaily: DailyActivity = {
      date: dateKey,
      totalXP: newEntry.xpGained,
      taskCount: newEntry.taskId ? 1 : 0,
      taskIds: newEntry.taskId ? [newEntry.taskId] : [],
    };
    updatedHistory = [newDaily, ...currentHistory];
  }
  
  // Sort by date (most recent first) to maintain order
  updatedHistory.sort((a, b) => b.date.localeCompare(a.date));
  
  // Limit and get entries to archive
  const { activeHistory, entriesToArchive } = limitActiveHistory(updatedHistory);
  
  // Prepare archive data if there are entries to archive
  const archivedData = entriesToArchive.length > 0
    ? archiveData(entriesToArchive)
    : null;

  return {
    activeHistory,
    archivedData,
  };
}

/**
 * Processes an existing history array to ensure it's within limits.
 * Useful for migration or cleanup operations.
 * 
 * @param history - History array to process (can be legacy format or daily aggregates)
 * @param userId - Optional user ID
 * @returns Object with limited active history and any archived entries
 */
export function processHistory(
  history: DailyActivity[] | HistoryEntry[],
  userId?: string
): {
  activeHistory: DailyActivity[];
  archivedData: ArchivedHistory | null;
} {
  // Check if this is legacy format (has taskId property) and convert if needed
  let dailyHistory: DailyActivity[];
  
  if (history.length > 0 && 'taskId' in history[0]) {
    // Legacy format - convert to daily aggregates
    dailyHistory = aggregateByDate(history as HistoryEntry[]);
  } else {
    dailyHistory = history as DailyActivity[];
  }
  
  const { activeHistory, entriesToArchive } = limitActiveHistory(dailyHistory);
  
  const archivedData = entriesToArchive.length > 0
    ? archiveData(entriesToArchive, userId)
    : null;

  return {
    activeHistory,
    archivedData,
  };
}

/**
 * Migrates legacy history format (individual entries) to daily aggregates format.
 * This is a one-time migration function.
 * 
 * @param legacyHistory - Array of individual history entries
 * @returns Daily activity aggregates
 */
export function migrateToDailyAggregates(legacyHistory: HistoryEntry[]): DailyActivity[] {
  return aggregateByDate(legacyHistory);
}
