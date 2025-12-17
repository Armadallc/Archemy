/**
 * Authorization Service - Hybrid RBAC Support
 * 
 * This service provides permission checking that supports both:
 * - System roles (enum-based): super_admin, corporate_admin, etc.
 * - Tenant roles (custom roles created by Corporate Admins)
 * 
 * The service combines permissions from both sources and deduplicates them.
 */

import { supabase } from '../minimal-supabase';
import type { RoleType } from '../../shared/schema';

export interface UserPermissions {
  permissions: string[];
  effectiveRole: string;
  roleType: 'system' | 'tenant';
  isTenantRole: boolean;
  tenantRoleName?: string;
}

/**
 * Get all permissions for a user in a specific corporate client context
 * Combines system role permissions with tenant role permissions (if applicable)
 * 
 * @param userId - The user's ID
 * @param corporateClientId - The corporate client context (required for tenant roles)
 * @param resource - Optional resource scope (default: '*')
 * @returns Array of permission strings the user has
 */
export async function getUserPermissions(
  userId: string,
  corporateClientId?: string | null,
  resource: string = '*'
): Promise<string[]> {
  try {
    const userPerms = await getUserPermissionsWithMetadata(userId, corporateClientId, resource);
    return userPerms.permissions;
  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    return [];
  }
}

/**
 * Get user permissions with full metadata including role information
 * 
 * @param userId - The user's ID
 * @param corporateClientId - The corporate client context
 * @param resource - Optional resource scope
 * @returns UserPermissions object with permissions array and role metadata
 */
export async function getUserPermissionsWithMetadata(
  userId: string,
  corporateClientId?: string | null,
  resource: string = '*'
): Promise<UserPermissions> {
  try {
    // Step 1: Get user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, tenant_role_id, corporate_client_id, active_tenant_id')
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return {
        permissions: [],
        effectiveRole: 'unknown',
        roleType: 'system',
        isTenantRole: false,
      };
    }

    // Step 2: Determine which role to use
    let effectiveRole: string = user.role;
    let roleType: RoleType = 'system';
    let isTenantRole = false;
    let tenantRoleName: string | undefined;

    // Super admins always use system role
    if (user.role === 'super_admin') {
      effectiveRole = 'super_admin';
      roleType = 'system';
    }
    // If user has tenant_role_id and we're in the correct corporate client context
    else if (user.tenant_role_id && corporateClientId) {
      // Verify the tenant role belongs to the requested corporate client
      const { data: tenantRole } = await supabase
        .from('tenant_roles')
        .select('id, name, corporate_client_id, is_active')
        .eq('id', user.tenant_role_id)
        .eq('corporate_client_id', corporateClientId)
        .eq('is_active', true)
        .single();

      if (tenantRole) {
        effectiveRole = user.tenant_role_id;
        roleType = 'tenant';
        isTenantRole = true;
        tenantRoleName = tenantRole.name;
      } else {
        // Fall back to system role if tenant role not found or inactive
        effectiveRole = user.role;
        roleType = 'system';
      }
    }
    // Fall back to system role
    else {
      effectiveRole = user.role;
      roleType = 'system';
    }

    // Step 3: Fetch permissions based on role type
    let permissions: string[] = [];

    if (roleType === 'system') {
      // Query role_permissions for system role
      let query = supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', effectiveRole)
        .eq('role_type', 'system')
        .eq('resource', resource);

      // Filter by corporate_client_id if provided
      if (corporateClientId) {
        query = query.or(`corporate_client_id.is.null,corporate_client_id.eq.${corporateClientId}`);
      } else {
        query = query.is('corporate_client_id', null);
      }

      const { data: rolePerms, error: permError } = await query;

      if (permError) {
        console.error('Error fetching system role permissions:', permError);
        // Fall back to empty array, not throw
        permissions = [];
      } else {
        permissions = (rolePerms || []).map(p => p.permission);
      }
    } else {
      // Query role_permissions for tenant role
      let query = supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', effectiveRole)
        .eq('role_type', 'tenant')
        .eq('resource', resource);

      // Filter by corporate_client_id if provided
      if (corporateClientId) {
        query = query.or(`corporate_client_id.is.null,corporate_client_id.eq.${corporateClientId}`);
      } else {
        query = query.is('corporate_client_id', null);
      }

      const { data: tenantPerms, error: tenantPermError } = await query;

      if (tenantPermError) {
        console.error('Error fetching tenant role permissions:', tenantPermError);
        // Fall back to empty array
        permissions = [];
      } else {
        permissions = (tenantPerms || []).map(p => p.permission);
      }
    }

    // Step 4: Also get system role permissions as fallback (for hybrid approach)
    // This allows tenant roles to inherit from system roles if needed
    if (roleType === 'tenant' && user.role !== 'super_admin') {
      let fallbackQuery = supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', user.role)
        .eq('role_type', 'system')
        .eq('resource', resource);

      if (corporateClientId) {
        fallbackQuery = fallbackQuery.or(`corporate_client_id.is.null,corporate_client_id.eq.${corporateClientId}`);
      } else {
        fallbackQuery = fallbackQuery.is('corporate_client_id', null);
      }

      const { data: fallbackPerms } = await fallbackQuery;
      if (fallbackPerms) {
        // Merge and deduplicate
        const fallbackPermissions = fallbackPerms.map(p => p.permission);
        permissions = Array.from(new Set([...permissions, ...fallbackPermissions]));
      }
    }

    // Step 5: Deduplicate and return
    return {
      permissions: Array.from(new Set(permissions)),
      effectiveRole,
      roleType,
      isTenantRole,
      tenantRoleName,
    };
  } catch (error) {
    console.error('Error in getUserPermissionsWithMetadata:', error);
    return {
      permissions: [],
      effectiveRole: 'unknown',
      roleType: 'system',
      isTenantRole: false,
    };
  }
}

