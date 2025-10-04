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
import { MapPin, Plus, Search, Edit, Trash2, Building2, Globe, Star, Users, Phone } from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import { format } from "date-fns";

interface FrequentLocation {
  id: string;
  program_id: string;
  name: string;
  description?: string;
  street_address: string;
  city: string;
  state: string;
  zip_code?: string;
  full_address: string;
  location_type: string;
  usage_count: number;
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
}

interface LocationFormData {
  name: string;
  description: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  location_type: string;
  is_active: boolean;
}

const initialFormData: LocationFormData = {
  name: "",
  description: "",
  street_address: "",
  city: "",
  state: "",
  zip_code: "",
  location_type: "destination",
  is_active: true,
};

const locationTypes = [
  { value: "destination", label: "General Destination" },
  { value: "medical", label: "Medical Facility" },
  { value: "commercial", label: "Store/Shopping" },
  { value: "service_area", label: "Service Area" },
  { value: "other", label: "Other" },
];

export default function FrequentLocations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>(initialFormData);
  const [selectedLocation, setSelectedLocation] = useState<FrequentLocation | null>(null);

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

  // Fetch frequent locations based on current hierarchy level
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["/api/frequent-locations", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/frequent-locations";
      
      // Build endpoint based on hierarchy level
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/frequent-locations/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/frequent-locations/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  const locations = Array.isArray(locationsData) ? locationsData : [];

  // Filter locations
  const filteredLocations = locations.filter((location: FrequentLocation) => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.full_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || location.location_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: LocationFormData) => {
      const fullAddress = `${locationData.street_address}, ${locationData.city}, ${locationData.state} ${locationData.zip_code}`.trim();
      
      const apiData = {
        program_id: selectedProgram || '',
        name: locationData.name,
        description: locationData.description || undefined,
        street_address: locationData.street_address,
        city: locationData.city,
        state: locationData.state,
        zip_code: locationData.zip_code,
        full_address: fullAddress,
        location_type: locationData.location_type,
        is_active: locationData.is_active
      };
      return apiRequest("POST", "/api/frequent-locations", apiData);
    },
    onSuccess: () => {
      toast({
        title: "Location Added",
        description: "Frequent location has been successfully added.",
      });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["/api/frequent-locations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, ...locationData }: any) => {
      const fullAddress = `${locationData.street_address}, ${locationData.city}, ${locationData.state} ${locationData.zip_code}`.trim();
      
      return apiRequest("PATCH", `/api/frequent-locations/${id}`, {
        ...locationData,
        full_address: fullAddress,
      });
    },
    onSuccess: () => {
      toast({
        title: "Location Updated",
        description: "Frequent location has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/frequent-locations"] });
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
      return apiRequest("DELETE", `/api/frequent-locations/${locationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Location Deleted",
        description: "Frequent location has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/frequent-locations"] });
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

  const handleEditLocation = (location: FrequentLocation) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      description: location.description || "",
      street_address: location.street_address,
      city: location.city,
      state: location.state,
      zip_code: location.zip_code || "",
      location_type: location.location_type,
      is_active: location.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    if (confirm("Are you sure you want to delete this frequent location?")) {
      deleteLocationMutation.mutate(locationId);
    }
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case "medical":
        return <Building2 className="w-4 h-4 text-red-500" />;
      case "commercial":
        return <Globe className="w-4 h-4 text-blue-500" />;
      case "service_area":
        return <MapPin className="w-4 h-4 text-green-500" />;
      default:
        return <Star className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case "medical":
        return "bg-red-50 text-red-700 border-red-200";
      case "commercial":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "service_area":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">FREQUENT LOCATIONS</h1>
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
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {locationTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
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
            Frequent Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No frequent locations found</p>
              <p className="text-sm">Add locations to start building your frequent destinations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Usage</TableHead>
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
                        {getLocationTypeIcon(location.location_type)}
                        <div className="ml-3">
                          <div className="font-medium">{location.name}</div>
                          {location.description && (
                            <div className="text-sm text-gray-500">{location.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{location.full_address}</div>
                        <div className="text-gray-500">
                          {location.city}, {location.state} {location.zip_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getLocationTypeColor(location.location_type)}
                      >
                        {locationTypes.find(t => t.value === location.location_type)?.label || location.location_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-400" />
                        {location.usage_count || 0}
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
            <DialogTitle>Add New Frequent Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLocation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Hospital, Mall, Office, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="location_type">Location Type *</Label>
                <Select 
                  value={formData.location_type} 
                  onValueChange={(value) => setFormData({...formData, location_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Label htmlFor="street_address">Street Address *</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => setFormData({...formData, street_address: e.target.value})}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  placeholder="State"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                  placeholder="12345"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active">Active</Label>
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
                disabled={createLocationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createLocationMutation.isPending ? "Adding..." : "Add Location"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Frequent Location</DialogTitle>
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
                <Label htmlFor="edit-location_type">Location Type *</Label>
                <Select 
                  value={formData.location_type} 
                  onValueChange={(value) => setFormData({...formData, location_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Label htmlFor="edit-street_address">Street Address *</Label>
              <Input
                id="edit-street_address"
                value={formData.street_address}
                onChange={(e) => setFormData({...formData, street_address: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-city">City *</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State *</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-zip_code">ZIP Code</Label>
                <Input
                  id="edit-zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="edit-is_active">Active</Label>
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