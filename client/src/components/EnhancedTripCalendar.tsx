import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";
import { useClientNames } from "../hooks/useClientNames";
import { TripHoverCard } from "./TripHoverCard";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Car,
  MapPin,
  Filter,
  RefreshCw,
  Plus
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
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";

interface Trip {
  id: string;
  program_id: string;
  client_id: string;
  client_group_id?: string;
  driver_id?: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  status: string;
  trip_type: string;
  passenger_count: number;
  notes?: string;
  is_group_trip?: boolean;
  client?: {
    first_name: string;
    last_name: string;
  };
  client_groups?: {
    id: string;
    name: string;
    description?: string;
  };
  driver?: {
    user_id: string;
  };
}

type ViewMode = 'today' | 'week' | 'month';

const statusColors = {
  scheduled: '#3B82F6', // blue
  in_progress: '#F59E0B', // amber
  completed: '#10B981', // green
  cancelled: '#EF4444', // red
};

// Helper function to get display name for trips
const getTripDisplayName = (trip: Trip, getClientName: (id: string) => string): string => {
  if (trip.is_group_trip && trip.client_groups) {
    return trip.client_groups.name;
  } else if (trip.is_group_trip && trip.client_group_id) {
    // For group trips, show a more descriptive name
    return `Group Trip (${trip.client_group_id.slice(0, 8)}...)`;
  } else if (trip.client) {
    return `${trip.client.first_name} ${trip.client.last_name}`;
  } else if (trip.client_id) {
    // For individual trips, fetch the client name using the hook
    return getClientName(trip.client_id);
  }
  return 'Unknown Client';
};

