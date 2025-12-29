import { supabase } from '../minimal-supabase';
import { canUserSeeTarget, getTaggableUsers, type User } from './scopeValidationService';

export interface UserSearchOptions {
  currentUserId: string;
  scope?: 'organization' | 'program' | 'all';
  allowedRoles?: Array<'super_admin' | 'corporate_admin' | 'program_admin' | 'program_user' | 'driver' | 'client_user'>;
  excludeUsers?: string[];
  limit?: number;
}

export interface UserSearchResult extends User {
  displayName: string;
  programName?: string;
  corporateClientName?: string;
}

/**
 * Search for users with multi-tenant scoping
 */
export async function findUsers(query: string, options: UserSearchOptions): Promise<UserSearchResult[]> {
  try {
    const {
      currentUserId,
      scope = 'all',
      allowedRoles,
      excludeUsers = [],
      limit = 50,
    } = options;

    // Get taggable users first (respects scoping)
    const taggableUserIds = await getTaggableUsers(currentUserId);
    
    // Always include current user in search results (for self-assignment)
    const searchableUserIds = [...new Set([...taggableUserIds, currentUserId])];
    
    console.log(`🔍 [User Search] Starting search for "${query}"`);
    console.log(`🔍 [User Search] Current user: ${currentUserId}`);
    console.log(`🔍 [User Search] Taggable users: ${taggableUserIds.length}`);
    console.log(`🔍 [User Search] Searchable users (including self): ${searchableUserIds.length}`);
    console.log(`🔍 [User Search] Current user in searchable list: ${searchableUserIds.includes(currentUserId)}`);
    
    if (searchableUserIds.length === 0) {
      console.log(`🔍 [User Search] No searchable users found`);
      return [];
    }

    // Build search query - include client_users with their client's program info
    let searchQuery = supabase
      .from('users')
      .select(`
        user_id,
        user_name,
        email,
        first_name,
        last_name,
        role,
        primary_program_id,
        authorized_programs,
        corporate_client_id,
        client_id,
        avatar_url,
        is_active,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        clients:client_id (
          id,
          program_id,
          programs:program_id (
            id,
            name,
            corporate_clients:corporate_client_id (
              id,
              name
            )
          )
        )
      `)
      .eq('is_active', true)
      .in('user_id', searchableUserIds);

    // Apply search filter - search across multiple fields
    if (query && query.trim().length > 0) {
      const searchTerm = query.trim();
      // Search in: user_name, email, first_name, last_name, and role
      // Use OR to match any of these fields
      // Note: The .in('user_id', ...) filter is applied first, then .or() adds search conditions
      const searchConditions = [
        `user_name.ilike.%${searchTerm}%`,
        `email.ilike.%${searchTerm}%`,
        `first_name.ilike.%${searchTerm}%`,
        `last_name.ilike.%${searchTerm}%`,
        `role.ilike.%${searchTerm}%`,
      ];
      searchQuery = searchQuery.or(searchConditions.join(','));
      
      console.log(`🔍 [User Search] Searching for "${searchTerm}" in ${searchableUserIds.length} users (including current user: ${currentUserId})`);
      console.log(`🔍 [User Search] Search conditions:`, searchConditions);
    }
    
    searchQuery = searchQuery.limit(limit);

    // Filter by allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      searchQuery = searchQuery.in('role', allowedRoles);
    }

    // Exclude specific users
    if (excludeUsers.length > 0) {
      searchQuery = searchQuery.not('user_id', 'in', `(${excludeUsers.map(id => `"${id}"`).join(',')})`);
    }

    // Apply scope-based filtering
    if (scope === 'organization') {
      // Get current user's corporate client
      const { data: currentUser } = await supabase
        .from('users')
        .select('corporate_client_id')
        .eq('user_id', currentUserId)
        .single();

      if (currentUser?.corporate_client_id) {
        searchQuery = searchQuery.eq('corporate_client_id', currentUser.corporate_client_id);
      }
    } else if (scope === 'program') {
      // Get current user's programs
      const { data: currentUser } = await supabase
        .from('users')
        .select('primary_program_id, authorized_programs')
        .eq('user_id', currentUserId)
        .single();

      if (currentUser) {
        const programIds: string[] = [];
        if (currentUser.primary_program_id) {
          programIds.push(currentUser.primary_program_id);
        }
        if (currentUser.authorized_programs && Array.isArray(currentUser.authorized_programs)) {
          programIds.push(...currentUser.authorized_programs.filter(p => p));
        }

        if (programIds.length > 0) {
          // For regular users, filter by program_id
          // For client_users, we'll filter them separately by their client's program_id
          searchQuery = searchQuery.or(
            programIds.map(id => `primary_program_id.eq.${id}`).join(',')
          );
        } else {
          // No programs, return empty
          return [];
        }
      }
    }

    const { data, error } = await searchQuery;

    if (error) {
      console.error('❌ [User Search] Error searching users:', error);
      return [];
    }

    if (!data) {
      console.log(`🔍 [User Search] No data returned for query "${query}"`);
      return [];
    }

    console.log(`🔍 [User Search] Found ${data.length} users matching "${query}"`);

    // Transform results with additional metadata
    const results: UserSearchResult[] = data.map((user: any) => {
      let program = null;
      let corporateClient = null;

      // For regular users, get program from primary_program_id
      if (user.role !== 'client_user' && user.programs) {
        program = Array.isArray(user.programs) ? user.programs[0] : user.programs;
        corporateClient = program?.corporate_clients 
          ? (Array.isArray(program.corporate_clients) ? program.corporate_clients[0] : program.corporate_clients)
          : null;
      }
      
      // For client_users, get program from their client's program_id
      if (user.role === 'client_user' && user.clients) {
        const client = Array.isArray(user.clients) ? user.clients[0] : user.clients;
        if (client?.programs) {
          program = Array.isArray(client.programs) ? client.programs[0] : client.programs;
          corporateClient = program?.corporate_clients 
            ? (Array.isArray(program.corporate_clients) ? program.corporate_clients[0] : program.corporate_clients)
            : null;
        }
      }

    // Build display name from first_name, last_name, or fallback to user_name/email
    let displayName = user.user_name || user.email;
    if (user.first_name || user.last_name) {
      const nameParts = [user.first_name, user.last_name].filter(Boolean);
      if (nameParts.length > 0) {
        displayName = nameParts.join(' ');
      }
    }

    return {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      primary_program_id: user.primary_program_id || (user.role === 'client_user' && user.clients ? (Array.isArray(user.clients) ? user.clients[0]?.program_id : user.clients?.program_id) : null),
      authorized_programs: user.authorized_programs,
      corporate_client_id: user.corporate_client_id || (corporateClient?.id || null),
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      display_id: user.display_id,
      displayName,
      programName: program?.name,
      corporateClientName: corporateClient?.name,
    };
    });

    // Additional validation: double-check each user is visible to current user
    const validatedResults: UserSearchResult[] = [];
    for (const user of results) {
      const canSee = await canUserSeeTarget(currentUserId, user.user_id);
      if (canSee) {
        validatedResults.push(user);
      } else {
        console.log(`🔍 [User Search] Filtered out user ${user.user_id} (${user.user_name || user.email}) - not visible to current user`);
      }
    }

    console.log(`🔍 [User Search] Final results: ${validatedResults.length} users (after validation)`);
    if (validatedResults.length > 0) {
      console.log(`🔍 [User Search] Result user IDs:`, validatedResults.map(u => u.user_id));
    }

    return validatedResults;
  } catch (error) {
    console.error('Error in findUsers:', error);
    return [];
  }
}

