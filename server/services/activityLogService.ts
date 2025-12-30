/**
 * Activity Log Service
 * Handles fetching and creating activity log entries from the database
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
 * Create an activity log entry
 */
export async function createActivityLogEntry(data: {
  activity_type: string;
  source_type: string;
  source_id: string;
  user_id: string;
  action_description?: string | null;
  metadata?: {
    mentioned_users?: string[];
    mentioned_roles?: string[];
    target_user_id?: string;
    previous_value?: any;
    new_value?: any;
    [key: string]: any;
  };
  corporate_client_id?: string | null;
  program_id?: string | null;
}): Promise<ActivityLogEntry | null> {
  try {
    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: entry, error } = await supabase
      .from('activity_log')
      .insert({
        id: activityId,
        activity_type: data.activity_type,
        source_type: data.source_type,
        source_id: data.source_id,
        user_id: data.user_id,
        action_description: data.action_description || null,
        metadata: data.metadata || {},
        corporate_client_id: data.corporate_client_id || null,
        program_id: data.program_id || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity log entry:', error);
      return null;
    }

    return entry as ActivityLogEntry;
  } catch (error) {
    console.error('Error creating activity log entry:', error);
    return null;
  }
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
    // For program admins/users, we need to also include entries where they're mentioned
    // even if the entry is in a different program (for cross-program mentions)
    if (userRole === 'super_admin') {
      // Super admin can see all activities
    } else if (userRole === 'corporate_admin' && corporateClientId) {
      // Corporate admin can see activities for their corporate client
      query = query.eq('corporate_client_id', corporateClientId);
    } else if (userRole === 'program_admin' || userRole === 'program_user') {
      // Program admin/user can see activities for their programs OR where they're mentioned
      // For mentionsOnly, we still want to scope by program first, then filter for mentions
      // For normal view, show entries in their programs (mentions will be added in post-processing)
      if (primaryProgramId) {
        query = query.eq('program_id', primaryProgramId);
      } else if (authorizedPrograms.length > 0) {
        query = query.in('program_id', authorizedPrograms);
      }
      // Note: If no programs, we'll still fetch and filter in memory for mentions
    } else {
      // Default: show activities created by the user
      if (!mentionsOnly) {
        query = query.eq('user_id', userId);
      }
      // For mentionsOnly, we'll fetch all and filter in memory
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

    // Filter activities to include entries where user is mentioned (if needed)
    let filteredData = data || [];
    
    // If mentionsOnly is true, filter to only show entries where user is mentioned
    if (mentionsOnly) {
      filteredData = filteredData.filter((entry: any) => {
        const mentionedUsers = entry.metadata?.mentioned_users || [];
        const mentionedRoles = entry.metadata?.mentioned_roles || [];
        return Array.isArray(mentionedUsers) && mentionedUsers.includes(userId) ||
               Array.isArray(mentionedRoles) && mentionedRoles.includes(userRole || '');
      });
    } else if (userRole === 'program_admin' || userRole === 'program_user') {
      // For program admins/users, also include entries where they're mentioned
      // even if they're not in the same program
      const programFiltered = filteredData.filter((entry: any) => {
        if (primaryProgramId) {
          return entry.program_id === primaryProgramId;
        } else if (authorizedPrograms.length > 0) {
          return authorizedPrograms.includes(entry.program_id);
        }
        return false;
      });
      
      // Also include entries where user is mentioned (regardless of program)
      const mentionedEntries = filteredData.filter((entry: any) => {
        const mentionedUsers = entry.metadata?.mentioned_users || [];
        return Array.isArray(mentionedUsers) && mentionedUsers.includes(userId);
      });
      
      // Combine and deduplicate
      const combined = [...programFiltered, ...mentionedEntries];
      const uniqueIds = new Set();
      filteredData = combined.filter((entry: any) => {
        if (uniqueIds.has(entry.id)) return false;
        uniqueIds.add(entry.id);
        return true;
      });
    }

    // Transform the data to match the expected format
    const activities: ActivityLogEntry[] = filteredData.map((entry: any) => {
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
