import express from "express";
import { supabase } from "../db";
import { 
  requireSupabaseAuth, 
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { enhancedTripsStorage } from "../enhanced-trips-storage";

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
    
    // Get trips for this driver using the enhanced trips storage
    console.log('🔍 Mobile: Calling enhancedTripsStorage.getTripsByDriver with driverId:', driverId);
    const trips = await enhancedTripsStorage.getTripsByDriver(driverId);
    console.log('✅ Mobile: Found', trips?.length || 0, 'trips for driver');
    console.log('📋 Mobile: Trip data:', trips);
    
    res.json(trips || []);
  } catch (error) {
    console.error("❌ Mobile: Error fetching driver trips:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("❌ Mobile: Error details:", errorMessage, errorStack);
    res.status(500).json({ message: "Failed to fetch driver trips", error: errorMessage });
  }
});

export default router;















