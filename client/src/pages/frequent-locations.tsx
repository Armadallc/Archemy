import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, Search, Edit, Trash2, Building, Globe, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { format } from "date-fns";

interface FrequentLocation {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  street_address: string;
  city: string;
  state: string;
  zip_code?: string | null;
  full_address: string;
  location_type: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  const { currentOrganization } = useOrganization();

  // Fetch frequent locations
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["/api/frequentlocations", "organization", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const response = await apiRequest("GET", `/api/frequentlocations/organization/${currentOrganization.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  const locations = Array.isArray(locationsData) ? locationsData : [];

  // Filter locations
  const filteredLocations = locations.filter((location: FrequentLocation) => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.full_address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || location.location_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: LocationFormData) => {
      const fullAddress = `${locationData.street_address}, ${locationData.city}, ${locationData.state} ${locationData.zip_code}`.trim();
      
      const apiData = {
        organizationId: currentOrganization?.id,
        name: locationData.name,
        description: locationData.description || undefined,
        streetAddress: locationData.street_address,
        city: locationData.city,
        state: locationData.state,
        zipCode: locationData.zip_code,
        fullAddress: fullAddress,
        locationType: locationData.location_type,
        isActive: locationData.is_active
      };
      return apiRequest("POST", "/api/frequentlocations", apiData);
    },
    onSuccess: () => {
      toast({
        title: "Location Added",
        description: "Frequent location has been successfully added.",
      });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["/api/frequentlocations"] });
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
      
      return apiRequest("PUT", `/api/frequentlocations/${id}`, {
        ...locationData,
        fullAddress: fullAddress,
      });
    },
    onSuccess: () => {
      toast({
        title: "Location Updated",
        description: "Frequent location has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/frequentlocations"] });
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
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/frequentlocations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Location Deleted",
        description: "Frequent location has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/frequentlocations"] });
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
    if (!formData.name.trim() || !formData.street_address.trim() || !formData.city.trim() || !formData.state.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, street address, city, state).",
        variant: "destructive",
      });
      return;
    }
    createLocationMutation.mutate(formData);
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

  const handleUpdateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    updateLocationMutation.mutate({ id: selectedLocation.id, ...formData });
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm("Are you sure you want to delete this frequent location?")) {
      deleteLocationMutation.mutate(id);
    }
  };

  // Calculate stats
  const activeLocations = locations.filter((loc: FrequentLocation) => loc.is_active).length;
  const totalUsage = locations.reduce((sum: number, loc: FrequentLocation) => sum + (loc.usage_count || 0), 0);
  const popularLocations = locations.filter((loc: FrequentLocation) => (loc.usage_count || 0) > 5).length;

  if (isLoading) {
    return <div className="p-6">Loading frequent locations...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">FREQUENT LOCATIONS</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Add Frequent Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLocation} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Location Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Harris Teeter Downtown"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="location_type" className="text-sm font-medium">Location Type</Label>
                  <Select value={formData.location_type} onValueChange={(value) => setFormData({...formData, location_type: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Additional details about this location"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Address Details</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="street_address" className="text-sm font-medium">Street Address *</Label>
                    <Input
                      value={formData.street_address}
                      onChange={(e) => setFormData({...formData, street_address: e.target.value})}
                      placeholder="123 Main Street"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="Charlotte"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-sm font-medium">State *</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        placeholder="NC"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="zip_code" className="text-sm font-medium">ZIP Code</Label>
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                      placeholder="28201"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active" className="text-sm font-medium">Active Location</Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLocationMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {createLocationMutation.isPending ? "Adding..." : "Add Location"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Active Locations</CardTitle>
            <MapPin className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{activeLocations}</div>
            <p className="text-xs text-green-600 mt-1">Available for trips</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Usage</CardTitle>
            <Globe className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalUsage}</div>
            <p className="text-xs text-blue-600 mt-1">Times used in trips</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">Popular Locations</CardTitle>
            <Star className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{popularLocations}</div>
            <p className="text-xs text-yellow-600 mt-1">Used 5+ times</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Total Locations</CardTitle>
            <Building className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{locations.length}</div>
            <p className="text-xs text-purple-600 mt-1">All destinations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search locations by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {locationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Frequent Locations ({filteredLocations.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Usage</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center">
                        <MapPin className="w-8 h-8 text-gray-400 mb-2" />
                        <p>No frequent locations found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocations.map((location: FrequentLocation) => (
                    <TableRow key={location.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{location.name}</div>
                            <div className="text-sm text-gray-500">{location.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 font-medium">{location.street_address}</p>
                          <p className="text-xs text-gray-500">{location.city}, {location.state} {location.zip_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {locationTypes.find(t => t.value === location.location_type)?.label || location.location_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>{location.usage_count || 0} times</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.is_active ? "default" : "secondary"} className="text-xs">
                          {location.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(new Date(location.created_at), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLocation(location)}
                            className="hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLocation(location.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Frequent Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateLocation} className="space-y-6">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Location Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Harris Teeter Downtown"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="location_type" className="text-sm font-medium">Location Type</Label>
                <Select value={formData.location_type} onValueChange={(value) => setFormData({...formData, location_type: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Additional details about this location"
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Address Details</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="street_address" className="text-sm font-medium">Street Address *</Label>
                  <Input
                    value={formData.street_address}
                    onChange={(e) => setFormData({...formData, street_address: e.target.value})}
                    placeholder="123 Main Street"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Charlotte"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium">State *</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      placeholder="NC"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zip_code" className="text-sm font-medium">ZIP Code</Label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                    placeholder="28201"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active" className="text-sm font-medium">Active Location</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLocationMutation.isPending} className="bg-green-600 hover:bg-green-700">
                {updateLocationMutation.isPending ? "Updating..." : "Update Location"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}