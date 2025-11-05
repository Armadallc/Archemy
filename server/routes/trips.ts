import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { tripsStorage } from "../minimal-supabase";
import { tripCategoriesStorage } from "../trip-categories-storage";
import { enhancedTripsStorage } from "../enhanced-trips-storage";
import { broadcastTripUpdate, broadcastTripCreated } from "../websocket-instance";
import { driversStorage } from "../minimal-supabase";
import { supabase } from "../db";

const router = express.Router();

// ============================================================================
// TRIPS ROUTES
// ============================================================================

router.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trips = await tripsStorage.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

// IMPORTANT: More specific routes MUST come before /:id to avoid route conflicts
router.get("/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const trips = await tripsStorage.getTripsByCorporateClient(corporateClientId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching corporate client trips:", error);
    res.status(500).json({ message: "Failed to fetch corporate client trips" });
  }
});

router.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const trips = await tripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by program:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const trips = await tripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by driver:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

// Single trip by ID - must come LAST to avoid matching other routes
router.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const trip = await tripsStorage.getTrip(id);
    
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    res.json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(500).json({ message: "Failed to fetch trip" });
  }
});

router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trip = await tripsStorage.createTrip(req.body);
    
    // Prepare notification targets
    let driverUserId: string | undefined;
    
    // If trip has an assigned driver, get their user_id for targeted notification
    if (trip.driver_id) {
      try {
        const driver = await driversStorage.getDriver(trip.driver_id);
        if (driver?.user_id) {
          driverUserId = driver.user_id;
        }
      } catch (driverError) {
        console.warn("Could not fetch driver for notification:", driverError);
        // Continue without driver notification - still notify program users
      }
    }
    
    // Broadcast trip creation notification
    broadcastTripCreated(trip, {
      userId: driverUserId, // Send to assigned driver if exists
      programId: trip.program_id, // Also notify all program users
      corporateClientId: req.user?.corporateClientId || undefined
    });
    
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ message: "Failed to create trip" });
  }
});

// Helper function to get driver display name
async function getDriverDisplayName(driverId: string): Promise<string | undefined> {
  try {
    const driver = await driversStorage.getDriver(driverId);
    if (!driver) return undefined;
    
    // Try to get name from driver.users or driver directly
    if (driver.users?.user_name) {
      return driver.users.user_name;
    }
    // If driver has first_name/last_name, use those (might not be in schema but check anyway)
    if ((driver as any).first_name && (driver as any).last_name) {
      return `${(driver as any).first_name} ${(driver as any).last_name}`;
    }
    return undefined;
  } catch (error) {
    console.warn("Could not fetch driver name:", error);
    return undefined;
  }
}

