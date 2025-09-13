import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  AlertTriangle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  passenger_count: number;
  notes?: string;
  trip_type: string;
  special_requirements?: string;
  clients?: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  drivers?: {
    users: {
      user_name: string;
    };
    license_number?: string;
    vehicle_info?: string;
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
  const tripId = params?.tripId;

  const [formData, setFormData] = useState({
    client_id: "",
    driver_id: "",
    trip_type: "one_way" as "one_way" | "round_trip",
    pickup_address: "",
    dropoff_address: "",
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

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", trip?.organization_id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/organization/${trip.organization_id}`);
      return await response.json();
    },
    enabled: !!trip?.organization_id,
  });

  // Fetch drivers for dropdown
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers", trip?.organization_id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/drivers/organization/${trip.organization_id}`);
      return await response.json();
    },
    enabled: !!trip?.organization_id,
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Trip</h1>
            <p className="text-gray-600 mt-1">
              Trip #{trip.id.slice(-8)} • {getStatusBadge(trip.status)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteTripMutation.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleteTripMutation.isPending ? "Deleting..." : "Delete Trip"}
          </Button>
        </div>
      </div>

      {/* Trip Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trip Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current Client */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Client</span>
              </div>
              <p className="text-sm bg-gray-50 p-2 rounded">
                {trip.clients?.first_name} {trip.clients?.last_name}
              </p>
            </div>

            {/* Current Driver */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Driver</span>
              </div>
              <p className="text-sm bg-gray-50 p-2 rounded">
                {trip.drivers?.user_name || "Unassigned"}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id" className="text-sm font-medium">Client *</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData({...formData, client_id: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="driver_id" className="text-sm font-medium">Driver</Label>
                <Select 
                  value={formData.driver_id} 
                  onValueChange={(value) => setFormData({...formData, driver_id: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {drivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trip_type" className="text-sm font-medium">Trip Type *</Label>
                <Select 
                  value={formData.trip_type} 
                  onValueChange={(value) => setFormData({...formData, trip_type: value as "one_way" | "round_trip"})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_way">One Way</SelectItem>
                    <SelectItem value="round_trip">Round Trip</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({...formData, status: value as any})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
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
                <Label htmlFor="pickup_address" className="text-sm font-medium">Pickup Address *</Label>
                <Input
                  type="text"
                  value={formData.pickup_address}
                  onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                  placeholder="Enter pickup address"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dropoff_address" className="text-sm font-medium">Dropoff Address *</Label>
                <Input
                  type="text"
                  value={formData.dropoff_address}
                  onChange={(e) => setFormData({...formData, dropoff_address: e.target.value})}
                  placeholder="Enter dropoff address"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="scheduled_pickup_time" className="text-sm font-medium">Pickup Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_pickup_time}
                  onChange={(e) => setFormData({...formData, scheduled_pickup_time: e.target.value})}
                  className="mt-1"
                  required
                />
              </div>

              {formData.trip_type === "round_trip" && (
                <div>
                  <Label htmlFor="scheduled_return_time" className="text-sm font-medium">Return Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_return_time}
                    onChange={(e) => setFormData({...formData, scheduled_return_time: e.target.value})}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="passenger_count" className="text-sm font-medium">Passenger Count</Label>
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.passenger_count}
                  onChange={(e) => setFormData({...formData, passenger_count: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="special_requirements" className="text-sm font-medium">Special Requirements</Label>
              <Textarea
                value={formData.special_requirements}
                onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                placeholder="Wheelchair access, mobility aids, etc."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes or instructions"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
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
                {updateTripMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}