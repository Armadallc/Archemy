import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Calendar, Users, Car, Clock, DollarSign } from "lucide-react";
import Widget from "./Widget";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface AnalyticsWidgetProps {
  className?: string;
}

interface AnalyticsData {
  totalRevenue: number;
  revenueChange: number;
  totalTrips: number;
  tripsChange: number;
  activeDrivers: number;
  driversChange: number;
  avgTripDuration: number;
  durationChange: number;
  completionRate: number;
  completionChange: number;
  peakHours: string[];
  topRoutes: Array<{
    route: string;
    trips: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    trips: number;
  }>;
}

export default function AnalyticsWidget({ className }: AnalyticsWidgetProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data for demonstration
  useEffect(() => {
    const mockData: AnalyticsData = {
      totalRevenue: 45680,
      revenueChange: 12.5,
      totalTrips: 1247,
      tripsChange: 8.3,
      activeDrivers: 23,
      driversChange: -2.1,
      avgTripDuration: 28,
      durationChange: -5.2,
      completionRate: 94.2,
      completionChange: 1.8,
      peakHours: ['8:00 AM', '12:00 PM', '5:00 PM'],
      topRoutes: [
        { route: 'Downtown → Airport', trips: 156, revenue: 12480 },
        { route: 'Airport → Downtown', trips: 142, revenue: 11360 },
        { route: 'Hospital → Station', trips: 98, revenue: 7840 },
        { route: 'Station → Hospital', trips: 87, revenue: 6960 }
      ],
      monthlyTrends: [
        { month: 'Jan', revenue: 42000, trips: 1100 },
        { month: 'Feb', revenue: 43500, trips: 1150 },
        { month: 'Mar', revenue: 45680, trips: 1247 },
        { month: 'Apr', revenue: 47200, trips: 1280 },
        { month: 'May', revenue: 48900, trips: 1320 },
        { month: 'Jun', revenue: 50200, trips: 1350 }
      ]
    };

    setTimeout(() => {
      setData(mockData);
      setIsLoading(false);
    }, 1000);
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading || !data) {
    return (
      <Widget
        title="Analytics Dashboard"
        icon={<BarChart3 className="h-5 w-5" />}
        size="large"
        className={className}
        loading={true}
      />
    );
  }

  return (
    <Widget
      title="Analytics Dashboard"
      icon={<BarChart3 className="h-5 w-5" />}
      size="large"
      className={className}
      actions={
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedPeriod === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('7d')}
          >
            7D
          </Button>
          <Button
            variant={selectedPeriod === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('30d')}
          >
            30D
          </Button>
          <Button
            variant={selectedPeriod === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('90d')}
          >
            90D
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center space-x-1 mt-2">
                {getChangeIcon(data.revenueChange)}
                <span className={`text-sm font-medium ${getChangeColor(data.revenueChange)}`}>
                  {data.revenueChange > 0 ? '+' : ''}{data.revenueChange}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Trips</p>
                  <p className="text-2xl font-bold">{formatNumber(data.totalTrips)}</p>
                </div>
                <Car className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex items-center space-x-1 mt-2">
                {getChangeIcon(data.tripsChange)}
                <span className={`text-sm font-medium ${getChangeColor(data.tripsChange)}`}>
                  {data.tripsChange > 0 ? '+' : ''}{data.tripsChange}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Drivers</p>
                  <p className="text-2xl font-bold">{data.activeDrivers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <div className="flex items-center space-x-1 mt-2">
                {getChangeIcon(data.driversChange)}
                <span className={`text-sm font-medium ${getChangeColor(data.driversChange)}`}>
                  {data.driversChange > 0 ? '+' : ''}{data.driversChange}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold">{data.completionRate}%</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <div className="flex items-center space-x-1 mt-2">
                {getChangeIcon(data.completionChange)}
                <span className={`text-sm font-medium ${getChangeColor(data.completionChange)}`}>
                  {data.completionChange > 0 ? '+' : ''}{data.completionChange}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Routes */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Routes</h4>
          <div className="space-y-2">
            {data.topRoutes.map((route, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{route.route}</p>
                  <p className="text-xs text-gray-500">{formatNumber(route.trips)} trips</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(route.revenue)}</p>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Peak Hours</h4>
          <div className="flex flex-wrap gap-2">
            {data.peakHours.map((hour, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {hour}
              </Badge>
            ))}
          </div>
        </div>

        {/* Monthly Trend Chart Placeholder */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Revenue Trend</h4>
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Revenue trend chart</p>
              <p className="text-xs text-gray-400">Last 6 months</p>
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}




