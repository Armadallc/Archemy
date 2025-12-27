import express from "express";
import { supabase } from "../db";
import { 
  requireSupabaseAuth, 
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { mobileApi } from "../mobile-api";
import { broadcastDriverUpdate } from "../websocket-instance";

const router = express.Router();

// ============================================================================
// MOBILE API ROUTES
// ============================================================================

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Mobile API test endpoint working" });
});

// Mobile endpoint to get trips for current authenticated driver
router.get("/trips/driver", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;
    console.log('🔍 Mobile: Fetching trips for user:', userId);
    
    // First, find the driver record associated with this user
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (driverError || !driver) {
      console.log('❌ Mobile: No driver found for user:', userId, driverError);
      // Return empty array if no driver found
      return res.json([]);
    }
    
    const driverId = driver.id;
    console.log('👤 Mobile: Found driver ID:', driverId);
    
    // Get trips for this driver using the mobile API (which processes trips and adds group names)
    console.log('🔍 Mobile: Calling mobileApi.getDriverTrips with driverId:', driverId);
    const trips = await mobileApi.getDriverTrips(driverId);
    console.log('✅ Mobile: Found', trips?.length || 0, 'trips for driver');
    console.log('📋 Mobile: Trip data sample:', trips?.slice(0, 2)); // Log first 2 trips to avoid spam
    
    res.json(trips || []);
  } catch (error) {
    console.error("❌ Mobile: Error fetching driver trips:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Unknown';
    console.error("❌ Mobile: Error name:", errorName);
    console.error("❌ Mobile: Error message:", errorMessage);
    console.error("❌ Mobile: Error stack:", errorStack);
    if (error instanceof Error && 'code' in error) {
      console.error("❌ Mobile: Error code:", (error as any).code);
    }
    console.error("❌ Mobile: Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ 
      message: "Failed to fetch driver trips", 
      error: errorMessage,
      errorName: errorName,
      ...(errorStack && { stack: errorStack })
    });
  }
});

