import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { useHierarchy } from '../hooks/useHierarchy';
import { useToast } from '../hooks/use-toast';

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Search, Plus, Edit, Trash2, MapPin, Building, Gavel, Stethoscope, Store, MoreHorizontal, FileText, Heart, Users, Church, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Checkbox } from '../components/ui/checkbox';

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
  location_type: 'service_location' | 'legal' | 'healthcare' | 'dmv' | 'grocery' | 'other';
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

// Location type configuration (matching the new location_type values)
const locationTags = {
  'service_location': { 
    label: 'Service Location', 
    icon: Building, 
    color: 'bg-indigo-100 text-indigo-800',
    priority: 1
  },
  'legal': { 
    label: 'Legal', 
    icon: Gavel, 
    color: 'bg-red-100 text-red-800',
    priority: 2
  },
  'healthcare': { 
    label: 'Healthcare', 
    icon: Stethoscope, 
    color: 'bg-pink-100 text-pink-800',
    priority: 3
  },
  'dmv': { 
    label: 'DMV', 
    icon: Building, 
    color: '',
    priority: 4
  },
  'grocery': { 
    label: 'Grocery', 
    icon: Store, 
    color: 'bg-yellow-100 text-yellow-800',
    priority: 5
  },
  'other': { 
    label: 'Other', 
    icon: MapPin, 
    color: 'bg-gray-100 text-gray-800',
    priority: 6
  }
};

const locationTypeIcons = {
  service_location: Building,
  legal: Gavel,
  healthcare: Stethoscope,
  dmv: Building,
  grocery: Store,
  other: MapPin,
};

