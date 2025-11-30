import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useHierarchy } from '../../hooks/useHierarchy';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { MapPin, Plus, Building, Gavel, Stethoscope, Store, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface FrequentLocation {
  id: string;
  name: string;
  description?: string;
  street_address: string;
  city: string;
  state: string;
  zip_code?: string;
  full_address: string;
  location_type: 'service_location' | 'legal' | 'healthcare' | 'dmv' | 'grocery' | 'other';
  usage_count: number;
  is_active: boolean;
}

interface QuickAddLocationProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  locationType?: 'service_location' | 'legal' | 'healthcare' | 'dmv' | 'grocery' | 'other';
  label?: string;
  required?: boolean;
}

type LocationType = 'service_location' | 'legal' | 'healthcare' | 'dmv' | 'grocery' | 'other';

const locationTypeIcons: Record<LocationType, typeof MapPin> = {
  service_location: Building,
  legal: Gavel,
  healthcare: Stethoscope,
  dmv: Building,
  grocery: Store,
  other: MapPin,
};

const locationTypeColors: Record<LocationType, string> = {
  service_location: 'bg-indigo-100 text-indigo-800',
  legal: 'bg-red-100 text-red-800',
  healthcare: 'bg-pink-100 text-pink-800',
  dmv: '',
  grocery: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};

const locationTypeStyles: Record<LocationType, React.CSSProperties> = {
  service_location: {},
  legal: {},
  healthcare: {},
  dmv: { backgroundColor: 'rgba(124, 173, 197, 0.2)', color: 'var(--blue-11)' },
  grocery: {},
  other: {},
};

