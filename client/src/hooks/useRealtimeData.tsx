import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useHierarchy } from "./useHierarchy";

// Hook for fetching live trip data
export function useLiveTrips() {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  const getTripsEndpoint = () => {
    if (level === 'corporate') {
      return '/api/trips';
    } else if (level === 'client' && selectedCorporateClient) {
      return `/api/trips/corporate-client/${selectedCorporateClient}`;
    } else if (level === 'program' && selectedProgram) {
      return `/api/trips/program/${selectedProgram}`;
    }
    return '/api/trips';
  };

  return useQuery({
    queryKey: ['live-trips', level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      const response = await apiRequest('GET', getTripsEndpoint());
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
}

// Hook for fetching driver data
export function useLiveDrivers() {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  const getDriversEndpoint = () => {
    if (level === 'corporate') {
      return '/api/drivers';
    } else if (level === 'client' && selectedCorporateClient) {
      return `/api/drivers/corporate-client/${selectedCorporateClient}`;
    } else if (level === 'program' && selectedProgram) {
      return `/api/drivers/program/${selectedProgram}`;
    }
    return '/api/drivers';
  };

  return useQuery({
    queryKey: ['live-drivers', level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      const response = await apiRequest('GET', getDriversEndpoint());
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });
}

// Hook for fetching client data
export function useLiveClients() {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  const getClientsEndpoint = () => {
    if (level === 'corporate') {
      return '/api/clients';
    } else if (level === 'client' && selectedCorporateClient) {
      return `/api/clients/corporate-client/${selectedCorporateClient}`;
    } else if (level === 'program' && selectedProgram) {
      return `/api/clients/program/${selectedProgram}`;
    }
    return '/api/clients';
  };

  return useQuery({
    queryKey: ['live-clients', level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      const response = await apiRequest('GET', getClientsEndpoint());
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 50000,
  });
}

// Hook for fetching performance metrics
export function usePerformanceMetrics() {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  return useQuery({
    queryKey: ['performance-metrics', level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      // Calculate metrics from trips data
      const tripsResponse = await apiRequest('GET', '/api/trips');
      const trips = await tripsResponse.json();
      
      const today = new Date();
      const todayTrips = trips.filter((trip: any) => {
        const tripDate = new Date(trip.scheduled_pickup_time);
        return tripDate.toDateString() === today.toDateString();
      });

      const completedTrips = todayTrips.filter((trip: any) => trip.status === 'completed');
      const onTimeTrips = completedTrips.filter((trip: any) => {
        // Simple on-time calculation - in real app, this would be more sophisticated
        return true; // Placeholder
      });

      return {
        completionRate: todayTrips.length > 0 ? (completedTrips.length / todayTrips.length) * 100 : 0,
        onTimeRate: completedTrips.length > 0 ? (onTimeTrips.length / completedTrips.length) * 100 : 0,
        customerSatisfaction: 4.6, // Placeholder - would come from feedback API
        driverUtilization: 78.3, // Placeholder - would be calculated from driver data
        totalTrips: trips.length,
        todayTrips: todayTrips.length,
        completedTrips: completedTrips.length,
        activeDrivers: trips.filter((trip: any) => trip.status === 'in_progress').length,
      };
    },
    refetchInterval: 60000,
    staleTime: 50000,
  });
}

// Hook for fetching revenue data
export function useRevenueData() {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  return useQuery({
    queryKey: ['revenue-data', level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      // Calculate revenue from trips data
      const tripsResponse = await apiRequest('GET', '/api/trips');
      const trips = await tripsResponse.json();
      
      const today = new Date();
      const todayTrips = trips.filter((trip: any) => {
        const tripDate = new Date(trip.scheduled_pickup_time);
        return tripDate.toDateString() === today.toDateString();
      });

      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekTrips = trips.filter((trip: any) => {
        const tripDate = new Date(trip.scheduled_pickup_time);
        return tripDate >= weekAgo;
      });

      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthTrips = trips.filter((trip: any) => {
        const tripDate = new Date(trip.scheduled_pickup_time);
        return tripDate >= monthAgo;
      });

      // Mock pricing - in real app, this would come from pricing API
      const basePrice = 25;
      const groupPrice = 15;
      const emergencyPrice = 50;

      const calculateRevenue = (tripList: any[]) => {
        return tripList.reduce((total, trip) => {
          if (trip.trip_type === 'group') return total + groupPrice;
          if (trip.is_emergency) return total + emergencyPrice;
          return total + basePrice;
        }, 0);
      };

      return {
        today: calculateRevenue(todayTrips),
        week: calculateRevenue(weekTrips),
        month: calculateRevenue(monthTrips),
        year: calculateRevenue(trips), // All trips as yearly estimate
        todayChange: 12.5, // Placeholder - would be calculated from historical data
        weekChange: -2.3,
        monthChange: 8.7,
        yearChange: 15.2,
      };
    },
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 250000,
  });
}

// Hook for fetching task data
export function useTaskData() {
  return useQuery({
    queryKey: ['task-data'],
    queryFn: async () => {
      // Mock task data - in real app, this would come from tasks API
      return [
        { id: 1, title: "Review driver performance reports", priority: "high", due: "2 hours", status: "pending", type: "review" },
        { id: 2, title: "Approve new client registration", priority: "medium", due: "1 day", status: "pending", type: "approval" },
        { id: 3, title: "Update fleet maintenance schedule", priority: "low", due: "3 days", status: "in_progress", type: "maintenance" },
        { id: 4, title: "Process billing for completed trips", priority: "high", due: "4 hours", status: "pending", type: "billing" },
        { id: 5, title: "Schedule driver training session", priority: "medium", due: "1 week", status: "completed", type: "training" },
      ];
    },
    refetchInterval: 120000, // Refetch every 2 minutes
    staleTime: 100000,
  });
}



