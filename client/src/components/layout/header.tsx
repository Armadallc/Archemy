import React from "react";
import { Building, Building2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";

interface Program {
  id: string;
  name: string;
  description?: string;
  corporate_client_id: string;
  corporateClient?: {
    id: string;
    name: string;
  };
  is_active: boolean;
}

interface CorporateClient {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  is_active: boolean;
}

interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  contact_person?: string;
  program_id: string;
  program?: {
    id: string;
    name: string;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
  is_active: boolean;
}

interface HeaderProps {
  currentProgram: string | Program;
  kioskMode: boolean;
  setKioskMode: (kiosk: boolean) => void;
}

const programNames: Record<string, string> = {
  monarch_competency: "Monarch Competency",
  monarch_mental_health: "Monarch Mental Health", 
  monarch_sober_living: "Monarch Sober Living",
  monarch_launch: "Monarch Launch",
};

export default function Header({ currentProgram, kioskMode, setKioskMode }: HeaderProps) {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();



  // Get program name
  const getProgramName = () => {
    if (selectedProgram) {
      return programNames[selectedProgram] || selectedProgram;
    }
    if (typeof currentProgram === 'string') {
      return programNames[currentProgram] || currentProgram;
    }
    if (currentProgram?.name) {
      return currentProgram.name;
    }
    return "Select Program";
  };

  // Get corporate client name
  const getCorporateClientName = () => {
    if (selectedCorporateClient) {
      return selectedCorporateClient;
    }
    return "Select Corporate Client";
  };

  // Get location name
  const getLocationName = () => {
    return "All Locations";
  };

  return (
    <header 
      className="border-b px-6 py-4"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Hierarchy selector and context */}
        <div className="flex items-center space-x-4">
          {/* Program info for other roles */}
          {user?.role !== 'super_admin' && user?.role !== 'corporate_admin' && (
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {getProgramName()}
              </span>
            </div>
          )}
          
          {/* Show corporate client name for corporate_admin */}
          {user?.role === 'corporate_admin' && selectedCorporateClient && (
            <div className="flex items-center space-x-2" style={{ color: 'var(--muted-foreground)' }}>
              <Building2 className="w-4 h-4" />
              <span className="text-sm">
                {getCorporateClientName()}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}