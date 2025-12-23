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
  trip_type?: string;
  client_group_id?: string;
  client_group_name?: string;
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
      // First get the driver record
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (driverError) {
        console.error('❌ [Mobile API] Error fetching driver:', driverError);
        throw driverError;
      }

      if (!driver) {
        throw new Error(`Driver not found: ${driverId}`);
      }

      // Then get user data separately (more reliable than join)
      let userData: { user_name?: string; email?: string; avatar_url?: string } = {};
      if (driver.user_id) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('user_name, email, avatar_url')
          .eq('user_id', driver.user_id)
          .single();
        
        if (!userError && user) {
          userData = user;
        } else {
          console.warn('⚠️ [Mobile API] Could not fetch user data:', userError);
        }
      }

      // Get vehicle data if assigned
      let vehicleData: any = null;
      if (driver.current_vehicle_id) {
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id, make, model, year, license_plate, color')
          .eq('id', driver.current_vehicle_id)
          .single();
        
        if (!vehicleError && vehicle) {
          vehicleData = vehicle;
        }
      }

      const currentStatus = await driverSchedulesStorage.getCurrentDutyStatus(driverId);
      // Call method - executes at runtime, so circular reference is fine
      const lastLocation = await mobileApi.getLastLocation(driverId);

      return {
        id: driver.id,
        user_id: driver.user_id,
        user_name: userData.user_name || 'Unknown',
        email: userData.email || '',
        phone: driver.phone,
        avatar_url: userData.avatar_url,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        emergency_contact: driver.emergency_contact,
        vehicle_assignment: vehicleData ? {
          id: vehicleData.id,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          license_plate: vehicleData.license_plate,
          color: vehicleData.color
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

      return await Promise.all(trips.map(async trip => {
        // Get client group name if it's a group trip
        let clientGroupName: string | undefined = undefined;
        if (trip.is_group_trip && trip.client_group_id) {
          try {
            // Debug: Log what we have
            console.log('🔍 [Mobile API] Processing group trip:', {
              trip_id: trip.id,
              client_group_id: trip.client_group_id,
              client_groups_type: typeof trip.client_groups,
              client_groups_value: trip.client_groups,
              is_array: Array.isArray(trip.client_groups),
              has_client_groups: !!trip.client_groups
            });
            
            // Check if client_groups is already populated from the query
            // Supabase returns it as an object (not array) for single relations
            // But it might be null if the relation doesn't exist
            const group = trip.client_groups as any;
            
            // Handle different possible structures
            let groupFromRelation = null;
            if (Array.isArray(group) && group.length > 0) {
              groupFromRelation = group[0];
            } else if (group && typeof group === 'object' && !Array.isArray(group)) {
              groupFromRelation = group;
            }
            
            if (groupFromRelation?.name) {
              clientGroupName = groupFromRelation.name;
              console.log('✅ [Mobile API] Found group name from trip.client_groups:', groupFromRelation.name);
            } else {
              // Fallback: query the group directly if not in trip data
              console.log('⚠️ [Mobile API] Group not in trip data, querying directly for:', trip.client_group_id);
              const { data: groupData, error: groupError } = await supabase
                .from('client_groups')
                .select('id, name')
                .eq('id', trip.client_group_id)
                .single();
              
              if (!groupError && groupData?.name) {
                clientGroupName = groupData.name;
                console.log('✅ [Mobile API] Fetched group name directly:', groupData.name);
              } else {
                console.error('❌ [Mobile API] Error fetching group:', groupError || 'No data returned');
                // Last resort: use a placeholder that indicates it's a group
                clientGroupName = `Group ${trip.client_group_id.slice(0, 8)}`;
                console.warn('⚠️ [Mobile API] Using fallback group name:', clientGroupName);
              }
            }
          } catch (error) {
            console.error('❌ [Mobile API] Error getting client group name:', error);
            // Last resort fallback
            if (trip.client_group_id) {
              clientGroupName = `Group ${trip.client_group_id.slice(0, 8)}`;
            }
          }
        }
        
        // Ensure client_name is set correctly for group trips and individual trips
        let finalClientName: string;
        if (trip.is_group_trip && clientGroupName) {
          finalClientName = clientGroupName;
        } else if (trip.is_group_trip) {
          finalClientName = 'Group Trip'; // Fallback if we couldn't get the name
        } else {
          // For individual trips, use client name
          let clientFirstName = trip.client?.first_name || '';
          let clientLastName = trip.client?.last_name || '';
          
          // If client relation wasn't loaded, query it directly
          if (!trip.client && trip.client_id) {
            try {
              const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id, first_name, last_name, phone, address')
                .eq('id', trip.client_id)
                .single();
              
              if (!clientError && clientData) {
                clientFirstName = clientData.first_name || '';
                clientLastName = clientData.last_name || '';
                // Update trip.client for use below
                (trip as any).client = clientData;
                console.log('✅ [Mobile API] Fetched client directly:', {
                  trip_id: trip.id,
                  client_id: trip.client_id,
                  client_name: `${clientFirstName} ${clientLastName}`.trim()
                });
              } else {
                console.log('⚠️ [Mobile API] Could not fetch client:', clientError);
              }
            } catch (error) {
              console.error('❌ [Mobile API] Error fetching client:', error);
            }
          }
          
          const clientFullName = `${clientFirstName} ${clientLastName}`.trim();
          finalClientName = clientFullName || 'Unknown Client';
          
          // Debug log for individual trips
          if (process.env.NODE_ENV !== 'production') {
            if (!clientFullName) {
              console.log('⚠️ [Mobile API] Individual trip with no client name:', {
                trip_id: trip.id,
                client_id: trip.client_id,
                has_client: !!trip.client,
                client_data: trip.client
              });
            } else {
              console.log('✅ [Mobile API] Individual trip client name:', {
                trip_id: trip.id,
                client_id: trip.client_id,
                client_name: clientFullName,
                has_client: !!trip.client
              });
            }
          }
        }
        
        // Ensure clients field is populated for individual trips (needed by mobile app)
        let clientsField;
        if (trip.client) {
          clientsField = {
            first_name: trip.client.first_name || '',
            last_name: trip.client.last_name || '',
            phone: trip.client.phone || ''
          };
        } else if (!trip.is_group_trip && finalClientName && finalClientName !== 'Unknown Client') {
          // Fallback: parse client_name if client relation wasn't loaded
          const nameParts = finalClientName.trim().split(/\s+/);
          clientsField = {
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            phone: ''
          };
        }

        return {
          id: trip.id,
          client_name: finalClientName,
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
            color: getCategoryColor(trip.trip_category?.name || 'Personal')
          },
          client: {
            id: trip.client_id,
            first_name: trip.client?.first_name || '',
            last_name: trip.client?.last_name || '',
            phone: trip.client?.phone,
            address: trip.client?.address
          },
          clients: clientsField,
          pickup_location: trip.pickup_location ? {
            name: trip.pickup_location.name,
            address: trip.pickup_location.address
          } : undefined,
          dropoff_location: trip.dropoff_location ? {
            name: trip.dropoff_location.name,
            address: trip.dropoff_location.address
          } : undefined,
          is_group_trip: trip.is_group_trip,
          trip_type: trip.trip_type || (trip.scheduled_return_time ? 'round_trip' : 'one_way'),
          client_group_id: trip.client_group_id,
          client_group_name: clientGroupName,
          group_members: trip.is_group_trip && trip.client_group_id ? await getGroupMembersHelper(trip.client_group_id) : undefined
        };
      }));
    } catch (error) {
      console.error('❌ [Mobile API] Error in getDriverTrips:', error);
      console.error('❌ [Mobile API] Error type:', typeof error);
      console.error('❌ [Mobile API] Error name:', error instanceof Error ? error.name : 'N/A');
      console.error('❌ [Mobile API] Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ [Mobile API] Error stack:', error instanceof Error ? error.stack : 'N/A');
      if (error instanceof Error && 'code' in error) {
        console.error('❌ [Mobile API] Error code:', (error as any).code);
      }
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
    tripId?: string;
  }) {
    try {
      // If tripId is provided, verify the driver is assigned to that trip
      let tripId = location.tripId;
      if (tripId) {
        const { data: trip, error: tripError } = await supabase
          .from('trips')
          .select('id, driver_id, status')
          .eq('id', tripId)
          .eq('driver_id', driverId)
          .single();
        
        if (tripError || !trip) {
          console.warn('⚠️ Trip ID provided but driver not assigned to trip, ignoring trip_id');
          tripId = undefined;
        } else if (trip.status !== 'in_progress') {
          // Only link location to trip if trip is in progress
          console.warn('⚠️ Trip is not in_progress, not linking location to trip');
          tripId = undefined;
        }
      }
      
      // If no tripId provided but driver has an active trip, try to find it
      if (!tripId) {
        const { data: activeTrip } = await supabase
          .from('trips')
          .select('id')
          .eq('driver_id', driverId)
          .eq('status', 'in_progress')
          .order('scheduled_pickup_time', { ascending: false })
          .limit(1)
          .single();
        
        if (activeTrip) {
          tripId = activeTrip.id;
          console.log('🔗 Auto-linked location update to active trip:', tripId);
        }
      }
      
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
          trip_id: tripId || null,
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
        await mobileApi.updateDriverLocation(driverId, {
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
      // Call methods - these execute at runtime so circular reference is fine
      const profile = await mobileApi.getDriverProfile(driverId);
      const trips = await mobileApi.getDriverTrips(driverId);
      const pendingUpdates = await mobileApi.getPendingUpdates(driverId);

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
              await mobileApi.updateTripStatus(update.data.tripId, update.data.status, update.data.actualTimes, driverId);
              break;
            case 'location':
              await mobileApi.updateDriverLocation(driverId, update.data);
              break;
            case 'duty_status':
              await mobileApi.updateDutyStatus(driverId, update.data.status, update.data.location, update.data.notes);
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
    return getCategoryColor(category);
  }
};

// Helper functions (defined outside to avoid circular references)
function getCategoryColor(category: string): string {
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

async function getGroupMembersHelper(clientGroupId?: string) {
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
}
