import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { 
  MapPin, 
  Building, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  FileText, 
  Calendar,
  Award,
  ClipboardList,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Home,
  DoorOpen,
  Bed,
  Building2,
  Plus,
  Edit,
  Trash2,
  Loader2,
  User,
  X
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { apiRequest } from "../../lib/queryClient";
import { HeaderScopeSelector } from "../../components/HeaderScopeSelector";
import { RollbackManager } from "../../utils/rollback-manager";
import { UserAvatar } from "../../components/users/UserAvatar";

interface Location {
  id: string;
  name: string;
  description?: string;
  program_id: string;
  program_name?: string;
  corporate_client_name?: string;
  programs?: {
    id: string;
    name: string;
    corporate_clients?: {
      id: string;
      name: string;
    };
  };
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  contact_person?: string;
  latitude?: string;
  longitude?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client_count?: number;
  staff_count?: number;
  room_count?: number;
  bed_count?: number;
}

export default function TeamLocationsPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string>("all");

  // Feature flag check - hide page header when unified header is enabled
  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();

  // Fetch programs for filter dropdown
  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs", level, selectedCorporateClient, user?.role],
    queryFn: async () => {
      let endpoint = "/api/programs";
      const corporateClientId = selectedCorporateClient || (user as any)?.corporate_client_id;
      
      if (user?.role === 'corporate_admin' && corporateClientId) {
        endpoint = `/api/programs/corporate-client/${corporateClientId}`;
      } else if (level === 'client' && corporateClientId) {
        endpoint = `/api/programs/corporate-client/${corporateClientId}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  // Fetch locations based on hierarchy level and user role
  const { data: locations = [], isLoading: locationsLoading, error: locationsError } = useQuery({
    queryKey: ["/api/locations", level, selectedCorporateClient, selectedProgram, programFilter],
    queryFn: async () => {
      let endpoint = "/api/locations";
      
      // If program filter is set, fetch locations by program
      if (programFilter !== "all") {
        endpoint = `/api/locations/program/${programFilter}`;
      } else if (selectedProgram) {
        endpoint = `/api/locations/program/${selectedProgram}`;
      } else if (selectedCorporateClient) {
        endpoint = `/api/locations/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      return data;
    },
    enabled: true,
  });

  // Fetch detailed location data when one is selected
  const { data: selectedLocationData, isLoading: locationDetailLoading } = useQuery({
    queryKey: ["/api/locations", selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return null;
      const response = await apiRequest("GET", `/api/locations/${selectedLocationId}`);
      return await response.json();
    },
    enabled: !!selectedLocationId,
  });

  // Filter locations based on search term
  const filteredLocations = locations.filter((location: Location) => {
    const programName = location.program_name || location.programs?.name || '';
    return (
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentLocation = selectedLocationId 
    ? locations.find((l: Location) => l.id === selectedLocationId)
    : null;

  if (locationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
          <p className="mt-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>Loading locations...</p>
        </div>
      </div>
    );
  }

  if (locationsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca' }} />
          <p style={{ color: '#a5c8ca', opacity: 0.7 }}>Error loading locations</p>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // If a location is selected, show detailed view
  if (selectedLocationId && currentLocation) {
    return (
      <LocationDetailView
        location={currentLocation}
        locationData={selectedLocationData}
        isLoading={locationDetailLoading}
        onBack={() => setSelectedLocationId(null)}
      />
    );
  }

  // Main list view
  return (
    <div className="space-y-6 p-6">
      {/* Header - Only show if unified header is disabled */}
      {!ENABLE_UNIFIED_HEADER && (
        <div>
          <div className="px-6 py-6 rounded-lg card-neu flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px', boxShadow: '8px 8px 16px 0px rgba(30, 32, 35, 0.6), -8px -8px 16px 0px rgba(30, 32, 35, 0.05)' }}>
            <div>
              <h1 
                className="font-bold text-foreground" 
                style={{ 
                  fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                  fontSize: '110px',
                  fontWeight: 700,
                  color: '#a5c8ca'
                }}
              >
                locations.
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
                <HeaderScopeSelector />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 card-neu-pressed"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          />
        </div>
        {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-full sm:w-[200px] card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((program: any) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Locations Grid */}
      {filteredLocations.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <Building className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: '#a5c8ca' }}>No Locations Found</h3>
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>
              {searchTerm ? "No locations match your search criteria." : "No locations available."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location: Location) => (
            <Card 
              key={location.id} 
              className="card-neu hover:card-neu-pressed transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
              onClick={() => setSelectedLocationId(location.id)}
            >
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg" style={{ color: '#a5c8ca' }}>{location.name}</CardTitle>
                    <CardDescription className="mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      {location.program_name || location.programs?.name || "Unknown Program"}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={location.is_active ? "default" : "secondary"}
                    className="card-neu-flat"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    {location.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {location.description && (
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                    {location.description}
                  </p>
                )}
                
                {location.address && (
                  <p className="text-sm mb-4 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                    <MapPin className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                    {location.address}
                  </p>
                )}
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>{location.client_count || 0}</div>
                    <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Clients</div>
                  </div>
                  <div className="text-center p-2 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>{location.staff_count || 0}</div>
                    <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Staff</div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full card-neu-flat hover:card-neu-pressed"
                  style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocationId(location.id);
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Location Detail View Component
function LocationDetailView({
  location,
  locationData,
  isLoading,
  onBack
}: {
  location: Location;
  locationData: any;
  isLoading: boolean;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
          <p className="mt-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>Loading location details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="card-neu-flat hover:card-neu-pressed"
            style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Back to Locations
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#a5c8ca' }}>{location.name}</h1>
            <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
              {location.program_name || location.programs?.name || "Unknown Program"}
            </p>
          </div>
        </div>
        <Badge 
          variant={location.is_active ? "default" : "secondary"}
          className="card-neu-flat"
          style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
        >
          {location.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <TabsTrigger value="overview" style={{ color: '#a5c8ca' }}>
            <FileText className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="census" style={{ color: '#a5c8ca' }}>
            <Users className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Census
          </TabsTrigger>
          <TabsTrigger value="staff" style={{ color: '#a5c8ca' }}>
            <UserPlus className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Staff
          </TabsTrigger>
          <TabsTrigger value="purpose" style={{ color: '#a5c8ca' }}>
            <Award className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Purpose Tags
          </TabsTrigger>
          <TabsTrigger value="rooms" style={{ color: '#a5c8ca' }}>
            <DoorOpen className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="assignments" style={{ color: '#a5c8ca' }}>
            <Bed className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6" style={{ boxShadow: 'none' }}>
          <OverviewTab location={location} locationData={locationData} />
        </TabsContent>

        <TabsContent value="census" className="mt-6" style={{ boxShadow: 'none' }}>
          <CensusTab location={location} />
        </TabsContent>

        <TabsContent value="staff" className="mt-6" style={{ boxShadow: 'none' }}>
          <StaffTab location={location} />
        </TabsContent>

        <TabsContent value="purpose" className="mt-6" style={{ boxShadow: 'none' }}>
          <PlaceholderTab 
            icon={<Award className="h-8 w-8" style={{ color: '#a5c8ca', opacity: 0.5 }} />}
            title="Location Purpose Tags"
            description="Manage location purpose tags (residence, meetings, QMAP, etc.)"
          />
        </TabsContent>

        <TabsContent value="rooms" className="mt-6" style={{ boxShadow: 'none' }}>
          <PlaceholderTab 
            icon={<DoorOpen className="h-8 w-8" style={{ color: '#a5c8ca', opacity: 0.5 }} />}
            title="Room Inventory & Capacity"
            description="Manage room inventory and capacity tracking"
          />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6" style={{ boxShadow: 'none' }}>
          <RoomBedAssignmentsTab location={location} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ location, locationData }: { location: Location; locationData: any }) {
  return (
    <div className="space-y-6">
      {/* Location Info Card */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>LOCATION INFORMATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {location.description && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Description</p>
              <p style={{ color: '#a5c8ca' }}>{location.description}</p>
            </div>
          )}
          
          {(location.street_address || location.city || location.state) && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <MapPin className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Address
              </p>
              <p style={{ color: '#a5c8ca' }}>
                {[location.street_address || location.address, location.city, location.state, location.zip_code].filter(Boolean).join(", ")}
              </p>
            </div>
          )}

          {location.phone && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <Phone className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Phone
              </p>
              <p style={{ color: '#a5c8ca' }}>{location.phone}</p>
            </div>
          )}

          {location.contact_person && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <UserPlus className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Contact Person
              </p>
              <p style={{ color: '#a5c8ca' }}>{location.contact_person}</p>
            </div>
          )}

          {location.latitude && location.longitude && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Coordinates</p>
              <p style={{ color: '#a5c8ca' }}>{location.latitude}, {location.longitude}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{location.client_count || 0}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Clients</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <UserPlus className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{location.staff_count || 0}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Staff</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <DoorOpen className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{location.room_count || 0}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Rooms</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <Bed className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{location.bed_count || 0}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Beds</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Census Tab Component
function CensusTab({ location }: { location: Location }) {
  const { user } = useAuth();
  
  // Fetch clients for this location
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients/location", location.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/location/${location.id}`);
      return await response.json();
    },
    enabled: !!location.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
  });

  // Fetch staff for the location's program (users don't have location_id, so we show program staff)
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ["/api/users/program", location.program_id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/program/${location.program_id}`);
      return await response.json();
    },
    enabled: !!location.program_id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
  });

  const activeClients = clients.filter((c: any) => c.is_active);
  const activeStaff = staff.filter((s: any) => s.is_active);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>
              {clientsLoading ? '...' : activeClients.length}
            </div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Active Clients</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <UserPlus className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>
              {staffLoading ? '...' : activeStaff.length}
            </div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Program Staff</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>
              {activeClients.length + activeStaff.length}
            </div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Total Census</div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>CLIENTS AT THIS LOCATION</CardTitle>
          <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
            {activeClients.length} active client{activeClients.length !== 1 ? 's' : ''} assigned to this location
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
            </div>
          ) : activeClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
              <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No clients assigned to this location</p>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
                    <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Name</TableHead>
                    <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Contact</TableHead>
                    <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Room/Bed</TableHead>
                    <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeClients.map((client: any) => (
                    <TableRow 
                      key={client.id}
                      className="hover:card-neu-pressed"
                      style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}
                    >
                      <TableCell style={{ color: '#a5c8ca' }}>
                        {client.first_name} {client.last_name}
                      </TableCell>
                      <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                        {client.phone || client.email || '-'}
                      </TableCell>
                      <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                        {client.room_number && client.bed_number 
                          ? `Room ${client.room_number}, Bed ${client.bed_number}`
                          : client.room_number 
                            ? `Room ${client.room_number}`
                            : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={client.is_active ? "default" : "secondary"}
                          className="card-neu-flat"
                          style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                        >
                          {client.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Staff Tab Component
function StaffTab({ location }: { location: Location }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch staff for the location's program (users don't have location_id, so we show program staff)
  const { data: staff = [], isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ["/api/users/program", location.program_id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/program/${location.program_id}`);
      return await response.json();
    },
    enabled: !!location.program_id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
  });

  // Filter staff by search term
  const filteredStaff = staff.filter((member: any) =>
    member.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group staff by role
  const staffByRole = filteredStaff.reduce((acc: Record<string, any[]>, member: any) => {
    const role = member.role || 'unassigned';
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {});

  const roleLabels: Record<string, string> = {
    'super_admin': 'Super Admin',
    'corporate_admin': 'Corporate Admin',
    'program_admin': 'Program Admin',
    'program_user': 'Program User',
    'driver': 'Driver',
    'unassigned': 'Unassigned'
  };

  if (staffLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
          <p className="mt-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>Loading staff...</p>
        </div>
      </div>
    );
  }

  if (staffError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca' }} />
          <p style={{ color: '#a5c8ca', opacity: 0.7 }}>Error loading staff</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
        <Input
          placeholder="Search staff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 card-neu-pressed"
          style={{ backgroundColor: 'var(--background)', border: 'none' }}
        />
      </div>

      {/* Info Card */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>STAFF LIST & HIERARCHY</CardTitle>
          <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Staff members from the program that this location belongs to
            {(location.program_name || location.programs?.name) && (
              <span className="block mt-1">Program: {location.program_name || location.programs?.name}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(staffByRole).length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
              <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No staff members in this program</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(staffByRole).map(([role, roleStaff]) => (
                <div key={role}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium" style={{ color: '#a5c8ca' }}>
                      {roleLabels[role] || role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </h4>
                    <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                      {roleStaff.length} member{roleStaff.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="rounded-lg overflow-hidden card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
                          <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Staff Member</TableHead>
                          <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Email</TableHead>
                          <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Phone</TableHead>
                          <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roleStaff.map((member: any) => (
                          <TableRow 
                            key={member.user_id}
                            className="hover:card-neu-pressed"
                            style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <UserAvatar 
                                  user={{
                                    user_id: member.user_id,
                                    user_name: member.user_name,
                                    email: member.email,
                                    first_name: member.first_name,
                                    last_name: member.last_name,
                                    avatar_url: member.avatar_url
                                  }}
                                  size="sm"
                                />
                                <div>
                                  <p style={{ color: '#a5c8ca' }}>
                                    {member.first_name && member.last_name 
                                      ? `${member.first_name} ${member.last_name}`
                                      : member.user_name}
                                  </p>
                                  {member.tenant_roles && (
                                    <p className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                                      Company: {member.tenant_roles.name}
                                    </p>
            )}
          </div>
                              </div>
                            </TableCell>
                            <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                              {member.email || '-'}
                            </TableCell>
                            <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                              {member.phone || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={member.is_active ? "default" : "secondary"}
                                className="card-neu-flat"
                                style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                              >
                                {member.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Room & Bed Assignments Tab Component
function RoomBedAssignmentsTab({ location }: { location: Location }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<any>(null);
  const [assigningBed, setAssigningBed] = useState<any>(null);
  const [formData, setFormData] = useState({
    room_number: '',
    bed_number: '',
    bed_label: '',
    bed_type: '',
    notes: ''
  });
  const [selectedClientId, setSelectedClientId] = useState('');

  // Fetch room/beds for this location
  const { data: roomBeds = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/location-room-beds/location", location.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/location-room-beds/location/${location.id}`);
      return await response.json();
    },
    enabled: !!location.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin' || user?.role === 'program_user'),
  });

  // Fetch clients for this location (for assignment)
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients/location", location.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/location/${location.id}`);
      return await response.json();
    },
    enabled: !!location.id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/location-room-beds", {
        ...data,
        location_id: location.id
      });
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingBed(null);
      setFormData({
        room_number: '',
        bed_number: '',
        bed_label: '',
        bed_type: '',
        notes: ''
      });
      toast({ title: "Room/bed added successfully", variant: "default" });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/location-room-beds/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingBed(null);
      setFormData({
        room_number: '',
        bed_number: '',
        bed_label: '',
        bed_type: '',
        notes: ''
      });
      toast({ title: "Room/bed updated successfully", variant: "default" });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/location-room-beds/${id}`);
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Room/bed deleted successfully", variant: "default" });
    }
  });

  // Assign client mutation
  const assignMutation = useMutation({
    mutationFn: async ({ bedId, clientId }: { bedId: string; clientId: string }) => {
      const response = await apiRequest("POST", `/api/location-room-beds/${bedId}/assign`, {
        client_id: clientId
      });
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsAssignDialogOpen(false);
      setAssigningBed(null);
      setSelectedClientId('');
      toast({ title: "Client assigned successfully", variant: "default" });
    }
  });

  // Unassign client mutation
  const unassignMutation = useMutation({
    mutationFn: async (bedId: string) => {
      const response = await apiRequest("POST", `/api/location-room-beds/${bedId}/unassign`);
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Client unassigned successfully", variant: "default" });
    }
  });

  const handleSave = () => {
    if (editingBed) {
      updateMutation.mutate({ id: editingBed.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Group room/beds by room number
  const roomBedsByRoom = roomBeds.reduce((acc: Record<string, any[]>, bed: any) => {
    const room = bed.room_number || 'Unassigned';
    if (!acc[room]) acc[room] = [];
    acc[room].push(bed);
    return acc;
  }, {});

  const totalRooms = Object.keys(roomBedsByRoom).length;
  const totalBeds = roomBeds.length;
  const occupiedBeds = roomBeds.filter((b: any) => b.is_occupied).length;
  const availableBeds = totalBeds - occupiedBeds;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>ROOM & BED ASSIGNMENTS</h3>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Manage room and bed inventory and client assignments
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBed(null);
            setFormData({
              room_number: '',
              bed_number: '',
              bed_label: '',
              bed_type: '',
              notes: ''
            });
            setIsDialogOpen(true);
          }}
          className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
        >
          <Plus className="h-4 w-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Add Room/Bed</span>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#a5c8ca' }}>{totalRooms}</div>
              <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Total Rooms</div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#a5c8ca' }}>{totalBeds}</div>
              <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Total Beds</div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{availableBeds}</div>
              <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Available</div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{occupiedBeds}</div>
              <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Occupied</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
        </div>
      ) : Object.keys(roomBedsByRoom).length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <Bed className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No rooms/beds configured for this location</p>
            <p className="text-sm mt-2" style={{ color: '#a5c8ca', opacity: 0.6 }}>
              Add rooms and beds to start tracking assignments
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(roomBedsByRoom).map(([roomNumber, beds]: [string, any[]]) => (
            <Card key={roomNumber} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardTitle className="flex items-center gap-2" style={{ color: '#a5c8ca' }}>
                  <DoorOpen className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                  Room {roomNumber}
                  <Badge className="card-neu-flat ml-auto" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                    {beds.length} bed{beds.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {beds.map((bed: any) => (
                    <div
                      key={bed.id}
                      className={`p-4 rounded-lg ${
                        bed.is_occupied ? 'card-neu-pressed border-2' : 'card-neu-flat'
                      }`}
                      style={{ 
                        backgroundColor: 'var(--background)', 
                        border: bed.is_occupied ? `2px solid ${bed.is_occupied ? '#ef4444' : '#a5c8ca'}` : 'none'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                          <span style={{ color: '#a5c8ca' }}>
                            Bed {bed.bed_number}
                            {bed.bed_label && (
                              <span className="text-sm ml-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                                ({bed.bed_label})
                              </span>
                            )}
                          </span>
                        </div>
                        <Badge 
                          className="card-neu-flat"
                          style={{ 
                            backgroundColor: 'var(--background)', 
                            border: 'none', 
                            color: bed.is_occupied ? '#ef4444' : '#10b981' 
                          }}
                        >
                          {bed.is_occupied ? 'Occupied' : 'Available'}
                        </Badge>
                      </div>
                      
                      {bed.bed_type && (
                        <div className="text-sm mb-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                          Type: {bed.bed_type}
                        </div>
                      )}

                      {bed.is_occupied && bed.assigned_client ? (
                        <div className="mt-3 p-2 rounded card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                            <div>
                              <div style={{ color: '#a5c8ca' }}>
                                {bed.assigned_client.first_name} {bed.assigned_client.last_name}
                              </div>
                              {bed.assigned_client.scid && (
                                <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.6 }}>
                                  SCID: {bed.assigned_client.scid}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {bed.notes && (
                        <div className="text-xs mt-2" style={{ color: '#a5c8ca', opacity: 0.6 }}>
                          {bed.notes}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        {!bed.is_occupied ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAssigningBed(bed);
                              setIsAssignDialogOpen(true);
                            }}
                            className="flex-1 card-neu-flat hover:card-neu-pressed"
                            style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                          >
                            <User className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Unassign client from this bed?')) {
                                unassignMutation.mutate(bed.id);
                              }
                            }}
                            disabled={unassignMutation.isPending}
                            className="flex-1 card-neu-flat hover:card-neu-pressed"
                            style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Unassign
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingBed(bed);
                            setFormData({
                              room_number: bed.room_number || '',
                              bed_number: bed.bed_number || '',
                              bed_label: bed.bed_label || '',
                              bed_type: bed.bed_type || '',
                              notes: bed.notes || ''
                            });
                            setIsDialogOpen(true);
                          }}
                          className="card-neu-flat hover:card-neu-pressed"
                          style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this room/bed?')) {
                              deleteMutation.mutate(bed.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="card-neu-flat hover:card-neu-pressed"
                          style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Room/Bed Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <DialogTitle style={{ color: '#a5c8ca' }}>
              {editingBed ? 'EDIT ROOM/BED' : 'ADD ROOM/BED'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Room Number</Label>
                <Input
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  className="card-neu-pressed"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  placeholder="e.g., 1A, 6B"
                />
              </div>
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Bed Number</Label>
                <Input
                  value={formData.bed_number}
                  onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                  className="card-neu-pressed"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  placeholder="e.g., 1, 2, 1 top, 2 bottom"
                />
              </div>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Bed Label (Optional)</Label>
              <Input
                value={formData.bed_label}
                onChange={(e) => setFormData({ ...formData, bed_label: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                placeholder="e.g., Bed 1 (Top Bunk)"
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Bed Type (Optional)</Label>
              <Select value={formData.bed_type} onValueChange={(value) => setFormData({ ...formData, bed_type: value })}>
                <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Select bed type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="twin">Twin</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="bunk_top">Bunk Top</SelectItem>
                  <SelectItem value="bunk_bottom">Bunk Bottom</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                rows={3}
                placeholder="Special arrangements or notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingBed(null);
                setFormData({
                  room_number: '',
                  bed_number: '',
                  bed_label: '',
                  bed_type: '',
                  notes: ''
                });
              }}
              className="card-neu-flat hover:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending || !formData.room_number || !formData.bed_number}
              className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
              style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
                  <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                    {editingBed ? 'Updating...' : 'Adding...'}
                  </span>
                </>
              ) : (
                <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                  {editingBed ? 'Update' : 'Add'} Room/Bed
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Client Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <DialogTitle style={{ color: '#a5c8ca' }}>
              ASSIGN CLIENT TO BED
            </DialogTitle>
            <DialogDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
              Room {assigningBed?.room_number} • Bed {assigningBed?.bed_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Select Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.filter((c: any) => c.is_active).map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                      {client.scid && ` (${client.scid})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setAssigningBed(null);
                setSelectedClientId('');
              }}
              className="card-neu-flat hover:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (assigningBed && selectedClientId) {
                  assignMutation.mutate({ bedId: assigningBed.id, clientId: selectedClientId });
                }
              }}
              disabled={assignMutation.isPending || !selectedClientId}
              className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
              style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
                  <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                    Assigning...
                  </span>
                </>
              ) : (
                <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                  Assign Client
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Placeholder Tab Component
function PlaceholderTab({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <CardContent className="py-12 text-center">
        {icon}
        <h3 className="text-lg font-medium mt-4 mb-2" style={{ color: '#a5c8ca' }}>{title}</h3>
        <p style={{ color: '#a5c8ca', opacity: 0.7 }}>{description}</p>
        <p className="text-sm mt-2" style={{ color: '#a5c8ca', opacity: 0.6 }}>
          This feature is coming soon
        </p>
      </CardContent>
    </Card>
  );
}
