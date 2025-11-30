/**
 * Driver Schedules Storage for New Architectural Blueprint
 * 
 * Manages driver schedules, availability, and duty status
 */
import { supabase } from './db';

export interface DriverSchedule {
  id: string;
  driver_id: string;
  program_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_available: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
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

export interface DriverDutyStatus {
  id: string;
  driver_id: string;
  program_id: string;
  status: 'off_duty' | 'on_duty' | 'on_trip' | 'break' | 'unavailable';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
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

export const driverSchedulesStorage = {
  // Driver Schedules
  async getAllDriverSchedules() {
    const { data, error } = await supabase
      .from('driver_schedules')
      .select(`
        *,
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
      .order('day_of_week, start_time');
    
    if (error) throw error;
    return data || [];
  },

  async getDriverSchedule(id: string) {
    const { data, error } = await supabase
      .from('driver_schedules')
      .select(`
        *,
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
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getDriverSchedulesByDriver(driverId: string) {
    const { data, error } = await supabase
      .from('driver_schedules')
      .select(`
        *,
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
      .order('day_of_week, start_time');
    
    if (error) throw error;
    return data || [];
  },

  async getDriverSchedulesByProgram(programId: string) {
    const { data, error } = await supabase
      .from('driver_schedules')
      .select(`
        *,
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
      .eq('program_id', programId)
      .order('day_of_week, start_time');
    
    if (error) throw error;
    return data || [];
  },

  async createDriverSchedule(schedule: Omit<DriverSchedule, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('driver_schedules')
      .insert({
        ...schedule,
        id: `driver_schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateDriverSchedule(id: string, updates: Partial<DriverSchedule>) {
    const { data, error } = await supabase
      .from('driver_schedules')
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

  async deleteDriverSchedule(id: string) {
    const { data, error } = await supabase
      .from('driver_schedules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return data;
  },

  // Driver Duty Status
  async getCurrentDutyStatus(driverId: string) {
    const { data, error } = await supabase
      .from('driver_duty_status')
      .select(`
        *,
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
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateDutyStatus(driverId: string, status: DriverDutyStatus['status'], location?: DriverDutyStatus['location'], notes?: string) {
    // End current status if exists
    await supabase
      .from('driver_duty_status')
      .update({ 
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', driverId)
      .is('ended_at', null);

    // Create new status
    const { data, error } = await supabase
      .from('driver_duty_status')
      .insert({
        id: `duty_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        driver_id: driverId,
        program_id: '', // Will be set by the calling function
        status,
        location,
        notes,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getDutyStatusHistory(driverId: string, limit = 50) {
    const { data, error } = await supabase
      .from('driver_duty_status')
      .select(`
        *,
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
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  // Get available drivers for a specific time
  async getAvailableDrivers(programId: string, date: string, startTime: string, endTime: string) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    
    const { data, error } = await supabase
      .from('driver_schedules')
      .select(`
        *,
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
      .eq('program_id', programId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .lte('start_time', startTime)
      .gte('end_time', endTime);
    
    if (error) throw error;
    return data || [];
  },

  // Get driver workload for a specific date
  async getDriverWorkload(driverId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driverId)
      .gte('scheduled_pickup_time', startOfDay.toISOString())
      .lte('scheduled_pickup_time', endOfDay.toISOString())
      .order('scheduled_pickup_time');
    
    if (error) throw error;
    return data || [];
  }
};


