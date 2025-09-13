import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Users, Flag, Key, Lock, Unlock, Plus, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Permission {
  id: string;
  role: string;
  permission: string;
  resource: string;
  organization_id?: string;
}

interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  organization_id?: string;
}

export default function PermissionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('');
  const [newPermission, setNewPermission] = useState({
    permission: '',
    resource: '',
    organizationId: ''
  });
  const [newFeatureFlag, setNewFeatureFlag] = useState({
    flagName: '',
    isEnabled: false,
    organizationId: ''
  });

  // Fetch effective permissions for current user
  const { data: effectivePermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/permissions/effective'],
    enabled: !!user,
  });

  // Fetch all role permissions (admin only)
  const { data: allPermissions = [], isLoading: allPermissionsLoading, error: allPermissionsError } = useQuery({
    queryKey: ['/api/permissions/all'],
    queryFn: async () => {
      console.log('Fetching permissions data...');
      const response = await fetch('/api/permissions/all', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Permissions data received:', data.length, 'items');
      return data;
    },
    enabled: true,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch feature flags
  const { data: featureFlags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ['/api/super-admin/feature-flags'],
    enabled: user?.role === 'super_admin',
  });

  const grantPermissionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/permissions/grant', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/all'] });
      setNewPermission({ permission: '', resource: '', organizationId: '' });
    },
  });

  const toggleFeatureFlagMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/feature-flags/toggle', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/feature-flags'] });
    },
  });

  const roleHierarchy = {
    super_admin: {
      name: 'Super Admin',
      description: 'Full system access across all organizations',
      color: 'bg-red-100 text-red-800',
      level: 0
    },
    monarch_owner: {
      name: 'Executive',
      description: 'Executive-level access across all Monarch organizations',
      color: 'bg-purple-100 text-purple-800',
      level: 1
    },
    organization_admin: {
      name: 'Organization Manager',
      description: 'Full access within single organization',
      color: 'bg-blue-100 text-blue-800',
      level: 2
    },
    organization_user: {
      name: 'Staff Member',
      description: 'Standard user access within organization',
      color: 'bg-green-100 text-green-800',
      level: 3
    },
    driver: {
      name: 'Driver',
      description: 'Driver-specific access to trips and schedules',
      color: 'bg-yellow-100 text-yellow-800',
      level: 3
    }
  };

  const availablePermissions = [
    'VIEW_TRIPS', 'CREATE_TRIPS', 'EDIT_TRIPS', 'DELETE_TRIPS',
    'VIEW_DRIVERS', 'CREATE_DRIVERS', 'EDIT_DRIVERS', 'DELETE_DRIVERS',
    'VIEW_CLIENTS', 'CREATE_CLIENTS', 'EDIT_CLIENTS', 'DELETE_CLIENTS',
    'VIEW_VEHICLES', 'CREATE_VEHICLES', 'EDIT_VEHICLES', 'DELETE_VEHICLES',
    'MANAGE_USERS', 'MANAGE_PERMISSIONS', 'VIEW_ANALYTICS', 'MANAGE_ORGANIZATIONS'
  ];

  const availableResources = ['*', 'organization', 'own'];

  const handleGrantPermission = () => {
    if (selectedRole && newPermission.permission && newPermission.resource) {
      grantPermissionMutation.mutate({
        role: selectedRole,
        permission: newPermission.permission,
        resource: newPermission.resource,
        organizationId: newPermission.organizationId || null
      });
    }
  };

  const handleToggleFeatureFlag = (flagName: string, isEnabled: boolean) => {
    toggleFeatureFlagMutation.mutate({
      flagName,
      isEnabled,
      organizationId: null
    });
  };

  if (!user) {
    return <div>Please log in to view permissions.</div>;
  }

  // Restrict access to super_admin and monarch_owner only
  if (user.role !== 'super_admin' && user.role !== 'monarch_owner') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the permission management system.</p>
          <p className="text-sm text-gray-500 mt-2">Required role: super_admin or monarch_owner</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">PERMISSION MANAGEMENT</h1>
      </div>

      {/* Role Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Role Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(roleHierarchy).map(([role, info]) => (
              <div key={role} className="flex items-center gap-4 p-3 border rounded-lg">
                <Badge className={info.color}>{info.name}</Badge>
                <div className="flex-1">
                  <p className="font-medium">{role}</p>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </div>
                <div className="text-sm text-gray-500">
                  Level {info.level}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current User Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Your Effective Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {permissionsLoading ? (
            <div>Loading permissions...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {effectivePermissions.map((permission: any, index: number) => (
                <Badge key={index} variant="outline" className="justify-center p-2">
                  {permission.permission} ({permission.resource})
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin-only sections */}
      {user.role === 'super_admin' && (
        <>
          {/* Permission Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Grant Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(roleHierarchy).map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Permission</Label>
                  <Select 
                    value={newPermission.permission} 
                    onValueChange={(value) => setNewPermission(prev => ({ ...prev, permission: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePermissions.map(perm => (
                        <SelectItem key={perm} value={perm}>{perm}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Resource</Label>
                  <Select 
                    value={newPermission.resource} 
                    onValueChange={(value) => setNewPermission(prev => ({ ...prev, resource: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableResources.map(resource => (
                        <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleGrantPermission}
                    disabled={!selectedRole || !newPermission.permission || !newPermission.resource || grantPermissionMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Grant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {flagsLoading ? (
                <div>Loading feature flags...</div>
              ) : (
                <div className="space-y-3">
                  {[
                    'MOBILE_APP_ACCESS',
                    'REAL_TIME_TRACKING', 
                    'ADVANCED_ANALYTICS',
                    'BULK_OPERATIONS',
                    'API_ACCESS',
                    'CUSTOM_REPORTING',
                    'EMERGENCY_ALERTS',
                    'DRIVER_SELF_ASSIGNMENT'
                  ].map(flagName => {
                    const flag = featureFlags.find((f: FeatureFlag) => f.flag_name === flagName);
                    const isEnabled = flag?.is_enabled || false;
                    
                    return (
                      <div key={flagName} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{flagName}</p>
                          <p className="text-sm text-gray-600">
                            {flagName.toLowerCase().replace(/_/g, ' ')}
                          </p>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleToggleFeatureFlag(flagName, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Permissions (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                All System Permissions (Read-Only)
              </CardTitle>
              <p className="text-sm text-gray-600">
                Foundation permission structure - use "Grant User Permission" below to assign permissions to users
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-xs text-gray-500">
                Debug: Loading={allPermissionsLoading ? 'true' : 'false'}, 
                Data length={allPermissions?.length || 0}, 
                Error={allPermissionsError ? 'yes' : 'no'}
              </div>
              {allPermissionsLoading ? (
                <div>Loading all permissions...</div>
              ) : allPermissionsError ? (
                <div className="text-red-600">
                  Error loading permissions: {allPermissionsError.message}
                </div>
              ) : allPermissions && allPermissions.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="text-xs text-blue-600 mb-3 bg-blue-50 p-2 rounded">
                    📋 Read-only view of system permission structure - these define what each role can access
                  </div>
                  {allPermissions.map((permission: Permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-2 border rounded text-sm bg-gray-50">
                      <span className="font-medium text-blue-600 min-w-[120px]">{permission.role}</span>
                      <span className="text-gray-700 font-mono text-sm">{permission.permission}</span>
                      <span className="text-gray-600 italic">{permission.resource}</span>
                      {permission.organization_id && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                          {permission.organization_id}
                        </span>
                      )}
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 mt-3 text-center pt-2 border-t">
                    Total: {allPermissions.length} permissions configured in database
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No permissions data received from API</p>
                  <p className="text-xs mt-1">Expected 43 permissions from database</p>
                  <button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/permissions/all'] })}
                    className="text-blue-600 underline mt-2"
                  >
                    Retry Loading
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}