import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Clock, MapPin, Plus, Edit, Trash, ChevronDown } from "lucide-react";

const recurringTripSchema = z.object({
  tripName: z.string().min(1, "Trip name is required"),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  dropoffAddress: z.string().min(1, "Dropoff address is required"),
  isRoundTrip: z.boolean().default(false),
  scheduledTime: z.string().min(1, "Time is required"),
  frequency: z.string().min(1, "Frequency is required"),
  weekdays: z.array(z.string()).min(1, "At least one day must be selected"),
  durationWeeks: z.string().min(1, "Duration is required"),
});

type RecurringTripFormData = z.infer<typeof recurringTripSchema>;

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const WEEKDAY_OPTIONS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const DURATION_OPTIONS = [
  { value: "2", label: "2 weeks" },
  { value: "4", label: "4 weeks" },
  { value: "8", label: "8 weeks" },
  { value: "12", label: "12 weeks" },
  { value: "24", label: "24 weeks" },
  { value: "52", label: "52 weeks" },
];

export default function RecurringTrips() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const currentOrganizationId = currentOrganization?.id;
  
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<RecurringTripFormData>({
    resolver: zodResolver(recurringTripSchema),
    defaultValues: {
      tripName: "",
      pickupAddress: "",
      dropoffAddress: "",
      isRoundTrip: false,
      scheduledTime: "",
      frequency: "",
      weekdays: [],
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
      const response = await apiRequest("POST", `/api/recurring-trips`, {
        ...data,
        organizationId: currentOrganizationId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-trips"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Recurring trip created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create recurring trip",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RecurringTripFormData) => {
    createMutation.mutate(data);
  };

  // Quick Add Location Component
  const QuickAddPopover = ({ field, placeholder }: { field: any; placeholder: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <MapPin className="w-4 h-4" />
          Quick Add
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-h-80" align="end">
        <div className="overflow-y-auto max-h-72" style={{ scrollbarWidth: 'thin' }}>
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
  );

  if (isLoading) {
    return <div className="p-6">Loading recurring trips...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring Trips</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Recurring Trip</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="tripName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter trip name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pickupAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Address</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Enter pickup address" {...field} />
                        </FormControl>
                        <QuickAddPopover field={field} placeholder="pickup address" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dropoffAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dropoff Address</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Enter dropoff address" {...field} />
                        </FormControl>
                        <QuickAddPopover field={field} placeholder="dropoff address" />
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
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((option) => (
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
                
                <FormField
                  control={form.control}
                  name="weekdays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days of Week</FormLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {WEEKDAY_OPTIONS.map((day) => (
                          <label
                            key={day.value}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={field.value.includes(day.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, day.value]);
                                } else {
                                  field.onChange(field.value.filter((v) => v !== day.value));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{day.label}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
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
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Schedule Trip"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {recurringTrips.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No recurring trips scheduled yet.</p>
            </CardContent>
          </Card>
        ) : (
          recurringTrips.map((trip: any) => (
            <Card key={trip.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{trip.trip_name}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Pickup:</strong> {trip.pickup_address}</p>
                    <p><strong>Dropoff:</strong> {trip.dropoff_address}</p>
                  </div>
                  <div>
                    <p><strong>Time:</strong> {trip.scheduled_time}</p>
                    <p><strong>Frequency:</strong> {trip.frequency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}