router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Fetch current trip to get previous status and driver info for notifications
    let previousStatus: string | undefined;
    let previousDriverId: string | undefined;
    let driverUserId: string | undefined;
    let driverName: string | undefined;
    let oldDriverUserId: string | undefined;
    
    try {
      const currentTrip = await tripsStorage.getTrip(id);
      if (currentTrip) {
        previousStatus = currentTrip.status;
        previousDriverId = currentTrip.driver_id;
        
        // Get driver's user_id if trip has an assigned driver
        if (currentTrip.driver_id) {
          try {
            const driver = await driversStorage.getDriver(currentTrip.driver_id);
            if (driver?.user_id) {
              driverUserId = driver.user_id;
            }
          } catch (driverError) {
            console.warn("Could not fetch driver for notification:", driverError);
          }
        }
      }
    } catch (fetchError) {
      console.warn("Could not fetch current trip for notification context:", fetchError);
      // Continue with update even if fetch fails
    }
    
    // Determine action type and detect driver assignment/modification
    let actionType: 'status_update' | 'assignment' | 'modification' | 'cancellation' = 'status_update';
    const isDriverUpdate = req.user?.role === 'driver';
    
    // Detect driver assignment (driver_id changed)
    if (updates.driver_id !== undefined && updates.driver_id !== previousDriverId) {
      actionType = 'assignment';
      // Get old driver's user_id if driver was reassigned
      if (previousDriverId) {
        try {
          const oldDriver = await driversStorage.getDriver(previousDriverId);
          if (oldDriver?.user_id) {
            oldDriverUserId = oldDriver.user_id;
          }
        } catch (error) {
          console.warn("Could not fetch old driver for notification:", error);
        }
      }
    }
    
    // Detect cancellation
    if (updates.status === 'cancelled' || (updates.status === undefined && previousStatus && previousStatus !== 'cancelled' && updates.notes?.toLowerCase().includes('cancel'))) {
      actionType = 'cancellation';
    }
    
    // Detect modification (non-status, non-assignment changes)
    if (!updates.status && updates.driver_id === undefined && Object.keys(updates).length > 0) {
      actionType = 'modification';
    }
    
    // If driver is making the update, get their name for admin notifications
    if (isDriverUpdate && req.user?.userId) {
      // Find driver record for this user
      try {
        const { data: driver } = await supabase
          .from('drivers')
          .select('id, users:user_id (user_name)')
          .eq('user_id', req.user.userId)
          .single();
        
        if (driver) {
          driverName = driver.users?.user_name || 'Driver';
        }
      } catch (error) {
        console.warn("Could not fetch driver name:", error);
      }
    }
    
    // If status is being updated, use the validated updateTripStatus method
    if (updates.status) {
      const { status, actualTimes, skipValidation, skipTimestampAutoSet, ...otherUpdates } = updates;
      
      // Use enhanced trips storage for status updates (includes validation)
      const trip = await enhancedTripsStorage.updateTripStatus(
        id,
        status,
        actualTimes,
        {
          userId: req.user?.userId,
          skipValidation: skipValidation === true,
          skipTimestampAutoSet: skipTimestampAutoSet === true
        }
      );
      
      // Apply any other updates if provided
      let finalTrip = trip;
      if (Object.keys(otherUpdates).length > 0) {
        finalTrip = await tripsStorage.updateTrip(id, otherUpdates);
      }
      
      // Update driverUserId if trip's driver changed
      if (finalTrip.driver_id && finalTrip.driver_id !== previousDriverId) {
        try {
          const driver = await driversStorage.getDriver(finalTrip.driver_id);
          if (driver?.user_id) {
            driverUserId = driver.user_id;
          }
          // Get driver name for new assignment
          if (actionType === 'assignment') {
            driverName = await getDriverDisplayName(finalTrip.driver_id);
          }
        } catch (driverError) {
          console.warn("Could not fetch updated driver for notification:", driverError);
        }
      } else if (finalTrip.driver_id && isDriverUpdate) {
        // If driver is updating their own trip status, get their name
        driverName = await getDriverDisplayName(finalTrip.driver_id);
      }
      
      // Broadcast trip update via WebSocket with driver context
      broadcastTripUpdate(
        finalTrip,
        previousStatus,
        {
          programId: finalTrip.program_id,
          corporateClientId: req.user?.corporateClientId || undefined,
          role: req.user?.role,
          driverId: driverUserId,
          updatedBy: req.user?.userId,
          driverName: driverName,
          action: actionType
        }
      );
      
      // If driver was reassigned, notify old driver
      if (oldDriverUserId && actionType === 'assignment') {
        broadcastTripUpdate(
          finalTrip,
          previousStatus,
          {
            userId: oldDriverUserId,
            programId: finalTrip.program_id,
            corporateClientId: req.user?.corporateClientId || undefined,
            role: 'driver',
            action: 'assignment',
            updatedBy: req.user?.userId
          }
        );
      }
      
      res.json(finalTrip);
    } else {
      // For non-status updates, use the regular update method
      const trip = await tripsStorage.updateTrip(id, updates);
      
      // Update driverUserId if trip's driver changed
      if (trip.driver_id && trip.driver_id !== previousDriverId) {
        try {
          const driver = await driversStorage.getDriver(trip.driver_id);
          if (driver?.user_id) {
            driverUserId = driver.user_id;
          }
          // Get driver name for new assignment
          if (actionType === 'assignment') {
            driverName = await getDriverDisplayName(trip.driver_id);
          }
        } catch (driverError) {
          console.warn("Could not fetch updated driver for notification:", driverError);
        }
      }
      
      // Broadcast trip update via WebSocket with action context
      broadcastTripUpdate(
        trip,
        undefined,
        {
          programId: trip.program_id,
          corporateClientId: req.user?.corporateClientId || undefined,
          role: req.user?.role,
          driverId: driverUserId,
          updatedBy: req.user?.userId,
          driverName: driverName,
          action: actionType
        }
      );
      
      // If driver was reassigned, notify old driver
      if (oldDriverUserId && actionType === 'assignment') {
        broadcastTripUpdate(
          trip,
          undefined,
          {
            userId: oldDriverUserId,
            programId: trip.program_id,
            corporateClientId: req.user?.corporateClientId || undefined,
            role: 'driver',
            action: 'assignment',
            updatedBy: req.user?.userId
          }
        );
      }
      
      res.json(trip);
    }
  } catch (error: any) {
    console.error("❌ Error updating trip:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    
    // Return 400 for validation errors, 500 for other errors
    if (error.message && error.message.includes('Invalid status transition')) {
      res.status(400).json({ 
        message: error.message,
        error: 'VALIDATION_ERROR'
      });
    } else {
      // Return detailed error information to help debug
      const errorResponse: any = {
        message: error.message || "Failed to update trip",
        error: error.code || 'UNKNOWN_ERROR'
      };
      
      // Include additional Supabase error details if available
      if (error.details) errorResponse.details = error.details;
      if (error.hint) errorResponse.hint = error.hint;
      if (error.code) errorResponse.code = error.code;
      
      res.status(500).json(errorResponse);
    }
  }
});

