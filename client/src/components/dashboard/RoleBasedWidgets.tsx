import React from 'react';
import Widget from './Widget';
import WidgetGrid from './WidgetGrid';
import LiveOperationsWidget from './LiveOperationsWidget';
import FleetStatusWidget from './FleetStatusWidget';
import RevenueWidget from './RevenueWidget';
import PerformanceMetricsWidget from './PerformanceMetricsWidget';
import TaskManagementWidget from './TaskManagementWidget';
import InteractiveMapWidget from './InteractiveMapWidget';
import RouteOptimizationWidget from './RouteOptimizationWidget';
import EnhancedAnalyticsWidget from './EnhancedAnalyticsWidget';
import RealTimeAnalyticsWidget from './RealTimeAnalyticsWidget';
import RealTimePerformanceWidget from './RealTimePerformanceWidget';
import { Bug, Calendar, Building2, Users, Car, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useHierarchy } from '../../hooks/useHierarchy';

interface RoleBasedWidgetsProps {
  userRole: string;
  isSuperAdmin: boolean;
  level: string;
  selectedCorporateClient?: string;
  selectedProgram?: string;
  // Real-time data props
  trips?: any[];
  drivers?: any[];
  clients?: any[];
  corporateClients?: any[];
  programs?: any[];
  universalTrips?: any[];
  metrics?: any;
  isLoading?: boolean;
  hasError?: boolean;
}

