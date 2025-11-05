import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { buildHierarchicalUrl } from "../../lib/urlBuilder";
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
  ChevronDown,
  ChevronRight,
  DollarSign,
  Building,
  Building2,
  Users2,
  FolderOpen,
  LogOut,
  User,
  Sun,
  Moon,
  ChevronUp
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAuth } from "../../hooks/useAuth";
// Removed useOrganization - using useHierarchy instead
import { useHierarchy } from "../../hooks/useHierarchy";
import { supabase } from "../../lib/supabase";

interface SidebarProps {
  currentProgram?: string;
  setCurrentProgram?: (program: string) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

// This will be dynamically populated based on user role and corporate client
// See useEffect below that fetches programs for corporate_admin

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "corporate_admin", label: "Corporate Admin" },
  { value: "program_admin", label: "Program Admin" },
  { value: "program_user", label: "Program User" },
  { value: "driver", label: "Driver" },
];

// Page status types
type PageStatus = 'completed' | 'in-progress' | 'not-started' | 'has-issues';

// Status indicator component
const StatusDot = ({ status }: { status: PageStatus }) => {
  const colors = {
    'completed': 'bg-green-500',
    'in-progress': 'bg-yellow-500', 
    'not-started': 'bg-orange-500',
    'has-issues': 'bg-red-500'
  };
  
  return (
    <div className={`w-2 h-2 rounded-full ${colors[status]} flex-shrink-0`} 
         title={`Status: ${status.replace('-', ' ')}`} />
  );
};

