import express from "express";
import { specialRequirementsStorage } from "../special-requirements-storage";
import { requireSupabaseAuth, requireSupabaseRole, SupabaseAuthenticatedRequest } from "../supabase-auth";

const router = express.Router();

// ============================================================================
// SPECIAL REQUIREMENTS ROUTES
// ============================================================================

router.get("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const requirements = await specialRequirementsStorage.getAll();
    res.json(requirements);
  } catch (error) {
    console.error("Error fetching special requirements:", error);
    res.status(500).json({ message: "Failed to fetch special requirements" });
  }
});

router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const requirement = await specialRequirementsStorage.create(req.body);
    res.status(201).json(requirement);
  } catch (error) {
    console.error("Error creating special requirement:", error);
    res.status(500).json({ message: "Failed to create special requirement" });
  }
});

router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const requirement = await specialRequirementsStorage.update(id, req.body);
    res.json(requirement);
  } catch (error) {
    console.error("Error updating special requirement:", error);
    res.status(500).json({ message: "Failed to update special requirement" });
  }
});

router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await specialRequirementsStorage.delete(id);
    res.json({ message: "Special requirement deleted successfully" });
  } catch (error) {
    console.error("Error deleting special requirement:", error);
    res.status(500).json({ message: "Failed to delete special requirement" });
  }
});

export default router;

