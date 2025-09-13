import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, MapPin, ChevronDown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import OrganizationSelector from "@/components/OrganizationSelector";

interface TripFormData {
  selection_type: "individual" | "group";
  client_id: string;
  client_group_id: string;
  driver_id: string;
  trip_type: "one_way" | "round_trip";
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time: string;
  passenger_count: number;
  special_requirements: string;
  notes: string;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
}

const initialFormData: TripFormData = {
  selection_type: "individual",
  client_id: "",
  client_group_id: "",
  driver_id: "",
  trip_type: "one_way",
  pickup_address: "",
  dropoff_address: "",
  scheduled_pickup_time: "",
  scheduled_return_time: "",
  passenger_count: 1,
  special_requirements: "",
  notes: "",
  status: "scheduled",
};

interface TripCreationDialogProps {
  trigger: React.ReactNode;
  selectedBookingOrganization?: string;
  onOrganizationChange?: (orgId: string) => void;
}

export default function TripCreationDialog({ 
  trigger, 
  selectedBookingOrganization = "", 
  onOrganizationChange 
}: TripCreationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<TripFormData>(initialFormData);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Determine which organization to fetch data for
  const targetOrganization = user?.role === 'organization_user' && selectedBookingOrganization 
    ? selectedBookingOrganization 
    : currentOrganization?.id;

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery({
    queryKey: ["/api/clients", targetOrganization],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/organization/${targetOrganization}`);
      return await response.json();
    },
    enabled: !!targetOrganization,
  });

  // Fetch client groups for selection
  const { data: clientGroupsData } = useQuery({
    queryKey: ["/api/clientgroups", targetOrganization],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clientgroups/organization/${targetOrganization}`);
      return await response.json();
    },
    enabled: !!targetOrganization,
  });

  // Fetch service areas for location selection
  const { data: serviceAreasData } = useQuery({
    queryKey: ["/api/serviceareas", targetOrganization],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/serviceareas/organization/${targetOrganization}`);
      return await response.json();
    },
    enabled: !!targetOrganization,
  });

  // Fetch frequent locations for location selection
  const { data: frequentLocationsData } = useQuery({
    queryKey: ["/api/frequentlocations", "organization", targetOrganization],
    queryFn: async () => {
      if (!targetOrganization) return [];
      const response = await apiRequest("GET", `/api/frequentlocations/organization/${targetOrganization}`);
      return await response.json();
    },
    enabled: !!targetOrganization,
  });

  // Fetch drivers for dropdown
  const { data: driversData } = useQuery({
    queryKey: ["/api/drivers", targetOrganization],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/drivers/organization/${targetOrganization}`);
      return await response.json();
    },
    enabled: !!targetOrganization,
  });

  const clients = Array.isArray(clientsData) ? clientsData : [];
  const clientGroups = Array.isArray(clientGroupsData) ? clientGroupsData : [];
  const serviceAreas = Array.isArray(serviceAreasData) ? serviceAreasData : [];
  const frequentLocations = Array.isArray(frequentLocationsData) ? frequentLocationsData : [];
  const drivers = Array.isArray(driversData) ? driversData : [];

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (tripData: TripFormData) => {
      const apiData = {
        organizationId: targetOrganization,
        clientId: tripData.selection_type === "individual" ? tripData.client_id : undefined,
        clientGroupId: tripData.selection_type === "group" ? tripData.client_group_id : undefined,
        driverId: tripData.driver_id || undefined,
        tripType: tripData.trip_type,
        pickupAddress: tripData.pickup_address,
        dropoffAddress: tripData.dropoff_address,
        scheduledPickupTime: tripData.scheduled_pickup_time,
        scheduledReturnTime: tripData.trip_type === "round_trip" ? tripData.scheduled_return_time : undefined,
        passengerCount: tripData.passenger_count,
        specialRequirements: tripData.special_requirements || undefined,
        status: "scheduled"
      };
      // Use super admin endpoint if user is super admin, otherwise use regular endpoint
      const endpoint = user?.role === 'super_admin' ? "/api/super-admin/trips" : "/api/trips";
      return apiRequest("POST", endpoint, apiData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trip scheduled successfully",
      });
      setFormData(initialFormData);
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule trip",
        variant: "destructive",
      });
    },
  });

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on selection type
    if (formData.selection_type === "individual") {
      if (!formData.client_id || !formData.pickup_address || !formData.dropoff_address || !formData.scheduled_pickup_time) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.client_group_id || !formData.pickup_address || !formData.dropoff_address || !formData.scheduled_pickup_time) {
        toast({
          title: "Missing Information",
          description: "Please select a client group and fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    }
    
    createTripMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Schedule New Trip</DialogTitle>
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-600">Select from service areas and frequent locations, or enter custom addresses</p>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/frequent-locations', '_blank')}
              className="text-xs"
            >
              Manage Locations
            </Button>
          </div>
        </DialogHeader>
        <form onSubmit={handleCreateTrip} className="space-y-6">
          {/* Organization Selector for organization_user role */}
          {user?.role === 'organization_user' && (
            <OrganizationSelector
              selectedOrganizationId={selectedBookingOrganization || currentOrganization?.id || ''}
              onOrganizationChange={(orgId: string) => onOrganizationChange?.(orgId)}
            />
          )}
          
          {/* Client Selection Type */}
          <div>
            <Label className="text-sm font-medium">Select Clients *</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="individual"
                  checked={formData.selection_type === "individual"}
                  onChange={(e) => setFormData({...formData, selection_type: e.target.value as "individual" | "group", client_id: "", client_group_id: ""})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Individual Client</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="group"
                  checked={formData.selection_type === "group"}
                  onChange={(e) => setFormData({...formData, selection_type: e.target.value as "individual" | "group", client_id: "", client_group_id: ""})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Client Group</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {formData.selection_type === "individual" ? (
              <div>
                <Label htmlFor="client_id" className="text-sm font-medium">Individual Client *</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
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
            ) : (
              <div>
                <Label htmlFor="client_group_id" className="text-sm font-medium">Client Group *</Label>
                <Select value={formData.client_group_id} onValueChange={(value) => setFormData({...formData, client_group_id: value})}>
                  <SelectTrigger className="mt-1">
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
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                <SelectTrigger className="mt-1">
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trip_type" className="text-sm font-medium">Trip Type *</Label>
              <Select value={formData.trip_type} onValueChange={(value) => setFormData({...formData, trip_type: value as "one_way" | "round_trip"})}>
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
              <Label htmlFor="driver_id" className="text-sm font-medium">Driver (Optional)</Label>
              <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Auto-assign" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickup_address" className="text-sm font-medium">Pickup Address *</Label>
              <Input
                id="pickup_address"
                value={formData.pickup_address}
                onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                className="mt-1"
                placeholder="Enter pickup location"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor="dropoff_address" className="text-sm font-medium">Dropoff Address *</Label>
                  <Input
                    id="dropoff_address"
                    value={formData.dropoff_address}
                    onChange={(e) => setFormData({...formData, dropoff_address: e.target.value})}
                    className="mt-1"
                    placeholder="Enter destination"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-3 flex items-center gap-1 mt-6"
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
                              onClick={() => setFormData({...formData, dropoff_address: area.full_address || area.nickname})}
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
                              onClick={() => setFormData({...formData, dropoff_address: location.full_address || location.name})}
                              className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                            >
                              <div className="font-medium">{location.name}</div>
                              <div className="text-xs text-gray-500">{location.full_address}</div>
                              <div className="text-xs text-blue-600">{location.location_type}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_pickup_time" className="text-sm font-medium">Pickup Time *</Label>
              <Input
                id="scheduled_pickup_time"
                type="datetime-local"
                value={formData.scheduled_pickup_time}
                onChange={(e) => setFormData({...formData, scheduled_pickup_time: e.target.value})}
                className="mt-1"
              />
            </div>
            {formData.trip_type === "round_trip" && (
              <div>
                <Label htmlFor="scheduled_return_time" className="text-sm font-medium">Return Time</Label>
                <Input
                  id="scheduled_return_time"
                  type="datetime-local"
                  value={formData.scheduled_return_time}
                  onChange={(e) => setFormData({...formData, scheduled_return_time: e.target.value})}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passenger_count" className="text-sm font-medium">Passenger Count</Label>
              <Input
                id="passenger_count"
                type="number"
                min="1"
                value={formData.passenger_count}
                onChange={(e) => setFormData({...formData, passenger_count: parseInt(e.target.value) || 1})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="special_requirements" className="text-sm font-medium">Special Requirements</Label>
              <Input
                id="special_requirements"
                value={formData.special_requirements}
                onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                className="mt-1"
                placeholder="Any special requirements"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="mt-1"
              placeholder="Additional notes or instructions"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTripMutation.isPending}>
              {createTripMutation.isPending ? "Scheduling..." : "Schedule Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}