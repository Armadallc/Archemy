import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Car, Plus, Edit, Trash2, Calendar, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";

interface Vehicle {
  id: string;
  organization_id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  license_plate: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface VehicleFormData {
  organization_id: string;
  year: string;
  make: string;
  model: string;
  color: string;
  license_plate: string;
}

const initialFormData: VehicleFormData = {
  organization_id: "",
  year: "",
  make: "",
  model: "",
  color: "",
  license_plate: "",
};

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  // Fetch all organizations for assignment dropdown
  const { data: organizations } = useQuery({
    queryKey: ["/api/super-admin/organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/super-admin/organizations");
      return await response.json();
    },
    enabled: user?.role === 'super_admin' || user?.role === 'monarch_owner',
  });

  // Fetch vehicles - use super admin endpoint if user is super admin
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: user?.role === 'super_admin' ? ["/api/super-admin/vehicles", currentOrganization?.id] : ["/api/vehicles", currentOrganization?.id],
    queryFn: async () => {
      if (user?.role === 'super_admin') {
        const response = await apiRequest("GET", `/api/super-admin/vehicles`);
        const allData = await response.json();
        
        // Filter by current organization if one is selected
        if (currentOrganization?.id) {
          return allData.filter((vehicle: any) => vehicle.organization_id === currentOrganization.id);
        } else {
          return allData;
        }
      } else {
        if (!currentOrganization?.id) return [];
        const response = await apiRequest("GET", `/api/vehicles/organization/${currentOrganization.id}`);
        return await response.json();
      }
    },
    enabled: user?.role === 'super_admin' || !!currentOrganization?.id,
  });

  const vehicles: Vehicle[] = Array.isArray(vehiclesData) ? vehiclesData : [];

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter((vehicle) =>
    `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.color.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      return apiRequest("POST", "/api/vehicles", {
        ...data,
        year: parseInt(data.year),
        organization_id: data.organization_id || currentOrganization?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Vehicle Created",
        description: "Vehicle has been successfully created.",
      });
      // Invalidate all vehicle-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/vehicles"] });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create vehicle. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update vehicle mutation
  const updateVehicleMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<VehicleFormData> }) => {
      const updates = { ...data.updates };
      if (updates.year) {
        updates.year = parseInt(updates.year as string) as any;
      }
      return apiRequest("PATCH", `/api/vehicles/${data.id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Vehicle Updated",
        description: "Vehicle has been successfully updated.",
      });
      // Invalidate all vehicle-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/vehicles"] });
      setIsEditDialogOpen(false);
      setSelectedVehicle(null);
      setFormData(initialFormData);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vehicle. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      return apiRequest("DELETE", `/api/vehicles/${vehicleId}`);
    },
    onSuccess: () => {
      toast({
        title: "Vehicle Deleted",
        description: "Vehicle has been successfully deleted.",
      });
      // Invalidate all vehicle-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/vehicles"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete vehicle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    // Set default organization if not specified
    const finalFormData = {
      ...formData,
      organization_id: formData.organization_id || currentOrganization?.id || ''
    };
    createVehicleMutation.mutate(finalFormData);
  };

  const handleUpdateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle) {
      updateVehicleMutation.mutate({
        id: selectedVehicle.id,
        updates: formData,
      });
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      organization_id: vehicle.organization_id,
      year: vehicle.year.toString(),
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      license_plate: vehicle.license_plate,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };

  if (vehiclesLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">FLEET MANAGEMENT</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    placeholder="Honda, Toyota, Ford..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="Pilot, Sienna, Transit..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color *</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="White, Silver, Blue..."
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                  placeholder="ABC-1234"
                />
              </div>

              {/* Organization Assignment - show for super admins and monarch owners */}
              {(user?.role === 'super_admin' || user?.role === 'monarch_owner') && organizations && (
                <div>
                  <Label htmlFor="organization_id">Organization *</Label>
                  <Select 
                    value={formData.organization_id || currentOrganization?.id || ''} 
                    onValueChange={(value) => setFormData({...formData, organization_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org: any) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
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
                  disabled={createVehicleMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createVehicleMutation.isPending ? "Creating..." : "Create Vehicle"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4"
          />
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center">
            <Car className="w-4 h-4 mr-1" />
            {filteredVehicles.length} vehicles
          </span>
        </div>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="w-5 h-5 mr-2" />
            Vehicle Fleet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No vehicles found</p>
              <p className="text-sm">Add vehicles to start managing your fleet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Car className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                          <div className="text-sm text-gray-500">{vehicle.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {vehicle.license_plate || 'Not set'}
                      </span>
                    </TableCell>
                    <TableCell>{vehicle.color}</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.is_active ? "default" : "secondary"}>
                        {vehicle.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditVehicle(vehicle)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVehicle(vehicle.id)}
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

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateVehicle} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-year">Year *</Label>
                <Input
                  id="edit-year"
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-make">Make *</Label>
                <Input
                  id="edit-make"
                  value={formData.make}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-model">Model *</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color *</Label>
                <Input
                  id="edit-color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-license_plate">License Plate</Label>
              <Input
                id="edit-license_plate"
                value={formData.license_plate}
                onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
              />
            </div>

            {/* Organization Assignment - show for super admins and monarch owners */}
            {(user?.role === 'super_admin' || user?.role === 'monarch_owner') && organizations && (
              <div>
                <Label htmlFor="edit-organization_id">Organization *</Label>
                <Select 
                  value={formData.organization_id} 
                  onValueChange={(value) => setFormData({...formData, organization_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: any) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
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
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedVehicle(null);
                  setFormData(initialFormData);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateVehicleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateVehicleMutation.isPending ? "Updating..." : "Update Vehicle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}