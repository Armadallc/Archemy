/* @refresh reload */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './useAuth';
import { parseHierarchicalUrl } from '../lib/urlBuilder';

// Hierarchy levels
export type HierarchyLevel = 'corporate' | 'client' | 'program' | 'location';

// Scope types for the new scope-based navigation system
export type ScopeType = 'global' | 'corporate' | 'program';

// Hierarchy context interface
export interface HierarchyContextType {
  // Current hierarchy state
  level: HierarchyLevel;
  selectedCorporateClient: string | null;
  selectedProgram: string | null;
  selectedLocation: string | null;
  
  // New scope-based navigation state
  activeScope: ScopeType;
  activeScopeId: string | null; // ID of the active scope entity (corporate client ID or program ID)
  activeScopeName: string | null; // Display name of the active scope entity
  
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
  
  // New scope-based navigation action
  setScope: (scopeType: ScopeType, entityId?: string | null, entityName?: string | null) => void;
  
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
  const [location, setLocation] = useLocation();
  const [level, setLevel] = useState<HierarchyLevel>('corporate');
  const [selectedCorporateClient, setSelectedCorporateClient] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{
    level: HierarchyLevel;
    id: string;
    name: string;
  }>>([]);
  
  // New scope-based navigation state
  const [activeScope, setActiveScope] = useState<ScopeType>('global');
  const [activeScopeId, setActiveScopeId] = useState<string | null>(null);
  const [activeScopeName, setActiveScopeName] = useState<string | null>(null);

  // Sync scope state with URL query parameters (for scope-based navigation)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const scopeParam = urlParams.get('scope');
    const idParam = urlParams.get('id');
    
