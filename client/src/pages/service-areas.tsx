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
import { MapPin, Plus, Search, Edit, Trash2, Users, Building, Globe, Map } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { format } from "date-fns";

interface ServiceArea {
  id: string;
  organization_id: string;
  nickname: string;
  description?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  full_address?: string | null;
  boundary_coordinates?: any | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at: string;
  // Additional data
  client_count?: number;
  organization_name?: string;
}

interface ServiceAreaFormData {
  nickname: string;
  description: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  boundary_coordinates: string;
  is_active: boolean;
}

const initialFormData: ServiceAreaFormData = {
  nickname: "",
  description: "",
  street_address: "",
  city: "",
  state: "",
  zip_code: "",
  boundary_coordinates: "",
  is_active: true,
};

export default function ServiceAreas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedServiceArea, setSelectedServiceArea] = useState<ServiceArea | null>(null);
  const [formData, setFormData] = useState<ServiceAreaFormData>(initialFormData);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  // Fetch service areas
  const { data: serviceAreasData, isLoading: serviceAreasLoading } = useQuery({
    queryKey: ["/api/serviceareas", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/serviceareas/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  const serviceAreas = Array.isArray(serviceAreasData) ? serviceAreasData : [];

  // Create service area mutation
  const createServiceAreaMutation = useMutation({
    mutationFn: async (serviceAreaData: ServiceAreaFormData) => {
      const fullAddress = `${serviceAreaData.street_address}, ${serviceAreaData.city}, ${serviceAreaData.state} ${serviceAreaData.zip_code}`.trim();
      
      const apiData = {
        organizationId: currentOrganization?.id,
        nickname: serviceAreaData.nickname,
        description: serviceAreaData.description || undefined,
        streetAddress: serviceAreaData.street_address,
        city: serviceAreaData.city,
        state: serviceAreaData.state,
        zipCode: serviceAreaData.zip_code,
        fullAddress: fullAddress,
        boundaryCoordinates: serviceAreaData.boundary_coordinates 
          ? JSON.parse(serviceAreaData.boundary_coordinates) 
          : undefined,
        isActive: serviceAreaData.is_active
      };
      return apiRequest("POST", "/api/serviceareas", apiData);
    },
    onSuccess: () => {
      toast({
        title: "Service Area Created",
        description: "Service area has been successfully added.",
      });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      queryClient.invalidateQueries({ queryKey: ["/api/serviceareas", currentOrganization?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create service area. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update service area mutation
  const updateServiceAreaMutation = useMutation({
    mutationFn: async ({ id, ...serviceAreaData }: any) => {
      const fullAddress = `${serviceAreaData.street_address}, ${serviceAreaData.city}, ${serviceAreaData.state} ${serviceAreaData.zip_code}`.trim();
      
      return apiRequest("PUT", `/api/serviceareas/${id}`, {
        nickname: serviceAreaData.nickname,
        description: serviceAreaData.description || undefined,
        street_address: serviceAreaData.street_address,
        city: serviceAreaData.city,
        state: serviceAreaData.state,
        zip_code: serviceAreaData.zip_code,
        full_address: fullAddress,
        boundary_coordinates: serviceAreaData.boundary_coordinates 
          ? JSON.parse(serviceAreaData.boundary_coordinates) 
          : null,
        is_active: serviceAreaData.is_active
      });
    },
    onSuccess: () => {
      toast({
        title: "Service Area Updated",
        description: "Service area has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setSelectedServiceArea(null);
      queryClient.invalidateQueries({ queryKey: ["/api/serviceareas", currentOrganization?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update service area. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete service area mutation
  const deleteServiceAreaMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/serviceareas/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Service Area Deleted",
        description: "Service area has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/serviceareas", currentOrganization?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete service area. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter service areas
  const filteredServiceAreas = serviceAreas.filter((area: ServiceArea) => {
    const matchesSearch = 
      area.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && area.is_active) ||
      (statusFilter === "inactive" && !area.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateServiceArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nickname) {
      toast({
        title: "Missing Information",
        description: "Please provide a nickname for the service area.",
        variant: "destructive",
      });
      return;
    }
    createServiceAreaMutation.mutate(formData);
  };

  const handleEditServiceArea = (area: ServiceArea) => {
    setSelectedServiceArea(area);
    setFormData({
      nickname: area.nickname,
      description: area.description || "",
      street_address: area.street_address || "",
      city: area.city || "",
      state: area.state || "",
      zip_code: area.zip_code || "",
      boundary_coordinates: area.boundary_coordinates 
        ? JSON.stringify(area.boundary_coordinates, null, 2) 
        : "",
      is_active: area.is_active !== false,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateServiceArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceArea) return;
    updateServiceAreaMutation.mutate({
      id: selectedServiceArea.id,
      ...formData,
    });
  };

  const handleDeleteServiceArea = (id: string) => {
    if (confirm("Are you sure you want to delete this service area? This action cannot be undone.")) {
      deleteServiceAreaMutation.mutate(id);
    }
  };

  // Calculate stats
  const activeAreas = serviceAreas.filter((area: ServiceArea) => area.is_active).length;
  const totalClients = serviceAreas.reduce((sum: number, area: ServiceArea) => sum + (area.client_count || 0), 0);

  if (serviceAreasLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">SERVICE AREAS</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Service Area
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Add New Service Area</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateServiceArea} className="space-y-6">
              <div>
                <Label htmlFor="nickname" className="text-sm font-medium">Service Area Name *</Label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                  placeholder="e.g., Downtown Charlotte, Matthews/Mint Hill"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the service area coverage, landmarks, or specific details"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Physical Address</h4>
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

              <div>
                <Label htmlFor="boundary_coordinates" className="text-sm font-medium">Boundary Coordinates (JSON)</Label>
                <Textarea
                  value={formData.boundary_coordinates}
                  onChange={(e) => setFormData({...formData, boundary_coordinates: e.target.value})}
                  placeholder='{"type": "Polygon", "coordinates": [[[lat, lng], [lat, lng], ...]]}'
                  className="mt-1 font-mono text-sm"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: GeoJSON format for precise boundary mapping
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active" className="text-sm font-medium">Active Service Area</Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createServiceAreaMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {createServiceAreaMutation.isPending ? "Creating..." : "Add Service Area"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Active Areas</CardTitle>
            <MapPin className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{activeAreas}</div>
            <p className="text-xs text-blue-600 mt-1">Currently serving</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Total Clients</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalClients}</div>
            <p className="text-xs text-green-600 mt-1">Across all areas</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Coverage</CardTitle>
            <Globe className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {serviceAreas.filter((area: ServiceArea) => area.boundary_coordinates).length}
            </div>
            <p className="text-xs text-purple-600 mt-1">Mapped boundaries</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">Total Areas</CardTitle>
            <Building className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{serviceAreas.length}</div>
            <p className="text-xs text-yellow-600 mt-1">All registered</p>
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
                  placeholder="Search service areas by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Areas Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Service Areas ({filteredServiceAreas.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Service Area</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Clients</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServiceAreas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center">
                        <MapPin className="w-8 h-8 text-gray-400 mb-2" />
                        <p>No service areas found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServiceAreas.map((area: ServiceArea) => (
                    <TableRow key={area.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{area.nickname}</div>
                            <div className="text-sm text-gray-500">ID: {area.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {area.full_address ? (
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{area.street_address}</p>
                              <p className="text-xs text-gray-500">{area.city}, {area.state} {area.zip_code}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No address provided</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 truncate">
                            {area.description || "No description provided"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{area.client_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={area.is_active ? "default" : "secondary"} className="text-xs">
                          {area.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(new Date(area.created_at), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={() => handleEditServiceArea(area)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteServiceArea(area.id)}
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

      {/* Edit Service Area Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Service Area</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateServiceArea} className="space-y-6">
            <div>
              <Label htmlFor="nickname" className="text-sm font-medium">Service Area Name *</Label>
              <Input
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                placeholder="e.g., Downtown Charlotte, Matthews/Mint Hill"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the service area coverage, landmarks, or specific details"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Physical Address</h4>
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

            <div>
              <Label htmlFor="boundary_coordinates" className="text-sm font-medium">Boundary Coordinates (JSON)</Label>
              <Textarea
                value={formData.boundary_coordinates}
                onChange={(e) => setFormData({...formData, boundary_coordinates: e.target.value})}
                placeholder='{"type": "Polygon", "coordinates": [[[lat, lng], [lat, lng], ...]]}'
                className="mt-1 font-mono text-sm"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: GeoJSON format for precise boundary mapping
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active" className="text-sm font-medium">Active Service Area</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateServiceAreaMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {updateServiceAreaMutation.isPending ? "Updating..." : "Update Service Area"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}