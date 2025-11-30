import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Calendar, 
  Filter, 
  Plus, 
  Download, 
  Settings,
  Grid3X3,
  List,
  Map,
  Clock,
  MapPin,
  User,
  Car,
  Search,
  MoreHorizontal
} from "lucide-react";
import { Link } from "wouter";
import EnhancedTripCalendar from "../components/EnhancedTripCalendar";
import { useHierarchy } from "../hooks/useHierarchy";
import { useDashboardData } from "../hooks/useDashboardData";
import { Input } from "../components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export default function CalendarPage() {
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'map'>('calendar');
  
  // Real-time data
  const {
    trips: realTimeTrips,
    drivers: realTimeDrivers
  } = useDashboardData({
    enableRealTime: true,
    refreshInterval: 5000
  });

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'status' | 'client' | 'driver'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Map view state
  const [mapView, setMapView] = useState<'trips' | 'drivers' | 'all'>('trips');
  const [selectedMapTrip, setSelectedMapTrip] = useState<any>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    defaultView: 'calendar' as 'calendar' | 'list' | 'map',
    autoRefresh: true,
    refreshInterval: 5000,
    showCompletedTrips: true,
    showCancelledTrips: false,
    defaultSort: 'time' as 'time' | 'status' | 'client' | 'driver',
    defaultSortOrder: 'asc' as 'asc' | 'desc'
  });

  const getPageTitle = () => {
    if (level === 'corporate') {
      return "Universal View";
    } else if (level === 'program' && selectedProgram) {
      return selectedProgram;
    } else if (level === 'client' && selectedCorporateClient) {
      return selectedCorporateClient;
    }
    return "Trips";
  };


  // Filter and sort trips
  const filteredAndSortedTrips = React.useMemo(() => {
    let filtered = realTimeTrips.filter((trip: any) => {
      const matchesSearch = searchTerm === '' || 
        trip.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.dropoff_address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
      const matchesDriver = driverFilter === 'all' || trip.driver_id === driverFilter;
      
      return matchesSearch && matchesStatus && matchesDriver;
    });

    // Sort trips
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'time':
          aValue = new Date(a.scheduled_pickup_time).getTime();
          bValue = new Date(b.scheduled_pickup_time).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'client':
          aValue = a.client?.name || '';
          bValue = b.client?.name || '';
          break;
        case 'driver':
          aValue = a.driver?.user?.first_name + ' ' + a.driver?.user?.last_name || '';
          bValue = b.driver?.user?.first_name + ' ' + b.driver?.user?.last_name || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [realTimeTrips, searchTerm, statusFilter, driverFilter, sortBy, sortOrder]);

  // Calculate real-time stats
  const stats = React.useMemo(() => {
    const today = new Date();
    const todayTrips = realTimeTrips.filter((trip: any) => {
      const tripDate = new Date(trip.scheduled_pickup_time);
      return tripDate.toDateString() === today.toDateString();
    });

    return {
      todayTrips: todayTrips.length,
      completed: realTimeTrips.filter((trip: any) => trip.status === 'completed').length,
      inProgress: realTimeTrips.filter((trip: any) => trip.status === 'in_progress').length,
      scheduled: realTimeTrips.filter((trip: any) => trip.status === 'scheduled').length,
      total: realTimeTrips.length
    };
  }, [realTimeTrips]);

  // Get unique drivers for filter
  const uniqueDrivers = React.useMemo(() => {
    return Array.from(new Set(
      realTimeTrips.map((trip: any) => trip.driver_id).filter(Boolean)
    ));
  }, [realTimeTrips]);

  // Map data processing
  const mapData = React.useMemo(() => {
    const trips = filteredAndSortedTrips.map((trip: any) => ({
      id: trip.id,
      status: trip.status,
      client: trip.client?.name || 'Unknown Client',
      pickup: {
        address: trip.pickup_address
      },
      dropoff: {
        address: trip.dropoff_address
      },
      driver: trip.driver?.user?.first_name + ' ' + trip.driver?.user?.last_name || 'Unassigned',
      scheduledTime: new Date(trip.scheduled_pickup_time),
      duration: trip.estimated_duration || 'N/A'
    }));

    const drivers = realTimeDrivers.map((driver: any) => ({
      id: driver.id,
      name: driver.user?.first_name + ' ' + driver.user?.last_name || 'Unknown Driver',
      vehicle: driver.vehicle_type || 'Standard'
    }));

    return { trips, drivers };
  }, [filteredAndSortedTrips, realTimeDrivers]);


  // Export functionality
  const handleExport = () => {
    const exportData = filteredAndSortedTrips.map((trip: any) => ({
      'Trip ID': trip.id,
      'Client': trip.client?.name || 'Unknown',
      'Pickup Address': trip.pickup_address,
      'Dropoff Address': trip.dropoff_address,
      'Scheduled Time': new Date(trip.scheduled_pickup_time).toLocaleString(),
      'Status': trip.status.replace('_', ' '),
      'Driver': trip.driver?.user?.first_name + ' ' + trip.driver?.user?.last_name || 'Unassigned',
      'Duration (min)': trip.estimated_duration || 'N/A',
      'Passengers': trip.passenger_count || 1,
      'Vehicle Type': trip.vehicle_type || 'Standard',
      'Program': selectedProgram || 'N/A',
      'Corporate Client': selectedCorporateClient || 'N/A'
    }));

    // Convert to CSV
    const csvContent = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map((row: any) => Object.values(row).map((value: any) => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trips-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-x"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="rounded-l-none"
            >
              <Map className="h-4 w-4 mr-1" />
              Map
            </Button>
          </div>

          {/* Action Buttons */}
          <Button asChild>
            <Link 
              to="/trips/new"
              onClick={() => {
                // Store current path before navigating to trip creation (preserve hierarchical URLs)
                const currentPath = window.location.pathname;
                sessionStorage.setItem('previousPath', currentPath);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Trip
            </Link>
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => handleExport()}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search trips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Driver
                </label>
                <Select value={driverFilter} onValueChange={setDriverFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drivers</SelectItem>
                    {uniqueDrivers.map((driverId: any, index: number) => {
                      const driver = realTimeDrivers.find((d: any) => d.id === driverId);
                      return (
                        <SelectItem key={driverId} value={driverId}>
                          {driver ? `${driver.user?.first_name} ${driver.user?.last_name}` : `Driver ${driverId}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDriverFilter('all');
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-end">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {level === 'corporate' ? 'Universal View' : 
                 level === 'program' ? 'Program View' : 
                 level === 'client' ? 'Corporate View' : 'Default View'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'calendar' && (
            <div className="space-y-4">
              <EnhancedTripCalendar />
            </div>
          )}
          
          {viewMode === 'list' && (
            <div className="space-y-4">
              {/* List View Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Sort by:</label>
                    <Select value={sortBy} onValueChange={(value: 'time' | 'status' | 'client' | 'driver') => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Order:</label>
                    <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Asc</SelectItem>
                        <SelectItem value="desc">Desc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  {filteredAndSortedTrips.length} trips found
                </div>
              </div>

              {/* Trip List */}
              {filteredAndSortedTrips.length === 0 ? (
                <div className="text-center py-12">
                  <List className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No trips found</h3>
                  <p className="text-sm text-gray-500">
                    {searchTerm || statusFilter !== 'all' || driverFilter !== 'all' 
                      ? 'Try adjusting your filters to see more trips.'
                      : 'No trips are available.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedTrips.map((trip: any) => (
                    <div
                      key={trip.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge 
                              variant={
                                trip.status === 'completed' ? 'default' :
                                trip.status === 'in_progress' ? 'secondary' :
                                trip.status === 'cancelled' ? 'destructive' : 'outline'
                              }
                            >
                              {trip.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(trip.scheduled_pickup_time).toLocaleString()}
                            </span>
                          </div>
                          
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {trip.client?.name || 'Unknown Client'}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Pickup:</span>
                              <span>{trip.pickup_address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-red-600" />
                              <span className="font-medium">Dropoff:</span>
                              <span>{trip.dropoff_address}</span>
                            </div>
                            {trip.driver && (
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Driver:</span>
                                <span>{trip.driver.user?.first_name} {trip.driver.user?.last_name}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">Vehicle:</span>
                              <span>{trip.vehicle_type || 'Standard'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {trip.estimated_duration || 'N/A'} min
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {trip.passenger_count || 1} passenger{trip.passenger_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Trip</DropdownMenuItem>
                              <DropdownMenuItem>Assign Driver</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Cancel Trip</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {viewMode === 'map' && (
            <div className="space-y-4">
              {/* Map View Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">View:</label>
                    <Select value={mapView} onValueChange={(value: 'trips' | 'drivers' | 'all') => setMapView(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trips">Trips</SelectItem>
                        <SelectItem value="drivers">Drivers</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Center on Denver functionality would go here */}}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Center on Denver
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  {mapView === 'trips' && `${mapData.trips.length} trips`}
                  {mapView === 'drivers' && `${mapData.drivers.length} drivers`}
                  {mapView === 'all' && `${mapData.trips.length} trips, ${mapData.drivers.length} drivers`}
                </div>
              </div>

              {/* Interactive Map */}
              <div className="relative">
                <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Map Placeholder - In real implementation, this would be a Leaflet map */}
                  <div className="h-full flex items-center justify-center relative">
                    <div className="text-center">
                      <Map className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Interactive Map</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Map view showing {mapView === 'trips' ? 'trip locations' : 
                                        mapView === 'drivers' ? 'driver locations' : 
                                        'trip and driver locations'}
                      </p>
                      
                      {/* Mock Map Markers */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
                        {mapView === 'trips' || mapView === 'all' ? (
                          mapData.trips.slice(0, 8).map((trip: any) => (
                            <div
                              key={trip.id}
                              className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedMapTrip(trip)}
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <div 
                                  className={`w-3 h-3 rounded-full ${
                                    trip.status === 'completed' ? 'bg-green-500' :
                                    trip.status === 'in_progress' ? 'bg-yellow-500' :
                                    trip.status === 'cancelled' ? 'bg-red-500' :
                                    trip.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-500'
                                  }`}
                                ></div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  {trip.status}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {trip.client}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {trip.pickup.address}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {trip.scheduledTime.toLocaleTimeString()}
                              </p>
                            </div>
                          ))
                        ) : null}
                        
                        {mapView === 'drivers' || mapView === 'all' ? (
                          mapData.drivers.slice(0, 8).map((driver: any) => (
                            <div
                              key={driver.id}
                              className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  Available
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {driver.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {driver.vehicle}
                              </p>
                            </div>
                          ))
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Legend */}
                <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Legend</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Scheduled</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">In Progress</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Cancelled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Trip Details */}
              {selectedMapTrip && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Trip Details</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMapTrip(null)}
                      >
                        ×
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {selectedMapTrip.client}
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span>{selectedMapTrip.pickup.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <span>{selectedMapTrip.dropoff.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span>{selectedMapTrip.scheduledTime.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-purple-600" />
                            <span>{selectedMapTrip.driver}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            selectedMapTrip.status === 'completed' ? 'default' :
                            selectedMapTrip.status === 'in_progress' ? 'secondary' :
                            selectedMapTrip.status === 'cancelled' ? 'destructive' : 'outline'
                          }
                        >
                          {selectedMapTrip.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Duration: {selectedMapTrip.duration} min
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Trips</p>
                <p className="text-2xl font-bold">{stats.todayTrips}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">→</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
              </div>
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⏰</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Dialog */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default View */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Default View
                </label>
                <Select 
                  value={settings.defaultView} 
                  onValueChange={(value: 'calendar' | 'list' | 'map') => 
                    setSettings(prev => ({ ...prev, defaultView: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calendar">Calendar</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="map">Map</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              {/* Auto Refresh */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto Refresh
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically refresh data
                  </p>
                </div>
                <Button
                  variant={settings.autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
                >
                  {settings.autoRefresh ? "On" : "Off"}
                </Button>
              </div>

              {/* Refresh Interval */}
              {settings.autoRefresh && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Refresh Interval (seconds)
                  </label>
                  <Select 
                    value={settings.refreshInterval.toString()} 
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, refreshInterval: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5000">5 seconds</SelectItem>
                      <SelectItem value="10000">10 seconds</SelectItem>
                      <SelectItem value="30000">30 seconds</SelectItem>
                      <SelectItem value="60000">1 minute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Trip Display Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trip Display Options
                </h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Completed Trips
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Display completed trips in the calendar
                    </p>
                  </div>
                  <Button
                    variant={settings.showCompletedTrips ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, showCompletedTrips: !prev.showCompletedTrips }))}
                  >
                    {settings.showCompletedTrips ? "Show" : "Hide"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Cancelled Trips
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Display cancelled trips in the calendar
                    </p>
                  </div>
                  <Button
                    variant={settings.showCancelledTrips ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, showCancelledTrips: !prev.showCancelledTrips }))}
                  >
                    {settings.showCancelledTrips ? "Show" : "Hide"}
                  </Button>
                </div>
              </div>

              {/* Default Sort */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Default Sort By
                  </label>
                  <Select 
                    value={settings.defaultSort} 
                    onValueChange={(value: 'time' | 'status' | 'client' | 'driver') => 
                      setSettings(prev => ({ ...prev, defaultSort: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Sort Order
                  </label>
                  <Select 
                    value={settings.defaultSortOrder} 
                    onValueChange={(value: 'asc' | 'desc') => 
                      setSettings(prev => ({ ...prev, defaultSortOrder: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Apply settings
                    setViewMode(settings.defaultView);
                    setSortBy(settings.defaultSort);
                    setSortOrder(settings.defaultSortOrder);
                    setShowSettings(false);
                  }}
                >
                  Apply Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}