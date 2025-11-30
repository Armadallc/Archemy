import { supabase } from '../minimal-supabase';

export interface UserScope {
  corporateClients: string[];
  programs: string[];
  locations: string[];
  canSeeAllOrganizations: boolean;
  canSeeAllPrograms: boolean;
  canSeeAllLocations: boolean;
}

export interface User {
  user_id: string;
  user_name: string;
  email: string;
  role: 'super_admin' | 'corporate_admin' | 'program_admin' | 'program_user' | 'driver' | 'client_user';
  primary_program_id?: string | null;
  authorized_programs?: string[] | null;
  corporate_client_id?: string | null;
  client_id?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
}

/**
 * Get the data access scope for a user based on their role
 */
export async function getUserScope(userId: string): Promise<UserScope | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role, primary_program_id, authorized_programs, corporate_client_id')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      console.error('Error fetching user for scope:', error);
      return null;
    }

    return getScopeForRole(user.role, user.corporate_client_id, user.primary_program_id, user.authorized_programs);
  } catch (error) {
    console.error('Error in getUserScope:', error);
    return null;
  }
}

/**
 * Get scope based on role (without database lookup)
 */
export function getScopeForRole(
  role: string,
  corporateClientId?: string | null,
  primaryProgramId?: string | null,
  authorizedPrograms?: string[] | null
): UserScope {
  switch (role) {
    case 'super_admin':
      return {
        corporateClients: [], // Empty array means "all"
        programs: [],
        locations: [],
        canSeeAllOrganizations: true,
        canSeeAllPrograms: true,
        canSeeAllLocations: true,
      };

    case 'corporate_admin':
      return {
        corporateClients: corporateClientId ? [corporateClientId] : [],
        programs: [], // All programs within their corporate client
        locations: [],
        canSeeAllOrganizations: false,
        canSeeAllPrograms: true, // Within their corporate client
        canSeeAllLocations: true,
      };

    case 'program_admin':
    case 'program_user':
      const programIds: string[] = [];
      if (primaryProgramId) {
        programIds.push(primaryProgramId);
      }
      if (authorizedPrograms && Array.isArray(authorizedPrograms)) {
        programIds.push(...authorizedPrograms.filter(p => p && !programIds.includes(p)));
      }
      
      return {
        corporateClients: corporateClientId ? [corporateClientId] : [],
        programs: programIds,
        locations: [],
        canSeeAllOrganizations: false,
        canSeeAllPrograms: false,
        canSeeAllLocations: true, // Within their programs
      };

    case 'driver':
      return {
        corporateClients: [],
        programs: [],
        locations: [],
        canSeeAllOrganizations: false,
        canSeeAllPrograms: false,
        canSeeAllLocations: false,
      };

    default:
      return {
        corporateClients: [],
        programs: [],
        locations: [],
        canSeeAllOrganizations: false,
        canSeeAllPrograms: false,
        canSeeAllLocations: false,
      };
  }
}

/**
 * Check if a user can see another user based on scoping rules
 */
export async function canUserSeeTarget(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    // Users can always see themselves - check this FIRST before any database queries
    if (currentUserId === targetUserId) {
      console.log(`✅ [canUserSeeTarget] User ${currentUserId} can see themselves`);
      return true;
    }

    // Get both users (including client_id for client_users)
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, role, primary_program_id, authorized_programs, corporate_client_id, client_id')
      .in('user_id', [currentUserId, targetUserId]);

    if (error) {
      console.error(`❌ [canUserSeeTarget] Database error:`, error);
      return false;
    }

    if (!users || users.length === 0) {
      console.log(`❌ [canUserSeeTarget] No users found for ${currentUserId} or ${targetUserId}`);
      return false;
    }

    // If we only got one user (both are the same), allow it
    if (users.length === 1 && users[0].user_id === currentUserId && users[0].user_id === targetUserId) {
      console.log(`✅ [canUserSeeTarget] Same user found (single result)`);
      return true;
    }

    if (users.length !== 2) {
      console.log(`❌ [canUserSeeTarget] Expected 2 users, got ${users.length}`);
      return false;
    }

    const currentUser = users.find(u => u.user_id === currentUserId);
    const targetUser = users.find(u => u.user_id === targetUserId);

    if (!currentUser || !targetUser) {
      console.log(`❌ [canUserSeeTarget] Could not find current user (${!!currentUser}) or target user (${!!targetUser})`);
      return false;
    }

    // Super admin can see everyone
    if (currentUser.role === 'super_admin') {
      console.log(`✅ [canUserSeeTarget] Super admin can see everyone`);
      return true;
    }

    // Corporate admin can see users in their corporate client
    if (currentUser.role === 'corporate_admin' && currentUser.corporate_client_id) {
      // Regular users in same corporate client
      if (targetUser.corporate_client_id === currentUser.corporate_client_id) {
        return true;
      }
      // Client_users are handled below in the program admin section
    }

    // Program admin/user can see users in their programs
    if (['program_admin', 'program_user'].includes(currentUser.role)) {
      const currentProgramIds = new Set<string>();
      if (currentUser.primary_program_id) {
        currentProgramIds.add(currentUser.primary_program_id);
      }
      if (currentUser.authorized_programs && Array.isArray(currentUser.authorized_programs)) {
        currentUser.authorized_programs.forEach(p => {
          if (p) currentProgramIds.add(p);
        });
      }

      // Check if target is a regular user in same programs
      if (targetUser.primary_program_id && currentProgramIds.has(targetUser.primary_program_id)) {
        return true;
      }
      if (targetUser.authorized_programs && Array.isArray(targetUser.authorized_programs)) {
        if (targetUser.authorized_programs.some(p => p && currentProgramIds.has(p))) {
          return true;
        }
      }

      // Check if target is a client_user - scope by their client's program
      if (targetUser.role === 'client_user' && targetUser.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('program_id')
          .eq('id', targetUser.client_id)
          .single();

        if (!clientError && client && client.program_id) {
          return currentProgramIds.has(client.program_id);
        }
      }
    }

    // Corporate admin can see client_users in their corporate client's programs
    if (currentUser.role === 'corporate_admin' && currentUser.corporate_client_id) {
      if (targetUser.role === 'client_user' && targetUser.client_id) {
        // Get client's program and check if it belongs to current user's corporate client
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('program_id, programs:program_id(corporate_client_id)')
          .eq('id', targetUser.client_id)
          .single();

        if (!clientError && client && client.programs) {
          const program = Array.isArray(client.programs) ? client.programs[0] : client.programs;
          return program?.corporate_client_id === currentUser.corporate_client_id;
        }
      }
    }

    // Driver can only see themselves (already handled above)
    return false;
  } catch (error) {
    console.error('Error in canUserSeeTarget:', error);
    return false;
  }
}

