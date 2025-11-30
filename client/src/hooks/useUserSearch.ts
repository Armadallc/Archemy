import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '../lib/queryClient';

// User search result type (matches backend)
export interface UserSearchResult {
  user_id: string;
  user_name: string;
  email?: string;
  role: 'super_admin' | 'corporate_admin' | 'program_admin' | 'program_user' | 'driver' | 'client_user';
  primary_program_id?: string | null;
  authorized_programs?: string[] | null;
  corporate_client_id?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  displayName: string;
  programName?: string;
  corporateClientName?: string;
}

export interface UserSearchOptions {
  query: string;
  scope?: 'organization' | 'program' | 'all';
  allowedRoles?: Array<'super_admin' | 'corporate_admin' | 'program_admin' | 'program_user' | 'driver'>;
  excludeUsers?: string[];
  limit?: number;
  enabled?: boolean;
}

export function useUserSearch(options: UserSearchOptions) {
  const { user } = useAuth();
  const {
    query,
    scope = 'all',
    allowedRoles,
    excludeUsers = [],
    limit = 50,
    enabled = true,
  } = options;

  return useQuery<UserSearchResult[]>({
    queryKey: ['/api/users/search', query, scope, allowedRoles, excludeUsers, limit, user?.user_id],
    queryFn: async () => {
      if (!user?.user_id || !query.trim()) {
        return [];
      }

      const params = new URLSearchParams({
        q: query.trim(),
        scope,
        ...(limit && { limit: limit.toString() }),
      });

      if (allowedRoles && allowedRoles.length > 0) {
        params.append('roles', allowedRoles.join(','));
      }

      if (excludeUsers.length > 0) {
        params.append('exclude', excludeUsers.join(','));
      }

      const response = await apiRequest('GET', `/api/users/search?${params.toString()}`);
      return await response.json();
    },
    enabled: enabled && !!user?.user_id && query.trim().length > 0,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

