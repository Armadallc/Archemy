import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Calendar, MapPin, Users, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDashboardData } from "../hooks/useDashboardData";
import { RollbackManager } from "../utils/rollback-manager";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";

export default function Telematics() {
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
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#a5c8ca' }}>Access Denied</h1>
          <p style={{ color: '#a5c8ca', opacity: 0.7 }}>Telematics is only available to Super Administrators.</p>
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
              <div className="px-6 py-6 rounded-lg card-neu flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px', boxShadow: '8px 8px 16px 0px rgba(30, 32, 35, 0.6), -8px -8px 16px 0px rgba(30, 32, 35, 0.05)' }}>
                <div>
                  <h1 
                    className="font-bold" 
                    style={{ 
                      fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                      fontSize: '110px',
                      fontWeight: 700,
                      color: '#a5c8ca'
                    }}
                  >
                    telematics.
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
                    <HeaderScopeSelector />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Operations Telematics Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold" style={{ color: '#a5c8ca' }}>OPERATIONS TELEMATICS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Trips Metric */}
              <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <CardTitle className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>Total Trips</CardTitle>
                  <Calendar className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#a5c8ca' }}>
                    {realTimeTrips?.length || 0}
                  </div>
                  <p className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>All time</p>
                </CardContent>
              </Card>

              {/* Miles Metric */}
              <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <CardTitle className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>Total Miles</CardTitle>
                  <MapPin className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#a5c8ca' }}>
                    {realTimeTrips?.reduce((sum: number, trip: any) => sum + (trip.distance_miles || 0), 0).toFixed(0) || 0}
                  </div>
                  <p className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>All time</p>
                </CardContent>
              </Card>

              {/* Drivers Metric */}
              <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <CardTitle className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>Active Drivers</CardTitle>
                  <Users className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#a5c8ca' }}>
                    {realTimeDrivers?.filter((d: any) => d.is_active).length || 0}
                  </div>
                  <p className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Currently active</p>
                </CardContent>
              </Card>

              {/* Clients Metric */}
              <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <CardTitle className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>Total Clients</CardTitle>
                  <Users className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#a5c8ca' }}>
                    {realTimeClients?.length || 0}
                  </div>
                  <p className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>All clients</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



