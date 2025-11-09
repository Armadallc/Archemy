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

export default function FrequentLocationsPage() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient, getFilterParams, getPageTitle } = useHierarchy();
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
      params.append('is_active', 'true');

      const url = `/api/locations/frequent/by-tag?${params.toString()}`;
      console.log('🔍 API URL:', url);

      const response = await apiRequest('GET', url);
      const data = await response.json();
      console.log('🔍 API Response:', data);
      return data;
    },
    enabled: true,
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
      toast({
        title: 'Success',
        description: 'Usage count incremented',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to increment usage count',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = (data: Partial<FrequentLocation>) => {
    createMutation.mutate(data);
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading frequent locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500">Error loading frequent locations</p>
          <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Frequent Locations</h1>
          <p className="text-gray-600">Manage frequently used locations for quick trip creation</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search locations..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Showing {filteredLocations.length} of {allLocations?.length || 0} locations</span>
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

      {/* Hierarchical Tag-Based View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Locations by Category</CardTitle>
              <CardDescription>
                Locations organized by category for easy management and quick access.
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
          <div className="divide-y divide-gray-100">
            {Object.entries(frequentLocationsByTag)
              .sort(([tagA], [tagB]) => {
                const priorityA = locationTags[tagA as keyof typeof locationTags]?.priority || 999;
                const priorityB = locationTags[tagB as keyof typeof locationTags]?.priority || 999;
                return priorityA - priorityB;
              })
              .map(([tag, locations]) => {
                const tagConfig = locationTags[tag as keyof typeof locationTags];
                const IconComponent = tagConfig?.icon || MapPin;
                const filteredTagLocations = locations.filter((location: any) => {
                  if (locationTypeFilter !== 'all' && location.location_type !== locationTypeFilter) {
                    return false;
                  }
                  return true;
                });

                if (filteredTagLocations.length === 0) return null;

                return (
                  <div key={tag} className="border-b border-gray-100 last:border-b-0">
                    {/* Tag Header */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <IconComponent className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{tagConfig?.label || tag}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${tagConfig?.color || 'bg-gray-100 text-gray-800'}`}
                          >
                            {filteredTagLocations.length} location{filteredTagLocations.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Locations in this tag */}
                    <div className="divide-y divide-gray-100">
                      {filteredTagLocations.map((location: any) => {
                        const LocationIconComponent = locationTypeIcons[location.location_type as keyof typeof locationTypeIcons];
                        return (
                          <div key={location.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <LocationIconComponent className="h-4 w-4 text-gray-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium text-gray-900 truncate">{location.name}</div>
                                    {location.is_service_location && (
                                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                        Service Location
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 truncate">{location.full_address}</div>
                                  {location.description && (
                                    <div className="text-xs text-gray-400 truncate">{location.description}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium text-gray-900">{location.usage_count}</span>
                                  <span className="text-xs text-gray-500">uses</span>
                                </div>
                                <Badge 
                                  variant={location.is_active ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {location.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(location)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleIncrementUsage(location.id)}>
                                      <MapPin className="h-4 w-4 mr-2" />
                                      Mark as Used
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Create Location Dialog */}
      <CreateLocationDialog onSave={handleCreate} />

      {/* Edit Location Dialog */}
      <EditLocationDialog 
        location={editingLocation}
        onSave={handleUpdate}
        onCancel={() => {
          setIsEditDialogOpen(false);
          setEditingLocation(null);
        }}
      />
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
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Location</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Frequent Location</DialogTitle>
          <DialogDescription>
            Add a new location to your frequent locations list for quick trip creation.
          </DialogDescription>
        </DialogHeader>
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
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="street_address">Street Address *</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                required
              />
            </div>
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
            <Button type="submit">Add Location</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Frequent Location</DialogTitle>
          <DialogDescription>
            Update the location details below.
          </DialogDescription>
        </DialogHeader>
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
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-street_address">Street Address *</Label>
              <Input
                id="edit-street_address"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                required
              />
            </div>
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
      </DialogContent>
    </Dialog>
  );
}














