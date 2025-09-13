import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { 
  Home, 
  Route, 
  Users, 
  Car, 
  MapPin, 
  Calendar, 
  Settings,
  UserCheck,
  Smartphone,
  Shield,
  Star,
  Palette,
  Zap,
  Webhook,
  Menu,
  ChevronLeft,
  DollarSign
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

interface SidebarProps {
  currentOrganization?: string;
  setCurrentOrganization?: (org: string) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const organizationOptions = [
  { value: "monarch_competency", label: "Monarch Competency" },
  { value: "monarch_mental_health", label: "Monarch Mental Health" },
  { value: "monarch_sober_living", label: "Monarch Sober Living" },
  { value: "monarch_launch", label: "Monarch Launch" },
];

const roleOptions = [
  { value: "organization_admin", label: "Organization Admin" },
  { value: "monarch_owner", label: "Monarch Owner" },
  { value: "organization_user", label: "Booking Kiosk" },
  { value: "driver", label: "Driver" },
];

const allNavigationItems = [
  { path: "/", label: "Dashboard", icon: Home, roles: ["super_admin", "organization_admin", "monarch_owner", "organization_user", "driver"] },
  { path: "/trips", label: "My Trips", icon: Route, roles: ["driver"] },
  { path: "/trips", label: "Trips", icon: Route, roles: ["super_admin", "organization_admin", "monarch_owner", "organization_user"] },
  { path: "/clients", label: "Clients", icon: Users, roles: ["super_admin", "organization_admin", "monarch_owner", "organization_user"] },
  { path: "/drivers", label: "Drivers", icon: UserCheck, roles: ["super_admin", "organization_admin", "monarch_owner"] },
  { path: "/vehicles", label: "Vehicles", icon: Car, roles: ["super_admin", "organization_admin", "monarch_owner"] },
  { path: "/service-areas", label: "Service Areas", icon: MapPin, roles: ["super_admin", "organization_admin", "monarch_owner"] },
  { path: "/frequent-locations", label: "Frequent Locations", icon: Star, roles: ["super_admin", "organization_admin", "monarch_owner"] },
  { path: "/users", label: "Users", icon: Users, roles: ["super_admin", "organization_admin", "monarch_owner"] },
  { path: "/permissions", label: "Permissions", icon: Shield, roles: ["super_admin", "monarch_owner"] },
  { path: "/billing", label: "Billing", icon: DollarSign, roles: ["super_admin", "organization_admin", "monarch_owner"] },
  { path: "/integrations", label: "Calendar Integrations", icon: Webhook, roles: ["super_admin", "organization_admin", "monarch_owner"] },
  { path: "/schedule", label: "Schedule", icon: Calendar, roles: ["super_admin", "organization_admin", "monarch_owner", "organization_user", "driver"] },
  { path: "/mobile-preview", label: "Mobile App", icon: Smartphone, roles: ["super_admin", "organization_admin", "monarch_owner"] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "organization_admin", "monarch_owner", "driver"] },
  { path: "/color-test", label: "Color Test", icon: Palette, roles: ["super_admin"] },
  { path: "/motion-demo", label: "Motion Demo", icon: Zap, roles: ["super_admin"] },
];

const getNavigationItems = (role: string) => {
  return allNavigationItems.filter(item => item.roles.includes(role));
};

export default function Sidebar({ 
  currentOrganization = "monarch_competency", 
  setCurrentOrganization = () => {},
  isCollapsed = false,
  setIsCollapsed = () => {}
}: SidebarProps) {
  const [location] = useLocation();
  const pathname = location;
  const { user } = useAuth();
  const { currentOrganization: orgData } = useOrganization();
  
  // Use authenticated user's role, fallback to organization_admin
  const currentRole = user?.role || "organization_admin";

  // Mock user data - will be replaced with real auth later
  const mockUser = { userName: "John Doe" };

  const userInitials = mockUser.userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  const organizationNames: { [key: string]: string } = {
    littlemonarch_org: "Little Monarch Transport",
    monarch_mental_health: "Monarch Mental Health",
    monarch_sober_living: "Monarch Sober Living",
    monarch_launch: "Monarch Launch",
  };

  const displayName = organizationNames[currentOrganization] || (currentOrganization ? currentOrganization.replace('_', ' ') : 'Unknown Organization');

  // Get navigation items based on current role
  const navigationItems = getNavigationItems(currentRole);

  // Determine if this is kiosk mode for simplified UI
  const isKioskMode = currentRole === "organization_user";

  // Role-based styling
  const sidebarBgColor = isKioskMode ? "bg-blue-50" : "bg-white";
  const headerBgColor = isKioskMode ? "bg-blue-100" : "bg-white";

  // Get role-specific styling
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'text-red-600 font-semibold';
      case 'monarch_owner':
        return 'text-purple-600 font-semibold';
      case 'organization_admin':
        return 'text-blue-600 font-semibold';
      case 'organization_user':
        return 'text-green-600 font-semibold';
      case 'driver':
        return 'text-orange-600 font-semibold';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    if (!role) return 'Unknown Role';
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-48'} shadow-lg border-r-2 flex flex-col transition-all duration-300 relative`} style={{
      backgroundColor: 'var(--foundation-bg)',
      borderColor: 'var(--foundation-border)'
    }}>
      {/* Collapse Toggle - positioned absolutely to not affect layout */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-2 right-2 p-1.5 rounded-lg hover-lighter transition-all duration-200 z-10"
        style={{ color: 'var(--foundation-text)' }}
      >
        {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Logo/Header */}
      {!isCollapsed && (
        <div className="border-b-2 flex items-center justify-center" style={{
          height: '146px',
          backgroundColor: 'var(--foundation-bg)',
          borderColor: 'var(--foundation-border)'
        }}>
          {/* Organization Logo */}
          {orgData?.logoUrl ? (
            <img 
              src={`${orgData.logoUrl}?v=${Date.now()}`} 
              alt={`${orgData.name} logo`}
              className="h-24 w-auto object-contain"
              loading="eager"
              style={{ 
                imageRendering: 'crisp-edges'
              }}
              onError={(e) => {
                console.error('Logo failed to load:', orgData.logoUrl);
                // Try the fallback PNG logo
                const fallbackSrc = '/uploads/logos/monarch-competency-logo.png';
                if (e.currentTarget.src !== fallbackSrc) {
                  e.currentTarget.src = fallbackSrc;
                } else {
                  e.currentTarget.style.display = 'none';
                }
              }}
              onLoad={() => {
                console.log('Logo loaded successfully:', orgData.logoUrl);
              }}
            />
          ) : (
            <div className="h-16 w-full flex items-center justify-center border-2 border-dashed rounded-lg" style={{
              borderColor: 'var(--foundation-border)'
            }}>
              <span className="text-xs font-bold text-brutalist-caption" style={{ color: 'var(--foundation-text)' }}>
                {orgData?.name?.toUpperCase() || 'ORGANIZATION LOGO'}
              </span>
            </div>
          )}
        </div>
      )}



      {/* Organization Selector */}
      {!isCollapsed && (
        <div className="p-4 border-b-2" style={{ borderColor: 'var(--foundation-border)' }}>
          <label className="block text-sm font-semibold mb-2 text-brutalist-caption text-center" style={{ color: 'var(--foundation-text)' }}>ORGANIZATION</label>
          <Select value={currentOrganization} onValueChange={setCurrentOrganization}>
            <SelectTrigger className="w-full border-2 hover-lighter" style={{
              backgroundColor: 'var(--foundation-bg)',
              borderColor: 'var(--foundation-border)',
              color: 'var(--foundation-text)'
            }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{
              backgroundColor: 'var(--foundation-bg)',
              borderColor: 'var(--foundation-border)'
            }}>
              {organizationOptions.map((org) => (
                <SelectItem key={org.value} value={org.value} style={{ color: 'var(--foundation-text)' }}>
                  {org.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = (path: string) => pathname === path || (pathname && pathname.replace(/\/$/, '') === path);

            return (
              <li key={item.path} className="relative group">
                <Link 
                  href={item.path}
                  className={`flex items-center ${isCollapsed ? 'p-3 justify-center' : 'p-3'} rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
                    isActive(item.path) ? "hover-darker" : "hover-lighter hover-shadow"
                  }`}
                  style={{
                    backgroundColor: isActive(item.path) ? 'var(--hover-bg-dark)' : 'var(--foundation-bg)',
                    color: 'var(--foundation-text)'
                  }}
                >
                  <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && item.label.toUpperCase()}
                </Link>
                
                {/* Hover tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full top-0 ml-2 px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--foundation-bg)',
                      borderColor: 'var(--foundation-border)',
                      color: 'var(--foundation-text)',
                      border: '2px solid'
                    }}
                  >
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {item.label.toUpperCase()}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t-2" style={{ borderColor: 'var(--foundation-border)' }}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={`${displayName}'s avatar`} 
              className="w-8 h-8 rounded-full object-cover border-2"
              style={{ borderColor: 'var(--foundation-border)' }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{
              backgroundColor: 'var(--status-accent)',
              color: 'var(--foundation-text)'
            }}>
              {userInitials}
            </div>
          )}
          {!isCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-brutalist-caption" style={{ color: 'var(--foundation-text)' }}>{displayName}</p>
              <p className="text-xs capitalize text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>{currentRole ? getRoleLabel(currentRole) : 'Loading...'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}