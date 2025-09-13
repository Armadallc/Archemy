
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Client, ServiceArea } from "@shared/schema";

interface ClientWithServiceArea {
  id: string;
  first_name: string;
  last_name: string;
  service_area_id: string;
  organization_id: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  medical_notes?: string | null;
  mobility_requirements?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  serviceAreaNickname?: string;
}

interface ClientFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  service_area_id: string;
  notes: string;
  medical_notes?: string;
}

const initialFormData: ClientFormData = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  service_area_id: "",
  notes: "",
};

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceArea, setSelectedServiceArea] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithServiceArea | null>(null);
  const [editingClient, setEditingClient] = useState<ClientWithServiceArea | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  
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
    selectedServiceAreas: [] as string[],
    selectedClients: [] as string[],
    expiryOption: "never" as "single" | "7days" | "30days" | "never"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get current organization from context
  const { currentOrganization } = useOrganization();

  // Fetch clients - always use organization-scoped endpoint
  const { data: clientsData, isLoading: loadingClients, error: clientsError } = useQuery({
    queryKey: ["/api/clients", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  // Ensure clients is always an array
  const clients = Array.isArray(clientsData) ? clientsData : [];

  // Fetch service areas for the dropdown
  const { data: serviceAreasData, error: serviceAreasError } = useQuery({
    queryKey: ["/api/serviceareas", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/serviceareas/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  // Ensure service areas is always an array
  const serviceAreas = Array.isArray(serviceAreasData) ? serviceAreasData : [];

  // Fetch client groups
  const { data: clientGroupsData } = useQuery({
    queryKey: ["/api/client-groups", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/client-groups/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  const clientGroups = Array.isArray(clientGroupsData) ? clientGroupsData : [];

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientData: ClientFormData) => {
      const apiData = {
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        organizationId: currentOrganization?.id,
        service_area_id: clientData.service_area_id,
        phone: clientData.phone || undefined,
        email: clientData.email || undefined,
        medicalNotes: clientData.notes || undefined,
        isActive: true
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
      // Invalidate all client-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error: any) => {
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
      return apiRequest("PATCH", `/api/clients/${data.id}`, data.updates);
    },
    onSuccess: () => {
      toast({
        title: "Client Updated",
        description: "Client has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      setFormData(initialFormData);
      // Invalidate all client-related queries for real-time updates
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
      // Invalidate all client-related queries for real-time updates
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



  // Create client group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof groupFormData) => {
      return apiRequest("POST", "/api/client-groups", {
        name: groupData.name,
        description: groupData.description,
        selectedClients: groupData.selectedClients,
        expiryOption: groupData.expiryOption,
        organizationId: currentOrganization?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client group created successfully.",
      });
      setIsCreateGroupDialogOpen(false);
      setGroupFormData({ 
        name: "", 
        description: "", 
        selectedServiceAreas: [], 
        selectedClients: [], 
        expiryOption: "never" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client-groups", currentOrganization?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create client group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/client-groups/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-groups", currentOrganization?.id] });
      setIsEditGroupDialogOpen(false);
      setEditingGroup(null);
      toast({
        title: "Group updated",
        description: "Client group updated successfully",
      });
    },
  });

  // Add client to group mutation
  const addClientToGroupMutation = useMutation({
    mutationFn: async ({ groupId, clientId }: { groupId: string; clientId: string }) => {
      const response = await apiRequest("POST", `/api/client-groups/${groupId}/clients/${clientId}`);
      return await response.json();
    },
    onSuccess: () => {
      // Refresh group members
      if (viewingGroup) {
        handleViewEditMembers(viewingGroup);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/client-groups", currentOrganization?.id] });
      toast({
        title: "Client added",
        description: "Client added to group successfully",
      });
    },
  });

  // Remove client from group mutation
  const removeClientFromGroupMutation = useMutation({
    mutationFn: async ({ groupId, clientId }: { groupId: string; clientId: string }) => {
      const response = await apiRequest("DELETE", `/api/client-groups/${groupId}/clients/${clientId}`);
      return response;
    },
    onSuccess: () => {
      // Refresh group members
      if (viewingGroup) {
        handleViewEditMembers(viewingGroup);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/client-groups", currentOrganization?.id] });
      toast({
        title: "Client removed",
        description: "Client removed from group successfully",
      });
    },
  });

  // Cleanup duplicates mutation
  const cleanupDuplicatesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/clients/cleanup-duplicates/${currentOrganization}`);
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

  // Debug log for troubleshooting
  console.log("Clients data:", { 
    clientsData, 
    clients, 
    isArray: Array.isArray(clientsData), 
    error: clientsError,
    currentOrganization 
  });
  console.log("Service areas data:", { 
    serviceAreasData, 
    serviceAreas, 
    isArray: Array.isArray(serviceAreasData), 
    error: serviceAreasError 
  });

  // Filter clients
  const filteredClients = clients.filter((client: ClientWithServiceArea) => {
    const matchesSearch = 
      client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);

    const matchesServiceArea = 
      selectedServiceArea === "all" || 
      client.service_area_id === selectedServiceArea;

    return matchesSearch && matchesServiceArea;
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.service_area_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createClientMutation.mutate(formData);
  };

  const handleEditClient = (client: ClientWithServiceArea) => {
    setEditingClient(client);
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone || "",
      email: client.email || "",
      service_area_id: client.service_area_id,
      notes: client.medicalNotes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !formData.first_name || !formData.last_name || !formData.service_area_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    updateClientMutation.mutate({ 
      id: editingClient.id, 
      updates: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        service_area_id: formData.service_area_id,
        medicalNotes: formData.notes
      }
    });
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClientMutation.mutate(clientId);
  };

  const getServiceAreaName = (serviceAreaId: string) => {
    const serviceArea = serviceAreas.find((sa: ServiceArea) => sa.id === serviceAreaId);
    return serviceArea?.nickname || "Unknown";
  };

  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description || "",
      selectedServiceAreas: [],
      selectedClients: [],
      expiryOption: "never"
    });
    setIsEditGroupDialogOpen(true);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }
    
    updateGroupMutation.mutate({
      id: editingGroup.id,
      data: {
        name: groupFormData.name,
        description: groupFormData.description
      }
    });
  };

  const handleViewEditMembers = async (group: any) => {
    setViewingGroup(group);
    
    // Fetch current group members
    try {
      const response = await apiRequest("GET", `/api/client-groups/${group.id}/clients`);
      const members = await response.json();
      setGroupMembers(members);
    } catch (error) {
      console.error("Error fetching group members:", error);
      setGroupMembers([]);
    }
    
    setIsViewEditMembersDialogOpen(true);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormData.name || groupFormData.selectedClients.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a group name and select at least one client.",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate(groupFormData);
  };

  // Get filtered clients based on selected service areas
  const getFilteredClients = () => {
    if (groupFormData.selectedServiceAreas.length === 0) {
      return [];
    }
    return clients.filter(client => 
      groupFormData.selectedServiceAreas.includes(client.service_area_id)
    );
  };

  // Handle service area selection
  const handleServiceAreaToggle = (serviceAreaId: string) => {
    const isSelected = groupFormData.selectedServiceAreas.includes(serviceAreaId);
    const newSelectedAreas = isSelected
      ? groupFormData.selectedServiceAreas.filter(id => id !== serviceAreaId)
      : [...groupFormData.selectedServiceAreas, serviceAreaId];
    
    // Remove clients from deselected service areas
    const validClients = clients
      .filter(client => newSelectedAreas.includes(client.service_area_id))
      .map(client => client.id);
    
    const filteredSelectedClients = groupFormData.selectedClients.filter(clientId =>
      validClients.includes(clientId)
    );

    setGroupFormData({
      ...groupFormData,
      selectedServiceAreas: newSelectedAreas,
      selectedClients: filteredSelectedClients
    });
  };

  // Handle client selection
  const handleClientToggle = (clientId: string) => {
    const isSelected = groupFormData.selectedClients.includes(clientId);
    const newSelectedClients = isSelected
      ? groupFormData.selectedClients.filter(id => id !== clientId)
      : [...groupFormData.selectedClients, clientId];
    
    setGroupFormData({
      ...groupFormData,
      selectedClients: newSelectedClients
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CLIENT MANAGEMENT</h1>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
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
          
          <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Client Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-6">
                {/* Group Name */}
                <div>
                  <Label htmlFor="groupName">Group Name *</Label>
                  <Input
                    id="groupName"
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                    placeholder="e.g., Grocery Shopping Group, Medical Transport Group"
                  />
                </div>

                {/* Service Areas Selection */}
                <div>
                  <Label>Service Areas *</Label>
                  <p className="text-sm text-gray-600 mb-3">Select one or more service areas to show available clients</p>
                  <div className="space-y-2">
                    {serviceAreas.map((area: ServiceArea) => (
                      <div key={area.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`area-${area.id}`}
                          checked={groupFormData.selectedServiceAreas.includes(area.id)}
                          onChange={() => handleServiceAreaToggle(area.id)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`area-${area.id}`} className="flex-1 cursor-pointer">
                          {area.nickname} - {area.description}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clients Selection */}
                {groupFormData.selectedServiceAreas.length > 0 && (
                  <div>
                    <Label>Select Clients *</Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Choose clients from the selected service areas ({groupFormData.selectedClients.length} selected)
                    </p>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                      {getFilteredClients().map((client) => (
                        <div key={client.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            id={`client-${client.id}`}
                            checked={groupFormData.selectedClients.includes(client.id)}
                            onChange={() => handleClientToggle(client.id)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`client-${client.id}`} className="flex-1 cursor-pointer text-sm">
                            <span className="font-medium">{client.first_name} {client.last_name}</span>
                            <span className="text-gray-500 ml-2">({getServiceAreaName(client.service_area_id)})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group Expiry */}
                <div>
                  <Label htmlFor="expiryOption">Group Expiry</Label>
                  <Select 
                    value={groupFormData.expiryOption} 
                    onValueChange={(value: "single" | "7days" | "30days" | "never") => 
                      setGroupFormData({ ...groupFormData, expiryOption: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expiry option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Occurrence (24 hours)</SelectItem>
                      <SelectItem value="7days">7 Days</SelectItem>
                      <SelectItem value="30days">30 Days</SelectItem>
                      <SelectItem value="never">Never Expires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="groupDescription">Description</Label>
                  <Textarea
                    id="groupDescription"
                    value={groupFormData.description}
                    onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                    placeholder="Optional description for this group..."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateGroupDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createGroupMutation.isPending}>
                    {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Group Dialog */}
          <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Client Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div>
                  <Label htmlFor="editGroupName">Group Name *</Label>
                  <Input
                    id="editGroupName"
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                    placeholder="e.g., Phoenix Group, Therapy Center Group"
                  />
                </div>

                <div>
                  <Label htmlFor="editGroupDescription">Description</Label>
                  <Textarea
                    id="editGroupDescription"
                    value={groupFormData.description}
                    onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditGroupDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateGroupMutation.isPending}>
                    {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* View/Edit Members Dialog */}
          <Dialog open={isViewEditMembersDialogOpen} onOpenChange={setIsViewEditMembersDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>View/Edit Clients - {viewingGroup?.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Current Members */}
                <div>
                  <h3 className="font-semibold mb-3">Current Group Members ({groupMembers.length})</h3>
                  {groupMembers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No clients in this group yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {groupMembers.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium">{member.firstName} {member.lastName}</span>
                            <span className="text-gray-500 ml-2">({getServiceAreaName(member.serviceAreaId)})</span>
                            {member.phone && <span className="text-gray-500 ml-2">• {member.phone}</span>}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeClientFromGroupMutation.mutate({ 
                              groupId: viewingGroup.id, 
                              clientId: member.id 
                            })}
                            disabled={removeClientFromGroupMutation.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Members */}
                <div>
                  <h3 className="font-semibold mb-3">Add Clients to Group</h3>
                  <div className="max-h-64 overflow-y-auto border rounded-lg p-3">
                    {clients
                      .filter(client => !groupMembers.some(member => member.id === client.id))
                      .map((client: any) => (
                        <div key={client.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex-1">
                            <span className="font-medium">{client.first_name} {client.last_name}</span>
                            <span className="text-gray-500 ml-2">({getServiceAreaName(client.service_area_id)})</span>
                            {client.phone && <span className="text-gray-500 ml-2">• {client.phone}</span>}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addClientToGroupMutation.mutate({ 
                              groupId: viewingGroup.id, 
                              clientId: client.id 
                            })}
                            disabled={addClientToGroupMutation.isPending}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setIsViewEditMembersDialogOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="serviceAreaId">Service Area *</Label>
                <Select value={formData.service_area_id} onValueChange={(value) => setFormData({ ...formData, service_area_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service area" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceAreas.map((area: ServiceArea) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.nickname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@email.com"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special requirements, accessibility needs, etc."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createClientMutation.isPending}>
                  {createClientMutation.isPending ? "Creating..." : "Create Client"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={selectedServiceArea} onValueChange={setSelectedServiceArea}>
                <SelectTrigger>
                  <SelectValue placeholder="All Service Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Service Areas</SelectItem>
                  {serviceAreas.map((area: ServiceArea) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Clients ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClients ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading clients...</p>
            </div>
          ) : clientsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading clients: {clientsError.message}</p>
              <p className="text-gray-600 mt-2">Please check your connection and try again.</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {searchTerm || selectedServiceArea !== "all" 
                  ? "No clients match your search criteria." 
                  : "No clients found. Add your first client to get started."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client: ClientWithServiceArea) => (
                <div key={client.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {client.first_name} {client.last_name}
                        </h3>
                        <Badge variant="secondary">
                          {getServiceAreaName(client.service_area_id)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.medicalNotes && (
                          <div className="flex items-start gap-2 mt-2">
                            <MapPin className="w-4 h-4 mt-0.5" />
                            <span className="text-xs">{client.medicalNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Client</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {client.first_name} {client.last_name}? 
                              This action cannot be undone and will affect any scheduled trips.
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Groups Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            Client Groups ({clientGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No client groups created yet. Create your first group to organize clients for recurring trips.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientGroups.map((group: any) => (
                <div key={group.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <Badge variant="secondary">
                          Cross-Service Area Group
                        </Badge>
                        <Badge variant="outline">
                          {group.clientCount || 0} clients
                        </Badge>
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Created: {new Date(group.created_at || group.createdAt).toLocaleDateString()}</div>
                        {group.expires_at && (
                          <div>Expires: {new Date(group.expires_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewEditMembers(group)}
                      >
                        View/Edit Clients
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditGroup(group)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editServiceAreaId">Service Area *</Label>
              <Select value={formData.service_area_id} onValueChange={(value) => setFormData({ ...formData, service_area_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service area" />
                </SelectTrigger>
                <SelectContent>
                  {serviceAreas.map((area: ServiceArea) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@email.com"
              />
            </div>

            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special requirements, accessibility needs, etc."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateClientMutation.isPending}>
                {updateClientMutation.isPending ? "Updating..." : "Update Client"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
