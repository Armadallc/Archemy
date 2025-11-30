// Enhanced location tracking with permission handling and fallbacks
export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export type LocationPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export class LocationError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

// Check current location permission status
export async function checkLocationPermission(): Promise<LocationPermissionState> {
  if (!navigator.permissions) {
    return 'unknown';
  }
  
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state as LocationPermissionState;
  } catch (error) {
    return 'unknown';
  }
}

// Enhanced location function with comprehensive error handling
export async function getCurrentLocation(): Promise<Location> {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    throw new LocationError(
      'Location services not supported by this browser',
      'NOT_SUPPORTED'
    );
  }

  // Check current permission status
  const permissionState = await checkLocationPermission();
  if (permissionState === 'denied') {
    throw new LocationError(
      'Location access denied. Please enable in browser settings.',
      'PERMISSION_DENIED'
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        });
      },
      error => {
        let message = 'Location access failed: ';
        let code: LocationError['code'] = 'UNKNOWN';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'Permission denied. Please allow location access.';
            code = 'PERMISSION_DENIED';
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Location unavailable. Check GPS/WiFi.';
            code = 'POSITION_UNAVAILABLE';
            break;
          case error.TIMEOUT:
            message += 'Location request timed out. Try again.';
            code = 'TIMEOUT';
            break;
          default:
            message += 'Unknown error occurred.';
            code = 'UNKNOWN';
            break;
        }
        reject(new LocationError(message, code));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,        // Increased timeout
        maximumAge: 60000
      }
    );
  });
}

// Haversine formula for calculating distance between two points (in miles)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Open native map app for navigation
export function openMapApp(destinationAddress: string): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isIOS) {
    // Open Apple Maps
    window.open(`maps://?daddr=${encodeURIComponent(destinationAddress)}`);
  } else if (isAndroid) {
    // Open Google Maps
    window.open(`geo:0,0?q=${encodeURIComponent(destinationAddress)}`);
  } else {
    // Fallback to web Google Maps
    window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(destinationAddress)}`);
  }
}

// Monitor permission changes
export function monitorLocationPermission(callback: (state: LocationPermissionState) => void): () => void {
  if (!navigator.permissions) {
    return () => {};
  }

  let permission: PermissionStatus;
  
  navigator.permissions.query({ name: 'geolocation' }).then(perm => {
    permission = perm;
    permission.addEventListener('change', () => {
      callback(permission.state as LocationPermissionState);
    });
  });

  return () => {
    if (permission) {
      permission.removeEventListener('change', () => {});
    }
  };
}