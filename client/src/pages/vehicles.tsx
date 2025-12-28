import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Car, Plus, Edit, Trash2, ChevronRight, ChevronDown, ChevronsUpDown, ChevronsDownUp, ArrowUp, ArrowDown, Building2, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useHierarchy } from "../hooks/useHierarchy";
import { useAuth } from "../hooks/useAuth";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";
import { useBulkOperations } from "../hooks/useBulkOperations";
import { useFeatureFlag } from "../hooks/use-permissions";
import { format } from "date-fns";

interface Vehicle {
  id: string;
  program_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string;
  color: string;
  capacity: number;
  vehicle_type: 'sedan' | 'suv' | 'van' | 'bus' | 'wheelchair_accessible';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  is_active: boolean;
  current_driver_id?: string;
  notes?: string;
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
  current_driver?: {
    id: string;
    user_id: string;
    users?: {
      user_name: string;
      email: string;
    };
  };
}

interface VehicleFormData {
  program_id: string;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  vin?: string;
  color: string;
  capacity: string;
  vehicle_type: 'sedan' | 'suv' | 'van' | 'bus' | 'wheelchair_accessible';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  notes?: string;
}

const initialFormData: VehicleFormData = {
  program_id: "",
  make: "",
  model: "",
  year: "",
  license_plate: "",
  vin: "",
  color: "",
  capacity: "",
  vehicle_type: 'sedan',
  fuel_type: 'gasoline',
  notes: "",
};

