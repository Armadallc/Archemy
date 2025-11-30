import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  Building2, 
  Users, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Save,
  RefreshCw,
  Info,
  User,
  Contact
} from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useHierarchy } from "../hooks/useHierarchy";
import { useAuth } from "../hooks/useAuth";
import { LogoUpload } from "../components/LogoUpload";
import { MainLogoUpload } from "../components/MainLogoUpload";
import { AvatarUpload } from "../components/AvatarUpload";

interface CorporateClientSettings {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  logoUrl?: string | null;
  isActive: boolean;
}

interface ProgramSettings {
  id: string;
  name: string;
  description?: string;
  address?: string;
  corporate_client_id: string;
  isActive: boolean;
}

interface SystemSettings {
  id: string;
  app_name: string;
  main_logo_url?: string | null;
  support_email: string;
  support_phone: string;
  timezone: string;
  language: string;
}

interface ContactUser {
  id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
}

// Define which tabs are visible for each role
function getVisibleTabs(userRole?: string) {
  const allTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'corporate-client', label: 'Corporate Client', icon: Building2 },
    { id: 'program', label: 'Program', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'contacts', label: 'Contacts', icon: Contact },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database }
  ];

  switch (userRole) {
    case 'driver':
      // Drivers only see Profile, Contacts, and Notifications
      return allTabs.filter(tab => ['profile', 'contacts', 'notifications'].includes(tab.id));
    
    case 'program_user':
      // Program users see Profile, Contacts, and Notifications 
      return allTabs.filter(tab => ['profile', 'contacts', 'notifications'].includes(tab.id));
    
    case 'program_admin':
      // Program admins see everything except System
      return allTabs.filter(tab => tab.id !== 'system');
    
    case 'corporate_admin':
      // Corporate admins see everything except System
      return allTabs.filter(tab => tab.id !== 'system');
    
    case 'super_admin':
      // Super admins see all tabs
      return allTabs;
    
    default:
      // Default to basic tabs for unknown roles
      return allTabs.filter(tab => ['profile', 'contacts', 'notifications'].includes(tab.id));
  }
}

