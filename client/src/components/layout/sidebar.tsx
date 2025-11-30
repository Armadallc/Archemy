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
  ChevronUp,
  BarChart3,
  Activity
} from "lucide-react";
import { useTheme } from "../theme-provider";
import { useAuth } from "../../hooks/useAuth";
// Removed useOrganization - using useHierarchy instead
import { useHierarchy } from "../../hooks/useHierarchy";
import { useEffectivePermissions, useFeatureFlag } from "../../hooks/use-permissions";
import { supabase } from "../../lib/supabase";
import { DrillDownDropdown } from "../DrillDownDropdown";

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

// Permission mapping for navigation items
// Maps each navigation item to the required permission(s)
const navigationItemPermissions: Record<string, string | string[]> = {
  "/": "view_calendar", // Dashboard
  "/activity-feed": "view_calendar", // Activity Feed
  "/trips": "view_trips",
  "/calendar": "view_calendar",
  "/drivers": "view_drivers",
  "/vehicles": "view_vehicles",
  "/frequent-locations": "view_locations",
  "/corporate-clients": "view_corporate_clients",
  "/programs": "view_programs",
  "/locations": "view_locations",
  "/clients": "view_clients",
  "/settings": ["view_users", "manage_users"], // Any permission
  "/users": "view_users",
  "/billing": "view_reports", // Placeholder - billing might need its own permission
  "/analytics": "manage_users", // Super admin only
  "/role-templates": "manage_users", // Super admin only
  "/design-system": "manage_users", // Super admin only
  "/design-system-demo": "manage_users", // Super admin only
  "/calendar-experiment": "view_calendar",
};

