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

    // Update driver location using mobile API
    const locationData = await mobileApi.updateDriverLocation(driverId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: parseFloat(accuracy),
      heading: heading ? parseFloat(heading) : undefined,
      speed: speed ? parseFloat(speed) : undefined,
      address: address,
      tripId: tripId,
    });

    // Broadcast location update via WebSocket for real-time dashboard updates
    try {
      // Get driver data for broadcast
      const { data: driver } = await supabase
        .from('drivers')
        .select('id, user_id, program_id')
        .eq('id', driverId)
        .single();
      
      if (driver) {
        broadcastDriverUpdate({
          id: driver.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: locationData.timestamp,
        }, {
          programId: driver.program_id,
        });
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




