type SortColumn = 'vehicle' | 'year' | 'license_plate' | 'type' | 'capacity' | 'program' | 'tenant' | 'status';

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();
  const { user } = useAuth();
  const { isEnabled: bulkOpsEnabled } = useFeatureFlag("bulk_operations_enabled");
  const bulkOps = useBulkOperations('vehicles');

  // Fetch programs for form and display
  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/programs");
      return await response.json();
    },
  });

  // Fetch corporate clients for display
  const { data: corporateClients = [] } = useQuery({
    queryKey: ["/api/corporate-clients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/corporate-clients");
      return await response.json();
    },
    enabled: user?.role === 'super_admin',
  });

  // Fetch vehicles based on current hierarchy level
  const { data: vehiclesData, isLoading: vehiclesLoading, error } = useQuery({
    queryKey: ["/api/vehicles", level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      try {
        let endpoint = "/api/vehicles";
        
        // Build endpoint based on hierarchy level
        if (level === 'program' && selectedProgram) {
          endpoint = `/api/vehicles/program/${selectedProgram}`;
        } else if (level === 'corporate' && selectedCorporateClient) {
          endpoint = `/api/vehicles/corporate-client/${selectedCorporateClient}`;
        }
        
        const response = await apiRequest("GET", endpoint);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch vehicles: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (err: any) {
        console.error("Error fetching vehicles:", err);
        throw err;
      }
    },
    enabled: true,
    retry: 1,
  });

  const vehicles: Vehicle[] = Array.isArray(vehiclesData) ? vehiclesData : [];

  // Helper to get program name
  const getProgramName = (programId: string | undefined): string => {
    if (!programId) return 'N/A';
    const program = Array.isArray(programs) 
      ? programs.find((p: any) => p.id === programId)
      : null;
    return program?.name || 'N/A';
  };

  // Helper to get corporate client name
  const getCorporateClientName = (programId: string | undefined): string => {
    if (!programId) return 'N/A';
    const program = Array.isArray(programs) 
      ? programs.find((p: any) => p.id === programId)
      : null;
    if (program?.corporate_client_id) {
      const client = Array.isArray(corporateClients)
        ? corporateClients.find((c: any) => c.id === program.corporate_client_id)
        : null;
      return client?.name || 'N/A';
    }
    return 'N/A';
  };

  // Filter vehicles based on search term
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) =>
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProgramName(vehicle.program_id).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm, programs]);

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    if (!sortColumn) return filteredVehicles;

    const getProgramNameLocal = (programId: string): string => {
      const program = Array.isArray(programs) 
        ? programs.find((p: any) => p.id === programId)
        : null;
      return program?.name || 'N/A';
    };

    const getCorporateClientNameLocal = (programId: string): string => {
      const program = Array.isArray(programs) 
        ? programs.find((p: any) => p.id === programId)
        : null;
      if (program?.corporate_client_id) {
        const client = Array.isArray(corporateClients)
          ? corporateClients.find((c: any) => c.id === program.corporate_client_id)
          : null;
        return client?.name || 'N/A';
      }
      return 'N/A';
    };

    const sorted = [...filteredVehicles].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'vehicle':
          aValue = `${a.make} ${a.model}`.toLowerCase();
          bValue = `${b.make} ${b.model}`.toLowerCase();
          break;
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'license_plate':
          aValue = a.license_plate.toLowerCase();
          bValue = b.license_plate.toLowerCase();
          break;
        case 'type':
          aValue = a.vehicle_type.toLowerCase();
          bValue = b.vehicle_type.toLowerCase();
          break;
        case 'capacity':
          aValue = a.capacity;
          bValue = b.capacity;
          break;
        case 'program':
          aValue = getProgramNameLocal(a.program_id);
          bValue = getProgramNameLocal(b.program_id);
          break;
        case 'tenant':
          aValue = getCorporateClientNameLocal(a.program_id);
          bValue = getCorporateClientNameLocal(b.program_id);
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredVehicles, sortColumn, sortDirection, programs, corporateClients]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const expandAllVehicles = () => {
    setExpandedVehicles(new Set(sortedVehicles.map(v => v.id)));
  };

  const collapseAllVehicles = () => {
    setExpandedVehicles(new Set());
  };

  const areAllExpanded = sortedVehicles.length > 0 && expandedVehicles.size === sortedVehicles.length;
  const areAllCollapsed = expandedVehicles.size === 0;

  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      return apiRequest("POST", "/api/vehicles", {
        ...data,
        year: parseInt(data.year),
        capacity: parseInt(data.capacity),
        program_id: data.program_id || selectedProgram || '',
      });
    },
    onSuccess: () => {
      toast({
        title: "Vehicle Created",
        description: "Vehicle has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
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
      if (updates.capacity) {
        updates.capacity = parseInt(updates.capacity as string) as any;
      }
      return apiRequest("PATCH", `/api/vehicles/${data.id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Vehicle Updated",
        description: "Vehicle has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
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
    const finalFormData = {
      ...formData,
      program_id: formData.program_id || selectedProgram || ''
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
      program_id: vehicle.program_id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      license_plate: vehicle.license_plate,
      vin: vehicle.vin || "",
      color: vehicle.color,
      capacity: vehicle.capacity.toString(),
      vehicle_type: vehicle.vehicle_type,
      fuel_type: vehicle.fuel_type,
      notes: vehicle.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    deleteVehicleMutation.mutate(vehicleId);
  };

  if (vehiclesLoading) {
    return (
      <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center py-8">
          <p className="text-red-500">Error loading vehicles: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="px-6 py-6 rounded-lg card-neu card-glow-border flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px' }}>
        <div>
          <h1 
            className="font-bold text-foreground" 
            style={{ 
              fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
              fontSize: '110px'
            }}
          >
            vehicles.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
            <HeaderScopeSelector />
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2 card-neu hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <Plus className="h-4 w-4" style={{ textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)' }} />
                <span style={{ textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)' }}>New Vehicle</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
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
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license_plate">License Plate *</Label>
                    <Input
                      id="license_plate"
                      value={formData.license_plate}
                      onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                      placeholder="ABC-1234"
                      required
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vin">VIN</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={(e) => setFormData({...formData, vin: e.target.value})}
                      placeholder="17-character VIN"
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      placeholder="Number of passengers"
                      required
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                    <Select 
                      value={formData.vehicle_type} 
                      onValueChange={(value: any) => setFormData({...formData, vehicle_type: value})}
                    >
                      <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        <SelectItem value="sedan" className="hover:card-neu-flat">Sedan</SelectItem>
                        <SelectItem value="suv" className="hover:card-neu-flat">SUV</SelectItem>
                        <SelectItem value="van" className="hover:card-neu-flat">Van</SelectItem>
                        <SelectItem value="bus" className="hover:card-neu-flat">Bus</SelectItem>
                        <SelectItem value="wheelchair_accessible" className="hover:card-neu-flat">Wheelchair Accessible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fuel_type">Fuel Type *</Label>
                    <Select 
                      value={formData.fuel_type} 
                      onValueChange={(value: any) => setFormData({...formData, fuel_type: value})}
                    >
                      <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        <SelectItem value="gasoline" className="hover:card-neu-flat">Gasoline</SelectItem>
                        <SelectItem value="diesel" className="hover:card-neu-flat">Diesel</SelectItem>
                        <SelectItem value="electric" className="hover:card-neu-flat">Electric</SelectItem>
                        <SelectItem value="hybrid" className="hover:card-neu-flat">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes..."
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                </div>

                {/* Program Assignment - show for super admins */}
                {user?.role === 'super_admin' && programs && (
                  <div>
                    <Label htmlFor="program_id">Program *</Label>
                    <Select 
                      value={formData.program_id || selectedProgram || ''} 
                      onValueChange={(value) => setFormData({...formData, program_id: value})}
                    >
                      <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        {programs.map((program: any) => (
                          <SelectItem key={program.id} value={program.id} className="hover:card-neu-flat">
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
                    className="card-neu-flat hover:card-neu [&]:shadow-none"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createVehicleMutation.isPending}
                    className="card-neu hover:card-neu [&]:shadow-none"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    {createVehicleMutation.isPending ? "Creating..." : "Create Vehicle"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Operations Bar */}
      {bulkOpsEnabled && bulkOps.selectedItems.length > 0 && (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 20px rgba(255, 132, 117, 0.3), 0 0 40px rgba(255, 132, 117, 0.15)' }}>
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium">
              {bulkOps.selectedItems.length} vehicle{bulkOps.selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  bulkOps.selectedItems.forEach(id => handleDeleteVehicle(id));
                  bulkOps.clearSelection();
                }}
                variant="destructive"
                size="sm"
                className="card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                onClick={bulkOps.clearSelection}
                variant="outline"
                size="sm"
                className="card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8475]"
                style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Select value={sortColumn || ''} onValueChange={(value) => handleSort(value as SortColumn)}>
                <SelectTrigger className="w-40 card-neu-flat hover:card-neu [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="license_plate">License Plate</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={areAllExpanded ? collapseAllVehicles : expandAllVehicles}
                variant="outline"
                size="sm"
                className="card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                {areAllExpanded ? (
                  <>
                    <ChevronsUpDown className="h-4 w-4 mr-2" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronsDownUp className="h-4 w-4 mr-2" />
                    Expand All
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles List */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardContent className="p-0">
          {sortedVehicles.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No vehicles found</p>
              <p className="text-sm">Add vehicles to start managing your fleet</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Sticky Header */}
              <div className="sticky top-6 z-10 font-semibold text-sm card-neu-flat" style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', border: 'none' }}>
                <div className="flex items-center gap-3 p-4">
                  {bulkOpsEnabled && (
                    <input
                      type="checkbox"
                      checked={bulkOps.selectedItems.length === sortedVehicles.length && sortedVehicles.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          bulkOps.selectAll(sortedVehicles.map(v => v.id));
                        } else {
                          bulkOps.clearSelection();
                        }
                      }}
                      className="h-4 w-4"
                      title="Select All"
                    />
                  )}
                  <div className="w-4" />
                  <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                    <div 
                      className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-left"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      onClick={() => handleSort('vehicle')}
                      title="Click to sort by Vehicle"
                    >
                      Vehicle{getSortIcon('vehicle')}
                    </div>
                    <div 
                      className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-left"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      onClick={() => handleSort('year')}
                      title="Click to sort by Year"
                    >
                      Year{getSortIcon('year')}
                    </div>
                    <div 
                      className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-left"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      onClick={() => handleSort('license_plate')}
                      title="Click to sort by License Plate"
                    >
                      License Plate{getSortIcon('license_plate')}
                    </div>
                    <div 
                      className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-left"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      onClick={() => handleSort('type')}
                      title="Click to sort by Type"
                    >
                      Type{getSortIcon('type')}
                    </div>
                    <div 
                      className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-left"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      onClick={() => handleSort('capacity')}
                      title="Click to sort by Capacity"
                    >
                      Capacity{getSortIcon('capacity')}
                    </div>
                    <div 
                      className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-left"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      onClick={() => handleSort('program')}
                      title="Click to sort by Program"
                    >
                      Program{getSortIcon('program')}
                    </div>
                    <div 
                      className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-left"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      onClick={() => handleSort('tenant')}
                      title="Click to sort by Primary Tenant"
                    >
                      Primary Tenant{getSortIcon('tenant')}
                    </div>
                    <div 
                      className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-left"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      onClick={() => handleSort('status')}
                      title="Click to sort by Status"
                    >
                      Status{getSortIcon('status')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Rows */}
              {sortedVehicles.map((vehicle) => {
                const isExpanded = expandedVehicles.has(vehicle.id);
                return (
                  <Collapsible
                    key={vehicle.id}
                    open={isExpanded}
                    onOpenChange={(open) => {
                      const newExpanded = new Set(expandedVehicles);
                      if (open) {
                        newExpanded.add(vehicle.id);
                      } else {
                        newExpanded.delete(vehicle.id);
                      }
                      setExpandedVehicles(newExpanded);
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <div 
                        className="flex items-center gap-3 p-4 transition-all cursor-pointer card-neu-flat hover:card-neu"
                        style={{ 
                          backgroundColor: 'var(--background)',
                          border: 'none'
                        }}
                      >
                        {bulkOpsEnabled && (
                          <input
                            type="checkbox"
                            checked={bulkOps.selectedItems.includes(vehicle.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              bulkOps.toggleItem(vehicle.id);
                            }}
                            className="h-4 w-4"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select vehicle ${vehicle.id}`}
                            title={`Select vehicle ${vehicle.id}`}
                          />
                        )}
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-2 items-center text-sm">
                          {/* Vehicle */}
                          <div className="col-span-1 truncate text-sm text-left" style={{ color: 'var(--foreground)' }}>
                            <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{vehicle.color}</div>
                          </div>
                        {/* Year */}
                        <div className="col-span-1 truncate text-sm text-left" style={{ color: 'var(--muted-foreground)' }}>
                          {vehicle.year}
                        </div>
                        {/* License Plate */}
                        <div className="col-span-1 truncate font-mono text-xs text-sm text-left" style={{ color: 'var(--muted-foreground)' }}>
                          {vehicle.license_plate}
                        </div>
                        {/* Type */}
                        <div className="col-span-1 text-sm text-left">
                          <Badge variant="outline" className="text-xs">
                            {vehicle.vehicle_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        {/* Capacity */}
                        <div className="col-span-1 truncate text-sm text-left" style={{ color: 'var(--muted-foreground)' }}>
                          {vehicle.capacity}
                        </div>
                        {/* Program */}
                        <div className="col-span-2 truncate text-sm text-left" style={{ color: 'var(--muted-foreground)' }}>
                          {getProgramName(vehicle.program_id)}
                        </div>
                        {/* Primary Tenant */}
                        <div className="col-span-2 truncate text-sm text-left" style={{ color: 'var(--muted-foreground)' }}>
                          {getCorporateClientName(vehicle.program_id)}
                        </div>
                        {/* Status */}
                        <div className="col-span-1 text-sm text-left">
                          <Badge variant={vehicle.is_active ? "default" : "secondary"} className="text-xs">
                            {vehicle.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t card-neu-flat" style={{ backgroundColor: 'var(--background)', borderTopColor: 'var(--border)', border: 'none' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-2">
                            <div>
                              <strong>Vehicle ID:</strong> <span className="font-mono text-xs">{vehicle.id}</span>
                            </div>
                            <div>
                              <strong>Make:</strong> {vehicle.make}
                            </div>
                            <div>
                              <strong>Model:</strong> {vehicle.model}
                            </div>
                            <div>
                              <strong>Year:</strong> {vehicle.year}
                            </div>
                            <div>
                              <strong>Color:</strong> {vehicle.color}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <strong>License Plate:</strong> <span className="font-mono">{vehicle.license_plate}</span>
                            </div>
                            <div>
                              <strong>VIN:</strong> {vehicle.vin || 'N/A'}
                            </div>
                            <div>
                              <strong>Vehicle Type:</strong> {vehicle.vehicle_type.replace('_', ' ').toUpperCase()}
                            </div>
                            <div>
                              <strong>Fuel Type:</strong> {vehicle.fuel_type.toUpperCase()}
                            </div>
                            <div>
                              <strong>Capacity:</strong> {vehicle.capacity} passengers
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <strong>Program:</strong> {getProgramName(vehicle.program_id)}
                            </div>
                            <div>
                              <strong>Primary Tenant:</strong> {getCorporateClientName(vehicle.program_id)}
                            </div>
                            <div>
                              <strong>Current Driver:</strong> {vehicle.current_driver?.users?.user_name || 'Unassigned'}
                            </div>
                            <div>
                              <strong>Status:</strong> {vehicle.is_active ? 'Active' : 'Inactive'}
                            </div>
                            <div>
                              <strong>Notes:</strong> {vehicle.notes || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderTopColor: 'var(--border)' }}>
                          <Button
                            onClick={() => handleEditVehicle(vehicle)}
                            variant="outline"
                            size="sm"
                            className="card-neu-flat hover:card-neu [&]:shadow-none"
                            style={{ backgroundColor: 'var(--background)', border: 'none' }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="card-neu-flat hover:card-neu [&]:shadow-none text-red-600 hover:text-red-700"
                                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent style={{ backgroundColor: 'var(--background)' }}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {vehicle.make} {vehicle.model} ({vehicle.license_plate})? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="card-neu-flat hover:card-neu [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
                                  className="card-neu hover:card-neu [&]:shadow-none"
                                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
          )}
        </CardContent>
      </Card>

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
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
                  className="card-neu-flat [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
              <div>
                <Label htmlFor="edit-make">Make *</Label>
                <Input
                  id="edit-make"
                  value={formData.make}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
                  required
                  className="card-neu-flat [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
                  className="card-neu-flat [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color *</Label>
                <Input
                  id="edit-color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  required
                  className="card-neu-flat [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-license_plate">License Plate *</Label>
                <Input
                  id="edit-license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                  required
                  className="card-neu-flat [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
              <div>
                <Label htmlFor="edit-vin">VIN</Label>
                <Input
                  id="edit-vin"
                  value={formData.vin}
                  onChange={(e) => setFormData({...formData, vin: e.target.value})}
                  className="card-neu-flat [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-capacity">Capacity *</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  required
                  className="card-neu-flat [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
              <div>
                <Label htmlFor="edit-vehicle_type">Vehicle Type *</Label>
                <Select 
                  value={formData.vehicle_type} 
                  onValueChange={(value: any) => setFormData({...formData, vehicle_type: value})}
                >
                  <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectItem value="sedan" className="hover:card-neu-flat">Sedan</SelectItem>
                    <SelectItem value="suv" className="hover:card-neu-flat">SUV</SelectItem>
                    <SelectItem value="van" className="hover:card-neu-flat">Van</SelectItem>
                    <SelectItem value="bus" className="hover:card-neu-flat">Bus</SelectItem>
                    <SelectItem value="wheelchair_accessible" className="hover:card-neu-flat">Wheelchair Accessible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-fuel_type">Fuel Type *</Label>
                <Select 
                  value={formData.fuel_type} 
                  onValueChange={(value: any) => setFormData({...formData, fuel_type: value})}
                >
                  <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectItem value="gasoline" className="hover:card-neu-flat">Gasoline</SelectItem>
                    <SelectItem value="diesel" className="hover:card-neu-flat">Diesel</SelectItem>
                    <SelectItem value="electric" className="hover:card-neu-flat">Electric</SelectItem>
                    <SelectItem value="hybrid" className="hover:card-neu-flat">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="card-neu-flat [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
            </div>

            {/* Program Assignment - show for super admins */}
            {user?.role === 'super_admin' && programs && (
              <div>
                <Label htmlFor="edit-program_id">Program *</Label>
                <Select 
                  value={formData.program_id} 
                  onValueChange={(value) => setFormData({...formData, program_id: value})}
                >
                  <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    {programs.map((program: any) => (
                      <SelectItem key={program.id} value={program.id} className="hover:card-neu-flat">
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
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedVehicle(null);
                  setFormData(initialFormData);
                }}
                className="card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateVehicleMutation.isPending}
                className="card-neu hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
