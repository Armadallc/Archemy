import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { corporateClientsStorage, programsStorage } from "../minimal-supabase";

const router = express.Router();

// ============================================================================
// CORPORATE CLIENTS ROUTES
// ============================================================================

router.get("/clients", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CORPORATE_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const corporateClients = await corporateClientsStorage.getAllCorporateClients();
    // Add caching headers (5 minutes - corporate clients don't change often)
    res.set('Cache-Control', 'private, max-age=300');
    res.json(corporateClients);
  } catch (error) {
    console.error("Error fetching corporate clients:", error);
    res.status(500).json({ message: "Failed to fetch corporate clients" });
  }
});

router.get("/clients/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CORPORATE_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const corporateClient = await corporateClientsStorage.getCorporateClient(id);
    
    if (!corporateClient) {
      return res.status(404).json({ message: "Corporate client not found" });
    }
    
    res.json(corporateClient);
  } catch (error) {
    console.error("Error fetching corporate client:", error);
    res.status(500).json({ message: "Failed to fetch corporate client" });
  }
});

/**
 * POST /api/corporate/clients
 * Create a new corporate client
 * Access: super_admin only (creating new tenants)
 */
router.post("/clients", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const corporateClient = await corporateClientsStorage.createCorporateClient(req.body);
    res.status(201).json(corporateClient);
  } catch (error) {
    console.error("Error creating corporate client:", error);
    res.status(500).json({ message: "Failed to create corporate client" });
  }
});

/**
 * PATCH /api/corporate/clients/:id
 * Update a corporate client
 * Access: 
 *   - super_admin: Can update any corporate client
 *   - corporate_admin: Can only update their own corporate client (if they have manage_corporate_clients permission)
 */
router.patch("/clients/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.MANAGE_CORPORATE_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;

    // Corporate admins can only update their own corporate client
    if (req.user.role === 'corporate_admin') {
      if (req.user.corporateClientId !== id) {
        return res.status(403).json({ 
          message: "You can only update your own corporate client" 
        });
      }
    }

    const corporateClient = await corporateClientsStorage.updateCorporateClient(id, req.body);
    res.json(corporateClient);
  } catch (error) {
    console.error("Error updating corporate client:", error);
    res.status(500).json({ message: "Failed to update corporate client" });
  }
});

/**
 * DELETE /api/corporate/clients/:id
 * Delete a corporate client
 * Access: super_admin only (deleting tenants)
 */
router.delete("/clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await corporateClientsStorage.deleteCorporateClient(id);
    res.json({ message: "Corporate client deleted successfully" });
  } catch (error) {
    console.error("Error deleting corporate client:", error);
    res.status(500).json({ message: "Failed to delete corporate client" });
  }
});

// ============================================================================
// PROGRAMS ROUTES
// ============================================================================

router.get("/programs", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const programs = await programsStorage.getAllPrograms();
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

// IMPORTANT: More specific routes must come BEFORE generic :id routes
router.get("/programs/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const programs = await programsStorage.getProgramsByCorporateClient(corporateClientId);
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs by corporate client:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

router.get("/programs/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const program = await programsStorage.getProgram(id);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    res.json(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ message: "Failed to fetch program" });
  }
});

router.post("/programs", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const program = await programsStorage.createProgram(req.body);
    res.status(201).json(program);
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ message: "Failed to create program" });
  }
});

router.patch("/programs/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const program = await programsStorage.updateProgram(id, req.body);
    res.json(program);
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Failed to update program" });
  }
});

router.delete("/programs/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await programsStorage.deleteProgram(id);
    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Failed to delete program" });
  }
});

export default router;










