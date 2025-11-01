import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { locationsStorage } from "../minimal-supabase";
import { 
  getFrequentLocations, 
  getFrequentLocationById, 
  createFrequentLocation, 
  updateFrequentLocation, 
  deleteFrequentLocation, 
  incrementUsageCount,
  getFrequentLocationsForProgram,
  getFrequentLocationsForCorporateClient,
  getFrequentLocationsByTag,
  getServiceLocations,
  getFrequentDestinationsByTag,
  syncServiceLocationsToFrequent
} from "../frequent-locations-storage";

const router = express.Router();

// ============================================================================
// LOCATIONS ROUTES
// ============================================================================

router.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const locations = await locationsStorage.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});

router.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const location = await locationsStorage.getLocation(id);
    
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    
    res.json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ message: "Failed to fetch location" });
  }
});

router.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const locations = await locationsStorage.getLocationsByProgram(programId);
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations by program:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});

router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const location = await locationsStorage.createLocation(req.body);
    res.status(201).json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ message: "Failed to create location" });
  }
});

router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const location = await locationsStorage.updateLocation(id, req.body);
    res.json(location);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
});

router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await locationsStorage.deleteLocation(id);
    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ message: "Failed to delete location" });
  }
});

// ============================================================================
// FREQUENT LOCATIONS ROUTES
// ============================================================================

// Get all frequent locations with optional filtering
router.get("/frequent", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const filters = {
      corporate_client_id: req.query.corporate_client_id as string,
      program_id: req.query.program_id as string,
      location_id: req.query.location_id as string,
      location_type: req.query.location_type as string,
      tag: req.query.tag as string,
      is_service_location: req.query.is_service_location === 'true' ? true : req.query.is_service_location === 'false' ? false : undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string
    };

    const frequentLocations = await getFrequentLocations(filters);
    res.json(frequentLocations);
  } catch (error) {
    console.error("Error fetching frequent locations:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations" });
  }
});

// Get frequent locations organized by tag (MUST BE BEFORE /:id)
router.get("/frequent/by-tag", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 getFrequentLocationsByTag route handler called');
    const filters = {
      corporate_client_id: req.query.corporate_client_id as string,
      program_id: req.query.program_id as string,
      location_id: req.query.location_id as string,
      location_type: req.query.location_type as string,
      tag: req.query.tag as string,
      is_service_location: req.query.is_service_location === 'true' ? true : req.query.is_service_location === 'false' ? false : undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string
    };

    console.log('🔍 Filters:', filters);
    const locationsByTag = await getFrequentLocationsByTag(filters);
    console.log('🔍 Locations by tag result:', Object.keys(locationsByTag));
    res.json(locationsByTag);
  } catch (error) {
    console.error("Error fetching frequent locations by tag:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations by tag" });
  }
});

// Get service locations only (MUST BE BEFORE /:id)
router.get("/frequent/service-locations", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const filters = {
      corporate_client_id: req.query.corporate_client_id as string,
      program_id: req.query.program_id as string,
      location_id: req.query.location_id as string,
      location_type: req.query.location_type as string,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string
    };

    const serviceLocations = await getServiceLocations(filters);
    res.json(serviceLocations);
  } catch (error) {
    console.error("Error fetching service locations:", error);
    res.status(500).json({ message: "Failed to fetch service locations" });
  }
});

// Get frequent destinations organized by tag (MUST BE BEFORE /:id)
router.get("/frequent/destinations/by-tag", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const filters = {
      corporate_client_id: req.query.corporate_client_id as string,
      program_id: req.query.program_id as string,
      location_id: req.query.location_id as string,
      location_type: req.query.location_type as string,
      tag: req.query.tag as string,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string
    };

    const destinationsByTag = await getFrequentDestinationsByTag(filters);
    res.json(destinationsByTag);
  } catch (error) {
    console.error("Error fetching frequent destinations by tag:", error);
    res.status(500).json({ message: "Failed to fetch frequent destinations by tag" });
  }
});

// Get frequent locations for a specific program (MUST BE BEFORE /:id)
router.get("/frequent/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const frequentLocations = await getFrequentLocationsForProgram(programId);
    res.json(frequentLocations);
  } catch (error) {
    console.error("Error fetching frequent locations for program:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations" });
  }
});

// Get frequent locations for a specific corporate client (MUST BE BEFORE /:id)
router.get("/frequent/corporate-client/:corporateClientId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const frequentLocations = await getFrequentLocationsForCorporateClient(corporateClientId);
    res.json(frequentLocations);
  } catch (error) {
    console.error("Error fetching frequent locations for corporate client:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations" });
  }
});

// Get frequent location by ID (MUST BE LAST - catches all other /frequent/*)
router.get("/frequent/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const frequentLocation = await getFrequentLocationById(id);
    
    if (!frequentLocation) {
      return res.status(404).json({ message: "Frequent location not found" });
    }
    
    res.json(frequentLocation);
  } catch (error) {
    console.error("Error fetching frequent location:", error);
    res.status(500).json({ message: "Failed to fetch frequent location" });
  }
});

// Create new frequent location
router.post("/frequent", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const frequentLocation = await createFrequentLocation(req.body);
    res.status(201).json(frequentLocation);
  } catch (error) {
    console.error("Error creating frequent location:", error);
    res.status(500).json({ message: "Failed to create frequent location" });
  }
});

// Update frequent location
router.patch("/frequent/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const frequentLocation = await updateFrequentLocation(id, req.body);
    res.json(frequentLocation);
  } catch (error) {
    console.error("Error updating frequent location:", error);
    res.status(500).json({ message: "Failed to update frequent location" });
  }
});

// Delete frequent location
router.delete("/frequent/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await deleteFrequentLocation(id);
    res.json({ message: "Frequent location deleted successfully" });
  } catch (error) {
    console.error("Error deleting frequent location:", error);
    res.status(500).json({ message: "Failed to delete frequent location" });
  }
});

// Increment usage count
router.post("/frequent/:id/increment-usage", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const frequentLocation = await incrementUsageCount(id);
    res.json(frequentLocation);
  } catch (error) {
    console.error("Error incrementing usage count:", error);
    res.status(500).json({ message: "Failed to increment usage count" });
  }
});

// Sync service locations to frequent locations
router.post("/frequent/sync-service-locations", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 Sync service locations endpoint called');
    const syncedLocations = await syncServiceLocationsToFrequent();
    console.log('🔍 Synced locations:', syncedLocations.length);
    res.json({ 
      message: `Successfully synced ${syncedLocations.length} service locations to frequent locations`,
      syncedCount: syncedLocations.length,
      syncedLocations 
    });
  } catch (error) {
    console.error("Error syncing service locations:", error);
    res.status(500).json({ message: "Failed to sync service locations" });
  }
});

export default router;

