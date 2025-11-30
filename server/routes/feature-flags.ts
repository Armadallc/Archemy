import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { featureFlagsStorage } from "../feature-flags-storage";

const router = express.Router();

// ============================================================================
// FEATURE FLAGS ROUTES
// ============================================================================

/**
 * GET /api/feature-flags
 * Get feature flags for current hierarchy level
 * Access: super_admin, corporate_admin, program_admin
 */
router.get("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if user has permission to view feature flags
    if (!['super_admin', 'corporate_admin', 'program_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const level = (req.query.level as string) || 'corporate';
    const corporateClientId = req.query.corporate_client_id as string | undefined;
    const programId = req.query.program_id as string | undefined;

    const flags = await featureFlagsStorage.getFeatureFlags(
      level as 'corporate' | 'program' | 'location',
      corporateClientId,
      programId
    );

    res.json(flags);
  } catch (error: any) {
    console.error("Error fetching feature flags:", error);
    
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return res.status(404).json({ 
        message: 'feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql',
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch feature flags",
      error: error.message 
    });
  }
});

/**
 * GET /api/feature-flags/program/:id
 * Get feature flags for a specific program
 * Access: super_admin, corporate_admin, program_admin
 */
router.get("/program/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!['super_admin', 'corporate_admin', 'program_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const programId = req.params.id;
    const flags = await featureFlagsStorage.getFeatureFlags(
      'program',
      undefined,
      programId
    );

    res.json(flags);
  } catch (error: any) {
    console.error("Error fetching program feature flags:", error);
    
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return res.status(404).json({ 
        message: 'feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql',
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch program feature flags",
      error: error.message 
    });
  }
});

/**
 * GET /api/feature-flags/check/:flagName
 * Check if a specific feature flag is enabled for the current user's context
 * Access: Authenticated users
 */
router.get("/check/:flagName", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const flagName = req.params.flagName;
    const programId = req.query.programId as string | undefined;
    const corporateClientId = req.query.corporateClientId as string | undefined;

    const flag = await featureFlagsStorage.getFeatureFlag(
      flagName,
      programId,
      corporateClientId
    );

    res.json({ isEnabled: flag?.is_enabled || false });
  } catch (error: any) {
    console.error("Error checking feature flag:", error);
    
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return res.status(404).json({ 
        message: 'feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql',
        migrationRequired: true,
        isEnabled: false
      });
    }
    
    res.status(500).json({ 
      message: "Failed to check feature flag",
      error: error.message,
      isEnabled: false
    });
  }
});

/**
 * GET /api/feature-flags/corporate-client/:id
 * Get feature flags for a specific corporate client
 * Access: super_admin, corporate_admin
 */
router.get("/corporate-client/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!['super_admin', 'corporate_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const corporateClientId = req.params.id;
    const flags = await featureFlagsStorage.getFeatureFlags(
      'corporate',
      corporateClientId,
      undefined
    );

    res.json(flags);
  } catch (error: any) {
    console.error("Error fetching corporate client feature flags:", error);
    
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return res.status(404).json({ 
        message: 'feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql',
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch corporate client feature flags",
      error: error.message 
    });
  }
});

/**
 * POST /api/feature-flags/create
 * Create a new feature flag
 * Access: super_admin only
 */
router.post("/create", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { flag_name, is_enabled, description, program_id, corporate_client_id } = req.body;

    if (!flag_name || typeof flag_name !== 'string') {
      return res.status(400).json({ message: "flag_name is required and must be a string" });
    }

    if (typeof is_enabled !== 'boolean') {
      return res.status(400).json({ message: "is_enabled is required and must be a boolean" });
    }

    const flag = await featureFlagsStorage.createFeatureFlag({
      flag_name,
      is_enabled,
      description: description || null,
      program_id: program_id || null,
      corporate_client_id: corporate_client_id || null,
    });

    res.status(201).json(flag);
  } catch (error: any) {
    console.error("Error creating feature flag:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    
    if (error.code === '23505' || error.message?.includes('unique constraint') || error.message?.includes('already exists')) {
      return res.status(409).json({ 
        message: "A feature flag with this name already exists at this scope",
        error: error.message,
        code: error.code
      });
    }
    
    if (error.code === '42P01' || error.code === 'MIGRATION_REQUIRED' || error.message?.includes('does not exist')) {
      return res.status(404).json({ 
        message: 'feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql',
        migrationRequired: true,
        error: error.message
      });
    }
    
    res.status(500).json({ 
      message: "Failed to create feature flag",
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  }
});

/**
 * POST /api/feature-flags/toggle
 * Toggle a feature flag's enabled status
 * Access: super_admin, corporate_admin
 */
router.post("/toggle", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!['super_admin', 'corporate_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const { id, is_enabled } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: "id is required and must be a string" });
    }

    if (typeof is_enabled !== 'boolean') {
      return res.status(400).json({ message: "is_enabled is required and must be a boolean" });
    }

    const flag = await featureFlagsStorage.toggleFeatureFlag(id, is_enabled);

    res.json(flag);
  } catch (error: any) {
    console.error("Error toggling feature flag:", error);
    
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return res.status(404).json({ 
        message: 'feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql',
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to toggle feature flag",
      error: error.message 
    });
  }
});

/**
 * PUT /api/feature-flags/:id
 * Update a feature flag
 * Access: super_admin, corporate_admin
 */
router.put("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!['super_admin', 'corporate_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const flagId = req.params.id;
    const { flag_name, is_enabled, description, program_id, corporate_client_id } = req.body;

    const updates: any = {};
    if (flag_name !== undefined) updates.flag_name = flag_name;
    if (is_enabled !== undefined) updates.is_enabled = is_enabled;
    if (description !== undefined) updates.description = description;
    if (program_id !== undefined) updates.program_id = program_id;
    if (corporate_client_id !== undefined) updates.corporate_client_id = corporate_client_id;

    const flag = await featureFlagsStorage.updateFeatureFlag(flagId, updates);

    res.json(flag);
  } catch (error: any) {
    console.error("Error updating feature flag:", error);
    
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return res.status(404).json({ 
        message: 'feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql',
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to update feature flag",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/feature-flags/:id
 * Delete a feature flag
 * Access: super_admin only
 */
router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const flagId = req.params.id;

    await featureFlagsStorage.deleteFeatureFlag(flagId);

    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting feature flag:", error);
    
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return res.status(404).json({ 
        message: 'feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql',
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to delete feature flag",
      error: error.message 
    });
  }
});

export default router;