export default function QuickAddLocation({
  value,
  onChange,
  placeholder = "Enter address or select from frequent locations",
  locationType,
  label = "Address",
  required = false
}: QuickAddLocationProps) {
  const { selectedProgram, selectedCorporateClient } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch frequent locations
  const { data: frequentLocations = [], isLoading, error: queryError } = useQuery({
    queryKey: ['/api/frequent-locations', selectedProgram, selectedCorporateClient, locationType],
    queryFn: async () => {
      let endpoint = '/api/frequent-locations';
      const params = new URLSearchParams();
      
      // Use program-specific endpoint if we have a program
      if (selectedProgram) {
        endpoint = `/api/frequent-locations/program/${selectedProgram}`;
      } else {
        // Fall back to general endpoint with filters
        if (selectedCorporateClient) params.append('corporate_client_id', selectedCorporateClient);
        // Don't filter by location_type in Quick Add - show all types
        params.append('is_active', 'true');
        if (params.toString()) {
          endpoint = `${endpoint}?${params.toString()}`;
        }
      }

      console.log('🔍 QuickAddLocation fetching from endpoint:', endpoint);
      try {
        const response = await apiRequest('GET', endpoint);
        if (!response.ok) {
          console.error('🔍 QuickAddLocation API error:', response.status, response.statusText);
          throw new Error(`Failed to fetch frequent locations: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('🔍 QuickAddLocation API response:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('🔍 QuickAddLocation fetch error:', error);
        throw error;
      }
    },
    enabled: !!(selectedProgram || selectedCorporateClient), // Only enable when we have hierarchy context
    retry: 1, // Retry once on failure
  });

  // Create frequent location mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FrequentLocation>) => {
      const response = await apiRequest('POST', '/api/frequent-locations', data);
      return await response.json();
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/frequent-locations'] });
      setIsCreateDialogOpen(false);
      onChange(newLocation.full_address);
      toast({
        title: 'Success',
        description: 'Location added to frequent locations',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add location to frequent locations',
        variant: 'destructive',
      });
    },
  });

  // Increment usage count mutation
  const incrementUsageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/frequent-locations/${id}/increment-usage`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/frequent-locations'] });
    },
  });

  const handleLocationSelect = (location: FrequentLocation) => {
    onChange(location.full_address);
    setIsOpen(false);
    setSearchTerm('');
    incrementUsageMutation.mutate(location.id);
  };

  const handleCreateLocation = (data: Partial<FrequentLocation>) => {
    createMutation.mutate({
      ...data,
      corporate_client_id: selectedCorporateClient,
      program_id: selectedProgram,
    } as Partial<FrequentLocation> & { corporate_client_id?: string; program_id?: string });
  };

  const filteredLocations = frequentLocations.filter((location: FrequentLocation) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        location.name.toLowerCase().includes(searchLower) ||
        location.full_address.toLowerCase().includes(searchLower) ||
        (location.description && location.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  console.log('🔍 QuickAddLocation render state:', {
    selectedProgram,
    selectedCorporateClient,
    locationType,
    frequentLocationsCount: frequentLocations.length,
    filteredLocationsCount: filteredLocations.length,
    isLoading,
    searchTerm,
    frequentLocations: frequentLocations.slice(0, 2), // Show first 2 locations for debugging
    endpoint: selectedProgram ? `/api/frequent-locations/program/${selectedProgram}` : `/api/frequent-locations?is_active=true`
  });

  // Generate unique ID based on location type and label
  const inputId = `address-input-${locationType || 'default'}-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label} {required && '*'}</Label>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
          />
        </div>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button">
              <Search className="h-4 w-4 mr-2" />
              Quick Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search frequent locations..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Loading frequent locations...
                  </div>
                ) : queryError ? (
                  <div className="p-4 text-center text-sm text-red-500">
                    Error loading frequent locations. Please try again.
                  </div>
                ) : filteredLocations.length === 0 ? (
                  <CommandEmpty>
                    <div className="p-4 text-center text-sm text-gray-500">
                      No frequent locations found.
                      <br />
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setIsOpen(false);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add New Location
                      </Button>
                    </div>
                  </CommandEmpty>
                ) : null}
                {!isLoading && !queryError && filteredLocations.length > 0 && (
                  <CommandGroup>
                    {filteredLocations.map((location) => {
                    const IconComponent = locationTypeIcons[location.location_type as LocationType];
                    return (
                      <CommandItem
                        key={location.id}
                        onSelect={() => handleLocationSelect(location)}
                        className="flex items-center gap-3 p-3"
                      >
                        <IconComponent className="h-4 w-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{location.name}</div>
                          <div className="text-sm text-gray-500 truncate">{location.full_address}</div>
                          {location.description && (
                            <div className="text-xs text-gray-400 truncate">{location.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={locationTypeColors[location.location_type as LocationType]}
                            style={locationTypeStyles[location.location_type as LocationType] || {}}
                          >
                            {location.location_type}
                          </Badge>
                          <span className="text-xs text-gray-400">{location.usage_count}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" type="button">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <CreateLocationDialog
            onSave={handleCreateLocation}
            defaultLocationType={locationType}
          />
        </Dialog>
      </div>
    </div>
  );
}

// Create Location Dialog Component
function CreateLocationDialog({ 
  onSave, 
  defaultLocationType 
}: { 
  onSave: (data: Partial<FrequentLocation>) => void; 
  defaultLocationType?: string;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    location_type: LocationType;
  }>({
    name: '',
    description: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    location_type: (defaultLocationType || 'service_location') as LocationType,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full_address = `${formData.street_address}, ${formData.city}, ${formData.state} ${formData.zip_code}`.trim();
    onSave({
      ...formData,
      full_address,
      usage_count: 0,
      is_active: true,
      location_type: formData.location_type,
    } as Partial<FrequentLocation>);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add to Frequent Locations</DialogTitle>
        <DialogDescription>
          Add this location to your frequent locations for quick access in future trip creation.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quick-name">Name *</Label>
            <Input
              id="quick-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="quick-location_type">Type *</Label>
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
          <Label htmlFor="quick-description">Description</Label>
          <Textarea
            id="quick-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description..."
          />
        </div>

        <div>
          <Label htmlFor="quick-street_address">Street Address *</Label>
          <Input
            id="quick-street_address"
            value={formData.street_address}
            onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="quick-city">City *</Label>
            <Input
              id="quick-city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="quick-state">State *</Label>
            <Input
              id="quick-state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="quick-zip_code">ZIP Code</Label>
            <Input
              id="quick-zip_code"
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
  );
}
