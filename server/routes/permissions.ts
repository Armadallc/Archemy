import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { permissionsStorage } from "../permissions-storage";

const router = express.Router();

// ============================================================================
// PERMISSIONS ROUTES
// ============================================================================

/**
 * GET /api/permissions/effective
 * Get current user's effective permissions
 * Access: Authenticated users
 */
router.get("/effective", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const level = (req.query.level as string) || 'corporate';
    const corporateClientId = req.query.corporate_client_id as string | undefined;
    const programId = req.query.program_id as string | undefined;

    const permissions = await permissionsStorage.getEffectivePermissions(
      req.user.userId,
      level as 'corporate' | 'program' | 'location',
      corporateClientId,
      programId
    );

    res.json(permissions);
  } catch (error: any) {
    console.error("Error fetching effective permissions:", error);
    
    if (error.code === 'MIGRATION_REQUIRED' || error.code === '42P01') {
      return res.status(404).json({ 
        message: error.message,
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch effective permissions",
      error: error.message 
    });
  }
});

/**
 * GET /api/permissions/effective/program/:id
 * Get effective permissions for a specific program
 * Access: Authenticated users
 */
router.get("/effective/program/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const programId = req.params.id;
    const permissions = await permissionsStorage.getEffectivePermissions(
      req.user.userId,
      'program',
      undefined,
      programId
    );

    res.json(permissions);
  } catch (error: any) {
    console.error("Error fetching program effective permissions:", error);
    
    if (error.code === 'MIGRATION_REQUIRED' || error.code === '42P01') {
      return res.status(404).json({ 
        message: error.message,
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch program effective permissions",
      error: error.message 
    });
  }
});

/**
 * GET /api/permissions/effective/corporate-client/:id
 * Get effective permissions for a specific corporate client
 * Access: Authenticated users
 */
router.get("/effective/corporate-client/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const corporateClientId = req.params.id;
    const permissions = await permissionsStorage.getEffectivePermissions(
      req.user.userId,
      'corporate',
      corporateClientId
    );

    res.json(permissions);
  } catch (error: any) {
    console.error("Error fetching corporate client effective permissions:", error);
    
    if (error.code === 'MIGRATION_REQUIRED' || error.code === '42P01') {
      return res.status(404).json({ 
        message: error.message,
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch corporate client effective permissions",
      error: error.message 
    });
  }
});

/**
 * GET /api/permissions/all
 * Get all permissions (admin only)
 * Access: super_admin, corporate_admin
 */
router.get("/all", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const level = (req.query.level as string) || 'corporate';
    const corporateClientId = req.query.corporate_client_id as string | undefined;
    const programId = req.query.program_id as string | undefined;

    const permissions = await permissionsStorage.getAllPermissions(
      level as 'corporate' | 'program' | 'location',
      corporateClientId,
      programId
    );

    res.json(permissions);
  } catch (error: any) {
    console.error("Error fetching all permissions:", error);
    
    if (error.code === 'MIGRATION_REQUIRED' || error.code === '42P01') {
      return res.status(404).json({ 
        message: error.message,
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch all permissions",
      error: error.message 
    });
  }
});

/**
 * GET /api/permissions/all/program/:id
 * Get all permissions for a specific program
 * Access: super_admin, corporate_admin
 */
router.get("/all/program/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const programId = req.params.id;
    const permissions = await permissionsStorage.getAllPermissions(
      'program',
      undefined,
      programId
    );

    res.json(permissions);
  } catch (error: any) {
    console.error("Error fetching program permissions:", error);
    
    if (error.code === 'MIGRATION_REQUIRED' || error.code === '42P01') {
      return res.status(404).json({ 
        message: error.message,
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch program permissions",
      error: error.message 
    });
  }
});

/**
 * GET /api/permissions/all/corporate-client/:id
 * Get all permissions for a specific corporate client
 * Access: super_admin only
 */
router.get("/all/corporate-client/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const corporateClientId = req.params.id;
    const permissions = await permissionsStorage.getAllPermissions(
      'corporate',
      corporateClientId
    );

    res.json(permissions);
  } catch (error: any) {
    console.error("Error fetching corporate client permissions:", error);
    
    if (error.code === 'MIGRATION_REQUIRED' || error.code === '42P01') {
      return res.status(404).json({ 
        message: error.message,
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch corporate client permissions",
      error: error.message 
    });
  }
});

/**
 * POST /api/permissions/grant
 * Grant a permission to a role
 * Access: super_admin only
 */
router.post("/grant", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { role, permission, resource, program_id, corporate_client_id } = req.body;

    // Validate required fields
    if (!role || !permission) {
      return res.status(400).json({ 
        message: "Missing required fields: role, permission" 
      });
    }

    const permissionData = {
      role,
      permission,
      resource: resource || '*',
      program_id: program_id || null,
      corporate_client_id: corporate_client_id || null,
    };

    const grantedPermission = await permissionsStorage.grantPermission(permissionData);

    res.status(201).json(grantedPermission);
  } catch (error: any) {
    console.error("Error granting permission:", error);
    
    if (error.message?.includes('already exists')) {
      return res.status(409).json({ 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to grant permission",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/permissions/:id
 * Revoke a permission (delete by ID)
 * Access: super_admin only
 */
router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const permissionId = req.params.id;

    if (!permissionId) {
      return res.status(400).json({ 
        message: "Permission ID required" 
      });
    }

    await permissionsStorage.revokePermission(permissionId);

    res.status(200).json({ 
      message: "Permission revoked successfully" 
    });
  } catch (error: any) {
    console.error("Error revoking permission:", error);
    
    res.status(500).json({ 
      message: "Failed to revoke permission",
      error: error.message 
    });
  }
});

export default router;

