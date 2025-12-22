import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, User, Phone, Car, Calendar } from "lucide-react";
import { PhoneInput } from "../components/ui/phone-input";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/queryClient";
import { useHierarchy } from "../hooks/useHierarchy";
import { usePageAccess } from "../hooks/use-page-access";
import { getUserDisplayName } from "../lib/displayNames";
import ExportButton from "../components/export/ExportButton";
import { format } from "date-fns";
import { RollbackManager } from "../utils/rollback-manager";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";

interface Driver {
  id: string;
  user_id: string;
  user_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  primary_program_id: string;
  authorized_programs?: string[];
  license_number: string;
  license_expiry?: string | null;
  vehicle_info?: string | null;
  phone?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  is_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const driverFormSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  primary_program_id: z.string().min(1, "Program is required"),
  license_number: z.string().min(1, "License number is required"),
  license_expiry: z.string().optional(),
  vehicle_info: z.string().optional(),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  is_available: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

type DriverFormData = z.infer<typeof driverFormSchema>;

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check page access permission
  usePageAccess({ permission: "view_drivers" });
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  // Fetch drivers for current hierarchy level
  const { data: driversData = [], isLoading, error } = useQuery({
    queryKey: ["/api/drivers", level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      let endpoint = "/api/drivers";
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/drivers/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/drivers/corporate-client/${selectedCorporateClient}`;
      }
      // For super admin (corporate level), use the base endpoint
      
      console.log('🚗 Drivers query:', { level, selectedProgram, selectedCorporateClient, endpoint });
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      
      console.log('🚗 Drivers response:', { status: response.status, data });
      
      return data;
    },
    enabled: true, // Always enabled - let the API handle permissions
  });

  const drivers = Array.isArray(driversData) ? driversData : [];

  // Fetch programs for form
  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/programs");
      return await response.json();
    },
  });

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      user_id: "",
      primary_program_id: selectedProgram || user?.primary_program_id || "",
      license_number: "",
      license_expiry: "",
      vehicle_info: "",
      phone: "",
      emergency_contact: "",
      emergency_phone: "",
      is_available: true,
      is_active: true,
    },
  });

  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create driver");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/organization"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Driver created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create driver",
        variant: "destructive",
      });
    },
  });

  // Update driver mutation
  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DriverFormData> }) => {
      const response = await fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update driver");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/organization"] });
      setIsDialogOpen(false);
      setSelectedDriver(null);
      form.reset();
      toast({
        title: "Success",
        description: "Driver updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update driver",
        variant: "destructive",
      });
    },
  });

  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/drivers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete driver");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/organization"] });
      toast({
        title: "Success",
        description: "Driver deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete driver",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DriverFormData) => {
    if (selectedDriver) {
      updateDriverMutation.mutate({ id: selectedDriver.id, data });
    } else {
      createDriverMutation.mutate(data);
    }
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    form.reset({
      user_id: driver.user_id,
      primary_program_id: driver.primary_program_id,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry || "",
      vehicle_info: driver.vehicle_info || "",
      phone: driver.phone || "",
      emergency_contact: driver.emergency_contact || "",
      emergency_phone: driver.emergency_phone || "",
      is_available: driver.is_available,
      is_active: driver.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteDriverMutation.mutate(id);
  };

  const handleNewDriver = () => {
    setSelectedDriver(null);
    form.reset({
      user_id: "",
      primary_program_id: selectedProgram || user?.primary_program_id || "",
      license_number: "",
      license_expiry: "",
      vehicle_info: "",
      phone: "",
      emergency_contact: "",
      emergency_phone: "",
      is_available: true,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const filteredDrivers = (drivers as Driver[]).filter((driver: Driver) =>
    driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.vehicle_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${driver.first_name || ''} ${driver.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading if data is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error if there's an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error loading drivers</h3>
          <p className="text-sm text-gray-500 mb-4">{error.message || 'Unknown error'}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/drivers"] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header - Only show if unified header is disabled (fallback) */}
      {!RollbackManager.isUnifiedHeaderEnabled() && (
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
                drivers.
              </h1>
            </div>
          <div className="flex items-center gap-3">
            {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
              <HeaderScopeSelector />
            )}
          <ExportButton
            data={filteredDrivers}
            columns={[
              { key: 'id', label: 'Driver ID' },
              { key: 'name', label: 'Name', formatter: (driver) => getUserDisplayName(driver) },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'license_number', label: 'License Number' },
              { key: 'license_expiry', label: 'License Expiry', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : 'N/A' },
              { key: 'vehicle_info', label: 'Vehicle Info' },
              { key: 'is_active', label: 'Status', formatter: (value) => value ? 'Active' : 'Inactive' },
              { key: 'is_available', label: 'Available', formatter: (value) => value ? 'Yes' : 'No' },
              { key: 'created_at', label: 'Created', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '' }
            ]}
            filename={`drivers-${format(new Date(), 'yyyy-MM-dd')}`}
            onExportStart={() => console.log('Starting driver export...')}
            onExportComplete={() => console.log('Driver export completed!')}
            onExportError={(error) => console.error('Driver export failed:', error)}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewDriver}>
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedDriver ? "Edit Driver" : "Add New Driver"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter user ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="primary_program_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(programs as any[]).map((program: any) => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="license_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter license number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="license_expiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Expiry</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="vehicle_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Info</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2020 Honda Pilot - White" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <PhoneInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Enter phone number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergency_contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter emergency contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="emergency_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Enter emergency phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="is_available"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Available</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Active</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDriverMutation.isPending || updateDriverMutation.isPending}>
                    {createDriverMutation.isPending || updateDriverMutation.isPending
                      ? "Saving..."
                      : selectedDriver
                      ? "Update Driver"
                      : "Create Driver"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-gray-500">
          {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDrivers.map((driver: Driver) => (
          <Card key={driver.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {driver.first_name && driver.last_name 
                    ? `${driver.first_name} ${driver.last_name}` 
                    : driver.email || 'Unknown Driver'}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(driver)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Driver</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this driver? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(driver.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {driver.email && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm text-gray-600">{driver.email}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">License:</span>
                <span className="text-sm">{driver.license_number}</span>
              </div>
              
              {driver.vehicle_info && (
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{driver.vehicle_info}</span>
                </div>
              )}
              
              {driver.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{driver.phone}</span>
                </div>
              )}
              
              {driver.license_expiry && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Expires: {new Date(driver.license_expiry).toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="flex space-x-2 pt-2">
                <Badge variant={driver.is_available ? "default" : "secondary"}>
                  {driver.is_available ? "Available" : "Unavailable"}
                </Badge>
                <Badge variant={driver.is_active ? "default" : "secondary"}>
                  {driver.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No drivers found" : "No drivers yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Get started by adding your first driver"}
          </p>
          {!searchTerm && (
            <Button onClick={handleNewDriver}>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          )}
        </div>
      )}
    </div>
  );
}