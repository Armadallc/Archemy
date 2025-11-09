// Trip tracking service with location-aware functionality
import { apiRequest } from '../lib/queryClient';
import { getCurrentLocation, calculateDistance, openMapApp, LocationError } from '../lib/location';

export interface TripTrackingData {
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  distance_miles?: number;
  fuel_cost?: number;
  driver_notes?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
  status: string;
}

export class TripTracker {
  
  // Start trip tracking with location capture
  static async startTrip(tripId: string): Promise<any> {
    try {
      console.log('🚗 Starting trip tracking for:', tripId);
      
      // Attempt to get current location
      const location = await getCurrentLocation();
      console.log('📍 Location captured:', location);
      
      // First, update status with validation (without notes to avoid conflicts)
      const statusUpdateData = {
        status: 'in_progress',
        actualTimes: {
          pickup: new Date().toISOString()
        }
      };
      
      // Use PATCH /api/trips/:id which includes status validation
      const response = await apiRequest('PATCH', `/api/trips/${tripId}`, statusUpdateData);
      
      // If status update succeeds, update notes separately to preserve existing notes
      try {
        const currentTripResponse = await apiRequest('GET', `/api/trips/${tripId}`);
        const currentTrip = await currentTripResponse.json();
        
        const locationNote = `Trip started at: ${location.lat}, ${location.lng} (accuracy: ${location.accuracy}m)`;
        const existingNotes = currentTrip.notes || '';
        const combinedNotes = existingNotes 
          ? `${existingNotes}\n${locationNote}` 
          : locationNote;
        
        // Update notes separately (non-status update)
        await apiRequest('PATCH', `/api/trips/${tripId}`, { notes: combinedNotes });
      } catch (notesError) {
        // If notes update fails, log but don't fail the entire operation
        console.warn('⚠️ Could not update trip notes with location info:', notesError);
      }
      const data = await response.json();
      
      console.log('✅ Trip started successfully:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Error starting trip:', error);
      
      if (error instanceof LocationError) {
        // Re-throw location errors for specific handling in UI
        throw error;
      }
      
      throw new Error(`Failed to start trip: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Start trip manually without location (fallback)
  static async startTripManual(tripId: string, manualLocation?: string): Promise<any> {
    try {
      console.log('🚗 Starting trip manually for:', tripId);
      
      const updateData = {
        status: 'in_progress',
        driver_notes: manualLocation ? `Manual start location: ${manualLocation}` : 'Started manually without location',
        actualTimes: {
          pickup: new Date().toISOString()
        }
      };
      
      // Use PATCH /api/trips/:id which includes status validation
      const response = await apiRequest('PATCH', `/api/trips/${tripId}`, updateData);
      const data = await response.json();
      
      console.log('✅ Trip started manually:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Error starting trip manually:', error);
      throw new Error(`Failed to start trip: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Complete trip tracking with distance calculation
  static async completeTrip(
    tripId: string, 
    fuelCost?: number, 
    driverNotes?: string
  ): Promise<any> {
    try {
      console.log('🏁 Completing trip tracking for:', tripId);
      
      // Get trip data to calculate distance
      const tripResponse = await apiRequest('GET', `/api/trips/${tripId}`);
      const tripData = await tripResponse.json();
      
      let locationInfo = '';
      let distanceInfo = '';
      
      // Try to get end location and calculate distance
      try {
        const endLocation = await getCurrentLocation();
        console.log('📍 End location captured:', endLocation);
        locationInfo = `Trip ended at: ${endLocation.lat}, ${endLocation.lng} (accuracy: ${endLocation.accuracy}m)`;
        
        // Try to extract start location from trip notes if available
        const startLocationMatch = tripData.notes?.match(/Trip started at: ([\d.-]+), ([\d.-]+)/);
        if (startLocationMatch) {
          const startLat = parseFloat(startLocationMatch[1]);
          const startLng = parseFloat(startLocationMatch[2]);
          const distance = calculateDistance(startLat, startLng, endLocation.lat, endLocation.lng);
          distanceInfo = ` Distance: ${distance.toFixed(2)} miles`;
          console.log('📏 Distance calculated:', distance, 'miles');
        }
      } catch (locationError) {
        console.warn('⚠️ Could not capture end location:', locationError);
        // Continue without end location - trip can still be completed
      }
      
      // Combine notes (preserve existing notes, add new location/distance info)
      const existingNotes = tripData.notes || '';
      const newNotes = [driverNotes, locationInfo + distanceInfo].filter(Boolean).join(' | ');
      const combinedNotes = existingNotes ? `${existingNotes}\n${newNotes}` : newNotes;
      
      let updateData: any = {
        status: 'completed',
        notes: combinedNotes || '',
        actualTimes: {
          dropoff: new Date().toISOString()
        }
      };
      
      // Use PATCH /api/trips/:id which includes status validation
      const response = await apiRequest('PATCH', `/api/trips/${tripId}`, updateData);
      const data = await response.json();
      
      console.log('✅ Trip completed successfully:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Error completing trip:', error);
      throw new Error(`Failed to complete trip: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Complete trip manually without location (fallback)
  static async completeTripManual(
    tripId: string, 
    fuelCost?: number, 
    driverNotes?: string,
    manualDistance?: number
  ): Promise<any> {
    try {
      console.log('🏁 Completing trip manually for:', tripId);
      
      let updateData: any = {
        status: 'completed',
        driver_notes: driverNotes || 'Completed manually without location',
        actualTimes: {
          dropoff: new Date().toISOString()
        }
      };
      
      if (fuelCost && fuelCost > 0) {
        updateData.fuel_cost = fuelCost;
      }
      
      if (manualDistance && manualDistance > 0) {
        updateData.distance_miles = manualDistance;
      }
      
      // Use PATCH /api/trips/:id which includes status validation
      const response = await apiRequest('PATCH', `/api/trips/${tripId}`, updateData);
      const data = await response.json();
      
      console.log('✅ Trip completed manually:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Error completing trip manually:', error);
      throw new Error(`Failed to complete trip: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Open navigation to destination
  static openNavigation(destinationAddress: string): void {
    try {
      console.log('🗺️ Opening navigation to:', destinationAddress);
      openMapApp(destinationAddress);
    } catch (error) {
      console.error('❌ Error opening navigation:', error);
      // Fallback to alert with address
      alert(`Navigation address: ${destinationAddress}`);
    }
  }
  
  // Get trip tracking summary
  static async getTripSummary(tripId: string): Promise<any> {
    try {
      const response = await apiRequest('GET', `/api/trips/${tripId}`);
      const trip = await response.json();
      
      return {
        hasStartLocation: !!(trip.start_latitude && trip.start_longitude),
        hasEndLocation: !!(trip.end_latitude && trip.end_longitude),
        distance: trip.distance_miles,
        fuelCost: trip.fuel_cost,
        driverNotes: trip.driver_notes,
        actualPickupTime: trip.actual_pickup_time,
        actualDropoffTime: trip.actual_dropoff_time
      };
    } catch (error) {
      console.error('❌ Error getting trip summary:', error);
      throw error;
    }
  }
}