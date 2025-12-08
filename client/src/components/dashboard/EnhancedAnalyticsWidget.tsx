import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Widget from './Widget';
import { BarChart, TrendingUp, TrendingDown, DollarSign, Users, Car, CheckCircle, Calendar, Filter } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useHierarchy } from '../../hooks/useHierarchy';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsWidgetProps {
  className?: string;
  shadow?: 'sm' | 'xl';
}

interface AnalyticsData {
  totalRevenue: number;
  tripsCompleted: number;
  activeDrivers: number;
  completionRate: number;
  revenueChange: number;
  tripsChange: number;
  driversChange: number;
  completionRateChange: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  tripsByStatus: Array<{ status: string; count: number }>;
  topRoutes: Array<{ name: string; revenue: number; trips: number }>;
  peakHours: Array<{ hour: string; trips: number }>;
  driverPerformance: Array<{ name: string; trips: number; rating: number }>;
}

export default function EnhancedAnalyticsWidget({ className, shadow }: AnalyticsWidgetProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState('revenue');
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  // Fetch analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analytics', timeRange, selectedProgram, selectedCorporateClient],
    queryFn: async (): Promise<AnalyticsData> => {
      // Mock data for now - in real implementation, this would come from API
      const mockData: AnalyticsData = {
        totalRevenue: 125000,
        tripsCompleted: 1200,
        activeDrivers: 45,
        completionRate: 98.5,
        revenueChange: 12.5,
        tripsChange: 8.2,
        driversChange: 5.1,
        completionRateChange: 2.3,
        revenueByMonth: [
          { month: 'Jan', revenue: 8500 },
          { month: 'Feb', revenue: 9200 },
          { month: 'Mar', revenue: 10800 },
          { month: 'Apr', revenue: 11200 },
          { month: 'May', revenue: 12800 },
          { month: 'Jun', revenue: 13500 },
        ],
        tripsByStatus: [
          { status: 'Completed', count: 1200 },
          { status: 'In Progress', count: 45 },
          { status: 'Scheduled', count: 78 },
          { status: 'Cancelled', count: 12 },
        ],
        topRoutes: [
          { name: 'Downtown to Airport', revenue: 15000, trips: 150 },
          { name: 'Suburb A to City Center', revenue: 12000, trips: 120 },
          { name: 'Hospital to Residential', revenue: 9000, trips: 100 },
          { name: 'University to Downtown', revenue: 8000, trips: 85 },
        ],
        peakHours: [
          { hour: '7-9 AM', trips: 80 },
          { hour: '4-6 PM', trips: 95 },
          { hour: '12-2 PM', trips: 45 },
          { hour: '6-8 PM', trips: 60 },
        ],
        driverPerformance: [
          { name: 'John Smith', trips: 45, rating: 4.9 },
          { name: 'Sarah Johnson', trips: 42, rating: 4.8 },
          { name: 'Mike Wilson', trips: 38, rating: 4.7 },
          { name: 'Lisa Brown', trips: 35, rating: 4.6 },
        ],
      };
      return mockData;
    },
  });

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-status-success" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-status-error" />;
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-status-success';
    if (change < 0) return 'text-status-error';
    return 'text-muted-foreground';
  };

  // Chart configurations
  const revenueChartData = {
    labels: analyticsData?.revenueByMonth.map(item => item.month) || [],
    datasets: [
      {
        label: 'Revenue ($)',
        data: analyticsData?.revenueByMonth.map(item => item.revenue) || [],
        borderColor: 'rgb(255, 85, 93)', // --primary (coral)
        backgroundColor: 'rgba(255, 85, 93, 0.1)', // --primary with opacity
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Map trip status to Fire palette colors
  const getTripStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'rgb(59, 254, 201)'; // --completed
      case 'in progress': return 'rgb(241, 254, 96)'; // --in-progress
      case 'scheduled': return 'rgb(122, 255, 254)'; // --scheduled
      case 'cancelled': return 'rgb(224, 72, 80)'; // --cancelled (coral-dark)
      default: return 'rgb(122, 255, 254)'; // Default to scheduled
    }
  };

  const tripsStatusData = {
    labels: analyticsData?.tripsByStatus.map(item => item.status) || [],
    datasets: [
      {
        data: analyticsData?.tripsByStatus.map(item => item.count) || [],
        backgroundColor: analyticsData?.tripsByStatus.map(item => getTripStatusColor(item.status)) || [],
        borderWidth: 0,
      },
    ],
  };

  const peakHoursData = {
    labels: analyticsData?.peakHours.map(item => item.hour) || [],
    datasets: [
      {
        label: 'Trips',
        data: analyticsData?.peakHours.map(item => item.trips) || [],
        backgroundColor: 'rgba(255, 85, 93, 0.8)', // --primary (coral) with opacity
        borderColor: 'rgb(255, 85, 93)', // --primary (coral)
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  if (isLoading) {
    return (
      <Widget
        title="Enhanced Analytics"
        icon={<BarChart className="h-5 w-5" />}
        size="large"
        className={className}
        loading={true}
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground">Loading enhanced analytics data...</div>
        </div>
      </Widget>
    );
  }

  if (error) {
    return (
      <Widget
        title="Enhanced Analytics"
        icon={<BarChart className="h-5 w-5" />}
        size="large"
        className={className}
        error="Failed to load analytics data"
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-red-600">Failed to load analytics data</div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget
      title="Enhanced Analytics"
      icon={<BarChart className="h-5 w-5" />}
      size="large"
      className={className}
      shadow={shadow}
      actions={
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-foreground-secondary">Total Revenue</h5>
                  <DollarSign className="h-4 w-4 text-foreground-secondary" />
                </div>
                <p className="text-2xl font-bold mt-1 text-foreground">${analyticsData?.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center text-sm mt-1">
                  {getTrendIcon(analyticsData?.revenueChange || 0)}
                  <span className={`ml-1 ${getTrendColor(analyticsData?.revenueChange || 0)}`}>
                    {Math.abs(analyticsData?.revenueChange || 0)}%
                  </span>
                  <span className="ml-1 text-foreground-secondary">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-foreground-secondary">Trips Completed</h5>
                  <CheckCircle className="h-4 w-4 text-foreground-secondary" />
                </div>
                <p className="text-2xl font-bold mt-1 text-foreground">{analyticsData?.tripsCompleted.toLocaleString()}</p>
                <div className="flex items-center text-sm mt-1">
                  {getTrendIcon(analyticsData?.tripsChange || 0)}
                  <span className={`ml-1 ${getTrendColor(analyticsData?.tripsChange || 0)}`}>
                    {Math.abs(analyticsData?.tripsChange || 0)}%
                  </span>
                  <span className="ml-1 text-foreground-secondary">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-foreground-secondary">Active Drivers</h5>
                  <Car className="h-4 w-4 text-foreground-secondary" />
                </div>
                <p className="text-2xl font-bold mt-1 text-foreground">{analyticsData?.activeDrivers}</p>
                <div className="flex items-center text-sm mt-1">
                  {getTrendIcon(analyticsData?.driversChange || 0)}
                  <span className={`ml-1 ${getTrendColor(analyticsData?.driversChange || 0)}`}>
                    {Math.abs(analyticsData?.driversChange || 0)}%
                  </span>
                  <span className="ml-1 text-foreground-secondary">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-foreground-secondary">Completion Rate</h5>
                  <CheckCircle className="h-4 w-4 text-foreground-secondary" />
                </div>
                <p className="text-2xl font-bold mt-1 text-foreground">{analyticsData?.completionRate}%</p>
                <div className="flex items-center text-sm mt-1">
                  {getTrendIcon(analyticsData?.completionRateChange || 0)}
                  <span className={`ml-1 ${getTrendColor(analyticsData?.completionRateChange || 0)}`}>
                    {Math.abs(analyticsData?.completionRateChange || 0)}%
                  </span>
                  <span className="ml-1 text-foreground-secondary">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trips Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-lg font-semibold mb-3 text-foreground">Trip Status Distribution</h5>
              <div className="h-64">
                <Doughnut data={tripsStatusData} options={doughnutOptions} />
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-3 text-foreground">Peak Hours</h5>
              <div className="h-64">
                <Bar data={peakHoursData} options={chartOptions} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div>
            <h5 className="text-lg font-semibold mb-3">Revenue Trend</h5>
            <div className="h-80">
              <Line data={revenueChartData} options={chartOptions} />
            </div>
          </div>

          <div>
            <h5 className="text-lg font-semibold mb-3">Top Performing Routes</h5>
            <div className="space-y-3">
              {analyticsData?.topRoutes.map((route, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h6 className="font-medium">{route.name}</h6>
                    <p className="text-sm text-muted-foreground">{route.trips} trips</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${route.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trips" className="space-y-6">
          <div>
            <h5 className="text-lg font-semibold mb-3">Trip Status Distribution</h5>
            <div className="h-80">
              <Doughnut data={tripsStatusData} options={doughnutOptions} />
            </div>
          </div>

          <div>
            <h5 className="text-lg font-semibold mb-3">Peak Hours Analysis</h5>
            <div className="h-80">
              <Bar data={peakHoursData} options={chartOptions} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div>
            <h5 className="text-lg font-semibold mb-3">Driver Performance</h5>
            <div className="space-y-3">
              {analyticsData?.driverPerformance.map((driver, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h6 className="font-medium text-foreground">{driver.name}</h6>
                      <p className="text-sm text-muted-foreground">{driver.trips} trips completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-foreground">{driver.rating}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Widget>
  );
}
