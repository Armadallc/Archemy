import React, { useEffect, useState, useMemo } from "react";
import { MapPin, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Widget from "./Widget";
import { useLiveTrips, useLiveDrivers } from "../../hooks/useRealtimeData";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useRealtimeService } from "../../services/realtimeService";
import { useClientNames } from "../../hooks/useClientNames";
import { getTripDriverDisplayName } from "../../lib/displayNames";
import { format, parseISO, isToday, isAfter, subHours } from "date-fns";

interface LiveOperationsWidgetProps {
  className?: string;
  trips?: any[];
  drivers?: any[];
}

export default function LiveOperationsWidget({ className, trips: propTrips, drivers: propDrivers }: LiveOperationsWidgetProps) {
  // Use props if provided, otherwise fall back to hooks
  const { data: hookTrips, isLoading: tripsLoading, error: tripsError } = useLiveTrips();
  const { data: hookDrivers, isLoading: driversLoading, error: driversError } = useLiveDrivers();
  
  // Use prop data if available, otherwise use hook data
  const trips = propTrips || hookTrips;
  const drivers = propDrivers || hookDrivers;
  
  // Get client names for display
  const { getClientName } = useClientNames();
  
  // Helper function to get client/client group display name
  const getTripClientDisplayName = (trip: any): string => {
    if (trip.is_group_trip && trip.client_groups) {
      return trip.client_groups.name;
    } else if (trip.is_group_trip && trip.client_group_id) {
      return `Group Trip (${trip.client_group_id.slice(0, 8)}...)`;
    } else if (trip.client) {
      return `${trip.client.first_name || ''} ${trip.client.last_name || ''}`.trim() || 'Unknown Client';
    } else if (trip.client_id) {
      return getClientName(trip.client_id);
    }
    return 'Unknown Client';
  };
  
  // WebSocket connection for real-time updates
  const { isConnected, connectionStatus } = useWebSocket({
    enabled: true,
    onMessage: (message) => {
      // Reduced logging to prevent console spam
      // console.log('🔄 LiveOperationsWidget received real-time update:', message.type);
    }
  });

  // Real-time service for handling updates
  const { createService } = useRealtimeService();
  const [realtimeService, setRealtimeService] = useState<any>(null);

  useEffect(() => {
    if (isConnected) {
      const service = createService({ isConnected });
      setRealtimeService(service);
      service.initialize();
    }
    // Only depend on isConnected, not createService (which changes every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Get today's trips - ordered by time and status
  const todaysTrips = useMemo(() => {
    if (!trips) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return trips
      .filter((trip: any) => {
        const tripDate = new Date(trip.scheduled_pickup_time);
        tripDate.setHours(0, 0, 0, 0);
        return tripDate >= today && tripDate < tomorrow;
      })
      .sort((a: any, b: any) => {
        // First sort by status priority (in_progress > scheduled > completed > cancelled)
        const statusPriority: { [key: string]: number } = {
          'in_progress': 1,
          'scheduled': 2,
          'completed': 3,
          'cancelled': 4,
        };
        const statusDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
        if (statusDiff !== 0) return statusDiff;
        
        // Then sort by scheduled pickup time
        return new Date(a.scheduled_pickup_time).getTime() - new Date(b.scheduled_pickup_time).getTime();
      })
      .map((trip: any) => ({
        id: trip.id,
        client: getTripClientDisplayName(trip),
        status: trip.status,
        driver: getTripDriverDisplayName(trip) || 'Unassigned',
        pickupTime: trip.scheduled_pickup_time,
        formattedTime: format(parseISO(trip.scheduled_pickup_time), 'h:mm a'),
      }));
  }, [trips, getClientName]);

  // Get recent activity (last 72 hours) - trip-related only
  const recentActivity = useMemo(() => {
    if (!trips) return [];
    
    const seventyTwoHoursAgo = subHours(new Date(), 72);
    
    const activities: any[] = [];
    
    trips.forEach((trip: any) => {
      const createdAt = new Date(trip.created_at);
      const updatedAt = new Date(trip.updated_at);
      
      // Newly scheduled trips (created in last 72 hours)
      if (isAfter(createdAt, seventyTwoHoursAgo)) {
        activities.push({
          id: `new-${trip.id}`,
          type: 'trip_created',
          trip: trip,
          timestamp: createdAt,
          message: `New trip scheduled for ${getTripClientDisplayName(trip)}`,
        });
      }
      
      // Modified trips (updated in last 72 hours, but not newly created)
      if (isAfter(updatedAt, seventyTwoHoursAgo) && updatedAt.getTime() !== createdAt.getTime()) {
        // Check if status changed to cancelled
        if (trip.status === 'cancelled') {
          activities.push({
            id: `cancelled-${trip.id}`,
            type: 'trip_cancelled',
            trip: trip,
            timestamp: updatedAt,
            message: `Trip cancelled for ${getTripClientDisplayName(trip)}`,
          });
        } else {
          activities.push({
            id: `modified-${trip.id}`,
            type: 'trip_modified',
            trip: trip,
            timestamp: updatedAt,
            message: `Trip modified for ${getTripClientDisplayName(trip)}`,
          });
        }
      }
    });
    
    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }, [trips, getClientName]);

  const processedDrivers = drivers?.slice(0, 3).map((driver: any) => {
    // Get driver display name
    const driverName = driver.users?.first_name && driver.users?.last_name
      ? `${driver.users.first_name} ${driver.users.last_name}`
      : driver.users?.first_name || driver.users?.user_name || driver.user_id || 'Unknown Driver';
    
    return {
      id: driver.id,
      name: driverName,
      status: getDriverStatus(driver),
      trips: getDriverTripCountToday(driver, trips),
      location: getDriverLocation(driver),
    };
  }) || [];

  // Helper functions
  function calculateETA(scheduledTime: string) {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMinutes = Math.round((scheduled.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) return "Overdue";
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  function getDriverStatus(driver: any) {
    // Simple status logic - in real app, this would be more sophisticated
    const activeTrips = trips?.filter((trip: any) => trip.driver_id === driver.id && trip.status === 'in_progress') || [];
    if (activeTrips.length > 0) return 'active';
    return 'available';
  }

  // Get total trips for today (all statuses)
  function getDriverTripCountToday(driver: any, allTrips: any[]) {
    if (!allTrips) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return allTrips.filter((trip: any) => {
      if (trip.driver_id !== driver.id) return false;
      const tripDate = new Date(trip.scheduled_pickup_time);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate >= today && tripDate < tomorrow;
    }).length;
  }

  function getDriverLocation(driver: any) {
    // Placeholder - in real app, this would come from GPS tracking
    const locations = ['Downtown', 'Uptown', 'Central', 'Eastside', 'Westside'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-yellow-500';
      case 'scheduled': return '';
      case 'completed': return '';
      case 'active': return '';
      case 'break': return 'bg-orange-500';
      default: return '';
    }
  };
  
  const getStatusColorStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'scheduled': return { backgroundColor: 'var(--blue-9)' };
      case 'completed': return { backgroundColor: 'var(--completed)' };
      case 'active': return { backgroundColor: 'var(--completed)' };
      default: return {};
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress': return <Badge variant="secondary">In Progress</Badge>;
      case 'scheduled': return <Badge variant="default">Scheduled</Badge>;
      case 'completed': return <Badge variant="outline">Completed</Badge>;
      case 'active': return <Badge variant="default">Active</Badge>;
      case 'break': return <Badge variant="destructive">On Break</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = tripsLoading || driversLoading;
  const hasError = tripsError || driversError;

  return (
    <Widget
      title="Operations"
      size="large"
      className={className}
      loading={isLoading}
      error={hasError ? 'Failed to load live data' : undefined}
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-1" />
            View Map
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Section 1: Today's Trips */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Today's Trips</h4>
          <div className="space-y-2">
            {todaysTrips.length > 0 ? (
              todaysTrips.map((trip: any) => (
                <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--gray-1)' }}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(trip.status)}`} style={trip.status === 'completed' ? { backgroundColor: 'var(--completed)' } : getStatusColorStyle(trip.status)} />
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{trip.client}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>Driver: {trip.driver}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {trip.formattedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(trip.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No trips scheduled for today
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Recent Activity */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--gray-1)' }}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'trip_created' ? '' :
                      activity.type === 'trip_cancelled' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} style={activity.type === 'trip_created' ? { backgroundColor: 'var(--completed)' } : {}} />
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(activity.timestamp, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  {activity.trip && (
                    <Badge variant="outline" className="text-xs">
                      {activity.trip.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Driver Status */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Driver Status</h4>
          <div className="space-y-2">
            {processedDrivers.map((driver: any) => (
              <div key={driver.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--gray-1)' }}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(driver.status)}`} style={getStatusColorStyle(driver.status)} />
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{driver.name}</p>
                    <p className="text-xs text-muted-foreground">{driver.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">{driver.trips} trips</span>
                  {getStatusBadge(driver.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}
