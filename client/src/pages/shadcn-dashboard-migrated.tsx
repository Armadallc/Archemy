import React, { useState } from "react";
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
  Download,
  Github,
  ChevronDown,
  Calendar,
  Car,
  DollarSign,
  MapPin,
  Bug
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import { useDashboardData } from "../hooks/useDashboardData";
import { DEFAULT_PROGRAM_ID, CORPORATE_LEVEL_PROGRAM_ID } from "../lib/environment";

// Import preserved widgets
import LiveOperationsWidget from "../components/dashboard/LiveOperationsWidget";
import FleetStatusWidget from "../components/dashboard/FleetStatusWidget";
import RevenueWidget from "../components/dashboard/RevenueWidget";
import PerformanceMetricsWidget from "../components/dashboard/PerformanceMetricsWidget";
import InteractiveMapWidget from "../components/dashboard/InteractiveMapWidget";
import EnhancedAnalyticsWidget from "../components/dashboard/EnhancedAnalyticsWidget";
import TaskManagementWidget from "../components/dashboard/TaskManagementWidget";
import EnhancedActivityFeed from "../components/EnhancedActivityFeed";
import DebugPanel from "../components/DebugPanel";

// Shadcn Header Component
const ShadcnHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between border-b border-gray-700">
    <div className="flex items-center gap-3">
      <LayoutDashboard className="w-5 h-5" />
      <div>
        <span className="text-lg font-medium">{title}</span>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-white hover:bg-gray-700">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-white hover:bg-gray-700">
        <Github className="w-4 h-4 mr-2" />
        GitHub
      </Button>
    </div>
  </div>
);

