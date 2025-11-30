import { useQuery } from '@tanstack/react-query';
import { useHierarchy } from './useHierarchy';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from './useAuth';

interface Permission {
  id: string;
  role: string;
  permission: string;
  resource: string;
  program_id?: string;
  corporate_client_id?: string;
}

/**
 * Hook to check if current user has a specific permission
 * Uses effective permissions endpoint which checks permissions at all hierarchy levels
 */
export function usePermission(permission: string) {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const { user } = useAuth();
  
  const { data: effectivePermissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ['/api/permissions/effective', level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      let endpoint = '/api/permissions/effective';
      
      // Build endpoint based on hierarchy level
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/permissions/effective/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/permissions/effective/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false
  });

  // Check if permission exists in effective permissions (case-insensitive)
  const hasPermission = effectivePermissions.some(
    (p: Permission) => p.permission.toLowerCase() === permission.toLowerCase()
  );

  return {
    hasPermission,
    isLoading
  };
}

export function useFeatureFlag(flagName: string) {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  
  const { data: flagCheck, isLoading } = useQuery({
    queryKey: ['feature-flag', flagName, level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      let endpoint = `/api/feature-flags/check/${flagName}`;
      
      // Add hierarchy-specific parameters
      const params = new URLSearchParams();
      if (level === 'program' && selectedProgram) {
        params.append('programId', selectedProgram);
      } else if (level === 'client' && selectedCorporateClient) {
        params.append('corporateClientId', selectedCorporateClient);
      }
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
      
      try {
        const response = await apiRequest("GET", endpoint);
        if (!response.ok) {
          // If 404 or other error, flag doesn't exist - default to disabled
          return { isEnabled: false };
        }
        const data = await response.json();
        return data || { isEnabled: false };
      } catch (error) {
        // If flag doesn't exist or API fails, default to disabled
        console.warn(`Feature flag check failed for ${flagName}:`, error);
        return { isEnabled: false };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    // Don't throw errors - just return disabled state
    throwOnError: false
  });

  return {
    isEnabled: flagCheck?.isEnabled || false,
    isLoading: isLoading || false
  };
}

/**
 * Hook to get all effective permissions for current user
 * Returns array of permission objects and helper functions
 */
export function useEffectivePermissions() {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const { user } = useAuth();
  
  const { data: permissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ['/api/permissions/effective', level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      let endpoint = '/api/permissions/effective';
      
      // Build endpoint based on hierarchy level
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/permissions/effective/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/permissions/effective/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: false
  });

  // Helper function to check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    return permissions.some(
      (p: Permission) => p.permission.toLowerCase() === permission.toLowerCase()
    );
  };

  // Helper function to check if user has any of the specified permissions
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  // Helper function to check if user has all of the specified permissions
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  // Get permission names as array of strings
  const permissionNames = permissions.map((p: Permission) => p.permission.toLowerCase());

  return {
    permissions,
    permissionNames,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading
  };
}