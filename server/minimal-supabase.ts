/**
 * PERMANENT CODING RULES - NEVER DEVIATE:
 * 
 * 1. DATABASE FIELD MAPPING RULE:
 *    - ALWAYS use snake_case field names from database
 *    - user.user_id NOT user.userId
 *    - user.primary_organization_id NOT user.primaryOrganizationId
 * 
 * 2. VALIDATION ENFORCEMENT:
 *    - Always validate database results before session storage
 *    - Check that user.user_id exists before using it
 * 
 * 3. RETURN VALUE CONSISTENCY:
 *    - Return snake_case field names to match database schema
 *    - Never convert to camelCase for consistency
 * 
 * "DATABASE SCHEMA IS SOURCE OF TRUTH - NEVER CONVERT TO CAMELCASE"
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uocnesirsirwakbkzcei.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvY25lc2lyc2lyd2FrYmt6Y2VpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTYwODcyNywiZXhwIjoyMDY1MTg0NzI3fQ.HzzQowBTzHRL_yUpxs7hKK1G2GWv3zoPN56kJf7p_BU';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Simple storage functions that work with your existing database
// Enhanced permission system methods
async function setupPermissionTables() {
  try {
    // Create permission tables via upsert (creates if not exists)
    await supabase.from('role_permissions').upsert([
      { role: 'super_admin', permission: 'VIEW_TRIPS', resource: '*', organization_id: null }
    ]);
    
    await supabase.from('feature_flags').upsert([
      { flag_name: 'MOBILE_APP_ACCESS', is_enabled: true, organization_id: null }
    ]);
    
    console.log('✅ Enhanced permission system activated');
  } catch (error) {
    console.log('📋 Permission tables may not exist yet, continuing with basic permissions');
  }
}

// Initialize permissions on startup
setupPermissionTables();

export const storage = {
  async getAllOrganizations() {
    const { data, error } = await supabase.from('organizations').select('*');
    if (error) throw error;
    return data || [];
  },

  async getOrganization(id: string) {
    const { data, error } = await supabase.from('organizations').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getServiceAreasByOrganization(organizationId: string) {
    const { data, error } = await supabase.from('service_areas').select('*').eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },

  async getServiceArea(id: string) {
    const { data, error } = await supabase.from('service_areas').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getClientsByOrganization(organizationId: string) {
    const { data, error } = await supabase.from('clients').select('*').eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },

  async getClientGroupsByOrganization(organizationId: string) {
    const { data, error } = await supabase.from('client_groups').select('*').eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },

  async getDriversByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        users:user_id (
          user_name,
          email
        )
      `)
      .eq('primary_organization_id', organizationId);
    
    if (error) throw error;
    
    // Remove duplicates and keep snake_case convention
    const uniqueDrivers = new Map();
    (data || []).forEach(driver => {
      const key = driver.user_id;
      if (!uniqueDrivers.has(key) || new Date(driver.created_at) > new Date(uniqueDrivers.get(key).created_at)) {
        uniqueDrivers.set(key, {
          id: driver.id,
          user_id: driver.user_id,
          user_name: driver.users?.user_name || 'Unknown Driver',
          email: driver.users?.email || null,
          primary_organization_id: driver.primary_organization_id,
          license_number: driver.license_number,
          vehicle_info: driver.vehicle_info,
          phone: driver.phone,
          emergency_contact: driver.emergency_contact,
          emergency_phone: driver.emergency_phone,
          is_active: driver.is_active,
          is_available: driver.is_available,
          created_at: driver.created_at,
          updated_at: driver.updated_at
        });
      }
    });
    
    return Array.from(uniqueDrivers.values());
  },

  async getTripsByOrganization(organizationId: string) {
    let query = supabase
      .from('trips')
      .select(`
        *,
        clients:client_id (
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          user_id,
          users:user_id (
            user_name,
            email
          )
        )
      `);
    
    // If organizationId is "all", don't filter by organization
    if (organizationId !== "all") {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Return data in original snake_case format from database
    return data || [];
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase.from('users').select('*').ilike('email', email).single();
    if (error && error.code !== 'PGRST116') throw error;
    
    // Return snake_case field names to match database schema
    if (data) {
      return {
        user_id: data.user_id,
        user_name: data.user_name,
        email: data.email,
        password_hash: data.password_hash,
        role: data.role,
        primary_organization_id: data.primary_organization_id,
        authorized_organizations: data.authorized_organizations,
        is_active: data.is_active,
        avatar_url: data.avatar_url,
        billing_pin: data.billing_pin,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    }
    return data;
  },

  async createOrganization(org: any) {
    const { data, error } = await supabase.from('organizations').insert(org).select().single();
    if (error) throw error;
    return data;
  },

  async createServiceArea(area: any) {
    const { data, error } = await supabase.from('service_areas').insert(area).select().single();
    if (error) throw error;
    return data;
  },

  async updateServiceArea(id: string, updates: any) {
    const { data, error } = await supabase.from('service_areas').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteServiceArea(id: string) {
    const { error } = await supabase.from('service_areas').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async createClient(client: any) {
    // Convert camelCase to snake_case for database insertion
    const dbClient = {
      id: client.id || `client_${Date.now()}`,
      organization_id: client.organizationId,
      service_area_id: client.serviceAreaId,
      first_name: client.firstName,
      last_name: client.lastName,
      phone: client.phone,
      email: client.email,
      address: client.address,
      emergency_contact: client.emergencyContact,
      emergency_phone: client.emergencyPhone,
      medical_notes: client.medicalNotes,
      mobility_requirements: client.mobilityRequirements,
      is_active: client.isActive !== undefined ? client.isActive : true
    };
    
    const { data, error } = await supabase.from('clients').insert(dbClient).select().single();
    if (error) throw error;
    
    // Return mapped camelCase data
    return {
      id: data.id,
      organizationId: data.organization_id,
      serviceAreaId: data.service_area_id,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      emergencyContact: data.emergency_contact,
      emergencyPhone: data.emergency_phone,
      medicalNotes: data.medical_notes,
      mobilityRequirements: data.mobility_requirements,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async getDriver(id: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        users:user_id (
          user_name,
          email
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      // Add user_name directly to driver object for backward compatibility
      return {
        ...data,
        user_name: data.users?.user_name || null
      };
    }
    
    return data;
  },



  async createDriver(driver: any) {
    // Convert camelCase to snake_case for database insertion
    const dbDriver = {
      id: driver.id || `driver_${Date.now()}`,
      user_id: driver.userId,
      license_number: driver.licenseNumber,
      vehicle_info: driver.vehicleInfo,
      primary_organization_id: driver.primaryOrganizationId,
      is_active: driver.isActive !== undefined ? driver.isActive : true
    };
    
    const { data, error } = await supabase.from('drivers').insert(dbDriver).select().single();
    if (error) throw error;
    return data;
  },

  async updateDriver(id: string, updates: any) {
    const { data, error } = await supabase.from('drivers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async createTrip(trip: any) {
    console.log("🚗 Creating trip in storage with data:", trip);
    
    // Convert camelCase to snake_case for database insertion
    const dbTrip = {
      id: trip.id || `trip_${Date.now()}`,
      organization_id: trip.organization_id || trip.organizationId,
      client_id: trip.client_id || trip.clientId,
      driver_id: trip.driver_id || trip.driverId || null,
      trip_type: trip.trip_type || trip.tripType,
      pickup_address: trip.pickup_address || trip.pickupAddress,
      dropoff_address: trip.dropoff_address || trip.dropoffAddress,
      scheduled_pickup_time: trip.scheduled_pickup_time || trip.scheduledPickupTime,
      scheduled_return_time: trip.scheduled_return_time || trip.scheduledReturnTime || null,
      actual_pickup_time: trip.actual_pickup_time || trip.actualPickupTime || null,
      actual_dropoff_time: trip.actual_dropoff_time || trip.actualDropoffTime || null,
      actual_return_time: trip.actual_return_time || trip.actualReturnTime || null,
      passenger_count: trip.passenger_count || trip.passengerCount || 1,
      special_requirements: trip.special_requirements || trip.specialRequirements || null,
      status: trip.status || 'scheduled',
      notes: trip.notes || null,
      created_at: trip.created_at || new Date().toISOString(),
      updated_at: trip.updated_at || new Date().toISOString()
    };
    
    console.log("🚗 Database trip object:", dbTrip);
    
    const { data, error } = await supabase.from('trips').insert(dbTrip).select().single();
    if (error) {
      console.error("❌ Database insertion error:", error);
      throw error;
    }
    console.log("✅ Trip created successfully:", data);
    return data;
  },

  async createUser(user: any) {
    // Convert camelCase to snake_case for database insertion
    const dbUser = {
      user_id: user.userId,
      user_name: user.userName,
      email: user.email,
      password_hash: user.passwordHash,
      role: user.role,
      primary_organization_id: user.primaryOrganizationId,
      authorized_organizations: user.authorizedOrganizations,
      is_active: user.isActive !== undefined ? user.isActive : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Creating user with data:", dbUser);
    const { data, error } = await supabase.from('users').insert(dbUser).select().single();
    if (error) {
      console.error("User creation error:", error);
      throw error;
    }
    console.log("User created successfully:", data);
    
    // Transform back to camelCase for return
    return {
      userId: data.user_id,
      userName: data.user_name,
      email: data.email,
      passwordHash: data.password_hash,
      role: data.role,
      primaryOrganizationId: data.primary_organization_id,
      authorizedOrganizations: data.authorized_organizations,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  // Additional functions needed by routes
  async getUser(userId: string) {
    const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    
    // Return snake_case field names to match database schema
    if (data) {
      return {
        user_id: data.user_id,
        user_name: data.user_name,
        email: data.email,
        password_hash: data.password_hash,
        role: data.role,
        primary_organization_id: data.primary_organization_id,
        authorized_organizations: data.authorized_organizations,
        is_active: data.is_active,
        avatar_url: data.avatar_url,
        billing_pin: data.billing_pin,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    }
    return data;
  },

  async getClient(id: string) {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },



  async getClientGroup(id: string) {
    const { data, error } = await supabase.from('client_groups').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createClientGroup(clientGroup: any) {
    const { data, error } = await supabase.from('client_groups').insert(clientGroup).select().single();
    if (error) throw error;
    return data;
  },

  async updateClientGroup(id: string, updates: any) {
    const { data, error } = await supabase.from('client_groups').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteClientGroup(id: string) {
    const { error } = await supabase.from('client_groups').delete().eq('id', id);
    if (error) throw error;
  },

  async getClientsByGroup(groupId: string) {
    const { data, error } = await supabase.from('client_group_memberships').select('client_id').eq('group_id', groupId);
    if (error) throw error;
    if (!data || data.length === 0) return [];
    
    const clientIds = data.map(m => m.client_id);
    const { data: clients, error: clientsError } = await supabase.from('clients').select('*').in('id', clientIds);
    if (clientsError) throw clientsError;
    return clients || [];
  },

  async addClientToGroup(clientId: string, groupId: string) {
    const { data, error } = await supabase.from('client_group_memberships').insert({ client_id: clientId, group_id: groupId }).select().single();
    if (error) throw error;
    return data;
  },

  async removeClientFromGroup(clientId: string, groupId: string) {
    const { error } = await supabase.from('client_group_memberships').delete().eq('client_id', clientId).eq('group_id', groupId);
    if (error) throw error;
  },

  async getGroupsByClient(clientId: string) {
    const { data, error } = await supabase.from('client_group_memberships').select('group_id').eq('client_id', clientId);
    if (error) throw error;
    if (!data || data.length === 0) return [];
    
    const groupIds = data.map(m => m.group_id);
    const { data: groups, error: groupsError } = await supabase.from('client_groups').select('*').in('id', groupIds);
    if (groupsError) throw groupsError;
    return groups || [];
  },

  async updateClient(id: string, updates: any) {
    // Convert camelCase to snake_case for database update
    const dbUpdates: any = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.serviceAreaId !== undefined) dbUpdates.service_area_id = updates.serviceAreaId;
    if (updates.emergencyContact !== undefined) dbUpdates.emergency_contact = updates.emergencyContact;
    if (updates.emergencyPhone !== undefined) dbUpdates.emergency_phone = updates.emergencyPhone;
    if (updates.medicalNotes !== undefined) dbUpdates.medical_notes = updates.medicalNotes;
    if (updates.mobilityRequirements !== undefined) dbUpdates.mobility_requirements = updates.mobilityRequirements;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    
    const { data, error } = await supabase.from('clients').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    
    // Return mapped camelCase data
    return {
      id: data.id,
      organizationId: data.organization_id,
      serviceAreaId: data.service_area_id,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      emergencyContact: data.emergency_contact,
      emergencyPhone: data.emergency_phone,
      medicalNotes: data.medical_notes,
      mobilityRequirements: data.mobility_requirements,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async deleteClient(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  async getFrequentLocationsByOrganization(organizationId: string) {
    const { data, error } = await supabase.from('frequent_locations').select('*').eq('organization_id', organizationId);
    if (error) throw error;
    return data || [];
  },

  async createFrequentLocation(location: any) {
    const { data, error } = await supabase.from('frequent_locations').insert(location).select().single();
    if (error) throw error;
    return data;
  },

  async updateFrequentLocation(id: string, updates: any) {
    const { data, error } = await supabase.from('frequent_locations').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteFrequentLocation(id: string) {
    const { error } = await supabase.from('frequent_locations').delete().eq('id', id);
    if (error) throw error;
  },

  async getDriverSchedules(driverId: string) {
    const { data, error } = await supabase.from('driver_schedules').select('*').eq('driver_id', driverId);
    if (error) throw error;
    return data || [];
  },

  async createDriverSchedule(schedule: any) {
    const { data, error } = await supabase.from('driver_schedules').insert(schedule).select().single();
    if (error) throw error;
    return data;
  },

  async getTripsByDriver(driverId: string) {
    const { data, error } = await supabase.from('trips').select('*').eq('driver_id', driverId);
    if (error) throw error;
    return data || [];
  },

  async updateTrip(id: string, updates: any) {
    const { data, error } = await supabase.from('trips').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteTrip(id: string) {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;
  },

  async getTripsByClient(clientId: string) {
    const { data, error } = await supabase.from('trips').select('*').eq('client_id', clientId);
    if (error) throw error;
    return data || [];
  },

  // Vehicle management methods
  async getAllVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getVehiclesByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getVehicle(id: string) {
    const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createVehicle(vehicle: any) {
    const { data, error } = await supabase.from('vehicles').insert(vehicle).select().single();
    if (error) throw error;
    return data;
  },

  async updateVehicle(id: string, updates: any) {
    const { data, error } = await supabase.from('vehicles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteVehicle(id: string) {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;
  },

  async getDriverVehicleAssignments(driverId: string) {
    const { data, error } = await supabase
      .from('driver_vehicle_assignments')
      .select(`
        *,
        vehicles:vehicle_id (
          id,
          year,
          make,
          model,
          color,
          license_plate
        )
      `)
      .eq('driver_id', driverId);
    if (error) throw error;
    return data || [];
  },

  async assignVehicleToDriver(assignment: any) {
    const { data, error } = await supabase.from('driver_vehicle_assignments').insert(assignment).select().single();
    if (error) throw error;
    return data;
  },

  async removeVehicleFromDriver(driverId: string, vehicleId: string) {
    const { error } = await supabase
      .from('driver_vehicle_assignments')
      .delete()
      .eq('driver_id', driverId)
      .eq('vehicle_id', vehicleId);
    if (error) throw error;
  },

  // Users by organization
  async getUsersByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .contains('authorized_organizations', [organizationId])
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  // Super admin methods
  async getAllDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getAllClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  }
};