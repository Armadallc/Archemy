import React, { useState } from "react";
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
  Trash2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useHierarchy } from "../hooks/useHierarchy";
import { useAuth } from "../hooks/useAuth";
import { format, parseISO, isToday, isTomorrow, isYesterday } from "date-fns";
import ExportButton from "./export/ExportButton";
import { useLocation } from "wouter";

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
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
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
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filterParams = getFilterParams();

  // Build API endpoint based on hierarchy level
  const getTripsEndpoint = () => {
    if (level === 'corporate') {
      return '/api/trips'; // Use regular trips endpoint for super_admin
    } else if (level === 'client' && selectedCorporateClient) {
      return `/api/trips/corporate-client/${selectedCorporateClient}`;
    } else if (level === 'program' && selectedProgram) {
      return `/api/trips/program/${selectedProgram}`;
    }
    return '/api/trips';
  };

  // Fetch trips based on current hierarchy level
  const { data: tripsData, isLoading, error } = useQuery({
    queryKey: ['trips', level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      const endpoint = getTripsEndpoint();
      console.log('🔍 Fetching trips from:', endpoint, 'for level:', level);
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  const trips: Trip[] = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];

  // Filter trips based on search and status
  const filteredTrips = trips.filter(trip => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trips...</p>
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
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold mb-2">Error loading trips</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
          <p className="text-gray-600 mt-1">{getTripCount()}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={filteredTrips}
            columns={[
              { key: 'id', label: 'Trip ID' },
              { key: 'client_name', label: 'Client Name', formatter: (trip) => `${trip.client?.first_name || ''} ${trip.client?.last_name || ''}`.trim() },
              { key: 'pickup_address', label: 'Pickup Address' },
              { key: 'dropoff_address', label: 'Dropoff Address' },
              { key: 'scheduled_pickup_time', label: 'Scheduled Pickup', formatter: (value) => value ? format(parseISO(value), 'MMM dd, yyyy HH:mm') : '' },
              { key: 'actual_pickup_time', label: 'Actual Pickup', formatter: (value) => value ? format(parseISO(value), 'MMM dd, yyyy HH:mm') : '' },
              { key: 'status', label: 'Status' },
              { key: 'driver_name', label: 'Driver', formatter: (trip) => trip.driver?.license_number || 'Unassigned' },
              { key: 'program_name', label: 'Program', formatter: (trip) => trip.program?.name || 'Unknown' },
              { key: 'corporate_client_name', label: 'Corporate Client', formatter: (trip) => trip.corporate_client?.name || 'N/A' },
              { key: 'created_at', label: 'Created', formatter: (value) => value ? format(parseISO(value), 'MMM dd, yyyy') : '' }
            ]}
            filename={`trips-${level}-${format(new Date(), 'yyyy-MM-dd')}`}
            onExportStart={() => console.log('Starting trip export...')}
            onExportComplete={() => console.log('Trip export completed!')}
            onExportError={(error) => console.error('Trip export failed:', error)}
          />
          <Button 
            className="flex items-center gap-2"
            onClick={() => setLocation("/trips/new")}
          >
            <Plus className="h-4 w-4" />
            New Trip
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
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
        </CardContent>
      </Card>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" 
                ? "No trips match your current filters." 
                : "No trips have been scheduled yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getStatusColor(trip.status)}>
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
                        <div className="space-y-2 text-sm text-gray-600">
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

                      <div className="text-sm text-gray-600">
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
                      className="text-red-600 hover:text-red-700"
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
      )}
    </div>
  );
}
