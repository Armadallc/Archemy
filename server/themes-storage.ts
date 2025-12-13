import { supabase } from './minimal-supabase';

/**
 * Themes Storage
 * Manages shared theme templates (created by super admins)
 */

export interface Theme {
  id: string;
  name: string;
  description?: string | null;
  light_mode_tokens: any;
  dark_mode_tokens: any;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserThemeSelection {
  id: string;
  user_id: string;
  theme_id: string;
  theme_mode: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

export const themesStorage = {
  /**
   * Get all active themes (for regular users)
   */
  async getActiveThemes(): Promise<Theme[]> {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  },

  /**
   * Get all themes (for super admins - includes inactive)
   */
  async getAllThemes(): Promise<Theme[]> {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  },

  /**
   * Get a single theme by ID
   */
  async getTheme(themeId: string): Promise<Theme | null> {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('id', themeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data;
  },

  /**
   * Create a new theme
   * Enforces maximum of 4 active themes
   */
  async createTheme(theme: Omit<Theme, 'id' | 'created_at' | 'updated_at'>): Promise<Theme> {
    // Check current active theme count (only if creating an active theme)
    if (theme.is_active !== false) {
      const { count, error: countError } = await supabase
        .from('themes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) {
        console.error('❌ Error checking active theme count:', countError);
        throw countError;
      }

      if (count && count >= 4) {
        throw new Error('Maximum of 4 active themes allowed. Please deactivate an existing theme first.');
      }
    }

    // Generate ID
    const id = `theme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('💾 Inserting theme into database:', {
      id,
      name: theme.name,
      is_active: theme.is_active,
      hasLightTokens: !!theme.light_mode_tokens,
      hasDarkTokens: !!theme.dark_mode_tokens,
      lightTokensKeys: theme.light_mode_tokens ? Object.keys(theme.light_mode_tokens) : [],
    });

    const { data, error } = await supabase
      .from('themes')
      .insert({
        id,
        ...theme,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    console.log('✅ Theme created successfully:', data.id);
    return data;
  },

  /**
   * Update an existing theme
   */
  async updateTheme(themeId: string, updates: Partial<Theme>): Promise<Theme> {
    // If activating a theme, check active count
    if (updates.is_active === true) {
      const { count, error: countError } = await supabase
        .from('themes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .neq('id', themeId);

      if (countError) {
        throw countError;
      }

      if (count && count >= 4) {
        throw new Error('Maximum of 4 active themes allowed. Please deactivate an existing theme first.');
      }
    }

    const { data, error } = await supabase
      .from('themes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', themeId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Delete a theme (soft delete by setting is_active to false)
   * Hard delete if no users are using it
   */
  async deleteTheme(themeId: string): Promise<void> {
    // Check if any users are using this theme
    const { data: usersUsingTheme, error: checkError } = await supabase
      .from('user_theme_selections')
      .select('user_id')
      .eq('theme_id', themeId)
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (usersUsingTheme && usersUsingTheme.length > 0) {
      // Soft delete - deactivate instead
      await this.updateTheme(themeId, { is_active: false });
    } else {
      // Hard delete - no users are using it
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId);

      if (error) {
        throw error;
      }
    }
  },
};

export const userThemeSelectionsStorage = {
  /**
   * Get user's theme selection
   */
  async getUserThemeSelection(userId: string): Promise<UserThemeSelection | null> {
    const { data, error } = await supabase
      .from('user_theme_selections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data;
  },

  /**
   * Create or update user's theme selection
   */
  async upsertUserThemeSelection(
    userId: string,
    themeId: string,
    themeMode: 'light' | 'dark'
  ): Promise<UserThemeSelection> {
    const id = `user_theme_sel_${userId}`;

    const { data, error } = await supabase
      .from('user_theme_selections')
      .upsert({
        id,
        user_id: userId,
        theme_id: themeId,
        theme_mode: themeMode,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Update only the theme mode (light/dark) for a user
   */
  async updateUserThemeMode(userId: string, themeMode: 'light' | 'dark'): Promise<UserThemeSelection> {
    const { data, error } = await supabase
      .from('user_theme_selections')
      .update({
        theme_mode: themeMode,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },
};







