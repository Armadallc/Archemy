import React, { useState, useEffect } from "react";
import { Route, Zap, Clock, MapPin, Car, Users, Settings, Play, Pause, RotateCcw } from "lucide-react";
import Widget from "./Widget";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { useHierarchy } from "../../hooks/useHierarchy";

interface RouteOptimizationWidgetProps {
  className?: string;
}

interface OptimizedRoute {
  id: string;
  driverId: string;
  driverName: string;
  vehicle: string;
  trips: Array<{
    id: string;
    client: string;
    pickup: string;
    dropoff: string;
    scheduledTime: string;
    estimatedDuration: number;
    distance: number;
  }>;
  totalDistance: number;
  totalDuration: number;
  efficiency: number;
  status: 'optimized' | 'in_progress' | 'pending';
}

interface OptimizationSettings {
  maxTripsPerDriver: number;
  maxDistancePerRoute: number;
  considerTraffic: boolean;
  prioritizeTimeWindows: boolean;
  avoidHighways: boolean;
  fuelEfficiency: boolean;
}

export default function RouteOptimizationWidget({ className }: RouteOptimizationWidgetProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [settings, setSettings] = useState<OptimizationSettings>({
    maxTripsPerDriver: 8,
    maxDistancePerRoute: 50,
    considerTraffic: true,
    prioritizeTimeWindows: true,
    avoidHighways: false,
    fuelEfficiency: true,
  });

  const { level, selectedProgram, selectedCorporateClient, getFilterParams } = useHierarchy();

  // Fetch trips and drivers for optimization
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', getFilterParams()],
    queryFn: () => apiRequest('/api/trips'),
    enabled: true,
  });

  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers', getFilterParams()],
    queryFn: () => apiRequest('/api/drivers'),
    enabled: true,
  });

  // Mock optimization algorithm
  const optimizeRoutes = async () => {
    if (!trips || !drivers) return;

    setIsOptimizing(true);
    setOptimizationProgress(0);

    // Simulate optimization process
    const steps = [
      "Analyzing trip data...",
      "Calculating distances...",
      "Optimizing driver assignments...",
      "Generating routes...",
      "Finalizing optimization..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOptimizationProgress((i + 1) * 20);
    }

    // Generate mock optimized routes
    const mockRoutes: OptimizedRoute[] = [
      {
        id: 'route_001',
        driverId: 'driver_001',
        driverName: 'John Smith',
        vehicle: 'Van-001',
        trips: [
          {
            id: 'trip_001',
            client: 'Alice Johnson',
            pickup: '123 Main St, Denver, CO',
            dropoff: '456 Oak Ave, Boulder, CO',
            scheduledTime: '09:00 AM',
            estimatedDuration: 25,
            distance: 8.5,
          },
          {
            id: 'trip_002',
            client: 'Bob Wilson',
            pickup: '789 Pine St, Boulder, CO',
            dropoff: '321 Elm St, Denver, CO',
            scheduledTime: '10:30 AM',
            estimatedDuration: 20,
            distance: 6.2,
          },
        ],
        totalDistance: 14.7,
        totalDuration: 45,
        efficiency: 92,
        status: 'optimized',
      },
      {
        id: 'route_002',
        driverId: 'driver_002',
        driverName: 'Sarah Davis',
        vehicle: 'Van-002',
        trips: [
          {
            id: 'trip_003',
            client: 'Carol Brown',
            pickup: '555 Maple Dr, Lakewood, CO',
            dropoff: '777 Cedar Ln, Aurora, CO',
            scheduledTime: '09:15 AM',
            estimatedDuration: 30,
            distance: 12.3,
          },
        ],
        totalDistance: 12.3,
        totalDuration: 30,
        efficiency: 88,
        status: 'optimized',
      },
    ];

    setOptimizedRoutes(mockRoutes);
    setIsOptimizing(false);
    setOptimizationProgress(100);
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (efficiency >= 80) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  const getEfficiencyIcon = (efficiency: number) => {
    if (efficiency >= 90) return <Zap className="h-4 w-4" />;
    if (efficiency >= 80) return <Clock className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  const calculateSavings = () => {
    if (optimizedRoutes.length === 0) return { distance: 0, time: 0, fuel: 0 };
    
    // Mock calculations - in real app, compare with unoptimized routes
    const totalDistance = optimizedRoutes.reduce((sum, route) => sum + route.totalDistance, 0);
    const totalTime = optimizedRoutes.reduce((sum, route) => sum + route.totalDuration, 0);
    
    return {
      distance: totalDistance * 0.15, // 15% savings
      time: totalTime * 0.20, // 20% time savings
      fuel: totalDistance * 0.12, // 12% fuel savings
    };
  };

  const savings = calculateSavings();
  const isLoading = tripsLoading || driversLoading;

  return (
    <Widget
      title="Route Optimization"
      icon={<Route className="h-5 w-5" />}
      size="large"
      className={className}
      loading={isLoading}
      actions={
        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={optimizeRoutes}
            disabled={isOptimizing || !trips || !drivers}
          >
            {isOptimizing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOptimizedRoutes([])}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Optimization Progress */}
        {isOptimizing && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Optimizing Routes...
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {optimizationProgress}%
                  </span>
                </div>
                <Progress value={optimizationProgress} className="w-full" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Analyzing trip patterns and calculating optimal routes...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Optimization Results */}
        {optimizedRoutes.length > 0 && (
          <div className="space-y-4">
            {/* Savings Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Optimization Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {savings.distance.toFixed(1)} mi
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Distance Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {savings.time.toFixed(0)} min
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Time Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {savings.fuel.toFixed(1)} gal
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Fuel Saved</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimized Routes */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Optimized Routes ({optimizedRoutes.length})
              </h4>
              {optimizedRoutes.map((route) => (
                <Card key={route.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Route Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Car className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100">
                              {route.driverName}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {route.vehicle} • {route.trips.length} trips
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getEfficiencyColor(route.efficiency)}`}>
                          {getEfficiencyIcon(route.efficiency)}
                          <span>{route.efficiency}%</span>
                        </div>
                      </div>

                      {/* Route Stats */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {route.totalDistance.toFixed(1)} mi
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Distance</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {route.totalDuration} min
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Duration</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {route.trips.length}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Trips</div>
                        </div>
                      </div>

                      {/* Trip List */}
                      <div className="space-y-2">
                        {route.trips.map((trip, index) => (
                          <div key={trip.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {trip.client}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {trip.pickup} → {trip.dropoff}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {trip.scheduledTime}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {trip.estimatedDuration}min
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        <Tabs defaultValue="optimization" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="optimization" className="space-y-4">
            {optimizedRoutes.length === 0 && !isOptimizing && (
              <div className="text-center py-8">
                <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Optimized Routes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Click the optimize button to generate efficient routes for your trips.
                </p>
                <Button onClick={optimizeRoutes} disabled={!trips || !drivers}>
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Routes
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Max Trips per Driver
                  </label>
                  <input
                    type="number"
                    value={settings.maxTripsPerDriver}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxTripsPerDriver: parseInt(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    min="1"
                    max="20"
                    aria-label="Maximum trips per driver"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Max Distance per Route (miles)
                  </label>
                  <input
                    type="number"
                    value={settings.maxDistancePerRoute}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxDistancePerRoute: parseInt(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    min="10"
                    max="200"
                    aria-label="Maximum distance per route in miles"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.considerTraffic}
                    onChange={(e) => setSettings(prev => ({ ...prev, considerTraffic: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Consider Traffic Conditions</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.prioritizeTimeWindows}
                    onChange={(e) => setSettings(prev => ({ ...prev, prioritizeTimeWindows: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Prioritize Time Windows</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.avoidHighways}
                    onChange={(e) => setSettings(prev => ({ ...prev, avoidHighways: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Avoid Highways</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.fuelEfficiency}
                    onChange={(e) => setSettings(prev => ({ ...prev, fuelEfficiency: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Optimize for Fuel Efficiency</span>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Widget>
  );
}
