import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Upload, X, User } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { supabase } from "../lib/supabase";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarUpdate: (avatarUrl: string | null) => void;
  userName?: string;
}

export function AvatarUpload({ userId, currentAvatarUrl, onAvatarUpdate, userName }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

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
      console.log('Getting Supabase session...');
      // Get auth token from Supabase session (same as apiRequest)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session?.access_token) {
        console.error('No access token in session');
        throw new Error('Authentication required. Please log in again.');
      }

      console.log('Creating FormData and uploading...');
      const formData = new FormData();
      formData.append('avatar', file);

      // Use API base URL (not relative URL)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const uploadUrl = `${apiBaseUrl}/api/users/${userId}/avatar`;
      
      console.log('Uploading to:', uploadUrl);
      console.log('User ID:', userId);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      onAvatarUpdate(data.avatar_url);
      
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully."
      });

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset file input so same file can be selected again
      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    setIsDeleting(true);

    try {
      await apiRequest("DELETE", `/api/users/${userId}/avatar`);
      onAvatarUpdate(null);
      
      toast({
        title: "Avatar Removed",
        description: "Your profile picture has been removed."
      });

    } catch (error) {
      console.error('Avatar delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to remove avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="avatar-upload" className="text-sm font-medium">
        Profile Picture
      </Label>
      
      <div className="flex items-center space-x-4">
        {/* Avatar Display */}
        <div className="relative">
          {currentAvatarUrl ? (
            <img 
              src={currentAvatarUrl} 
              alt={`${userName}'s avatar`} 
              className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-lg">
                {getInitials(userName)}
              </span>
            </div>
          )}
          
          {currentAvatarUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAvatar}
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
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              variant="outline"
              disabled={isUploading}
              className="cursor-pointer"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Trigger file input click
                const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
                if (fileInput) {
                  fileInput.click();
                }
              }}
            >
              {isUploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {currentAvatarUrl ? "Change Picture" : "Upload Picture"}
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            Recommended: Square image, max 5MB. Will be resized to 150x150px.
          </p>
        </div>
      </div>
    </div>
  );
}