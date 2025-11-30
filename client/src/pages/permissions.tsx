import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { useHierarchy } from '../hooks/useHierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Shield, Users, Flag, Key, Lock, Unlock, Plus, Settings, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';

interface Permission {
  id: string;
  role: string;
  permission: string;
  resource: string;
  program_id?: string;
  corporate_client_id?: string;
}

interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  program_id?: string;
  corporate_client_id?: string;
}

export default function PermissionsPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, getFilterParams, getPageTitle } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('');
  const [newPermission, setNewPermission] = useState({
    permission: '',
    resource: '*', // All permissions currently use '*' (all resources)
    program_id: '',
    corporate_client_id: ''
  });
  const [newFeatureFlag, setNewFeatureFlag] = useState({
    flagName: '',
    isEnabled: false,
    program_id: '',
    corporate_client_id: ''
  });

  // Get filter parameters based on current hierarchy level
  const filterParams = getFilterParams();

  // Fetch programs for assignment dropdown (for super admins)
  const { data: programs } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/programs");
      return await response.json();
    },
    enabled: user?.role === 'super_admin',
  });

  // Fetch corporate clients for assignment dropdown (for super admins)
  const { data: corporateClients } = useQuery({
    queryKey: ["/api/corporate-clients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/corporate-clients");
      return await response.json();
    },
    enabled: user?.role === 'super_admin',
  });

  // Fetch effective permissions for current user
  const { data: effectivePermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/permissions/effective', level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = '/api/permissions/effective';
      
      // Build endpoint based on hierarchy level
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/permissions/effective/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/permissions/effective/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!user,
  });

  // Fetch all role permissions (admin only)
  const { data: allPermissions = [], isLoading: allPermissionsLoading } = useQuery({
    queryKey: ['/api/permissions/all', level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = '/api/permissions/all';
      
      // Build endpoint based on hierarchy level
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/permissions/all/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/permissions/all/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: user?.role === 'super_admin' || user?.role === 'program_admin',
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

  const grantPermissionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", '/api/permissions/grant', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/all'] });
      setNewPermission({ permission: '', resource: '*', program_id: '', corporate_client_id: '' });
      toast({
        title: "Permission Granted",
        description: "The permission has been successfully granted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Grant Permission",
        description: error.message || "An error occurred while granting the permission.",
        variant: "destructive",
      });
    },
  });

  const createFeatureFlagMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", '/api/feature-flags/create', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feature-flags'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feature-flags'] });
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

  const roleHierarchy = {
    super_admin: {
      name: 'Super Admin',
      description: 'Full system access across all corporate clients and programs',
      color: 'bg-red-100 text-red-800',
      level: 0
    },
    corporate_admin: {
      name: 'Corporate Admin',
      description: 'Full access within corporate client and all its programs',
      color: 'bg-purple-100 text-purple-800',
      level: 1
    },
    program_admin: {
      name: 'Program Admin',
      description: 'Full access within single program',
      color: 'bg-blue-100 text-blue-800',
      level: 2
    },
    program_user: {
      name: 'Program User',
      description: 'Standard user access within program',
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
    'MANAGE_USERS', 'MANAGE_PERMISSIONS', 'VIEW_ANALYTICS', 'MANAGE_PROGRAMS'
  ];

  // Currently all permissions use '*' (all resources)
  // Other resource types (program, corporate_client, own) are not yet implemented
  const availableResources = ['*'];

  const handleGrantPermission = () => {
    if (selectedRole && newPermission.permission && newPermission.resource) {
      grantPermissionMutation.mutate({
        role: selectedRole,
        permission: newPermission.permission,
        resource: newPermission.resource,
        program_id: newPermission.program_id || selectedProgram || null,
        corporate_client_id: newPermission.corporate_client_id || selectedCorporateClient || null
      });
    }
  };

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

  const getPermissionIcon = (permission: string) => {
    if (!permission || typeof permission !== 'string') {
      return <Key className="w-4 h-4" />;
    }
    const upperPermission = permission.toUpperCase();
    if (upperPermission.includes('TRIPS')) return <Flag className="w-4 h-4" />;
    if (upperPermission.includes('DRIVERS')) return <Users className="w-4 h-4" />;
    if (upperPermission.includes('CLIENTS')) return <Users className="w-4 h-4" />;
    if (upperPermission.includes('VEHICLES')) return <Settings className="w-4 h-4" />;
    if (upperPermission.includes('USERS')) return <Users className="w-4 h-4" />;
    if (upperPermission.includes('PERMISSIONS')) return <Shield className="w-4 h-4" />;
    if (upperPermission.includes('ANALYTICS')) return <Settings className="w-4 h-4" />;
    return <Key className="w-4 h-4" />;
  };

  if (permissionsLoading || allPermissionsLoading || flagsLoading) {
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
            PERMISSIONS & FEATURE FLAGS
          </h1>
          <p className="text-gray-600 mt-1">{getPageTitle()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permissions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Role Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grant New Permission */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Grant New Permission</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleHierarchy).map(([key, role]) => (
                        <SelectItem key={key} value={key}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="permission">Permission</Label>
                  <Select 
                    value={newPermission.permission} 
                    onValueChange={(value) => setNewPermission({...newPermission, permission: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePermissions.map((permission) => (
                        <SelectItem key={permission} value={permission}>
                          {permission.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Resource field hidden - all permissions currently use '*' (all resources) */}
                {/* Future: When resource scoping is implemented, uncomment this:
                <div>
                  <Label htmlFor="resource">Resource</Label>
                  <Select 
                    value={newPermission.resource} 
                    onValueChange={(value) => setNewPermission({...newPermission, resource: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableResources.map((resource) => (
                        <SelectItem key={resource} value={resource}>
                          {resource === '*' ? 'All Resources' : resource}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                */}
                <div>
                  <Label htmlFor="program">Program (Optional)</Label>
                  <Select 
                    value={newPermission.program_id} 
                    onValueChange={(value) => setNewPermission({...newPermission, program_id: value})}
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
              </div>

              <Button 
                onClick={handleGrantPermission}
                disabled={!selectedRole || !newPermission.permission || !newPermission.resource}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Grant Permission
              </Button>
            </div>

            {/* Current Permissions */}
            <div>
              <h3 className="font-medium mb-3">Current Permissions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allPermissions.map((permission: Permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getPermissionIcon(permission.permission)}
                      <div>
                        <div className="font-medium">{permission.permission.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">
                          {permission.resource} • {roleHierarchy[permission.role as keyof typeof roleHierarchy]?.name}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {permission.resource}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flag className="w-5 h-5 mr-2" />
              Feature Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create New Feature Flag */}
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
                  <Switch
                    id="flagEnabled"
                    checked={newFeatureFlag.isEnabled}
                    onCheckedChange={(checked) => setNewFeatureFlag({...newFeatureFlag, isEnabled: checked})}
                  />
                  <Label htmlFor="flagEnabled">Enabled by default</Label>
                </div>

                <Button 
                  onClick={handleCreateFeatureFlag}
                  disabled={!newFeatureFlag.flagName}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Feature Flag
                </Button>
              </div>
            </div>

            {/* Current Feature Flags */}
            <div>
              <h3 className="font-medium mb-3">Current Feature Flags</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {featureFlags.map((flag: FeatureFlag) => (
                  <div key={flag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Flag className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{flag.flag_name}</div>
                        <div className="text-sm text-gray-500">
                          {flag.program_id ? `Program: ${flag.program_id}` : 'Global'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                        {flag.is_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => handleToggleFeatureFlag(flag)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Effective Permissions for Current User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Your Effective Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {effectivePermissions.map((perm: Permission) => {
              const permissionString = typeof perm === 'string' ? perm : perm.permission;
              return (
                <div key={perm.id || permissionString} className="flex items-center space-x-2 p-3 border rounded-lg">
                  {getPermissionIcon(permissionString)}
                  <span className="text-sm font-medium">{permissionString.replace(/_/g, ' ')}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}