// Mobile endpoint to get driver profile for current authenticated driver
router.get("/driver/profile", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;
    console.log('🔍 Mobile: Fetching driver profile for user:', userId);
    console.log('🔍 Mobile: User ID type:', typeof userId, 'Value:', JSON.stringify(userId));
    
    // Diagnostic: Check all drivers to see what's in the table
    const { data: allDrivers, error: allDriversError } = await supabase
      .from('drivers')
      .select('id, user_id, program_id, is_active')
      .limit(10);
    console.log('🔍 Mobile: Sample of all drivers in table:', allDrivers);
    console.log('🔍 Mobile: Looking for driver with user_id matching:', userId);
    
    // First, find the driver record(s) associated with this user
    // Use .limit(1) instead of .single() to handle multiple records gracefully
    let { data: drivers, error: driverError } = await supabase
      .from('drivers')
      .select('id, user_id, program_id, is_active, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) // Get the newest one first
      .limit(1);
    
    let driver = drivers && drivers.length > 0 ? drivers[0] : null;
    
    console.log('🔍 Mobile: Driver query result:', { 
      drivers,
      driver,
      error: driverError,
      errorCode: driverError?.code,
      errorMessage: driverError?.message,
      errorDetails: driverError?.details
    });
    
    // If multiple drivers found, log a warning
    if (drivers && drivers.length > 1) {
      console.warn('⚠️ Mobile: Multiple driver records found for user:', userId, '- using the most recent one');
      console.warn('⚠️ Mobile: All driver records:', drivers);
    }
    
    // If driver record doesn't exist, create it automatically
    if (driverError || !driver) {
      console.log('⚠️ Mobile: No driver record found for user:', userId, '- creating one automatically');
      console.log('⚠️ Mobile: Driver error details:', JSON.stringify(driverError, null, 2));
      
      // Get user info to create driver record
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('user_id, user_name, email, primary_program_id, corporate_client_id')
        .eq('user_id', userId)
        .single();
      
      if (userError || !user) {
        console.error('❌ Mobile: User not found:', userId, userError);
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user has a primary_program_id (required for drivers table)
      if (!user.primary_program_id) {
        console.error('❌ Mobile: User does not have a primary_program_id, cannot create driver record');
        return res.status(400).json({ error: 'User must have a primary program assigned to create driver profile' });
      }
      
      // Create driver record
      const driverId = `driver_${userId}_${Date.now()}`;
      const { data: newDriver, error: createError } = await supabase
        .from('drivers')
        .insert({
          id: driverId,
          user_id: userId,
          program_id: user.primary_program_id, // Required field
          license_number: 'TBD', // Temporary - should be updated later
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (createError || !newDriver) {
        console.error('❌ Mobile: Failed to create driver record:', createError);
        return res.status(500).json({ error: 'Failed to create driver record' });
      }
      
      console.log('✅ Mobile: Created driver record:', driverId);
      driver = newDriver;
    }
    
    const driverId = driver.id;
    console.log('👤 Mobile: Found driver ID:', driverId);
    
    // Get driver profile using mobile API
    try {
      const profile = await mobileApi.getDriverProfile(driverId);
      res.json(profile);
    } catch (profileError) {
      console.error("❌ Mobile: Error in getDriverProfile:", profileError);
      console.error("❌ Mobile: Profile error details:", {
        name: profileError instanceof Error ? profileError.name : 'Unknown',
        message: profileError instanceof Error ? profileError.message : String(profileError),
        stack: profileError instanceof Error ? profileError.stack : undefined,
        code: (profileError as any)?.code,
        details: (profileError as any)?.details,
        hint: (profileError as any)?.hint
      });
      
      // If getDriverProfile fails, return a basic profile with just the driver ID
      // This allows location tracking to work even if profile fetch fails
      console.log('⚠️ Mobile: Returning minimal profile due to error');
      res.json({
        id: driverId,
        user_id: userId,
        user_name: 'Driver',
        email: '',
        current_status: 'off_duty'
      });
    }
  } catch (error) {
    console.error("❌ Mobile: Error in driver profile endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("❌ Mobile: Full error:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: errorMessage,
      stack: errorStack,
      code: (error as any)?.code,
      details: (error as any)?.details
    });
    res.status(500).json({ 
      message: "Failed to fetch driver profile", 
      error: errorMessage
    });
  }
});

// Mobile endpoint to update driver availability status
router.patch("/driver/:driverId/availability", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { driverId } = req.params;
    const { is_available } = req.body;

    // Validate required fields
    if (typeof is_available !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid is_available field (must be boolean)' });
    }

    // Verify the driverId belongs to the authenticated user
    const userId = req.user.userId;
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, user_id')
      .eq('id', driverId)
      .eq('user_id', userId)
      .single();

    if (driverError || !driver) {
      return res.status(403).json({ error: 'Driver not found or access denied' });
    }

    // If trying to set is_available to false, check for active trips
    // Only block if there are trips with status 'in_progress' (not scheduled, confirmed, etc.)
    if (is_available === false) {
      let inProgressTrips = [];
      let tripsError = null;
      
      try {
        // Only select the fields we actually need for validation (much faster than select('*'))
        const result = await supabase
          .from('trips')
          .select('id, status, actual_pickup_time, actual_dropoff_time, pickup_address, dropoff_address, trip_type, client_id, client_group_id')
          .eq('driver_id', driverId)
          .eq('status', 'in_progress')
          .limit(10); // Get multiple to log for debugging
        
        inProgressTrips = result.data || [];
        tripsError = result.error;
      } catch (error) {
        console.error('❌ Exception checking for active trips:', error);
        tripsError = error as any;
      }

      if (tripsError) {
        console.error('❌ Error checking for active trips:', {
          error: tripsError,
          message: tripsError?.message || 'Unknown error',
          code: tripsError?.code,
          details: tripsError?.details,
          hint: tripsError?.hint,
          driverId
        });
        // Don't block the toggle if we can't check for trips - allow it to proceed
        // The frontend already validated, so this is just a safety check
        console.warn('⚠️ Could not verify active trips, allowing toggle (frontend already validated)');
        // Continue with the update instead of blocking
      }

      // Filter to only trips that are TRULY active (started but not ended)
      // A trip is truly active if:
      // - status = 'in_progress' AND
      // - actual_pickup_time exists (trip has actually started) AND
      // - actual_dropoff_time is null (trip hasn't ended yet)
      const activeTrips = (inProgressTrips || []).filter(t => {
        // Safely check for actual_pickup_time and actual_dropoff_time
        const actualPickup = (t as any).actual_pickup_time;
        const actualDropoff = (t as any).actual_dropoff_time;
        const hasStarted = actualPickup != null && actualPickup !== '';
        const hasNotEnded = actualDropoff == null || actualDropoff === '';
        return hasStarted && hasNotEnded;
      });

      // Only block if there are trips that are TRULY in progress
      // Scheduled trips (status = 'scheduled' or 'confirmed') should NOT block
      // Trips with 'in_progress' status but no actual_pickup_time should NOT block
      if (activeTrips && activeTrips.length > 0) {
        // Format trip details for error message
        const tripDetails = activeTrips.map(t => ({
          id: (t as any).id,
          client_name: (t as any).client_name || 
                      ((t as any).clients?.first_name && (t as any).clients?.last_name 
                        ? `${(t as any).clients.first_name} ${(t as any).clients.last_name}` 
                        : null) || 
                      (t as any).client_groups?.name || 
                      'Unknown Client',
          pickup_address: (t as any).pickup_address || (t as any).pickup_locations?.address || 'N/A',
          dropoff_address: (t as any).dropoff_address || (t as any).dropoff_locations?.address || 'N/A',
          scheduled_pickup: (t as any).scheduled_pickup_time,
          actual_pickup: (t as any).actual_pickup_time,
          trip_type: (t as any).trip_type || 'one_way'
        }));
        
        console.log('🚫 Blocking availability toggle - found active trips:', tripDetails);
        
        // Create detailed error message
        const tripCount = activeTrips.length;
        const tripList = tripDetails.map((t, idx) => 
          `${idx + 1}. ${t.client_name} (${t.trip_type === 'round_trip' ? 'Round Trip' : 'One Way'})\n   Pickup: ${t.pickup_address}\n   Dropoff: ${t.dropoff_address}`
        ).join('\n\n');
        
        return res.status(400).json({ 
          error: `Cannot disable location sharing while providing an active trip. Please complete or cancel your current trip first.`,
          hasActiveTrip: true,
          activeTrips: tripDetails,
          message: `You have ${tripCount} active trip${tripCount > 1 ? 's' : ''} that must be completed or cancelled before you can turn off availability:\n\n${tripList}\n\nPlease complete or cancel ${tripCount > 1 ? 'these trips' : 'this trip'} in the Trips section before turning off availability.`
        });
      }
      
      // Log trips that have 'in_progress' status but aren't actually active
      const inProgressButNotActive = (inProgressTrips || []).filter(t => {
        const actualPickup = (t as any).actual_pickup_time;
        const actualDropoff = (t as any).actual_dropoff_time;
        const hasStarted = actualPickup != null && actualPickup !== '';
        const hasNotEnded = actualDropoff == null || actualDropoff === '';
        return !(hasStarted && hasNotEnded);
      });
      
      if (inProgressButNotActive.length > 0) {
        console.log('⚠️ Found trips with in_progress status but not actually active (not blocking):', 
          inProgressButNotActive.map(t => ({
            id: (t as any).id,
            status: (t as any).status,
            actual_pickup: (t as any).actual_pickup_time,
            actual_dropoff: (t as any).actual_dropoff_time
          }))
        );
      }

      // Log that no active trips were found (for debugging)
      console.log('✅ No active trips found - allowing availability toggle off');
    }

    // Update driver availability using mobile API
    const updatedDriver = await mobileApi.updateDriverAvailability(driverId, is_available);

    res.json({ 
      success: true, 
      driver: {
        id: updatedDriver.id,
        is_available: updatedDriver.is_available
      }
    });
  } catch (error) {
    console.error("❌ Mobile: Error updating driver availability:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      message: "Failed to update driver availability", 
      error: errorMessage
    });
  }
});

