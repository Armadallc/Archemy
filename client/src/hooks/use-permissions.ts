import { useQuery } from '@tanstack/react-query';

export function usePermission(permission: string, organizationId?: string) {
  const { data: permissionCheck, isLoading } = useQuery({
    queryKey: ['permission-check', permission, organizationId],
    queryFn: async () => {
      const params = organizationId ? `?organizationId=${organizationId}` : '';
      const response = await fetch(`/api/permissions/check/${permission}${params}`);
      
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

export function useFeatureFlag(flagName: string, organizationId?: string) {
  const { data: flagCheck, isLoading } = useQuery({
    queryKey: ['feature-flag', flagName, organizationId],
    queryFn: async () => {
      const params = organizationId ? `?organizationId=${organizationId}` : '';
      const response = await fetch(`/api/feature-flags/check/${flagName}${params}`);
      
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
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['effective-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/permissions/effective');
      
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