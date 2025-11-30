import React from 'react';
import { useEffectivePermissions } from '../hooks/use-permissions';

interface PermissionGuardProps {
  /**
   * Single permission required to show children
   */
  permission?: string;
  /**
   * Array of permissions - user must have at least one (OR logic)
   */
  anyPermission?: string[];
  /**
   * Array of permissions - user must have all (AND logic)
   */
  allPermissions?: string[];
  /**
   * What to render if user doesn't have permission
   * @default null (render nothing)
   */
  fallback?: React.ReactNode;
  /**
   * What to render while permissions are loading
   * @default null (render nothing)
   */
  loadingFallback?: React.ReactNode;
  /**
   * Children to render if user has permission
   */
  children: React.ReactNode;
}

/**
 * PermissionGuard component - conditionally renders children based on user permissions
 * 
 * @example
 * // Single permission
 * <PermissionGuard permission="manage_trips">
 *   <Button>Create Trip</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Any permission (OR logic)
 * <PermissionGuard anyPermission={["manage_trips", "create_trips"]}>
 *   <Button>Create Trip</Button>
 * </PermissionGuard>
 * 
 * @example
 * // All permissions (AND logic)
 * <PermissionGuard allPermissions={["view_trips", "create_trips"]}>
 *   <Button>Create Trip</Button>
 * </PermissionGuard>
 * 
 * @example
 * // With fallback
 * <PermissionGuard 
 *   permission="manage_trips"
 *   fallback={<div>You don't have permission</div>}
 * >
 *   <Button>Create Trip</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
  loadingFallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useEffectivePermissions();

  // Show loading fallback while permissions are loading
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  // Check permissions based on which prop is provided
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(anyPermission);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions);
  } else {
    // If no permission props provided, show children (backward compatibility)
    hasAccess = true;
  }

  // Render children if user has access, otherwise render fallback
  return <>{hasAccess ? children : fallback}</>;
}

