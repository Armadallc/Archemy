import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './useAuth';
import { parseHierarchicalUrl } from '../lib/urlBuilder';

// Hierarchy levels
export type HierarchyLevel = 'corporate' | 'client' | 'program' | 'location';

// Hierarchy context interface
export interface HierarchyContextType {
  // Current hierarchy state
  level: HierarchyLevel;
  selectedCorporateClient: string | null;
  selectedProgram: string | null;
  selectedLocation: string | null;
  
  // Navigation state
  breadcrumbs: Array<{
    level: HierarchyLevel;
    id: string;
    name: string;
  }>;
  
  // Actions
  navigateToCorporate: () => void;
  navigateToClient: (clientId: string, clientName: string) => void;
  navigateToProgram: (programId: string, programName: string) => void;
  navigateToLocation: (locationId: string, locationName: string) => void;
  goBack: () => void;
  
  // Data filtering helpers
  getFilterParams: () => {
    corporateClientId?: string;
    programId?: string;
    locationId?: string;
  };
  
  // UI helpers
  getPageTitle: () => string;
  getBreadcrumbPath: () => string;
}

const HierarchyContext = createContext<HierarchyContextType | undefined>(undefined);

export function HierarchyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [level, setLevel] = useState<HierarchyLevel>('corporate');
  const [selectedCorporateClient, setSelectedCorporateClient] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{
    level: HierarchyLevel;
    id: string;
    name: string;
  }>>([]);

  // Sync hierarchy state with URL params (for hierarchical URLs)
  useEffect(() => {
    const urlParams = parseHierarchicalUrl(location);
    console.log('🔍 [useHierarchy] URL parsing:', {
      location,
      urlParams,
      currentLevel: level,
      currentSelectedCorporateClient: selectedCorporateClient,
      currentSelectedProgram: selectedProgram
    });
    if (urlParams) {
      // URL contains hierarchical structure, sync state
      if (urlParams.corporateClientId && urlParams.corporateClientId !== selectedCorporateClient) {
        console.log('🔍 [useHierarchy] Setting corporate client:', urlParams.corporateClientId);
        setSelectedCorporateClient(urlParams.corporateClientId);
      }
      
      // Handle program ID: set it if present, clear it if not
      if (urlParams.programId) {
        if (urlParams.programId !== selectedProgram) {
          console.log('🔍 [useHierarchy] Setting program:', urlParams.programId);
          setSelectedProgram(urlParams.programId);
          setLevel('program');
        }
      } else {
        // No program in URL - clear program selection and set level to 'client'
        if (selectedProgram !== null) {
          console.log('🔍 [useHierarchy] Clearing program (no program in URL)');
          setSelectedProgram(null);
        }
        if (urlParams.corporateClientId && level !== 'client') {
          console.log('🔍 [useHierarchy] Setting level to client (corporate client view)');
          setLevel('client');
        }
      }
    }
  }, [location, selectedCorporateClient, selectedProgram]);

  // Initialize based on user role
  useEffect(() => {
    if (!user) return;

    // Don't override if URL already sets hierarchy
    const urlParams = parseHierarchicalUrl(location);
    if (urlParams) return;

    // Super admin starts at corporate level
    if (user.role === 'super_admin') {
      setLevel('corporate');
      setSelectedCorporateClient(null);
      setSelectedProgram(null);
      setBreadcrumbs([]);
    }
    // Corporate admin starts at their corporate client level
    // Use corporate_client_id directly from user object (backend returns it at top level)
    else if (user.role === 'corporate_admin') {
      const corporateClientId = (user as any).corporate_client_id || user.program?.corporateClient?.id;
      if (corporateClientId) {
        setLevel('client');
        setSelectedCorporateClient(corporateClientId);
        setSelectedProgram(null);
        setBreadcrumbs([{
          level: 'client',
          id: corporateClientId,
          name: corporateClientId // Will be replaced with actual name when available
        }]);
        
        // Redirect to hierarchical URL if not already there (only on initial load)
        if (!location.startsWith(`/corporate-client/${corporateClientId}`)) {
          const currentPath = location === '/' ? '' : location;
          window.history.replaceState(null, '', `/corporate-client/${corporateClientId}${currentPath}`);
        }
      } else {
        console.warn('⚠️ Corporate admin user missing corporate_client_id:', user);
      }
    }
    // Program admin/user starts at their program level
    else if (user.role === 'program_admin' || user.role === 'program_user') {
      if (user.primary_program_id) {
        setLevel('program');
        setSelectedProgram(user.primary_program_id);
        setSelectedCorporateClient(user.program?.corporateClient?.id || null);
        setBreadcrumbs([
          {
            level: 'client',
            id: user.program?.corporateClient?.id || '',
            name: user.program?.corporateClient?.name || ''
          },
          {
            level: 'program',
            id: user.primary_program_id,
            name: user.primary_program_id // Will be replaced with actual name
          }
        ]);
      }
    }
  }, [user]);

  const navigateToCorporate = () => {
    setLevel('corporate');
    setSelectedCorporateClient(null);
    setSelectedProgram(null);
    setSelectedLocation(null);
    setBreadcrumbs([]);
  };

  const navigateToClient = (clientId: string, clientName: string) => {
    setLevel('client');
    setSelectedCorporateClient(clientId);
    setSelectedProgram(null);
    setSelectedLocation(null);
    setBreadcrumbs([{
      level: 'client',
      id: clientId,
      name: clientName
    }]);
  };

  const navigateToProgram = (programId: string, programName: string) => {
    setLevel('program');
    setSelectedProgram(programId);
    setSelectedLocation(null);
    setBreadcrumbs(prev => [
      ...prev.slice(0, 1), // Keep corporate client
      {
        level: 'program',
        id: programId,
        name: programName
      }
    ]);
    
    // Update URL for corporate admin
    if (user?.role === 'corporate_admin' && selectedCorporateClient) {
      window.history.pushState(null, '', `/corporate-client/${selectedCorporateClient}/program/${programId}/`);
    }
  };

  const navigateToLocation = (locationId: string, locationName: string) => {
    setLevel('location');
    setSelectedLocation(locationId);
    setBreadcrumbs(prev => [
      ...prev.slice(0, 2), // Keep corporate client and program
      {
        level: 'location',
        id: locationId,
        name: locationName
      }
    ]);
  };

  const goBack = () => {
    if (breadcrumbs.length <= 1) {
      navigateToCorporate();
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      const lastBreadcrumb = newBreadcrumbs[newBreadcrumbs.length - 1];
      
      if (lastBreadcrumb.level === 'location') {
        setLevel('program');
        setSelectedLocation(null);
      } else if (lastBreadcrumb.level === 'program') {
        setLevel('client');
        setSelectedProgram(null);
        setSelectedLocation(null);
      } else if (lastBreadcrumb.level === 'client') {
        setLevel('client');
        setSelectedCorporateClient(lastBreadcrumb.id);
        setSelectedProgram(null);
        setSelectedLocation(null);
      } else {
        setLevel('corporate');
        setSelectedCorporateClient(null);
        setSelectedProgram(null);
        setSelectedLocation(null);
      }
      
      setBreadcrumbs(newBreadcrumbs);
    }
  };

  const getFilterParams = () => {
    const params: { corporateClientId?: string; programId?: string; locationId?: string } = {};
    
    if (selectedCorporateClient) {
      params.corporateClientId = selectedCorporateClient;
    }
    
    if (selectedProgram) {
      params.programId = selectedProgram;
    }
    
    if (selectedLocation) {
      params.locationId = selectedLocation;
    }
    
    return params;
  };

  const getPageTitle = () => {
    if (level === 'corporate') {
      return 'Corporate Dashboard';
    } else if (level === 'client') {
      return selectedCorporateClient ? `${selectedCorporateClient} Dashboard` : 'Client Dashboard';
    } else if (level === 'program') {
      return selectedProgram ? `${selectedProgram} Dashboard` : 'Program Dashboard';
    } else {
      return selectedLocation ? `${selectedLocation} Dashboard` : 'Location Dashboard';
    }
  };

  const getBreadcrumbPath = () => {
    if (breadcrumbs.length === 0) {
      return 'Corporate';
    }
    
    return breadcrumbs.map(b => b.name).join(' > ');
  };

  const value: HierarchyContextType = {
    level,
    selectedCorporateClient,
    selectedProgram,
    selectedLocation,
    breadcrumbs,
    navigateToCorporate,
    navigateToClient,
    navigateToProgram,
    navigateToLocation,
    goBack,
    getFilterParams,
    getPageTitle,
    getBreadcrumbPath,
  };

  return (
    <HierarchyContext.Provider value={value}>
      {children}
    </HierarchyContext.Provider>
  );
}

export function useHierarchy() {
  const context = useContext(HierarchyContext);
  if (context === undefined) {
    throw new Error('useHierarchy must be used within a HierarchyProvider');
  }
  return context;
}


