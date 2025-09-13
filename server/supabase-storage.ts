import { supabase } from "./db";
import type {
  Organization,
  User,
  ServiceArea,
  ClientGroup,
  ClientGroupMembership,
  Client,
  Driver,
  DriverSchedule,
  Trip,
  InsertOrganization,
  InsertUser,
  InsertServiceArea,
  InsertClientGroup,
  InsertClient,
  InsertDriver,
  InsertDriverSchedule,
  InsertTrip,
} from "@shared/schema";

export class SupabaseStorage {
  // User operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return undefined;
    
    return {
      userId: data.user_id,
      userName: data.user_name,
      email: data.email,
      role: data.role,
      passwordHash: data.password_hash,
      primaryOrganizationId: data.primary_organization_id,
      authorizedOrganizations: data.authorized_organizations,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getUser(userId: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return undefined;
    
    return {
      userId: data.user_id,
      userName: data.user_name,
      email: data.email,
      role: data.role,
      passwordHash: data.password_hash,
      primaryOrganizationId: data.primary_organization_id,
      authorizedOrganizations: data.authorized_organizations,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        user_id: user.userId,
        user_name: user.userName,
        email: user.email,
        role: user.role,
        password_hash: user.passwordHash,
        primary_organization_id: user.primaryOrganizationId,
        authorized_organizations: user.authorizedOrganizations,
        is_active: user.isActive
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);

    return {
      userId: data.user_id,
      userName: data.user_name,
      email: data.email,
      role: data.role,
      passwordHash: data.password_hash,
      primaryOrganizationId: data.primary_organization_id,
      authorizedOrganizations: data.authorized_organizations,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Organization operations
  async getAllOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*');
    
    if (error) throw new Error(`Failed to get organizations: ${error.message}`);
    
    return data.map(org => ({
      id: org.id,
      name: org.name,
      address: org.address,
      email: org.email,
      isActive: org.is_active,
      createdAt: new Date(org.created_at),
      updatedAt: new Date(org.updated_at)
    }));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    return {
      id: data.id,
      name: data.name,
      address: data.address,
      email: data.email,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Client operations
  async getClientsByOrganization(organizationId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        service_areas!inner(nickname)
      `)
      .eq('organization_id', organizationId);
    
    if (error) throw new Error(`Failed to get clients: ${error.message}`);
    
    return data.map(client => ({
      id: client.id,
      organizationId: client.organization_id,
      serviceAreaId: client.service_area_id,
      firstName: client.first_name,
      lastName: client.last_name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      emergencyContact: client.emergency_contact,
      emergencyPhone: client.emergency_phone,
      medicalNotes: client.medical_notes,
      mobilityRequirements: client.mobility_requirements,
      isActive: client.is_active,
      createdAt: new Date(client.created_at),
      updatedAt: new Date(client.updated_at),
      serviceAreaNickname: client.service_areas?.nickname
    }));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        service_areas!inner(nickname)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
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
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      serviceAreaNickname: data.service_areas?.nickname
    };
  }

  // Service area operations
  async getServiceArea(id: string): Promise<ServiceArea | undefined> {
    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    return {
      id: data.id,
      organizationId: data.organization_id,
      nickname: data.nickname,
      description: data.description,
      boundaryCoordinates: data.boundary_coordinates,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getServiceAreasByOrganization(organizationId: string): Promise<ServiceArea[]> {
    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .eq('organization_id', organizationId);
    
    if (error) throw new Error(`Failed to get service areas: ${error.message}`);
    
    return data.map(area => ({
      id: area.id,
      organizationId: area.organization_id,
      nickname: area.nickname,
      description: area.description,
      boundaryCoordinates: area.boundary_coordinates,
      isActive: area.is_active,
      createdAt: new Date(area.created_at),
      updatedAt: new Date(area.updated_at)
    }));
  }

  // Client group operations
  async getClientGroupsByOrganization(organizationId: string): Promise<ClientGroup[]> {
    const { data, error } = await supabase
      .from('client_groups')
      .select('*')
      .eq('organization_id', organizationId);
    
    if (error) throw new Error(`Failed to get client groups: ${error.message}`);
    
    return data.map(group => ({
      id: group.id,
      organizationId: group.organization_id,
      name: group.name,
      description: group.description,
      isActive: group.is_active,
      createdAt: new Date(group.created_at),
      updatedAt: new Date(group.updated_at)
    }));
  }

  // Driver operations
  async getDriversByOrganization(organizationId: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('primary_organization_id', organizationId);
    
    if (error) throw new Error(`Failed to get drivers: ${error.message}`);
    
    return data.map(driver => ({
      id: driver.id,
      userId: driver.user_id,
      primaryOrganizationId: driver.primary_organization_id,
      authorizedOrganizations: driver.authorized_organizations || [],
      firstName: driver.first_name,
      lastName: driver.last_name,
      phone: driver.phone,
      email: driver.email,
      licenseNumber: driver.license_number,
      licenseExpiry: driver.license_expiry ? new Date(driver.license_expiry) : null,
      vehicleInfo: driver.vehicle_info,
      emergencyContact: driver.emergency_contact,
      emergencyPhone: driver.emergency_phone,
      isActive: driver.is_active,
      isAvailable: driver.is_available,
      createdAt: new Date(driver.created_at),
      updatedAt: new Date(driver.updated_at)
    }));
  }

  // Trip operations
  async getTripsByOrganization(organizationId: string): Promise<Trip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('organization_id', organizationId);
    
    if (error) throw new Error(`Failed to get trips: ${error.message}`);
    
    return data.map(trip => ({
      id: trip.id,
      organizationId: trip.organization_id,
      clientId: trip.client_id,
      driverId: trip.driver_id,
      pickupLocation: trip.pickup_location,
      dropoffLocation: trip.dropoff_location,
      scheduledTime: new Date(trip.scheduled_time),
      actualPickupTime: trip.actual_pickup_time ? new Date(trip.actual_pickup_time) : null,
      actualDropoffTime: trip.actual_dropoff_time ? new Date(trip.actual_dropoff_time) : null,
      status: trip.status,
      notes: trip.notes,
      createdAt: new Date(trip.created_at),
      updatedAt: new Date(trip.updated_at)
    }));
  }
}

export const storage = new SupabaseStorage();