import { useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseRealTimeUpdatesOptions {
  enabled?: boolean;
  interval?: number;
  queryKeys: string[];
}

export function useRealTimeUpdates({ 
  enabled = true, 
  interval = 30000, // 30 seconds for more reasonable updates
  queryKeys 
}: UseRealTimeUpdatesOptions) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Memoize queryKeys string to prevent infinite loops from array reference changes
  const queryKeysString = useMemo(() => JSON.stringify(queryKeys), [queryKeys]);

  useEffect(() => {
    if (!enabled || queryKeys.length === 0) {
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      // Reduced logging to prevent console spam
      // console.log('🔄 Real-time update: refreshing queries', queryKeys);
      
      // Invalidate all specified query keys
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ 
          queryKey: queryKey.startsWith('[') ? JSON.parse(queryKey) : [queryKey]
        });
      });
    }, interval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // Use queryKeysString instead of queryKeys to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval, queryKeysString, queryClient]);

  // Manual refresh function
  const refreshNow = () => {
    // console.log('🔄 Manual refresh: updating queries', queryKeys); // Disabled to reduce console spam
    queryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ 
        queryKey: queryKey.startsWith('[') ? JSON.parse(queryKey) : [queryKey]
      });
    });
  };

  return { refreshNow };
}