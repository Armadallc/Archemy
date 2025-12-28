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
  MessageSquare,
  Calculator
} from "lucide-react";
import { useTheme } from "../theme-provider";
import { useAuth } from "../../hooks/useAuth";
// Removed useOrganization - using useHierarchy instead
import { useHierarchy } from "../../hooks/useHierarchy";
import { useEffectivePermissions, useFeatureFlag } from "../../hooks/use-permissions";
import { supabase } from "../../lib/supabase";
import { MiniCalendar } from "../MiniCalendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";

interface SidebarProps {
  currentProgram?: string;
  setCurrentProgram?: (program: string) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  autoHide?: boolean; // Foundation for Phase 4 - not implemented yet
  collapsed?: boolean; // Alias for isCollapsed for consistency
  onCollapseChange?: (collapsed: boolean) => void; // Alias for setIsCollapsed
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
  "/trips": "view_trips",
  "/calendar": "view_calendar",
  "/drivers": "view_drivers",
  "/vehicles": "view_vehicles",
  "/frequent-locations": "view_locations",
  "/clients": "view_clients",
  "/settings": ["view_users", "manage_users"], // Any permission
  "/users": "view_users",
  "/billing": "view_reports", // Placeholder - billing might need its own permission
  "/analytics": "manage_users", // Super admin only
  "/telematics": "manage_users", // Super admin only
  "/role-templates": "manage_users", // Super admin only
  "/prophet": "manage_users", // Super admin only - PROPHET Calculator
  "/design-system": "manage_users", // Super admin only
  "/bentobox": "view_calendar",
  "/chat": "view_calendar", // All users can access chat
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
      { path: "/calendar", label: "Calendar", icon: Calendar, roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"], status: "completed" as PageStatus },
      { path: "/chat", label: "Chat", icon: MessageSquare, roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"], status: "completed" as PageStatus }
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
      { path: "/drivers", label: "Drivers", icon: Car, roles: ["super_admin", "program_admin"], status: "completed" as PageStatus }, // Removed corporate_admin
      { path: "/vehicles", label: "Vehicles", icon: Car, roles: ["super_admin", "program_admin"], status: "not-started" as PageStatus } // Removed corporate_admin
    ]
  },
  {
    id: "corporate",
    label: "PARTNER",
    icon: Building2,
    roles: ["super_admin", "corporate_admin"],
    items: [
      { path: "/clients", label: "Clients", icon: Users, roles: ["super_admin", "corporate_admin", "program_admin", "program_user"], status: "completed" as PageStatus },
      { path: "/frequent-locations", label: "Frequent Locations", icon: MapPin, roles: ["super_admin", "corporate_admin", "program_admin"], status: "has-issues" as PageStatus }
    ]
  },
  {
    id: "admin",
    label: "SYSTEM",
    icon: Settings,
    roles: ["super_admin", "corporate_admin", "program_admin"],
    items: [
      { path: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "corporate_admin", "program_admin"], status: "completed" as PageStatus },
      { path: "/role-templates", label: "Role Templates", icon: Shield, roles: ["super_admin"], status: "completed" as PageStatus }
    ]
  },
  {
    id: "analytics",
    label: "ANALYTICS",
    icon: BarChart3,
    roles: ["super_admin"],
    items: [
      { path: "/telematics", label: "Telematics", icon: BarChart3, roles: ["super_admin"], status: "in-progress" as PageStatus },
      { path: "/prophet", label: "Prophet", icon: Calculator, roles: ["super_admin"], status: "completed" as PageStatus }
    ]
  },
  {
    id: "admin-management",
    label: "ADMIN",
    icon: DollarSign,
    roles: ["super_admin", "corporate_admin", "program_admin"],
    items: [
      { path: "/billing", label: "Billing", icon: DollarSign, roles: ["super_admin", "corporate_admin", "program_admin"], status: "not-started" as PageStatus }
    ]
  },
  {
    id: "development",
    label: "DEVELOPMENT",
    icon: Palette,
    roles: ["super_admin"],
    items: [
      { path: "/design-system", label: "Design System", icon: Palette, roles: ["super_admin"], status: "completed" as PageStatus },
      { path: "/bentobox", label: "BENTOBOX", icon: Calendar, roles: ["super_admin", "corporate_admin", "program_admin"], status: "completed" as PageStatus },
    ]
  }
];

