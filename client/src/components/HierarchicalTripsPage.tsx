import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Calendar, 
  MapPin, 
  User, 
  Car, 
  Clock, 
  ChevronDown, 
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  List,
  Grid3x3
} from "lucide-react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useHierarchy } from "../hooks/useHierarchy";
import { useAuth } from "../hooks/useAuth";
import { format, parseISO, isToday, isTomorrow, isYesterday } from "date-fns";
import ExportButton from "./export/ExportButton";
import { useLocation } from "wouter";
import { PermissionGuard } from "./PermissionGuard";
import { usePageAccess } from "../hooks/use-page-access";
import { useFeatureFlag } from "../hooks/use-permissions";
import AdvancedFilters from "./filters/AdvancedFilters";
import { useBulkOperations } from "../hooks/useBulkOperations";
import { RollbackManager } from "../utils/rollback-manager";

interface Trip {
  id: string;
  program_id: string;
  pickup_location_id?: string;
  dropoff_location_id?: string;
  client_id: string;
  driver_id?: string;
  trip_type: 'one_way' | 'round_trip';
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
  actual_return_time?: string;
  passenger_count: number;
  special_requirements?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  program?: {
    id: string;
    name: string;
    corporate_client_id: string;
  };
  corporate_client?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  driver?: {
    id: string;
    user_id: string;
    license_number: string;
  };
  pickup_location?: {
    id: string;
    name: string;
    address: string;
  };
  dropoff_location?: {
    id: string;
    name: string;
    address: string;
  };
}

