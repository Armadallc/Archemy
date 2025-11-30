// Trip to Calendar Event mapping functions
import { CalendarEvent, EventColor } from '../components/event-calendar/types';

export interface Trip {
  id: string;
  program_id: string;
  client_id: string;
  driver_id?: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_dropoff_time?: string;
  scheduled_return_time?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
  actual_return_time?: string;
  passenger_count: number;
  special_requirements?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  trip_type: 'one_way' | 'round_trip';
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  client?: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  driver?: {
    user_id: string;
    license_number: string;
  };
  pickup_location?: {
    name: string;
    address: string;
  };
  dropoff_location?: {
    name: string;
    address: string;
  };
}

/**
 * Convert a trip to a calendar event
 */
export function tripToCalendarEvent(trip: Trip): CalendarEvent {
  const startTime = new Date(trip.scheduled_pickup_time);
  const endTime = trip.scheduled_dropoff_time 
    ? new Date(trip.scheduled_dropoff_time)
    : new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

  const clientName = trip.client 
    ? `${trip.client.first_name} ${trip.client.last_name}`.trim()
    : 'Unknown Client';

  return {
    id: trip.id,
    title: `${clientName} - ${trip.trip_type === 'round_trip' ? 'Round Trip' : 'One Way'}`,
    description: `${trip.pickup_address} → ${trip.dropoff_address}${trip.notes ? `\n\nNotes: ${trip.notes}` : ''}`,
    start: startTime,
    end: endTime,
    allDay: false,
    color: getTripColor(trip.status),
    label: trip.status,
    location: trip.pickup_address
  };
}

/**
 * Convert a calendar event back to trip data (for editing)
 */
export function calendarEventToTrip(event: CalendarEvent, originalTrip?: Trip): Partial<Trip> {
  return {
    id: event.id,
    scheduled_pickup_time: event.start.toISOString(),
    scheduled_dropoff_time: event.end.toISOString(),
    notes: event.description?.split('\n\nNotes: ')[1] || originalTrip?.notes,
    // Preserve other trip data from original
    ...(originalTrip && {
      program_id: originalTrip.program_id,
      client_id: originalTrip.client_id,
      driver_id: originalTrip.driver_id,
      pickup_address: originalTrip.pickup_address,
      dropoff_address: originalTrip.dropoff_address,
      passenger_count: originalTrip.passenger_count,
      special_requirements: originalTrip.special_requirements,
      trip_type: originalTrip.trip_type,
      status: originalTrip.status
    })
  };
}

/**
 * Get trip color based on status
 */
export function getTripColor(status: string): EventColor {
  switch (status) {
    case 'scheduled':
      return 'blue';
    case 'confirmed':
      return 'violet';
    case 'in_progress':
      return 'orange';
    case 'completed':
      return 'emerald';
    case 'cancelled':
      return 'rose';
    default:
      return 'blue';
  }
}

/**
 * Get trip status display text
 */
export function getTripStatusText(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'confirmed':
      return 'Confirmed';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Filter trips by date range
 */
export function filterTripsByDateRange(trips: Trip[], startDate: Date, endDate: Date): Trip[] {
  return trips.filter(trip => {
    const tripDate = new Date(trip.scheduled_pickup_time);
    return tripDate >= startDate && tripDate <= endDate;
  });
}

/**
 * Filter trips by status
 */
export function filterTripsByStatus(trips: Trip[], status: string): Trip[] {
  if (status === 'all') return trips;
  return trips.filter(trip => trip.status === status);
}

/**
 * Search trips by client name or address
 */
export function searchTrips(trips: Trip[], searchTerm: string): Trip[] {
  if (!searchTerm) return trips;
  
  const term = searchTerm.toLowerCase();
  return trips.filter(trip => {
    const clientName = trip.client 
      ? `${trip.client.first_name} ${trip.client.last_name}`.toLowerCase()
      : '';
    
    return clientName.includes(term) ||
           trip.pickup_address.toLowerCase().includes(term) ||
           trip.dropoff_address.toLowerCase().includes(term) ||
           trip.notes?.toLowerCase().includes(term);
  });
}

/**
 * Sort trips by pickup time
 */
export function sortTripsByTime(trips: Trip[], order: 'asc' | 'desc' = 'asc'): Trip[] {
  return [...trips].sort((a, b) => {
    const timeA = new Date(a.scheduled_pickup_time).getTime();
    const timeB = new Date(b.scheduled_pickup_time).getTime();
    return order === 'asc' ? timeA - timeB : timeB - timeA;
  });
}







