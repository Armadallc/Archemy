import React, { useState, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, Building2, FolderOpen, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHierarchy, ScopeType } from '../hooks/useHierarchy';
import { apiRequest } from '../lib/queryClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from './ui/select';

interface CorporateClient {
  id: string;
  name: string;
}

interface Program {
  id: string;
  program_name: string;
  name?: string;
}

function HeaderScopeSelectorComponent() {
  const { user } = useAuth();
  const { activeScope, activeScopeId, activeScopeName, setScope } = useHierarchy();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch corporate clients (for super admin)
  const { data: corporateClients = [], isLoading: loadingClients } = useQuery<CorporateClient[]>({
    queryKey: ['/api/corporate-clients', 'scope-selector'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate-clients');
      const data = await response.json();
      // Normalize the response
      if (Array.isArray(data)) {
        return data.map((client: any) => ({
          id: client.id || client.corporate_client_id || '',
          name: client.name || '',
        })).filter((client: CorporateClient) => client.id && client.name);
      }
      return [];
    },
    enabled: user?.role === 'super_admin',
    staleTime: 600000, // 10 minutes - static list
  });

  // Fetch programs (for corporate admin)
  const corporateClientId = (user as any)?.corporate_client_id;
  const { data: programs = [], isLoading: loadingPrograms } = useQuery<Program[]>({
    queryKey: ['/api/programs', 'corporate-client', corporateClientId, 'scope-selector'],
    queryFn: async () => {
      if (!corporateClientId) return [];
      const response = await apiRequest('GET', `/api/programs/corporate-client/${corporateClientId}`);
      const data = await response.json();
      // Normalize the response
      if (Array.isArray(data)) {
        return data.map((program: any) => ({
          id: program.id || program.program_id || '',
          program_name: program.program_name || program.name || '',
          name: program.name || program.program_name || '',
        })).filter((program: Program) => program.id && (program.program_name || program.name));
      }
      return [];
    },
    enabled: user?.role === 'corporate_admin' && !!corporateClientId,
    staleTime: 600000, // 10 minutes - static list
  });

  // Don't show for drivers or program_admin/program_user (they only have one program)
  if (!user || user.role === 'driver' || user.role === 'program_admin' || user.role === 'program_user') {
    return null;
  }

  // Get display text for current scope
  const getScopeDisplay = () => {
    if (activeScope === 'global') {
      return (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span>Global Dashboard</span>
        </div>
      );
    } else if (activeScope === 'corporate' && activeScopeName) {
      return (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span className="truncate max-w-[200px]">{activeScopeName}</span>
        </div>
      );
    } else if (activeScope === 'program' && activeScopeName) {
      return (
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          <span className="truncate max-w-[200px]">{activeScopeName}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4" />
        <span>Global Dashboard</span>
      </div>
    );
  };

  const handleScopeChange = (value: string) => {
    if (value === 'global') {
      setScope('global');
    } else if (value.startsWith('corporate:')) {
      const clientId = value.replace('corporate:', '');
      const client = corporateClients.find(c => c.id === clientId);
      setScope('corporate', clientId, client?.name || clientId);
    } else if (value.startsWith('program:')) {
      const programId = value.replace('program:', '');
      const program = programs.find(p => p.id === programId);
      setScope('program', programId, program?.program_name || program?.name || programId);
    }
  };

  // Build the current value for the select
  const getCurrentValue = () => {
    if (activeScope === 'global') return 'global';
    if (activeScope === 'corporate' && activeScopeId) return `corporate:${activeScopeId}`;
    if (activeScope === 'program' && activeScopeId) return `program:${activeScopeId}`;
    return 'global';
  };

  return (
    <Select
      value={getCurrentValue()}
      onValueChange={handleScopeChange}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger
        className="w-[240px] sm:w-[200px] h-9 sm:h-10 text-sm card-neu-flat hover:card-neu"
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          border: 'none',
        }}
      >
        <SelectValue>
          {getScopeDisplay()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        className="card-neu [&]:shadow-none"
        style={{ backgroundColor: 'var(--background)', border: 'none' }}
      >
        {/* Global option - always first */}
        <SelectItem 
          value="global"
          className="hover:card-neu-flat"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Global Dashboard</span>
          </div>
        </SelectItem>

        <SelectSeparator />

        {/* Super Admin: Show corporate clients */}
        {user?.role === 'super_admin' && (
          <>
            {loadingClients ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
            ) : corporateClients.length > 0 ? (
              corporateClients.map((client) => (
                <SelectItem 
                  key={client.id} 
                  value={`corporate:${client.id}`}
                  className="hover:card-neu-flat"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{client.name}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No corporate clients</div>
            )}
          </>
        )}

        {/* Corporate Admin: Show programs */}
        {user?.role === 'corporate_admin' && (
          <>
            {loadingPrograms ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
            ) : programs.length > 0 ? (
              programs.map((program) => (
                <SelectItem 
                  key={program.id} 
                  value={`program:${program.id}`}
                  className="hover:card-neu-flat"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>{program.program_name || program.name}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No programs</div>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

// Memoize to prevent unnecessary re-renders
export const HeaderScopeSelector = memo(HeaderScopeSelectorComponent);






