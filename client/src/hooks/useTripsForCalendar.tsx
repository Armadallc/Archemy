// Hook to fetch and manage trip data for calendar integration
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useHierarchy } from './useHierarchy';
import { useAuth } from './useAuth';
import { Trip, tripToCalendarEvent, filterTripsByDateRange, filterTripsByStatus, searchTrips, sortTripsByTime } from '../lib/trip-calendar-mapping';
import { CalendarEvent } from '../components/event-calendar/types';

interface UseTripsForCalendarOptions {
  startDate?: Date;
  endDate?: Date;
  statusFilter?: string;
  searchTerm?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useTripsForCalendar(options: UseTripsForCalendarOptions = {}) {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();
  
  const {
    startDate,
    endDate,
    statusFilter = 'all',
    searchTerm = '',
    sortOrder = 'asc'
  } = options;

  // Build API endpoint based on hierarchy level
  const getTripsEndpoint = () => {
    if (level === 'corporate') {
      return '/api/trips'; // Use regular trips endpoint for super_admin
    } else if (level === 'client' && selectedCorporateClient) {
      return `/api/trips/corporate-client/${selectedCorporateClient}`;
    } else if (level === 'program' && selectedProgram) {
      return `/api/trips/program/${selectedProgram}`;
    }
    return '/api/trips';
  };

  // Fetch trips from API
  const { data: tripsData, isLoading, error, refetch } = useQuery({
    queryKey: ['trips-for-calendar', level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      const endpoint = getTripsEndpoint();
      console.log('🔍 Fetching trips for calendar from:', endpoint);
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });

  const trips: Trip[] = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];

  // Process trips for calendar
  const processedTrips = React.useMemo(() => {
    let filteredTrips = trips;

    // Filter by date range if provided
    if (startDate && endDate) {
      filteredTrips = filterTripsByDateRange(filteredTrips, startDate, endDate);
    }

    // Filter by status
    filteredTrips = filterTripsByStatus(filteredTrips, statusFilter);

    // Search trips
    filteredTrips = searchTrips(filteredTrips, searchTerm);

    // Sort trips
    filteredTrips = sortTripsByTime(filteredTrips, sortOrder);

    return filteredTrips;
  }, [trips, startDate, endDate, statusFilter, searchTerm, sortOrder]);

  // Convert trips to calendar events
  const calendarEvents: CalendarEvent[] = React.useMemo(() => {
    return processedTrips.map(tripToCalendarEvent);
  }, [processedTrips]);

  // Get trip statistics
  const stats = React.useMemo(() => {
    const total = trips.length;
    const scheduled = trips.filter(t => t.status === 'scheduled').length;
    const inProgress = trips.filter(t => t.status === 'in_progress').length;
    const completed = trips.filter(t => t.status === 'completed').length;
    const cancelled = trips.filter(t => t.status === 'cancelled').length;

    return {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      active: scheduled + inProgress
    };
  }, [trips]);

  return {
    trips: processedTrips,
    calendarEvents,
    stats,
    isLoading,
    error,
    refetch,
    // Helper functions
    getTripById: (id: string) => trips.find(trip => trip.id === id),
    getTripsByStatus: (status: string) => trips.filter(trip => trip.status === status),
    getTripsByDate: (date: Date) => trips.filter(trip => {
      const tripDate = new Date(trip.scheduled_pickup_time);
      return tripDate.toDateString() === date.toDateString();
    })
  };
}
