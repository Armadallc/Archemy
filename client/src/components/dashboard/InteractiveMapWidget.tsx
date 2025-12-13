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

export default function InteractiveMapWidget({ className, shadow }: InteractiveMapWidgetProps) {
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

  // Helper to get CSS variable value
  const getCSSVariable = (variable: string): string => {
    if (typeof window !== 'undefined') {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
    }
    return '';
  };

  const getStatusColor = (status: string) => {
    // Return inline style with CSS variable for dynamic theming
    switch (status) {
      case 'available':
      case 'scheduled':
        return { backgroundColor: getCSSVariable('--scheduled') || 'hsl(45, 100%, 51%)' };
      case 'on_trip':
      case 'in_progress':
        return { backgroundColor: getCSSVariable('--in-progress') || 'hsl(36, 100%, 50%)' };
      case 'offline':
      case 'cancelled':
        return { backgroundColor: getCSSVariable('--cancelled') || 'hsl(0, 84%, 60%)' };
      case 'completed':
        return { backgroundColor: getCSSVariable('--completed') || 'hsl(122, 39%, 49%)' };
      case 'break':
        return { backgroundColor: getCSSVariable('--driver-color-5') || '#f59e0b' }; // Fire palette: amber (from CSS variable definition)
      default:
        return { backgroundColor: getCSSVariable('--muted-foreground') || '#5c6166' }; // Fire palette: charcoal-muted
    }
  };

  const getRouteColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return getCSSVariable('--scheduled') || '#7afffe'; // Fire palette: Ice-derived
      case 'in_progress':
        return getCSSVariable('--in-progress') || '#f1fe60'; // Fire palette: Lime-derived
      case 'completed':
        return getCSSVariable('--completed') || '#3bfec9'; // Fire palette: Lime-derived
      case 'cancelled':
        return getCSSVariable('--cancelled') || '#e04850'; // Fire palette: Coral-dark
      default:
        return getCSSVariable('--muted-foreground') || '#5c6166'; // Fire palette: charcoal-muted
    }
  };

  const getDriverIcon = (status: string) => {
    const iconColorStyle = getStatusColor(status);
    const bgColor = iconColorStyle.backgroundColor;
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style="background-color: ${bgColor};">
        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/></svg>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const getTripIcon = (type: 'pickup' | 'dropoff', status: string) => {
    const iconColorStyle = getStatusColor(status);
    const bgColor = iconColorStyle.backgroundColor;
    const iconSymbol = type === 'pickup' ? 'P' : 'D';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs" style="background-color: ${bgColor};">
        ${iconSymbol}
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
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
      shadow={shadow}
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
                  <Car className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  <span className="text-2xl font-bold text-foreground">
                    {drivers?.length || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Total Drivers</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Users className="h-4 w-4" style={{ color: 'var(--completed)' }} />
                  <span className="text-2xl font-bold text-foreground">
                    {drivers?.filter((d: any) => d.status === 'available').length || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trips" className="space-y-4">
            {/* Trip Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Navigation className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  <span className="text-2xl font-bold text-foreground">
                    {trips?.length || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Total Trips</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Clock className="h-4 w-4" style={{ color: 'var(--in-progress)' }} />
                  <span className="text-2xl font-bold text-foreground">
                    {trips?.filter((t: any) => t.status === 'in_progress').length || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Interactive Map */}
        <div 
          ref={(el) => setMapContainer(el)} 
          className="w-full h-64 min-h-64 rounded-lg border border-border relative"
          style={{ fontFamily: '"Space Grotesk"', height: '485px' }}
        >
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary rounded-lg">
              <div className="text-center">
                {mapError ? (
                  <>
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--destructive)' }} />
                    <p className="text-sm" style={{ color: 'var(--destructive)' }}>Map Error</p>
                    <p className="text-xs text-muted-foreground mt-1">{mapError}</p>
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--primary)' }}></div>
                    <p className="text-sm text-foreground">Loading Denver area map...</p>
                    <p className="text-xs text-muted-foreground mt-1">Initializing interactive map</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Fallback map if Leaflet fails */}
          {mapError && (
            <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ 
              background: 'linear-gradient(to bottom right, var(--primary), var(--accent))',
              opacity: 0.1
            }}>
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--primary)' }} />
                <p className="text-sm font-medium text-foreground">Denver, Colorado</p>
                <p className="text-xs text-muted-foreground">Interactive map temporarily unavailable</p>
                <div className="mt-4 space-y-1">
                  <div className="w-2 h-2 rounded-full mx-auto" style={{ backgroundColor: 'var(--primary)' }}></div>
                  <div className="w-1 h-1 rounded-full mx-auto" style={{ backgroundColor: 'var(--muted-foreground)' }}></div>
                  <div className="w-1 h-1 rounded-full mx-auto" style={{ backgroundColor: 'var(--muted-foreground)' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Status Legend</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--scheduled)' }}></div>
              <span className="text-foreground">Available/Scheduled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--in-progress)' }}></div>
              <span className="text-foreground">On Trip/In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--driver-color-5)' }}></div>
              <span className="text-foreground">On Break</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--cancelled)' }}></div>
              <span className="text-foreground">Offline/Cancelled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--completed)' }}></div>
              <span className="text-foreground">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
