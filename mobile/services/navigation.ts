// Cost-effective navigation and location services
// Uses browser geolocation API and free mapping services

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface NavigationService {
  getCurrentLocation(): Promise<Location>;
  openExternalNavigation(destination: string): void;
  startLocationTracking(callback: (location: Location) => void): () => void;
  calculateDistance(from: Location, to: Location): number;
  isWithinGeofence(location: Location, center: Location, radiusMeters: number): boolean;
}

class AffordableNavigationService implements NavigationService {
  private watchId: number | null = null;

  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  openExternalNavigation(destination: string): void {
    // Use device's default navigation app (free)
    const encodedDestination = encodeURIComponent(destination);
    
    // Try different navigation apps in order of preference
    const navigationUrls = [
      `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`, // Google Maps (free)
      `https://maps.apple.com/?daddr=${encodedDestination}`, // Apple Maps (free)
      `https://waze.com/ul?q=${encodedDestination}`, // Waze (free)
    ];

    // Open the first available navigation app
    window.open(navigationUrls[0], '_blank');
  }

  startLocationTracking(callback: (location: Location) => void): () => void {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        });
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000
      }
    );

    // Return cleanup function
    return () => {
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }
    };
  }

  calculateDistance(from: Location, to: Location): number {
    // Haversine formula for distance calculation (no API needed)
    const R = 6371000; // Earth's radius in meters
    const φ1 = from.latitude * Math.PI / 180;
    const φ2 = to.latitude * Math.PI / 180;
    const Δφ = (to.latitude - from.latitude) * Math.PI / 180;
    const Δλ = (to.longitude - from.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  isWithinGeofence(location: Location, center: Location, radiusMeters: number): boolean {
    const distance = this.calculateDistance(location, center);
    return distance <= radiusMeters;
  }

  // Free geocoding using OpenStreetMap Nominatim API
  async geocodeAddress(address: string): Promise<Location | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'MonarchTransportApp/1.0'
          }
        }
      );
      
      const data = await response.json();
      if (data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          timestamp: Date.now()
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Simple route estimation without API
  async estimateRoute(from: Location, to: Location): Promise<{
    distance: number;
    estimatedTime: number;
    straightLineDistance: number;
  }> {
    const straightLineDistance = this.calculateDistance(from, to);
    
    // Rough estimation: actual driving distance is typically 1.3x straight line
    const estimatedDrivingDistance = straightLineDistance * 1.3;
    
    // Estimate time based on average speed (30 mph / 48 km/h in city)
    const averageSpeedMPS = 13.4; // meters per second
    const estimatedTime = estimatedDrivingDistance / averageSpeedMPS;

    return {
      distance: estimatedDrivingDistance,
      estimatedTime,
      straightLineDistance
    };
  }
}

export const navigationService = new AffordableNavigationService();

// Deep Link handling for mobile app integration
export class DeepLinkService {
  private handlers: Map<string, (params: any) => void> = new Map();

  registerHandler(path: string, handler: (params: any) => void) {
    this.handlers.set(path, handler);
  }

  // Handle incoming deep links
  handleDeepLink(url: string) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const params = Object.fromEntries(urlObj.searchParams);
      
      const handler = this.handlers.get(path);
      if (handler) {
        handler(params);
      } else {
        console.warn('No handler for deep link:', path);
      }
    } catch (error) {
      console.error('Invalid deep link:', url, error);
    }
  }

  // Generate deep links for dispatch system
  generateTripLink(tripId: string): string {
    return `monarchdriver://trip/${tripId}`;
  }

  generateEmergencyLink(driverId: string, location?: Location): string {
    const params = new URLSearchParams({ driverId });
    if (location) {
      params.set('lat', location.latitude.toString());
      params.set('lng', location.longitude.toString());
    }
    return `monarchdriver://emergency?${params.toString()}`;
  }

  generateNavigationLink(destination: string): string {
    return `monarchdriver://navigate?destination=${encodeURIComponent(destination)}`;
  }
}

export const deepLinkService = new DeepLinkService();

// Geofencing without external APIs
export class SimpleGeofenceService {
  private geofences: Map<string, {
    center: Location;
    radius: number;
    onEnter?: () => void;
    onExit?: () => void;
  }> = new Map();

  private currentLocation: Location | null = null;
  private insideGeofences: Set<string> = new Set();

  addGeofence(
    id: string, 
    center: Location, 
    radius: number, 
    callbacks?: { onEnter?: () => void; onExit?: () => void }
  ) {
    this.geofences.set(id, {
      center,
      radius,
      onEnter: callbacks?.onEnter,
      onExit: callbacks?.onExit
    });
  }

  removeGeofence(id: string) {
    this.geofences.delete(id);
    this.insideGeofences.delete(id);
  }

  updateLocation(location: Location) {
    this.currentLocation = location;
    this.checkGeofences();
  }

  private checkGeofences() {
    if (!this.currentLocation) return;

    for (const [id, geofence] of this.geofences) {
      const isInside = navigationService.isWithinGeofence(
        this.currentLocation,
        geofence.center,
        geofence.radius
      );

      const wasInside = this.insideGeofences.has(id);

      if (isInside && !wasInside) {
        // Entered geofence
        this.insideGeofences.add(id);
        geofence.onEnter?.();
      } else if (!isInside && wasInside) {
        // Exited geofence
        this.insideGeofences.delete(id);
        geofence.onExit?.();
      }
    }
  }

  isInsideGeofence(id: string): boolean {
    return this.insideGeofences.has(id);
  }
}

export const geofenceService = new SimpleGeofenceService();