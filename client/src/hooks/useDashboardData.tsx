import { useQuery } from '@tanstack/react-query';
import { useRealTimeUpdates } from './useRealTimeUpdates';
import { useOptimizedQueries } from './useOptimizedQueries';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from './useAuth';
import { useHierarchy } from './useHierarchy';

interface DashboardDataOptions {
  enableRealTime?: boolean;
  refreshInterval?: number;
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  const { enableRealTime = true, refreshInterval = 30000 } = options;
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, activeScope, activeScopeId } = useHierarchy();

  // Get current user (using real auth only)
  const currentUser = user;
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

  // Fetch trips data - only enable if user is authenticated
  // Use scope-based state if available, otherwise fall back to hierarchy state
  const effectiveScope = activeScope || (level === 'corporate' ? 'global' : level === 'client' ? 'corporate' : level === 'program' ? 'program' : 'global');
  const effectiveScopeId = activeScopeId || (effectiveScope === 'corporate' ? selectedCorporateClient : effectiveScope === 'program' ? selectedProgram : null);
  
  const { data: tripsData, isLoading: tripsLoading, error: tripsError } = useQuery({
    queryKey: ['trips', userRole, currentUser?.user_id, effectiveScope, effectiveScopeId],
    enabled: !!currentUser?.user_id, // Only fetch if user is authenticated
    queryFn: async () => {
      // console.log('🔍 useDashboardData: Fetching trips for role:', userRole, 'scope:', effectiveScope, 'scopeId:', effectiveScopeId); // Reduced logging
      if (userRole === 'driver' && currentUser?.user_id) {
        // For drivers, first find the driver record, then fetch their trips
        try {
          // console.log('🔍 useDashboardData: Fetching drivers for driver user'); // Reduced logging
          const driversResponse = await apiRequest('GET', '/api/drivers');
          const driversData = await driversResponse.json();
          const driverRecord = driversData.find((d: any) => d.user_id === currentUser.user_id);
          
          if (driverRecord) {
            // console.log('🔍 useDashboardData: Found driver record, fetching trips'); // Reduced logging
            const response = await apiRequest('GET', `/api/trips/driver/${driverRecord.id}`);
            return await response.json();
          }
          return [];
        } catch (error) {
          console.error('❌ useDashboardData: Error fetching driver trips:', error);
          return [];
        }
      } else if (userRole === 'corporate_admin') {
        // Corporate admin should filter by their corporate client ID for tenant isolation
        const corporateClientId = effectiveScope === 'corporate' && effectiveScopeId 
          ? effectiveScopeId 
          : (currentUser as any)?.corporate_client_id || selectedCorporateClient;
        if (corporateClientId) {
          try {
            const response = await apiRequest('GET', `/api/trips/corporate-client/${corporateClientId}`);
            const data = await response.json();
            // console.log('✅ useDashboardData: Corporate admin trips fetched:', data?.length || 0, 'trips'); // Reduced logging
            return data;
          } catch (error) {
            console.error('❌ useDashboardData: Error fetching corporate admin trips:', error);
            throw error;
          }
        } else {
          console.warn('⚠️ useDashboardData: Corporate admin missing corporate_client_id');
          return []; // Return empty array instead of fetching all trips
        }
      } else {
        // For other roles (super_admin, program_admin, etc.), fetch all trips or filtered by scope
        // console.log('🔍 useDashboardData: Fetching trips for role:', userRole, 'scope:', effectiveScope); // Reduced logging
        try {
          let endpoint = '/api/trips';
          if (effectiveScope === 'program' && effectiveScopeId) {
            endpoint = `/api/trips/program/${effectiveScopeId}`;
          } else if (effectiveScope === 'corporate' && effectiveScopeId) {
            endpoint = `/api/trips/corporate-client/${effectiveScopeId}`;
          }
          // If scope is 'global', use the base endpoint (all trips)
          
          const response = await apiRequest('GET', endpoint);
          const data = await response.json();
          // console.log('✅ useDashboardData: Trips fetched successfully:', data?.length || 0, 'trips'); // Reduced logging
          return data;
        } catch (error) {
          console.error('❌ useDashboardData: Error fetching trips:', error);
          throw error;
        }
      }
    },
    staleTime: 120000, // 2 minutes for live data
    ...dynamicQueryConfig,
  });

  // Fetch drivers data - only enable if user is authenticated
  const { data: driversData, isLoading: driversLoading, error: driversError } = useQuery({
    queryKey: ['drivers', userRole, effectiveScope, effectiveScopeId],
    enabled: !!currentUser?.user_id, // Only fetch if user is authenticated
    queryFn: async () => {
      let endpoint = '/api/drivers';
      
      // Corporate admin should filter by their corporate client ID for tenant isolation
      if (userRole === 'corporate_admin') {
        const corporateClientId = effectiveScope === 'corporate' && effectiveScopeId
          ? effectiveScopeId
          : (currentUser as any)?.corporate_client_id || selectedCorporateClient;
        if (corporateClientId) {
          endpoint = `/api/drivers/corporate-client/${corporateClientId}`;
        } else {
          console.warn('⚠️ useDashboardData: Corporate admin missing corporate_client_id for drivers');
          return []; // Return empty array instead of fetching all drivers
        }
      } else if (effectiveScope === 'program' && effectiveScopeId) {
        endpoint = `/api/drivers/program/${effectiveScopeId}`;
      } else if (effectiveScope === 'corporate' && effectiveScopeId) {
        endpoint = `/api/drivers/corporate-client/${effectiveScopeId}`;
      }
      // If scope is 'global', use the base endpoint (all drivers)
      
      const response = await apiRequest('GET', endpoint);
      return await response.json();
    },
    staleTime: 120000, // 2 minutes for live data
    ...dynamicQueryConfig,
  });

  // Fetch clients data - only enable if user is authenticated
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['clients', userRole, effectiveScope, effectiveScopeId],
    enabled: !!currentUser?.user_id, // Only fetch if user is authenticated
    queryFn: async () => {
      let endpoint = '/api/clients';
      
      // Corporate admin should filter by their corporate client ID for tenant isolation
      // Note: Clients are typically filtered by program, but we can filter by corporate client if needed
      if (userRole === 'corporate_admin') {
        const corporateClientId = effectiveScope === 'corporate' && effectiveScopeId
          ? effectiveScopeId
          : (currentUser as any)?.corporate_client_id || selectedCorporateClient;
        // For now, clients are filtered by program, so we'll filter client-side
        // If an endpoint exists, use it: endpoint = `/api/clients/corporate-client/${corporateClientId}`;
      } else if (effectiveScope === 'program' && effectiveScopeId) {
        endpoint = `/api/clients/program/${effectiveScopeId}`;
      }
      // If scope is 'global' or 'corporate', use the base endpoint
      
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      
      // Filter clients by corporate client for corporate_admin if needed
      if (userRole === 'corporate_admin' && data) {
        const corporateClientId = effectiveScope === 'corporate' && effectiveScopeId
          ? effectiveScopeId
          : (currentUser as any)?.corporate_client_id || selectedCorporateClient;
        if (corporateClientId && Array.isArray(data)) {
          // Filter clients whose program belongs to this corporate client
          return data.filter((client: any) => {
            // Check if client's program belongs to the corporate client
            return client.program?.corporate_client_id === corporateClientId || 
                   client.programs?.corporate_client_id === corporateClientId;
          });
        }
      }
      
      return data;
    },
    staleTime: 120000, // 2 minutes for live data
    ...dynamicQueryConfig,
  });

  // Fetch corporate clients data (for super admin)
  const { data: corporateClientsData, isLoading: corporateClientsLoading, error: corporateClientsError } = useQuery({
    queryKey: ['corporateClients', 'scope-selector'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate-clients');
      return await response.json();
    },
    enabled: isSuperAdmin,
    staleTime: 600000, // 10 minutes - static list
    ...staticQueryConfig,
  });

  // Fetch programs data - only enable if user is authenticated
  const { data: programsData, isLoading: programsLoading, error: programsError } = useQuery({
    queryKey: ['programs', userRole, effectiveScope, effectiveScopeId],
    enabled: !!currentUser?.user_id, // Only fetch if user is authenticated
    queryFn: async () => {
      // Corporate admin should filter by their corporate client ID for tenant isolation
      if (userRole === 'corporate_admin') {
        const corporateClientId = effectiveScope === 'corporate' && effectiveScopeId
          ? effectiveScopeId
          : (currentUser as any)?.corporate_client_id || selectedCorporateClient;
        if (corporateClientId) {
          try {
            const response = await apiRequest('GET', `/api/programs/corporate-client/${corporateClientId}`);
            return await response.json();
          } catch (error) {
            console.error('❌ useDashboardData: Error fetching corporate admin programs:', error);
            return [];
          }
        } else {
          console.warn('⚠️ useDashboardData: Corporate admin missing corporate_client_id for programs');
          return [];
        }
      }
      
      // For program_admin and program_user: fetch their authorized programs
      if (userRole === 'program_admin' || userRole === 'program_user') {
        const primaryProgramId = (currentUser as any)?.primary_program_id;
        const authorizedPrograms = (currentUser as any)?.authorized_programs || [];
        
        // Get all programs and filter to only authorized ones
        try {
          const response = await apiRequest('GET', '/api/programs');
          const allPrograms = await response.json();
          
          // Filter to only programs the user has access to
          const accessiblePrograms = allPrograms.filter((program: any) => 
            program.id === primaryProgramId || authorizedPrograms.includes(program.id)
          );
          
          return accessiblePrograms;
        } catch (error) {
          console.error('❌ useDashboardData: Error fetching programs for program admin:', error);
          return [];
        }
      }
      
      // For super admin and other roles, fetch all programs
      const response = await apiRequest('GET', '/api/programs');
      return await response.json();
    },
    staleTime: 600000, // 10 minutes - static list
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
