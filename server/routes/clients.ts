import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { clientsStorage, clientGroupsStorage } from "../minimal-supabase";

const router = express.Router();

// ============================================================================
// CLIENTS ROUTES
// ============================================================================

router.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const clients = await clientsStorage.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

// ============================================================================
// CLIENT GROUPS ROUTES (moved before /:id to avoid route conflicts)
// ============================================================================

router.get("/groups", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const clientGroups = await clientGroupsStorage.getAllClientGroups();
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});

router.get("/groups/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
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

router.get("/groups/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups by program:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});

router.get("/groups/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    console.log('🔍 [GET /clients/groups/corporate-client/:corporateClientId] Fetching for:', corporateClientId);
    const clientGroups = await clientGroupsStorage.getClientGroupsByCorporateClient(corporateClientId);
    console.log(`✅ Found ${clientGroups.length} client groups for corporate client ${corporateClientId}`);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups by corporate client:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});

router.post("/groups", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const clientGroup = await clientGroupsStorage.createClientGroup(req.body);
    res.status(201).json(clientGroup);
  } catch (error) {
    console.error("Error creating client group:", error);
    res.status(500).json({ message: "Failed to create client group" });
  }
});

router.patch("/groups/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const clientGroup = await clientGroupsStorage.updateClientGroup(id, req.body);
    res.json(clientGroup);
  } catch (error) {
    console.error("Error updating client group:", error);
    res.status(500).json({ message: "Failed to update client group" });
  }
});

router.delete("/groups/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
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
// CLIENT GROUP MEMBERSHIPS ROUTES
// ============================================================================

router.get("/group-memberships/:groupId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { groupId } = req.params;
    const members = await clientGroupsStorage.getClientGroupMembers(groupId);
    res.json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ message: "Failed to fetch group members" });
  }
});

router.post("/group-memberships", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { groupId, clientId } = req.body;
    const membership = await clientGroupsStorage.addClientToGroup(groupId, clientId);
    res.status(201).json(membership);
  } catch (error) {
    console.error("Error adding client to group:", error);
    res.status(500).json({ message: "Failed to add client to group" });
  }
});

router.delete("/group-memberships/:membershipId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { membershipId } = req.params;
    await clientGroupsStorage.removeClientFromGroup(membershipId);
    res.json({ message: "Client removed from group successfully" });
  } catch (error) {
    console.error("Error removing client from group:", error);
    res.status(500).json({ message: "Failed to remove client from group" });
  }
});

// ============================================================================
// SPECIFIC CLIENT ROUTES (moved after groups to avoid conflicts)
// ============================================================================

router.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const clients = await clientsStorage.getClientsByProgram(programId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients by program:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

router.get("/location/:locationId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { locationId } = req.params;
    const clients = await clientsStorage.getClientsByLocation(locationId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients by location:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

router.get("/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  console.log('🔍 [GET /clients/corporate-client/:corporateClientId] Route hit');
  console.log('🔍 Corporate client ID:', req.params.corporateClientId);
  try {
    const { corporateClientId } = req.params;
    console.log('🔍 Fetching clients for corporate client:', corporateClientId);
    const clients = await clientsStorage.getClientsByCorporateClient(corporateClientId);
    console.log(`✅ Found ${clients.length} clients for corporate client ${corporateClientId}`);
    res.json(clients);
  } catch (error) {
    console.error("❌ Error fetching clients by corporate client:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

// ============================================================================
// GENERIC CLIENT ROUTES (moved last to avoid conflicts)
// ============================================================================

router.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const client = await clientsStorage.getClient(id);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ message: "Failed to fetch client" });
  }
});

router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 [POST /api/clients] Creating client with data:', {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      program_id: req.body.program_id,
      location_id: req.body.location_id
    });
    const client = await clientsStorage.createClient(req.body);
    console.log('✅ [POST /api/clients] Client created successfully:', {
      id: client.id,
      scid: client.scid,
      program_id: client.program_id
    });
    res.status(201).json(client);
  } catch (error) {
    console.error("❌ [POST /api/clients] Error creating client:", error);
    res.status(500).json({ message: "Failed to create client" });
  }
});

router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const client = await clientsStorage.updateClient(id, req.body);
    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ message: "Failed to update client" });
  }
});

router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await clientsStorage.deleteClient(id);
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ message: "Failed to delete client" });
  }
});

export default router;
