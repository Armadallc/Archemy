import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { useHierarchy } from '../hooks/useHierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { SwitchWithIcons } from '../components/ui/switch-with-icons';
import { Shield, Users, Flag, Key, Settings, Check, X, Plus, Minus, Building2, MapPin, Car, Calendar, Bell, BarChart3, Smartphone, Webhook } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface Permission {
  id: string;
  role: string;
  permission: string;
  resource: string;
  program_id?: string;
  corporate_client_id?: string;
}

interface RoleTemplate {
  role: string;
  name: string;
  description: string;
  color: string;
  level: number;
  permissions: Permission[];
  userCount: number;
}

interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  description?: string;
  program_id?: string;
  corporate_client_id?: string;
}

// Permission categories for organization
interface PermissionCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  permissions: readonly string[];
}

// All available permissions in the system, organized by category
const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'corporate_clients',
    name: 'Corporate Clients',
    icon: <Building2 className="w-4 h-4" />,
    permissions: [
      'manage_corporate_clients',
      'view_corporate_clients',
    ] as const,
  },
  {
    id: 'programs',
    name: 'Programs',
    icon: <Flag className="w-4 h-4" />,
    permissions: [
      'manage_programs',
      'view_programs',
    ] as const,
  },
  {
    id: 'locations',
    name: 'Locations',
    icon: <MapPin className="w-4 h-4" />,
    permissions: [
      'manage_locations',
      'view_locations',
    ] as const,
  },
  {
    id: 'users',
    name: 'Users',
    icon: <Users className="w-4 h-4" />,
    permissions: [
      'manage_users',
      'view_users',
    ] as const,
  },
  {
    id: 'clients',
    name: 'Clients',
    icon: <Users className="w-4 h-4" />,
    permissions: [
      'manage_clients',
      'view_clients',
    ] as const,
  },
  {
    id: 'client_groups',
    name: 'Client Groups',
    icon: <Users className="w-4 h-4" />,
    permissions: [
      'manage_client_groups',
      'view_client_groups',
    ] as const,
  },
  {
    id: 'drivers',
    name: 'Drivers',
    icon: <Users className="w-4 h-4" />,
    permissions: [
      'manage_drivers',
      'view_drivers',
    ] as const,
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: <Car className="w-4 h-4" />,
    permissions: [
      'manage_vehicles',
      'view_vehicles',
    ] as const,
  },
  {
    id: 'trips',
    name: 'Trips',
    icon: <Flag className="w-4 h-4" />,
    permissions: [
      'manage_trips',
      'view_trips',
      'create_trips',
      'update_trip_status',
      'manage_trip_categories',
      'view_trip_categories',
    ] as const,
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: <Bell className="w-4 h-4" />,
    permissions: [
      'manage_notifications',
      'view_notifications',
    ] as const,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: <Calendar className="w-4 h-4" />,
    permissions: [
      'manage_calendar',
      'view_calendar',
    ] as const,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    icon: <Webhook className="w-4 h-4" />,
    permissions: [
      'manage_webhooks',
      'view_webhooks',
    ] as const,
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    permissions: [
      'view_reports',
      'view_analytics',
    ] as const,
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    icon: <Smartphone className="w-4 h-4" />,
    permissions: [
      'mobile_app_access',
      'location_tracking',
    ] as const,
  },
  {
    id: 'cross_corporate',
    name: 'Cross-Corporate',
    icon: <Building2 className="w-4 h-4" />,
    permissions: [
      'view_clients_cross_corporate',
      'manage_clients_cross_corporate',
      'create_trips_cross_corporate',
      'view_programs_cross_corporate',
    ] as const,
  },
];

// Flatten all permissions into a single array
const ALL_PERMISSIONS = PERMISSION_CATEGORIES.flatMap(cat => cat.permissions) as readonly string[];

