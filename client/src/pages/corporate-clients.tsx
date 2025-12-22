import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Edit, Trash2, Building2, Users, MapPin, Calendar, Upload } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { PhoneInput } from "../components/ui/phone-input";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";

interface CorporateClient {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  program_count?: number;
  user_count?: number;
  trip_count?: number;
}

export default function CorporateClients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<CorporateClient | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    is_active: true
  });

  // Fetch corporate clients
  const { data: corporateClientsResponse, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ["/api/corporate-clients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/corporate-clients");
      return await response.json();
    }
  });

  // Extract corporate clients from the response
  const corporateClients = corporateClientsResponse?.corporateClients || [];

  // Create corporate client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: Partial<CorporateClient>) => {
      const response = await apiRequest("POST", "/api/corporate-clients", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-clients"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "", contact_email: "", contact_phone: "", address: "", is_active: true });
      toast({ title: "Success", description: "Corporate client created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create corporate client" });
    }
  });

  // Update corporate client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CorporateClient> }) => {
      const response = await apiRequest("PATCH", `/api/corporate-clients/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-clients"] });
      setEditingClient(null);
      setFormData({ name: "", description: "", contact_email: "", contact_phone: "", address: "", is_active: true });
      toast({ title: "Success", description: "Corporate client updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update corporate client" });
    }
  });

  // Delete corporate client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/corporate-clients/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-clients"] });
      toast({ title: "Success", description: "Corporate client deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete corporate client" });
    }
  });

  // Filter clients based on search term
  const filteredClients = corporateClients.filter((client: CorporateClient) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient.id, data: formData });
    } else {
      createClientMutation.mutate(formData);
    }
  };

  // Handle edit
  const handleEdit = (client: CorporateClient) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      description: client.description || "",
      contact_email: client.contact_email || "",
      contact_phone: client.contact_phone || "",
      address: client.address || "",
      is_active: client.is_active
    });
    setIsCreateDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this corporate client?")) {
      deleteClientMutation.mutate(id);
    }
  };

  if (clientsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Corporate Clients</h2>
          <p className="text-gray-600">Failed to load corporate clients. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
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
              partners.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
              <HeaderScopeSelector />
            )}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingClient(null);
              setFormData({ name: "", description: "", contact_email: "", contact_phone: "", address: "", is_active: true });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Corporate Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Edit Corporate Client" : "Create New Corporate Client"}</DialogTitle>
              <DialogDescription>
                {editingClient ? "Update corporate client details" : "Add a new corporate client"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter client description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <PhoneInput
                    id="contact_phone"
                    value={formData.contact_phone || ''}
                    onChange={(value) => setFormData({ ...formData, contact_phone: value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter client address"
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                  aria-label="Corporate client is active"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createClientMutation.isPending || updateClientMutation.isPending}>
                  {editingClient ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search corporate clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Corporate Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Corporate Clients Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? "No clients match your search criteria." : "Get started by creating your first corporate client."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Corporate Client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client: CorporateClient) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {client.logo_url ? (
                      <img
                        src={client.logo_url}
                        alt={`${client.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center ${client.logo_url ? 'hidden' : ''}`}>
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {client.contact_email || "No contact email"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={client.is_active ? "default" : "secondary"}>
                    {client.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {client.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{client.description}</p>
                )}
                
                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {client.contact_phone && (
                    <div className="text-sm text-gray-600">
                      <strong>Phone:</strong> {client.contact_phone}
                    </div>
                  )}
                  {client.address && (
                    <div className="text-sm text-gray-600">
                      <strong>Address:</strong> {client.address}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{client.program_count || 0}</div>
                    <div className="text-xs text-gray-500">Programs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{client.user_count || 0}</div>
                    <div className="text-xs text-gray-500">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{client.trip_count || 0}</div>
                    <div className="text-xs text-gray-500">Trips</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(client)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
