/**
 * NEW ARCHITECTURAL BLUEPRINT - MINIMAL SUPABASE STORAGE
 * 
 * HIERARCHY: Corporate Clients → Programs → Locations → Clients/Patients
 * ROLES: super_admin → corporate_admin → program_admin → program_user → driver
 * 
 * DATABASE FIELD MAPPING RULE:
 * - ALWAYS use snake_case field names from database
 * - user.user_id NOT user.userId
 * - program.primary_program_id NOT program.primaryProgramId
 * 
 * "DATABASE SCHEMA IS SOURCE OF TRUTH - NEVER CONVERT TO CAMELCASE"
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// CORPORATE CLIENTS MANAGEMENT
// ============================================================================

export const corporateClientsStorage = {
  async getAllCorporateClients() {
    const { data, error } = await supabase.from('corporate_clients').select('*').eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getCorporateClient(id: string) {
    const { data, error } = await supabase.from('corporate_clients').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createCorporateClient(corporateClient: any) {
    const { data, error } = await supabase.from('corporate_clients').insert(corporateClient).select().single();
    if (error) throw error;
    return data;
  },

  async updateCorporateClient(id: string, updates: any) {
    const { data, error } = await supabase.from('corporate_clients').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCorporateClient(id: string) {
    const { data, error } = await supabase.from('corporate_clients').update({ is_active: false }).eq('id', id);
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// PROGRAMS MANAGEMENT (renamed from organizations)
// ============================================================================

export const programsStorage = {
  async getAllPrograms() {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getProgram(id: string) {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getProgramsByCorporateClient(corporateClientId: string) {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `)
      .eq('corporate_client_id', corporateClientId)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async createProgram(program: any) {
    const { data, error } = await supabase.from('programs').insert(program).select().single();
    if (error) throw error;
    return data;
  },

  async updateProgram(id: string, updates: any) {
    const { data, error } = await supabase.from('programs').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProgram(id: string) {
    const { data, error } = await supabase.from('programs').update({ is_active: false }).eq('id', id);
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// LOCATIONS MANAGEMENT (new)
// ============================================================================

export const locationsStorage = {
  async getAllLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getLocation(id: string) {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getLocationsByProgram(programId: string) {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async createLocation(location: any) {
    const { data, error } = await supabase.from('locations').insert(location).select().single();
    if (error) throw error;
    return data;
  },

  async updateLocation(id: string, updates: any) {
    const { data, error } = await supabase.from('locations').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteLocation(id: string) {
    const { data, error } = await supabase.from('locations').update({ is_active: false }).eq('id', id);
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// USERS MANAGEMENT (updated for new role hierarchy)
// ============================================================================

export const usersStorage = {
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `);
    if (error) throw error;
    return data || [];
  },

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
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
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUsersByRole(role: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('role', role);
    if (error) throw error;
    return data || [];
  },

  async getUsersByProgram(programId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('primary_program_id', programId);
    if (error) throw error;
    return data || [];
  },

  async createUser(user: any) {
    const { data, error } = await supabase.from('users').insert(user).select().single();
    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase.from('users').update(updates).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async deleteUser(userId: string) {
    const { data, error } = await supabase.from('users').delete().eq('user_id', userId);
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// DRIVERS MANAGEMENT (updated for cross-corporate access)
// ============================================================================

export const driversStorage = {
  async getAllDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        users:user_id (
          user_id,
          user_name,
          email,
          role,
          primary_program_id,
          programs:primary_program_id (
            id,
            name,
            corporate_clients:corporate_client_id (
              id,
              name
            )
          )
        )
      `)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getDriver(id: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        users:user_id (
          user_id,
          user_name,
          email,
          role,
          primary_program_id,
          programs:primary_program_id (
            id,
            name,
            corporate_clients:corporate_client_id (
              id,
              name
            )
          )
        )
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getDriversByProgram(programId: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        users:user_id (
          user_id,
          user_name,
          email,
          role,
          primary_program_id,
          programs:primary_program_id (
            id,
            name,
            corporate_clients:corporate_client_id (
              id,
              name
            )
          )
        )
      `)
      .eq('is_active', true);
    if (error) throw error;
    
    // Filter drivers who have access to this program
    return (data || []).filter(driver => 
      driver.users?.primary_program_id === programId || 
      driver.users?.authorized_programs?.includes(programId)
    );
  },

  async createDriver(driver: any) {
    const { data, error } = await supabase.from('drivers').insert(driver).select().single();
    if (error) throw error;
    return data;
  },

  async updateDriver(id: string, updates: any) {
    const { data, error } = await supabase.from('drivers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteDriver(id: string) {
    const { data, error } = await supabase.from('drivers').update({ is_active: false }).eq('id', id);
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// CLIENTS MANAGEMENT (updated for new hierarchy)
// ============================================================================

export const clientsStorage = {
  async getAllClients() {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        program:programs!program_id (
          id,
          name,
          short_name,
          corporateClient:corporate_clients!corporate_client_id (
            id,
            name
          )
        ),
        location:locations!location_id (
          id,
          name,
          address
        )
      `)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getClient(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        locations:location_id (
          id,
          name,
          address
        )
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getClientsByProgram(programId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        locations:location_id (
          id,
          name,
          address
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getClientsByLocation(locationId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        locations:location_id (
          id,
          name,
          address
        )
      `)
      .eq('location_id', locationId)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async createClient(client: any) {
    // Database will auto-generate UUID for id field
    const { data, error } = await supabase.from('clients').insert(client).select().single();
    if (error) throw error;
    return data;
  },

  async updateClient(id: string, updates: any) {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteClient(id: string) {
    const { data, error } = await supabase.from('clients').update({ is_active: false }).eq('id', id);
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// TRIPS MANAGEMENT (updated for new hierarchy)
// ============================================================================

export const tripsStorage = {
  async getAllTrips() {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients!client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        ),
        client_groups!client_group_id (
          id,
          name,
          description
        )
      `);
    if (error) throw error;
    return data || [];
  },

  async getTrip(id: string) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients!client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        ),
        client_groups!client_group_id (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getTripsByProgram(programId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients!client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        ),
        client_groups!client_group_id (
          id,
          name,
          description
        )
      `)
      .eq('program_id', programId);
    if (error) throw error;
    return data || [];
  },

  async getTripsByDriver(driverId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients!client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        ),
        client_groups!client_group_id (
          id,
          name,
          description
        )
      `)
      .eq('driver_id', driverId);
    if (error) throw error;
    return data || [];
  },

  async getTripsByCorporateClient(corporateClientId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients!client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        ),
        client_groups!client_group_id (
          id,
          name,
          description
        )
      `)
      .eq('programs.corporate_client_id', corporateClientId)
      .order('scheduled_pickup_time', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createTrip(trip: any) {
    // Auto-set is_group_trip flag based on client_group_id
    if (trip.client_group_id && !trip.hasOwnProperty('is_group_trip')) {
      trip.is_group_trip = true;
    }
    
    // Validate group trip has proper group membership
    if (trip.is_group_trip && trip.client_group_id) {
      const { data: groupMembers, error: groupError } = await supabase
        .from('client_group_memberships')
        .select('id')
        .eq('client_group_id', trip.client_group_id);
      
      if (groupError) throw groupError;
      
      if (!groupMembers || groupMembers.length === 0) {
        throw new Error('Cannot create group trip: Client group has no members');
      }
      
      // Set passenger count to actual group member count for group trips
      trip.passenger_count = groupMembers.length;
    }
    
    const { data, error } = await supabase.from('trips').insert(trip).select().single();
    if (error) throw error;
    return data;
  },

  async updateTrip(id: string, updates: any) {
    const { data, error } = await supabase.from('trips').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteTrip(id: string) {
    const { data, error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// CLIENT GROUPS MANAGEMENT (new)
// ============================================================================

export const clientGroupsStorage = {
  async getAllClientGroups() {
    const { data, error } = await supabase
      .from('client_groups')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        client_group_memberships(count)
      `)
      .eq('is_active', true);
    if (error) throw error;
    
    // Add member_count to each group
    const groupsWithCount = (data || []).map(group => ({
      ...group,
      member_count: group.client_group_memberships?.[0]?.count || 0
    }));
    
    return groupsWithCount;
  },

  async getClientGroup(id: string) {
    const { data, error } = await supabase
      .from('client_groups')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getClientGroupsByProgram(programId: string) {
    const { data, error } = await supabase
      .from('client_groups')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        client_group_memberships(count)
      `)
      .eq('program_id', programId)
      .eq('is_active', true);
    if (error) throw error;
    
    // Add member_count to each group
    const groupsWithCount = (data || []).map(group => ({
      ...group,
      member_count: group.client_group_memberships?.[0]?.count || 0
    }));
    
    return groupsWithCount;
  },

  async createClientGroup(clientGroup: any) {
    // Generate a UUID for the client group if not provided
    const groupWithId = {
      ...clientGroup,
      id: clientGroup.id || crypto.randomUUID()
    };
    
    const { data, error } = await supabase.from('client_groups').insert(groupWithId).select().single();
    if (error) throw error;
    return data;
  },

  async updateClientGroup(id: string, updates: any) {
    const { data, error } = await supabase.from('client_groups').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteClientGroup(id: string) {
    const { data, error } = await supabase.from('client_groups').update({ is_active: false }).eq('id', id);
    if (error) throw error;
    return data;
  },

  // Member management functions
  async getClientGroupMembers(groupId: string) {
    const { data, error } = await supabase
      .from('client_group_memberships')
      .select('id, client_id, clients:client_id (id, first_name, last_name, email)')
      .eq('client_group_id', groupId);
    if (error) throw error;
    return data || [];
  },

  async addClientToGroup(groupId: string, clientId: string) {
    const { data, error } = await supabase
      .from('client_group_memberships')
      .insert({
        id: crypto.randomUUID(),
        client_group_id: groupId,
        client_id: clientId
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeClientFromGroup(membershipId: string) {
    const { data, error } = await supabase
      .from('client_group_memberships')
      .delete()
      .eq('id', membershipId);
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// LEGACY COMPATIBILITY REMOVED
// ============================================================================
// All legacy organization-based compatibility has been removed as the frontend
// has been fully migrated to the new hierarchical system (corporate_clients → programs → locations)

// ============================================================================
// PERMISSION SYSTEM INITIALIZATION
// ============================================================================

async function setupPermissionTables() {
  try {
    // Note: role_permissions and feature_flags tables don't exist in the database
    // Permissions are handled via hardcoded logic in the application
    console.log('✅ Enhanced permission system activated (using hardcoded permissions)');
  } catch (error) {
    console.log('📋 Using hardcoded permissions system');
  }
}

// Initialize permissions on startup
setupPermissionTables();