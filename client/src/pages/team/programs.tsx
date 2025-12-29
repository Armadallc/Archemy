import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { format, parseISO, isPast, isWithinInterval, addDays } from "date-fns";
import { 
  Building2, 
  FolderTree, 
  Search, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Calendar,
  Award,
  ClipboardList,
  BookOpen,
  UserPlus,
  ArrowLeft,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Filter
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { apiRequest } from "../../lib/queryClient";
import { HeaderScopeSelector } from "../../components/HeaderScopeSelector";
import { RollbackManager } from "../../utils/rollback-manager";
import { UserAvatar } from "../../components/users/UserAvatar";
import { useToast } from "../../hooks/use-toast";

interface Program {
  id: string;
  name: string;
  short_name?: string;
  description?: string;
  corporate_client_id: string;
  corporate_client_name?: string;
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client_count?: number;
  location_count?: number;
  staff_count?: number;
}

export default function TeamProgramsPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  // Feature flag check - hide page header when unified header is enabled
  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();

  // Fetch programs based on hierarchy level and user role
  const { data: programs = [], isLoading: programsLoading, error: programsError } = useQuery({
    queryKey: ["/api/programs", level, selectedCorporateClient, user?.role],
    queryFn: async () => {
      let endpoint = "/api/programs";
      
      // Get corporate client ID from hierarchy or user object
      const corporateClientId = selectedCorporateClient || (user as any)?.corporate_client_id;
      
      // For corporate_admin or when viewing from corporate client context, fetch programs by corporate client
      if (user?.role === 'corporate_admin' && corporateClientId) {
        endpoint = `/api/programs/corporate-client/${corporateClientId}`;
      } else if (level === 'client' && corporateClientId) {
        endpoint = `/api/programs/corporate-client/${corporateClientId}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      return data;
    },
    enabled: true,
  });

  // Fetch detailed program data when one is selected
  const { data: selectedProgramData, isLoading: programDetailLoading } = useQuery({
    queryKey: ["/api/programs", selectedProgramId],
    queryFn: async () => {
      if (!selectedProgramId) return null;
      const response = await apiRequest("GET", `/api/programs/${selectedProgramId}`);
      return await response.json();
    },
    enabled: !!selectedProgramId,
  });

  // Filter programs based on search term
  const filteredPrograms = programs.filter((program: Program) =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.corporate_client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentProgram = selectedProgramId 
    ? programs.find((p: Program) => p.id === selectedProgramId)
    : null;

  if (programsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
          <p className="mt-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>Loading programs...</p>
        </div>
      </div>
    );
  }

  if (programsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca' }} />
          <p style={{ color: '#a5c8ca', opacity: 0.7 }}>Error loading programs</p>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // If a program is selected, show detailed view
  if (selectedProgramId && currentProgram) {
    return (
      <ProgramDetailView
        program={currentProgram}
        programData={selectedProgramData}
        isLoading={programDetailLoading}
        onBack={() => setSelectedProgramId(null)}
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
                programs.
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
        <Input
          placeholder="Search programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 card-neu-pressed"
          style={{ backgroundColor: 'var(--background)', border: 'none' }}
        />
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: '#a5c8ca' }}>No Programs Found</h3>
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>
              {searchTerm ? "No programs match your search criteria." : "No programs available."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program: Program) => (
            <Card 
              key={program.id} 
              className="card-neu hover:card-neu-pressed transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
              onClick={() => setSelectedProgramId(program.id)}
            >
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg" style={{ color: '#a5c8ca' }}>{program.name}</CardTitle>
                    <CardDescription className="mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      {program.corporate_client_name || "Unknown Client"}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={program.is_active ? "default" : "secondary"}
                    className="card-neu-flat"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    {program.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {program.description && (
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                    {program.description}
                  </p>
                )}
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>{program.client_count || 0}</div>
                    <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Clients</div>
                  </div>
                  <div className="text-center p-2 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>{program.location_count || 0}</div>
                    <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Locations</div>
                  </div>
                  <div className="text-center p-2 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>{program.staff_count || 0}</div>
                    <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Staff</div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full card-neu-flat hover:card-neu-pressed"
                  style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProgramId(program.id);
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

// Program Detail View Component
function ProgramDetailView({
  program,
  programData,
  isLoading,
  onBack
}: {
  program: Program;
  programData: any;
  isLoading: boolean;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
          <p className="mt-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>Loading program details...</p>
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
            Back to Programs
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#a5c8ca' }}>{program.name}</h1>
            <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
              {program.corporate_client_name || "Unknown Client"}
            </p>
          </div>
        </div>
        <Badge 
          variant={program.is_active ? "default" : "secondary"}
          className="card-neu-flat"
          style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
        >
          {program.is_active ? "Active" : "Inactive"}
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
          <TabsTrigger value="licensures" style={{ color: '#a5c8ca' }}>
            <Award className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Licensures
          </TabsTrigger>
          <TabsTrigger value="certifications" style={{ color: '#a5c8ca' }}>
            <FileCheck className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Certifications
          </TabsTrigger>
          <TabsTrigger value="scheduling" style={{ color: '#a5c8ca' }}>
            <Calendar className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="forms" style={{ color: '#a5c8ca' }}>
            <ClipboardList className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Forms
          </TabsTrigger>
          <TabsTrigger value="tasks" style={{ color: '#a5c8ca' }}>
            <CheckCircle2 className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="curriculum" style={{ color: '#a5c8ca' }}>
            <BookOpen className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="onboarding" style={{ color: '#a5c8ca' }}>
            <UserPlus className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Onboarding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6" style={{ boxShadow: 'none' }}>
          <OverviewTab program={program} programData={programData} />
        </TabsContent>

        <TabsContent value="census" className="mt-6" style={{ boxShadow: 'none' }}>
          <CensusTab program={program} />
        </TabsContent>

        <TabsContent value="staff" className="mt-6" style={{ boxShadow: 'none' }}>
          <StaffTab program={program} />
        </TabsContent>

        <TabsContent value="licensures" className="mt-6" style={{ boxShadow: 'none' }}>
          <LicensuresTab program={program} />
        </TabsContent>

        <TabsContent value="certifications" className="mt-6" style={{ boxShadow: 'none' }}>
          <CertificationsTab program={program} />
        </TabsContent>

        <TabsContent value="scheduling" className="mt-6" style={{ boxShadow: 'none' }}>
          <SchedulingTab program={program} />
        </TabsContent>

        <TabsContent value="forms" className="mt-6" style={{ boxShadow: 'none' }}>
          <FormsTab program={program} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6" style={{ boxShadow: 'none' }}>
          <TasksTab program={program} />
        </TabsContent>

        <TabsContent value="curriculum" className="mt-6" style={{ boxShadow: 'none' }}>
          <CurriculumTab program={program} />
        </TabsContent>

        <TabsContent value="onboarding" className="mt-6" style={{ boxShadow: 'none' }}>
          <OnboardingTab program={program} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ program, programData }: { program: Program; programData: any }) {
  return (
    <div className="space-y-6">
      {/* Program Info Card */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>PROGRAM INFORMATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {program.description && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Description</p>
              <p style={{ color: '#a5c8ca' }}>{program.description}</p>
            </div>
          )}
          
          {(program.street_address || program.city || program.state) && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <MapPin className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Address
              </p>
              <p style={{ color: '#a5c8ca' }}>
                {[program.street_address, program.city, program.state, program.zip_code].filter(Boolean).join(", ")}
              </p>
            </div>
          )}

          {program.phone && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <Phone className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Phone
              </p>
              <p style={{ color: '#a5c8ca' }}>{program.phone}</p>
            </div>
          )}

          {program.email && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <Mail className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Email
              </p>
              <p style={{ color: '#a5c8ca' }}>{program.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{program.client_count || 0}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Clients</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{program.location_count || 0}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Locations</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <UserPlus className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>{program.staff_count || 0}</div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Staff</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Census Tab Component
function CensusTab({ program }: { program: Program }) {
  const { user } = useAuth();
  
  // Fetch clients for this program
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
  });

  // Fetch staff for this program
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ["/api/users/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
  });

  // Fetch locations for this program
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/locations/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id,
  });

  const activeClients = clients.filter((c: any) => c.is_active);
  const activeStaff = staff.filter((s: any) => s.is_active);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Active Staff</div>
          </CardContent>
        </Card>

        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2" style={{ color: '#a5c8ca' }} />
            <div className="text-3xl font-bold mb-1" style={{ color: '#a5c8ca' }}>
              {locations.length}
            </div>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Locations</div>
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

      {/* Clients by Location */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>CLIENTS BY LOCATION</CardTitle>
          <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Distribution of clients across program locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
              <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No locations assigned to this program</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location: any) => {
                const locationClients = activeClients.filter((c: any) => c.location_id === location.id);
                return (
                  <div 
                    key={location.id} 
                    className="flex items-center justify-between p-4 rounded-lg card-neu-flat"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                      <div>
                        <p style={{ color: '#a5c8ca' }}>{location.name}</p>
                        {location.address && (
                          <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>{location.address}</p>
                        )}
                      </div>
                    </div>
                    <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                      {locationClients.length} client{locationClients.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                );
              })}
              {activeClients.filter((c: any) => !c.location_id).length > 0 && (
                <div 
                  className="flex items-center justify-between p-4 rounded-lg card-neu-flat"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                    <div>
                      <p style={{ color: '#a5c8ca' }}>Unassigned</p>
                      <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Clients without location assignment</p>
                    </div>
                  </div>
                  <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                    {activeClients.filter((c: any) => !c.location_id).length} client{activeClients.filter((c: any) => !c.location_id).length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Staff Tab Component
function StaffTab({ program }: { program: Program }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch staff for this program
  const { data: staff = [], isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ["/api/users/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
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

      {/* Staff by Role */}
      {Object.keys(staffByRole).length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <UserPlus className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No staff members assigned to this program</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(staffByRole).map(([role, roleStaff]) => (
            <Card key={role} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: '#a5c8ca' }}>
                    {roleLabels[role] || role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </CardTitle>
                  <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                    {roleStaff.length} member{roleStaff.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Licensures Tab Component
function LicensuresTab({ program }: { program: Program }) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [formData, setFormData] = useState({
    license_type: '',
    license_number: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
    renewal_reminder_days: 30,
    notes: ''
  });

  // Fetch licensures
  const { data: licensures = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/program-management/licensures/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/program-management/licensures/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/program-management/licensures", {
        ...data,
        program_id: program.id,
        corporate_client_id: program.corporate_client_id
      });
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingLicense(null);
      setFormData({
        license_type: '',
        license_number: '',
        issuing_authority: '',
        issue_date: '',
        expiry_date: '',
        renewal_reminder_days: 30,
        notes: ''
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/program-management/licensures/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingLicense(null);
      setFormData({
        license_type: '',
        license_number: '',
        issuing_authority: '',
        issue_date: '',
        expiry_date: '',
        renewal_reminder_days: 30,
        notes: ''
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/program-management/licensures/${id}`);
    },
    onSuccess: () => {
      refetch();
    }
  });

  const handleSave = () => {
    if (editingLicense) {
      updateMutation.mutate({ id: editingLicense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return { status: 'unknown', color: '#a5c8ca', label: 'Unknown' };
    const expiry = parseISO(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isPast(expiry)) {
      return { status: 'expired', color: '#ef4444', label: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: '#f59e0b', label: `Expires in ${daysUntilExpiry} days` };
    } else {
      return { status: 'valid', color: '#10b981', label: 'Valid' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>PROGRAM LICENSURES</h3>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Track program licensures with expiry alerts
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
        >
          <Plus className="h-4 w-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Add License</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
        </div>
      ) : licensures.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <Award className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No licensures tracked for this program</p>
            <p className="text-sm mt-2" style={{ color: '#a5c8ca', opacity: 0.6 }}>
              Add a license to start tracking
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {licensures.map((license) => {
            const expiryStatus = getExpiryStatus(license.expiry_date);
            return (
              <Card key={license.id} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ color: '#a5c8ca' }}>{license.license_type || 'Unnamed License'}</CardTitle>
                    <Badge 
                      className="card-neu-flat"
                      style={{ 
                        backgroundColor: 'var(--background)', 
                        border: 'none', 
                        color: expiryStatus.color 
                      }}
                    >
                      {expiryStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>License Number</p>
                    <p style={{ color: '#a5c8ca' }}>{license.license_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Issuing Authority</p>
                    <p style={{ color: '#a5c8ca' }}>{license.issuing_authority || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Issue Date</p>
                      <p style={{ color: '#a5c8ca' }}>{license.issue_date ? format(parseISO(license.issue_date), 'MMM d, yyyy') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Expiry Date</p>
                      <p style={{ color: expiryStatus.color }}>{license.expiry_date ? format(parseISO(license.expiry_date), 'MMM d, yyyy') : '-'}</p>
                    </div>
                  </div>
                  {license.notes && (
                    <div>
                      <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Notes</p>
                      <p style={{ color: '#a5c8ca', opacity: 0.8 }}>{license.notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingLicense(license);
                        setFormData(license);
                        setIsDialogOpen(true);
                      }}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this license?')) {
                          deleteMutation.mutate(license.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <DialogTitle style={{ color: '#a5c8ca' }}>
              {editingLicense ? 'EDIT LICENSE' : 'ADD LICENSE'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>License Type</Label>
              <Input
                value={formData.license_type}
                onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                placeholder="e.g., State License, Facility License"
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>License Number</Label>
              <Input
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Issuing Authority</Label>
              <Input
                value={formData.issuing_authority}
                onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                placeholder="e.g., State Department of Health"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Issue Date</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="card-neu-pressed"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="card-neu-pressed"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Renewal Reminder (Days Before)</Label>
              <Input
                type="number"
                value={formData.renewal_reminder_days}
                onChange={(e) => setFormData({ ...formData, renewal_reminder_days: parseInt(e.target.value) || 30 })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingLicense(null);
                setFormData({
                  license_type: '',
                  license_number: '',
                  issuing_authority: '',
                  issue_date: '',
                  expiry_date: '',
                  renewal_reminder_days: 30,
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
              style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
                  <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                    {editingLicense ? 'Updating...' : 'Adding...'}
                  </span>
                </>
              ) : (
                <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                  {editingLicense ? 'Update' : 'Add'} License
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Certifications Tab Component
function CertificationsTab({ program }: { program: Program }) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);
  const [formData, setFormData] = useState({
    staff_member_id: '',
    certification_type: '',
    certification_name: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    certificate_number: '',
    notes: ''
  });

  // Fetch certifications
  const { data: certifications = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/program-management/certifications/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/program-management/certifications/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
  });

  // Fetch staff for dropdown
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/users/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/program-management/certifications", {
        ...data,
        program_id: program.id,
        corporate_client_id: program.corporate_client_id
      });
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingCert(null);
      setFormData({
        staff_member_id: '',
        certification_type: '',
        certification_name: '',
        issuing_organization: '',
        issue_date: '',
        expiry_date: '',
        certificate_number: '',
        notes: ''
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/program-management/certifications/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingCert(null);
      setFormData({
        staff_member_id: '',
        certification_type: '',
        certification_name: '',
        issuing_organization: '',
        issue_date: '',
        expiry_date: '',
        certificate_number: '',
        notes: ''
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/program-management/certifications/${id}`);
    },
    onSuccess: () => {
      refetch();
    }
  });

  const handleSave = () => {
    if (editingCert) {
      updateMutation.mutate({ id: editingCert.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return { status: 'unknown', color: '#a5c8ca', label: 'Unknown' };
    const expiry = parseISO(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isPast(expiry)) {
      return { status: 'expired', color: '#ef4444', label: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: '#f59e0b', label: `Expires in ${daysUntilExpiry} days` };
    } else {
      return { status: 'valid', color: '#10b981', label: 'Valid' };
    }
  };

  const getStaffName = (staffId: string) => {
    const member = staff.find((s: any) => s.user_id === staffId);
    if (!member) {
      // Try to find in certification data
      const cert = certifications.find((c: any) => c.staff_member_id === staffId);
      if (cert?.staff_member) {
        return cert.staff_member.first_name && cert.staff_member.last_name
          ? `${cert.staff_member.first_name} ${cert.staff_member.last_name}`
          : cert.staff_member.user_name || 'Unknown';
      }
      return 'Unknown';
    }
    return member.first_name && member.last_name 
      ? `${member.first_name} ${member.last_name}`
      : member.user_name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>STAFF CERTIFICATIONS</h3>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Track staff certifications and renewal dates
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
        >
          <Plus className="h-4 w-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Add Certification</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
        </div>
      ) : certifications.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No certifications tracked for this program</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => {
            const expiryStatus = getExpiryStatus(cert.expiry_date);
            return (
              <Card key={cert.id} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle style={{ color: '#a5c8ca' }}>{cert.certification_name || 'Unnamed Certification'}</CardTitle>
                      <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
                        {getStaffName(cert.staff_member_id)}
                      </CardDescription>
                    </div>
                    <Badge 
                      className="card-neu-flat"
                      style={{ 
                        backgroundColor: 'var(--background)', 
                        border: 'none', 
                        color: expiryStatus.color 
                      }}
                    >
                      {expiryStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Type</p>
                      <p style={{ color: '#a5c8ca' }}>{cert.certification_type || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Certificate Number</p>
                      <p style={{ color: '#a5c8ca' }}>{cert.certificate_number || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Issuing Organization</p>
                    <p style={{ color: '#a5c8ca' }}>{cert.issuing_organization || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Issue Date</p>
                      <p style={{ color: '#a5c8ca' }}>{cert.issue_date ? format(parseISO(cert.issue_date), 'MMM d, yyyy') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Expiry Date</p>
                      <p style={{ color: expiryStatus.color }}>{cert.expiry_date ? format(parseISO(cert.expiry_date), 'MMM d, yyyy') : '-'}</p>
                    </div>
                  </div>
                  {cert.notes && (
                    <div>
                      <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Notes</p>
                      <p style={{ color: '#a5c8ca', opacity: 0.8 }}>{cert.notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCert(cert);
                        setFormData(cert);
                        setIsDialogOpen(true);
                      }}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this certification?')) {
                          deleteMutation.mutate(cert.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <DialogTitle style={{ color: '#a5c8ca' }}>
              {editingCert ? 'EDIT CERTIFICATION' : 'ADD CERTIFICATION'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Staff Member</Label>
              <Select
                value={formData.staff_member_id}
                onValueChange={(value) => setFormData({ ...formData, staff_member_id: value })}
              >
                <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member: any) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.first_name && member.last_name 
                        ? `${member.first_name} ${member.last_name}`
                        : member.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Certification Type</Label>
              <Select
                value={formData.certification_type}
                onValueChange={(value) => setFormData({ ...formData, certification_type: value })}
              >
                <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpr">CPR/AED</SelectItem>
                  <SelectItem value="first_aid">First Aid</SelectItem>
                  <SelectItem value="medication">Medication Administration</SelectItem>
                  <SelectItem value="behavioral">Behavioral Health</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Certification Name</Label>
              <Input
                value={formData.certification_name}
                onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                placeholder="e.g., Basic Life Support (BLS)"
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Issuing Organization</Label>
              <Input
                value={formData.issuing_organization}
                onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                placeholder="e.g., American Red Cross"
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Certificate Number</Label>
              <Input
                value={formData.certificate_number}
                onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Issue Date</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="card-neu-pressed"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="card-neu-pressed"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingCert(null);
                setFormData({
                  staff_member_id: '',
                  certification_type: '',
                  certification_name: '',
                  issuing_organization: '',
                  issue_date: '',
                  expiry_date: '',
                  certificate_number: '',
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
              style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
                  <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                    {editingCert ? 'Updating...' : 'Adding...'}
                  </span>
                </>
              ) : (
                <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                  {editingCert ? 'Update' : 'Add'} Certification
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Scheduling Tab Component
function SchedulingTab({ program }: { program: Program }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Fetch driver schedules for this program
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ["/api/drivers/schedules/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/drivers/schedules`);
      const allSchedules = await response.json();
      return allSchedules.filter((s: any) => s.program_id === program.id);
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin'),
  });

  // Fetch drivers for this program
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/drivers/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id,
  });

  // Group schedules by driver
  const schedulesByDriver = schedules.reduce((acc: Record<string, any[]>, schedule: any) => {
    const driverId = schedule.driver_id;
    if (!acc[driverId]) acc[driverId] = [];
    acc[driverId].push(schedule);
    return acc;
  }, {});

  // Get day of week for selected date
  const selectedDayOfWeek = new Date(selectedDate).getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Filter schedules for selected day
  const schedulesForDay = schedules.filter((s: any) => s.day_of_week === selectedDayOfWeek && s.is_available);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>DRIVER SCHEDULING & AVAILABILITY</h3>
        <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
          View driver schedules and availability for this program
        </p>
      </div>

      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <div className="flex items-center justify-between">
            <CardTitle style={{ color: '#a5c8ca' }}>AVAILABILITY BY DAY</CardTitle>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="card-neu-pressed"
              style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {schedulesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
            </div>
          ) : schedulesForDay.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
              <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No drivers scheduled for {dayNames[selectedDayOfWeek]}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm mb-4" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                Showing availability for <strong>{dayNames[selectedDayOfWeek]}</strong> ({format(parseISO(selectedDate), 'MMM d, yyyy')})
              </div>
              {Object.entries(schedulesByDriver).map(([driverId, driverSchedules]: [string, any[]]) => {
                const driver = drivers.find((d: any) => d.id === driverId);
                const daySchedule = driverSchedules.find((s: any) => s.day_of_week === selectedDayOfWeek && s.is_available);
                
                if (!daySchedule) return null;

                return (
                  <div
                    key={driverId}
                    className="p-4 rounded-lg card-neu-flat"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p style={{ color: '#a5c8ca' }}>
                          {driver?.users?.first_name && driver?.users?.last_name
                            ? `${driver.users.first_name} ${driver.users.last_name}`
                            : driver?.users?.user_name || 'Unknown Driver'}
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                          {daySchedule.start_time} - {daySchedule.end_time}
                        </p>
                      </div>
                      <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                        Available
                      </Badge>
                    </div>
                    {daySchedule.notes && (
                      <p className="text-sm mt-2" style={{ color: '#a5c8ca', opacity: 0.6 }}>
                        {daySchedule.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>WEEKLY SCHEDULE OVERVIEW</CardTitle>
        </CardHeader>
        <CardContent>
          {schedulesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
            </div>
          ) : Object.keys(schedulesByDriver).length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
              <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No driver schedules configured for this program</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(schedulesByDriver).map(([driverId, driverSchedules]: [string, any[]]) => {
                const driver = drivers.find((d: any) => d.id === driverId);
                if (!driver) return null;

                return (
                  <div
                    key={driverId}
                    className="p-4 rounded-lg card-neu-flat"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ color: '#a5c8ca' }}>
                        {driver.users?.first_name && driver.users?.last_name
                          ? `${driver.users.first_name} ${driver.users.last_name}`
                          : driver.users?.user_name || 'Unknown Driver'}
                      </p>
                      <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                        {driverSchedules.filter((s: any) => s.is_available).length} days scheduled
                      </Badge>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {dayNames.map((dayName, index) => {
                        const schedule = driverSchedules.find((s: any) => s.day_of_week === index && s.is_available);
                        return (
                          <div
                            key={index}
                            className={`p-2 rounded text-center text-xs ${
                              schedule ? 'card-neu-pressed' : 'card-neu-flat'
                            }`}
                            style={{ backgroundColor: 'var(--background)', border: 'none' }}
                          >
                            <div style={{ color: '#a5c8ca', opacity: 0.7 }}>{dayName.slice(0, 3)}</div>
                            {schedule ? (
                              <div className="mt-1" style={{ color: '#a5c8ca' }}>
                                {schedule.start_time} - {schedule.end_time}
                              </div>
                            ) : (
                              <div className="mt-1" style={{ color: '#a5c8ca', opacity: 0.3 }}>—</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Forms Tab Component
function FormsTab({ program }: { program: Program }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [formData, setFormData] = useState({
    form_name: '',
    form_type: '',
    description: '',
    version: '1.0',
    is_active: true
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch forms
  const { data: forms = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/program-management/forms/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/program-management/forms/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin' || user?.role === 'program_user'),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/program-management/forms", {
        ...data,
        program_id: program.id,
        corporate_client_id: program.corporate_client_id
      });
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingForm(null);
      setFormData({
        form_name: '',
        form_type: '',
        description: '',
        version: '1.0',
        is_active: true
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/program-management/forms/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingForm(null);
      setFormData({
        form_name: '',
        form_type: '',
        description: '',
        version: '1.0',
        is_active: true
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/program-management/forms/${id}`);
    },
    onSuccess: () => {
      refetch();
    }
  });

  const handleSave = () => {
    if (editingForm) {
      updateMutation.mutate({ id: editingForm.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>FORMS & TEMPLATES</h3>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Manage program forms and document templates
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
        >
          <Plus className="h-4 w-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Add Form</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
        </div>
      ) : forms.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No forms or templates for this program</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: '#a5c8ca' }}>{form.form_name}</CardTitle>
                  <Badge 
                    variant={form.is_active ? "default" : "secondary"}
                    className="card-neu-flat"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    {form.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Type</p>
                  <p style={{ color: '#a5c8ca' }}>{form.form_type || '-'}</p>
                </div>
                {form.description && (
                  <div>
                    <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Description</p>
                    <p style={{ color: '#a5c8ca', opacity: 0.8 }}>{form.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>Version</p>
                  <p style={{ color: '#a5c8ca' }}>{form.version}</p>
                </div>
                {form.document_url && (
                  <div className="mb-2">
                    <a
                      href={form.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      style={{ color: '#a5c8ca', opacity: 0.8 }}
                    >
                      View Document
                    </a>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {form.document_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(form.document_url, '_blank')}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="card-neu-flat"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca', opacity: 0.5 }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      No Document
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingForm(form);
                      setFormData(form);
                      setIsDialogOpen(true);
                    }}
                    className="card-neu-flat hover:card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this form?')) {
                          deleteMutation.mutate(form.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <DialogTitle style={{ color: '#a5c8ca' }}>
              {editingForm ? 'EDIT FORM' : 'ADD FORM'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Form Name</Label>
              <Input
                value={formData.form_name}
                onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                placeholder="e.g., Client Intake Form"
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Form Type</Label>
              <Select
                value={formData.form_type}
                onValueChange={(value) => setFormData({ ...formData, form_type: value })}
              >
                <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intake">Intake</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="treatment_plan">Treatment Plan</SelectItem>
                  <SelectItem value="progress_note">Progress Note</SelectItem>
                  <SelectItem value="discharge">Discharge</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                rows={3}
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Version</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
            {editingForm && (
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Document</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !editingForm) return;
                      setUploadingFile(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const response = await apiRequest("POST", `/api/program-management/forms/${editingForm.id}/upload`, formData, {
                          'Content-Type': 'multipart/form-data'
                        });
                        const result = await response.json();
                        if (result.success) {
                          refetch();
                          toast({ title: "File uploaded successfully", variant: "default" });
                        }
                      } catch (error: any) {
                        toast({ title: "Failed to upload file", description: error.message, variant: "destructive" });
                      } finally {
                        setUploadingFile(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="card-neu-flat hover:card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    {uploadingFile ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1" />
                        Upload Document
                      </>
                    )}
                  </Button>
                  {editingForm.document_url && (
                    <a
                      href={editingForm.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      style={{ color: '#a5c8ca', opacity: 0.8 }}
                    >
                      View Current
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingForm(null);
                setFormData({
                  form_name: '',
                  form_type: '',
                  description: '',
                  version: '1.0',
                  is_active: true
                });
              }}
              className="card-neu-flat hover:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
              style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
                  <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                    {editingForm ? 'Updating...' : 'Adding...'}
                  </span>
                </>
              ) : (
                <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                  {editingForm ? 'Update' : 'Add'} Form
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tasks Tab Component
function TasksTab({ program }: { program: Program }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    task_type: '',
    assigned_to: '',
    due_date: ''
  });

  // Fetch tasks
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/program-management/tasks/program", program.id, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await apiRequest("GET", `/api/program-management/tasks/program/${program.id}?${params.toString()}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin' || user?.role === 'program_user'),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert "unassigned" back to empty string or null for the API
      const apiData = {
        ...data,
        program_id: program.id,
        corporate_client_id: program.corporate_client_id,
        assigned_to: data.assigned_to === 'unassigned' ? null : (data.assigned_to || null)
      };
      const response = await apiRequest("POST", "/api/program-management/tasks", apiData);
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        task_type: '',
        assigned_to: 'unassigned',
        due_date: ''
      });
      toast({ title: "Task created successfully", variant: "default" });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Convert "unassigned" back to null for the API
      const apiData = {
        ...data,
        assigned_to: data.assigned_to === 'unassigned' ? null : (data.assigned_to || null)
      };
      const response = await apiRequest("PATCH", `/api/program-management/tasks/${id}`, apiData);
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        task_type: '',
        assigned_to: 'unassigned',
        due_date: ''
      });
      toast({ title: "Task updated successfully", variant: "default" });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/program-management/tasks/${id}`);
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Task deleted successfully", variant: "default" });
    }
  });

  // Fetch staff for assignment
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/users/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id,
  });

  const handleSave = () => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredTasks = tasks.filter((task: any) =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>PROGRAM TASKS</h3>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Program-specific tasks and assignments
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
        >
          <Plus className="h-4 w-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Add Task</span>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 card-neu-pressed"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No tasks for this program</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent>
            <div className="rounded-lg overflow-hidden card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
                    <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Task</TableHead>
                    <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Assigned To</TableHead>
                    <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Priority</TableHead>
                    <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Due Date</TableHead>
                    <TableHead style={{ color: '#a5c8ca', opacity: 0.8 }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task: any) => (
                    <TableRow key={task.id} style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
                      <TableCell style={{ color: '#a5c8ca' }}>{task.title}</TableCell>
                      <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                        {task.assigned_to_user?.first_name && task.assigned_to_user?.last_name
                          ? `${task.assigned_to_user.first_name} ${task.assigned_to_user.last_name}`
                          : task.assigned_to_user?.user_name || 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: '#a5c8ca', opacity: 0.8 }}>
                        {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTask(task);
                              setFormData({
                                title: task.title || '',
                                description: task.description || '',
                                status: task.status || 'pending',
                                priority: task.priority || 'medium',
                                task_type: task.task_type || '',
                                assigned_to: task.assigned_to || 'unassigned',
                                due_date: task.due_date ? format(parseISO(task.due_date), 'yyyy-MM-dd') : ''
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
                              if (confirm('Are you sure you want to delete this task?')) {
                                deleteMutation.mutate(task.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="card-neu-flat hover:card-neu-pressed"
                            style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <DialogTitle style={{ color: '#a5c8ca' }}>
              {editingTask ? 'EDIT TASK' : 'ADD TASK'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Assign To</Label>
              <Select value={formData.assigned_to || 'unassigned'} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((member: any) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.user_name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingTask(null);
                setFormData({
                  title: '',
                  description: '',
                  status: 'pending',
                  priority: 'medium',
                  task_type: '',
                  assigned_to: 'unassigned',
                  due_date: ''
                });
              }}
              className="card-neu-flat hover:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending || !formData.title}
              className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
              style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
                  <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                    {editingTask ? 'Updating...' : 'Adding...'}
                  </span>
                </>
              ) : (
                <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                  {editingTask ? 'Update' : 'Add'} Task
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Curriculum Tab Component
function CurriculumTab({ program }: { program: Program }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    document_url: '',
    version: '1.0'
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch curriculum
  const { data: curriculum = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/program-management/curriculum/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/program-management/curriculum/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin' || user?.role === 'program_user'),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/program-management/curriculum", {
        ...data,
        program_id: program.id,
        corporate_client_id: program.corporate_client_id
      });
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        title: '',
        category: '',
        description: '',
        document_url: '',
        version: '1.0'
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/program-management/curriculum/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        title: '',
        category: '',
        description: '',
        document_url: '',
        version: '1.0'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/program-management/curriculum/${id}`);
    },
    onSuccess: () => {
      refetch();
    }
  });

  const handleSave = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>CURRICULUM & SYLLABUS</h3>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Reference materials and curriculum documentation
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
        >
          <Plus className="h-4 w-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Add Item</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
        </div>
      ) : curriculum.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No curriculum items for this program</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {curriculum.map((item) => (
            <Card key={item.id} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardTitle style={{ color: '#a5c8ca' }}>{item.title}</CardTitle>
                <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
                  {item.category} • Version {item.version}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.description && (
                  <p style={{ color: '#a5c8ca', opacity: 0.8 }}>{item.description}</p>
                )}
                {item.document_url && (
                  <div className="mb-2">
                    <a
                      href={item.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      style={{ color: '#a5c8ca', opacity: 0.8 }}
                    >
                      View Document
                    </a>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {item.document_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(item.document_url, '_blank')}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="card-neu-flat"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca', opacity: 0.5 }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      No Document
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem(item);
                      setFormData(item);
                      setIsDialogOpen(true);
                    }}
                    className="card-neu-flat hover:card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this curriculum item?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <DialogTitle style={{ color: '#a5c8ca' }}>
              {editingItem ? 'EDIT CURRICULUM ITEM' : 'ADD CURRICULUM ITEM'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                placeholder="e.g., Treatment Protocol Manual"
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="treatment">Treatment Protocol</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="training">Training Material</SelectItem>
                  <SelectItem value="policy">Policy & Procedure</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                rows={3}
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Version</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
            {editingItem && (
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Document</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !editingItem) return;
                      setUploadingFile(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const response = await apiRequest("POST", `/api/program-management/curriculum/${editingItem.id}/upload`, formData, {
                          'Content-Type': 'multipart/form-data'
                        });
                        const result = await response.json();
                        if (result.success) {
                          refetch();
                          toast({ title: "File uploaded successfully", variant: "default" });
                        }
                      } catch (error: any) {
                        toast({ title: "Failed to upload file", description: error.message, variant: "destructive" });
                      } finally {
                        setUploadingFile(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="card-neu-flat hover:card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    {uploadingFile ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1" />
                        Upload Document
                      </>
                    )}
                  </Button>
                  {editingItem.document_url && (
                    <a
                      href={editingItem.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      style={{ color: '#a5c8ca', opacity: 0.8 }}
                    >
                      View Current
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingItem(null);
                setFormData({
                  title: '',
                  category: '',
                  description: '',
                  document_url: '',
                  version: '1.0'
                });
              }}
              className="card-neu-flat hover:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
              style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
                  <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                    {editingItem ? 'Updating...' : 'Adding...'}
                  </span>
                </>
              ) : (
                <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                  {editingItem ? 'Update' : 'Add'} Item
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Onboarding Tab Component
function OnboardingTab({ program }: { program: Program }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    item_type: '',
    title: '',
    description: '',
    document_url: '',
    is_required: true,
    target_audience: 'both' // staff, client, both
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch onboarding items
  const { data: onboardingItems = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/program-management/onboarding/program", program.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/program-management/onboarding/program/${program.id}`);
      return await response.json();
    },
    enabled: !!program.id && (user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin' || user?.role === 'program_user'),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/program-management/onboarding", {
        ...data,
        program_id: program.id,
        corporate_client_id: program.corporate_client_id
      });
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        item_type: '',
        title: '',
        description: '',
        document_url: '',
        is_required: true,
        target_audience: 'both'
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/program-management/onboarding/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        item_type: '',
        title: '',
        description: '',
        document_url: '',
        is_required: true,
        target_audience: 'both'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/program-management/onboarding/${id}`);
    },
    onSuccess: () => {
      refetch();
    }
  });

  const handleSave = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>STAFF & CLIENT ONBOARDING</h3>
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
            Onboarding workflows and client rights documentation
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
          style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
        >
          <Plus className="h-4 w-4 mr-2" style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }} />
          <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>Add Item</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
        </div>
      ) : onboardingItems.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <UserPlus className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No onboarding items for this program</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {onboardingItems.map((item) => (
            <Card key={item.id} className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle style={{ color: '#a5c8ca' }}>{item.title}</CardTitle>
                    <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      {item.item_type} • {item.target_audience === 'both' ? 'Staff & Clients' : item.target_audience === 'staff' ? 'Staff Only' : 'Clients Only'}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={item.is_required ? "default" : "secondary"}
                    className="card-neu-flat"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    {item.is_required ? "Required" : "Optional"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.description && (
                  <p style={{ color: '#a5c8ca', opacity: 0.8 }}>{item.description}</p>
                )}
                {item.document_url && (
                  <div className="mb-2">
                    <a
                      href={item.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      style={{ color: '#a5c8ca', opacity: 0.8 }}
                    >
                      View Document
                    </a>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {item.document_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(item.document_url, '_blank')}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="card-neu-flat"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca', opacity: 0.5 }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      No Document
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem(item);
                      setFormData(item);
                      setIsDialogOpen(true);
                    }}
                    className="card-neu-flat hover:card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this onboarding item?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="card-neu-flat hover:card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <DialogTitle style={{ color: '#a5c8ca' }}>
              {editingItem ? 'EDIT ONBOARDING ITEM' : 'ADD ONBOARDING ITEM'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Item Type</Label>
              <Select
                value={formData.item_type}
                onValueChange={(value) => setFormData({ ...formData, item_type: value })}
              >
                <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="training">Training Material</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                placeholder="e.g., Client Rights Handbook"
              />
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Target Audience</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
              >
                <SelectTrigger className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Staff & Clients</SelectItem>
                  <SelectItem value="staff">Staff Only</SelectItem>
                  <SelectItem value="client">Clients Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)' }}
              />
              <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Required for onboarding</Label>
            </div>
            {editingItem && (
              <div>
                <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Document</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !editingItem) return;
                      setUploadingFile(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const response = await apiRequest("POST", `/api/program-management/onboarding/${editingItem.id}/upload`, formData, {
                          'Content-Type': 'multipart/form-data'
                        });
                        const result = await response.json();
                        if (result.success) {
                          refetch();
                          toast({ title: "File uploaded successfully", variant: "default" });
                        }
                      } catch (error: any) {
                        toast({ title: "Failed to upload file", description: error.message, variant: "destructive" });
                      } finally {
                        setUploadingFile(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="card-neu-flat hover:card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    {uploadingFile ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1" />
                        Upload Document
                      </>
                    )}
                  </Button>
                  {editingItem.document_url && (
                    <a
                      href={editingItem.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      style={{ color: '#a5c8ca', opacity: 0.8 }}
                    >
                      View Current
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingItem(null);
                setFormData({
                  item_type: '',
                  title: '',
                  description: '',
                  document_url: '',
                  is_required: true,
                  target_audience: 'both'
                });
              }}
              className="card-neu-flat hover:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="card-neu hover:card-neu [&]:shadow-none btn-text-glow"
              style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
            >
              <span style={{ color: '#a5c8ca', textShadow: '0 0 8px rgba(165, 200, 202, 0.4), 0 0 12px rgba(165, 200, 202, 0.2)' }}>
                {editingItem ? 'Update' : 'Add'} Item
              </span>
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