export default function HierarchicalTripsPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, getFilterParams } = useHierarchy();
  
  // Feature flag check - hide page header when unified header is enabled
  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [displayedTripsCount, setDisplayedTripsCount] = useState(20); // For infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Feature flags - call hooks unconditionally at top level
  const { isEnabled: exportEnabled } = useFeatureFlag("export_reports_enabled");
  const { isEnabled: newTripEnabled } = useFeatureFlag("enable_new_trip_creation");
  const { isEnabled: bulkOpsEnabled } = useFeatureFlag("bulk_operations_enabled");
  const { isEnabled: advancedFiltersEnabled } = useFeatureFlag("advanced_filters_enabled");
  const { isEnabled: compactViewEnabled } = useFeatureFlag("compact_trip_list_view");
  const { isEnabled: infiniteScrollEnabled } = useFeatureFlag("infinite_scroll_trips");

  // Bulk operations hook
  const bulkOps = useBulkOperations('trips');

  // Check page access permission - moved after other hooks to avoid hook order issues
  usePageAccess({ permission: "view_trips" });

  const filterParams = getFilterParams();

  // Build API endpoint based on hierarchy level and user role
  const getTripsEndpoint = () => {
    // For corporate_admin, always use corporate-client endpoint for tenant isolation
    if (user?.role === 'corporate_admin') {
      const corporateClientId = (user as any).corporate_client_id || selectedCorporateClient;
      if (corporateClientId) {
        return `/api/trips/corporate-client/${corporateClientId}`;
      }
      console.warn('⚠️ Corporate admin missing corporate_client_id, falling back to unfiltered endpoint');
    }
    
    if (level === 'corporate' && user?.role === 'super_admin') {
      return '/api/trips'; // Use regular trips endpoint for super_admin
    } else if (level === 'client' && selectedCorporateClient) {
      return `/api/trips/corporate-client/${selectedCorporateClient}`;
    } else if (level === 'program' && selectedProgram) {
      return `/api/trips/program/${selectedProgram}`;
    }
    
    // Fallback - should only happen for super_admin
    console.warn('⚠️ Falling back to unfiltered trips endpoint. User:', user?.role, 'Level:', level);
    return '/api/trips';
  };

  // Fetch trips based on current hierarchy level
  const { data: tripsData, isLoading, error } = useQuery({
    queryKey: ['trips', level, selectedCorporateClient, selectedProgram, user?.role],
    queryFn: async () => {
      const endpoint = getTripsEndpoint();
      console.log('🔍 Fetching trips from:', endpoint, 'for level:', level, 'user role:', user?.role);
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      console.log('🔍 Trips received:', Array.isArray(data) ? data.length : 'not array', data);
      return data;
    },
    enabled: true,
  });

  const trips: Trip[] = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];

  // Filter trips based on search and status
  const allFilteredTrips = trips.filter(trip => {
    const matchesSearch = searchTerm === "" || 
      trip.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.dropoff_address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;

    const matchesDate = (() => {
      if (dateFilter === "all") return true;
      const tripDate = parseISO(trip.scheduled_pickup_time);
      if (dateFilter === "today") return isToday(tripDate);
      if (dateFilter === "tomorrow") return isTomorrow(tripDate);
      if (dateFilter === "yesterday") return isYesterday(tripDate);
      return true;
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  // For infinite scroll: limit displayed trips, otherwise show all
  const filteredTrips = infiniteScrollEnabled 
    ? allFilteredTrips.slice(0, displayedTripsCount)
    : allFilteredTrips;

  // Reset displayed count when filters change
  useEffect(() => {
    if (infiniteScrollEnabled) {
      setDisplayedTripsCount(20);
    }
  }, [searchTerm, statusFilter, dateFilter, infiniteScrollEnabled]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!infiniteScrollEnabled) return;
    
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedTripsCount < allFilteredTrips.length) {
          setDisplayedTripsCount((prev) => Math.min(prev + 20, allFilteredTrips.length));
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [infiniteScrollEnabled, displayedTripsCount, allFilteredTrips.length]);

  const getStatusColor = (status: string) => {
    // Use HALCYON status colors with opacity backgrounds
    switch (status) {
      case 'scheduled': 
        return { 
          backgroundColor: 'hsla(45, 100%, 51%, 0.15)', 
          color: 'hsl(45, 100%, 30%)',
          borderColor: 'hsl(45, 100%, 51%)'
        };
      case 'confirmed': 
        return { 
          backgroundColor: 'rgba(204, 51, 171, 0.15)', 
          color: 'var(--primary)',
          borderColor: 'var(--primary)'
        };
      case 'in_progress': 
        return { 
          backgroundColor: 'hsla(36, 100%, 50%, 0.15)', 
          color: 'hsl(36, 100%, 30%)',
          borderColor: 'hsl(36, 100%, 50%)'
        };
      case 'completed': 
        return { 
          backgroundColor: 'hsla(122, 39%, 49%, 0.15)', 
          color: 'hsl(122, 39%, 25%)',
          borderColor: 'hsl(122, 39%, 49%)'
        };
      case 'cancelled': 
        return { 
          backgroundColor: 'hsla(0, 84%, 60%, 0.15)', 
          color: 'hsl(0, 84%, 35%)',
          borderColor: 'hsl(0, 84%, 60%)'
        };
      case 'no_show': 
        return { 
          backgroundColor: 'hsla(36, 100%, 50%, 0.15)', 
          color: 'hsl(36, 100%, 30%)',
          borderColor: 'hsl(36, 100%, 50%)'
        };
      default: 
        return { 
          backgroundColor: 'var(--muted)', 
          color: 'var(--muted-foreground)',
          borderColor: 'var(--border)'
        };
    }
  };

  const getPageTitle = () => {
    if (level === 'corporate') {
      return 'All Corporate Trips';
    } else if (level === 'client') {
      return `Trips - ${selectedCorporateClient}`;
    } else {
      return `Trips - ${selectedProgram}`;
    }
  };

  const getTripCount = () => {
    if (level === 'corporate') {
      return `${trips.length} total trips across all corporate clients`;
    } else if (level === 'client') {
      return `${trips.length} trips for this corporate client`;
    } else {
      return `${trips.length} trips for this program`;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
            <p style={{ color: 'var(--muted-foreground)' }}>Loading trips...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center" style={{ color: 'var(--destructive)' }}>
              <p className="text-lg font-semibold mb-2">Error loading trips</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - Only show if unified header is disabled (fallback) */}
      {!ENABLE_UNIFIED_HEADER && (
        <div>
          <div className="px-6 py-6 rounded-lg border backdrop-blur-md shadow-xl flex items-center justify-between" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', height: '150px' }}>
            <div>
              <h1 
                className="font-bold text-foreground" 
                style={{ 
                  fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                  fontSize: '110px'
                }}
              >
                trips.
              </h1>
            </div>
            <div className="flex items-center gap-3">
          {/* View Toggle (only shown if compact view feature flag is enabled) */}
          {compactViewEnabled && (
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('detailed')}
                className="h-8 px-2"
                title="Detailed View"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('compact')}
                className="h-8 px-2"
                title="Compact View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
          {exportEnabled && (
            <ExportButton
              data={filteredTrips}
              columns={[
                { key: 'id', label: 'Trip ID' },
                { key: 'client_name', label: 'Client Name', formatter: (trip) => `${trip.client?.first_name || ''} ${trip.client?.last_name || ''}`.trim() },
                { key: 'pickup_address', label: 'Pickup Address' },
                { key: 'dropoff_address', label: 'Dropoff Address' },
                { key: 'scheduled_pickup_time', label: 'Scheduled Pickup', formatter: (trip) => trip.scheduled_pickup_time ? format(parseISO(trip.scheduled_pickup_time), 'MMM dd, yyyy HH:mm') : '' },
                { key: 'actual_pickup_time', label: 'Actual Pickup', formatter: (trip) => trip.actual_pickup_time ? format(parseISO(trip.actual_pickup_time), 'MMM dd, yyyy HH:mm') : '' },
                { key: 'status', label: 'Status' },
                { key: 'driver_name', label: 'Driver', formatter: (trip) => trip.driver?.license_number || 'Unassigned' },
                { key: 'program_name', label: 'Program', formatter: (trip) => trip.program?.name || 'Unknown' },
                { key: 'corporate_client_name', label: 'Corporate Client', formatter: (trip) => trip.corporate_client?.name || 'N/A' },
                { key: 'created_at', label: 'Created', formatter: (trip) => trip.created_at ? format(parseISO(trip.created_at), 'MMM dd, yyyy') : '' }
              ]}
              filename={`trips-${level}-${format(new Date(), 'yyyy-MM-dd')}`}
              onExportStart={() => console.log('Starting trip export...')}
              onExportComplete={() => console.log('Trip export completed!')}
              onExportError={(error) => console.error('Trip export failed:', error)}
            />
          )}
          {newTripEnabled && (
            <PermissionGuard permission="create_trips">
              <Button 
                className="flex items-center gap-2"
                onClick={() => {
                  // Store current path before navigating to trip creation
                  const currentPath = window.location.pathname;
                  if (currentPath && 
                      currentPath !== '/trips/new' && 
                      currentPath !== '/' &&
                      !currentPath.includes('/corporate-client/') &&
                      !currentPath.includes('/program/')) {
                    sessionStorage.setItem('previousPath', currentPath);
                  }
                  setLocation("/trips/new");
                }}
              >
                <Plus className="h-4 w-4" />
                New Trip
              </Button>
            </PermissionGuard>
          )}
          </div>
        </div>
        </div>
      )}

      {/* Bulk Operations Bar */}
      {bulkOpsEnabled && bulkOps.selectedItems.length > 0 && (
        <Card 
          className="border"
          style={{
            backgroundColor: 'var(--color-charcoal)',
            borderColor: 'var(--primary)'
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {bulkOps.selectedItems.length} trip{bulkOps.selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkOps.executeBulkAction('update_status', bulkOps.selectedItems)}
                  disabled={bulkOps.isLoading}
                >
                  Update Status
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkOps.clearSelection()}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          {advancedFiltersEnabled ? (
            <AdvancedFilters
              filters={[
                { key: 'status', label: 'Status', type: 'select', options: [
                  { value: 'all', label: 'All Status' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'no_show', label: 'No Show' }
                ]},
                { key: 'date', label: 'Date', type: 'select', options: [
                  { value: 'all', label: 'All Dates' },
                  { value: 'today', label: 'Today' },
                  { value: 'tomorrow', label: 'Tomorrow' },
                  { value: 'yesterday', label: 'Yesterday' }
                ]}
              ]}
              sortOptions={[
                { key: 'time', label: 'Time', direction: 'asc' },
                { key: 'status', label: 'Status', direction: 'asc' },
                { key: 'client', label: 'Client', direction: 'asc' }
              ]}
              onFiltersChange={(filters) => {
                setStatusFilter(filters.status || 'all');
                setDateFilter(filters.date || 'all');
              }}
              onSortChange={(sort) => {
                // Handle sort change if needed
              }}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search trips..."
            />
          ) : (
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filter by trip status"
                aria-label="Filter by trip status"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filter by date range"
                aria-label="Filter by date range"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="yesterday">Yesterday</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No trips found</h3>
            <p style={{ color: 'var(--muted-foreground)' }}>
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" 
                ? "No trips match your current filters." 
                : "No trips have been scheduled yet."}
            </p>
          </CardContent>
        </Card>
      ) : compactViewEnabled && viewMode === 'compact' ? (
        /* Compact View */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="flex items-center gap-4 p-3 transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {bulkOpsEnabled && (
                    <input
                      type="checkbox"
                      checked={bulkOps.selectedItems.includes(trip.id)}
                      onChange={() => bulkOps.toggleItem(trip.id)}
                      className="h-4 w-4"
                    />
                  )}
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                    {/* Status Badge */}
                    <div className="col-span-1">
                      <Badge style={getStatusColor(trip.status)}>
                        {trip.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    {/* Client Name */}
                    <div className="col-span-12 md:col-span-2 font-medium truncate">
                      {trip.client?.first_name} {trip.client?.last_name}
                    </div>
                    {/* Pickup Address */}
                    <div className="col-span-12 md:col-span-3 text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {trip.pickup_address}
                    </div>
                    {/* Dropoff Address */}
                    <div className="col-span-12 md:col-span-3 text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {trip.dropoff_address}
                    </div>
                    {/* Time */}
                    <div className="col-span-12 md:col-span-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      <Clock className="h-3 w-3 inline mr-1" />
                      {format(parseISO(trip.scheduled_pickup_time), 'MMM d, h:mm a')}
                    </div>
                    {/* Actions */}
                    <div className="col-span-12 md:col-span-1 flex items-center gap-1 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setLocation(`/trips/edit/${trip.id}`)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          {/* Infinite scroll trigger for compact view */}
          {infiniteScrollEnabled && displayedTripsCount < allFilteredTrips.length && (
            <div ref={loadMoreRef} className="flex justify-center py-4 border-t">
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading more trips...</div>
            </div>
          )}
        </Card>
      ) : (
        /* Detailed View (default) */
        <>
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {bulkOpsEnabled && (
                    <input
                      type="checkbox"
                      checked={bulkOps.selectedItems.includes(trip.id)}
                      onChange={() => bulkOps.toggleItem(trip.id)}
                      className="mr-4 mt-1 h-4 w-4"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge style={getStatusColor(trip.status)}>
                        {trip.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {trip.trip_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {trip.passenger_count > 1 && (
                        <Badge variant="outline">
                          {trip.passenger_count} passengers
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {trip.client?.first_name} {trip.client?.last_name}
                        </h3>
                        <div className="space-y-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span><strong>From:</strong> {trip.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span><strong>To:</strong> {trip.dropoff_address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span><strong>Pickup:</strong> {format(parseISO(trip.scheduled_pickup_time), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                          {trip.scheduled_return_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span><strong>Return:</strong> {format(parseISO(trip.scheduled_return_time), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        <div className="mb-2">
                          <strong>Program:</strong> {trip.program?.name || 'Unknown'}
                        </div>
                        {trip.corporate_client && (
                          <div className="mb-2">
                            <strong>Corporate Client:</strong> {trip.corporate_client.name}
                          </div>
                        )}
                        {trip.driver && (
                          <div className="mb-2">
                            <strong>Driver:</strong> {trip.driver.license_number}
                          </div>
                        )}
                        {trip.special_requirements && (
                          <div className="mb-2">
                            <strong>Special Requirements:</strong> {trip.special_requirements}
                          </div>
                        )}
                        {trip.notes && (
                          <div>
                            <strong>Notes:</strong> {trip.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation(`/trips/edit/${trip.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      style={{ 
                        color: 'var(--destructive)',
                        backgroundColor: 'unset',
                        background: 'unset',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--destructive)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--destructive)'}
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this trip?')) {
                          // TODO: Implement trip deletion
                          console.log('Delete trip:', trip.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Infinite scroll trigger */}
        {infiniteScrollEnabled && displayedTripsCount < allFilteredTrips.length && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            <div className="text-sm text-gray-500">Loading more trips...</div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
