import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { PhoneInput } from "../ui/phone-input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { 
  Building2, 
  ChevronDown, 
  ChevronRight,
  Users,
  MapPin,
  Mail,
  Phone,
  Save,
  RefreshCw,
  Loader2
} from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { LogoUpload } from "../LogoUpload";
import { useToast } from "../../hooks/use-toast";

interface CorporateClient {
  id: string;
  name: string;
  address?: string;
  email?: string;
  contact_email?: string;
  phone?: string;
  contact_phone?: string;
  logo_url?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CorporateClientCensus {
  programCount: number;
  locationCount: number;
  clientCount: number;
  programNames: string[];
}

interface Program {
  id: string;
  name: string;
  description?: string;
  address?: string;
  logo_url?: string | null;
  is_active: boolean;
  corporate_client_id: string;
  locationCount?: number;
  clientCount?: number;
}

interface Location {
  id: string;
  name?: string;
  address: string;
  program_id: string;
  is_active: boolean;
  clientCount?: number;
}

interface ProgramAdmin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
}

export default function CorporateClientCards() {
  const { toast } = useToast();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [editingClients, setEditingClients] = useState<Record<string, CorporateClient>>({});

  // Fetch all corporate clients
  const { data: corporateClientsData, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['/api/corporate-clients'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/corporate-clients');
        const data = await response.json();
        // Handle different response structures
        let clients: any[] = [];
        if (Array.isArray(data)) {
          clients = data;
        } else if (data && Array.isArray(data.corporateClients)) {
          clients = data.corporateClients;
        } else if (data && Array.isArray(data.data)) {
          clients = data.data;
        }
        
        // Normalize field names and ensure we have required fields
        return clients.map((client: any) => ({
          id: client.id || client.corporate_client_id || client.corporateClientId || '',
          name: client.name || '',
          address: client.address || '',
          email: client.email || client.contact_email || '',
          contact_email: client.contact_email || client.email || '',
          phone: client.phone || client.contact_phone || '',
          contact_phone: client.contact_phone || client.phone || '',
          logo_url: client.logo_url || client.logoUrl || null,
          is_active: client.is_active !== undefined ? client.is_active : (client.isActive !== undefined ? client.isActive : true),
          created_at: client.created_at || client.createdAt,
          updated_at: client.updated_at || client.updatedAt,
        })).filter((client: CorporateClient) => client.id && client.name);
      } catch (error) {
        console.error('Error fetching corporate clients:', error);
        return [];
      }
    },
  });

  // Ensure corporateClients is always an array
  const corporateClients: CorporateClient[] = Array.isArray(corporateClientsData) ? corporateClientsData : [];

  // Fetch census data for all corporate clients
  const { data: censusData = {} } = useQuery<Record<string, CorporateClientCensus>>({
    queryKey: ['/api/corporate-clients/census'],
    queryFn: async () => {
      const census: Record<string, CorporateClientCensus> = {};
      
      await Promise.all(
        corporateClients.map(async (client) => {
          try {
            // Fetch programs
            const programsResponse = await apiRequest('GET', `/api/programs/corporate-client/${client.id}`);
            const programs: Program[] = await programsResponse.json();
            
            // Fetch locations
            const locationsResponse = await apiRequest('GET', `/api/locations/corporate-client/${client.id}`);
            const locations: Location[] = await locationsResponse.json();
            
            // Fetch clients
            const clientsResponse = await apiRequest('GET', `/api/clients/corporate-client/${client.id}`);
            const clients = await clientsResponse.json();
            
            census[client.id] = {
              programCount: programs.length,
              locationCount: locations.length,
              clientCount: Array.isArray(clients) ? clients.length : 0,
              programNames: programs.map(p => p.name),
            };
          } catch (error) {
            console.error(`Error fetching census for ${client.id}:`, error);
            census[client.id] = {
              programCount: 0,
              locationCount: 0,
              clientCount: 0,
              programNames: [],
            };
          }
        })
      );
      
      return census;
    },
    enabled: corporateClients.length > 0,
  });

  // Fetch detailed program data when a card is expanded
  const { data: programDetails = {} } = useQuery<Record<string, Program[]>>({
    queryKey: ['/api/programs/details', Array.from(expandedCards)],
    queryFn: async () => {
      const details: Record<string, Program[]> = {};
      
      await Promise.all(
        Array.from(expandedCards).map(async (clientId) => {
          try {
            const response = await apiRequest('GET', `/api/programs/corporate-client/${clientId}`);
            const programs: Program[] = await response.json();
            
            // Fetch location and client counts for each program
            const programsWithCounts = await Promise.all(
              programs.map(async (program) => {
                try {
                  const [locationsRes, clientsRes] = await Promise.all([
                    apiRequest('GET', `/api/locations/program/${program.id}`),
                    apiRequest('GET', `/api/clients/program/${program.id}`),
                  ]);
                  
                  const locations: Location[] = await locationsRes.json();
                  const clients = await clientsRes.json();
                  
                  return {
                    ...program,
                    locationCount: Array.isArray(locations) ? locations.length : 0,
                    clientCount: Array.isArray(clients) ? clients.length : 0,
                  };
                } catch (error) {
                  console.error(`Error fetching counts for program ${program.id}:`, error);
                  return {
                    ...program,
                    locationCount: 0,
                    clientCount: 0,
                  };
                }
              })
            );
            
            details[clientId] = programsWithCounts;
          } catch (error) {
            console.error(`Error fetching programs for ${clientId}:`, error);
            details[clientId] = [];
          }
        })
      );
      
      return details;
    },
    enabled: expandedCards.size > 0,
  });

  // Fetch location details when a program is expanded
  const { data: locationDetails = {}, isLoading: locationsLoading } = useQuery<Record<string, Location[]>>({
    queryKey: ['/api/locations/details', Array.from(expandedPrograms)],
    queryFn: async () => {
      const details: Record<string, Location[]> = {};
      
      await Promise.all(
        Array.from(expandedPrograms).map(async (programId) => {
          try {
            const [locationsRes, clientsRes] = await Promise.all([
              apiRequest('GET', `/api/locations/program/${programId}`),
              apiRequest('GET', `/api/clients/program/${programId}`),
            ]);
            
            const locationsData = await locationsRes.json();
            const clientsData = await clientsRes.json();
            
            // Normalize locations array
            let locations: any[] = [];
            if (Array.isArray(locationsData)) {
              locations = locationsData;
            } else if (locationsData && Array.isArray(locationsData.data)) {
              locations = locationsData.data;
            } else if (locationsData && Array.isArray(locationsData.locations)) {
              locations = locationsData.locations;
            }
            
            // Normalize clients array
            let clients: any[] = [];
            if (Array.isArray(clientsData)) {
              clients = clientsData;
            } else if (clientsData && Array.isArray(clientsData.data)) {
              clients = clientsData.data;
            } else if (clientsData && Array.isArray(clientsData.clients)) {
              clients = clientsData.clients;
            }
            
            // Group clients by location
            const clientsByLocation: Record<string, number> = {};
            clients.forEach((client: any) => {
              const locationId = client.location_id || client.locationId;
              if (locationId) {
                clientsByLocation[locationId] = (clientsByLocation[locationId] || 0) + 1;
              }
            });
            
            // Normalize and add client counts to locations
            const locationsWithCounts = locations
              .map((location: any) => {
                const locationId = location.id || location.location_id || '';
                const address = location.address || location.street_address || location.full_address || 'No address provided';
                
                return {
                  id: locationId,
                  name: location.name || '',
                  address: address,
                  program_id: location.program_id || location.programId || programId,
                  is_active: location.is_active !== undefined ? location.is_active : (location.isActive !== undefined ? location.isActive : true),
                  clientCount: clientsByLocation[locationId] || 0,
                };
              })
              .filter((location: Location) => {
                // Filter out invalid locations
                const isValid = location.id && location.address && location.address !== 'No address provided';
                if (!isValid) {
                  console.warn('Filtered out invalid location:', location);
                }
                return isValid;
              });
            
            console.log(`✅ Loaded ${locationsWithCounts.length} locations for program ${programId}`, locationsWithCounts);
            details[programId] = locationsWithCounts;
          } catch (error) {
            console.error(`Error fetching locations for ${programId}:`, error);
            details[programId] = [];
          }
        })
      );
      
      return details;
    },
    enabled: expandedPrograms.size > 0,
  });

  // Fetch program admin contact info
  const { data: programAdmins = {} } = useQuery<Record<string, ProgramAdmin>>({
    queryKey: ['/api/programs/admins', Array.from(expandedPrograms)],
    queryFn: async () => {
      const admins: Record<string, ProgramAdmin> = {};
      
      await Promise.all(
        Array.from(expandedPrograms).map(async (programId) => {
          try {
            const response = await apiRequest('GET', `/api/users/program/${programId}`);
            const users = await response.json();
            // Filter for program_admin role
            const adminUsers = Array.isArray(users) 
              ? users.filter((u: any) => u.role === 'program_admin')
              : [];
            const admin = adminUsers.length > 0 ? adminUsers[0] : null;
            if (admin) {
              admins[programId] = admin;
            }
          } catch (error) {
            console.error(`Error fetching admin for program ${programId}:`, error);
          }
        })
      );
      
      return admins;
    },
    enabled: expandedPrograms.size > 0,
  });

  const toggleCard = (clientId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedCards(newExpanded);
  };

  const toggleProgram = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  const handleEditClient = (client: CorporateClient) => {
    setEditingClients({
      ...editingClients,
      [client.id]: { ...client },
    });
  };

  const handleSaveClient = async (clientId: string) => {
    const client = editingClients[clientId];
    if (!client) return;

    try {
      const response = await apiRequest('PUT', `/api/corporate-clients/${clientId}`, client);
      await response.json();
      
      toast({
        title: "Corporate Client Updated",
        description: "Corporate client settings have been saved successfully.",
      });
      
      // Remove from editing state
      const newEditing = { ...editingClients };
      delete newEditing[clientId];
      setEditingClients(newEditing);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save corporate client settings.",
        variant: "destructive",
      });
    }
  };

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-destructive">Error loading corporate clients.</p>
        <p className="text-sm text-muted-foreground mt-2">
          {clientsError instanceof Error ? clientsError.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!Array.isArray(corporateClients) || corporateClients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No corporate clients found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {corporateClients.map((client) => {
        const isExpanded = expandedCards.has(client.id);
        const census = censusData[client.id] || {
          programCount: 0,
          locationCount: 0,
          clientCount: 0,
          programNames: [],
        };
        const programs = programDetails[client.id] || [];
        const editingClient = editingClients[client.id] || client;

        return (
          <Collapsible
            key={client.id}
            open={isExpanded}
            onOpenChange={() => toggleCard(client.id)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {client.logo_url ? (
                        <img
                          src={client.logo_url}
                          alt={`${client.name} logo`}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{client.name}</h3>
                        {!isExpanded && (
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {census.programCount} {census.programCount === 1 ? 'Program' : 'Programs'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {census.locationCount} {census.locationCount === 1 ? 'Location' : 'Locations'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {census.clientCount} {census.clientCount === 1 ? 'Client' : 'Clients'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={client.is_active ? "default" : "secondary"}>
                          {client.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="space-y-6 pt-0">
                  {/* Header Section with Census */}
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center space-x-4">
                      <LogoUpload
                        organizationId={client.id}
                        onLogoUpdate={() => {}}
                        type="corporate-client"
                      />
                      <div>
                        <h3 className="text-xl font-semibold">{client.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {census.programCount} {census.programCount === 1 ? 'Program' : 'Programs'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {census.locationCount} {census.locationCount === 1 ? 'Location' : 'Locations'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {census.clientCount} Total Clients
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingClient.is_active}
                        onCheckedChange={(checked) =>
                          setEditingClients({
                            ...editingClients,
                            [client.id]: { ...editingClient, is_active: checked },
                          })
                        }
                      />
                      <Label>Active</Label>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`corp-name-${client.id}`}>Corporate Client Name</Label>
                        <Input
                          id={`corp-name-${client.id}`}
                          value={editingClient.name}
                          onChange={(e) =>
                            setEditingClients({
                              ...editingClients,
                              [client.id]: { ...editingClient, name: e.target.value },
                            })
                          }
                          placeholder="Enter corporate client name"
                        />
                      </div>
                        <div className="space-y-2">
                          <Label htmlFor={`corp-email-${client.id}`}>Email</Label>
                          <Input
                            id={`corp-email-${client.id}`}
                            type="email"
                            value={editingClient.email || editingClient.contact_email || ''}
                            onChange={(e) =>
                              setEditingClients({
                                ...editingClients,
                                [client.id]: { ...editingClient, email: e.target.value, contact_email: e.target.value },
                              })
                            }
                            placeholder="contact@corporateclient.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`corp-phone-${client.id}`}>Phone</Label>
                          <PhoneInput
                            id={`corp-phone-${client.id}`}
                            value={editingClient.phone || editingClient.contact_phone || ''}
                            onChange={(value) =>
                              setEditingClients({
                                ...editingClients,
                                [client.id]: { ...editingClient, phone: value, contact_phone: value },
                              })
                            }
                          />
                        </div>
                      <div className="space-y-2">
                        <Label htmlFor={`corp-address-${client.id}`}>Address</Label>
                        <Textarea
                          id={`corp-address-${client.id}`}
                          value={editingClient.address || ''}
                          onChange={(e) =>
                            setEditingClients({
                              ...editingClients,
                              [client.id]: { ...editingClient, address: e.target.value },
                            })
                          }
                          placeholder="Enter corporate client address"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSaveClient(client.id)}
                        disabled={!editingClients[client.id]}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Programs Accordion */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Programs</h4>
                    {programs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No programs found.</p>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {programs.map((program) => {
                          const isProgramExpanded = expandedPrograms.has(program.id);
                          const locations = locationDetails[program.id] || [];
                          const admin = programAdmins[program.id];

                          return (
                            <AccordionItem key={program.id} value={program.id}>
                              <AccordionTrigger
                                onClick={() => toggleProgram(program.id)}
                                className="hover:no-underline"
                              >
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center space-x-3">
                                    {program.logo_url ? (
                                      <img
                                        src={program.logo_url}
                                        alt={`${program.name} logo`}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                                        <Building2 className="h-4 w-4 text-white" />
                                      </div>
                                    )}
                                    <div className="text-left">
                                      <div className="font-medium">{program.name}</div>
                                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                                        <span>
                                          {program.locationCount || 0} {program.locationCount === 1 ? 'Location' : 'Locations'}
                                        </span>
                                        <span>
                                          {program.clientCount || 0} {program.clientCount === 1 ? 'Client' : 'Clients'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant={program.is_active ? "default" : "secondary"}>
                                    {program.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-4">
                                  {/* Program Admin Contact */}
                                  {admin && (
                                    <div className="p-4 bg-muted rounded-lg space-y-2">
                                      <h5 className="font-medium text-sm">Main Contact (Program Admin)</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Name: </span>
                                          <span>{admin.first_name} {admin.last_name}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Email: </span>
                                          <span>{admin.email}</span>
                                        </div>
                                        {admin.phone && (
                                          <div>
                                            <span className="text-muted-foreground">Phone: </span>
                                            <span>{admin.phone}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Locations List */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm">Locations</h5>
                                    {locationsLoading && isProgramExpanded ? (
                                      <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-sm text-muted-foreground">Loading locations...</span>
                                      </div>
                                    ) : !Array.isArray(locations) || locations.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No locations found.</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {locations.map((location) => (
                                          <div
                                            key={location.id}
                                            className="p-3 border rounded-lg flex items-center justify-between"
                                          >
                                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                              <span className="text-sm truncate">{location.address || 'No address provided'}</span>
                                            </div>
                                            <Badge variant="outline" className="ml-2 flex-shrink-0">
                                              {location.clientCount || 0} {location.clientCount === 1 ? 'Client' : 'Clients'}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}

