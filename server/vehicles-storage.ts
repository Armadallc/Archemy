/**
 * Vehicles Storage for New Architectural Blueprint
 * 
 * Manages vehicles, maintenance, and assignments
 */
import { supabase } from './db';

export interface Vehicle {
  id: string;
  program_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string;
  color: string;
  capacity: number;
  vehicle_type: 'sedan' | 'suv' | 'van' | 'bus' | 'wheelchair_accessible';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  is_active: boolean;
  current_driver_id?: string;
  notes?: string;
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
  current_driver?: {
    id: string;
    user_id: string;
    users?: {
      user_name: string;
      email: string;
    };
  };
}

export interface VehicleMaintenance {
  id: string;
  vehicle_id: string;
  maintenance_type: 'routine' | 'repair' | 'inspection' | 'accident' | 'other';
  description: string;
  mileage?: number;
  cost?: number;
  performed_by?: string;
  performed_at: string;
  next_due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
  };
}

export interface VehicleAssignment {
  id: string;
  vehicle_id: string;
  driver_id: string;
  program_id: string;
  assigned_at: string;
  unassigned_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
  };
  driver?: {
    id: string;
    user_id: string;
    users?: {
      user_name: string;
      email: string;
    };
  };
  program?: {
    id: string;
    name: string;
    corporate_client_id: string;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
}

export const vehiclesStorage = {
  // Vehicles
  async getAllVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
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
        current_drivers:current_driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        )
      `)
      .order('make, model, year');
    
    if (error) throw error;
    return data || [];
  },

  async getVehicle(id: string) {
    const { data, error } = await supabase
      .from('vehicles')
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
        current_drivers:current_driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getVehiclesByProgram(programId: string) {
    const { data, error } = await supabase
      .from('vehicles')
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
        current_drivers:current_driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('make, model, year');
    
    if (error) throw error;
    return data || [];
  },

  async getAvailableVehicles(programId: string, vehicleType?: string) {
    let query = supabase
      .from('vehicles')
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
        current_drivers:current_driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        )
      `)
      .eq('program_id', programId)
      .eq('is_active', true)
      .is('current_driver_id', null);
    
    if (vehicleType) {
      query = query.eq('vehicle_type', vehicleType);
    }
    
    const { data, error } = await query.order('make, model, year');
    
    if (error) throw error;
    return data || [];
  },

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        ...vehicle,
        id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>) {
    const { data, error } = await supabase
      .from('vehicles')
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

  async deleteVehicle(id: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
    return data;
  },

  // Vehicle Maintenance
  async getVehicleMaintenance(vehicleId: string) {
    const { data, error } = await supabase
      .from('vehicle_maintenance')
      .select(`
        *,
        vehicles:vehicle_id (
          id,
          make,
          model,
          year,
          license_plate
        )
      `)
      .eq('vehicle_id', vehicleId)
      .order('performed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createMaintenanceRecord(maintenance: Omit<VehicleMaintenance, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('vehicle_maintenance')
      .insert({
        ...maintenance,
        id: `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateMaintenanceRecord(id: string, updates: Partial<VehicleMaintenance>) {
    const { data, error } = await supabase
      .from('vehicle_maintenance')
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

  // Vehicle Assignments
  async assignVehicleToDriver(vehicleId: string, driverId: string, programId: string, notes?: string) {
    // Unassign vehicle from current driver if any
    await supabase
      .from('vehicles')
      .update({ current_driver_id: null })
      .eq('id', vehicleId);

    // Create assignment record
    const { data, error } = await supabase
      .from('vehicle_assignments')
      .insert({
        id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vehicle_id: vehicleId,
        driver_id: driverId,
        program_id: programId,
        assigned_at: new Date().toISOString(),
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;

    // Update vehicle with current driver
    await supabase
      .from('vehicles')
      .update({ current_driver_id: driverId })
      .eq('id', vehicleId);

    return data;
  },

  async unassignVehicleFromDriver(vehicleId: string, driverId: string) {
    // Update assignment record
    const { data, error } = await supabase
      .from('vehicle_assignments')
      .update({ 
        unassigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_id', vehicleId)
      .eq('driver_id', driverId)
      .is('unassigned_at', null)
      .select()
      .single();
    
    if (error) throw error;

    // Update vehicle
    await supabase
      .from('vehicles')
      .update({ current_driver_id: null })
      .eq('id', vehicleId);

    return data;
  },

  async getVehicleAssignments(vehicleId: string) {
    const { data, error } = await supabase
      .from('vehicle_assignments')
      .select(`
        *,
        vehicles:vehicle_id (
          id,
          make,
          model,
          year,
          license_plate
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('vehicle_id', vehicleId)
      .order('assigned_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getDriverVehicleHistory(driverId: string) {
    const { data, error } = await supabase
      .from('vehicle_assignments')
      .select(`
        *,
        vehicles:vehicle_id (
          id,
          make,
          model,
          year,
          license_plate
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `)
      .eq('driver_id', driverId)
      .order('assigned_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};


