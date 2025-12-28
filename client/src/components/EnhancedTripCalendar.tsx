import React, { useState, useMemo, useContext } from "react";
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
  ChevronDown,
  Clock, 
  User, 
  Car,
  MapPin,
  Filter
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
import { CalendarContext, useCalendarContext } from "./event-calendar/calendar-context";
import { cn } from "../lib/utils";

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
  trip_purpose?: string | null;
}

type ViewMode = 'today' | 'week' | 'month';

// Helper to get CSS variable value
const getCSSVariable = (variable: string): string => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
  }
  return '';
};

// Status colors using HALCYON theme CSS variables
// Export both function and value versions for compatibility
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    scheduled: getCSSVariable('--scheduled') || '#7afffe', // Fire palette: Ice-derived
    in_progress: getCSSVariable('--in-progress') || '#f1fe60', // Fire palette: Lime-derived
    completed: getCSSVariable('--completed') || '#3bfec9', // Fire palette: Lime-derived
    cancelled: getCSSVariable('--cancelled') || '#e04850', // Fire palette: Coral-dark
  };
  return colorMap[status] || getCSSVariable('--muted-foreground') || '#5c6166'; // Fire palette: charcoal-muted
};

// FIRE DESIGN SYSTEM CONTRAST RULE:
// Light backgrounds (ice, silver, cloud, lime) = charcoal or coral text
// Dark backgrounds (charcoal, coral) = ice, silver, or cloud text
const getContrastTextColor = (bgColor: string): string => {
  const charcoal = getCSSVariable('--color-charcoal') || '#26282b';
  const ice = getCSSVariable('--color-ice') || '#e8fffe';
  
  // Determine if background is light by checking if it's a light Fire color
  // Light Fire colors: ice (#e8fffe), silver (#d1e0e4), cloud (#f1f5f4), lime (#3bfec9), 
  // scheduled (#7afffe), in_progress (#f1fe60), completed (#3bfec9)
  const lightColors = ['e8fffe', 'd1e0e4', 'f1f5f4', '3bfec9', '7afffe', 'f1fe60', 'fff', 'fef', 'ffe', 'f5f', 'e0e', 'd1d'];
  const normalizedBg = bgColor.toLowerCase().replace('#', '');
  
  // Check if it's a light color that needs dark text
  const isLightBg = lightColors.some(c => normalizedBg.includes(c)) || 
                    // Also check by luminance approximation for hex colors
                    (normalizedBg.length >= 3 && parseInt(normalizedBg.slice(0, 2), 16) > 180);
  
  return isLightBg ? charcoal : ice;
};

// Export statusColors as an object with getter functions for compatibility
export const statusColors = {
  scheduled: () => getStatusColor('scheduled'),
  in_progress: () => getStatusColor('in_progress'),
  completed: () => getStatusColor('completed'),
  cancelled: () => getStatusColor('cancelled'),
  // Also export as plain values for calendar.tsx
  get scheduledValue() { return getStatusColor('scheduled'); },
  get in_progressValue() { return getStatusColor('in_progress'); },
  get completedValue() { return getStatusColor('completed'); },
  get cancelledValue() { return getStatusColor('cancelled'); },
};

// Helper function to get display name for trips
const getTripDisplayName = (trip: Trip, getClientName: (id: string) => string): string => {
  if (trip.is_group_trip && trip.client_groups) {
    return trip.client_groups.name;
  } else if (trip.is_group_trip && trip.client_group_id) {
    // For group trips without a name, show generic name without ID
    return 'Group Trip';
  } else if (trip.client) {
    return `${trip.client.first_name} ${trip.client.last_name}`;
  } else if (trip.client_id) {
    // For individual trips, fetch the client name using the hook
    return getClientName(trip.client_id);
  }
  return 'Unknown Client';
};

// Driver colors using HALCYON theme CSS variables
// Export as a function to avoid Fast Refresh issues with array exports
export function getDriverColors(): Array<() => string> {
  return [
    () => getCSSVariable('--driver-color-1') || '#3b82f6', // blue (from CSS variable definition)
    () => getCSSVariable('--driver-color-2') || '#22c55e', // green (from CSS variable definition)
    () => getCSSVariable('--driver-color-3') || '#f59e0b', // amber (from CSS variable definition)
    () => getCSSVariable('--driver-color-4') || '#8b5cf6', // purple (from CSS variable definition)
    () => getCSSVariable('--driver-color-5') || '#ec4899', // pink (from CSS variable definition)
    () => getCSSVariable('--driver-color-6') || '#06b6d4', // cyan (from CSS variable definition)
  ];
}

