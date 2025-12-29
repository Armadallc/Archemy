import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { 
  Users, 
  BarChart3, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Building2,
  Calendar,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  User,
  Home,
  DoorOpen,
  Bed,
  Filter
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { apiRequest } from "../../lib/queryClient";
import { HeaderScopeSelector } from "../../components/HeaderScopeSelector";
import { RollbackManager } from "../../utils/rollback-manager";

interface CensusClient {
  id: string;
  first_name: string;
  last_name: string;
  program_id: string;
  location_id?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  age?: number;
  birth_sex?: string;
  race?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_active: boolean;
  created_at: string;
  program?: {
    id: string;
    name: string;
    corporate_clients?: {
      id: string;
      name: string;
    };
  };
  location?: {
    id: string;
    name: string;
    address?: string;
  };
  room_number?: string;
  bed_number?: string;
}

interface CensusStats {
  total: number;
  byProgram: Record<string, number>;
  byLocation: Record<string, number>;
  byAgeGroup: Record<string, number>;
  byGender: Record<string, number>;
  byRace: Record<string, number>;
}

export default function TeamClientCensusPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "by-program" | "by-location">("by-program");

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

  // Fetch locations for filter dropdown
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations", programFilter, selectedProgram],
    queryFn: async () => {
      if (programFilter !== "all") {
        const response = await apiRequest("GET", `/api/locations/program/${programFilter}`);
        return await response.json();
      } else if (selectedProgram) {
        const response = await apiRequest("GET", `/api/locations/program/${selectedProgram}`);
        return await response.json();
      }
      return [];
    },
    enabled: true,
  });

  // Fetch clients based on hierarchy level and user role
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ["/api/clients", level, selectedCorporateClient, selectedProgram, programFilter, locationFilter],
    queryFn: async () => {
      let endpoint = "/api/clients";
      
      // If location filter is set, fetch clients by location
      if (locationFilter !== "all") {
        endpoint = `/api/clients/location/${locationFilter}`;
      } else if (programFilter !== "all") {
        endpoint = `/api/clients/program/${programFilter}`;
      } else if (selectedProgram) {
        endpoint = `/api/clients/program/${selectedProgram}`;
      } else if (selectedCorporateClient) {
        endpoint = `/api/clients/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      return data;
    },
    enabled: true,
  });

  // Calculate census statistics
  const censusStats = useMemo((): CensusStats => {
    const stats: CensusStats = {
      total: clients.length,
      byProgram: {},
      byLocation: {},
      byAgeGroup: {
        '0-17': 0,
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45-54': 0,
        '55-64': 0,
        '65+': 0
      },
      byGender: {},
      byRace: {}
    };

    clients.forEach((client: CensusClient) => {
      // By program
      const programName = client.program?.name || 'Unassigned';
      stats.byProgram[programName] = (stats.byProgram[programName] || 0) + 1;

      // By location
      const locationName = client.location?.name || 'Unassigned';
      stats.byLocation[locationName] = (stats.byLocation[locationName] || 0) + 1;

      // By age group
      if (client.age !== undefined && client.age !== null) {
        if (client.age < 18) stats.byAgeGroup['0-17']++;
        else if (client.age < 25) stats.byAgeGroup['18-24']++;
        else if (client.age < 35) stats.byAgeGroup['25-34']++;
        else if (client.age < 45) stats.byAgeGroup['35-44']++;
        else if (client.age < 55) stats.byAgeGroup['45-54']++;
        else if (client.age < 65) stats.byAgeGroup['55-64']++;
        else stats.byAgeGroup['65+']++;
      }

      // By gender
      if (client.birth_sex) {
        stats.byGender[client.birth_sex] = (stats.byGender[client.birth_sex] || 0) + 1;
      }

      // By race
      if (client.race) {
        stats.byRace[client.race] = (stats.byRace[client.race] || 0) + 1;
      }
    });

    return stats;
  }, [clients]);

  // Filter clients based on search term
  const filteredClients = clients.filter((client: CensusClient) =>
    client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group clients by program
  const clientsByProgram = useMemo(() => {
    const grouped: Record<string, CensusClient[]> = {};
    filteredClients.forEach((client: CensusClient) => {
      const programName = client.program?.name || 'Unassigned';
      if (!grouped[programName]) {
        grouped[programName] = [];
      }
      grouped[programName].push(client);
    });
    return grouped;
  }, [filteredClients]);

  // Group clients by location
  const clientsByLocation = useMemo(() => {
    const grouped: Record<string, CensusClient[]> = {};
    filteredClients.forEach((client: CensusClient) => {
      const locationName = client.location?.name || 'Unassigned';
      if (!grouped[locationName]) {
        grouped[locationName] = [];
      }
      grouped[locationName].push(client);
    });
    return grouped;
  }, [filteredClients]);

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
          <p className="mt-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>Loading client census...</p>
        </div>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca' }} />
          <p style={{ color: '#a5c8ca', opacity: 0.7 }}>Error loading client census</p>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Please try refreshing the page</p>
        </div>
      </div>
    );
  }

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
                client census.
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

      {/* Census Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{censusStats.total}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Total Clients</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{Object.keys(censusStats.byProgram).length}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Programs</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{Object.keys(censusStats.byLocation).length}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Locations</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>
              {Object.values(censusStats.byAgeGroup).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>With Age Data</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
          <Input
            placeholder="Search clients..."
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
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[200px] card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location: any) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <SelectTrigger className="w-full sm:w-[200px] card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="by-program">By Program</SelectItem>
            <SelectItem value="by-location">By Location</SelectItem>
            <SelectItem value="list">List View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Census Content */}
      {filteredClients.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: '#a5c8ca' }}>No Clients Found</h3>
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>
              {searchTerm ? "No clients match your search criteria." : "No clients available for census."}
            </p>
            <p className="text-sm mt-2" style={{ color: '#a5c8ca', opacity: 0.6 }}>
              Note: This is different from Operations → Clients, which is for trip management
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "by-program" ? (
        <div className="space-y-6">
          {Object.entries(clientsByProgram).map(([programName, programClients]) => (
            <Card key={programName} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: '#a5c8ca' }}>
                    <Building2 className="h-5 w-5 inline mr-2" style={{ color: '#a5c8ca' }} />
                    {programName}
                  </CardTitle>
                  <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                    {programClients.length} client{programClients.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ClientsTable clients={programClients} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === "by-location" ? (
        <div className="space-y-6">
          {Object.entries(clientsByLocation).map(([locationName, locationClients]) => (
            <Card key={locationName} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: '#a5c8ca' }}>
                    <MapPin className="h-5 w-5 inline mr-2" style={{ color: '#a5c8ca' }} />
                    {locationName}
                  </CardTitle>
                  <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                    {locationClients.length} client{locationClients.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ClientsTable clients={locationClients} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <CardTitle style={{ color: '#a5c8ca' }}>ALL CLIENTS</CardTitle>
            <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientsTable clients={filteredClients} />
          </CardContent>
        </Card>
      )}

      {/* Demographic Breakdown */}
      <Tabs defaultValue="demographics" className="w-full">
        <TabsList className="w-full justify-start card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <TabsTrigger value="demographics" style={{ color: '#a5c8ca' }}>
            <BarChart3 className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Demographics
          </TabsTrigger>
          <TabsTrigger value="age" style={{ color: '#a5c8ca' }}>
            <Calendar className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Age Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="mt-6" style={{ boxShadow: 'none' }}>
          <DemographicsTab stats={censusStats} />
        </TabsContent>

        <TabsContent value="age" className="mt-6" style={{ boxShadow: 'none' }}>
          <AgeGroupsTab stats={censusStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Clients Table Component
function ClientsTable({ clients }: { clients: CensusClient[] }) {
  return (
    <div className="rounded-lg overflow-hidden card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <Table>
        <TableHeader>
          <TableRow style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
            <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Name</TableHead>
            <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Program</TableHead>
            <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Location</TableHead>
            <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Room/Bed</TableHead>
            <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Age</TableHead>
            <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                No clients in this group
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client: CensusClient) => (
              <TableRow 
                key={client.id}
                className="hover:card-neu-pressed"
                style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}
              >
                <TableCell style={{ color: '#a5c8ca' }}>
                  {client.first_name} {client.last_name}
                </TableCell>
                <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                  {client.program?.name || 'Unassigned'}
                </TableCell>
                <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                  {client.location?.name || 'Unassigned'}
                </TableCell>
                <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                  {client.room_number && client.bed_number 
                    ? `Room ${client.room_number}, Bed ${client.bed_number}`
                    : client.room_number 
                      ? `Room ${client.room_number}`
                      : '-'}
                </TableCell>
                <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                  {client.age !== undefined && client.age !== null ? `${client.age}` : '-'}
                </TableCell>
                <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                  {client.phone || client.email || '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Demographics Tab Component
function DemographicsTab({ stats }: { stats: CensusStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* By Gender */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>BY GENDER</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.byGender).length === 0 ? (
            <p className="text-center py-8" style={{ color: '#a5c8ca', opacity: 0.7 }}>No gender data available</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byGender).map(([gender, count]) => (
                <div key={gender} className="flex items-center justify-between p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <span style={{ color: '#a5c8ca' }}>{gender}</span>
                  <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Race */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>BY RACE</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.byRace).length === 0 ? (
            <p className="text-center py-8" style={{ color: '#a5c8ca', opacity: 0.7 }}>No race data available</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byRace).map(([race, count]) => (
                <div key={race} className="flex items-center justify-between p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <span style={{ color: '#a5c8ca' }}>{race}</span>
                  <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Age Groups Tab Component
function AgeGroupsTab({ stats }: { stats: CensusStats }) {
  return (
    <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardTitle style={{ color: '#a5c8ca' }}>AGE GROUP DISTRIBUTION</CardTitle>
        <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
          Client distribution by age groups for capacity planning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(stats.byAgeGroup).map(([ageGroup, count]) => (
            <div key={ageGroup} className="flex items-center justify-between p-4 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                <span className="font-medium" style={{ color: '#a5c8ca' }}>{ageGroup} years</span>
              </div>
              <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                {count} client{count !== 1 ? 's' : ''}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
