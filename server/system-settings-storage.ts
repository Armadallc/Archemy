import { supabase } from './minimal-supabase';
import { SystemSettings } from '../shared/schema';

/**
 * System Settings Storage
 * Manages application-wide system settings (single row in database)
 */

export interface SystemSettingsData {
  id?: string;
  app_name: string;
  main_logo_url?: string | null;
  support_email: string;
  support_phone: string;
  timezone: string;
  language: string;
}

export const systemSettingsStorage = {
  /**
   * Get current system settings
   * Since there's only one row (id='system'), this always returns that row
   */
  async getSystemSettings(): Promise<SystemSettings | null> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'system')
      .single();

    if (error) {
      // If table doesn't exist, throw a helpful error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        const migrationError = new Error('system_settings table does not exist. Please run migration: migrations/0028_create_system_settings_table.sql');
        (migrationError as any).code = 'MIGRATION_REQUIRED';
        throw migrationError;
      }
      // If no row exists, return null (will be initialized on first update)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  },

  /**
   * Update system settings
   * Uses upsert to create if doesn't exist, update if it does
   */
  async updateSystemSettings(settings: Partial<SystemSettingsData>): Promise<SystemSettings> {
    // Ensure id is set to 'system'
    const updateData = {
      ...settings,
      id: 'system',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('system_settings')
      .upsert(updateData, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Initialize default system settings if none exist
   */
  async initializeDefaultSettings(): Promise<SystemSettings> {
    const defaultSettings: SystemSettingsData = {
      id: 'system',
      app_name: 'HALCYON Transportation Management',
      main_logo_url: null,
      support_email: 'support@halcyon.com',
      support_phone: '+1 (555) 123-4567',
      timezone: 'America/New_York',
      language: 'en',
    };

    return this.updateSystemSettings(defaultSettings);
  },
};

