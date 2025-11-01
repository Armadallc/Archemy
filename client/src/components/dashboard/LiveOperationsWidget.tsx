import React, { useEffect, useState } from "react";
import { MapPin, Car, Clock, CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Widget from "./Widget";
import { useLiveTrips, useLiveDrivers } from "../../hooks/useRealtimeData";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useRealtimeService } from "../../services/realtimeService";

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
  
  // WebSocket connection for real-time updates
  const { isConnected, connectionStatus } = useWebSocket({
    enabled: true,
    onMessage: (message) => {
      console.log('🔄 LiveOperationsWidget received real-time update:', message.type);
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
  }, [isConnected, createService]);

  // Process real data
  const activeTrips = trips?.slice(0, 5).map((trip: any) => ({
    id: trip.id,
    client: `${trip.client?.first_name || 'Unknown'} ${trip.client?.last_name || ''}`,
    status: trip.status,
    driver: trip.driver?.user_id || 'Unassigned',
    eta: calculateETA(trip.scheduled_pickup_time),
  })) || [];

  const processedDrivers = drivers?.slice(0, 3).map((driver: any) => ({
    id: driver.id,
    name: driver.user_id || 'Unknown Driver',
    status: getDriverStatus(driver),
    trips: getDriverTripCount(driver, trips),
    location: getDriverLocation(driver),
  })) || [];

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

  function getDriverTripCount(driver: any, allTrips: any[]) {
    if (!allTrips) return 0;
    const today = new Date().toDateString();
    return allTrips.filter((trip: any) => {
      const tripDate = new Date(trip.scheduled_pickup_time).toDateString();
      return trip.driver_id === driver.id && tripDate === today;
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
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-green-500';
      case 'break': return 'bg-orange-500';
      default: return 'bg-gray-500';
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
      title="Live Operations"
      icon={<Car className="h-5 w-5" />}
      size="large"
      className={className}
      loading={isLoading}
      error={hasError ? 'Failed to load live data' : undefined}
      actions={
        <div className="flex items-center space-x-2">
          {/* Real-time connection status */}
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {connectionStatus === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-1" />
            View Map
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Active Trips */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Active Trips</h4>
          <div className="space-y-2">
            {activeTrips.map((trip: any) => (
              <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(trip.status)}`} />
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{trip.client}</p>
                    <p className="text-xs text-muted-foreground">Driver: {trip.driver}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">{trip.eta}</span>
                  {getStatusBadge(trip.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Status */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Driver Status</h4>
          <div className="space-y-2">
            {processedDrivers.map((driver: any) => (
              <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(driver.status)}`} />
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

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {trips?.filter((trip: any) => trip.status === 'completed').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {trips?.filter((trip: any) => trip.status === 'in_progress').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {trips?.filter((trip: any) => trip.status === 'scheduled').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
