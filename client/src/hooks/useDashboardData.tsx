import { useQuery } from '@tanstack/react-query';
import { useRealTimeUpdates } from './useRealTimeUpdates';
import { useOptimizedQueries } from './useOptimizedQueries';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from './useAuth';
import { useMockAuth } from './useMockAuth';
import { useHierarchy } from './useHierarchy';

interface DashboardDataOptions {
  enableRealTime?: boolean;
  refreshInterval?: number;
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  const { enableRealTime = true, refreshInterval = 30000 } = options;
  const { user } = useAuth();
  const { mockUser, isMockMode } = useMockAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();

  // Get current user (real or mock)
  const currentUser = isMockMode && mockUser ? mockUser : user;
  const userRole = currentUser?.role || 'program_admin';
  const isSuperAdmin = userRole === 'super_admin' && currentUser?.primary_program_id === null;

  // Real-time query keys for different data types
  const queryKeys = [
    'trips',
    'drivers', 
    'clients',
    'corporateClients',
    'programs',
    'universalTrips'
  ];

  // Get optimized query configuration for dynamic data (trips, drivers)
  const { queryConfig: dynamicQueryConfig } = useOptimizedQueries({
    enabled: true,
    refetchInterval: enableRealTime && refreshInterval > 0 ? refreshInterval : 0,
  });

  // Get optimized query configuration for static data (programs, corporate clients)
  const { queryConfig: staticQueryConfig } = useOptimizedQueries({
    enabled: true,
    refetchInterval: 0, // No auto-refresh for static data
    staleTime: 300000, // 5 minutes - static data stays fresh longer
  });

  // Enable real-time updates
  useRealTimeUpdates({
    enabled: enableRealTime,
    interval: refreshInterval,
    queryKeys
  });

  // Fetch trips data
  const { data: tripsData, isLoading: tripsLoading, error: tripsError } = useQuery({
    queryKey: ['trips', userRole, currentUser?.user_id],
    enabled: true,
    queryFn: async () => {
      console.log('🔍 useDashboardData: Fetching trips for role:', userRole, 'user:', currentUser?.email);
      if (userRole === 'driver' && currentUser?.user_id) {
        // For drivers, first find the driver record, then fetch their trips
        try {
          console.log('🔍 useDashboardData: Fetching drivers for driver user');
          const driversResponse = await apiRequest('GET', '/api/drivers');
          const driversData = await driversResponse.json();
          const driverRecord = driversData.find((d: any) => d.user_id === currentUser.user_id);
          
          if (driverRecord) {
            console.log('🔍 useDashboardData: Found driver record, fetching trips');
            const response = await apiRequest('GET', `/api/trips/driver/${driverRecord.id}`);
            return await response.json();
          }
          return [];
        } catch (error) {
          console.error('❌ useDashboardData: Error fetching driver trips:', error);
          return [];
        }
      } else {
        // For other roles, fetch all trips
        console.log('🔍 useDashboardData: Fetching all trips for role:', userRole);
        try {
          const response = await apiRequest('GET', '/api/trips');
          const data = await response.json();
          console.log('✅ useDashboardData: Trips fetched successfully:', data?.length || 0, 'trips');
          return data;
        } catch (error) {
          console.error('❌ useDashboardData: Error fetching trips:', error);
          throw error;
        }
      }
    },
    ...dynamicQueryConfig,
  });

  // Fetch drivers data
  const { data: driversData, isLoading: driversLoading, error: driversError } = useQuery({
    queryKey: ['drivers'],
    enabled: true,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/drivers');
      return await response.json();
    },
    ...dynamicQueryConfig,
  });

  // Fetch clients data
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['clients'],
    enabled: true,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/clients');
      return await response.json();
    },
    ...dynamicQueryConfig,
  });

  // Fetch corporate clients data (for super admin)
  const { data: corporateClientsData, isLoading: corporateClientsLoading, error: corporateClientsError } = useQuery({
    queryKey: ['corporateClients'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate-clients');
      return await response.json();
    },
    enabled: isSuperAdmin,
    ...staticQueryConfig,
  });

  // Fetch programs data
  const { data: programsData, isLoading: programsLoading, error: programsError } = useQuery({
    queryKey: ['programs'],
    enabled: true,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/programs');
      return await response.json();
    },
    ...staticQueryConfig,
  });

  // Fetch universal trips data (for super admin)
  const { data: universalTripsData, isLoading: universalTripsLoading, error: universalTripsError } = useQuery({
    queryKey: ['universalTrips'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/trips');
      return await response.json();
    },
    enabled: isSuperAdmin,
    ...dynamicQueryConfig,
  });

  // Calculate real-time metrics
  const metrics = {
    // Trip metrics
    totalTrips: tripsData?.length || 0,
    activeTrips: tripsData?.filter((trip: any) => trip.status === 'in_progress').length || 0,
    completedTrips: tripsData?.filter((trip: any) => trip.status === 'completed').length || 0,
    pendingTrips: tripsData?.filter((trip: any) => trip.status === 'scheduled').length || 0,
    
    // Driver metrics
    totalDrivers: driversData?.length || 0,
    activeDrivers: driversData?.filter((driver: any) => driver.is_active).length || 0,
    availableDrivers: driversData?.filter((driver: any) => driver.is_active && !driver.current_trip_id).length || 0,
    
    // Client metrics
    totalClients: clientsData?.length || 0,
    activeClients: clientsData?.filter((client: any) => client.is_active).length || 0,
    
    // Corporate metrics (for super admin)
    totalCorporateClients: corporateClientsData?.corporateClients?.length || 0,
    totalPrograms: programsData?.length || 0,
    
    // Today's metrics
    todayTrips: tripsData?.filter((trip: any) => {
      const today = new Date().toDateString();
      const tripDate = new Date(trip.scheduled_pickup_time).toDateString();
      return tripDate === today;
    }).length || 0,
  };

  // Loading states
  const isLoading = tripsLoading || driversLoading || clientsLoading || 
    (isSuperAdmin && (corporateClientsLoading || programsLoading || universalTripsLoading));

  // Error states
  const hasError = tripsError || driversError || clientsError || 
    (isSuperAdmin && (corporateClientsError || programsError || universalTripsError));

  return {
    // Raw data
    trips: tripsData || [],
    drivers: driversData || [],
    clients: clientsData || [],
    corporateClients: corporateClientsData?.corporateClients || [],
    programs: programsData || [],
    universalTrips: universalTripsData || [],
    
    // Calculated metrics
    metrics,
    
    // Loading and error states
    isLoading,
    hasError,
    errors: {
      trips: tripsError,
      drivers: driversError,
      clients: clientsError,
      corporateClients: corporateClientsError,
      programs: programsError,
      universalTrips: universalTripsError,
    },
    
    // User context
    userRole,
    isSuperAdmin,
    level,
    selectedCorporateClient,
    selectedProgram,
  };
}
