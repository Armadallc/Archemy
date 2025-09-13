import { ReactNode, useState } from "react";
import { Switch, Route } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Drivers from "@/pages/drivers";
import Vehicles from "@/pages/vehicles";
import Trips from "@/pages/trips";
import EditTrip from "@/pages/edit-trip";
import ColorTest from "@/pages/ColorTest";
import MotionDemo from "@/pages/MotionDemo";
import TwoColorDemo from "@/pages/TwoColorDemo";
import BillingPage from "@/pages/billing";

import CombinedTripsPage from "@/pages/combined-trips";
import Schedule from "@/pages/schedule";
import ServiceAreas from "@/pages/service-areas";
import FrequentLocations from "@/pages/frequent-locations";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import MobilePreview from "@/pages/mobile-preview";
import PermissionsPage from "@/pages/permissions";
import IntegrationsPage from "@/pages/integrations";
import NotFound from "@/pages/not-found";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children?: ReactNode;
  currentOrganization?: string;
  setCurrentOrganization?: (org: string) => void;
  kioskMode?: boolean;
  setKioskMode?: (kiosk: boolean) => void;
}

export default function MainLayout({ 
  children, 
  currentOrganization: propCurrentOrganization, 
  setCurrentOrganization: propSetCurrentOrganization,
  kioskMode: propKioskMode,
  setKioskMode: propSetKioskMode
}: MainLayoutProps = {}) {
  // Use organization context instead of internal state
  const { currentOrganization: contextOrganization, setCurrentOrganization: setContextOrganization } = useOrganization();
  const { user } = useAuth();
  
  // Use internal state for kiosk mode and sidebar collapse
  const [internalKioskMode, setInternalKioskMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Use context organization instead of prop/internal state  
  const currentOrganization = contextOrganization || { id: "littlemonarch_org", name: "Little Monarch", isActive: true };
  const setCurrentOrganization = (orgId: string) => {
    const orgData = { id: orgId, name: orgId.replace('_', ' '), isActive: true };
    setContextOrganization(orgData);
  };
  const kioskMode = propKioskMode ?? internalKioskMode;
  const setKioskMode = propSetKioskMode ?? setInternalKioskMode;
  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--foundation-bg)' }}>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar 
          currentOrganization={currentOrganization.id}
          setCurrentOrganization={setCurrentOrganization}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header - hidden on mobile */}
        <div className="hidden md:block">
          <Header 
            currentOrganization={currentOrganization}
            kioskMode={kioskMode}
            setKioskMode={setKioskMode}
          />
        </div>
        
        {/* Mobile Header */}
        <div className="block md:hidden shadow-sm border-b-2 px-4 py-3" style={{
          backgroundColor: 'var(--foundation-bg)',
          borderColor: 'var(--foundation-border)'
        }}>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--foundation-text)' }}>
              {user?.role === 'driver' ? 'My Trips' : 'Dashboard'}
            </h1>
            <div className="text-sm" style={{ color: 'var(--foundation-text)' }}>
              {user?.userName || user?.email}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto mobile-optimized pb-20 md:pb-0">
          {children || (
            <Switch>
              <Route path="/">
                {() => {
                  console.log('📍 Rendering Dashboard route for user:', user?.email, 'role:', user?.role);
                  return (
                    <Dashboard 
                      currentOrganization={currentOrganization} 
                    />
                  );
                }}
              </Route>
              <Route path="/trips">
                <CombinedTripsPage />
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
              <Route path="/service-areas">
                <ServiceAreas />
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
              <Route path="/integrations">
                <IntegrationsPage />
              </Route>
              <Route path="/mobile-preview">
                <MobilePreview />
              </Route>
              <Route path="/settings">
                <Settings />
              </Route>
              <Route path="/color-test">
                <ColorTest />
              </Route>
              <Route path="/motion-demo">
                <MotionDemo />
              </Route>
              <Route path="/two-color-demo">
                <TwoColorDemo />
              </Route>
              <Route>
                {(params) => {
                  console.log('🚫 NotFound route matched for path:', window.location.pathname, 'params:', params);
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
  );
}