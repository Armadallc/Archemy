import React, { useState } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Users, Building2, Calendar, UserPlus, UserMinus, Filter, Download, Upload, AlertTriangle, ArrowLeft, User, Heart, Shield, Star, UserCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { apiRequest } from "../lib/queryClient";

// Zod schema for client validation
const clientFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  program_id: z.string().min(1, "Program is required"),
  location_id: z.string().optional(),
  is_active: z.boolean().default(true),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_conditions: z.string().optional(),
  special_requirements: z.string().optional(),
  billing_pin: z.string().optional(),
  medical_notes: z.string().optional(),
  mobility_requirements: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  program_id: string;
  location_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
  special_requirements?: string;
  billing_pin?: string;
  medical_notes?: string;
  mobility_requirements?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data
  program?: {
    id: string;
    name: string;
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
}


const initialFormData: ClientFormData = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  program_id: "",
  location_id: "",
  is_active: true,
  address: "",
  date_of_birth: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  medical_conditions: "",
  special_requirements: "",
  billing_pin: "",
  medical_notes: "",
  mobility_requirements: "",
};

// Status color definitions
const clientStatusColors = {
  active: "bg-green-50 text-green-700 border-green-200",
  inactive: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  suspended: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function Clients() {
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
  const [groupFormData, setGroupFormData] = useState({
    name: "",
    description: "",
    selectedClients: [] as string[],
    expiryOption: "never" as "single" | "7days" | "30days" | "never"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, getFilterParams, getPageTitle } = useHierarchy();

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

  // Fetch clients based on current hierarchy level
  const { data: clientsData, isLoading: loadingClients, error: clientsError } = useQuery({
    queryKey: ["/api/clients", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/clients";
      
      // Build endpoint based on hierarchy level
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/clients/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/clients/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  // Ensure clients is always an array
  const clients = Array.isArray(clientsData) ? clientsData : [];

  // Fetch locations for the dropdown
  const { data: locationsData, error: locationsError } = useQuery({
    queryKey: ["/api/locations", selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/locations";
      
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/locations/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/locations/corporate-client/${selectedCorporateClient}`;
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
    queryKey: ["/api/client-groups", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/client-groups";
      
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/client-groups/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/client-groups/corporate-client/${selectedCorporateClient}`;
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

  // Enhanced status color system
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'suspended': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Enhanced status badge helper function
  const getStatusBadge = (isActive: boolean) => {
    const status = isActive ? 'active' : 'inactive';
    return (
      <Badge 
        className={`${getStatusColor(status)} text-xs px-2 py-1 rounded-full font-medium border`}
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
        is_active: true
      };
      return apiRequest("POST", "/api/clients", apiData);
    },
    onSuccess: () => {
      toast({
        title: "Client Created",
        description: "Client has been successfully created.",
      });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
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

  const handleCreateClient = (data: ClientFormData) => {
    const finalFormData = {
      ...data,
      program_id: data.program_id || selectedProgram || ''
    };
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
      updateClientMutation.mutate({
        id: editingClient.id,
        updates: formData,
      });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone || "",
      email: client.email || "",
      program_id: client.program_id,
      location_id: client.location_id || "",
      address: client.address || "",
      date_of_birth: client.date_of_birth || "",
      emergency_contact_name: client.emergency_contact_name || "",
      emergency_contact_phone: client.emergency_contact_phone || "",
      medical_conditions: client.medical_conditions || "",
      special_requirements: client.special_requirements || "",
      billing_pin: client.billing_pin || "",
      medical_notes: client.medical_notes || "",
      mobility_requirements: client.mobility_requirements || "",
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CLIENT MANAGEMENT</h1>
          <p className="text-gray-600 mt-1">{getPageTitle()}</p>
        </div>
        
        <div className="flex space-x-2">
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Active Clients</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{activeClients}</div>
            <p className="text-xs text-blue-600 mt-1">Currently active</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Total Clients</CardTitle>
            <User className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalClients}</div>
            <p className="text-xs text-green-600 mt-1">All clients</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Recent Clients</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{recentClients}</div>
            <p className="text-xs text-orange-600 mt-1">Added this week</p>
          </CardContent>
        </Card>
        
      </div>


      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
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
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
            
                  {/* Enhanced Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-4">
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
                    <TableRow className="bg-gray-50">
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
                      <TableRow key={client.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">{client.first_name} {client.last_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
                          <div className="text-sm">
                            <div className="font-medium">{client.program?.name || 'Unknown'}</div>
                            <div className="text-gray-500">{client.program?.corporateClient?.name || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{client.location?.name || 'Not assigned'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(client.is_active)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {client.emergency_contact_name && (
                              <Badge 
                                className="text-xs px-2 py-1 rounded-full font-medium border bg-purple-50 text-purple-700 border-purple-200"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                Emergency
                              </Badge>
                            )}
                            {client.medical_conditions && (
                              <Badge 
                                className="text-xs px-2 py-1 rounded-full font-medium border bg-red-50 text-red-700 border-red-200"
                              >
                                <Heart className="w-3 h-3 mr-1" />
                                Medical
                              </Badge>
                            )}
                            {client.special_requirements && (
                              <Badge 
                                className="text-xs px-2 py-1 rounded-full font-medium border bg-blue-50 text-blue-700 border-blue-200"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Special
                              </Badge>
                            )}
                            {client.mobility_requirements && (
                              <Badge 
                                className="text-xs px-2 py-1 rounded-full font-medium border bg-green-50 text-green-700 border-green-200"
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
                              className="h-8 w-8 p-0 hover:bg-gray-100"
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
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Group
                      </Button>
                    </div>
            ) : (
                    <div className="space-y-4">
                      {clientGroups.map((group: any) => (
                        <div key={group.id} className="border rounded-lg p-4 hover:shadow-md hover:bg-gray-50 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600">{group.description}</p>
                      </div>
                      <Badge variant="outline">{group.member_count || 0} members</Badge>
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
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Client Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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
                  <div key={client.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
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
                    expiryOption: "never"
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!groupFormData.name.trim()}
              >
                Create Group
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Client Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateClient)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">First Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
                          className="mt-1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Last Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter last name"
                          className="mt-1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="client@email.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Address Information</h4>
              <div>
                <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="123 Main Street, City, State 12345"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Personal Details Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_of_birth" className="text-sm font-medium">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="billing_pin" className="text-sm font-medium">Billing PIN</Label>
                  <Input
                    id="billing_pin"
                    value={formData.billing_pin}
                    onChange={(e) => setFormData({...formData, billing_pin: e.target.value})}
                    placeholder="Optional billing PIN"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name" className="text-sm font-medium">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                    placeholder="Emergency contact name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone" className="text-sm font-medium">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                    placeholder="(555) 987-6543"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

              {/* Medical Information Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Medical & Trip Information</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="medical_conditions" className="text-sm font-medium">Medical Conditions</Label>
                  <Textarea
                    id="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
                    placeholder="List any medical conditions"
                    className="mt-1"
                  />
                </div>

                  <div>
                    <Label htmlFor="medical_notes" className="text-sm font-medium">Trip Notes</Label>
                    <Textarea
                      id="medical_notes"
                      value={formData.medical_notes}
                      onChange={(e) => setFormData({...formData, medical_notes: e.target.value})}
                      placeholder="Notes for drivers about this client (pickup instructions, special needs, etc.)"
                      className="mt-1"
                    />
                  </div>

                <div>
                  <Label htmlFor="special_requirements" className="text-sm font-medium">Special Requirements</Label>
                  <Textarea
                    id="special_requirements"
                    value={formData.special_requirements}
                    onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                    placeholder="Accessibility needs, special equipment, etc."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mobility_requirements" className="text-sm font-medium">Mobility Requirements</Label>
                  <Textarea
                    id="mobility_requirements"
                    value={formData.mobility_requirements}
                    onChange={(e) => setFormData({...formData, mobility_requirements: e.target.value})}
                    placeholder="Wheelchair, walker, assistance needed, etc."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Program & Location Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Program & Location Assignment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location_id" className="text-sm font-medium">Location</Label>
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
                  <Label htmlFor="program_id" className="text-sm font-medium">Program *</Label>
                <Select 
                  value={formData.program_id || selectedProgram || ''} 
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
                disabled={createClientMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
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
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                <Input
                  id="edit-emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
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
                className="bg-blue-600 hover:bg-blue-700"
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