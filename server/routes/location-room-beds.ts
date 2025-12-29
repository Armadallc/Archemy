import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { locationRoomBedsStorage } from "../minimal-supabase";

const router = express.Router();

// ============================================================================
// LOCATION ROOM/BED MANAGEMENT ROUTES
// ============================================================================

// Get all room/beds for a location
router.get("/location/:locationId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { locationId } = req.params;
    const roomBeds = await locationRoomBedsStorage.getRoomBedsByLocation(locationId);
    res.json(roomBeds);
  } catch (error: any) {
    console.error("Error fetching room/beds:", error);
    res.status(500).json({ message: "Failed to fetch room/beds", error: error.message });
  }
});

// Get single room/bed
router.get("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const roomBed = await locationRoomBedsStorage.getRoomBed(id);
    if (!roomBed) {
      return res.status(404).json({ message: "Room/bed not found" });
    }
    res.json(roomBed);
  } catch (error: any) {
    console.error("Error fetching room/bed:", error);
    res.status(500).json({ message: "Failed to fetch room/bed", error: error.message });
  }
});

// Create room/bed
router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const roomBed = await locationRoomBedsStorage.createRoomBed(req.body, req.user.userId);
    res.status(201).json(roomBed);
  } catch (error: any) {
    console.error("Error creating room/bed:", error);
    res.status(500).json({ message: "Failed to create room/bed", error: error.message });
  }
});

// Update room/bed
router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const { id } = req.params;
    const roomBed = await locationRoomBedsStorage.updateRoomBed(id, req.body, req.user.userId);
    res.json(roomBed);
  } catch (error: any) {
    console.error("Error updating room/bed:", error);
    res.status(500).json({ message: "Failed to update room/bed", error: error.message });
  }
});

// Delete room/bed (soft delete)
router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const { id } = req.params;
    await locationRoomBedsStorage.deleteRoomBed(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting room/bed:", error);
    res.status(500).json({ message: "Failed to delete room/bed", error: error.message });
  }
});

// Assign client to bed
router.post("/:id/assign", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const { id } = req.params;
    const { client_id } = req.body;
    if (!client_id) {
      return res.status(400).json({ message: "client_id is required" });
    }
    const roomBed = await locationRoomBedsStorage.assignClientToBed(id, client_id, req.user.userId);
    res.json(roomBed);
  } catch (error: any) {
    console.error("Error assigning client to bed:", error);
    res.status(500).json({ message: "Failed to assign client to bed", error: error.message });
  }
});

// Unassign client from bed
router.post("/:id/unassign", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User ID not found in session" });
    }
    const { id } = req.params;
    const roomBed = await locationRoomBedsStorage.unassignClientFromBed(id, req.user.userId);
    res.json(roomBed);
  } catch (error: any) {
    console.error("Error unassigning client from bed:", error);
    res.status(500).json({ message: "Failed to unassign client from bed", error: error.message });
  }
});

// Get available beds for a location
router.get("/location/:locationId/available", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { locationId } = req.params;
    const beds = await locationRoomBedsStorage.getAvailableBeds(locationId);
    res.json(beds);
  } catch (error: any) {
    console.error("Error fetching available beds:", error);
    res.status(500).json({ message: "Failed to fetch available beds", error: error.message });
  }
});

// Get occupied beds for a location
router.get("/location/:locationId/occupied", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { locationId } = req.params;
    const beds = await locationRoomBedsStorage.getOccupiedBeds(locationId);
    res.json(beds);
  } catch (error: any) {
    console.error("Error fetching occupied beds:", error);
    res.status(500).json({ message: "Failed to fetch occupied beds", error: error.message });
  }
});

export default router;

