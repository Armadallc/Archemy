import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useWatch, useFieldArray } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { PhoneInput } from "../../components/ui/phone-input";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import AddressInput from "../forms/AddressInput";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { CustomSelector } from "../../components/ui/custom-selector";
import { Trash2, UserPlus, Upload, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { useHierarchy } from "../../hooks/useHierarchy";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface ClientFormProps {
  createForm: any;
  programs: any[];
  locations: any[];
  selectedProgram: string | null;
}

export const ComprehensiveClientForm: React.FC<ClientFormProps> = ({
  createForm,
  programs,
  locations,
  selectedProgram
}) => {
  const { user } = useAuth();
  const { level, selectedCorporateClient, activeScope } = useHierarchy();
  
  // Determine if we need to show tenant selector
  // Show for super admin in Global View OR corporate admin without program selected
  const isGlobalView = activeScope === 'global' || (level === 'corporate' && !selectedCorporateClient);
  const needsTenantSelector = (user?.role === 'super_admin' && isGlobalView) || 
                              (user?.role === 'corporate_admin' && !selectedProgram);
  
  // Watch the selected tenant (corporate_client_id) from the form
  const selectedTenantId = useWatch({
    control: createForm.control,
    name: "corporate_client_id",
    defaultValue: selectedCorporateClient || ""
  });
  
  // Watch the selected program_id from the form
  const selectedProgramId = useWatch({
    control: createForm.control,
    name: "program_id",
    defaultValue: selectedProgram || ""
  });
  
  // Fetch corporate clients for tenant selector (super admin only)
  const { data: corporateClients = [] } = useQuery({
    queryKey: ['/api/corporate-clients', 'client-form'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate-clients');
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.corporateClients || []);
    },
    enabled: needsTenantSelector && user?.role === 'super_admin',
    staleTime: 600000, // 10 minutes
  });
  
  // Filter programs based on selected tenant
  const filteredPrograms = useMemo(() => {
    if (!needsTenantSelector || !selectedTenantId) {
      return programs; // Show all programs if no tenant selected or tenant selector not needed
    }
    return programs.filter((program: any) => 
      program.corporate_client_id === selectedTenantId || 
      program.corporateClient?.id === selectedTenantId
    );
  }, [programs, selectedTenantId, needsTenantSelector]);

  // Watch location_id and use_location_address to populate address
  const selectedLocationId = useWatch({
    control: createForm.control,
    name: "location_id"
  });

  const useLocationAddress = useWatch({
    control: createForm.control,
    name: "use_location_address",
    defaultValue: false
  });

  // Watch date_of_birth to calculate age automatically
  const dateOfBirth = useWatch({
    control: createForm.control,
    name: "date_of_birth"
  });

  // Calculate age from date of birth
  const calculateAge = (dob: string | undefined): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : null;
  };

  const calculatedAge = calculateAge(dateOfBirth);

  // Update age field when date of birth changes
  useEffect(() => {
    if (calculatedAge !== null) {
      createForm.setValue("age", calculatedAge, { shouldValidate: false });
    } else if (!dateOfBirth) {
      createForm.setValue("age", undefined, { shouldValidate: false });
    }
  }, [dateOfBirth, calculatedAge, createForm]);

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Watch avatar_url for existing avatars
  const existingAvatarUrl = useWatch({
    control: createForm.control,
    name: "avatar_url"
  });

  // Initialize preview from existing avatar_url
  useEffect(() => {
    if (existingAvatarUrl) {
      setAvatarPreview(existingAvatarUrl);
    }
  }, [existingAvatarUrl]);

  // Handle avatar file selection and upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);

    try {
      // Upload to Supabase Storage using the file storage API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'other'); // Using 'other' category for client avatars
      if (selectedProgramId) {
        formData.append('programId', selectedProgramId);
      }

      // Get auth token for fetch request
      const { supabase: supabaseClient } = await import("../../lib/supabase");
      const { data: { session } } = await supabaseClient.auth.getSession();
      const authToken = session?.access_token || localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      
      // Use fetch directly for FormData (apiRequest doesn't handle FormData)
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken || ''}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.fileMetadata) {
        // Construct public URL from Supabase Storage
        // Format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
        const { data: urlData } = supabaseClient.storage
          .from(data.fileMetadata.bucket_id)
          .getPublicUrl(data.fileMetadata.file_path);
        
        const avatarUrl = urlData.publicUrl;
        createForm.setValue("avatar_url", avatarUrl, { shouldValidate: false });
        
        // Update preview to show the uploaded image
        setAvatarPreview(avatarUrl);
        
        toast({
          title: "Photo Uploaded",
          description: "Client photo has been uploaded successfully."
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    createForm.setValue("avatar_url", undefined, { shouldValidate: false });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter locations by the selected program
  const filteredLocations = React.useMemo(() => {
    if (!selectedProgramId) {
      return locations;
    }
    return locations.filter((location: any) => location.program_id === selectedProgramId);
  }, [locations, selectedProgramId]);

  // Manage program contacts array
  const { fields: programContacts, append: appendContact, remove: removeContact } = useFieldArray({
    control: createForm.control,
    name: "program_contacts"
  });

  // Populate address from location when "Use location address" is checked
  useEffect(() => {
    if (useLocationAddress && selectedLocationId) {
      // Find the selected location in filteredLocations or all locations
      const selectedLocation = filteredLocations.find((loc: any) => loc.id === selectedLocationId) ||
                               locations.find((loc: any) => loc.id === selectedLocationId);
      
      if (selectedLocation?.address) {
        // Always update when checkbox is checked - user explicitly requested location address
        createForm.setValue("address", selectedLocation.address, { shouldValidate: false });
      }
    }
    // Note: When checkbox is unchecked, we leave the address as-is so user can manually edit
  }, [useLocationAddress, selectedLocationId, filteredLocations, locations, createForm]);

  return (
    <div className="space-y-6" style={{ backgroundColor: 'var(--card)' }}>
      
      {/* 1. Avatar Section */}
      <div className="border-t pt-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <h4 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Client Photo</h4>
        <div className="flex items-center space-x-4">
          {/* Avatar Preview */}
          <div className="relative">
            {avatarPreview ? (
              <>
                <img 
                  src={avatarPreview} 
                  alt="Client photo preview" 
                  className="w-20 h-20 rounded-full object-cover border-2"
                  style={{ borderColor: 'var(--border)' }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  style={{ 
                    backgroundColor: 'hsla(0, 84%, 60%, 0.15)',
                    color: 'var(--destructive)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsla(0, 84%, 60%, 0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsla(0, 84%, 60%, 0.15)'}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                style={{ 
                  backgroundColor: 'var(--muted)',
                  borderColor: 'var(--border)'
                }}
              >
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Photo</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="flex items-center space-x-2"
              >
                {isUploadingAvatar ? (
                  <>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>{avatarPreview ? "Change Photo" : "Upload Photo"}</span>
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Optional client photo (max 5MB)</p>
          </div>
        </div>
      </div>

      {/* 2. Tenant/Corporate Client Section (if needed) */}
      {needsTenantSelector && (
        <div className="border-t pt-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h4 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Tenant Selection</h4>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={createForm.control}
              name="corporate_client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>
                    {user?.role === 'super_admin' ? 'Corporate Client / Tenant *' : 'Tenant *'}
                  </FormLabel>
                  <FormControl>
                    <CustomSelector
                      value={field.value || selectedCorporateClient || ''}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear program selection when tenant changes
                        createForm.setValue('program_id', '');
                      }}
                      placeholder="Select tenant"
                      options={user?.role === 'super_admin' 
                        ? corporateClients.map((client: any) => ({
                            value: client.id || client.corporate_client_id,
                            label: client.name
                          }))
                        : user?.role === 'corporate_admin' && (user as any)?.corporate_client_id
                          ? [{
                              value: (user as any).corporate_client_id,
                              label: (user as any).corporate_client_name || 'Your Organization'
                            }]
                          : []
                      }
                      className="mt-1"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {user?.role === 'super_admin' 
                      ? 'Select a tenant to assign this client. Programs will be filtered by the selected tenant.'
                      : 'Select a tenant to continue. Programs will be filtered by the selected tenant.'}
                  </p>
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {/* 3. Program & Location Section */}
      <div className="border-t pt-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <h4 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Program & Location</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={createForm.control}
            name="program_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Program *</FormLabel>
                <FormControl>
                  <CustomSelector
                    value={field.value || selectedProgram || ''}
                    onValueChange={field.onChange}
                    placeholder={needsTenantSelector && !selectedTenantId ? "Select tenant first" : "Select program"}
                    options={filteredPrograms.map((program: any) => ({
                      value: program.id,
                      label: program.name
                    }))}
                    className="mt-1"
                    disabled={needsTenantSelector && !selectedTenantId}
                  />
                </FormControl>
                <FormMessage />
                {needsTenantSelector && !selectedTenantId && (
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Please select a tenant first to see available programs.
                  </p>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={createForm.control}
            name="location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Location</FormLabel>
                <FormControl>
                  <CustomSelector
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={selectedProgramId ? "Select location" : "Select program first"}
                    options={filteredLocations.map(location => ({
                      value: location.id,
                      label: location.name
                    }))}
                    className="mt-1"
                    disabled={!selectedProgramId}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* 3. Personal Information Section */}
      <div className="border-t pt-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <h4 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Personal Information</h4>
        
        {/* Contact Subsection */}
        <div className="mb-6">
          <h5 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Contact</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={createForm.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormField
              control={createForm.control}
              name="phone_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Phone Type</FormLabel>
                  <FormControl>
                    <CustomSelector
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select type"
                      options={[
                        { value: "Mobile", label: "Mobile" },
                        { value: "Home", label: "Home" }
                      ]}
                      className="mt-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Phone</FormLabel>
                  <FormControl>
                    <PhoneInput
                      value={field.value || ''}
                      onChange={field.onChange}
                      className="mt-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="client@email.com" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>4-Digit PIN</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="1234" 
                      className="mt-1" 
                      maxLength={4}
                      {...field}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Give this PIN to the client for notification signup</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={createForm.control}
            name="address"
            render={({ field }) => (
              <FormItem className="mt-4">
                <AddressInput
                  value={field.value || ''}
                  onChange={(addressData) => {
                    // Generate full address for backward compatibility
                    const fullAddress = [
                      addressData.street,
                      addressData.city,
                      addressData.state && addressData.zip ? `${addressData.state} ${addressData.zip}` : addressData.state || addressData.zip
                    ].filter(Boolean).join(', ');
                    field.onChange(fullAddress);
                  }}
                  onFullAddressChange={field.onChange}
                  label="Address"
                  required={false}
                  showLabel={true}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <FormField
                    control={createForm.control}
                    name="use_location_address"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          Use location address
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Demographics Subsection */}
        <div>
          <h5 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Demographics</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={createForm.control}
              name="birth_sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Birth Sex</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex items-center gap-6 mt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Male" id="male" />
                        <label htmlFor="male" className="text-sm font-medium cursor-pointer">Male</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Female" id="female" />
                        <label htmlFor="female" className="text-sm font-medium cursor-pointer">Female</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" className="mt-1" {...field} />
                  </FormControl>
                  {calculatedAge !== null && (
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      Age: <span className="font-medium">{calculatedAge} {calculatedAge === 1 ? 'year' : 'years'}</span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Hidden age field - calculated automatically from date of birth */}
            <FormField
              control={createForm.control}
              name="age"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} value={calculatedAge || undefined} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="race"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Race</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter race" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* 4. Program Contacts Section */}
      <div className="border-t pt-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <h4 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Program Contacts</h4>
        <div className="space-y-4">
          <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Add program contacts (Case Manager, Peer, etc.) who can be reached during trips.
          </div>
          
          {/* Existing Contacts List */}
          {programContacts.length > 0 && (
            <div className="space-y-3">
              {programContacts.map((contact, index) => (
                <div 
                  key={contact.id} 
                  className="border rounded-lg p-4"
                  style={{ 
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--muted)'
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>
                      Contact {index + 1}
                    </h5>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContact(index)}
                      style={{ 
                        color: 'var(--destructive)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'hsla(0, 84%, 60%, 0.15)';
                        e.currentTarget.style.color = 'var(--destructive)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--destructive)';
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name={`program_contacts.${index}.first_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" className="mt-1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name={`program_contacts.${index}.last_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" className="mt-1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name={`program_contacts.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Role *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Case Manager, Peer" className="mt-1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name={`program_contacts.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" className="mt-1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <FormField
                      control={createForm.control}
                      name={`program_contacts.${index}.is_preferred_poc`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            Preferred Point of Contact
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Contact Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendContact({
              first_name: "",
              last_name: "",
              role: "",
              phone: "",
              is_preferred_poc: false
            })}
            className="flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add Contact</span>
          </Button>
        </div>
      </div>

      {/* 5. Transport Requirements Section */}
      <div className="border-t pt-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <h4 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Transport Requirements</h4>
        
        {/* Mobility Requirements */}
        <div className="mb-6">
          <h5 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Mobility</h5>
          <div className="space-y-2">
            {['Ambulatory', 'Wheelchair', 'Walker/Cane', 'Bariatric', 'Limited Mobility/Needs Assistance', 'Other'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox id={`mobility-${option}`} />
                <label htmlFor={`mobility-${option}`} className="text-sm">{option}</label>
                {option === 'Other' && (
                  <Input placeholder="Specify other mobility need" className="ml-4 w-64" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Special Requirements */}
        <div className="mb-6">
          <h5 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Special</h5>
          <div className="space-y-2">
            {['Door to Door', 'Curb to Curb', 'Soft Landing (driver escorts client to/from)', 'Driver needs to: Pick up paperwork', 'Driver needs to: Drop off paperwork', 'Other'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox id={`special-${option}`} />
                <label htmlFor={`special-${option}`} className="text-sm">{option}</label>
                {option === 'Other' && (
                  <Input placeholder="Specify other special need" className="ml-4 w-64" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Communication Needs */}
        <div className="mb-6">
          <h5 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Communication Needs</h5>
          <div className="space-y-2">
            {['Non-Verbal', 'Calm Communication', 'Calm Music', 'Other'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox id={`communication-${option}`} />
                <label htmlFor={`communication-${option}`} className="text-sm">{option}</label>
                {option === 'Other' && (
                  <Input placeholder="Specify other communication need" className="ml-4 w-64" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Safety/Comfort */}
        <div>
          <h5 className="text-sm font-medium mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500, color: 'var(--foreground)' }}>Safety/Comfort</h5>
          <FormField
            control={createForm.control}
            name="preferred_driver_request"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Driver Request (familiar face)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any specific driver preferences or requests" className="mt-1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
