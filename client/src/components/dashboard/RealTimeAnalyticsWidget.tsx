import React from 'react';
import Widget from './Widget';
import { TrendingUp, TrendingDown, Activity, Users, Car, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface RealTimeAnalyticsWidgetProps {
  metrics?: any;
  isLoading?: boolean;
  hasError?: boolean;
}

export default function RealTimeAnalyticsWidget({ 
  metrics = {}, 
  isLoading = false, 
  hasError = false 
}: RealTimeAnalyticsWidgetProps) {
  if (isLoading) {
    return (
      <Widget title="Real-time Analytics" icon={<Activity className="h-5 w-5" />} size="large">
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </Widget>
    );
  }

  if (hasError) {
    return (
      <Widget title="Real-time Analytics" icon={<Activity className="h-5 w-5" />} size="large">
        <div className="text-center text-red-500 dark:text-red-400">
          <Activity className="h-8 w-8 mx-auto mb-2" />
          <p>Failed to load analytics data</p>
        </div>
      </Widget>
    );
  }

  const {
    totalTrips = 0,
    activeTrips = 0,
    completedTrips = 0,
    pendingTrips = 0,
    totalDrivers = 0,
    activeDrivers = 0,
    availableDrivers = 0,
    totalClients = 0,
    activeClients = 0,
    todayTrips = 0
  } = metrics;

  // Calculate completion rate
  const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
  
  // Calculate driver utilization
  const driverUtilization = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;

  // Calculate client engagement
  const clientEngagement = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

  return (
    <Widget title="Real-time Analytics" icon={<Activity className="h-5 w-5" />} size="large">
      <div className="space-y-6">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{completionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Driver Utilization</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{driverUtilization}%</p>
                </div>
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trip Status Breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Trip Status Breakdown</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
              </div>
              <Badge variant="outline" className="text-green-600 dark:text-green-400">
                {completedTrips}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">In Progress</span>
              </div>
              <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                {activeTrips}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Scheduled</span>
              </div>
              <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400">
                {pendingTrips}
              </Badge>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Today's Activity</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{todayTrips}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Trips Today</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Car className="h-6 w-6 text-gray-600 dark:text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{availableDrivers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Available Drivers</p>
            </div>
          </div>
        </div>

        {/* Client Engagement */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Client Engagement</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Active Clients</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{activeClients}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Clients</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{totalClients}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(clientEngagement, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {clientEngagement}% engagement rate
            </p>
          </div>
        </div>
      </div>
    </Widget>
  );
}
