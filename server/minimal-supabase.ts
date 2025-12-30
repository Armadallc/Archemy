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
    // Generate code if not provided (required by NOT NULL constraint)
    const clientData = { ...corporateClient };
    
    if (!clientData.code || clientData.code.trim() === '') {
      if (clientData.name) {
        // Extract uppercase letters from name, take first 2-5 characters
        let code = clientData.name
          .replace(/[^A-Z]/g, '')
          .toUpperCase();
        
        // Take first 2-5 characters
        if (code.length >= 2) {
          code = code.substring(0, Math.min(code.length, 5));
        } else {
          // Fallback: use first 2 uppercase letters or generate from name
          code = clientData.name.toUpperCase().substring(0, 2).replace(/[^A-Z]/g, '') || 'CC';
        }
        
        clientData.code = code;
      } else {
        // Fallback if no name provided
        clientData.code = 'CC';
      }
    }
    
    const { data, error } = await supabase.from('corporate_clients').insert(clientData).select().single();
    if (error) throw error;
    return data;
  },

  async updateCorporateClient(id: string, updates: any) {
    // Define allowed fields for corporate_clients table
    const allowedFields = [
      'name', 'description', 'address', 'phone', 'email', 'website', 
      'logo_url', 'is_active', 'code', 'updated_at'
    ];
    
    // Filter to only include allowed fields and map frontend field names
    const updateData: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      // Map frontend field names to database field names
      if (key === 'contact_email') {
        updateData.email = value;
      } else if (key === 'contact_phone') {
        updateData.phone = value;
      } else if (allowedFields.includes(key)) {
        updateData[key] = value;
      } else {
        console.warn(`⚠️ [updateCorporateClient] Ignoring unknown field: ${key}`);
      }
    }
    
    // If code is being set to null/empty/undefined, remove it from updates
    // This preserves the existing code (which is required by NOT NULL constraint)
    if (updateData.code === null || updateData.code === undefined || 
        (typeof updateData.code === 'string' && updateData.code.trim() === '')) {
      delete updateData.code;
      console.log('🔍 [updateCorporateClient] Code was null/empty, preserving existing code');
    }
    
    // If code is being explicitly updated, validate and normalize it
    if (updateData.code && typeof updateData.code === 'string') {
      // Normalize: uppercase, letters only, 2-5 chars
      let code = updateData.code.toUpperCase().replace(/[^A-Z]/g, '');
      
      if (code.length < 2) {
        // Too short - don't allow invalid codes, preserve existing
        console.warn('⚠️ [updateCorporateClient] Code too short, preserving existing code');
        delete updateData.code;
      } else if (code.length > 5) {
        code = code.substring(0, 5);
        updateData.code = code;
      } else {
        updateData.code = code;
      }
    }
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    console.log('🔍 [updateCorporateClient] Updating with filtered data:', updateData);
    
    const { data, error } = await supabase.from('corporate_clients').update(updateData).eq('id', id).select().single();
    if (error) {
      console.error('❌ [updateCorporateClient] Database error:', error);
      throw error;
    }
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
    // Remove null/undefined id to ensure we generate a new one
    const cleanProgram = { ...program };
    if (cleanProgram.id === null || cleanProgram.id === undefined) {
      delete cleanProgram.id;
    }
    
    // Generate UUID for id if not provided
    const programData = {
      ...cleanProgram,
      id: cleanProgram.id || crypto.randomUUID()
    };
    
    // Remove null/undefined code to ensure we generate a new one
    if (programData.code === null || programData.code === undefined) {
      delete programData.code;
    }
    
    // Generate code if not provided (required by NOT NULL constraint)
    // This matches the logic in derive_program_code PostgreSQL function
    if (!programData.code || (typeof programData.code === 'string' && programData.code.trim() === '')) {
      console.log('🔍 [createProgram] No code provided, generating from name:', programData.name);
      
      if (programData.name) {
        // Extract uppercase letters from name, removing common words
        let code = programData.name
          .replace(/\s+(the|of|and|for|in|on|at|to|a|an)\s+/gi, ' ')
          .replace(/[^A-Z]/g, '')
          .toUpperCase();
        
        // Take first 2-4 characters
        if (code.length >= 3) {
          code = code.substring(0, 3);
        } else if (code.length >= 2) {
          code = code.substring(0, 2);
        } else {
          // Fallback: use first 2 uppercase letters or 'PR'
          code = programData.name.toUpperCase().substring(0, 2).replace(/[^A-Z]/g, '') || 'PR';
        }
        
        programData.code = code;
        console.log('✅ [createProgram] Generated code:', code, 'from name:', programData.name);
      } else {
        // Fallback if no name provided
        programData.code = 'PR';
        console.log('⚠️ [createProgram] No name provided, using fallback code: PR');
      }
    } else {
      console.log('✅ [createProgram] Code provided:', programData.code);
    }
    
    // Ensure code is always set (safety check)
    if (!programData.code || (typeof programData.code === 'string' && programData.code.trim() === '')) {
      programData.code = 'PR';
      console.log('⚠️ [createProgram] Code was still null/empty after generation, using fallback: PR');
    }
    
    console.log('🔍 [createProgram] Inserting program with data:', {
      id: programData.id,
      name: programData.name,
      code: programData.code,
      corporate_client_id: programData.corporate_client_id
    });
    
    const { data, error } = await supabase.from('programs').insert(programData).select().single();
    if (error) {
      console.error('❌ [createProgram] Database error:', error);
      throw error;
    }
    console.log('✅ [createProgram] Program created successfully:', data.id);
    return data;
  },

  async updateProgram(id: string, updates: any) {
    // Define allowed fields for programs table
    const allowedFields = [
      'name', 'short_name', 'description', 'address', 'phone', 'email', 
      'logo_url', 'is_active', 'code', 'corporate_client_id', 'updated_at'
    ];
    
    // Filter to only include allowed fields (exclude computed fields like clientCount, locationCount)
    const updateData: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      } else {
        console.warn(`⚠️ [updateProgram] Ignoring unknown/computed field: ${key}`);
      }
    }
    
    // If code is being set to null/empty/undefined, remove it from updates
    // This preserves the existing code (which is required by NOT NULL constraint)
    if (updateData.code === null || updateData.code === undefined || 
        (typeof updateData.code === 'string' && updateData.code.trim() === '')) {
      delete updateData.code;
      console.log('🔍 [updateProgram] Code was null/empty, preserving existing code');
    }
    
    // If code is being explicitly updated, validate and normalize it
    if (updateData.code && typeof updateData.code === 'string') {
      // Normalize: uppercase, letters only, 2-4 chars
      let code = updateData.code.toUpperCase().replace(/[^A-Z]/g, '');
      
      if (code.length < 2) {
        // Too short - don't allow invalid codes, preserve existing
        console.warn('⚠️ [updateProgram] Code too short, preserving existing code');
        delete updateData.code;
      } else if (code.length > 4) {
        code = code.substring(0, 4);
        updateData.code = code;
      } else {
        updateData.code = code;
      }
    }
    
    const { data, error } = await supabase.from('programs').update(updateData).eq('id', id).select().single();
    if (error) {
      console.error('❌ [updateProgram] Database error:', error);
      throw error;
    }
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
    
    // Get client counts for all locations
    if (data && data.length > 0) {
      const locationIds = data.map((loc: any) => loc.id);
      const clientCounts = await this.getClientCountsByLocations(locationIds);
      
      // Merge client counts into location data
      return data.map((location: any) => ({
        ...location,
        client_count: clientCounts[location.id] || 0
      }));
    }
    
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
    
    // Get client count for this location
    if (data) {
      const clientCounts = await this.getClientCountsByLocations([id]);
      return {
        ...data,
        client_count: clientCounts[id] || 0
      };
    }
    
    return data;
  },

  async getLocationsByProgram(programId: string, includeInactive: boolean = false) {
    let query = supabase
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
      .eq('program_id', programId);
    
    // Only filter by is_active if we don't want inactive locations
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Get client counts for all locations
    if (data && data.length > 0) {
      const locationIds = data.map(loc => loc.id);
      const clientCounts = await this.getClientCountsByLocations(locationIds);
      
      // Merge client counts into location data
      return data.map((location: any) => ({
        ...location,
        client_count: clientCounts[location.id] || 0
      }));
    }
    
    return data || [];
  },

  async getClientCountsByLocations(locationIds: string[]): Promise<Record<string, number>> {
    if (!locationIds || locationIds.length === 0) {
      return {};
    }

    // Get client counts grouped by location_id
    const { data, error } = await supabase
      .from('clients')
      .select('location_id')
      .in('location_id', locationIds)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching client counts:', error);
      return {};
    }

    // Count clients per location
    const counts: Record<string, number> = {};
    locationIds.forEach(id => counts[id] = 0); // Initialize all to 0
    
    if (data) {
      data.forEach((client: any) => {
        if (client.location_id) {
          counts[client.location_id] = (counts[client.location_id] || 0) + 1;
        }
      });
    }

    return counts;
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
    
    // Get client counts for all locations
    if (data && data.length > 0) {
      const locationIds = data.map((loc: any) => loc.id);
      const clientCounts = await this.getClientCountsByLocations(locationIds);
      
      // Merge client counts into location data
      return data.map((location: any) => ({
        ...location,
        client_count: clientCounts[location.id] || 0
      }));
    }
    
    return data || [];
  },

  async createLocation(location: any) {
    console.log('🔍 [createLocation] Received location data:', {
      id: location.id,
      name: location.name,
      program_id: location.program_id
    });
    
    // Remove null/undefined id to ensure we generate a new one
    const cleanLocation = { ...location };
    if (cleanLocation.id === null || cleanLocation.id === undefined || cleanLocation.id === '') {
      delete cleanLocation.id;
      console.log('🔍 [createLocation] Removed null/empty id');
    }
    
    // Always generate UUID for id (required by NOT NULL constraint)
    const generatedId = cleanLocation.id && cleanLocation.id !== null && cleanLocation.id !== '' 
      ? cleanLocation.id 
      : crypto.randomUUID();
    
    console.log('🔍 [createLocation] Generated ID:', generatedId);
    
    // Generate UUID for id if not provided
    const locationData = {
      ...cleanLocation,
      id: generatedId
    };
    
    // Generate code if not provided (required by NOT NULL constraint)
    // This matches the logic in derive_location_code PostgreSQL function
    if (!locationData.code || (typeof locationData.code === 'string' && locationData.code.trim() === '')) {
      if (locationData.name) {
        // First try to extract uppercase letters from name
        let code = locationData.name
          .replace(/[^A-Z]/g, '')
          .toUpperCase();
        
        // If no letters found, try to use numbers (convert to letters: 0=A, 1=B, ..., 9=J)
        if (!code || code.length === 0) {
          // Extract numbers and convert to letters
          const numbers = locationData.name.replace(/[^0-9]/g, '');
          if (numbers && numbers.length > 0) {
            // Take first 3 digits and convert each to a letter (0=A, 1=B, ..., 9=J)
            const digits = numbers.substring(0, 3).padStart(Math.min(3, numbers.length), '0');
            code = digits.split('').map(d => {
              const num = parseInt(d);
              return String.fromCharCode(65 + num); // 0->A, 1->B, ..., 9->J
            }).join('');
            // Ensure we have at least 2 characters (required by constraint)
            if (code.length < 2) {
              code = code.padEnd(2, 'A');
            }
          }
        }
        
        // Take first 2-5 characters based on length
        if (code && code.length >= 3) {
          code = code.substring(0, 3);
        } else if (code && code.length >= 2) {
          code = code.substring(0, 2);
        } else if (!code || code.length === 0) {
          // Final fallback: use first 3 characters of name (uppercase, alphanumeric only)
          code = locationData.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
          if (!code || code.length === 0) {
            code = 'LOC';
          }
        }
        
        locationData.code = code;
        console.log('✅ [createLocation] Generated code:', code, 'from name:', locationData.name);
      } else {
        // Fallback if no name provided
        locationData.code = 'LOC';
        console.log('⚠️ [createLocation] No name provided, using fallback code: LOC');
      }
    } else {
      console.log('✅ [createLocation] Code provided:', locationData.code);
    }
    
    // Ensure code is always set (safety check)
    if (!locationData.code) {
      locationData.code = 'LOC';
      console.log('⚠️ [createLocation] Code was still null after generation, using fallback: LOC');
    }
    
    // Check for duplicate codes and append suffix if needed
    let finalCode = locationData.code;
    let suffix = 1;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop
    
    while (attempts < maxAttempts) {
      // Check if this code already exists for this program
      const { data: existing, error: checkError } = await supabase
        .from('locations')
        .select('id')
        .eq('program_id', locationData.program_id)
        .eq('code', finalCode)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ [createLocation] Error checking for duplicate code:', checkError);
        break;
      }
      
      if (!existing) {
        // Code is available, use it
        locationData.code = finalCode;
        break;
      }
      
      // Code exists, try with suffix
      // Append number suffix (1-9, then A-Z if needed)
      if (suffix <= 9) {
        finalCode = locationData.code.substring(0, Math.min(locationData.code.length, 4)) + suffix.toString();
      } else {
        // Use letter suffix (A-Z) for suffixes 10-35
        const letterSuffix = String.fromCharCode(64 + (suffix - 9)); // A=10, B=11, etc.
        finalCode = locationData.code.substring(0, Math.min(locationData.code.length, 4)) + letterSuffix;
      }
      
      suffix++;
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      // Fallback: use UUID substring as suffix
      const uuidSuffix = generatedId.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
      locationData.code = (locationData.code.substring(0, 2) + uuidSuffix).substring(0, 5);
      console.warn('⚠️ [createLocation] Max attempts reached, using UUID suffix:', locationData.code);
    } else if (suffix > 1) {
      console.log('✅ [createLocation] Resolved duplicate code, using:', locationData.code, 'with suffix');
    }
    
    console.log('🔍 [createLocation] Inserting location with data:', {
      id: locationData.id,
      name: locationData.name,
      code: locationData.code,
      program_id: locationData.program_id
    });
    
    const { data, error } = await supabase.from('locations').insert(locationData).select().single();
    if (error) {
      console.error('❌ [createLocation] Database error:', error);
      throw error;
    }
    console.log('✅ [createLocation] Location created successfully:', data.id);
    return data;
  },

  async updateLocation(id: string, updates: any) {
    // Define allowed fields for locations table
    const allowedFields = [
      'name', 'address', 'phone', 'contact_person', 'description',
      'latitude', 'longitude', 'is_active', 'program_id', 'code', 'updated_at'
    ];
    
    // Filter to only include allowed fields (exclude computed fields like clientCount)
    const updateData: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      } else {
        console.warn(`⚠️ [updateLocation] Ignoring unknown/computed field: ${key}`);
      }
    }
    
    // If code is being set to null/empty/undefined, remove it from updates
    // This preserves the existing code (which is required by NOT NULL constraint)
    if (updateData.code === null || updateData.code === undefined || 
        (typeof updateData.code === 'string' && updateData.code.trim() === '')) {
      delete updateData.code;
      console.log('🔍 [updateLocation] Code was null/empty, preserving existing code');
    }
    
    // If code is being explicitly updated, validate and normalize it
    if (updateData.code && typeof updateData.code === 'string') {
      // Normalize: uppercase, letters only, 2-5 chars
      let code = updateData.code.toUpperCase().replace(/[^A-Z]/g, '');
      
      if (code.length < 2) {
        // Too short - don't allow invalid codes, preserve existing
        console.warn('⚠️ [updateLocation] Code too short, preserving existing code');
        delete updateData.code;
      } else if (code.length > 5) {
        code = code.substring(0, 5);
        updateData.code = code;
      } else {
        updateData.code = code;
      }
    }
    
    const { data, error } = await supabase.from('locations').update(updateData).eq('id', id).select().single();
    if (error) {
      console.error('❌ [updateLocation] Database error:', error);
      throw error;
    }
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
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `);
    if (error) throw error;
    
    // If corporate_clients relationship didn't work, enrich data with corporate client names
    const enrichedData = await Promise.all((data || []).map(async (user: any) => {
      // If user has corporate_client_id but no corporate_clients data, fetch it
      if (user.corporate_client_id && !user.corporate_clients) {
        try {
          const { data: corpClient } = await supabase
            .from('corporate_clients')
            .select('id, name')
            .eq('id', user.corporate_client_id)
            .single();
          if (corpClient) {
            user.corporate_clients = corpClient;
          }
        } catch (err) {
          // Silently fail - corporate client might not exist
          console.warn(`Could not fetch corporate client for user ${user.user_id}:`, err);
        }
      }
      return user;
    }));
    
    return enrichedData;
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
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    
    // If corporate_clients relationship didn't work, enrich data with corporate client name
    if (data && data.corporate_client_id && !data.corporate_clients) {
      try {
        const { data: corpClient } = await supabase
          .from('corporate_clients')
          .select('id, name')
          .eq('id', data.corporate_client_id)
          .single();
        if (corpClient) {
          data.corporate_clients = corpClient;
        }
      } catch (err) {
        // Silently fail - corporate client might not exist
        console.warn(`Could not fetch corporate client for user ${userId}:`, err);
      }
    }
    
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
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `)
      .eq('role', role);
    if (error) throw error;
    
    // Enrich data with corporate client names if relationship didn't work
    const enrichedData = await Promise.all((data || []).map(async (user: any) => {
      if (user.corporate_client_id && !user.corporate_clients) {
        try {
          const { data: corpClient } = await supabase
            .from('corporate_clients')
            .select('id, name')
            .eq('id', user.corporate_client_id)
            .single();
          if (corpClient) {
            user.corporate_clients = corpClient;
          }
        } catch (err) {
          console.warn(`Could not fetch corporate client for user ${user.user_id}:`, err);
        }
      }
      return user;
    }));
    
    return enrichedData;
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
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `)
      .eq('primary_program_id', programId);
    if (error) throw error;
    
    // Enrich data with corporate client names if relationship didn't work
    const enrichedData = await Promise.all((data || []).map(async (user: any) => {
      if (user.corporate_client_id && !user.corporate_clients) {
        try {
          const { data: corpClient } = await supabase
            .from('corporate_clients')
            .select('id, name')
            .eq('id', user.corporate_client_id)
            .single();
          if (corpClient) {
            user.corporate_clients = corpClient;
          }
        } catch (err) {
          console.warn(`Could not fetch corporate client for user ${user.user_id}:`, err);
        }
      }
      return user;
    }));
    
    return enrichedData;
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
          first_name,
          last_name,
          avatar_url,
          phone,
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
    
    // Get latest location for each driver
    // Only show locations for drivers where is_available = true (privacy feature)
    const driversWithLocations = await Promise.all(
      (data || []).map(async (driver) => {
        // Only fetch location if driver is available
        if (driver.is_available !== true) {
          return {
            ...driver,
            latitude: null,
            longitude: null,
            last_location_update: null,
          };
        }
        
        const { data: locationData } = await supabase
          .from('driver_locations')
          .select('latitude, longitude, timestamp')
          .eq('driver_id', driver.id)
          .eq('is_active', true)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();
        
        return {
          ...driver,
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          last_location_update: locationData?.timestamp || null,
        };
      })
    );
    
    return driversWithLocations;
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
          first_name,
          last_name,
          avatar_url,
          phone,
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
          first_name,
          last_name,
          avatar_url,
          phone,
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
          first_name,
          last_name,
          avatar_url,
          phone,
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
    console.log('🔍 [clientsStorage.createClient] Starting client creation');
    console.log('🔍 [clientsStorage.createClient] Input data:', {
      first_name: client.first_name,
      last_name: client.last_name,
      program_id: client.program_id,
      location_id: client.location_id
    });
    
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
    console.log('🔍 [clientsStorage.createClient] Inserting client into database...');
    const { data, error } = await supabase.from('clients').insert(clientData).select().single();
    if (error) {
      console.error('❌ [clientsStorage.createClient] Database insert error:', error);
      throw error;
    }
    console.log('✅ [clientsStorage.createClient] Client inserted successfully:', {
      id: data.id,
      program_id: data.program_id,
      scid: data.scid
    });
    
    // Generate SCID after insertion if program_id is present
    if (data && data.program_id) {
      try {
        console.log('🔍 [createClient] Starting SCID generation for client:', data.id, 'program_id:', data.program_id);
        
        // Fetch program to get its code
        const { data: program, error: programError } = await supabase
          .from('programs')
          .select('code, name')
          .eq('id', data.program_id)
          .single();
        
        if (programError) {
          console.error('❌ [createClient] Could not fetch program code for SCID generation:', programError);
          // Continue without SCID - it can be generated later via backfill
          return data;
        }
        
        console.log('🔍 [createClient] Fetched program:', { code: program?.code, name: program?.name });
        
        // If program code exists, generate SCID
        if (program?.code) {
          // Try calling the PostgreSQL function via RPC wrapper
          // Note: Supabase requires functions to be explicitly exposed as RPCs
          // We use the _rpc suffix wrapper function created in migration 004
          const { data: scidResult, error: scidError } = await supabase.rpc('generate_client_scid_rpc', {
            p_program_code: program.code
          });
          
          if (scidError) {
            console.error('❌ [createClient] RPC call failed:', scidError);
            console.error('❌ [createClient] Error code:', scidError.code);
            console.error('❌ [createClient] Error message:', scidError.message);
            console.error('❌ [createClient] Error details:', JSON.stringify(scidError, null, 2));
            console.warn('⚠️ [createClient] SCID will need to be generated via backfill script');
            console.warn('⚠️ [createClient] Make sure migration 004_create_scid_rpc_wrapper.sql has been run');
            // Continue without SCID - it can be generated later via backfill
            return data;
          }
          
          // RPC succeeded
          console.log('✅ [createClient] Generated SCID via RPC:', scidResult);
          
          // Update client with generated SCID
          // Retry logic: if duplicate, generate a new SCID (up to 3 retries)
          let retryCount = 0;
          const maxRetries = 3;
          let currentSCID = scidResult;
          let updatedClient = null;
          
          while (retryCount < maxRetries) {
            const { data: clientUpdate, error: updateError } = await supabase
              .from('clients')
              .update({ scid: currentSCID })
              .eq('id', data.id)
              .select()
              .single();
            
            if (!updateError) {
              // Success!
              updatedClient = clientUpdate;
              console.log('✅ [createClient] Successfully updated client with SCID:', currentSCID);
              break;
            }
            
            // Check if it's a duplicate key error (code 23505 = unique constraint violation)
            const isDuplicateSCID = updateError.code === '23505' && (
              updateError.message?.includes('scid') || 
              updateError.message?.includes('SCID') ||
              updateError.details?.includes('scid') ||
              updateError.details?.includes('SCID') ||
              updateError.hint?.includes('scid') ||
              updateError.hint?.includes('SCID')
            );
            
            if (isDuplicateSCID) {
              console.warn(`⚠️ [createClient] SCID ${currentSCID} already exists, generating new one... (retry ${retryCount + 1}/${maxRetries})`);
              
              // Generate a new SCID
              const { data: newSCID, error: newSCIDError } = await supabase.rpc('generate_client_scid_rpc', {
                p_program_code: program.code
              });
              
              if (newSCIDError) {
                console.error('❌ [createClient] Failed to generate new SCID after duplicate:', newSCIDError);
                return data; // Give up and return without SCID
              }
              
              console.log(`🔄 [createClient] Generated new SCID for retry: ${newSCID}`);
              currentSCID = newSCID;
              retryCount++;
            } else {
              // Different error - log and give up
              console.error('❌ [createClient] Could not update client with SCID:', updateError);
              console.error('❌ [createClient] Error code:', updateError.code);
              console.error('❌ [createClient] Error message:', updateError.message);
              console.error('❌ [createClient] Error details:', updateError.details);
              return data; // Return original data if update fails
            }
          }
          
          if (!updatedClient) {
            console.error('❌ [createClient] Failed to assign SCID after', maxRetries, 'retries');
            console.warn('⚠️ [createClient] Client created but SCID will need to be generated via backfill script');
            return data; // Return without SCID
          }
          
          return updatedClient;
        } else {
          console.warn('⚠️ [createClient] Program code is missing for program:', program?.name || data.program_id);
          console.warn('⚠️ [createClient] Cannot generate SCID - program may need code backfilled');
          // Continue without SCID - it can be generated later via backfill
          return data;
        }
      } catch (err: any) {
        console.error('❌ [createClient] Exception during SCID generation:', err);
        console.error('❌ [createClient] Error details:', err.message, err.stack);
        // Continue without SCID - it can be generated later via backfill
        return data;
      }
    }
    
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
  },

  /**
   * Merge multiple clients into a primary client
   * Transfers all related data (trips, group memberships) to the primary client
   */
  async mergeClients(primaryClientId: string, secondaryClientIds: string[]) {
    if (!primaryClientId || secondaryClientIds.length === 0) {
      throw new Error('Primary client ID and at least one secondary client ID are required');
    }

    // Verify primary client exists and has SCID
    const { data: primaryClient, error: primaryError } = await supabase
      .from('clients')
      .select('id, scid')
      .eq('id', primaryClientId)
      .single();

    if (primaryError || !primaryClient) {
      throw new Error(`Primary client not found: ${primaryClientId}`);
    }

    if (!primaryClient.scid) {
      throw new Error('Primary client must have a valid SCID to merge');
    }

    // Verify secondary clients exist
    const { data: secondaryClients, error: secondaryError } = await supabase
      .from('clients')
      .select('id')
      .in('id', secondaryClientIds);

    if (secondaryError || !secondaryClients || secondaryClients.length !== secondaryClientIds.length) {
      throw new Error('One or more secondary clients not found');
    }

    // Check for active trips on secondary clients
    const { data: activeTrips, error: activeTripsError } = await supabase
      .from('trips')
      .select('id, status, client_id')
      .in('client_id', secondaryClientIds)
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    if (activeTripsError) {
      throw new Error(`Error checking active trips: ${activeTripsError.message}`);
    }

    if (activeTrips && activeTrips.length > 0) {
      throw new Error(`Cannot merge: ${activeTrips.length} active trip(s) found on secondary clients. Please complete or cancel active trips first.`);
    }

    // Get count of all trips to transfer (for reporting)
    const { count: totalTripsCount, error: countError } = await supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .in('client_id', secondaryClientIds);

    if (countError) {
      throw new Error(`Error counting trips: ${countError.message}`);
    }

    // Transfer trips from secondary clients to primary
    const { error: updateTripsError } = await supabase
      .from('trips')
      .update({ client_id: primaryClientId })
      .in('client_id', secondaryClientIds);

    if (updateTripsError) {
      throw new Error(`Error transferring trips: ${updateTripsError.message}`);
    }

    // Transfer client group memberships
    // First, get all memberships for secondary clients
    const { data: memberships, error: membershipsError } = await supabase
      .from('client_group_memberships')
      .select('group_id, client_id')
      .in('client_id', secondaryClientIds);

    if (membershipsError) {
      throw new Error(`Error fetching group memberships: ${membershipsError.message}`);
    }

    if (memberships && memberships.length > 0) {
      // Get existing memberships for primary client to avoid duplicates
      const { data: existingMemberships, error: existingError } = await supabase
        .from('client_group_memberships')
        .select('group_id')
        .eq('client_id', primaryClientId);

      if (existingError) {
        throw new Error(`Error checking existing memberships: ${existingError.message}`);
      }

      const existingGroupIds = new Set((existingMemberships || []).map(m => m.group_id));

      // Insert new memberships (avoiding duplicates)
      const newMemberships = memberships
        .filter(m => !existingGroupIds.has(m.group_id))
        .map(m => ({
          group_id: m.group_id,
          client_id: primaryClientId,
          joined_at: new Date().toISOString()
        }));

      if (newMemberships.length > 0) {
        const { error: insertError } = await supabase
          .from('client_group_memberships')
          .insert(newMemberships);

        if (insertError) {
          throw new Error(`Error transferring group memberships: ${insertError.message}`);
        }
      }

      // Delete old memberships
      const { error: deleteMembershipsError } = await supabase
        .from('client_group_memberships')
        .delete()
        .in('client_id', secondaryClientIds);

      if (deleteMembershipsError) {
        throw new Error(`Error deleting old memberships: ${deleteMembershipsError.message}`);
      }
    }

    // Merge client data (keep most complete data from primary, fill gaps from secondary)
    // This is handled by keeping primary client as-is since it has SCID

    // Delete secondary clients (soft delete - set is_active to false)
    const { error: deleteError } = await supabase
      .from('clients')
      .update({ is_active: false })
      .in('id', secondaryClientIds);

    if (deleteError) {
      throw new Error(`Error deleting secondary clients: ${deleteError.message}`);
    }

    return {
      success: true,
      primaryClientId,
      mergedCount: secondaryClientIds.length,
      tripsTransferred: totalTripsCount || 0,
      membershipsTransferred: memberships ? memberships.length : 0
    };
  },

  /**
   * Bulk delete clients (soft delete)
   * Checks for active trips before deletion
   */
  async bulkDeleteClients(clientIds: string[]) {
    if (!clientIds || clientIds.length === 0) {
      throw new Error('At least one client ID is required');
    }

    // Check for active trips
    const { data: activeTrips, error: tripsError } = await supabase
      .from('trips')
      .select('id, status, client_id')
      .in('client_id', clientIds)
      .in('status', ['scheduled', 'confirmed', 'in_progress']);

    if (tripsError) {
      throw new Error(`Error checking active trips: ${tripsError.message}`);
    }

    const clientsWithActiveTrips = new Set(
      (activeTrips || []).map(trip => trip.client_id)
    );

    if (clientsWithActiveTrips.size > 0) {
      throw new Error(
        `Cannot delete ${clientsWithActiveTrips.size} client(s) with active trips. ` +
        `Please complete or cancel active trips first.`
      );
    }

    // Soft delete clients
    const { error: deleteError } = await supabase
      .from('clients')
      .update({ is_active: false })
      .in('id', clientIds);

    if (deleteError) {
      throw new Error(`Error deleting clients: ${deleteError.message}`);
    }

    return {
      success: true,
      deletedCount: clientIds.length,
      skippedCount: clientsWithActiveTrips.size
    };
  },

  /**
   * Bulk import clients from CSV/Excel data
   * @param clients Array of client objects to import
   * @param programId Program ID to assign to all imported clients
   * @returns Object with success count, failed count, and errors
   */
  async bulkImportClients(clients: any[], programId: string) {
    console.log(`Attempting to bulk import ${clients.length} clients for program: ${programId}`);

    if (!programId) {
      throw new Error('Program ID is required for bulk import');
    }

    // Validate program exists
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      throw new Error(`Program not found: ${programId}`);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Process clients one by one to capture individual errors
    for (let i = 0; i < clients.length; i++) {
      const clientData = clients[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      try {
        // Validate required fields
        if (!clientData.first_name || !clientData.last_name) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Missing required fields: first_name and last_name are required',
          });
          continue;
        }

        // Prepare client data for insertion
        const insertData: any = {
          first_name: clientData.first_name.trim(),
          last_name: clientData.last_name.trim(),
          program_id: programId,
          is_active: true,
        };

        // Add optional fields if provided
        if (clientData.email) insertData.email = clientData.email.trim();
        if (clientData.phone) insertData.phone = clientData.phone.trim();
        if (clientData.phone_type) insertData.phone_type = clientData.phone_type.trim();
        if (clientData.street_address) insertData.street_address = clientData.street_address.trim();
        if (clientData.city) insertData.city = clientData.city.trim();
        if (clientData.state) insertData.state = clientData.state.trim();
        if (clientData.zip_code) insertData.zip_code = clientData.zip_code.trim();
        if (clientData.date_of_birth) insertData.date_of_birth = clientData.date_of_birth;
        if (clientData.birth_sex) insertData.birth_sex = clientData.birth_sex.trim();
        if (clientData.age) insertData.age = parseInt(clientData.age);
        if (clientData.race) insertData.race = clientData.race.trim();
        if (clientData.emergency_contact_name) insertData.emergency_contact_name = clientData.emergency_contact_name.trim();
        if (clientData.emergency_contact_phone) insertData.emergency_contact_phone = clientData.emergency_contact_phone.trim();

        // Use createClient to leverage SCID generation
        await this.createClient(insertData);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error occurred',
        });
        console.error(`Error importing client at row ${rowNumber}:`, error);
      }
    }

    console.log(`Bulk import completed: ${results.success} successful, ${results.failed} failed`);
    return results;
  },
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
          scid,
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
          reference_id,
          name,
          description
        ),
        created_by_user:created_by (
          user_id,
          user_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name
        )
      `);
    if (error) throw error;
    
    // Transform Supabase response: clients -> client, client_groups -> client_group
    const transformed = (data || []).map((trip: any) => {
      const transformedTrip = { ...trip };
      // Supabase returns 'clients' (plural) but frontend expects 'client' (singular)
      if (trip.clients) {
        transformedTrip.client = Array.isArray(trip.clients) ? trip.clients[0] : trip.clients;
        delete transformedTrip.clients;
      }
      // Supabase returns 'client_groups' (plural) but frontend expects 'client_group' (singular)
      if (trip.client_groups) {
        transformedTrip.client_group = Array.isArray(trip.client_groups) ? trip.client_groups[0] : trip.client_groups;
        delete transformedTrip.client_groups;
      }
      return transformedTrip;
    });
    
    return transformed;
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
          scid,
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
          reference_id,
          name,
          description
        ),
        created_by_user:created_by (
          user_id,
          user_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name
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
          scid,
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
          reference_id,
          name,
          description
        ),
        created_by_user:created_by (
          user_id,
          user_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name
        )
      `)
      .eq('program_id', programId);
    if (error) throw error;
    
    // Transform Supabase response: clients -> client, client_groups -> client_group
    const transformed = (data || []).map((trip: any) => {
      const transformedTrip = { ...trip };
      if (trip.clients) {
        transformedTrip.client = Array.isArray(trip.clients) ? trip.clients[0] : trip.clients;
        delete transformedTrip.clients;
      }
      if (trip.client_groups) {
        transformedTrip.client_group = Array.isArray(trip.client_groups) ? trip.client_groups[0] : trip.client_groups;
        delete transformedTrip.client_groups;
      }
      return transformedTrip;
    });
    
    return transformed;
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
          scid,
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
          reference_id,
          name,
          description
        ),
        created_by_user:created_by (
          user_id,
          user_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name
        )
      `)
      .eq('driver_id', driverId);
    if (error) throw error;
    
    // Transform Supabase response: clients -> client, client_groups -> client_group
    const transformed = (data || []).map((trip: any) => {
      const transformedTrip = { ...trip };
      if (trip.clients) {
        transformedTrip.client = Array.isArray(trip.clients) ? trip.clients[0] : trip.clients;
        delete transformedTrip.clients;
      }
      if (trip.client_groups) {
        transformedTrip.client_group = Array.isArray(trip.client_groups) ? trip.client_groups[0] : trip.client_groups;
        delete transformedTrip.client_groups;
      }
      return transformedTrip;
    });
    
    return transformed;
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
          scid,
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
          reference_id,
          name,
          description
        ),
        created_by_user:created_by (
          user_id,
          user_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name
        )
      `)
      .in('program_id', programIds)
      .order('scheduled_pickup_time', { ascending: true });
    if (error) throw error;
    
    // Transform Supabase response: clients -> client, client_groups -> client_group
    const transformed = (data || []).map((trip: any) => {
      const transformedTrip = { ...trip };
      if (trip.clients) {
        transformedTrip.client = Array.isArray(trip.clients) ? trip.clients[0] : trip.clients;
        delete transformedTrip.clients;
      }
      if (trip.client_groups) {
        transformedTrip.client_group = Array.isArray(trip.client_groups) ? trip.client_groups[0] : trip.client_groups;
        delete transformedTrip.client_groups;
      }
      return transformedTrip;
    });
    
    return transformed;
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
      console.log('🔍 [createTrip] Checking group members for:', {
        client_group_id: trip.client_group_id,
        is_group_trip: trip.is_group_trip,
        program_id: trip.program_id
      });
      
      // First, verify the group exists and get its program_id
      const { data: groupData, error: groupDataError } = await supabase
        .from('client_groups')
        .select('id, name, program_id')
        .eq('id', trip.client_group_id)
        .single();
      
      if (groupDataError) {
        console.error('❌ [createTrip] Error fetching group data:', groupDataError);
        throw new Error(`Client group not found: ${trip.client_group_id}`);
      }
      
      console.log('🔍 [createTrip] Group data:', {
        id: groupData.id,
        name: groupData.name,
        program_id: groupData.program_id,
        trip_program_id: trip.program_id,
        programs_match: groupData.program_id === trip.program_id
      });
      
      // Query memberships - no program filter, just by group ID
      const { data: groupMembers, error: groupError } = await supabase
        .from('client_group_memberships')
        .select('id, client_id, client_group_id')
        .eq('client_group_id', trip.client_group_id);
      
      if (groupError) {
        console.error('❌ [createTrip] Error fetching group members:', groupError);
        throw groupError;
      }
      
      console.log('🔍 [createTrip] Group members query result:', {
        client_group_id: trip.client_group_id,
        groupMembers_count: groupMembers?.length || 0,
        groupMembers: groupMembers
      });
      
      if (!groupMembers || groupMembers.length === 0) {
        console.error('❌ [createTrip] Group has no members - validation failed:', {
          client_group_id: trip.client_group_id,
          group_name: groupData.name,
          group_program_id: groupData.program_id,
          trip_program_id: trip.program_id,
          groupMembers: groupMembers,
          groupMembers_length: groupMembers?.length,
          suggestion: 'Please add clients to this group before creating a trip'
        });
        throw new Error(`Cannot create group trip: Client group "${groupData.name}" has no members. Please add clients to the group first.`);
      }
      
      // Set passenger count to actual group member count for group trips
      trip.passenger_count = groupMembers.length;
      console.log('✅ [createTrip] Group trip validated successfully:', {
        client_group_id: trip.client_group_id,
        group_name: groupData.name,
        passenger_count: trip.passenger_count
      });
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
    
    // Convert stops array to JSONB format if it exists
    if (cleanTrip.stops && Array.isArray(cleanTrip.stops)) {
      // Filter out empty strings and ensure it's a valid array
      const validStops = cleanTrip.stops.filter((stop: string) => stop && stop.trim());
      cleanTrip.stops = validStops.length > 0 ? validStops : [];
    } else if (!cleanTrip.stops) {
      // Default to empty array if stops is not provided
      cleanTrip.stops = [];
    }
    
    // Set created_by and created_at if not already set
    if (!cleanTrip.created_at) {
      cleanTrip.created_at = new Date().toISOString();
    }
    // created_by should be set by the endpoint, but ensure it's not empty
    if (cleanTrip.created_by === '' || cleanTrip.created_by === null) {
      delete cleanTrip.created_by;
    }
    // Set updated_by and updated_at to match created values on initial creation
    if (!cleanTrip.updated_at) {
      cleanTrip.updated_at = cleanTrip.created_at;
    }
    if (!cleanTrip.updated_by && cleanTrip.created_by) {
      cleanTrip.updated_by = cleanTrip.created_by;
    }
    if (cleanTrip.updated_by === '' || cleanTrip.updated_by === null) {
      delete cleanTrip.updated_by;
    }
    
    console.log(`Inserting trip with keys:`, Object.keys(cleanTrip));
    console.log(`client_id in cleanTrip:`, cleanTrip.client_id);
    console.log(`client_group_id in cleanTrip:`, cleanTrip.client_group_id);
    console.log(`stops in cleanTrip:`, cleanTrip.stops);
    
    const { data, error } = await supabase.from('trips').insert(cleanTrip).select().single();
    if (error) {
      console.error(`Database insert error:`, error);
      console.error(`Trip being inserted:`, JSON.stringify(cleanTrip, null, 2));
      throw error;
    }
    
    // Generate reference_id for the trip
    if (data && !data.reference_id) {
      try {
        // Get program code
        const { data: program, error: programError } = await supabase
          .from('programs')
          .select('code')
          .eq('id', data.program_id)
          .single();
        
        if (programError) {
          console.error('❌ [createTrip] Error fetching program for reference_id:', programError);
        } else if (program?.code) {
          // Get trip date from scheduled_pickup_time (use date portion only)
          const tripDate = data.scheduled_pickup_time 
            ? new Date(data.scheduled_pickup_time).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];
          
          console.log('🔍 [createTrip] Generating reference_id:', {
            trip_id: data.id,
            program_code: program.code,
            trip_date: tripDate
          });
          
          // Call RPC function to generate reference_id
          const { data: referenceIdResult, error: referenceIdError } = await supabase.rpc('generate_trip_reference_id_rpc', {
            p_program_code: program.code,
            p_trip_date: tripDate
          });
          
          if (referenceIdError) {
            console.error('❌ [createTrip] RPC call failed:', referenceIdError);
            console.error('❌ [createTrip] Error details:', JSON.stringify(referenceIdError, null, 2));
            // Don't throw - trip was created successfully, just missing reference_id
          } else if (referenceIdResult) {
            // Update trip with reference_id
            const { data: updatedTrip, error: updateError } = await supabase
              .from('trips')
              .update({ reference_id: referenceIdResult })
              .eq('id', data.id)
              .select()
              .single();
            
            if (updateError) {
              console.error('❌ [createTrip] Error updating trip with reference_id:', updateError);
            } else {
              console.log('✅ [createTrip] Generated reference_id:', referenceIdResult, 'for trip:', data.id);
              return updatedTrip;
            }
          }
        } else {
          console.warn('⚠️ [createTrip] Program has no code, skipping reference_id generation:', {
            program_id: data.program_id
          });
        }
      } catch (refIdError) {
        console.error('❌ [createTrip] Error generating reference_id:', refIdError);
        // Don't throw - trip was created successfully, just missing reference_id
      }
    }
    
    return data;
  },

  async updateTrip(id: string, updates: any) {
    // Set updated_at if not already set
    const cleanUpdates = { ...updates };
    if (!cleanUpdates.updated_at) {
      cleanUpdates.updated_at = new Date().toISOString();
    }
    // updated_by should be set by the endpoint, but ensure it's not empty
    if (cleanUpdates.updated_by === '' || cleanUpdates.updated_by === null) {
      delete cleanUpdates.updated_by;
    }
    
    // Always ensure updated_at is set (even if updates don't include it)
    if (!cleanUpdates.updated_at) {
      cleanUpdates.updated_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('trips')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        created_by_user:created_by (
          user_id,
          user_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name
        )
      `)
      .single();
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
        client_group_memberships(id)
      `)
      .eq('is_active', true);
    if (error) throw error;
    
    // Add member_count to each group by counting the memberships array
    const groupsWithCount = (data || []).map(group => {
      const memberCount = Array.isArray(group.client_group_memberships) ? group.client_group_memberships.length : 0;
      
      // Debug logging for specific groups
      if (group.name?.includes('MON SHOP') || group.name?.includes('TUE')) {
        console.log('🔍 [getAllClientGroups] Group:', {
          id: group.id,
          name: group.name,
          program_id: group.program_id,
          memberships_array: group.client_group_memberships,
          memberships_is_array: Array.isArray(group.client_group_memberships),
          memberships_length: Array.isArray(group.client_group_memberships) ? group.client_group_memberships.length : 'not array',
          calculated_member_count: memberCount
        });
      }
      
      return {
        ...group,
        member_count: memberCount
      };
    });
    
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
        client_group_memberships(id)
      `)
      .eq('program_id', programId)
      .eq('is_active', true);
    if (error) throw error;
    
    // Add member_count to each group by counting the memberships array
    const groupsWithCount = (data || []).map(group => {
      const memberCount = Array.isArray(group.client_group_memberships) ? group.client_group_memberships.length : 0;
      
      // Debug logging for specific groups
      if (group.name?.includes('MON SHOP') || group.name?.includes('TUE')) {
        console.log('🔍 [getClientGroupsByProgram] Group:', {
          programId,
          id: group.id,
          name: group.name,
          program_id: group.program_id,
          memberships_array: group.client_group_memberships,
          memberships_is_array: Array.isArray(group.client_group_memberships),
          memberships_length: Array.isArray(group.client_group_memberships) ? group.client_group_memberships.length : 'not array',
          calculated_member_count: memberCount
        });
      }
      
      return {
        ...group,
        member_count: memberCount
      };
    });
    
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
        client_group_memberships(id)
      `)
      .in('program_id', programIds)
      .eq('is_active', true);
    if (error) throw error;
    
    // Add member_count to each group by counting the memberships array
    const groupsWithCount = (data || []).map(group => {
      const memberCount = Array.isArray(group.client_group_memberships) ? group.client_group_memberships.length : 0;
      
      // Debug logging for specific groups
      if (group.name?.includes('MON SHOP') || group.name?.includes('TUE')) {
        console.log('🔍 [getClientGroupsByCorporateClient] Group:', {
          corporateClientId,
          programIds,
          id: group.id,
          name: group.name,
          program_id: group.program_id,
          memberships_array: group.client_group_memberships,
          memberships_is_array: Array.isArray(group.client_group_memberships),
          memberships_length: Array.isArray(group.client_group_memberships) ? group.client_group_memberships.length : 'not array',
          calculated_member_count: memberCount
        });
      }
      
      return {
        ...group,
        member_count: memberCount
      };
    });
    
    return groupsWithCount;
  },

  async createClientGroup(clientGroup: any) {
    console.log('🔍 [createClientGroup] FUNCTION CALLED with:', {
      name: clientGroup?.name,
      program_id: clientGroup?.program_id,
      has_id: !!clientGroup?.id
    });
    
    // Generate a UUID for the client group if not provided
    const groupWithId = {
      ...clientGroup,
      id: clientGroup.id || crypto.randomUUID()
    };
    
    console.log('🔍 [createClientGroup] About to insert group with id:', groupWithId.id);
    
    const { data, error } = await supabase.from('client_groups').insert(groupWithId).select('*').single();
    if (error) {
      console.error('❌ [createClientGroup] Insert error:', error);
      throw error;
    }
    
    console.log('🔍 [createClientGroup] Group inserted, data:', {
      id: data?.id,
      program_id: data?.program_id,
      reference_id: data?.reference_id,
      has_reference_id: !!data?.reference_id
    });
    
    // Generate reference_id after insertion if program_id is present
    if (data && data.program_id && !data.reference_id) {
      try {
        console.log('🔍 [createClientGroup] Starting reference_id generation for group:', data.id, 'program_id:', data.program_id);
        
        // Fetch program to get its code
        const { data: program, error: programError } = await supabase
          .from('programs')
          .select('code, name')
          .eq('id', data.program_id)
          .single();
        
        if (programError) {
          console.error('❌ [createClientGroup] Could not fetch program code for reference_id generation:', programError);
          console.error('❌ [createClientGroup] Program error details:', JSON.stringify(programError, null, 2));
          // Continue without reference_id - it can be generated later via backfill
          return data;
        }
        
        console.log('🔍 [createClientGroup] Fetched program:', { code: program?.code, name: program?.name });
        
        // If program code exists, generate reference_id
        if (program?.code) {
          // First, check if the RPC function exists by trying to call it
          console.log('🔍 [createClientGroup] Attempting to call RPC function with program_code:', program.code);
          
          // Call the PostgreSQL function via RPC wrapper
          const { data: referenceIdResult, error: referenceIdError } = await supabase.rpc('generate_client_group_reference_id_rpc', {
            p_program_code: program.code
          });
          
          if (referenceIdError) {
            console.error('❌ [createClientGroup] RPC call failed:', referenceIdError);
            console.error('❌ [createClientGroup] Error code:', referenceIdError.code);
            console.error('❌ [createClientGroup] Error message:', referenceIdError.message);
            console.error('❌ [createClientGroup] Error details:', JSON.stringify(referenceIdError, null, 2));
            
            // If function doesn't exist (code 42883), log a helpful message
            if (referenceIdError.code === '42883' || referenceIdError.message?.includes('does not exist')) {
              console.error('❌ [createClientGroup] RPC function does not exist. Please run migration 016_add_client_group_reference_id.sql');
            }
            
            // Continue without reference_id - it can be generated later via backfill
            return data;
          }
          
          const newReferenceId = referenceIdResult;
          console.log('✅ [createClientGroup] Generated reference_id:', newReferenceId, 'Type:', typeof newReferenceId);
          
          // Validate that we got a reference_id
          if (!newReferenceId || typeof newReferenceId !== 'string') {
            console.error('❌ [createClientGroup] Invalid reference_id returned from RPC:', newReferenceId, 'Type:', typeof newReferenceId);
            return data; // Return original data if reference_id is invalid
          }
          
          // Update the client group with the generated reference_id
          const { data: updatedData, error: updateError } = await supabase
            .from('client_groups')
            .update({ reference_id: newReferenceId })
            .eq('id', data.id)
            .select()
            .single();
          
          if (updateError) {
            console.error('❌ [createClientGroup] Failed to update group with reference_id:', updateError);
            console.error('❌ [createClientGroup] Update error details:', JSON.stringify(updateError, null, 2));
            return data; // Return original data if update fails
          }
          
          console.log('✅ [createClientGroup] Updated group with reference_id:', updatedData);
          return updatedData;
        } else {
          console.warn('⚠️ [createClientGroup] Program has no code, cannot generate reference_id. Program:', program);
        }
      } catch (error) {
        console.error('❌ [createClientGroup] Unexpected error during reference_id generation:', error);
        console.error('❌ [createClientGroup] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        // Continue without reference_id - it can be generated later via backfill
        return data;
      }
    } else {
      if (data && data.reference_id) {
        console.log('✅ [createClientGroup] Group already has reference_id:', data.reference_id);
      } else if (data && !data.program_id) {
        console.warn('⚠️ [createClientGroup] Group has no program_id, cannot generate reference_id');
      }
    }
    
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
    console.log('🔍 [addClientToGroup] Adding client to group:', {
      groupId,
      clientId
    });
    
    const { data, error } = await supabase
      .from('client_group_memberships')
      .insert({
        id: crypto.randomUUID(),
        client_group_id: groupId,
        client_id: clientId
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ [addClientToGroup] Error adding client to group:', error);
      throw error;
    }
    
    console.log('✅ [addClientToGroup] Client added successfully:', data);
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
// PROGRAM MANAGEMENT STORAGE
// ============================================================================

// Program Licensures Storage
export const programLicensuresStorage = {
  async getLicensuresByProgram(programId: string) {
    const { data, error } = await supabase
      .from('program_licensures')
      .select(`
        *,
        programs:program_id (
          id,
          name
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        ),
        created_by_user:created_by (
          user_id,
          user_name,
          first_name,
          last_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name,
          first_name,
          last_name
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('expiry_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getLicensure(id: string) {
    const { data, error } = await supabase
      .from('program_licensures')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createLicensure(licensure: any, userId: string) {
    const { data, error } = await supabase
      .from('program_licensures')
      .insert({
        ...licensure,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateLicensure(id: string, updates: any, userId: string) {
    const { data, error } = await supabase
      .from('program_licensures')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteLicensure(id: string) {
    const { data, error } = await supabase
      .from('program_licensures')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Staff Certifications Storage
export const staffCertificationsStorage = {
  async getCertificationsByProgram(programId: string) {
    const { data, error } = await supabase
      .from('staff_certifications')
      .select(`
        *,
        programs:program_id (
          id,
          name
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        ),
        staff_member:staff_member_id (
          user_id,
          user_name,
          first_name,
          last_name,
          email
        ),
        created_by_user:created_by (
          user_id,
          user_name,
          first_name,
          last_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name,
          first_name,
          last_name
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('expiry_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getCertification(id: string) {
    const { data, error } = await supabase
      .from('staff_certifications')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createCertification(certification: any, userId: string) {
    const { data, error } = await supabase
      .from('staff_certifications')
      .insert({
        ...certification,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCertification(id: string, updates: any, userId: string) {
    const { data, error } = await supabase
      .from('staff_certifications')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCertification(id: string) {
    const { data, error } = await supabase
      .from('staff_certifications')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Program Forms Storage
export const programFormsStorage = {
  async getFormsByProgram(programId: string) {
    const { data, error } = await supabase
      .from('program_forms')
      .select(`
        *,
        programs:program_id (
          id,
          name
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        ),
        created_by_user:created_by (
          user_id,
          user_name,
          first_name,
          last_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name,
          first_name,
          last_name
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getForm(id: string) {
    const { data, error } = await supabase
      .from('program_forms')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createForm(form: any, userId: string) {
    const { data, error } = await supabase
      .from('program_forms')
      .insert({
        ...form,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateForm(id: string, updates: any, userId: string) {
    const { data, error } = await supabase
      .from('program_forms')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteForm(id: string) {
    const { data, error } = await supabase
      .from('program_forms')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Program Curriculum Storage
export const programCurriculumStorage = {
  async getCurriculumByProgram(programId: string) {
    const { data, error } = await supabase
      .from('program_curriculum')
      .select(`
        *,
        programs:program_id (
          id,
          name
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        ),
        created_by_user:created_by (
          user_id,
          user_name,
          first_name,
          last_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name,
          first_name,
          last_name
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getCurriculumItem(id: string) {
    const { data, error } = await supabase
      .from('program_curriculum')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createCurriculumItem(item: any, userId: string) {
    const { data, error } = await supabase
      .from('program_curriculum')
      .insert({
        ...item,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCurriculumItem(id: string, updates: any, userId: string) {
    const { data, error } = await supabase
      .from('program_curriculum')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCurriculumItem(id: string) {
    const { data, error } = await supabase
      .from('program_curriculum')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Program Onboarding Items Storage
export const programOnboardingItemsStorage = {
  async getOnboardingItemsByProgram(programId: string) {
    const { data, error } = await supabase
      .from('program_onboarding_items')
      .select(`
        *,
        programs:program_id (
          id,
          name
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        ),
        created_by_user:created_by (
          user_id,
          user_name,
          first_name,
          last_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name,
          first_name,
          last_name
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getOnboardingItem(id: string) {
    const { data, error } = await supabase
      .from('program_onboarding_items')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createOnboardingItem(item: any, userId: string) {
    const { data, error } = await supabase
      .from('program_onboarding_items')
      .insert({
        ...item,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateOnboardingItem(id: string, updates: any, userId: string) {
    const { data, error } = await supabase
      .from('program_onboarding_items')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteOnboardingItem(id: string) {
    const { data, error } = await supabase
      .from('program_onboarding_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// TASKS MANAGEMENT
// ============================================================================

export const tasksStorage = {
  async getTasksByProgram(programId: string, filters?: { status?: string; priority?: string }) {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_user:users!fk_tasks_assigned_to (
            user_id,
            user_name,
            first_name,
            last_name,
            email
          ),
          created_by_user:users!fk_tasks_created_by (
            user_id,
            user_name,
            first_name,
            last_name,
            email
          ),
          programs:program_id (
            id,
            name
          ),
          corporate_clients:corporate_client_id (
            id,
            name
          )
        `)
        .eq('program_id', programId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;
      if (error) {
        console.error('❌ Error fetching tasks by program:', error);
        throw error;
      }
      return data || [];
    } catch (error: any) {
      console.error('❌ Error in getTasksByProgram:', error);
      throw error;
    }
  },

  async getTask(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_user:users!fk_tasks_assigned_to (
          user_id,
          user_name,
          first_name,
          last_name,
          email
        ),
        created_by_user:users!fk_tasks_created_by (
          user_id,
          user_name,
          first_name,
          last_name,
          email
        ),
        programs:program_id (
          id,
          name
        ),
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

  async createTask(task: any, userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        assigned_to_user:users!fk_tasks_assigned_to (
          user_id,
          user_name,
          first_name,
          last_name,
          email
        ),
        created_by_user:users!fk_tasks_created_by (
          user_id,
          user_name,
          first_name,
          last_name,
          email
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: any) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        assigned_to_user:users!fk_tasks_assigned_to (
          user_id,
          user_name,
          first_name,
          last_name,
          email
        ),
        created_by_user:users!fk_tasks_created_by (
          user_id,
          user_name,
          first_name,
          last_name,
          email
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTask(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// ============================================================================
// LOCATION ROOM/BED MANAGEMENT
// ============================================================================

export const locationRoomBedsStorage = {
  async getRoomBedsByLocation(locationId: string) {
    const { data, error } = await supabase
      .from('location_room_beds')
      .select(`
        *,
        assigned_client:assigned_client_id (
          id,
          first_name,
          last_name,
          scid
        ),
        locations:location_id (
          id,
          name
        ),
        created_by_user:created_by (
          user_id,
          user_name,
          first_name,
          last_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name,
          first_name,
          last_name
        )
      `)
      .eq('location_id', locationId)
      .eq('is_active', true)
      .order('room_number', { ascending: true })
      .order('bed_number', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getRoomBed(id: string) {
    const { data, error } = await supabase
      .from('location_room_beds')
      .select(`
        *,
        assigned_client:assigned_client_id (
          id,
          first_name,
          last_name,
          scid
        ),
        locations:location_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createRoomBed(roomBed: any, userId: string) {
    const { data, error } = await supabase
      .from('location_room_beds')
      .insert({
        ...roomBed,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        assigned_client:assigned_client_id (
          id,
          first_name,
          last_name,
          scid
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async updateRoomBed(id: string, updates: any, userId: string) {
    const { data, error } = await supabase
      .from('location_room_beds')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        assigned_client:assigned_client_id (
          id,
          first_name,
          last_name,
          scid
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async deleteRoomBed(id: string) {
    const { data, error } = await supabase
      .from('location_room_beds')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async assignClientToBed(bedId: string, clientId: string, userId: string) {
    // First, unassign client from any other bed in the same location
    const bed = await this.getRoomBed(bedId);
    if (!bed) throw new Error('Bed not found');

    // Unassign from other beds in the same location
    await supabase
      .from('location_room_beds')
      .update({ 
        assigned_client_id: null, 
        is_occupied: false,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('location_id', bed.location_id)
      .eq('assigned_client_id', clientId);

    // Update client's room/bed assignment
    await supabase
      .from('clients')
      .update({
        room_number: bed.room_number,
        bed_number: bed.bed_number,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    // Assign client to the bed
    return await this.updateRoomBed(bedId, {
      assigned_client_id: clientId,
      is_occupied: true
    }, userId);
  },

  async unassignClientFromBed(bedId: string, userId: string) {
    const bed = await this.getRoomBed(bedId);
    if (!bed) throw new Error('Bed not found');

    if (bed.assigned_client_id) {
      // Remove room/bed assignment from client
      await supabase
        .from('clients')
        .update({
          room_number: null,
          bed_number: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', bed.assigned_client_id);
    }

    // Unassign from bed
    return await this.updateRoomBed(bedId, {
      assigned_client_id: null,
      is_occupied: false
    }, userId);
  },

  async getAvailableBeds(locationId: string) {
    const { data, error } = await supabase
      .from('location_room_beds')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true)
      .eq('is_occupied', false)
      .order('room_number', { ascending: true })
      .order('bed_number', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getOccupiedBeds(locationId: string) {
    const { data, error } = await supabase
      .from('location_room_beds')
      .select(`
        *,
        assigned_client:assigned_client_id (
          id,
          first_name,
          last_name,
          scid
        )
      `)
      .eq('location_id', locationId)
      .eq('is_active', true)
      .eq('is_occupied', true)
      .order('room_number', { ascending: true })
      .order('bed_number', { ascending: true });
    if (error) throw error;
    return data || [];
  }
};

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