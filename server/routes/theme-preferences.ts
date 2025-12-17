/**
 * Theme Preferences API Routes
 * 
 * Handles saving and loading user-specific theme customizations
 * for both light and dark modes.
 */

import express from 'express';
import { requireSupabaseAuth, SupabaseAuthenticatedRequest } from '../supabase-auth';
import { supabase } from '../minimal-supabase';

const router = express.Router();

/**
 * GET /api/theme-preferences
 * Get current user's theme preferences
 */
router.get('/', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    console.log(`[Theme Preferences] Fetching preferences for user: ${req.user.userId}`);
    
    const { data, error } = await supabase
      .from('user_theme_preferences')
      .select('*')
      .eq('user_id', req.user.userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle not found gracefully

    if (error) {
      console.error('[Theme Preferences] Error fetching theme preferences:', error);
      return res.status(500).json({ 
        message: "Failed to fetch theme preferences",
        error: error.message,
        code: error.code
      });
    }

    console.log(`[Theme Preferences] Found preferences:`, data ? 'yes' : 'no');
    
    // Return null if no preferences exist (not an error)
    res.json({
      success: true,
      preferences: data || null
    });
  } catch (error: any) {
    console.error("Error in GET /api/theme-preferences:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
});

/**
 * POST /api/theme-preferences
 * Create or update current user's theme preferences
 */
router.post('/', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { light_mode_tokens, dark_mode_tokens } = req.body;

    // Validate that at least one mode has tokens
    if (!light_mode_tokens && !dark_mode_tokens) {
      return res.status(400).json({ 
        message: "At least one mode (light or dark) must have tokens" 
      });
    }

    // Generate ID for the preference record
    const id = `theme_pref_${req.user.userId}`;

    // Prepare data for upsert
    const preferenceData = {
      id,
      user_id: req.user.userId,
      light_mode_tokens: light_mode_tokens || null,
      dark_mode_tokens: dark_mode_tokens || null,
      updated_at: new Date().toISOString()
    };

    // Check if preferences already exist
    const { data: existing } = await supabase
      .from('user_theme_preferences')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    let result;
    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_theme_preferences')
        .update(preferenceData)
        .eq('user_id', req.user.userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating theme preferences:', error);
        return res.status(500).json({ 
          message: "Failed to update theme preferences",
          error: error.message 
        });
      }
      result = data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('user_theme_preferences')
        .insert({
          ...preferenceData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating theme preferences:', error);
        return res.status(500).json({ 
          message: "Failed to create theme preferences",
          error: error.message 
        });
      }
      result = data;
    }

    res.json({
      success: true,
      preferences: result
    });
  } catch (error: any) {
    console.error("Error in POST /api/theme-preferences:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
});

/**
 * DELETE /api/theme-preferences
 * Delete current user's theme preferences (reset to default)
 */
router.delete('/', requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { error } = await supabase
      .from('user_theme_preferences')
      .delete()
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Error deleting theme preferences:', error);
      return res.status(500).json({ 
        message: "Failed to delete theme preferences",
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: "Theme preferences reset to default"
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/theme-preferences:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
});

export default router;

