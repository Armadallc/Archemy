import { useQuery } from '@tanstack/react-query';
import { useHierarchy } from './useHierarchy';

export function usePermission(permission: string) {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  
  const { data: permissionCheck, isLoading } = useQuery({
    queryKey: ['permission-check', permission, level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      let endpoint = `/api/permissions/check/${permission}`;
      
      // Add hierarchy-specific parameters
      if (level === 'program' && selectedProgram) {
        endpoint += `?programId=${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint += `?corporateClientId=${selectedCorporateClient}`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        return { hasPermission: false };
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false
  });

  return {
    hasPermission: permissionCheck?.hasPermission || false,
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
      if (level === 'program' && selectedProgram) {
        endpoint += `?programId=${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint += `?corporateClientId=${selectedCorporateClient}`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        return { isEnabled: false };
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false
  });

  return {
    isEnabled: flagCheck?.isEnabled || false,
    isLoading
  };
}

export function useEffectivePermissions() {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['effective-permissions', level, selectedProgram, selectedCorporateClient],
    queryFn: async () => {
      let endpoint = '/api/permissions/effective';
      
      // Add hierarchy-specific parameters
      if (level === 'program' && selectedProgram) {
        endpoint += `?programId=${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint += `?corporateClientId=${selectedCorporateClient}`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        return {};
      }
      
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: false
  });

  return {
    permissions: permissions || {},
    isLoading
  };
}