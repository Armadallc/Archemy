import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronRight, Building2, FolderOpen, ArrowLeft, MapPin } from 'lucide-react';
import { useHierarchy } from '../hooks/useHierarchy';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface CorporateClient {
  id: string;
  name: string;
  description?: string;
  programs?: Array<{
    program_id: string;
    program_name: string;
  }>;
}

interface Location {
  id: string;
  name: string;
  program_id: string;
}

interface DrillDownDropdownProps {
  className?: string;
}

export function DrillDownDropdown({ className = '' }: DrillDownDropdownProps) {
  const { user } = useAuth();
  const { 
    level, 
    selectedCorporateClient, 
    selectedProgram, 
    navigateToCorporate, 
    navigateToClient, 
    navigateToProgram,
    navigateToLocation,
    goBack,
    getBreadcrumbPath,
    breadcrumbs
  } = useHierarchy();
  
  const [isOpen, setIsOpen] = useState(false);
  const [corporateClients, setCorporateClients] = useState<CorporateClient[]>([]);
  const [programs, setPrograms] = useState<Array<{ program_id: string; program_name: string }>>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  // Hover state for tree navigation
  const [hoveredClientId, setHoveredClientId] = useState<string | null>(null);
  const [hoveredProgramId, setHoveredProgramId] = useState<string | null>(null);
  const [hoveredProgramLocations, setHoveredProgramLocations] = useState<Location[]>([]);
  const [loadingHoveredLocations, setLoadingHoveredLocations] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data based on user role
  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchCorporateClients();
    } else if (user?.role === 'corporate_admin') {
      fetchCorporateAdminPrograms();
    } else if (user?.role === 'program_admin' || user?.role === 'program_user') {
      fetchProgramAdminLocations();
    }
  }, [user, selectedCorporateClient]); // Added selectedCorporateClient to dependencies

  // Fetch locations when a program is selected (for super_admin and corporate_admin)
  useEffect(() => {
    if (selectedProgram && (user?.role === 'super_admin' || user?.role === 'corporate_admin')) {
      fetchLocations();
    } else {
      setLocations([]);
    }
  }, [selectedProgram, user?.role]);

  // Close dropdown when clicking outside (same pattern as user menu)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.drilldown-menu-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchCorporateClients = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/corporate-clients`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // API returns an array directly, not wrapped in corporateClients
      const clients = Array.isArray(data) ? data : (data.corporateClients || []);
      
      // Fetch programs for each corporate client in parallel
      if (clients.length > 0) {
        const clientsWithPrograms = await Promise.all(
          clients.map(async (client: CorporateClient) => {
            try {
              const programsResponse = await fetch(`${apiBaseUrl}/api/programs/corporate-client/${client.id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                }
              });
              if (programsResponse.ok) {
                const programsData = await programsResponse.json();
                const programsList = Array.isArray(programsData) ? programsData : [];
                return {
                  ...client,
                  programs: programsList.map((p: any) => ({
                    program_id: p.program_id || p.id,
                    program_name: p.program_name || p.name || p.program_id || p.id
                  }))
                };
              }
            } catch (error) {
              console.error(`Error fetching programs for client ${client.id}:`, error);
            }
            return { ...client, programs: [] };
          })
        );
        
        // Update state with clients that have programs attached
        setCorporateClients(clientsWithPrograms);
      } else {
        setCorporateClients(clients);
      }
    } catch (error) {
      console.error('Error fetching corporate clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch programs for corporate admin
  const fetchCorporateAdminPrograms = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const corporateClientId = (user as any)?.corporate_client_id || selectedCorporateClient;
      if (!corporateClientId) {
        console.warn('⚠️ Corporate admin missing corporate_client_id');
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/programs/corporate-client/${corporateClientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const programsList = Array.isArray(data) ? data : [];
      setPrograms(programsList);
      
      // Debug logging (only in development)
      if (import.meta.env.DEV) {
        console.log('🔍 DrillDownDropdown: Fetched programs for corporate_client_id:', corporateClientId, 'Programs:', programsList);
      }
      
      // Auto-select program if corporate admin has only one program
      if (programsList.length === 1 && !selectedProgram) {
        const singleProgram = programsList[0];
        navigateToProgram(singleProgram.program_id, singleProgram.program_name);
      }
    } catch (error) {
      console.error('Error fetching corporate admin programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    if (!selectedProgram) return;
    
    setLoadingLocations(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/locations/program/${selectedProgram}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const locationsList = Array.isArray(data) ? data : [];
      setLocations(locationsList.map((loc: any) => ({
        id: loc.id,
        name: loc.name || loc.id,
        program_id: loc.program_id
      })));
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Fetch locations for a hovered program (for tree navigation)
  const fetchLocationsForProgram = async (programId: string) => {
    setLoadingHoveredLocations(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/locations/program/${programId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const locationsList = Array.isArray(data) ? data : [];
      setHoveredProgramLocations(locationsList.map((loc: any) => ({
        id: loc.id,
        name: loc.name || loc.id,
        program_id: loc.program_id
      })));
    } catch (error) {
      console.error('Error fetching locations for program:', error);
      setHoveredProgramLocations([]);
    } finally {
      setLoadingHoveredLocations(false);
    }
  };

  // Fetch locations for program admin/user (all locations in their program, or permitted only for program_user)
  const fetchProgramAdminLocations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const primaryProgramId = (user as any)?.primary_program_id;
      if (!primaryProgramId) {
        console.warn('⚠️ Program admin/user missing primary_program_id');
        setLocations([]);
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/locations/program/${primaryProgramId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const locationsList = Array.isArray(data) ? data : [];
      
      // For program_user, filter by permissions (if needed)
      // For now, we'll show all locations - permission filtering can be added later
      const filteredLocations = locationsList.map((loc: any) => ({
        id: loc.id,
        name: loc.name || loc.id,
        program_id: loc.program_id
      }));
      
      setLocations(filteredLocations);
      
      if (import.meta.env.DEV) {
        console.log('🔍 DrillDownDropdown: Fetched locations for program:', primaryProgramId, 'Locations:', filteredLocations);
      }
    } catch (error) {
      console.error('Error fetching program admin locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle hover on corporate client
  const handleClientHover = (clientId: string, event?: React.MouseEvent<HTMLDivElement>) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    // Find the client to check if it has programs
    const client = corporateClients.find(c => c.id === clientId);
    if (import.meta.env.DEV) {
      console.log('🔍 Hovering over client:', clientId, 'Programs:', client?.programs?.length || 0);
    }

    // Set hovered client after delay
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredClientId(clientId);
      setHoveredProgramId(null);
      setHoveredProgramLocations([]);
    }, 200);
  };

  // Handle mouse leave from corporate client
  const handleClientLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Delay hiding to allow moving to submenu
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredClientId(null);
      setHoveredProgramId(null);
      setHoveredProgramLocations([]);
    }, 300);
  };

  // Handle hover on program
  const handleProgramHover = (programId: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    // Set hovered program after delay and fetch locations
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredProgramId(programId);
      fetchLocationsForProgram(programId);
    }, 200);
  };

  // Handle mouse leave from program
  const handleProgramLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Delay hiding to allow moving to submenu
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredProgramId(null);
      setHoveredProgramLocations([]);
    }, 300);
  };

  // Keep submenu open when hovering over it
  const handleSubmenuEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const handleCorporateClientClick = (clientId: string, clientName: string) => {
    navigateToClient(clientId, clientName);
    setIsOpen(false);
    setHoveredClientId(null);
    setHoveredProgramId(null);
    setHoveredProgramLocations([]);
  };

  const handleProgramClick = (programId: string, programName: string) => {
    navigateToProgram(programId, programName);
    setIsOpen(false);
    setHoveredClientId(null);
    setHoveredProgramId(null);
    setHoveredProgramLocations([]);
  };

  const handleLocationClick = (locationId: string, locationName: string) => {
    navigateToLocation(locationId, locationName);
    setIsOpen(false);
    setHoveredClientId(null);
    setHoveredProgramId(null);
    setHoveredProgramLocations([]);
  };

  const handleBackClick = () => {
    goBack();
    setIsOpen(false);
  };

  // Helper function to remove corporate client prefix from program names
  const getShortProgramName = (programName: string, corporateClientName?: string): string => {
    if (!corporateClientName) {
      // Try to extract from program name if it starts with a known prefix
      const prefixes = ['Monarch ', 'monarch '];
      for (const prefix of prefixes) {
        if (programName.startsWith(prefix)) {
          return programName.substring(prefix.length);
        }
      }
      return programName;
    }
    
    // Remove corporate client name prefix (case-insensitive)
    const prefix = corporateClientName + ' ';
    if (programName.toLowerCase().startsWith(prefix.toLowerCase())) {
      return programName.substring(prefix.length);
    }
    return programName;
  };

  // Helper function to get breadcrumb text for program_admin/user
  const getProgramAdminBreadcrumb = (): string => {
    if (level === 'location' && selectedLocation) {
      const location = locations.find(loc => loc.id === selectedLocation);
      return location?.name || 'Location';
    }
    return 'All Locations';
  };

  // Helper function to get breadcrumb text based on role
  const getBreadcrumbText = (): string => {
    if (user?.role === 'program_admin' || user?.role === 'program_user') {
      return getProgramAdminBreadcrumb();
    }
    return getBreadcrumbPath().replace(/Corporate/g, 'CORPORATE');
  };

  // Show for all roles except driver
  if (!user || user.role === 'driver') {
    return null;
  }

  // For corporate_admin: Hide drilldown if they have only one program (simplified UX)
  // Only hide if we've loaded programs and there's <= 1 program
  if (user?.role === 'corporate_admin' && !loading && programs.length <= 1) {
    return null; // Hide drilldown for single-program corporate clients
  }

  const toggleDrilldown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative drilldown-menu-container ${className}`}>
      <button
        onClick={toggleDrilldown}
        className="flex items-center space-x-3 w-full p-2 rounded-lg transition-colors"
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div className="flex-1 min-w-0 text-left">
          <p className="truncate uppercase" style={{ color: 'var(--gray-12)', fontSize: '20px', fontWeight: 500 }}>
            {getBreadcrumbText()}
          </p>
        </div>
        <ChevronUp className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--gray-9)' }} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full rounded-lg shadow-lg z-50" style={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderWidth: 'var(--border-weight, 1px)', borderStyle: 'solid', marginTop: '20px' }}>
          <div className="rounded-lg py-2">
            {/* SUPER ADMIN: Corporate Client → Program Navigation */}
            {user?.role === 'super_admin' && (
              <>
                {/* Back button */}
                {level !== 'corporate' && (
                  <button
                    onClick={handleBackClick}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm"
                    style={{ color: 'var(--foreground)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {level === 'client' ? 'Corporate' : level === 'program' ? 'Client' : 'Program'}
                  </button>
                )}

                {/* Corporate Clients (always visible) */}
                <div style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px', borderTopStyle: 'solid' }}>
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                    Corporate Clients
                  </div>
                    {loading ? (
                      <div className="px-4 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>
                    ) : (
                      corporateClients.map((client) => {
                        const isHovered = hoveredClientId === client.id;
                        const isSelected = selectedCorporateClient === client.id;
                        const clientPrograms = client.programs || [];
                        
                        if (import.meta.env.DEV && isHovered) {
                          console.log('🔍 Rendering submenu for client:', client.id, 'Programs count:', clientPrograms.length);
                        }
                        
                        return (
                          <div
                            key={client.id}
                            className="relative"
                            onMouseEnter={(e) => handleClientHover(client.id, e)}
                            onMouseLeave={handleClientLeave}
                          >
                            <button
                              onClick={() => handleCorporateClientClick(
                                client.id, 
                                client.name
                              )}
                              className="flex items-center gap-2 w-full px-6 py-2 text-sm relative"
                              style={{
                                color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                                backgroundColor: isHovered 
                                  ? 'rgba(204, 51, 171, 0.15)' 
                                  : isSelected 
                                    ? 'rgba(204, 51, 171, 0.1)' 
                                    : 'transparent',
                                transition: 'background-color 0.15s ease'
                              }}
                            >
                              <ChevronRight className="w-3 h-3" />
                              {client.name || 'Unnamed Client'}
                            </button>
                            
                            {/* Programs submenu on hover - INLINE */}
                            {isHovered && clientPrograms.length > 0 && (
                              <div className="ml-4 border-l-2" style={{ borderColor: 'var(--border)' }}>
                                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                                  Programs
                                </div>
                                {clientPrograms.map((program) => {
                                  const isProgramHovered = hoveredProgramId === program.program_id;
                                  const isProgramSelected = selectedProgram === program.program_id;
                                  const shortProgramName = getShortProgramName(program.program_name, client.name);
                                  
                                  return (
                                    <div
                                      key={program.program_id}
                                      className="relative"
                                      onMouseEnter={() => handleProgramHover(program.program_id)}
                                      onMouseLeave={handleProgramLeave}
                                    >
                                      <button
                                        onClick={() => handleProgramClick(program.program_id, program.program_name)}
                                        className="flex items-center gap-2 w-full px-6 py-2 text-sm"
                                        style={{
                                          color: isProgramSelected ? 'var(--primary)' : 'var(--foreground)',
                                          backgroundColor: isProgramHovered 
                                            ? 'rgba(204, 51, 171, 0.15)' 
                                            : isProgramSelected 
                                              ? 'rgba(204, 51, 171, 0.1)' 
                                              : 'transparent',
                                          transition: 'background-color 0.15s ease'
                                        }}
                                      >
                                        <ChevronRight className="w-3 h-3" />
                                        <FolderOpen className="w-3 h-3" />
                                        {shortProgramName}
                                      </button>
                                      
                                      {/* Locations submenu on hover - INLINE */}
                                      {isProgramHovered && (
                                        <div className="ml-4 border-l-2" style={{ borderColor: 'var(--border)' }}>
                                          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                                            Locations
                                          </div>
                                          {loadingHoveredLocations ? (
                                            <div className="px-6 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>
                                          ) : hoveredProgramLocations.length === 0 ? (
                                            <div className="px-6 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>No locations found</div>
                                          ) : (
                                            hoveredProgramLocations.map((location) => (
                                              <button
                                                key={location.id}
                                                onClick={() => handleLocationClick(location.id, location.name)}
                                                className="flex items-center gap-2 w-full px-6 py-2 text-sm"
                                                style={{ 
                                                  color: 'var(--foreground)',
                                                  backgroundColor: 'transparent',
                                                  transition: 'background-color 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(204, 51, 171, 0.15)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                              >
                                                <MapPin className="w-3 h-3" />
                                                {location.name}
                                              </button>
                                            ))
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                {/* Current location info */}
                {level === 'location' && (
                  <div style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px', borderTopStyle: 'solid' }}>
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                      Current Location
                    </div>
                    <div className="flex items-center gap-2 px-6 py-2 text-sm" style={{ color: 'var(--primary)', backgroundColor: 'rgba(204, 51, 171, 0.1)' }}>
                      <MapPin className="w-3 h-3" />
                      {breadcrumbs.find(b => b.level === 'location')?.name || 'Unknown Location'}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CORPORATE ADMIN: Program Selection Only */}
            {user?.role === 'corporate_admin' && (
              <>
                {/* Back button */}
                {level !== 'client' && (
                  <button
                    onClick={handleBackClick}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm"
                    style={{ color: 'var(--foreground)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {level === 'program' ? 'All Programs' : 'Program'}
                  </button>
                )}

                {/* Corporate Admin Dashboard (All Programs View) */}
                <button
                  onClick={() => {
                    // Navigate to corporate client level (their own corporate client)
                    const corporateClientId = (user as any)?.corporate_client_id || selectedCorporateClient;
                    if (corporateClientId) {
                      navigateToClient(corporateClientId, corporateClientId);
                    } else {
                      navigateToCorporate();
                    }
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm"
                  style={{
                    backgroundColor: !selectedProgram ? 'rgba(204, 51, 171, 0.1)' : 'transparent',
                    color: !selectedProgram ? 'var(--primary)' : 'var(--foreground)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProgram) {
                      e.currentTarget.style.backgroundColor = 'var(--muted)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProgram) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Building2 className="w-4 h-4" />
                  All Programs
                </button>

                {/* Programs List (always visible) */}
                <div style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px', borderTopStyle: 'solid' }}>
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                    Programs
                  </div>
                    {loading ? (
                      <div className="px-4 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>
                    ) : (
                      programs.map((program) => {
                        const isProgramHovered = hoveredProgramId === program.program_id;
                        const isProgramSelected = selectedProgram === program.program_id;
                        // For corporate_admin, get the corporate client name from user context
                        const corporateClientName = (user as any)?.corporate_client_id || selectedCorporateClient;
                        const shortProgramName = getShortProgramName(program.program_name, corporateClientName);
                        
                        return (
                          <div
                            key={program.program_id}
                            className="relative"
                            onMouseEnter={() => handleProgramHover(program.program_id)}
                            onMouseLeave={handleProgramLeave}
                          >
                            <button
                              onClick={() => handleProgramClick(program.program_id, program.program_name)}
                              className="flex items-center gap-2 w-full px-6 py-2 text-sm"
                              style={{
                                color: isProgramSelected ? 'var(--primary)' : 'var(--foreground)',
                                backgroundColor: isProgramHovered 
                                  ? 'rgba(204, 51, 171, 0.15)' 
                                  : isProgramSelected 
                                    ? 'rgba(204, 51, 171, 0.1)' 
                                    : 'transparent',
                                transition: 'background-color 0.15s ease'
                              }}
                            >
                              <ChevronRight className="w-3 h-3" />
                              <FolderOpen className="w-3 h-3" />
                              {shortProgramName}
                            </button>
                            
                            {/* Locations submenu on hover - INLINE */}
                            {isProgramHovered && (
                              <div className="ml-4 border-l-2" style={{ borderColor: 'var(--border)' }}>
                                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                                  Locations
                                </div>
                                {loadingHoveredLocations ? (
                                  <div className="px-6 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>
                                ) : hoveredProgramLocations.length === 0 ? (
                                  <div className="px-6 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>No locations found</div>
                                ) : (
                                  hoveredProgramLocations.map((location) => (
                                    <button
                                      key={location.id}
                                      onClick={() => handleLocationClick(location.id, location.name)}
                                      className="flex items-center gap-2 w-full px-6 py-2 text-sm"
                                      style={{ 
                                        color: 'var(--foreground)',
                                        backgroundColor: 'transparent',
                                        transition: 'background-color 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(204, 51, 171, 0.15)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <MapPin className="w-3 h-3" />
                                      {location.name}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                {/* Current location info */}
                {level === 'location' && (
                  <div style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px', borderTopStyle: 'solid' }}>
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                      Current Location
                    </div>
                    <div className="flex items-center gap-2 px-6 py-2 text-sm" style={{ color: 'var(--primary)', backgroundColor: 'rgba(204, 51, 171, 0.1)' }}>
                      <MapPin className="w-3 h-3" />
                      {breadcrumbs.find(b => b.level === 'location')?.name || 'Unknown Location'}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* PROGRAM ADMIN/USER: Location Navigation Only */}
            {(user?.role === 'program_admin' || user?.role === 'program_user') && (
              <>
                {/* All Locations button (if at location level) */}
                {level === 'location' && (
                  <button
                    onClick={() => {
                      // Navigate back to program level
                      const primaryProgramId = (user as any)?.primary_program_id;
                      if (primaryProgramId) {
                        // Get program name from breadcrumbs or use program ID
                        const programBreadcrumb = breadcrumbs.find(b => b.level === 'program');
                        const programName = programBreadcrumb?.name || primaryProgramId;
                        navigateToProgram(primaryProgramId, programName);
                      }
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm"
                    style={{ color: 'var(--foreground)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    All Locations
                  </button>
                )}

                {/* All Locations option (when at program level) */}
                {level === 'program' && (
                  <button
                    onClick={() => {
                      // Already at program level, just close menu
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm"
                    style={{
                      backgroundColor: 'rgba(204, 51, 171, 0.1)',
                      color: 'var(--primary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(204, 51, 171, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(204, 51, 171, 0.1)';
                    }}
                  >
                    <Building2 className="w-4 h-4" />
                    All Locations
                  </button>
                )}

                {/* Locations List (always visible) */}
                <div style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px', borderTopStyle: 'solid' }}>
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                    Locations
                  </div>
                  {loading ? (
                    <div className="px-4 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>
                  ) : locations.length === 0 ? (
                    <div className="px-6 py-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>No locations found</div>
                  ) : (
                    locations.map((location) => {
                      const isSelected = selectedLocation === location.id;
                      return (
                        <button
                          key={location.id}
                          onClick={() => handleLocationClick(location.id, location.name)}
                          className="flex items-center gap-2 w-full px-6 py-2 text-sm"
                          style={{
                            color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                            backgroundColor: isSelected 
                              ? 'rgba(204, 51, 171, 0.1)' 
                              : 'transparent',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'rgba(204, 51, 171, 0.15)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <MapPin className="w-3 h-3" />
                          {location.name}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Current location info */}
                {level === 'location' && selectedLocation && (
                  <div style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px', borderTopStyle: 'solid' }}>
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                      Current Location
                    </div>
                    <div className="flex items-center gap-2 px-6 py-2 text-sm" style={{ color: 'var(--primary)', backgroundColor: 'rgba(204, 51, 171, 0.1)' }}>
                      <MapPin className="w-3 h-3" />
                      {locations.find(loc => loc.id === selectedLocation)?.name || 'Unknown Location'}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