/**
 * Get list of user IDs that the current user can tag/mention
 */
export async function getTaggableUsers(currentUserId: string): Promise<string[]> {
  try {
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('user_id, role, primary_program_id, authorized_programs, corporate_client_id')
      .eq('user_id', currentUserId)
      .single();

    if (currentUserError || !currentUser) {
      return [];
    }

    let query = supabase
      .from('users')
      .select('user_id')
      .eq('is_active', true)
      .neq('user_id', currentUserId); // Exclude self

    // Apply scoping based on role
    if (currentUser.role === 'super_admin') {
      // Can see all users
      const { data, error } = await query;
      if (error) return [];
      return data.map(u => u.user_id);
    }

    if (currentUser.role === 'corporate_admin' && currentUser.corporate_client_id) {
      // Can see users in their corporate client
      query = query.eq('corporate_client_id', currentUser.corporate_client_id);
      
      // Get regular users first
      const { data: regularUsers, error: regularError } = await query;
      const regularUserIds = regularError ? [] : (regularUsers || []).map((u: any) => u.user_id);
      
      // Also get client_users whose clients belong to programs in this corporate client
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('id')
        .eq('corporate_client_id', currentUser.corporate_client_id);

      if (!programsError && programs && programs.length > 0) {
        const programIds = programs.map(p => p.id);
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id')
          .in('program_id', programIds);

        if (!clientsError && clients && clients.length > 0) {
          const clientIds = clients.map(c => c.id);
          const { data: clientUsers, error: clientUsersError } = await supabase
            .from('users')
            .select('user_id')
            .eq('role', 'client_user')
            .eq('is_active', true)
            .in('client_id', clientIds)
            .neq('user_id', currentUserId);

          if (!clientUsersError && clientUsers) {
            const clientUserIds = clientUsers.map((u: any) => u.user_id);
            return [...regularUserIds, ...clientUserIds];
          }
        }
      }
      
      return regularUserIds;
    } else if (['program_admin', 'program_user'].includes(currentUser.role)) {
      // Can see users in their programs
      const programIds: string[] = [];
      if (currentUser.primary_program_id) {
        programIds.push(currentUser.primary_program_id);
      }
      if (currentUser.authorized_programs && Array.isArray(currentUser.authorized_programs)) {
        programIds.push(...currentUser.authorized_programs.filter(p => p));
      }

      if (programIds.length === 0) {
        return [];
      }

      query = query.or(
        programIds.map(id => `primary_program_id.eq.${id}`).join(',') +
        (currentUser.authorized_programs && currentUser.authorized_programs.length > 0
          ? ',' + currentUser.authorized_programs.map(id => `authorized_programs.cs.{${id}}`).join(',')
          : '')
      );

      // Get regular users first
      const { data: regularUsers, error: regularError } = await query;
      const regularUserIds = regularError ? [] : (regularUsers || []).map((u: any) => u.user_id);

      // Also include client_users whose clients belong to these programs
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .in('program_id', programIds);

      if (!clientsError && clients && clients.length > 0) {
        const clientIds = clients.map(c => c.id);
        const { data: clientUsers, error: clientUsersError } = await supabase
          .from('users')
          .select('user_id')
          .eq('role', 'client_user')
          .eq('is_active', true)
          .in('client_id', clientIds)
          .neq('user_id', currentUserId);

        if (!clientUsersError && clientUsers) {
          const clientUserIds = clientUsers.map((u: any) => u.user_id);
          return [...regularUserIds, ...clientUserIds];
        }
      }
      
      return regularUserIds;
    } else if (currentUser.role === 'driver') {
      // Drivers can only see themselves (already excluded)
      return [];
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching taggable users:', error);
      return [];
    }

    return data.map(u => u.user_id);
  } catch (error) {
    console.error('Error in getTaggableUsers:', error);
    return [];
  }
}