const driverColors = [
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export default function EnhancedTripCalendar() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const { getClientName, getClientInitials, isLoading: clientsLoading } = useClientNames();
  
  // Set initial date to current date for all users
  const [currentDate, setCurrentDate] = useState(new Date());
  // Default to 'month' view for all users
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [colorMode, setColorMode] = useState<'status' | 'driver'>('status');

  // Determine if we should enable the query based on user and hierarchy context
  const shouldEnableQuery = () => {
    if (!user) return false;
    
    // For corporate_admin, wait for corporate_client_id to be available
    if (user.role === 'corporate_admin') {
      const corporateClientId = (user as any).corporate_client_id || selectedCorporateClient;
      return !!corporateClientId;
    }
    
    // For super_admin, always enable
    if (user.role === 'super_admin') return true;
    
    // For other roles, wait for program or corporate client selection
    return !!(selectedProgram || selectedCorporateClient);
  };

  // Fetch trips data based on hierarchy level
  const { data: tripsData, isLoading: tripsLoading, error: tripsError } = useQuery({
    queryKey: ["/api/trips", level, selectedProgram, selectedCorporateClient, user?.role, (user as any)?.corporate_client_id],
    queryFn: async () => {
      let endpoint = "/api/trips";
      
      // Determine endpoint based on hierarchy level and user role
      if (user?.role === 'corporate_admin') {
        // Corporate admin should always filter by their corporate client ID for tenant isolation
        const corporateClientId = (user as any).corporate_client_id || selectedCorporateClient;
        if (corporateClientId) {
          endpoint = `/api/trips/corporate-client/${corporateClientId}`;
        } else {
          console.warn('⚠️ Calendar: Corporate admin missing corporate_client_id');
          return []; // Return empty array instead of fetching all trips
        }
      } else if (level === 'program' && selectedProgram) {
        endpoint = `/api/trips/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        // Corporate client level - filter by corporate client ID
        endpoint = `/api/trips/corporate-client/${selectedCorporateClient}`;
      } else if (level === 'corporate' && user?.role === 'super_admin') {
        // Only super admin can see all trips at corporate level
        endpoint = "/api/trips";
      } else {
        // Default fallback - use unfiltered trips endpoint (should only happen for super_admin)
        endpoint = "/api/trips";
      }
      
      if (user?.role === 'driver') {
        // For drivers, find their driver record and fetch assigned trips
        const driversResponse = await apiRequest("GET", endpoint.replace('/api/trips', '/api/drivers'));
        const driversData = await driversResponse.json();
        const driverRecord = driversData.find((d: any) => d.user_id === user?.user_id);
        
        if (driverRecord) {
          const response = await apiRequest("GET", `/api/trips/driver/${driverRecord.id}`);
          return await response.json();
        }
        return [];
      } else {
        // For other roles, fetch hierarchy trips
        // console.log('🗓️ Calendar: Fetching trips from endpoint:', endpoint); // Disabled to reduce console spam
        const response = await apiRequest("GET", endpoint);
        const data = await response.json();
        // console.log('🗓️ Calendar: Received trips:', Array.isArray(data) ? data.length : 'not an array', data); // Disabled to reduce console spam
        return data;
      }
    },
    enabled: shouldEnableQuery(),
  });

  // Enable real-time updates for trips
  // Use useMemo to prevent queryKeys array from changing on every render (prevents infinite re-renders)
  const queryKeysMemo = useMemo(() => {
    return [`["/api/trips","${level}","${selectedProgram}","${selectedCorporateClient}","${user?.role}"]`];
  }, [level, selectedProgram, selectedCorporateClient, user?.role]);
  
  const { refreshNow } = useRealTimeUpdates({
    enabled: !!user,
    interval: 10000, // 10 seconds
    queryKeys: queryKeysMemo
  });

  // Ensure trips is always an array and wait for data to load
  const trips = Array.isArray(tripsData) ? tripsData : [];
  
  // Debug logging DISABLED to prevent console spam
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('🗓️ Calendar Debug:', {
  //     level,
  //     selectedProgram,
  //     selectedCorporateClient,
  //     tripsCount: trips.length,
  //     tripsLoading,
  //     tripsError: tripsError?.message,
  //     userRole: user?.role
  //   });
  // }

  // Fetch drivers for color coding
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers", level, selectedProgram, selectedCorporateClient, user?.role],
    queryFn: async () => {
      let endpoint = "/api/drivers";
      
      // Super admin at corporate level can see all drivers
      if (user?.role === 'super_admin' && level === 'corporate') {
        endpoint = "/api/drivers";
      } else if (!selectedProgram && !selectedCorporateClient) {
        return [];
      } else if (level === 'program' && selectedProgram) {
        endpoint = `/api/drivers/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/drivers/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!(selectedProgram || selectedCorporateClient || (user?.role === 'super_admin' && level === 'corporate')),
  });

  // Create driver color mapping
  const driverColorMap = useMemo(() => {
    const map = new Map();
    drivers.forEach((driver: any, index: number) => {
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

  // Show loading state only while actively loading
  if (tripsLoading) {
    return (
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            Loading calendar data...
            <div className="text-sm text-gray-500 mt-2">Fetching trips...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tripsError) {
    console.error('🗓️ Calendar Error:', tripsError);
    return (
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <div className="font-semibold mb-2">Error loading trips</div>
            <div className="text-sm text-gray-600">{tripsError?.message || 'Unknown error'}</div>
            <div className="text-xs text-gray-500 mt-2">Please check the browser console for details</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For super_admin at corporate level, always show calendar
  // For corporate_admin, they should have selectedCorporateClient set
  // Only show "no selection" message for program-level users without a program
  if (!selectedProgram && !selectedCorporateClient && level !== 'corporate' && user?.role !== 'corporate_admin' && user?.role !== 'super_admin') {
    return (
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No program or corporate client selected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.href = '/trips?action=create'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Trip
          </Button>
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="flex items-center gap-1"
            >
              Today
            </Button>
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
          
          <h3 className="text-lg font-semibold">{getViewTitle()}</h3>
          
          <div className="w-24"></div> {/* Spacer for alignment */}
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
                        className="border rounded-lg p-3 space-y-2 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-l-4"
                        style={{ borderLeftColor: getTripColor(trip) }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                {format(parseISO(trip.scheduled_pickup_time), 'h:mm a')}
                                {trip.scheduled_return_time && (
                                  <span className="text-gray-500">
                                    {' - '}
                                    {format(parseISO(trip.scheduled_return_time), 'h:mm a')}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="text-sm">
                                {getTripDisplayName(trip, getClientName)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              <span className="text-sm">
                                {trip.driver ? 'Assigned' : 'Unassigned'}
                              </span>
                            </div>
                          </div>
                          <Badge 
                            style={{ 
                              backgroundColor: getTripColor(trip),
                              color: 'white'
                            }}
                          >
                            {colorMode === 'status' ? trip.status.replace('_', ' ') : 'Driver'}
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
        ) : viewMode === 'week' ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {days.slice(0, 7).reduce((total, day) => total + getTripsForDate(day).length, 0)} trip(s) scheduled this week
            </div>
            <div className="grid grid-cols-7 gap-4">
              {days.slice(0, 7).map(day => {
                const dayTrips = getTripsForDate(day);
                const isDayToday = isToday(day);
                
                return (
                  <div key={day.toISOString()} className="space-y-2">
                    <div className={`text-center p-2 rounded-lg ${
                      isDayToday 
                        ? 'bg-blue-100 text-blue-800 font-semibold' 
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                      <div className="text-lg">{format(day, 'd')}</div>
                    </div>
                    <div className="space-y-2 min-h-[200px]">
                      {dayTrips.length === 0 ? (
                        <div className="text-center text-gray-400 text-xs py-4">
                          No trips
                        </div>
                      ) : (
                        dayTrips
                          .sort((a: Trip, b: Trip) => a.scheduled_pickup_time.localeCompare(b.scheduled_pickup_time))
                          .map((trip: Trip) => (
                            <TripHoverCard key={trip.id} trip={trip}>
                              <div 
                                className="border rounded-lg p-2 space-y-1 cursor-pointer hover:shadow-md transition-shadow bg-white border-l-4"
                                style={{ borderLeftColor: getTripColor(trip) }}
                              >
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs font-medium">
                                    {format(parseISO(trip.scheduled_pickup_time), 'h:mm a')}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {getTripDisplayName(trip, getClientName)}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {trip.pickup_address} → {trip.dropoff_address}
                                </div>
                              </div>
                            </TripHoverCard>
                          ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
                    p-2 min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700
                    ${isCurrentMonth 
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100' 
                      : 'text-gray-300 bg-gray-100 dark:bg-gray-800 dark:text-gray-500'
                    }
                    ${isDayToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1 
                    ${isCurrentMonth 
                      ? 'text-gray-900 dark:text-gray-100' 
                      : 'text-gray-300 dark:text-gray-500'
                    }
                    ${isDayToday ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTrips.slice(0, 3).map((trip: Trip) => (
                      <TripHoverCard key={trip.id} trip={trip}>
                        <div
                          className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity ${
                            !isCurrentMonth ? 'opacity-60' : ''
                          }`}
                          style={{ backgroundColor: getTripColor(trip) }}
                        >
                          {format(parseISO(trip.scheduled_pickup_time), 'h:mm a')} {getTripDisplayName(trip, getClientName)}
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
            <Filter className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
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
                  <span className="text-xs capitalize text-gray-700 dark:text-gray-300">{status.replace('_', ' ')}</span>
                </div>
              ))
            ) : (
              drivers.slice(0, 8).map((driver: any, index: number) => (
                <div key={driver.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: driverColors[index % driverColors.length] }}
                  />
                  <span className="text-xs truncate text-gray-700 dark:text-gray-300">{driver.user_id}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
