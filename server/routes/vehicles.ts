import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { vehiclesStorage } from "../vehicles-storage";

const router = express.Router();

// ============================================================================
// VEHICLES ROUTES
// ============================================================================

router.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

router.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const vehicle = await vehiclesStorage.getVehicle(id);
    
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    res.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Failed to fetch vehicle" });
  }
});

router.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const vehicles = await vehiclesStorage.getVehiclesByProgram(programId);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles by program:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

router.get("/available/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { vehicleType } = req.query;
    const vehicles = await vehiclesStorage.getAvailableVehicles(programId, vehicleType as string);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching available vehicles:", error);
    res.status(500).json({ message: "Failed to fetch available vehicles" });
  }
});

router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const vehicle = await vehiclesStorage.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ message: "Failed to create vehicle" });
  }
});

router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const vehicle = await vehiclesStorage.updateVehicle(id, req.body);
    res.json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Failed to update vehicle" });
  }
});

router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await vehiclesStorage.deleteVehicle(id);
    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
});

// ============================================================================
// VEHICLE MAINTENANCE ROUTES
// ============================================================================

router.get("/:vehicleId/maintenance", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const maintenance = await vehiclesStorage.getVehicleMaintenance(vehicleId);
    res.json(maintenance);
  } catch (error) {
    console.error("Error fetching vehicle maintenance:", error);
    res.status(500).json({ message: "Failed to fetch vehicle maintenance" });
  }
});

router.post("/:vehicleId/maintenance", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const maintenance = await vehiclesStorage.createMaintenanceRecord({
      ...req.body,
      vehicle_id: vehicleId
    });
    res.status(201).json(maintenance);
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    res.status(500).json({ message: "Failed to create maintenance record" });
  }
});

router.patch("/maintenance/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const maintenance = await vehiclesStorage.updateMaintenanceRecord(id, req.body);
    res.json(maintenance);
  } catch (error) {
    console.error("Error updating maintenance record:", error);
    res.status(500).json({ message: "Failed to update maintenance record" });
  }
});

// ============================================================================
// VEHICLE ASSIGNMENTS ROUTES
// ============================================================================

router.post("/:vehicleId/assign", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const { driverId, programId, notes } = req.body;
    const assignment = await vehiclesStorage.assignVehicleToDriver(vehicleId, driverId, programId, notes);
    res.json(assignment);
  } catch (error) {
    console.error("Error assigning vehicle to driver:", error);
    res.status(500).json({ message: "Failed to assign vehicle to driver" });
  }
});

router.post("/:vehicleId/unassign", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const { driverId } = req.body;
    const assignment = await vehiclesStorage.unassignVehicleFromDriver(vehicleId, driverId);
    res.json(assignment);
  } catch (error) {
    console.error("Error unassigning vehicle from driver:", error);
    res.status(500).json({ message: "Failed to unassign vehicle from driver" });
  }
});

router.get("/:vehicleId/assignments", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const assignments = await vehiclesStorage.getVehicleAssignments(vehicleId);
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching vehicle assignments:", error);
    res.status(500).json({ message: "Failed to fetch vehicle assignments" });
  }
});

router.get("/drivers/:driverId/vehicle-history", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const history = await vehiclesStorage.getDriverVehicleHistory(driverId);
    res.json(history);
  } catch (error) {
    console.error("Error fetching driver vehicle history:", error);
    res.status(500).json({ message: "Failed to fetch driver vehicle history" });
  }
});

export default router;




















