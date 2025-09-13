import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { LogoUpload } from "@/components/LogoUpload";
import { MainLogoUpload } from "@/components/MainLogoUpload";
import { AvatarUpload } from "@/components/AvatarUpload";

interface OrganizationSettings {
  id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  logoUrl?: string | null;
  isActive: boolean;
}

interface SystemSettings {
  id: string;
  app_name: string;
  main_logo_url?: string | null;
}

interface ContactUser {
  user_id: string;
  user_name: string;
  email: string;
  phone_number?: string;
  role: string;
  avatar_url?: string;
}

interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  dashboard: {
    showUpcomingTrips: boolean;
    showDriverStatus: boolean;
    refreshInterval: number;
  };
  timezone: string;
  language: string;
}

// Define which tabs are visible for each role
function getVisibleTabs(userRole?: string) {
  const allTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'contacts', label: 'Contacts', icon: Contact },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database }
  ];

  switch (userRole) {
    case 'driver':
      // Drivers only see Profile, Contacts, and Notifications
      return allTabs.filter(tab => ['profile', 'contacts', 'notifications'].includes(tab.id));
    
    case 'organization_user':
      // Regular users see Profile, Contacts, and Notifications 
      return allTabs.filter(tab => ['profile', 'contacts', 'notifications'].includes(tab.id));
    
    case 'organization_admin':
      // Org admins see everything except System
      return allTabs.filter(tab => tab.id !== 'system');
    
    case 'monarch_owner':
    case 'super_admin':
      // Super admins and owners see all tabs
      return allTabs;
    
    default:
      // Default to basic tabs for unknown roles
      return allTabs.filter(tab => ['profile', 'contacts', 'notifications'].includes(tab.id));
  }
}

