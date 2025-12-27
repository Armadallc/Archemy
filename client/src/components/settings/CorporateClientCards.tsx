import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import AddressInput from "../forms/AddressInput";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
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
  Loader2,
  QrCode,
  Download,
  Plus,
  Edit,
  X
} from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { LogoUpload } from "../LogoUpload";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth";

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
  short_name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
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
  description?: string;
  phone?: string;
  contact_person?: string;
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

interface QRCodeData {
  qrImageUrl: string;
  signupUrl: string;
}

export default function CorporateClientCards() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [editingClients, setEditingClients] = useState<Record<string, CorporateClient>>({});
  const [editingPrograms, setEditingPrograms] = useState<Record<string, Program>>({});
  const [editingLocations, setEditingLocations] = useState<Record<string, Location>>({});
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [selectedProgramForQR, setSelectedProgramForQR] = useState<Program | null>(null);
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Create corporate client mutation - MUST be called before any conditional returns
  const createCorporateClientMutation = useMutation({
    mutationFn: async ({ clientData, logoFile }: { clientData: Partial<CorporateClient>; logoFile?: File | null }) => {
      // First create the corporate client
      const response = await apiRequest('POST', '/api/corporate/clients', clientData);
      const createdClient = await response.json();
      
      // If logo is provided, upload it using FormData
      if (logoFile && createdClient.id) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        // Get auth token for the upload request
        const { supabase } = await import('../../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
        const logoResponse = await fetch(`${apiBaseUrl}/api/corporate/clients/${createdClient.id}/logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            // Don't set Content-Type - let browser set it with boundary for FormData
          },
          body: formData,
          credentials: 'include',
        });
        
        if (!logoResponse.ok) {
          console.warn('Failed to upload logo, but corporate client was created');
        }
      }
      
      return createdClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients/census'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Corporate client created successfully",
        variant: "success"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create corporate client",
        variant: "destructive"
      });
    },
  });

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
                    apiRequest('GET', `/api/locations/program/${program.id}?includeInactive=true`),
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
              apiRequest('GET', `/api/locations/program/${programId}?includeInactive=true`),
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
      const response = await apiRequest('PATCH', `/api/corporate/clients/${clientId}`, client);
      await response.json();
      
      toast({
        title: "Corporate Client Updated",
        description: "Corporate client settings have been saved successfully.",
      });
      
      // Remove from editing state
      const newEditing = { ...editingClients };
      delete newEditing[clientId];
      setEditingClients(newEditing);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients'] });
    } catch (error: any) {
      console.error('Error updating corporate client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save corporate client settings.",
        variant: "destructive",
      });
    }
  };

  const handleEditProgram = (program: Program) => {
    setEditingPrograms({
      ...editingPrograms,
      [program.id]: { ...program },
    });
  };

  const handleSaveProgram = async (programId: string) => {
    const program = editingPrograms[programId];
    if (!program) return;

    try {
      const response = await apiRequest('PATCH', `/api/programs/${programId}`, program);
      await response.json();
      
      toast({
        title: "Program Updated",
        description: "Program settings have been saved successfully.",
      });
      
      // Remove from editing state
      const newEditing = { ...editingPrograms };
      delete newEditing[programId];
      setEditingPrograms(newEditing);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/programs/details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients/census'] });
    } catch (error: any) {
      console.error('Error updating program:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save program settings.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEditProgram = (programId: string) => {
    const newEditing = { ...editingPrograms };
    delete newEditing[programId];
    setEditingPrograms(newEditing);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocations({
      ...editingLocations,
      [location.id]: { ...location },
    });
  };

  const handleSaveLocation = async (locationId: string) => {
    const location = editingLocations[locationId];
    if (!location) return;

    try {
      const response = await apiRequest('PATCH', `/api/locations/${locationId}`, location);
      await response.json();
      
      toast({
        title: "Location Updated",
        description: "Location settings have been saved successfully.",
      });
      
      // Remove from editing state
      const newEditing = { ...editingLocations };
      delete newEditing[locationId];
      setEditingLocations(newEditing);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/programs/details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients/census'] });
    } catch (error: any) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save location settings.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEditLocation = (locationId: string) => {
    const newEditing = { ...editingLocations };
    delete newEditing[locationId];
    setEditingLocations(newEditing);
  };

  // Handle show QR code
  const handleShowQRCode = async (program: Program) => {
    setSelectedProgramForQR(program);
    setQrCodeDialogOpen(true);
    setLoadingQR(true);
    setQrCodeData(null);

    try {
      // Fetch or generate QR code for this program
      const response = await apiRequest("GET", `/api/client-notifications/programs/${program.id}/qr-code`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setQrCodeData({
          qrImageUrl: data.data.qrImageUrl,
          signupUrl: data.data.signupUrl
        });
      } else {
        throw new Error(data.message || "Failed to load QR code");
      }
    } catch (error: any) {
      console.error("Error loading QR code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load QR code",
        variant: "destructive"
      });
    } finally {
      setLoadingQR(false);
    }
  };

  // Regenerate QR code
  const regenerateQRCode = async (programId: string) => {
    setLoadingQR(true);
    try {
      const response = await apiRequest("POST", `/api/client-notifications/programs/${programId}/qr-code/regenerate`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setQrCodeData({
          qrImageUrl: data.data.qrImageUrl,
          signupUrl: data.data.signupUrl
        });
        toast({
          title: "Success",
          description: "QR code regenerated successfully"
        });
      } else {
        throw new Error(data.message || "Failed to regenerate QR code");
      }
    } catch (error: any) {
      console.error("Error regenerating QR code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate QR code",
        variant: "destructive"
      });
    } finally {
      setLoadingQR(false);
    }
  };

  // Download QR code
  const handleDownloadQRCode = () => {
    if (!qrCodeData) return;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement("a");
    link.href = qrCodeData.qrImageUrl;
    link.download = `qr-code-${selectedProgramForQR?.name || 'program'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloaded",
      description: "QR code image downloaded"
    });
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
      {/* Add Partner Button - Only for Super Admin */}
      {user?.role === 'super_admin' && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        </div>
      )}

      {/* Create Corporate Client Dialog */}
      {user?.role === 'super_admin' && (
        <CreateCorporateClientDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreate={(clientData, logoFile) => createCorporateClientMutation.mutate({ clientData, logoFile })}
          isPending={createCorporateClientMutation.isPending}
        />
      )}

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
                        currentLogoUrl={client.logo_url}
                        onLogoUpdate={(logoUrl) => {
                          // Update the client's logo URL in the local state
                          setEditingClients({
                            ...editingClients,
                            [client.id]: { ...editingClients[client.id] || client, logo_url: logoUrl },
                          });
                          // Invalidate queries to refresh the data
                          queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients'] });
                          // Also invalidate the specific corporate client query used by sidebar
                          queryClient.invalidateQueries({ queryKey: ['/api/corporate-clients', client.id] });
                        }}
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
                      <AddressInput
                        value={editingClient.address || ''}
                        onChange={(addressData) => {
                          // Generate full address for backward compatibility
                          const fullAddress = [
                            addressData.street,
                            addressData.city,
                            addressData.state && addressData.zip ? `${addressData.state} ${addressData.zip}` : addressData.state || addressData.zip
                          ].filter(Boolean).join(', ');
                          setEditingClients({
                            ...editingClients,
                            [client.id]: { ...editingClient, address: fullAddress },
                          });
                        }}
                        onFullAddressChange={(fullAddress) =>
                          setEditingClients({
                            ...editingClients,
                            [client.id]: { ...editingClient, address: fullAddress },
                          })
                        }
                        label="Address"
                        required={false}
                        showLabel={true}
                      />
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
                                      <div className="font-medium">
                                        {editingPrograms[program.id] ? editingPrograms[program.id].name : program.name}
                                      </div>
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
                                  <div className="flex items-center gap-2">
                                    <Badge variant={program.is_active ? "default" : "secondary"}>
                                      {program.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                    {!editingPrograms[program.id] && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditProgram(program);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Edit Program"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-4">
                                  {/* Program Edit Form */}
                                  {editingPrograms[program.id] ? (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`prog-name-${program.id}`}>Program Name *</Label>
                                          <Input
                                            id={`prog-name-${program.id}`}
                                            value={editingPrograms[program.id].name}
                                            onChange={(e) =>
                                              setEditingPrograms({
                                                ...editingPrograms,
                                                [program.id]: { ...editingPrograms[program.id], name: e.target.value },
                                              })
                                            }
                                            placeholder="Enter program name"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`prog-short-name-${program.id}`}>Short Name</Label>
                                          <Input
                                            id={`prog-short-name-${program.id}`}
                                            value={editingPrograms[program.id].short_name || ''}
                                            onChange={(e) =>
                                              setEditingPrograms({
                                                ...editingPrograms,
                                                [program.id]: { ...editingPrograms[program.id], short_name: e.target.value },
                                              })
                                            }
                                            placeholder="Enter short name"
                                          />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                          <Label htmlFor={`prog-description-${program.id}`}>Description</Label>
                                          <Textarea
                                            id={`prog-description-${program.id}`}
                                            value={editingPrograms[program.id].description || ''}
                                            onChange={(e) =>
                                              setEditingPrograms({
                                                ...editingPrograms,
                                                [program.id]: { ...editingPrograms[program.id], description: e.target.value },
                                              })
                                            }
                                            placeholder="Enter program description"
                                            rows={3}
                                          />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                          <AddressInput
                                            value={editingPrograms[program.id].address || ''}
                                            onChange={(addressData) => {
                                              // Generate full address for backward compatibility
                                              const fullAddress = [
                                                addressData.street,
                                                addressData.city,
                                                addressData.state && addressData.zip ? `${addressData.state} ${addressData.zip}` : addressData.state || addressData.zip
                                              ].filter(Boolean).join(', ');
                                              setEditingPrograms({
                                                ...editingPrograms,
                                                [program.id]: { ...editingPrograms[program.id], address: fullAddress },
                                              });
                                            }}
                                            onFullAddressChange={(fullAddress) =>
                                              setEditingPrograms({
                                                ...editingPrograms,
                                                [program.id]: { ...editingPrograms[program.id], address: fullAddress },
                                              })
                                            }
                                            label="Address"
                                            required={false}
                                            showLabel={true}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`prog-email-${program.id}`}>Email</Label>
                                          <Input
                                            id={`prog-email-${program.id}`}
                                            type="email"
                                            value={editingPrograms[program.id].email || ''}
                                            onChange={(e) =>
                                              setEditingPrograms({
                                                ...editingPrograms,
                                                [program.id]: { ...editingPrograms[program.id], email: e.target.value },
                                              })
                                            }
                                            placeholder="program@example.com"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor={`prog-phone-${program.id}`}>Phone</Label>
                                          <PhoneInput
                                            id={`prog-phone-${program.id}`}
                                            value={editingPrograms[program.id].phone || ''}
                                            onChange={(value) =>
                                              setEditingPrograms({
                                                ...editingPrograms,
                                                [program.id]: { ...editingPrograms[program.id], phone: value },
                                              })
                                            }
                                          />
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleCancelEditProgram(program.id)}
                                        >
                                          <X className="w-4 h-4 mr-2" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveProgram(program.id)}
                                        >
                                          <Save className="w-4 h-4 mr-2" />
                                          Save Changes
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
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

                                      {/* QR Code Button */}
                                      <div className="flex justify-end pb-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleShowQRCode(program)}
                                          className="flex items-center gap-2"
                                        >
                                          <QrCode className="h-4 w-4" />
                                          Generate QR Code
                                        </Button>
                                      </div>
                                    </>
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
                                        {locations.map((location) => {
                                          const editingLocation = editingLocations[location.id] || location;
                                          const isEditing = !!editingLocations[location.id];
                                          
                                          return (
                                            <div
                                              key={location.id}
                                              className="p-3 border rounded-lg space-y-3"
                                            >
                                              {isEditing ? (
                                                <>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                      <Label htmlFor={`loc-name-${location.id}`}>Location Name</Label>
                                                      <Input
                                                        id={`loc-name-${location.id}`}
                                                        value={editingLocation.name || ''}
                                                        onChange={(e) =>
                                                          setEditingLocations({
                                                            ...editingLocations,
                                                            [location.id]: { ...editingLocation, name: e.target.value },
                                                          })
                                                        }
                                                        placeholder="Enter location name"
                                                      />
                                                    </div>
                                                    <div className="space-y-2">
                                                      <Label htmlFor={`loc-phone-${location.id}`}>Phone</Label>
                                                      <PhoneInput
                                                        id={`loc-phone-${location.id}`}
                                                        value={editingLocation.phone || ''}
                                                        onChange={(value) =>
                                                          setEditingLocations({
                                                            ...editingLocations,
                                                            [location.id]: { ...editingLocation, phone: value },
                                                          })
                                                        }
                                                      />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                      <AddressInput
                                                        value={editingLocation.address}
                                                        onChange={(addressData) => {
                                                          // Generate full address for backward compatibility
                                                          const fullAddress = [
                                                            addressData.street,
                                                            addressData.city,
                                                            addressData.state && addressData.zip ? `${addressData.state} ${addressData.zip}` : addressData.state || addressData.zip
                                                          ].filter(Boolean).join(', ');
                                                          setEditingLocations({
                                                            ...editingLocations,
                                                            [location.id]: { ...editingLocation, address: fullAddress },
                                                          });
                                                        }}
                                                        onFullAddressChange={(fullAddress) =>
                                                          setEditingLocations({
                                                            ...editingLocations,
                                                            [location.id]: { ...editingLocation, address: fullAddress },
                                                          })
                                                        }
                                                        label="Address"
                                                        required={true}
                                                        showLabel={true}
                                                      />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                      <Label htmlFor={`loc-contact-${location.id}`}>Contact Person</Label>
                                                      <Input
                                                        id={`loc-contact-${location.id}`}
                                                        value={editingLocation.contact_person || ''}
                                                        onChange={(e) =>
                                                          setEditingLocations({
                                                            ...editingLocations,
                                                            [location.id]: { ...editingLocation, contact_person: e.target.value },
                                                          })
                                                        }
                                                        placeholder="Enter contact person name"
                                                      />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                      <Label htmlFor={`loc-description-${location.id}`}>Description</Label>
                                                      <Textarea
                                                        id={`loc-description-${location.id}`}
                                                        value={editingLocation.description || ''}
                                                        onChange={(e) =>
                                                          setEditingLocations({
                                                            ...editingLocations,
                                                            [location.id]: { ...editingLocation, description: e.target.value },
                                                          })
                                                        }
                                                        placeholder="Enter a short description of the location"
                                                        rows={3}
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="flex justify-end gap-2">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => handleCancelEditLocation(location.id)}
                                                    >
                                                      <X className="w-4 h-4 mr-2" />
                                                      Cancel
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      onClick={() => handleSaveLocation(location.id)}
                                                    >
                                                      <Save className="w-4 h-4 mr-2" />
                                                      Save Changes
                                                    </Button>
                                                  </div>
                                                </>
                                              ) : (
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                      {location.name && (
                                                        <div className="font-medium text-sm">{location.name}</div>
                                                      )}
                                                      <div className="text-sm text-muted-foreground truncate">
                                                        {location.address || 'No address provided'}
                                                      </div>
                                                      {location.description && (
                                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                          {location.description}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="flex-shrink-0">
                                                      {location.clientCount || 0} {location.clientCount === 1 ? 'Client' : 'Clients'}
                                                    </Badge>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleEditLocation(location)}
                                                      className="h-8 w-8 p-0"
                                                    >
                                                      <Edit className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
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

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>QR Code for {selectedProgramForQR?.name}</DialogTitle>
            <DialogDescription>
              Post this QR code in common areas. Clients can scan it to sign up for trip notifications.
            </DialogDescription>
          </DialogHeader>
          {loadingQR ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : qrCodeData ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={qrCodeData.qrImageUrl}
                  alt="QR Code"
                  className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Signup URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={qrCodeData.signupUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(qrCodeData.signupUrl);
                      toast({
                        title: "Copied",
                        description: "URL copied to clipboard"
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadQRCode}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => selectedProgramForQR && regenerateQRCode(selectedProgramForQR.id)}
                  className="flex-1"
                  disabled={loadingQR}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Instructions:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Print or display this QR code in common areas</li>
                    <li>Clients scan the code with their phone camera</li>
                    <li>They enter their information and PIN to opt-in</li>
                    <li>They'll receive push notifications for their trips</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">Failed to load QR code</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrCodeDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Corporate Client Dialog Component
function CreateCorporateClientDialog({
  isOpen,
  onOpenChange,
  onCreate,
  isPending
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: Partial<CorporateClient>, logoFile?: File | null) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    is_active: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate ID from name (lowercase, replace spaces/special chars with underscores)
    const generateId = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 50); // Ensure it fits VARCHAR(50)
    };
    
    const clientId = generateId(formData.name);
    
    // Normalize website URL - add https:// if missing and user entered something
    let website = formData.website.trim();
    if (website && !website.match(/^https?:\/\//i)) {
      website = `https://${website}`;
    }
    
    const clientData = {
      id: clientId,
      name: formData.name,
      description: formData.description || undefined,
      address: formData.address || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      website: website || undefined,
      is_active: formData.is_active,
    };
    
    onCreate(clientData, logoFile);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      email: '',
      phone: '',
      website: '',
      is_active: true,
    });
    setLogoFile(null);
    setLogoPreview(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Partner</DialogTitle>
          <DialogDescription>
            Create a new corporate client (partner) with all necessary information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Corporate Client Name *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter corporate client name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-website">Website</Label>
                <Input
                  id="create-website"
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="www.example.com or https://example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Enter with or without protocol (https:// will be added automatically if missing)
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@corporateclient.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone</Label>
                <PhoneInput
                  id="create-phone"
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                />
              </div>
            </div>
            <AddressInput
              value={formData.address}
              onChange={(addressData) => {
                // Generate full address for backward compatibility
                const fullAddress = [
                  addressData.street,
                  addressData.city,
                  addressData.state && addressData.zip ? `${addressData.state} ${addressData.zip}` : addressData.state || addressData.zip
                ].filter(Boolean).join(', ');
                setFormData({ ...formData, address: fullAddress });
              }}
              onFullAddressChange={(fullAddress) => setFormData({ ...formData, address: fullAddress })}
              label="Address"
              required={false}
              showLabel={true}
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Logo</h3>
            <div className="space-y-2">
              <Label htmlFor="create-logo">Upload Logo</Label>
              <Input
                id="create-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
              {logoPreview && (
                <div className="mt-2">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="create-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="create-active">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Partner'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

