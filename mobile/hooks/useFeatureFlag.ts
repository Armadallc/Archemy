import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

/**
 * Hook to check if a feature flag is enabled
 * Uses the same API endpoint as the web app
 */
export function useFeatureFlag(flagName: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', flagName],
    queryFn: async () => {
      try {
        // Use apiClient.request to ensure auth headers are included
        const result = await apiClient.request<{ isEnabled: boolean }>(
          `/api/feature-flags/check/${flagName}`
        );
        return { isEnabled: result?.isEnabled || false };
      } catch (error: any) {
        // If flag doesn't exist (404) or other error, default to disabled
        if (error?.status === 404 || error?.response?.status === 404) {
          return { isEnabled: false };
        }
        console.error(`Error checking feature flag ${flagName}:`, error);
        // Default to disabled on error
        return { isEnabled: false };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    throwOnError: false, // Don't throw errors, just return disabled
  });

  return {
    isEnabled: data?.isEnabled || false,
    isLoading,
  };
}

