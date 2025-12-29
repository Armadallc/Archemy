import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ChevronRight,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  List,
  Grid3x3,
  Users,
  Repeat,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsDownUp,
  ChevronsUpDown
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
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
import { HeaderScopeSelector } from "./HeaderScopeSelector";

interface Trip {
  id: string;
  reference_id?: string; // Human-readable trip reference ID
  program_id: string;
  pickup_location_id?: string;
  dropoff_location_id?: string;
  client_id?: string;
  client_group_id?: string;
  driver_id?: string;
  trip_type: 'one_way' | 'round_trip';
  pickup_address: string;
  dropoff_address: string;
  stops?: string[]; // Array of intermediate stops
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
  actual_return_time?: string;
  passenger_count: number;
  special_requirements?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  trip_purpose?: string;
  trip_code?: string;
  appointment_time?: string;
  trip_category_id?: string;
  recurring_trip_id?: string;
  recurring_pattern?: any;
  is_group_trip?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
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
    scid?: string; // Secure Client Identifier
    first_name: string;
    last_name: string;
    phone?: string;
  };
  client_group?: {
    id: string;
    reference_id?: string; // Human-readable reference ID (e.g., MC-G0001)
    name: string;
  };
  driver?: {
    id: string;
    user_id: string;
    license_number: string;
    users?: {
      user_name: string;
      first_name?: string;
      last_name?: string;
    };
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
  trip_category?: {
    id: string;
    name: string;
  };
  created_by_user?: {
    user_id: string;
    user_name: string;
  };
  updated_by_user?: {
    user_id: string;
    user_name: string;
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
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set()); // Track expanded trips
  const [sortColumn, setSortColumn] = useState<string | null>(null); // Column to sort by
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sort direction
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
      console.log('🔍 Trips received:', Array.isArray(data) ? data.length : 'not array');
      // Debug: Check first trip's client data
      if (Array.isArray(data) && data.length > 0) {
        const firstTrip = data[0];
        console.log('🔍 First trip client data:', {
          trip_id: firstTrip.id,
          hasClient: !!firstTrip.client,
          client: firstTrip.client,
          client_id: firstTrip.client_id,
          is_group_trip: firstTrip.is_group_trip,
          client_group_id: firstTrip.client_group_id,
          hasClientGroup: !!firstTrip.client_group,
          client_group: firstTrip.client_group,
          // Check all keys to see what's available
          tripKeys: Object.keys(firstTrip),
          // Check if client is an array (Supabase sometimes returns arrays)
          clientIsArray: Array.isArray(firstTrip.client),
          clientGroupIsArray: Array.isArray(firstTrip.client_group)
        });
        
        // Check a few more trips to see patterns
        if (data.length > 1) {
          const secondTrip = data[1];
          console.log('🔍 Second trip client data:', {
            trip_id: secondTrip.id,
            hasClient: !!secondTrip.client,
            client_id: secondTrip.client_id,
            is_group_trip: secondTrip.is_group_trip,
            hasClientGroup: !!secondTrip.client_group,
            client_group_id: secondTrip.client_group_id
          });
        }
        
        // Check for group trips specifically
        const groupTrips = data.filter(t => t.is_group_trip || t.client_group_id);
        console.log('🔍 Group trips found:', groupTrips.length, groupTrips.map(t => ({
          id: t.id,
          hasClientGroup: !!t.client_group,
          client_group_id: t.client_group_id
        })));
        
        // Check for individual client trips
        const clientTrips = data.filter(t => !t.is_group_trip && t.client_id && !t.client_group_id);
        console.log('🔍 Individual client trips found:', clientTrips.length, clientTrips.map(t => ({
          id: t.id,
          hasClient: !!t.client,
          client_id: t.client_id
        })));
      }
      return data;
    },
    enabled: true,
  });

  const trips: Trip[] = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];

  // Debug: Log all trips data to console for troubleshooting
  useEffect(() => {
    if (trips.length > 0) {
      console.log('🔍 ALL TRIPS DATA:', trips.map(t => ({
        id: t.id,
        reference_id: t.reference_id,
        client_id: t.client_id,
        client_group_id: t.client_group_id,
        is_group_trip: t.is_group_trip,
        client: t.client,
        client_group: t.client_group,
        hasClient: !!t.client,
        hasClientGroup: !!t.client_group,
        clientIsArray: Array.isArray(t.client),
        clientGroupIsArray: Array.isArray(t.client_group)
      })));
    }
  }, [trips]);

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

  // Sort trips based on selected column and direction
  const sortedTrips = useMemo(() => {
    if (!sortColumn) return allFilteredTrips;

    const sorted = [...allFilteredTrips].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'trip_id':
          aValue = a.reference_id || a.id || '';
          bValue = b.reference_id || b.id || '';
          break;
        case 'reference_id':
          if (a.is_group_trip || a.client_group_id) {
            aValue = a.client_group?.reference_id || '';
          } else {
            aValue = a.client?.scid || '';
          }
          if (b.is_group_trip || b.client_group_id) {
            bValue = b.client_group?.reference_id || '';
          } else {
            bValue = b.client?.scid || '';
          }
          break;
        case 'client':
          if (a.is_group_trip || a.client_group_id) {
            aValue = a.client_group?.name || '';
          } else {
            aValue = `${a.client?.first_name || ''} ${a.client?.last_name || ''}`.trim();
          }
          if (b.is_group_trip || b.client_group_id) {
            bValue = b.client_group?.name || '';
          } else {
            bValue = `${b.client?.first_name || ''} ${b.client?.last_name || ''}`.trim();
          }
          break;
        case 'date':
          aValue = a.scheduled_pickup_time ? parseISO(a.scheduled_pickup_time).getTime() : 0;
          bValue = b.scheduled_pickup_time ? parseISO(b.scheduled_pickup_time).getTime() : 0;
          break;
        case 'pu':
          // Use actual_pickup_time if available, otherwise scheduled_pickup_time
          const aPuTime = a.actual_pickup_time || a.scheduled_pickup_time;
          const bPuTime = b.actual_pickup_time || b.scheduled_pickup_time;
          aValue = aPuTime ? parseISO(aPuTime).getTime() : 0;
          bValue = bPuTime ? parseISO(bPuTime).getTime() : 0;
          break;
        case 'do':
          // Use actual_dropoff_time if available, otherwise scheduled_return_time
          const aDoTime = a.actual_dropoff_time || a.scheduled_return_time;
          const bDoTime = b.actual_dropoff_time || b.scheduled_return_time;
          aValue = aDoTime ? parseISO(aDoTime).getTime() : 0;
          bValue = bDoTime ? parseISO(bDoTime).getTime() : 0;
          break;
        case 'appt_time':
          aValue = a.appointment_time ? parseISO(a.appointment_time).getTime() : 0;
          bValue = b.appointment_time ? parseISO(b.appointment_time).getTime() : 0;
          break;
        case 'origin':
          aValue = a.pickup_address || '';
          bValue = b.pickup_address || '';
          break;
        case 'destination':
          aValue = a.dropoff_address || '';
          bValue = b.dropoff_address || '';
          break;
        case 'pax':
          aValue = a.passenger_count || 0;
          bValue = b.passenger_count || 0;
          break;
        default:
          return 0;
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [allFilteredTrips, sortColumn, sortDirection]);

  // For infinite scroll: limit displayed trips, otherwise show all
  const filteredTrips = infiniteScrollEnabled 
    ? sortedTrips.slice(0, displayedTripsCount)
    : sortedTrips;

  // Expand/Collapse all functions
  const expandAllTrips = () => {
    const allTripIds = new Set(filteredTrips.map(trip => trip.id));
    setExpandedTrips(allTripIds);
  };

  const collapseAllTrips = () => {
    setExpandedTrips(new Set());
  };

  // Check if all trips are expanded or collapsed
  const areAllExpanded = filteredTrips.length > 0 && expandedTrips.size === filteredTrips.length;
  const areAllCollapsed = expandedTrips.size === 0;

  // Reset displayed count when filters or sort change
  useEffect(() => {
    if (infiniteScrollEnabled) {
      setDisplayedTripsCount(20);
    }
  }, [searchTerm, statusFilter, dateFilter, sortColumn, sortDirection, infiniteScrollEnabled]);

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort icon for column header
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

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

  const formatRecurringPattern = (pattern: any): string => {
    if (!pattern || typeof pattern !== 'object') {
      return 'N/A';
    }

    const frequency = pattern.frequency || '';
    const daysOfWeek = pattern.days_of_week || [];

    // Capitalize first letter of frequency and handle multi-word frequencies
    const formattedFrequency = frequency
      .replace('_', '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');

    // Format days of week
    if (daysOfWeek.length === 0) {
      return formattedFrequency;
    }

    if (daysOfWeek.length === 1) {
      return `${formattedFrequency} on ${daysOfWeek[0]}`;
    }

    // Multiple days: "Monday, Tuesday, and Wednesday"
    if (daysOfWeek.length === 2) {
      return `${formattedFrequency} on ${daysOfWeek[0]} and ${daysOfWeek[1]}`;
    }

    // More than 2 days: "Monday, Tuesday, and Wednesday"
    const lastDay = daysOfWeek[daysOfWeek.length - 1];
    const otherDays = daysOfWeek.slice(0, -1).join(', ');
    return `${formattedFrequency} on ${otherDays}, and ${lastDay}`;
  };

  const getStatusColor = (status: string) => {
    // Use status color variables that adapt to light/dark mode
    // Text color uses foreground which adapts to theme
    switch (status) {
      case 'scheduled': 
        return { 
          backgroundColor: 'var(--scheduled-bg)',
          color: 'var(--foreground)', // Theme-aware text color
          borderColor: 'var(--scheduled)',
          border: '1px solid var(--scheduled)'
        };
      case 'confirmed': 
        return { 
          backgroundColor: 'var(--status-info-bg)',
          color: 'var(--foreground)', // Theme-aware text color
          borderColor: 'var(--status-info)',
          border: '1px solid var(--status-info)'
        };
      case 'in_progress': 
        return { 
          backgroundColor: 'var(--in-progress-bg)',
          color: 'var(--foreground)', // Theme-aware text color
          borderColor: 'var(--in-progress)',
          border: '1px solid var(--in-progress)'
        };
      case 'completed': 
        return { 
          backgroundColor: 'var(--completed-bg)',
          color: 'var(--foreground)', // Theme-aware text color
          borderColor: 'var(--completed)',
          border: '1px solid var(--completed)'
        };
      case 'cancelled': 
        return { 
          backgroundColor: 'var(--cancelled-bg)',
          color: 'var(--foreground)', // Theme-aware text color
          borderColor: 'var(--cancelled)',
          border: '1px solid var(--cancelled)'
        };
      case 'no_show': 
        return { 
          backgroundColor: 'var(--muted)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
          border: '1px solid var(--border)'
        };
      default: 
        return { 
          backgroundColor: 'var(--muted)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
          border: '1px solid var(--border)'
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#ff8475' }}></div>
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
            <div className="text-center" style={{ color: '#e04850' }}>
              <p className="text-lg font-semibold mb-2">Error loading trips</p>
              <p className="text-sm" style={{ color: '#5c6166' }}>{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header - Only show if unified header is disabled (fallback) */}
      {!ENABLE_UNIFIED_HEADER && (
        <div>
          <div className="px-6 py-6 rounded-lg card-neu card-glow-border flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px' }}>
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
              {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
                <HeaderScopeSelector />
              )}
          {/* View Toggle (only shown if compact view feature flag is enabled) */}
          {compactViewEnabled && (
            <div className="flex items-center gap-1 rounded-md card-neu-flat p-1" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <Button
                variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('detailed')}
                className={`h-8 px-2 ${viewMode === 'detailed' ? 'card-neu-pressed' : 'card-neu-flat hover:card-neu'} [&]:shadow-none`}
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
                title="Detailed View"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('compact')}
                className={`h-8 px-2 ${viewMode === 'compact' ? 'card-neu-pressed' : 'card-neu-flat hover:card-neu'} [&]:shadow-none`}
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
                className="flex items-center gap-2 card-neu hover:card-neu [&]:shadow-none"
                style={{ 
                  backgroundColor: 'var(--background)', 
                  border: 'none',
                }}
                onClick={() => {
                  // Store current path before navigating to trip creation
                  const currentPath = window.location.pathname;
                  if (currentPath !== '/trips/new' && 
                      currentPath !== '/' &&
                      !currentPath.includes('/corporate-client/') &&
                      !currentPath.includes('/program/')) {
                    sessionStorage.setItem('previousPath', currentPath);
                  }
                  setLocation("/trips/new");
                }}
              >
                <Plus className="h-4 w-4" style={{ textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)' }} />
                <span style={{ textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)' }}>New Trip</span>
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
          className="card-neu"
          style={{
            backgroundColor: 'var(--background)',
            border: 'none',
            boxShadow: '0 0 20px rgba(255, 132, 117, 0.3), 0 0 40px rgba(255, 132, 117, 0.15)'
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
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  onClick={() => bulkOps.executeBulkAction('update_status', bulkOps.selectedItems)}
                  disabled={bulkOps.isLoading}
                >
                  Update Status
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search bar - flexes to fill remaining space */}
            {advancedFiltersEnabled ? (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    placeholder="Search trips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8475]"
                    style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    placeholder="Search trips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8475]"
                    style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
            )}

            {/* Right side: Filters, Sort By, Expand All */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {advancedFiltersEnabled ? (
                <>
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
                    showSearch={false}
                  />
                  {/* Expand All / Collapse All Toggle - Only show in detailed view */}
                  {viewMode === 'detailed' && (
                    <>
                      {areAllExpanded ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="card-neu-flat hover:card-neu [&]:shadow-none"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                          onClick={collapseAllTrips}
                          title="Collapse all trips"
                        >
                          <ChevronsUpDown className="h-4 w-4 mr-1" />
                          Collapse All
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="card-neu-flat hover:card-neu [&]:shadow-none"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                          onClick={expandAllTrips}
                          title="Expand all trips"
                        >
                          <ChevronsDownUp className="h-4 w-4 mr-1" />
                          Expand All
                        </Button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff8475] card-neu-flat [&]:shadow-none"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
                    className="px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff8475] card-neu-flat [&]:shadow-none"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    title="Filter by date range"
                    aria-label="Filter by date range"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="yesterday">Yesterday</option>
                  </select>

                  {/* Expand All / Collapse All Toggle - Only show in detailed view */}
                  {viewMode === 'detailed' && (
                    <>
                      {areAllExpanded ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="card-neu-flat hover:card-neu [&]:shadow-none"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                          onClick={collapseAllTrips}
                          title="Collapse all trips"
                        >
                          <ChevronsUpDown className="h-4 w-4 mr-1" />
                          Collapse All
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="card-neu-flat hover:card-neu [&]:shadow-none"
                          style={{ backgroundColor: 'var(--background)', border: 'none' }}
                          onClick={expandAllTrips}
                          title="Expand all trips"
                        >
                          <ChevronsDownUp className="h-4 w-4 mr-1" />
                          Expand All
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
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
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="flex items-center gap-4 p-3 transition-all card-neu-flat hover:card-neu"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: 'none'
                  }}
                >
                  {bulkOpsEnabled && (
                    <input
                      type="checkbox"
                      checked={bulkOps.selectedItems.includes(trip.id)}
                      onChange={() => bulkOps.toggleItem(trip.id)}
                      className="h-4 w-4"
                      aria-label={`Select trip ${trip.id}`}
                      title={`Select trip ${trip.id}`}
                    />
                  )}
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                    {/* Status Badge */}
                    <div className="col-span-1">
                      <Badge 
                        variant="outline"
                        style={getStatusColor(trip.status)} 
                        className="[&]:shadow-none [&]:bg-transparent"
                      >
                        {trip.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    {/* Client Name */}
                    <div className="col-span-12 md:col-span-2 font-medium truncate" style={{ color: 'var(--foreground)' }}>
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
                        className="h-8 w-8 p-0 card-neu-flat hover:card-neu [&]:shadow-none"
                        style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
        /* Collapsible Rows View (default) */
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-0">
            {/* Header Row */}
            <div className="sticky top-6 z-10 text-sm card-neu-flat" style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', color: 'var(--foreground)', border: 'none', fontWeight: 400 }}>
              <div className="flex items-center gap-3 p-4">
                {bulkOpsEnabled && (
                  <div className="w-4" />
                )}
                <div className="w-4" />
                <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('status')}
                    title="Click to sort by Status"
                  >
                    Status{getSortIcon('status')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('trip_id')}
                    title="Click to sort by Trip ID"
                  >
                    Trip ID{getSortIcon('trip_id')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('reference_id')}
                    title="Click to sort by Reference ID"
                  >
                    Reference ID{getSortIcon('reference_id')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('client')}
                    title="Click to sort by Client"
                  >
                    Client{getSortIcon('client')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('date')}
                    title="Click to sort by Date"
                  >
                    Date{getSortIcon('date')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('pu')}
                    title="Click to sort by Pickup Time"
                  >
                    PU{getSortIcon('pu')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('do')}
                    title="Click to sort by Dropoff Time"
                  >
                    DO{getSortIcon('do')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('appt_time')}
                    title="Click to sort by Appointment Time"
                  >
                    Appt Time{getSortIcon('appt_time')}
                  </div>
                  <div 
                    className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('origin')}
                    title="Click to sort by Origin"
                  >
                    Origin{getSortIcon('origin')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('destination')}
                    title="Click to sort by Destination"
                  >
                    Destination{getSortIcon('destination')}
                  </div>
                  <div 
                    className="col-span-1 text-center flex items-center justify-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('pax')}
                    title="Click to sort by Passenger Count"
                  >
                    PAX{getSortIcon('pax')}
                  </div>
                </div>
              </div>
            </div>
            <div className="divide-y">
              {filteredTrips.map((trip) => {
                const isExpanded = expandedTrips.has(trip.id);
                const stopsCount = trip.stops?.length || 0;
                const totalLegs = stopsCount + 2; // Origin + Stops + Destination
                const showActualTimes = trip.status === 'completed' || trip.status === 'in_progress';
                const abbreviateSpecialReqs = (reqs?: string) => {
                  if (!reqs) return '';
                  return reqs.length > 30 ? reqs.substring(0, 30) + '...' : reqs;
                };

                return (
                  <Collapsible
                    key={trip.id}
                    open={isExpanded}
                    onOpenChange={(open) => {
                      const newExpanded = new Set(expandedTrips);
                      if (open) {
                        newExpanded.add(trip.id);
                      } else {
                        newExpanded.delete(trip.id);
                      }
                      setExpandedTrips(newExpanded);
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <div 
                        className="flex items-center gap-3 p-4 transition-all cursor-pointer card-neu-flat hover:card-neu"
                        style={{ 
                          backgroundColor: 'var(--background)',
                          border: 'none'
                        }}
                      >
                        {bulkOpsEnabled && (
                          <input
                            type="checkbox"
                            checked={bulkOps.selectedItems.includes(trip.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              bulkOps.toggleItem(trip.id);
                            }}
                            className="h-4 w-4"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select trip ${trip.id}`}
                            title={`Select trip ${trip.id}`}
                          />
                        )}
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                        {/* Collapsed Row Content - Left to Right */}
                        <div className="flex-1 grid grid-cols-12 gap-2 items-center text-sm">
                          {/* Status */}
                          <div className="col-span-1">
                            <Badge 
                              variant="outline"
                              style={getStatusColor(trip.status)} 
                              className="text-xs [&]:shadow-none [&]:bg-transparent"
                            >
                              {trip.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          {/* Trip ID - Show reference_id if available, otherwise fallback to id */}
                          <div className="col-span-1 font-mono text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                            {trip.reference_id || trip.id.substring(0, 8) + '...'}
                          </div>
                          {/* Reference ID - Show client SCID or group reference_id */}
                          <div className="col-span-1 font-mono text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                            {(() => {
                              // Handle group trips
                              if (trip.is_group_trip || trip.client_group_id) {
                                const clientGroup = Array.isArray(trip.client_group) 
                                  ? trip.client_group[0] 
                                  : trip.client_group;
                                return clientGroup?.reference_id || <span>-</span>;
                              }
                              
                              // Handle individual client trips
                              if (trip.client_id) {
                                const client = Array.isArray(trip.client) 
                                  ? trip.client[0] 
                                  : trip.client;
                                return client?.scid || <span>-</span>;
                              }
                              
                              return <span>-</span>;
                            })()}
                          </div>
                          {/* Client - Show client name or client group name */}
                          <div className="col-span-1 truncate" style={{ color: 'var(--foreground)' }}>
                            {(() => {
                              // Debug logging for troubleshooting
                              if (process.env.NODE_ENV === 'development' && !trip.client && !trip.client_group) {
                                console.warn('⚠️ Trip missing client data:', {
                                  trip_id: trip.id,
                                  client_id: trip.client_id,
                                  client_group_id: trip.client_group_id,
                                  is_group_trip: trip.is_group_trip,
                                  hasClient: !!trip.client,
                                  hasClientGroup: !!trip.client_group
                                });
                              }
                              
                              // Handle group trips
                              if (trip.is_group_trip || trip.client_group_id) {
                                // Check if client_group is an array (Supabase sometimes returns arrays)
                                const clientGroup = Array.isArray(trip.client_group) 
                                  ? trip.client_group[0] 
                                  : trip.client_group;
                                
                                if (clientGroup?.name) {
                                  return (
                                    <span className="flex items-center gap-1">
                                      {clientGroup.name}
                                    </span>
                                  );
                                }
                                return <span style={{ color: 'var(--muted-foreground)' }}>Group (N/A)</span>;
                              }
                              
                              // Handle individual client trips
                              if (trip.client_id) {
                                // Check if client is an array (Supabase sometimes returns arrays)
                                const client = Array.isArray(trip.client) 
                                  ? trip.client[0] 
                                  : trip.client;
                                
                                if (client?.first_name || client?.last_name) {
                                  return (
                                    <span>
                                      {client.first_name} {client.last_name}
                                    </span>
                                  );
                                }
                                return <span style={{ color: 'var(--muted-foreground)' }}>Client (N/A)</span>;
                              }
                              
                              return <span style={{ color: 'var(--muted-foreground)' }}>N/A</span>;
                            })()}
                          </div>
                          {/* Date */}
                          <div className="col-span-1" style={{ color: 'var(--muted-foreground)' }}>
                            {format(parseISO(trip.scheduled_pickup_time), 'MMM d, yyyy')}
                          </div>
                          {/* PU Time */}
                          <div className="col-span-1" style={{ color: 'var(--muted-foreground)' }}>
                            {showActualTimes && trip.actual_pickup_time 
                              ? format(parseISO(trip.actual_pickup_time), 'h:mm a')
                              : format(parseISO(trip.scheduled_pickup_time), 'h:mm a')}
                          </div>
                          {/* DO Time */}
                          <div className="col-span-1" style={{ color: 'var(--muted-foreground)' }}>
                            {showActualTimes && trip.actual_dropoff_time
                              ? format(parseISO(trip.actual_dropoff_time), 'h:mm a')
                              : trip.scheduled_return_time 
                                ? format(parseISO(trip.scheduled_return_time), 'h:mm a')
                                : '-'}
                          </div>
                          {/* Appt Time */}
                          <div className="col-span-1" style={{ color: 'var(--muted-foreground)' }}>
                            {trip.appointment_time 
                              ? format(parseISO(trip.appointment_time), 'h:mm a')
                              : '-'}
                          </div>
                          {/* Origin */}
                          <div className="col-span-2 truncate" style={{ color: 'var(--muted-foreground)' }}>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{trip.pickup_address}</span>
                            </div>
                          </div>
                          {/* Destination */}
                          <div className="col-span-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{trip.dropoff_address}</span>
                              {stopsCount > 0 && (
                                <Badge variant="outline" className="ml-1 text-xs card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                                  {totalLegs} Legs
                                </Badge>
                              )}
                            </div>
                          </div>
                          {/* PAX */}
                          <div className="col-span-1 text-center">
                            <Badge variant="outline" className="text-xs card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                              {trip.passenger_count} PAX
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t card-neu-flat" style={{ backgroundColor: 'var(--background)', borderTopColor: 'var(--border)', border: 'none' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          {/* Column 1: Basic Info */}
                          <div className="space-y-2">
                            <div>
                              <strong>Trip Reference:</strong> <span className="font-mono text-xs">{trip.reference_id || 'N/A'}</span>
                            </div>
                            <div>
                              <strong>Client:</strong> {
                                trip.is_group_trip && trip.client_group ? (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {trip.client_group.name}
                                  </span>
                                ) : trip.client ? (
                                  <span>
                                    {trip.client.scid && (
                                      <span className="font-mono text-xs mr-1" style={{ color: 'var(--muted-foreground)' }}>
                                        {trip.client.scid}
                                      </span>
                                    )}
                                    {trip.client.first_name} {trip.client.last_name}
                                  </span>
                                ) : (
                                  'N/A'
                                )
                              }
                              {trip.is_group_trip && trip.client_group?.reference_id && (
                                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                  Reference ID: <span className="font-mono">{trip.client_group.reference_id}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <strong>Origin:</strong> {trip.pickup_address}
                            </div>
                            <div>
                              <strong>Destination:</strong> {trip.dropoff_address}
                            </div>
                            {stopsCount > 0 && (
                              <div>
                                <strong>Stops ({stopsCount}):</strong>
                                <ul className="list-disc list-inside ml-2 mt-1">
                                  {trip.stops?.map((stop, idx) => (
                                    <li key={idx} className="text-xs">{stop}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div>
                              <strong>Trip Purpose:</strong> {trip.trip_purpose || 'N/A'}
                            </div>
                          </div>

                          {/* Column 2: Timing */}
                          <div className="space-y-2">
                            <div>
                              <strong>Scheduled PU Time:</strong> {format(parseISO(trip.scheduled_pickup_time), 'MMM d, yyyy h:mm a')}
                            </div>
                            {showActualTimes && trip.actual_pickup_time && (
                              <div>
                                <strong>Actual Pickup Time:</strong> {format(parseISO(trip.actual_pickup_time), 'MMM d, yyyy h:mm a')}
                              </div>
                            )}
                            {trip.appointment_time && (
                              <div>
                                <strong>Appt Time:</strong> {format(parseISO(trip.appointment_time), 'MMM d, yyyy h:mm a')}
                              </div>
                            )}
                            <div>
                              <strong>Scheduled DO Time:</strong> {trip.scheduled_return_time ? format(parseISO(trip.scheduled_return_time), 'MMM d, yyyy h:mm a') : 'N/A'}
                            </div>
                            {showActualTimes && trip.actual_dropoff_time && (
                              <div>
                                <strong>Actual DO Time:</strong> {format(parseISO(trip.actual_dropoff_time), 'MMM d, yyyy h:mm a')}
                              </div>
                            )}
                            <div>
                              <strong>Trip Type:</strong> {trip.trip_type === 'round_trip' ? 'Round Trip' : 'One-Way'}
                            </div>
                            {trip.trip_type === 'round_trip' && showActualTimes && trip.actual_return_time && (
                              <div>
                                <strong>Actual Return Time:</strong> {format(parseISO(trip.actual_return_time), 'MMM d, yyyy h:mm a')}
                              </div>
                            )}
                          </div>

                          {/* Column 3: Additional Info */}
                          <div className="space-y-2">
                            <div>
                              <strong>PAX:</strong> {trip.passenger_count}
                            </div>
                            {trip.special_requirements && (
                              <div>
                                <strong>Special Requirements:</strong> {abbreviateSpecialReqs(trip.special_requirements)}
                              </div>
                            )}
                            <div>
                              <strong>Trip Category ID:</strong> {trip.trip_category_id || 'N/A'}
                            </div>
                            <div>
                              <strong>Recurring Trip:</strong> {trip.recurring_trip_id ? 'Yes' : 'No'}
                            </div>
                            {trip.recurring_trip_id && (
                              <>
                                <div>
                                  <strong>Recurring Trip ID:</strong> <span className="font-mono text-xs">{trip.recurring_trip_id}</span>
                                </div>
                                {trip.recurring_pattern && (
                                  <div>
                                    <strong>Recurring Pattern:</strong> {formatRecurringPattern(trip.recurring_pattern)}
                                  </div>
                                )}
                              </>
                            )}
                            <div>
                              <strong>Is Group Trip:</strong> {trip.is_group_trip ? 'Yes' : 'No'}
                            </div>
                            {trip.is_group_trip && trip.client_group?.reference_id && (
                              <div>
                                <strong>Reference ID:</strong> <span className="font-mono text-xs">{trip.client_group.reference_id}</span>
                              </div>
                            )}
                            {trip.created_by && (
                              <div>
                                <strong style={{ color: '#a5c8ca' }}>Created By:</strong> <span style={{ color: '#a5c8ca', opacity: 0.8 }}>{trip.created_by_user?.user_name || trip.created_by || 'N/A'}</span> <span style={{ color: '#a5c8ca', opacity: 0.7 }}>at {format(parseISO(trip.created_at), 'MMM d, yyyy h:mm a')}</span>
                              </div>
                            )}
                            {trip.updated_by && trip.updated_at && trip.updated_at !== trip.created_at && (
                              <div>
                                <strong style={{ color: '#a5c8ca' }}>Updated By:</strong> <span style={{ color: '#a5c8ca', opacity: 0.8 }}>{trip.updated_by_user?.user_name || trip.updated_by || 'N/A'}</span> <span style={{ color: '#a5c8ca', opacity: 0.7 }}>at {format(parseISO(trip.updated_at), 'MMM d, yyyy h:mm a')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </CardContent>
          {/* Infinite scroll trigger */}
          {infiniteScrollEnabled && displayedTripsCount < allFilteredTrips.length && (
            <div ref={loadMoreRef} className="flex justify-center py-4 border-t">
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading more trips...</div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
