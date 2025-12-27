/**
 * OpenRouteService Integration
 * 
 * Provides routing, distance, and time calculations using OpenRouteService API
 * Falls back to Haversine formula + average speed if API is unavailable
 */

interface RouteEstimate {
  distance: number; // in miles
  duration: number; // in minutes
  geometry?: string; // Route geometry for map visualization (GeoJSON)
}

interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Get OpenRouteService API key from environment
 */
function getApiKey(): string | null {
  const key = process.env.OPENROUTESERVICE_API_KEY || null;
  if (key) {
    console.log(`🔑 OpenRouteService API key found: ${key.substring(0, 20)}...`);
  } else {
    console.warn('⚠️ OpenRouteService API key not found in environment variables');
  }
  return key;
}

/**
 * Geocode address using OpenStreetMap Nominatim (free, no API key required)
 * This is the primary geocoding service since it's free and reliable
 */
export async function geocodeAddress(address: string): Promise<Coordinate | null> {
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'HALCYON-TMS/1.0', // Required by Nominatim
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        console.log(`✅ Geocoded "${address}" to ${lat}, ${lng} (using Nominatim)`);
        return { lat, lng };
      } else {
        console.warn(`⚠️ No geocoding results from Nominatim for: ${address}`);
      }
    } else {
      console.warn(`⚠️ Nominatim geocoding failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn('⚠️ Error geocoding with Nominatim:', error);
  }

  return null;
}

/**
 * Estimate route between two addresses using OpenRouteService
 * Returns distance (miles), duration (minutes), and optional route geometry
 */
export async function estimateRoute(
  fromAddress: string,
  toAddress: string,
  fromCoords?: Coordinate,
  toCoords?: Coordinate
): Promise<RouteEstimate | null> {
  const apiKey = getApiKey();
  
  console.log(`📏 Estimating route: "${fromAddress}" → "${toAddress}"`);
  console.log(`📏 API key configured: ${apiKey ? 'Yes' : 'No'}`);
  
  // If no API key, try fallback with provided coordinates
  if (!apiKey) {
    console.log('📏 OpenRouteService API key not configured, using fallback calculation');
    if (fromCoords && toCoords) {
      return estimateRouteFallback(fromAddress, toAddress, fromCoords, toCoords);
    }
    console.warn('⚠️ No API key and no coordinates provided - cannot calculate route');
    return null;
  }

  try {
    // Get coordinates if not provided
    let from = fromCoords;
    let to = toCoords;

    if (!from) {
      console.log(`📏 Geocoding from address: "${fromAddress}"`);
      from = await geocodeAddress(fromAddress);
      if (!from) {
        console.warn('⚠️ Could not geocode from address - route calculation requires both addresses');
        return null;
      }
    }

    if (!to) {
      console.log(`📏 Geocoding to address: "${toAddress}"`);
      to = await geocodeAddress(toAddress);
      if (!to) {
        console.warn('⚠️ Could not geocode to address - route calculation requires both addresses');
        return null;
      }
    }

    // Both coordinates must be available to calculate route
    if (!from || !to) {
      console.warn('⚠️ Missing coordinates for route calculation - need both origin and destination');
      return null;
    }

    // Call OpenRouteService Directions API
    // Try with API key in Authorization header first
    const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
    console.log(`📏 Calling OpenRouteService API with coordinates: [${from.lng}, ${from.lat}] → [${to.lng}, ${to.lat}]`);
    
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey, // Try without Bearer first
      },
      body: JSON.stringify({
        coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
        format: 'json',
        geometry: true, // Include route geometry for map visualization
      }),
    });
    
    // If 401/403, try with Bearer prefix
    if (!response.ok && (response.status === 401 || response.status === 403)) {
      console.log('📏 Trying with Bearer prefix...');
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
          format: 'json',
          geometry: true,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('⚠️ OpenRouteService API error:', response.status, response.statusText, errorText);
      // Try fallback with coordinates we have
      if (from && to) {
        console.log('📏 Falling back to Haversine calculation with geocoded coordinates');
        return estimateRouteFallback(fromAddress, toAddress, from, to);
      }
      // If we don't have coordinates, return null (will trigger error)
      console.warn('⚠️ Cannot use fallback - no coordinates available');
      return null;
    }

    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const summary = route.summary;
      
      // Convert distance from meters to miles
      const distanceMiles = (summary.distance / 1609.34);
      
      // Convert duration from seconds to minutes
      const durationMinutes = Math.round(summary.duration / 60);
      
      // Extract route geometry (encoded polyline)
      const geometry = route.geometry || null;

      return {
        distance: Math.round(distanceMiles * 100) / 100, // Round to 2 decimal places
        duration: durationMinutes,
        geometry: geometry ? JSON.stringify(geometry) : undefined,
      };
    }

    return estimateRouteFallback(fromAddress, toAddress, from, to);
  } catch (error) {
    console.warn('⚠️ Error calling OpenRouteService, using fallback:', error);
    return estimateRouteFallback(fromAddress, toAddress, fromCoords, toCoords);
  }
}

/**
 * Fallback route estimation using Haversine formula + average speed
 * Uses 42.5 mph average speed (midpoint of 40-45 mph range)
 */
function estimateRouteFallback(
  fromAddress: string,
  toAddress: string,
  fromCoords?: Coordinate | null,
  toCoords?: Coordinate | null
): RouteEstimate | null {
  // If we have coordinates, use Haversine
  if (fromCoords && toCoords) {
    const distance = calculateDistanceMiles(
      fromCoords.lat,
      fromCoords.lng,
      toCoords.lat,
      toCoords.lng
    );
    
    // Calculate time using average speed of 42.5 mph
    const durationMinutes = Math.round((distance / 42.5) * 60);
    
    console.log(`📏 Fallback calculation: ${distance.toFixed(2)} mi, ${durationMinutes} min`);
    return {
      distance,
      duration: durationMinutes,
    };
  }

  // If no coordinates, log warning but still return a basic estimate
  // This allows the UI to show something even if geocoding fails
  console.warn(`⚠️ No coordinates available for fallback calculation between "${fromAddress}" and "${toAddress}"`);
  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

/**
 * Estimate route for multiple legs (multi-stop trip)
 * Returns array of route estimates for each leg
 */
export async function estimateMultiLegRoute(
  addresses: string[],
  coordinates?: Coordinate[]
): Promise<(RouteEstimate | null)[]> {
  if (addresses.length < 2) {
    return [];
  }

  const results: (RouteEstimate | null)[] = [];
  
  for (let i = 0; i < addresses.length - 1; i++) {
    const fromAddress = addresses[i];
    const toAddress = addresses[i + 1];
    const fromCoords = coordinates?.[i];
    const toCoords = coordinates?.[i + 1];
    
    const estimate = await estimateRoute(fromAddress, toAddress, fromCoords, toCoords);
    results.push(estimate);
  }

  return results;
}

