import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar, Clock } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import QuickAddLocation from "./quick-add-location";

function QuickBookingForm() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    clientId: "",
    pickupAddress: "",
    dropoffAddress: "",
    scheduledDate: "",
    scheduledTime: "",
    tripType: "one_way"
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
    enabled: !!(selectedProgram || selectedCorporateClient),
  });

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      const scheduledPickupTime = `${tripData.scheduledDate}T${tripData.scheduledTime}:00`;
      
      const apiData = {
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        program_id: selectedProgram,
        client_id: tripData.clientId,
        trip_type: tripData.tripType,
        pickup_address: tripData.pickupAddress,
        dropoff_address: tripData.dropoffAddress,
        scheduled_pickup_time: scheduledPickupTime,
        passenger_count: 1,
        status: "scheduled",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return apiRequest("POST", "/api/trips", apiData);
    },
    onSuccess: () => {
      toast({
        title: "Trip Booked",
        description: "Trip has been successfully scheduled.",
      });
      setFormData({
        clientId: "",
        pickupAddress: "",
        dropoffAddress: "",
        scheduledDate: "",
        scheduledTime: "",
        tripType: "one_way"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: "Failed to book trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.pickupAddress || !formData.dropoffAddress || !formData.scheduledDate || !formData.scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    createTripMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Quick Booking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clientId">Client</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id} className="text-gray-900 hover:bg-gray-100">
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <QuickAddLocation
            value={formData.pickupAddress}
            onChange={(value) => setFormData({ ...formData, pickupAddress: value })}
            placeholder="Enter pickup address"
            locationType="pickup"
            label="Pickup Address"
            required
          />

          <QuickAddLocation
            value={formData.dropoffAddress}
            onChange={(value) => setFormData({ ...formData, dropoffAddress: value })}
            placeholder="Enter dropoff address"
            locationType="dropoff"
            label="Dropoff Address"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="scheduledTime">Time</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tripType">Trip Type</Label>
            <Select value={formData.tripType} onValueChange={(value) => setFormData({ ...formData, tripType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                <SelectItem value="one_way" className="text-gray-900 hover:bg-gray-100">One Way</SelectItem>
                <SelectItem value="round_trip" className="text-gray-900 hover:bg-gray-100">Round Trip</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            <Clock className="w-4 h-4 mr-2" />
            Book Trip
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export { QuickBookingForm };
export default QuickBookingForm;