export default function FrequentLocationsPage() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient, getFilterParams, getPageTitle } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<FrequentLocation | null>(null);

  // Debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Increased delay to 500ms

  // Track if user is currently typing
  const [isTyping, setIsTyping] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Memoized search handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsTyping(true);
  }, []);

  // Reset typing state when debounced search completes
  useEffect(() => {
    if (searchTerm === debouncedSearchTerm) {
      setIsTyping(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Maintain focus on search input
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  });

  // Fetch frequent locations organized by tag
  const { data: frequentLocationsByTag = {}, isLoading, error } = useQuery({
    queryKey: ['/api/locations/frequent/by-tag', level, selectedProgram, selectedCorporateClient, debouncedSearchTerm, locationTypeFilter],
    queryFn: async () => {
      console.log('🔍 Fetching frequent locations by tag with params:', {
        level,
        selectedProgram,
        selectedCorporateClient,
        debouncedSearchTerm,
        locationTypeFilter
      });
      
      const params = new URLSearchParams();
      
      // For corporate_admin, always filter by their corporate_client_id for tenant isolation
      if (user?.role === 'corporate_admin') {
        const corporateClientId = (user as any).corporate_client_id || selectedCorporateClient;
        if (corporateClientId) {
          params.append('corporate_client_id', corporateClientId);
        } else {
          console.warn('⚠️ Corporate admin missing corporate_client_id for frequent locations');
        }
      } else {
        // For other roles, use hierarchy-based filtering
        if (selectedProgram) params.append('program_id', selectedProgram);
        if (selectedCorporateClient) params.append('corporate_client_id', selectedCorporateClient);
      }
      
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (locationTypeFilter !== 'all') params.append('location_type', locationTypeFilter);
      params.append('is_active', 'true');

      const url = `/api/locations/frequent/by-tag?${params.toString()}`;
      console.log('🔍 API URL:', url);

      const response = await apiRequest('GET', url);
      const data = await response.json();
      console.log('🔍 API Response:', data);
      return data;
    },
    enabled: !isTyping, // Disable query while user is typing
    // Add stale time to prevent immediate refetching
    staleTime: 2000,
  });

  // Create frequent location mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FrequentLocation>) => {
      console.log('🔍 Create mutation called with:', JSON.stringify(data, null, 2));
      const response = await apiRequest('POST', '/api/locations/frequent', data);
      const result = await response.json();
      console.log('🔍 Create mutation result:', result);
      console.log('🔍 Create mutation result location_type:', result.location_type);
      // Verify the location_type was actually saved
      if (data.location_type && result.location_type !== data.location_type) {
        console.error('⚠️ WARNING: location_type mismatch on create!', {
          sent: data.location_type,
          received: result.location_type
        });
      }
      return result;
    },
    onSuccess: async (data) => {
      console.log('🔍 Create mutation success, invalidating queries');
      console.log('🔍 Created location data:', data);
      console.log('🔍 Created location_type:', data.location_type);
      
      // Close dialog first
      setIsCreateDialogOpen(false);
      
      // Wait a moment for database transaction to commit
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remove all cached data for this query to force a fresh fetch
      queryClient.removeQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/locations/frequent/by-tag';
        }
      });
      
      // Invalidate and refetch
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/locations/frequent/by-tag';
        }
      });
      
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/locations/frequent/by-tag';
        }
      });
      
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
      console.log('🔍 Update mutation called with:', { id, data });
      const response = await apiRequest('PATCH', `/api/locations/frequent/${id}`, data);
      const result = await response.json();
      console.log('🔍 Update mutation result:', result);
      console.log('🔍 Update mutation result location_type:', result.location_type);
      // Verify the location_type was actually updated
      if (data.location_type && result.location_type !== data.location_type) {
        console.error('⚠️ WARNING: location_type mismatch!', {
          sent: data.location_type,
          received: result.location_type
        });
      }
      return result;
    },
    onSuccess: async (data) => {
      console.log('🔍 Update mutation success, invalidating queries');
      console.log('🔍 Updated location data:', data);
      console.log('🔍 Updated location_type in response:', data.location_type);
      
      // Close dialog first to prevent UI issues
      setIsEditDialogOpen(false);
      setEditingLocation(null);
      
      // Clean up any blocking overlays immediately
      setTimeout(() => {
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          const el = overlay as HTMLElement;
          el.style.pointerEvents = 'none';
          el.style.display = 'none';
          setTimeout(() => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          }, 100);
        });
      }, 0);
      
      // Wait longer to ensure database transaction is fully committed
      // PostgreSQL transactions typically commit quickly, but we want to be safe
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remove all cached data for this query to force a fresh fetch
      queryClient.removeQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/locations/frequent/by-tag';
        }
      });
      
      // Invalidate all queries that start with '/api/locations/frequent/by-tag'
      // This ensures we catch all variations of the query key
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/locations/frequent/by-tag';
        }
      });
      
      // Force a refetch to ensure we get the latest data
      const refetchResult = await queryClient.refetchQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/locations/frequent/by-tag';
        }
      });
      
      console.log('🔍 Refetch result:', refetchResult);
      
      toast({
        title: 'Success',
        description: 'Frequent location updated successfully',
      });
    },
    onError: (error) => {
      console.error('🔍 Update mutation error:', error);
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
      queryClient.invalidateQueries({ queryKey: ['/api/locations/frequent/by-tag'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/locations/frequent/by-tag'] });
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

  // Sync service locations mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/locations/frequent/sync-service-locations');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations/frequent/by-tag'] });
      toast({
        title: 'Success',
        description: data.message || `Successfully synced ${data.syncedCount || 0} service locations`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to sync service locations',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = (data: Partial<FrequentLocation>) => {
    console.log('🔍 Creating location with data:', JSON.stringify(data, null, 2));
    createMutation.mutate(data);
  };

  const handleEdit = (location: FrequentLocation) => {
    setEditingLocation(location);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: Partial<FrequentLocation>) => {
    if (editingLocation) {
      console.log('🔍 Updating location with data:', JSON.stringify({ id: editingLocation.id, data }, null, 2));
      updateMutation.mutate({ id: editingLocation.id, data });
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleIncrementUsage = (id: string) => {
    incrementUsageMutation.mutate(id);
  };

  const handleSyncServiceLocations = () => {
    syncMutation.mutate();
  };

  // Bulk operations
  const toggleLocationSelection = (id: string) => {
    setSelectedLocations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllLocations = () => {
    setSelectedLocations(new Set(filteredLocations.map(l => l.id)));
  };

  const clearSelection = () => {
    setSelectedLocations(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedLocations.size === 0) return;
    const ids = Array.from(selectedLocations);
    for (const id of ids) {
      await deleteMutation.mutateAsync(id);
    }
    clearSelection();
  };

  const handleBulkEdit = async (updates: Partial<FrequentLocation>) => {
    if (selectedLocations.size === 0) return;
    const ids = Array.from(selectedLocations);
    for (const id of ids) {
      await updateMutation.mutateAsync({ id, data: updates });
    }
    clearSelection();
  };

  const handleBulkToggleActive = async () => {
    if (selectedLocations.size === 0) return;
    const locations = filteredLocations.filter(l => selectedLocations.has(l.id));
    const activeStatus = locations.every(l => l.is_active);
    const ids = Array.from(selectedLocations);
    for (const id of ids) {
      await updateMutation.mutateAsync({ id, data: { is_active: !activeStatus } });
    }
    clearSelection();
  };

  // Flatten the tag-based data structure for filtering
  const allLocations = Object.values(frequentLocationsByTag).flat() as FrequentLocation[];
  
  const filteredLocations = allLocations.filter((location: FrequentLocation) => {
    if (locationTypeFilter !== 'all' && location.location_type !== locationTypeFilter) {
      return false;
    }
    // tagFilter is now based on location_type since we removed the tag field
    if (tagFilter !== 'all' && location.location_type !== tagFilter) {
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--blue-9)' }}></div>
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
    <div className="space-y-6 p-6">
      {/* Header */}
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
              quick locations.
            </h1>
          </div>
          <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncServiceLocations}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--blue-9)' }}></div>
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Service Locations
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-end gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
              <div>
                <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    id="search"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 h-10"
                  />
                  {isTyping && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--blue-9)' }}></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="mt-1 h-10">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="service_location">Service Location</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="dmv">DMV</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location-type" className="text-sm font-medium">Type</Label>
                <Select value={locationTypeFilter} onValueChange={setLocationTypeFilter}>
                  <SelectTrigger className="mt-1 h-10">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="service_location">Service Location</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="dmv">DMV</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
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
            <div className="flex-shrink-0">
              <Button variant="outline" size="sm" className="h-10" onClick={() => {
                setSearchTerm('');
                setLocationTypeFilter('all');
                setTagFilter('all');
              }}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedLocations.size > 0 && (
        <Card className="border" style={{ borderColor: 'var(--blue-7)', backgroundColor: 'rgba(124, 173, 197, 0.1)', borderWidth: '1px', borderStyle: 'solid' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-sm">
                  {selectedLocations.size} location{selectedLocations.size !== 1 ? 's' : ''} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="transition-colors"
                  style={{ color: 'var(--gray-9)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gray-12)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-9)'}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkToggleActive}
                  disabled={deleteMutation.isPending || updateMutation.isPending}
                >
                  {filteredLocations.filter(l => selectedLocations.has(l.id)).every(l => l.is_active)
                    ? 'Deactivate Selected'
                    : 'Activate Selected'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteMutation.isPending || updateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Locations</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedLocations.size} location{selectedLocations.size !== 1 ? 's' : ''}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete {selectedLocations.size} location{selectedLocations.size !== 1 ? 's' : ''}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hierarchical Tag-Based View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg uppercase" style={{ fontFamily: 'Nohemi', fontWeight: 600 }}>Frequent Locations</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {filteredLocations.length} locations
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {/* Show all location types, even if empty */}
            {Object.keys(locationTags)
              .map(locationType => {
                const locations = frequentLocationsByTag[locationType] || [];
                return [locationType, locations] as [string, FrequentLocation[]];
              })
              .sort(([tagA, locationsA], [tagB, locationsB]) => {
                const priorityA = locationTags[tagA as keyof typeof locationTags]?.priority || 999;
                const priorityB = locationTags[tagB as keyof typeof locationTags]?.priority || 999;
                
                // Service locations always first
                if (priorityA === 1) return -1;
                if (priorityB === 1) return 1;
                
                // For other categories, sort by most recent within category
                const aLatest = locationsA.length > 0 
                  ? Math.max(...locationsA.map((l: FrequentLocation) => new Date(l.updated_at || 0).getTime()))
                  : 0;
                const bLatest = locationsB.length > 0
                  ? Math.max(...locationsB.map((l: FrequentLocation) => new Date(l.updated_at || 0).getTime()))
                  : 0;
                
                if (aLatest !== bLatest) return bLatest - aLatest;
                return priorityA - priorityB;
              })
              .map(([tag, locations]) => {
                const tagConfig = locationTags[tag as keyof typeof locationTags];
                const IconComponent = tagConfig?.icon || MapPin;
                const filteredTagLocations = (locations as FrequentLocation[]).filter((location: any) => {
                  if (locationTypeFilter !== 'all' && location.location_type !== locationTypeFilter) {
                    return false;
                  }
                  return true;
                });

                // Show all location type headers, even if empty

                const tagSelectedIds = filteredTagLocations.map(l => l.id);
                const tagSelectedCount = tagSelectedIds.filter(id => selectedLocations.has(id)).length;
                const isTagFullySelected = tagSelectedIds.length > 0 && tagSelectedIds.every(id => selectedLocations.has(id));
                
                return (
                  <div key={tag} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)', borderWidth: 'var(--border-weight, 1px)', borderStyle: 'solid' }}>
                    {/* Tag Header */}
                    <div className="px-6 py-4 border-b" style={{ backgroundColor: 'var(--gray-1)', borderColor: 'var(--border)', borderWidth: 'var(--border-weight, 1px)', borderStyle: 'solid' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--gray-12)' }}>{tagConfig?.label || tag}</h3>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={
                              tagConfig && tagConfig.color === '' 
                                ? { backgroundColor: 'rgba(124, 173, 197, 0.2)', color: 'var(--blue-11)' }
                                : tagConfig?.color 
                                  ? {} 
                                  : { backgroundColor: 'var(--gray-2)', color: 'var(--gray-11)' }
                            }
                          >
                            {filteredTagLocations.length} location{filteredTagLocations.length !== 1 ? 's' : ''}
                          </Badge>
                          {tagSelectedCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {tagSelectedCount} selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Locations in this tag */}
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {filteredTagLocations.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500 text-sm">
                          No locations in this category
                        </div>
                      ) : (
                        filteredTagLocations.map((location: any) => {
                        const isSelected = selectedLocations.has(location.id);
                        return (
                          <div 
                            key={location.id} 
                            className="px-6 py-4 transition-colors"
                            style={isSelected ? { backgroundColor: 'rgba(124, 173, 197, 0.1)', borderLeft: '4px solid var(--blue-9)' } : {}}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'var(--gray-2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '';
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex-shrink-0">
                                  <Checkbox 
                                    checked={isSelected}
                                    onCheckedChange={() => toggleLocationSelection(location.id)}
                                    className="mr-2 h-4 w-4 rounded-full"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium truncate" style={{ color: 'var(--gray-12)' }}>{location.name}</div>
                                    {location.is_service_location && (
                                      <Badge variant="outline" className="text-xs" style={{ backgroundColor: 'rgba(124, 173, 197, 0.2)', color: 'var(--blue-11)' }}>
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
                                  <span className="text-sm font-medium" style={{ color: 'var(--gray-12)' }}>{location.usage_count}</span>
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
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem 
                                          onSelect={(e) => e.preventDefault()}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Location</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete "{location.name}"? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDelete(location.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        );
                      })
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Create Location Dialog */}
      <CreateLocationDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreate} 
      />

      {/* Edit Location Dialog */}
      <EditLocationDialog 
        key={`edit-${editingLocation?.id || 'new'}-${isEditDialogOpen}`}
        isOpen={isEditDialogOpen}
        location={editingLocation}
        onSave={handleUpdate}
        onCancel={() => {
          console.log('🔍 Parent: Edit dialog cancel called');
          setIsEditDialogOpen(false);
          setEditingLocation(null);
        }}
      />
    </div>
  );
}

// Create Location Dialog Component
function CreateLocationDialog({ 
  isOpen, 
  onOpenChange, 
  onSave 
}: { 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSave: (data: Partial<FrequentLocation>) => void; 
}) {
  const { selectedProgram, selectedCorporateClient } = useHierarchy();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    location_type: 'service_location' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full_address = `${formData.street_address}, ${formData.city}, ${formData.state} ${formData.zip_code}`.trim();
    
          // For super admin users, we need to provide default values since the database constraint
          // requires either corporate_client_id or program_id to be set
          const corporateClientId = selectedCorporateClient || 'monarch'; // Default to Monarch corporate client
          const programId = selectedProgram || 'monarch_competency'; // Default to Monarch Competency program
    
    onSave({
      ...formData,
      full_address,
      usage_count: 0,
      is_active: true,
      is_service_location: false,
      priority: 0,
      auto_synced: false,
      corporate_client_id: corporateClientId,
      program_id: programId,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
      location_type: 'service_location' as const,
    });
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                  <SelectItem value="service_location">Service Location</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="dmv">DMV</SelectItem>
                  <SelectItem value="grocery">Grocery</SelectItem>
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
  isOpen,
  location, 
  onSave, 
  onCancel 
}: { 
  isOpen: boolean;
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
    location_type: 'service_location' as 'service_location' | 'legal' | 'healthcare' | 'dmv' | 'grocery' | 'other',
    is_active: true,
  });

  // Load form data when location changes
  useEffect(() => {
    if (location && isOpen) {
      setFormData({
        name: location.name,
        description: location.description || '',
        street_address: location.street_address,
        city: location.city,
        state: location.state,
        zip_code: location.zip_code || '',
        location_type: location.location_type as 'service_location' | 'legal' | 'healthcare' | 'dmv' | 'grocery' | 'other',
        is_active: location.is_active,
      });
      
      // Aggressive cleanup of focus traps and aria-hidden attributes
      const cleanupFocusTraps = () => {
        // Blur any focused element
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement !== document.body) {
          activeElement.blur();
        }
        
        // Remove aria-hidden from root and all elements
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.removeAttribute('aria-hidden');
          rootElement.removeAttribute('data-aria-hidden');
        }
        
        // Remove aria-hidden from all elements with data-radix-popper-content-wrapper
        const popperElements = document.querySelectorAll('[data-radix-popper-content-wrapper]');
        popperElements.forEach(el => {
          el.removeAttribute('aria-hidden');
          el.removeAttribute('data-aria-hidden');
        });
        
        // Force focus to body to break any trapped focus
        document.body.focus();
        document.body.blur();
      };
      
      // Immediate cleanup
      cleanupFocusTraps();
      
      // Additional cleanup after a short delay
      setTimeout(cleanupFocusTraps, 10);
      setTimeout(cleanupFocusTraps, 50);
    }
  }, [location, isOpen]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🔍 EditLocationDialog: Dialog closed, cleaning up');
      // Reset form data when dialog closes
      setFormData({
        name: '',
        description: '',
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        location_type: 'service_location' as const,
        is_active: true,
      });
      
      // Aggressive cleanup of focus traps and overlays when dialog closes
      const cleanupFocusTraps = () => {
        // Blur any focused element
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement !== document.body) {
          activeElement.blur();
        }
        
        // Remove aria-hidden from root and all elements
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.removeAttribute('aria-hidden');
          rootElement.removeAttribute('data-aria-hidden');
          // Ensure root is clickable
          rootElement.style.pointerEvents = '';
        }
        
        // Remove any remaining dialog overlays that might be blocking interactions
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          const el = overlay as HTMLElement;
          // Check if overlay is actually visible/blocking
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.pointerEvents !== 'none' && computedStyle.display !== 'none') {
            el.style.pointerEvents = 'none';
            el.style.display = 'none';
            // Remove after animation completes
            setTimeout(() => {
              if (el.parentNode) {
                el.parentNode.removeChild(el);
              }
            }, 200);
          }
        });
        
        // Remove any fixed overlay elements with high z-index that might be blocking
        const fixedOverlays = document.querySelectorAll('div.fixed.inset-0');
        fixedOverlays.forEach(overlay => {
          const el = overlay as HTMLElement;
          const computedStyle = window.getComputedStyle(el);
          const zIndex = computedStyle.zIndex;
          // Check if it's a dialog overlay (z-50 or higher, fixed, inset-0, with bg-black/80)
          if (zIndex && parseInt(zIndex) >= 50 && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            el.style.pointerEvents = 'none';
            setTimeout(() => {
              if (el.parentNode && el.style.pointerEvents === 'none') {
                el.parentNode.removeChild(el);
              }
            }, 200);
          }
        });
        
        // Remove aria-hidden from all elements with data-radix-popper-content-wrapper
        const popperElements = document.querySelectorAll('[data-radix-popper-content-wrapper]');
        popperElements.forEach(el => {
          el.removeAttribute('aria-hidden');
          el.removeAttribute('data-aria-hidden');
        });
        
        // Force focus to body to break any trapped focus
        document.body.focus();
        document.body.blur();
        
        // Ensure body is clickable
        document.body.style.pointerEvents = '';
      };
      
      // Immediate cleanup
      cleanupFocusTraps();
      
      // Additional cleanup after animation delays
      setTimeout(cleanupFocusTraps, 10);
      setTimeout(cleanupFocusTraps, 50);
      setTimeout(cleanupFocusTraps, 100);
      setTimeout(cleanupFocusTraps, 200);
      setTimeout(cleanupFocusTraps, 300);
    }
  }, [isOpen]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 EditLocationDialog: Render state', { isOpen, locationId: location?.id });
  }, [isOpen, location?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full_address = `${formData.street_address}, ${formData.city}, ${formData.state} ${formData.zip_code}`.trim();
    onSave({
      ...formData,
      full_address,
    });
  };

  const handleCancel = () => {
    console.log('🔍 EditLocationDialog: handleCancel called');
    // Reset form data when canceling
    setFormData({
      name: '',
      description: '',
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
      location_type: 'service_location' as const,
      is_active: true,
    });
    
    // Aggressive cleanup before calling onCancel
    const cleanupFocusTraps = () => {
      // Blur any focused element
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement !== document.body) {
        activeElement.blur();
      }
      
      // Remove aria-hidden from root and all elements
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.removeAttribute('aria-hidden');
        rootElement.removeAttribute('data-aria-hidden');
        // Ensure root is clickable
        rootElement.style.pointerEvents = '';
      }
      
      // Remove any remaining dialog overlays that might be blocking interactions
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
      overlays.forEach(overlay => {
        const el = overlay as HTMLElement;
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.pointerEvents !== 'none' && computedStyle.display !== 'none') {
          el.style.pointerEvents = 'none';
          el.style.display = 'none';
          setTimeout(() => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          }, 200);
        }
      });
      
      // Remove any fixed overlay elements with high z-index that might be blocking
      const fixedOverlays = document.querySelectorAll('div.fixed.inset-0');
      fixedOverlays.forEach(overlay => {
        const el = overlay as HTMLElement;
        const computedStyle = window.getComputedStyle(el);
        const zIndex = computedStyle.zIndex;
        if (zIndex && parseInt(zIndex) >= 50 && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          el.style.pointerEvents = 'none';
          setTimeout(() => {
            if (el.parentNode && el.style.pointerEvents === 'none') {
              el.parentNode.removeChild(el);
            }
          }, 200);
        }
      });
      
      // Remove aria-hidden from all elements with data-radix-popper-content-wrapper
      const popperElements = document.querySelectorAll('[data-radix-popper-content-wrapper]');
      popperElements.forEach(el => {
        el.removeAttribute('aria-hidden');
        el.removeAttribute('data-aria-hidden');
      });
      
      // Force focus to body to break any trapped focus
      document.body.focus();
      document.body.blur();
      
      // Ensure body is clickable
      document.body.style.pointerEvents = '';
    };
    
    // Immediate cleanup
    cleanupFocusTraps();
    // Additional cleanup after delays
    setTimeout(cleanupFocusTraps, 10);
    setTimeout(cleanupFocusTraps, 50);
    setTimeout(cleanupFocusTraps, 100);
    
    onCancel();
  };

  // Don't render anything if dialog should be closed
  if (!location || !isOpen) {
    return null;
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}
    >
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
                  <SelectItem value="service_location">Service Location</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="dmv">DMV</SelectItem>
                  <SelectItem value="grocery">Grocery</SelectItem>
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
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Update Location</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
