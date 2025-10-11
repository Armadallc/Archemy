import React from 'react';
import Widget from './Widget';
import { Clock, Zap, Target, Award, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface RealTimePerformanceWidgetProps {
  metrics?: any;
  isLoading?: boolean;
  hasError?: boolean;
}

export default function RealTimePerformanceWidget({ 
  metrics = {}, 
  isLoading = false, 
  hasError = false 
}: RealTimePerformanceWidgetProps) {
  if (isLoading) {
    return (
      <Widget title="Performance Metrics" icon={<Target className="h-5 w-5" />} size="medium">
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </Widget>
    );
  }

  if (hasError) {
    return (
      <Widget title="Performance Metrics" icon={<Target className="h-5 w-5" />} size="medium">
        <div className="text-center text-red-500 dark:text-red-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Failed to load performance data</p>
        </div>
      </Widget>
    );
  }

  const {
    totalTrips = 0,
    completedTrips = 0,
    activeTrips = 0,
    totalDrivers = 0,
    activeDrivers = 0,
    todayTrips = 0
  } = metrics;

  // Calculate performance metrics
  const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
  const driverEfficiency = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;
  const dailyCapacity = totalDrivers * 8; // Assuming 8 trips per driver per day
  const capacityUtilization = dailyCapacity > 0 ? Math.round((todayTrips / dailyCapacity) * 100) : 0;

  // Performance status
  const getPerformanceStatus = (rate: number) => {
    if (rate >= 90) return { status: 'excellent', color: 'green', icon: CheckCircle };
    if (rate >= 75) return { status: 'good', color: 'blue', icon: Target };
    if (rate >= 50) return { status: 'fair', color: 'yellow', icon: Clock };
    return { status: 'needs_improvement', color: 'red', icon: AlertTriangle };
  };

  const completionStatus = getPerformanceStatus(completionRate);
  const efficiencyStatus = getPerformanceStatus(driverEfficiency);
  const capacityStatus = getPerformanceStatus(capacityUtilization);

  const CompletionIcon = completionStatus.icon;
  const EfficiencyIcon = efficiencyStatus.icon;
  const CapacityIcon = capacityStatus.icon;

  return (
    <Widget title="Performance Metrics" icon={<Target className="h-5 w-5" />} size="medium">
      <div className="space-y-4">
        {/* Completion Rate */}
        <Card className={`border-l-4 border-${completionStatus.color}-500 bg-${completionStatus.color}-50 dark:bg-${completionStatus.color}-900/20`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CompletionIcon className={`h-5 w-5 text-${completionStatus.color}-600 dark:text-${completionStatus.color}-400`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completionRate}%</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`text-${completionStatus.color}-600 dark:text-${completionStatus.color}-400 border-${completionStatus.color}-200 dark:border-${completionStatus.color}-800`}
              >
                {completionStatus.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`bg-${completionStatus.color}-500 h-2 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Efficiency */}
        <Card className={`border-l-4 border-${efficiencyStatus.color}-500 bg-${efficiencyStatus.color}-50 dark:bg-${efficiencyStatus.color}-900/20`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EfficiencyIcon className={`h-5 w-5 text-${efficiencyStatus.color}-600 dark:text-${efficiencyStatus.color}-400`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Driver Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{driverEfficiency}%</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`text-${efficiencyStatus.color}-600 dark:text-${efficiencyStatus.color}-400 border-${efficiencyStatus.color}-200 dark:border-${efficiencyStatus.color}-800`}
              >
                {efficiencyStatus.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`bg-${efficiencyStatus.color}-500 h-2 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(driverEfficiency, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Utilization */}
        <Card className={`border-l-4 border-${capacityStatus.color}-500 bg-${capacityStatus.color}-50 dark:bg-${capacityStatus.color}-900/20`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CapacityIcon className={`h-5 w-5 text-${capacityStatus.color}-600 dark:text-${capacityStatus.color}-400`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Capacity Utilization</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{capacityUtilization}%</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`text-${capacityStatus.color}-600 dark:text-${capacityStatus.color}-400 border-${capacityStatus.color}-200 dark:border-${capacityStatus.color}-800`}
              >
                {capacityStatus.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`bg-${capacityStatus.color}-500 h-2 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(capacityUtilization, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{activeTrips}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Now</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Award className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{completedTrips}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
          </div>
        </div>
      </div>
    </Widget>
  );
}
