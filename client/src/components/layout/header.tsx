import { Button } from "@/components/ui/button";
import { Plus, Monitor, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";

interface Organization {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  isActive: boolean;
}

interface HeaderProps {
  currentOrganization: string | Organization;
  kioskMode: boolean;
  setKioskMode: (kiosk: boolean) => void;
}

const organizationNames: Record<string, string> = {
  monarch_competency: "Monarch Competency",
  monarch_mental_health: "Monarch Mental Health", 
  monarch_sober_living: "Monarch Sober Living",
  monarch_launch: "Monarch Launch",
};

export default function Header({ currentOrganization, kioskMode, setKioskMode }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, logout } = useAuth();

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

  // Extract organization ID and name
  const orgId = typeof currentOrganization === 'string' ? currentOrganization : currentOrganization.id;
  const orgName = typeof currentOrganization === 'string' 
    ? (organizationNames[currentOrganization] || currentOrganization)
    : currentOrganization.name;

  return (
    <>
      <header className="shadow-sm border-b-2 px-6 flex items-center" style={{
        height: '146px',
        backgroundColor: 'var(--foundation-bg)',
        borderColor: 'var(--foundation-border)'
      }}>
        <div className="flex items-center justify-between w-full">
          {/* Left-aligned Time Display */}
          <div className="flex-1">
            <span className="text-4xl font-bold text-brutalist-h1" style={{ color: 'var(--foundation-text)' }}>{formatTime(currentTime)}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User Info - Email and Role on left, Avatar on right */}
            <div className="flex items-center space-x-3 border-l-2 pl-4" style={{ borderColor: 'var(--foundation-border)' }}>
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-brutalist-caption" style={{ color: 'var(--foundation-text)' }}>{user?.userName}</span>
                <span className="text-xs capitalize text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>{user?.role?.replace('_', ' ') || 'User'}</span>
              </div>
              {/* Larger User Avatar */}
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={`${user.userName}'s avatar`} 
                  className="w-12 h-12 rounded-full object-cover border-2"
                  style={{ borderColor: 'var(--foundation-border)' }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium" style={{
                  backgroundColor: 'var(--status-accent)',
                  color: 'var(--foundation-text)'
                }}>
                  {user?.userName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Logout Button */}
            <Button 
              onClick={handleLogout}
              variant="outline" 
              size="sm"
              className="border-2 font-bold uppercase tracking-wide hover-darker hover-shadow transition-all duration-200"
              style={{
                backgroundColor: 'var(--foundation-bg)',
                borderColor: 'var(--foundation-border)',
                color: 'var(--foundation-text)'
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              LOGOUT
            </Button>
          </div>
        </div>
      </header>

      {/* Floating Kiosk Mode Toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setKioskMode(!kioskMode)}
          className="p-4 rounded-full shadow-lg hover-shadow transition-all duration-200"
          size="icon"
          title="Toggle Kiosk Mode"
          style={{
            backgroundColor: 'var(--status-accent)',
            color: 'var(--foundation-text)'
          }}
        >
          <Monitor className="w-6 h-6" />
        </Button>
      </div>
    </>
  );
}
