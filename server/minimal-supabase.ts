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
    
    // Add counts for each program
    const programsWithCounts = await Promise.all((data || []).map(async (program) => {
      // Get client count
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', program.id)
        .eq('is_active', true);
      
      // Get location count
      const { count: locationCount } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', program.id)
        .eq('is_active', true);
      
      // Get trip count
      const { count: tripCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', program.id);
      
      return {
        ...program,
        client_count: clientCount || 0,
        location_count: locationCount || 0,
        trip_count: tripCount || 0,
        corporate_client_name: program.corporate_clients?.name || null
      };
    }));
    
    return programsWithCounts;
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
    
    // Add counts for each program
    const programsWithCounts = await Promise.all((data || []).map(async (program) => {
      // Get client count
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', program.id)
        .eq('is_active', true);
      
      // Get location count
      const { count: locationCount } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', program.id)
        .eq('is_active', true);
      
      // Get trip count
      const { count: tripCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', program.id);
      
      return {
        ...program,
        client_count: clientCount || 0,
        location_count: locationCount || 0,
        trip_count: tripCount || 0,
        corporate_client_name: program.corporate_clients?.name || null
      };
    }));
    
    return programsWithCounts;
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

  async getLocationsByCorporateClient(corporateClientId: string) {
    // First, get all program IDs for this corporate client
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id')
      .eq('corporate_client_id', corporateClientId)
      .eq('is_active', true);
    
    if (programsError) throw programsError;
    
    if (!programs || programs.length === 0) {
      // No programs for this corporate client, return empty array
      return [];
    }
    
    // Extract program IDs
    const programIds = programs.map(p => p.id);
    
    // Now fetch locations for these programs
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
      .in('program_id', programIds)
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

  async getDriversByCorporateClient(corporateClientId: string) {
    // First, get all program IDs for this corporate client
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id')
      .eq('corporate_client_id', corporateClientId)
      .eq('is_active', true);
    
    if (programsError) throw programsError;
    
    if (!programs || programs.length === 0) {
      // No programs for this corporate client, return empty array
      return [];
    }
    
    // Extract program IDs
    const programIds = programs.map(p => p.id);
    
    // Fetch all active drivers
    const { data: allDrivers, error: driversError } = await supabase
      .from('drivers')
      .select(`
        *,
        users:user_id (
          user_id,
          user_name,
          email,
          role,
          primary_program_id,
          authorized_programs,
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
    
    if (driversError) throw driversError;
    
    // Filter drivers who belong to any program in this corporate client
    return (allDrivers || []).filter(driver => {
      const user = driver.users;
      if (!user) return false;
      
      // Check if driver's primary program is in this corporate client
      if (user.primary_program_id && programIds.includes(user.primary_program_id)) {
        return true;
      }
      
      // Check if driver's authorized programs include any program in this corporate client
      if (user.authorized_programs && Array.isArray(user.authorized_programs)) {
        return user.authorized_programs.some((progId: string) => programIds.includes(progId));
      }
      
      return false;
    });
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

  async getClientsByCorporateClient(corporateClientId: string) {
    // First, get all program IDs for this corporate client
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id')
      .eq('corporate_client_id', corporateClientId)
      .eq('is_active', true);
    
    if (programsError) throw programsError;
    
    if (!programs || programs.length === 0) {
      // No programs for this corporate client, return empty array
      return [];
    }
    
    // Extract program IDs
    const programIds = programs.map(p => p.id);
    
    // Now fetch clients for these programs
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
      .in('program_id', programIds)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async createClient(client: any) {
    // Defensive: Remove any fields that shouldn't be in the clients table
    const { program_contacts, client_program_contacts, pin, ...clientData } = client;
    
    // Additional safety: explicitly remove these fields if they somehow got through
    delete clientData.program_contacts;
    delete clientData.client_program_contacts;
    
    // Hash PIN if provided
    if (pin) {
      const { pinService } = await import('./services/pin-service');
      clientData.pin_hash = await pinService.hashPIN(pin);
    }
    
    // Database will auto-generate UUID for id field
    const { data, error } = await supabase.from('clients').insert(clientData).select().single();
    if (error) throw error;
    return data;
  },

  async updateClient(id: string, updates: any) {
    // Hash PIN if provided in updates
    const { pin, ...updateData } = updates;
    if (pin) {
      console.log('🔍 [updateClient] PIN provided, hashing...');
      const { pinService } = await import('./services/pin-service');
      updateData.pin_hash = await pinService.hashPIN(pin);
      console.log('🔍 [updateClient] PIN hashed successfully');
    } else {
      console.log('🔍 [updateClient] No PIN in updates');
    }
    
    console.log('🔍 [updateClient] Final updateData:', { ...updateData, pin_hash: updateData.pin_hash ? '[HASHED]' : undefined });
    const { data, error } = await supabase.from('clients').update(updateData).eq('id', id).select().single();
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
// CLIENT PROGRAM CONTACTS MANAGEMENT
// ============================================================================

export const clientProgramContactsStorage = {
  async createProgramContact(contact: {
    client_id: string;
    first_name: string;
    last_name: string;
    role: string;
    phone: string;
    is_preferred_poc?: boolean;
  }) {
    const { data, error } = await supabase
      .from('client_program_contacts')
      .insert(contact)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createProgramContacts(clientId: string, contacts: Array<{
    first_name: string;
    last_name: string;
    role: string;
    phone: string;
    is_preferred_poc?: boolean;
  }>) {
    if (!contacts || contacts.length === 0) {
      return [];
    }

    const contactsToInsert = contacts.map(contact => ({
      client_id: clientId,
      first_name: contact.first_name,
      last_name: contact.last_name,
      role: contact.role,
      phone: contact.phone,
      is_preferred_poc: contact.is_preferred_poc || false
    }));

    const { data, error } = await supabase
      .from('client_program_contacts')
      .insert(contactsToInsert)
      .select();
    if (error) throw error;
    return data || [];
  },

  async getProgramContactsByClient(clientId: string) {
    const { data, error } = await supabase
      .from('client_program_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async updateProgramContact(id: string, updates: Partial<{
    first_name: string;
    last_name: string;
    role: string;
    phone: string;
    is_preferred_poc: boolean;
  }>) {
    const { data, error } = await supabase
      .from('client_program_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProgramContact(id: string) {
    const { data, error } = await supabase
      .from('client_program_contacts')
      .delete()
      .eq('id', id);
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
    // First, get all program IDs for this corporate client
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id')
      .eq('corporate_client_id', corporateClientId)
      .eq('is_active', true);
    
    if (programsError) throw programsError;
    
    if (!programs || programs.length === 0) {
      // No programs for this corporate client, return empty array
      return [];
    }
    
    // Extract program IDs
    const programIds = programs.map(p => p.id);
    
    // Now fetch trips for these programs
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
      .in('program_id', programIds)
      .order('scheduled_pickup_time', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createTrip(trip: any) {
    // Auto-set is_group_trip flag based on client_group_id
    if (trip.client_group_id && !trip.hasOwnProperty('is_group_trip')) {
      trip.is_group_trip = true;
    }
    
    // Remove client_id if it's empty string, null, or undefined (for group trips)
    // Database requires client_id to be a valid UUID or omitted entirely
    if (!trip.client_id || trip.client_id === '' || trip.client_id === null || trip.client_id === undefined) {
      delete trip.client_id;
    }
    
    // For group trips, ensure client_id is not included
    if (trip.is_group_trip || trip.client_group_id) {
      delete trip.client_id;
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
    
    // Final check: remove any empty string UUIDs before insert
    const cleanTrip = { ...trip };
    Object.keys(cleanTrip).forEach(key => {
      if (cleanTrip[key] === '' || cleanTrip[key] === null) {
        // Only delete UUID fields if they're empty/null
        if (key.includes('_id') || key === 'client_id' || key === 'client_group_id' || key === 'driver_id' || key === 'program_id') {
          delete cleanTrip[key];
        }
      }
    });
    
    console.log(`Inserting trip with keys:`, Object.keys(cleanTrip));
    console.log(`client_id in cleanTrip:`, cleanTrip.client_id);
    console.log(`client_group_id in cleanTrip:`, cleanTrip.client_group_id);
    
    const { data, error } = await supabase.from('trips').insert(cleanTrip).select().single();
    if (error) {
      console.error(`Database insert error:`, error);
      console.error(`Trip being inserted:`, JSON.stringify(cleanTrip, null, 2));
      throw error;
    }
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

  async getClientGroupsByCorporateClient(corporateClientId: string) {
    // First, get all program IDs for this corporate client
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id')
      .eq('corporate_client_id', corporateClientId)
      .eq('is_active', true);
    
    if (programsError) throw programsError;
    
    if (!programs || programs.length === 0) {
      // No programs for this corporate client, return empty array
      return [];
    }
    
    // Extract program IDs
    const programIds = programs.map(p => p.id);
    
    // Now fetch client groups for these programs
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
      .in('program_id', programIds)
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