import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Search, Filter, MapPin, Users, Repeat } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { apiRequest } from "@/lib/queryClient";
import SimpleBookingForm from "@/components/booking/simple-booking-form";

function CombinedTripsPage() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [recurringSearchTerm, setRecurringSearchTerm] = useState("");
  const [recurringStatusFilter, setRecurringStatusFilter] = useState("all");

  // Fetch regular trips
  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["/api/trips", currentOrganization?.id, user?.role],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const endpoint = user?.role === "super_admin" 
        ? `/api/trips/organization/${currentOrganization.id}`
        : "/api/trips";
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!currentOrganization?.id && !!user,
  });

  // Fetch recurring trips
  const { data: recurringTrips = [], isLoading: recurringLoading } = useQuery({
    queryKey: ["/api/recurring-trips", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const response = await apiRequest("GET", `/api/recurring-trips/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
    staleTime: 0, // Force fresh data
    cacheTime: 0, // Don't cache
  });

  // Filter trips
  const filteredTrips = trips.filter((trip: any) => {
    const matchesSearch = searchTerm === "" || 
      trip.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.dropoff_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter recurring trips
  const filteredRecurringTrips = recurringTrips.filter((trip: any) => {
    const matchesSearch = recurringSearchTerm === "" || 
      trip.pickup_location?.toLowerCase().includes(recurringSearchTerm.toLowerCase()) ||
      trip.dropoff_location?.toLowerCase().includes(recurringSearchTerm.toLowerCase()) ||
      trip.pickupAddress?.toLowerCase().includes(recurringSearchTerm.toLowerCase()) ||
      trip.dropoffAddress?.toLowerCase().includes(recurringSearchTerm.toLowerCase()) ||
      trip.clientName?.toLowerCase().includes(recurringSearchTerm.toLowerCase());
    
    const matchesStatus = recurringStatusFilter === "all" || 
      (recurringStatusFilter === "active" && trip.isActive) ||
      (recurringStatusFilter === "inactive" && !trip.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Not specified";
    
    // For regular trips - handle ISO datetime format
    if (timeString.includes('T')) {
      try {
        const formatted = new Date(timeString).toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        // Ensure proper spacing: "1:00 PM" not "1:00PM"
        return formatted.replace(/([ap])m/i, ' $1M');
      } catch (error) {
        return "Invalid time";
      }
    }
    
    // For recurring trips - handle HH:MM:SS format
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      if (isNaN(hour) || isNaN(minute)) return "Invalid time";
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const displayMinute = minute.toString().padStart(2, '0');
      
      return `${displayHour}:${displayMinute} ${period}`;
    }
    
    return "Invalid time";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">TRIP MANAGEMENT</h1>
      </div>

      {/* Enhanced Schedule Trip Form */}
      <SimpleBookingForm />

      {/* Regular Trips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Regular Trips ({filteredTrips.length})
          </CardTitle>
          
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search trips by address or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
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
        </CardHeader>
        
        <CardContent>
          {tripsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading trips...</div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== "all" ? "No trips match your filters" : "No trips scheduled"}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredTrips.map((trip: any) => (
                <div key={trip.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(trip.status)}>
                        {trip.status.replace('_', ' ')}
                      </Badge>
                      {trip.tripType === "round_trip" && (
                        <Badge variant="outline">Round Trip</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {trip.scheduled_pickup_time ? formatDate(trip.scheduled_pickup_time) : 'No date set'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Client</div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        {trip.clientName || trip.client_name || "Unassigned Client"}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Time</div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {trip.scheduled_pickup_time ? (
                          <>
                            {formatTime(trip.scheduled_pickup_time)}
                            {trip.scheduled_return_time ? 
                              ` - ${formatTime(trip.scheduled_return_time)}` : 
                              trip.trip_type === 'round_trip' ? (() => {
                                const pickupDate = new Date(trip.scheduled_pickup_time);
                                const returnDate = new Date(pickupDate.getTime() + 2 * 60 * 60 * 1000);
                                return ` - ${formatTime(returnDate.toISOString())}`;
                              })() : ''
                            }
                          </>
                        ) : 'No time set'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Pickup</div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{trip.pickup_address || 'No pickup address'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Drop-off</div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{trip.dropoff_address || 'No dropoff address'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Trips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Recurring Trips ({filteredRecurringTrips.length})
          </CardTitle>
          
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search recurring trips..."
                  value={recurringSearchTerm}
                  onChange={(e) => setRecurringSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={recurringStatusFilter} onValueChange={setRecurringStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {recurringLoading ? (
            <div className="text-center py-8 text-gray-500">Loading recurring trips...</div>
          ) : filteredRecurringTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {recurringSearchTerm || recurringStatusFilter !== "all" ? "No recurring trips match your filters" : "No recurring trips scheduled"}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredRecurringTrips.map((trip: any) => (
                <div key={trip.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={trip.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {trip.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{trip.frequency || "Unknown"}</Badge>
                      {trip.tripType === "round_trip" && (
                        <Badge variant="outline">Round Trip</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {trip.nextDate || "No next date"}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Client</div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{trip.clientName || "Unassigned Client"}</span>
                        {trip.tripNickname && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {trip.tripNickname}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Passengers: {trip.passengerCount || 1}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Time</div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {trip.scheduled_pickup_time ? (
                          <>
                            {formatTime(trip.scheduled_pickup_time)}
                            {trip.scheduled_return_time ? 
                              ` - ${formatTime(trip.scheduled_return_time)}` : 
                              trip.trip_type === 'round_trip' ? (() => {
                                const pickupDate = new Date(trip.scheduled_pickup_time);
                                const returnDate = new Date(pickupDate.getTime() + 2 * 60 * 60 * 1000);
                                return ` - ${formatTime(returnDate.toISOString())}`;
                              })() : ''
                            }
                          </>
                        ) : 'No time set'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Pickup</div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{trip.pickup_location || trip.pickupAddress || "Not specified"}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700">Drop-off</div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{trip.dropoff_location || trip.dropoffAddress || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    {trip.daysOfWeek || "No days specified"} • 
                    Duration: {trip.duration_weeks || trip.duration || "Not specified"} weeks • 
                    Frequency: {trip.frequency || "Weekly"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CombinedTripsPage;