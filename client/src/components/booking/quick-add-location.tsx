import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useHierarchy } from '../../hooks/useHierarchy';
import { useAuth } from '../../hooks/useAuth';
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
import AddressInput, { AddressData } from '../forms/AddressInput';

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
  value: string | AddressData; // Accept both formats for backward compatibility
  onChange: (value: string) => void; // Always returns full address string for backward compatibility
  placeholder?: string;
  locationType?: 'service_location' | 'legal' | 'healthcare' | 'dmv' | 'grocery' | 'other';
  label?: string;
  required?: boolean;
  // Optional props to override hierarchy context (useful when used in trip forms)
  programId?: string;
  corporateClientId?: string;
  locationId?: string;
  // Option to use separated fields (new format)
  useSeparatedFields?: boolean;
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

// Location type configuration (matching frequent-locations page)
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

export default function QuickAddLocation({
  value,
  onChange,
  placeholder = "Enter address or select from frequent locations",
  locationType,
  label = "Address",
  required = false,
  programId: propProgramId,
  corporateClientId: propCorporateClientId,
  locationId: propLocationId,
  useSeparatedFields = true // Default to using separated fields
}: QuickAddLocationProps) {
  const { user } = useAuth();
  const { selectedProgram, selectedCorporateClient } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Determine effective filter values based on user role (similar to frequent-locations page)
  // Props override hierarchy context (useful when used in trip forms with selected program)
  const effectiveCorporateClient = useMemo(() => {
    // Use prop if provided, otherwise use hierarchy
    if (propCorporateClientId) return propCorporateClientId;
    
    if (user?.role === 'super_admin') {
      return selectedCorporateClient;
    } else if (user?.role === 'corporate_admin') {
      return (user as any).corporate_client_id || selectedCorporateClient;
    }
    return undefined;
  }, [propCorporateClientId, user?.role, selectedCorporateClient]);

  const effectiveProgram = useMemo(() => {
    // Use prop if provided (this takes precedence - from parent component)
    if (propProgramId) return propProgramId;
    
    if (user?.role === 'super_admin' || user?.role === 'corporate_admin') {
      return selectedProgram;
    } else if (user?.role === 'program_admin') {
      // Program admins can access locations from their authorized programs
      // If a program is selected, use it; otherwise use primary_program_id or first authorized program
      const primaryProgramId = (user as any).primary_program_id;
      const authorizedPrograms = (user as any).authorized_programs || [];
      
      return selectedProgram || primaryProgramId || (authorizedPrograms.length > 0 ? authorizedPrograms[0] : undefined);
    }
    return undefined;
  }, [propProgramId, user?.role, selectedProgram, user]);

  const effectiveLocation = useMemo(() => {
    // Use prop if provided, otherwise use hierarchy
    if (propLocationId) return propLocationId;
    
    if (user?.role === 'program_user') {
      return (user as any).location_id;
    }
    return undefined;
  }, [propLocationId, user?.role]);

  // Fetch frequent locations using the new by-tag endpoint
  const { data: frequentLocationsByTag = {}, isLoading, error: queryError } = useQuery({
    queryKey: ['/api/locations/frequent/by-tag', effectiveCorporateClient, effectiveProgram, effectiveLocation],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Apply hierarchy filters based on user role
      if (effectiveCorporateClient) {
        params.append('corporate_client_id', effectiveCorporateClient);
      }
      if (effectiveProgram) {
        params.append('program_id', effectiveProgram);
      }
      if (effectiveLocation) {
        params.append('location_id', effectiveLocation);
      }
      
      params.append('is_active', 'true');

      const url = `/api/locations/frequent/by-tag?${params.toString()}`;
      console.log('🔍 QuickAddLocation fetching from:', url);
      
      try {
        const response = await apiRequest('GET', url);
        if (!response.ok) {
          console.error('🔍 QuickAddLocation API error:', response.status, response.statusText);
          throw new Error(`Failed to fetch frequent locations: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('🔍 QuickAddLocation API response:', data);
        // Data is already organized by location type: { 'service_location': [...], 'legal': [...], ... }
        return data || {};
      } catch (error) {
        console.error('🔍 QuickAddLocation fetch error:', error);
        throw error;
      }
    },
    // Enable query for:
    // - Super admins (always)
    // - Users with effective filters (corporate client, program, or location)
    // - Program admins (they can access locations from their authorized programs even without a selected program)
    //   Backend will use all authorized programs if no program_id is provided
    // - Program users (they can access locations from their assigned location if they have a location_id)
    enabled: !!(
      user?.role === 'super_admin' || 
      effectiveCorporateClient || 
      effectiveProgram || 
      effectiveLocation ||
      user?.role === 'program_admin' || // Program admins should always be able to fetch locations (backend handles authorized programs)
      (user?.role === 'program_user' && effectiveLocation) // Program users need a location_id to fetch locations
    ),
    retry: 1,
  });

  // Create frequent location mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FrequentLocation>) => {
      const response = await apiRequest('POST', '/api/frequent-locations', data);
      return await response.json();
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations/frequent/by-tag'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/locations/frequent/by-tag'] });
      queryClient.invalidateQueries({ queryKey: ['/api/frequent-locations'] });
    },
  });

  // Helper to convert AddressData to full address string
  const addressDataToString = (addr: AddressData): string => {
    const parts = [
      addr.street,
      addr.city,
      addr.state && addr.zip ? `${addr.state} ${addr.zip}` : addr.state || addr.zip
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Helper to parse string to AddressData
  const parseAddressString = (addr: string | AddressData): AddressData => {
    if (typeof addr === 'string') {
      const parts = addr.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        const street = parts[0];
        const city = parts[1];
        const stateZip = parts[2].split(/\s+/);
        const state = stateZip[0] || '';
        const zip = stateZip[1] || '';
        return { street, city, state: state.toUpperCase(), zip };
      } else if (parts.length === 2) {
        return { street: parts[0], city: parts[1], state: '', zip: '' };
      } else {
        return { street: addr, city: '', state: '', zip: '' };
      }
    }
    return addr;
  };

  const handleLocationSelect = (location: FrequentLocation) => {
    // Convert frequent location to AddressData format
    const addressData: AddressData = {
      street: location.street_address,
      city: location.city,
      state: location.state,
      zip: location.zip_code || ''
    };
    onChange(location.full_address); // Still return full address for backward compatibility
    setIsOpen(false);
    setSearchTerm('');
    incrementUsageMutation.mutate(location.id);
  };

  const handleAddressChange = (addressData: AddressData) => {
    // Convert AddressData to full address string for backward compatibility
    const fullAddress = addressDataToString(addressData);
    onChange(fullAddress);
  };

  const handleCreateLocation = (data: Partial<FrequentLocation>) => {
    createMutation.mutate({
      ...data,
      corporate_client_id: effectiveCorporateClient,
      program_id: effectiveProgram,
      location_id: effectiveLocation,
    } as Partial<FrequentLocation> & { corporate_client_id?: string; program_id?: string; location_id?: string });
  };

  // Flatten and filter locations by search term
  const allLocations = useMemo(() => {
    return Object.values(frequentLocationsByTag).flat() as FrequentLocation[];
  }, [frequentLocationsByTag]);

  const filteredLocationsByTag = useMemo(() => {
    const filtered: Record<string, FrequentLocation[]> = {};
    
    Object.entries(frequentLocationsByTag).forEach(([locationType, locations]) => {
      const typedLocations = locations as FrequentLocation[];
      const filteredForType = typedLocations.filter((location: FrequentLocation) => {
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
      
      if (filteredForType.length > 0) {
        filtered[locationType] = filteredForType;
      }
    });
    
    return filtered;
  }, [frequentLocationsByTag, searchTerm]);

  console.log('🔍 QuickAddLocation render state:', {
    effectiveProgram,
    effectiveCorporateClient,
    effectiveLocation,
    locationType,
    allLocationsCount: allLocations.length,
    filteredLocationsByTagKeys: Object.keys(filteredLocationsByTag),
    isLoading,
    searchTerm,
  });

  // Generate unique ID based on location type and label
  const inputId = `address-input-${locationType || 'default'}-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2">
      {useSeparatedFields ? (
        <>
          <AddressInput
            value={typeof value === 'string' ? value : value}
            onChange={handleAddressChange}
            onFullAddressChange={onChange} // Also update full address for backward compatibility
            label={label}
            required={required}
            showLabel={true}
          />
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" type="button" className="w-full card-neu-flat hover:card-neu [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}>
                <Plus className="h-4 w-4 mr-2" />
                From Frequent Locations
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 max-h-[500px] overflow-hidden flex flex-col" align="start">
              <Command className="flex flex-col h-full">
                <CommandInput
                  placeholder="Search frequent locations..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      Loading frequent locations...
                    </div>
                  ) : queryError ? (
                    <div className="p-4 text-center text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      Error loading frequent locations. Please try again.
                    </div>
                  ) : Object.keys(filteredLocationsByTag).length === 0 ? (
                    <CommandEmpty>No frequent locations found.</CommandEmpty>
                  ) : (
                    Object.entries(filteredLocationsByTag)
                      .sort(([typeA], [typeB]) => {
                        const priorityA = locationTags[typeA as LocationType]?.priority || 999;
                        const priorityB = locationTags[typeB as LocationType]?.priority || 999;
                        return priorityA - priorityB;
                      })
                      .map(([locationType, locations]) => {
                        const config = locationTags[locationType as LocationType];
                        const Icon = config?.icon || MapPin;
                        return (
                          <CommandGroup key={locationType} heading={config?.label || locationType}>
                            {(locations as FrequentLocation[]).map((location) => {
                              const LocationIcon = locationTypeIcons[location.location_type] || MapPin;
                              return (
                                <CommandItem
                                  key={location.id}
                                  onSelect={() => handleLocationSelect(location)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <LocationIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate" style={{ color: '#a5c8ca' }}>{location.name}</div>
                                      <div className="text-xs truncate" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                                        {location.full_address}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className={`card-neu-flat ${config?.color}`} style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                                      {config?.label}
                                    </Badge>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        );
                      })
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </>
      ) : (
        <>
          <Label htmlFor={inputId}>{label} {required && '*'}</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id={inputId}
                value={typeof value === 'string' ? value : addressDataToString(value)}
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
          <PopoverContent className="w-96 p-0 max-h-[500px] overflow-hidden flex flex-col" align="start">
            <Command className="flex flex-col h-full">
              <CommandInput
                placeholder="Search frequent locations..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                    Loading frequent locations...
                  </div>
                ) : queryError ? (
                  <div className="p-4 text-center text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                    Error loading frequent locations. Please try again.
                  </div>
                ) : Object.keys(filteredLocationsByTag).length === 0 ? (
                  <CommandEmpty>
                    <div className="p-4 text-center text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      No frequent locations found.
                      <br />
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 card-neu-flat hover:card-neu-pressed"
                        style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                        onClick={() => {
                          setIsOpen(false);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" style={{ color: '#a5c8ca' }} />
                        Add New Location
                      </Button>
                    </div>
                  </CommandEmpty>
                ) : (
                  // Display locations organized by location type
                  Object.entries(filteredLocationsByTag)
                    .sort(([typeA], [typeB]) => {
                      const priorityA = locationTags[typeA as keyof typeof locationTags]?.priority || 999;
                      const priorityB = locationTags[typeB as keyof typeof locationTags]?.priority || 999;
                      return priorityA - priorityB;
                    })
                    .map(([locationType, locations]) => {
                      const tagConfig = locationTags[locationType as keyof typeof locationTags];
                      const IconComponent = tagConfig?.icon || MapPin;
                      
                      return (
                        <CommandGroup key={locationType} heading={
                          <div className="flex items-center gap-2 px-2 py-1.5">
                            <IconComponent className="h-3.5 w-3.5" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                            <span className="text-xs font-medium" style={{ color: '#a5c8ca' }}>{tagConfig?.label || locationType}</span>
                            <Badge variant="outline" className="text-xs ml-auto card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                              {locations.length}
                            </Badge>
                          </div>
                        }>
                          {locations.map((location) => {
                            const LocationIcon = locationTypeIcons[location.location_type as LocationType];
                            return (
                              <CommandItem
                                key={location.id}
                                onSelect={() => handleLocationSelect(location)}
                                className="flex items-center gap-2 p-2 cursor-pointer"
                              >
                                <LocationIcon className="h-4 w-4 flex-shrink-0" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate" style={{ color: '#a5c8ca' }}>{location.name}</div>
                                  <div className="text-xs truncate" style={{ color: '#a5c8ca', opacity: 0.7 }}>{location.full_address}</div>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      );
                    })
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
              <CreateLocationDialog
                onSave={handleCreateLocation}
                defaultLocationType={locationType}
                defaultAddress={typeof value === 'string' ? value : addressDataToString(value)}
                corporateClientId={effectiveCorporateClient}
                programId={effectiveProgram}
                locationId={effectiveLocation}
                onClose={() => setIsCreateDialogOpen(false)}
              />
            </Dialog>
          </div>
        </>
      )}
    </div>
  );
}

// Create Location Dialog Component
function CreateLocationDialog({ 
  onSave, 
  defaultLocationType,
  defaultAddress = '',
  corporateClientId,
  programId,
  locationId,
  onClose
}: { 
  onSave: (data: Partial<FrequentLocation>) => void; 
  defaultLocationType?: string;
  defaultAddress?: string;
  corporateClientId?: string;
  programId?: string;
  locationId?: string;
  onClose: () => void;
}) {
  // Fetch program name if programId is provided
  // Try to get it from the programs list if available, otherwise fetch individually
  const { data: programs } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/programs');
      return await response.json();
    },
    enabled: !!programId,
  });
  
  const program = useMemo(() => {
    if (!programId || !programs) return null;
    return Array.isArray(programs) ? programs.find((p: any) => p.id === programId || p.program_id === programId) : null;
  }, [programId, programs]);
  // Parse address if provided
  const parseAddress = (address: string) => {
    if (!address) return { street_address: '', city: '', state: '', zip_code: '' };
    
    // Try to parse common address formats
    // Format: "123 Main St, City, State ZIP" or "123 Main St, City, State"
    const parts = address.split(',').map(p => p.trim());
    
    if (parts.length >= 3) {
      const street_address = parts[0];
      const city = parts[1];
      const stateZip = parts[2].split(/\s+/);
      const state = stateZip[0] || '';
      const zip_code = stateZip[1] || '';
      
      return { street_address, city, state, zip_code };
    } else if (parts.length === 2) {
      return { street_address: parts[0], city: parts[1], state: '', zip_code: '' };
    } else {
      return { street_address: address, city: '', state: '', zip_code: '' };
    }
  };

  const parsedAddress = parseAddress(defaultAddress);

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
    street_address: parsedAddress.street_address,
    city: parsedAddress.city,
    state: parsedAddress.state,
    zip_code: parsedAddress.zip_code,
    location_type: (defaultLocationType && defaultLocationType !== 'pickup' && defaultLocationType !== 'dropoff' 
      ? defaultLocationType 
      : 'service_location') as LocationType,
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
      corporate_client_id: corporateClientId,
      program_id: programId,
      location_id: locationId,
    } as Partial<FrequentLocation>);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add to Frequent Locations</DialogTitle>
        <DialogDescription>
          Add this location to your frequent locations for quick access in future trip creation.
          {programId && (
            <div className="mt-2 text-sm font-medium text-muted-foreground">
              This location will be saved to: <span className="text-foreground">{program?.name || programId}</span>
            </div>
          )}
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

        <AddressInput
          value={formData}
          onChange={(addressData) => {
            setFormData({
              ...formData,
              street_address: addressData.street,
              city: addressData.city,
              state: addressData.state,
              zip_code: addressData.zip
            });
          }}
          label="Address"
          required={true}
          showLabel={true}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Location</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
