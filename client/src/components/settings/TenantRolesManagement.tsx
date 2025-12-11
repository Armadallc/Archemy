import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  Users,
  Search,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import {
  useTenantRoles,
  useTenantRole,
  useTenantRolePermissions,
  useCreateTenantRole,
  useUpdateTenantRole,
  useDeleteTenantRole,
  useBulkUpdateRolePermissions,
  type TenantRole,
  type RolePermission,
} from "../../hooks/useTenantRoles";
// Import permissions - adjust path if needed
// Note: This assumes PERMISSIONS is exported from server/permissions.ts
// If the path is different, update accordingly
const PERMISSIONS = {
  MANAGE_CORPORATE_CLIENTS: 'manage_corporate_clients',
  VIEW_CORPORATE_CLIENTS: 'view_corporate_clients',
  MANAGE_PROGRAMS: 'manage_programs',
  VIEW_PROGRAMS: 'view_programs',
  VIEW_PROGRAMS_CROSS_CORPORATE: 'view_programs_cross_corporate',
  MANAGE_LOCATIONS: 'manage_locations',
  VIEW_LOCATIONS: 'view_locations',
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  MANAGE_CLIENTS: 'manage_clients',
  VIEW_CLIENTS: 'view_clients',
  VIEW_CLIENTS_CROSS_CORPORATE: 'view_clients_cross_corporate',
  MANAGE_CLIENTS_CROSS_CORPORATE: 'manage_clients_cross_corporate',
  MANAGE_CLIENT_GROUPS: 'manage_client_groups',
  VIEW_CLIENT_GROUPS: 'view_client_groups',
  MANAGE_DRIVERS: 'manage_drivers',
  VIEW_DRIVERS: 'view_drivers',
  MANAGE_VEHICLES: 'manage_vehicles',
  VIEW_VEHICLES: 'view_vehicles',
  MANAGE_TRIPS: 'manage_trips',
  VIEW_TRIPS: 'view_trips',
  CREATE_TRIPS: 'create_trips',
  UPDATE_TRIP_STATUS: 'update_trip_status',
  CREATE_TRIPS_CROSS_CORPORATE: 'create_trips_cross_corporate',
  MANAGE_TRIP_CATEGORIES: 'manage_trip_categories',
  VIEW_TRIP_CATEGORIES: 'view_trip_categories',
  VIEW_REPORTS: 'view_reports',
  VIEW_ANALYTICS: 'view_analytics',
  MOBILE_APP_ACCESS: 'mobile_app_access',
  LOCATION_TRACKING: 'location_tracking',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  VIEW_NOTIFICATIONS: 'view_notifications',
  MANAGE_CALENDAR: 'manage_calendar',
  VIEW_CALENDAR: 'view_calendar',
  MANAGE_WEBHOOKS: 'manage_webhooks',
  VIEW_WEBHOOKS: 'view_webhooks',
} as const;

// Get all available permissions from PERMISSIONS object
const ALL_PERMISSIONS = Object.values(PERMISSIONS).sort();

