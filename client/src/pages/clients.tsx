import React, { useState, useEffect, useMemo } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import { usePageAccess } from "../hooks/use-page-access";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Users, Building2, Calendar, UserPlus, UserMinus, Filter, Download, Upload, AlertTriangle, ArrowLeft, User, Heart, Shield, Star, UserCheck, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { PhoneInput } from "../components/ui/phone-input";
import { format, parseISO } from "date-fns";
import { apiRequest } from "../lib/queryClient";
import ExportButton from "../components/export/ExportButton";
import { ComprehensiveClientForm } from "../components/forms/ComprehensiveClientForm";
import { RollbackManager } from "../utils/rollback-manager";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";
import { ClientImportDialog } from "../components/import/ClientImportDialog";

// Zod schema for client validation
const clientFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  phone_type: z.enum(["Mobile", "Home"]).optional(),
  corporate_client_id: z.string().optional(), // Optional - only required in Global View
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
  corporate_client_id: "",
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
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set()); // Track expanded clients
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Track expanded client groups
  const [sortColumn, setSortColumn] = useState<string | null>(null); // Column to sort by
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sort direction
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<Client[][]>([]);
  const [selectedDuplicateClients, setSelectedDuplicateClients] = useState<Set<string>>(new Set());
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
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
  const { level, selectedCorporateClient, selectedProgram, activeScope, getFilterParams, getPageTitle } = useHierarchy();

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
      // Validate tenant selection in Global View
      const isGlobalView = activeScope === 'global' || (level === 'corporate' && !selectedCorporateClient);
      if (user?.role === 'super_admin' && isGlobalView && !clientData.corporate_client_id) {
        throw new Error('Please select a tenant/corporate client before creating a client.');
      }
      
      const apiData = {
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        // Note: corporate_client_id is not sent to API - it's determined by program_id
        // But we validate it here to ensure proper tenant selection
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

  // Merge clients mutation
  const mergeClientsMutation = useMutation({
    mutationFn: async ({ primaryClientId, secondaryClientIds }: { primaryClientId: string; secondaryClientIds: string[] }) => {
      const response = await apiRequest("POST", `/api/clients/merge`, {
        primaryClientId,
        secondaryClientIds
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to merge clients");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Clients Merged Successfully",
        description: `Merged ${data.mergedCount} client(s) into primary client. ${data.tripsTransferred || 0} trips and ${data.membershipsTransferred || 0} group memberships transferred.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDuplicateDialogOpen(false);
      setSelectedDuplicateClients(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Merge Failed",
        description: error.message || "Failed to merge clients. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk delete clients mutation
  const bulkDeleteClientsMutation = useMutation({
    mutationFn: async (clientIds: string[]) => {
      const response = await apiRequest("POST", `/api/clients/bulk-delete`, { clientIds });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete clients");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Clients Deleted Successfully",
        description: `Deleted ${data.deletedCount} client(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDuplicateDialogOpen(false);
      setSelectedDuplicateClients(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete clients. Please try again.",
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
            groupId: group.id,
            clientId: clientId
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

  // Sort clients based on selected column and direction
  const sortedClients = useMemo(() => {
    if (!sortColumn) return filteredClients;

    const sorted = [...filteredClients].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'scid':
          aValue = a.scid || '';
          bValue = b.scid || '';
          break;
        case 'name':
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim();
          break;
        case 'tenant':
          aValue = a.programs?.corporateClient?.name || a.program?.corporateClient?.name || '';
          bValue = b.programs?.corporateClient?.name || b.program?.corporateClient?.name || '';
          break;
        case 'program':
          aValue = a.programs?.short_name || a.programs?.name || a.program?.short_name || a.program?.name || '';
          bValue = b.programs?.short_name || b.programs?.name || b.program?.short_name || b.program?.name || '';
          break;
        case 'location':
          aValue = a.locations?.name || a.location?.name || '';
          bValue = b.locations?.name || b.location?.name || '';
          break;
        case 'contact':
          // Combine phone and email for sorting
          aValue = `${a.phone || ''} ${a.email || ''}`.trim();
          bValue = `${b.phone || ''} ${b.email || ''}`.trim();
          break;
        case 'status':
          aValue = a.is_active ? 'active' : 'inactive';
          bValue = b.is_active ? 'active' : 'inactive';
          break;
        default:
          return 0;
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredClients, sortColumn, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort icon for column header
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Expand/Collapse all functions
  const expandAllClients = () => {
    setExpandedClients(new Set(sortedClients.map(c => c.id)));
  };

  const collapseAllClients = () => {
    setExpandedClients(new Set());
  };

  const areAllExpanded = sortedClients.length > 0 && expandedClients.size === sortedClients.length;
  const areAllCollapsed = expandedClients.size === 0;

  // Find duplicate clients based on first_name and last_name
  const findDuplicates = useMemo(() => {
    const nameMap = new Map<string, Client[]>();
    
    sortedClients.forEach(client => {
      const key = `${client.first_name?.toLowerCase().trim()}_${client.last_name?.toLowerCase().trim()}`;
      if (!nameMap.has(key)) {
        nameMap.set(key, []);
      }
      nameMap.get(key)!.push(client);
    });
    
    // Filter to only groups with 2+ clients
    const duplicates: Client[][] = [];
    nameMap.forEach((clients) => {
      if (clients.length > 1) {
        duplicates.push(clients);
      }
    });
    
    return duplicates;
  }, [sortedClients]);

  // Function to open duplicate dialog
  const handleOpenDuplicateDialog = () => {
    setDuplicateGroups(findDuplicates);
    setSelectedDuplicateClients(new Set());
    setIsDuplicateDialogOpen(true);
  };

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
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header - Only show if unified header is disabled (fallback) */}
      {!RollbackManager.isUnifiedHeaderEnabled() && (
        <div>
          <div className="px-6 py-6 rounded-lg card-neu card-glow-border flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px' }}>
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
            <div className="flex items-center gap-3">
              {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
                <HeaderScopeSelector />
              )}
              <div className="flex space-x-2">
                <ExportButton
                  data={sortedClients}
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
              </div>
          <Button 
            variant="outline" 
            className="card-neu-flat hover:card-neu [&]:shadow-none" 
            style={{ 
              backgroundColor: 'var(--background)', 
              border: 'none', 
              boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)',
              color: '#ff8475',
              fontWeight: 400
            }}
            onClick={handleOpenDuplicateDialog}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Duplicates {findDuplicates.length > 0 && `(${findDuplicates.length})`}
          </Button>
          
          <Button 
            variant="outline" 
            className="card-neu-flat hover:card-neu [&]:shadow-none" 
            style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          </div>
        </div>
      </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{activeClients}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Currently active</p>
          </CardContent>
        </Card>
        
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{totalClients}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>All clients</p>
          </CardContent>
        </Card>
        
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
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
        <Card className="flex flex-col card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardHeader className="flex-shrink-0 card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center" style={{ fontSize: '26px', fontWeight: 400 }}>
                CLIENT DIRECTORY
              </CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2 card-neu hover:card-neu [&]:shadow-none"
                    style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
                  >
                    <Plus className="w-4 h-4" style={{ textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)' }} />
                    <span style={{ textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)' }}>Add Client</span>
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardHeader>
        </Card>
        
        {/* BOTTOM PANEL: Client Groups - moved outside for now */}
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search bar - flexes to fill remaining space */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8475]"
                  style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            {/* Right side: Filters, Sort By, Expand All */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40 card-neu-flat hover:card-neu [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectItem value="all" className="hover:card-neu-flat">All Locations</SelectItem>
                  {locations.map((location: any) => (
                    <SelectItem key={location.id} value={location.id} className="hover:card-neu-flat">
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Expand All/Collapse All Button */}
              <Button
                variant="outline"
                size="sm"
                className="card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
                onClick={areAllExpanded ? collapseAllClients : expandAllClients}
                title={areAllExpanded ? "Collapse all clients" : "Expand all clients"}
              >
                {areAllExpanded ? (
                  <>
                    <ChevronsUpDown className="h-4 w-4 mr-1" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronsDownUp className="h-4 w-4 mr-1" />
                    Expand All
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
          </div>
        </CardContent>
      </Card>
        
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-0">
            {loadingClients ? (
              <div className="space-y-4 p-6">
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
              <div className="text-center py-12 p-6">
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
            ) : sortedClients.length === 0 ? (
              <div className="text-center py-12 text-gray-500 p-6">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No clients found</p>
                <p className="text-sm">Add clients to start managing your directory</p>
              </div>
            ) : (
              <>
                {/* Header Row */}
                <div className="sticky top-6 z-10 text-sm card-neu-flat" style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', border: 'none', fontWeight: 400 }}>
                  <div className="flex items-center gap-3 p-4">
                      <div className="w-4" />
                      <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                        <div 
                          className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                          onClick={() => handleSort('scid')}
                          title="Click to sort by SCID"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                        >
                          SCID{getSortIcon('scid')}
                        </div>
                        <div 
                          className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                          onClick={() => handleSort('name')}
                          title="Click to sort by Name"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                        >
                          Name{getSortIcon('name')}
                        </div>
                        <div 
                          className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                          onClick={() => handleSort('tenant')}
                          title="Click to sort by Tenant"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                        >
                          Tenant{getSortIcon('tenant')}
                        </div>
                        <div 
                          className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                          onClick={() => handleSort('program')}
                          title="Click to sort by Program"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                        >
                          Program{getSortIcon('program')}
                        </div>
                        <div 
                          className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                          onClick={() => handleSort('location')}
                          title="Click to sort by Location"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                        >
                          Location{getSortIcon('location')}
                        </div>
                        <div 
                          className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                          onClick={() => handleSort('contact')}
                          title="Click to sort by Contact"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                        >
                          Contact{getSortIcon('contact')}
                        </div>
                        <div 
                          className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                          onClick={() => handleSort('status')}
                          title="Click to sort by Status"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                        >
                          Status{getSortIcon('status')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y">
                    {sortedClients.map((client) => {
                      const isExpanded = expandedClients.has(client.id);
                      const tenantName = client.programs?.corporateClient?.name || client.program?.corporateClient?.name || 'N/A';
                      
                      return (
                        <Collapsible
                          key={client.id}
                          open={isExpanded}
                          onOpenChange={(open) => {
                            const newExpanded = new Set(expandedClients);
                            if (open) {
                              newExpanded.add(client.id);
                            } else {
                              newExpanded.delete(client.id);
                            }
                            setExpandedClients(newExpanded);
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-3 p-4 transition-all cursor-pointer card-neu-flat hover:card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                              <div className="w-4 flex items-center justify-center">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                                ) : (
                                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                                )}
                              </div>
                              <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                                {/* SCID */}
                                <div className="col-span-1 font-mono text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                                  {client.scid || <span className="italic">Pending</span>}
                                </div>
                                {/* Name */}
                                <div className="col-span-2 truncate font-medium" style={{ color: 'var(--foreground)' }}>
                                  {client.first_name} {client.last_name}
                                </div>
                                {/* Tenant */}
                                <div className="col-span-2 truncate" style={{ color: 'var(--muted-foreground)' }}>
                                  {tenantName}
                                </div>
                                {/* Program */}
                                <div className="col-span-2 truncate" style={{ color: 'var(--muted-foreground)' }}>
                                  {client.programs?.short_name || client.programs?.name || client.program?.short_name || client.program?.name || 'Unknown'}
                                </div>
                                {/* Location */}
                                <div className="col-span-2 truncate" style={{ color: 'var(--muted-foreground)' }}>
                                  {client.locations?.name || client.location?.name || 'Not assigned'}
                                </div>
                                {/* Contact */}
                                <div className="col-span-2 truncate" style={{ color: 'var(--muted-foreground)' }}>
                                  {client.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span className="truncate">{client.phone}</span>
                                    </div>
                                  )}
                                  {client.email && !client.phone && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{client.email}</span>
                                    </div>
                                  )}
                                  {!client.phone && !client.email && '-'}
                                </div>
                                {/* Status */}
                                <div className="col-span-1">
                                  {getStatusBadge(client.is_active)}
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 pt-2 border-t card-neu-flat" style={{ backgroundColor: 'var(--background)', borderTopColor: 'var(--border)', border: 'none' }}>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                {/* Expanded Details */}
                                <div className="space-y-2">
                                  <div>
                                    <strong>Email:</strong> {client.email || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Phone Type:</strong> {client.phone_type || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Address:</strong> {client.address || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Date of Birth:</strong> {client.date_of_birth ? format(parseISO(client.date_of_birth), 'MMM d, yyyy') : 'N/A'}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <strong>Birth Sex:</strong> {client.birth_sex || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Age:</strong> {client.age || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Race:</strong> {client.race || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Created:</strong> {format(parseISO(client.created_at), 'MMM d, yyyy')}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <strong>Emergency Contact:</strong> {client.emergency_contact_name || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Emergency Phone:</strong> {client.emergency_contact_phone || 'N/A'}
                                  </div>
                                  {client.medical_conditions && (
                                    <div>
                                      <strong>Medical Conditions:</strong> {client.medical_conditions}
                                    </div>
                                  )}
                                  {client.special_requirements && (
                                    <div>
                                      <strong>Special Requirements:</strong> {client.special_requirements}
                                    </div>
                                  )}
                                  {client.mobility_requirements && (
                                    <div>
                                      <strong>Mobility Requirements:</strong> {client.mobility_requirements}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-4 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditClient(client)}
                                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                                  style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="card-neu-flat hover:card-neu [&]:shadow-none !text-[#ff8475] hover:!text-[#ff8475] [&_svg]:!text-[#ff8475]"
                                      style={{ 
                                        backgroundColor: 'var(--background)', 
                                        border: 'none', 
                                        boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)',
                                        color: '#ff8475',
                                        fontWeight: 400
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
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
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </>
              )}
          </CardContent>
        </Card>

      {/* Two-Panel Layout - Client Groups */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        {/* BOTTOM PANEL: Client Groups */}
        <Card className="flex flex-col card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardHeader className="flex-shrink-0 card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center" style={{ color: 'var(--foreground)', fontSize: '26px' }}>
                CLIENT GROUPS
              </CardTitle>
              <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost"
                    className="card-neu-flat hover:card-neu [&]:shadow-none"
                    style={{ 
                      backgroundColor: 'var(--background)', 
                      border: 'none', 
                      boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' 
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto p-0">
            {clientGroups.length === 0 ? (
              <div className="text-center py-12 p-6" style={{ color: 'var(--muted-foreground)' }}>
                <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>No client groups yet</h3>
                <p className="text-sm mb-4">Create groups to organize clients for group trips</p>
                <Button 
                  onClick={() => setIsCreateGroupDialogOpen(true)}
                  className="card-neu hover:card-neu [&]:shadow-none"
                  style={{ 
                    backgroundColor: 'var(--background)', 
                    border: 'none', 
                    boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' 
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardContent className="p-0">
                  {/* Header Row */}
                  <div className="sticky top-6 z-10 text-sm card-neu-flat" style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', border: 'none', fontWeight: 400 }}>
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-4" />
                      <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1">Reference ID</div>
                        <div className="col-span-2">Name</div>
                        <div className="col-span-2">Program</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2">Members</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y">
                    {clientGroups.map((group: any) => {
                      const isExpanded = expandedGroups.has(group.id);
                      
                      return (
                        <Collapsible
                          key={group.id}
                          open={isExpanded}
                          onOpenChange={(open) => {
                            const newExpanded = new Set(expandedGroups);
                            if (open) {
                              newExpanded.add(group.id);
                            } else {
                              newExpanded.delete(group.id);
                            }
                            setExpandedGroups(newExpanded);
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-3 p-4 transition-all cursor-pointer card-neu-flat hover:card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                              <div className="w-4 flex items-center justify-center">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                                ) : (
                                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                                )}
                              </div>
                              <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                                {/* Reference ID */}
                                <div className="col-span-1 font-mono text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                                  {group.reference_id || <span className="italic">Pending</span>}
                                </div>
                                {/* Name */}
                                <div className="col-span-2 truncate font-medium">
                                  {group.name}
                                </div>
                                {/* Program */}
                                <div className="col-span-2 truncate" style={{ color: 'var(--muted-foreground)' }}>
                                  {group.programs?.name || group.program?.name || 'Unknown'}
                                </div>
                                {/* Description */}
                                <div className="col-span-3 truncate" style={{ color: 'var(--muted-foreground)' }}>
                                  {group.description || '-'}
                                </div>
                                {/* Members */}
                                <div className="col-span-2" style={{ color: 'var(--muted-foreground)' }}>
                                  <Badge variant="outline" className="text-xs">
                                    {group.member_count ?? 0} {group.member_count === 1 ? 'member' : 'members'}
                                  </Badge>
                                </div>
                                {/* Status */}
                                <div className="col-span-1">
                                  {getStatusBadge(group.is_active !== false)}
                                </div>
                                {/* Actions - prevent click from expanding */}
                                <div className="col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 card-neu-flat hover:card-neu [&]:shadow-none"
                                      style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
                                      onClick={() => {
                                        setViewingGroup(group);
                                        setIsViewEditMembersDialogOpen(true);
                                      }}
                                      title="View Members"
                                    >
                                      <Users className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 card-neu-flat hover:card-neu [&]:shadow-none"
                                      style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
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
                                      title="Edit Group"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 card-neu-flat hover:card-neu [&]:shadow-none"
                                          style={{ 
                                            backgroundColor: 'var(--background)', 
                                            border: 'none', 
                                            boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)',
                                            color: '#ff8475',
                                            fontWeight: 400
                                          }}
                                          title="Delete Group"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle style={{ color: 'var(--foreground)' }}>Delete Group</AlertDialogTitle>
                                          <AlertDialogDescription style={{ color: 'var(--muted-foreground)' }}>
                                            Are you sure you want to delete the group "{group.name}"? 
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel 
                                            className="card-neu-flat hover:card-neu [&]:shadow-none"
                                            style={{ 
                                              backgroundColor: 'var(--background)', 
                                              border: 'none', 
                                              boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' 
                                            }}
                                          >
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDeleteGroup(group.id)}
                                            className="card-neu hover:card-neu [&]:shadow-none"
                                            style={{ 
                                              backgroundColor: 'var(--background)', 
                                              border: 'none', 
                                              boxShadow: '0 0 8px rgba(224, 72, 80, 0.3)',
                                              color: 'var(--cancelled)'
                                            }}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 pt-2 border-t card-neu-flat" style={{ backgroundColor: 'var(--background)', borderTopColor: 'var(--border)', border: 'none' }}>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                {/* Expanded Details */}
                                <div className="space-y-2">
                                  <div>
                                    <strong>Reference ID:</strong> {group.reference_id || 'Pending'}
                                  </div>
                                  <div>
                                    <strong>Group Name:</strong> {group.name}
                                  </div>
                                  <div>
                                    <strong>Program:</strong> {group.programs?.name || group.program?.name || 'Unknown'}
                                  </div>
                                  <div>
                                    <strong>Program ID:</strong> {group.program_id || 'N/A'}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <strong>Description:</strong> {group.description || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Members:</strong> {group.member_count ?? 0}
                                  </div>
                                  <div>
                                    <strong>Status:</strong> {group.is_active !== false ? 'Active' : 'Inactive'}
                                  </div>
                                  <div>
                                    <strong>Created:</strong> {group.created_at ? format(parseISO(group.created_at), 'MMM d, yyyy') : 'N/A'}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <strong>Updated:</strong> {group.updated_at ? format(parseISO(group.updated_at), 'MMM d, yyyy') : 'N/A'}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                                  style={{ 
                                    backgroundColor: 'var(--background)', 
                                    border: 'none', 
                                    boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' 
                                  }}
                                  onClick={() => {
                                    setViewingGroup(group);
                                    setIsViewEditMembersDialogOpen(true);
                                  }}
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  View/Edit Members
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                                  style={{ 
                                    backgroundColor: 'var(--background)', 
                                    border: 'none', 
                                    boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' 
                                  }}
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
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Group
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="card-neu-flat hover:card-neu [&]:shadow-none !text-[#ff8475] hover:!text-[#ff8475] [&_svg]:!text-[#ff8475]"
                                      style={{ 
                                        backgroundColor: 'var(--background)', 
                                        border: 'none', 
                                        boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)',
                                        color: '#ff8475',
                                        fontWeight: 400
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle style={{ color: 'var(--foreground)' }}>Delete Group</AlertDialogTitle>
                                      <AlertDialogDescription style={{ color: 'var(--muted-foreground)' }}>
                                        Are you sure you want to delete the group "{group.name}"? 
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel 
                                        className="card-neu-flat hover:card-neu [&]:shadow-none"
                                        style={{ 
                                          backgroundColor: 'var(--background)', 
                                          border: 'none', 
                                          boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' 
                                        }}
                                      >
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteGroup(group.id)}
                                        className="card-neu hover:card-neu [&]:shadow-none"
                                        style={{ 
                                          backgroundColor: 'var(--background)', 
                                          border: 'none', 
                                          boxShadow: '0 0 8px rgba(224, 72, 80, 0.3)',
                                          color: 'var(--cancelled)'
                                        }}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Client Group Dialog */}
      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent className="max-w-2xl card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
              CREATE CLIENT GROUP
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="group-name" className="font-medium" style={{ fontSize: '16px' }}>
                GROUP NAME *
              </Label>
              <Input
                id="group-name"
                value={groupFormData.name}
                onChange={(e) => setGroupFormData({...groupFormData, name: e.target.value})}
                placeholder="Enter group name"
                required
                className="card-neu-flat [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="group-description" className="font-medium" style={{ fontSize: '16px' }}>
                DESCRIPTION
              </Label>
              <Textarea
                id="group-description"
                value={groupFormData.description}
                onChange={(e) => setGroupFormData({...groupFormData, description: e.target.value})}
                placeholder="Enter group description"
                rows={3}
                className="card-neu-flat [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium" style={{ fontSize: '16px' }}>
                SELECT CLIENTS
              </Label>
              <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Choose clients to include in this group ({groupFormData.selectedClients.length} selected)
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg p-3 space-y-2 card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                {clients.map((client) => (
                  <div 
                    key={client.id} 
                    className="flex items-center space-x-2 p-2 rounded transition-colors hover:bg-muted/20" 
                    style={{ color: 'var(--foreground)' }}
                  >
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
                        <span className="ml-2" style={{ color: 'var(--muted-foreground)' }}>({client.location.name})</span>
                      )}
                      {client.phone && (
                        <span className="ml-2" style={{ color: 'var(--muted-foreground)' }}>• {client.phone}</span>
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
                className="card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ 
                  backgroundColor: 'var(--background)', 
                  border: 'none',
                  boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="card-neu hover:card-neu [&]:shadow-none"
                style={{ 
                  backgroundColor: 'var(--background)', 
                  border: 'none',
                  boxShadow: '0 0 12px rgba(122, 255, 254, 0.2)',
                  color: '#7afffe',
                  textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)',
                  fontWeight: 400
                }}
                disabled={!groupFormData.name.trim()}
              >
                <span>Create Group</span>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader style={{ backgroundColor: 'var(--background)' }}>
            <DialogTitle className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>ADD NEW CLIENT</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={(e) => {
              e.preventDefault();
              console.log('🔍 Form submitted, form data:', createForm.getValues());
              createForm.handleSubmit(handleCreateClient)(e);
            }} className="space-y-6" style={{ backgroundColor: 'var(--background)' }}>
            <ComprehensiveClientForm 
              createForm={createForm}
              programs={programs || []}
              locations={locations || []}
              selectedProgram={selectedProgram}
            />

            <div className="flex justify-end space-x-2 pt-4" style={{ backgroundColor: 'var(--background)' }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ 
                  backgroundColor: 'var(--background)',
                  border: 'none',
                  boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createClientMutation.isPending}
                className="card-neu hover:card-neu [&]:shadow-none"
                style={{ 
                  backgroundColor: 'var(--background)',
                  border: 'none',
                  boxShadow: '0 0 12px rgba(122, 255, 254, 0.2)',
                  color: '#7afffe',
                  textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)',
                  fontWeight: 400
                }}
              >
                <span>{createClientMutation.isPending ? "Creating..." : "Create Client"}</span>
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

      {/* Duplicate Management Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Manage Duplicate Clients</DialogTitle>
            <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Found {duplicateGroups.length} duplicate group{duplicateGroups.length !== 1 ? 's' : ''} with {duplicateGroups.reduce((sum, group) => sum + group.length, 0)} total duplicate clients.
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Select All / Deselect All */}
            <div className="flex items-center justify-between p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={duplicateGroups.length > 0 && duplicateGroups.every(group => 
                    group.every(client => selectedDuplicateClients.has(client.id))
                  )}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const allIds = new Set<string>();
                      duplicateGroups.forEach(group => {
                        group.forEach(client => allIds.add(client.id));
                      });
                      setSelectedDuplicateClients(allIds);
                    } else {
                      setSelectedDuplicateClients(new Set());
                    }
                  }}
                />
                <Label className="font-medium">Select All</Label>
              </div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {selectedDuplicateClients.size} selected
              </div>
            </div>

            {/* Duplicate Groups */}
            <div className="space-y-4">
              {duplicateGroups.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No duplicates found</p>
                  <p className="text-sm">All clients have unique names.</p>
                </div>
              ) : (
                duplicateGroups.map((group, groupIndex) => {
                  const primaryClient = group.find(c => c.scid) || group[0]; // Client with SCID or first one
                  const hasPrimary = group.some(c => c.scid);
                  
                  return (
                    <Card key={groupIndex} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <CardHeader className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        <CardTitle className="text-lg">
                          {group[0].first_name} {group[0].last_name} ({group.length} duplicates)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {group.map((client) => {
                          const isPrimary = client.id === primaryClient.id;
                          const isSelected = selectedDuplicateClients.has(client.id);
                          
                          return (
                            <div
                              key={client.id}
                              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                isPrimary ? 'card-neu' : 'card-neu-flat'
                              } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                              style={{ backgroundColor: 'var(--background)', border: 'none' }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(selectedDuplicateClients);
                                  if (checked) {
                                    newSelected.add(client.id);
                                  } else {
                                    newSelected.delete(client.id);
                                  }
                                  setSelectedDuplicateClients(newSelected);
                                }}
                              />
                              <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="font-medium">{client.first_name} {client.last_name}</div>
                                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                    {client.scid ? `SCID: ${client.scid}` : 'No SCID'}
                                  </div>
                                </div>
                                <div style={{ color: 'var(--muted-foreground)' }}>
                                  {client.programs?.short_name || client.programs?.name || client.program?.short_name || client.program?.name || 'Unknown'}
                                </div>
                                <div style={{ color: 'var(--muted-foreground)' }}>
                                  {format(parseISO(client.created_at), 'MMM d, yyyy')}
                                </div>
                                <div>
                                  {isPrimary && hasPrimary && (
                                    <Badge className="bg-primary text-primary-foreground">Primary (Has SCID)</Badge>
                                  )}
                                  {isPrimary && !hasPrimary && (
                                    <Badge variant="outline">Primary (No SCID)</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {selectedDuplicateClients.size > 0 && (
                <span>
                  {selectedDuplicateClients.size} client{selectedDuplicateClients.size !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDuplicateDialogOpen(false)}
                className="card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const clientIds = Array.from(selectedDuplicateClients);
                  if (window.confirm(`Are you sure you want to delete ${clientIds.length} client(s)? This action cannot be undone.`)) {
                    bulkDeleteClientsMutation.mutate(clientIds);
                  }
                }}
                disabled={selectedDuplicateClients.size === 0 || bulkDeleteClientsMutation.isPending}
                className="card-neu hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {bulkDeleteClientsMutation.isPending ? "Deleting..." : `Delete Selected (${selectedDuplicateClients.size})`}
              </Button>
              <Button
                onClick={() => {
                  const selectedIds = Array.from(selectedDuplicateClients);
                  
                  // Find primary client (one with SCID) from selected clients
                  const primaryClient = duplicateGroups
                    .flatMap(group => group)
                    .find(c => selectedIds.includes(c.id) && c.scid);
                  
                  if (!primaryClient) {
                    toast({
                      title: "No Primary Client Selected",
                      description: "Please select a client with a valid SCID to merge into. The primary client must have a SCID.",
                      variant: "destructive",
                    });
                    return;
                  }

                  const secondaryClientIds = selectedIds.filter(id => id !== primaryClient.id);
                  
                  if (secondaryClientIds.length === 0) {
                    toast({
                      title: "No Secondary Clients Selected",
                      description: "Please select at least one additional client to merge into the primary client.",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (window.confirm(
                    `Merge ${secondaryClientIds.length} client(s) into ${primaryClient.first_name} ${primaryClient.last_name} (${primaryClient.scid})? ` +
                    `All trips and group memberships will be transferred to the primary client. This action cannot be undone.`
                  )) {
                    mergeClientsMutation.mutate({
                      primaryClientId: primaryClient.id,
                      secondaryClientIds
                    });
                  }
                }}
                disabled={selectedDuplicateClients.size < 2 || mergeClientsMutation.isPending}
                className="card-neu hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <Users className="w-4 h-4 mr-2" />
                {mergeClientsMutation.isPending ? "Merging..." : "Merge Selected"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Import Dialog */}
      <ClientImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        programs={programs || []}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        }}
      />
    </div>
  );
}