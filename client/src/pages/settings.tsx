import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PhoneInput } from "../components/ui/phone-input";
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
  Contact,
  Store
} from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useHierarchy } from "../hooks/useHierarchy";
import { useAuth } from "../hooks/useAuth";
import { LogoUpload } from "../components/LogoUpload";
import { MainLogoUpload } from "../components/MainLogoUpload";
import CorporateClientCards from "../components/settings/CorporateClientCards";
import UsersManagement from "../components/settings/UsersManagement";
import TenantRolesManagement from "../components/settings/TenantRolesManagement";
import ProgramCreationForm from "../components/settings/ProgramCreationForm";
import FeatureFlagsTab from "../components/settings/FeatureFlagsTab";
import { ThemeSelector } from "../components/ThemeSelector";
import { ThemePicker } from "../components/design-system/ThemePicker";
import { IntegratedThemeEditor } from "../components/design-system/IntegratedThemeEditor";
import { Flag, Palette } from "lucide-react";
import { UserAvatar } from "../components/users/UserAvatar";
import ContactsTab from "../components/settings/ContactsTab";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";
import { RollbackManager } from "../utils/rollback-manager";

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

// ContactUser interface moved to ContactsTab component

// Define which tabs are visible for each role
function getVisibleTabs(userRole?: string) {
  const allTabs = [
    { id: 'corporate-client', label: 'Corporate Client', icon: Building2 },
    { id: 'program', label: 'Program', icon: Building2 },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'tenant-roles', label: 'Tenant Roles', icon: Shield },
    { id: 'feature-flags', label: 'Feature Flags', icon: Flag },
    { id: 'contacts', label: 'Contacts', icon: Contact },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'theme-management', label: 'Theme Management', icon: Palette },
    { id: 'system', label: 'System', icon: Database }
  ];

  switch (userRole) {
    case 'driver':
      // Drivers only see Contacts and Notifications
      return allTabs.filter(tab => ['contacts', 'notifications'].includes(tab.id));
    
    case 'program_user':
      // Program users see Contacts and Notifications 
      return allTabs.filter(tab => ['contacts', 'notifications'].includes(tab.id));
    
    case 'program_admin':
      // Program admins see everything except System
      return allTabs.filter(tab => tab.id !== 'system');
    
    case 'corporate_admin':
      // Corporate admins see everything except System
      return allTabs.filter(tab => tab.id !== 'system');
    
    case 'super_admin':
      // Super admins see all tabs including Feature Flags and Theme Management
      return allTabs;
    
    default:
      // Default to basic tabs for unknown roles
      return allTabs.filter(tab => ['contacts', 'notifications'].includes(tab.id));
  }
}

export default function Settings() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, getFilterParams, getPageTitle } = useHierarchy();
  const { toast } = useToast();
  
  // Get visible tabs and set default active tab to first available
  const visibleTabs = getVisibleTabs(user?.role);
  
  // Check for tab query parameter in URL
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && visibleTabs.find(tab => tab.id === tabParam)) {
      return tabParam;
    }
    return visibleTabs[0]?.id || "corporate-client";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
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

  // Contacts are now handled by ContactsTab component

  // Update active tab if current tab is not visible
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  // Sync URL query parameter with active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentTab = urlParams.get('tab');
    if (currentTab !== activeTab) {
      urlParams.set('tab', activeTab);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [activeTab]);

  // Listen for URL changes (e.g., browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && visibleTabs.find(tab => tab.id === tabParam)) {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [visibleTabs]);

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

  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header - Only show if unified header is disabled (fallback) */}
      {!ENABLE_UNIFIED_HEADER && (
        <div>
          <div className="px-6 py-6 rounded-lg border backdrop-blur-md shadow-xl flex items-center justify-between mb-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', height: '150px' }}>
            <div>
              <h1 
                className="font-bold text-foreground" 
                style={{ 
                  fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                  fontSize: '110px'
                }}
              >
                settings.
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
                <HeaderScopeSelector />
              )}
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
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-10 h-auto p-1 gap-1">
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center justify-center space-x-1.5 px-2 py-2 text-xs sm:text-sm flex-1 min-w-0">
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate text-center">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="corporate-client" className="space-y-6">
          {user?.role === 'super_admin' ? (
            <CorporateClientCards />
          ) : (
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
                  <PhoneInput
                    id="corp-phone"
                    value={corporateClientSettings.phone || ''}
                    onChange={(value) => setCorporateClientSettings({...corporateClientSettings, phone: value})}
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
          )}
        </TabsContent>

        <TabsContent value="program" className="space-y-6">
          <ProgramCreationForm />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>
                Manage vendors and supplier information for your {level} level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Vendor management functionality is coming soon. This section will allow you to manage vendor information, contracts, and relationships.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {(user?.role === 'super_admin' || user?.role === 'corporate_admin' || user?.role === 'program_admin') ? (
            <UsersManagement />
          ) : (
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
                    User management is only available to Super Admins, Corporate Admins, and Program Admins. If you need user management access, please contact your administrator.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tenant-roles" className="space-y-6">
          {(user?.role === 'super_admin' || user?.role === 'corporate_admin') ? (
            <TenantRolesManagement />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tenant Roles</CardTitle>
                <CardDescription>
                  Create and manage custom roles for your corporate client.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Tenant role management is only available to Super Admins and Corporate Admins. If you need access, please contact your administrator.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <ContactsTab />
        </TabsContent>

        <TabsContent value="feature-flags" className="space-y-6">
          {user?.role === 'super_admin' ? (
            <FeatureFlagsTab />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                  Feature flags are only available to Super Admins.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Theme Selection - Available to all users */}
          <ThemePicker maxThemes={4} />
          
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

        <TabsContent value="theme-management" className="space-y-6">
          {user?.role === 'super_admin' ? (
            <Card>
              <CardHeader>
                <CardTitle>Theme Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage themes for the application. Super Admins can edit themes, other users can only select from available themes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IntegratedThemeEditor />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Theme Selection</CardTitle>
                <CardDescription>
                  Select a theme for your interface. Only Super Admins can create and edit themes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemePicker />
              </CardContent>
            </Card>
          )}
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
                <MainLogoUpload 
                  currentLogoUrl={systemSettings.main_logo_url}
                  onLogoUpdate={(logoUrl) => {
                    // Update local state
                    setSystemSettings({
                      ...systemSettings,
                      main_logo_url: logoUrl,
                    });
                    // Invalidate query to refresh data
                    queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
                  }} 
                />
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
                  <PhoneInput
                    id="support-phone"
                    value={systemSettings.support_phone}
                    onChange={(value) => setSystemSettings({...systemSettings, support_phone: value})}
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