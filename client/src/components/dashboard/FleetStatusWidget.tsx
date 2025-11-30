import React from "react";
import { MapPin, Car, Navigation, AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Widget from "./Widget";

interface FleetStatusWidgetProps {
  className?: string;
  drivers?: any[];
  trips?: any[];
}

export default function FleetStatusWidget({ className, drivers, trips }: FleetStatusWidgetProps) {
  // Get in-progress trips
  const inProgressTrips = trips?.filter((trip: any) => trip.status === 'in_progress') || [];
  
  // If no active trips, show muted/greyscale state
  const hasActiveTrips = inProgressTrips.length > 0;
  
  // Map in-progress trips to fleet data
  const fleetData = hasActiveTrips ? inProgressTrips.slice(0, 4).map((trip: any, index: number) => {
    const driver = trip.drivers;
    const driverName = driver?.users?.first_name && driver?.users?.last_name
      ? `${driver.users.first_name} ${driver.users.last_name}`
      : driver?.users?.user_name || driver?.user_id || `Driver ${index + 1}`;
    
    return {
      id: trip.id || `trip-${index}`,
      vehicle: `Van-${String(index + 1).padStart(3, '0')}`,
      driver: driverName,
      status: trip.status,
      location: trip.pickup_address || "En route", // Use pickup address or default
      tripStatus: trip.status,
      tripId: trip.id,
    };
  }) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'break': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'maintenance': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
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

  // Get trip status color for battery indicator
  const getTripStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#ccbd33';
      case 'in_progress': return '#cc33ab';
      case 'completed': return '#33ccad';
      case 'cancelled': return '#cc5833';
      default: return '#6b7280'; // muted grey
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
      size="large"
      className={className}
      actions={
        <Button variant="outline" size="sm">
          <Navigation className="h-4 w-4 mr-1" />
          Track All
        </Button>
      }
    >
      <div className="space-y-4">
        {hasActiveTrips ? (
          fleetData.map((vehicle) => {
            const batteryPercent = getBatteryPercentage(vehicle.tripStatus);
            const statusColor = getTripStatusColor(vehicle.tripStatus);
            
            return (
              <div key={vehicle.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getStatusColor(vehicle.status)}`}>
                      {getStatusIcon(vehicle.status)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{vehicle.vehicle}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.driver}</p>
                    </div>
                  </div>
                  <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                    {vehicle.tripStatus === 'in_progress' ? 'In Progress' : vehicle.tripStatus.charAt(0).toUpperCase() + vehicle.tripStatus.slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Location</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.location}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Trip Status</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{vehicle.tripStatus.replace('_', ' ')}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span style={{ color: statusColor }}>{batteryPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
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
            <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-muted-foreground">No active trips</p>
            <p className="text-xs text-muted-foreground mt-1">Fleet is idle</p>
          </div>
        )}

        {/* Fleet Summary */}
        {hasActiveTrips && (
          <div className="grid grid-cols-3 gap-4 pt-2 pb-2 border-t">
            <div className="text-center shadow-xl">
              <div className="text-2xl font-bold text-[#26282b] dark:text-[#eaeaea]">
                {inProgressTrips.length}
              </div>
              <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70">In Progress</div>
            </div>
            <div className="text-center shadow-xl">
              <div className="text-2xl font-bold text-[#26282b] dark:text-[#eaeaea]">
                {trips?.filter((t: any) => t.status === 'scheduled').length || 0}
              </div>
              <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70">Scheduled</div>
            </div>
            <div className="text-center shadow-xl">
              <div className="text-2xl font-bold text-[#26282b] dark:text-[#eaeaea]">
                {trips?.filter((t: any) => t.status === 'completed').length || 0}
              </div>
              <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70">Completed</div>
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
}
