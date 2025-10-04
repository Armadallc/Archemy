import React, { useState, useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { 
  Clock, 
  MapPin, 
  User, 
  Car, 
  Users, 
  Edit, 
  Calendar,
  Phone,
  FileText,
  Trash2,
  Play,
  Square,
  Navigation,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { TripTracker } from "../services/tripTracking";
import { checkLocationPermission, LocationError, type LocationPermissionState } from "../lib/location";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";

interface Trip {
  id: string;
  program_id: string; // Updated from organization_id
  client_id: string;
  driver_id?: string; // Made optional
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  status: string;
  passenger_count: number;
  notes?: string;
  trip_type: string;
  special_requirements?: string;
  // Updated client data structure for hierarchy
  client_first_name?: string;
  client_last_name?: string;
  client_phone?: string;
  // Updated driver data structure for hierarchy
  driver_name?: string;
  driver_license?: string;
  vehicle_info?: string;
  recurring_trip_id?: string;
  // Trip tracking fields
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  distance_miles?: number;
  fuel_cost?: number;
  driver_notes?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
}

interface TripHoverCardProps {
  trip: Trip;
  children: React.ReactNode;
}

const statusColors = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-green-50 text-green-700 border-green-200", 
  in_progress: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-gray-50 text-gray-700 border-gray-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export function TripHoverCard({ trip, children }: TripHoverCardProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  // Trip tracking state
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>('unknown');
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [fuelCost, setFuelCost] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [manualDistance, setManualDistance] = useState('');

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission().then(setLocationPermission);
  }, []);

  const handleEditTrip = () => {
    setLocation(`/trips/edit/${trip.id}`);
  };

  // Trip tracking mutations
  const startTripMutation = useMutation({
    mutationFn: async () => {
      setIsTrackingLocation(true);
      try {
        return await TripTracker.startTrip(trip.id);
      } catch (error) {
        if (error instanceof LocationError && error.code === 'PERMISSION_DENIED') {
          setShowManualEntry(true);
          throw error;
        }
        throw error;
      } finally {
        setIsTrackingLocation(false);
      }
    },
    onSuccess: (data) => {
      // Invalidate trips queries based on hierarchy level
      const queryKeys = ["/api/trips"];
      if (level === 'program' && selectedProgram) {
        queryKeys.push(`/api/trips/program/${selectedProgram}`);
      } else if (level === 'client' && selectedCorporateClient) {
        queryKeys.push(`/api/trips/corporate-client/${selectedCorporateClient}`);
      }
      
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      
      toast({
        title: "Trip Started",
        description: "Trip tracking started with GPS location captured"
      });
      
      // Open navigation to pickup address
      TripTracker.openNavigation(trip.pickup_address);
    },
    onError: (error) => {
      if (error instanceof LocationError) {
        toast({
          title: "Location Access Required",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error Starting Trip",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      }
    }
  });

  const startTripManualMutation = useMutation({
    mutationFn: async () => {
      return await TripTracker.startTripManual(trip.id, manualLocation);
    },
    onSuccess: () => {
      // Invalidate trips queries based on hierarchy level
      const queryKeys = ["/api/trips"];
      if (level === 'program' && selectedProgram) {
        queryKeys.push(`/api/trips/program/${selectedProgram}`);
      } else if (level === 'client' && selectedCorporateClient) {
        queryKeys.push(`/api/trips/corporate-client/${selectedCorporateClient}`);
      }
      
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      
      toast({
        title: "Trip Started",
        description: "Trip started manually without GPS location"
      });
      
      setShowManualEntry(false);
      setManualLocation('');
      
      // Open navigation to pickup address
      TripTracker.openNavigation(trip.pickup_address);
    },
    onError: (error) => {
      toast({
        title: "Error Starting Trip",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const completeTripMutation = useMutation({
    mutationFn: async () => {
      const fuel = fuelCost ? parseFloat(fuelCost) : undefined;
      const distance = manualDistance ? parseFloat(manualDistance) : undefined;
      
      try {
        return await TripTracker.completeTrip(trip.id, fuel, driverNotes);
      } catch (error) {
        if (error instanceof LocationError) {
          // Fallback to manual completion
          return await TripTracker.completeTripManual(trip.id, fuel, driverNotes, distance);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate trips queries based on hierarchy level
      const queryKeys = ["/api/trips"];
      if (level === 'program' && selectedProgram) {
        queryKeys.push(`/api/trips/program/${selectedProgram}`);
      } else if (level === 'client' && selectedCorporateClient) {
        queryKeys.push(`/api/trips/corporate-client/${selectedCorporateClient}`);
      }
      
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      
      toast({
        title: "Trip Completed",
        description: "Trip completed successfully with tracking data"
      });
      
      setShowCompletionDialog(false);
      setFuelCost('');
      setDriverNotes('');
      setManualDistance('');
    },
    onError: (error) => {
      toast({
        title: "Error Completing Trip",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Delete mutation for both regular and recurring trips
  const deleteMutation = useMutation({
    mutationFn: async ({ scope }: { scope?: 'single' | 'all_future' }) => {
      const isRecurring = !!trip.recurring_trip_id;
      
      console.log('🗑️ Frontend delete mutation started:', { 
        tripId: trip.id, 
        isRecurring,
        recurringTripId: trip.recurring_trip_id,
        scope 
      });
      
      // All deletions now go through /api/trips/:id with unified logic
      const response = await apiRequest("DELETE", `/api/trips/${trip.id}`, { scope });
      console.log('🗑️ Trip delete response:', response);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate all trip-related queries with specific patterns
      const queryKeys = ["/api/trips"];
      if (level === 'program' && selectedProgram) {
        queryKeys.push(`/api/trips/program/${selectedProgram}`);
      } else if (level === 'client' && selectedCorporateClient) {
        queryKeys.push(`/api/trips/corporate-client/${selectedCorporateClient}`);
      }
      
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.includes('/api/recurring-trips');
        }
      });
      
      const scope = variables.scope;
      const message = scope === 'all_future' 
        ? "All future recurring trips deleted successfully"
        : "Trip deleted successfully";
      
      toast({
        title: "Success",
        description: message
      });
    },
    onError: (error) => {
      console.error('🗑️ Delete mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Check if user can start trips (only drivers and super admins)
  const canStartTrips = user?.role === 'driver' || user?.role === 'super_admin';

  // Get client display name - updated for hierarchy system
  const clientName = trip.client_first_name && trip.client_last_name
    ? `${trip.client_first_name} ${trip.client_last_name}`.trim()
    : 'Unknown Client';
  
  // Format pickup time
  const pickupTime = trip.scheduled_pickup_time 
    ? format(parseISO(trip.scheduled_pickup_time), 'h:mm a')
    : 'Time not set';

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-[400px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg" side="right" align="start">
        <div className="space-y-4 p-4 bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-semibold text-base leading-none">
                {clientName}
              </h4>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-2 py-1 rounded-full border ${statusColors[trip.status as keyof typeof statusColors] || statusColors.scheduled}`}
                >
                  {trip.status.charAt(0).toUpperCase() + trip.status.slice(1).replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{pickupTime}</span>
              {trip.scheduled_return_time && (
                <span className="text-muted-foreground">
                  {' - '}
                  {format(parseISO(trip.scheduled_return_time), 'h:mm a')}
                </span>
              )}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {trip.scheduled_pickup_time && format(parseISO(trip.scheduled_pickup_time), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>

          {/* Client Contact - updated for hierarchy system */}
          {trip.client_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{trip.client_phone}</span>
            </div>
          )}

          {/* Driver Info - updated for hierarchy system */}
          {trip.driver_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">{trip.driver_name}</span>
                {trip.vehicle_info && (
                  <span className="text-muted-foreground ml-1">({trip.vehicle_info})</span>
                )}
              </div>
            </div>
          )}

          {/* Addresses */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium">From:</span>
                <p className="text-xs text-muted-foreground mt-0.5">{trip.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium">To:</span>
                <p className="text-xs text-muted-foreground mt-0.5">{trip.dropoff_address}</p>
              </div>
            </div>
          </div>

          {/* Passenger Count */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{trip.passenger_count || 1}</span> passenger{(trip.passenger_count || 1) !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Special Requirements */}
          {trip.special_requirements && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Special Requirements</span>
              </div>
              <div className="ml-6">
                <p className="text-xs text-muted-foreground">{trip.special_requirements}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {trip.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Notes</span>
              </div>
              <div className="ml-6">
                <p className="text-xs text-muted-foreground">{trip.notes}</p>
              </div>
            </div>
          )}

          {/* Trip Tracking Information */}
          {(trip.distance_miles || trip.fuel_cost || trip.driver_notes) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Trip Tracking</span>
                </div>
                <div className="ml-6 space-y-1">
                  {trip.distance_miles && (
                    <p className="text-xs text-muted-foreground">
                      Distance: {trip.distance_miles} miles
                    </p>
                  )}
                  {trip.fuel_cost && (
                    <p className="text-xs text-muted-foreground">
                      Fuel Cost: ${trip.fuel_cost.toFixed(2)}
                    </p>
                  )}
                  {trip.driver_notes && (
                    <p className="text-xs text-muted-foreground">
                      Notes: {trip.driver_notes}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Location Permission Warning */}
          {locationPermission === 'denied' && trip.status === 'scheduled' && (
            <>
              <Separator />
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Location Access Needed</p>
                    <p className="text-yellow-700 text-xs mt-1">
                      Enable location access for automatic trip tracking, or use manual entry option.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Trip Tracking Actions - Only for Drivers and Super Admins */}
          {trip.status === 'scheduled' && canStartTrips && (
            <div className="space-y-2">
              {!showManualEntry ? (
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => startTripMutation.mutate()}
                  disabled={startTripMutation.isPending || isTrackingLocation}
                >
                  {isTrackingLocation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isTrackingLocation ? 'Getting Location...' : 'Start Trip'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="manual-location" className="text-sm">
                    Starting Location (Optional)
                  </Label>
                  <Input
                    id="manual-location"
                    placeholder="Enter pickup location"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => startTripManualMutation.mutate()}
                      disabled={startTripManualMutation.isPending}
                    >
                      {startTripManualMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start Trip
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowManualEntry(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {trip.status === 'in_progress' && canStartTrips && (
            <div className="space-y-2">
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => setShowCompletionDialog(true)}
              >
                <Square className="h-4 w-4 mr-2" />
                Complete Trip
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full"
                onClick={() => TripTracker.openNavigation(trip.dropoff_address)}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate to Destination
              </Button>
            </div>
          )}

          {/* Trip Completion Dialog */}
          <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Trip</DialogTitle>
                <DialogDescription>
                  Add optional details about the completed trip.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fuel-cost">Fuel Cost (Optional)</Label>
                  <Input
                    id="fuel-cost"
                    type="number"
                    step="0.01"
                    placeholder="Enter fuel cost"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-distance">Distance (Optional)</Label>
                  <Input
                    id="manual-distance"
                    type="number"
                    step="0.1"
                    placeholder="Enter distance in miles"
                    value={manualDistance}
                    onChange={(e) => setManualDistance(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Only needed if GPS tracking failed
                  </p>
                </div>
                <div>
                  <Label htmlFor="driver-notes">Driver Notes (Optional)</Label>
                  <Textarea
                    id="driver-notes"
                    placeholder="Add any notes about the trip"
                    value={driverNotes}
                    onChange={(e) => setDriverNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCompletionDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => completeTripMutation.mutate()}
                  disabled={completeTripMutation.isPending}
                >
                  {completeTripMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  Complete Trip
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1" 
              onClick={handleEditTrip}
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            
            {trip.recurring_trip_id ? (
              // Recurring trip delete options
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Recurring Trip</AlertDialogTitle>
                    <AlertDialogDescription>
                      This is part of a recurring trip series. What would you like to delete?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={() => deleteMutation.mutate({ scope: 'single' })}
                      disabled={deleteMutation.isPending}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Delete This Trip Only
                    </Button>
                    <Button
                      onClick={() => deleteMutation.mutate({ scope: 'all_future' })}
                      disabled={deleteMutation.isPending}
                      variant="destructive"
                      className="w-full sm:w-auto"
                    >
                      Delete All Future Trips
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              // Regular trip delete
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this trip? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate({})}
                      disabled={deleteMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Trip
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
