import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Organization {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string | null;
  isActive: boolean;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  switchOrganization: (organizationId: string) => void;
  isLoading: boolean;
  refetchOrganization: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, setUser } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const queryClient = useQueryClient();

  // Fetch user's primary organization with aggressive cache invalidation
  const { data: organizationData, isLoading, refetch: refetchOrganization } = useQuery({
    queryKey: ["/api/organizations", user?.primaryOrganizationId],
    queryFn: async () => {
      if (!user?.primaryOrganizationId) return null;
      console.log('🔍 Fetching organization data for:', user.primaryOrganizationId);
      const response = await apiRequest("GET", `/api/organizations/${user.primaryOrganizationId}`);
      const data = await response.json();
      console.log('📊 Organization data fetched:', data);
      return data;
    },
    enabled: isAuthenticated && !!user?.primaryOrganizationId,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache at all
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Update current organization when data loads or user changes
  useEffect(() => {
    if (organizationData) {
      const newOrgData = {
        id: organizationData.id,
        name: organizationData.name,
        address: organizationData.address,
        phone: organizationData.phone,
        email: organizationData.email,
        logoUrl: organizationData.logo_url,
        isActive: organizationData.is_active
      };
      console.log('🏢 Setting organization from API data:', newOrgData);
      setCurrentOrganization(newOrgData);
    } else if (user?.primaryOrganizationId && isAuthenticated) {
      // Set organization directly from user data - this is critical for proper routing
      console.log('🏢 Setting organization from user data:', user.primaryOrganizationId);
      setCurrentOrganization({
        id: user.primaryOrganizationId,
        name: 'Loading...',
        isActive: true
      });
    } else if (!isAuthenticated) {
      // Clear organization when user logs out
      console.log('🏢 Clearing organization - user not authenticated');
      setCurrentOrganization(null);
    }
  }, [organizationData, user?.primaryOrganizationId, isAuthenticated]);

  // Force immediate organization update when user data loads
  useEffect(() => {
    console.log('🏢 Organization effect triggered:', {
      userOrgId: user?.primaryOrganizationId,
      isAuthenticated,
      currentOrgId: currentOrganization?.id,
      hasUser: !!user
    });
    
    if (user?.primaryOrganizationId && isAuthenticated && !currentOrganization) {
      console.log('🏢 Setting organization from user data:', user.primaryOrganizationId);
      setCurrentOrganization({
        id: user.primaryOrganizationId,
        name: user.primaryOrganizationId, // Use ID as fallback name
        isActive: true
      });
    }
  }, [user, isAuthenticated, currentOrganization]);

  const switchOrganization = (organizationId: string) => {
    if (user?.authorizedOrganizations?.includes(organizationId)) {
      console.log('🔄 Switching to organization:', organizationId);
      
      // Clear current organization state immediately
      setCurrentOrganization(null);
      
      // Aggressively clear all organization-related cache
      queryClient.removeQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      
      // Update user context with new primary organization
      setUser(prev => prev ? {
        ...prev,
        primaryOrganizationId: organizationId
      } : null);
      
      // Force immediate refetch after state update
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/organizations", organizationId] });
      }, 50);
    }
  };

  return (
    <OrganizationContext.Provider value={{ 
      currentOrganization, 
      setCurrentOrganization, 
      switchOrganization,
      isLoading,
      refetchOrganization
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}