export default function Sidebar({ 
  currentProgram, 
  setCurrentProgram, 
  isCollapsed = false, 
  setIsCollapsed,
  autoHide = false, // Foundation for Phase 4 - not implemented yet
  collapsed,
  onCollapseChange
}: SidebarProps) {
  // Use collapsed prop if provided, otherwise use isCollapsed
  const actualCollapsed = collapsed !== undefined ? collapsed : isCollapsed;
  const handleCollapseChange = onCollapseChange || setIsCollapsed || (() => {});
  
  // Auto-hide detection foundation (commented for Phase 1)
  // We'll implement full auto-hide in Phase 4
  // useEffect(() => {
  //   if (!autoHide) return;
  //   // Auto-hide logic will go here
  // }, [autoHide]);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { level, selectedProgram, selectedCorporateClient, navigateToProgram } = useHierarchy();
  const { navigateToCorporate } = useHierarchy();
  
  // State for collapsible categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['dashboard', 'operations']) // Default to expanded for main categories
  );
  
  // User menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, toggleTheme: originalToggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const queryClient = useQueryClient();

  // Mutation to save theme mode to database
  const saveThemeModeMutation = useMutation({
    mutationFn: async (themeMode: 'light' | 'dark') => {
      const response = await apiRequest('PUT', '/api/themes/user/mode', {
        theme_mode: themeMode,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes/user/selection'] });
    },
    onError: (error: any) => {
      console.error('Failed to save theme mode:', error);
      // Don't show error to user - theme toggle still works locally
    },
  });

  // Enhanced toggle theme that saves to database
  const toggleTheme = () => {
    try {
      const newMode = isDarkMode ? 'light' : 'dark';
      const root = document.documentElement;
      
      // Toggle theme locally first
      originalToggleTheme();
      
      // Immediately toggle dark class (works in Cursor browser)
      if (newMode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Force FireThemeProvider to re-apply by dispatching a custom event
      // This ensures the theme is applied even if MutationObserver doesn't fire
      const event = new CustomEvent('theme-toggle', { 
        detail: { mode: newMode } 
      });
      window.dispatchEvent(event);
      
      // Also trigger a manual re-application after a short delay
      // This is a fallback in case the MutationObserver doesn't catch it
      setTimeout(() => {
        // Check if class was actually applied
        const hasDarkClass = root.classList.contains('dark');
        const shouldHaveDark = newMode === 'dark';
        
        if (hasDarkClass !== shouldHaveDark) {
          // Class wasn't applied correctly, fix it
          if (shouldHaveDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
        
        // Force a re-render by triggering a resize event
        // This sometimes helps with browser rendering issues
        window.dispatchEvent(new Event('resize'));
      }, 10);
      
      // Save to database if user is authenticated
      if (user) {
        saveThemeModeMutation.mutate(newMode);
      }
    } catch (error) {
      console.error('Error toggling theme:', error);
      // Fallback: manually toggle dark class
      const root = document.documentElement;
      if (root.classList.contains('dark')) {
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
      }
    }
  };
  
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
    
    if (currentCategory) {
      setExpandedCategories(prev => {
        // Only add if not already in the set to avoid unnecessary re-renders
        if (!prev.has(currentCategory.id)) {
          return new Set([...prev, currentCategory.id]);
        }
        return prev;
      });
    }
  }, [location]); // Removed expandedCategories from dependencies to prevent re-expansion after manual collapse

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

  // Fetch system settings for main logo (super admin only, but we'll fetch for all to check)
  const { data: systemSettings } = useQuery({
    queryKey: ['/api/system-settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/system-settings');
        if (!response.ok) {
          return null;
        }
        return await response.json();
      } catch (error) {
        // If not super admin or settings don't exist, return null
        return null;
      }
    },
    enabled: true, // Always try to fetch (will fail gracefully for non-super-admins)
    retry: false,
  });

  // Get corporate client ID from user or selected corporate client
  const corporateClientId = (user as any)?.corporate_client_id || selectedCorporateClient;

  // Fetch corporate client data to get logo
  const { data: corporateClientData } = useQuery({
    queryKey: ['/api/corporate-clients', corporateClientId],
    queryFn: async () => {
      if (!corporateClientId) return null;
      try {
        // Try the corporate route first (preferred)
        const response = await apiRequest('GET', `/api/corporate/clients/${corporateClientId}`);
        return await response.json();
      } catch (error: any) {
        // Try legacy endpoint as fallback
        try {
          const response = await apiRequest('GET', `/api/corporate-clients/${corporateClientId}`);
          return await response.json();
        } catch (legacyError: any) {
          console.error('Error fetching corporate client:', legacyError);
          return null;
        }
      }
    },
    enabled: !!corporateClientId && (user?.role === 'corporate_admin' || !!selectedCorporateClient),
    retry: false,
  });

  // Get corporate client logo
  const getCorporateClientLogo = () => {
    if (corporateClientData?.logo_url) {
      return corporateClientData.logo_url;
    }
    return null;
  };

  // Get main logo URL from system settings
  const getMainLogoUrl = () => {
    return systemSettings?.main_logo_url || null;
  };

  // Get corporate client name or app name
  const getCorporateClientName = () => {
    if (selectedCorporateClient) {
      return selectedCorporateClient;
    }
    return systemSettings?.app_name || "HALCYON";
  };

  // Determine what to display: main logo, corporate client logo, or text
  const getDisplayLogo = () => {
    // For corporate admins, prioritize their corporate client logo
    // For super admins, prioritize main logo
    if (user?.role === 'corporate_admin') {
      const corporateLogo = getCorporateClientLogo();
      if (corporateLogo) {
        return corporateLogo;
      }
      // Fallback to main logo if no corporate logo
      return getMainLogoUrl();
    }
    // For super admins and others: main logo > corporate client logo
    const mainLogo = getMainLogoUrl();
    if (mainLogo) {
      return mainLogo;
    }
    return getCorporateClientLogo();
  };

  const shouldShowLogo = () => {
    return getDisplayLogo() !== null;
  };

  const shouldShowText = () => {
    // Show text if no logo is available, or if corporate client is selected (logo is secondary)
    return !shouldShowLogo() || (selectedCorporateClient && !getMainLogoUrl());
  };

  return (
    <div className={`transition-all duration-300 ${actualCollapsed ? 'w-16' : 'w-64'} flex flex-col overflow-hidden rounded-lg`} style={{ color: 'var(--color-aqua)', backgroundColor: 'var(--gray-1)', paddingBottom: '24px', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b flex-shrink-0 flex items-center justify-center relative" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--gray-1)', height: '150px' }}>
        {shouldShowLogo() && (
          <img 
            src={getDisplayLogo()!} 
            alt={getMainLogoUrl() ? "Main Application Logo" : "Corporate Client Logo"} 
            className="object-cover"
            style={{ width: '120px', height: '120px', minWidth: '120px', minHeight: '120px', maxWidth: '120px', maxHeight: '120px', display: 'block' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        {!shouldShowLogo() && !actualCollapsed && (
          <div>
            <h2 style={{ fontSize: '42px', fontFamily: "'Nohemi', sans-serif" }}>{getCorporateClientName()}</h2>
          </div>
        )}
        {(setIsCollapsed || onCollapseChange) && (
          <button
            onClick={() => handleCollapseChange(!actualCollapsed)}
            className="p-1 rounded transition-colors absolute right-2"
            style={{ '--hover-bg': 'var(--gray-3)' } as React.CSSProperties & { '--hover-bg': string }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={actualCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={actualCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${actualCollapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto" style={{ backgroundColor: 'var(--gray-1)' }}>
        {/* Mini Calendar */}
        {!actualCollapsed && (
          <div className="mb-4" style={{ backgroundColor: 'var(--gray-1)' }}>
            <MiniCalendar />
          </div>
        )}
        
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
                  className="flex items-center justify-between w-full px-2 py-1 rounded transition-colors group focus:outline-none focus:ring-2 focus:ring-inset"
                  style={{ '--hover-bg': 'var(--gray-2)', '--focus-ring': 'var(--blue-9)' } as React.CSSProperties & { '--hover-bg': string; '--focus-ring': string }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px var(--blue-9) inset'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                  aria-expanded={isExpanded}
                  aria-controls={`category-${category.id}-items`}
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-2">
                    {!actualCollapsed && (
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gray-9)', fontFamily: "'Nohemi', sans-serif" }}>
                        {category.label}
                      </span>
                    )}
                  </div>
                  {!actualCollapsed && (
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 transition-colors" style={{ color: 'var(--gray-9)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gray-11)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-9)'} />
                      ) : (
                        <ChevronRight className="w-3 h-3 transition-colors" style={{ color: 'var(--gray-9)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--gray-11)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-9)'} />
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
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                        style={isActive ? { backgroundColor: 'var(--blue-9)', color: 'var(--gray-12)' } : { color: 'var(--gray-11)' }}
                        onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'var(--gray-3)')}
                        onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Icon removed per user request */}
                        {!actualCollapsed && (
                          <div className="flex items-start space-x-2 flex-1" style={{ justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                            <span className="text-sm font-medium" style={{ fontFamily: "'Nohemi', sans-serif" }}>{item.label}</span>
                            {/* Status indicator removed per user request */}
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
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                      style={isActive ? { backgroundColor: 'var(--blue-9)', color: 'var(--gray-12)' } : { color: 'var(--gray-11)' }}
                      onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'var(--gray-3)')}
                      onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Icon removed per user request */}
                      {!actualCollapsed && (
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-sm font-medium" style={{ fontFamily: "'Nohemi', sans-serif" }}>{item.label}</span>
                          {/* Status indicator removed per user request */}
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
      <div className="p-4 border-t relative user-menu-container flex-shrink-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--gray-1)', height: '69px' }}>
        {!actualCollapsed && user && (
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleUserMenu}
              className="flex items-center space-x-3 w-full p-2 rounded-lg transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--blue-9)' }}>
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
                <p className="text-sm font-medium truncate" style={{ color: 'var(--gray-12)', fontFamily: "'Nohemi', sans-serif" }}>
                  {user?.first_name || 'User'}
                </p>
                {userRole !== 'super_admin' && (
                  <p className="text-xs capitalize" style={{ color: 'var(--gray-9)', fontFamily: "'Nohemi', sans-serif" }}>
                    {userRole.replace('_', ' ')}
                  </p>
                )}
              </div>
              <ChevronUp className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--gray-9)' }} />
            </button>
          </div>
        )}
        {actualCollapsed && user && (
          <button
            onClick={toggleUserMenu}
            className="w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors"
            style={{ backgroundColor: 'var(--blue-9)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-10)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-9)'}
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
          <div className="absolute bottom-full mb-2 rounded-lg overflow-hidden card-neu" style={{ backgroundColor: 'var(--background)', border: 'none', width: '223.45px' }}>
            <div className="py-2">
              {/* User Settings */}
              <button
                onClick={() => {
                  setLocation('/profile');
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                }}
              >
                <User className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                <span style={{ color: '#a5c8ca', fontFamily: "'Nohemi', sans-serif" }}>User Settings</span>
              </button>
              
              {/* Theme Toggle */}
              {darkModeEnabled && (
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                  }}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" style={{ color: '#a5c8ca' }} /> : <Moon className="w-4 h-4" style={{ color: '#a5c8ca' }} />}
                  <span style={{ color: '#a5c8ca', fontFamily: "'Nohemi', sans-serif" }}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              )}
              
              {/* Divider */}
              <div className="border-t my-1" style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}></div>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                }}
              >
                <LogOut className="w-4 h-4" style={{ color: '#a5c8ca' }} />
                <span style={{ color: '#a5c8ca', fontFamily: "'Nohemi', sans-serif" }}>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}