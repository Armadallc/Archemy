import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BarChart3, DollarSign, TrendingUp, Users, AlertCircle, Calculator, ChevronRight, Calendar, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDashboardData } from "../hooks/useDashboardData";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";
import PerformanceMetricsWidget from "../components/dashboard/PerformanceMetricsWidget";
import EIAGasolinePrices from "../components/dashboard/EIAGasolinePrices";
import { Button } from "../components/ui/button";
import { Link } from "wouter";
import { RollbackManager } from "../utils/rollback-manager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

function Analytics() {
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
          <p style={{ color: '#a5c8ca', opacity: 0.7 }}>Analytics is only available to Super Administrators.</p>
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
                    analytics.
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

          {/* Tabs */}
          <Tabs defaultValue="telematics" className="w-full">
            <TabsList className="card-neu-flat mb-6" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <TabsTrigger 
                value="telematics" 
                className="data-[state=active]:card-neu data-[state=active]:shadow-[8px_8px_16px_0px_rgba(30,32,35,0.6),-8px_-8px_16px_0px_rgba(30,32,35,0.05)]"
                style={{ 
                  color: '#a5c8ca',
                  backgroundColor: 'var(--background)',
                  border: 'none'
                }}
              >
                Telematics
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="data-[state=active]:card-neu data-[state=active]:shadow-[8px_8px_16px_0px_rgba(30,32,35,0.6),-8px_-8px_16px_0px_rgba(30,32,35,0.05)]"
                style={{ 
                  color: '#a5c8ca',
                  backgroundColor: 'var(--background)',
                  border: 'none'
                }}
              >
                Performance
              </TabsTrigger>
              <TabsTrigger 
                value="financial" 
                className="data-[state=active]:card-neu data-[state=active]:shadow-[8px_8px_16px_0px_rgba(30,32,35,0.6),-8px_-8px_16px_0px_rgba(30,32,35,0.05)]"
                style={{ 
                  color: '#a5c8ca',
                  backgroundColor: 'var(--background)',
                  border: 'none'
                }}
              >
                Financial
              </TabsTrigger>
            </TabsList>

            {/* Telematics Tab */}
            <TabsContent value="telematics" className="space-y-6">
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
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              {/* Performance Metrics Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold" style={{ color: '#a5c8ca' }}>PERFORMANCE METRICS</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Metrics Widget - Moved from Dashboard */}
                  <PerformanceMetricsWidget trips={realTimeTrips} drivers={realTimeDrivers} />
                  
                  {/* Driver Attendance Placeholder */}
                  <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <CardTitle className="flex items-center space-x-2" style={{ color: '#a5c8ca' }}>
                        <Users className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                        <span>Driver Attendance</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                        <p className="text-sm">Driver attendance metrics coming soon</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reviews & Punctuality Placeholder */}
                  <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <CardTitle className="flex items-center space-x-2" style={{ color: '#a5c8ca' }}>
                        <TrendingUp className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                        <span>Reviews & Punctuality</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                        <p className="text-sm">Reviews and punctuality metrics coming soon</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Incident Reports Placeholder */}
                  <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <CardTitle className="flex items-center space-x-2" style={{ color: '#a5c8ca' }}>
                        <AlertCircle className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                        <span>Incident Reports</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                        <p className="text-sm">Incident reports coming soon</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Certifications & Badges Placeholder */}
                  <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <CardTitle className="flex items-center space-x-2" style={{ color: '#a5c8ca' }}>
                        <BarChart3 className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                        <span>Certifications & Badges</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                        <p className="text-sm">Certifications and badges coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              {/* Financial Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* EIA Gasoline Prices - Colorado/Denver */}
                  <EIAGasolinePrices />
                  
                  {/* PROPHET Calculator Quick Access */}
                  <Link href="/prophet">
                    <Card 
                      className="cursor-pointer card-neu hover:card-neu-pressed transition-all h-full"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    >
                      <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        <CardTitle className="flex items-center justify-between" style={{ color: '#a5c8ca' }}>
                          <div className="flex items-center space-x-2">
                            <Calculator className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                            <span>PROPHET Calculator</span>
                          </div>
                          <ChevronRight className="h-5 w-5" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                            Precision Revenue Outcome Planning for Healthcare Expense Tracking
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                              <span style={{ color: '#a5c8ca', opacity: 0.8 }}>Fixed & Variable Costs</span>
                            </div>
                            <div className="p-2 rounded card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                              <span style={{ color: '#a5c8ca', opacity: 0.8 }}>Service Code Library</span>
                            </div>
                            <div className="p-2 rounded card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                              <span style={{ color: '#a5c8ca', opacity: 0.8 }}>Treatment Facilities</span>
                            </div>
                            <div className="p-2 rounded card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                              <span style={{ color: '#a5c8ca', opacity: 0.8 }}>Scenario Builder</span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-2 card-neu hover:card-neu [&]:shadow-none btn-text-glow"
                            style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(165, 200, 202, 0.15)' }}
                          >
                            <span style={{ color: '#a5c8ca', textShadow: '0 0 12px rgba(165, 200, 202, 0.8), 0 0 20px rgba(165, 200, 202, 0.6), 0 0 30px rgba(165, 200, 202, 0.4)' }}>Open PROPHET Calculator</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

Analytics.displayName = "Analytics";

export default Analytics;
