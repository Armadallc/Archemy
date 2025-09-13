import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Users as UsersIcon, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Search,
  UserCheck,
  UserX,
  Building2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";

interface User {
  userId?: string;
  user_id?: string;
  userName?: string;
  user_name?: string;
  email: string;
  role: string;
  primaryOrganizationId?: string;
  primary_organization_id?: string;
  authorizedOrganizations?: string[];
  authorized_organizations?: string[];
  isActive?: boolean;
  is_active?: boolean;
  [key: string]: any; // Allow additional properties for flexible DB schema
}

interface CreateUserData {
  userName: string;
  email: string;
  role: string;
  password: string;
  phone?: string;
}

const roleLabels = {
  monarch_owner: "Executive",
  organization_admin: "Organization Manager",
  organization_user: "Staff Member", 
  driver: "Driver"
};

const roleColors = {
  monarch_owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  organization_admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  organization_user: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  driver: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
};

export default function Users() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    userName: "",
    email: "",
    role: "organization_user",
    password: "",
    phone: ""
  });

  // Fetch users for current organization  
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/organization", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const response = await apiRequest("POST", "/api/users", {
        ...userData,
        organizationId: currentOrganization!.id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/organization", currentOrganization?.id] });
      setIsCreateDialogOpen(false);
      setCreateUserData({
        userName: "",
        email: "",
        role: "organization_user",
        password: "",
        phone: ""
      });
      toast({
        title: "User created successfully",
        description: "The new user has been added to your organization.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create user",
        description: error.message || "An error occurred while creating the user.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/organization", currentOrganization?.id] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      
      const actionType = variables.updates.hasOwnProperty('isActive') ? 
        (variables.updates.isActive ? 'activated' : 'deactivated') : 'updated';
      
      toast({
        title: `User ${actionType} successfully`,
        description: `The user has been ${actionType}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message || "An error occurred while updating the user.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      if (response.status === 204) {
        return { success: true };
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/organization", currentOrganization?.id] });
      toast({
        title: "User deleted successfully",
        description: "The user has been removed from your organization.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user",
        description: error.message || "An error occurred while deleting the user.",
        variant: "destructive",
      });
    },
  });

  // Toggle user active status
  const toggleUserStatus = (userId: string, isActive: boolean) => {
    if (userId) {
      updateUserMutation.mutate({
        userId,
        updates: { isActive: !isActive }
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user: User) =>
    (user.userName || user.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(createUserData);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const canManageUsers = user?.role === 'organization_admin' || user?.role === 'super_admin';

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            USER MANAGEMENT
          </h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account for your organization.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="userName">Full Name</Label>
                <Input
                  id="userName"
                  value={createUserData.userName}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, userName: e.target.value }))}
                  placeholder="John Smith"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={createUserData.email}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@organization.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={createUserData.role}
                  onValueChange={(value) => setCreateUserData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monarch_owner">Executive</SelectItem>
                    <SelectItem value="organization_admin">Organization Manager</SelectItem>
                    <SelectItem value="organization_user">Staff Member</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={createUserData.password}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={createUserData.phone}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and settings.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  updateUserMutation.mutate({
                    userId: selectedUser.userId || selectedUser.user_id || '',
                    updates: {
                      userName: selectedUser.userName || selectedUser.user_name,
                      email: selectedUser.email,
                      role: selectedUser.role
                    }
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="editUserName">Full Name</Label>
                  <Input
                    id="editUserName"
                    value={selectedUser.userName || selectedUser.user_name || ''}
                    onChange={(e) => setSelectedUser(prev => prev ? {
                      ...prev,
                      userName: e.target.value,
                      user_name: e.target.value
                    } : null)}
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="editEmail">Email Address</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser(prev => prev ? {
                      ...prev,
                      email: e.target.value
                    } : null)}
                    placeholder="john@company.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="editRole">Role</Label>
                  <Select 
                    value={selectedUser.role} 
                    onValueChange={(value) => setSelectedUser(prev => prev ? {
                      ...prev,
                      role: value
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monarch_owner">Executive</SelectItem>
                      <SelectItem value="organization_admin">Organization Manager</SelectItem>
                      <SelectItem value="organization_user">Staff Member</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateUserMutation.isPending ? "Updating..." : "Update User"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and permissions for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm ? "No users found" : "No users yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Add your first team member to get started"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Organizations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.userId || user.user_id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {(user.userName || user.user_name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.userName || user.user_name || 'Unknown'}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                          {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(user.isActive ?? user.is_active) ? "default" : "secondary"}>
                          {(user.isActive ?? user.is_active) ? (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Building2 className="w-3 h-3" />
                          {user.authorizedOrganizations?.length || 1} org(s)
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toggleUserStatus(user.userId || user.user_id || '', user.isActive ?? user.is_active ?? false)}
                            >
                              {(user.isActive ?? user.is_active) ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${user.userName || user.user_name}? This action cannot be undone.`)) {
                                  deleteUserMutation.mutate(user.userId || user.user_id || '');
                                }
                              }}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}