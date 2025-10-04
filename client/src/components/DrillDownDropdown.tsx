import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Building2, FolderOpen, ArrowLeft } from 'lucide-react';
import { useHierarchy } from '../hooks/useHierarchy';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface CorporateClient {
  id: string;
  name: string;
  description?: string;
  programs: Array<{
    program_id: string;
    program_name: string;
  }>;
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
    goBack,
    getBreadcrumbPath 
  } = useHierarchy();
  
  const [isOpen, setIsOpen] = useState(false);
  const [corporateClients, setCorporateClients] = useState<CorporateClient[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch corporate clients and their programs
  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchCorporateClients();
    }
  }, [user]);

  const fetchCorporateClients = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('http://localhost:8081/api/corporate-clients', {
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
      setCorporateClients(data.corporateClients || []);
    } catch (error) {
      console.error('Error fetching corporate clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCorporateClientClick = (clientId: string, clientName: string) => {
    navigateToClient(clientId, clientName);
    setIsOpen(false);
  };

  const handleProgramClick = (programId: string, programName: string) => {
    navigateToProgram(programId, programName);
    setIsOpen(false);
  };

  const handleBackClick = () => {
    goBack();
    setIsOpen(false);
  };

  // Don't show for non-super-admin users
  if (user?.role !== 'super_admin') {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <Building2 className="w-4 h-4" />
        <span className="truncate max-w-48">
          {getBreadcrumbPath()}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {/* Back button */}
            {level !== 'corporate' && (
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to {level === 'client' ? 'Corporate' : 'Client'}
              </button>
            )}

            {/* Corporate level */}
            <button
              onClick={() => {
                navigateToCorporate();
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                level === 'corporate' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Corporate Dashboard
            </button>

            {/* Corporate Clients */}
            {level === 'corporate' && (
              <div className="border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Corporate Clients
                </div>
                {loading ? (
                  <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                ) : (
                  corporateClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleCorporateClientClick(
                        client.id, 
                        client.name
                      )}
                      className="flex items-center gap-2 w-full px-6 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ChevronRight className="w-3 h-3" />
                      {client.name || 'Unnamed Client'}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Programs for selected corporate client */}
            {level === 'client' && selectedCorporateClient && (
              <div className="border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Programs
                </div>
                {(() => {
                  const client = corporateClients.find(c => c.id === selectedCorporateClient);
                  return client?.programs.map((program) => (
                    <button
                      key={program.program_id}
                      onClick={() => handleProgramClick(program.program_id, program.program_name)}
                      className="flex items-center gap-2 w-full px-6 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FolderOpen className="w-3 h-3" />
                      {program.program_name}
                    </button>
                  ));
                })()}
              </div>
            )}

            {/* Current program info */}
            {level === 'program' && selectedProgram && (
              <div className="border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Current Program
                </div>
                <div className="flex items-center gap-2 px-6 py-2 text-sm text-gray-700 bg-blue-50">
                  <FolderOpen className="w-3 h-3" />
                  {selectedProgram}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