export default function Settings() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, getFilterParams, getPageTitle } = useHierarchy();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Corporate client settings - sync with current corporate client
  const [corporateClientSettings, setCorporateClientSettings] = useState<CorporateClientSettings>({
    id: selectedCorporateClient || "",
    name: selectedCorporateClient || "",
    address: "",
    email: "",
    phone: "",
    logoUrl: null,
    isActive: true,
  });

  // Program settings - sync with current program
  const [programSettings, setProgramSettings] = useState<ProgramSettings>({
    id: selectedProgram || "",
    name: selectedProgram || "",
    description: "",
    address: "",
    corporate_client_id: selectedCorporateClient || "",
    isActive: true,
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    id: 'system',
    app_name: 'HALCYON Transportation Management',
    main_logo_url: null,
    support_email: 'support@halcyon.com',
    support_phone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
    language: 'en',
  });

  // Fetch system settings
  const { data: fetchedSystemSettings, isLoading: systemSettingsLoading } = useQuery({
    queryKey: ['/api/system-settings'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/system-settings");
      return await response.json();
    },
    enabled: user?.role === 'super_admin',
  });

  // Update system settings form when data is fetched
  useEffect(() => {
    if (fetchedSystemSettings) {
      setSystemSettings({
        id: fetchedSystemSettings.id || 'system',
        app_name: fetchedSystemSettings.app_name || 'HALCYON Transportation Management',
        main_logo_url: fetchedSystemSettings.main_logo_url || null,
        support_email: fetchedSystemSettings.support_email || 'support@halcyon.com',
        support_phone: fetchedSystemSettings.support_phone || '+1 (555) 123-4567',
        timezone: fetchedSystemSettings.timezone || 'America/New_York',
        language: fetchedSystemSettings.language || 'en',
      });
    }
  }, [fetchedSystemSettings]);

  // Fetch fresh corporate client data when switching
  const { data: freshCorporateClientData } = useQuery({
    queryKey: ["/api/corporate-clients", selectedCorporateClient],
    queryFn: async () => {
      if (!selectedCorporateClient) return null;
      console.log('🔍 Fetching fresh corporate client data for settings:', selectedCorporateClient);
      const response = await apiRequest("GET", `/api/corporate-clients/${selectedCorporateClient}`);
      const data = await response.json();
      console.log('📊 Fresh corporate client data:', data);
      return data;
    },
    enabled: !!selectedCorporateClient,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch fresh program data when switching
  const { data: freshProgramData } = useQuery({
    queryKey: ["/api/programs", selectedProgram],
    queryFn: async () => {
      if (!selectedProgram) return null;
      console.log('🔍 Fetching fresh program data for settings:', selectedProgram);
      const response = await apiRequest("GET", `/api/programs/${selectedProgram}`);
      const data = await response.json();
      console.log('📊 Fresh program data:', data);
      return data;
    },
    enabled: !!selectedProgram,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch contacts for the current hierarchy level
  const { data: contacts = [] } = useQuery<ContactUser[]>({
    queryKey: ["/api/contacts", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/contacts";
      
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/contacts/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/contacts/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      return data;
    },
    enabled: true,
  });

  // Get visible tabs based on user role
  const visibleTabs = getVisibleTabs(user?.role);

  // Update form when data changes
  useEffect(() => {
    const corporateClientData = freshCorporateClientData;
    if (corporateClientData) {
      console.log('🔄 Updating corporate client settings form with data:', corporateClientData);
      setCorporateClientSettings({
        id: corporateClientData.id || "",
        name: corporateClientData.name || "",
        address: corporateClientData.address || "",
        email: corporateClientData.email || "",
        phone: corporateClientData.phone || "",
        logoUrl: corporateClientData.logo_url || null,
        isActive: corporateClientData.isActive !== false,
      });
    }
  }, [freshCorporateClientData, selectedCorporateClient]);

  useEffect(() => {
    const programData = freshProgramData;
    if (programData) {
      console.log('🔄 Updating program settings form with data:', programData);
      setProgramSettings({
        id: programData.id || "",
        name: programData.name || "",
        description: programData.description || "",
        address: programData.address || "",
        corporate_client_id: programData.corporate_client_id || selectedCorporateClient || "",
        isActive: programData.isActive !== false,
      });
    }
  }, [freshProgramData, selectedProgram, selectedCorporateClient]);

  // Save corporate client settings
  const saveCorporateClientMutation = useMutation({
    mutationFn: async (settings: CorporateClientSettings) => {
      const response = await apiRequest("PUT", `/api/corporate-clients/${settings.id}`, settings);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Corporate Client Settings Saved",
        description: "Corporate client settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-clients"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save corporate client settings.",
        variant: "destructive",
      });
    },
  });

  // Save program settings
  const saveProgramMutation = useMutation({
    mutationFn: async (settings: ProgramSettings) => {
      const response = await apiRequest("PUT", `/api/programs/${settings.id}`, settings);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Program Settings Saved",
        description: "Program settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save program settings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveCorporateClient = () => {
    saveCorporateClientMutation.mutate(corporateClientSettings);
  };

  const handleSaveProgram = () => {
    saveProgramMutation.mutate(programSettings);
  };

  // Save system settings mutation
  const saveSystemMutation = useMutation({
    mutationFn: async (settings: SystemSettings) => {
      const response = await apiRequest("PUT", "/api/system-settings", settings);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "System Settings Saved",
        description: "System settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save system settings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSystem = () => {
    saveSystemMutation.mutate(systemSettings);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="uppercase"
            style={{
              fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
              fontWeight: 600,
              fontSize: '68px',
              lineHeight: 1.15,
              letterSpacing: '-0.015em',
              textTransform: 'uppercase',
              color: 'var(--foreground)',
            }}
          >
            SETTINGS
          </h1>
          <p className="text-gray-600">
            Manage your {getPageTitle()} settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {level?.toUpperCase() || 'CORPORATE'} Level
          </Badge>
          {selectedCorporateClient && (
            <Badge variant="secondary">
              {selectedCorporateClient}
            </Badge>
          )}
          {selectedProgram && (
            <Badge variant="secondary">
              {selectedProgram}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal profile information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <AvatarUpload 
                  userId={user?.user_id || ''} 
                  onAvatarUpdate={() => {}} 
                />
                <div>
                  <h3 className="text-lg font-medium">{user?.user_name || 'User'}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {user?.role?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="user-name">User Name</Label>
                  <Input
                    id="user-name"
                    value={user?.user_name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-id">User ID</Label>
                  <Input
                    id="user-id"
                    value={user?.user_id || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user?.role?.replace('_', ' ').toUpperCase() || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corporate-client" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Client Information</CardTitle>
              <CardDescription>
                Manage your corporate client's basic information and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <LogoUpload 
                  organizationId={corporateClientSettings.id} 
                  onLogoUpdate={() => {}} 
                  type="corporate-client"
                />
                <div>
                  <h3 className="text-lg font-medium">Corporate Client</h3>
                  <p className="text-gray-600">
                    {selectedCorporateClient || 'No corporate client selected'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="corp-name">Corporate Client Name</Label>
                  <Input
                    id="corp-name"
                    value={corporateClientSettings.name}
                    onChange={(e) => setCorporateClientSettings({...corporateClientSettings, name: e.target.value})}
                    placeholder="Enter corporate client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="corp-email">Email</Label>
                  <Input
                    id="corp-email"
                    type="email"
                    value={corporateClientSettings.email || ''}
                    onChange={(e) => setCorporateClientSettings({...corporateClientSettings, email: e.target.value})}
                    placeholder="contact@corporateclient.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="corp-phone">Phone</Label>
                  <Input
                    id="corp-phone"
                    value={corporateClientSettings.phone || ''}
                    onChange={(e) => setCorporateClientSettings({...corporateClientSettings, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="corp-address">Address</Label>
                  <Textarea
                    id="corp-address"
                    value={corporateClientSettings.address || ''}
                    onChange={(e) => setCorporateClientSettings({...corporateClientSettings, address: e.target.value})}
                    placeholder="Enter corporate client address"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="corp-active"
                  checked={corporateClientSettings.isActive}
                  onCheckedChange={(checked) => setCorporateClientSettings({...corporateClientSettings, isActive: checked})}
                />
                <Label htmlFor="corp-active">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSaveCorporateClient}
                  disabled={saveCorporateClientMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Corporate Client Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="program" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Information</CardTitle>
              <CardDescription>
                Manage your program's basic information and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <LogoUpload 
                  organizationId={programSettings.id} 
                  onLogoUpdate={() => {}} 
                  type="program"
                />
                <div>
                  <h3 className="text-lg font-medium">Program</h3>
                  <p className="text-gray-600">
                    {selectedProgram || 'No program selected'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prog-name">Program Name</Label>
                  <Input
                    id="prog-name"
                    value={programSettings.name}
                    onChange={(e) => setProgramSettings({...programSettings, name: e.target.value})}
                    placeholder="Enter program name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prog-description">Description</Label>
                  <Input
                    id="prog-description"
                    value={programSettings.description || ''}
                    onChange={(e) => setProgramSettings({...programSettings, description: e.target.value})}
                    placeholder="Enter program description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prog-address">Address</Label>
                  <Textarea
                    id="prog-address"
                    value={programSettings.address || ''}
                    onChange={(e) => setProgramSettings({...programSettings, address: e.target.value})}
                    placeholder="Enter program address"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prog-corporate-client">Corporate Client</Label>
                  <Input
                    id="prog-corporate-client"
                    value={programSettings.corporate_client_id}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="prog-active"
                  checked={programSettings.isActive}
                  onCheckedChange={(checked) => setProgramSettings({...programSettings, isActive: checked})}
                />
                <Label htmlFor="prog-active">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSaveProgram}
                  disabled={saveProgramMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Program Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions for your {level} level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  User management is handled through the Users page. Use the navigation menu to access user management features.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contacts Directory</CardTitle>
              <CardDescription>
                Directory of all users in your {level} with their contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contacts.length > 0 ? (
                  <div className="grid gap-4">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{contact.first_name} {contact.last_name}</h3>
                          <p className="text-sm text-gray-600">{contact.email}</p>
                          {contact.phone && (
                            <p className="text-sm text-gray-600">{contact.phone}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={contact.is_active ? "default" : "secondary"}>
                            {contact.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {contact.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No contacts found for the current {level} level.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you receive notifications and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Trip Updates</h3>
                    <p className="text-sm text-gray-600">Get notified about trip status changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Driver Assignments</h3>
                    <p className="text-sm text-gray-600">Get notified when drivers are assigned</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">System Alerts</h3>
                    <p className="text-sm text-gray-600">Receive important system notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveSystem}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <MainLogoUpload onLogoUpdate={() => {}} />
                <div>
                  <h3 className="text-lg font-medium">System Logo</h3>
                  <p className="text-gray-600">Upload the main system logo</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input
                    id="app-name"
                    value={systemSettings.app_name}
                    onChange={(e) => setSystemSettings({...systemSettings, app_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={systemSettings.support_email}
                    onChange={(e) => setSystemSettings({...systemSettings, support_email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-phone">Support Phone</Label>
                  <Input
                    id="support-phone"
                    value={systemSettings.support_phone}
                    onChange={(e) => setSystemSettings({...systemSettings, support_phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={systemSettings.timezone}
                    onValueChange={(value) => setSystemSettings({...systemSettings, timezone: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={systemSettings.language}
                    onValueChange={(value) => setSystemSettings({...systemSettings, language: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {systemSettingsLoading ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSystem}
                    disabled={saveSystemMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveSystemMutation.isPending ? 'Saving...' : 'Save System Settings'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}