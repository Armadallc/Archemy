import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { 
  Users, 
  UserCircle, 
  Search, 
  Phone, 
  Mail, 
  FileText, 
  Calendar,
  Award,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  Building2,
  MapPin,
  Shield,
  Briefcase
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { apiRequest } from "../../lib/queryClient";
import { HeaderScopeSelector } from "../../components/HeaderScopeSelector";
import { RollbackManager } from "../../utils/rollback-manager";
import { UserAvatar } from "../../components/users/UserAvatar";

interface StaffMember {
  user_id: string;
  user_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  primary_program_id?: string;
  authorized_programs?: string[];
  corporate_client_id?: string;
  tenant_role_id?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  programs?: {
    id: string;
    name: string;
    corporate_clients?: {
      id: string;
      name: string;
    };
  };
  corporate_clients?: {
    id: string;
    name: string;
  };
  tenant_roles?: {
    id: string;
    name: string;
    description?: string;
  };
}

const roleLabels: Record<string, string> = {
  'super_admin': 'Super Admin',
  'corporate_admin': 'Corporate Admin',
  'program_admin': 'Program Admin',
  'program_user': 'Program User',
  'driver': 'Driver'
};

const formatRoleName = (role: string): string => {
  return roleLabels[role] || role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function TeamStaffPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

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

  // Fetch staff/users based on hierarchy level and user role
  const { data: staff = [], isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ["/api/users", level, selectedCorporateClient, selectedProgram, programFilter, roleFilter],
    queryFn: async () => {
      let endpoint = "/api/users";
      
      // If program filter is set, fetch users by program
      if (programFilter !== "all") {
        endpoint = `/api/users/program/${programFilter}`;
      } else if (selectedProgram) {
        endpoint = `/api/users/program/${selectedProgram}`;
      } else if (selectedCorporateClient) {
        endpoint = `/api/users/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      return data;
    },
    enabled: user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin',
  });

  // Fetch detailed staff data when one is selected
  const { data: selectedStaffData, isLoading: staffDetailLoading } = useQuery({
    queryKey: ["/api/users", selectedStaffId],
    queryFn: async () => {
      if (!selectedStaffId) return null;
      const response = await apiRequest("GET", `/api/users/${selectedStaffId}`);
      return await response.json();
    },
    enabled: !!selectedStaffId,
  });

  // Filter staff based on search term and role filter
  const filteredStaff = staff.filter((member: StaffMember) => {
    const matchesSearch = 
      member.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const currentStaff = selectedStaffId 
    ? staff.find((s: StaffMember) => s.user_id === selectedStaffId)
    : null;

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
          <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  // If a staff member is selected, show detailed view
  if (selectedStaffId && currentStaff) {
    return (
      <StaffDetailView
        staff={currentStaff}
        staffData={selectedStaffData}
        isLoading={staffDetailLoading}
        onBack={() => setSelectedStaffId(null)}
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
                staff.
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
            placeholder="Search staff..."
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
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px] card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="corporate_admin">Corporate Admin</SelectItem>
            <SelectItem value="program_admin">Program Admin</SelectItem>
            <SelectItem value="program_user">Program User</SelectItem>
            <SelectItem value="driver">Driver</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4" style={{ color: '#a5c8ca', opacity: 0.5 }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: '#a5c8ca' }}>No Staff Found</h3>
            <p style={{ color: '#a5c8ca', opacity: 0.7 }}>
              {searchTerm ? "No staff members match your search criteria." : "No staff members available."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member: StaffMember) => (
            <Card 
              key={member.user_id} 
              className="card-neu hover:card-neu-pressed transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
              onClick={() => setSelectedStaffId(member.user_id)}
            >
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div className="flex items-center gap-4">
                  <UserAvatar 
                    user={{
                      user_id: member.user_id,
                      user_name: member.user_name,
                      email: member.email,
                      first_name: member.first_name,
                      last_name: member.last_name,
                      avatar_url: member.avatar_url
                    }}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" style={{ color: '#a5c8ca' }}>
                      {member.first_name && member.last_name 
                        ? `${member.first_name} ${member.last_name}`
                        : member.user_name}
                    </CardTitle>
                    <CardDescription className="truncate" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      {member.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline"
                      className="card-neu-flat"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      {formatRoleName(member.role)}
                    </Badge>
                    <Badge 
                      variant={member.is_active ? "default" : "secondary"}
                      className="card-neu-flat"
                      style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {member.programs && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      <Building2 className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                      <span className="truncate">{member.programs.name}</span>
                    </div>
                  )}

                  {member.corporate_clients && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      <Briefcase className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                      <span className="truncate">{member.corporate_clients.name}</span>
                    </div>
                  )}

                  {member.tenant_roles && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                      <Shield className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                      <span className="truncate">Company: {member.tenant_roles.name}</span>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full card-neu-flat hover:card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStaffId(member.user_id);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Staff Detail View Component
function StaffDetailView({
  staff,
  staffData,
  isLoading,
  onBack
}: {
  staff: StaffMember;
  staffData: any;
  isLoading: boolean;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#a5c8ca' }}></div>
          <p className="mt-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>Loading staff details...</p>
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
            Back to Staff
          </Button>
          <UserAvatar 
            user={{
              user_id: staff.user_id,
              user_name: staff.user_name,
              email: staff.email,
              first_name: staff.first_name,
              last_name: staff.last_name,
              avatar_url: staff.avatar_url
            }}
            size="lg"
          />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#a5c8ca' }}>
              {staff.first_name && staff.last_name 
                ? `${staff.first_name} ${staff.last_name}`
                : staff.user_name}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
              {staff.email}
            </p>
          </div>
        </div>
        <Badge 
          variant={staff.is_active ? "default" : "secondary"}
          className="card-neu-flat"
          style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
        >
          {staff.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <TabsTrigger value="overview" style={{ color: '#a5c8ca' }}>
            <FileText className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="roles" style={{ color: '#a5c8ca' }}>
            <Shield className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Roles
          </TabsTrigger>
          <TabsTrigger value="assignments" style={{ color: '#a5c8ca' }}>
            <Building2 className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="activity" style={{ color: '#a5c8ca' }}>
            <Calendar className="h-4 w-4 mr-2" style={{ color: '#a5c8ca' }} />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6" style={{ boxShadow: 'none' }}>
          <OverviewTab staff={staff} staffData={staffData} />
        </TabsContent>

        <TabsContent value="roles" className="mt-6" style={{ boxShadow: 'none' }}>
          <RolesTab staff={staff} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6" style={{ boxShadow: 'none' }}>
          <AssignmentsTab staff={staff} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6" style={{ boxShadow: 'none' }}>
          <PlaceholderTab 
            icon={<Calendar className="h-8 w-8" style={{ color: '#a5c8ca', opacity: 0.5 }} />}
            title="Activity Log"
            description="View staff member activity and login history"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ staff, staffData }: { staff: StaffMember; staffData: any }) {
  return (
    <div className="space-y-6">
      {/* Staff Info Card */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>STAFF INFORMATION</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Username</p>
            <p style={{ color: '#a5c8ca' }}>{staff.user_name}</p>
          </div>

          {staff.first_name && staff.last_name && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Full Name</p>
              <p style={{ color: '#a5c8ca' }}>{staff.first_name} {staff.last_name}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
              <Mail className="h-4 w-4" style={{ color: '#a5c8ca' }} />
              Email
            </p>
            <p style={{ color: '#a5c8ca' }}>{staff.email}</p>
          </div>

          {staff.phone && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <Phone className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Phone
              </p>
              <p style={{ color: '#a5c8ca' }}>{staff.phone}</p>
            </div>
          )}

          {staff.last_login && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>Last Login</p>
              <p style={{ color: '#a5c8ca' }}>
                {new Date(staff.last_login).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Roles Tab Component
function RolesTab({ staff }: { staff: StaffMember }) {
  return (
    <div className="space-y-6">
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>ROLE INFORMATION</CardTitle>
          <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
            App Role vs Company Role distinction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
              <Shield className="h-4 w-4" style={{ color: '#a5c8ca' }} />
              App Role
            </p>
            <Badge 
              variant="outline"
              className="card-neu-flat"
              style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
            >
              {formatRoleName(staff.role)}
            </Badge>
          </div>

          {staff.tenant_roles && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <Briefcase className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Company Role
              </p>
              <Badge 
                variant="outline"
                className="card-neu-flat"
                style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
              >
                {staff.tenant_roles.name}
              </Badge>
              {staff.tenant_roles.description && (
                <p className="text-sm mt-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                  {staff.tenant_roles.description}
                </p>
              )}
            </div>
          )}

          {!staff.tenant_roles && (
            <div className="text-center py-8">
              <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No company role assigned</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Assignments Tab Component
function AssignmentsTab({ staff }: { staff: StaffMember }) {
  return (
    <div className="space-y-6">
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>PROGRAM & LOCATION ASSIGNMENTS</CardTitle>
          <CardDescription style={{ color: '#a5c8ca', opacity: 0.7 }}>
            View staff member's program and location assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {staff.programs && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <Building2 className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Primary Program
              </p>
              <p style={{ color: '#a5c8ca' }}>{staff.programs.name}</p>
              {staff.programs.corporate_clients && (
                <p className="text-sm mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                  {staff.programs.corporate_clients.name}
                </p>
              )}
            </div>
          )}

          {staff.corporate_clients && (
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                <Briefcase className="h-4 w-4" style={{ color: '#a5c8ca' }} />
                Corporate Client
              </p>
              <p style={{ color: '#a5c8ca' }}>{staff.corporate_clients.name}</p>
            </div>
          )}

          {staff.authorized_programs && staff.authorized_programs.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                Authorized Programs
              </p>
              <div className="space-y-2">
                {staff.authorized_programs.map((programId: string) => (
                  <Badge 
                    key={programId}
                    variant="outline"
                    className="card-neu-flat mr-2"
                    style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}
                  >
                    {programId}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(!staff.programs && !staff.corporate_clients) && (
            <div className="text-center py-8">
              <p style={{ color: '#a5c8ca', opacity: 0.7 }}>No assignments found</p>
            </div>
          )}
        </CardContent>
      </Card>
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