/**
 * Get user by ID with scope validation
 */
export async function getUserById(userId: string, currentUserId: string): Promise<UserSearchResult | null> {
  try {
    // First check if current user can see target user
    const canSee = await canUserSeeTarget(currentUserId, userId);
    if (!canSee) {
      return null;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        user_id,
        user_name,
        email,
        role,
        primary_program_id,
        authorized_programs,
        corporate_client_id,
        avatar_url,
        is_active,
        display_id,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    let program = null;
    let corporateClient = null;

    // For regular users, get program from primary_program_id
    if (user.role !== 'client_user' && user.programs) {
      program = Array.isArray(user.programs) ? user.programs[0] : user.programs;
      corporateClient = program?.corporate_clients 
        ? (Array.isArray(program.corporate_clients) ? program.corporate_clients[0] : program.corporate_clients)
        : null;
    }
    
    // For client_users, get program from their client's program_id
    if (user.role === 'client_user' && user.clients) {
      const client = Array.isArray(user.clients) ? user.clients[0] : user.clients;
      if (client?.programs) {
        program = Array.isArray(client.programs) ? client.programs[0] : client.programs;
        corporateClient = program?.corporate_clients 
          ? (Array.isArray(program.corporate_clients) ? program.corporate_clients[0] : program.corporate_clients)
          : null;
      }
    }

    // Build display name from first_name, last_name, or fallback to user_name/email
    let displayName = user.user_name || user.email;
    if (user.first_name || user.last_name) {
      const nameParts = [user.first_name, user.last_name].filter(Boolean);
      if (nameParts.length > 0) {
        displayName = nameParts.join(' ');
      }
    }

    return {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      primary_program_id: user.primary_program_id || (user.role === 'client_user' && user.clients ? (Array.isArray(user.clients) ? user.clients[0]?.program_id : user.clients?.program_id) : null),
      authorized_programs: user.authorized_programs,
      corporate_client_id: user.corporate_client_id || (corporateClient?.id || null),
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      display_id: user.display_id,
      displayName,
      programName: program?.name,
      corporateClientName: corporateClient?.name,
    };
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
}

