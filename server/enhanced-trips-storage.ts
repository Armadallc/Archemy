/**
 * Enhanced Trips Storage for New Architectural Blueprint
 * 
 * Manages trips with categories, recurring patterns, group trips, and advanced features
 */
import { supabase } from './db';

export interface EnhancedTrip {
  id: string;
  program_id: string;
  pickup_location_id?: string;
  dropoff_location_id?: string;
  client_id: string; // May be empty string for group trips
  driver_id?: string;
  trip_type: 'one_way' | 'round_trip';
  pickup_address: string;
  dropoff_address: string;
  stops?: string[]; // Array of intermediate stop addresses (max 8)
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
  actual_return_time?: string;
  passenger_count: number;
  special_requirements?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  trip_category_id?: string;
  recurring_trip_id?: string;
  recurring_pattern?: any; // JSONB
  recurring_end_date?: string;
  client_group_id?: string;
  is_group_trip: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data
  program?: {
    id: string;
    name: string;
    corporate_client_id: string;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
  pickup_location?: {
    id: string;
    name: string;
    address: string;
  };
  dropoff_location?: {
    id: string;
    name: string;
    address: string;
  };
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
  };
  driver?: {
    id: string;
    user_id: string;
    users?: {
      user_name: string;
      email: string;
    };
  };
  trip_category?: {
    id: string;
    name: string;
    description?: string;
  };
  client_group?: {
    id: string;
    name: string;
    description?: string;
  };
}

