import React from "react";
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Badge } from "../ui/badge";
import Widget from "./Widget";
import { useRevenueData } from "../../hooks/useRealtimeData";

interface RevenueWidgetProps {
  className?: string;
}

export default function RevenueWidget({ className }: RevenueWidgetProps) {
  const { data: revenueData, isLoading, error } = useRevenueData();

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
            {formatCurrency(revenueData?.today || 0)}
          </div>
          <div className="text-sm text-muted-foreground">Today's Revenue</div>
          <div className={`flex items-center justify-center mt-2 ${getTrendColor(revenueData?.todayChange > 0 ? 'up' : 'down')}`}>
            {getTrendIcon(revenueData?.todayChange > 0 ? 'up' : 'down')}
            <span className="text-sm font-medium ml-1">
              {revenueData?.todayChange > 0 ? '+' : ''}{revenueData?.todayChange || 0}%
            </span>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="space-y-3">
          {[
            { key: 'week', label: 'Last 7 days', amount: revenueData?.week || 0, change: revenueData?.weekChange || 0 },
            { key: 'month', label: 'Last 30 days', amount: revenueData?.month || 0, change: revenueData?.monthChange || 0 },
            { key: 'year', label: 'Last 12 months', amount: revenueData?.year || 0, change: revenueData?.yearChange || 0 }
          ].map(({ key, label, amount, change }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm capitalize">{key}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">{formatCurrency(amount)}</p>
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
              <span>Regular Trips</span>
              <span className="font-medium">$2,340</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Group Trips</span>
              <span className="font-medium">$1,890</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Emergency Trips</span>
              <span className="font-medium">$450</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Recurring Trips</span>
              <span className="font-medium">$3,120</span>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
