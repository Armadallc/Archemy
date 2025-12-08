/**
 * Shared hook for fetching corporate clients
 * Uses React Query to deduplicate requests across components
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '../lib/queryClient';

export function useCorporateClients() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['/api/corporate-clients'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate-clients');
      return await response.json();
    },
    enabled: !!user && (user.role === 'super_admin' || user.role === 'corporate_admin'),
    staleTime: 300000, // 5 minutes - corporate clients don't change often
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists
  });
}




