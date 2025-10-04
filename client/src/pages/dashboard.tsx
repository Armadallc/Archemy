import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Plus, Building2, Users, Car, Calendar, MapPin, ChevronDown, ArrowLeft, Bug } from "lucide-react";
import DashboardStats from "../components/stats/dashboard-stats";
import SimpleBookingForm from "../components/booking/simple-booking-form";
import DriverDashboard from "../components/DriverDashboard";
import RecentActivity from "../components/RecentActivity";
import DebugPanel from "../components/DebugPanel";
import EnhancedActivityFeed from "../components/EnhancedActivityFeed";
// EnhancedTripCalendar moved to dedicated calendar page
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import { DEFAULT_PROGRAM_ID, CORPORATE_LEVEL_PROGRAM_ID } from "../lib/environment";
import { Link } from "wouter";

interface DashboardProps {
  currentProgram?: string;
}

export default function Dashboard({ 
  currentProgram = DEFAULT_PROGRAM_ID 
}: DashboardProps) {
  const { user } = useAuth();
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const { level, selectedCorporateClient, selectedProgram, getFilterParams, navigateToCorporate, navigateToClient, navigateToProgram } = useHierarchy();
  
  const userRole = user?.role || "program_admin";
  
  // Super admin detection - corporate level access
  // Super admin should have primary_program_id = null AND role = 'super_admin'
  const isSuperAdmin = userRole === 'super_admin' && user?.primary_program_id === null;
  
  // Use hierarchical context for data filtering
  const filterParams = getFilterParams();
  const activeProgram = isSuperAdmin && level === 'corporate' 
    ? CORPORATE_LEVEL_PROGRAM_ID  // null for corporate level - shows all data
    : filterParams.programId || selectedProgram || user?.primary_program_id || currentProgram;
  
  // Debug logging for driver authentication
  console.log('🎯 Dashboard - User:', user?.email, 'Role:', userRole, 'Level:', level, 'Program:', activeProgram, 'IsSuperAdmin:', isSuperAdmin);

  // Fetch data based on user role and hierarchy level
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ["/api/trips", activeProgram, userRole, level, filterParams],
    queryFn: async () => {
      if (userRole === "driver") {
        // For drivers, find their driver record and fetch assigned trips
        const driversResponse = await apiRequest("GET", `/api/drivers/program/${activeProgram}`);
        const driversData = await driversResponse.json();
        const driverRecord = driversData.find((d: any) => d.user_id === user?.user_id);
        
        if (driverRecord) {
          const response = await apiRequest("GET", `/api/trips/driver/${driverRecord.id}`);
          return await response.json();
        }
        return [];
      } else {
        // For other roles, fetch program trips
        const response = await apiRequest("GET", `/api/trips/program/${activeProgram}`);
        return await response.json();
      }
    },
    enabled: !!user && !!activeProgram && !isSuperAdmin, // Don't fetch program trips for super admin
  });

  // Fetch drivers for the active program
  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ["/api/drivers", activeProgram],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/drivers/program/${activeProgram}`);
      return await response.json();
    },
    enabled: !!user && !!activeProgram && !isSuperAdmin, // Don't fetch program data for super admin
  });

  // Fetch clients for the active program
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients", activeProgram],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/program/${activeProgram}`);
      return await response.json();
    },
    enabled: !!user && !!activeProgram && !isSuperAdmin, // Don't fetch program data for super admin
  });

  // Fetch client groups for the active program
  const { data: clientGroupsData, isLoading: clientGroupsLoading } = useQuery({
    queryKey: ["/api/client-groups", activeProgram],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/client-groups/program/${activeProgram}`);
      return await response.json();
    },
    enabled: !!user && !!activeProgram && !isSuperAdmin, // Don't fetch program data for super admin
  });

  // Corporate data fetching for super admin
  const { data: corporateClients, isLoading: corporateClientsLoading, error: corporateClientsError } = useQuery({
    queryKey: ["/api/corporate-clients", level, filterParams],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/corporate-clients");
      const data = await response.json();
      return data;
    },
    enabled: isSuperAdmin
  });


  const { data: corporatePrograms, isLoading: programsLoading } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/programs");
      return await response.json();
    },
    enabled: isSuperAdmin
  });

  const { data: universalTrips, isLoading: universalTripsLoading } = useQuery({
    queryKey: ["/api/trips"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/trips");
      return await response.json();
    },
    enabled: isSuperAdmin
  });

  const { data: fleetData, isLoading: fleetLoading } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/vehicles");
      return await response.json();
    },
    enabled: isSuperAdmin
  });

  const { data: corporateDriversData, isLoading: corporateDriversLoading } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/drivers");
      return await response.json();
    },
    enabled: isSuperAdmin
  });

  // Filter data based on selected corporate client
  const filteredPrograms = selectedCorporateClient 
    ? corporatePrograms?.filter((p: any) => p.corporate_client_id === selectedCorporateClient)
    : corporatePrograms;

  const filteredTrips = selectedCorporateClient
    ? universalTrips?.filter((t: any) => t.program?.corporate_client_id === selectedCorporateClient)
    : universalTrips;

  const selectedCorporateClientData = selectedCorporateClient
    ? corporateClients?.corporateClients?.find((c: any) => c.id === selectedCorporateClient)
    : null;

  // Get organization display name
  const getOrganizationDisplayName = () => {
    if (selectedProgram) {
      return selectedProgram;
    }
    if (selectedCorporateClient) {
      return `${selectedCorporateClient} Dashboard`;
    }
    return "MONARCH COMPETENCY DASHBOARD";
  };

  // Get role-based title
  const getRoleBasedTitle = () => {
    switch (userRole) {
      case "super_admin":
        return "SUPER ADMIN DASHBOARD";
      case "corporate_admin":
        return `${selectedCorporateClient || "CORPORATE"} ADMIN DASHBOARD`;
      case "program_admin":
        return `${selectedProgram || "PROGRAM"} ADMIN DASHBOARD`;
      case "program_user":
        return `${selectedProgram || "PROGRAM"} USER DASHBOARD`;
      case "driver":
        return "DRIVER DASHBOARD";
      default:
        return "DASHBOARD";
    }
  };

  // Calculate dashboard stats
  const dashboardStats = {
    totalTrips: tripsData?.length || 0,
    activeDrivers: driversData?.filter((d: any) => d.is_active)?.length || 0,
    totalClients: clientsData?.length || 0,
    clientGroups: clientGroupsData?.length || 0,
    scheduledTrips: tripsData?.filter((t: any) => t.status === "scheduled")?.length || 0,
    inProgressTrips: tripsData?.filter((t: any) => t.status === "in_progress")?.length || 0,
    completedTrips: tripsData?.filter((t: any) => t.status === "completed")?.length || 0,
    cancelledTrips: tripsData?.filter((t: any) => t.status === "cancelled")?.length || 0,
  };

  const isLoading = tripsLoading || driversLoading || clientsLoading || clientGroupsLoading;

  // Super Admin Corporate Dashboard
  if (isSuperAdmin) {
    // Show corporate client level view
    if (!selectedCorporateClient) {
      return (
        <div className="space-y-6">
          {/* Corporate Dashboard Content */}
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">CORPORATE DASHBOARD</h1>
            {/* Removed organization display name for super admin */}
          </div>


          {/* Corporate Client Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Corporate Clients</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{corporateClients?.corporateClients?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active corporate clients
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{corporateDriversData?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Drivers across all programs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fleet Size</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fleetData?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Vehicles in service
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Trips</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {universalTrips?.filter((trip: any) => {
                    const today = new Date().toDateString();
                    const tripDate = new Date(trip.scheduled_pickup_time).toDateString();
                    return tripDate === today;
                  }).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trips scheduled today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Corporate Client Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Corporate Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {corporateClientsLoading && <div>Loading corporate clients...</div>}
                {corporateClientsError && <div>Error loading corporate clients: {corporateClientsError.message}</div>}
                {corporateClients && corporateClients.corporateClients?.length === 0 && <div>No corporate clients found</div>}
                {corporateClients?.corporateClients?.map((client: any) => {
                  const clientPrograms = corporatePrograms?.filter((p: any) => p.corporate_client_id === client.id) || [];
                  return (
                    <Card 
                      key={client.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigateToClient(client.id, client.name)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{client.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {clientPrograms.length} program{clientPrograms.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToClient(client.id, client.name);
                            }}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {client.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Universal Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Universal Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Calendar view will be available here</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Across All Programs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Badge className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivity />
            </CardContent>
          </Card>


          {/* Floating Debug Button for Super Admin */}
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

    // Show selected corporate client view
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateToCorporate()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Corporate
            </Button>
            <h1 className="text-3xl font-bold">{selectedCorporateClientData?.name} DASHBOARD</h1>
          </div>
          {/* Removed organization display name for super admin */}
        </div>

        {/* Floating Debug Button for Super Admin - Available in all views */}
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

        {/* Corporate Client Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPrograms?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Programs under {selectedCorporateClientData?.name}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTrips?.reduce((acc: number, trip: any) => {
                  return acc + (trip.client ? 1 : 0);
                }, 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Residents across all programs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fleet Size</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fleetData?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Vehicles in service
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTrips?.filter((trip: any) => {
                  const today = new Date().toDateString();
                  const tripDate = new Date(trip.scheduled_pickup_time).toDateString();
                  return tripDate === today;
                }).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Trips for {selectedCorporateClientData?.name}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Program Overview for Selected Corporate Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrograms?.map((program: any) => (
                <Card 
                  key={program.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigateToProgram(program.id, program.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{program.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {program.description}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToProgram(program.id, program.name);
                        }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {program.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar for Selected Corporate Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {selectedCorporateClientData?.name} Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Calendar view will be available here</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity for Selected Corporate Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Badge className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Driver-specific dashboard
  if (userRole === "driver") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{getRoleBasedTitle()}</h1>
          <div className="text-sm text-muted-foreground">
            {getOrganizationDisplayName()}
          </div>
        </div>
        
        <DriverDashboard />
      </div>
    );
  }

  // Admin/User dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{getRoleBasedTitle()}</h1>
        <div className="text-sm text-muted-foreground">
          {getOrganizationDisplayName()}
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats 
        todaysTrips={dashboardStats.scheduledTrips}
        completedTrips={dashboardStats.completedTrips}
        activeDrivers={dashboardStats.activeDrivers}
        totalClients={dashboardStats.totalClients}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/trips/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Trip
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/clients/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Client
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/drivers/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Driver
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/client-groups/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>


        <EnhancedActivityFeed />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBookingForm />
          </CardContent>
        </Card>
      </div>

      {/* Program Info - Moved above calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Program Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Program:</span> {selectedProgram || "N/A"}
            </div>
            <div>
              <span className="font-medium">Corporate Client:</span> {selectedCorporateClient || "N/A"}
            </div>
            <div>
              <span className="font-medium">Level:</span> {level || "N/A"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Trips Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Trips
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/calendar">
                View Full Calendar
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tripsData?.slice(0, 5).map((trip: any) => (
              <div key={trip.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    trip.status === 'scheduled' ? 'bg-blue-500' :
                    trip.status === 'in_progress' ? 'bg-yellow-500' :
                    trip.status === 'completed' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <div className="font-medium text-sm">
                      {trip.client?.first_name} {trip.client?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(trip.scheduled_pickup_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
                <Badge variant={
                  trip.status === 'scheduled' ? 'default' :
                  trip.status === 'in_progress' ? 'secondary' :
                  trip.status === 'completed' ? 'outline' : 'destructive'
                }>
                  {trip.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {(!tripsData || tripsData.length === 0) && (
              <div className="text-center text-gray-500 py-4">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No upcoming trips</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


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