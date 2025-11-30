/**
 * Frequent Locations Storage
 * 
 * Handles all database operations for the frequent_locations table
 * with proper RLS enforcement and hierarchy support.
 */

import { createClient } from '@supabase/supabase-js';
import { FrequentLocation, InsertFrequentLocation } from '../shared/schema';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface FrequentLocationFilters {
  corporate_client_id?: string;
  program_id?: string;
  location_id?: string;
  location_type?: string;
  tag?: string;
  is_service_location?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface FrequentLocationWithRelations extends FrequentLocation {
  corporate_clients?: {
    id: string;
    name: string;
  };
  programs?: {
    id: string;
    name: string;
  };
  locations?: {
    id: string;
    name: string;
  };
}

/**
 * Get all frequent locations with optional filtering
 */
export async function getFrequentLocations(filters: FrequentLocationFilters = {}): Promise<FrequentLocationWithRelations[]> {
  try {
    let query = supabase
      .from('frequent_locations')
      .select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        ),
        programs:program_id (
          id,
          name
        ),
        locations:location_id (
          id,
          name
        )
      `)
      .order('usage_count', { ascending: false });

    // Apply filters
    if (filters.corporate_client_id) {
      query = query.eq('corporate_client_id', filters.corporate_client_id);
    }
    if (filters.program_id) {
      query = query.eq('program_id', filters.program_id);
    }
    if (filters.location_id) {
      query = query.eq('location_id', filters.location_id);
    }
    if (filters.location_type) {
      query = query.eq('location_type', filters.location_type);
    }
    if (filters.tag) {
      query = query.eq('tag', filters.tag);
    }
    if (filters.is_service_location !== undefined) {
      query = query.eq('is_service_location', filters.is_service_location);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,full_address.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching frequent locations:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFrequentLocations:', error);
    throw error;
  }
}

/**
 * Get frequent locations by ID
 */
export async function getFrequentLocationById(id: string): Promise<FrequentLocationWithRelations | null> {
  try {
    const { data, error } = await supabase
      .from('frequent_locations')
      .select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        ),
        programs:program_id (
          id,
          name
        ),
        locations:location_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching frequent location by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getFrequentLocationById:', error);
    throw error;
  }
}

/**
 * Create a new frequent location
 */
export async function createFrequentLocation(data: InsertFrequentLocation): Promise<FrequentLocation> {
  try {
    // Build insert data, explicitly ensuring location_type is set
    const insertData: any = {};
    
    // Copy all fields from data
    Object.keys(data).forEach(key => {
      if (key !== 'location_type') {
        insertData[key] = (data as any)[key];
      }
    });
    
    // Explicitly set location_type - this MUST be included to override database default
    if (data.location_type !== undefined && data.location_type !== null) {
      insertData.location_type = data.location_type;
      console.log('🔍 Explicitly setting location_type to:', data.location_type);
    } else {
      insertData.location_type = 'other';
      console.log('🔍 No location_type provided, defaulting to "other"');
    }
    
    console.log('🔍 Inserting frequent location with data:', JSON.stringify(insertData, null, 2));
    console.log('🔍 Insert data location_type:', insertData.location_type);
    
    const { data: result, error } = await supabase
      .from('frequent_locations')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating frequent location:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Created frequent location result:', JSON.stringify(result, null, 2));
    console.log('✅ Created location_type value:', result.location_type);
    
    // Verify the location_type was saved correctly
    if (data.location_type && result.location_type !== data.location_type) {
      console.error('⚠️ WARNING: location_type mismatch on create!', {
        expected: data.location_type,
        actual: result.location_type
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error in createFrequentLocation:', error);
    throw error;
  }
}

/**
 * Update a frequent location
 */
export async function updateFrequentLocation(id: string, updates: Partial<InsertFrequentLocation>): Promise<FrequentLocation> {
  try {
    // Build update data, explicitly including location_type if provided
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Copy all update fields, but explicitly handle location_type
    Object.keys(updates).forEach(key => {
      if (key !== 'updated_at') {
        updateData[key] = (updates as any)[key];
      }
    });
    
    // Explicitly ensure location_type is set if provided
    if (updates.location_type !== undefined && updates.location_type !== null) {
      updateData.location_type = updates.location_type;
      console.log('🔍 Explicitly setting location_type to:', updates.location_type);
    }
    
    console.log('🔍 Updating frequent location in database:', { 
      id, 
      updateData: JSON.stringify(updateData, null, 2),
      location_type: updateData.location_type 
    });
    
    const { data, error } = await supabase
      .from('frequent_locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating frequent location:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Updated frequent location from database:', JSON.stringify(data, null, 2));
    console.log('✅ Updated location_type value:', data.location_type);
    
    // Verify the update worked
    if (updates.location_type && data.location_type !== updates.location_type) {
      console.error('⚠️ WARNING: location_type update may have failed!', {
        expected: updates.location_type,
        actual: data.location_type
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error in updateFrequentLocation:', error);
    throw error;
  }
}

/**
 * Delete a frequent location
 */
export async function deleteFrequentLocation(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('frequent_locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting frequent location:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFrequentLocation:', error);
    throw error;
  }
}

/**
 * Increment usage count for a frequent location
 */
export async function incrementUsageCount(id: string): Promise<FrequentLocation> {
  try {
    // First get the current usage count
    const { data: currentData, error: fetchError } = await supabase
      .from('frequent_locations')
      .select('usage_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current usage count:', fetchError);
      throw fetchError;
    }

    // Then update with incremented value
    const { data, error } = await supabase
      .from('frequent_locations')
      .update({
        usage_count: (currentData.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in incrementUsageCount:', error);
    throw error;
  }
}

/**
 * Get frequent locations by program for trip creation
 */
export async function getFrequentLocationsForProgram(programId: string, locationType?: string): Promise<FrequentLocation[]> {
  try {
    let query = supabase
      .from('frequent_locations')
      .select('*')
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (locationType) {
      query = query.eq('location_type', locationType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching frequent locations for program:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFrequentLocationsForProgram:', error);
    throw error;
  }
}

/**
 * Get frequent locations by corporate client
 */
export async function getFrequentLocationsForCorporateClient(corporateClientId: string, locationType?: string): Promise<FrequentLocation[]> {
  try {
    let query = supabase
      .from('frequent_locations')
      .select('*')
      .eq('corporate_client_id', corporateClientId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (locationType) {
      query = query.eq('location_type', locationType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching frequent locations for corporate client:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFrequentLocationsForCorporateClient:', error);
    throw error;
  }
}

/**
 * Get frequent locations organized by location_type for hierarchical display
 */
export async function getFrequentLocationsByTag(filters: FrequentLocationFilters = {}): Promise<Record<string, FrequentLocation[]>> {
  try {
    const locations = await getFrequentLocations(filters);
    
    console.log('🔍 getFrequentLocationsByTag: Received locations:', locations.length);
    // Log location types for debugging (only first 10 to avoid spam)
    const locationTypes = locations.slice(0, 10).map(l => ({ id: l.id, name: l.name, location_type: l.location_type }));
    console.log('🔍 getFrequentLocationsByTag: Sample location types (first 10):', locationTypes);
    
    // Group by location_type (previously grouped by tag, but tag field was removed)
    const grouped = locations.reduce((acc, location) => {
      const locationType = location.location_type || 'other';
      if (!acc[locationType]) {
        acc[locationType] = [];
      }
      acc[locationType].push(location);
      return acc;
    }, {} as Record<string, FrequentLocation[]>);

    console.log('🔍 getFrequentLocationsByTag: Grouped result keys:', Object.keys(grouped));
    console.log('🔍 getFrequentLocationsByTag: Grouped result counts:', Object.entries(grouped).map(([key, locs]) => ({ [key]: locs.length })));

    // Sort within each group by most recent update (recency)
    Object.keys(grouped).forEach(locationType => {
      grouped[locationType].sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at as unknown as string).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at as unknown as string).getTime() : 0;
        return bTime - aTime;
      });
    });

    return grouped;
  } catch (error) {
    console.error('Error in getFrequentLocationsByTag:', error);
    throw error;
  }
}

/**
 * Sync service locations to frequent locations
 */
export async function syncServiceLocationToFrequent(location: any): Promise<FrequentLocation | null> {
  try {
    // Check if already exists
    const { data: existing, error: checkError } = await supabase
      .from('frequent_locations')
      .select('id')
      .eq('name', location.name)
      .eq('program_id', location.program_id)
      .eq('is_service_location', true)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing service location:', checkError);
      throw checkError;
    }

    if (existing) {
      console.log(`Service location ${location.name} already synced`);
      return null;
    }

    // Parse address components
    const addressParts = location.address.split(',').map((part: string) => part.trim());
    
    const frequentLocationData = {
      name: location.name,
      full_address: location.address,
      street_address: addressParts[0] || '',
      city: addressParts[1] || '',
      state: addressParts[2] || '',
      zip_code: addressParts[3] || '',
      program_id: location.program_id,
      tag: 'service_location',
      is_service_location: true,
      auto_synced: true,
      usage_count: 0,
      priority: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('frequent_locations')
      .insert(frequentLocationData)
      .select()
      .single();
    
    if (error) {
      console.error('Error syncing service location:', error);
      throw error;
    }

    console.log(`✅ Synced service location: ${location.name}`);
    return data;
  } catch (error) {
    console.error('Error in syncServiceLocationToFrequent:', error);
    throw error;
  }
}

/**
 * Get all service locations from frequent locations
 */
export async function getServiceLocations(filters: FrequentLocationFilters = {}): Promise<FrequentLocation[]> {
  try {
    return await getFrequentLocations({
      ...filters,
      is_service_location: true
    });
  } catch (error) {
    console.error('Error in getServiceLocations:', error);
    throw error;
  }
}

/**
 * Get frequent destinations (non-service locations) organized by location_type
 */
export async function getFrequentDestinationsByTag(filters: FrequentLocationFilters = {}): Promise<Record<string, FrequentLocation[]>> {
  try {
    const destinations = await getFrequentLocations({
      ...filters,
      is_service_location: false
    });
    
    // Group by location_type (previously grouped by tag, but tag field was removed)
    const grouped = destinations.reduce((acc, location) => {
      const locationType = location.location_type || 'other';
      if (!acc[locationType]) {
        acc[locationType] = [];
      }
      acc[locationType].push(location);
      return acc;
    }, {} as Record<string, FrequentLocation[]>);

    // Sort within each group by most recent update (recency)
    Object.keys(grouped).forEach(locationType => {
      grouped[locationType].sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at as unknown as string).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at as unknown as string).getTime() : 0;
        return bTime - aTime;
      });
    });

    return grouped;
  } catch (error) {
    console.error('Error in getFrequentDestinationsByTag:', error);
    throw error;
  }
}

/**
 * Sync all service locations to frequent locations
 */
export async function syncServiceLocationsToFrequent(): Promise<FrequentLocation[]> {
  try {
    console.log('🔍 Starting sync of service locations to frequent locations');
    
    // Get all active service locations from the locations table
    const { data: serviceLocations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true);

    if (locationsError) {
      throw new Error(`Failed to fetch service locations: ${locationsError.message}`);
    }

    if (!serviceLocations || serviceLocations.length === 0) {
      console.log('🔍 No service locations found to sync');
      return [];
    }

    console.log(`🔍 Found ${serviceLocations.length} service locations to sync`);

    // Get existing frequent service locations to avoid duplicates
    const { data: existingFrequentServiceLocations, error: existingError } = await supabase
      .from('frequent_locations')
      .select('location_id')
      .eq('is_service_location', true);

    if (existingError) {
      throw new Error(`Failed to fetch existing frequent service locations: ${existingError.message}`);
    }

    const existingLocationIds = existingFrequentServiceLocations?.map(fl => fl.location_id) || [];
    console.log(`🔍 Found ${existingLocationIds.length} existing frequent service locations`);

    // Filter out locations that are already synced
    const locationsToSync = serviceLocations.filter(sl => !existingLocationIds.includes(sl.id));
    console.log(`🔍 ${locationsToSync.length} new service locations to sync`);

    if (locationsToSync.length === 0) {
      console.log('🔍 No new service locations to sync');
      return [];
    }

    // Prepare data for insertion
    const locationsToInsert = locationsToSync.map(sl => {
      // Parse address components
      const addressParts = sl.address.split(',');
      const streetAddress = addressParts[0]?.trim() || '';
      const city = addressParts[1]?.trim() || '';
      const stateZip = addressParts[2]?.trim() || '';
      const state = stateZip.split(' ')[0]?.trim() || '';
      const zipCode = stateZip.split(' ')[1]?.trim() || '';

      return {
        id: `fl_sync_${sl.id}`, // Prefix to distinguish synced locations
        corporate_client_id: sl.corporate_client_id,
        program_id: sl.program_id,
        location_id: sl.id, // Link to the original location
        name: sl.name,
        description: sl.description,
        street_address: streetAddress,
        city: city,
        state: state,
        zip_code: zipCode,
        full_address: sl.address,
        location_type: 'facility' as const, // Use 'facility' due to constraint
        usage_count: 0,
        is_active: true,
        tag: 'service_location' as const, // Tag as 'service_location'
        is_service_location: true,
        priority: 1, // Higher priority for service locations
        auto_synced: true,
      };
    });

    // Insert the new frequent locations
    const { data: insertedLocations, error: insertError } = await supabase
      .from('frequent_locations')
      .insert(locationsToInsert)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert frequent locations: ${insertError.message}`);
    }

    console.log(`✅ Successfully synced ${insertedLocations?.length || 0} service locations to frequent locations`);
    return insertedLocations || [];
  } catch (error) {
    console.error('Error in syncServiceLocationsToFrequent:', error);
    throw error;
  }
}