export default function RoleBasedWidgets({ 
  userRole, 
  isSuperAdmin, 
  level, 
  selectedCorporateClient, 
  selectedProgram,
  // Real-time data
  trips = [],
  drivers = [],
  clients = [],
  corporateClients = [],
  programs = [],
  universalTrips = [],
  metrics = {},
  isLoading = false,
  hasError = false
}: RoleBasedWidgetsProps) {
  const { getFilterParams } = useHierarchy();
  const filterParams = getFilterParams();

  // Super Admin Widgets
  if (isSuperAdmin) {
    return (
      <>
        {/* Top Row - System Overview */}
        <WidgetGrid columns={4} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <LiveOperationsWidget />
          <FleetStatusWidget />
          <RevenueWidget />
          <PerformanceMetricsWidget />
        </WidgetGrid>

        {/* Map Section */}
        <div className="mt-6">
          <InteractiveMapWidget />
        </div>

        {/* Second Row - Analytics & Management */}
        <WidgetGrid columns={3} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <RealTimeAnalyticsWidget 
            metrics={metrics}
            isLoading={isLoading}
            hasError={hasError}
          />
          <RealTimePerformanceWidget 
            metrics={metrics}
            isLoading={isLoading}
            hasError={hasError}
          />
          <TaskManagementWidget />
          
          {/* System Health Widget */}
          <Widget title="System Health" icon={<Bug className="h-5 w-5" />} size="medium">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">API Status</span>
                </div>
                <Badge variant="outline">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Database</span>
                </div>
                <Badge variant="outline">Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <Badge variant="secondary">85% Used</Badge>
              </div>
            </div>
          </Widget>
        </WidgetGrid>

        {/* Corporate Client Overview */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Corporate Client Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{corporateClients?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{programs?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Active Programs</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <p className="text-sm text-muted-foreground">System Uptime</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">24/7</div>
                  <p className="text-sm text-muted-foreground">Support</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Corporate Admin Widgets
  if (userRole === 'corporate_admin') {
    return (
      <>
        {/* Top Row - Corporate Performance */}
        <WidgetGrid columns={4} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <LiveOperationsWidget />
          <FleetStatusWidget />
          <RevenueWidget />
          <PerformanceMetricsWidget />
        </WidgetGrid>

        {/* Map Section */}
        <div className="mt-6">
          <InteractiveMapWidget />
        </div>

        {/* Second Row - Program Comparison & Management */}
        <WidgetGrid columns={3} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <EnhancedAnalyticsWidget />
          <TaskManagementWidget />
          
          {/* Program Comparison Widget */}
          <Widget title="Program Performance" icon={<TrendingUp className="h-5 w-5" />} size="medium">
            <div className="space-y-4">
              {programs?.slice(0, 3).map((program: any, index: number) => (
                <div key={program.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{program.name}</p>
                    <p className="text-xs text-muted-foreground">{program.client_count || 0} clients</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">95%</div>
                    <div className="text-xs text-muted-foreground">efficiency</div>
                  </div>
                </div>
              ))}
            </div>
          </Widget>
        </WidgetGrid>

        {/* Quick Actions for Corporate Admin */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Building2 className="h-6 w-6 mb-2" />
                  <span className="text-sm">Add Program</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Manage Users</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span className="text-sm">View Reports</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <span className="text-sm">System Alerts</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Program Admin Widgets
  if (userRole === 'program_admin') {
    return (
      <>
        {/* Top Row - Program Operations */}
        <WidgetGrid columns={4} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <LiveOperationsWidget />
          <FleetStatusWidget />
          <RevenueWidget />
          <PerformanceMetricsWidget />
        </WidgetGrid>

        {/* Map Section */}
        <div className="mt-6">
          <InteractiveMapWidget />
        </div>

        {/* Second Row - Program Management */}
        <WidgetGrid columns={3} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <EnhancedAnalyticsWidget />
          <TaskManagementWidget />
          
          {/* Team Performance Widget */}
          <Widget title="Team Performance" icon={<Users className="h-5 w-5" />} size="medium">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Driver Performance</span>
                </div>
                <Badge variant="outline">Excellent</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Fleet Utilization</span>
                </div>
                <Badge variant="outline">87%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Trip Completion</span>
                </div>
                <Badge variant="outline">94%</Badge>
              </div>
            </div>
          </Widget>
        </WidgetGrid>

        {/* Route Optimization for Program Admin */}
        <div className="mt-6">
          <RouteOptimizationWidget />
        </div>
      </>
    );
  }

  // Driver Widgets
  if (userRole === 'driver') {
    return (
      <>
        {/* Driver-specific widgets */}
        <WidgetGrid columns={2} className="grid-cols-1 md:grid-cols-2">
          {/* Today's Schedule */}
          <Widget title="Today's Schedule" icon={<Calendar className="h-5 w-5" />} size="large">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pickup: John Doe</p>
                    <p className="text-sm text-muted-foreground">123 Main St → 456 Oak Ave</p>
                  </div>
                  <Badge variant="outline">9:00 AM</Badge>
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dropoff: Jane Smith</p>
                    <p className="text-sm text-muted-foreground">789 Pine St → 321 Elm St</p>
                  </div>
                  <Badge variant="outline">10:30 AM</Badge>
                </div>
              </div>
            </div>
          </Widget>

          {/* Current Trip Status */}
          <Widget title="Current Trip" icon={<Car className="h-5 w-5" />} size="large">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">Ready for Next Trip</p>
                <p className="text-sm text-muted-foreground">Waiting for dispatch</p>
              </div>
              <Button className="w-full">Start Next Trip</Button>
            </div>
          </Widget>
        </WidgetGrid>

        {/* Driver Map */}
        <div className="mt-6">
          <InteractiveMapWidget />
        </div>

        {/* Driver Quick Actions */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  <span className="text-sm">Complete Trip</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <span className="text-sm">Report Issue</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span className="text-sm">View Schedule</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Car className="h-6 w-6 mb-2" />
                  <span className="text-sm">Vehicle Status</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Default fallback for other roles
  return (
    <>
      <WidgetGrid columns={4} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <LiveOperationsWidget />
        <FleetStatusWidget />
        <RevenueWidget />
        <PerformanceMetricsWidget />
      </WidgetGrid>

      <div className="mt-6">
        <InteractiveMapWidget />
      </div>

      <WidgetGrid columns={3} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <EnhancedAnalyticsWidget />
        <TaskManagementWidget />
        <RouteOptimizationWidget />
      </WidgetGrid>
    </>
  );
}