export default function Settings() {
  const { user } = useAuth();
  const { currentOrganization, setCurrentOrganization } = useOrganization();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Organization settings - sync with current organization
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    id: currentOrganization?.id || "",
    name: currentOrganization?.name || "",
    address: currentOrganization?.address || "",
    email: currentOrganization?.email || "",
    phone: currentOrganization?.phone || "",
    logoUrl: (currentOrganization as any)?.logo_url || null,
    isActive: currentOrganization?.isActive || true,
  });

  // Fetch fresh organization data when switching
  const { data: freshOrgData } = useQuery({
    queryKey: ["/api/organizations", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;
      console.log('🔍 Fetching fresh org data for settings:', currentOrganization.id);
      const response = await apiRequest("GET", `/api/organizations/${currentOrganization.id}`);
      const data = await response.json();
      console.log('📊 Fresh org data:', data);
      return data;
    },
    enabled: !!currentOrganization?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch contacts for the current organization
  const { data: contacts = [] } = useQuery<ContactUser[]>({
    queryKey: ["/api/contacts", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const response = await apiRequest("GET", `/api/contacts/${currentOrganization.id}`);
      const data = await response.json();
      return data;
    },
    enabled: !!currentOrganization?.id,
  });

  // Get visible tabs based on user role
  const visibleTabs = getVisibleTabs(user?.role);

  // Update form when organization data changes
  useEffect(() => {
    const orgData = freshOrgData || currentOrganization;
    if (orgData) {
      console.log('🔄 Updating settings form with organization data:', orgData);
      
      setOrgSettings({
        id: orgData.id,
        name: orgData.name,
        address: orgData.address || "",
        email: orgData.email || "",
        phone: orgData.phone || "",
        logoUrl: orgData.logo_url || null,
        isActive: orgData.is_active !== undefined ? orgData.is_active : orgData.isActive,
      });
    }
  }, [freshOrgData, currentOrganization?.id]); // React to fresh data and org changes
  
  // Force refresh when switching organizations  
  useEffect(() => {
    if (currentOrganization?.id) {
      console.log('🔄 Organization changed, forcing cache clear for:', currentOrganization.id);
      queryClient.removeQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", currentOrganization.id] });
    }
  }, [currentOrganization?.id, queryClient]);

  // System settings state (super admin only)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    id: 'app_settings',
    app_name: 'Amish Limo Service',
    main_logo_url: null,
  });

  // Fetch system settings (super admin only)
  const { data: systemSettingsData } = useQuery({
    queryKey: ["/api/system/settings"],
    enabled: user?.role === 'super_admin',
    staleTime: 0,
    refetchOnMount: true,
  });

  // Update system settings state when data loads
  useEffect(() => {
    if (systemSettingsData) {
      setSystemSettings(systemSettingsData as SystemSettings);
    }
  }, [systemSettingsData]);

  // User preferences
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    dashboard: {
      showUpcomingTrips: true,
      showDriverStatus: true,
      refreshInterval: 30,
    },
    timezone: "America/New_York",
    language: "en",
  });

  // Fetch organization data
  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: user?.role === 'super_admin',
  });

  // Save organization settings
  const saveOrgMutation = useMutation({
    mutationFn: async (settings: OrganizationSettings) => {
      const response = await apiRequest("PUT", `/api/organizations/${settings.id}`, settings);
      return response.json();
    },
    onMutate: async (newSettings) => {
      console.log('🚀 Starting optimistic update with:', newSettings);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", newSettings.id] });
      
      // Snapshot the previous value
      const previousOrg = queryClient.getQueryData(["/api/organizations", newSettings.id]);
      
      // Optimistically update the cache
      queryClient.setQueryData(["/api/organizations", newSettings.id], {
        ...(previousOrg || {}),
        ...newSettings,
        is_active: newSettings.isActive
      });
      
      // Update context immediately
      const updatedOrg = {
        ...currentOrganization!,
        name: newSettings.name,
        address: newSettings.address || "",
        email: newSettings.email || "",
        phone: newSettings.phone || "",
        isActive: newSettings.isActive
      };
      
      console.log('⚡ Optimistic update - setting organization:', updatedOrg);
      setCurrentOrganization(updatedOrg);
      
      // Force immediate form update
      setOrgSettings(newSettings);
      
      return { previousOrg };
    },
    onSuccess: (updatedOrg) => {
      console.log('✅ Organization update successful:', updatedOrg);
      
      // Aggressively clear and refetch all organization data
      queryClient.removeQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      
      // Set fresh cache data
      queryClient.setQueryData(["/api/organizations", updatedOrg.id], updatedOrg);
      
      const newOrgData = {
        id: updatedOrg.id,
        name: updatedOrg.name,
        address: updatedOrg.address || "",
        email: updatedOrg.email || "",
        phone: updatedOrg.phone || "",
        isActive: updatedOrg.is_active
      };
      
      console.log('🔄 Setting organization context to:', newOrgData);
      setCurrentOrganization(newOrgData);
      
      // Force immediate form state update
      setOrgSettings(newOrgData);
      
      // Force refetch to ensure cache is completely fresh
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/organizations", updatedOrg.id] });
      }, 100);
      
      toast({
        title: "Organization Settings Saved",
        description: "Organization settings have been updated successfully.",
      });
    },
    onError: (err, newSettings, context) => {
      // Rollback on error
      if (context?.previousOrg) {
        queryClient.setQueryData(["/api/organizations", newSettings.id], context.previousOrg);
      }
      
      toast({
        title: "Error",
        description: "Failed to save organization settings.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
  });

  // Save user preferences
  const savePrefsMutation = useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      const response = await apiRequest("PUT", `/api/users/${user?.userId}/preferences`, preferences);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences.",
        variant: "destructive",
      });
    },
  });

  const handleSaveOrganization = () => {
    setIsLoading(true);
    saveOrgMutation.mutate(orgSettings);
    setIsLoading(false);
  };

  const handleSavePreferences = () => {
    setIsLoading(true);
    savePrefsMutation.mutate(userPrefs);
    setIsLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SETTINGS</h1>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {user?.role?.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${
          visibleTabs.length === 3 ? 'grid-cols-3' :
          visibleTabs.length === 4 ? 'grid-cols-4' :
          visibleTabs.length === 5 ? 'grid-cols-5' :
          visibleTabs.length === 6 ? 'grid-cols-6' :
          'grid-cols-3'
        }`}>
          {visibleTabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
              <CardDescription>
                Manage your personal profile settings and avatar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {user?.userName || user?.email?.split('@')[0] || 'Unknown'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {user?.email || 'Not available'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {user?.role?.replace('_', ' ') || 'Unknown'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {currentOrganization?.name || 'No organization'}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Avatar Upload */}
              {user?.userId && (
                <AvatarUpload
                  userId={user.userId}
                  currentAvatarUrl={user?.avatarUrl}
                  userName={user?.userName || user?.email?.split('@')[0] || 'User'}
                  onAvatarUpdate={(avatarUrl: string | null) => {
                    console.log('Avatar updated:', avatarUrl);
                    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Information
              </CardTitle>
              <CardDescription>
                Manage your organization's basic information and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgSettings.name}
                    onChange={(e) => setOrgSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={orgSettings.email}
                    onChange={(e) => setOrgSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@organization.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="org-phone">Phone</Label>
                  <Input
                    id="org-phone"
                    value={orgSettings.phone}
                    onChange={(e) => setOrgSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-status">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="org-status"
                      checked={orgSettings.isActive}
                      onCheckedChange={(checked) => setOrgSettings(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="org-status">
                      {orgSettings.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-address">Address</Label>
                <Textarea
                  id="org-address"
                  value={orgSettings.address}
                  onChange={(e) => setOrgSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter organization address"
                  rows={3}
                />
              </div>

              {/* Logo Upload - Super Admin Only */}
              {user?.role === 'super_admin' && (
                <LogoUpload
                  organizationId={orgSettings.id}
                  currentLogoUrl={orgSettings.logoUrl}
                  onLogoUpdate={(logoUrl) => setOrgSettings(prev => ({ ...prev, logoUrl }))}
                />
              )}

              <Separator />

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveOrganization}
                  disabled={isLoading || saveOrgMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {(isLoading || saveOrgMutation.isPending) ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Organization Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user roles and permissions for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  User management is available through the Users page. Use that page to create, edit, and manage user accounts.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contact className="h-5 w-5" />
                Organization Contacts
              </CardTitle>
              <CardDescription>
                Directory of all users in your organization with their contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contacts.length > 0 ? (
                <div className="space-y-6">
                  {['super_admin', 'monarch_owner', 'organization_admin', 'organization_user', 'driver'].map(role => {
                    const roleContacts = contacts.filter(contact => contact.role === role);
                    if (roleContacts.length === 0) return null;
                    
                    const getRoleDisplayName = (role: string) => {
                      const roleNames: Record<string, string> = {
                        'super_admin': 'Super Administrators',
                        'monarch_owner': 'Monarch Owners', 
                        'organization_admin': 'Organization Administrators',
                        'organization_user': 'Organization Users',
                        'driver': 'Drivers'
                      };
                      return roleNames[role] || role;
                    };

                    return (
                      <div key={role} className="space-y-3">
                        <h4 className="font-semibold text-lg border-b pb-2">
                          {getRoleDisplayName(role)} ({roleContacts.length})
                        </h4>
                        <div className="grid gap-3">
                          {roleContacts.map(contact => (
                            <div key={contact.user_id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                              {/* Avatar */}
                              {contact.avatar_url ? (
                                <img 
                                  src={contact.avatar_url} 
                                  alt={`${contact.user_name}'s avatar`} 
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                  {contact.user_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              
                              {/* Contact Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-gray-900 truncate">{contact.user_name}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {contact.role.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{contact.email}</span>
                                  </div>
                                  {contact.phone_number && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{contact.phone_number}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Contact className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No contacts available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications about trips, updates, and system events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={userPrefs.notifications.email}
                      onCheckedChange={(checked) => 
                        setUserPrefs(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, email: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via text message</p>
                    </div>
                    <Switch
                      checked={userPrefs.notifications.sms}
                      onCheckedChange={(checked) => 
                        setUserPrefs(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, sms: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-600">Receive browser push notifications</p>
                    </div>
                    <Switch
                      checked={userPrefs.notifications.push}
                      onCheckedChange={(checked) => 
                        setUserPrefs(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, push: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Dashboard Settings</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Upcoming Trips</Label>
                      <p className="text-sm text-gray-600">Display upcoming trips on dashboard</p>
                    </div>
                    <Switch
                      checked={userPrefs.dashboard.showUpcomingTrips}
                      onCheckedChange={(checked) => 
                        setUserPrefs(prev => ({ 
                          ...prev, 
                          dashboard: { ...prev.dashboard, showUpcomingTrips: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Driver Status</Label>
                      <p className="text-sm text-gray-600">Display driver availability on dashboard</p>
                    </div>
                    <Switch
                      checked={userPrefs.dashboard.showDriverStatus}
                      onCheckedChange={(checked) => 
                        setUserPrefs(prev => ({ 
                          ...prev, 
                          dashboard: { ...prev.dashboard, showDriverStatus: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dashboard Refresh Interval (seconds)</Label>
                    <Select
                      value={userPrefs.dashboard.refreshInterval.toString()}
                      onValueChange={(value) => 
                        setUserPrefs(prev => ({ 
                          ...prev, 
                          dashboard: { ...prev.dashboard, refreshInterval: parseInt(value) }
                        }))
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button 
                  onClick={handleSavePreferences}
                  disabled={isLoading || savePrefsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {(isLoading || savePrefsMutation.isPending) ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* System Branding Settings - Super Admin Only */}
          {user?.role === 'super_admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Application Branding
                </CardTitle>
                <CardDescription>
                  Manage the main application logo and branding settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <MainLogoUpload
                  currentLogoUrl={systemSettings.main_logo_url}
                  onLogoUpdate={(logoUrl) => {
                    setSystemSettings(prev => ({ ...prev, main_logo_url: logoUrl }));
                    // Refresh system settings query
                    queryClient.invalidateQueries({ queryKey: ["/api/system/settings"] });
                  }}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>
                View system status and configuration details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Current Organization</Label>
                  <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {currentOrganization?.name || 'No organization selected'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>User Role</Label>
                  <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {user?.role?.replace('_', ' ') || 'Unknown'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded font-mono">
                    {user?.userId || 'Not available'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last Login</Label>
                  <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {new Date().toLocaleString()}
                  </div>
                </div>
              </div>

              <Separator />

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  For system administration tasks, contact your system administrator or use the super admin tools if you have the appropriate permissions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
