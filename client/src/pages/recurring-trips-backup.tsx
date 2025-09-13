import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, Clock, MapPin, Repeat, Trash2, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const recurringTripSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  timeOfDay: z.string().min(1, "Time is required"),
  pickupLocation: z.string().min(1, "Pickup location is required"),
  dropoffLocation: z.string().min(1, "Dropoff location is required"),
  isRoundTrip: z.boolean().default(false),
  durationWeeks: z.string().min(1, "Duration is required"),
});

type RecurringTripFormData = z.infer<typeof recurringTripSchema>;

const DAYS_OF_WEEK = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

const DURATION_OPTIONS = [
  { value: "4", label: "4 weeks" },
  { value: "8", label: "8 weeks" },
  { value: "12", label: "12 weeks" },
  { value: "16", label: "16 weeks" },
  { value: "24", label: "24 weeks" },
  { value: "52", label: "52 weeks (1 year)" },
];

export default function RecurringTrips() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const currentOrganizationId = user?.currentOrganizationId || 'monarch_competency';

  const form = useForm<RecurringTripFormData>({
    resolver: zodResolver(recurringTripSchema),
    defaultValues: {
      name: "",
      dayOfWeek: "",
      timeOfDay: "",
      pickupLocation: "",
      dropoffLocation: "",
      isRoundTrip: false,
      durationWeeks: "",
    },
  });

  const { data: recurringTrips = [], isLoading } = useQuery({
    queryKey: ["/api/recurring-trips", "organization", currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];
      const response = await apiRequest("GET", `/api/recurring-trips/organization/${currentOrganizationId}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!currentOrganizationId,
  });

  // Fetch frequent locations for current organization
  const { data: frequentLocationsData = [], isLoading: frequentLocationsLoading } = useQuery({
    queryKey: ["/api/frequentlocations", "organization", currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];
      const response = await apiRequest("GET", `/api/frequentlocations/organization/${currentOrganizationId}`);
      return await response.json();
    },
    enabled: !!currentOrganizationId,
  });

  // Fetch service areas for current organization
  const { data: serviceAreasData = [] } = useQuery({
    queryKey: ["/api/serviceareas", currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];
      const response = await apiRequest("GET", `/api/serviceareas/organization/${currentOrganizationId}`);
      return await response.json();
    },
    enabled: !!currentOrganizationId,
  });

  const frequentLocations = Array.isArray(frequentLocationsData) ? frequentLocationsData : [];
  const serviceAreas = Array.isArray(serviceAreasData) ? serviceAreasData : [];
  const locationsLoading = frequentLocationsLoading;

  // Debug logging
  console.log('Debug - Service areas loaded:', serviceAreas?.length || 0, serviceAreas);
  console.log('Debug - Frequent locations loaded:', frequentLocations?.length || 0, frequentLocations);
  console.log('Debug - Locations loading state:', locationsLoading);

  const createMutation = useMutation({
    mutationFn: async (data: RecurringTripFormData) => {
      return apiRequest("/api/recurring-trips", "POST", {
        ...data,
        organizationId: currentOrganizationId,
        dayOfWeek: parseInt(data.dayOfWeek),
        durationWeeks: parseInt(data.durationWeeks),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-trips", "organization", currentOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", "organization", currentOrganizationId] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Recurring trip created",
        description: `Generated ${data.tripsGenerated} trips for the next ${form.getValues().durationWeeks} weeks`,
      });
    },
    onError: (error) => {
      console.error("Error creating recurring trip:", error);
      toast({
        title: "Error",
        description: "Failed to create recurring trip",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/recurring-trips/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-trips", "organization", currentOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", "organization", currentOrganizationId] });
      toast({
        title: "Recurring trip deleted",
        description: "Future unassigned trips have been cancelled",
      });
    },
    onError: (error) => {
      console.error("Error deleting recurring trip:", error);
      toast({
        title: "Error",
        description: "Failed to delete recurring trip",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RecurringTripFormData) => {
    createMutation.mutate(data);
  };

  const getDayName = (dayNumber: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayNumber.toString())?.label || "Unknown";
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading recurring trips...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Trips</h1>
          <p className="text-muted-foreground">
            Set up recurring trips that generate automatically. Assign groups to trips as needed.
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Recurring Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Recurring Trip</DialogTitle>
              <DialogDescription>
                Set up a recurring trip schedule. Individual trips will be generated without groups assigned.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Weekly Grocery Trip" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timeOfDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Location</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter pickup address"
                            value={field.value}
                            onChange={field.onChange}
                            className="flex-1"
                          />
                        </FormControl>
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
                                      onClick={() => field.onChange(area.full_address || area.nickname)}
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
                                      onClick={() => field.onChange(location.full_address || location.name)}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                                    >
                                      <div className="font-medium">{location.name}</div>
                                      <div className="text-xs text-gray-500">{location.full_address}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {frequentLocations.length === 0 && serviceAreas.length === 0 && !locationsLoading && (
                                <div className="p-4 text-sm text-gray-500 text-center">
                                  No saved locations available
                                </div>
                              )}
                              {locationsLoading && (
                                <div className="p-4 text-sm text-blue-500 text-center">
                                  Loading locations...
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dropoffLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dropoff Location</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter dropoff address"
                            value={field.value}
                            onChange={field.onChange}
                            className="flex-1"
                          />
                        </FormControl>
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
                                      onClick={() => field.onChange(area.full_address || area.nickname)}
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
                                      onClick={() => field.onChange(location.full_address || location.name)}
                                      className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                                    >
                                      <div className="font-medium">{location.name}</div>
                                      <div className="text-xs text-gray-500">{location.full_address}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {frequentLocations.length === 0 && serviceAreas.length === 0 && !locationsLoading && (
                                <div className="p-4 text-sm text-gray-500 text-center">
                                  No saved locations available
                                </div>
                              )}
                              {locationsLoading && (
                                <div className="p-4 text-sm text-blue-500 text-center">
                                  Loading locations...
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isRoundTrip"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Round Trip</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Return to pickup location
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="durationWeeks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DURATION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Recurring Trip"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading Recurring Trips...</CardTitle>
            <CardDescription>
              Please wait while we load your recurring trip schedules.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : recurringTrips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Recurring Trips</CardTitle>
            <CardDescription>
              Create your first recurring trip to automatically generate future trips. Click the "Create Recurring Trip" button above to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {Array.isArray(recurringTrips) && recurringTrips.map((trip: any) => (
            <Card key={trip.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Repeat className="h-5 w-5" />
                      {trip.name}
                    </CardTitle>
                    <CardDescription>
                      Every {getDayName(trip.day_of_week)} at {formatTime(trip.time_of_day)}
                      {trip.is_round_trip && " (Round Trip)"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(trip.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span><strong>Pickup:</strong> {trip.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span><strong>Dropoff:</strong> {trip.dropoff_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span><strong>Duration:</strong> {trip.duration_weeks} weeks</span>
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