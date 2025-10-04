import React from "react";
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Badge } from "../ui/badge";
import Widget from "./Widget";

interface RevenueWidgetProps {
  className?: string;
}

export default function RevenueWidget({ className }: RevenueWidgetProps) {
  // Mock data - in real implementation, this would come from API
  const revenueData = {
    today: { amount: 1240, change: 12.5, trend: 'up' },
    week: { amount: 8760, change: -2.3, trend: 'down' },
    month: { amount: 34200, change: 8.7, trend: 'up' },
    year: { amount: 412000, change: 15.2, trend: 'up' }
  };

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
    >
      <div className="space-y-6">
        {/* Today's Revenue */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(revenueData.today.amount)}
          </div>
          <div className="text-sm text-muted-foreground">Today's Revenue</div>
          <div className={`flex items-center justify-center mt-2 ${getTrendColor(revenueData.today.trend)}`}>
            {getTrendIcon(revenueData.today.trend)}
            <span className="text-sm font-medium ml-1">
              {revenueData.today.change > 0 ? '+' : ''}{revenueData.today.change}%
            </span>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="space-y-3">
          {Object.entries(revenueData).filter(([key]) => key !== 'today').map(([period, data]) => (
            <div key={period} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm capitalize">{period}</p>
                  <p className="text-xs text-muted-foreground">
                    {period === 'week' ? 'Last 7 days' :
                     period === 'month' ? 'Last 30 days' : 'Last 12 months'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">{formatCurrency(data.amount)}</p>
                <div className={`flex items-center ${getTrendColor(data.trend)}`}>
                  {getTrendIcon(data.trend)}
                  <span className="text-xs ml-1">
                    {data.change > 0 ? '+' : ''}{data.change}%
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
