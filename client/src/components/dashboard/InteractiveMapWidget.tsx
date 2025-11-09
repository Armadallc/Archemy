import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Car, Clock, Users, Layers, RefreshCw, AlertCircle } from "lucide-react";
import Widget from "./Widget";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { useHierarchy } from "../../hooks/useHierarchy";

// Import Leaflet directly
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapWidgetProps {
  className?: string;
}

interface DriverLocation {
  id: string;
  name: string;
  status: 'available' | 'on_trip' | 'offline' | 'break';
  location: {
    lat: number;
    lng: number;
  };
  lastUpdate: string;
  vehicle?: string;
  trips?: number;
}

interface TripLocation {
  id: string;
  client: string;
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
  scheduledTime?: string;
  eta?: string;
}

export default function InteractiveMapWidget({ className }: InteractiveMapWidgetProps) {
  const [map, setMap] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<'drivers' | 'trips'>('drivers');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const { level, selectedProgram, selectedCorporateClient, getFilterParams } = useHierarchy();

  // Fetch real data
  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers', getFilterParams()],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/drivers');
      const data = await response.json();
      return data || [];
    },
    enabled: true,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', getFilterParams()],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/trips');
      const data = await response.json();
      return data || [];
    },
    enabled: true,
  });

  // Initialize map when container is available
  useEffect(() => {
    if (!mapContainer || isMapLoaded) return;
    
    try {
      // Set default icon paths
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Create map centered on Denver, Colorado
      const mapInstance = L.map(mapContainer, {
        center: [39.7392, -104.9903], // Denver, Colorado coordinates
        zoom: 11,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance);

      setMap(mapInstance);
      setIsMapLoaded(true);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError(`Map initialization failed: ${error}`);
      setIsMapLoaded(true);
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [mapContainer, isMapLoaded, map]);

  // Update map markers when data changes
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    if (selectedView === 'drivers' && drivers) {
      // Add driver markers
      drivers.forEach((driver: any) => {
        if (driver.latitude && driver.longitude) {
          const marker = L.marker([driver.latitude, driver.longitude], {
            icon: getDriverIcon(driver.status),
          });

          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">${driver.name}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Status: ${getStatusText(driver.status)}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Vehicle: ${driver.vehicle || 'N/A'}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Last Update: ${new Date().toLocaleTimeString()}</p>
            </div>
          `);

          marker.addTo(map);
        }
      });
    } else if (selectedView === 'trips' && trips) {
      // Add trip markers and routes
      trips.forEach((trip: any) => {
        if (trip.pickup_latitude && trip.pickup_longitude) {
          // Pickup marker
          const pickupMarker = L.marker([trip.pickup_latitude, trip.pickup_longitude], {
            icon: getTripIcon('pickup', trip.status),
          });

          pickupMarker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">Pickup</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Client: ${trip.client_name || 'N/A'}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Address: ${trip.pickup_address || 'N/A'}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Status: ${getStatusText(trip.status)}</p>
            </div>
          `);

          pickupMarker.addTo(map);

          // Dropoff marker if available
          if (trip.dropoff_latitude && trip.dropoff_longitude) {
            const dropoffMarker = L.marker([trip.dropoff_latitude, trip.dropoff_longitude], {
              icon: getTripIcon('dropoff', trip.status),
            });

            dropoffMarker.bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">Dropoff</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Client: ${trip.client_name || 'N/A'}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Address: ${trip.dropoff_address || 'N/A'}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Status: ${getStatusText(trip.status)}</p>
              </div>
            `);

            dropoffMarker.addTo(map);

            // Draw route line
            const routeLine = L.polyline([
              [trip.pickup_latitude, trip.pickup_longitude],
              [trip.dropoff_latitude, trip.dropoff_longitude]
            ], {
              color: getRouteColor(trip.status),
              weight: 3,
              opacity: 0.7,
            });

            routeLine.addTo(map);
          }
        }
      });
    }
  }, [map, isMapLoaded, selectedView, drivers, trips]);

  const getDriverIcon = (status: string) => {
    const iconColor = getStatusColor(status);
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-6 h-6 rounded-full ${iconColor} border-2 border-white shadow-lg flex items-center justify-center">
        <Car className="w-3 h-3 text-white" />
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const getTripIcon = (type: 'pickup' | 'dropoff', status: string) => {
    const iconColor = getStatusColor(status);
    const iconSymbol = type === 'pickup' ? 'P' : 'D';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 rounded-full ${iconColor} border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
        ${iconSymbol}
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

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
      case 'break':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRouteColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6'; // blue
      case 'in_progress':
        return '#f59e0b'; // yellow
      case 'completed':
        return '#10b981'; // green
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
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
      case 'break':
        return 'On Break';
      default:
        return status;
    }
  };

  const handleRefresh = () => {
    // Trigger data refetch
    window.location.reload();
  };

  const isLoading = driversLoading || tripsLoading;

  return (
    <Widget
      title="Fleet Map"
      icon={<MapPin className="h-5 w-5" />}
      size="large"
      className={className}
      loading={isLoading}
      actions={
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Map Controls */}
        <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'drivers' | 'trips')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drivers" className="flex items-center space-x-2">
              <Car className="h-4 w-4" />
              <span>Drivers</span>
            </TabsTrigger>
            <TabsTrigger value="trips" className="flex items-center space-x-2">
              <Navigation className="h-4 w-4" />
              <span>Trips</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="space-y-4">
            {/* Driver Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Car className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {drivers?.length || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Drivers</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {drivers?.filter((d: any) => d.status === 'available').length || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trips" className="space-y-4">
            {/* Trip Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {trips?.length || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Trips</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {trips?.filter((t: any) => t.status === 'in_progress').length || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Interactive Map */}
        <div className="relative">
          <div 
            ref={(el) => setMapContainer(el)} 
            className="w-full h-64 min-h-64 rounded-lg border border-gray-200 dark:border-gray-700"
          />
          
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                {mapError ? (
                  <>
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600 dark:text-red-400">Map Error</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{mapError}</p>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setMapError(null);
                        setIsMapLoaded(false);
                      }}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading Denver area map...</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Initializing interactive map</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Fallback map if Leaflet fails */}
          {mapError && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Denver, Colorado</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Interactive map temporarily unavailable</p>
                <div className="mt-4 space-y-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full mx-auto"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full mx-auto"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Legend</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-900 dark:text-gray-100">Available/Scheduled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-900 dark:text-gray-100">On Trip/In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-900 dark:text-gray-100">On Break</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-900 dark:text-gray-100">Offline/Cancelled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-900 dark:text-gray-100">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
