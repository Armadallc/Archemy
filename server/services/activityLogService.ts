/**
 * Activity Log Service
 * Handles fetching activity log entries from the database
 */

import { supabase } from '../minimal-supabase';

export interface ActivityLogOptions {
  limit?: number;
  offset?: number;
  activityType?: string;
  sourceType?: string;
  mentionsOnly?: boolean;
  startDate?: Date;
  endDate?: Date;
  userRole?: string;
  corporateClientId?: string | null;
  primaryProgramId?: string | null;
  authorizedPrograms?: string[];
}

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

/**
 * Get activity log entries for a user
 */
export async function getActivityLog(
  userId: string,
  options: ActivityLogOptions = {}
): Promise<ActivityLogEntry[]> {
  try {
    const {
      limit = 50,
      offset = 0,
      activityType,
      sourceType,
      mentionsOnly = false,
      startDate,
      endDate,
      userRole,
      corporateClientId,
      primaryProgramId,
      authorizedPrograms = [],
    } = options;

    // Build the base query
    let query = supabase
      .from('activity_log')
      .select(`
        id,
        activity_type,
        source_type,
        source_id,
        user_id,
        action_description,
        metadata,
        corporate_client_id,
        program_id,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userRole === 'super_admin') {
      // Super admin can see all activities
    } else if (userRole === 'corporate_admin' && corporateClientId) {
      // Corporate admin can see activities for their corporate client
      query = query.eq('corporate_client_id', corporateClientId);
    } else if (userRole === 'program_admin' || userRole === 'program_user') {
      // Program admin/user can see activities for their programs
      if (primaryProgramId) {
        query = query.eq('program_id', primaryProgramId);
      } else if (authorizedPrograms.length > 0) {
        query = query.in('program_id', authorizedPrograms);
      } else {
        // No authorized programs, return empty
        return [];
      }
    } else {
      // Default: only show activities created by the user
      query = query.eq('user_id', userId);
    }

    // Apply filters
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    // Apply mentions filter
    if (mentionsOnly) {
      // Filter for activities where the user is mentioned in metadata
      // Check if userId is in mentioned_users array or userRole is in mentioned_roles array
      query = query.or(`metadata->mentioned_users.cs.["${userId}"],metadata->mentioned_roles.cs.["${userRole || ''}"]`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity log:', error);
      throw error;
    }

    // Fetch user details for all unique user IDs
    const userIds = new Set<string>();
    (data || []).forEach((entry: any) => {
      if (entry.user_id) userIds.add(entry.user_id);
      if (entry.metadata?.target_user_id) userIds.add(entry.metadata.target_user_id);
      if (entry.metadata?.mentioned_users && Array.isArray(entry.metadata.mentioned_users)) {
        entry.metadata.mentioned_users.forEach((id: string) => userIds.add(id));
      }
    });

    // Fetch user details in batch
    const userDetailsMap = new Map<string, any>();
    if (userIds.size > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('user_id, user_name, email, avatar_url, role, first_name, last_name')
        .in('user_id', Array.from(userIds));

      if (!usersError && users) {
        users.forEach((user: any) => {
          userDetailsMap.set(user.user_id, user);
        });
      }
    }

    // Transform the data to match the expected format
    const activities: ActivityLogEntry[] = (data || []).map((entry: any) => {
      // Get user details
      const userDetails = userDetailsMap.get(entry.user_id);
      const targetUserDetails = entry.metadata?.target_user_id 
        ? userDetailsMap.get(entry.metadata.target_user_id)
        : undefined;

      // Extract mentioned users if they exist in metadata
      let mentionedUsers: ActivityLogEntry['mentioned_users'] = [];
      if (entry.metadata?.mentioned_users && Array.isArray(entry.metadata.mentioned_users)) {
        mentionedUsers = entry.metadata.mentioned_users
          .map((userId: string) => userDetailsMap.get(userId))
          .filter(Boolean);
      }

      return {
        id: entry.id,
        activity_type: entry.activity_type,
        source_type: entry.source_type,
        source_id: entry.source_id,
        user_id: entry.user_id,
        action_description: entry.action_description,
        metadata: entry.metadata || {},
        corporate_client_id: entry.corporate_client_id,
        program_id: entry.program_id,
        created_at: entry.created_at,
        users: userDetails || undefined,
        target_user: targetUserDetails || undefined,
        mentioned_users: mentionedUsers.length > 0 ? mentionedUsers : undefined,
      };
    });

    return activities;
  } catch (error) {
    console.error('Error in getActivityLog:', error);
    throw error;
  }
}

