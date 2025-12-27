import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { clientGroupsStorage } from "../minimal-supabase";

const router = express.Router();

// ============================================================================
// LEGACY ROUTES FOR BACKWARD COMPATIBILITY
// ============================================================================
// These routes provide backward compatibility for any frontend code
// that might still be using old endpoint patterns

// Legacy corporate clients routes (redirect to new corporate routes)
router.get("/corporate-clients", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new corporate routes
  res.redirect(307, '/api/corporate/clients');
});

router.get("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new corporate routes
  res.redirect(307, `/api/corporate/clients/${req.params.id}`);
});

// Legacy PUT/PATCH for corporate clients - handle directly (can't redirect with body)
router.put("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { corporateClientsStorage } = await import("../minimal-supabase");
    const corporateClient = await corporateClientsStorage.updateCorporateClient(id, req.body);
    res.json(corporateClient);
  } catch (error) {
    console.error("Error updating corporate client:", error);
    const { handleConstraintError } = await import("../utils/constraint-errors");
    if (handleConstraintError(error, res)) {
      return;
    }
    res.status(500).json({ message: "Failed to update corporate client" });
  }
});

router.patch("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { corporateClientsStorage } = await import("../minimal-supabase");
    const corporateClient = await corporateClientsStorage.updateCorporateClient(id, req.body);
    res.json(corporateClient);
  } catch (error) {
    console.error("Error updating corporate client:", error);
    const { handleConstraintError } = await import("../utils/constraint-errors");
    if (handleConstraintError(error, res)) {
      return;
    }
    res.status(500).json({ message: "Failed to update corporate client" });
  }
});

// Legacy programs routes (redirect to new corporate routes)
// Use requirePermission to allow program_admin and program_user access
router.get("/programs", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new corporate routes
  res.redirect(307, '/api/corporate/programs');
});

router.get("/programs/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new corporate routes
  res.redirect(307, `/api/corporate/programs/${req.params.id}`);
});

// Legacy programs/corporate-client route - handle directly (not redirect) for API calls
router.get("/programs/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const { programsStorage } = await import("../minimal-supabase");
    const programs = await programsStorage.getProgramsByCorporateClient(corporateClientId);
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs by corporate client:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

// Legacy service areas routes (redirect to new locations routes)
router.get("/service-areas", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new locations routes
  res.redirect(307, '/api/locations');
});

router.get("/service-areas/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new locations routes
  res.redirect(307, `/api/locations/${req.params.id}`);
});

// Legacy organization-based routes (redirect to program-based routes)
router.get("/organizations", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new corporate routes
  res.redirect(307, '/api/corporate/clients');
});

router.get("/organizations/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new corporate routes
  res.redirect(307, `/api/corporate/clients/${req.params.id}`);
});

// Legacy trip categories routes (redirect to new trips routes)
router.get("/trip-categories", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new trips routes
  res.redirect(307, '/api/trips/categories');
});

router.get("/trip-categories/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new trips routes
  res.redirect(307, `/api/trips/categories/${req.params.id}`);
});

// Legacy enhanced trips routes (redirect to new trips routes)
router.get("/enhanced-trips", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new trips routes
  res.redirect(307, '/api/trips/enhanced');
});

router.get("/enhanced-trips/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new trips routes
  res.redirect(307, `/api/trips/enhanced/${req.params.id}`);
});

// Legacy driver schedules routes (redirect to new drivers routes)
router.get("/driver-schedules", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new drivers routes
  res.redirect(307, '/api/drivers/schedules');
});

router.get("/driver-schedules/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new drivers routes
  res.redirect(307, `/api/drivers/schedules/${req.params.id}`);
});

// Legacy vehicle maintenance routes (redirect to new vehicles routes)
router.get("/vehicle-maintenance", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new vehicles routes
  res.redirect(307, '/api/vehicles/maintenance');
});

router.get("/vehicle-maintenance/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new vehicles routes
  res.redirect(307, `/api/vehicles/maintenance/${req.params.id}`);
});

// Legacy frequent locations routes (redirect to new locations routes)
router.get("/frequent-locations", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new locations routes
  res.redirect(307, '/api/locations/frequent');
});

router.post("/frequent-locations", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  // Forward POST request to new locations route
  // We can't use redirect for POST, so we need to proxy the request
  try {
    const { createFrequentLocation } = await import("../frequent-locations-storage");
    const frequentLocation = await createFrequentLocation(req.body);
    res.status(201).json(frequentLocation);
  } catch (error) {
    console.error("Error creating frequent location:", error);
    res.status(500).json({ message: "Failed to create frequent location" });
  }
});