// Group permissions by category for better UI organization
const PERMISSION_GROUPS: Record<string, string[]> = {
  'Corporate Clients': [
    PERMISSIONS.MANAGE_CORPORATE_CLIENTS,
    PERMISSIONS.VIEW_CORPORATE_CLIENTS,
  ],
  'Programs': [
    PERMISSIONS.MANAGE_PROGRAMS,
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.VIEW_PROGRAMS_CROSS_CORPORATE,
  ],
  'Locations': [
    PERMISSIONS.MANAGE_LOCATIONS,
    PERMISSIONS.VIEW_LOCATIONS,
  ],
  'Users': [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
  ],
  'Clients': [
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS_CROSS_CORPORATE,
    PERMISSIONS.MANAGE_CLIENTS_CROSS_CORPORATE,
  ],
  'Client Groups': [
    PERMISSIONS.MANAGE_CLIENT_GROUPS,
    PERMISSIONS.VIEW_CLIENT_GROUPS,
  ],
  'Drivers': [
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
  ],
  'Vehicles': [
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
  ],
  'Trips': [
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.CREATE_TRIPS_CROSS_CORPORATE,
  ],
  'Trip Categories': [
    PERMISSIONS.MANAGE_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
  ],
  'Reports & Analytics': [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  'Mobile & Location': [
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.LOCATION_TRACKING,
  ],
  'Notifications': [
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  'Calendar': [
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.VIEW_CALENDAR,
  ],
  'Webhooks': [
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.VIEW_WEBHOOKS,
  ],
};

// Format permission name for display
function formatPermissionName(permission: string): string {
  return permission
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function TenantRolesManagement() {
  const { user } = useAuth();
  const { selectedCorporateClient } = useHierarchy();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TenantRole | null>(null);
  
  const [createRoleData, setCreateRoleData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const corporateClientId = selectedCorporateClient || user?.corporate_client_id;

  // Fetch tenant roles
  const { data: roles = [], isLoading } = useTenantRoles(corporateClientId);
  
  // Fetch selected role details
  const { data: roleDetails } = useTenantRole(selectedRole?.id || null);
  
  // Fetch permissions for selected role
  const { data: rolePermissions = [] } = useTenantRolePermissions(selectedRole?.id || null);

  // Mutations
  const createRole = useCreateTenantRole();
  const updateRole = useUpdateTenantRole();
  const deleteRole = useDeleteTenantRole();
  const bulkUpdatePermissions = useBulkUpdateRolePermissions();

  // Filter roles by search term
  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(role => 
      role.name.toLowerCase().includes(term) ||
      role.description?.toLowerCase().includes(term)
    );
  }, [roles, searchTerm]);

  // Handle create role
  const handleCreateRole = async () => {
    if (!createRoleData.name.trim() || !corporateClientId) {
      toast({
        title: "Validation Error",
        description: "Role name and corporate client are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRole.mutateAsync({
        name: createRoleData.name.trim(),
        description: createRoleData.description.trim() || null,
        corporate_client_id: corporateClientId,
        is_active: createRoleData.is_active,
      });
      
      toast({
        title: "Success",
        description: "Tenant role created successfully",
      });
      
      setIsCreateDialogOpen(false);
      setCreateRoleData({ name: "", description: "", is_active: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tenant role",
        variant: "destructive",
      });
    }
  };

  // Handle update role
  const handleUpdateRole = async () => {
    if (!selectedRole || !createRoleData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateRole.mutateAsync({
        roleId: selectedRole.id,
        data: {
          name: createRoleData.name.trim(),
          description: createRoleData.description.trim() || null,
          is_active: createRoleData.is_active,
        },
      });
      
      toast({
        title: "Success",
        description: "Tenant role updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      setCreateRoleData({ name: "", description: "", is_active: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tenant role",
        variant: "destructive",
      });
    }
  };

  // Handle delete role
  const handleDeleteRole = async (role: TenantRole) => {
    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    try {
      await deleteRole.mutateAsync(role.id);
      toast({
        title: "Success",
        description: "Tenant role deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tenant role",
        variant: "destructive",
      });
    }
  };

  // Handle edit role click
  const handleEditClick = (role: TenantRole) => {
    setSelectedRole(role);
    setCreateRoleData({
      name: role.name,
      description: role.description || "",
      is_active: role.is_active,
    });
    setIsEditDialogOpen(true);
  };

  // Handle permissions click
  const handlePermissionsClick = (role: TenantRole) => {
    setSelectedRole(role);
    setIsPermissionsDialogOpen(true);
  };

  // Handle save permissions
  const handleSavePermissions = async (selectedPermissions: string[]) => {
    if (!selectedRole) return;

    try {
      const permissions = selectedPermissions.map(permission => ({
        permission,
        resource: '*',
        corporate_client_id: selectedRole.corporate_client_id,
      }));

      await bulkUpdatePermissions.mutateAsync({
        roleId: selectedRole.id,
        permissions,
      });
      
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
      
      setIsPermissionsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  if (!corporateClientId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Please select a corporate client to manage tenant roles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Tenant Roles
              </CardTitle>
              <CardDescription>
                Create and manage custom roles for your corporate client
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Tenant Role</DialogTitle>
                  <DialogDescription>
                    Create a new custom role for your corporate client
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Role Name *</Label>
                    <Input
                      id="name"
                      value={createRoleData.name}
                      onChange={(e) => setCreateRoleData({ ...createRoleData, name: e.target.value })}
                      placeholder="e.g., Custom Admin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createRoleData.description}
                      onChange={(e) => setCreateRoleData({ ...createRoleData, description: e.target.value })}
                      placeholder="Describe this role's purpose..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={createRoleData.is_active}
                      onCheckedChange={(checked) => setCreateRoleData({ ...createRoleData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRole} disabled={createRole.isPending}>
                      {createRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No roles found matching your search" : "No tenant roles created yet"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? "default" : "secondary"}>
                          {role.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePermissionsClick(role)}
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(role)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                            disabled={deleteRole.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tenant Role</DialogTitle>
            <DialogDescription>
              Update the role details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Role Name *</Label>
              <Input
                id="edit-name"
                value={createRoleData.name}
                onChange={(e) => setCreateRoleData({ ...createRoleData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={createRoleData.description}
                onChange={(e) => setCreateRoleData({ ...createRoleData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={createRoleData.is_active}
                onCheckedChange={(checked) => setCreateRoleData({ ...createRoleData, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} disabled={updateRole.isPending}>
                {updateRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <PermissionsDialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
        role={selectedRole}
        currentPermissions={rolePermissions}
        onSave={handleSavePermissions}
        isLoading={bulkUpdatePermissions.isPending}
      />
    </div>
  );
}

// Permissions Management Dialog Component
interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: TenantRole | null;
  currentPermissions: RolePermission[];
  onSave: (permissions: string[]) => void;
  isLoading: boolean;
}

function PermissionsDialog({
  open,
  onOpenChange,
  role,
  currentPermissions,
  onSave,
  isLoading,
}: PermissionsDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // Initialize selected permissions from current permissions
  React.useEffect(() => {
    if (currentPermissions.length > 0) {
      setSelectedPermissions(new Set(currentPermissions.map(p => p.permission)));
    } else {
      setSelectedPermissions(new Set());
    }
  }, [currentPermissions]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(selectedPermissions));
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions: {role.name}</DialogTitle>
          <DialogDescription>
            Select the permissions for this role. Users with this role will have access to the selected features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
            <div key={groupName} className="space-y-2">
              <h4 className="font-semibold text-sm">{groupName}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {permissions.map(permission => {
                  const isSelected = selectedPermissions.has(permission);
                  return (
                    <div
                      key={permission}
                      className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background border-border hover:bg-accent'
                      }`}
                      onClick={() => togglePermission(permission)}
                    >
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <Label className="cursor-pointer flex-1">
                        {formatPermissionName(permission)}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Permissions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

