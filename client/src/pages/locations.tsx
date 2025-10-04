import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Switch } from "../components/ui/switch";
import { MapPin, Plus, Search, Edit, Trash2, Users, Building2, Globe, Map, Phone, Mail } from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import { format } from "date-fns";

interface Location {
  id: string;
  program_id: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  contact_person?: string;
  latitude?: number;
  longitude?: number;
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
  // Additional data
  client_count?: number;
}

interface LocationFormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  contact_person: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
}

const initialFormData: LocationFormData = {
  name: "",
  description: "",
  address: "",
  phone: "",
  contact_person: "",
  latitude: "",
  longitude: "",
  is_active: true,
};

export default function Locations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(initialFormData);
  const { toast } = useToast();
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

  // Fetch locations based on current hierarchy level
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ["/api/locations", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/locations";
      
      // Build endpoint based on hierarchy level
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

  const locations = Array.isArray(locationsData) ? locationsData : [];

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: LocationFormData) => {
      const apiData = {
        program_id: selectedProgram || '',
        name: locationData.name,
        description: locationData.description || undefined,
        address: locationData.address,
        phone: locationData.phone || undefined,
        contact_person: locationData.contact_person || undefined,
        latitude: locationData.latitude ? parseFloat(locationData.latitude) : undefined,
        longitude: locationData.longitude ? parseFloat(locationData.longitude) : undefined,
        is_active: locationData.is_active
      };
      return apiRequest("POST", "/api/locations", apiData);
    },
    onSuccess: () => {
      toast({
        title: "Location Created",
        description: "Location has been successfully added.",
      });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create location. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, ...locationData }: any) => {
      return apiRequest("PATCH", `/api/locations/${id}`, {
        name: locationData.name,
        description: locationData.description || undefined,
        address: locationData.address,
        phone: locationData.phone || undefined,
        contact_person: locationData.contact_person || undefined,
        latitude: locationData.latitude ? parseFloat(locationData.latitude) : undefined,
        longitude: locationData.longitude ? parseFloat(locationData.longitude) : undefined,
        is_active: locationData.is_active
      });
    },
    onSuccess: () => {
      toast({
        title: "Location Updated",
        description: "Location has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: string) => {
      return apiRequest("DELETE", `/api/locations/${locationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Location Deleted",
        description: "Location has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    createLocationMutation.mutate(formData);
  };

  const handleUpdateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      updateLocationMutation.mutate({
        id: selectedLocation.id,
        ...formData,
      });
    }
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      description: location.description || "",
      address: location.address,
      phone: location.phone || "",
      contact_person: location.contact_person || "",
      latitude: location.latitude?.toString() || "",
      longitude: location.longitude?.toString() || "",
      is_active: location.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      deleteLocationMutation.mutate(locationId);
    }
  };

  // Filter locations based on search term and status
  const filteredLocations = locations.filter((location) => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && location.is_active) ||
      (statusFilter === "inactive" && !location.is_active);
    
    return matchesSearch && matchesStatus;
  });

  if (locationsLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">LOCATIONS</h1>
          <p className="text-gray-600 mt-1">{getPageTitle()}</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {filteredLocations.length} locations
          </span>
        </div>
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Location Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No locations found</p>
              <p className="text-sm">Add locations to start managing your directory</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <div className="font-medium">{location.name}</div>
                          {location.description && (
                            <div className="text-sm text-gray-500">{location.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{location.address}</div>
                        {location.latitude && location.longitude && (
                          <div className="text-gray-500">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {location.contact_person && (
                          <div className="flex items-center mb-1">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {location.contact_person}
                          </div>
                        )}
                        {location.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1 text-gray-400" />
                            {location.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-1 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium">{location.program?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{location.program?.corporateClient?.name || ''}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.is_active ? "default" : "secondary"}>
                        {location.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditLocation(location)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLocation(location.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Location Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLocation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Main Office, Branch A, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of this location..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="123 Main St, City, State 12345"
                required
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  placeholder="40.7128"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  placeholder="-74.0060"
                />
              </div>
            </div>

            {/* Program Assignment - show for super admins */}
            {user?.role === 'super_admin' && programs && (
              <div>
                <Label htmlFor="program_id">Program *</Label>
                <Select 
                  value={selectedProgram || ''} 
                  onValueChange={(value) => {
                    // This would need to be handled by the hierarchy system
                    // For now, we'll use the current selected program
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program: any) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name} ({program.corporateClient?.name || 'Unknown Client'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                disabled={createLocationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createLocationMutation.isPending ? "Creating..." : "Create Location"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateLocation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Location Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-contact_person">Contact Person</Label>
                <Input
                  id="edit-contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-address">Address *</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
                rows={2}
              />
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="edit-is_active">Active</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedLocation(null);
                  setFormData(initialFormData);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateLocationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateLocationMutation.isPending ? "Updating..." : "Update Location"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}