import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Plus, Monitor, LogOut, User, Building, Building2, MapPin } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { ThemeToggle } from "../theme-toggle";

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
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, logout } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleLogout = () => {
    logout();
  };

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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Program info */}
        <div className="flex items-center space-x-4">
          {/* Only show program info for non-super admin users */}
          {user?.role !== 'super_admin' && (
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                {getProgramName()}
              </span>
            </div>
          )}
          
          {selectedCorporateClient && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">
                {getCorporateClientName()}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">
              {getLocationName()}
            </span>
          </div>
        </div>

        {/* Center - Time and Kiosk mode */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {formatTime(currentTime)}
          </div>
          
          <Button
            variant={kioskMode ? "default" : "outline"}
            size="sm"
            onClick={() => setKioskMode(!kioskMode)}
            className="flex items-center space-x-2"
          >
            <Monitor className="w-4 h-4" />
            <span>{kioskMode ? "Exit Kiosk" : "Kiosk Mode"}</span>
          </Button>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {user && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                <span className={`text-sm font-medium text-white ${user.avatar_url ? 'hidden' : ''}`}>
                  {user.user_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {user.user_name || user.email}
                </div>
                <div className="text-gray-500 capitalize">
                  {user.role?.replace('_', ' ')}
                </div>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}