    // Only process scope params if they exist (don't override hierarchical URLs)
    if (scopeParam && (scopeParam === 'global' || scopeParam === 'corporate' || scopeParam === 'program')) {
      const scopeType = scopeParam as ScopeType;
      
      if (scopeType === 'global') {
        setActiveScope('global');
        setActiveScopeId(null);
        setActiveScopeName(null);
        // Also update hierarchy state for backward compatibility
        setLevel('corporate');
        setSelectedCorporateClient(null);
        setSelectedProgram(null);
        setSelectedLocation(null);
        setBreadcrumbs([]);
      } else if (scopeType === 'corporate' && idParam) {
        setActiveScope('corporate');
        setActiveScopeId(idParam);
        // Update hierarchy state for backward compatibility
        setLevel('client');
        setSelectedCorporateClient(idParam);
        setSelectedProgram(null);
        setSelectedLocation(null);
        setBreadcrumbs([{
          level: 'client',
          id: idParam,
          name: idParam // Will be replaced with actual name when available
        }]);
      } else if (scopeType === 'program' && idParam) {
        setActiveScope('program');
        setActiveScopeId(idParam);
        // Update hierarchy state for backward compatibility
        setLevel('program');
        setSelectedProgram(idParam);
        setSelectedLocation(null);
        // Keep corporate client if available
        if (selectedCorporateClient) {
          setBreadcrumbs([{
            level: 'client',
            id: selectedCorporateClient,
            name: selectedCorporateClient
          }, {
            level: 'program',
            id: idParam,
            name: idParam
          }]);
        }
      }
    }
  }, [location]); // Only depend on location to avoid infinite loops

  // Sync hierarchy state with URL params (for hierarchical URLs)
  useEffect(() => {
    const urlParams = parseHierarchicalUrl(location);
    const queryParams = new URLSearchParams(window.location.search);
    
    // Skip hierarchical URL parsing if scope query params are present (scope-based navigation takes precedence)
    if (queryParams.has('scope')) {
      return;
    }
    
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
        // Also update scope state for consistency
        setActiveScope('corporate');
        setActiveScopeId(urlParams.corporateClientId);
      }
      
      // Handle program ID: set it if present, clear it if not
      if (urlParams.programId) {
        if (urlParams.programId !== selectedProgram) {
          console.log('🔍 [useHierarchy] Setting program:', urlParams.programId);
          setSelectedProgram(urlParams.programId);
          setLevel('program');
          // Also update scope state
          setActiveScope('program');
          setActiveScopeId(urlParams.programId);
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
  }, [location, selectedCorporateClient, selectedProgram, level]);

  // Initialize based on user role
  useEffect(() => {
    if (!user) return;

    // Don't override if URL already sets hierarchy or scope
    const urlParams = parseHierarchicalUrl(location);
    const queryParams = new URLSearchParams(window.location.search);
    if (urlParams || queryParams.has('scope')) return;

    // Super admin starts at global scope (corporate level)
    if (user.role === 'super_admin') {
      setLevel('corporate');
      setSelectedCorporateClient(null);
      setSelectedProgram(null);
      setBreadcrumbs([]);
      setActiveScope('global');
      setActiveScopeId(null);
      setActiveScopeName(null);
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
        // Set scope state
        setActiveScope('corporate');
        setActiveScopeId(corporateClientId);
        setActiveScopeName(corporateClientId);
        
        // Only redirect to hierarchical URL on dashboard route (/) to avoid interfering with other routes
        // Other routes like /chat, /vehicles, /clients, /settings should work without redirect
        if (location === '/' && !location.startsWith(`/corporate-client/${corporateClientId}`)) {
          setLocation(`/corporate-client/${corporateClientId}`);
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
        // Set scope state
        setActiveScope('program');
        setActiveScopeId(user.primary_program_id);
        setActiveScopeName(user.primary_program_id);
      }
    }
  }, [user, location]);

  // New scope-based navigation function
  const setScope = (scopeType: ScopeType, entityId?: string | null, entityName?: string | null) => {
    const currentPath = location.split('?')[0]; // Get path without query params
    const urlParams = new URLSearchParams(window.location.search);
    
    // Update scope query parameters
    if (scopeType === 'global') {
      urlParams.set('scope', 'global');
      urlParams.delete('id');
      setActiveScope('global');
      setActiveScopeId(null);
      setActiveScopeName(null);
      // Also update hierarchy state for backward compatibility
      setLevel('corporate');
      setSelectedCorporateClient(null);
      setSelectedProgram(null);
      setSelectedLocation(null);
      setBreadcrumbs([]);
    } else if (scopeType === 'corporate' && entityId) {
      urlParams.set('scope', 'corporate');
      urlParams.set('id', entityId);
      setActiveScope('corporate');
      setActiveScopeId(entityId);
      setActiveScopeName(entityName || entityId);
      // Also update hierarchy state for backward compatibility
      setLevel('client');
      setSelectedCorporateClient(entityId);
      setSelectedProgram(null);
      setSelectedLocation(null);
      setBreadcrumbs([{
        level: 'client',
        id: entityId,
        name: entityName || entityId
      }]);
    } else if (scopeType === 'program' && entityId) {
      urlParams.set('scope', 'program');
      urlParams.set('id', entityId);
      setActiveScope('program');
      setActiveScopeId(entityId);
      setActiveScopeName(entityName || entityId);
      // Also update hierarchy state for backward compatibility
      setLevel('program');
      setSelectedProgram(entityId);
      setSelectedLocation(null);
      // Keep corporate client in breadcrumbs if available
      if (selectedCorporateClient) {
        setBreadcrumbs(prev => [
          prev.find(b => b.level === 'client') || {
            level: 'client',
            id: selectedCorporateClient,
            name: selectedCorporateClient
          },
          {
            level: 'program',
            id: entityId,
            name: entityName || entityId
          }
        ]);
      }
    }
    
    // Update URL with query parameters
    const newUrl = `${currentPath}?${urlParams.toString()}`;
    window.history.pushState(null, '', newUrl);
    setLocation(newUrl);
  };

  const navigateToCorporate = () => {
    setLevel('corporate');
    setSelectedCorporateClient(null);
    setSelectedProgram(null);
    setSelectedLocation(null);
    setBreadcrumbs([]);
    // Also update scope state
    setActiveScope('global');
    setActiveScopeId(null);
    setActiveScopeName(null);
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
    // Also update scope state
    setActiveScope('corporate');
    setActiveScopeId(clientId);
    setActiveScopeName(clientName);
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
    // Also update scope state
    setActiveScope('program');
    setActiveScopeId(programId);
    setActiveScopeName(programName);
    
    // Update URL for corporate admin (hierarchical URL)
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
    
    // Use scope-based state if available, otherwise fall back to hierarchy state
    if (activeScope === 'corporate' && activeScopeId) {
      params.corporateClientId = activeScopeId;
    } else if (activeScope === 'program' && activeScopeId) {
      params.programId = activeScopeId;
      // Also include corporate client if available
      if (selectedCorporateClient) {
        params.corporateClientId = selectedCorporateClient;
      }
    } else {
      // Fall back to hierarchy state for backward compatibility
      if (selectedCorporateClient) {
        params.corporateClientId = selectedCorporateClient;
      }
      
      if (selectedProgram) {
        params.programId = selectedProgram;
      }
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
    activeScope,
    activeScopeId,
    activeScopeName,
    breadcrumbs,
    navigateToCorporate,
    navigateToClient,
    navigateToProgram,
    navigateToLocation,
    goBack,
    setScope,
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

// Custom hook to access hierarchy context
export function useHierarchy() {
  const context = useContext(HierarchyContext);
  if (context === undefined) {
    throw new Error('useHierarchy must be used within a HierarchyProvider');
  }
  return context;
}

