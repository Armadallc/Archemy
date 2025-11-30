/**
 * React hook for fetching activity log data
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '../lib/queryClient';

export interface ActivityLogEntry {
  id: string;
  activity_type: string;
  source_type: string;
  source_id: string;
  user_id: string;
  action_description: string | null;
  metadata: {
    mentioned_users?: string[];
    mentioned_roles?: string[];
    target_user_id?: string;
    previous_value?: any;
    new_value?: any;
    [key: string]: any;
  };
  corporate_client_id: string | null;
  program_id: string | null;
  created_at: string;
  users?: {
    user_id: string;
    user_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  target_user?: {
    user_id: string;
    user_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  mentioned_users?: Array<{
    user_id: string;
    user_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  }>;
}

export interface UseActivityLogOptions {
  limit?: number;
  offset?: number;
  activityType?: string;
  sourceType?: string;
  mentionsOnly?: boolean;
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export function useActivityLog(options: UseActivityLogOptions = {}) {
  const { user } = useAuth();
  const {
    limit = 50,
    offset = 0,
    activityType,
    sourceType,
    mentionsOnly = false,
    startDate,
    endDate,
    enabled = true,
  } = options;

  return useQuery<ActivityLogEntry[]>({
    queryKey: [
      '/api/activity-log',
      user?.user_id,
      limit,
      offset,
      activityType,
      sourceType,
      mentionsOnly,
      startDate?.toISOString(),
      endDate?.toISOString(),
    ],
    queryFn: async () => {
      if (!user?.user_id) {
        return [];
      }

      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      if (activityType) params.append('activityType', activityType);
      if (sourceType) params.append('sourceType', sourceType);
      if (mentionsOnly) params.append('mentionsOnly', 'true');
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const endpoint = mentionsOnly 
        ? `/api/activity-log/mentions?${params.toString()}`
        : `/api/activity-log?${params.toString()}`;

      const response = await apiRequest('GET', endpoint);
      return await response.json();
    },
    enabled: enabled && !!user?.user_id,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}


