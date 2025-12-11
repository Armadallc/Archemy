import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { themesStorage, userThemeSelectionsStorage } from "../themes-storage";

const router = express.Router();

// ============================================================================
// THEMES ROUTES (Super Admin Only)
// ============================================================================

/**
 * GET /api/themes
 * Get all active themes (for regular users) or all themes (for super admins)
 */
router.get("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Super admins get all themes, regular users get only active themes
    const themes = req.user.role === 'super_admin'
      ? await themesStorage.getAllThemes()
      : await themesStorage.getActiveThemes();

    res.json(themes);
  } catch (error: any) {
    console.error("Error fetching themes:", error);
    res.status(500).json({ 
      message: "Failed to fetch themes",
      error: error.message 
    });
  }
});

/**
 * GET /api/themes/:id
 * Get a single theme by ID
 */
router.get("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const theme = await themesStorage.getTheme(id);

    if (!theme) {
      return res.status(404).json({ message: "Theme not found" });
    }

    // Regular users can only access active themes
    if (req.user.role !== 'super_admin' && !theme.is_active) {
      return res.status(403).json({ message: "Theme not available" });
    }

    res.json(theme);
  } catch (error: any) {
    console.error("Error fetching theme:", error);
    res.status(500).json({ 
      message: "Failed to fetch theme",
      error: error.message 
    });
  }
});

/**
 * POST /api/themes
 * Create a new theme (super admin only)
 */
router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { name, description, light_mode_tokens, dark_mode_tokens, is_active } = req.body;

    if (!name || !light_mode_tokens || !dark_mode_tokens) {
      return res.status(400).json({ 
        message: "Missing required fields: name, light_mode_tokens, dark_mode_tokens" 
      });
    }

    const theme = await themesStorage.createTheme({
      name,
      description: description || null,
      light_mode_tokens,
      dark_mode_tokens,
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user.userId,
    });

    res.status(201).json(theme);
  } catch (error: any) {
    console.error("Error creating theme:", error);
    res.status(500).json({ 
      message: error.message || "Failed to create theme",
      error: error.message 
    });
  }
});

/**
 * PUT /api/themes/:id
 * Update an existing theme (super admin only)
 */
router.put("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    const { name, description, light_mode_tokens, dark_mode_tokens, is_active } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (light_mode_tokens !== undefined) updates.light_mode_tokens = light_mode_tokens;
    if (dark_mode_tokens !== undefined) updates.dark_mode_tokens = dark_mode_tokens;
    if (is_active !== undefined) updates.is_active = is_active;

    const theme = await themesStorage.updateTheme(id, updates);

    res.json(theme);
  } catch (error: any) {
    console.error("Error updating theme:", error);
    res.status(500).json({ 
      message: error.message || "Failed to update theme",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/themes/:id
 * Delete a theme (super admin only)
 */
router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    await themesStorage.deleteTheme(id);

    res.json({ message: "Theme deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting theme:", error);
    res.status(500).json({ 
      message: "Failed to delete theme",
      error: error.message 
    });
  }
});

// ============================================================================
// USER THEME SELECTIONS ROUTES
// ============================================================================

/**
 * GET /api/themes/user/selection
 * Get current user's theme selection
 */
router.get("/user/selection", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const selection = await userThemeSelectionsStorage.getUserThemeSelection(req.user.userId);

    if (!selection) {
      return res.status(404).json({ message: "No theme selection found" });
    }

    // Also fetch the theme details
    const theme = await themesStorage.getTheme(selection.theme_id);
    if (!theme) {
      return res.status(404).json({ message: "Selected theme not found" });
    }

    res.json({
      ...selection,
      theme,
    });
  } catch (error: any) {
    console.error("Error fetching user theme selection:", error);
    res.status(500).json({ 
      message: "Failed to fetch user theme selection",
      error: error.message 
    });
  }
});

/**
 * POST /api/themes/user/selection
 * Create or update current user's theme selection
 */
router.post("/user/selection", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { theme_id, theme_mode } = req.body;

    if (!theme_id) {
      return res.status(400).json({ message: "Missing required field: theme_id" });
    }

    // Verify theme exists and is active (unless super admin)
    const theme = await themesStorage.getTheme(theme_id);
    if (!theme) {
      return res.status(404).json({ message: "Theme not found" });
    }

    if (req.user.role !== 'super_admin' && !theme.is_active) {
      return res.status(403).json({ message: "Theme is not available" });
    }

    const selection = await userThemeSelectionsStorage.upsertUserThemeSelection(
      req.user.userId,
      theme_id,
      theme_mode || 'light'
    );

    res.json(selection);
  } catch (error: any) {
    console.error("Error saving user theme selection:", error);
    res.status(500).json({ 
      message: "Failed to save user theme selection",
      error: error.message 
    });
  }
});

/**
 * PUT /api/themes/user/mode
 * Update only the theme mode (light/dark) for current user
 */
router.put("/user/mode", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { theme_mode } = req.body;

    if (!theme_mode || (theme_mode !== 'light' && theme_mode !== 'dark')) {
      return res.status(400).json({ message: "Invalid theme_mode. Must be 'light' or 'dark'" });
    }

    const selection = await userThemeSelectionsStorage.updateUserThemeMode(
      req.user.userId,
      theme_mode
    );

    res.json(selection);
  } catch (error: any) {
    console.error("Error updating user theme mode:", error);
    res.status(500).json({ 
      message: "Failed to update user theme mode",
      error: error.message 
    });
  }
});

export default router;