export default function EnhancedTripCalendar() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const { getClientName, getClientInitials, isLoading: clientsLoading } = useClientNames();
  
  // Use calendar context if available, otherwise use local state
  const [localDate, setLocalDate] = useState(new Date());
  
  // Try to get calendar context (may be undefined if not in provider)
  const calendarContext = useContext(CalendarContext);
  
  // Use context date if available, otherwise use local state
  const currentDate = calendarContext?.currentDate ?? localDate;
  const setCurrentDate = calendarContext?.setCurrentDate ?? setLocalDate;

  // Mini Calendar has been moved to the sidebar
  // Default to 'month' view for all users
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  // Color mode is always 'status' now (color mode select removed)
  const colorMode: 'status' | 'driver' = 'status';

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
      const driverColorsArray = getDriverColors();
      const colorFn = driverColorsArray[index % driverColorsArray.length];
      map.set(driver.id, colorFn ? colorFn() : getCSSVariable('--muted-foreground') || '#5c6166'); // Fire palette: charcoal-muted
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
  
  // Group days into weeks for month view (matching bentobox structure)
  const weeks: Date[][] = [];
  if (viewMode === 'month') {
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
  }

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

  const getTripColor = (trip: Trip): string => {
    if (colorMode === 'status') {
      return getStatusColor(trip.status);
    } else {
      const driverColor = driverColorMap.get(trip.driver_id);
      return driverColor || getCSSVariable('--muted-foreground') || '#5c6166'; // Fire palette: charcoal-muted
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const updateDate = calendarContext?.setCurrentDate ?? setLocalDate;
    const current = calendarContext?.currentDate ?? localDate;
    
    switch (viewMode) {
      case 'today':
        updateDate(direction === 'prev' 
          ? new Date(current.getTime() - 24 * 60 * 60 * 1000)
          : new Date(current.getTime() + 24 * 60 * 60 * 1000)
        );
        break;
      case 'week':
        updateDate(direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1));
        break;
      case 'month':
        updateDate(direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
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
            <div className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>Fetching trips...</div>
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
          <div className="text-center py-8" style={{ color: 'var(--destructive)' }}>
            <div className="font-semibold mb-2">Error loading trips</div>
            <div className="text-sm" style={{ color: 'var(--destructive)' }}>{tripsError?.message || 'Unknown error'}</div>
            <div className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>Please check the browser console for details</div>
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
          <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
            No program or corporate client selected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div 
      className="flex-1 flex flex-col overflow-hidden min-h-0 card-glow-border rounded-lg h-full" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: '1 1 0%', 
        minHeight: 0,
        height: '100%',
        backgroundColor: '#26282b',
        borderColor: 'var(--border)'
      }}
    >
      <div className="flex flex-col space-y-1.5 p-6" style={{ backgroundColor: 'var(--background)' }}>
        {/* Header Content */}
        <div className="flex flex-col gap-6">
          {/* Month/Year Title, Navigation Buttons, and View Mode Select */}
          <div className="flex items-center justify-between w-full pb-0">
            {/* Month/Year Title - positioned just to the right of mini calendar */}
            <h1 
              style={{ 
                fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                fontSize: '42px',
                fontWeight: 400
              }}
            >
              {getViewTitle()}
            </h1>
            
            {/* Navigation Buttons and View Mode Select */}
            <div 
              className="flex items-center gap-4 flex-shrink min-w-0 rounded-md overflow-visible"
              style={{
                height: '93px',
                borderRadius: '6px',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '12px',
                paddingBottom: '12px',
                backgroundColor: 'var(--background)',
                boxShadow: '4px 4px 8px rgba(30, 32, 35, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Date Navigation */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ 
                    height: '32px', 
                    width: '32px', 
                    padding: 0,
                    backgroundColor: 'var(--background)',
                    border: 'none',
                    boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="card-neu-flat hover:card-neu [&]:shadow-none px-3"
                  style={{ 
                    height: '32px',
                    backgroundColor: 'var(--background)',
                    border: 'none',
                    boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ 
                    height: '32px', 
                    width: '32px', 
                    padding: 0,
                    backgroundColor: 'var(--background)',
                    border: 'none',
                    boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {/* View Mode Toggle */}
              <div 
                className="flex items-center gap-1 rounded-md card-neu-flat p-1 flex-shrink-0"
                style={{
                  backgroundColor: 'var(--background)',
                  height: '32px'
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('today')}
                  className={cn("h-7 px-2 min-w-[32px] [&]:shadow-none", viewMode === 'today' ? 'card-neu-pressed' : 'hover:card-neu')}
                  style={{ 
                    backgroundColor: viewMode === 'today' ? 'var(--background)' : 'transparent',
                    border: 'none',
                    boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                  }}
                >
                  <span className="text-xs">Today</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className={cn("h-7 px-2 min-w-[32px] [&]:shadow-none", viewMode === 'week' ? 'card-neu-pressed' : 'hover:card-neu')}
                  style={{ 
                    backgroundColor: viewMode === 'week' ? 'var(--background)' : 'transparent',
                    border: 'none',
                    boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)'
                  }}
                >
                  <span className="text-xs">Week</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className={cn("h-7 px-2 min-w-[32px]", viewMode === 'month' ? 'card-neu-pressed' : 'hover:card-neu')}
                  style={{ backgroundColor: viewMode === 'month' ? 'var(--background)' : 'transparent' }}
                >
                  <span className="text-xs">Month</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 px-6 pt-0 pb-6" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0%', minHeight: 0, backgroundColor: 'var(--background)' }}>
        {viewMode === 'today' ? (
          <div className="space-y-6">
            <div className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              {getTripsForDate(currentDate).length} trip(s) scheduled
            </div>
            {getTripsForDate(currentDate).length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                No trips scheduled for today
              </div>
            ) : (
              <div className="space-y-6">
                {getTripsForDate(currentDate)
                  .sort((a: Trip, b: Trip) => a.scheduled_pickup_time.localeCompare(b.scheduled_pickup_time))
                  .map((trip: Trip) => (
                    <TripHoverCard key={trip.id} trip={trip}>
                      <div 
                        className="border rounded-lg p-3 space-y-2 cursor-pointer hover:shadow-md transition-shadow border-l-4"
                        style={{ 
                          borderLeftColor: getTripColor(trip),
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)'
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                              <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                                {format(parseISO(trip.scheduled_pickup_time), 'h:mm a')}
                                {trip.scheduled_return_time && (
                                  <span style={{ color: 'var(--muted-foreground)' }}>
                                    {' - '}
                                    {format(parseISO(trip.scheduled_return_time), 'h:mm a')}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                                {getTripDisplayName(trip, getClientName)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                                {trip.driver ? 'Assigned' : 'Unassigned'}
                              </span>
                            </div>
                          </div>
                          <Badge 
                            style={{ 
                              backgroundColor: getTripColor(trip),
                              color: getContrastTextColor(getTripColor(trip))
                            }}
                          >
                            {colorMode === 'status' ? trip.status.replace('_', ' ') : 'Driver'}
                          </Badge>
                        </div>
                        <div className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
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
          <div className="flex flex-col h-full" style={{ backgroundColor: '#1e2023' }}>
            {/* Week header */}
            <div className="flex border-b" style={{ backgroundColor: '#1e2023', borderColor: 'var(--border)' }}>
              {/* Time column header - matches time column width */}
              <div className="w-12 sm:w-16 border-r" style={{ borderColor: 'var(--border)', backgroundColor: '#1e2023' }}></div>
              {/* Days header - matches the 7-column grid below */}
              <div className="flex-1 grid grid-cols-7 gap-px" style={{ backgroundColor: 'var(--border)' }}>
                {days.slice(0, 7).map(day => {
                  const isDayToday = isToday(day);
                  return (
                    <div 
                      key={day.toISOString()} 
                      className="p-2 text-center"
                      style={isDayToday ? {
                        backgroundColor: "#1e2023",
                        color: "var(--color-coral)",
                      } : {
                        borderColor: 'var(--border)',
                        backgroundColor: '#26282b',
                        color: 'var(--foreground)',
                      }}
                    >
                      <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                      <div className="text-lg font-semibold">{format(day, 'd')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Time grid */}
            <div className="flex flex-1 overflow-auto">
              {/* Time column */}
              <div className="w-12 sm:w-16 border-r" style={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--border)' }}>
                {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => (
                  <div 
                    key={hour} 
                    className="h-12 border-b flex items-start justify-end pr-1 sm:pr-2 pt-1"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Days grid */}
              <div className="flex-1 grid grid-cols-7 gap-px" style={{ backgroundColor: '#1e2023' }}>
                {days.slice(0, 7).map(day => {
                  const dayTrips = getTripsForDate(day);
                  const isDayToday = isToday(day);
                  
                  return (
                    <div 
                      key={day.toISOString()} 
                      className="relative"
                      style={{ backgroundColor: '#1e2023' }}
                    >
                      {/* Time slots */}
                      {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => (
                        <div
                          key={hour}
                          className="h-12 border-b"
                          style={{ 
                            borderColor: 'var(--border)',
                            backgroundColor: 'transparent',
                          }}
                        />
                      ))}
                      
                      {/* Trips positioned by time */}
                      {dayTrips
                        .sort((a: Trip, b: Trip) => a.scheduled_pickup_time.localeCompare(b.scheduled_pickup_time))
                        .map((trip: Trip) => {
                          const tripTime = parseISO(trip.scheduled_pickup_time);
                          const hour = tripTime.getHours();
                          const minute = tripTime.getMinutes();
                          const top = ((hour - 6) * 60 + minute) * (48 / 60); // 48px per hour (h-12 = 48px)
                          
                          return (
                            <TripHoverCard key={trip.id} trip={trip}>
                              <div
                                className="absolute left-1 right-1 rounded p-1 cursor-pointer hover:opacity-80 border text-xs truncate"
                                style={{
                                  top: `${top}px`,
                                  backgroundColor: getTripColor(trip),
                                  color: getContrastTextColor(getTripColor(trip)),
                                  borderColor: 'var(--border)',
                                  minHeight: '20px',
                                }}
                              >
                                <div className="font-medium truncate">
                                  {format(tripTime, 'h:mm a')} {getTripDisplayName(trip, getClientName)}
                                </div>
                              </div>
                            </TripHoverCard>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-background" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Calendar Grid - Matching bentobox structure */}
            <div className="flex-1 overflow-auto">
              {/* Week day headers - Matching bentobox */}
              <div className="grid grid-cols-7 border-b bg-muted/20 sticky top-0 z-10">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className="p-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar weeks - Matching bentobox */}
              <div className="flex flex-col">
                {weeks.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="grid grid-cols-7 border-b last:border-b-0 flex-1 min-h-[120px]"
                  >
                    {week.map((day, dayIndex) => {
                      const dayTrips = getTripsForDate(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isDayToday = isToday(day);
                      
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "border-r last:border-r-0 p-1 min-h-[120px]",
                            !isCurrentMonth && "bg-muted/10",
                            isDayToday && "bg-primary/5"
                          )}
                        >
                          {/* Day number - Matching bentobox */}
                          <div
                            className={cn(
                              "text-xs font-medium mb-1",
                              !isCurrentMonth && "text-muted-foreground"
                            )}
                            style={isDayToday ? {
                              color: '#ff8475',
                              fontWeight: 'bold',
                              textShadow: '0 0 8px rgba(255, 132, 117, 0.5), 0 0 12px rgba(255, 132, 117, 0.3)'
                            } : {}}
                          >
                            {format(day, 'd')}
                          </div>

                          {/* Trips for this day - Matching bentobox spacing */}
                          <div className="space-y-0.5">
                            {dayTrips.slice(0, 3).map((trip: Trip) => (
                              <TripHoverCard key={trip.id} trip={trip}>
                                <div
                                  className={cn(
                                    "text-xs px-1.5 py-0.5 rounded cursor-pointer",
                                    "hover:opacity-80 transition-opacity",
                                    !isCurrentMonth && "opacity-60",
                                    "flex items-center justify-between gap-1"
                                  )}
                                  style={{ 
                                    backgroundColor: getTripColor(trip),
                                    color: getContrastTextColor(getTripColor(trip))
                                  }}
                                >
                                  <div className="font-medium truncate flex-1 min-w-0">
                                    {format(parseISO(trip.scheduled_pickup_time), 'h:mm a')} {getTripDisplayName(trip, getClientName)}
                                  </div>
                                  {trip.trip_purpose && (
                                    <span 
                                      className="text-[10px] px-1 py-0.5 rounded flex-shrink-0"
                                      style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                        color: getContrastTextColor(getTripColor(trip))
                                      }}
                                    >
                                      {trip.trip_purpose}
                                    </span>
                                  )}
                                </div>
                              </TripHoverCard>
                            ))}
                            {dayTrips.length > 3 && (
                              <div className="text-xs text-muted-foreground px-1.5 py-0.5">
                                +{dayTrips.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
