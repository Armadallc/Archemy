import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Upload, X, Image } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

interface LogoUploadProps {
  organizationId: string;
  currentLogoUrl?: string | null;
  onLogoUpdate: (logoUrl: string | null) => void;
  type?: 'corporate-client' | 'program';
}

export function LogoUpload({ organizationId, currentLogoUrl, onLogoUpdate, type = 'corporate-client' }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const endpoint = type === 'program' 
        ? `/api/programs/${organizationId}/logo`
        : `/api/corporate/clients/${organizationId}/logo`;
      
      // Get auth token from Supabase session (PRIORITY)
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      let authToken = session?.access_token || null;
      
      // Fallback to localStorage only if Supabase session fails
      if (!authToken) {
        authToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      }
      
      if (!authToken) {
        throw new Error('No authentication token available');
      }
      
      // Use API base URL (not relative URL)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8081';
      
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${authToken}`
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onLogoUpdate(data.logo_url);
      
      toast({
        title: "Logo Updated",
        description: "Organization logo has been updated successfully."
      });

    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    setIsDeleting(true);

    try {
      const endpoint = type === 'program' 
        ? `/api/programs/${organizationId}/logo`
        : `/api/corporate/clients/${organizationId}/logo`;
      
      // apiRequest already handles the API base URL
      await apiRequest("DELETE", endpoint);
      onLogoUpdate(null);
      
      toast({
        title: "Logo Removed",
        description: "Organization logo has been removed."
      });

    } catch (error) {
      console.error('Logo delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to remove logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="logo-upload" className="text-sm font-medium">
        Organization Logo
      </Label>
      
      {currentLogoUrl ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            <img 
              src={currentLogoUrl} 
              alt="Organization logo" 
              className="h-12 w-auto object-contain"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Current organization logo</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteLogo}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Image className="w-8 h-8 mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">No logo uploaded</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Label htmlFor="logo-upload" className="cursor-pointer">
          <Button
            variant="outline"
            disabled={isUploading}
            className="cursor-pointer"
            asChild
          >
            <span>
              {isUploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {currentLogoUrl ? "Replace Logo" : "Upload Logo"}
                </>
              )}
            </span>
          </Button>
        </Label>
        <Input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
        />
      </div>
      
      <p className="text-xs text-gray-500">
        Recommended: PNG or SVG format, max 5MB. Logo will be resized to 400x160px for crisp display.
      </p>
    </div>
  );
}