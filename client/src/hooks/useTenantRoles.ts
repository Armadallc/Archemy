import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useHierarchy } from "./useHierarchy";

export interface TenantRole {
  id: string;
  corporate_client_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface RolePermission {
  id?: string;
  role: string;
  role_type: 'system' | 'tenant';
  permission: string;
  resource: string;
  program_id?: string | null;
  corporate_client_id?: string | null;
}

export interface CreateTenantRoleData {
  name: string;
  description?: string | null;
  corporate_client_id: string;
  is_active?: boolean;
}

export interface UpdateTenantRoleData {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface AssignPermissionData {
  permission: string;
  resource?: string;
  program_id?: string | null;
  corporate_client_id?: string | null;
}

/**
 * Hook to fetch all tenant roles for the current corporate client
 */
export function useTenantRoles(corporateClientId?: string) {
  const { selectedCorporateClient } = useHierarchy();
  const finalCorporateClientId = corporateClientId || selectedCorporateClient;

  return useQuery<TenantRole[]>({
    queryKey: ['tenant-roles', finalCorporateClientId],
    queryFn: async () => {
      if (!finalCorporateClientId) {
        return [];
      }
      const response = await apiRequest(
        'GET',
        `/api/tenant-roles?corporate_client_id=${finalCorporateClientId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch tenant roles');
      }
      return response.json();
    },
    enabled: !!finalCorporateClientId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to fetch a single tenant role by ID
 */
export function useTenantRole(roleId: string | null) {
  return useQuery<TenantRole>({
    queryKey: ['tenant-role', roleId],
    queryFn: async () => {
      if (!roleId) {
        throw new Error('Role ID is required');
      }
      const response = await apiRequest('GET', `/api/tenant-roles/${roleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tenant role');
      }
      return response.json();
    },
    enabled: !!roleId,
  });
}

/**
 * Hook to fetch permissions for a tenant role
 */
export function useTenantRolePermissions(roleId: string | null) {
  return useQuery<RolePermission[]>({
    queryKey: ['tenant-role-permissions', roleId],
    queryFn: async () => {
      if (!roleId) {
        return [];
      }
      const response = await apiRequest('GET', `/api/tenant-roles/${roleId}/permissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch role permissions');
      }
      return response.json();
    },
    enabled: !!roleId,
  });
}

/**
 * Hook to create a new tenant role
 */
export function useCreateTenantRole() {
  const queryClient = useQueryClient();
  const { selectedCorporateClient } = useHierarchy();

  return useMutation({
    mutationFn: async (data: CreateTenantRoleData) => {
      const response = await apiRequest('POST', '/api/tenant-roles', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create tenant role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', selectedCorporateClient] });
    },
  });
}

/**
 * Hook to update a tenant role
 */
export function useUpdateTenantRole() {
  const queryClient = useQueryClient();
  const { selectedCorporateClient } = useHierarchy();

  return useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: UpdateTenantRoleData }) => {
      const response = await apiRequest('PUT', `/api/tenant-roles/${roleId}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update tenant role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', selectedCorporateClient] });
      queryClient.invalidateQueries({ queryKey: ['tenant-role'] });
    },
  });
}

/**
 * Hook to delete a tenant role
 */
export function useDeleteTenantRole() {
  const queryClient = useQueryClient();
  const { selectedCorporateClient } = useHierarchy();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const response = await apiRequest('DELETE', `/api/tenant-roles/${roleId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete tenant role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-roles', selectedCorporateClient] });
    },
  });
}

/**
 * Hook to add a permission to a tenant role
 */
export function useAddRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: AssignPermissionData }) => {
      const response = await apiRequest('POST', `/api/tenant-roles/${roleId}/permissions`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add permission');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-role-permissions', variables.roleId] });
    },
  });
}

/**
 * Hook to remove a permission from a tenant role
 */
export function useRemoveRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      const response = await apiRequest('DELETE', `/api/tenant-roles/${roleId}/permissions/${permissionId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove permission');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-role-permissions', variables.roleId] });
    },
  });
}

/**
 * Hook to bulk update permissions for a tenant role
 */
export function useBulkUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: string; permissions: AssignPermissionData[] }) => {
      const response = await apiRequest('POST', `/api/tenant-roles/${roleId}/permissions/bulk`, { permissions });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update permissions');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-role-permissions', variables.roleId] });
    },
  });
}











