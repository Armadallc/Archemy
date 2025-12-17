import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { systemSettingsStorage } from "../system-settings-storage";
import { upload } from "../upload";
import { processMainLogoToSupabase, deleteFileFromSupabase } from "../upload";

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

// ============================================================================
// MAIN LOGO ROUTES
// ============================================================================

/**
 * POST /api/system/main-logo
 * Upload main application logo
 * Access: super_admin only
 */
router.post("/main-logo", requireSupabaseAuth, requireSupabaseRole(['super_admin']), upload.single('logo'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    // Get current system settings to check for existing logo
    const currentSettings = await systemSettingsStorage.getSystemSettings();
    
    // Delete old logo if it exists
    if (currentSettings?.main_logo_url) {
      try {
        await deleteFileFromSupabase(currentSettings.main_logo_url);
      } catch (error) {
        console.error('Error deleting old main logo:', error);
        // Continue even if deletion fails
      }
    }

    // Process and upload new logo to Supabase Storage
    const logoUrl = await processMainLogoToSupabase(req.file.buffer);

    // Update system settings with new logo URL
    const updatedSettings = await systemSettingsStorage.updateSystemSettings({
      main_logo_url: logoUrl,
    });

    res.json({ main_logo_url: updatedSettings.main_logo_url });
  } catch (error: any) {
    console.error("Error uploading main logo:", error);
    res.status(500).json({ 
      message: "Failed to upload main logo",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/system/main-logo
 * Delete main application logo
 * Access: super_admin only
 */
router.delete("/main-logo", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get current system settings
    const currentSettings = await systemSettingsStorage.getSystemSettings();
    
    // Delete logo file if it exists
    if (currentSettings?.main_logo_url) {
      try {
        await deleteFileFromSupabase(currentSettings.main_logo_url);
      } catch (error) {
        console.error('Error deleting main logo file:', error);
        // Continue even if deletion fails
      }
    }

    // Update system settings to remove logo URL
    const updatedSettings = await systemSettingsStorage.updateSystemSettings({
      main_logo_url: null,
    });

    res.json({ main_logo_url: null });
  } catch (error: any) {
    console.error("Error deleting main logo:", error);
    res.status(500).json({ 
      message: "Failed to delete main logo",
      error: error.message 
    });
  }
});

export default router;

