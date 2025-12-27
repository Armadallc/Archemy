import React, { useMemo } from "react";
import { MapPin, Car, Navigation, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Widget from "./Widget";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { useHierarchy } from "../../hooks/useHierarchy";
import { useRealtimeSubscription } from "../../hooks/useWebSocket";
import { isToday, parseISO, format } from "date-fns";

interface FleetStatusWidgetProps {
  className?: string;
  drivers?: any[];
  trips?: any[]; // Optional prop - will fetch own data if not provided
  shadow?: 'sm' | 'xl';
}

export default function FleetStatusWidget({ className, drivers, trips: propTrips, shadow }: FleetStatusWidgetProps) {
  const queryClient = useQueryClient();
  const { level, selectedProgram, selectedCorporateClient, getFilterParams } = useHierarchy();

  // Subscribe to real-time trip updates via WebSocket
  useRealtimeSubscription('trips', {
    enabled: true,
    onMessage: (message) => {
      if (message.type === 'trip_update' || message.type === 'trip_created') {
        // Invalidate trips query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['fleet-status-trips'] });
      }
    }
  });

  // Fetch trips data with real-time updates (if not provided as prop)
  const { data: fetchedTrips, isLoading: tripsLoading } = useQuery({
    queryKey: ['fleet-status-trips', getFilterParams()],
    queryFn: async () => {
      let endpoint = '/api/trips';
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/trips/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/trips/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      return data || [];
    },
    enabled: !propTrips, // Only fetch if trips not provided as prop
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Use prop trips if provided, otherwise use fetched trips
  const trips = propTrips || fetchedTrips || [];

  // Filter for today's trips and sort by status priority
  const todayTrips = useMemo(() => {
    const today = trips.filter((trip: any) => {
      if (!trip.scheduled_pickup_time) return false;
      try {
        return isToday(parseISO(trip.scheduled_pickup_time));
      } catch {
        return false;
      }
    });

    // Sort by status priority: scheduled → in_progress → completed → cancelled
    const statusPriority: Record<string, number> = {
      'scheduled': 1,
      'in_progress': 2,
      'completed': 3,
      'cancelled': 4,
    };

    return today.sort((a: any, b: any) => {
      const aPriority = statusPriority[a.status] || 99;
      const bPriority = statusPriority[b.status] || 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // If same status, sort by scheduled time
      try {
        const aTime = parseISO(a.scheduled_pickup_time).getTime();
        const bTime = parseISO(b.scheduled_pickup_time).getTime();
        return aTime - bTime;
      } catch {
        return 0;
      }
    });
  }, [trips]);

  // Get trips by status for summary
  const inProgressTrips = todayTrips.filter((trip: any) => trip.status === 'in_progress');
  const scheduledTrips = todayTrips.filter((trip: any) => trip.status === 'scheduled');
  const completedTrips = todayTrips.filter((trip: any) => trip.status === 'completed');
  
  // If no trips for today, show muted/greyscale state
  const hasTrips = todayTrips.length > 0;
  
  // Map today's trips to fleet data (show up to 6 trips)
  const fleetData = hasTrips ? todayTrips.slice(0, 6).map((trip: any, index: number) => {
    const driver = trip.drivers || trip.driver;
    const driverName = driver?.users?.first_name && driver?.users?.last_name
      ? `${driver.users.first_name} ${driver.users.last_name}`
      : driver?.users?.user_name || driver?.user_id || 'Unassigned';
    
    // Get client name
    const clientName = trip.client 
      ? `${trip.client.first_name || ''} ${trip.client.last_name || ''}`.trim() || 'Unknown Client'
      : trip.client_groups?.name || trip.client_group?.name || 'Unknown Client';
    
    // Get location based on trip status
    let location = trip.pickup_address || trip.origin_address || "En route";
    if (trip.status === 'in_progress' && trip.dropoff_address) {
      location = `To: ${trip.dropoff_address}`;
    } else if (trip.status === 'completed' && trip.dropoff_address) {
      location = trip.dropoff_address;
    }
    
    // Format scheduled time
    let timeDisplay = '';
    try {
      if (trip.scheduled_pickup_time) {
        timeDisplay = format(parseISO(trip.scheduled_pickup_time), 'h:mm a');
      }
    } catch {
      timeDisplay = '';
    }
    
    return {
      id: trip.id || trip.reference_id || `trip-${index}`,
      referenceId: trip.reference_id || trip.id?.slice(0, 12) || 'N/A',
      vehicle: driverName ? `${driverName}'s Vehicle` : 'Unassigned',
      driver: driverName,
      client: clientName,
      status: trip.status,
      location: location,
      tripStatus: trip.status,
      tripId: trip.id,
      scheduledTime: timeDisplay,
      actualPickupTime: trip.actual_pickup_time,
      actualDropoffTime: trip.actual_dropoff_time,
    };
  }) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-status-success bg-status-success-bg';
      case 'break': return 'text-status-warning bg-status-warning-bg';
      case 'maintenance': return 'text-status-error bg-status-error-bg';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Car className="h-4 w-4" />;
      case 'break': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />;
      default: return <Car className="h-4 w-4" />;
    }
  };

  // Get trip status color for battery indicator - using Fire palette CSS variables
  const getTripStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'var(--scheduled)';
      case 'in_progress': return 'var(--in-progress)';
      case 'completed': return 'var(--completed)';
      case 'cancelled': return 'var(--cancelled)';
      default: return 'var(--muted-foreground)';
    }
  };
  
  // Get battery percentage based on trip status (placeholder - will be based on location later)
  const getBatteryPercentage = (status: string) => {
    switch (status) {
      case 'scheduled': return 25; // Just started
      case 'in_progress': return 75; // In progress
      case 'completed': return 100; // Completed
      case 'cancelled': return 0; // Cancelled
      default: return 0;
    }
  };

  return (
    <Widget
      title="Fleet Status"
      icon={<MapPin className="h-5 w-5" />}
      size="full"
      className={className}
      shadow={shadow}
      actions={
        <div className="flex items-center gap-2">
          {tripsLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Button variant="outline" size="sm">
            <Navigation className="h-4 w-4 mr-1" />
            Track All
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {hasTrips ? (
          fleetData.map((vehicle) => {
            const batteryPercent = getBatteryPercentage(vehicle.tripStatus);
            const statusColor = getTripStatusColor(vehicle.tripStatus);
            
            return (
              <div key={vehicle.id} className="p-4 bg-surface-muted dark:bg-surface-muted rounded-lg border border-border hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(vehicle.status)}`}>
                      {getStatusIcon(vehicle.status)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{vehicle.referenceId}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.driver}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={vehicle.tripStatus === 'in_progress' ? 'default' : 'secondary'}
                    style={{ 
                      backgroundColor: vehicle.tripStatus === 'in_progress' ? 'var(--in-progress)' : undefined,
                      color: vehicle.tripStatus === 'in_progress' ? 'white' : undefined
                    }}
                  >
                    {vehicle.tripStatus === 'in_progress' ? 'In Progress' : 
                     vehicle.tripStatus === 'scheduled' ? 'Scheduled' :
                     vehicle.tripStatus === 'completed' ? 'Completed' :
                     vehicle.tripStatus.charAt(0).toUpperCase() + vehicle.tripStatus.slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Client</p>
                    <p className="font-medium text-foreground truncate">{vehicle.client}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Time</p>
                    <p className="font-medium text-foreground">
                      {vehicle.actualPickupTime 
                        ? format(parseISO(vehicle.actualPickupTime), 'h:mm a')
                        : vehicle.scheduledTime || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Location</p>
                    <p className="font-medium text-foreground truncate">{vehicle.location}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span style={{ color: statusColor }}>{batteryPercent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${batteryPercent}%`,
                        backgroundColor: statusColor
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center opacity-50 grayscale">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No trips scheduled for today</p>
            <p className="text-xs text-muted-foreground mt-1">Fleet is idle</p>
          </div>
        )}

        {/* Fleet Summary - Today's Trips */}
        {hasTrips && (
          <div className="grid grid-cols-3 gap-4 pt-2 pb-2 border-t">
            <div className="text-center shadow-xl flex flex-col justify-center items-center" style={{ height: '75px' }}>
              <div className="text-2xl font-bold text-foreground">
                {scheduledTrips.length}
              </div>
              <div className="text-xs text-foreground-secondary flex flex-col justify-center items-center">Scheduled</div>
            </div>
            <div className="text-center shadow-xl flex flex-col justify-center items-center" style={{ height: '75px' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--in-progress)' }}>
                {inProgressTrips.length}
              </div>
              <div className="text-xs text-foreground-secondary flex flex-col justify-center items-center">In Progress</div>
            </div>
            <div className="text-center shadow-xl flex flex-col justify-center items-center" style={{ height: '75px' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--completed)' }}>
                {completedTrips.length}
              </div>
              <div className="text-xs text-foreground-secondary flex flex-col justify-center items-center">Completed</div>
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
}
