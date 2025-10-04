import React, { ReactNode, useState } from "react";
import { Switch, Route } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import { HierarchicalSidebar } from "../HierarchicalSidebar";
import { HierarchyProvider } from "../../hooks/useHierarchy";
import Dashboard from "../../pages/dashboard";
import Clients from "../../pages/clients";
import Drivers from "../../pages/drivers";
import Vehicles from "../../pages/vehicles";
import EditTrip from "../../pages/edit-trip";
import BillingPage from "../../pages/billing";
import EmptyUniversalCalendar from "../EmptyUniversalCalendar";

import HierarchicalTripsPage from "../HierarchicalTripsPage";
import Schedule from "../../pages/schedule";
import Locations from "../../pages/locations";
import FrequentLocations from "../../pages/frequent-locations";
import Users from "../../pages/users";
import Settings from "../../pages/settings";
import PermissionsPage from "../../pages/permissions";
import Programs from "../../pages/programs";
import CorporateClients from "../../pages/corporate-clients";
// Removed integrations page - was deleted
import NotFound from "../../pages/not-found";
import MobileBottomNav from "../MobileBottomNav";
// Removed useOrganization - using useHierarchy instead
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";

interface MainLayoutProps {
  children?: ReactNode;
  currentProgram?: string;
  setCurrentProgram?: (program: string) => void;
  kioskMode?: boolean;
  setKioskMode?: (kiosk: boolean) => void;
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
  
  // Use internal state for kiosk mode and sidebar collapse
  const [internalKioskMode, setInternalKioskMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <HierarchyProvider>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          {user?.role === 'super_admin' ? (
            <HierarchicalSidebar 
              isCollapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          ) : (
            <Sidebar 
              currentProgram={currentProgramId}
              setCurrentProgram={setCurrentProgram}
              isCollapsed={sidebarCollapsed}
              setIsCollapsed={setSidebarCollapsed}
            />
          )}
        </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header - hidden on mobile */}
        <div className="hidden md:block">
          <Header 
            currentProgram={currentProgramId}
            kioskMode={kioskMode}
            setKioskMode={setKioskMode}
          />
        </div>
        
        {/* Mobile Header */}
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
        
        <div className="flex-1 overflow-auto mobile-optimized pb-20 md:pb-0">
          {children || (
            <Switch>
              <Route path="/">
                {() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('📍 Rendering Dashboard route for user:', user?.email, 'role:', user?.role);
                  }
                  return (
                    <Dashboard 
                      currentProgram={currentProgramId} 
                    />
                  );
                }}
              </Route>
              <Route path="/trips">
                <HierarchicalTripsPage />
              </Route>
              <Route path="/trips/edit/:tripId">
                <EditTrip />
              </Route>
              <Route path="/clients">
                <Clients />
              </Route>
              <Route path="/drivers">
                <Drivers />
              </Route>
              <Route path="/vehicles">
                <Vehicles />
              </Route>
              <Route path="/locations">
                <Locations />
              </Route>
              <Route path="/frequent-locations">
                <FrequentLocations />
              </Route>
              <Route path="/schedule">
                <Schedule />
              </Route>
              <Route path="/users">
                <Users />
              </Route>
              <Route path="/permissions">
                <PermissionsPage />
              </Route>
              <Route path="/billing">
                <BillingPage />
              </Route>
              <Route path="/client-groups">
                <Clients />
              </Route>
              <Route path="/calendar">
                <Dashboard />
              </Route>
              <Route path="/programs">
                <Programs />
              </Route>
              <Route path="/corporate-clients">
                <CorporateClients />
              </Route>
              <Route path="/integrations">
                <NotFound />
              </Route>
              <Route path="/settings">
                <Settings />
              </Route>
              <Route path="/empty-calendar">
                <EmptyUniversalCalendar />
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
          )}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="block md:hidden">
        <MobileBottomNav />
      </div>
      </div>
    </HierarchyProvider>
  );
}