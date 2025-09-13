import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Clock, MapPin, ChevronDown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { apiRequest } from "@/lib/queryClient";

function SimpleBookingForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const [formData, setFormData] = useState({
    selectionType: "individual",
    clientId: "",
    clientGroupId: "",
    driverId: "unassigned",
    pickupAddress: "",
    dropoffAddress: "",
    scheduledDate: "",
    scheduledTime: "",
    returnTime: "",
    tripType: "one_way",
    isRecurring: false,
    frequency: "",
    daysOfWeek: [],
    duration: 4,
    tripNickname: ""
  });

  // Fetch clients for current organization
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch client groups for current organization
  const { data: clientGroups = [] } = useQuery({
    queryKey: ["/api/client-groups", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/client-groups/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch drivers for current organization
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/drivers/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch frequent locations for current organization
  const { data: frequentLocationsData = [], isLoading: frequentLocationsLoading } = useQuery({
    queryKey: ["/api/frequentlocations", "organization", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const response = await apiRequest("GET", `/api/frequentlocations/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch service areas for current organization
  const { data: serviceAreasData = [] } = useQuery({
    queryKey: ["/api/serviceareas", currentOrganization?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/serviceareas/organization/${currentOrganization?.id}`);
      return await response.json();
    },
    enabled: !!currentOrganization?.id,
  });

  const frequentLocations = Array.isArray(frequentLocationsData) ? frequentLocationsData : [];
  const serviceAreas = Array.isArray(serviceAreasData) ? serviceAreasData : [];



  // Get organization for selected client
  const selectedClient = clients.find((client: any) => client.id === formData.clientId);
  const clientOrganization = selectedClient?.organizationId;

  // Filter drivers by client's organization (they should all be from same org already)
  const availableDrivers = drivers.filter((driver: any) => 
    driver.primary_organization_id === clientOrganization || driver.primary_organization_id === currentOrganization?.id
  );

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      const scheduledPickupTime = `${tripData.scheduledDate}T${tripData.scheduledTime}:00`;
      const scheduledReturnTime = tripData.tripType === "round_trip" && tripData.returnTime 
        ? `${tripData.scheduledDate}T${tripData.returnTime}:00`
        : null;
      
      if (tripData.isRecurring) {
        // Create recurring trip
        const apiData = {
          organizationId: currentOrganization?.id,
          clientId: tripData.selectionType === "individual" ? tripData.clientId : undefined,
          clientGroupId: tripData.selectionType === "group" ? tripData.clientGroupId : undefined,
          driverId: tripData.driverId === "unassigned" ? null : tripData.driverId || null,
          tripType: tripData.tripType,
          pickupAddress: tripData.pickupAddress,
          dropoffAddress: tripData.dropoffAddress,
          scheduledTime: tripData.scheduledTime,
          returnTime: tripData.tripType === "round_trip" ? tripData.returnTime : null,
          frequency: tripData.frequency,
          daysOfWeek: tripData.daysOfWeek,
          duration: tripData.duration,
          startDate: tripData.scheduledDate,
          isActive: true
        };
        const response = await apiRequest("POST", "/api/recurring-trips", apiData);
        return response;
      } else {
        // Create regular trip
        const apiData = {
          organizationId: currentOrganization?.id,
          clientId: tripData.selectionType === "individual" ? tripData.clientId : undefined,
          clientGroupId: tripData.selectionType === "group" ? tripData.clientGroupId : undefined,
          driverId: tripData.driverId === "unassigned" ? null : tripData.driverId || null,
          tripType: tripData.tripType,
          pickupAddress: tripData.pickupAddress,
          dropoffAddress: tripData.dropoffAddress,
          scheduledPickupTime: scheduledPickupTime,
          scheduledReturnTime: scheduledReturnTime,
          passengerCount: 1,
          status: "scheduled"
        };
        
        const response = await apiRequest("POST", "/api/trips", apiData);
        return response;
      }
    },
    onSuccess: () => {
      toast({
        title: formData.isRecurring ? "Recurring Trip Scheduled" : "Trip Scheduled",
        description: formData.isRecurring ? "Recurring trip has been successfully created." : "Trip has been successfully scheduled.",
      });
      setFormData({
        selectionType: "individual",
        clientId: "",
        clientGroupId: "",
        driverId: "unassigned",
        pickupAddress: "",
        dropoffAddress: "",
        scheduledDate: "",
        scheduledTime: "",
        returnTime: "",
        tripType: "one_way",
        isRecurring: false,
        frequency: "",
        daysOfWeek: [],
        duration: 4
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      if (formData.isRecurring) {
        queryClient.invalidateQueries({ queryKey: ["/api/recurring-trips"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: formData.isRecurring ? "Recurring Trip Failed" : "Booking Failed",
        description: formData.isRecurring ? "Failed to create recurring trip. Please try again." : "Failed to book trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on selection type
    if (formData.selectionType === "individual") {
      if (!formData.clientId || !formData.pickupAddress || !formData.dropoffAddress || !formData.scheduledDate || !formData.scheduledTime) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.clientGroupId || !formData.pickupAddress || !formData.dropoffAddress || !formData.scheduledDate || !formData.scheduledTime) {
        toast({
          title: "Missing Information",
          description: "Please select a client group and fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    }

    // Recurring trip validation
    if (formData.isRecurring) {
      if (!formData.frequency || formData.daysOfWeek.length === 0) {
        toast({
          title: "Missing Recurring Information",
          description: "Please select frequency and days of the week for recurring trips.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (formData.tripType === "round_trip" && !formData.returnTime) {
      toast({
        title: "Missing Return Time",
        description: "Please specify a return time for round-trip bookings.",
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
          {/* Client Selection Type */}
          <div>
            <Label className="text-sm font-medium">Select Clients *</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="individual"
                  checked={formData.selectionType === "individual"}
                  onChange={(e) => setFormData({...formData, selectionType: e.target.value as "individual" | "group", clientId: "", clientGroupId: ""})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Individual Client</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="group"
                  checked={formData.selectionType === "group"}
                  onChange={(e) => setFormData({...formData, selectionType: e.target.value as "individual" | "group", clientId: "", clientGroupId: ""})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Client Group</span>
              </label>
            </div>
          </div>

          {formData.selectionType === "individual" ? (
            <div>
              <Label htmlFor="clientId">Individual Client *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                <SelectTrigger>
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
          ) : (
            <div>
              <Label htmlFor="clientGroupId">Client Group *</Label>
              <Select value={formData.clientGroupId} onValueChange={(value) => setFormData({ ...formData, clientGroupId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client group" />
                </SelectTrigger>
                <SelectContent>
                  {clientGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.clientCount || 0} clients)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="driverId">Driver (Optional)</Label>
            <Select 
              value={formData.driverId} 
              onValueChange={(value) => setFormData({ ...formData, driverId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver or leave unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No driver assigned</SelectItem>
                {availableDrivers.map((driver: any) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.user_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.clientId && availableDrivers.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No drivers available for this organization. The trip will be created without a driver assigned.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="pickupAddress">Pickup Address</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter pickup address"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="px-3 flex items-center gap-1"
                    type="button"
                  >
                    <MapPin className="w-4 h-4" />
                    Quick Add
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="max-h-64 overflow-y-auto">
                    {serviceAreas.length > 0 && (
                      <div className="p-2 border-b">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Service Areas</div>
                        {serviceAreas.map((area: any) => (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => setFormData({...formData, pickupAddress: area.full_address || area.nickname})}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                          >
                            <div className="font-medium">{area.nickname}</div>
                            <div className="text-xs text-gray-500">{area.full_address}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {frequentLocations.length > 0 && (
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Frequent Locations ({frequentLocations.length})
                        </div>
                        {frequentLocations.map((location: any) => (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => setFormData({...formData, pickupAddress: location.full_address || location.name})}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                          >
                            <div className="font-medium">{location.name}</div>
                            <div className="text-xs text-gray-500">{location.full_address}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {frequentLocations.length === 0 && serviceAreas.length === 0 && !frequentLocationsLoading && (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No saved locations available
                      </div>
                    )}
                    {frequentLocationsLoading && (
                      <div className="p-4 text-sm text-blue-500 text-center">
                        Loading locations...
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="dropoffAddress">Drop-off Address</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter drop-off address"
                value={formData.dropoffAddress}
                onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="px-3 flex items-center gap-1"
                    type="button"
                  >
                    <MapPin className="w-4 h-4" />
                    Quick Add
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="max-h-64 overflow-y-auto">
                    {serviceAreas.length > 0 && (
                      <div className="p-2 border-b">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Service Areas</div>
                        {serviceAreas.map((area: any) => (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => setFormData({...formData, dropoffAddress: area.full_address || area.nickname})}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                          >
                            <div className="font-medium">{area.nickname}</div>
                            <div className="text-xs text-gray-500">{area.full_address}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {frequentLocations.length > 0 && (
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Frequent Locations ({frequentLocations.length})
                        </div>
                        {frequentLocations.map((location: any) => (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => setFormData({...formData, dropoffAddress: location.full_address || location.name})}
                            className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                          >
                            <div className="font-medium">{location.name}</div>
                            <div className="text-xs text-gray-500">{location.full_address}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {frequentLocations.length === 0 && serviceAreas.length === 0 && !frequentLocationsLoading && (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No saved locations available
                      </div>
                    )}
                    {frequentLocationsLoading && (
                      <div className="p-4 text-sm text-blue-500 text-center">
                        Loading locations...
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="scheduledTime">Time</Label>
              <Input
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
              <SelectContent>
                <SelectItem value="one_way">One Way</SelectItem>
                <SelectItem value="round_trip">Round Trip</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.tripType === "round_trip" && (
            <div>
              <Label htmlFor="returnTime">Return Time</Label>
              <Input
                type="time"
                value={formData.returnTime}
                onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                placeholder="Select return time"
              />
            </div>
          )}

          {/* Recurring Trip Toggle */}
          <div>
            <Label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span>Make this a recurring trip</span>
            </Label>
          </div>

          {/* Recurring Trip Options */}
          {formData.isRecurring && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
              <div>
                <Label htmlFor="tripNickname">Trip Nickname</Label>
                <Input
                  type="text"
                  placeholder="e.g., Phoenix Gym, Therapy Center"
                  value={formData.tripNickname}
                  onChange={(e) => setFormData({ ...formData, tripNickname: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Give this recurring trip an easy-to-identify name</p>
              </div>

              <div>
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Days of Week *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <label key={day} className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={formData.daysOfWeek.includes(day)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...formData.daysOfWeek, day]
                            : formData.daysOfWeek.filter(d => d !== day);
                          setFormData({ ...formData, daysOfWeek: newDays });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration (weeks)</Label>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 4 })}
                  placeholder="4"
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={createTripMutation.isPending}
          >
            <Clock className="w-4 h-4 mr-2" />
            {createTripMutation.isPending ? "Scheduling..." : (formData.isRecurring ? "Schedule Recurring Trip" : "Schedule Trip")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export { SimpleBookingForm };
export default SimpleBookingForm;