// Role-based permission availability
// This defines which permissions CAN be assigned to each role (not what they have by default)
// Based on server/permissions.ts ROLE_PERMISSIONS mapping
//
// IMPORTANT: Permission Context Differences
// =========================================
// The same permission name can mean different things depending on the role:
//
// "manage_corporate_clients":
//   - super_admin: Can CREATE, UPDATE, DELETE corporate clients across the entire system
//   - corporate_admin: Can only UPDATE their OWN corporate client (settings, name, etc.)
//                      CANNOT create new corporate clients
//
// "manage_programs":
//   - super_admin: Can manage programs across ALL corporate clients
//   - corporate_admin: Can manage programs WITHIN their own corporate client only
//   - program_admin: Can manage settings WITHIN their own program only
//
// "manage_users":
//   - super_admin: Can manage users across the entire system
//   - corporate_admin: Can manage users within their corporate client
//   - program_admin: NO access (cannot manage users)
//
const ROLE_AVAILABLE_PERMISSIONS: Record<string, readonly string[]> = {
  super_admin: ALL_PERMISSIONS, // Super admin can have all permissions
  
  corporate_admin: [
    // Corporate admin can manage their own corporate client, but NOT create new ones
    'view_corporate_clients',
    // Note: manage_corporate_clients is NOT in server's default ROLE_PERMISSIONS for corporate_admin,
    // but migration 0031 adds it. When assigned, it means: can UPDATE their own corporate client
    // (settings, name, etc.), but CANNOT create new corporate clients (only super_admin can do that)
    'manage_corporate_clients',
    'manage_programs',
    'view_programs',
    'manage_locations',
    'view_locations',
    'manage_users',
    'view_users',
    'manage_clients',
    'view_clients',
    'manage_client_groups',
    'view_client_groups',
    'manage_drivers',
    'view_drivers',
    'manage_vehicles',
    'view_vehicles',
    'manage_trips',
    'view_trips',
    'create_trips',
    'update_trip_status',
    'manage_trip_categories',
    'view_trip_categories',
    'view_reports',
    'view_analytics',
    'mobile_app_access',
    'location_tracking',
    'manage_notifications',
    'view_notifications',
    'manage_calendar',
    'view_calendar',
    'manage_webhooks',
    'view_webhooks',
    // NO cross-corporate permissions
  ],
  
  program_admin: [
    // Program admin can only manage within their program
    'view_programs',
    'manage_locations',
    'view_locations',
    'view_users',
    'manage_clients',
    'view_clients',
    'manage_client_groups',
    'view_client_groups',
    'manage_drivers',
    'view_drivers',
    'manage_vehicles',
    'view_vehicles',
    'manage_trips',
    'view_trips',
    'create_trips',
    'update_trip_status',
    'manage_trip_categories',
    'view_trip_categories',
    'view_reports',
    'view_analytics',
    'mobile_app_access',
    'location_tracking',
    'manage_notifications',
    'view_notifications',
    'manage_calendar',
    'view_calendar',
    'view_webhooks',
    // NO corporate-level, cross-corporate, or user management permissions
  ],
  
  program_user: [
    // Program user has limited, mostly view-only permissions
    'view_programs',
    'view_locations',
    'view_clients',
    'view_client_groups',
    'view_drivers',
    'view_vehicles',
    'view_trips',
    'create_trips',
    'update_trip_status',
    'view_trip_categories',
    'mobile_app_access',
    'view_notifications',
    'view_calendar',
    // NO management permissions, NO reports/analytics, NO cross-corporate
  ],
  
  driver: [
    // Driver has minimal permissions - only what they need for their job
    'view_programs',
    'view_locations',
    'view_clients',
    'view_trips',
    'update_trip_status',
    'view_trip_categories',
    'mobile_app_access',
    'location_tracking',
    'view_notifications',
    'view_calendar',
    // NO management permissions, NO creation permissions (except update trip status)
  ],
};

/**
 * Get available permissions for a specific role
 * This filters permissions based on what makes sense for each role level
 */
