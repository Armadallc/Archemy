import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useEffectivePermissions } from './use-permissions';
import { useToast } from './use-toast';

interface UsePageAccessOptions {
  /**
   * Required permission(s) to access the page
   * Can be a single permission string or array (OR logic)
   */
  permission: string | string[];
  /**
   * Redirect path if user doesn't have permission
   * @default "/"
   */
  redirectTo?: string;
  /**
   * Show toast notification when access is denied
   * @default true
   */
  showToast?: boolean;
  /**
   * Custom access denied message
   */
  accessDeniedMessage?: string;
}

/**
 * Hook to check page-level access permissions and redirect if unauthorized
 * 
 * @example
 * // Single permission
 * usePageAccess({ permission: "view_trips" });
 * 
 * @example
 * // Multiple permissions (OR logic - user needs at least one)
 * usePageAccess({ 
 *   permission: ["view_trips", "manage_trips"],
 *   redirectTo: "/dashboard"
 * });
 * 
 * @example
 * // Custom message
 * usePageAccess({
 *   permission: "manage_users",
 *   accessDeniedMessage: "You need admin access to view this page."
 * });
 */
export function usePageAccess({
  permission,
  redirectTo = "/",
  showToast = true,
  accessDeniedMessage
}: UsePageAccessOptions) {
  const [, setLocation] = useLocation();
  const { hasPermission, hasAnyPermission, isLoading } = useEffectivePermissions();
  const { toast } = useToast();

  useEffect(() => {
    // Don't check while permissions are loading
    if (isLoading) {
      return;
    }

    // Check if user has permission
    let hasAccess = false;
    if (Array.isArray(permission)) {
      hasAccess = hasAnyPermission(permission);
    } else {
      hasAccess = hasPermission(permission);
    }

    // Redirect if no access
    if (!hasAccess) {
      if (showToast) {
        toast({
          title: "Access Denied",
          description: accessDeniedMessage || `You don't have permission to access this page.`,
          variant: "destructive"
        });
      }
      setLocation(redirectTo);
    }
  }, [permission, redirectTo, showToast, accessDeniedMessage, hasPermission, hasAnyPermission, isLoading, setLocation, toast]);

  return {
    hasAccess: isLoading ? true : (Array.isArray(permission) ? hasAnyPermission(permission) : hasPermission(permission)),
    isLoading
  };
}

