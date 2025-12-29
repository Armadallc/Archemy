import express from "express";
import multer from "multer";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission } from "../auth";
import { PERMISSIONS } from "../permissions";
import { clientsStorage, clientGroupsStorage } from "../minimal-supabase";
import { upload, processClientAvatarToSupabase, deleteFileFromSupabase } from "../upload";

const router = express.Router();

// Configure multer for CSV file uploads
const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Accept CSV and Excel files
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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

/**
 * POST /api/clients/merge
 * Merge multiple clients into a primary client
 * Body: { primaryClientId: string, secondaryClientIds: string[] }
 */
router.post("/merge", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { primaryClientId, secondaryClientIds } = req.body;

    if (!primaryClientId || !secondaryClientIds || !Array.isArray(secondaryClientIds) || secondaryClientIds.length === 0) {
      return res.status(400).json({ 
        message: "primaryClientId and secondaryClientIds array are required" 
      });
    }

    if (secondaryClientIds.includes(primaryClientId)) {
      return res.status(400).json({ 
        message: "Primary client cannot be in the secondary clients list" 
      });
    }

    const result = await clientsStorage.mergeClients(primaryClientId, secondaryClientIds);
    
    res.json({
      message: "Clients merged successfully",
      ...result
    });
  } catch (error: any) {
    console.error("Error merging clients:", error);
    res.status(500).json({ 
      message: error.message || "Failed to merge clients" 
    });
  }
});

/**
 * POST /api/clients/bulk-delete
 * Bulk delete multiple clients (soft delete)
 * Body: { clientIds: string[] }
 */
router.post("/bulk-delete", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { clientIds } = req.body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({ 
        message: "clientIds array is required" 
      });
    }

    const result = await clientsStorage.bulkDeleteClients(clientIds);
    
    res.json({
      message: "Clients deleted successfully",
      ...result
    });
  } catch (error: any) {
    console.error("Error bulk deleting clients:", error);
    res.status(500).json({ 
      message: error.message || "Failed to delete clients" 
    });
  }
});

/**
 * POST /api/clients/import
 * Import clients from CSV/Excel file
 * Body: FormData with 'file' and 'program_id'
 */
router.post("/import", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), csvUpload.single('file'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        message: "No file provided. Please upload a CSV file." 
      });
    }

    const { program_id } = req.body;
    if (!program_id) {
      return res.status(400).json({ 
        message: "program_id is required" 
      });
    }

    // Parse CSV file
    const { parseCSV, excelToCSV } = await import('../utils/csv-parser');
    let csvText: string;

    try {
      csvText = await excelToCSV(req.file.buffer, req.file.mimetype);
    } catch (error: any) {
      return res.status(400).json({ 
        message: error.message || "Failed to parse file. Please ensure it's a valid CSV file." 
      });
    }

    // Parse CSV content
    const parseResult = parseCSV(csvText);

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return res.status(400).json({ 
        message: "Failed to parse CSV file",
        errors: parseResult.errors
      });
    }

    if (parseResult.data.length === 0) {
      return res.status(400).json({ 
        message: "No data rows found in CSV file" 
      });
    }

    // Import clients
    const importResult = await clientsStorage.bulkImportClients(parseResult.data, program_id);

    // Combine parsing errors with import errors
    const allErrors = [...parseResult.errors, ...importResult.errors];

    res.json({
      success: importResult.success,
      failed: importResult.failed + parseResult.errors.length,
      errors: allErrors,
      message: `Import completed: ${importResult.success} successful, ${importResult.failed + parseResult.errors.length} failed`
    });
  } catch (error: any) {
    console.error("Error importing clients:", error);
    res.status(500).json({ 
      message: error.message || "Failed to import clients" 
    });
  }
});

// ============================================================================
// CLIENT AVATAR ROUTES
// ============================================================================

/**
 * POST /api/clients/:id/avatar
 * Upload client avatar
 * Access: super_admin, corporate_admin, program_admin, program_user
 */
router.post("/:id/avatar", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), upload.single('avatar'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('📤 Client avatar upload request received');
    const { id } = req.params;
    console.log('👤 Client ID:', id);
    console.log('📁 File received:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'NO FILE');
    
    // Check authentication
    if (!req.user) {
      console.error('❌ No user in request');
      return res.status(401).json({ message: "Authentication required" });
    }

    console.log('✅ Authenticated user:', req.user.userId, req.user.role);

    // Check if file was uploaded
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ message: "No file provided" });
    }

    console.log('📥 Processing file...');

    // Get current client to check for existing avatar
    const currentClient = await clientsStorage.getClient(id);
    if (!currentClient) {
      console.error('❌ Client not found:', id);
      return res.status(404).json({ message: "Client not found" });
    }

    console.log('👤 Current client found:', currentClient.first_name, currentClient.last_name);
    console.log('🖼️ Current avatar URL:', currentClient.avatar_url);

    // Delete old avatar if it exists (from Supabase Storage)
    if (currentClient.avatar_url) {
      try {
        console.log('🗑️ Deleting old avatar...');
        await deleteFileFromSupabase(currentClient.avatar_url);
        console.log('✅ Old avatar deleted');
      } catch (error) {
        console.error('⚠️ Error deleting old avatar (continuing):', error);
        // Continue even if deletion fails
      }
    }

    // Process and upload new avatar to Supabase Storage
    console.log('🔄 Processing and uploading avatar to Supabase...');
    const avatarUrl = await processClientAvatarToSupabase(req.file.buffer, id);
    console.log('✅ Avatar uploaded to Supabase:', avatarUrl);

    // Update client record with new avatar URL
    console.log('💾 Updating client record...');
    const updatedClient = await clientsStorage.updateClient(id, {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    });
    console.log('✅ Client record updated');

    res.json({
      success: true,
      avatar_url: avatarUrl,
      client: updatedClient
    });
  } catch (error: any) {
    console.error("❌ Error uploading client avatar:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Failed to upload client avatar",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/clients/:id/avatar
 * Delete client avatar
 * Access: super_admin, corporate_admin, program_admin, program_user
 */
router.delete("/:id/avatar", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get current client
    const currentClient = await clientsStorage.getClient(id);
    if (!currentClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Delete avatar from Supabase Storage if it exists
    if (currentClient.avatar_url) {
      try {
        await deleteFileFromSupabase(currentClient.avatar_url);
      } catch (error) {
        console.error('Error deleting avatar:', error);
        // Continue even if deletion fails
      }
    }

    // Update client record to remove avatar URL
    const updatedClient = await clientsStorage.updateClient(id, {
      avatar_url: null,
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "Client avatar deleted successfully",
      client: updatedClient
    });
  } catch (error: any) {
    console.error("Error deleting client avatar:", error);
    res.status(500).json({ 
      message: "Failed to delete client avatar",
      error: error.message 
    });
  }
});

export default router;
