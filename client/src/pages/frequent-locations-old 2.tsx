import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { useHierarchy } from '../hooks/useHierarchy';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Plus, Edit, Trash2, MapPin, Building, Gavel, Stethoscope, Store, MoreHorizontal, FileText, Heart, Users, Church } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

interface FrequentLocation {
  id: string;
  corporate_client_id?: string;
  program_id?: string;
  location_id?: string;
  name: string;
  description?: string;
  street_address: string;
  city: string;
  state: string;
  zip_code?: string;
  full_address: string;
  location_type: 'pickup' | 'dropoff' | 'destination' | 'facility' | 'courthouse' | 'medical' | 'commercial' | 'other';
  // New tag system fields
  tag: 'service_location' | 'grocery_store' | 'dmv' | 'legal_services' | 'medical' | 'non_medical' | 'group_activity' | 'fellowship' | 'other';
  is_service_location: boolean;
  priority: number;
  auto_synced: boolean;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  corporate_clients?: {
    id: string;
    name: string;
  };
  programs?: {
    id: string;
    name: string;
  };
  locations?: {
    id: string;
    name: string;
  };
}

const locationTypeIcons = {
  pickup: MapPin,
  dropoff: MapPin,
  destination: MapPin,
  facility: Building,
  courthouse: Gavel,
  medical: Stethoscope,
  commercial: Store,
  other: MapPin,
};

// Tag system configuration
const locationTags = {
  'service_location': { 
    label: 'Service Location', 
    icon: Building, 
    color: 'bg-blue-100 text-blue-800',
    priority: 1
  },
  'grocery_store': { 
    label: 'Grocery Store', 
    icon: Store, 
    color: 'bg-green-100 text-green-800',
    priority: 2
  },
  'dmv': { 
    label: 'DMV', 
    icon: FileText, 
    color: 'bg-orange-100 text-orange-800',
    priority: 3
  },
  'legal_services': { 
    label: 'Legal Services', 
    icon: Gavel, 
    color: 'bg-red-100 text-red-800',
    priority: 4
  },
  'medical': { 
    label: 'Medical', 
    icon: Stethoscope, 
    color: 'bg-pink-100 text-pink-800',
    priority: 5
  },
  'non_medical': { 
    label: 'Non-Medical', 
    icon: Heart, 
    color: 'bg-purple-100 text-purple-800',
    priority: 6
  },
  'group_activity': { 
    label: 'Group Activity', 
    icon: Users, 
    color: 'bg-yellow-100 text-yellow-800',
    priority: 7
  },
  'fellowship': { 
    label: 'Fellowship', 
    icon: Church, 
    color: 'bg-indigo-100 text-indigo-800',
    priority: 8
  },
  'other': { 
    label: 'Other', 
    icon: MapPin, 
    color: 'bg-gray-100 text-gray-800',
    priority: 9
  }
};

const locationTypeColors = {
  pickup: 'bg-blue-100 text-blue-800',
  dropoff: 'bg-green-100 text-green-800',
  destination: 'bg-purple-100 text-purple-800',
  facility: 'bg-orange-100 text-orange-800',
  courthouse: 'bg-red-100 text-red-800',
  medical: 'bg-pink-100 text-pink-800',
  commercial: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};

