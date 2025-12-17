import React, { ReactNode, useState, Suspense, lazy, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import Sidebar from "./sidebar";
import AdaptiveSidebar from "./AdaptiveSidebar";
import { UnifiedHeader } from "./unified-header";
import { UnifiedHeaderMobile } from "./unified-header-mobile";
import EmptyUniversalCalendar from "../EmptyUniversalCalendar";
import MobileBottomNav from "../MobileBottomNav";
// Removed useOrganization - using useHierarchy instead
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { useLayout } from "../../contexts/layout-context";
import { RollbackManager } from "../../utils/rollback-manager";

// Lazy load pages for code splitting
// Temporarily remove lazy loading to fix React hook errors with useAuth/useHierarchy
import ClientsComponent from "../../pages/clients";
const Clients = ClientsComponent;
import DriversComponent from "../../pages/drivers";
const Drivers = DriversComponent;
import VehiclesComponent from "../../pages/vehicles";
const Vehicles = VehiclesComponent;
const BillingPage = lazy(() => import("../../pages/billing"));
// Temporarily remove lazy loading to fix React hook error with useLocation
import HierarchicalTripsPageComponent from "../HierarchicalTripsPage";
const HierarchicalTripsPage = HierarchicalTripsPageComponent;
const Schedule = lazy(() => import("../../pages/schedule"));
// Temporarily remove lazy loading to fix React hook errors with useAuth/useHierarchy
import FrequentLocationsComponent from "../../pages/frequent-locations";
const FrequentLocations = FrequentLocationsComponent;
const Users = lazy(() => import("../../pages/users"));
// Team Management Pages
const TeamProgramsPage = lazy(() => import("../../pages/team/programs"));
const TeamLocationsPage = lazy(() => import("../../pages/team/locations"));
const TeamStaffPage = lazy(() => import("../../pages/team/staff"));
const TeamClientCensusPage = lazy(() => import("../../pages/team/client-census"));
// Partner Management Pages
const PartnersCorporateClientsPage = lazy(() => import("../../pages/partners/corporate-clients"));
const PartnersBillingPage = lazy(() => import("../../pages/partners/billing").then(module => ({ default: module.default })));
// Temporarily remove lazy loading to fix React hook errors with useAuth/useHierarchy
import SettingsComponent from "../../pages/settings";
const Settings = SettingsComponent;
const RoleTemplatesPage = lazy(() => import("../../pages/role-templates"));
// Temporarily remove lazy loading to fix React hook error with usePageAccess
import CalendarPageComponent from "../../pages/calendar";
const CalendarPage = CalendarPageComponent;
const CalendarExperiment = lazy(() => import("../../pages/calendar-experiment"));
const ShadcnDashboard = lazy(() => import("../../pages/shadcn-dashboard"));
// Temporarily remove lazy loading to fix React hook error
import ShadcnDashboardMigratedComponent from "../../pages/shadcn-dashboard-migrated";
const ShadcnDashboardMigrated = ShadcnDashboardMigratedComponent;
// Temporarily remove lazy loading to fix React hook error with useLocation
import SimpleBookingFormComponent from "../../components/booking/simple-booking-form";
const SimpleBookingForm = SimpleBookingFormComponent;
const EditTrip = lazy(() => import("../../pages/edit-trip"));
const NotFound = lazy(() => import("../../pages/not-found"));
// Design System Pages (lazy loaded - rarely used)
// Temporarily remove lazy loading to fix React hook error
import DesignSystem from "../../pages/design-system";
// DesignSystemDemo removed - consolidated into DesignSystem page
const ScratchPage = lazy(() => import("../../pages/scratch"));
const TypographyTest = lazy(() => import("../../pages/typography-test"));
const Analytics = lazy(() => import("../../pages/analytics"));
const ProphetPage = lazy(() => import("../../pages/prophet"));
const ActivityFeedPage = lazy(() => import("../../pages/activity-feed"));
const KanbanPage = lazy(() => import("../../pages/kanban"));
const GanttPage = lazy(() => import("../../pages/gantt"));
// Temporarily remove lazy loading to fix React hook error
import ChatPageComponent from "../../pages/chat";
const ChatPage = ChatPageComponent;
const ProfilePage = lazy(() => import("../../pages/profile"));

interface MainLayoutProps {
  children?: ReactNode;
  currentProgram?: string;
  setCurrentProgram?: (program: string) => void;
  kioskMode?: boolean;
  setKioskMode?: (kiosk: boolean) => void;
}

// Redirect component for /login route
function LoginRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation('/');
  }, [setLocation]);
  return null;
}

// Redirect component for old calendar-experiment path
function CalendarExperimentRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation('/bentobox');
  }, [setLocation]);
  return null;
}

// Redirect component for super admins from /users to /settings?tab=users
function UsersRedirect() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.role === 'super_admin') {
      setLocation('/settings?tab=users');
    }
  }, [setLocation, user]);
  
  // If not super admin, show the regular users page
  if (user?.role !== 'super_admin') {
    return <Users />;
  }
  
  return null;
}