export const enhancedTripsStorage = {
  async getAllTrips() {
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
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          reference_id,
          name,
          description
        )
      `)
      .order('scheduled_pickup_time', { ascending: true });
    
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
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          reference_id,
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
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          reference_id,
          name,
          description
        )
      `)
      .eq('program_id', programId)
      .order('scheduled_pickup_time', { ascending: true });
    
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
        client_groups:client_group_id (
          id,
          reference_id,
          name,
          description
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        )
      `)
      .eq('driver_id', driverId)
      .order('scheduled_pickup_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getTripsByCategory(categoryId: string) {
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
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          reference_id,
          name,
          description
        )
      `)
      .eq('trip_category_id', categoryId)
      .order('scheduled_pickup_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getGroupTrips(programId: string) {
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
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          reference_id,
          name,
          description
        )
      `)
      .eq('program_id', programId)
      .eq('is_group_trip', true)
      .order('scheduled_pickup_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getRecurringTrips(programId: string) {
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
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          reference_id,
          name,
          description
        )
      `)
      .eq('program_id', programId)
      .not('recurring_trip_id', 'is', null)
      .order('scheduled_pickup_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createTrip(trip: Omit<EnhancedTrip, 'id' | 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString();
    const insertData: any = {
      ...trip,
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: now,
      updated_at: now
    };
    
    // Set updated_by to match created_by on initial creation
    if (insertData.created_by && !insertData.updated_by) {
      insertData.updated_by = insertData.created_by;
    }
    
    const { data, error } = await supabase
      .from('trips')
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTrip(id: string, updates: Partial<EnhancedTrip>) {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTrip(id: string) {
    const { data, error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return data;
  },

  // Create recurring trip series
  async createRecurringTripSeries(trip: Omit<EnhancedTrip, 'id' | 'created_at' | 'updated_at'>, pattern: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days_of_week?: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']
    interval?: number; // e.g., 2 for bi-weekly
    end_date?: string;
  }) {
    // Log incoming trip to debug UUID issues
    console.log('🔍 createRecurringTripSeries called with trip:', {
      has_client_id: 'client_id' in trip,
      client_id_value: (trip as any).client_id,
      client_id_type: typeof (trip as any).client_id,
      has_client_group_id: 'client_group_id' in trip,
      client_group_id_value: (trip as any).client_group_id,
      is_group_trip: (trip as any).is_group_trip,
      trip_keys: Object.keys(trip)
    });
    
    // Remove client_id immediately if it's empty/null/undefined or if it's a group trip
    const cleanTrip: any = { ...trip };
    if (cleanTrip.is_group_trip || cleanTrip.client_group_id || !cleanTrip.client_id || cleanTrip.client_id === '' || cleanTrip.client_id === null || cleanTrip.client_id === undefined) {
      delete cleanTrip.client_id;
      console.log('🔍 Removed client_id from trip (group trip or empty)');
    }
    
    const recurringTripId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trips = [];
    
    // Map day names to numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    // Generate trips based on pattern
    const startDate = new Date(cleanTrip.scheduled_pickup_time);
    const endDate = new Date(cleanTrip.recurring_end_date || pattern.end_date || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)); // 30 days default
    
    let currentDate = new Date(startDate);
    const maxIterations = 1000; // Safety limit
    let iterations = 0;
    
    while (currentDate <= endDate && iterations < maxIterations) {
      iterations++;
      
      // For weekly patterns, check if current day matches days_of_week
      if (pattern.frequency === 'weekly' && pattern.days_of_week && pattern.days_of_week.length > 0) {
        const currentDayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        if (!pattern.days_of_week.includes(currentDayName)) {
          // Skip to next day if current day doesn't match pattern
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
      }
      
      // Create trip for this occurrence
      // Use cleanTrip instead of trip to ensure client_id is already removed
      const newTrip: any = {
        ...cleanTrip,
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scheduled_pickup_time: currentDate.toISOString(),
        scheduled_return_time: cleanTrip.scheduled_return_time ? new Date(currentDate.getTime() + (new Date(cleanTrip.scheduled_return_time).getTime() - startDate.getTime())).toISOString() : undefined,
        recurring_trip_id: recurringTripId,
        recurring_pattern: pattern,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Double-check: remove client_id if it somehow got included (shouldn't happen since we use cleanTrip)
      if (cleanTrip.is_group_trip || cleanTrip.client_group_id || !newTrip.client_id || newTrip.client_id === '' || newTrip.client_id === null || newTrip.client_id === undefined) {
        delete newTrip.client_id;
      }
      
      trips.push(newTrip);
      
      // Move to next occurrence based on pattern
      if (pattern.frequency === 'daily') {
        const interval = pattern.interval || 1;
        currentDate.setDate(currentDate.getDate() + interval);
      } else if (pattern.frequency === 'weekly') {
        if (pattern.days_of_week && pattern.days_of_week.length > 0) {
          // Find next matching day
          let found = false;
          for (let i = 0; i < 7; i++) {
            currentDate.setDate(currentDate.getDate() + 1);
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
            if (pattern.days_of_week.includes(dayName)) {
              found = true;
              break;
            }
          }
          if (!found) {
            // If no more days in this week, move to next week
            const interval = pattern.interval || 1;
            currentDate.setDate(currentDate.getDate() + (7 * interval - 7));
          }
        } else {
          // No days_of_week specified, use interval
          const interval = pattern.interval || 1;
          currentDate.setDate(currentDate.getDate() + (7 * interval));
        }
      } else if (pattern.frequency === 'monthly') {
        const interval = pattern.interval || 1;
        currentDate.setMonth(currentDate.getMonth() + interval);
      }
    }
    
    if (trips.length === 0) {
      throw new Error('No trips generated from recurring pattern. Check pattern configuration.');
    }
    
    // Use tripsStorage.createTrip for each trip to handle group trip validation properly
    // This ensures group trips are handled the same way as regular trips
    const { tripsStorage } = await import('./minimal-supabase');
    const createdTrips = [];
    
    for (const trip of trips) {
      try {
        // Log trip data before creation to debug UUID issues
        console.log(`Creating trip ${trips.indexOf(trip) + 1}/${trips.length}:`, {
          has_client_id: !!trip.client_id,
          client_id_value: trip.client_id,
          client_id_type: typeof trip.client_id,
          has_client_group_id: !!trip.client_group_id,
          client_group_id_value: trip.client_group_id,
          is_group_trip: trip.is_group_trip,
          program_id: trip.program_id
        });
        
        const createdTrip = await tripsStorage.createTrip(trip);
        createdTrips.push(createdTrip);
      } catch (error: any) {
        console.error(`Error creating trip in series:`, error);
        console.error(`Trip data (full):`, JSON.stringify(trip, null, 2));
        console.error(`Trip keys:`, Object.keys(trip));
        console.error(`Trip.client_id:`, trip.client_id, `(type: ${typeof trip.client_id})`);
        console.error(`Trip.client_group_id:`, trip.client_group_id, `(type: ${typeof trip.client_group_id})`);
        throw new Error(`Failed to create trip in recurring series: ${error.message}`);
      }
    }
    
    return createdTrips;
  },

  // Update trip status with validation and automatic timestamp tracking
  async updateTripStatus(
    id: string, 
    status: EnhancedTrip['status'], 
    actualTimes?: {
      pickup?: string;
      dropoff?: string;
      return?: string;
    },
    options?: {
      userId?: string;
      skipValidation?: boolean;
      skipTimestampAutoSet?: boolean;
    }
  ) {
    console.log('🔍 updateTripStatus called:', { id, status, actualTimes, options });
    
    // First, get the current trip to validate transition and get trip details
    const { data: currentTrip, error: fetchError } = await supabase
      .from('trips')
      .select('status, trip_type, pickup_address, dropoff_address, driver_id, estimated_distance_miles, actual_pickup_time, actual_dropoff_time, actual_return_time')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching current trip:', fetchError);
      throw fetchError;
    }
    if (!currentTrip) {
      console.error(`❌ Trip with id ${id} not found`);
      throw new Error(`Trip with id ${id} not found`);
    }
    
    console.log('✅ Current trip found:', { currentStatus: currentTrip.status, tripType: currentTrip.trip_type });

    // Validate status transition unless explicitly skipped
    if (!options?.skipValidation) {
      const { validateStatusTransition, getTimestampForStatusChange } = await import('./trip-status-validator');
      const validation = validateStatusTransition(
        currentTrip.status as any,
        status as any
      );

      if (!validation.isValid) {
        throw new Error(`Invalid status transition: ${validation.reason}`);
      }

      // Auto-set timestamps based on status change (unless explicitly disabled or manually provided)
      if (!options?.skipTimestampAutoSet) {
        const timestampHints = getTimestampForStatusChange(
          currentTrip.status as any,
          status as any
        );

        const now = new Date().toISOString();

        // Only auto-set if not manually provided
        if (timestampHints.shouldSetPickupTime && !actualTimes?.pickup) {
          if (!actualTimes) actualTimes = {};
          actualTimes.pickup = now;
        }

        if (timestampHints.shouldSetDropoffTime && !actualTimes?.dropoff) {
          if (!actualTimes) actualTimes = {};
          actualTimes.dropoff = now;
        }

        // For round trips, set return time when dropoff is set
        if (timestampHints.shouldSetDropoffTime && 
            currentTrip.trip_type === 'round_trip' && 
            !actualTimes?.return && 
            !actualTimes?.dropoff) {
          if (!actualTimes) actualTimes = {};
          actualTimes.return = now;
        }
      }
    }

    // Build update object
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    // Set timestamps (manual takes precedence over auto-set)
    if (actualTimes?.pickup) updates.actual_pickup_time = actualTimes.pickup;
    if (actualTimes?.dropoff) updates.actual_dropoff_time = actualTimes.dropoff;
    if (actualTimes?.return) updates.actual_return_time = actualTimes.return;
    
    // Handle mileage calculation
    const { estimateTripMileage, calculateRoundTripMileage, calculateActualTripMileage } = await import('./services/mileage-service');
    
    // When trip starts (in_progress), calculate estimated mileage if not already set
    if (status === 'in_progress' && !currentTrip.estimated_distance_miles && currentTrip.pickup_address && currentTrip.dropoff_address) {
      try {
        const estimatedMileage = currentTrip.trip_type === 'round_trip'
          ? await calculateRoundTripMileage(currentTrip.pickup_address, currentTrip.dropoff_address)
          : await estimateTripMileage(currentTrip.pickup_address, currentTrip.dropoff_address);
        
        if (estimatedMileage !== null) {
          updates.estimated_distance_miles = estimatedMileage;
          console.log('📏 Estimated mileage calculated:', estimatedMileage, 'miles');
        }
      } catch (error) {
        console.warn('⚠️ Could not calculate estimated mileage:', error);
        // Don't fail the trip status update if mileage calculation fails
      }
    }
    
    // When trip completes, calculate actual mileage from location tracking
    if (status === 'completed' && currentTrip.driver_id) {
      try {
        const tripStartTime = actualTimes?.pickup || currentTrip.actual_pickup_time || updates.actual_pickup_time;
        const tripEndTime = currentTrip.trip_type === 'round_trip' 
          ? (actualTimes?.return || currentTrip.actual_return_time || updates.actual_return_time)
          : (actualTimes?.dropoff || currentTrip.actual_dropoff_time || updates.actual_dropoff_time);
        
        if (tripStartTime && tripEndTime) {
          const actualMileage = await calculateActualTripMileage(
            id,
            currentTrip.driver_id,
            tripStartTime,
            tripEndTime
          );
          
          if (actualMileage !== null) {
            updates.actual_distance_miles = actualMileage;
            console.log('📏 Actual mileage calculated:', actualMileage, 'miles');
          } else {
            console.warn('⚠️ Could not calculate actual mileage - insufficient location data');
          }
        } else {
          console.warn('⚠️ Could not calculate actual mileage - missing trip start/end times');
        }
      } catch (error) {
        console.warn('⚠️ Could not calculate actual mileage:', error);
        // Don't fail the trip status update if mileage calculation fails
      }
    }
    
    // Update the trip
    console.log('🔍 Updating trip with:', updates);
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating trip in database:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('✅ Trip updated successfully:', data?.id);

    // Log status change to trip_status_logs table (if it exists)
    // Schema: id, trip_id, driver_id, status, actual_times, timestamp, created_at
    try {
      await supabase
        .from('trip_status_logs')
        .insert({
          id: `status_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          trip_id: id,
          driver_id: data.driver_id || null,
          status: status, // Current status (new status)
          actual_times: actualTimes || null,
          timestamp: new Date().toISOString()
          // created_at is auto-set by database
        });
    } catch (logError) {
      // If trip_status_logs table doesn't exist or insert fails, just log a warning
      console.warn('⚠️ Could not log status change to trip_status_logs:', logError);
      // Don't throw - status update should succeed even if logging fails
    }

    return data;
  }
};


