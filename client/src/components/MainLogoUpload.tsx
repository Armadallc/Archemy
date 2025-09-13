import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MainLogoUploadProps {
  currentLogoUrl?: string | null;
  onLogoUpdate: (logoUrl: string | null) => void;
}

export function MainLogoUpload({ currentLogoUrl, onLogoUpdate }: MainLogoUploadProps) {
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

      const response = await fetch('/api/system/main-logo', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onLogoUpdate(data.main_logo_url);
      
      toast({
        title: "Main Logo Updated",
        description: "Application main logo has been updated successfully."
      });

    } catch (error) {
      console.error('Main logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload main logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    setIsDeleting(true);

    try {
      await apiRequest("DELETE", "/api/system/main-logo");
      onLogoUpdate(null);
      
      toast({
        title: "Main Logo Removed",
        description: "Application main logo has been removed."
      });

    } catch (error) {
      console.error('Main logo delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to remove main logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">
        Main Application Logo
      </Label>
      
      <div className="flex items-center space-x-4">
        {/* Logo Display */}
        <div className="relative">
          {currentLogoUrl ? (
            <div className="h-20 w-40 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              <img 
                src={currentLogoUrl} 
                alt="Main application logo" 
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-20 w-40 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No logo uploaded</span>
            </div>
          )}
          
          {currentLogoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteLogo}
              disabled={isDeleting}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="main-logo-upload" className="cursor-pointer">
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
                      {currentLogoUrl ? "Change Logo" : "Upload Logo"}
                    </>
                  )}
                </span>
              </Button>
            </Label>
            <Input
              id="main-logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </div>
          
          <p className="text-xs text-gray-500">
            Recommended: SVG or PNG format, max 5MB. Displays above app name in header.
          </p>
        </div>
      </div>
    </div>
  );
}