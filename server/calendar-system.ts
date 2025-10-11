/**
 * 3-Tier Calendar System for New Architectural Blueprint
 * 
 * Implements Program Calendar → Corporate Calendar → Universal Calendar hierarchy
 * with color-coded identification and optimization features
 */
import { supabase } from './db';
import { enhancedTripsStorage } from './enhanced-trips-storage';
import { programsStorage } from './minimal-supabase';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  category: string;
  programId: string;
  programName: string;
  corporateClientId: string;
  corporateClientName: string;
  locationId?: string;
  locationName?: string;
  clientId?: string;
  clientName?: string;
  driverId?: string;
  driverName?: string;
  tripType: 'one_way' | 'round_trip';
  tripStatus: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  isGroupTrip: boolean;
  passengerCount: number;
  notes?: string;
  recurringPattern?: any;
  metadata: {
    type: 'trip' | 'maintenance' | 'meeting' | 'break' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    isRecurring: boolean;
    isGroup: boolean;
  };
}

export interface CalendarView {
  id: string;
  name: string;
  type: 'program' | 'corporate' | 'universal';
  programId?: string;
  corporateClientId?: string;
  filters: {
    categories?: string[];
    statuses?: string[];
    tripTypes?: string[];
    drivers?: string[];
    locations?: string[];
  };
  colorScheme: {
    program: string;
    corporate: string;
    universal: string;
  };
}

export interface CalendarOptimization {
  rideSharing: {
    enabled: boolean;
    maxDetourMinutes: number;
    maxPassengers: number;
    preferredDrivers: string[];
  };
  routeOptimization: {
    enabled: boolean;
    algorithm: 'shortest_path' | 'time_based' | 'cost_based';
    considerTraffic: boolean;
  };
  capacityPlanning: {
    enabled: boolean;
    forecastDays: number;
    minUtilization: number;
    maxUtilization: number;
  };
}