export default function MainLayout({ 
  children, 
  currentProgram: propCurrentProgram, 
  setCurrentProgram: propSetCurrentProgram,
  kioskMode: propKioskMode,
  setKioskMode: propSetKioskMode
}: MainLayoutProps = {}) {
  // Use hierarchy context instead of organization context
  const { selectedProgram } = useHierarchy();
  const { user } = useAuth();
  const layout = useLayout();
  const [location] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Track route changes for loading states
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300); // Brief loading state for route transitions
    
    return () => clearTimeout(timer);
  }, [location]);
  
  // Feature flag for unified header
  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();
  
  // Use internal state for kiosk mode and sidebar collapse
  const [internalKioskMode, setInternalKioskMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Sync sidebar collapse with layout context
  useEffect(() => {
    if (sidebarCollapsed !== layout.isSidebarCollapsed) {
      if (sidebarCollapsed) {
        layout.toggleSidebarCollapsed();
      }
    }
  }, [sidebarCollapsed, layout]);
  
  // Log feature flag state in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Unified Header Feature Flag:', ENABLE_UNIFIED_HEADER ? 'ENABLED' : 'DISABLED');
      console.log('   Toggle with: window.HALCYON_ROLLBACK.toggleUnifiedHeader()');
    }
  }, [ENABLE_UNIFIED_HEADER]);

  // Use hierarchy program instead of prop/internal state  
  const currentProgramId = selectedProgram || "monarch_competency";
  const setCurrentProgram = (programId: string) => {
    // Program switching is now handled by useHierarchy hook
    // This function is kept for backward compatibility
    if (process.env.NODE_ENV === 'development') {
      console.log('Program switching handled by useHierarchy hook:', programId);
    }
  };
  const kioskMode = propKioskMode ?? internalKioskMode;
  const setKioskMode = propSetKioskMode ?? setInternalKioskMode;
  return (
    <div className="flex h-screen bg-background" style={{ backgroundColor: 'rgba(255, 255, 255, 0)', background: 'unset' }}>
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block" style={{ marginTop: '24px', marginBottom: '24px', backgroundColor: 'var(--card)' }}>
          <AdaptiveSidebar 
            currentProgram={currentProgramId}
            setCurrentProgram={setCurrentProgram}
            isCollapsed={sidebarCollapsed}
            setIsCollapsed={setSidebarCollapsed}
          />
        </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Route Transition Loading Indicator - Fixed at top */}
        {isNavigating && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: '100%' }}
            />
          </div>
        )}
        
        {/* Mobile Header - Unified Header Mobile when enabled, fallback otherwise */}
        {ENABLE_UNIFIED_HEADER && layout.isHeaderVisible ? (
          <div className="block md:hidden">
            <UnifiedHeaderMobile showSearch={true} />
          </div>
        ) : (
          <div className="block md:hidden shadow-sm border-b-2 px-4 py-3 bg-background border-border">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-foreground">
                {user?.role === 'driver' ? 'My Trips' : 'Dashboard'}
              </h1>
              <div className="text-sm text-foreground">
                {user?.user_name || user?.email}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-auto mobile-optimized pb-20 md:pb-0">
          
          {/* Unified Header - Desktop only, feature flagged */}
          {ENABLE_UNIFIED_HEADER && layout.isHeaderVisible && (
            <div className="hidden md:block px-6 pt-6">
              <UnifiedHeader showTimeDisplay={false} showSearch={true} />
            </div>
          )}
          
          {/* Page Content Area */}
          {children || (
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
                  <p style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
                </div>
              </div>
            }>
              <Switch>
              {/* Redirect /login to dashboard for authenticated users */}
              <Route path="/login">
                <LoginRedirect />
              </Route>
              {/* Hierarchical Routes - Corporate Client + Program (must come before corporate-client-only routes) */}
              <Route path="/corporate-client/:corporateClientId/program/:programId/settings">
                <Settings />
              </Route>
              <Route path="/corporate-client/:corporateClientId/program/:programId/chat">
                <ChatPage />
              </Route>
              <Route path="/corporate-client/:corporateClientId/program/:programId/trips">
                <HierarchicalTripsPage />
              </Route>
              <Route path="/corporate-client/:corporateClientId/program/:programId/clients">
                <Clients />
              </Route>
              <Route path="/corporate-client/:corporateClientId/program/:programId/frequent-locations">
                <FrequentLocations />
              </Route>
              <Route path="/corporate-client/:corporateClientId/program/:programId/drivers">
                <Drivers />
              </Route>
              <Route path="/corporate-client/:corporateClientId/program/:programId/vehicles">
                <Vehicles />
              </Route>
              <Route path="/corporate-client/:corporateClientId/program/:programId/calendar">
                <CalendarPage />
              </Route>
              <Route path="/corporate-client/:corporateClientId/program/:programId">
                <ShadcnDashboardMigrated />
              </Route>

              {/* Hierarchical Routes - Corporate Client Only */}
              <Route path="/corporate-client/:corporateClientId/settings">
                <Settings />
              </Route>
              <Route path="/corporate-client/:corporateClientId/chat">
                <ChatPage />
              </Route>
              <Route path="/corporate-client/:corporateClientId/trips">
                <HierarchicalTripsPage />
              </Route>
              <Route path="/corporate-client/:corporateClientId/clients">
                <Clients />
              </Route>
              <Route path="/corporate-client/:corporateClientId/frequent-locations">
                <FrequentLocations />
              </Route>
              <Route path="/corporate-client/:corporateClientId/drivers">
                <Drivers />
              </Route>
              <Route path="/corporate-client/:corporateClientId/vehicles">
                <Vehicles />
              </Route>
              <Route path="/corporate-client/:corporateClientId/calendar">
                <CalendarPage />
              </Route>
              <Route path="/corporate-client/:corporateClientId">
                <ShadcnDashboardMigrated />
              </Route>

              {/* Flat Routes (for Super Admin and backward compatibility) */}
              <Route path="/">
                {() => {
                  if (process.env.NODE_ENV === 'development') {
                    // console.log('📍 Rendering Migrated Dashboard route for user:', user?.email, 'role:', user?.role);
                  }
                  return (
                    <ShadcnDashboardMigrated />
                  );
                }}
              </Route>
              <Route path="/trips">
                <HierarchicalTripsPage />
              </Route>
              {/* Team Management Routes */}
              <Route path="/team/programs">
                <TeamProgramsPage />
              </Route>
              <Route path="/team/locations">
                <TeamLocationsPage />
              </Route>
              <Route path="/team/staff">
                <TeamStaffPage />
              </Route>
              <Route path="/team/client-census">
                <TeamClientCensusPage />
              </Route>
              <Route path="/team/frequent-locations">
                <FrequentLocations />
              </Route>
              
              {/* Partner Management Routes (Super Admin Only) */}
              <Route path="/partners/corporate-clients">
                <PartnersCorporateClientsPage />
              </Route>
              <Route path="/partners/billing">
                <PartnersBillingPage />
              </Route>
              
              {/* Operations Routes */}
              <Route path="/operations/clients">
                <Clients />
              </Route>
              {/* Legacy /clients route redirects to operations/clients for backward compatibility */}
              <Route path="/clients">
                <Clients />
              </Route>
              <Route path="/drivers">
                <Drivers />
              </Route>
              <Route path="/vehicles">
                <Vehicles />
              </Route>
              {/* Legacy /frequent-locations route redirects to team/frequent-locations for backward compatibility */}
              <Route path="/frequent-locations">
                <FrequentLocations />
              </Route>
              <Route path="/schedule">
                <Schedule />
              </Route>
              <Route path="/users">
                <UsersRedirect />
              </Route>
              <Route path="/profile">
                <ProfilePage />
              </Route>
              {/* Role Templates route removed - roles are now in Settings > Tenant Roles tab */}
              {/* <Route path="/role-templates">
                <RoleTemplatesPage />
              </Route> */}
              <Route path="/permissions">
                <RoleTemplatesPage /> {/* Redirect to role templates for backward compatibility */}
              </Route>
              <Route path="/billing">
                <BillingPage />
              </Route>
              <Route path="/client-groups">
                <Clients />
              </Route>
              <Route path="/calendar">
                <CalendarPage />
              </Route>
              {/* Redirect old calendar-experiment path to bentobox */}
              <Route path="/calendar-experiment">
                <CalendarExperimentRedirect />
              </Route>
              <Route path="/bentobox">
                <CalendarExperiment />
              </Route>
        <Route path="/scratch">
          <ScratchPage />
        </Route>
        <Route path="/shadcn-dashboard">
          <ShadcnDashboard />
        </Route>
              <Route path="/shadcn-dashboard-migrated">
                <ShadcnDashboardMigrated />
              </Route>
              <Route path="/trips/new">
                <div className="px-4 sm:px-6 py-6">
                  <div className="max-w-2xl mx-auto">
                    <SimpleBookingForm />
                  </div>
                </div>
              </Route>
              <Route path="/trips/edit/:tripId">
                <div className="px-4 sm:px-6 py-6">
                  <div className="max-w-2xl mx-auto">
                    <EditTrip />
                  </div>
                </div>
              </Route>
              <Route path="/integrations">
                <NotFound />
              </Route>
              <Route path="/settings">
                <Settings />
              </Route>
              <Route path="/analytics">
                <Analytics />
              </Route>
              <Route path="/prophet">
                <ProphetPage />
              </Route>
              <Route path="/activity-feed">
                <ActivityFeedPage />
              </Route>
              <Route path="/kanban">
                <KanbanPage />
              </Route>
              <Route path="/gantt">
                <GanttPage />
              </Route>
              <Route path="/chat">
                <ChatPage />
              </Route>
              <Route path="/empty-calendar">
                <EmptyUniversalCalendar />
              </Route>
              <Route path="/design-system">
                <DesignSystem />
              </Route>
              {/* DesignSystemDemo route removed - consolidated into DesignSystem */}
              <Route path="/typography-test">
                <TypographyTest />
              </Route>
              <Route>
                {(params) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('🚫 NotFound route matched for path:', window.location.pathname, 'params:', params);
                  }
                  return <NotFound />;
                }}
              </Route>
            </Switch>
            </Suspense>
          )}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="block md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}