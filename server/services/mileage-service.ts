/**
 * Mileage Service
 * 
 * Handles:
 * 1. Pre-trip mileage estimation (using addresses)
 * 2. Post-trip actual mileage calculation (using location tracking data)
 */

import { supabase } from '../db';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistanceMiles(
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
 * Geocode an address to get coordinates
 * Uses a simple approach: try to find the address in locations table first,
 * then fall back to a basic geocoding service if needed
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // First, try to find the address in the locations table
    const { data: location } = await supabase
      .from('locations')
      .select('latitude, longitude')
      .or(`address.ilike.%${address}%,name.ilike.%${address}%`)
      .limit(1)
      .single();
    
    if (location && location.latitude && location.longitude) {
      return {
        lat: parseFloat(location.latitude.toString()),
        lng: parseFloat(location.longitude.toString())
      };
    }
    
    // Try frequent_locations table
    const { data: frequentLocation } = await supabase
      .from('frequent_locations')
      .select('*')
      .or(`full_address.ilike.%${address}%,street_address.ilike.%${address}%`)
      .limit(1)
      .single();
    
    if (frequentLocation) {
      // Try to extract coordinates from address or use a geocoding service
      // For now, return null if we can't find coordinates
      // TODO: Integrate with a geocoding API (Google Maps, OpenStreetMap Nominatim, etc.)
      return null;
    }
    
    // If no coordinates found, return null
    // The caller can handle this gracefully
    return null;
  } catch (error) {
    console.warn('⚠️ Could not geocode address:', address, error);
    return null;
  }
}

/**
 * Estimate mileage before trip using pickup and dropoff addresses
 * Returns estimated distance in miles
 */
export async function estimateTripMileage(
  pickupAddress: string,
  dropoffAddress: string,
  pickupLat?: number,
  pickupLng?: number,
  dropoffLat?: number,
  dropoffLng?: number
): Promise<number | null> {
  try {
    let puLat = pickupLat;
    let puLng = pickupLng;
    let doLat = dropoffLat;
    let doLng = dropoffLng;
    
    // If coordinates not provided, try to geocode addresses
    if (!puLat || !puLng) {
      const puCoords = await geocodeAddress(pickupAddress);
      if (puCoords) {
        puLat = puCoords.lat;
        puLng = puCoords.lng;
      }
    }
    
    if (!doLat || !doLng) {
      const doCoords = await geocodeAddress(dropoffAddress);
      if (doCoords) {
        doLat = doCoords.lat;
        doLng = doCoords.lng;
      }
    }
    
    // If we have both coordinates, calculate distance
    if (puLat && puLng && doLat && doLng) {
      return calculateDistanceMiles(puLat, puLng, doLat, doLng);
    }
    
    // If we can't get coordinates, return null
    // The system can still work without estimated mileage
    console.warn('⚠️ Could not estimate mileage - missing coordinates for addresses');
    return null;
  } catch (error) {
    console.error('❌ Error estimating trip mileage:', error);
    return null;
  }
}

/**
 * Calculate actual mileage from location tracking data
 * Uses driver_locations table to calculate total distance traveled during trip
 */
export async function calculateActualTripMileage(
  tripId: string,
  driverId: string,
  tripStartTime: string,
  tripEndTime: string
): Promise<number | null> {
  try {
    // Get all location updates for this trip (prefer trip_id, fallback to time range)
    let locations;
    let error;
    
    // First try to get locations by trip_id (more accurate)
    const { data: tripLocations, error: tripError } = await supabase
      .from('driver_locations')
      .select('latitude, longitude, timestamp')
      .eq('trip_id', tripId)
      .eq('is_active', true)
      .order('timestamp', { ascending: true });
    
    if (!tripError && tripLocations && tripLocations.length > 0) {
      locations = tripLocations;
      console.log('📏 Using trip_id-based location data for mileage calculation');
    } else {
      // Fallback to time-based query if trip_id not available
      const { data: timeLocations, error: timeError } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, timestamp')
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .gte('timestamp', tripStartTime)
        .lte('timestamp', tripEndTime)
        .order('timestamp', { ascending: true });
      
      locations = timeLocations;
      error = timeError;
      console.log('📏 Using time-based location data for mileage calculation');
    }
    
    if (error) {
      console.error('❌ Error fetching location data:', error);
      return null;
    }
    
    if (!locations || locations.length < 2) {
      console.warn('⚠️ Not enough location data to calculate mileage. Found', locations?.length || 0, 'location points');
      return null;
    }
    
    // Calculate total distance by summing distances between consecutive points
    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
        const segmentDistance = calculateDistanceMiles(
          parseFloat(prev.latitude.toString()),
          parseFloat(prev.longitude.toString()),
          parseFloat(curr.latitude.toString()),
          parseFloat(curr.longitude.toString())
        );
        totalDistance += segmentDistance;
      }
    }
    
    return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('❌ Error calculating actual trip mileage:', error);
    return null;
  }
}

/**
 * Calculate mileage for round trip (includes return leg)
 */
export async function calculateRoundTripMileage(
  pickupAddress: string,
  dropoffAddress: string,
  pickupLat?: number,
  pickupLng?: number,
  dropoffLat?: number,
  dropoffLng?: number
): Promise<number | null> {
  // For round trip, estimate is: PU -> DO -> PU (double the one-way distance)
  const oneWayDistance = await estimateTripMileage(
    pickupAddress,
    dropoffAddress,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng
  );
  
  if (oneWayDistance === null) return null;
  
  return oneWayDistance * 2;
}