export const calendarSystem = {
  // Program Calendar - Shows trips for a specific program
  async getProgramCalendar(programId: string, startDate: string, endDate: string, filters?: any) {
    try {
      const trips = await enhancedTripsStorage.getTripsByProgram(programId);
      const program = await programsStorage.getProgram(programId);
      
      if (!program) {
        throw new Error(`Program ${programId} not found`);
      }

      const events: CalendarEvent[] = trips
        .filter(trip => {
          const tripDate = new Date(trip.scheduled_pickup_time);
          return tripDate >= new Date(startDate) && tripDate <= new Date(endDate);
        })
        .map(trip => ({
          id: trip.id,
          title: `${trip.client?.first_name || 'Unknown'} ${trip.client?.last_name || 'Client'}`,
          start: trip.scheduled_pickup_time,
          end: trip.scheduled_return_time || trip.scheduled_pickup_time,
          allDay: false,
          color: this.getCategoryColor(trip.trip_category?.name || 'Personal'),
          category: trip.trip_category?.name || 'Personal',
          programId: trip.program_id,
          programName: program.name,
          corporateClientId: program.corporate_client_id,
          corporateClientName: program.corporateClient?.name || 'Unknown',
          locationId: trip.pickup_location_id,
          locationName: trip.pickup_location?.name,
          clientId: trip.client_id,
          clientName: `${trip.client?.first_name || ''} ${trip.client?.last_name || ''}`.trim(),
          driverId: trip.driver_id,
          driverName: trip.driver?.users?.user_name || 'Unassigned',
          tripType: trip.trip_type,
          tripStatus: trip.status,
          isGroupTrip: trip.is_group_trip,
          passengerCount: trip.passenger_count,
          notes: trip.notes,
          recurringPattern: trip.recurring_pattern,
          metadata: {
            type: 'trip',
            priority: this.getPriorityFromStatus(trip.status),
            isRecurring: !!trip.recurring_trip_id,
            isGroup: trip.is_group_trip
          }
        }));

      return {
        events,
        program: {
          id: program.id,
          name: program.name,
          corporateClientId: program.corporate_client_id,
          corporateClientName: program.corporateClient?.name
        },
        view: 'program' as const,
        totalEvents: events.length,
        filteredEvents: this.applyFilters(events, filters)
      };
    } catch (error) {
      console.error('Error fetching program calendar:', error);
      throw error;
    }
  },

  // Corporate Calendar - Shows trips across all programs for a corporate client
  async getCorporateCalendar(corporateClientId: string, startDate: string, endDate: string, filters?: any) {
    try {
      const programs = await programsStorage.getProgramsByCorporateClient(corporateClientId);
      const allEvents: CalendarEvent[] = [];

      for (const program of programs) {
        const programEvents = await this.getProgramCalendar(program.id, startDate, endDate, filters);
        allEvents.push(...programEvents.events);
      }

      return {
        events: allEvents,
        corporateClient: {
          id: corporateClientId,
          name: programs[0]?.corporateClient?.name || 'Unknown',
          programs: programs.map(p => ({ id: p.id, name: p.name }))
        },
        view: 'corporate' as const,
        totalEvents: allEvents.length,
        filteredEvents: this.applyFilters(allEvents, filters)
      };
    } catch (error) {
      console.error('Error fetching corporate calendar:', error);
      throw error;
    }
  },

  // Universal Calendar - Shows all trips across all corporate clients
  async getUniversalCalendar(startDate: string, endDate: string, filters?: any) {
    try {
      const allPrograms = await programsStorage.getAllPrograms();
      const allEvents: CalendarEvent[] = [];

      for (const program of allPrograms) {
        const programEvents = await this.getProgramCalendar(program.id, startDate, endDate, filters);
        allEvents.push(...programEvents.events);
      }

      return {
        events: allEvents,
        view: 'universal' as const,
        totalEvents: allEvents.length,
        filteredEvents: this.applyFilters(allEvents, filters),
        corporateClients: [...new Set(allEvents.map(e => e.corporateClientId))],
        programs: [...new Set(allEvents.map(e => e.programId))]
      };
    } catch (error) {
      console.error('Error fetching universal calendar:', error);
      throw error;
    }
  },

  // Color-coded identification system
  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'Medical': '#3B82F6',      // Blue
      'Legal': '#EF4444',        // Red
      'Personal': '#10B981',     // Green
      'Program': '#8B5CF6',      // Purple
      '12-Step': '#F59E0B',      // Orange
      'Group': '#06B6D4',        // Cyan
      'Staff': '#6B7280',        // Gray
      'Carpool': '#84CC16'       // Lime
    };
    return colorMap[category] || '#6B7280';
  },

  getPriorityFromStatus(status: string): 'low' | 'medium' | 'high' | 'urgent' {
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
      'scheduled': 'medium',
      'confirmed': 'high',
      'in_progress': 'urgent',
      'completed': 'low',
      'cancelled': 'low'
    };
    return priorityMap[status] || 'medium';
  },

  // Apply filters to events
  applyFilters(events: CalendarEvent[], filters?: any): CalendarEvent[] {
    if (!filters) return events;

    return events.filter(event => {
      if (filters.categories && !filters.categories.includes(event.category)) return false;
      if (filters.statuses && !filters.statuses.includes(event.tripStatus)) return false;
      if (filters.tripTypes && !filters.tripTypes.includes(event.tripType)) return false;
      if (filters.drivers && !filters.drivers.includes(event.driverId || '')) return false;
      if (filters.locations && !filters.locations.includes(event.locationId || '')) return false;
      return true;
    });
  },

  // Ride sharing optimization
  async optimizeRideSharing(programId: string, date: string, options: CalendarOptimization['rideSharing']) {
    try {
      const trips = await enhancedTripsStorage.getTripsByProgram(programId);
      const dayTrips = trips.filter(trip => {
        const tripDate = new Date(trip.scheduled_pickup_time).toDateString();
        return tripDate === new Date(date).toDateString();
      });

      const optimizedGroups = this.groupTripsForRideSharing(dayTrips, options);
      return optimizedGroups;
    } catch (error) {
      console.error('Error optimizing ride sharing:', error);
      throw error;
    }
  },

  groupTripsForRideSharing(trips: any[], options: CalendarOptimization['rideSharing']) {
    const groups: any[] = [];
    const processed = new Set<string>();

    for (const trip of trips) {
      if (processed.has(trip.id)) continue;

      const group = [trip];
      processed.add(trip.id);

      // Find compatible trips
      for (const otherTrip of trips) {
        if (processed.has(otherTrip.id)) continue;
        if (this.canShareRide(trip, otherTrip, options)) {
          group.push(otherTrip);
          processed.add(otherTrip.id);
        }
      }

      groups.push({
        id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trips: group,
        totalPassengers: group.reduce((sum, t) => sum + t.passenger_count, 0),
        estimatedDuration: this.calculateGroupDuration(group),
        savings: this.calculateSavings(group)
      });
    }

    return groups;
  },

  canShareRide(trip1: any, trip2: any, options: CalendarOptimization['rideSharing']): boolean {
    const time1 = new Date(trip1.scheduled_pickup_time);
    const time2 = new Date(trip2.scheduled_pickup_time);
    const timeDiff = Math.abs(time1.getTime() - time2.getTime()) / (1000 * 60); // minutes

    const totalPassengers = trip1.passenger_count + trip2.passenger_count;
    
    return (
      timeDiff <= options.maxDetourMinutes &&
      totalPassengers <= options.maxPassengers &&
      trip1.pickup_address === trip2.pickup_address // Same pickup location
    );
  },

  calculateGroupDuration(trips: any[]): number {
    // Simplified calculation - in real implementation, would use routing API
    return trips.length * 30; // 30 minutes per trip
  },

  calculateSavings(trips: any[]): number {
    // Simplified calculation - in real implementation, would calculate actual costs
    return trips.length * 15; // $15 savings per trip
  },

  // Capacity planning
  async getCapacityForecast(programId: string, days: number) {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      const trips = await enhancedTripsStorage.getTripsByProgram(programId);
      const forecast = [];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        const dayTrips = trips.filter(trip => {
          const tripDate = new Date(trip.scheduled_pickup_time).toISOString().split('T')[0];
          return tripDate === dateString;
        });

        const totalPassengers = dayTrips.reduce((sum, trip) => sum + trip.passenger_count, 0);
        const uniqueDrivers = new Set(dayTrips.map(trip => trip.driver_id).filter(Boolean)).size;

        forecast.push({
          date: dateString,
          totalTrips: dayTrips.length,
          totalPassengers,
          driversNeeded: uniqueDrivers,
          utilization: Math.min(totalPassengers / 20, 1), // Assuming 20 passenger capacity
          peakHours: this.calculatePeakHours(dayTrips)
        });
      }

      return forecast;
    } catch (error) {
      console.error('Error generating capacity forecast:', error);
      throw error;
    }
  },

  calculatePeakHours(trips: any[]): string[] {
    const hourCounts: Record<number, number> = {};
    
    trips.forEach(trip => {
      const hour = new Date(trip.scheduled_pickup_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return sortedHours;
  }
};


