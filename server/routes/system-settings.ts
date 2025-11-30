import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { systemSettingsStorage } from "../system-settings-storage";

const router = express.Router();

// ============================================================================
// SYSTEM SETTINGS ROUTES
// ============================================================================

/**
 * GET /api/system-settings
 * Get current system settings
 * Access: super_admin only
 */
router.get("/", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    let settings = await systemSettingsStorage.getSystemSettings();
    
    // If no settings exist, initialize with defaults
    if (!settings) {
      settings = await systemSettingsStorage.initializeDefaultSettings();
    }
    
    res.json(settings);
  } catch (error: any) {
    console.error("Error fetching system settings:", error);
    
    // If table doesn't exist, return 404 with helpful message
    if (error.code === 'MIGRATION_REQUIRED' || error.code === '42P01') {
      return res.status(404).json({ 
        message: "System settings table does not exist. Please run migration: migrations/0028_create_system_settings_table.sql",
        error: error.message,
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch system settings",
      error: error.message 
    });
  }
});

/**
 * PUT /api/system-settings
 * Update system settings
 * Access: super_admin only
 */
router.put("/", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const updates = req.body;
    
    // Validate required fields
    if (!updates.app_name || !updates.support_email || !updates.support_phone || !updates.timezone || !updates.language) {
      return res.status(400).json({ 
        message: "Missing required fields: app_name, support_email, support_phone, timezone, language" 
      });
    }
    
    // Update settings (will create if doesn't exist due to upsert)
    const updatedSettings = await systemSettingsStorage.updateSystemSettings(updates);
    
    res.json(updatedSettings);
  } catch (error: any) {
    console.error("Error updating system settings:", error);
    
    // If table doesn't exist, return 404 with helpful message
    if (error.code === 'MIGRATION_REQUIRED' || error.code === '42P01') {
      return res.status(404).json({ 
        message: "System settings table does not exist. Please run migration: migrations/0028_create_system_settings_table.sql",
        error: error.message,
        migrationRequired: true
      });
    }
    
    res.status(500).json({ 
      message: "Failed to update system settings",
      error: error.message 
    });
  }
});

export default router;

