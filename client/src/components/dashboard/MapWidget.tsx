import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Car, Clock, Users } from "lucide-react";
import Widget from "./Widget";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface MapWidgetProps {
  className?: string;
}

interface DriverLocation {
  id: string;
  name: string;
  status: 'available' | 'on_trip' | 'offline';
  location: {
    lat: number;
    lng: number;
  };
  lastUpdate: string;
}

interface TripLocation {
  id: string;
  pickup: {
    address: string;
    lat: number;
    lng: number;
  };
  dropoff: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  driverId?: string;
}

export default function MapWidget({ className }: MapWidgetProps) {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [trips, setTrips] = useState<TripLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'drivers' | 'trips'>('drivers');

  // Mock data for demonstration
  useEffect(() => {
    const mockDrivers: DriverLocation[] = [
      {
        id: 'driver_001',
        name: 'John Smith',
        status: 'on_trip',
        location: { lat: 39.7392, lng: -104.9903 }, // Denver, CO
        lastUpdate: '2 min ago'
      },
      {
        id: 'driver_002',
        name: 'Sarah Johnson',
        status: 'available',
        location: { lat: 42.3736, lng: -71.1097 }, // Cambridge
        lastUpdate: '1 min ago'
      },
      {
        id: 'driver_003',
        name: 'Mike Wilson',
        status: 'offline',
        location: { lat: 42.3398, lng: -71.0882 }, // Somerville
        lastUpdate: '15 min ago'
      }
    ];

    const mockTrips: TripLocation[] = [
      {
        id: 'trip_001',
        pickup: {
          address: '123 Main St, Denver, CO',
          lat: 39.7392,
          lng: -104.9903
        },
        dropoff: {
          address: '456 Oak Ave, Boulder, CO',
          lat: 40.0150,
          lng: -105.2705
        },
        status: 'in_progress',
        driverId: 'driver_001'
      },
      {
        id: 'trip_002',
        pickup: {
          address: '789 Pine St, Lakewood, CO',
          lat: 39.7047,
          lng: -105.0814
        },
        dropoff: {
          address: '321 Elm St, Denver, CO',
          lat: 39.7392,
          lng: -104.9903
        },
        status: 'scheduled',
        driverId: 'driver_002'
      }
    ];

    setTimeout(() => {
      setDrivers(mockDrivers);
      setTrips(mockTrips);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'scheduled':
        return 'bg-green-500';
      case 'on_trip':
      case 'in_progress':
        return 'bg-blue-500';
      case 'offline':
      case 'cancelled':
        return 'bg-gray-500';
      case 'completed':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'on_trip':
        return 'On Trip';
      case 'offline':
        return 'Offline';
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <Widget
      title="Fleet Map"
      icon={<Navigation className="h-5 w-5" />}
      size="large"
      className={className}
      loading={isLoading}
      actions={
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedView === 'drivers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('drivers')}
          >
            <Car className="h-4 w-4 mr-1" />
            Drivers
          </Button>
          <Button
            variant={selectedView === 'trips' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('trips')}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Trips
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Map Placeholder */}
        <div className="relative h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Interactive Map View
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedView === 'drivers' ? 'Driver locations' : 'Trip routes'} will appear here
              </p>
            </div>
          </div>
          
          {/* Mock map markers */}
          <div className="absolute top-4 left-4 space-y-2">
            {selectedView === 'drivers' ? (
              drivers.map((driver) => (
                <div key={driver.id} className="flex items-center space-x-2 bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(driver.status)}`} />
                  <div className="text-xs">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{driver.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{driver.lastUpdate}</p>
                  </div>
                </div>
              ))
            ) : (
              trips.map((trip) => (
                <div key={trip.id} className="flex items-center space-x-2 bg-white dark:bg-gray-700 rounded-lg p-2 shadow-sm">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(trip.status)}`} />
                  <div className="text-xs">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Trip {trip.id.slice(-3)}</p>
                    <p className="text-gray-500 dark:text-gray-400">{getStatusText(trip.status)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Car className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{drivers.length}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Drivers</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{trips.length}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Trips</p>
          </div>
        </div>

        {/* Status Legend */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Legend</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-900 dark:text-gray-100">Available/Scheduled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-900 dark:text-gray-100">On Trip/In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-gray-900 dark:text-gray-100">Offline/Cancelled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-gray-900 dark:text-gray-100">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
