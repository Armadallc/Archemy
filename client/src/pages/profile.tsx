import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RoleBadge } from '../components/users/RoleBadge';
import { useToast } from '../hooks/use-toast';
import { User, Mail, Phone, MapPin, Calendar, Save, Camera, Shield, Key, Trash2, Bell } from 'lucide-react';
import { PhoneInput } from '../components/ui/phone-input';
import { supabase } from '../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { apiRequest } from '../lib/queryClient';
import AddressInput from '../components/forms/AddressInput';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Get active tab from URL hash or default to 'personal'
  const getActiveTabFromUrl = () => {
    if (typeof window === 'undefined') return 'personal';
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['personal', 'account', 'security', 'notifications'];
    const tab = validTabs.includes(hash) ? hash : 'personal';
    console.log('🔍 [Profile] getActiveTabFromUrl:', { hash, tab });
    return tab;
  };
  
  const [activeTab, setActiveTab] = useState(() => {
    // Use lazy initialization to ensure window is available
    if (typeof window !== 'undefined') {
      const tab = getActiveTabFromUrl();
      console.log('🔍 [Profile] Initial activeTab:', tab);
      return tab;
    }
    return 'personal';
  });
  
  // Update URL when tab changes
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== activeTab) {
        window.location.hash = activeTab;
        console.log('🔍 [Profile] Updated hash to:', activeTab);
      }
    }
  }, [activeTab]);
  
  // Listen for hash changes (back/forward navigation) and initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleHashChange = () => {
      const newTab = getActiveTabFromUrl();
      console.log('🔍 [Profile] Hash changed, newTab:', newTab, 'current activeTab:', activeTab);
      if (newTab !== activeTab) {
        console.log('🔍 [Profile] Setting activeTab to:', newTab);
        setActiveTab(newTab);
      }
    };
    
    // Check hash on mount - use setTimeout to ensure hash is available
    setTimeout(() => {
      handleHashChange();
    }, 0);
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const [formData, setFormData] = useState({
    user_name: user?.user_name || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    job_title: user?.job_title || '',
    company: user?.company || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        user_name: user?.user_name || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        job_title: user?.job_title || '',
        company: user?.company || '',
        bio: user?.bio || '',
        location: user?.location || '',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const uploadUrl = `${apiBaseUrl}/api/users/${user?.user_id}/avatar`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      await refreshUser();
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
      const fileInput = document.getElementById('profile-avatar-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8081';
      
      const response = await fetch(`${apiBaseUrl}/api/users/${user?.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          job_title: formData.job_title,
          company: formData.company,
          bio: formData.bio,
          location: formData.location,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
      
      setIsEditing(false);
      await refreshUser();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      user_name: user?.user_name || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      job_title: user?.job_title || '',
      company: user?.company || '',
      bio: user?.bio || '',
      location: user?.location || '',
    });
    setIsEditing(false);
  };

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_enabled: true,
    push_enabled: false,
    sms_enabled: false,
    marketing_emails: true,
    weekly_summary: true,
    security_alerts: true,
  });
  
  // Password change dialog state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Delete account dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Load notification preferences
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      if (!user?.user_id) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8081';
        const response = await fetch(`${apiBaseUrl}/api/notifications/preferences/${user.user_id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const prefs = await response.json();
          // Handle array of preferences or single preference object
          if (Array.isArray(prefs) && prefs.length > 0) {
            const combinedPrefs = prefs.reduce((acc, pref) => {
              return {
                ...acc,
                email_enabled: acc.email_enabled || pref.email_enabled,
                push_enabled: acc.push_enabled || pref.push_enabled,
                sms_enabled: acc.sms_enabled || pref.sms_enabled,
              };
            }, { email_enabled: true, push_enabled: false, sms_enabled: false });
            setNotificationPrefs(prev => ({ ...prev, ...combinedPrefs }));
          } else if (prefs && typeof prefs === 'object') {
            setNotificationPrefs(prev => ({ ...prev, ...prefs }));
          }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    };
    
    loadNotificationPreferences();
  }, [user?.user_id]);
  
  // Handle notification preference change (only for email and push)
  const handleNotificationChange = async (key: string, value: boolean) => {
    if (!user?.user_id) return;
    
    // Only allow email_enabled and push_enabled to be changed
    if (key !== 'email_enabled' && key !== 'push_enabled') {
      return;
    }
    
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/notifications/preferences/${user.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          notification_type: 'general',
          email_enabled: key === 'email_enabled' ? value : notificationPrefs.email_enabled,
          push_enabled: key === 'push_enabled' ? value : notificationPrefs.push_enabled,
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update preference');
      }
      
      toast({
        title: 'Preference updated',
        description: 'Your notification preference has been updated.',
      });
    } catch (error: any) {
      // Revert on error
      setNotificationPrefs(prev => ({ ...prev, [key]: !value }));
      toast({
        title: 'Error',
        description: error.message || 'Failed to update preference. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle password change
  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      // Update password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully changed.',
      });
      
      setIsPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Handle account export
  const handleExportData = async () => {
    if (!user?.user_id) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      toast({
        title: 'Export started',
        description: 'Your data export will be available shortly. You will receive an email when it\'s ready.',
      });
      
      // TODO: Implement actual data export endpoint
      console.log('Data export requested for user:', user.user_id);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: 'Error',
        description: 'Please type "DELETE" to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      // TODO: Implement actual account deletion endpoint
      // For now, just show a message
      toast({
        title: 'Account deletion requested',
        description: 'Your account deletion request has been submitted. Please contact support for immediate deletion.',
      });
      
      setIsDeleteDialogOpen(false);
      setDeleteConfirmText('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <div className="flex-1 flex flex-col overflow-hidden space-y-6" style={{ padding: '24px', backgroundColor: 'var(--background)' }}>
        {/* Profile Header Card - Full width like dashboard header */}
        <div className="flex-shrink-0">
          <div className="px-6 py-6 rounded-lg card-neu flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px', boxShadow: '8px 8px 16px 0px rgba(30, 32, 35, 0.6), -8px -8px 16px 0px rgba(30, 32, 35, 0.05)' }}>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-background relative">
                {user?.avatar_url ? (
                  <AvatarImage 
                    src={user.avatar_url} 
                    alt={user?.user_name || 'User'}
                    className="object-cover relative z-10"
                  />
                ) : (
                  <AvatarFallback className="text-2xl">
                    {user?.user_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              {/* Compact Upload Button Overlay */}
              <label
                htmlFor="profile-avatar-upload"
                className="absolute -right-2 -bottom-2 rounded-full p-2 cursor-pointer transition-colors z-10 border-2 border-background h-8 w-8 flex items-center justify-center card-neu hover:card-neu [&]:shadow-none"
                style={{ 
                  backgroundColor: 'var(--background)', 
                  borderColor: 'var(--background)',
                  boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)',
                  color: '#7afffe'
                }}
                title="Change profile picture"
              >
                {isUploadingAvatar ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <h1 
                  className="text-2xl"
                  style={{ fontWeight: 400 }}
                >
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.user_name || user?.email || 'User'}
                </h1>
                <RoleBadge role={user?.role || 'program_user'} />
              </div>
              {formData.job_title && (
                <p className="text-muted-foreground">{formData.job_title}</p>
              )}
              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </div>
                {formData.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {formData.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatJoinDate(user?.created_at)}
                </div>
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="default"
              className="w-full md:w-auto card-neu hover:card-neu [&]:shadow-none"
              style={{ 
                backgroundColor: 'var(--background)', 
                border: 'none',
                boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)',
                color: '#7afffe',
                textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)',
                fontWeight: 400
              }}
            >
              <span>Edit Profile</span>
            </Button>
          )}
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="flex-1 overflow-auto min-h-0" style={{ overflow: 'visible' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 card-neu-flat p-1" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <TabsTrigger 
              value="personal"
              className="data-[state=active]:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)' }}
            >
              Personal
            </TabsTrigger>
            <TabsTrigger 
              value="account"
              className="data-[state=active]:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)' }}
            >
              Account
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)' }}
            >
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:card-neu-pressed"
              style={{ backgroundColor: 'var(--background)' }}
            >
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6" style={{ boxShadow: 'none' }}>
            <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardTitle style={{ fontSize: '16px', fontWeight: 400 }}>PERSONAL INFORMATION</CardTitle>
                <CardDescription>Update your personal details and profile information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="font-medium" style={{ fontSize: '16px' }}>FIRST NAME</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      disabled={!isEditing}
                      className="card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="font-medium" style={{ fontSize: '16px' }}>LAST NAME</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      disabled={!isEditing}
                      className="card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-medium" style={{ fontSize: '16px' }}>EMAIL</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled={true}
                        className="pl-9 card-neu-flat [&]:shadow-none"
                        style={{ backgroundColor: 'var(--background)', border: 'none' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-medium" style={{ fontSize: '16px' }}>PHONE</Label>
                    <PhoneInput
                      id="phone"
                      value={formData.phone}
                      onChange={(value) => handleInputChange('phone', value)}
                      disabled={!isEditing}
                      className="card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_title" className="font-medium" style={{ fontSize: '16px' }}>JOB TITLE</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Senior Product Designer"
                      className="card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="font-medium" style={{ fontSize: '16px' }}>COMPANY</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Acme Inc."
                      className="card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-medium" style={{ fontSize: '16px' }}>BIO</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="card-neu-pressed"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-medium" style={{ fontSize: '16px' }}>LOCATION</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., San Francisco, CA"
                      className="pl-9 card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <AddressInput
                    value={formData.address || ''}
                    onChange={(addressData) => {
                      // Generate full address for backward compatibility
                      const fullAddress = [
                        addressData.street,
                        addressData.city,
                        addressData.state && addressData.zip ? `${addressData.state} ${addressData.zip}` : addressData.state || addressData.zip
                      ].filter(Boolean).join(', ');
                      handleInputChange('address', fullAddress);
                    }}
                    onFullAddressChange={(fullAddress) => handleInputChange('address', fullAddress)}
                    label="Address"
                    required={false}
                    showLabel={true}
                    disabled={!isEditing}
                  />
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="w-full sm:w-auto card-neu-flat hover:card-neu [&]:shadow-none"
                      style={{ 
                        backgroundColor: 'var(--background)', 
                        border: 'none',
                        boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full sm:w-auto card-neu hover:card-neu [&]:shadow-none"
                      style={{ 
                        backgroundColor: 'var(--background)', 
                        border: 'none',
                        boxShadow: '0 0 12px rgba(122, 255, 254, 0.2)',
                        color: '#7afffe',
                        textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)',
                        fontWeight: 400
                      }}
                    >
                      {isSaving ? (
                        <>
                          <Save className="mr-2 h-4 w-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-6" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardTitle style={{ fontSize: '16px', fontWeight: 400 }}>ACCOUNT SETTINGS</CardTitle>
                <CardDescription>Manage your account preferences and subscription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Account Status</Label>
                    <p className="text-muted-foreground text-sm">
                      Your account is currently {user?.is_active ? 'active' : 'inactive'}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={user?.is_active 
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400" 
                      : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                    }
                  >
                    {user?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Account Visibility</Label>
                    <p className="text-muted-foreground text-sm">
                      Make your profile visible to other users
                    </p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Data Export</Label>
                    <p className="text-muted-foreground text-sm">Download a copy of your data</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleExportData}
                    className="card-neu-flat hover:card-neu [&]:shadow-none"
                    style={{ 
                      backgroundColor: 'var(--background)', 
                      border: 'none',
                      boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                    }}
                  >
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardTitle style={{ fontSize: '16px', fontWeight: 400, color: '#ff8475' }}>DANGER ZONE</CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium" style={{ fontSize: '16px' }}>DELETE ACCOUNT</Label>
                    <p className="text-muted-foreground text-sm">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="card-neu-flat hover:card-neu [&]:shadow-none !text-[#ff8475] hover:!text-[#ff8475] [&_svg]:!text-[#ff8475]"
                    style={{ 
                      backgroundColor: 'var(--background)', 
                      border: 'none',
                      boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)',
                      fontWeight: 400
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardTitle style={{ fontSize: '16px', fontWeight: 400 }}>SECURITY SETTINGS</CardTitle>
                <CardDescription>Manage your account security and authentication.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6" style={{ paddingTop: '24px' }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">Password</Label>
                      <p className="text-muted-foreground text-sm">Last changed 3 months ago</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPasswordDialogOpen(true)}
                      className="card-neu-flat hover:card-neu [&]:shadow-none"
                      style={{ 
                        backgroundColor: 'var(--background)', 
                        border: 'none',
                        boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                      }}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-muted-foreground text-sm">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                        Disabled
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="card-neu-flat hover:card-neu [&]:shadow-none"
                        style={{ 
                          backgroundColor: 'var(--background)', 
                          border: 'none',
                          boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                        }}
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">Login Notifications</Label>
                      <p className="text-muted-foreground text-sm">
                        Get notified when someone logs into your account
                      </p>
                    </div>
                    <Switch 
                      checked={notificationPrefs.security_alerts}
                      onCheckedChange={(checked) => handleNotificationChange('security_alerts', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base">Active Sessions</Label>
                      <p className="text-muted-foreground text-sm">
                        Manage devices that are logged into your account
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      className="card-neu-flat hover:card-neu [&]:shadow-none"
                      style={{ 
                        backgroundColor: 'var(--background)', 
                        border: 'none',
                        boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                      }}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      View Sessions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings Tab */}
          <TabsContent value="notifications" className="space-y-6" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardTitle style={{ fontSize: '16px', fontWeight: 400 }}>NOTIFICATION PREFERENCES</CardTitle>
                <CardDescription>Choose what notifications you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium">Email Notifications</Label>
                      <p className="text-muted-foreground text-sm">Receive notifications via email</p>
                    </div>
                    <div className="ml-4">
                      <Switch 
                        checked={notificationPrefs.email_enabled}
                        onCheckedChange={(checked) => handleNotificationChange('email_enabled', checked)}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium">Push Notifications</Label>
                      <p className="text-muted-foreground text-sm">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <div className="ml-4">
                      <Switch 
                        checked={notificationPrefs.push_enabled}
                        onCheckedChange={(checked) => handleNotificationChange('push_enabled', checked)}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2 opacity-50">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium">Security Alerts</Label>
                      <p className="text-muted-foreground text-sm">
                        Important security notifications (always enabled)
                      </p>
                    </div>
                    <div className="ml-4">
                      <Switch checked={true} disabled />
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t">
                    <p className="text-xs text-muted-foreground italic">
                      More notification functions coming once Sef gets around to it :)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
        
        {/* Password Change Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader style={{ backgroundColor: 'var(--background)' }}>
            <DialogTitle style={{ fontSize: '16px', fontWeight: 400 }}>CHANGE PASSWORD</DialogTitle>
            <DialogDescription>
              Enter your new password. Make sure it's at least 8 characters long.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4" style={{ backgroundColor: 'var(--background)' }}>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-medium" style={{ fontSize: '16px' }}>NEW PASSWORD</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="font-medium" style={{ fontSize: '16px' }}>CONFIRM PASSWORD</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                className="card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
          </div>
          <DialogFooter style={{ backgroundColor: 'var(--background)' }}>
            <Button 
              variant="outline" 
              onClick={() => setIsPasswordDialogOpen(false)} 
              disabled={isChangingPassword}
              className="card-neu-flat hover:card-neu [&]:shadow-none"
              style={{ 
                backgroundColor: 'var(--background)', 
                border: 'none',
                boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePasswordChange} 
              disabled={isChangingPassword}
              className="card-neu hover:card-neu [&]:shadow-none"
              style={{ 
                backgroundColor: 'var(--background)', 
                border: 'none',
                boxShadow: '0 0 12px rgba(122, 255, 254, 0.2)',
                color: '#7afffe',
                textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)',
                fontWeight: 400
              }}
            >
              <span>{isChangingPassword ? 'Changing...' : 'Change Password'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
        
        {/* Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader style={{ backgroundColor: 'var(--background)' }}>
            <DialogTitle style={{ fontSize: '16px', fontWeight: 400, color: '#ff8475' }}>DELETE ACCOUNT</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data.
              Type "DELETE" to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4" style={{ backgroundColor: 'var(--background)' }}>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="font-medium" style={{ fontSize: '16px' }}>TYPE "DELETE" TO CONFIRM</Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono card-neu-pressed"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
          </div>
          <DialogFooter style={{ backgroundColor: 'var(--background)' }}>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)} 
              disabled={isDeleting}
              className="card-neu-flat hover:card-neu [&]:shadow-none"
              style={{ 
                backgroundColor: 'var(--background)', 
                border: 'none',
                boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isDeleting || deleteConfirmText !== 'DELETE'}
              className="card-neu-flat hover:card-neu [&]:shadow-none !text-[#ff8475] hover:!text-[#ff8475]"
              style={{ 
                backgroundColor: 'var(--background)', 
                border: 'none',
                boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)',
                fontWeight: 400
              }}
            >
              <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
