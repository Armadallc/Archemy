import React from "react";
import { BarChart3, Target, Clock, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import Widget from "./Widget";

interface PerformanceMetricsWidgetProps {
  className?: string;
}

export default function PerformanceMetricsWidget({ className }: PerformanceMetricsWidgetProps) {
  // Mock data - in real implementation, this would come from API
  const metrics = {
    completionRate: { value: 94.2, target: 95, trend: 'up' },
    onTimeRate: { value: 87.5, target: 90, trend: 'down' },
    customerSatisfaction: { value: 4.6, target: 4.5, trend: 'up' },
    driverUtilization: { value: 78.3, target: 80, trend: 'up' }
  };

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
    >
      <div className="space-y-6">
        {Object.entries(metrics).map(([key, data]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {key === 'completionRate' && <Target className="h-4 w-4 text-muted-foreground" />}
                {key === 'onTimeRate' && <Clock className="h-4 w-4 text-muted-foreground" />}
                {key === 'customerSatisfaction' && <Users className="h-4 w-4 text-muted-foreground" />}
                {key === 'driverUtilization' && <BarChart3 className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">
                  {key === 'customerSatisfaction' ? data.value.toFixed(1) : `${data.value}%`}
                </span>
                <div className={`flex items-center ${getTrendColor(data.trend)}`}>
                  {getTrendIcon(data.trend)}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Target: {key === 'customerSatisfaction' ? data.target.toFixed(1) : `${data.target}%`}</span>
                <span>{getProgressWidth(data.value, data.target).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(data.value, data.target)}`}
                  style={{ width: `${getProgressWidth(data.value, data.target)}%` }}
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
              <div className="text-2xl font-bold text-green-600">47</div>
              <div className="text-xs text-muted-foreground">Trips Completed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">3.2</div>
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
              <span className="text-sm">On-time rate below target (87.5% vs 90%)</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Customer satisfaction above target</span>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
