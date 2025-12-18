import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Calendar, MapPin, Users, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDashboardData } from "../hooks/useDashboardData";
import { usePageAccess } from "../hooks/use-page-access";
import { RollbackManager } from "../utils/rollback-manager";

export default function Telematics() {
  // Check page access - super_admin only
  usePageAccess({ permission: "manage_users" }); // Using manage_users as proxy for super_admin check
  
  const { user } = useAuth();
  const {
    trips: realTimeTrips,
    drivers: realTimeDrivers,
    clients: realTimeClients,
    metrics: realTimeMetrics,
  } = useDashboardData();

  // Only allow super_admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Telematics is only available to Super Administrators.</p>
        </div>
      </div>
    );
  }

  // Feature flag check - hide page header when unified header is enabled
  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();

  return (
    <div className="flex-1 overflow-auto mobile-optimized pb-20 md:pb-0">
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="space-y-6">
          {/* Page Header - Only show if unified header is disabled (fallback) */}
          {!ENABLE_UNIFIED_HEADER && (
            <div>
              <div className="px-6 py-6 rounded-lg border backdrop-blur-md shadow-xl flex items-center justify-between" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', height: '150px' }}>
                <div>
                  <h1 
                    className="font-bold text-foreground" 
                    style={{ 
                      fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                      fontSize: '110px'
                    }}
                  >
                    telematics.
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                </div>
              </div>
            </div>
          )}

          {/* Operations Telematics Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Operations Telematics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Trips Metric */}
              <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Total Trips</CardTitle>
                  <Calendar className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {realTimeTrips?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              {/* Miles Metric */}
              <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Total Miles</CardTitle>
                  <MapPin className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {realTimeTrips?.reduce((sum: number, trip: any) => sum + (trip.distance_miles || 0), 0).toFixed(0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              {/* Drivers Metric */}
              <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Active Drivers</CardTitle>
                  <Users className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>

              {/* Clients Metric */}
              <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Total Clients</CardTitle>
                  <Users className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {realTimeClients?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">All clients</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

