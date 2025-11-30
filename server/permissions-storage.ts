import { supabase } from './minimal-supabase';
import { RolePermission } from '../shared/schema';

/**
 * Permissions Storage
 * Manages role-based permissions with hierarchical scoping
 */

export interface PermissionData {
  id?: string;
  role: string;
  permission: string;
  resource: string;
  program_id?: string | null;
  corporate_client_id?: string | null;
}

export interface EffectivePermission extends RolePermission {
  // Additional fields for effective permissions
  source?: 'global' | 'corporate' | 'program';
}

export const permissionsStorage = {
  /**
   * Get effective permissions for a user
   * Checks permissions at multiple hierarchy levels (program, corporate, global)
   */
  async getEffectivePermissions(
    userId: string,
    level: 'corporate' | 'program' | 'location' = 'corporate',
    corporateClientId?: string,
    programId?: string
  ): Promise<EffectivePermission[]> {
    // First, get the user's role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, corporate_client_id, primary_program_id')
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    const userRole = user.role;

    // Build query to get permissions at different hierarchy levels
    let query = supabase
      .from('role_permissions')
      .select('*')
      .eq('role', userRole);

    // Apply hierarchy filtering
    if (level === 'program' && programId) {
      // Get program-specific permissions OR global permissions
      query = query.or(`program_id.eq.${programId},program_id.is.null`);
    } else if (level === 'corporate' && corporateClientId) {
      // Get corporate-specific permissions OR global permissions
      query = query.or(`corporate_client_id.eq.${corporateClientId},corporate_client_id.is.null`);
    } else {
      // Get only global permissions
      query = query.is('program_id', null).is('corporate_client_id', null);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist, throw a helpful error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        const migrationError = new Error('role_permissions table does not exist. Please run migrations: migrations/0029_create_role_permissions_table.sql and migrations/0030_populate_role_permissions_from_hardcoded.sql');
        (migrationError as any).code = 'MIGRATION_REQUIRED';
        throw migrationError;
      }
      throw error;
    }

    // Add source information
    return (data || []).map(perm => ({
      ...perm,
      source: perm.program_id ? 'program' : perm.corporate_client_id ? 'corporate' : 'global',
    })) as EffectivePermission[];
  },

  /**
   * Get all permissions for a hierarchy level (admin only)
   */
  async getAllPermissions(
    level: 'corporate' | 'program' | 'location' = 'corporate',
    corporateClientId?: string,
    programId?: string
  ): Promise<RolePermission[]> {
    let query = supabase
      .from('role_permissions')
      .select('*');

    // Apply hierarchy filtering
    if (level === 'program' && programId) {
      query = query.or(`program_id.eq.${programId},program_id.is.null`);
    } else if (level === 'corporate' && corporateClientId) {
      query = query.or(`corporate_client_id.eq.${corporateClientId},corporate_client_id.is.null`);
    } else {
      query = query.is('program_id', null).is('corporate_client_id', null);
    }

    const { data, error } = await query.order('role', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        const migrationError = new Error('role_permissions table does not exist. Please run migrations: migrations/0029_create_role_permissions_table.sql and migrations/0030_populate_role_permissions_from_hardcoded.sql');
        (migrationError as any).code = 'MIGRATION_REQUIRED';
        throw migrationError;
      }
      throw error;
    }

    return data || [];
  },

  /**
   * Grant a permission to a role
   */
  async grantPermission(permissionData: PermissionData): Promise<RolePermission> {
    const { data, error } = await supabase
      .from('role_permissions')
      .insert({
        role: permissionData.role,
        permission: permissionData.permission,
        resource: permissionData.resource || '*',
        program_id: permissionData.program_id || null,
        corporate_client_id: permissionData.corporate_client_id || null,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (permission already exists)
      if (error.code === '23505') {
        throw new Error('Permission already exists for this role and resource');
      }
      throw error;
    }

    return data;
  },

  /**
   * Revoke a permission (delete by ID)
   */
  async revokePermission(permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('id', permissionId);

    if (error) {
      throw error;
    }
  },

  /**
   * Check if a user has a specific permission
   */
  async checkPermission(
    userId: string,
    permission: string,
    resource: string = '*',
    programId?: string,
    corporateClientId?: string
  ): Promise<boolean> {
    // Get user's role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      return false;
    }

    // Build query to check permission at different hierarchy levels
    let query = supabase
      .from('role_permissions')
      .select('id')
      .eq('role', user.role)
      .eq('permission', permission)
      .eq('resource', resource);

    // Check hierarchy levels (most specific first)
    if (programId) {
      query = query.or(`program_id.eq.${programId},program_id.is.null`);
    } else if (corporateClientId) {
      query = query.or(`corporate_client_id.eq.${corporateClientId},corporate_client_id.is.null`);
    } else {
      query = query.is('program_id', null).is('corporate_client_id', null);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      // If table doesn't exist, fall back to hardcoded permissions
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return false; // Will fall back to hardcoded check
      }
      throw error;
    }

    return (data?.length || 0) > 0;
  },
};

