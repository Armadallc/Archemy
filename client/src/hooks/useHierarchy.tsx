import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';

// Hierarchy levels
export type HierarchyLevel = 'corporate' | 'client' | 'program';

// Hierarchy context interface
export interface HierarchyContextType {
  // Current hierarchy state
  level: HierarchyLevel;
  selectedCorporateClient: string | null;
  selectedProgram: string | null;
  
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
  goBack: () => void;
  
  // Data filtering helpers
  getFilterParams: () => {
    corporateClientId?: string;
    programId?: string;
  };
  
  // UI helpers
  getPageTitle: () => string;
  getBreadcrumbPath: () => string;
}

const HierarchyContext = createContext<HierarchyContextType | undefined>(undefined);

export function HierarchyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [level, setLevel] = useState<HierarchyLevel>('corporate');
  const [selectedCorporateClient, setSelectedCorporateClient] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{
    level: HierarchyLevel;
    id: string;
    name: string;
  }>>([]);

  // Initialize based on user role
  useEffect(() => {
    if (!user) return;

    // Super admin starts at corporate level
    if (user.role === 'super_admin') {
      setLevel('corporate');
      setSelectedCorporateClient(null);
      setSelectedProgram(null);
      setBreadcrumbs([]);
    }
    // Corporate admin starts at their corporate client level
    else if (user.role === 'corporate_admin' && user.program?.corporateClient?.id) {
      setLevel('client');
      setSelectedCorporateClient(user.program.corporateClient.id);
      setSelectedProgram(null);
      setBreadcrumbs([{
        level: 'client',
        id: user.program.corporateClient.id,
        name: user.program.corporateClient.name
      }]);
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
    setBreadcrumbs([]);
  };

  const navigateToClient = (clientId: string, clientName: string) => {
    setLevel('client');
    setSelectedCorporateClient(clientId);
    setSelectedProgram(null);
    setBreadcrumbs([{
      level: 'client',
      id: clientId,
      name: clientName
    }]);
  };

  const navigateToProgram = (programId: string, programName: string) => {
    setLevel('program');
    setSelectedProgram(programId);
    setBreadcrumbs(prev => [
      ...prev.slice(0, 1), // Keep corporate client
      {
        level: 'program',
        id: programId,
        name: programName
      }
    ]);
  };

  const goBack = () => {
    if (breadcrumbs.length <= 1) {
      navigateToCorporate();
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      const lastBreadcrumb = newBreadcrumbs[newBreadcrumbs.length - 1];
      
      if (lastBreadcrumb.level === 'client') {
        setLevel('client');
        setSelectedCorporateClient(lastBreadcrumb.id);
        setSelectedProgram(null);
      } else {
        setLevel('corporate');
        setSelectedCorporateClient(null);
        setSelectedProgram(null);
      }
      
      setBreadcrumbs(newBreadcrumbs);
    }
  };

  const getFilterParams = () => {
    const params: { corporateClientId?: string; programId?: string } = {};
    
    if (selectedCorporateClient) {
      params.corporateClientId = selectedCorporateClient;
    }
    
    if (selectedProgram) {
      params.programId = selectedProgram;
    }
    
    return params;
  };

  const getPageTitle = () => {
    if (level === 'corporate') {
      return 'Corporate Dashboard';
    } else if (level === 'client') {
      return selectedCorporateClient ? `${selectedCorporateClient} Dashboard` : 'Client Dashboard';
    } else {
      return selectedProgram ? `${selectedProgram} Dashboard` : 'Program Dashboard';
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
    breadcrumbs,
    navigateToCorporate,
    navigateToClient,
    navigateToProgram,
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


