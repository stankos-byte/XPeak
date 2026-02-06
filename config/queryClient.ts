import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * 
 * Provides client-side caching for Firestore data to reduce redundant reads
 * and improve performance.
 * 
 * Settings:
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - cacheTime: 30 minutes - Cached data kept in memory for 30 minutes
 * - retry: 1 - Retry failed queries once
 * - refetchOnWindowFocus: false - Don't refetch when window regains focus
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 30 * 60 * 1000,    // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
