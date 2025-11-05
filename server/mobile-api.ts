/**
 * Mobile API for Driver Experience
 * 
 * Provides mobile-optimized endpoints for drivers including:
 * - GPS location tracking
 * - Offline capability
 * - Push notifications
 * - Trip management
 * - Profile management
 */
import { supabase } from './db';
import { enhancedTripsStorage } from './enhanced-trips-storage';
import { driverSchedulesStorage } from './driver-schedules-storage';
import { vehiclesStorage } from './vehicles-storage';

export interface DriverLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  address?: string;
  is_active: boolean;
}

export interface MobileTrip {
  id: string;
  client_name: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  status: string;
  passenger_count: number;
  special_requirements?: string;
  notes?: string;
  trip_category: {
    name: string;
    color: string;
  };
  client: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
  };
  pickup_location?: {
    name: string;
    address: string;
  };
  dropoff_location?: {
    name: string;
    address: string;
  };
  is_group_trip: boolean;
  group_members?: Array<{
    id: string;
    name: string;
    phone?: string;
  }>;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  user_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  license_number?: string;
  license_expiry?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  vehicle_assignment?: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    color: string;
  };
  current_status: 'off_duty' | 'on_duty' | 'on_trip' | 'break' | 'unavailable';
  last_location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export interface OfflineData {
  trips: MobileTrip[];
  profile: DriverProfile;
  last_sync: string;
  pending_updates: Array<{
    id: string;
    type: 'trip_status' | 'location' | 'duty_status';
    data: any;
    timestamp: string;
  }>;
}

