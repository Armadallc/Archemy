import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DashboardStats from "@/components/stats/dashboard-stats";
import SimpleBookingForm from "@/components/booking/simple-booking-form";
import TripCalendar from "@/components/TripCalendar";
import DriverDashboard from "@/components/DriverDashboard";
import RecentActivity from "@/components/RecentActivity";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/environment";
import { Link } from "wouter";

interface DashboardProps {
  currentOrganization?: string;
}

export default function Dashboard({ 
  currentOrganization = DEFAULT_ORGANIZATION_ID 
}: DashboardProps) {
  const { user } = useAuth();
  const { currentOrganization: orgFromHook } = useOrganization();
  // Prioritize user's actual organization over default
  const activeOrganization = orgFromHook?.id || user?.primaryOrganizationId || currentOrganization;
  const userRole = user?.role || "organization_admin";
  


  // Debug logging for driver authentication
  console.log('🎯 Dashboard - User:', user?.email, 'Role:', userRole, 'Organization:', activeOrganization);

  // Fetch data based on user role
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ["/api/trips", activeOrganization, userRole],
    queryFn: async () => {
      if (userRole === "driver") {
        // For drivers, find their driver record and fetch assigned trips
        const driversResponse = await apiRequest("GET", `/api/drivers/organization/${activeOrganization}`);
        const driversData = await driversResponse.json();
        const driverRecord = driversData.find((d: any) => d.user_id === user?.userId);
        
        if (driverRecord) {
          const response = await apiRequest("GET", `/api/trips/driver/${driverRecord.id}`);
          return await response.json();
        }
        return [];
      } else {
        // For other roles, fetch organization trips
        const response = await apiRequest("GET", `/api/trips/organization/${activeOrganization}`);
        return await response.json();
      }
    },
    enabled: !!user?.userId || userRole !== "driver",
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ["/api/drivers", activeOrganization],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/drivers/organization/${activeOrganization}`);
      return await response.json();
    },
    enabled: userRole !== "driver", // Drivers don't need to see all drivers
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients", activeOrganization],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/organization/${activeOrganization}`);
      return await response.json();
    },
    enabled: userRole !== "driver", // Drivers don't need to see all clients
  });

  // Calculate statistics from real data
  const trips = Array.isArray(tripsData) ? tripsData : [];
  const drivers = Array.isArray(driversData) ? driversData : [];
  const clients = Array.isArray(clientsData) ? clientsData : [];

  const today = new Date().toISOString().split('T')[0];
  
  const dashboardStats = {
    todaysTrips: trips.filter(trip => 
      trip.scheduled_pickup_time?.startsWith(today)
    ).length,
    completedTrips: trips.filter(trip => 
      trip.status === "completed" && trip.scheduled_pickup_time?.startsWith(today)
    ).length,
    activeDrivers: drivers.filter(driver => driver.is_active).length,
    totalClients: clients.length
  };

  const getDashboardTitle = (role: string) => {
    switch (role) {
      case "organization_user":
        return "Book Your Trip";
      case "driver":
        return "Driver Dashboard";
      case "organization_admin":
        return "Organization Dashboard";
      case "monarch_owner":
        return "Monarch Overview";
      case "super_admin":
        return "Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getDashboardDescription = (role: string) => {
    switch (role) {
      case "organization_user":
        return "Welcome! Book your transportation quickly and easily.";
      case "driver":
        return "View your scheduled trips and manage your availability.";
      case "organization_admin":
        return "Manage trips, clients, and drivers for your organization.";
      case "monarch_owner":
        return "Overview of all Monarch organizations and operations.";
      case "super_admin":
        return "";
      default:
        return "";
    }
  };

  const isKioskMode = userRole === "organization_user";
  const isDriverMode = userRole === "driver";
  const shouldShowCalendar = ['super_admin', 'monarch_owner', 'organization_admin'].includes(userRole);
  const isLoading = tripsLoading || driversLoading || clientsLoading;

  if (isLoading && !isKioskMode) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--foundation-bg)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold text-brutalist-h1 ${isKioskMode ? "text-mega" : ""}`} style={{ color: 'var(--foundation-text)' }}>
            {getDashboardTitle(userRole).toUpperCase()}
          </h1>
          <p className={`mt-2 text-brutalist-body ${isKioskMode ? "text-brutalist-body" : ""}`} style={{ color: 'var(--foundation-text)' }}>
            {getDashboardDescription(userRole)}
          </p>
        </div>
        
        {/* Schedule Trip Button for admin roles */}
        {shouldShowCalendar && (
          <Link href="/trips">
            <Button className="border-2 font-bold uppercase tracking-wide hover-darker hover-shadow transition-all duration-200" style={{
              backgroundColor: 'var(--status-accent)',
              borderColor: 'var(--foundation-border)',
              color: 'var(--foundation-text)'
            }}>
              <Plus className="w-4 h-4 mr-2" />
              SCHEDULE TRIP
            </Button>
          </Link>
        )}
      </div>

      {/* Role-specific dashboard content */}
      {isKioskMode ? (
        // Kiosk Mode - Simplified booking interface
        <div className="max-w-2xl mx-auto">
          <SimpleBookingForm />
        </div>
      ) : isDriverMode ? (
        // Driver Mode - Trip management dashboard
        <>
          <DriverDashboard />
        </>
      ) : (
        // Admin/Manager Mode - Full dashboard
        <>
          {/* Trip Calendar - positioned below header for admin roles */}
          {shouldShowCalendar && <TripCalendar />}
          
          <DashboardStats 
            todaysTrips={dashboardStats.todaysTrips}
            completedTrips={dashboardStats.completedTrips}
            activeDrivers={dashboardStats.activeDrivers}
            totalClients={dashboardStats.totalClients}
          />
          <RecentActivity />
        </>
      )}
    </div>
  );
}