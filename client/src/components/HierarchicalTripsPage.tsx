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
  ChevronsUpDown,
  CheckCircle2,
  XCircle
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
import { OrderConfirmationDialog } from "./trips/OrderConfirmationDialog";
import { OrderDeclineDialog } from "./trips/OrderDeclineDialog";
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
  status: 'order' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
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
  const [sortColumn, setSortColumn] = useState<string | null>(null); // Column to sort by (master sort)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Sort direction (master sort)
  // Per-category sorting (status-specific)
  const [categorySorts, setCategorySorts] = useState<Record<string, { column: string | null; direction: 'asc' | 'desc' }>>({});
  // Track collapsed status sections (default: all expanded)
  const [collapsedStatusSections, setCollapsedStatusSections] = useState<Set<string>>(new Set());
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Order management dialogs
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedTripForAction, setSelectedTripForAction] = useState<Trip | null>(null);

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

  // Helper function to get sort value for a trip
  const getSortValue = (trip: Trip, column: string): any => {
    switch (column) {
      case 'status':
        return trip.status || '';
      case 'trip_id':
        return trip.reference_id || trip.id || '';
      case 'reference_id':
        if (trip.is_group_trip || trip.client_group_id) {
          return trip.client_group?.reference_id || '';
        } else {
          return trip.client?.scid || '';
        }
      case 'client':
        if (trip.is_group_trip || trip.client_group_id) {
          return trip.client_group?.name || '';
        } else {
          return `${trip.client?.first_name || ''} ${trip.client?.last_name || ''}`.trim();
        }
      case 'date':
        return trip.scheduled_pickup_time ? parseISO(trip.scheduled_pickup_time).getTime() : 0;
      case 'pu':
        const puTime = trip.actual_pickup_time || trip.scheduled_pickup_time;
        return puTime ? parseISO(puTime).getTime() : 0;
      case 'do':
        const doTime = trip.actual_dropoff_time || trip.scheduled_return_time;
        return doTime ? parseISO(doTime).getTime() : 0;
      case 'appt_time':
        return trip.appointment_time ? parseISO(trip.appointment_time).getTime() : 0;
      case 'origin':
        return trip.pickup_address || '';
      case 'destination':
        return trip.dropoff_address || '';
      case 'pax':
        return trip.passenger_count || 0;
      default:
        return '';
    }
  };

  // Group trips by status and sort each group
  const tripsByStatus = useMemo(() => {
    const statusOrder = ['order', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'confirmed'];
    const grouped: Record<string, Trip[]> = {};
    
    // Group trips by status
    allFilteredTrips.forEach(trip => {
      const status = trip.status || 'order';
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(trip);
    });
    
    // Sort each group
    statusOrder.forEach(status => {
      if (grouped[status]) {
        // Use category-specific sort if available, otherwise use master sort
        const categorySort = categorySorts[status];
        const activeSortColumn = categorySort?.column || sortColumn;
        const activeSortDirection = categorySort?.direction || sortDirection;
        
        if (activeSortColumn) {
          grouped[status].sort((a, b) => {
            let aValue = getSortValue(a, activeSortColumn);
            let bValue = getSortValue(b, activeSortColumn);
            
            // Handle null/undefined values
            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';
            
            // Compare values
            if (aValue < bValue) return activeSortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return activeSortDirection === 'asc' ? 1 : -1;
            return 0;
          });
        }
      }
    });
    
    return grouped;
  }, [allFilteredTrips, sortColumn, sortDirection, categorySorts]);

  // Flatten grouped trips in status order for display (for compact view and other uses)
  const sortedTrips = useMemo(() => {
    const statusOrder = ['order', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'confirmed'];
    const result: Trip[] = [];
    
    statusOrder.forEach(status => {
      if (tripsByStatus[status]) {
        result.push(...tripsByStatus[status]);
      }
    });
    
    return result;
  }, [tripsByStatus]);

  // For infinite scroll: limit displayed trips, otherwise show all
  // Note: sortedTrips is now grouped by status, so we use it directly
  const filteredTrips = infiniteScrollEnabled 
    ? sortedTrips.slice(0, displayedTripsCount)
    : sortedTrips;

  // Expand/Collapse all functions
  const expandAllTrips = () => {
    const allTripIds = new Set(sortedTrips.map(trip => trip.id));
    setExpandedTrips(allTripIds);
  };

  const collapseAllTrips = () => {
    setExpandedTrips(new Set());
  };

  // Check if all trips are expanded or collapsed
  const areAllExpanded = sortedTrips.length > 0 && expandedTrips.size === sortedTrips.length;
  const areAllCollapsed = expandedTrips.size === 0;

  // Reset displayed count when filters or sort change
  useEffect(() => {
    if (infiniteScrollEnabled) {
      setDisplayedTripsCount(20);
    }
  }, [searchTerm, statusFilter, dateFilter, sortColumn, sortDirection, infiniteScrollEnabled]);

  // Handle master column header click for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
    // Clear category-specific sorts when master sort changes
    setCategorySorts({});
  };

  // Handle category-specific sorting
  const handleCategorySort = (status: string, column: string) => {
    const currentCategorySort = categorySorts[status];
    if (currentCategorySort?.column === column) {
      // Toggle direction if same column
      setCategorySorts({
        ...categorySorts,
        [status]: {
          column,
          direction: currentCategorySort.direction === 'asc' ? 'desc' : 'asc'
        }
      });
    } else {
      // Set new column and default to ascending
      setCategorySorts({
        ...categorySorts,
        [status]: {
          column,
          direction: 'asc'
        }
      });
    }
  };

  // Get sort icon for master column header
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Get sort icon for category column header
  const getCategorySortIcon = (status: string, column: string) => {
    const categorySort = categorySorts[status];
    if (categorySort?.column === column) {
      // Category-specific sort is active
      return categorySort.direction === 'asc' 
        ? <ArrowUp className="h-3 w-3 ml-1" />
        : <ArrowDown className="h-3 w-3 ml-1" />;
    }
    // If no category sort, show master sort if active (with reduced opacity)
    if (!categorySort && sortColumn === column) {
      return sortDirection === 'asc' 
        ? <ArrowUp className="h-3 w-3 ml-1 opacity-50" />
        : <ArrowDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
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
      case 'order':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)', // Amber/Orange background
          color: 'var(--foreground)',
          borderColor: '#F59E0B', // Amber/Orange border
          border: '1px solid #F59E0B'
        };
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

  // Get status color for category sorting bars
  const getCategorySortColor = (status: string): string => {
    switch (status) {
      case 'order':
        return '#F59E0B'; // Official Order status color
      case 'scheduled':
        return '#7afffe'; // --scheduled
      case 'in_progress':
        return '#f1fe60'; // --in-progress
      case 'completed':
        return '#3bfec9'; // --completed
      case 'cancelled':
        return '#e04850'; // --cancelled
      default:
        return 'var(--foreground)';
    }
  };

  // Toggle status section collapse
  const toggleStatusSection = (status: string) => {
    setCollapsedStatusSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  // Check if status section is collapsed
  const isStatusSectionCollapsed = (status: string): boolean => {
    return collapsedStatusSections.has(status);
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
                        { value: 'order', label: 'Order' },
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
                    <option value="order">Order</option>
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
      {sortedTrips.length === 0 ? (
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
        /* Compact View - Also grouped by status */
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-0">
            {/* Master Sorting Header for Compact View */}
            <div className="sticky top-0 z-20 text-sm card-neu-flat" style={{ backgroundColor: 'var(--background)', borderBottom: '2px solid var(--border)', color: 'var(--foreground)', border: 'none', fontWeight: 600 }}>
              <div className="flex items-center gap-3 p-4">
                {bulkOpsEnabled && (
                  <div className="w-4" />
                )}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="col-span-1">Status</div>
                  <div className="col-span-12 md:col-span-2">Client</div>
                  <div className="col-span-12 md:col-span-3">Pickup</div>
                  <div className="col-span-12 md:col-span-3">Dropoff</div>
                  <div className="col-span-12 md:col-span-2">Time</div>
                  <div className="col-span-12 md:col-span-1">Actions</div>
                </div>
              </div>
            </div>
            <div className="divide-y">
              {/* Render trips grouped by status for compact view */}
              {(() => {
                const statusOrder = ['order', 'scheduled', 'in_progress', 'completed', 'cancelled'];
                const statusLabels: Record<string, string> = {
                  'order': 'Ordered',
                  'scheduled': 'Scheduled',
                  'in_progress': 'In Progress',
                  'completed': 'Complete',
                  'cancelled': 'Cancelled'
                };
                
                return statusOrder.map((status) => {
                  const trips = tripsByStatus[status] || [];
                  if (trips.length === 0) return null;
                  
                  return (
                    <React.Fragment key={status}>
                      {/* Category Header for Compact View */}
                      <div className="sticky top-[60px] z-10 text-xs card-neu-flat" style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', color: 'var(--foreground)', border: 'none', fontWeight: 500 }}>
                        <div className="flex items-center gap-3 p-3">
                          {bulkOpsEnabled && (
                            <div className="w-4" />
                          )}
                          <div 
                            className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-all"
                            onClick={() => toggleStatusSection(status)}
                            title={isStatusSectionCollapsed(status) ? `Expand ${statusLabels[status]} section` : `Collapse ${statusLabels[status]} section`}
                          >
                            {isStatusSectionCollapsed(status) ? (
                              <ChevronRight className="h-4 w-4" style={{ color: getCategorySortColor(status) }} />
                            ) : (
                              <ChevronDown className="h-4 w-4" style={{ color: getCategorySortColor(status) }} />
                            )}
                          </div>
                        </div>
                      </div>
                      {!isStatusSectionCollapsed(status) && trips.map((trip) => (
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
                    </React.Fragment>
                  );
                }).filter(Boolean)
              })()}
            </div>
          </CardContent>
          {/* Infinite scroll trigger for compact view */}
          {infiniteScrollEnabled && displayedTripsCount < sortedTrips.length && (
            <div ref={loadMoreRef} className="flex justify-center py-4 border-t">
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading more trips...</div>
            </div>
          )}
        </Card>
      ) : (
        /* Collapsible Rows View (default) */
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-0">
            {/* Master Sorting Header Row - Sticky at top */}
            <div className="sticky top-0 z-20 text-sm card-neu-flat" style={{ backgroundColor: 'var(--background)', borderBottom: '2px solid var(--border)', color: 'var(--foreground)', border: 'none', fontWeight: 600 }}>
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
                    title="Master Sort: Click to sort all trips by Status (within status groups)"
                  >
                    Status{getSortIcon('status')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('trip_id')}
                    title="Master Sort: Click to sort all trips by Trip ID (within status groups)"
                  >
                    Trip ID{getSortIcon('trip_id')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('reference_id')}
                    title="Master Sort: Click to sort all trips by Reference ID (within status groups)"
                  >
                    Reference ID{getSortIcon('reference_id')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('client')}
                    title="Master Sort: Click to sort all trips by Client (within status groups)"
                  >
                    Client{getSortIcon('client')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('date')}
                    title="Master Sort: Click to sort all trips by Date (within status groups)"
                  >
                    Date{getSortIcon('date')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('pu')}
                    title="Master Sort: Click to sort all trips by Pickup Time (within status groups)"
                  >
                    PU{getSortIcon('pu')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('do')}
                    title="Master Sort: Click to sort all trips by Dropoff Time (within status groups)"
                  >
                    DO{getSortIcon('do')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('appt_time')}
                    title="Master Sort: Click to sort all trips by Appointment Time (within status groups)"
                  >
                    Appt Time{getSortIcon('appt_time')}
                  </div>
                  <div 
                    className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('origin')}
                    title="Master Sort: Click to sort all trips by Origin (within status groups)"
                  >
                    Origin{getSortIcon('origin')}
                  </div>
                  <div 
                    className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('destination')}
                    title="Master Sort: Click to sort all trips by Destination (within status groups)"
                  >
                    Destination{getSortIcon('destination')}
                  </div>
                  <div 
                    className="col-span-1 text-center flex items-center justify-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    onClick={() => handleSort('pax')}
                    title="Master Sort: Click to sort all trips by Passenger Count (within status groups)"
                  >
                    PAX{getSortIcon('pax')}
                  </div>
                </div>
              </div>
            </div>
            <div className="divide-y">
              {/* Render trips grouped by status */}
              {(() => {
                const statusOrder = ['order', 'scheduled', 'in_progress', 'completed', 'cancelled'];
                const statusLabels: Record<string, string> = {
                  'order': 'Ordered',
                  'scheduled': 'Scheduled',
                  'in_progress': 'In Progress',
                  'completed': 'Complete',
                  'cancelled': 'Cancelled'
                };
                
                return statusOrder.map((status) => {
                  const trips = tripsByStatus[status] || [];
                  if (trips.length === 0) return null;
                  
                  return (
                    <React.Fragment key={status}>
                      {/* Category Header with Sorting */}
                      <div className="sticky top-[60px] z-10 text-xs card-neu-flat" style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', color: 'var(--foreground)', border: 'none', fontWeight: 500 }}>
                        <div className="flex items-center gap-3 p-3">
                          {bulkOpsEnabled && (
                            <div className="w-4" />
                          )}
                          <div 
                            className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-all"
                            onClick={() => toggleStatusSection(status)}
                            title={isStatusSectionCollapsed(status) ? `Expand ${statusLabels[status]} section` : `Collapse ${statusLabels[status]} section`}
                          >
                            {isStatusSectionCollapsed(status) ? (
                              <ChevronRight className="h-4 w-4" style={{ color: getCategorySortColor(status) }} />
                            ) : (
                              <ChevronDown className="h-4 w-4" style={{ color: getCategorySortColor(status) }} />
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                            <div 
                              className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'status')}
                              title={`Sort ${statusLabels[status]} trips by Status`}
                            >
                              Status{getCategorySortIcon(status, 'status')}
                            </div>
                            <div 
                              className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'trip_id')}
                              title={`Sort ${statusLabels[status]} trips by Trip ID`}
                            >
                              Trip ID{getCategorySortIcon(status, 'trip_id')}
                            </div>
                            <div 
                              className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'reference_id')}
                              title={`Sort ${statusLabels[status]} trips by Reference ID`}
                            >
                              Reference ID{getCategorySortIcon(status, 'reference_id')}
                            </div>
                            <div 
                              className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'client')}
                              title={`Sort ${statusLabels[status]} trips by Client`}
                            >
                              Client{getCategorySortIcon(status, 'client')}
                            </div>
                            <div 
                              className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'date')}
                              title={`Sort ${statusLabels[status]} trips by Date`}
                            >
                              Date{getCategorySortIcon(status, 'date')}
                            </div>
                            <div 
                              className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'pu')}
                              title={`Sort ${statusLabels[status]} trips by Pickup Time`}
                            >
                              PU{getCategorySortIcon(status, 'pu')}
                            </div>
                            <div 
                              className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'do')}
                              title={`Sort ${statusLabels[status]} trips by Dropoff Time`}
                            >
                              DO{getCategorySortIcon(status, 'do')}
                            </div>
                            <div 
                              className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'appt_time')}
                              title={`Sort ${statusLabels[status]} trips by Appointment Time`}
                            >
                              Appt Time{getCategorySortIcon(status, 'appt_time')}
                            </div>
                            <div 
                              className="col-span-2 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'origin')}
                              title={`Sort ${statusLabels[status]} trips by Origin`}
                            >
                              Origin{getCategorySortIcon(status, 'origin')}
                            </div>
                            <div 
                              className="col-span-1 flex items-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'destination')}
                              title={`Sort ${statusLabels[status]} trips by Destination`}
                            >
                              Destination{getCategorySortIcon(status, 'destination')}
                            </div>
                            <div 
                              className="col-span-1 text-center flex items-center justify-center cursor-pointer hover:opacity-70 transition-all select-none card-neu-flat hover:card-neu px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--background)', border: 'none', color: getCategorySortColor(status) }}
                              onClick={() => handleCategorySort(status, 'pax')}
                              title={`Sort ${statusLabels[status]} trips by Passenger Count`}
                            >
                              PAX{getCategorySortIcon(status, 'pax')}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Trips in this status category */}
                      {!isStatusSectionCollapsed(status) && trips.map((trip) => {
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
                            {trip.created_by_user && (
                              <div>
                                <strong>Created By:</strong> {trip.created_by_user.user_name || trip.created_by_user.user_id || 'Unknown'}
                              </div>
                            )}
                            {trip.updated_by_user && trip.updated_at && (
                              <div>
                                <strong>Last Updated:</strong> {format(parseISO(trip.updated_at), 'MMM d, yyyy h:mm a')} by {trip.updated_by_user.user_name || trip.updated_by_user.user_id || 'Unknown'}
                              </div>
                            )}
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
                            
                            {/* Order Management Actions - Show for 'order' status trips */}
                            {trip.status === 'order' && user?.role === 'driver' && trip.driver_id && (trip.driver?.user_id === user.user_id || trip.driver_id === user.user_id) && (
                              <div className="pt-4 border-t mt-4" style={{ borderTopColor: 'var(--border)' }}>
                                <div className="flex flex-col gap-2">
                                  <p className="text-sm font-medium mb-2" style={{ color: '#F59E0B' }}>
                                    Trip Order - Action Required
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedTripForAction(trip);
                                        setConfirmDialogOpen(true);
                                      }}
                                      className="card-neu hover:card-neu-pressed [&]:shadow-none flex-1"
                                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTripForAction(trip);
                                        setDeclineDialogOpen(true);
                                      }}
                                      className="card-neu-flat hover:card-neu [&]:shadow-none flex-1"
                                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Decline
                                    </Button>
                                  </div>
                                  {trip.decline_reason && (
                                    <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                                      <strong>Previously Declined:</strong> {trip.decline_reason.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
                      })}
                    </React.Fragment>
                  );
                }).filter(Boolean)
              })()}
            </div>
          </CardContent>
          {/* Infinite scroll trigger */}
          {infiniteScrollEnabled && displayedTripsCount < sortedTrips.length && (
            <div ref={loadMoreRef} className="flex justify-center py-4 border-t">
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading more trips...</div>
            </div>
          )}
        </Card>
      )}

      {/* Order Management Dialogs */}
      {selectedTripForAction && (
        <>
          <OrderConfirmationDialog
            open={confirmDialogOpen}
            onOpenChange={(open) => {
              setConfirmDialogOpen(open);
              if (!open) setSelectedTripForAction(null);
            }}
            trip={selectedTripForAction}
            isRecurring={!!selectedTripForAction.recurring_trip_id}
            recurringCount={selectedTripForAction.recurring_trip_id 
              ? trips.filter(t => t.recurring_trip_id === selectedTripForAction.recurring_trip_id && t.status === 'order').length
              : 0}
          />
          <OrderDeclineDialog
            open={declineDialogOpen}
            onOpenChange={(open) => {
              setDeclineDialogOpen(open);
              if (!open) setSelectedTripForAction(null);
            }}
            trip={selectedTripForAction}
          />
        </>
      )}
    </div>
  );
}
