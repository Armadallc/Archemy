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
  Building2,
  BarChart3,
  MessageSquare,
  Calculator,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LogOut,
  User,
  Sun,
  Moon,
  Activity,
  Building,
  FolderTree,
  UserCircle,
  DollarSign
} from "lucide-react";
import { useTheme } from "../theme-provider";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { useEffectivePermissions, useFeatureFlag } from "../../hooks/use-permissions";
import { supabase } from "../../lib/supabase";
import { MiniCalendar } from "../MiniCalendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";

interface AdaptiveSidebarProps {
  currentProgram?: string;
  setCurrentProgram?: (program: string) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  autoHide?: boolean;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions?: string | string[]; // Single permission or array (OR logic)
  roles?: string[]; // Role-based access (backward compatibility)
}

interface NavigationSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavigationItem[];
  requiredPermission?: string; // Permission to show entire section
  requiredAnyPermission?: string[]; // Any of these permissions to show section
  hideForRoles?: string[]; // Hide section for these roles
}

export default function AdaptiveSidebar({ 
  currentProgram, 
  setCurrentProgram, 
  isCollapsed = false, 
  setIsCollapsed,
  autoHide = false,
  collapsed,
  onCollapseChange
}: AdaptiveSidebarProps) {
  const actualCollapsed = collapsed !== undefined ? collapsed : isCollapsed;
  const handleCollapseChange = onCollapseChange || setIsCollapsed || (() => {});
  
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { level, selectedProgram, selectedCorporateClient, navigateToProgram, navigateToCorporate } = useHierarchy();
  const { hasPermission, hasAnyPermission, isLoading: permissionsLoading } = useEffectivePermissions();
  
  // State for collapsible categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['workspace', 'operations']) // Default to expanded for main categories
  );
  
  // User menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, toggleTheme: originalToggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const queryClient = useQueryClient();
  const userRole = user?.role || "program_user";

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
    },
  });

  // Enhanced toggle theme that saves to database
  const toggleTheme = () => {
    try {
      const newMode = isDarkMode ? 'light' : 'dark';
      const root = document.documentElement;
      
      originalToggleTheme();
      
      if (newMode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      const event = new CustomEvent('theme-toggle', { 
        detail: { mode: newMode } 
      });
      window.dispatchEvent(event);
      
      setTimeout(() => {
        const hasDarkClass = root.classList.contains('dark');
        const shouldHaveDark = newMode === 'dark';
        
        if (hasDarkClass !== shouldHaveDark) {
          if (shouldHaveDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
        
        window.dispatchEvent(new Event('resize'));
      }, 10);
      
      if (user) {
        saveThemeModeMutation.mutate(newMode);
      }
    } catch (error) {
      console.error('Error toggling theme:', error);
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
    const currentCategory = navigationSections.find(section =>
      section.items.some(item => item.path === location || location.startsWith(item.path + '/'))
    );
    
    if (currentCategory) {
      setExpandedCategories(prev => {
        if (!prev.has(currentCategory.id)) {
          return new Set([...prev, currentCategory.id]);
        }
        return prev;
      });
    }
  }, [location]);

  // Helper function to check if user can access a navigation item
  const canAccessItem = (item: NavigationItem): boolean => {
    // Check role-based access first (backward compatibility)
    if (item.roles && !item.roles.includes(userRole)) {
      return false;
    }
    
    // Check permission-based access
    if (item.permissions) {
      if (permissionsLoading) {
        return true; // Allow access while loading (will be filtered once loaded)
      }
      
      if (Array.isArray(item.permissions)) {
        return hasAnyPermission(item.permissions);
      } else {
        return hasPermission(item.permissions);
      }
    }
    
    // If no permissions specified, allow access (backward compatibility)
    return true;
  };

  // Helper function to check if a section should be visible
  const isSectionVisible = (section: NavigationSection): boolean => {
    // Hide section for specific roles
    if (section.hideForRoles && section.hideForRoles.includes(userRole)) {
      return false;
    }
    
    // First check if any item in the section is accessible by role (more lenient)
    const hasAccessibleItemsByRole = section.items.some(item => {
      // Check role-based access first
      if (item.roles && item.roles.includes(userRole)) {
        return true; // User has role access, show section
      }
      return false;
    });
    
    if (hasAccessibleItemsByRole) {
      return true; // Show section if user has role access to any item
    }
    
    // Then check section-level permission (as secondary check)
    if (section.requiredPermission) {
      if (permissionsLoading) return true;
      return hasPermission(section.requiredPermission);
    }
    
    if (section.requiredAnyPermission) {
      if (permissionsLoading) return true;
      return hasAnyPermission(section.requiredAnyPermission);
    }
    
    // Finally check if any item in the section is accessible by permissions
    const hasAccessibleItems = section.items.some(item => canAccessItem(item));
    return hasAccessibleItems;
  };

  // Navigation sections based on the new structure
  const navigationSections: NavigationSection[] = [
    {
      id: "workspace",
      label: "Workspace",
      icon: Home,
      requiredAnyPermission: ["view_dashboard", "view_calendar", "view_chat"],
      items: [
        { 
          path: "/", 
          label: "Dashboard", 
          icon: Home, 
          permissions: "view_dashboard",
          roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"]
        },
        { 
          path: "/calendar", 
          label: "Calendar", 
          icon: Calendar, 
          permissions: "view_calendar",
          roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"]
        },
        { 
          path: "/chat", 
          label: "Chat", 
          icon: MessageSquare, 
          permissions: "view_chat",
          roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"]
        }
      ]
    },
    {
      id: "team-management",
      label: "Team Management",
      icon: Users,
      // Show if user has role access (Super Admin, Corporate Admin, Program Admin)
      hideForRoles: ["program_user", "driver"], // Hide for Program Users and Drivers
      items: [
        { 
          path: "/team/programs", 
          label: "Programs", 
          icon: FolderTree, 
          permissions: ["programs:view", "team:view"],
          roles: ["super_admin", "corporate_admin", "program_admin"]
        },
        { 
          path: "/team/locations", 
          label: "Locations", 
          icon: MapPin, 
          permissions: ["locations:view", "team:view"],
          roles: ["super_admin", "corporate_admin", "program_admin"]
        },
        { 
          path: "/team/staff", 
          label: "Staff", 
          icon: UserCircle, 
          permissions: ["staff:view", "team:view"],
          roles: ["super_admin", "corporate_admin", "program_admin"]
        },
        { 
          path: "/team/client-census", 
          label: "Client Census", 
          icon: Users, 
          permissions: ["clients:view_census", "team:view"],
          roles: ["super_admin", "corporate_admin", "program_admin"]
        },
        { 
          path: "/team/frequent-locations", 
          label: "Frequent Locations", 
          icon: MapPin, 
          permissions: ["view_locations", "team:view"],
          roles: ["super_admin", "corporate_admin", "program_admin"]
        }
      ]
    },
    {
      id: "partner-management",
      label: "Partner Management",
      icon: Building2,
      requiredPermission: "partners:manage_global", // Super Admin only
      hideForRoles: ["corporate_admin", "program_admin", "program_user", "driver"], // Hide for all except Super Admin
      items: [
        { 
          path: "/partners/corporate-clients", 
          label: "Partners (Corporate Clients)", 
          icon: Building, 
          permissions: "partners:manage_global",
          roles: ["super_admin"]
        },
        { 
          path: "/partners/billing", 
          label: "Billing/Contracts", 
          icon: DollarSign, 
          permissions: "partners:manage_global",
          roles: ["super_admin"]
        }
      ]
    },
    {
      id: "operations",
      label: "Operations",
      icon: Route,
      requiredAnyPermission: ["view_trips", "view_drivers", "view_vehicles", "clients:manage_trips"],
      items: [
        { 
          path: "/trips", 
          label: userRole === "driver" ? "My Trips" : "Trips", 
          icon: Route, 
          permissions: "view_trips",
          roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"]
        },
        { 
          path: "/drivers", 
          label: "Drivers", 
          icon: Car, 
          permissions: "view_drivers",
          roles: ["super_admin", "corporate_admin", "program_admin"]
        },
        { 
          path: "/vehicles", 
          label: "Vehicles", 
          icon: Car, 
          permissions: "view_vehicles",
          roles: ["super_admin", "corporate_admin", "program_admin"]
        },
        { 
          path: "/operations/clients", 
          label: "Clients (Residents/Passengers)", 
          icon: Users, 
          permissions: ["clients:manage_trips", "view_trips"],
          roles: ["super_admin", "corporate_admin", "program_admin", "program_user"]
        }
      ]
    },
    {
      id: "configuration",
      label: "Configuration",
      icon: Settings,
      items: [
        { 
          path: "/profile", 
          label: "My Profile", 
          icon: UserCircle, 
          roles: ["super_admin", "corporate_admin", "program_admin", "program_user", "driver"]
        },
        { 
          path: "/settings?tab=users", 
          label: "Team Settings", 
          icon: Users, 
          permissions: ["view_users", "manage_users"],
          roles: ["corporate_admin", "program_admin"] // Corporate Admin+ only
        },
        { 
          path: "/settings", 
          label: "System Settings", 
          icon: Settings, 
          permissions: ["view_users", "manage_users"],
          roles: ["super_admin"] // Super Admin only
        }
      ]
    },
    {
      id: "insights",
      label: "Insights",
      icon: BarChart3,
      requiredAnyPermission: ["view_analytics", "view_telematics"],
      hideForRoles: ["program_user", "driver"],
      items: [
        { 
          path: "/analytics", 
          label: "Analytics", 
          icon: BarChart3, 
          permissions: "view_analytics",
          roles: ["super_admin", "corporate_admin"]
        },
        { 
          path: "/analytics", 
          label: "Telematics", 
          icon: Activity, 
          permissions: "view_telematics",
          roles: ["super_admin", "corporate_admin"]
        }
      ]
    },
    {
      id: "development",
      label: "Development",
      icon: Calculator,
      roles: ["super_admin"], // Super Admin only
      items: [
        { 
          path: "/prophet", 
          label: "PROPHET Calculator", 
          icon: Calculator, 
          roles: ["super_admin"]
        },
        { 
          path: "/bentobox", 
          label: "Bentobox Calendar", 
          icon: Calendar, 
          roles: ["super_admin"]
        }
      ]
    }
  ];

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

  // Fetch system settings for main logo
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
        return null;
      }
    },
    enabled: true,
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
        const response = await apiRequest('GET', `/api/corporate/clients/${corporateClientId}`);
        return await response.json();
      } catch (error: any) {
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
    if (user?.role === 'corporate_admin') {
      const corporateLogo = getCorporateClientLogo();
      if (corporateLogo) {
        return corporateLogo;
      }
      return getMainLogoUrl();
    }
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
    return !shouldShowLogo() || (selectedCorporateClient && !getMainLogoUrl());
  };

  // Filter visible sections
  const visibleSections = navigationSections.filter(section => {
    const isVisible = isSectionVisible(section);
    if (import.meta.env.DEV) {
      console.log(`🔍 Sidebar section "${section.label}" (${section.id}): visible=${isVisible}, userRole=${userRole}`);
    }
    return isVisible;
  });

  // Handle program switching
  const handleProgramChange = (programId: string) => {
    if (setCurrentProgram) {
      setCurrentProgram(programId);
    }
    navigateToProgram(programId, programId);
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
        
        {visibleSections.map((section, index) => {
          const SectionIcon = section.icon;
          
          // Filter items within this section - prioritize role access, then check permissions
          const visibleItems = section.items.filter(item => {
            // First check role-based access (more lenient)
            if (item.roles && item.roles.includes(userRole)) {
              // If user has role access, show item (permissions are secondary)
              return true;
            }
            // Then check permission-based access
            return canAccessItem(item);
          });
          
          // Don't render section if no items are visible
          if (visibleItems.length === 0) return null;
          
          const isExpanded = expandedCategories.has(section.id);
          
          return (
            <div key={section.id} className="space-y-2">
              {/* Section Header */}
              {index > 0 && (
                <button
                  onClick={() => toggleCategory(section.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCategory(section.id);
                    }
                  }}
                  className="flex items-center justify-between w-full px-2 py-1 rounded transition-colors group focus:outline-none focus:ring-2 focus:ring-inset"
                  style={{ '--hover-bg': 'var(--gray-2)', '--focus-ring': 'var(--blue-9)' } as React.CSSProperties & { '--hover-bg': string; '--focus-ring': string }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px var(--blue-9) inset'}
                  onBlur={(e) => e.currentTarget.style.boxShadow = ''}
                  aria-expanded={isExpanded ? "true" : "false"}
                  aria-controls={`section-${section.id}-items`}
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-2">
                    {!actualCollapsed && (
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gray-9)', fontFamily: "'Nohemi', sans-serif" }}>
                        {section.label}
                      </span>
                    )}
                  </div>
                  {!actualCollapsed && (
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 transition-colors" style={{ color: 'var(--gray-9)' }} />
                      ) : (
                        <ChevronRight className="w-3 h-3 transition-colors" style={{ color: 'var(--gray-9)' }} />
                      )}
                    </div>
                  )}
                </button>
              )}
              
              {/* Section Items */}
              <div 
                id={`section-${section.id}-items`}
                className={`space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${
                  // First section (Workspace) is always expanded, others use isExpanded
                  (index === 0 || isExpanded)
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
                  // Check if active - handle query params for settings routes
                  const itemPath = item.path.split('?')[0]; // Get base path without query
                  const isActive = location === item.path || 
                                 location === itemPath || 
                                 location.startsWith(itemPath + '/') ||
                                 (item.path.includes('?tab=') && location.startsWith(itemPath) && new URLSearchParams(window.location.search).get('tab') === item.path.split('tab=')[1]?.split('&')[0]);
                  
                  // Special handling for Dashboard button
                  if (item.path === '/' && item.label === 'Dashboard') {
                    const dashboardHref = buildHierarchicalUrl(item.path, {
                      selectedCorporateClient,
                      selectedProgram,
                      userRole: user?.role
                    });
                    
                    return (
                      <Link
                        key={`${section.id}-${item.path}-${item.label}`}
                        to={dashboardHref}
                        onClick={() => {
                          if (user?.role === 'super_admin') {
                            navigateToCorporate();
                          }
                        }}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                        style={isActive ? { backgroundColor: 'var(--blue-9)', color: 'var(--gray-12)' } : { color: 'var(--gray-11)' }}
                        onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'var(--gray-3)')}
                        onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {!actualCollapsed && (
                          <div className="flex items-start space-x-2 flex-1" style={{ justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                            <span className="text-sm font-medium" style={{ fontFamily: "'Nohemi', sans-serif" }}>{item.label}</span>
                          </div>
                        )}
                      </Link>
                    );
                  }
                  
                  // For settings routes with query params, use the path directly
                  let href = item.path;
                  if (!item.path.includes('?') && !item.path.startsWith('/settings')) {
                    // Regular navigation items - use hierarchical URLs
                    href = buildHierarchicalUrl(item.path, {
                      selectedCorporateClient,
                      selectedProgram,
                      userRole: user?.role
                    });
                  }
                  
                  return (
                    <Link
                      key={`${section.id}-${item.path}-${item.label}`}
                      to={href}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                      style={isActive ? { backgroundColor: 'var(--blue-9)', color: 'var(--gray-12)' } : { color: 'var(--gray-11)' }}
                      onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'var(--gray-3)')}
                      onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {!actualCollapsed && (
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-sm font-medium" style={{ fontFamily: "'Nohemi', sans-serif" }}>{item.label}</span>
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
          <div className="absolute bottom-full mb-2 rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', width: '223.45px' }}>
            <div className="py-2">
              {/* User Settings */}
              <button
                onClick={() => {
                  setLocation('/profile');
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors"
                style={{ color: 'var(--gray-11)', fontFamily: "'Nohemi', sans-serif" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User className="w-4 h-4" />
                <span>User Settings</span>
              </button>
              
              {/* Theme Toggle */}
              {darkModeEnabled && (
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors"
                  style={{ color: 'var(--gray-11)', fontFamily: "'Nohemi', sans-serif" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              )}
              
              {/* Divider */}
              <div className="border-t my-1" style={{ borderColor: 'var(--border)' }}></div>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors"
                style={{ color: 'rgb(248, 113, 113)', fontFamily: "'Nohemi', sans-serif" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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