router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Fetch trip before deletion to get driver info for notification
    let driverUserId: string | undefined;
    let tripProgramId: string | undefined;
    
    try {
      const trip = await tripsStorage.getTrip(id);
      if (trip) {
        tripProgramId = trip.program_id;
        
        // Get driver's user_id if trip has an assigned driver
        if (trip.driver_id) {
          try {
            const driver = await driversStorage.getDriver(trip.driver_id);
            if (driver?.user_id) {
              driverUserId = driver.user_id;
            }
          } catch (driverError) {
            console.warn("Could not fetch driver for deletion notification:", driverError);
          }
        }
      }
    } catch (fetchError) {
      console.warn("Could not fetch trip for deletion notification context:", fetchError);
    }
    
    // Delete the trip
    await tripsStorage.deleteTrip(id);
    
    // Notify driver and program users about trip deletion/cancellation
    if (tripProgramId) {
      broadcastTripUpdate(
        { id, status: 'cancelled' }, // Minimal trip data for deletion notification
        undefined,
        {
          programId: tripProgramId,
          corporateClientId: req.user?.corporateClientId || undefined,
          role: req.user?.role,
          driverId: driverUserId,
          updatedBy: req.user?.userId,
          action: 'cancellation'
        }
      );
    }
    
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ message: "Failed to delete trip" });
  }
});

// ============================================================================
// TRIP CATEGORIES ROUTES
// ============================================================================

router.get("/categories", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const categories = await tripCategoriesStorage.getAllTripCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});

router.get("/categories/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const category = await tripCategoriesStorage.getTripCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: "Trip category not found" });
    }
    
    res.json(category);
  } catch (error) {
    console.error("Error fetching trip category:", error);
    res.status(500).json({ message: "Failed to fetch trip category" });
  }
});

router.get("/categories/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const categories = await tripCategoriesStorage.getTripCategoriesByProgram(programId);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories by program:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});

router.post("/categories", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const category = await tripCategoriesStorage.createTripCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating trip category:", error);
    res.status(500).json({ message: "Failed to create trip category" });
  }
});

router.patch("/categories/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const category = await tripCategoriesStorage.updateTripCategory(id, req.body);
    res.json(category);
  } catch (error) {
    console.error("Error updating trip category:", error);
    res.status(500).json({ message: "Failed to update trip category" });
  }
});

router.delete("/categories/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await tripCategoriesStorage.deleteTripCategory(id);
    res.json({ message: "Trip category deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip category:", error);
    res.status(500).json({ message: "Failed to delete trip category" });
  }
});

// ============================================================================
// ENHANCED TRIPS ROUTES
// ============================================================================

router.get("/enhanced", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trips = await enhancedTripsStorage.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/enhanced/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const trip = await enhancedTripsStorage.getTrip(id);
    
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    res.json(trip);
  } catch (error) {
    console.error("Error fetching enhanced trip:", error);
    res.status(500).json({ message: "Failed to fetch trip" });
  }
});

export default router;










