import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Edit, Trash2, Building, Users, MapPin, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useHierarchy } from "../hooks/useHierarchy";

interface Program {
  id: string;
  name: string;
  description?: string;
  corporate_client_id: string;
  corporate_client_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client_count?: number;
  location_count?: number;
  trip_count?: number;
}

interface CorporateClient {
  id: string;
  name: string;
  logo_url?: string;
}

export default function Programs() {
  const { level, selectedCorporateClient } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    corporate_client_id: "",
    is_active: true
  });

  // Fetch programs
  const { data: programs = [], isLoading: programsLoading, error: programsError } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/programs");
      return await response.json();
    }
  });

  // Fetch corporate clients for dropdown
  const { data: corporateClients = [] } = useQuery({
    queryKey: ["/api/corporate-clients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/corporate-clients");
      return await response.json();
    },
    enabled: level === 'corporate' || level === 'client'
  });

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: Partial<Program>) => {
      const response = await apiRequest("POST", "/api/programs", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "", corporate_client_id: "", is_active: true });
      toast({ title: "Success", description: "Program created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create program" });
    }
  });

  // Update program mutation
  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Program> }) => {
      const response = await apiRequest("PATCH", `/api/programs/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      setEditingProgram(null);
      setFormData({ name: "", description: "", corporate_client_id: "", is_active: true });
      toast({ title: "Success", description: "Program updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update program" });
    }
  });

  // Delete program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/programs/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({ title: "Success", description: "Program deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete program" });
    }
  });

  // Filter programs based on search term
  const filteredPrograms = programs.filter((program: Program) =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.corporate_client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProgram) {
      updateProgramMutation.mutate({ id: editingProgram.id, data: formData });
    } else {
      createProgramMutation.mutate(formData);
    }
  };

  // Handle edit
  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description || "",
      corporate_client_id: program.corporate_client_id,
      is_active: program.is_active
    });
    setIsCreateDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this program?")) {
      deleteProgramMutation.mutate(id);
    }
  };

  if (programsLoading) {
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

  if (programsError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Programs</h2>
          <p className="text-gray-600">Failed to load programs. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600">Manage transportation programs and their settings</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProgram(null);
              setFormData({ name: "", description: "", corporate_client_id: "", is_active: true });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingProgram ? "Edit Program" : "Create New Program"}</DialogTitle>
              <DialogDescription>
                {editingProgram ? "Update program details" : "Add a new transportation program"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter program name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter program description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="corporate_client_id">Corporate Client</Label>
                <Select
                  value={formData.corporate_client_id}
                  onValueChange={(value) => setFormData({ ...formData, corporate_client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select corporate client" />
                  </SelectTrigger>
                  <SelectContent>
                    {corporateClients.map((client: CorporateClient) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                  aria-label="Program is active"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProgramMutation.isPending || updateProgramMutation.isPending}>
                  {editingProgram ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search programs..."
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

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? "No programs match your search criteria." : "Get started by creating your first program."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program: Program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {program.corporate_client_name || "Unknown Client"}
                    </CardDescription>
                  </div>
                  <Badge variant={program.is_active ? "default" : "secondary"}>
                    {program.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {program.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>
                )}
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{program.client_count || 0}</div>
                    <div className="text-xs text-gray-500">Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{program.location_count || 0}</div>
                    <div className="text-xs text-gray-500">Locations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{program.trip_count || 0}</div>
                    <div className="text-xs text-gray-500">Trips</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(program)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(program.id)}
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