/**
 * Check if a user has a specific permission
 * 
 * @param userId - The user's ID
 * @param permission - The permission to check (e.g., 'manage_users')
 * @param corporateClientId - The corporate client context
 * @param resource - Optional resource scope (default: '*')
 * @returns true if user has the permission
 */
export async function hasPermission(
  userId: string,
  permission: string,
  corporateClientId?: string | null,
  resource: string = '*'
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId, corporateClientId, resource);
    return permissions.includes(permission);
  } catch (error) {
    console.error('Error in hasPermission:', error);
    return false;
  }
}

/**
 * Get user's effective role information
 * 
 * @param userId - The user's ID
 * @param corporateClientId - The corporate client context
 * @returns Object with role information
 */
export async function getEffectiveRoleName(
  userId: string,
  corporateClientId?: string | null
): Promise<{
  role: string;
  roleType: 'system' | 'tenant';
  isTenantRole: boolean;
  tenantRoleName?: string;
  systemRole: string;
}> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role, tenant_role_id, corporate_client_id')
      .eq('user_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Super admin always uses system role
    if (user.role === 'super_admin') {
      return {
        role: 'super_admin',
        roleType: 'system',
        isTenantRole: false,
        systemRole: 'super_admin',
      };
    }

    // Check if user has active tenant role in this corporate client
    if (user.tenant_role_id && corporateClientId) {
      const { data: tenantRole } = await supabase
        .from('tenant_roles')
        .select('id, name, corporate_client_id, is_active')
        .eq('id', user.tenant_role_id)
        .eq('corporate_client_id', corporateClientId)
        .eq('is_active', true)
        .single();

      if (tenantRole) {
        return {
          role: tenantRole.id,
          roleType: 'tenant',
          isTenantRole: true,
          tenantRoleName: tenantRole.name,
          systemRole: user.role,
        };
      }
    }

    // Fall back to system role
    return {
      role: user.role,
      roleType: 'system',
      isTenantRole: false,
      systemRole: user.role,
    };
  } catch (error) {
    console.error('Error in getEffectiveRoleName:', error);
    throw error;
  }
}
