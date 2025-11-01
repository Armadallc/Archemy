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
import { broadcastTripUpdate } from "../websocket-instance";

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

router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trip = await tripsStorage.createTrip(req.body);
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ message: "Failed to create trip" });
  }
});

router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const trip = await tripsStorage.updateTrip(id, req.body);
    
    // Broadcast trip update via WebSocket
    broadcastTripUpdate(trip, {
      programId: trip.program_id,
      corporateClientId: req.user?.corporateClientId || undefined,
      role: req.user?.role
    });
    
    res.json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ message: "Failed to update trip" });
  }
});

router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await tripsStorage.deleteTrip(id);
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










