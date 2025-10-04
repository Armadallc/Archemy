import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
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
  DollarSign,
  Building,
  Building2,
  Users2,
  FolderOpen
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAuth } from "../../hooks/useAuth";
// Removed useOrganization - using useHierarchy instead
import { useHierarchy } from "../../hooks/useHierarchy";

interface SidebarProps {
  currentProgram?: string;
  setCurrentProgram?: (program: string) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const programOptions = [
  { value: "monarch_competency", label: "Monarch Competency" },
  { value: "monarch_mental_health", label: "Monarch Mental Health" },
  { value: "monarch_sober_living", label: "Monarch Sober Living" },
  { value: "monarch_launch", label: "Monarch Launch" },
];

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "corporate_admin", label: "Corporate Admin" },
  { value: "program_admin", label: "Program Admin" },
  { value: "program_user", label: "Program User" },
  { value: "driver", label: "Driver" },
];

const allNavigationItems = [
  { path: "/", label: "Dashboard", icon: Home, roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"] },
  { path: "/trips", label: "My Trips", icon: Route, roles: ["driver"] },
  { path: "/trips", label: "Trips", icon: Route, roles: ["super_admin", "corporate_admin", "program_admin", "program_user"] },
  { path: "/clients", label: "Clients", icon: Users, roles: ["super_admin", "corporate_admin", "program_admin", "program_user"] },
  { path: "/client-groups", label: "Client Groups", icon: Users2, roles: ["super_admin", "corporate_admin", "program_admin", "program_user"] },
  { path: "/drivers", label: "Drivers", icon: Car, roles: ["super_admin", "corporate_admin", "program_admin"] },
  { path: "/locations", label: "Locations", icon: MapPin, roles: ["super_admin", "corporate_admin", "program_admin"] },
  { path: "/programs", label: "Programs", icon: Building, roles: ["super_admin", "corporate_admin"] },
  { path: "/corporate-clients", label: "Corporate Clients", icon: Building2, roles: ["super_admin"] },
  { path: "/calendar", label: "Calendar", icon: Calendar, roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"] },
  { path: "/users", label: "Users", icon: UserCheck, roles: ["super_admin", "corporate_admin", "program_admin"] },
  { path: "/mobile", label: "Mobile App", icon: Smartphone, roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"] },
  { path: "/permissions", label: "Permissions", icon: Shield, roles: ["super_admin"] },
  { path: "/integrations", label: "Integrations", icon: Webhook, roles: ["super_admin", "corporate_admin"] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "corporate_admin", "program_admin"] },
];

export default function Sidebar({ 
  currentProgram, 
  setCurrentProgram, 
  isCollapsed = false, 
  setIsCollapsed 
}: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient, navigateToProgram } = useHierarchy();
  const { navigateToCorporate } = useHierarchy();
  
  // Use program from hierarchy or prop
  const activeProgram = selectedProgram || currentProgram;
  
  // Get user role
  const userRole = user?.role || "program_admin";
  
  // Filter navigation items based on user role
  const navigationItems = allNavigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  // Handle program switching
  const handleProgramChange = (programId: string) => {
    if (setCurrentProgram) {
      setCurrentProgram(programId);
    }
    // Program switching is now handled by useHierarchy hook
    navigateToProgram(programId, programId);
  };

  // Get corporate client logo
  const getCorporateClientLogo = () => {
    // Logo functionality would need to be implemented with actual data fetching
    return null; // No fallback logo for now
  };

  // Get corporate client name
  const getCorporateClientName = () => {
    if (selectedCorporateClient) {
      return selectedCorporateClient;
    }
    return "Select Corporate Client";
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              {getCorporateClientLogo() ? (
                <img 
                  src={getCorporateClientLogo()!} 
                  alt="Corporate Client Logo" 
                  className="w-8 h-8 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getCorporateClientName().charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">{getCorporateClientName()}</h2>
                <p className="text-xs text-gray-400 capitalize">{userRole.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            getCorporateClientLogo() ? (
              <img 
                src={getCorporateClientLogo()!} 
                alt="Corporate Client Logo" 
                className="w-8 h-8 rounded mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-sm">
                  {getCorporateClientName().charAt(0)}
                </span>
              </div>
            )
          )}
          {setIsCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Program Selector */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Program
          </label>
          <Select value={activeProgram} onValueChange={handleProgramChange}>
            <SelectTrigger className="w-full bg-gray-800 border-gray-600">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {programOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          // Special handling for Dashboard button - reset to default state
          if (item.path === '/' && item.label === 'Dashboard') {
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Reset hierarchy to user's default level
                  if (user?.role === 'super_admin') {
                    navigateToCorporate();
                  }
                  // For other roles, the hierarchy will be reset by the route change
                }}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          }
          
          // Regular navigation items
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && user && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className="text-sm font-medium hidden">
                {user.user_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.user_name || user.email}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {userRole.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        {isCollapsed && user && (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className="text-sm font-medium hidden">
              {user.user_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}