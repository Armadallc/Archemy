import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { driversStorage } from "../minimal-supabase";
import { driverSchedulesStorage } from "../driver-schedules-storage";
import { broadcastDriverUpdate } from "../websocket-instance";

const router = express.Router();

// ============================================================================
// DRIVERS ROUTES
// ============================================================================

router.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const drivers = await driversStorage.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

// IMPORTANT: More specific routes MUST come before /:id to avoid route conflicts
router.get("/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const drivers = await driversStorage.getDriversByCorporateClient(corporateClientId);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching corporate client drivers:", error);
    res.status(500).json({ message: "Failed to fetch corporate client drivers" });
  }
});

router.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const drivers = await driversStorage.getDriversByProgram(programId);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers by program:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

// Single driver by ID - must come LAST to avoid matching other routes
router.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const driver = await driversStorage.getDriver(id);
    
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    
    res.json(driver);
  } catch (error) {
    console.error("Error fetching driver:", error);
    res.status(500).json({ message: "Failed to fetch driver" });
  }
});

router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const driver = await driversStorage.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    console.error("Error creating driver:", error);
    res.status(500).json({ message: "Failed to create driver" });
  }
});

router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const driver = await driversStorage.updateDriver(id, req.body);
    
    // Broadcast driver update via WebSocket
    broadcastDriverUpdate(driver, {
      programId: driver.program_id,
      corporateClientId: req.user?.corporateClientId || undefined,
      role: req.user?.role
    });
    
    res.json(driver);
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ message: "Failed to update driver" });
  }
});

router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await driversStorage.deleteDriver(id);
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ message: "Failed to delete driver" });
  }
});

// ============================================================================
// DRIVER SCHEDULES ROUTES
// ============================================================================

router.get("/schedules", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const schedules = await driverSchedulesStorage.getAllDriverSchedules();
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});

router.get("/schedules/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const schedule = await driverSchedulesStorage.getDriverSchedule(id);
    
    if (!schedule) {
      return res.status(404).json({ message: "Driver schedule not found" });
    }
    
    res.json(schedule);
  } catch (error) {
    console.error("Error fetching driver schedule:", error);
    res.status(500).json({ message: "Failed to fetch driver schedule" });
  }
});

router.get("/schedules/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const schedules = await driverSchedulesStorage.getDriverSchedulesByDriver(driverId);
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules by driver:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});

router.post("/schedules", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const schedule = await driverSchedulesStorage.createDriverSchedule(req.body);
    res.status(201).json(schedule);
  } catch (error) {
    console.error("Error creating driver schedule:", error);
    res.status(500).json({ message: "Failed to create driver schedule" });
  }
});

router.patch("/schedules/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const schedule = await driverSchedulesStorage.updateDriverSchedule(id, req.body);
    res.json(schedule);
  } catch (error) {
    console.error("Error updating driver schedule:", error);
    res.status(500).json({ message: "Failed to update driver schedule" });
  }
});

router.delete("/schedules/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await driverSchedulesStorage.deleteDriverSchedule(id);
    res.json({ message: "Driver schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver schedule:", error);
    res.status(500).json({ message: "Failed to delete driver schedule" });
  }
});

export default router;










