import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiRequest } from '../lib/queryClient';

interface OptimizedQueriesOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}

export function useOptimizedQueries(options: OptimizedQueriesOptions = {}) {
  const {
    enabled = true,
    staleTime = 60000, // 60 seconds - data stays fresh
    cacheTime = 600000, // 10 minutes - keep in cache
    refetchInterval = 30000, // 30 seconds - more reasonable interval
    refetchOnWindowFocus = false // Don't refetch on window focus
  } = options;

  const queryClient = useQueryClient();

  // Optimized query configuration
  const queryConfig = useMemo(() => ({
    staleTime,
    cacheTime,
    refetchInterval: enabled && typeof refetchInterval === 'number' && refetchInterval > 0 ? refetchInterval : 0,
    refetchOnWindowFocus,
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  }), [enabled, staleTime, cacheTime, refetchInterval, refetchOnWindowFocus]);

  // Prefetch related data for better performance
  const prefetchRelatedData = async (queryKey: string, relatedKeys: string[]) => {
    const promises = relatedKeys.map(key => 
      queryClient.prefetchQuery({
        queryKey: [key],
        queryFn: async () => {
          const response = await apiRequest('GET', `/api/${key}`);
          return await response.json();
        },
        ...queryConfig
      })
    );
    
    await Promise.all(promises);
  };

  // Invalidate and refetch specific queries
  const invalidateQueries = (queryKeys: string[]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  // Clear unused cache entries
  const clearUnusedCache = () => {
    queryClient.removeQueries({
      predicate: (query) => {
        // Remove queries that haven't been used in 10 minutes
        const lastUsed = query.state.dataUpdatedAt;
        const now = Date.now();
        return now - lastUsed > 600000; // 10 minutes
      }
    });
  };

  // Get query performance metrics
  const getQueryMetrics = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.status === 'pending').length,
      staleQueries: queries.filter(q => q.state.isStale).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      cacheSize: JSON.stringify(cache).length, // Rough estimate
    };
  };

  return {
    queryConfig,
    prefetchRelatedData,
    invalidateQueries,
    clearUnusedCache,
    getQueryMetrics,
  };
}