// Category-based navigation structure
const navigationCategories = [
  {
    id: "dashboard",
    label: "DASHBOARD",
    icon: Home,
    roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"],
    items: [
      { path: "/", label: "Dashboard", icon: Home, roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"], status: "completed" as PageStatus },
      { path: "/activity-feed", label: "Activity Feed", icon: Activity, roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"], status: "completed" as PageStatus }
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
      { path: "/analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin"], status: "in-progress" as PageStatus },
      { path: "/billing", label: "Billing", icon: DollarSign, roles: ["super_admin", "corporate_admin", "program_admin"], status: "not-started" as PageStatus },
      { path: "/role-templates", label: "Role Templates", icon: Shield, roles: ["super_admin"], status: "completed" as PageStatus }
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
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Feature flags
  const { isEnabled: darkModeEnabled } = useFeatureFlag("dark_mode_enabled");
  
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
  
  // Get user permissions
  const { hasPermission, hasAnyPermission, isLoading: permissionsLoading } = useEffectivePermissions();

  // Helper function to check if user has permission for a navigation item
  const canAccessNavItem = (path: string): boolean => {
    const requiredPermission = navigationItemPermissions[path];
    
    // If no permission mapping exists, fall back to role-based check (backward compatibility)
    if (!requiredPermission) {
      return true; // Allow access if no permission mapping
    }

    // If permissions are still loading, allow access (will be filtered once loaded)
    if (permissionsLoading) {
      return true;
    }

    // Check permission(s)
    if (Array.isArray(requiredPermission)) {
      // Array means "any of these permissions" (OR logic)
      return hasAnyPermission(requiredPermission);
    } else {
      // String means single permission required
      return hasPermission(requiredPermission);
    }
  };

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
    return "HALCYON";
  };

  return (
    <div className={`transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col overflow-hidden pt-6 bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border-r border-white/20 dark:border-white/10 shadow-xl`}>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0 border-white/20 dark:border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              {getCorporateClientLogo() && (
                <img 
                  src={getCorporateClientLogo()!} 
                  alt="Corporate Client Logo" 
                  className="w-8 h-8 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                <h2 className="text-[#26282b] dark:text-[#eaeaea]" style={{ fontSize: '42px' }}>{getCorporateClientName()}</h2>
              </div>
            </div>
          )}
          {isCollapsed && getCorporateClientLogo() && (
            <img 
              src={getCorporateClientLogo()!} 
              alt="Corporate Client Logo" 
              className="w-8 h-8 rounded mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          {setIsCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded transition-colors bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 text-[#26282b] dark:text-[#eaeaea] backdrop-blur-sm"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Hierarchical Navigation Menu - Single unified menu for all roles except driver */}
      {!isCollapsed && (user?.role === 'super_admin' || 
        user?.role === 'corporate_admin' || 
        user?.role === 'program_admin' || 
        user?.role === 'program_user') && (
        <div className="p-4 border-b flex-shrink-0 border-white/20 dark:border-white/10">
          <DrillDownDropdown />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {visibleCategories.map((category, index) => {
          const CategoryIcon = category.icon;
          
          // Filter items within this category based on user role
          const visibleItems = category.items.filter(item => {
            // First check role-based access (backward compatibility)
            const hasRoleAccess = item.roles.includes(userRole);
            
            // Then check permission-based access
            const hasPermissionAccess = canAccessNavItem(item.path);
            
            // User must have both role access AND permission access
            return hasRoleAccess && hasPermissionAccess;
          });
          
          // Don't render category if no items are visible
          if (visibleItems.length === 0) return null;
          
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <div key={category.id} className="space-y-2">
              {/* Category Header - Only show for categories after the first one */}
              {index > 0 && (
                <button
                  onClick={() => toggleCategory(category.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCategory(category.id);
                    }
                  }}
                  className="flex items-center justify-between w-full px-2 py-1 rounded transition-colors group focus:outline-none focus:ring-2 focus:ring-inset bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-[#26282b] dark:text-[#eaeaea] backdrop-blur-sm"
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 85, 93, 0.3) inset'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                  aria-expanded={isExpanded ? "true" : "false"}
                  aria-controls={`category-${category.id}-items`}
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-2">
                    {!isCollapsed && (
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#26282b]/70 dark:text-[#eaeaea]/70">
                        {category.label}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 transition-colors text-[#26282b]/70 dark:text-[#eaeaea]/70 hover:text-[#26282b] dark:hover:text-[#eaeaea]" />
                      ) : (
                        <ChevronRight className="w-3 h-3 transition-colors text-[#26282b]/70 dark:text-[#eaeaea]/70 hover:text-[#26282b] dark:hover:text-[#eaeaea]" />
                      )}
                    </div>
                  )}
                </button>
              )}
              
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
                            ? 'bg-[#ff555d]/20 dark:bg-[#ff555d]/20 text-[#26282b] dark:text-[#eaeaea] shadow-lg' 
                            : 'text-[#26282b]/70 dark:text-[#eaeaea]/70 hover:bg-white/20 dark:hover:bg-white/10'
                        } backdrop-blur-sm`}
                      >
                        {!isCollapsed && (
                          <div className="flex items-center space-x-2 flex-1">
                            <span className="text-sm font-medium">{item.label}</span>
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
                          ? 'bg-[#ff555d]/20 dark:bg-[#ff555d]/20 text-[#26282b] dark:text-[#eaeaea] shadow-lg' 
                          : 'text-[#26282b]/70 dark:text-[#eaeaea]/70 hover:bg-white/20 dark:hover:bg-white/10'
                      } backdrop-blur-sm`}
                    >
                      {!isCollapsed && (
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-sm font-medium">{item.label}</span>
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
      <div className="p-4 border-t relative user-menu-container flex-shrink-0 border-white/20 dark:border-white/10">
        {!isCollapsed && user && (
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleUserMenu}
              className="flex items-center space-x-3 w-full p-2 rounded-lg transition-colors bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#ff555d]">
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
                <span className="text-sm font-medium hidden text-white">
                  {user.user_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate text-[#26282b] dark:text-[#eaeaea]">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.user_name || user.email}
                </p>
                {userRole !== 'super_admin' && (
                  <p className="text-xs capitalize text-[#26282b]/70 dark:text-[#eaeaea]/70">
                    {userRole.replace('_', ' ')}
                  </p>
                )}
              </div>
              <ChevronUp className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''} text-[#26282b]/70 dark:text-[#eaeaea]/70`} />
            </button>
          </div>
        )}
        {isCollapsed && user && (
          <button
            onClick={toggleUserMenu}
            className="w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors bg-[#ff555d] hover:bg-[#ff444c] backdrop-blur-sm"
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
            <span className="text-sm font-medium hidden text-white">
              {user.user_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </button>
        )}
        
        {/* Slide-up User Menu */}
        {isUserMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg shadow-xl overflow-hidden bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10">
            <div className="py-2">
              {/* User Settings */}
              <button
                onClick={() => {
                  // TODO: Navigate to user settings
                  console.log('Navigate to user settings');
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors text-[#26282b] dark:text-[#eaeaea] hover:bg-white/20 dark:hover:bg-white/10"
              >
                <User className="w-4 h-4" />
                <span>User Settings</span>
              </button>
              
              {/* Theme Toggle */}
              {darkModeEnabled && (
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors text-[#26282b] dark:text-[#eaeaea] hover:bg-white/20 dark:hover:bg-white/10"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              )}
              
              {/* Divider */}
              <div className="border-t my-1 border-white/20 dark:border-white/10"></div>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors text-[#cc5833] hover:bg-white/20 dark:hover:bg-white/10"
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