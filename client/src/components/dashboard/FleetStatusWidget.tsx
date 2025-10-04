import React from "react";
import { MapPin, Car, Navigation, AlertTriangle } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Widget from "./Widget";

interface FleetStatusWidgetProps {
  className?: string;
}

export default function FleetStatusWidget({ className }: FleetStatusWidgetProps) {
  // Mock data - in real implementation, this would come from API
  const fleetData = [
    { id: 1, vehicle: "Van-001", driver: "Alice Smith", status: "active", location: "Downtown", battery: 85, trips: 12 },
    { id: 2, vehicle: "Van-002", driver: "Bob Johnson", status: "active", location: "Uptown", battery: 92, trips: 8 },
    { id: 3, vehicle: "Van-003", driver: "Carol Davis", status: "maintenance", location: "Garage", battery: 0, trips: 0 },
    { id: 4, vehicle: "Van-004", driver: "David Wilson", status: "break", location: "Central", battery: 78, trips: 15 },
  ];

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

  const getBatteryColor = (battery: number) => {
    if (battery > 80) return 'text-green-600';
    if (battery > 50) return 'text-yellow-600';
    return 'text-red-600';
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
        {fleetData.map((vehicle) => (
          <div key={vehicle.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getStatusColor(vehicle.status)}`}>
                  {getStatusIcon(vehicle.status)}
                </div>
                <div>
                  <p className="font-medium text-sm">{vehicle.vehicle}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.driver}</p>
                </div>
              </div>
              <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="font-medium">{vehicle.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Trips Today</p>
                <p className="font-medium">{vehicle.trips}</p>
              </div>
            </div>
            
            {vehicle.status === 'active' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Battery</span>
                  <span className={getBatteryColor(vehicle.battery)}>{vehicle.battery}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      vehicle.battery > 80 ? 'bg-green-500' :
                      vehicle.battery > 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${vehicle.battery}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Fleet Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">2</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">1</div>
            <div className="text-xs text-muted-foreground">On Break</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">1</div>
            <div className="text-xs text-muted-foreground">Maintenance</div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