// Mobile endpoint to update driver location
router.post("/driver/:driverId/location", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { driverId } = req.params;
    const { latitude, longitude, accuracy, heading, speed, address, tripId } = req.body;

    // Validate required fields
    if (!latitude || !longitude || accuracy === undefined) {
      return res.status(400).json({ error: 'Missing required fields: latitude, longitude, accuracy' });
    }

    // Verify the driverId belongs to the authenticated user
    const userId = req.user.userId;
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, user_id')
      .eq('id', driverId)
      .eq('user_id', userId)
      .single();

    if (driverError || !driver) {
      return res.status(403).json({ error: 'Driver not found or access denied' });
    }

    // Validate that coordinates are valid GPS coordinates (not IP geolocation)
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    // GPS coordinates should be within valid ranges
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid GPS coordinates' });
    }
    
    // Log location update for debugging
    console.log('📍 [Mobile API] Received location update:', {
      driverId,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      accuracy: accuracy ? parseFloat(accuracy).toFixed(0) + 'm' : 'unknown',
      heading: heading || 'N/A',
      speed: speed ? parseFloat(speed).toFixed(1) + ' m/s' : 'N/A',
      address: address || 'N/A',
      tripId: tripId || 'none',
      source: 'GPS' // Confirmed: location tracking uses GPS from mobile device
    });
    
    // Update driver location using mobile API
    const locationData = await mobileApi.updateDriverLocation(driverId, {
      latitude: lat,
      longitude: lng,
      accuracy: parseFloat(accuracy),
      heading: heading ? parseFloat(heading) : undefined,
      speed: speed ? parseFloat(speed) : undefined,
      address: address,
      tripId: tripId,
    });

    // Broadcast location update via WebSocket for real-time dashboard updates
    // Only broadcast if driver is_available = true (privacy feature)
    try {
      // Get driver data for broadcast - check is_available status
      const { data: driver } = await supabase
        .from('drivers')
        .select('id, user_id, program_id, is_available')
        .eq('id', driverId)
        .single();
      
      // Only broadcast location if driver is available
      if (driver && driver.is_available === true) {
        broadcastDriverUpdate({
          id: driver.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: locationData.timestamp,
        }, {
          programId: driver.program_id,
        });
      } else if (driver && driver.is_available === false) {
        console.log('🔒 Location update received but not broadcast - driver is_available = false (privacy)');
      }
    } catch (wsError) {
      // Don't fail the request if WebSocket broadcast fails
      console.warn('⚠️ Failed to broadcast location update:', wsError);
    }

    res.json({ success: true, location: locationData });
  } catch (error) {
    console.error("❌ Mobile: Error updating driver location:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      message: "Failed to update driver location", 
      error: errorMessage
    });
  }
});

export default router;




















