import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Folder, 
  Settings, 
  HelpCircle, 
  Search,
  Database,
  FileText,
  File,
  MoreHorizontal,
  Plus,
  ChevronDown,
  Calendar,
  Car,
  DollarSign,
  MapPin
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import { useDashboardData } from "../hooks/useDashboardData";
import { DEFAULT_PROGRAM_ID, CORPORATE_LEVEL_PROGRAM_ID } from "../lib/environment";
// import { useMockAuth } from "../hooks/useMockAuth"; // Removed - MockAuthProvider not set up
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import EnhancedNotificationCenter from "../components/notifications/EnhancedNotificationCenter";
import RoleToggle from "../components/RoleToggle";
import GlobalSearch from "../components/search/GlobalSearch";

// Import preserved widgets
import LiveOperationsWidget from "../components/dashboard/LiveOperationsWidget";
import FleetStatusWidget from "../components/dashboard/FleetStatusWidget";
import QuickStatsWidget from "../components/dashboard/QuickStatsWidget";
import InteractiveMapWidget from "../components/dashboard/InteractiveMapWidget";
import EnhancedAnalyticsWidget from "../components/dashboard/EnhancedAnalyticsWidget";
import TaskManagementWidget from "../components/dashboard/TaskManagementWidget";
import ActivityFeed from "../components/activity-feed/ActivityFeed";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";
import { RollbackManager } from "../utils/rollback-manager";

// Shadcn Header Component with Time Display
// NOTE: This is kept as fallback when unified header feature flag is disabled
// Will be removed in Phase 3 after full migration
const ShadcnHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const { user } = useAuth();
  const { isOpen, openSearch, closeSearch, handleResultSelect } = useGlobalSearch();

  // Get current role from real auth (mock auth removed - MockAuthProvider not set up)
  const currentRole = user?.role || 'program_admin';

  // Handle role change for testing (disabled - mock auth not available)
  const handleRoleChange = (role: string, userContext: any) => {
    console.warn('Role toggle disabled: MockAuthProvider not set up');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      callback: openSearch,
      description: 'Open global search'
    },
    {
      key: 'Escape',
      callback: closeSearch,
      description: 'Close global search'
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Format time for Mountain Time (Denver) with AM/PM
  const formatMountainTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/Denver',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="px-6 py-6 flex items-center justify-between rounded-lg border backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', height: '150px' }}>
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center text-foreground"
          style={{
            fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
            fontWeight: 700,
            fontSize: '110px',
            lineHeight: 1.15,
            letterSpacing: '-0.015em',
            textTransform: 'none', // Don't uppercase the time
          }}
        >
          {formatMountainTime(currentTime)}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <HeaderScopeSelector />
        <Button
          variant="outline"
          size="sm"
          onClick={openSearch}
          className="flex items-center space-x-2 text-foreground backdrop-blur-sm hover:opacity-80" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', width: '200px' }}
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </Button>
        <EnhancedNotificationCenter />
        
        {/* Role Toggle for Development Testing - Disabled: MockAuthProvider not set up */}
        {false && import.meta.env.DEV && (
          <RoleToggle 
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
            isDevelopment={true}
          />
        )}
      </div>
      
      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isOpen}
        onClose={closeSearch}
        onResultSelect={handleResultSelect}
      />
    </div>
  );
};

