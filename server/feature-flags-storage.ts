import { supabase } from './minimal-supabase';

/**
 * Feature Flags Storage
 * Manages feature flags with hierarchical scoping (global, corporate client, program)
 */

export interface FeatureFlagData {
  id?: string;
  flag_name: string;
  is_enabled: boolean;
  description?: string | null;
  program_id?: string | null;
  corporate_client_id?: string | null;
}

export interface FeatureFlag extends FeatureFlagData {
  created_at: string;
  updated_at: string;
}

export const featureFlagsStorage = {
  /**
   * Get feature flags for a specific hierarchy level
   * Returns flags in order: global → corporate → program (most specific wins)
   */
  async getFeatureFlags(
    level: 'corporate' | 'program' | 'location' = 'corporate',
    corporateClientId?: string,
    programId?: string
  ): Promise<FeatureFlag[]> {
    const flags: FeatureFlag[] = [];

    // 1. Get global flags (no program_id or corporate_client_id)
    const { data: globalFlags, error: globalError } = await supabase
      .from('feature_flags')
      .select('*')
      .is('program_id', null)
      .is('corporate_client_id', null)
      .order('flag_name', { ascending: true });

    if (!globalError && globalFlags) {
      flags.push(...(globalFlags as FeatureFlag[]));
    }

    // 2. Get corporate client flags (if at corporate or program level)
    if (level !== 'location' && corporateClientId) {
      const { data: corporateFlags, error: corporateError } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .is('program_id', null)
        .order('flag_name', { ascending: true });

      if (!corporateError && corporateFlags) {
        // Merge with global flags (corporate flags override global)
        corporateFlags.forEach((corporateFlag) => {
          const existingIndex = flags.findIndex(f => f.flag_name === corporateFlag.flag_name);
          if (existingIndex >= 0) {
            flags[existingIndex] = corporateFlag as FeatureFlag;
          } else {
            flags.push(corporateFlag as FeatureFlag);
          }
        });
      }
    }

    // 3. Get program flags (if at program level)
    if (level === 'program' && programId) {
      const { data: programFlags, error: programError } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('program_id', programId)
        .order('flag_name', { ascending: true });

      if (!programError && programFlags) {
        // Merge with existing flags (program flags override corporate/global)
        programFlags.forEach((programFlag) => {
          const existingIndex = flags.findIndex(f => f.flag_name === programFlag.flag_name);
          if (existingIndex >= 0) {
            flags[existingIndex] = programFlag as FeatureFlag;
          } else {
            flags.push(programFlag as FeatureFlag);
          }
        });
      }
    }

    return flags;
  },

  /**
   * Get a specific feature flag by name and scope
   */
  async getFeatureFlag(
    flagName: string,
    corporateClientId?: string,
    programId?: string
  ): Promise<FeatureFlag | null> {
    // Check program-specific first (most specific)
    if (programId) {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('flag_name', flagName)
        .eq('program_id', programId)
        .maybeSingle();

      if (!error && data) {
        return data as FeatureFlag;
      }
    }

    // Check corporate client-specific
    if (corporateClientId) {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('flag_name', flagName)
        .eq('corporate_client_id', corporateClientId)
        .is('program_id', null)
        .maybeSingle();

      if (!error && data) {
        return data as FeatureFlag;
      }
    }

    // Check global
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_name', flagName)
      .is('program_id', null)
      .is('corporate_client_id', null)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as FeatureFlag;
  },

  /**
   * Check if a feature flag is enabled
   * Returns the most specific flag's enabled status
   */
  async isFeatureEnabled(
    flagName: string,
    corporateClientId?: string,
    programId?: string
  ): Promise<boolean> {
    const flag = await this.getFeatureFlag(flagName, corporateClientId, programId);
    return flag?.is_enabled ?? false;
  },

  /**
   * Create a new feature flag
   */
  async createFeatureFlag(data: FeatureFlagData): Promise<FeatureFlag> {
    try {
      const { data: flag, error } = await supabase
        .from('feature_flags')
        .insert({
          flag_name: data.flag_name,
          is_enabled: data.is_enabled,
          description: data.description || null,
          program_id: data.program_id || null,
          corporate_client_id: data.corporate_client_id || null,
        })
        .select()
        .single();

      if (error) {
        // Preserve error code for duplicate detection
        const dbError: any = new Error(`Failed to create feature flag: ${error.message}`);
        dbError.code = error.code;
        dbError.details = error.details;
        dbError.hint = error.hint;
        throw dbError;
      }

      if (!flag) {
        throw new Error('Feature flag was not created (no data returned)');
      }

      return flag as FeatureFlag;
    } catch (error: any) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        const migrationError: any = new Error('feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql');
        migrationError.code = 'MIGRATION_REQUIRED';
        throw migrationError;
      }
      throw error;
    }
  },

  /**
   * Update a feature flag
   */
  async updateFeatureFlag(
    flagId: string,
    updates: Partial<FeatureFlagData>
  ): Promise<FeatureFlag> {
    const { data: flag, error } = await supabase
      .from('feature_flags')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flagId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update feature flag: ${error.message}`);
    }

    return flag as FeatureFlag;
  },

  /**
   * Toggle a feature flag's enabled status
   */
  async toggleFeatureFlag(flagId: string, isEnabled: boolean): Promise<FeatureFlag> {
    return this.updateFeatureFlag(flagId, { is_enabled: isEnabled });
  },

  /**
   * Delete a feature flag
   */
  async deleteFeatureFlag(flagId: string): Promise<void> {
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', flagId);

    if (error) {
      throw new Error(`Failed to delete feature flag: ${error.message}`);
    }
  },

  /**
   * Get all feature flags (admin only - for management UI)
   * Returns all flags at the specified hierarchy level
   */
  async getAllFeatureFlags(
    level: 'corporate' | 'program' | 'location' = 'corporate',
    corporateClientId?: string,
    programId?: string
  ): Promise<FeatureFlag[]> {
    let query = supabase
      .from('feature_flags')
      .select('*')
      .order('flag_name', { ascending: true });

    // Filter by hierarchy level
    if (level === 'program' && programId) {
      query = query.or(`program_id.eq.${programId},program_id.is.null`);
    } else if (level === 'corporate' && corporateClientId) {
      query = query.or(`corporate_client_id.eq.${corporateClientId},corporate_client_id.is.null`);
    } else {
      // Global flags only
      query = query.is('program_id', null).is('corporate_client_id', null);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        const migrationError = new Error('feature_flags table does not exist. Please run migration: migrations/0032_create_feature_flags_table.sql');
        (migrationError as any).code = 'MIGRATION_REQUIRED';
        throw migrationError;
      }
      throw new Error(`Failed to get feature flags: ${error.message}`);
    }

    return (data || []) as FeatureFlag[];
  },
};

