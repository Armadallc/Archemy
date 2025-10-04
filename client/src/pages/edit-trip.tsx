import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  Clock, 
  MapPin, 
  User, 
  Car, 
  Users, 
  Calendar,
  Trash2,
  AlertTriangle,
  Building2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";

interface Trip {
  id: string;
  program_id: string;
  client_id: string;
  driver_id?: string;
  pickup_location_id?: string;
  dropoff_location_id?: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  status: string;
  passenger_count: number;
  notes?: string;
  trip_type: string;
  special_requirements?: string;
  clients?: {
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
  };
  drivers?: {
    users: {
      user_name: string;
      email: string;
    };
    license_number?: string;
    phone?: string;
  };
  programs?: {
    id: string;
    name: string;
    corporate_client_id: string;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
  pickup_locations?: {
    id: string;
    name: string;
    address: string;
  };
  dropoff_locations?: {
    id: string;
    name: string;
    address: string;
  };
}

const statusColors = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-green-50 text-green-700 border-green-200", 
  in_progress: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-gray-50 text-gray-700 border-gray-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function EditTrip() {
  const [, params] = useRoute("/trips/edit/:tripId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram, getPageTitle } = useHierarchy();
  const tripId = params?.tripId;

  const [formData, setFormData] = useState({
    client_id: "",
    driver_id: "",
    trip_type: "one_way" as "one_way" | "round_trip",
    pickup_address: "",
    dropoff_address: "",
    pickup_location_id: "",
    dropoff_location_id: "",
    scheduled_pickup_time: "",
    scheduled_return_time: "",
    passenger_count: 1,
    special_requirements: "",
    notes: "",
    status: "scheduled" as "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled",
  });

  // Fetch trip details
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ["/api/trips", tripId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trips/${tripId}`);
      return await response.json();
    },
    enabled: !!tripId,
  });

  // Fetch clients based on current hierarchy level
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/clients";
      
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/clients/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/clients/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  // Fetch drivers based on current hierarchy level
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/drivers";
      
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/drivers/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/drivers/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  // Fetch locations based on current hierarchy level
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      let endpoint = "/api/locations";
      
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/locations/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/locations/corporate-client/${selectedCorporateClient}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: true,
  });

  // Populate form when trip data loads
  useEffect(() => {
    if (trip) {
      setFormData({
        client_id: trip.client_id || "",
        driver_id: trip.driver_id || "",
        trip_type: trip.trip_type || "one_way",
        pickup_address: trip.pickup_address || "",
        dropoff_address: trip.dropoff_address || "",
        pickup_location_id: trip.pickup_location_id || "",
        dropoff_location_id: trip.dropoff_location_id || "",
        scheduled_pickup_time: trip.scheduled_pickup_time ? 
          format(parseISO(trip.scheduled_pickup_time), "yyyy-MM-dd'T'HH:mm") : "",
        scheduled_return_time: trip.scheduled_return_time ? 
          format(parseISO(trip.scheduled_return_time), "yyyy-MM-dd'T'HH:mm") : "",
        passenger_count: trip.passenger_count || 1,
        special_requirements: trip.special_requirements || "",
        notes: trip.notes || "",
        status: trip.status || "scheduled",
      });
    }
  }, [trip]);

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async (updatedData: typeof formData) => {
      const apiData = {
        clientId: updatedData.client_id,
        driverId: updatedData.driver_id || undefined,
        tripType: updatedData.trip_type,
        pickupAddress: updatedData.pickup_address,
        dropoffAddress: updatedData.dropoff_address,
        pickupLocationId: updatedData.pickup_location_id || undefined,
        dropoffLocationId: updatedData.dropoff_location_id || undefined,
        scheduledPickupTime: updatedData.scheduled_pickup_time,
        scheduledReturnTime: updatedData.trip_type === "round_trip" ? updatedData.scheduled_return_time : undefined,
        passengerCount: updatedData.passenger_count,
        specialRequirements: updatedData.special_requirements || undefined,
        notes: updatedData.notes || undefined,
        status: updatedData.status
      };
      return apiRequest("PATCH", `/api/trips/${tripId}`, apiData);
    },
    onSuccess: () => {
      toast({
        title: "Trip Updated",
        description: "Trip has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setLocation("/trips");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/trips/${tripId}`);
    },
    onSuccess: () => {
      toast({
        title: "Trip Deleted",
        description: "Trip has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setLocation("/trips");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTripMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
      deleteTripMutation.mutate();
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (tripLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Trip Not Found</h2>
        <p className="text-gray-600 mb-4">The requested trip could not be found.</p>
        <Button onClick={() => setLocation("/trips")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trips
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/trips")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trips
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Trip</h1>
            <p className="text-gray-600">{getPageTitle()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(trip.status)}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteTripMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteTripMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trip_type">Trip Type</Label>
                <Select 
                  value={formData.trip_type} 
                  onValueChange={(value: "one_way" | "round_trip") => setFormData({...formData, trip_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_way">One Way</SelectItem>
                    <SelectItem value="round_trip">Round Trip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_pickup_time">Pickup Time</Label>
                <Input
                  id="scheduled_pickup_time"
                  type="datetime-local"
                  value={formData.scheduled_pickup_time}
                  onChange={(e) => setFormData({...formData, scheduled_pickup_time: e.target.value})}
                  required
                />
              </div>
              {formData.trip_type === "round_trip" && (
                <div>
                  <Label htmlFor="scheduled_return_time">Return Time</Label>
                  <Input
                    id="scheduled_return_time"
                    type="datetime-local"
                    value={formData.scheduled_return_time}
                    onChange={(e) => setFormData({...formData, scheduled_return_time: e.target.value})}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="passenger_count">Passenger Count</Label>
              <Input
                id="passenger_count"
                type="number"
                min="1"
                max="50"
                value={formData.passenger_count}
                onChange={(e) => setFormData({...formData, passenger_count: parseInt(e.target.value) || 1})}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Client and Driver */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client & Driver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Client</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData({...formData, client_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                        {client.phone && ` (${client.phone})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="driver_id">Driver (Optional)</Label>
                <Select 
                  value={formData.driver_id} 
                  onValueChange={(value) => setFormData({...formData, driver_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Driver Assigned</SelectItem>
                    {drivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.users?.user_name || 'Unknown Driver'}
                        {driver.phone && ` (${driver.phone})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup_location_id">Pickup Location</Label>
                <Select 
                  value={formData.pickup_location_id} 
                  onValueChange={(value) => setFormData({...formData, pickup_location_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pickup location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom Address</SelectItem>
                    {locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dropoff_location_id">Dropoff Location</Label>
                <Select 
                  value={formData.dropoff_location_id} 
                  onValueChange={(value) => setFormData({...formData, dropoff_location_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dropoff location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom Address</SelectItem>
                    {locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup_address">Pickup Address</Label>
                <Input
                  id="pickup_address"
                  value={formData.pickup_address}
                  onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                  placeholder="Enter pickup address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dropoff_address">Dropoff Address</Label>
                <Input
                  id="dropoff_address"
                  value={formData.dropoff_address}
                  onChange={(e) => setFormData({...formData, dropoff_address: e.target.value})}
                  placeholder="Enter dropoff address"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="special_requirements">Special Requirements</Label>
              <Textarea
                id="special_requirements"
                value={formData.special_requirements}
                onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                placeholder="Enter any special requirements..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Enter any additional notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Program Information */}
        {trip.programs && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Program Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">Program</p>
                  <p className="font-medium">{trip.programs.name}</p>
                </div>
                {trip.programs.corporateClient && (
                  <div>
                    <p className="text-sm text-gray-600">Corporate Client</p>
                    <p className="font-medium">{trip.programs.corporateClient.name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/trips")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateTripMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateTripMutation.isPending ? "Updating..." : "Update Trip"}
          </Button>
        </div>
      </form>
    </div>
  );
}