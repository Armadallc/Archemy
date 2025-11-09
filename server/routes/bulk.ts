import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { tripsStorage, driversStorage, clientsStorage, locationsStorage } from "../minimal-supabase";

const router = express.Router();

// ============================================================================
// BULK OPERATIONS ROUTES
// ============================================================================

// Bulk operations for trips
router.post("/trips", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { action, itemIds } = req.body;
    
    if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "Action and itemIds are required" });
    }

    const results = [];
    const failedItems = [];

    for (const tripId of itemIds) {
      try {
        let result;
        switch (action) {
          case 'status_scheduled':
            result = await tripsStorage.updateTrip(tripId, { status: 'scheduled' });
            break;
          case 'status_in_progress':
            result = await tripsStorage.updateTrip(tripId, { status: 'in_progress' });
            break;
          case 'status_completed':
            result = await tripsStorage.updateTrip(tripId, { status: 'completed' });
            break;
          case 'status_cancelled':
            result = await tripsStorage.updateTrip(tripId, { status: 'cancelled' });
            break;
          case 'delete':
            await tripsStorage.deleteTrip(tripId);
            result = { id: tripId, deleted: true };
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push(result);
      } catch (error) {
        console.error(`Error processing trip ${tripId}:`, error);
        failedItems.push(tripId);
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} trips successfully`,
      processedCount: results.length,
      failedItems,
      results
    });
  } catch (error) {
    console.error("Error in bulk trip operations:", error);
    res.status(500).json({ message: "Failed to process bulk trip operations" });
  }
});

// Bulk operations for drivers
router.post("/drivers", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { action, itemIds } = req.body;
    
    if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "Action and itemIds are required" });
    }

    const results = [];
    const failedItems = [];

    for (const driverId of itemIds) {
      try {
        let result;
        switch (action) {
          case 'status_active':
            result = await driversStorage.updateDriver(driverId, { status: 'active' });
            break;
          case 'status_inactive':
            result = await driversStorage.updateDriver(driverId, { status: 'inactive' });
            break;
          case 'delete':
            await driversStorage.deleteDriver(driverId);
            result = { id: driverId, deleted: true };
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push(result);
      } catch (error) {
        console.error(`Error processing driver ${driverId}:`, error);
        failedItems.push(driverId);
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} drivers successfully`,
      processedCount: results.length,
      failedItems,
      results
    });
  } catch (error) {
    console.error("Error in bulk driver operations:", error);
    res.status(500).json({ message: "Failed to process bulk driver operations" });
  }
});

// Bulk operations for clients
router.post("/clients", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { action, itemIds } = req.body;
    
    if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "Action and itemIds are required" });
    }

    const results = [];
    const failedItems = [];

    for (const clientId of itemIds) {
      try {
        let result;
        switch (action) {
          case 'status_active':
            result = await clientsStorage.updateClient(clientId, { is_active: true });
            break;
          case 'status_inactive':
            result = await clientsStorage.updateClient(clientId, { is_active: false });
            break;
          case 'delete':
            await clientsStorage.deleteClient(clientId);
            result = { id: clientId, deleted: true };
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push(result);
      } catch (error) {
        console.error(`Error processing client ${clientId}:`, error);
        failedItems.push(clientId);
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} clients successfully`,
      processedCount: results.length,
      failedItems,
      results
    });
  } catch (error) {
    console.error("Error in bulk client operations:", error);
    res.status(500).json({ message: "Failed to process bulk client operations" });
  }
});

// Bulk operations for locations
router.post("/locations", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { action, itemIds } = req.body;
    
    if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "Action and itemIds are required" });
    }

    const results = [];
    const failedItems = [];

    for (const locationId of itemIds) {
      try {
        let result;
        switch (action) {
          case 'status_active':
            result = await locationsStorage.updateLocation(locationId, { is_active: true });
            break;
          case 'status_inactive':
            result = await locationsStorage.updateLocation(locationId, { is_active: false });
            break;
          case 'delete':
            await locationsStorage.deleteLocation(locationId);
            result = { id: locationId, deleted: true };
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push(result);
      } catch (error) {
        console.error(`Error processing location ${locationId}:`, error);
        failedItems.push(locationId);
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} locations successfully`,
      processedCount: results.length,
      failedItems,
      results
    });
  } catch (error) {
    console.error("Error in bulk location operations:", error);
    res.status(500).json({ message: "Failed to process bulk location operations" });
  }
});

export default router;















