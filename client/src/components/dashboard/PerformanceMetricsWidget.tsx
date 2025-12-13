import React from "react";
import { BarChart3, Target, Clock, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import Widget from "./Widget";
import { usePerformanceMetrics } from "../../hooks/useRealtimeData";

interface PerformanceMetricsWidgetProps {
  className?: string;
  trips?: any[];
  drivers?: any[];
}

export default function PerformanceMetricsWidget({ className, trips, drivers }: PerformanceMetricsWidgetProps) {
  const { data: hookMetrics, isLoading, error } = usePerformanceMetrics();
  
  // Calculate metrics from trips and drivers if provided, otherwise use hook data
  const metrics = trips && drivers ? {
    onTimeDelivery: trips.length > 0 ? (trips.filter((trip: any) => trip.status === 'completed').length / trips.length) * 100 : 98.5,
    averageResponseTime: 4.2, // Mock data - would calculate from trip timestamps
    customerSatisfaction: 4.8, // Mock data - would come from ratings
    driverUtilization: drivers.length > 0 ? (drivers.filter((driver: any) => driver.is_active).length / drivers.length) * 100 : 85.0,
    trend: 'up'
  } : hookMetrics;

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressWidth = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  return (
    <Widget
      title="Performance Metrics"
      icon={<BarChart3 className="h-5 w-5" />}
      size="medium"
      className={className}
      loading={isLoading}
      error={error ? 'Failed to load performance data' : undefined}
    >
      <div className="space-y-6">
        {[
          { key: 'completionRate', label: 'Completion Rate', icon: <Target className="h-4 w-4 text-muted-foreground" />, value: (metrics as any)?.completionRate || (metrics as any)?.onTimeDelivery || 0, target: 95, isPercentage: true },
          { key: 'onTimeRate', label: 'On Time Rate', icon: <Clock className="h-4 w-4 text-muted-foreground" />, value: (metrics as any)?.onTimeRate || (metrics as any)?.onTimeDelivery || 0, target: 90, isPercentage: true },
          { key: 'customerSatisfaction', label: 'Customer Satisfaction', icon: <Users className="h-4 w-4 text-muted-foreground" />, value: metrics?.customerSatisfaction || 0, target: 4.5, isPercentage: false },
          { key: 'driverUtilization', label: 'Driver Utilization', icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />, value: metrics?.driverUtilization || 0, target: 80, isPercentage: true }
        ].map(({ key, label, icon, value, target, isPercentage }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {icon}
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {isPercentage ? `${value.toFixed(1)}%` : value.toFixed(1)}
                </span>
                <div className={`flex items-center ${getTrendColor(value >= target ? 'up' : 'down')}`}>
                  {getTrendIcon(value >= target ? 'up' : 'down')}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Target: {isPercentage ? `${target}%` : target}</span>
                <span>{getProgressWidth(value, target).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getProgressColor(value, target)}`}
                  style={{ width: `${getProgressWidth(value, target)}%`, backgroundColor: 'rgba(241, 254, 96, 1)' }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Performance Summary */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Today's Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{(metrics as any)?.completedTrips || 0}</div>
              <div className="text-xs text-muted-foreground">Trips Completed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics?.customerSatisfaction?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Alerts</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-gray-900 dark:text-gray-100">On-time rate below target (87.5% vs 90%)</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-900 dark:text-gray-100">Customer satisfaction above target</span>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
