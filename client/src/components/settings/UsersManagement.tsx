import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  Users as UsersIcon, 
  UserPlus, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Search,
  UserCheck,
  UserX,
  Building2,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { useToast } from "../../hooks/use-toast";

interface User {
  user_id: string;
  user_name: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  corporate_client_id?: string;
  primary_program_id?: string;
  
  // Related data
  program?: {
    id: string;
    name: string;
    corporate_client_id: string;
    logo_url?: string | null;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
  corporate_clients?: {
    id: string;
    name: string;
  };
}

interface CreateUserData {
  user_name: string;
  email: string;
  role: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  program_id?: string;
  corporate_client_id?: string;
}

interface CorporateClient {
  id: string;
  name: string;
  logo_url?: string | null;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  corporate_admin: "Corporate Admin",
  program_admin: "Program Admin",
  program_user: "Program User",
  driver: "Driver",
  client_user: "Client User",
  "client-user": "Client User"
};

const roleColors: Record<string, string> = {
  super_admin: "text-status-info",
  corporate_admin: "text-status-error",
  program_admin: "text-status-warning",
  program_user: "text-status-success",
  driver: "text-status-warning"
};

const roleBgColors: Record<string, string> = {
  super_admin: "var(--status-info-bg)",
  corporate_admin: "var(--status-error-bg)",
  program_admin: "var(--status-warning-bg)",
  program_user: "var(--status-success-bg)",
  driver: "var(--status-warning-bg)"
};

// Role hierarchy order for sorting
const roleOrder: Record<string, number> = {
  corporate_admin: 1,
  program_admin: 2,
  program_user: 3,
  driver: 4,
  super_admin: 0, // Super admins at the top
};

export default function UsersManagement() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    user_name: "",
    email: "",
    role: "program_user",
    password: "",
    first_name: "",
    last_name: "",
    phone: ""
  });

  // Fetch all corporate clients (for super admin and corporate admin)
  const { data: corporateClients = [] } = useQuery<CorporateClient[]>({
    queryKey: ['/api/corporate-clients'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate-clients');
      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.corporateClients)) {
        return data.corporateClients;
      }
      return [];
    },
    enabled: user?.role === 'super_admin' || user?.role === 'corporate_admin',
  });

  // Fetch users based on role and hierarchy level
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users", user?.role, level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      let endpoint = "/api/users";
      
      // Build endpoint based on role and hierarchy level
      if (user?.role === 'super_admin') {
        // Super admin sees all users
        endpoint = "/api/users";
      } else if (user?.role === 'corporate_admin') {
        // Corporate admin sees users in their corporate client
        if (selectedCorporateClient) {
          endpoint = `/api/users/corporate-client/${selectedCorporateClient}`;
        } else if (user.corporate_client_id) {
          endpoint = `/api/users/corporate-client/${user.corporate_client_id}`;
        } else {
          endpoint = "/api/users"; // Will be filtered by backend
        }
      } else if (user?.role === 'program_admin') {
        // Program admin sees users in their program
        if (selectedProgram) {
          endpoint = `/api/users/program/${selectedProgram}`;
        } else if (user.primary_program_id) {
          endpoint = `/api/users/program/${user.primary_program_id}`;
        } else {
          return []; // No program selected
        }
      } else {
        return []; // Other roles can't view users
      }
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      const allUsers = Array.isArray(data) ? data : [];
      // Filter out inactive (deleted) users - they should not appear in the UI
      const activeUsers = allUsers.filter((user: User) => user.is_active !== false);
      
      // Fetch all programs once for enrichment
      let programsMap: Record<string, any> = {};
      try {
        const programsResponse = await apiRequest("GET", "/api/programs");
        const programsData = await programsResponse.json();
        if (Array.isArray(programsData)) {
          programsMap = programsData.reduce((acc: Record<string, any>, program: any) => {
            acc[program.id] = program;
            return acc;
          }, {});
        }
      } catch (err) {
        console.warn("Could not fetch programs for enrichment:", err);
      }
      
      // Enrich users with program data if missing
      const enrichedUsers = activeUsers.map((user: any) => {
        // Handle Supabase's plural form (programs array) - convert to singular
        if (user.programs && Array.isArray(user.programs) && user.programs.length > 0 && !user.program) {
          user.program = user.programs[0];
        }
        
        // If user has primary_program_id but no program data, fetch from programs map
        if (user.primary_program_id && !user.program && programsMap[user.primary_program_id]) {
          const programData = programsMap[user.primary_program_id];
          user.program = {
            id: programData.id,
            name: programData.name,
            corporate_client_id: programData.corporate_client_id,
            logo_url: programData.logo_url || null,
            corporateClient: programData.corporateClient || programData.corporate_clients
          };
        }
        
        // Also ensure logo_url is preserved if program already exists
        if (user.program && programsMap[user.program.id]?.logo_url) {
          user.program.logo_url = programsMap[user.program.id].logo_url;
        }
        
        // Ensure corporateClient is set correctly on program
        if (user.program && !user.program.corporateClient && user.corporate_clients) {
          user.program.corporateClient = user.corporate_clients;
        }
        
        return user;
      });
      
      return enrichedUsers;
    },
    enabled: !!user && (user.role === 'super_admin' || user.role === 'corporate_admin' || user.role === 'program_admin'),
  });

  // Fetch programs for assignment dropdown - filtered by corporate client if selected
  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs", createUserData.corporate_client_id, user?.role],
    queryFn: async () => {
      let endpoint = "/api/programs";
      
      // If corporate client is selected (and not "all"), fetch only programs for that corporate client
      if (createUserData.corporate_client_id && createUserData.corporate_client_id !== 'all') {
        endpoint = `/api/programs/corporate-client/${createUserData.corporate_client_id}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: (user?.role === 'super_admin' || user?.role === 'corporate_admin') && 
             // For roles other than super_admin and driver, require corporate_client_id first
             (createUserData.role === 'super_admin' || 
              createUserData.role === 'driver' || 
              (!!createUserData.corporate_client_id && createUserData.corporate_client_id !== 'all')),
  });

  // Organize users based on role
  const usersByCorporateClient = useMemo(() => {
    const organized: Record<string, User[]> = {};
    
    if (user?.role === 'super_admin') {
      // Super admin: organize by corporate client
      corporateClients.forEach(client => {
        organized[client.id] = [];
      });
      
      users.forEach(user => {
        const clientId = user.corporate_client_id || user.corporate_clients?.id || 'unassigned';
        if (!organized[clientId]) {
          organized[clientId] = [];
        }
        organized[clientId].push(user);
      });
    } else if (user?.role === 'corporate_admin') {
      // Corporate admin: organize by corporate client (their own)
      const clientId = selectedCorporateClient || user.corporate_client_id || 'unassigned';
      organized[clientId] = [...users];
    } else if (user?.role === 'program_admin') {
      // Program admin: organize by program (their own)
      const programId = selectedProgram || user.primary_program_id || 'unassigned';
      organized[programId] = [...users];
    }
    
    // Sort users within each group
    Object.keys(organized).forEach(groupId => {
      organized[groupId].sort((a, b) => {
        // First sort by active status (active first)
        if (a.is_active !== b.is_active) {
          return a.is_active ? -1 : 1;
        }
        // Then by role hierarchy
        const roleA = roleOrder[a.role] ?? 999;
        const roleB = roleOrder[b.role] ?? 999;
        if (roleA !== roleB) {
          return roleA - roleB;
        }
        // Finally alphabetically by name
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.user_name;
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.user_name;
        return nameA.localeCompare(nameB);
      });
    });
    
    return organized;
  }, [users, corporateClients, user, selectedCorporateClient, selectedProgram]);

  // Filter users based on search term
  const filteredUsersByClient = useMemo(() => {
    if (!searchTerm) return usersByCorporateClient;
    
    const searchLower = searchTerm.toLowerCase();
    const filtered: Record<string, User[]> = {};
    
    Object.keys(usersByCorporateClient).forEach(clientId => {
      const filteredUsers = usersByCorporateClient[clientId].filter((user) => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.user_name;
        return (
          user.user_name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          fullName.toLowerCase().includes(searchLower) ||
          user.role.toLowerCase().includes(searchLower)
        );
      });
      
      if (filteredUsers.length > 0) {
        filtered[clientId] = filteredUsers;
      }
    });
    
    return filtered;
  }, [usersByCorporateClient, searchTerm]);

  // Auto-expand corporate client cards when searching
  useEffect(() => {
    if (searchTerm && Object.keys(filteredUsersByClient).length > 0) {
      // Expand all cards that contain search results
      const cardsToExpand = new Set(Object.keys(filteredUsersByClient));
      setExpandedClients(cardsToExpand);
    }
    // Note: We don't auto-collapse when search is cleared to preserve user's manual expand/collapse state
  }, [searchTerm, filteredUsersByClient]);

  // Get group name (corporate client or program)
  const getGroupName = (groupId: string): string => {
    if (groupId === 'unassigned') return 'Unassigned';
    
    if (user?.role === 'super_admin' || user?.role === 'corporate_admin') {
      const client = corporateClients.find(c => c.id === groupId);
      const name = client?.name || 'Unknown';
      
      // Special handling for specific tenant names
      const nameLower = name.toLowerCase().trim();
      if (nameLower === 'apn') {
        return 'APN';
      } else if (nameLower === 'halcyon health' || nameLower === 'halcyon') {
        return 'HALCYON';
      } else if (nameLower === 'monarch') {
        return 'MONARCH';
      } else if (nameLower === 'spero recovery' || nameLower === 'spero') {
        return 'SPERO RECOVERY';
      }
      
      // Default: Capitalize each word in the name
      return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else if (user?.role === 'program_admin') {
      // For program admins, show program name or a generic label
      return 'Program Users';
    }
    
    return 'Unknown';
  };

  // Get group logo URL (corporate client or program)
  const getGroupLogoUrl = (groupId: string): string | null => {
    if (groupId === 'unassigned') return null;
    
    if (user?.role === 'super_admin' || user?.role === 'corporate_admin') {
      const client = corporateClients.find(c => c.id === groupId);
      return client?.logo_url || null;
    } else if (user?.role === 'program_admin') {
      // For program admins, try to get program logo from first user in group
      const groupUsers = filteredUsersByClient[groupId] || [];
      if (groupUsers.length > 0 && groupUsers[0].program?.logo_url) {
        return groupUsers[0].program.logo_url;
      }
      // Try to get from selectedProgram if available
      if (selectedProgram) {
        // We'd need to fetch program data, but for now return null
        return null;
      }
    }
    
    return null;
  };

  // Get total counts
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      // Map program_id to primary_program_id for API compatibility
      const apiData: any = { ...userData };
      if (apiData.program_id) {
        apiData.primary_program_id = apiData.program_id;
        delete apiData.program_id;
      }
      const response = await apiRequest("POST", "/api/users", apiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      setCreateUserData({
        user_name: "",
        email: "",
        role: "program_user",
        password: "",
        first_name: "",
        last_name: "",
        phone: ""
      });
      toast({
        title: "User created successfully",
        description: "The new user has been added to the system.",
        variant: "success",
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
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      
      const actionType = variables.updates.hasOwnProperty('is_active') ? 
        (variables.updates.is_active ? 'activated' : 'deactivated') : 'updated';
      
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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted successfully",
        description: "The user has been removed from the system.",
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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate: For roles other than super_admin and driver, corporate_client_id is required
    if (createUserData.role !== 'super_admin' && createUserData.role !== 'driver' && !createUserData.corporate_client_id) {
      toast({
        title: "Validation Error",
        description: "Please select a corporate client before creating this user.",
        variant: "destructive",
      });
      return;
    }
    
    // For program admins, auto-assign their program
    const userDataToSubmit = { ...createUserData };
    if (user?.role === 'program_admin' && (selectedProgram || user.primary_program_id)) {
      userDataToSubmit.program_id = selectedProgram || user.primary_program_id;
    }
    
    // For corporate admins, ensure corporate_client_id is set
    if (user?.role === 'corporate_admin' && user.corporate_client_id && !userDataToSubmit.corporate_client_id) {
      userDataToSubmit.corporate_client_id = user.corporate_client_id;
    }
    
    // If "all" is selected for corporate client, clear it (super admin can create users without corporate client)
    if (userDataToSubmit.corporate_client_id === 'all') {
      userDataToSubmit.corporate_client_id = undefined;
    }
    
    createUserMutation.mutate(userDataToSubmit);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.user_id,
        updates: {
          user_name: selectedUser.user_name,
          email: selectedUser.email,
          role: selectedUser.role,
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          phone: selectedUser.phone,
          is_active: selectedUser.is_active
        }
      });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleToggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      userId: user.user_id,
      updates: { is_active: !user.is_active }
    });
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete user ${user.user_name}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.user_id);
    }
  };

  const toggleClient = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Sort groups alphabetically
  const sortedGroupIds = Object.keys(filteredUsersByClient).sort((a, b) => {
    if (a === 'unassigned') return 1;
    if (b === 'unassigned') return -1;
    return getGroupName(a).localeCompare(getGroupName(b));
  });

  return (
    <div className="space-y-6">
      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 card-neu-pressed"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          />
        </div>
        
        <div className="flex items-center space-x-4 text-sm" style={{ color: '#a5c8ca' }}>
          <span className="flex items-center">
            <UsersIcon className="w-4 h-4 mr-1" />
            {totalUsers} users
          </span>
          <span className="flex items-center">
            <UserCheck className="w-4 h-4 mr-1" />
            {activeUsers} active
          </span>
        </div>

        <Button 
          className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Add User</span>
        </Button>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with appropriate permissions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user_name">Username *</Label>
                  <Input
                    id="user_name"
                    value={createUserData.user_name}
                    onChange={(e) => setCreateUserData({...createUserData, user_name: e.target.value})}
                    placeholder="johndoe"
                    required
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createUserData.email}
                    onChange={(e) => setCreateUserData({...createUserData, email: e.target.value})}
                    placeholder="john@example.com"
                    required
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={createUserData.first_name}
                    onChange={(e) => setCreateUserData({...createUserData, first_name: e.target.value})}
                    placeholder="John"
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={createUserData.last_name}
                    onChange={(e) => setCreateUserData({...createUserData, last_name: e.target.value})}
                    placeholder="Doe"
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={createUserData.phone}
                    onChange={(e) => setCreateUserData({...createUserData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={createUserData.role} 
                    onValueChange={(value) => setCreateUserData({...createUserData, role: value})}
                  >
                    <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporate_admin">Corporate Admin</SelectItem>
                      <SelectItem value="program_admin">Program Admin</SelectItem>
                      <SelectItem value="program_user">Program User</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      {user?.role === 'super_admin' && (
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Corporate Client and Program Assignment - only show for super admin and corporate admin */}
              {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
                <div className="grid grid-cols-2 gap-4">
                  {user?.role === 'super_admin' && (
                    <div>
                      <Label htmlFor="corporate_client_id">
                        Corporate Client
                        {createUserData.role !== 'super_admin' && createUserData.role !== 'driver' && ' *'}
                      </Label>
                      <Select 
                        value={createUserData.corporate_client_id || undefined} 
                        onValueChange={(value) => {
                          // Reset program_id when corporate_client_id changes
                          setCreateUserData({
                            ...createUserData, 
                            corporate_client_id: value || undefined,
                            program_id: undefined // Reset program when corporate client changes
                          });
                        }}
                      >
                        <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                          <SelectValue placeholder={
                            createUserData.role !== 'super_admin' && createUserData.role !== 'driver'
                              ? "Select corporate client (required)"
                              : "Select corporate client (optional)"
                          } />
                        </SelectTrigger>
                      <SelectContent>
                        {(createUserData.role === 'super_admin' || createUserData.role === 'driver') && (
                          <SelectItem value="all">All Corporate Clients</SelectItem>
                        )}
                        {corporateClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="program_id">Program Assignment</Label>
                    <Select 
                      value={createUserData.program_id || undefined} 
                      onValueChange={(value) => setCreateUserData({...createUserData, program_id: value || undefined})}
                      disabled={
                        // Disable if corporate client is required but not selected (for roles other than super_admin and driver)
                        (createUserData.role !== 'super_admin' && createUserData.role !== 'driver' && !createUserData.corporate_client_id) ||
                        // Also disable if "all" is selected for corporate client
                        createUserData.corporate_client_id === 'all'
                      }
                    >
                      <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        <SelectValue placeholder={
                          (createUserData.role !== 'super_admin' && createUserData.role !== 'driver' && !createUserData.corporate_client_id)
                            ? "Select corporate client first"
                            : createUserData.corporate_client_id === 'all'
                            ? "Select a specific corporate client"
                            : "Select program (optional)"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(programs) && programs.length > 0 ? (
                          programs.map((program: any) => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-programs" disabled>
                            No programs available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {createUserData.role !== 'super_admin' && createUserData.role !== 'driver' && !createUserData.corporate_client_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Please select a corporate client first
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* For program admins, auto-assign their program */}
              {user?.role === 'program_admin' && (
                <div>
                  <Label htmlFor="program_id">Program Assignment</Label>
                  <Input
                    id="program_id"
                    value={selectedProgram || user.primary_program_id || ''}
                    disabled
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none', opacity: 0.6 }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Users will be assigned to your program automatically
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={createUserData.password}
                  onChange={(e) => setCreateUserData({...createUserData, password: e.target.value})}
                  placeholder="Enter password"
                  required
                  className="card-neu-pressed"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
                  className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
                  style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
                >
                  {createUserMutation.isPending ? (
                    <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Creating...</span>
                  ) : (
                    <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Create User</span>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users by Group (Corporate Client or Program) */}
      <div className="space-y-4">
        {sortedGroupIds.length === 0 ? (
          <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <CardContent className="py-12 text-center">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: '#a5c8ca' }} />
              <p style={{ color: '#a5c8ca' }}>No users found</p>
              <p className="text-sm mt-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>Add users to start managing your team</p>
            </CardContent>
          </Card>
        ) : (
          sortedGroupIds.map((groupId) => {
            const groupUsers = filteredUsersByClient[groupId] || [];
            const isExpanded = expandedClients.has(groupId);
            const groupName = getGroupName(groupId);
            
            // Group users by role
            const superAdmins = groupUsers.filter(u => u.role === 'super_admin');
            const corporateAdmins = groupUsers.filter(u => u.role === 'corporate_admin');
            const programAdmins = groupUsers.filter(u => u.role === 'program_admin');
            const programUsers = groupUsers.filter(u => u.role === 'program_user');
            const drivers = groupUsers.filter(u => u.role === 'driver');
            const otherUsers = groupUsers.filter(u => !['corporate_admin', 'program_admin', 'program_user', 'driver', 'super_admin'].includes(u.role));

            return (
              <Collapsible
                key={groupId}
                open={isExpanded}
                onOpenChange={() => toggleClient(groupId)}
              >
                <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer card-neu-flat [&]:shadow-none transition-colors" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getGroupLogoUrl(groupId) ? (
                            <img
                              src={getGroupLogoUrl(groupId)!}
                              alt={`${groupName} logo`}
                              className="rounded"
                              style={{ 
                                width: '50px', 
                                height: '50px', 
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          ) : (
                            <Building2 className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                          )}
                          <div>
                            <CardTitle className="text-lg" style={{ color: '#a5c8ca' }}>{groupName}</CardTitle>
                            <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
                              {groupUsers.length} {groupUsers.length === 1 ? 'user' : 'users'} 
                              {!isExpanded && ` • ${groupUsers.filter(u => u.is_active).length} active`}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                          ) : (
                            <ChevronRight className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">User</TableHead>
                              <TableHead className="w-[250px]">Contact</TableHead>
                              <TableHead className="w-[140px]">Role</TableHead>
                              <TableHead className="w-[200px]">Program</TableHead>
                              <TableHead className="w-[100px]">Status</TableHead>
                              <TableHead className="w-[120px]">Created</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Super Admins */}
                            {superAdmins.length > 0 && (
                              <>
                                <TableRow className="bg-muted/30">
                                  <TableCell colSpan={7} className="font-medium text-sm text-muted-foreground uppercase tracking-wide py-3">
                                    Super Admins ({superAdmins.length})
                                  </TableCell>
                                </TableRow>
                                {superAdmins.map((user) => (
                                  <UserRow
                                    key={user.user_id}
                                    user={user}
                                    onEdit={handleEditUser}
                                    onToggleStatus={handleToggleUserStatus}
                                    onDelete={handleDeleteUser}
                                  />
                                ))}
                              </>
                            )}

                            {/* Corporate Admins */}
                            {corporateAdmins.length > 0 && (
                              <>
                                <TableRow className="bg-muted/30">
                                  <TableCell colSpan={7} className="font-medium text-sm text-muted-foreground uppercase tracking-wide py-3">
                                    Corporate Admins ({corporateAdmins.length})
                                  </TableCell>
                                </TableRow>
                                {corporateAdmins.map((user) => (
                                  <UserRow
                                    key={user.user_id}
                                    user={user}
                                    onEdit={handleEditUser}
                                    onToggleStatus={handleToggleUserStatus}
                                    onDelete={handleDeleteUser}
                                  />
                                ))}
                              </>
                            )}

                            {/* Program Admins */}
                            {programAdmins.length > 0 && (
                              <>
                                <TableRow className="bg-muted/30">
                                  <TableCell colSpan={7} className="font-medium text-sm text-muted-foreground uppercase tracking-wide py-3">
                                    Program Admins ({programAdmins.length})
                                  </TableCell>
                                </TableRow>
                                {programAdmins.map((user) => (
                                  <UserRow
                                    key={user.user_id}
                                    user={user}
                                    onEdit={handleEditUser}
                                    onToggleStatus={handleToggleUserStatus}
                                    onDelete={handleDeleteUser}
                                  />
                                ))}
                              </>
                            )}

                            {/* Program Users */}
                            {programUsers.length > 0 && (
                              <>
                                <TableRow className="bg-muted/30">
                                  <TableCell colSpan={7} className="font-medium text-sm text-muted-foreground uppercase tracking-wide py-3">
                                    Program Users ({programUsers.length})
                                  </TableCell>
                                </TableRow>
                                {programUsers.map((user) => (
                                  <UserRow
                                    key={user.user_id}
                                    user={user}
                                    onEdit={handleEditUser}
                                    onToggleStatus={handleToggleUserStatus}
                                    onDelete={handleDeleteUser}
                                  />
                                ))}
                              </>
                            )}

                            {/* Drivers */}
                            {drivers.length > 0 && (
                              <>
                                <TableRow className="bg-muted/30">
                                  <TableCell colSpan={7} className="font-medium text-sm text-muted-foreground uppercase tracking-wide py-3">
                                    Drivers ({drivers.length})
                                  </TableCell>
                                </TableRow>
                                {drivers.map((user) => (
                                  <UserRow
                                    key={user.user_id}
                                    user={user}
                                    onEdit={handleEditUser}
                                    onToggleStatus={handleToggleUserStatus}
                                    onDelete={handleDeleteUser}
                                  />
                                ))}
                              </>
                            )}

                            {/* Other Roles */}
                            {otherUsers.length > 0 && (
                              <>
                                <TableRow className="bg-muted/30">
                                  <TableCell colSpan={7} className="font-medium text-sm text-muted-foreground uppercase tracking-wide py-3">
                                    Other ({otherUsers.length})
                                  </TableCell>
                                </TableRow>
                                {otherUsers.map((user) => (
                                  <UserRow
                                    key={user.user_id}
                                    user={user}
                                    onEdit={handleEditUser}
                                    onToggleStatus={handleToggleUserStatus}
                                    onDelete={handleDeleteUser}
                                  />
                                ))}
                              </>
                            )}

                            {/* Empty state */}
                            {groupUsers.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                  No users found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-user_name">Username *</Label>
                  <Input
                    id="edit-user_name"
                    value={selectedUser.user_name}
                    onChange={(e) => setSelectedUser({...selectedUser, user_name: e.target.value})}
                    required
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    required
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-first_name">First Name</Label>
                  <Input
                    id="edit-first_name"
                    value={selectedUser.first_name || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, first_name: e.target.value})}
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-last_name">Last Name</Label>
                  <Input
                    id="edit-last_name"
                    value={selectedUser.last_name || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, last_name: e.target.value})}
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedUser.phone || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role *</Label>
                  <Select 
                    value={selectedUser.role} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                  >
                    <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporate_admin">Corporate Admin</SelectItem>
                      <SelectItem value="program_admin">Program Admin</SelectItem>
                      <SelectItem value="program_user">Program User</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      {user?.role === 'super_admin' && (
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is_active"
                  checked={selectedUser.is_active}
                  onChange={(e) => setSelectedUser({...selectedUser, is_active: e.target.checked})}
                  className="rounded"
                  aria-label="User active status"
                />
                <Label htmlFor="edit-is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                  className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
                  style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
                >
                  {updateUserMutation.isPending ? (
                    <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Updating...</span>
                  ) : (
                    <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Update User</span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// User Row Component
function UserRow({ 
  user, 
  onEdit, 
  onToggleStatus, 
  onDelete 
}: { 
  user: User; 
  onEdit: (user: User) => void; 
  onToggleStatus: (user: User) => void; 
  onDelete: (user: User) => void;
}) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-3">
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.user_name
              }
            </div>
            <div className="text-sm text-muted-foreground">@{user.user_name}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail className="w-3 h-3 mr-1 text-muted-foreground" />
            {user.email}
          </div>
          {user.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="w-3 h-3 mr-1" />
              {user.phone}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge 
          variant="outline" 
          className={roleColors[user.role] || "text-muted-foreground"}
          style={{
            backgroundColor: roleBgColors[user.role] || 'var(--muted)'
          }}
        >
          {roleLabels[user.role] || user.role}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <Building2 className="w-4 h-4 mr-1 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">
              {user.corporate_clients?.name || user.program?.corporateClient?.name || 'No Corporate Client'}
            </div>
            <div className="text-xs text-muted-foreground">
              {user.program?.name || user.primary_program_id || 'No Program'}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={user.is_active ? "default" : "secondary"}>
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(user)}>
              {user.is_active ? (
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
            {isSuperAdmin && (
              <DropdownMenuItem 
                onClick={() => onDelete(user)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