// Main Dashboard Component with Shadcn Layout
export default function ShadcnDashboardMigrated() {
  console.log('🔵 ShadcnDashboardMigrated component is rendering');
  console.log('🔴 VERIFICATION DOT SHOULD BE VISIBLE NOW - CHECK THE DASHBOARD');
  
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const { level, selectedCorporateClient, selectedProgram, getFilterParams, navigateToCorporate, navigateToClient, navigateToProgram } = useHierarchy();
  
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
  
  console.log('🔴 RENDERING VERIFICATION DOT NOW - CHECK THE DASHBOARD');
  console.log('🔍 Current user role:', realTimeUserRole);
  console.log('🔍 Data loading state:', dataLoading);
  console.log('🔍 Data error state:', dataError);

  // PROTECTION: Role validation function
  const validateSuperAdminRole = () => {
    if (realTimeUserRole !== "super_admin") {
      console.error('🚨 CRITICAL: Attempting to access super admin code with wrong role:', realTimeUserRole);
      return false;
    }
    console.log('✅ SUPER ADMIN ROLE VALIDATED - PROCEEDING SAFELY');
    return true;
  };

  // Helper function to get role-based title
  const getRoleBasedTitle = () => {
    switch (realTimeUserRole) {
      case "super_admin":
        return "HALCYON SUPER ADMIN DASHBOARD";
      case "corporate_admin":
        return `HALCYON ${selectedCorporateClient || "CORPORATE"} ADMIN DASHBOARD`;
      case "program_admin":
        return `HALCYON ${selectedProgram || "PROGRAM"} ADMIN DASHBOARD`;
      case "program_user":
        return `HALCYON ${selectedProgram || "PROGRAM"} USER DASHBOARD`;
      case "driver":
        return "HALCYON DRIVER DASHBOARD";
      default:
        return "HALCYON DASHBOARD";
    }
  };

  // Loading state
  if (dataLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-500 text-white p-4 text-center font-bold text-xl mb-4">
            🟡 LOADING STATE - DATA IS LOADING 🟡
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Loading HALCYON Dashboard...</h1>
          <p className="text-gray-400">Please wait while we load your dashboard.</p>
          
          {/* VERIFICATION DOT IN LOADING STATE */}
          <div className="mt-8 p-6 bg-red-600 rounded-lg border-4 border-yellow-400 shadow-2xl">
            <div className="text-white font-bold text-2xl">🔴 VERIFICATION DOT - LOADING STATE 🔴</div>
            <div className="text-yellow-200 text-lg">This should be visible while loading</div>
            <div className="text-yellow-100 text-sm">User Role: {realTimeUserRole || 'Unknown'}</div>
            <div className="text-yellow-100 text-sm">Data Loading: {dataLoading ? 'Yes' : 'No'}</div>
            <div className="text-yellow-100 text-sm">Data Error: {dataError ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (dataError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500 text-white p-4 text-center font-bold text-xl mb-4">
            🔴 ERROR STATE - DATA LOADING FAILED 🔴
          </div>
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading HALCYON Dashboard</h1>
          <p className="text-gray-400">There was an error loading your dashboard data.</p>
          
          {/* VERIFICATION DOT IN ERROR STATE */}
          <div className="mt-8 p-6 bg-red-600 rounded-lg border-4 border-yellow-400 shadow-2xl">
            <div className="text-white font-bold text-2xl">🔴 VERIFICATION DOT - ERROR STATE 🔴</div>
            <div className="text-yellow-200 text-lg">This should be visible even with API errors</div>
            <div className="text-yellow-100 text-sm">User Role: {realTimeUserRole || 'Unknown'}</div>
            <div className="text-yellow-100 text-sm">Data Loading: {dataLoading ? 'Yes' : 'No'}</div>
            <div className="text-yellow-100 text-sm">Data Error: {dataError ? 'Yes' : 'No'}</div>
          </div>
        </div>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* COMPONENT VERIFICATION - BRIGHT RED BAR */}
        <div className="bg-red-500 text-white p-4 text-center font-bold text-xl">
          🔴 SHADCN DASHBOARD MIGRATED COMPONENT IS RENDERING 🔴
        </div>
        
        {/* PROTECTION BANNER - DO NOT DELETE */}
        <div className="bg-blue-600 text-white p-2 text-center font-bold text-sm">
          🔒 SUPER ADMIN PROTECTED SECTION - VERIFIED MAPPING ACTIVE 🔒
        </div>
        {/* Header */}
        <ShadcnHeader title={getRoleBasedTitle()} subtitle="System-wide operations and performance overview" />
        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Trips</CardTitle>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{realTimeUniversalTrips?.length || 0}</div>
                  <p className="text-xs text-green-400">All programs</p>
                  <p className="text-xs text-gray-500">System-wide trips</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Active Drivers</CardTitle>
                  <Car className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs text-green-400">On duty</p>
                  <p className="text-xs text-gray-500">Fleet capacity</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Corporate Clients</CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{realTimeCorporateClients?.length || 0}</div>
                  <p className="text-xs text-green-400">Active clients</p>
                  <p className="text-xs text-gray-500">System-wide</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Programs</CardTitle>
                  <Folder className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{realTimePrograms?.length || 0}</div>
                  <p className="text-xs text-green-400">Active programs</p>
                  <p className="text-xs text-gray-500">System-wide</p>
                </CardContent>
              </Card>
            </div>

            {/* ======================================== */}
            {/* 🔒 CRITICAL VERIFICATION DOT - PROTECTED 🔒 */}
            {/* DO NOT DELETE, MODIFY, OR MOVE THIS SECTION */}
            {/* This is the verification element for super admin dashboard */}
            {/* ======================================== */}
            <div className="flex justify-center items-center p-6 bg-red-600 rounded-lg mb-6 border-4 border-yellow-400 shadow-2xl">
              <div className="w-12 h-12 bg-yellow-300 rounded-full animate-pulse mr-4"></div>
              <div className="text-center">
                <div className="text-white font-bold text-2xl">🔴 VERIFICATION DOT 🔴</div>
                <div className="text-yellow-200 text-lg">DASHBOARD WIDGETS AREA</div>
                <div className="text-yellow-100 text-sm">This should be visible on the main dashboard</div>
                <div className="text-yellow-100 text-xs mt-2">🔒 SUPER ADMIN PROTECTED ELEMENT 🔒</div>
              </div>
            </div>
            {/* ======================================== */}
            {/* END CRITICAL VERIFICATION DOT SECTION */}
            {/* ======================================== */}

            {/* Live Operations Widgets - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              <FleetStatusWidget drivers={realTimeDrivers} />
              <RevenueWidget trips={realTimeTrips} />
              <PerformanceMetricsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-6">
              <InteractiveMapWidget />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EnhancedAnalyticsWidget />
              <TaskManagementWidget />
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Preserved */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Debug Button */}
        <button
          onClick={() => setShowDebugPanel(true)}
          className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Open Debug Panel"
        >
          <Bug className="h-5 w-5" />
        </button>

        {/* Debug Panel */}
        <DebugPanel 
          isOpen={showDebugPanel} 
          onClose={() => setShowDebugPanel(false)} 
        />
      </div>
    );
  }

  // Corporate Admin Dashboard
  if (realTimeUserRole === "corporate_admin") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ShadcnHeader title={getRoleBasedTitle()} subtitle={`Managing ${selectedCorporateClient || "corporate"} operations`} />
        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Today's Trips</CardTitle>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeTrips?.filter((t: any) => {
                      const today = new Date().toDateString();
                      const tripDate = new Date(t.scheduled_pickup_time).toDateString();
                      return tripDate === today;
                    }).length || 0}
                  </div>
                  <p className="text-xs text-green-400">Scheduled today</p>
                  <p className="text-xs text-gray-500">Transportation requests</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Active Drivers</CardTitle>
                  <Car className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs text-green-400">On duty</p>
                  <p className="text-xs text-gray-500">Fleet capacity</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{realTimeClients?.length || 0}</div>
                  <p className="text-xs text-green-400">Registered clients</p>
                  <p className="text-xs text-gray-500">Service recipients</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Programs</CardTitle>
                  <Folder className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{realTimePrograms?.length || 0}</div>
                  <p className="text-xs text-green-400">Active programs</p>
                  <p className="text-xs text-gray-500">Under management</p>
                </CardContent>
              </Card>
            </div>

            {/* VERIFICATION BLUE DOT - PLEASE CONFIRM YOU SEE THIS */}
            <div className="flex justify-center items-center p-6 bg-red-600 rounded-lg mb-6 border-4 border-yellow-400 shadow-2xl">
              <div className="w-12 h-12 bg-yellow-300 rounded-full animate-pulse mr-4"></div>
              <div className="text-center">
                <div className="text-white font-bold text-2xl">🔴 VERIFICATION DOT 🔴</div>
                <div className="text-yellow-200 text-lg">DASHBOARD WIDGETS AREA</div>
                <div className="text-yellow-100 text-sm">This should be visible on the main dashboard</div>
              </div>
            </div>

            {/* Live Operations Widgets - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              <FleetStatusWidget drivers={realTimeDrivers} />
              <RevenueWidget trips={realTimeTrips} />
              <PerformanceMetricsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-6">
              <InteractiveMapWidget />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EnhancedAnalyticsWidget />
              <TaskManagementWidget />
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Preserved */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Debug Button */}
        <button
          onClick={() => setShowDebugPanel(true)}
          className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Open Debug Panel"
        >
          <Bug className="h-5 w-5" />
        </button>

        {/* Debug Panel */}
        <DebugPanel 
          isOpen={showDebugPanel} 
          onClose={() => setShowDebugPanel(false)} 
        />
      </div>
    );
  }

  // Program Admin Dashboard
  if (realTimeUserRole === "program_admin") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ShadcnHeader title={getRoleBasedTitle()} subtitle={`Managing ${selectedProgram || "program"} operations`} />
        
        {/* VERIFICATION BLUE DOT - PLEASE CONFIRM YOU SEE THIS */}
        <div className="bg-red-500 text-white p-4 text-center font-bold text-xl">
          🔴 PROGRAM ADMIN VERIFICATION DOT 🔴
        </div>
        
        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Today's Trips</CardTitle>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeTrips?.filter((t: any) => {
                      const today = new Date().toDateString();
                      const tripDate = new Date(t.scheduled_pickup_time).toDateString();
                      return tripDate === today;
                    }).length || 0}
                  </div>
                  <p className="text-xs text-green-400">Scheduled today</p>
                  <p className="text-xs text-gray-500">Transportation requests</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Active Drivers</CardTitle>
                  <Car className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs text-green-400">On duty</p>
                  <p className="text-xs text-gray-500">Fleet capacity</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{realTimeClients?.length || 0}</div>
                  <p className="text-xs text-green-400">Registered clients</p>
                  <p className="text-xs text-gray-500">Service recipients</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">$12,450</div>
                  <p className="text-xs text-green-400">+12.5% from last month</p>
                  <p className="text-xs text-gray-500">Monthly revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Operations Widgets - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              <FleetStatusWidget drivers={realTimeDrivers} />
              <RevenueWidget trips={realTimeTrips} />
              <PerformanceMetricsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-6">
              <InteractiveMapWidget />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EnhancedAnalyticsWidget />
              <TaskManagementWidget />
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Preserved */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Debug Button */}
        <button
          onClick={() => setShowDebugPanel(true)}
          className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Open Debug Panel"
        >
          <Bug className="h-5 w-5" />
        </button>

        {/* Debug Panel */}
        <DebugPanel 
          isOpen={showDebugPanel} 
          onClose={() => setShowDebugPanel(false)} 
        />
      </div>
    );
  }

  // Program User Dashboard
  if (realTimeUserRole === "program_user") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ShadcnHeader title={getRoleBasedTitle()} subtitle={`Viewing ${selectedProgram || "program"} data`} />
        
        {/* VERIFICATION BLUE DOT - PLEASE CONFIRM YOU SEE THIS */}
        <div className="bg-red-500 text-white p-4 text-center font-bold text-xl">
          🔴 PROGRAM USER VERIFICATION DOT 🔴
        </div>
        
        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Today's Trips</CardTitle>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeTrips?.filter((t: any) => {
                      const today = new Date().toDateString();
                      const tripDate = new Date(t.scheduled_pickup_time).toDateString();
                      return tripDate === today;
                    }).length || 0}
                  </div>
                  <p className="text-xs text-green-400">Scheduled today</p>
                  <p className="text-xs text-gray-500">Transportation requests</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Active Drivers</CardTitle>
                  <Car className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs text-green-400">On duty</p>
                  <p className="text-xs text-gray-500">Fleet capacity</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{realTimeClients?.length || 0}</div>
                  <p className="text-xs text-green-400">Registered clients</p>
                  <p className="text-xs text-gray-500">Service recipients</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">$12,450</div>
                  <p className="text-xs text-green-400">+12.5% from last month</p>
                  <p className="text-xs text-gray-500">Monthly revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Operations Widgets - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              <FleetStatusWidget drivers={realTimeDrivers} />
              <RevenueWidget trips={realTimeTrips} />
              <PerformanceMetricsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-6">
              <InteractiveMapWidget />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EnhancedAnalyticsWidget />
              <TaskManagementWidget />
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Preserved */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Debug Button */}
        <button
          onClick={() => setShowDebugPanel(true)}
          className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Open Debug Panel"
        >
          <Bug className="h-5 w-5" />
        </button>

        {/* Debug Panel */}
        <DebugPanel 
          isOpen={showDebugPanel} 
          onClose={() => setShowDebugPanel(false)} 
        />
      </div>
    );
  }

  // Driver Dashboard
  if (realTimeUserRole === "driver") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ShadcnHeader title={getRoleBasedTitle()} subtitle="Your daily operations and trip management" />
        
        {/* VERIFICATION BLUE DOT - PLEASE CONFIRM YOU SEE THIS */}
        <div className="bg-red-500 text-white p-4 text-center font-bold text-xl">
          🔴 DRIVER VERIFICATION DOT 🔴
        </div>
        
        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900">
          <div className="space-y-6">
            {/* Stats Cards - Shadcn Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Today's Trips</CardTitle>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeTrips?.filter((t: any) => {
                      const today = new Date().toDateString();
                      const tripDate = new Date(t.scheduled_pickup_time).toDateString();
                      return tripDate === today;
                    }).length || 0}
                  </div>
                  <p className="text-xs text-green-400">Scheduled today</p>
                  <p className="text-xs text-gray-500">Your assignments</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Completed</CardTitle>
                  <Car className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeTrips?.filter((t: any) => t.status === 'completed').length || 0}
                  </div>
                  <p className="text-xs text-green-400">This week</p>
                  <p className="text-xs text-gray-500">Successful trips</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">In Progress</CardTitle>
                  <MapPin className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {realTimeTrips?.filter((t: any) => t.status === 'in_progress').length || 0}
                  </div>
                  <p className="text-xs text-green-400">Active now</p>
                  <p className="text-xs text-gray-500">Current trips</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Rating</CardTitle>
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">4.8</div>
                  <p className="text-xs text-green-400">+0.2 this month</p>
                  <p className="text-xs text-gray-500">Customer satisfaction</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Operations Widgets - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <LiveOperationsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              <FleetStatusWidget drivers={realTimeDrivers} />
              <RevenueWidget trips={realTimeTrips} />
              <PerformanceMetricsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
            </div>

            {/* Interactive Map - Preserved */}
            <div className="mt-6">
              <InteractiveMapWidget />
            </div>

            {/* Analytics & Management - Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EnhancedAnalyticsWidget />
              <TaskManagementWidget />
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Database</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">API</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">WebSocket</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Preserved */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Debug Button */}
        <button
          onClick={() => setShowDebugPanel(true)}
          className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Open Debug Panel"
        >
          <Bug className="h-5 w-5" />
        </button>

        {/* Debug Panel */}
        <DebugPanel 
          isOpen={showDebugPanel} 
          onClose={() => setShowDebugPanel(false)} 
        />
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
        <h1 className="text-2xl font-bold text-white mb-4">HALCYON Dashboard</h1>
        <p className="text-gray-400">Welcome to HALCYON Transportation Management System</p>
      </div>
    </div>
  );
}