const getAvailablePermissionsForRole = (role: string): readonly string[] => {
  return ROLE_AVAILABLE_PERMISSIONS[role] || [];
};

const ROLE_HIERARCHY = {
  super_admin: {
    name: 'Super Admin',
    description: 'Full system access across all corporate clients and programs',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    level: 0
  },
  corporate_admin: {
    name: 'Corporate Admin',
    description: 'Full access within corporate client and all its programs',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    level: 1
  },
  program_admin: {
    name: 'Program Admin',
    description: 'Full access within single program',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    level: 2
  },
  program_user: {
    name: 'Program User',
    description: 'Standard user access within program',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    level: 3
  },
  driver: {
    name: 'Driver',
    description: 'Driver-specific access to trips and schedules',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    level: 3
  }
};

export default function RoleTemplatesPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, getPageTitle } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [newFeatureFlag, setNewFeatureFlag] = useState({
    flagName: '',
    isEnabled: false,
    program_id: '',
    corporate_client_id: ''
  });

  // Fetch all role permissions (admin only)
  // Role templates are always global - fetch permissions with no program_id or corporate_client_id
  const { data: allPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/permissions/all'], // Always fetch global permissions for role templates
    queryFn: async () => {
      // Always use the global endpoint - role templates are not scoped to corporate clients or programs
      const response = await apiRequest("GET", '/api/permissions/all');
      const permissions = await response.json();
      
      // Log all permissions before filtering
      console.log(`🔍 [Role Templates] All permissions from API (before filtering):`, permissions);
      
      // Filter to only show global permissions (where program_id and corporate_client_id are null)
      const globalPermissions = permissions.filter((p: Permission) => !p.program_id && !p.corporate_client_id);
      
      // Log filtered permissions
      console.log(`🔍 [Role Templates] Global permissions (after filtering):`, globalPermissions);
      
      // Log driver permissions specifically
      const driverPerms = globalPermissions.filter((p: Permission) => p.role === 'driver');
      console.log(`🔍 [Role Templates] Driver permissions (global):`, driverPerms);
      
      // Also check if there are any driver permissions with program_id or corporate_client_id
      const driverPermsWithScope = permissions.filter((p: Permission) => p.role === 'driver' && (p.program_id || p.corporate_client_id));
      if (driverPermsWithScope.length > 0) {
        console.warn(`⚠️ [Role Templates] Found ${driverPermsWithScope.length} driver permissions with scope (will be filtered out):`, driverPermsWithScope);
      }
      
      return globalPermissions;
    },
    enabled: user?.role === 'super_admin' || user?.role === 'corporate_admin',
  });

  // Fetch users to count per role
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/users";
      
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/users/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/users/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: user?.role === 'super_admin' || user?.role === 'corporate_admin',
  });

  // Fetch programs for feature flag assignment (for super admins)
  const { data: programs } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/programs");
      return await response.json();
    },
    enabled: user?.role === 'super_admin',
  });

  // Fetch corporate clients for feature flag assignment (for super admins)
  const { data: corporateClients } = useQuery({
    queryKey: ["/api/corporate-clients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/corporate-clients");
      return await response.json();
    },
    enabled: user?.role === 'super_admin',
  });

  // Fetch feature flags
  const { data: featureFlags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ['/api/feature-flags', level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = '/api/feature-flags';
      
      // Build endpoint based on hierarchy level
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/feature-flags/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/feature-flags/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: user?.role === 'super_admin' || user?.role === 'program_admin',
  });

  // Group permissions by role and create role templates
  const roleTemplates = useMemo<RoleTemplate[]>(() => {
    const templates: RoleTemplate[] = [];
    const userCountsByRole: Record<string, number> = {};

    // Count users per role
    users.forEach((u: any) => {
      userCountsByRole[u.role] = (userCountsByRole[u.role] || 0) + 1;
    });

    // Create template for each role
    Object.entries(ROLE_HIERARCHY).forEach(([roleKey, roleInfo]) => {
      const rolePerms = allPermissions.filter((p: Permission) => p.role === roleKey);
      
      
      templates.push({
        role: roleKey,
        name: roleInfo.name,
        description: roleInfo.description,
        color: roleInfo.color,
        level: roleInfo.level,
        permissions: rolePerms,
        userCount: userCountsByRole[roleKey] || 0,
      });
    });

    return templates.sort((a, b) => a.level - b.level);
  }, [allPermissions, users]);

  const grantPermissionMutation = useMutation({
    mutationFn: async (data: { role: string; permission: string; resource: string; suppressToast?: boolean }) => {
      const { suppressToast, ...requestData } = data;
      return apiRequest("POST", '/api/permissions/grant', {
        ...requestData,
        // Role templates are always global - not scoped to specific corporate client or program
        program_id: null,
        corporate_client_id: null,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/all'] });
      // Only show toast if not suppressed (for individual permission grants)
      if (!variables.suppressToast) {
        toast({
          title: "Permission Added",
          description: "The permission has been added to the role template.",
        });
      }
    },
    onError: (error: any, variables) => {
      // Don't show toast for 409 errors (permission already exists) when suppressed
      const is409 = error.message?.includes('409:') || error.message?.includes('already exists');
      if (variables?.suppressToast && is409) {
        return; // Silently ignore expected conflicts
      }
      toast({
        title: "Failed to Add Permission",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const revokePermissionMutation = useMutation({
    mutationFn: async (data: { permissionId: string; suppressToast?: boolean } | string) => {
      // Handle both old format (string) and new format (object)
      const permissionId = typeof data === 'string' ? data : data.permissionId;
      return apiRequest("DELETE", `/api/permissions/${permissionId}`);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/all'] });
      // Only show toast if not suppressed (for individual permission revocations)
      const suppressToast = typeof variables === 'object' && variables.suppressToast;
      if (!suppressToast) {
        toast({
          title: "Permission Removed",
          description: "The permission has been removed from the role template.",
        });
      }
    },
    onError: (error: any, variables) => {
      // Don't show toast if suppressed (for bulk operations)
      const suppressToast = typeof variables === 'object' && variables.suppressToast;
      if (suppressToast) {
        return; // Silently ignore errors during bulk operations
      }
      toast({
        title: "Failed to Remove Permission",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const createFeatureFlagMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", '/api/feature-flags/create', data);
    },
    onSuccess: () => {
      // Invalidate the feature flags list query
      queryClient.invalidateQueries({ queryKey: ['/api/feature-flags'] });
      
      // Invalidate all feature flag check queries (for immediate UI update)
      queryClient.invalidateQueries({ queryKey: ['feature-flag'] });
      
      setNewFeatureFlag({ flagName: '', isEnabled: false, program_id: '', corporate_client_id: '' });
      toast({
        title: "Feature Flag Created",
        description: "The feature flag has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Feature Flag",
        description: error.message || "An error occurred while creating the feature flag.",
        variant: "destructive",
      });
    },
  });

  const toggleFeatureFlagMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", '/api/feature-flags/toggle', data);
    },
    onSuccess: (_, variables) => {
      // Invalidate the feature flags list query
      queryClient.invalidateQueries({ queryKey: ['/api/feature-flags'] });
      
      // Invalidate all feature flag check queries (for immediate UI update)
      // This will cause all components using useFeatureFlag to refetch
      queryClient.invalidateQueries({ queryKey: ['feature-flag'] });
      
      toast({
        title: "Feature Flag Updated",
        description: "The feature flag has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Feature Flag",
        description: error.message || "An error occurred while updating the feature flag.",
        variant: "destructive",
      });
    },
  });

  const handleToggleFeatureFlag = (flag: FeatureFlag) => {
    toggleFeatureFlagMutation.mutate({
      id: flag.id,
      is_enabled: !flag.is_enabled
    });
  };

  const handleCreateFeatureFlag = () => {
    if (newFeatureFlag.flagName) {
      createFeatureFlagMutation.mutate({
        flag_name: newFeatureFlag.flagName,
        is_enabled: newFeatureFlag.isEnabled,
        program_id: newFeatureFlag.program_id || selectedProgram || null,
        corporate_client_id: newFeatureFlag.corporate_client_id || selectedCorporateClient || null
      });
    }
  };

  const handleStartEdit = (role: string, currentPermissions: Permission[]) => {
    // Normalize permission names from database (uppercase) to lowercase to match available permissions list
    const permissionNames = currentPermissions.map(p => p.permission.toLowerCase());
    setEditingRole(role);
    setSelectedPermissions(new Set(permissionNames));
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setSelectedPermissions(new Set());
  };

  const handleTogglePermission = (permission: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permission)) {
      newSet.delete(permission);
    } else {
      newSet.add(permission);
    }
    setSelectedPermissions(newSet);
  };

  const handleSelectAll = (checked?: boolean) => {
    if (editingRole) {
      const template = roleTemplates.find(t => t.role === editingRole);
      if (template) {
        const permissionsToShow = getAvailablePermissionsForRole(editingRole);
        // If checked is provided (from Switch), use it; otherwise toggle based on current state
        const shouldSelectAll = checked !== undefined 
          ? checked 
          : !permissionsToShow.every(p => selectedPermissions.has(p));
        
        if (shouldSelectAll) {
          // Select all available permissions for this role
          setSelectedPermissions(new Set(permissionsToShow));
        } else {
          // Deselect all
          setSelectedPermissions(new Set());
        }
      }
    }
  };

  const isAllSelected = () => {
    if (!editingRole) return false;
    const template = roleTemplates.find(t => t.role === editingRole);
    if (!template) return false;
    const permissionsToShow = getAvailablePermissionsForRole(editingRole);
    return permissionsToShow.length > 0 && permissionsToShow.every(p => selectedPermissions.has(p));
  };

  const handleSaveRoleTemplate = async (role: string) => {
    console.log(`🔍 [Role Templates] Save button clicked for role: ${role}`);
    if (!editingRole) {
      console.warn(`⚠️ [Role Templates] No editing role set, cannot save`);
      return;
    }

    const template = roleTemplates.find(t => t.role === role);
    if (!template) {
      console.warn(`⚠️ [Role Templates] Template not found for role: ${role}`);
      return;
    }

    console.log(`🔍 [Role Templates] Starting save for ${role}:`, {
      currentPermissions: template.permissions.map(p => p.permission),
      selectedPermissions: Array.from(selectedPermissions),
    });

    try {
      // Normalize current permissions from database to lowercase for comparison
      // Database may have uppercase (VIEW_TRIPS) but we use lowercase (view_trips) in UI
      const currentPermsNormalized = new Set(template.permissions.map(p => p.permission.toLowerCase()));
      const newPerms = selectedPermissions; // Already lowercase from handleStartEdit

      // Find permissions to add (newPerms are already lowercase from selectedPermissions)
      const toAdd = Array.from(newPerms).filter(p => !currentPermsNormalized.has(p));
      // Find permissions to remove (compare normalized - check if lowercase version exists in newPerms)
      const toRemove = template.permissions.filter(p => !newPerms.has(p.permission.toLowerCase()));

      // Add new permissions (suppress individual toasts, we'll show one summary toast)
      const addResults = { success: 0, skipped: 0, errors: 0 };
      console.log(`🔍 [Role Templates] Adding ${toAdd.length} permissions:`, toAdd);
      for (const permission of toAdd) {
        try {
          console.log(`🔍 [Role Templates] Granting permission: ${permission} to role: ${role}`);
          const result = await grantPermissionMutation.mutateAsync({
            role,
            permission,
            resource: '*',
            suppressToast: true, // Suppress individual toasts during bulk operation
          });
          console.log(`✅ [Role Templates] Successfully granted permission: ${permission}`, result);
          addResults.success++;
        } catch (error: any) {
          // If permission already exists (409 status), that's okay - skip it
          if (error.message?.includes('already exists') || error.message?.includes('409:')) {
            console.log(`ℹ️ [Role Templates] Permission ${permission} already exists, skipping`);
            addResults.skipped++;
            continue;
          }
          // For other errors, log but continue with remaining permissions
          console.error(`❌ [Role Templates] Error adding permission ${permission}:`, error);
          addResults.errors++;
        }
      }

      // Remove permissions (suppress individual toasts)
      const removeResults = { success: 0, errors: 0 };
      for (const permission of toRemove) {
        try {
          await revokePermissionMutation.mutateAsync({ permissionId: permission.id, suppressToast: true });
          removeResults.success++;
        } catch (error: any) {
          console.error(`Error removing permission ${permission.permission}:`, error);
          removeResults.errors++;
        }
      }

      // Show summary toast
      const totalChanges = addResults.success + removeResults.success;
      const totalSkipped = addResults.skipped;
      const totalErrors = addResults.errors + removeResults.errors;
      
      // Log detailed results for debugging
      console.log(`🔍 [Role Templates] Save results for ${role}:`, {
        toAdd: toAdd,
        toRemove: toRemove.map(p => ({ id: p.id, permission: p.permission })),
        addResults,
        removeResults,
        totalChanges,
        totalSkipped,
        totalErrors,
      });
      
      if (totalErrors > 0) {
        toast({
          title: "Template Updated with Errors",
          description: `${totalChanges} changes saved${totalSkipped > 0 ? `, ${totalSkipped} skipped (already existed)` : ''}, ${totalErrors} error${totalErrors === 1 ? '' : 's'}.`,
          variant: "destructive",
        });
      } else if (totalChanges > 0) {
        const parts: string[] = [];
        if (addResults.success > 0) {
          parts.push(`${addResults.success} ${addResults.success === 1 ? 'permission' : 'permissions'} added`);
        }
        if (removeResults.success > 0) {
          parts.push(`${removeResults.success} ${removeResults.success === 1 ? 'permission' : 'permissions'} removed`);
        }
        if (totalSkipped > 0) {
          parts.push(`${totalSkipped} already existed`);
        }
        toast({
          title: "Template Updated",
          description: parts.join(', ') + '.',
        });
      } else if (totalSkipped > 0) {
        // All permissions already existed - no changes needed
        toast({
          title: "No Changes Needed",
          description: `All ${totalSkipped} selected permissions already exist for this role.`,
        });
      }

      // Invalidate and refetch permissions to ensure UI is up to date after save
      // Wait for refetch to complete so the UI shows the latest data
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/all'] });
      await queryClient.refetchQueries({ queryKey: ['/api/permissions/all'], exact: true });

      // Small delay to ensure UI updates before closing editor
      await new Promise(resolve => setTimeout(resolve, 100));

      setEditingRole(null);
      setSelectedPermissions(new Set());
    } catch (error: any) {
      console.error('Error saving role template:', error);
      toast({
        title: "Failed to Save Role Template",
        description: error.message || "An error occurred while saving the role template.",
        variant: "destructive",
      });
    }
  };

  const getPermissionIcon = (permission: string) => {
    const upperPermission = permission.toUpperCase();
    if (upperPermission.includes('TRIPS')) return <Flag className="w-4 h-4" />;
    if (upperPermission.includes('DRIVERS')) return <Users className="w-4 h-4" />;
    if (upperPermission.includes('CLIENTS')) return <Users className="w-4 h-4" />;
    if (upperPermission.includes('VEHICLES')) return <Settings className="w-4 h-4" />;
    if (upperPermission.includes('USERS')) return <Users className="w-4 h-4" />;
    if (upperPermission.includes('PERMISSIONS')) return <Shield className="w-4 h-4" />;
    if (upperPermission.includes('ANALYTICS')) return <Settings className="w-4 h-4" />;
    if (upperPermission.includes('PROGRAMS')) return <Building2 className="w-4 h-4" />;
    return <Key className="w-4 h-4" />;
  };

  const formatPermissionName = (permission: string) => {
    return permission
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (permissionsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="uppercase"
            style={{
              fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
              fontWeight: 600,
              fontSize: '68px',
              lineHeight: 1.15,
              letterSpacing: '-0.015em',
              textTransform: 'uppercase',
              color: 'var(--foreground)',
            }}
          >
            ROLE TEMPLATES
          </h1>
        </div>
      </div>

      {/* Role Templates Grid - Single Column Layout */}
      <div className="grid grid-cols-1 gap-6">
        {roleTemplates.map((template) => {
          const isEditing = editingRole === template.role;
          // When editing, show only permissions available for this role
          // When viewing, show only the permissions currently assigned
          const permissionsToShow = isEditing 
            ? getAvailablePermissionsForRole(template.role)
            : template.permissions.map(p => p.permission);

          return (
            <Card key={template.role} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5" />
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{template.name}</span>
                        <Badge className={template.color}>
                          {template.userCount} {template.userCount === 1 ? 'user' : 'users'}
                        </Badge>
                        {(() => {
                          const availablePerms = getAvailablePermissionsForRole(template.role);
                          return availablePerms.length > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {availablePerms.length} {availablePerms.length === 1 ? 'permission' : 'permissions'}
                            </Badge>
                          );
                        })()}
                      </CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Editing Mode */}
                <div className={`drawer-container ${isEditing ? 'drawer-open' : 'drawer-closed'}`}>
                  {isEditing && (
                    <div className="space-y-4">
                      {/* Select All Toggle */}
                      <div className="mb-3 pb-3 border-b">
                        <div className="flex items-center justify-between p-2 rounded">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-semibold">Select All</span>
                            <Badge variant="outline">
                              {(() => {
                                const availablePerms = getAvailablePermissionsForRole(template.role);
                                const selectedCount = availablePerms.filter(p => selectedPermissions.has(p)).length;
                                return `${selectedCount} / ${availablePerms.length}`;
                              })()}
                            </Badge>
                          </div>
                          <Switch
                            checked={isAllSelected()}
                            onCheckedChange={handleSelectAll}
                          />
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                        {PERMISSION_CATEGORIES
                          .map(category => {
                            // Filter permissions in this category to only those available for this role
                            const availableInCategory = category.permissions.filter(p => 
                              permissionsToShow.includes(p)
                            );
                            // Only show category if it has at least one available permission
                            if (availableInCategory.length === 0) return null;
                            
                            return {
                              ...category,
                              availablePermissions: availableInCategory,
                            };
                          })
                          .filter((cat): cat is PermissionCategory & { availablePermissions: string[] } => cat !== null)
                          .map((category) => {
                            const allInCategorySelected = category.availablePermissions.every(p => 
                              selectedPermissions.has(p)
                            );
                            
                            return (
                              <div key={category.id} className="mb-6 last:mb-0">
                                {/* Category Header */}
                                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                                  <div className="flex items-center space-x-2">
                                    {category.icon}
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      {category.name}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {category.availablePermissions.filter(p => selectedPermissions.has(p)).length} / {category.availablePermissions.length}
                                    </Badge>
                                  </div>
                                  {category.availablePermissions.length > 1 && (
                                    <Switch
                                      checked={allInCategorySelected}
                                      onCheckedChange={(checked) => {
                                        const newSet = new Set(selectedPermissions);
                                        if (checked) {
                                          // Select all permissions in this category
                                          category.availablePermissions.forEach(p => newSet.add(p));
                                        } else {
                                          // Deselect all permissions in this category
                                          category.availablePermissions.forEach(p => newSet.delete(p));
                                        }
                                        setSelectedPermissions(newSet);
                                      }}
                                      className="flex-shrink-0"
                                    />
                                  )}
                                </div>
                                
                                {/* Permissions in Category */}
                                <div className="space-y-1 pl-6">
                                  {category.availablePermissions.map((permission) => {
                                    const isSelected = selectedPermissions.has(permission);
                                    return (
                                      <div
                                        key={permission}
                                        className="flex items-center justify-between p-2 rounded transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                      >
                                        <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
                                          {getPermissionIcon(permission)}
                                          <span className="text-sm font-medium text-left">{formatPermissionName(permission)}</span>
                                        </div>
                                        <Switch
                                          checked={isSelected}
                                          onCheckedChange={() => handleTogglePermission(permission)}
                                          className="flex-shrink-0"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleSaveRoleTemplate(template.role)}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Save Template
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Viewing Mode */}
                <div className={`drawer-container ${!isEditing ? 'drawer-open' : 'drawer-closed'}`}>
                  {!isEditing && (
                    <div 
                      className="space-y-2 cursor-pointer"
                      onClick={() => handleStartEdit(template.role, template.permissions)}
                    >
                      {template.permissions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No permissions assigned</p>
                          <div className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Permissions
                          </div>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Edit Template</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Flags Section */}
      {(user?.role === 'super_admin' || user?.role === 'program_admin') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flag className="w-5 h-5 mr-2" />
              Feature Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create New Feature Flag */}
            {user?.role === 'super_admin' && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Create New Feature Flag</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="flagName">Flag Name</Label>
                    <Input
                      id="flagName"
                      value={newFeatureFlag.flagName}
                      onChange={(e) => setNewFeatureFlag({...newFeatureFlag, flagName: e.target.value})}
                      placeholder="feature_name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="flagProgram">Program (Optional)</Label>
                      <Select 
                        value={newFeatureFlag.program_id} 
                        onValueChange={(value) => setNewFeatureFlag({...newFeatureFlag, program_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs?.map((program: any) => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="flagClient">Corporate Client (Optional)</Label>
                      <Select 
                        value={newFeatureFlag.corporate_client_id} 
                        onValueChange={(value) => setNewFeatureFlag({...newFeatureFlag, corporate_client_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {corporateClients?.map((client: any) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <SwitchWithIcons
                      checked={newFeatureFlag.isEnabled}
                      onCheckedChange={(checked) => setNewFeatureFlag({...newFeatureFlag, isEnabled: checked})}
                      aria-label="Enabled by default"
                    />
                    <Label htmlFor="flagEnabled">Enabled by default</Label>
                  </div>

                  <Button 
                    onClick={handleCreateFeatureFlag}
                    disabled={!newFeatureFlag.flagName || createFeatureFlagMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Feature Flag
                  </Button>
                </div>
              </div>
            )}

            {/* Current Feature Flags */}
            <div>
              <h3 className="font-medium mb-3">Current Feature Flags</h3>
              {flagsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-pulse">Loading feature flags...</div>
                </div>
              ) : featureFlags.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Flag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No feature flags configured</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {featureFlags.map((flag: FeatureFlag) => (
                    <div key={flag.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Flag className="w-4 h-4 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium">{flag.flag_name}</div>
                          <div className="text-sm text-gray-500">
                            {flag.program_id ? `Program: ${flag.program_id}` : flag.corporate_client_id ? `Corporate Client: ${flag.corporate_client_id}` : 'Global'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                          {flag.is_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        {(user?.role === 'super_admin' || user?.role === 'corporate_admin') ? (
                          <div className="py-[13.995px]">
                            <SwitchWithIcons
                              checked={flag.is_enabled}
                              onCheckedChange={() => handleToggleFeatureFlag(flag)}
                              disabled={toggleFeatureFlagMutation.isPending}
                              aria-label={`Toggle ${flag.flag_name}`}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Read-only</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

