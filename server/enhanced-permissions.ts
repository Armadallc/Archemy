// Enhanced Permission System with Database Support
import { supabase } from './db';
import { PERMISSIONS, Permission, hasPermission as staticHasPermission } from './permissions';

export interface DatabasePermission {
  role: string;
  permission: string;
  resource: string;
  organization_id?: string;
}

export interface FeatureFlag {
  flag_name: string;
  is_enabled: boolean;
  organization_id?: string;
}

// Cache for permissions and feature flags
let permissionCache: Map<string, DatabasePermission[]> = new Map();
let featureFlagCache: Map<string, boolean> = new Map();
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function refreshCache() {
  if (Date.now() < cacheExpiry) return;

  try {
    // Fetch permissions from database
    const { data: permissions } = await supabase
      .from('role_permissions')
      .select('*');

    if (permissions) {
      permissionCache.clear();
      permissions.forEach((perm: DatabasePermission) => {
        const key = `${perm.role}:${perm.organization_id || 'global'}`;
        if (!permissionCache.has(key)) {
          permissionCache.set(key, []);
        }
        permissionCache.get(key)!.push(perm);
      });
    }

    // Fetch feature flags
    const { data: flags } = await supabase
      .from('feature_flags')
      .select('*');

    if (flags) {
      featureFlagCache.clear();
      flags.forEach((flag: FeatureFlag) => {
        const key = flag.organization_id ? `${flag.flag_name}:${flag.organization_id}` : flag.flag_name;
        featureFlagCache.set(key, flag.is_enabled);
      });
    }

    cacheExpiry = Date.now() + CACHE_DURATION;
  } catch (error) {
    console.error('Error refreshing permission cache:', error);
    // Fall back to static permissions if database is unavailable
  }
}

// Enhanced permission checking with database support
export async function hasEnhancedPermission(
  userRole: string,
  permission: Permission,
  organizationId?: string
): Promise<boolean> {
  // Check if enhanced permissions are enabled
  const enhancedEnabled = await isFeatureEnabled('enhanced_permissions', organizationId);
  
  if (!enhancedEnabled) {
    // Fall back to static permission checking
    return staticHasPermission(userRole, permission);
  }

  await refreshCache();

  // Check organization-specific permissions first
  if (organizationId) {
    const orgKey = `${userRole}:${organizationId}`;
    const orgPermissions = permissionCache.get(orgKey) || [];
    
    if (orgPermissions.some(p => p.permission === permission)) {
      return true;
    }
  }

  // Check global permissions
  const globalKey = `${userRole}:global`;
  const globalPermissions = permissionCache.get(globalKey) || [];
  
  if (globalPermissions.some(p => p.permission === permission)) {
    return true;
  }

  // Check inherited permissions through role hierarchy
  const inheritedPermissions = await getInheritedPermissions(userRole, organizationId);
  return inheritedPermissions.some(p => p.permission === permission);
}

// Get inherited permissions through role hierarchy
async function getInheritedPermissions(
  userRole: string,
  organizationId?: string
): Promise<DatabasePermission[]> {
  try {
    const { data: effectivePermissions } = await supabase
      .from('effective_permissions')
      .select('*')
      .eq('role', userRole)
      .or(`organization_id.is.null,organization_id.eq.${organizationId || 'null'}`);

    return effectivePermissions || [];
  } catch (error) {
    console.error('Error fetching inherited permissions:', error);
    return [];
  }
}

// Feature flag checking
export async function isFeatureEnabled(
  flagName: string,
  organizationId?: string
): Promise<boolean> {
  await refreshCache();

  // Check organization-specific flag first
  if (organizationId) {
    const orgKey = `${flagName}:${organizationId}`;
    if (featureFlagCache.has(orgKey)) {
      return featureFlagCache.get(orgKey)!;
    }
  }

  // Check global flag
  return featureFlagCache.get(flagName) || false;
}

// Enhanced middleware for permission checking
export function requireEnhancedPermission(permission: Permission, resource?: string) {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const organizationId = req.params.organizationId || req.currentOrganizationId;
    const hasAccess = await hasEnhancedPermission(req.user.role, permission, organizationId);

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        requiredPermission: permission,
        userRole: req.user.role,
        resource: resource || 'unknown'
      });
    }

    next();
  };
}

// Permission management functions
export async function grantPermission(
  role: string,
  permission: string,
  resource: string,
  organizationId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('role_permissions')
      .insert({
        role,
        permission,
        resource,
        organization_id: organizationId
      });

    if (!error) {
      // Clear cache to force refresh
      cacheExpiry = 0;
      return true;
    }
    
    console.error('Error granting permission:', error);
    return false;
  } catch (error) {
    console.error('Error granting permission:', error);
    return false;
  }
}

export async function revokePermission(
  role: string,
  permission: string,
  resource: string,
  organizationId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role', role)
      .eq('permission', permission)
      .eq('resource', resource)
      .eq('organization_id', organizationId || null);

    if (!error) {
      // Clear cache to force refresh
      cacheExpiry = 0;
      return true;
    }
    
    console.error('Error revoking permission:', error);
    return false;
  } catch (error) {
    console.error('Error revoking permission:', error);
    return false;
  }
}

// Toggle feature flag
export async function toggleFeatureFlag(
  flagName: string,
  enabled: boolean,
  organizationId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .upsert({
        flag_name: flagName,
        is_enabled: enabled,
        organization_id: organizationId,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      // Clear cache to force refresh
      cacheExpiry = 0;
      return true;
    }
    
    console.error('Error toggling feature flag:', error);
    return false;
  } catch (error) {
    console.error('Error toggling feature flag:', error);
    return false;
  }
}

// Get all permissions for a role
export async function getRolePermissions(
  role: string,
  organizationId?: string
): Promise<DatabasePermission[]> {
  await refreshCache();
  
  const orgKey = organizationId ? `${role}:${organizationId}` : `${role}:global`;
  const orgPermissions = permissionCache.get(orgKey) || [];
  
  // Also get inherited permissions
  const inheritedPermissions = await getInheritedPermissions(role, organizationId);
  
  // Combine and deduplicate
  const allPermissions = [...orgPermissions, ...inheritedPermissions];
  const uniquePermissions = allPermissions.filter((perm, index, self) => 
    index === self.findIndex(p => p.permission === perm.permission && p.resource === perm.resource)
  );
  
  return uniquePermissions;
}

// Get user's effective permissions
export async function getUserEffectivePermissions(
  userRole: string,
  primaryOrgId: string,
  authorizedOrgIds: string[]
): Promise<{ [orgId: string]: DatabasePermission[] }> {
  const result: { [orgId: string]: DatabasePermission[] } = {};
  
  // Get permissions for primary organization
  result[primaryOrgId] = await getRolePermissions(userRole, primaryOrgId);
  
  // Get permissions for authorized organizations
  for (const orgId of authorizedOrgIds) {
    if (orgId !== primaryOrgId) {
      result[orgId] = await getRolePermissions(userRole, orgId);
    }
  }
  
  // Get global permissions
  result['global'] = await getRolePermissions(userRole);
  
  return result;
}