// Main Dashboard Component with Shadcn Layout
export default function ShadcnDashboardMigrated() {
  const { user } = useAuth();
  
  // Feature flag check - if unified header is enabled, don't render ShadcnHeader
  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { level, selectedCorporateClient, selectedProgram, activeScope, activeScopeName, getFilterParams, navigateToCorporate, navigateToClient, navigateToProgram } = useHierarchy();
  
  // Get real-time dashboard data (preserving existing functionality)
  const {
    trips: realTimeTrips,
    drivers: realTimeDrivers,
    clients: realTimeClients,
    corporateClients: realTimeCorporateClients,
    programs: realTimePrograms,
    universalTrips: realTimeUniversalTrips,
    metrics: realTimeMetrics,
    isLoading: dataLoading,
    hasError: dataError,
    userRole: realTimeUserRole
  } = useDashboardData();

  // Debug logging
  console.log('🔍 Dashboard data state:', {
    dataLoading,
    dataError,
    realTimeUserRole,
    tripsCount: realTimeTrips?.length || 0,
    driversCount: realTimeDrivers?.length || 0
  });
  

  // PROTECTION: Role validation function
  const validateSuperAdminRole = () => {
    if (realTimeUserRole !== "super_admin") {
      console.error('🚨 CRITICAL: Attempting to access super admin code with wrong role:', realTimeUserRole);
      return false;
    }
    console.log('✅ SUPER ADMIN ROLE VALIDATED - PROCEEDING SAFELY');
    return true;
  };

  // Helper function to get role-based title (scope-aware)
  const getRoleBasedTitle = () => {
    // Use scope-based state if available, otherwise fall back to hierarchy state
    const scopeName = activeScopeName || (activeScope === 'corporate' ? selectedCorporateClient : activeScope === 'program' ? selectedProgram : null);
    
    switch (realTimeUserRole) {
      case "super_admin":
        if (activeScope === 'global') {
          return "HALCYON GLOBAL DASHBOARD";
        } else if (activeScope === 'corporate' && scopeName) {
          return `HALCYON ${scopeName} DASHBOARD`;
        } else if (activeScope === 'program' && scopeName) {
          return `HALCYON ${scopeName} DASHBOARD`;
        }
        return "HALCYON SUPER ADMIN DASHBOARD";
      case "corporate_admin":
        if (activeScope === 'program' && scopeName) {
          return `HALCYON ${scopeName} DASHBOARD`;
        }
        return `HALCYON ${scopeName || selectedCorporateClient || "CORPORATE"} ADMIN DASHBOARD`;
      case "program_admin":
        return `HALCYON ${scopeName || selectedProgram || "PROGRAM"} ADMIN DASHBOARD`;
      case "program_user":
        return `HALCYON ${scopeName || selectedProgram || "PROGRAM"} USER DASHBOARD`;
      case "driver":
        return "HALCYON DRIVER DASHBOARD";
      default:
        return "HALCYON DASHBOARD";
    }
  };

  // Loading state - show animated loading bar
  if (dataLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="relative h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
            <div 
              className="absolute h-full rounded-full"
              style={{
                backgroundColor: '#33ccad',
                width: '40%',
                animation: 'loading-bar-slide 1.5s ease-in-out infinite'
              }}
            />
          </div>
        </div>
        <style>{`
          @keyframes loading-bar-slide {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(300%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
      </div>
    );
  }

  // Error state - show error-colored loading bar
  if (dataError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="relative h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
            <div 
              className="absolute h-full rounded-full"
              style={{
                backgroundColor: '#cc33ab',
                width: '40%',
                animation: 'loading-bar-slide 1.5s ease-in-out infinite'
              }}
            />
          </div>
        </div>
        <style>{`
          @keyframes loading-bar-slide {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(300%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
      </div>
    );
  }

  // Super Admin Dashboard
  if (realTimeUserRole === "super_admin") {
    // PROTECTION: Super Admin Role Guard
    if (!validateSuperAdminRole()) {
      return <div>🚨 ROLE VALIDATION FAILED - ACCESS DENIED</div>;
    }
    console.log('🔒 SUPER ADMIN ROLE CONFIRMED - PROTECTED SECTION ACCESS');
    
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--page-background)' }}>
        <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '24px' }}>
          {/* Header - Only show if unified header is disabled (fallback) */}
          {!ENABLE_UNIFIED_HEADER && (
            <div>
              <ShadcnHeader title={getRoleBasedTitle()} subtitle="System-wide operations and performance overview" />
            </div>
          )}
          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginTop: '16px' }}>
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{realTimeUniversalTrips?.length || 0}</div>
                  <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>All programs</p>
                  <p className="text-xs text-foreground-secondary">System-wide trips</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Active Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>On duty</p>
                  <p className="text-xs text-foreground-secondary">Fleet capacity</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Corporate Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeCorporateClients?.filter((cc: any) => cc.is_active === true).length || 0}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>Active clients</p>
                  <p className="text-xs text-foreground-secondary">System-wide</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{realTimePrograms?.length || 0}</div>
                  <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>Active programs</p>
                  <p className="text-xs text-foreground-secondary">System-wide</p>
                </CardContent>
              </Card>
            </div>


            {/* Operations and Activity Log - Single Row, Reduced Size (40-50% smaller) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: '375px', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
              {/* Left Side: Live Operations Widget */}
              <div className="overflow-hidden" style={{ position: 'relative', zIndex: 10, height: '375px', maxHeight: '375px' }}>
                <div className="shadow-xl" style={{ height: '375px', maxHeight: '375px', overflow: 'hidden' }}>
                  <div style={{ height: '375px', maxHeight: '375px', overflow: 'hidden' }}>
                    <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} className="max-h-[375px]" />
                  </div>
                </div>
              </div>

              {/* Right Side: Activity Log */}
              <div className="flex flex-col overflow-hidden" style={{ position: 'relative', zIndex: 10, height: '375px', maxHeight: '375px' }}>
                <Card className="bg-white/25 dark:bg-card/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl flex flex-col w-full h-full" style={{ height: '375px', maxHeight: '375px', paddingTop: '12px', paddingBottom: '16px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-aqua)' }}>
                  <CardContent className="p-0 flex-1 overflow-hidden flex flex-col min-h-0">
                    <ActivityFeed />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Stats - Full Width Row Below */}
            <div className="mt-4" style={{ position: 'relative', zIndex: 20 }}>
              <QuickStatsWidget trips={realTimeTrips} shadow="xl" />
            </div>

            {/* Fleet Status Widget - Full Width */}
            <div className="mt-4" style={{ position: 'relative', zIndex: 30 }}>
              <FleetStatusWidget drivers={realTimeDrivers} trips={realTimeTrips} shadow="xl" />
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-4">
              <InteractiveMapWidget shadow="xl" />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EnhancedAnalyticsWidget shadow="xl" />
              <TaskManagementWidget shadow="xl" />
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <CardHeader>
                  <CardTitle className="text-foreground">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Corporate Admin Dashboard
  if (realTimeUserRole === "corporate_admin") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--page-background)' }}>
        <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '24px' }}>
          {/* Header - Only show if unified header is disabled (fallback) */}
          {!ENABLE_UNIFIED_HEADER && (
            <ShadcnHeader title={getRoleBasedTitle()} subtitle={`Managing ${selectedCorporateClient || "corporate"} operations`} />
          )}
          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginTop: '16px' }}>
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Today's Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeTrips?.filter((t: any) => {
                      const today = new Date().toDateString();
                      const tripDate = new Date(t.scheduled_pickup_time).toDateString();
                      return tripDate === today;
                    }).length || 0}
                  </div>
                  <p className="text-xs text-foreground">Scheduled today</p>
                  <p className="text-xs text-foreground-secondary">Transportation requests</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Active Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>On duty</p>
                  <p className="text-xs text-foreground-secondary">Fleet capacity</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{realTimeClients?.length || 0}</div>
                  <p className="text-xs text-foreground">Registered clients</p>
                  <p className="text-xs text-foreground-secondary">Service recipients</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{realTimePrograms?.length || 0}</div>
                  <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>Active programs</p>
                  <p className="text-xs text-foreground-secondary">Under management</p>
                </CardContent>
              </Card>
            </div>


            {/* Live Operations Widgets - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-full">
                <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              </div>
              <div className="col-span-full">
                <FleetStatusWidget drivers={realTimeDrivers} trips={realTimeTrips} />
              </div>
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-4">
              <InteractiveMapWidget shadow="xl" />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EnhancedAnalyticsWidget shadow="xl" />
              <TaskManagementWidget shadow="xl" />
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <CardHeader>
                  <CardTitle className="text-foreground">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Preserved */}
            <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <CardHeader>
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Program Admin Dashboard
  if (realTimeUserRole === "program_admin") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--page-background)' }}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <ShadcnHeader title={getRoleBasedTitle()} subtitle={`Managing ${selectedProgram || "program"} operations`} />
          
          
          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Today's Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeTrips?.filter((t: any) => {
                      const today = new Date().toDateString();
                      const tripDate = new Date(t.scheduled_pickup_time).toDateString();
                      return tripDate === today;
                    }).length || 0}
                  </div>
                  <p className="text-xs text-foreground">Scheduled today</p>
                  <p className="text-xs text-foreground-secondary">Transportation requests</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Active Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>On duty</p>
                  <p className="text-xs text-foreground-secondary">Fleet capacity</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{realTimeClients?.length || 0}</div>
                  <p className="text-xs text-foreground">Registered clients</p>
                  <p className="text-xs text-foreground-secondary">Service recipients</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">$12,450</div>
                  <p className="text-xs text-foreground">+12.5% from last month</p>
                  <p className="text-xs text-foreground-secondary">Monthly revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Operations Widgets - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-full">
                <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              </div>
              <div className="col-span-full">
                <FleetStatusWidget drivers={realTimeDrivers} trips={realTimeTrips} />
              </div>
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-4">
              <InteractiveMapWidget shadow="xl" />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EnhancedAnalyticsWidget shadow="xl" />
              <TaskManagementWidget shadow="xl" />
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <CardHeader>
                  <CardTitle className="text-foreground">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Preserved */}
            <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <CardHeader>
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Program User Dashboard
  if (realTimeUserRole === "program_user") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--page-background)' }}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Only show if unified header is disabled (fallback) */}
          {!ENABLE_UNIFIED_HEADER && (
            <ShadcnHeader title={getRoleBasedTitle()} subtitle={`Viewing ${selectedProgram || "program"} data`} />
          )}
          
          
          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Today's Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeTrips?.filter((t: any) => {
                      const today = new Date().toDateString();
                      const tripDate = new Date(t.scheduled_pickup_time).toDateString();
                      return tripDate === today;
                    }).length || 0}
                  </div>
                  <p className="text-xs text-foreground">Scheduled today</p>
                  <p className="text-xs text-foreground-secondary">Transportation requests</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Active Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>On duty</p>
                  <p className="text-xs text-foreground-secondary">Fleet capacity</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{realTimeClients?.length || 0}</div>
                  <p className="text-xs text-foreground">Registered clients</p>
                  <p className="text-xs text-foreground-secondary">Service recipients</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">$12,450</div>
                  <p className="text-xs text-foreground">+12.5% from last month</p>
                  <p className="text-xs text-foreground-secondary">Monthly revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Operations Widgets - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-full">
                <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              </div>
              <div className="col-span-full">
                <FleetStatusWidget drivers={realTimeDrivers} trips={realTimeTrips} />
              </div>
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-4">
              <InteractiveMapWidget shadow="xl" />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EnhancedAnalyticsWidget shadow="xl" />
              <TaskManagementWidget shadow="xl" />
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <CardHeader>
                  <CardTitle className="text-foreground">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Driver Dashboard
  if (realTimeUserRole === "driver") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--page-background)' }}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Only show if unified header is disabled (fallback) */}
          {!ENABLE_UNIFIED_HEADER && (
            <ShadcnHeader title={getRoleBasedTitle()} subtitle="Your daily operations and trip management" />
          )}
          
          
          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Today's Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeTrips?.filter((t: any) => {
                      const today = new Date().toDateString();
                      const tripDate = new Date(t.scheduled_pickup_time).toDateString();
                      return tripDate === today;
                    }).length || 0}
                  </div>
                  <p className="text-xs text-foreground">Scheduled today</p>
                  <p className="text-xs text-foreground-secondary">Your assignments</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Completed</CardTitle>
                  <Car className="h-4 w-4 text-foreground-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeTrips?.filter((t: any) => t.status === 'completed').length || 0}
                  </div>
                  <p className="text-xs text-foreground">This week</p>
                  <p className="text-xs text-foreground-secondary">Successful trips</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">In Progress</CardTitle>
                  <MapPin className="h-4 w-4 text-foreground-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {realTimeTrips?.filter((t: any) => t.status === 'in_progress').length || 0}
                  </div>
                  <p className="text-xs text-foreground">Active now</p>
                  <p className="text-xs text-foreground-secondary">Current trips</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Rating</CardTitle>
                  <BarChart3 className="h-4 w-4 text-foreground-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">4.8</div>
                  <p className="text-xs text-foreground">+0.2 this month</p>
                  <p className="text-xs text-foreground-secondary">Customer satisfaction</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Operations Widgets - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-full">
                <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              </div>
              <div className="col-span-full">
                <FleetStatusWidget drivers={realTimeDrivers} trips={realTimeTrips} />
              </div>
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-4">
              <InteractiveMapWidget shadow="xl" />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EnhancedAnalyticsWidget shadow="xl" />
              <TaskManagementWidget shadow="xl" />
              <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <CardHeader>
                  <CardTitle className="text-foreground">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-status-success-bg dark:bg-status-success-bg rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm font-medium text-status-success dark:text-status-success">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Preserved */}
            <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <CardHeader>
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-purple-500 text-white p-4 text-center font-bold text-xl mb-4">
          🟣 DEFAULT FALLBACK - UNKNOWN ROLE: {realTimeUserRole} 🟣
        </div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>HALCYON Dashboard</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Welcome to HALCYON Transportation Management System</p>
      </div>
    </div>
  );
}