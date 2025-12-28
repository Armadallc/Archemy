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
import { TrendingUp, TrendingDown, DollarSign, Users, Car, CheckCircle, Calendar, Filter } from 'lucide-react';
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
  tripPurposes: Array<{ purpose: string; billingCode: string; trips: number; revenue: number }>;
  tenantTrips: Array<{ tenant: string; completedTrips: number }>;
  peakHours: Array<{ hour: string; trips: number }>;
  driverPerformance: Array<{ name: string; trips: number; rating: number }>;
}

export default function EnhancedAnalyticsWidget({ className, shadow }: AnalyticsWidgetProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState('revenue');
  const { level, selectedProgram, selectedCorporateClient, activeScopeName } = useHierarchy();

  // Helper function to calculate date range
  const getDateRange = (range: string) => {
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    };
  };

  // Fetch corporate clients (tenants)
  const { data: corporateClients } = useQuery({
    queryKey: ['corporate-clients'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate/clients');
      return await response.json();
    },
    staleTime: 300000, // 5 minutes
  });

  // Fetch tenant trip counts
  const { data: tenantTripsQueryData } = useQuery({
    queryKey: ['tenant-trips', timeRange],
    queryFn: async () => {
      if (!corporateClients || corporateClients.length === 0) return [];
      
      const { startDate, endDate } = getDateRange(timeRange);
      
      // Fetch completed trips for each tenant
      const tenantTripsPromises = corporateClients.map(async (tenant: any) => {
        try {
          const response = await apiRequest('GET', `/api/trips/corporate-client/${tenant.id}`);
          const trips = await response.json();
          const filteredTrips = Array.isArray(trips) 
            ? trips.filter((trip: any) => {
                const tripDate = trip.scheduled_pickup_time || trip.actual_pickup_time || trip.created_at;
                if (!tripDate) return false;
                const tripDateObj = new Date(tripDate);
                return trip.status === 'completed' && 
                       tripDateObj >= new Date(startDate) && 
                       tripDateObj <= new Date(endDate);
              })
            : [];
          
          return {
            tenant: tenant.name,
            completedTrips: filteredTrips.length,
          };
        } catch (error) {
          console.error(`Error fetching trips for tenant ${tenant.name}:`, error);
          return {
            tenant: tenant.name,
            completedTrips: 0,
          };
        }
      });
      
      const results = await Promise.all(tenantTripsPromises);
      // Sort by completed trips descending (include all tenants, even with 0 trips)
      return results.sort((a, b) => b.completedTrips - a.completedTrips);
    },
    enabled: !!corporateClients && corporateClients.length > 0,
    staleTime: 60000, // 1 minute - refresh more frequently for real-time updates
    refetchInterval: 120000, // Refetch every 2 minutes to catch new tenants
  });

  // Fetch program/tenant names for display
  const { data: programData } = useQuery({
    queryKey: ['program', selectedProgram],
    queryFn: async () => {
      if (!selectedProgram) return null;
      const response = await apiRequest('GET', `/api/programs/${selectedProgram}`);
      return await response.json();
    },
    enabled: !!selectedProgram,
    staleTime: 300000, // 5 minutes
  });

  const { data: corporateClientData } = useQuery({
    queryKey: ['corporate-client', selectedCorporateClient],
    queryFn: async () => {
      if (!selectedCorporateClient) return null;
      const response = await apiRequest('GET', `/api/corporate/clients/${selectedCorporateClient}`);
      return await response.json();
    },
    enabled: !!selectedCorporateClient && !selectedProgram, // Only fetch if program not selected
    staleTime: 300000, // 5 minutes
  });

  // Fetch trips for peak hours analysis (scoped by tenant/program)
  const { data: tripsForPeakHours } = useQuery({
    queryKey: ['trips-peak-hours', selectedProgram, selectedCorporateClient, level, timeRange],
    queryFn: async () => {
      let endpoint = '/api/trips';
      
      // Scope by program if selected
      if (selectedProgram) {
        endpoint = `/api/trips/program/${selectedProgram}`;
      } else if (selectedCorporateClient) {
        // Scope by corporate client (tenant) if selected
        endpoint = `/api/trips/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest('GET', endpoint);
      const trips = await response.json();
      const allTrips = Array.isArray(trips) ? trips : [];
      
      // Filter by date range
      const { startDate, endDate } = getDateRange(timeRange);
      return allTrips.filter((trip: any) => {
        const tripDate = trip.scheduled_pickup_time || trip.actual_pickup_time || trip.created_at;
        if (!tripDate) return false;
        const tripDateObj = new Date(tripDate);
        return tripDateObj >= new Date(startDate) && tripDateObj <= new Date(endDate);
      });
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  // Determine scope label for display
  const scopeLabel = React.useMemo(() => {
    if (selectedProgram && programData) {
      return programData.name || selectedProgram;
    } else if (selectedCorporateClient && corporateClientData) {
      return corporateClientData.name || selectedCorporateClient;
    } else if (selectedProgram) {
      return selectedProgram;
    } else if (selectedCorporateClient) {
      return selectedCorporateClient;
    }
    return 'All Tenants';
  }, [selectedProgram, selectedCorporateClient, programData, corporateClientData]);

  // Process trips into hourly buckets for peak hours
  const processedPeakHours = React.useMemo(() => {
    if (!tripsForPeakHours || tripsForPeakHours.length === 0) {
      return [
        { hour: '7-9 AM', trips: 0 },
        { hour: '9-11 AM', trips: 0 },
        { hour: '11 AM-1 PM', trips: 0 },
        { hour: '1-3 PM', trips: 0 },
        { hour: '3-5 PM', trips: 0 },
        { hour: '5-7 PM', trips: 0 },
        { hour: '7-9 PM', trips: 0 },
      ];
    }

    // Define hour buckets
    const hourBuckets: { [key: string]: number } = {
      '7-9 AM': 0,
      '9-11 AM': 0,
      '11 AM-1 PM': 0,
      '1-3 PM': 0,
      '3-5 PM': 0,
      '5-7 PM': 0,
      '7-9 PM': 0,
    };

    // Process each trip
    tripsForPeakHours.forEach((trip: any) => {
      const pickupTime = trip.scheduled_pickup_time || trip.actual_pickup_time;
      if (!pickupTime) return;

      const date = new Date(pickupTime);
      const hour = date.getHours();

      // Map hours to buckets
      if (hour >= 7 && hour < 9) hourBuckets['7-9 AM']++;
      else if (hour >= 9 && hour < 11) hourBuckets['9-11 AM']++;
      else if (hour >= 11 && hour < 13) hourBuckets['11 AM-1 PM']++;
      else if (hour >= 13 && hour < 15) hourBuckets['1-3 PM']++;
      else if (hour >= 15 && hour < 17) hourBuckets['3-5 PM']++;
      else if (hour >= 17 && hour < 19) hourBuckets['5-7 PM']++;
      else if (hour >= 19 && hour < 21) hourBuckets['7-9 PM']++;
    });

    // Convert to array format
    return Object.entries(hourBuckets).map(([hour, trips]) => ({
      hour,
      trips,
    }));
  }, [tripsForPeakHours]);

  // Fetch trips for analytics (scoped by tenant/program and filtered by date range)
  const { data: tripsForAnalytics } = useQuery({
    queryKey: ['trips-analytics', selectedProgram, selectedCorporateClient, level, timeRange],
    queryFn: async () => {
      let endpoint = '/api/trips';
      
      // Scope by program if selected
      if (selectedProgram) {
        endpoint = `/api/trips/program/${selectedProgram}`;
      } else if (selectedCorporateClient) {
        // Scope by corporate client (tenant) if selected
        endpoint = `/api/trips/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest('GET', endpoint);
      const trips = await response.json();
      const allTrips = Array.isArray(trips) ? trips : [];
      
      // Filter by date range
      const { startDate, endDate } = getDateRange(timeRange);
      return allTrips.filter((trip: any) => {
        const tripDate = trip.scheduled_pickup_time || trip.actual_pickup_time || trip.created_at;
        if (!tripDate) return false;
        const tripDateObj = new Date(tripDate);
        return tripDateObj >= new Date(startDate) && tripDateObj <= new Date(endDate);
      });
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  // Fetch drivers (scoped by tenant/program)
  const { data: driversData } = useQuery({
    queryKey: ['drivers-analytics', selectedProgram, selectedCorporateClient, level],
    queryFn: async () => {
      let endpoint = '/api/drivers';
      
      // Scope by program if selected
      if (selectedProgram) {
        endpoint = `/api/drivers/program/${selectedProgram}`;
      } else if (selectedCorporateClient) {
        // Scope by corporate client (tenant) if selected
        endpoint = `/api/drivers/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest('GET', endpoint);
      const drivers = await response.json();
      return Array.isArray(drivers) ? drivers : [];
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Calculate trip purposes from real data
  const calculatedTripPurposes = React.useMemo(() => {
    if (!tripsForAnalytics || tripsForAnalytics.length === 0) {
      // Return default purposes with 0 trips if no data
      return [
        { purpose: 'Legal', billingCode: 'T2003-U1', trips: 0, revenue: 0 },
        { purpose: 'Community', billingCode: 'T2003-U2', trips: 0, revenue: 0 },
        { purpose: 'Groceries', billingCode: 'T2003-U3', trips: 0, revenue: 0 },
        { purpose: 'Program (adjacent)', billingCode: 'H2014-UA', trips: 0, revenue: 0 },
        { purpose: 'Medical', billingCode: 'T2003-U4', trips: 0, revenue: 0 },
        { purpose: 'Non-Medical', billingCode: 'A0999-ET', trips: 0, revenue: 0 },
      ];
    }

    // Group trips by purpose
    const purposeMap: { [key: string]: { trips: number; revenue: number; billingCode: string } } = {};
    
    tripsForAnalytics.forEach((trip: any) => {
      const purpose = trip.trip_purpose || 'Unknown';
      const billingCode = trip.trip_code || (trip.trip_modifier ? `${trip.trip_code || 'N/A'}-${trip.trip_modifier}` : 'N/A');
      
      if (!purposeMap[purpose]) {
        purposeMap[purpose] = { trips: 0, revenue: 0, billingCode };
      }
      
      purposeMap[purpose].trips++;
      // Calculate revenue (placeholder - you may need to adjust based on your revenue calculation logic)
      // For now, using a simple estimate: $100 per trip
      purposeMap[purpose].revenue += 100;
    });

    // Convert to array format and sort by trips descending
    return Object.entries(purposeMap)
      .map(([purpose, data]) => ({
        purpose,
        billingCode: data.billingCode,
        trips: data.trips,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.trips - a.trips);
  }, [tripsForAnalytics]);

  // Calculate driver performance from real data
  const calculatedDriverPerformance = React.useMemo(() => {
    if (!driversData || driversData.length === 0 || !tripsForAnalytics) {
      return [];
    }

    // Count completed trips per driver within the date range
    const driverTripCounts: { [driverId: string]: number } = {};
    
    tripsForAnalytics.forEach((trip: any) => {
      if (trip.status === 'completed' && trip.driver_id) {
        driverTripCounts[trip.driver_id] = (driverTripCounts[trip.driver_id] || 0) + 1;
      }
    });

    // Map drivers to performance data
    const driverPerformance = driversData
      .map((driver: any) => {
        const driverName = driver.users?.user_name || 
                          driver.name || 
                          `${driver.first_name || ''} ${driver.last_name || ''}`.trim() ||
                          'Unknown Driver';
        const completedTrips = driverTripCounts[driver.id] || 0;
        
        return {
          name: driverName,
          trips: completedTrips,
          rating: 0, // Placeholder - rating system to be implemented later
        };
      })
      .filter((driver: any) => driver.trips > 0) // Only show drivers with completed trips
      .sort((a: any, b: any) => b.trips - a.trips); // Sort by trips descending

    return driverPerformance;
  }, [driversData, tripsForAnalytics]);

  // Fetch analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analytics', timeRange, selectedProgram, selectedCorporateClient, tenantTripsQueryData, calculatedTripPurposes, calculatedDriverPerformance],
    queryFn: async (): Promise<AnalyticsData> => {
      // Calculate stats from real trip data
      const completedTrips = tripsForAnalytics?.filter((t: any) => t.status === 'completed') || [];
      const totalTrips = tripsForAnalytics?.length || 0;
      const totalRevenue = calculatedTripPurposes.reduce((sum, p) => sum + p.revenue, 0);
      
      // Mock data for some fields that need additional API endpoints
      const mockData: AnalyticsData = {
        totalRevenue: totalRevenue,
        tripsCompleted: completedTrips.length,
        activeDrivers: 45, // TODO: Fetch from API
        completionRate: totalTrips > 0 ? (completedTrips.length / totalTrips) * 100 : 0,
        revenueChange: 12.5, // TODO: Calculate from previous period
        tripsChange: 8.2, // TODO: Calculate from previous period
        driversChange: 5.1, // TODO: Calculate from previous period
        completionRateChange: 2.3, // TODO: Calculate from previous period
        revenueByMonth: [
          { month: 'Jan', revenue: 8500 },
          { month: 'Feb', revenue: 9200 },
          { month: 'Mar', revenue: 10800 },
          { month: 'Apr', revenue: 11200 },
          { month: 'May', revenue: 12800 },
          { month: 'Jun', revenue: 13500 },
        ],
        tripsByStatus: [
          { status: 'Completed', count: completedTrips.length },
          { status: 'In Progress', count: tripsForAnalytics?.filter((t: any) => t.status === 'in_progress').length || 0 },
          { status: 'Scheduled', count: tripsForAnalytics?.filter((t: any) => t.status === 'scheduled').length || 0 },
          { status: 'Cancelled', count: tripsForAnalytics?.filter((t: any) => t.status === 'cancelled').length || 0 },
        ],
        tenantTrips: tenantTripsQueryData || [],
        topRoutes: [
          { name: 'Downtown to Airport', revenue: 15000, trips: 150 },
          { name: 'Suburb A to City Center', revenue: 12000, trips: 120 },
          { name: 'Hospital to Residential', revenue: 9000, trips: 100 },
          { name: 'University to Downtown', revenue: 8000, trips: 85 },
        ],
        tripPurposes: calculatedTripPurposes,
        peakHours: [
          { hour: '7-9 AM', trips: 80 },
          { hour: '4-6 PM', trips: 95 },
          { hour: '12-2 PM', trips: 45 },
          { hour: '6-8 PM', trips: 60 },
        ],
        driverPerformance: calculatedDriverPerformance,
      };
      return mockData;
    },
    enabled: true,
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

  // Tenant Trip Distribution data for horizontal bar chart
  // Use real tenant trips data if available, otherwise fall back to analyticsData
  const tenantTripsChartData = {
    labels: (tenantTripsQueryData || analyticsData?.tenantTrips || []).map((item: any) => item.tenant) || [],
    datasets: [
      {
        label: 'Completed Trips',
        data: (tenantTripsQueryData || analyticsData?.tenantTrips || []).map((item: any) => item.completedTrips) || [],
        backgroundColor: 'rgb(255, 85, 93)', // --primary (coral)
        borderColor: 'rgb(255, 85, 93)',
        borderWidth: 1,
      },
    ],
  };

  const tenantTripsOptions = {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          precision: 0,
        },
      },
      y: {
        display: true,
        grid: {
          display: false,
        },
      },
    },
  };

  const peakHoursData = {
    labels: processedPeakHours.map(item => item.hour),
    datasets: [
      {
        label: 'Trips',
        data: processedPeakHours.map(item => item.trips),
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

  // Fetch tenant revenue data
  const { data: tenantRevenueData } = useQuery({
    queryKey: ['tenant-revenue', timeRange, corporateClients],
    queryFn: async () => {
      if (!corporateClients || corporateClients.length === 0) return [];

      const { startDate, endDate } = getDateRange(timeRange);

      // Fetch trips and revenue for each tenant
      const tenantRevenuePromises = corporateClients.map(async (tenant: any) => {
        try {
          const response = await apiRequest('GET', `/api/trips/corporate-client/${tenant.id}`);
          const trips = await response.json();
          const filteredTrips = Array.isArray(trips) 
            ? trips.filter((trip: any) => {
                const tripDate = trip.scheduled_pickup_time || trip.actual_pickup_time || trip.created_at;
                if (!tripDate) return false;
                const tripDateObj = new Date(tripDate);
                return tripDateObj >= new Date(startDate) && tripDateObj <= new Date(endDate);
              })
            : [];

          const completedTrips = filteredTrips.filter((t: any) => t.status === 'completed');
          const totalTrips = filteredTrips.length;
          
          // Calculate revenue (using same estimate as trip purposes: $100 per trip)
          // In production, this would use actual billing/revenue data
          const totalRevenue = completedTrips.length * 100;
          const avgRevenuePerTrip = completedTrips.length > 0 ? totalRevenue / completedTrips.length : 0;
          const completionRate = totalTrips > 0 ? (completedTrips.length / totalTrips) * 100 : 0;

          return {
            tenant: tenant.name,
            totalRevenue,
            completedTrips: completedTrips.length,
            totalTrips,
            avgRevenuePerTrip,
            completionRate,
          };
        } catch (error) {
          console.error(`Error fetching revenue for tenant ${tenant.name}:`, error);
          return {
            tenant: tenant.name,
            totalRevenue: 0,
            completedTrips: 0,
            totalTrips: 0,
            avgRevenuePerTrip: 0,
            completionRate: 0,
          };
        }
      });

      const results = await Promise.all(tenantRevenuePromises);
      return results.sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending
    },
    enabled: !!corporateClients && corporateClients.length > 0,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  // Revenue by Tenant chart
  const tenantRevenueChartData = {
    labels: (tenantRevenueData || []).map((item: any) => item.tenant) || [],
    datasets: [
      {
        label: 'Total Revenue ($)',
        data: (tenantRevenueData || []).map((item: any) => item.totalRevenue) || [],
        backgroundColor: 'rgba(255, 85, 93, 0.8)', // --primary (coral)
        borderColor: 'rgb(255, 85, 93)',
        borderWidth: 1,
      },
    ],
  };

  const tenantRevenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Revenue: $${context.parsed.y.toLocaleString()}`;
          },
        },
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
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  // Average Revenue per Trip by Tenant chart
  const avgRevenuePerTripChartData = {
    labels: (tenantRevenueData || []).map((item: any) => item.tenant) || [],
    datasets: [
      {
        label: 'Avg Revenue per Trip ($)',
        data: (tenantRevenueData || []).map((item: any) => item.avgRevenuePerTrip) || [],
        backgroundColor: 'rgba(59, 254, 201, 0.8)', // --completed (teal)
        borderColor: 'rgb(59, 254, 201)',
        borderWidth: 1,
      },
    ],
  };

  const avgRevenuePerTripChartOptions = {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Avg Revenue: $${context.parsed.x.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          },
        },
      },
      y: {
        display: true,
        grid: {
          display: false,
        },
      },
    },
  };

  // Completion Rate by Tenant chart
  const completionRateChartData = {
    labels: (tenantRevenueData || []).map((item: any) => item.tenant) || [],
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: (tenantRevenueData || []).map((item: any) => item.completionRate) || [],
        backgroundColor: 'rgba(122, 255, 254, 0.8)', // --scheduled (cyan)
        borderColor: 'rgb(122, 255, 254)',
        borderWidth: 1,
      },
    ],
  };

  const completionRateChartOptions = {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Completion Rate: ${context.parsed.x.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
      y: {
        display: true,
        grid: {
          display: false,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <Widget
        title="ANALYTICS"
        size="large"
        className={className}
        loading={true}
        titleStyle={{ fontSize: '42px' }}
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
        title="ANALYTICS"
        size="large"
        className={className}
        error="Failed to load analytics data"
        titleStyle={{ fontSize: '42px' }}
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-red-600">Failed to load analytics data</div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget
      title="ANALYTICS"
      size="large"
      className={className}
      shadow="xl"
      titleStyle={{ fontSize: '42px' }}
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
          <TabsTrigger value="overview" style={{ fontSize: '26px' }}>Overview</TabsTrigger>
          <TabsTrigger value="revenue" style={{ fontSize: '26px' }}>Revenue</TabsTrigger>
          <TabsTrigger value="trips" style={{ fontSize: '26px' }}>Trips</TabsTrigger>
          <TabsTrigger value="performance" style={{ fontSize: '26px' }}>Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
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

            <Card className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
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

            <Card className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
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

            <Card className="card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: '24px' }}>
            <div className="card-neu-pressed rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <h5 className="text-lg font-semibold mb-3 text-foreground" style={{ fontSize: '26px' }}>Tenant Trip Distribution</h5>
              <div className="h-64">
                <Bar data={tenantTripsChartData} options={tenantTripsOptions} />
              </div>
            </div>

            <div className="card-neu-pressed rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none', paddingLeft: '16px', paddingRight: '16px' }}>
              <div className="mb-3">
                <h5 className="text-lg font-semibold text-foreground" style={{ fontSize: '26px' }}>Peak Hours</h5>
                {scopeLabel && (
                  <p className="text-xs text-muted-foreground mt-1">Showing data for: {scopeLabel}</p>
                )}
              </div>
              <div className="h-64">
                <Bar data={peakHoursData} options={chartOptions} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="card-neu-pressed rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <h5 className="text-lg font-semibold mb-3">Revenue Trend</h5>
            <div className="h-80">
              <Line data={revenueChartData} options={chartOptions} />
            </div>
          </div>

          <div>
            <h5 className="text-lg font-semibold mb-3">Trip Purposes</h5>
            <div className="space-y-3">
              {analyticsData?.tripPurposes.map((purpose, index) => (
                <div key={index} className="flex items-center justify-between p-3 card-neu-pressed rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <div className="flex-1">
                    <h6 className="font-medium">{purpose.purpose}</h6>
                    <p className="text-sm text-muted-foreground">Billing Code: {purpose.billingCode}</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground">{purpose.trips} trips</p>
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-semibold">${purpose.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trips" className="space-y-6">
          {/* Revenue by Tenant */}
          <div className="card-neu-pressed rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <h5 className="text-lg font-semibold mb-3 text-foreground" style={{ fontSize: '26px' }}>Revenue by Tenant</h5>
            <div className="h-80">
              <Bar data={tenantRevenueChartData} options={tenantRevenueChartOptions} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Revenue per Trip by Tenant */}
            <div className="card-neu-pressed rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <h5 className="text-lg font-semibold mb-3 text-foreground" style={{ fontSize: '26px' }}>Avg Revenue per Trip</h5>
              <div className="h-64">
                <Bar data={avgRevenuePerTripChartData} options={avgRevenuePerTripChartOptions} />
              </div>
            </div>

            {/* Completion Rate by Tenant */}
            <div className="card-neu-pressed rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <h5 className="text-lg font-semibold mb-3 text-foreground" style={{ fontSize: '26px' }}>Completion Rate by Tenant</h5>
              <div className="h-64">
                <Bar data={completionRateChartData} options={completionRateChartOptions} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div>
            <h5 className="text-lg font-semibold mb-3">Driver Performance</h5>
            <div className="space-y-3">
              {analyticsData?.driverPerformance.map((driver, index) => (
                <div key={index} className="flex items-center justify-between p-3 card-neu-pressed rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h6 className="font-medium text-foreground">{driver.name}</h6>
                      <p className="text-sm text-muted-foreground">{driver.trips} trips completed</p>
                    </div>
                  </div>
                  {driver.rating > 0 ? (
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-foreground">{driver.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rating coming soon</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Widget>
  );
}
