import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import DriverTripCard from "../components/DriverTripCard";
import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";
import { Calendar, Clock, MapPin, User, Truck, RefreshCw } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface Trip {
  id: string;
  client_name: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  status: string;
  trip_type: string;
  passenger_count: number;
  notes?: string;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  // Fetch driver trips
  const { data: tripsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/trips/driver", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id || (!selectedProgram && !selectedCorporateClient)) return [];
      
      // Get driver record first based on hierarchy level
      let driversEndpoint = "/api/drivers";
      if (level === 'program' && selectedProgram) {
        driversEndpoint = `/api/drivers/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        driversEndpoint = `/api/drivers/corporate-client/${selectedCorporateClient}`;
      }
      
      const driversResponse = await apiRequest("GET", driversEndpoint);
      const driversData = await driversResponse.json();
      const driverRecord = driversData.find((d: any) => d.user_id === user.user_id);
      
      if (driverRecord) {
        const response = await apiRequest("GET", `/api/trips/driver/${driverRecord.id}`);
        return await response.json();
      }
      return [];
    },
    enabled: !!user?.user_id && !!(selectedProgram || selectedCorporateClient),
  });

  // Enable real-time updates for driver trips
  const { refreshNow } = useRealTimeUpdates({
    enabled: !!user?.user_id && !!(selectedProgram || selectedCorporateClient),
    interval: 10000, // 10 seconds
    queryKeys: [`["/api/trips/driver","${user?.user_id}"]`]
  });

  const trips = Array.isArray(tripsData) ? tripsData : [];

  // Filter trips by time periods
  const todayTrips = trips.filter(trip => {
    try {
      return isToday(parseISO(trip.scheduled_pickup_time));
    } catch {
      return false;
    }
  });

  const tomorrowTrips = trips.filter(trip => {
    try {
      return isTomorrow(parseISO(trip.scheduled_pickup_time));
    } catch {
      return false;
    }
  });

  const upcomingTrips = trips.filter(trip => {
    try {
      const tripDate = parseISO(trip.scheduled_pickup_time);
      return !isToday(tripDate) && !isTomorrow(tripDate) && tripDate > new Date();
    } catch {
      return false;
    }
  });

  // Status counts
  const statusCounts = trips.reduce((acc, trip) => {
    acc[trip.status] = (acc[trip.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleTripUpdate = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">Welcome back, {user?.user_name}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshNow}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">{trips.length} Total Trips</span>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.scheduled || 0}</div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.confirmed || 0}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.in_progress || 0}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.completed || 0}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.cancelled || 0}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Trips */}
      {todayTrips.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Today's Trips ({todayTrips.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {todayTrips.map((trip) => (
              <DriverTripCard
                key={trip.id}
                trip={trip}
                onStatusUpdate={handleTripUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tomorrow's Trips */}
      {tomorrowTrips.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Tomorrow's Trips ({tomorrowTrips.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tomorrowTrips.map((trip) => (
              <DriverTripCard
                key={trip.id}
                trip={trip}
                onStatusUpdate={handleTripUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Trips */}
      {upcomingTrips.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Upcoming Trips ({upcomingTrips.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingTrips.map((trip) => (
              <DriverTripCard
                key={trip.id}
                trip={trip}
                onStatusUpdate={handleTripUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Trips Message */}
      {trips.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trips assigned</h3>
            <p className="text-gray-600">You don't have any trips assigned at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}