export default function FrequentLocationsPage() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<FrequentLocation | null>(null);

  // Fetch frequent locations organized by tag
  const { data: frequentLocationsByTag = {}, isLoading, error } = useQuery({
    queryKey: ['/api/locations/frequent/by-tag', level, selectedProgram, selectedCorporateClient, searchTerm, locationTypeFilter],
    queryFn: async () => {
      console.log('🔍 Fetching frequent locations by tag with params:', {
        level,
        selectedProgram,
        selectedCorporateClient,
        searchTerm,
        locationTypeFilter
      });
      
      const params = new URLSearchParams();
      if (selectedProgram) params.append('program_id', selectedProgram);
      if (selectedCorporateClient) params.append('corporate_client_id', selectedCorporateClient);
      if (searchTerm) params.append('search', searchTerm);
      if (locationTypeFilter !== 'all') params.append('location_type', locationTypeFilter);
      params.append('is_active', 'true'); // Always filter for active locations

      const url = `/api/locations/frequent/by-tag?${params.toString()}`;
      console.log('🔍 API URL:', url);

      const response = await apiRequest('GET', url);
      const data = await response.json();
      console.log('🔍 API Response:', data);
      return data;
    },
    enabled: true, // Always enabled - let the API handle filtering
  });

  // Create frequent location mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FrequentLocation>) => {
      const response = await apiRequest('POST', '/api/locations/frequent', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations/frequent'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Frequent location created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create frequent location',
        variant: 'destructive',
      });
    },
  });

  // Update frequent location mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FrequentLocation> }) => {
      const response = await apiRequest('PATCH', `/api/locations/frequent/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations/frequent'] });
      setIsEditDialogOpen(false);
      setEditingLocation(null);
      toast({
        title: 'Success',
        description: 'Frequent location updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update frequent location',
        variant: 'destructive',
      });
    },
  });

  // Delete frequent location mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/locations/frequent/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations/frequent'] });
      toast({
        title: 'Success',
        description: 'Frequent location deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete frequent location',
        variant: 'destructive',
      });
    },
  });

  // Increment usage count mutation
  const incrementUsageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/locations/frequent/${id}/increment-usage`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations/frequent'] });
    },
  });

  const handleCreate = (data: Partial<FrequentLocation>) => {
    createMutation.mutate({
      ...data,
      corporate_client_id: selectedCorporateClient || undefined,
      program_id: selectedProgram || undefined,
    });
  };

  const handleEdit = (location: FrequentLocation) => {
    setEditingLocation(location);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: Partial<FrequentLocation>) => {
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data });
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleIncrementUsage = (id: string) => {
    incrementUsageMutation.mutate(id);
  };

  // Flatten the tag-based data structure for filtering
  const allLocations = Object.values(frequentLocationsByTag).flat();
  
  const filteredLocations = allLocations.filter((location: any) => {
    if (locationTypeFilter !== 'all' && location.location_type !== locationTypeFilter) {
      return false;
    }
    return true;
  });

  console.log('🔍 FrequentLocationsPage render state:', {
    isLoading,
    error,
    frequentLocationsByTag: Object.keys(frequentLocationsByTag),
    allLocations: allLocations?.length || 0,
    filteredLocations: filteredLocations?.length || 0
  });

  if (isLoading) {
    console.log('🔍 Showing loading state');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading frequent locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('🔍 Showing error state:', error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Failed to load frequent locations</p>
          <p className="text-sm text-gray-500 mt-2">{error?.message || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Frequent Locations</h1>
          <p className="text-gray-600 mt-1">Manage commonly used pickup and drop-off locations for efficient trip planning</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {frequentLocations?.length || 0} total locations
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {filteredLocations.length} filtered
              </Badge>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <CreateLocationDialog onSave={handleCreate} />
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search" className="text-sm font-medium">Search Locations</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, address, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location-type" className="text-sm font-medium">Location Type</Label>
              <Select value={locationTypeFilter} onValueChange={setLocationTypeFilter}>
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="dropoff">Drop-off</SelectItem>
                  <SelectItem value="destination">Destination</SelectItem>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="courthouse">Courthouse</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
              <Select value="all" onValueChange={() => {}}>
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Showing {filteredLocations.length} of {frequentLocations?.length || 0} locations</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                setSearchTerm('');
                setLocationTypeFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Locations Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Locations</CardTitle>
              <CardDescription className="mt-1">
                Click on a location to use it in trip creation, or manage it using the actions menu.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {filteredLocations.length} locations
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100">
                  <TableHead className="font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Address</TableHead>
                  <TableHead className="font-semibold text-gray-700">Usage</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredLocations.map((location: any) => {
                const IconComponent = locationTypeIcons[location.location_type as keyof typeof locationTypeIcons];
                return (
                  <TableRow key={location.id} className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <IconComponent className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">{location.name}</div>
                          {location.description && (
                            <div className="text-sm text-gray-500 truncate">{location.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        className={`${locationTypeColors[location.location_type as keyof typeof locationTypeColors]} text-xs font-medium`}
                      >
                        {location.location_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm max-w-xs">
                        <div className="font-medium text-gray-900 truncate">{location.street_address}</div>
                        <div className="text-gray-500 truncate">
                          {location.city}, {location.state} {location.zip_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{location.usage_count}</div>
                        <div className="text-xs text-gray-500">uses</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={location.is_active ? 'default' : 'secondary'}
                        className={`text-xs ${
                          location.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                        }`}
                      >
                        {location.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleIncrementUsage(location.id)}>
                            Use in Trip
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(location)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(location.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {filteredLocations.map((location: any) => {
          const IconComponent = locationTypeIcons[location.location_type as keyof typeof locationTypeIcons];
          return (
            <Card key={location.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{location.name}</h3>
                      {location.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{location.description}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="truncate">{location.street_address}</p>
                        <p className="text-gray-500">
                          {location.city}, {location.state} {location.zip_code}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleIncrementUsage(location.id)}>
                        Use in Trip
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(location)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(location.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <Badge 
                      className={`${locationTypeColors[location.location_type as keyof typeof locationTypeColors]} text-xs`}
                    >
                      {location.location_type}
                    </Badge>
                    <Badge 
                      variant={location.is_active ? 'default' : 'secondary'}
                      className={`text-xs ${
                        location.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {location.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {location.usage_count} uses
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the frequent location details.
            </DialogDescription>
          </DialogHeader>
          <EditLocationDialog
            location={editingLocation}
            onSave={handleUpdate}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingLocation(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Location Dialog Component
function CreateLocationDialog({ onSave }: { onSave: (data: Partial<FrequentLocation>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    location_type: 'destination' as const,
    tag: 'other' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full_address = `${formData.street_address}, ${formData.city}, ${formData.state} ${formData.zip_code}`.trim();
    onSave({
      ...formData,
      full_address,
      usage_count: 0,
      is_active: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="location_type">Type *</Label>
          <Select
            value={formData.location_type}
            onValueChange={(value) => setFormData({ ...formData, location_type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="dropoff">Drop-off</SelectItem>
              <SelectItem value="destination">Destination</SelectItem>
              <SelectItem value="facility">Facility</SelectItem>
              <SelectItem value="courthouse">Courthouse</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tag">Category *</Label>
          <Select
            value={formData.tag}
            onValueChange={(value) => setFormData({ ...formData, tag: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grocery_store">Grocery Store</SelectItem>
              <SelectItem value="dmv">DMV</SelectItem>
              <SelectItem value="legal_services">Legal Services</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="non_medical">Non-Medical</SelectItem>
              <SelectItem value="group_activity">Group Activity</SelectItem>
              <SelectItem value="fellowship">Fellowship</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="street_address">Street Address *</Label>
        <Input
          id="street_address"
          value={formData.street_address}
          onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit">Create Location</Button>
      </DialogFooter>
    </form>
  );
}

// Edit Location Dialog Component
function EditLocationDialog({ 
  location, 
  onSave, 
  onCancel 
}: { 
  location: FrequentLocation | null; 
  onSave: (data: Partial<FrequentLocation>) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    location_type: 'destination' as 'pickup' | 'dropoff' | 'destination' | 'facility' | 'courthouse' | 'medical' | 'commercial' | 'other',
    tag: 'other' as 'service_location' | 'grocery_store' | 'dmv' | 'legal_services' | 'medical' | 'non_medical' | 'group_activity' | 'fellowship' | 'other',
    is_active: true,
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        description: location.description || '',
        street_address: location.street_address,
        city: location.city,
        state: location.state,
        zip_code: location.zip_code || '',
        location_type: location.location_type as 'pickup' | 'dropoff' | 'destination' | 'facility' | 'courthouse' | 'medical' | 'commercial' | 'other',
        tag: location.tag || 'other',
        is_active: location.is_active,
      });
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full_address = `${formData.street_address}, ${formData.city}, ${formData.state} ${formData.zip_code}`.trim();
    onSave({
      ...formData,
      full_address,
    });
  };

  if (!location) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-name">Name *</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-location_type">Type *</Label>
          <Select
            value={formData.location_type}
            onValueChange={(value) => setFormData({ ...formData, location_type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="dropoff">Drop-off</SelectItem>
              <SelectItem value="destination">Destination</SelectItem>
              <SelectItem value="facility">Facility</SelectItem>
              <SelectItem value="courthouse">Courthouse</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit-tag">Category *</Label>
          <Select
            value={formData.tag}
            onValueChange={(value) => setFormData({ ...formData, tag: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grocery_store">Grocery Store</SelectItem>
              <SelectItem value="dmv">DMV</SelectItem>
              <SelectItem value="legal_services">Legal Services</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="non_medical">Non-Medical</SelectItem>
              <SelectItem value="group_activity">Group Activity</SelectItem>
              <SelectItem value="fellowship">Fellowship</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="edit-street_address">Street Address *</Label>
        <Input
          id="edit-street_address"
          value={formData.street_address}
          onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="edit-city">City *</Label>
          <Input
            id="edit-city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-state">State *</Label>
          <Input
            id="edit-state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-zip_code">ZIP Code</Label>
          <Input
            id="edit-zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Update Location</Button>
      </DialogFooter>
    </form>
  );
}