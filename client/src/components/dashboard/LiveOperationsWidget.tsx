import React from "react";
import { MapPin, Car, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Widget from "./Widget";

interface LiveOperationsWidgetProps {
  className?: string;
}

export default function LiveOperationsWidget({ className }: LiveOperationsWidgetProps) {
  // Mock data - in real implementation, this would come from API
  const activeTrips = [
    { id: 1, client: "John Doe", status: "in_progress", driver: "Alice Smith", eta: "5 min" },
    { id: 2, client: "Jane Wilson", status: "scheduled", driver: "Bob Johnson", eta: "15 min" },
    { id: 3, client: "Mike Brown", status: "in_progress", driver: "Carol Davis", eta: "8 min" },
  ];

  const drivers = [
    { id: 1, name: "Alice Smith", status: "active", trips: 2, location: "Downtown" },
    { id: 2, name: "Bob Johnson", status: "active", trips: 1, location: "Uptown" },
    { id: 3, name: "Carol Davis", status: "break", trips: 0, location: "Central" },
  ];

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

  return (
    <Widget
      title="Live Operations"
      icon={<Car className="h-5 w-5" />}
      size="large"
      className={className}
      actions={
        <Button variant="outline" size="sm">
          <MapPin className="h-4 w-4 mr-1" />
          View Map
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Active Trips */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Active Trips</h4>
          <div className="space-y-2">
            {activeTrips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(trip.status)}`} />
                  <div>
                    <p className="font-medium text-sm">{trip.client}</p>
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
            {drivers.map((driver) => (
              <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(driver.status)}`} />
                  <div>
                    <p className="font-medium text-sm">{driver.name}</p>
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
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">3</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">5</div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
