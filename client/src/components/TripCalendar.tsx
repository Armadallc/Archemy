import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripHoverCard } from "@/components/TripHoverCard";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Car,
  MapPin,
  Filter,
  RefreshCw
} from "lucide-react";
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfDay,
  endOfDay,
  parseISO,
  isToday,
  startOfWeek as startOfWeekFn,
  endOfWeek as endOfWeekFn,
  addWeeks,
  subWeeks
} from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

interface Trip {
  id: string;
  organization_id: string;
  client_id: string;
  driver_id: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  status: string;
  trip_type: string;
  passenger_count: number;
  notes?: string;
  client_first_name?: string;
  client_last_name?: string;
  driver_name?: string;
  clientName?: string;
  tripNickname?: string;
  passengerCount?: number;
}

interface Driver {
  id: string;
  users: {
    user_name: string;
  };
}

type ViewMode = 'today' | 'week' | 'month';

const statusColors = {
  scheduled: '#3B82F6', // blue
  in_progress: '#F59E0B', // amber
  completed: '#10B981', // green
  cancelled: '#EF4444', // red
};

const driverColors = [
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export default function TripCalendar() {
  const { user } = useAuth();
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  // Set initial date to current date for drivers, July 2025 for others
  const [currentDate, setCurrentDate] = useState(
    user?.role === 'driver' ? new Date() : new Date(2025, 6, 1)
  );
  // Default to 'today' view for drivers, 'month' for others
  const [viewMode, setViewMode] = useState<ViewMode>(
    user?.role === 'driver' ? 'today' : 'month'
  );
  const [colorMode, setColorMode] = useState<'status' | 'driver'>('status');

  // Fetch trips data - driver-specific or organization-wide
  const { data: tripsData, isLoading: tripsLoading, error: tripsError } = useQuery({
    queryKey: ["/api/trips", currentOrganization?.id, user?.role],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      if (user?.role === 'driver') {
        // For drivers, find their driver record and fetch assigned trips
        const driversResponse = await apiRequest("GET", `/api/drivers/organization/${currentOrganization.id}`);
        const driversData = await driversResponse.json();
        const driverRecord = driversData.find((d: any) => d.user_id === user?.userId);
        
        if (driverRecord) {
          const response = await apiRequest("GET", `/api/trips/driver/${driverRecord.id}`);
          return await response.json();
        }
        return [];
      } else {
        // For other roles, fetch organization trips
        const response = await apiRequest("GET", `/api/trips/organization/${currentOrganization.id}`);
        return await response.json();
      }
    },
    enabled: !!currentOrganization?.id && !!user,
  });

  // Enable real-time updates for trips
  const { refreshNow } = useRealTimeUpdates({
    enabled: !!currentOrganization?.id && !!user,
    interval: 10000, // 10 seconds
    queryKeys: [`["/api/trips","${currentOrganization?.id}","${user?.role}"]`]
  });

  // Ensure trips is always an array and wait for data to load
  const trips = Array.isArray(tripsData) ? tripsData : [];

  // Fetch drivers for color coding
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const response = await apiRequest("GET", `/api/drivers/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  // Create driver color mapping
  const driverColorMap = useMemo(() => {
    const map = new Map();
    drivers.forEach((driver: Driver, index: number) => {
      map.set(driver.id, driverColors[index % driverColors.length]);
    });
    return map;
  }, [drivers]);

  const getDateRange = () => {
    switch (viewMode) {
      case 'today':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        };
      case 'week':
        return {
          start: startOfWeekFn(currentDate, { weekStartsOn: 0 }),
          end: endOfWeekFn(currentDate, { weekStartsOn: 0 }),
        };
      case 'month':
        return {
          start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
          end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
        };
    }
  };

  const dateRange = getDateRange();
  const days = eachDayOfInterval(dateRange);
  


  const getTripsForDate = (date: Date) => {
    return trips.filter((trip: Trip) => {
      try {
        const tripDate = parseISO(trip.scheduled_pickup_time);
        return isSameDay(tripDate, date);
      } catch (error) {
        console.error('Date parsing error for trip:', trip.id, error);
        return false;
      }
    });
  };

  const getTripColor = (trip: Trip) => {
    if (colorMode === 'status') {
      return statusColors[trip.status as keyof typeof statusColors] || '#6B7280';
    } else {
      return driverColorMap.get(trip.driver_id) || '#6B7280';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (viewMode) {
      case 'today':
        setCurrentDate(prev => direction === 'prev' 
          ? new Date(prev.getTime() - 24 * 60 * 60 * 1000)
          : new Date(prev.getTime() + 24 * 60 * 60 * 1000)
        );
        break;
      case 'week':
        setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'today':
        return format(currentDate, 'MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeekFn(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeekFn(currentDate, { weekStartsOn: 0 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
    }
  };

  if (orgLoading || tripsLoading || !tripsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trip Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            Loading calendar data...
            {tripsLoading && <div className="text-sm text-gray-500 mt-2">Fetching trips...</div>}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tripsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trip Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            Error loading trips. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentOrganization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trip Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No organization selected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trip Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshNow}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Select value={colorMode} onValueChange={(value: 'status' | 'driver') => setColorMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="driver">By Driver</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          
          <h3 className="text-lg font-semibold">{getViewTitle()}</h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === 'today' ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {getTripsForDate(currentDate).length} trip(s) scheduled
            </div>
            {getTripsForDate(currentDate).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No trips scheduled for today
              </div>
            ) : (
              <div className="space-y-3">
                {getTripsForDate(currentDate)
                  .sort((a: Trip, b: Trip) => a.scheduled_pickup_time.localeCompare(b.scheduled_pickup_time))
                  .map((trip: Trip) => (
                    <TripHoverCard key={trip.id} trip={trip}>
                      <div 
                        className="border rounded-lg p-3 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
                        style={{ borderLeftColor: getTripColor(trip), borderLeftWidth: '4px' }}
                      >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {(() => {
                                const pickupTime = new Date(trip.scheduled_pickup_time);
                                const denverPickup = new Date(pickupTime.getTime() - (6 * 60 * 60 * 1000));
                                let timeDisplay = format(denverPickup, 'h:mm a');
                                
                                if (trip.scheduled_return_time) {
                                  const returnTime = new Date(trip.scheduled_return_time);
                                  const denverReturn = new Date(returnTime.getTime() - (6 * 60 * 60 * 1000));
                                  timeDisplay += ` - ${format(denverReturn, 'h:mm a')}`;
                                }
                                
                                return timeDisplay;
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm">
                              {trip.client_first_name} {trip.client_last_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            <span className="text-sm">
                              {trip.driver_name || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          style={{ 
                            backgroundColor: getTripColor(trip),
                            color: 'white'
                          }}
                        >
                          {colorMode === 'status' ? trip.status.replace('_', ' ') : trip.driver_name || 'Unassigned'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{trip.pickup_address} → {trip.dropoff_address}</span>
                      </div>
                      </div>
                    </TripHoverCard>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
            {/* Header row */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map(day => {
              const dayTrips = getTripsForDate(day);
              const isCurrentMonth = viewMode === 'month' ? isSameMonth(day, currentDate) : true;
              const isDayToday = isToday(day);
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`
                    bg-white dark:bg-gray-900 p-2 min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700
                    ${!isCurrentMonth ? 'text-gray-400 bg-gray-50 dark:bg-gray-800' : ''}
                    ${isDayToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1 
                    ${isDayToday ? 'text-blue-600 dark:text-blue-400' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTrips.slice(0, 3).map((trip: Trip) => (
                      <TripHoverCard key={trip.id} trip={trip}>
                        <div
                          className="text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: getTripColor(trip) }}
                          onClick={() => console.log('🔍 CALENDAR CLICK DEBUG - Trip data:', trip)}
                        >
                          {format(parseISO(trip.scheduled_pickup_time), 'h:mm a')} {trip.clientName || (trip.client_first_name && trip.client_last_name ? `${trip.client_first_name} ${trip.client_last_name}` : trip.client_first_name) || 'Client'}
                        </div>
                      </TripHoverCard>
                    ))}
                    {dayTrips.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayTrips.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">
              Color Legend ({colorMode === 'status' ? 'Trip Status' : 'Drivers'})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {colorMode === 'status' ? (
              Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs capitalize">{status.replace('_', ' ')}</span>
                </div>
              ))
            ) : (
              drivers.slice(0, 8).map((driver: Driver, index: number) => (
                <div key={driver.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: driverColors[index % driverColors.length] }}
                  />
                  <span className="text-xs truncate">{driver.users?.user_name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}