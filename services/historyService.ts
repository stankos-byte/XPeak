/**
 * History Service
 * Manages user history entries with automatic archiving of older data.
 * Limits active history to the most recent 50 entries for performance.
 * Older entries are prepared for long-term storage in archive collections.
 */

import { UserProfile } from '../types';

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

const MAX_ACTIVE_HISTORY = 50;

/**
 * Limits the active history array to the most recent entries.
 * Returns the active history (limited) and any entries that should be archived.
 * 
 * @param history - Full history array from user profile
 * @returns Object containing limited active history and entries to archive
 */
export function limitActiveHistory(history: HistoryEntry[]): {
  activeHistory: HistoryEntry[];
  entriesToArchive: HistoryEntry[];
} {
  if (history.length <= MAX_ACTIVE_HISTORY) {
    return {
      activeHistory: history,
      entriesToArchive: [],
    };
  }

  // Keep the most recent MAX_ACTIVE_HISTORY entries as active
  const activeHistory = history.slice(0, MAX_ACTIVE_HISTORY);
  
  // Everything beyond that should be archived
  const entriesToArchive = history.slice(MAX_ACTIVE_HISTORY);

  return {
    activeHistory,
    entriesToArchive,
  };
}

/**
 * Prepares history entries for long-term storage in archive collections.
 * This function formats the data for efficient storage in Firebase's 'heavy' archive collection.
 * 
 * @param entries - History entries to archive
 * @param userId - Optional user ID for multi-user support
 * @returns Formatted archive data ready for storage
 */
export function archiveData(
  entries: HistoryEntry[],
  userId?: string
): ArchivedHistory {
  return {
    entries,
    archivedAt: new Date().toISOString(),
    userId,
    totalEntries: entries.length,
  };
}

/**
 * Processes a new history entry and returns updated active history.
 * Automatically archives old entries when the limit is exceeded.
 * 
 * @param currentHistory - Current history array
 * @param newEntry - New history entry to add
 * @returns Object with updated active history and any archived entries
 */
export function addHistoryEntry(
  currentHistory: HistoryEntry[],
  newEntry: HistoryEntry
): {
  activeHistory: HistoryEntry[];
  archivedData: ArchivedHistory | null;
} {
  // Add new entry at the beginning (most recent first)
  const updatedHistory = [newEntry, ...currentHistory];
  
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
 * @param history - History array to process
 * @param userId - Optional user ID
 * @returns Object with limited active history and any archived entries
 */
export function processHistory(
  history: HistoryEntry[],
  userId?: string
): {
  activeHistory: HistoryEntry[];
  archivedData: ArchivedHistory | null;
} {
  const { activeHistory, entriesToArchive } = limitActiveHistory(history);
  
  const archivedData = entriesToArchive.length > 0
    ? archiveData(entriesToArchive, userId)
    : null;

  return {
    activeHistory,
    archivedData,
  };
}
