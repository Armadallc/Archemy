import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BarChart3, DollarSign, TrendingUp, Users, Car, MapPin, Calendar, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDashboardData } from "../hooks/useDashboardData";
import RevenueWidget from "../components/dashboard/RevenueWidget";
import PerformanceMetricsWidget from "../components/dashboard/PerformanceMetricsWidget";
import { usePageAccess } from "../hooks/use-page-access";

export default function Analytics() {
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
          <p className="text-muted-foreground">Analytics is only available to Super Administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto mobile-optimized pb-20 md:pb-0 md:pt-6">
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h1 
              className="uppercase"
              style={{
                fontFamily: 'Nohemi',
                fontWeight: 600,
                fontSize: '68px',
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
                textTransform: 'uppercase',
                color: 'var(--foreground)'
              }}
            >
              ANALYTICS
            </h1>
          </div>

          {/* Financial Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Financial</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Widget - Moved from Dashboard */}
              <RevenueWidget trips={realTimeTrips} />
              
              {/* Break-Even Calculator Placeholder */}
              <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Break-Even Calculator</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Break-even calculator coming soon</p>
                    <p className="text-xs mt-2">This will include fixed & variable costs, revenue analysis, and PPM/CPM calculations</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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

          {/* Performance Metrics Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Performance Metrics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics Widget - Moved from Dashboard */}
              <PerformanceMetricsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
              
              {/* Driver Attendance Placeholder */}
              <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Driver Attendance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Driver attendance metrics coming soon</p>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews & Punctuality Placeholder */}
              <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Reviews & Punctuality</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Reviews and punctuality metrics coming soon</p>
                  </div>
                </CardContent>
              </Card>

              {/* Incident Reports Placeholder */}
              <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>Incident Reports</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Incident reports coming soon</p>
                  </div>
                </CardContent>
              </Card>

              {/* Certifications & Badges Placeholder */}
              <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Certifications & Badges</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Certifications and badges coming soon</p>
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

