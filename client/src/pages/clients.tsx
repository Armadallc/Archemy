import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import { usePageAccess } from "../hooks/use-page-access";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Users, Building2, Calendar, UserPlus, UserMinus, Filter, Download, Upload, AlertTriangle, ArrowLeft, User, Heart, Shield, Star, UserCheck } from "lucide-react";
import { PhoneInput } from "../components/ui/phone-input";
import { format, parseISO } from "date-fns";
import { apiRequest } from "../lib/queryClient";
import ExportButton from "../components/export/ExportButton";
import { ComprehensiveClientForm } from "../components/forms/ComprehensiveClientForm";
import { RollbackManager } from "../utils/rollback-manager";

// Zod schema for client validation
const clientFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  phone_type: z.enum(["Mobile", "Home"]).optional(),
  program_id: z.string().min(1, "Program is required"),
  location_id: z.string().optional(),
  is_active: z.boolean().default(true),
  address: z.string().optional(),
  use_location_address: z.boolean().default(false),
  date_of_birth: z.string().optional(),
  birth_sex: z.enum(["Male", "Female"]).optional(),
  age: z.coerce.number().optional().or(z.literal("")),
  race: z.string().optional(),
  avatar_url: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_conditions: z.string().optional(),
  special_requirements: z.string().optional(),
  billing_pin: z.string().optional(),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits").optional(),
  medical_notes: z.string().optional(),
  mobility_requirements: z.string().optional(),
  // New fields for program contacts
  program_contacts: z.array(z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    role: z.string().min(1, "Role is required"),
    phone: z.string().min(1, "Phone is required"),
    is_preferred_poc: z.boolean().default(false),
  })).optional(),
  // New fields for transport requirements
  mobility_requirement_ids: z.array(z.string()).optional(),
  mobility_custom_notes: z.record(z.string()).optional(),
  special_requirement_ids: z.array(z.string()).optional(),
  special_custom_notes: z.record(z.string()).optional(),
  communication_need_ids: z.array(z.string()).optional(),
  communication_custom_notes: z.record(z.string()).optional(),
  preferred_driver_request: z.string().optional(),
  other_preferences: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  program_id: string;
  location_id?: string;
  phone?: string;
  phone_type?: string;
  email?: string;
  address?: string;
  use_location_address?: boolean;
  date_of_birth?: string;
  birth_sex?: string;
  age?: number;
  race?: string;
  avatar_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
  special_requirements?: string;
  billing_pin?: string;
  pin?: string;
  medical_notes?: string;
  mobility_requirements?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data
  program?: {
    id: string;
    name: string;
    short_name?: string;
    corporate_client_id: string;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
  programs?: {
    id: string;
    name: string;
    short_name?: string;
    corporate_client_id: string;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
  location?: {
    id: string;
    name: string;
    address: string;
  };
  locations?: {
    id: string;
    name: string;
    address: string;
  };
}


const initialFormData: ClientFormData = {
  first_name: "",
  last_name: "",
  phone: "",
  phone_type: undefined,
  email: "",
  program_id: "",
  location_id: "",
  is_active: true,
  address: "",
  use_location_address: false,
  date_of_birth: "",
  birth_sex: undefined,
  age: undefined,
  race: "",
  avatar_url: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  medical_conditions: "",
  special_requirements: "",
      billing_pin: "",
      pin: "",
      medical_notes: "",
      mobility_requirements: "",
  program_contacts: [],
  mobility_requirement_ids: [],
  mobility_custom_notes: {},
  special_requirement_ids: [],
  special_custom_notes: {},
  communication_need_ids: [],
  communication_custom_notes: {},
  preferred_driver_request: "",
  other_preferences: "",
};

// Status color definitions
const clientStatusColors = {
  active: "bg-green-50 text-green-700 border-green-200",
  inactive: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  suspended: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function Clients() {
  // Check page access permission
  usePageAccess({ permission: "view_clients" });
  
  // Client management state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  
  // React Hook Form for create client
  const createForm = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialFormData,
  });
  
  // React Hook Form for edit client
  const editForm = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialFormData,
  });
  
  // Client Groups state
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isViewEditMembersDialogOpen, setIsViewEditMembersDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [viewingGroup, setViewingGroup] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, getFilterParams, getPageTitle } = useHierarchy();

  console.log('Selected program from hierarchy:', selectedProgram);

  const [groupFormData, setGroupFormData] = useState({
    name: "",
    description: "",
    selectedClients: [] as string[],
    program_id: selectedProgram || "",
    expiryOption: "never" as "single" | "7days" | "30days" | "never"
  });

  // Get filter parameters based on current hierarchy level
  const filterParams = getFilterParams();

  // Fetch programs based on hierarchy level
  const { data: programs } = useQuery({
    queryKey: ["/api/programs", level, selectedCorporateClient, user?.role, (user as any)?.corporate_client_id],
    queryFn: async () => {
      let endpoint = "/api/programs";
      
      // Get corporate client ID from hierarchy or user object
      const corporateClientId = selectedCorporateClient || (user as any)?.corporate_client_id;
      
      // For corporate_admin, fetch programs by corporate client
      if (user?.role === 'corporate_admin' && corporateClientId) {
        endpoint = `/api/programs/corporate-client/${corporateClientId}`;
      } else if (level === 'client' && corporateClientId) {
        endpoint = `/api/programs/corporate-client/${corporateClientId}`;
      } else if (level === 'program' && selectedProgram) {
        // For program level, still return all programs (or just the selected one)
        endpoint = "/api/programs";
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  // Fetch clients based on current hierarchy level
  const { data: clientsData, isLoading: loadingClients, error: clientsError } = useQuery({
    queryKey: ["/api/clients", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/clients";
      
      // Build endpoint based on hierarchy level
      // Check for program level first (more specific)
      if (level === 'program' && selectedProgram && selectedProgram !== 'undefined' && selectedProgram !== null) {
        endpoint = `/api/clients/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        // Corporate client level - fetch all clients for this corporate client
        endpoint = `/api/clients/corporate-client/${selectedCorporateClient}`;
      } else if (selectedCorporateClient && !selectedProgram) {
        // Fallback: if we have a corporate client but no program, use corporate client endpoint
        endpoint = `/api/clients/corporate-client/${selectedCorporateClient}`;
      }
      
      console.log('🔍 [Clients Query] Fetching clients:', {
        level,
        selectedCorporateClient,
        selectedProgram,
        endpoint
      });
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      
      console.log('🔍 [Clients Query] Response:', {
        endpoint,
        dataLength: Array.isArray(data) ? data.length : 'not array',
        data: data
      });
      
      return data;
    },
    enabled: true,
  });

  // Ensure clients is always an array
  const clients = Array.isArray(clientsData) ? clientsData : [];
  
  // Debug log to see the data structure
  console.log('🔍 Clients data:', clients);
  if (clients.length > 0) {
    console.log('🔍 First client structure:', clients[0]);
    console.log('🔍 First client program:', clients[0].program);
    console.log('🔍 First client programs:', clients[0].programs);
    console.log('🔍 First client location_id:', clients[0].location_id);
    console.log('🔍 First client location:', clients[0].location);
    console.log('🔍 First client locations:', clients[0].locations);
  }

  // Watch the selected program from the form to refetch locations
  const formProgramId = createForm.watch("program_id");
  // Use editingClient's program_id if available (for edit form), otherwise use form or hierarchy
  const effectiveProgramId = editingClient?.program_id || formProgramId || selectedProgram;

  // Fetch locations for the dropdown
  const { data: locationsData, error: locationsError } = useQuery({
    queryKey: ["/api/locations", effectiveProgramId, level, selectedCorporateClient, user?.role, (user as any)?.corporate_client_id],
    queryFn: async () => {
      let endpoint = "/api/locations";
      
      // Get corporate client ID from hierarchy or user object
      const corporateClientId = selectedCorporateClient || (user as any)?.corporate_client_id;
      
      // If a program is selected (from form or hierarchy), fetch locations for that program
      if (effectiveProgramId) {
        endpoint = `/api/locations/program/${effectiveProgramId}`;
      } else if (level === 'program' && selectedProgram) {
        endpoint = `/api/locations/program/${selectedProgram}`;
      } else if (user?.role === 'corporate_admin' && corporateClientId) {
        endpoint = `/api/locations/corporate-client/${corporateClientId}`;
      } else if (level === 'client' && corporateClientId) {
        endpoint = `/api/locations/corporate-client/${corporateClientId}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  // Ensure locations is always an array
  const locations = Array.isArray(locationsData) ? locationsData : [];

  // Fetch client groups
  const { data: clientGroupsData } = useQuery({
    queryKey: ["/api/clients/groups", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/clients/groups";
      
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/clients/groups/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/clients/groups/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  const clientGroups = Array.isArray(clientGroupsData) ? clientGroupsData : [];

  // Calculate statistics
  const activeClients = clients.filter((client: Client) => client.is_active).length;
  const totalClients = clients.length;
  const recentClients = clients.filter((client: Client) => 
    new Date(client.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  // Enhanced status color system using HALCYON CSS variables
  const getStatusColor = (status: string): React.CSSProperties => {
    switch (status) {
      case 'active': 
        return {
          backgroundColor: 'rgba(51, 204, 173, 0.15)',
          color: 'var(--completed)',
          borderColor: 'var(--completed)',
          borderWidth: '1px',
          borderStyle: 'solid'
        };
      case 'inactive': 
        return {
          backgroundColor: 'rgba(204, 88, 51, 0.15)',
          color: 'var(--destructive)',
          borderColor: 'var(--destructive)',
          borderWidth: '1px',
          borderStyle: 'solid'
        };
      case 'pending': 
        return {
          backgroundColor: 'rgba(255, 193, 7, 0.15)',
          color: 'var(--scheduled)',
          borderColor: 'var(--scheduled)',
          borderWidth: '1px',
          borderStyle: 'solid'
        };
      case 'suspended': 
        return {
          backgroundColor: 'rgba(255, 152, 0, 0.15)',
          color: 'var(--in-progress)',
          borderColor: 'var(--in-progress)',
          borderWidth: '1px',
          borderStyle: 'solid'
        };
      default: 
        return {
          backgroundColor: 'var(--muted)',
          color: 'var(--muted-foreground)',
          borderColor: 'var(--border)',
          borderWidth: '1px',
          borderStyle: 'solid'
        };
    }
  };

  // Enhanced status badge helper function
  const getStatusBadge = (isActive: boolean) => {
    const status = isActive ? 'active' : 'inactive';
    return (
      <Badge 
        className="text-xs px-2 py-1 rounded-full font-medium"
        style={getStatusColor(status)}
      >
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientData: ClientFormData) => {
      const apiData = {
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        program_id: clientData.program_id || selectedProgram || '',
        location_id: clientData.location_id || undefined,
        phone: clientData.phone || undefined,
        email: clientData.email || undefined,
        address: clientData.address || undefined,
        date_of_birth: clientData.date_of_birth || undefined,
        emergency_contact_name: clientData.emergency_contact_name || undefined,
        emergency_contact_phone: clientData.emergency_contact_phone || undefined,
        medical_conditions: clientData.medical_conditions || undefined,
        special_requirements: clientData.special_requirements || undefined,
        billing_pin: clientData.billing_pin || undefined,
        pin: clientData.pin || undefined,
        is_active: true,
        // Include program contacts if provided
        program_contacts: clientData.program_contacts && clientData.program_contacts.length > 0 
          ? clientData.program_contacts.filter(contact => 
              contact.first_name && contact.last_name && contact.role && contact.phone
            )
          : undefined
      };
      console.log('🔍 Creating client with data:', apiData);
      const response = await apiRequest("POST", "/api/clients", apiData);
      console.log('🔍 Client creation response:', response);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Client Created",
        description: "Client has been successfully created.",
      });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      createForm.reset();
      // Invalidate all client queries to ensure the new client appears
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      // Also invalidate the specific query with hierarchy parameters
      queryClient.invalidateQueries({ 
        queryKey: ["/api/clients", level, selectedCorporateClient, selectedProgram] 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<ClientFormData> }) => {
      const updates = { ...data.updates };
      return apiRequest("PATCH", `/api/clients/${data.id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Client Updated",
        description: "Client has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setEditingClient(null);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      toast({
        title: "Client Deleted",
        description: "Client has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cleanup duplicates mutation
  const cleanupDuplicatesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/clients/cleanup-duplicates`);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Cleanup Complete",
        description: `Deleted ${data.deletedCount || 0} duplicate clients. ${data.remainingCount || 0} clients remain.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cleanup duplicates. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ============================================================================
  // CLIENT GROUP MUTATIONS
  // ============================================================================

  // Create client group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description: string; selectedClients: string[]; program_id?: string }) => {
      const apiPayload = {
        name: groupData.name,
        description: groupData.description,
        program_id: groupData.program_id || selectedProgram || programs?.[0]?.id || 'monarch_competency',
        is_active: true
      };
      console.log('API payload:', apiPayload);
      const response = await apiRequest("POST", "/api/client-groups", apiPayload);
      const group = await response.json();
      
      // Add members to group
      if (groupData.selectedClients.length > 0) {
        await Promise.all(groupData.selectedClients.map(clientId => 
          apiRequest("POST", "/api/client-group-memberships", {
            client_id: clientId,
            client_group_id: group.id
          })
        ));
      }
      
      return group;
    },
    onSuccess: () => {
      // Invalidate all client groups queries (with and without parameters)
      // Use predicate to match all queries that start with the key
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === "/api/clients/groups" || key === "/api/client-groups";
        }
      });
      setIsCreateGroupDialogOpen(false);
      setGroupFormData({ name: "", description: "", selectedClients: [], program_id: selectedProgram || "", expiryOption: "never" });
      toast({ 
        title: "Group Created", 
        description: "Client group created successfully" 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create client group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update client group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      return apiRequest("PATCH", `/api/client-groups/${data.id}`, data.updates);
    },
    onSuccess: () => {
      // Invalidate all client groups queries (with and without parameters)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === "/api/clients/groups" || key === "/api/client-groups";
        }
      });
      setIsEditGroupDialogOpen(false);
      setEditingGroup(null);
      setGroupFormData({ name: "", description: "", selectedClients: [], program_id: selectedProgram || "", expiryOption: "never" });
      toast({ 
        title: "Group Updated", 
        description: "Client group updated successfully" 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete client group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest("DELETE", `/api/client-groups/${groupId}`);
    },
    onSuccess: () => {
      // Invalidate all client groups queries (with and without parameters)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === "/api/clients/groups" || key === "/api/client-groups";
        }
      });
      toast({
        title: "Group Deleted",
        description: "Client group deleted successfully" 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add member to group mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, clientId }: { groupId: string; clientId: string }) => {
      return apiRequest("POST", "/api/client-group-memberships", {
        groupId: groupId,
        clientId: clientId
      });
    },
    onSuccess: () => {
      // Invalidate all client groups queries (with and without parameters)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === "/api/clients/groups" || key === "/api/client-groups";
        }
      });
      // Refresh group members list
      if (viewingGroup) {
        const fetchMembers = async () => {
          try {
            const response = await apiRequest("GET", `/api/client-group-memberships/${viewingGroup.id}`);
            const members = await response.json();
            setGroupMembers(members || []);
          } catch (error) {
            console.error("Error fetching group members:", error);
          }
        };
        fetchMembers();
      }
      toast({ 
        title: "Member Added", 
        description: "Client added to group successfully" 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add client to group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove member from group mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      return apiRequest("DELETE", `/api/client-group-memberships/${membershipId}`);
    },
    onSuccess: () => {
      // Invalidate all client groups queries (with and without parameters)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === "/api/clients/groups" || key === "/api/client-groups";
        }
      });
      // Refresh group members list
      if (viewingGroup) {
        const fetchMembers = async () => {
          try {
            const response = await apiRequest("GET", `/api/client-group-memberships/${viewingGroup.id}`);
            const members = await response.json();
            setGroupMembers(members || []);
          } catch (error) {
            console.error("Error fetching group members:", error);
          }
        };
        fetchMembers();
      }
      toast({ 
        title: "Member Removed", 
        description: "Client removed from group successfully" 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove client from group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ============================================================================
  // CLIENT GROUP FORM HANDLERS
  // ============================================================================

  // Update group form data when selected program changes
  useEffect(() => {
    setGroupFormData(prev => ({
      ...prev,
      program_id: selectedProgram || ""
    }));
  }, [selectedProgram]);

  // Create group form handler
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupFormData.name.trim() && !createGroupMutation.isPending) {
      console.log('Creating group with data:', groupFormData);
      console.log('Selected program:', selectedProgram);
      createGroupMutation.mutate(groupFormData);
    }
  };

  // Update group form handler
  const handleUpdateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateGroupMutation.mutate({
        id: editingGroup.id,
        updates: groupFormData
      });
    }
  };

  // Delete group handler
  const handleDeleteGroup = (groupId: string) => {
    deleteGroupMutation.mutate(groupId);
  };

  // Add member to group handler
  const handleAddMember = (groupId: string, clientId: string) => {
    addMemberMutation.mutate({ groupId, clientId });
  };

  // Remove member from group handler
  const handleRemoveMember = (membershipId: string) => {
    removeMemberMutation.mutate(membershipId);
  };

  // Load group members when dialog opens
  useEffect(() => {
    if (isViewEditMembersDialogOpen && viewingGroup) {
      // Fetch group members from API
      const fetchMembers = async () => {
        setIsLoadingMembers(true);
        try {
          console.log('Fetching members for group:', viewingGroup.id);
          const response = await apiRequest("GET", `/api/client-group-memberships/${viewingGroup.id}`);
          const members = await response.json();
          console.log('Fetched members:', members);
          setGroupMembers(members || []);
        } catch (error) {
          console.error("Error fetching group members:", error);
          setGroupMembers([]);
        } finally {
          setIsLoadingMembers(false);
        }
      };
      fetchMembers();
    } else {
      // Clear members when dialog closes
      setGroupMembers([]);
      setIsLoadingMembers(false);
    }
  }, [isViewEditMembersDialogOpen, viewingGroup]);

  const handleCreateClient = (data: ClientFormData) => {
    console.log('🔍 handleCreateClient called with data:', data);
    const finalFormData = {
      ...data,
      program_id: data.program_id || selectedProgram || ''
    };
    console.log('🔍 Final form data:', finalFormData);
    createClientMutation.mutate(finalFormData);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation for updates
    if (!formData.first_name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the client's first name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.last_name.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter the client's last name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.program_id) {
      toast({
        title: "Missing Information",
        description: "Please select a program for this client.",
        variant: "destructive",
      });
      return;
    }
    
    if (editingClient) {
      // Define valid client table fields (from database schema)
      const validClientFields = [
        'first_name', 'last_name', 'program_id', 'location_id',
        'phone', 'phone_type', 'email', 'address', 'use_location_address',
        'date_of_birth', 'birth_sex', 'age', 'race', 'avatar_url',
        'emergency_contact_name', 'emergency_contact_phone',
        'medical_conditions', 'special_requirements', 'billing_pin', 'pin',
        'medical_notes', 'mobility_requirements', 'is_active'
      ];
      
      // Clean up form data: only include valid database fields
      const cleanedUpdates: any = {};
      Object.keys(formData).forEach((key) => {
        // Only include fields that exist in the database schema
        if (!validClientFields.includes(key)) {
          return; // Skip fields like program_contacts, mobility_requirement_ids, etc.
        }
        
        const value = (formData as any)[key];
        // Special handling for PIN - always include if provided (even if empty string, we want to allow clearing it)
        if (key === 'pin') {
          if (value !== undefined && value !== null && value !== '') {
            cleanedUpdates[key] = value;
          }
          return; // Skip the rest of the logic for PIN
        }
        // Keep boolean false, numbers, and non-empty strings
        if (value !== undefined && value !== null && value !== '') {
          cleanedUpdates[key] = value;
        } else if (typeof value === 'boolean') {
          // Keep boolean values even if false
          cleanedUpdates[key] = value;
        } else if (typeof value === 'number') {
          // Keep number values even if 0
          cleanedUpdates[key] = value;
        }
      });
      
      // Ensure program_id is always included if it exists
      if (formData.program_id) {
        cleanedUpdates.program_id = formData.program_id;
      }
      
      console.log('🔍 Sending client update:', cleanedUpdates);
      console.log('🔍 PIN in updates:', cleanedUpdates.pin ? 'YES' : 'NO');
      
      updateClientMutation.mutate({
        id: editingClient.id,
        updates: cleanedUpdates,
      });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone || "",
      phone_type: client.phone_type as "Mobile" | "Home" | undefined,
      email: client.email || "",
      program_id: client.program_id,
      location_id: client.location_id || "",
      address: client.address || "",
      use_location_address: client.use_location_address || false,
      date_of_birth: client.date_of_birth || "",
      birth_sex: client.birth_sex as "Male" | "Female" | undefined,
      age: client.age,
      race: client.race || "",
      avatar_url: client.avatar_url || "",
      emergency_contact_name: client.emergency_contact_name || "",
      emergency_contact_phone: client.emergency_contact_phone || "",
      medical_conditions: client.medical_conditions || "",
      special_requirements: client.special_requirements || "",
      billing_pin: client.billing_pin || "",
      pin: "", // PIN is not stored in plain text, so we leave it empty for editing
      medical_notes: client.medical_notes || "",
      mobility_requirements: client.mobility_requirements || "",
      is_active: client.is_active,
      program_contacts: [],
      mobility_requirement_ids: [],
      mobility_custom_notes: {},
      special_requirement_ids: [],
      special_custom_notes: {},
      communication_need_ids: [],
      communication_custom_notes: {},
      preferred_driver_request: "",
      other_preferences: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClientMutation.mutate(clientId);
  };

  // Filter clients based on search term and selected location
  const filteredClients = clients.filter((client) => {
    const matchesSearch = `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = selectedLocation === "all" || client.location_id === selectedLocation;
    
    return matchesSearch && matchesLocation;
  });

  if (loadingClients) {
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
    <div className="space-y-6 p-6">
      {/* Header - Only show if unified header is disabled (fallback) */}
      {!RollbackManager.isUnifiedHeaderEnabled() && (
        <div>
          <div className="px-6 py-6 rounded-lg border backdrop-blur-md shadow-xl flex items-center justify-between" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', height: '150px' }}>
            <div>
              <h1 
                className="font-bold text-foreground" 
                style={{ 
                  fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                  fontSize: '110px'
                }}
              >
                clients.
              </h1>
            </div>
          <div className="flex space-x-2">
          <ExportButton
            data={filteredClients}
            columns={[
              { key: 'id', label: 'Client ID' },
              { key: 'name', label: 'Name', formatter: (client) => `${client.first_name} ${client.last_name}` },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'address', label: 'Address' },
              { key: 'is_active', label: 'Status', formatter: (value) => value ? 'Active' : 'Inactive' },
              { key: 'emergency_contact_name', label: 'Emergency Contact' },
              { key: 'emergency_contact_phone', label: 'Emergency Phone' },
              { key: 'created_at', label: 'Created', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '' }
            ]}
            filename={`clients-${format(new Date(), 'yyyy-MM-dd')}`}
            onExportStart={() => console.log('Starting client export...')}
            onExportComplete={() => console.log('Client export completed!')}
            onExportError={(error) => console.error('Client export failed:', error)}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Cleanup Duplicates
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clean Up Duplicate Clients</AlertDialogTitle>
                <AlertDialogDescription>
                  This will automatically delete duplicate clients based on matching first and last names. 
                  For each set of duplicates, the oldest client will be kept and the rest will be deleted.
                  <br /><br />
                  <strong>This action cannot be undone.</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => cleanupDuplicatesMutation.mutate()}
                  disabled={cleanupDuplicatesMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {cleanupDuplicatesMutation.isPending ? "Cleaning..." : "Cleanup Duplicates"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          </div>
        </div>
      </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{activeClients}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Currently active</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{totalClients}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>All clients</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm" style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{recentClients}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Added this week</p>
          </CardContent>
        </Card>
        
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* TOP PANEL: Clients List */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Clients Directory
              </CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="text-white"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--color-aqua)', borderWidth: '1px', borderColor: 'var(--border)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardHeader>
        </Card>
        
        {/* BOTTOM PANEL: Client Groups - moved outside for now */}
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location: any) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {filteredClients.length} clients
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto">
          {loadingClients ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : clientsError ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Clients</h3>
              <p className="text-red-600 mb-4">{clientsError.message}</p>
              <p className="text-gray-600 mb-4">Please check your connection and try again.</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : filteredClients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No clients found</p>
                <p className="text-sm">Add clients to start managing your directory</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ backgroundColor: 'var(--muted)' }}>
                      <TableHead className="font-semibold">Client</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Program</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Medical Info</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">{client.first_name} {client.last_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--blue-9)' }}></div>
                              <span className="truncate max-w-32">ID: {client.id.slice(-8)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="truncate max-w-32">{client.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{client.programs?.short_name || client.programs?.name || client.program?.short_name || client.program?.name || 'Unknown'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{client.locations?.name || client.location?.name || 'Not assigned'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(client.is_active)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {client.emergency_contact_name && (
                              <Badge 
                                className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{
                                  backgroundColor: 'rgba(137, 51, 204, 0.15)',
                                  color: 'var(--chart-2)',
                                  borderColor: 'var(--chart-2)',
                                  borderWidth: '1px',
                                  borderStyle: 'solid'
                                }}
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                Emergency
                              </Badge>
                            )}
                            {client.medical_conditions && (
                              <Badge 
                                className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{
                                  backgroundColor: 'rgba(204, 88, 51, 0.15)',
                                  color: 'var(--destructive)',
                                  borderColor: 'var(--destructive)',
                                  borderWidth: '1px',
                                  borderStyle: 'solid'
                                }}
                              >
                                <Heart className="w-3 h-3 mr-1" />
                                Medical
                              </Badge>
                            )}
                            {client.special_requirements && (
                              <Badge 
                                className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{
                                  backgroundColor: 'rgba(204, 51, 171, 0.15)',
                                  color: 'var(--primary)',
                                  borderColor: 'var(--primary)',
                                  borderWidth: '1px',
                                  borderStyle: 'solid'
                                }}
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Special
                              </Badge>
                            )}
                            {client.mobility_requirements && (
                              <Badge 
                                className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{
                                  backgroundColor: 'rgba(51, 204, 173, 0.15)',
                                  color: 'var(--accent)',
                                  borderColor: 'var(--accent)',
                                  borderWidth: '1px',
                                  borderStyle: 'solid'
                                }}
                              >
                                <Star className="w-3 h-3 mr-1" />
                                Mobility
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {format(parseISO(client.created_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {client.is_active && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                                onClick={() => {
                                  // Quick action for active clients
                                  toast({
                                    title: "Quick Action",
                                    description: `Quick action performed for ${client.first_name} ${client.last_name}`,
                                  });
                                }}
                                title="Quick Action"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditClient(client)}
                              title="Edit Client"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete Client"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Client</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {client.first_name} {client.last_name}? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteClient(client.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Two-Panel Layout - Client Groups */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        {/* BOTTOM PANEL: Client Groups */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Client Groups
              </CardTitle>
              <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Organize clients into groups for easier management and group trips
            </p>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto">
                  {clientGroups.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No client groups yet</h3>
                      <p className="text-sm mb-4">Create groups to organize clients for group trips</p>
                      <Button 
                        onClick={() => setIsCreateGroupDialogOpen(true)}
                        className="text-white"
                        style={{ backgroundColor: 'var(--primary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--primary)';
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--primary)';
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Group
                      </Button>
                    </div>
            ) : (
                    <div className="space-y-4">
                      {clientGroups.map((group: any) => (
                        <div key={group.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-200" style={{ '--hover-bg': 'var(--muted)' } as React.CSSProperties} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600">{group.description}</p>
                      </div>
                      <Badge variant="outline">{group.member_count ?? 0} members</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Program: {group.programs?.name || 'Unknown'}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewingGroup(group);
                            setIsViewEditMembersDialogOpen(true);
                          }}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Members
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingGroup(group);
                            setGroupFormData({
                              name: group.name,
                              description: group.description || "",
                              selectedClients: [],
                              program_id: selectedProgram || "",
                              expiryOption: "never"
                            });
                            setIsEditGroupDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Group</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the group "{group.name}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteGroup(group.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Client Group Dialog */}
      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Create Client Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                value={groupFormData.name}
                onChange={(e) => setGroupFormData({...groupFormData, name: e.target.value})}
                placeholder="Enter group name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                value={groupFormData.description}
                onChange={(e) => setGroupFormData({...groupFormData, description: e.target.value})}
                placeholder="Enter group description"
                rows={3}
              />
            </div>
            
            <div>
              <Label>Select Clients</Label>
              <p className="text-sm text-gray-600 mb-3">
                Choose clients to include in this group ({groupFormData.selectedClients.length} selected)
              </p>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-2 p-2 rounded" style={{ '--hover-bg': 'var(--muted)' } as React.CSSProperties} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <input
                      type="checkbox"
                      id={`client-${client.id}`}
                      checked={groupFormData.selectedClients.includes(client.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGroupFormData({
                            ...groupFormData,
                            selectedClients: [...groupFormData.selectedClients, client.id]
                          });
                        } else {
                          setGroupFormData({
                            ...groupFormData,
                            selectedClients: groupFormData.selectedClients.filter(id => id !== client.id)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`client-${client.id}`} className="flex-1 cursor-pointer text-sm">
                      <span className="font-medium">{client.first_name} {client.last_name}</span>
                      {client.location && (
                        <span className="text-gray-500 ml-2">({client.location.name})</span>
                      )}
                      {client.phone && (
                        <span className="text-gray-500 ml-2">• {client.phone}</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateGroupDialogOpen(false);
                  setGroupFormData({
                    name: "",
                    description: "",
                    selectedClients: [],
                    program_id: selectedProgram || "",
                    expiryOption: "never"
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="text-white"
                style={{ backgroundColor: 'var(--primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.opacity = '1';
                }}
                disabled={!groupFormData.name.trim()}
              >
                Create Group
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateGroup} className="space-y-4">
            <div>
              <Label htmlFor="edit-group-name">Group Name *</Label>
              <Input
                id="edit-group-name"
                value={groupFormData.name}
                onChange={(e) => setGroupFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-group-description">Description</Label>
              <Textarea
                id="edit-group-description"
                value={groupFormData.description}
                onChange={(e) => setGroupFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter group description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setIsEditGroupDialogOpen(false);
                  setEditingGroup(null);
                  setGroupFormData({
                    name: "",
                    description: "",
                    selectedClients: [],
                    program_id: selectedProgram || "",
                    expiryOption: "never"
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="text-white"
                style={{ backgroundColor: 'var(--primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.opacity = '1';
                }}
                disabled={!groupFormData.name.trim()}
              >
                Update Group
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View/Edit Group Members Dialog */}
      <Dialog open={isViewEditMembersDialogOpen} onOpenChange={setIsViewEditMembersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Group Members: {viewingGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Members */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Current Members {isLoadingMembers ? '(Loading...)' : `(${groupMembers.length})`}
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isLoadingMembers ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading members...</span>
                  </div>
                ) : groupMembers.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No members in this group</p>
                ) : (
                  groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {member.clients?.first_name?.[0]}{member.clients?.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.clients?.first_name} {member.clients?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{member.clients?.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add New Members - Only show when not loading */}
            {!isLoadingMembers && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Members</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clients
                  .filter(client => !groupMembers.some(member => member.client_id === client.id))
                  .map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {client.first_name?.[0]}{client.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {client.first_name} {client.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{client.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMember(viewingGroup.id, client.id)}
                        className="transition-colors"
                        style={{ color: 'var(--primary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--primary)';
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--primary)';
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsViewEditMembersDialogOpen(false);
                setViewingGroup(null);
                setGroupMembers([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Save changes - refresh the group data
                // Invalidate all client groups queries (with and without parameters)
                queryClient.invalidateQueries({ 
                  predicate: (query) => {
                    const key = query.queryKey[0];
                    return key === "/api/clients/groups" || key === "/api/client-groups";
                  }
                });
                setIsViewEditMembersDialogOpen(false);
                setViewingGroup(null);
                setGroupMembers([]);
                toast({ 
                  title: "Changes Saved", 
                  description: "Group members updated successfully" 
                });
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Client Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)' }}>
          <DialogHeader style={{ backgroundColor: 'var(--card)' }}>
            <DialogTitle className="uppercase font-semibold" style={{ fontFamily: 'Nohemi', fontWeight: 600, color: 'var(--foreground)' }}>ADD NEW CLIENT</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={(e) => {
              e.preventDefault();
              console.log('🔍 Form submitted, form data:', createForm.getValues());
              createForm.handleSubmit(handleCreateClient)(e);
            }} className="space-y-6" style={{ backgroundColor: 'var(--card)' }}>
            <ComprehensiveClientForm 
              createForm={createForm}
              programs={programs || []}
              locations={locations || []}
              selectedProgram={selectedProgram}
            />

            <div className="flex justify-end space-x-2 pt-4" style={{ backgroundColor: 'var(--card)' }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                style={{ 
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  borderColor: 'var(--border)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card)'}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createClientMutation.isPending}
                className="text-white"
                style={{ backgroundColor: 'var(--primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {createClientMutation.isPending ? "Creating..." : "Create Client"}
              </Button>
            </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-first_name" className="text-sm font-medium">First Name *</Label>
                <Input
                  id="edit-first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="Enter first name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-last_name" className="text-sm font-medium">Last Name *</Label>
                <Input
                  id="edit-last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Enter last name"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <PhoneInput
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(value) => setFormData({...formData, phone: value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date_of_birth">Date of Birth</Label>
                <Input
                  id="edit-date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-billing_pin">Billing PIN</Label>
                <Input
                  id="edit-billing_pin"
                  value={formData.billing_pin}
                  onChange={(e) => setFormData({...formData, billing_pin: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-pin">4-Digit PIN (for notifications)</Label>
              <Input
                id="edit-pin"
                type="text"
                maxLength={4}
                value={formData.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                  if (value.length <= 4) {
                    setFormData({...formData, pin: value});
                  }
                }}
                placeholder="1111"
              />
              <p className="text-xs text-gray-500 mt-1">Give this PIN to the client for notification signup</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="edit-emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-emergency_contact_phone">Emergency Contact Phone</Label>
                <PhoneInput
                  id="edit-emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(value) => setFormData({...formData, emergency_contact_phone: value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-medical_conditions">Medical Conditions</Label>
              <Textarea
                id="edit-medical_conditions"
                value={formData.medical_conditions}
                onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-special_requirements">Special Requirements</Label>
              <Textarea
                id="edit-special_requirements"
                value={formData.special_requirements}
                onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                placeholder="Accessibility needs, special equipment, etc."
              />
            </div>

            <div>
              <Label htmlFor="edit-medical_notes">Trip Notes</Label>
              <Textarea
                id="edit-medical_notes"
                value={formData.medical_notes}
                onChange={(e) => setFormData({...formData, medical_notes: e.target.value})}
                placeholder="Notes for drivers about this client (pickup instructions, special needs, etc.)"
              />
            </div>

            <div>
              <Label htmlFor="edit-mobility_requirements">Mobility Requirements</Label>
              <Textarea
                id="edit-mobility_requirements"
                value={formData.mobility_requirements}
                onChange={(e) => setFormData({...formData, mobility_requirements: e.target.value})}
                placeholder="Wheelchair, walker, assistance needed, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-location_id">Location</Label>
                <Select 
                  value={formData.location_id} 
                  onValueChange={(value) => setFormData({...formData, location_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-program_id">Program</Label>
                <Select 
                  value={formData.program_id} 
                  onValueChange={(value) => setFormData({...formData, program_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs?.map((program: any) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name} ({program.corporateClient?.name || 'Unknown Client'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingClient(null);
                  setFormData(initialFormData);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateClientMutation.isPending}
                className="text-white"
                style={{ backgroundColor: 'var(--primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {updateClientMutation.isPending ? "Updating..." : "Update Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}