router.get("/frequent-locations/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new locations routes
  res.redirect(307, `/api/locations/frequent/${req.params.id}`);
});

router.post("/frequent-locations/:id/increment-usage", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  // Forward POST request to increment usage
  try {
    const { incrementUsageCount } = await import("../frequent-locations-storage");
    const result = await incrementUsageCount(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Error incrementing usage count:", error);
    res.status(500).json({ message: "Failed to increment usage count" });
  }
});

// Legacy notification routes (redirect to new notifications routes)
router.get("/notification-templates", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new notifications routes
  res.redirect(307, '/api/notifications/templates');
});

router.post("/notification-templates", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new notifications routes
  res.redirect(307, '/api/notifications/templates');
});

// Legacy calendar routes (redirect to new calendar routes)
router.get("/calendar", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new calendar routes
  res.redirect(307, '/api/calendar');
});

// Legacy bulk operations routes (redirect to new bulk routes)
router.post("/bulk-trips", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new bulk routes
  res.redirect(307, '/api/bulk/trips');
});

router.post("/bulk-drivers", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new bulk routes
  res.redirect(307, '/api/bulk/drivers');
});

router.post("/bulk-clients", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  // Redirect to new bulk routes
  res.redirect(307, '/api/bulk/clients');
});

// ============================================================================
// LEGACY CLIENT GROUPS ROUTES (implement actual endpoints instead of redirects)
// ============================================================================

router.get("/client-groups", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const clientGroups = await clientGroupsStorage.getAllClientGroups();
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});

router.get("/client-groups/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const clientGroup = await clientGroupsStorage.getClientGroup(id);
    
    if (!clientGroup) {
      return res.status(404).json({ message: "Client group not found" });
    }
    
    res.json(clientGroup);
  } catch (error) {
    console.error("Error fetching client group:", error);
    res.status(500).json({ message: "Failed to fetch client group" });
  }
});

router.get("/client-groups/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups by program:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});

router.get("/client-groups/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // For now, return all client groups since we don't have a direct corporate client filter
    // This could be enhanced later to filter by corporate client through programs
    const clientGroups = await clientGroupsStorage.getAllClientGroups();
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups by corporate client:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});

router.post("/client-groups", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('📦 [LEGACY] POST /client-groups - Creating client group:', {
      body: req.body,
      user: req.user?.email,
      role: req.user?.role
    });
    const clientGroup = await clientGroupsStorage.createClientGroup(req.body);
    console.log('✅ [LEGACY] Client group created successfully:', {
      id: clientGroup.id,
      name: clientGroup.name,
      program_id: clientGroup.program_id,
      reference_id: clientGroup.reference_id
    });
    res.status(201).json(clientGroup);
  } catch (error) {
    console.error("❌ [LEGACY] Error creating client group:", error);
    res.status(500).json({ message: "Failed to create client group", error: error instanceof Error ? error.message : String(error) });
  }
});

router.patch("/client-groups/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const clientGroup = await clientGroupsStorage.updateClientGroup(id, req.body);
    res.json(clientGroup);
  } catch (error) {
    console.error("Error updating client group:", error);
    res.status(500).json({ message: "Failed to update client group" });
  }
});

router.delete("/client-groups/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await clientGroupsStorage.deleteClientGroup(id);
    res.json({ message: "Client group deleted successfully" });
  } catch (error) {
    console.error("Error deleting client group:", error);
    res.status(500).json({ message: "Failed to delete client group" });
  }
});

// ============================================================================
// LEGACY CLIENT GROUP MEMBERSHIPS ROUTES
// ============================================================================

router.get("/client-group-memberships/:groupId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { groupId } = req.params;
    const members = await clientGroupsStorage.getClientGroupMembers(groupId);
    res.json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ message: "Failed to fetch group members" });
  }
});

router.post("/client-group-memberships", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { groupId, clientId } = req.body;
    const membership = await clientGroupsStorage.addClientToGroup(groupId, clientId);
    res.status(201).json(membership);
  } catch (error) {
    console.error("Error adding client to group:", error);
    res.status(500).json({ message: "Failed to add client to group" });
  }
});

router.delete("/client-group-memberships/:membershipId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { membershipId } = req.params;
    await clientGroupsStorage.removeClientFromGroup(membershipId);
    res.json({ message: "Client removed from group successfully" });
  } catch (error) {
    console.error("Error removing client from group:", error);
    res.status(500).json({ message: "Failed to remove client from group" });
  }
});

export default router;