// Category-based navigation structure
const navigationCategories = [
  {
    id: "dashboard",
    label: "DASHBOARD",
    icon: Home,
    roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"],
    items: [
      { path: "/", label: "Dashboard", icon: Home, roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"], status: "completed" as PageStatus }
    ]
  },
  {
    id: "operations",
    label: "OPERATIONS",
    icon: Route,
    roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"],
    items: [
      { path: "/trips", label: "My Trips", icon: Route, roles: ["driver"], status: "completed" as PageStatus },
      { path: "/trips", label: "Trips", icon: Route, roles: ["super_admin", "corporate_admin", "program_admin", "program_user"], status: "completed" as PageStatus },
      { path: "/calendar", label: "Calendar", icon: Calendar, roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"], status: "completed" as PageStatus },
      { path: "/drivers", label: "Drivers", icon: Car, roles: ["super_admin", "program_admin"], status: "completed" as PageStatus }, // Removed corporate_admin
      { path: "/vehicles", label: "Vehicles", icon: Car, roles: ["super_admin", "program_admin"], status: "not-started" as PageStatus }, // Removed corporate_admin
      { path: "/frequent-locations", label: "Frequent Locations", icon: MapPin, roles: ["super_admin", "corporate_admin", "program_admin"], status: "has-issues" as PageStatus }
    ]
  },
  {
    id: "corporate",
    label: "CORPORATE",
    icon: Building2,
    roles: ["super_admin", "corporate_admin"],
    items: [
      { path: "/corporate-clients", label: "Corporate Clients", icon: Building2, roles: ["super_admin"], status: "completed" as PageStatus },
      { path: "/programs", label: "Programs", icon: Building, roles: ["super_admin", "corporate_admin"], status: "completed" as PageStatus },
      { path: "/locations", label: "Locations", icon: MapPin, roles: ["super_admin", "corporate_admin", "program_admin"], status: "completed" as PageStatus }, // Moved from OPERATIONS to CORPORATE
      { path: "/clients", label: "Clients", icon: Users, roles: ["super_admin", "corporate_admin", "program_admin", "program_user"], status: "completed" as PageStatus }
    ]
  },
  {
    id: "admin",
    label: "ADMIN",
    icon: Settings,
    roles: ["super_admin", "corporate_admin", "program_admin"],
    items: [
      { path: "/settings", label: "System Settings", icon: Settings, roles: ["super_admin", "corporate_admin", "program_admin"], status: "completed" as PageStatus },
      { path: "/users", label: "User Management", icon: UserCheck, roles: ["super_admin", "corporate_admin", "program_admin"], status: "completed" as PageStatus },
      { path: "/billing", label: "Billing", icon: DollarSign, roles: ["super_admin", "corporate_admin", "program_admin"], status: "not-started" as PageStatus },
      { path: "/permissions", label: "Permissions", icon: Shield, roles: ["super_admin"], status: "completed" as PageStatus }
    ]
  },
  {
    id: "development",
    label: "DEVELOPMENT",
    icon: Palette,
    roles: ["super_admin"],
    items: [
      { path: "/design-system", label: "Design System", icon: Palette, roles: ["super_admin"], status: "completed" as PageStatus },
      { path: "/design-system-demo", label: "Design Demo", icon: Star, roles: ["super_admin"], status: "completed" as PageStatus },
      { path: "/calendar-experiment", label: "Experiment", icon: Calendar, roles: ["super_admin", "corporate_admin", "program_admin"], status: "completed" as PageStatus },
      { path: "/design-sandbox", label: "Sandbox", icon: Palette, roles: ["super_admin"], status: "completed" as PageStatus },
      { path: "/design-reference", label: "Reference", icon: Star, roles: ["super_admin"], status: "completed" as PageStatus },
      { path: "/playground", label: "Playground", icon: Zap, roles: ["super_admin"], status: "completed" as PageStatus }
    ]
  }
];

export default function Sidebar({ 
  currentProgram, 
  setCurrentProgram, 
  isCollapsed = false, 
  setIsCollapsed 
}: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { level, selectedProgram, selectedCorporateClient, navigateToProgram } = useHierarchy();
  const { navigateToCorporate } = useHierarchy();
  
  // State for collapsible categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['dashboard', 'operations']) // Default to expanded for main categories
  );
  
  // User menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Dynamic program options based on user role
  const [programOptions, setProgramOptions] = useState<Array<{ value: string; label: string }>>([]);
  
  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Auto-expand category when navigating to a page within it
  useEffect(() => {
    const currentCategory = navigationCategories.find(category =>
      category.items.some(item => item.path === location)
    );
    
    if (currentCategory && !expandedCategories.has(currentCategory.id)) {
      setExpandedCategories(prev => new Set([...prev, currentCategory.id]));
    }
  }, [location, expandedCategories]);

  // Fetch program options based on user role
  useEffect(() => {
    const fetchProgramOptions = async () => {
      if (!user) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.warn('⚠️ Sidebar: No access token for fetching programs');
          return;
        }

        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
        
        if (user.role === 'corporate_admin') {
          // Fetch programs for corporate admin's corporate client
          const corporateClientId = (user as any)?.corporate_client_id || selectedCorporateClient;
          if (!corporateClientId) {
            console.warn('⚠️ Sidebar: Corporate admin missing corporate_client_id');
            return;
          }

          const response = await fetch(`${apiBaseUrl}/api/programs/corporate-client/${corporateClientId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const programs = await response.json();
            const options = Array.isArray(programs) 
              ? programs.map((p: any) => ({
                  value: p.program_id || p.id,
                  label: p.program_name || p.name || p.program_id || p.id
                }))
              : [];
            setProgramOptions(options);
            
            if (import.meta.env.DEV) {
              console.log('🔍 Sidebar: Fetched programs for corporate_admin:', options);
            }
          } else {
            console.error('❌ Sidebar: Failed to fetch programs:', response.status);
          }
        } else if (user.role === 'super_admin') {
          // Super admin can see all programs (or fetch all if needed)
          // For now, use authorized_programs if available, otherwise empty
          if (user.authorized_programs && Array.isArray(user.authorized_programs)) {
            const options = user.authorized_programs.map((programId: string) => ({
              value: programId,
              label: programId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            }));
            setProgramOptions(options);
          } else {
            // Fetch all programs for super admin
            const response = await fetch(`${apiBaseUrl}/api/programs`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const programs = await response.json();
              const options = Array.isArray(programs)
                ? programs.map((p: any) => ({
                    value: p.program_id || p.id,
                    label: p.program_name || p.name || p.program_id || p.id
                  }))
                : [];
              setProgramOptions(options);
            }
          }
        } else {
          // For program_admin, program_user, driver: use authorized_programs or primary_program_id
          // Parse authorized_programs if it's a JSON string
          let programs: string[] = [];
          if (user.authorized_programs) {
            if (typeof user.authorized_programs === 'string') {
              try {
                programs = JSON.parse(user.authorized_programs);
              } catch {
                programs = [user.authorized_programs];
              }
            } else if (Array.isArray(user.authorized_programs)) {
              programs = user.authorized_programs;
            }
          } else if (user.primary_program_id) {
            programs = [user.primary_program_id];
          }
          
          const options = programs.map((programId: string) => ({
            value: programId,
            label: programId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          }));
          setProgramOptions(options);
        }
      } catch (error) {
        console.error('❌ Sidebar: Error fetching program options:', error);
      }
    };

    fetchProgramOptions();
  }, [user, selectedCorporateClient]);
  
  // Handle user menu toggle
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };
  
  // Handle theme toggle
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Implement actual theme switching
    console.log('Theme toggled to:', !isDarkMode ? 'dark' : 'light');
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);
  
  // Use program from hierarchy or prop
  const activeProgram = selectedProgram || currentProgram;
  
  // Get user role
  const userRole = user?.role || "program_admin";
  
  // Filter navigation categories based on user role
  const visibleCategories = navigationCategories.filter(category => 
    category.roles.includes(userRole)
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

      {/* Program Selector - Only show if user has 2+ programs */}
      {!isCollapsed && programOptions.length > 1 && (
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
      
      {/* Show current program name if only 1 program (no selector needed) */}
      {!isCollapsed && programOptions.length === 1 && activeProgram && (
        <div className="p-4 border-b border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Program
          </label>
          <div className="text-sm text-gray-400 bg-gray-800 border border-gray-600 rounded-md px-3 py-2">
            {programOptions[0]?.label || activeProgram}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4">
        {visibleCategories.map((category) => {
          const CategoryIcon = category.icon;
          
          // Filter items within this category based on user role
          const visibleItems = category.items.filter(item => 
            item.roles.includes(userRole)
          );
          
          // Don't render category if no items are visible
          if (visibleItems.length === 0) return null;
          
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <div key={category.id} className="space-y-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(category.id);
                  }
                }}
                className="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-800 rounded transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                aria-expanded={isExpanded}
                aria-controls={`category-${category.id}-items`}
                tabIndex={0}
              >
                <div className="flex items-center space-x-2">
                  <CategoryIcon className="w-4 h-4 text-gray-400" />
                  {!isCollapsed && (
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {category.label}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-300 transition-colors" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-300 transition-colors" />
                    )}
                  </div>
                )}
              </button>
              
              {/* Category Items */}
              <div 
                id={`category-${category.id}-items`}
                className={`space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${
                  isExpanded 
                    ? 'max-h-96 opacity-100 transform translate-y-0' 
                    : 'max-h-0 opacity-0 transform -translate-y-2'
                }`}
                style={{
                  transitionProperty: 'max-height, opacity, transform',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  
                  // Special handling for Dashboard button - reset to default state
                  if (item.path === '/' && item.label === 'Dashboard') {
                    const dashboardHref = buildHierarchicalUrl(item.path, {
                      selectedCorporateClient,
                      selectedProgram,
                      userRole: user?.role
                    });
                    
                    return (
                      <Link
                        key={item.path}
                        to={dashboardHref}
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
                          <div className="flex items-center space-x-2 flex-1">
                            <span className="text-sm font-medium">{item.label}</span>
                            {item.status && <StatusDot status={item.status} />}
                          </div>
                        )}
                      </Link>
                    );
                  }
                  
                  // Regular navigation items - use hierarchical URLs for corporate admins
                  const href = buildHierarchicalUrl(item.path, {
                    selectedCorporateClient,
                    selectedProgram,
                    userRole: user?.role
                  });
                  
                  return (
                    <Link
                      key={item.path}
                      to={href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.status && <StatusDot status={item.status} />}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-gray-700 relative user-menu-container">
        {!isCollapsed && user && (
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleUserMenu}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
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
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {user.user_name || user.email}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {userRole.replace('_', ' ')}
                </p>
              </div>
              <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
        {isCollapsed && user && (
          <button
            onClick={toggleUserMenu}
            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto hover:bg-blue-700 transition-colors"
          >
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
          </button>
        )}
        
        {/* Slide-up User Menu */}
        {isUserMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg shadow-lg border border-gray-600 overflow-hidden">
            <div className="py-2">
              {/* User Settings */}
              <button
                onClick={() => {
                  // TODO: Navigate to user settings
                  console.log('Navigate to user settings');
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>User Settings</span>
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              
              {/* Divider */}
              <div className="border-t border-gray-600 my-1"></div>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}