export const mobileApi = {
  // Driver authentication and profile
  async getDriverProfile(driverId: string): Promise<DriverProfile> {
    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select(`
          *,
          users:user_id (
            user_name,
            email,
            avatar_url
          ),
          vehicles:current_vehicle_id (
            id,
            make,
            model,
            year,
            license_plate,
            color
          )
        `)
        .eq('id', driverId)
        .single();

      if (error) throw error;

      const currentStatus = await driverSchedulesStorage.getCurrentDutyStatus(driverId);
      const lastLocation = await this.getLastLocation(driverId);

      return {
        id: driver.id,
        user_id: driver.user_id,
        user_name: driver.users?.user_name || 'Unknown',
        email: driver.users?.email || '',
        phone: driver.phone,
        avatar_url: driver.users?.avatar_url,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        emergency_contact: driver.emergency_contact,
        vehicle_assignment: driver.vehicles ? {
          id: driver.vehicles.id,
          make: driver.vehicles.make,
          model: driver.vehicles.model,
          year: driver.vehicles.year,
          license_plate: driver.vehicles.license_plate,
          color: driver.vehicles.color
        } : undefined,
        current_status: currentStatus?.status || 'off_duty',
        last_location: lastLocation || undefined
      };
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      throw error;
    }
  },

  // Update driver profile
  async updateDriverProfile(driverId: string, updates: Partial<DriverProfile>) {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({
          phone: updates.phone,
          license_number: updates.license_number,
          license_expiry: updates.license_expiry,
          emergency_contact: updates.emergency_contact,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating driver profile:', error);
      throw error;
    }
  },

  // Get driver's trips for mobile
  async getDriverTrips(driverId: string, date?: string): Promise<MobileTrip[]> {
    try {
      let trips;
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        trips = await enhancedTripsStorage.getTripsByDriver(driverId);
        trips = trips.filter(trip => {
          const tripDate = new Date(trip.scheduled_pickup_time);
          return tripDate >= startOfDay && tripDate <= endOfDay;
        });
      } else {
        trips = await enhancedTripsStorage.getTripsByDriver(driverId);
      }

      return await Promise.all(trips.map(async trip => ({
        id: trip.id,
        client_name: `${trip.client?.first_name || ''} ${trip.client?.last_name || ''}`.trim(),
        pickup_address: trip.pickup_address,
        dropoff_address: trip.dropoff_address,
        scheduled_pickup_time: trip.scheduled_pickup_time,
        scheduled_return_time: trip.scheduled_return_time,
        status: trip.status,
        passenger_count: trip.passenger_count,
        special_requirements: trip.special_requirements,
        notes: trip.notes,
        trip_category: {
          name: trip.trip_category?.name || 'Personal',
          color: this.getCategoryColor(trip.trip_category?.name || 'Personal')
        },
        client: {
          id: trip.client_id,
          first_name: trip.client?.first_name || '',
          last_name: trip.client?.last_name || '',
          phone: trip.client?.phone,
          address: trip.client?.address
        },
        pickup_location: trip.pickup_location ? {
          name: trip.pickup_location.name,
          address: trip.pickup_location.address
        } : undefined,
        dropoff_location: trip.dropoff_location ? {
          name: trip.dropoff_location.name,
          address: trip.dropoff_location.address
        } : undefined,
        is_group_trip: trip.is_group_trip,
        group_members: trip.is_group_trip ? await this.getGroupMembers(trip.client_group_id) : undefined
      })));
    } catch (error) {
      console.error('Error fetching driver trips:', error);
      throw error;
    }
  },

  // Update trip status from mobile
  async updateTripStatus(
    tripId: string, 
    status: string, 
    actualTimes?: {
      pickup?: string;
      dropoff?: string;
      return?: string;
    }, 
    driverId?: string,
    userId?: string
  ) {
    try {
      // Use validated status update (validation happens inside updateTripStatus)
      // Status logging also happens inside updateTripStatus, but we keep the mobile-specific logic
      const trip = await enhancedTripsStorage.updateTripStatus(
        tripId, 
        status as any, 
        actualTimes,
        {
          userId: userId || driverId, // Use provided userId or fallback to driverId
          skipValidation: false,
          skipTimestampAutoSet: false
        }
      );

      return trip;
    } catch (error) {
      console.error('Error updating trip status:', error);
      throw error;
    }
  },

  // Location tracking
  async updateDriverLocation(driverId: string, location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading?: number;
    speed?: number;
    address?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .insert({
          id: `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          driver_id: driverId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          heading: location.heading,
          speed: location.speed,
          address: location.address,
          timestamp: new Date().toISOString(),
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  },

  // Get last known location
  async getLastLocation(driverId: string) {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, timestamp')
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching last location:', error);
      return null;
    }
  },

  // Update duty status
  async updateDutyStatus(driverId: string, status: string, location?: {
    latitude: number;
    longitude: number;
    address?: string;
  }, notes?: string) {
    try {
      const dutyStatus = await driverSchedulesStorage.updateDutyStatus(
        driverId, 
        status as any, 
        location, 
        notes
      );

      // If going on duty, start location tracking
      if (status === 'on_duty' && location) {
        await this.updateDriverLocation(driverId, {
          ...location,
          accuracy: 10 // Default accuracy for duty status location
        });
      }

      return dutyStatus;
    } catch (error) {
      console.error('Error updating duty status:', error);
      throw error;
    }
  },

  // Offline data sync
  async getOfflineData(driverId: string): Promise<OfflineData> {
    try {
      const profile = await this.getDriverProfile(driverId);
      const trips = await this.getDriverTrips(driverId);
      
      // Get pending updates from offline storage
      const pendingUpdates = await this.getPendingUpdates(driverId);

      return {
        trips,
        profile,
        last_sync: new Date().toISOString(),
        pending_updates: pendingUpdates
      };
    } catch (error) {
      console.error('Error getting offline data:', error);
      throw error;
    }
  },

  // Sync pending updates when back online
  async syncPendingUpdates(driverId: string, updates: Array<{
    id: string;
    type: 'trip_status' | 'location' | 'duty_status';
    data: any;
    timestamp: string;
  }>) {
    try {
      const results = [];

      for (const update of updates) {
        try {
          switch (update.type) {
            case 'trip_status':
              await this.updateTripStatus(update.data.tripId, update.data.status, update.data.actualTimes, driverId);
              break;
            case 'location':
              await this.updateDriverLocation(driverId, update.data);
              break;
            case 'duty_status':
              await this.updateDutyStatus(driverId, update.data.status, update.data.location, update.data.notes);
              break;
          }
          results.push({ id: update.id, success: true });
        } catch (error) {
          results.push({ id: update.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      return results;
    } catch (error) {
      console.error('Error syncing pending updates:', error);
      throw error;
    }
  },

  // Helper methods
  async getGroupMembers(clientGroupId?: string) {
    if (!clientGroupId) return [];

    try {
      const { data, error } = await supabase
        .from('client_group_memberships')
        .select(`
          clients:client_id (
            id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('client_group_id', clientGroupId);

      if (error) throw error;

      return data?.map((membership: any) => ({
        id: membership.clients?.id || '',
        name: `${membership.clients?.first_name || ''} ${membership.clients?.last_name || ''}`.trim(),
        phone: membership.clients?.phone
      })) || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  },

  async getPendingUpdates(driverId: string) {
    try {
      const { data, error } = await supabase
        .from('offline_updates')
        .select('*')
        .eq('driver_id', driverId)
        .eq('synced', false)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending updates:', error);
      return [];
    }
  },

  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'Medical': '#3B82F6',
      'Legal': '#EF4444',
      'Personal': '#10B981',
      'Program': '#8B5CF6',
      '12-Step': '#F59E0B',
      'Group': '#06B6D4',
      'Staff': '#6B7280',
      'Carpool': '#84CC16'
    };
    return colorMap[category] || '#6B7280';
  }
};
