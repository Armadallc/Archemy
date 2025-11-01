import React from "react";
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Badge } from "../ui/badge";
import Widget from "./Widget";
import { useRevenueData } from "../../hooks/useRealtimeData";

interface RevenueWidgetProps {
  className?: string;
  trips?: any[];
}

export default function RevenueWidget({ className, trips }: RevenueWidgetProps) {
  const { data: hookRevenueData, isLoading, error } = useRevenueData();
  
  // Calculate revenue from trips if provided, otherwise use hook data
  const revenueData = trips && trips.length > 0 ? {
    totalRevenue: trips.reduce((sum: number, trip: any) => sum + (trip.fare_amount || 0), 0),
    monthlyRevenue: trips.filter((trip: any) => {
      const tripDate = new Date(trip.scheduled_pickup_time);
      const now = new Date();
      return tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear();
    }).reduce((sum: number, trip: any) => sum + (trip.fare_amount || 0), 0),
    trend: 'up',
    growthRate: 12.5
  } : hookRevenueData;

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Widget
      title="Revenue Dashboard"
      icon={<DollarSign className="h-5 w-5" />}
      size="medium"
      className={className}
      loading={isLoading}
      error={error ? 'Failed to load revenue data' : undefined}
    >
      <div className="space-y-6">
        {/* Today's Revenue */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency((revenueData as any)?.today || (revenueData as any)?.totalRevenue || 0)}
          </div>
          <div className="text-sm text-muted-foreground">Today's Revenue</div>
          <div className={`flex items-center justify-center mt-2 ${getTrendColor((revenueData as any)?.todayChange > 0 ? 'up' : 'down')}`}>
            {getTrendIcon((revenueData as any)?.todayChange > 0 ? 'up' : 'down')}
            <span className="text-sm font-medium ml-1">
              {(revenueData as any)?.todayChange > 0 ? '+' : ''}{(revenueData as any)?.todayChange || 0}%
            </span>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="space-y-3">
          {[
            { key: 'week', label: 'Last 7 days', amount: (revenueData as any)?.week || 0, change: (revenueData as any)?.weekChange || 0 },
            { key: 'month', label: 'Last 30 days', amount: (revenueData as any)?.month || (revenueData as any)?.monthlyRevenue || 0, change: (revenueData as any)?.monthChange || 0 },
            { key: 'year', label: 'Last 12 months', amount: (revenueData as any)?.year || 0, change: (revenueData as any)?.yearChange || 0 }
          ].map(({ key, label, amount, change }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm capitalize text-gray-900 dark:text-gray-100">{key}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</p>
                <div className={`flex items-center ${getTrendColor(change > 0 ? 'up' : 'down')}`}>
                  {getTrendIcon(change > 0 ? 'up' : 'down')}
                  <span className="text-xs ml-1">
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Sources */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Revenue Sources</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-900 dark:text-gray-100">Regular Trips</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">$2,340</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-900 dark:text-gray-100">Group Trips</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">$1,890</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-900 dark:text-gray-100">Emergency Trips</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">$450</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-900 dark:text-gray-100">Recurring Trips</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">$3,120</span>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
