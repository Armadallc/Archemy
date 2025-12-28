import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, ChevronRight, ChevronDown, ChevronsUpDown, ChevronsDownUp, ArrowUp, ArrowDown, User } from "lucide-react";
import { PhoneInput } from "../components/ui/phone-input";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
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
import { useBulkOperations } from "../hooks/useBulkOperations";
import { UserAvatar } from "../components/users/UserAvatar";
import { useFeatureFlag } from "../hooks/use-permissions";

interface Driver {
  id: string;
  user_id: string;
  user_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  primary_program_id?: string;
  program_id?: string; // Driver table has program_id
  program?: { id: string; name: string; corporate_client_id?: string };
  corporate_client?: { id: string; name: string };
  users?: {
    user_id: string;
    user_name: string;
    email: string;
    first_name?: string;
    last_name?: string;
    primary_program_id?: string;
    avatar_url?: string;
    phone?: string;
  };
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
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check page access permission
  usePageAccess({ permission: "view_drivers" });
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  // Feature flags
  const { isEnabled: bulkOpsEnabled } = useFeatureFlag("bulk_operations_enabled");
  const bulkOps = useBulkOperations('drivers');

  // Fetch drivers for current hierarchy level
  const { data: driversData = [], isLoading, error } = useQuery({
    queryKey: ["/api/drivers", level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      try {
        let endpoint = "/api/drivers";
        if (level === 'program' && selectedProgram) {
          endpoint = `/api/drivers/program/${selectedProgram}`;
        } else if ((level === 'corporate' || level === 'client') && selectedCorporateClient) {
          endpoint = `/api/drivers/corporate-client/${selectedCorporateClient}`;
        }
        
        const response = await apiRequest("GET", endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch drivers: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Error fetching drivers:', err);
        throw err;
      }
    },
    enabled: true,
    retry: 1,
  });

  // Normalize driver data - flatten user data if it's nested
  const drivers = (Array.isArray(driversData) ? driversData : []).map((driver: any) => {
    // If user data is nested in 'users' object, flatten it
    if (driver.users) {
      return {
        ...driver,
        user_name: driver.user_name || driver.users.user_name,
        first_name: driver.first_name || driver.users.first_name,
        last_name: driver.last_name || driver.users.last_name,
        email: driver.email || driver.users.email,
        primary_program_id: driver.primary_program_id || driver.program_id || driver.users.primary_program_id,
        phone: driver.phone || driver.users.phone,
        avatar_url: driver.avatar_url || driver.users.avatar_url,
      };
    }
    // Ensure primary_program_id is set from program_id if needed
    return {
      ...driver,
      primary_program_id: driver.primary_program_id || driver.program_id,
    };
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
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
    // Use program_id if primary_program_id is not available
    const programId = driver.primary_program_id || driver.program_id || '';
    form.reset({
      user_id: driver.user_id,
      primary_program_id: programId,
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

  // Filter drivers
  const filteredDrivers = (drivers as Driver[]).filter((driver: Driver) =>
    driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.vehicle_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${driver.first_name || ''} ${driver.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort drivers
  const sortedDrivers = useMemo(() => {
    if (!sortColumn) return filteredDrivers;

    // Helper functions defined inside useMemo to avoid dependency issues
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

    const sorted = [...filteredDrivers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'user_id':
          aValue = a.user_id || '';
          bValue = b.user_id || '';
          break;
        case 'name':
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.user_name || '';
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.user_name || '';
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'license':
          aValue = a.license_number || '';
          bValue = b.license_number || '';
          break;
        case 'tenant':
          aValue = getCorporateClientNameLocal(a.primary_program_id || a.program_id || '');
          bValue = getCorporateClientNameLocal(b.primary_program_id || b.program_id || '');
          break;
        case 'program':
          aValue = getProgramNameLocal(a.primary_program_id || a.program_id || '');
          bValue = getProgramNameLocal(b.primary_program_id || b.program_id || '');
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [filteredDrivers, sortColumn, sortDirection, programs, corporateClients]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Expand/Collapse all
  const expandAllDrivers = () => {
    setExpandedDrivers(new Set(sortedDrivers.map(d => d.id)));
  };

  const collapseAllDrivers = () => {
    setExpandedDrivers(new Set());
  };

  const areAllExpanded = sortedDrivers.length > 0 && expandedDrivers.size === sortedDrivers.length;
  const areAllCollapsed = expandedDrivers.size === 0;

  // Select all
  const handleSelectAll = () => {
    if (bulkOps.selectedItems.length === sortedDrivers.length) {
      bulkOps.clearSelection();
    } else {
      bulkOps.selectAll(sortedDrivers.map(d => d.id));
    }
  };

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

  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      {!ENABLE_UNIFIED_HEADER && (
        <div className="px-6 py-6 rounded-lg card-neu card-glow-border flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px' }}>
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
                { key: 'user_id', label: 'User ID' },
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
                <Button 
                  onClick={handleNewDriver}
                  className="flex items-center gap-2 card-neu hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                >
                  <Plus className="h-4 w-4" />
                  New Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
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
                              <Input 
                                placeholder="Enter user ID" 
                                {...field} 
                                className="card-neu-flat [&]:shadow-none"
                                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                              />
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
                                <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                                  <SelectValue placeholder="Select program" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                                {(programs as any[]).map((program: any) => (
                                  <SelectItem key={program.id} value={program.id} className="hover:card-neu-flat">
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
                              <Input 
                                placeholder="Enter license number" 
                                {...field} 
                                className="card-neu-flat [&]:shadow-none"
                                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                              />
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
                              <Input 
                                type="date" 
                                {...field} 
                                className="card-neu-flat [&]:shadow-none"
                                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                              />
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
                            <Input 
                              placeholder="e.g., 2020 Honda Pilot - White" 
                              {...field} 
                              className="card-neu-flat [&]:shadow-none"
                              style={{ backgroundColor: 'var(--background)', border: 'none' }}
                            />
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
                                className="card-neu-flat [&]:shadow-none"
                                style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
                              <Input 
                                placeholder="Enter emergency contact name" 
                                {...field} 
                                className="card-neu-flat [&]:shadow-none"
                                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                              />
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
                              className="card-neu-flat [&]:shadow-none"
                              style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        className="card-neu-flat hover:card-neu [&]:shadow-none"
                        style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createDriverMutation.isPending || updateDriverMutation.isPending}
                        className="card-neu hover:card-neu [&]:shadow-none"
                        style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      >
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
      )}

      {/* Bulk Operations Bar */}
      {bulkOpsEnabled && bulkOps.selectedItems.length > 0 && (
        <Card 
          className="card-neu"
          style={{
            backgroundColor: 'var(--background)',
            border: 'none',
            boxShadow: '0 0 20px rgba(255, 132, 117, 0.3), 0 0 40px rgba(255, 132, 117, 0.15)'
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {bulkOps.selectedItems.length} driver{bulkOps.selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => bulkOps.executeBulkAction('update_status', bulkOps.selectedItems)}
                  disabled={bulkOps.isLoading}
                >
                  Update Status
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => bulkOps.clearSelection()}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8475]"
                  style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            {/* Expand All / Collapse All */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {areAllExpanded ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={collapseAllDrivers}
                  title="Collapse all drivers"
                >
                  <ChevronsUpDown className="h-4 w-4 mr-1" />
                  Collapse All
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={expandAllDrivers}
                  title="Expand all drivers"
                >
                  <ChevronsDownUp className="h-4 w-4 mr-1" />
                  Expand All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardContent className="p-0">
          {/* Header Row */}
          <div className="sticky top-6 z-10 font-semibold text-sm card-neu-flat" style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', border: 'none' }}>
            <div className="flex items-center gap-3 p-4">
              {bulkOpsEnabled && (
                <input
                  type="checkbox"
                  checked={bulkOps.selectedItems.length === sortedDrivers.length && sortedDrivers.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4"
                  title="Select all drivers"
                />
              )}
              <div className="w-4" />
              <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 flex items-center">
                  Avatar
                </div>
                <div 
                  className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => handleSort('user_id')}
                  title="Click to sort by Driver ID"
                >
                  Driver ID{getSortIcon('user_id')}
                </div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => handleSort('name')}
                  title="Click to sort by Name"
                >
                  Full Name{getSortIcon('name')}
                </div>
                <div 
                  className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => handleSort('phone')}
                  title="Click to sort by Phone"
                >
                  Phone{getSortIcon('phone')}
                </div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => handleSort('email')}
                  title="Click to sort by Email"
                >
                  Email{getSortIcon('email')}
                </div>
                <div 
                  className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => handleSort('license')}
                  title="Click to sort by License"
                >
                  DL{getSortIcon('license')}
                </div>
                <div 
                  className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => handleSort('tenant')}
                  title="Click to sort by Primary Tenant"
                >
                  Primary Tenant{getSortIcon('tenant')}
                </div>
                <div 
                  className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => handleSort('program')}
                  title="Click to sort by Primary Program"
                >
                  Primary Program{getSortIcon('program')}
                </div>
                <div 
                  className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => handleSort('status')}
                  title="Click to sort by Active Status"
                >
                  Active Status{getSortIcon('status')}
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {sortedDrivers.map((driver) => {
              const isExpanded = expandedDrivers.has(driver.id);
              // Get full name with fallback to user_name
              const fullName = (() => {
                if (driver.first_name && driver.last_name) {
                  return `${driver.first_name} ${driver.last_name}`;
                }
                if (driver.first_name) {
                  return driver.first_name;
                }
                if (driver.user_name) {
                  return driver.user_name;
                }
                if (driver.email) {
                  return driver.email.split('@')[0];
                }
                return 'Unknown';
              })();

              return (
                <Collapsible
                  key={driver.id}
                  open={isExpanded}
                  onOpenChange={(open) => {
                    const newExpanded = new Set(expandedDrivers);
                    if (open) {
                      newExpanded.add(driver.id);
                    } else {
                      newExpanded.delete(driver.id);
                    }
                    setExpandedDrivers(newExpanded);
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
                          checked={bulkOps.selectedItems.includes(driver.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            bulkOps.toggleItem(driver.id);
                          }}
                          className="h-4 w-4"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select driver ${driver.id}`}
                          title={`Select driver ${driver.id}`}
                        />
                      )}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                      {/* Collapsed Row Content */}
                      <div className="flex-1 grid grid-cols-12 gap-2 items-center text-sm">
                        {/* Avatar */}
                        <div className="col-span-1">
                          <UserAvatar 
                            user={{
                              user_id: driver.user_id,
                              user_name: driver.user_name || driver.users?.user_name,
                              email: driver.email || driver.users?.email,
                              first_name: driver.first_name || driver.users?.first_name,
                              last_name: driver.last_name || driver.users?.last_name,
                              avatar_url: driver.users?.avatar_url,
                            }}
                            size="sm"
                          />
                        </div>
                        {/* Driver ID */}
                        <div className="col-span-1 font-mono text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {driver.user_id}
                        </div>
                        {/* Full Name */}
                        <div className="col-span-2 truncate" style={{ color: 'var(--foreground)' }}>
                          {fullName}
                        </div>
                        {/* Phone */}
                        <div className="col-span-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {driver.phone || driver.users?.phone || '-'}
                        </div>
                        {/* Email */}
                        <div className="col-span-2 truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {driver.email || driver.users?.email || '-'}
                        </div>
                        {/* DL */}
                        <div className="col-span-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {driver.license_number || '-'}
                        </div>
                        {/* Primary Tenant */}
                        <div className="col-span-2 truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {getCorporateClientName(driver.primary_program_id || driver.program_id)}
                        </div>
                        {/* Primary Program */}
                        <div className="col-span-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {getProgramName(driver.primary_program_id || driver.program_id)}
                        </div>
                        {/* Active Status */}
                        <div className="col-span-1">
                          <Badge 
                            variant={driver.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {driver.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div 
                      className="px-4 pb-4 pt-2 border-t card-neu-flat"
                      style={{ backgroundColor: 'var(--background)', borderTopColor: 'var(--border)', border: 'none' }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                          <div>
                            <strong>Driver ID:</strong> {driver.id}
                          </div>
                          <div>
                            <strong>User ID:</strong> {driver.user_id}
                          </div>
                          <div>
                            <strong>Email:</strong> {driver.email || driver.users?.email || 'N/A'}
                          </div>
                          <div>
                            <strong>Phone:</strong> {driver.phone || driver.users?.phone || 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <strong>License Number:</strong> {driver.license_number}
                          </div>
                          <div>
                            <strong>License Expiry:</strong> {driver.license_expiry ? format(new Date(driver.license_expiry), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                          <div>
                            <strong>Vehicle Info:</strong> {driver.vehicle_info || 'N/A'}
                          </div>
                          <div>
                            <strong>Primary Program:</strong> {getProgramName(driver.primary_program_id || driver.program_id)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <strong>Primary Tenant:</strong> {getCorporateClientName(driver.primary_program_id || driver.program_id)}
                          </div>
                          <div>
                            <strong>Emergency Contact:</strong> {driver.emergency_contact || 'N/A'}
                          </div>
                          <div>
                            <strong>Emergency Phone:</strong> {driver.emergency_phone || 'N/A'}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={driver.is_available ? "default" : "secondary"}>
                              {driver.is_available ? "Available" : "Unavailable"}
                            </Badge>
                            <Badge variant={driver.is_active ? "default" : "secondary"}>
                              {driver.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(driver)}
                              className="card-neu-flat hover:card-neu [&]:shadow-none"
                              style={{ backgroundColor: 'var(--background)', border: 'none' }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
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
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {sortedDrivers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            {searchTerm ? "No drivers found" : "No drivers yet"}
          </h3>
          <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>
            {searchTerm
              ? "Try adjusting your search terms"
              : "Get started by adding your first driver"}
          </p>
          {!searchTerm && (
            <Button 
              onClick={handleNewDriver}
              className="card-neu hover:card-neu [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
