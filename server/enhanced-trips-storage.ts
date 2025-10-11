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
  client_id: string;
  driver_id?: string;
  trip_type: 'one_way' | 'round_trip';
  pickup_address: string;
  dropoff_address: string;
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
        clients:client_id (
          id,
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
        clients:client_id (
          id,
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
        clients:client_id (
          id,
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
        clients:client_id (
          id,
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
        clients:client_id (
          id,
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
        clients:client_id (
          id,
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
        clients:client_id (
          id,
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
    const { data, error } = await supabase
      .from('trips')
      .insert({
        ...trip,
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTrip(id: string, updates: Partial<EnhancedTrip>) {
    const { data, error } = await supabase
      .from('trips')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
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
  async createRecurringTripSeries(trip: Omit<EnhancedTrip, 'id' | 'created_at' | 'updated_at'>, pattern: any) {
    const recurringTripId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trips = [];
    
    // Generate trips based on pattern
    const startDate = new Date(trip.scheduled_pickup_time);
    const endDate = new Date(trip.recurring_end_date || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)); // 30 days default
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const newTrip = {
        ...trip,
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scheduled_pickup_time: currentDate.toISOString(),
        scheduled_return_time: trip.scheduled_return_time ? new Date(currentDate.getTime() + (new Date(trip.scheduled_return_time).getTime() - startDate.getTime())).toISOString() : undefined,
        recurring_trip_id: recurringTripId,
        recurring_pattern: pattern,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      trips.push(newTrip);
      
      // Move to next occurrence based on pattern
      if (pattern.frequency === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (pattern.frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (pattern.frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    const { data, error } = await supabase
      .from('trips')
      .insert(trips)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Update trip status
  async updateTripStatus(id: string, status: EnhancedTrip['status'], actualTimes?: {
    pickup?: string;
    dropoff?: string;
    return?: string;
  }) {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (actualTimes?.pickup) updates.actual_pickup_time = actualTimes.pickup;
    if (actualTimes?.dropoff) updates.actual_dropoff_time = actualTimes.dropoff;
    if (actualTimes?.return) updates.actual_return_time = actualTimes.return;
    
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};


