import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";
import QuickAddLocation from "../components/booking/quick-add-location";
import { Clock, X, ArrowLeft } from "lucide-react";

interface Trip {
  id: string;
  program_id: string;
  client_id: string;
  client_group_id?: string;
  driver_id?: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  trip_type: "one_way" | "round_trip";
  special_requirements?: string;
  notes?: string;
  status: string;
  client?: {
    first_name: string;
    last_name: string;
  };
  client_group?: {
    name: string;
  };
}

interface SpecialRequirement {
  id: string;
  name: string;
  is_custom: boolean;
  display_order: number;
}

export default function EditTrip() {
  const [, params] = useRoute("/trips/edit/:tripId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { level, selectedProgram } = useHierarchy();
  const tripId = params?.tripId;

  // Track where user came from for navigation after trip update
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== `/trips/edit/${tripId}`) {
      return;
    }
    
    // Store current path before navigating to trip edit
    const referrer = document.referrer;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const referrerPath = referrerUrl.pathname;
        // Extract base path to check for trip edit
        const basePath = referrerPath.replace(/^\/corporate-client\/[^/]+/, '').replace(/^\/corporate-client\/[^/]+\/program\/[^/]+/, '');
        
        // Only store if it's a valid app route and not the trip edit page (allow hierarchical URLs)
        if (referrerPath.startsWith('/') && 
            basePath !== `/trips/edit/${tripId}` && 
            referrerPath !== `/trips/edit/${tripId}` &&
            basePath !== '/' &&
            referrerPath !== '/') {
          sessionStorage.setItem('previousPath', referrerPath);
        }
      } catch (e) {
        // If referrer parsing fails, ignore
      }
    }
  }, [tripId]);

  // Fetch trip data
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ["/api/trips", tripId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trips/${tripId}`);
      return await response.json();
    },
    enabled: !!tripId,
  });

  // Determine which program to use: trip's program_id takes precedence over selectedProgram
  const effectiveProgram = trip?.program_id || selectedProgram;

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", effectiveProgram],
    queryFn: async () => {
      const endpoint = effectiveProgram ? `/api/clients/program/${effectiveProgram}` : "/api/clients";
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!effectiveProgram || !!trip, // Enable if we have a program or trip data
  });

  // Fetch client groups
  const { data: clientGroups = [] } = useQuery({
    queryKey: ["/api/client-groups", effectiveProgram],
    queryFn: async () => {
      const endpoint = effectiveProgram ? `/api/client-groups/program/${effectiveProgram}` : "/api/client-groups";
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!effectiveProgram || !!trip, // Enable if we have a program or trip data
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers", effectiveProgram],
    queryFn: async () => {
      const endpoint = effectiveProgram ? `/api/drivers/program/${effectiveProgram}` : "/api/drivers";
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!effectiveProgram || !!trip, // Enable if we have a program or trip data
  });

  // Fetch special requirements
  const { data: specialRequirements = [] } = useQuery({
    queryKey: ["/api/special-requirements"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/special-requirements");
      return await response.json();
    },
  });

  const [formData, setFormData] = useState({
    selectionType: "individual" as "individual" | "group",
    clientId: "",
    clientGroupId: "",
    driverId: "none",
    pickupAddress: "",
    dropoffAddress: "",
    scheduledDate: "",
    scheduledTime: "",
    returnTime: "",
    tripType: "one_way" as "one_way" | "round_trip",
    specialRequirementIds: [] as string[],
    specialRequirementOther: "",
    notes: "",
  });

  // Initialize form data when trip loads
  useEffect(() => {
    if (trip) {
      const pickupTime = new Date(trip.scheduled_pickup_time);
      const returnTime = trip.scheduled_return_time ? new Date(trip.scheduled_return_time) : null;
      
      // Parse special requirements (stored as comma-separated IDs or JSON)
      let specialReqIds: string[] = [];
      let specialReqOther = "";
      
      if (trip.special_requirements) {
        try {
          // Try parsing as JSON array
          const parsed = JSON.parse(trip.special_requirements);
          if (Array.isArray(parsed)) {
            specialReqIds = parsed;
          } else if (typeof parsed === 'object' && parsed.ids) {
            specialReqIds = parsed.ids;
            specialReqOther = parsed.other || "";
          }
        } catch {
          // If not JSON, try comma-separated
          specialReqIds = trip.special_requirements.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      setFormData({
        selectionType: trip.client_group_id ? "group" : "individual",
        clientId: trip.client_id || "",
        clientGroupId: trip.client_group_id || "",
        driverId: trip.driver_id || "none",
        pickupAddress: trip.pickup_address || "",
        dropoffAddress: trip.dropoff_address || "",
        scheduledDate: pickupTime.toISOString().split('T')[0],
        scheduledTime: pickupTime.toTimeString().slice(0, 5),
        returnTime: returnTime ? returnTime.toTimeString().slice(0, 5) : "",
        tripType: trip.trip_type || "one_way",
        specialRequirementIds: specialReqIds,
        specialRequirementOther: specialReqOther,
        notes: trip.notes || "",
      });
    }
  }, [trip]);

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      const createDateTimeString = (date: string, time: string) => {
        const localDateTime = new Date(`${date}T${time}:00`);
        if (isNaN(localDateTime.getTime())) {
          throw new Error(`Invalid date/time: ${date} ${time}`);
        }
        const offsetMinutes = localDateTime.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const offsetSign = offsetMinutes > 0 ? '-' : '+';
        const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
        const year = localDateTime.getFullYear();
        const month = String(localDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(localDateTime.getDate()).padStart(2, '0');
        const hours = String(localDateTime.getHours()).padStart(2, '0');
        const minutes = String(localDateTime.getMinutes()).padStart(2, '0');
        const seconds = String(localDateTime.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
      };

      const scheduledPickupTime = createDateTimeString(tripData.scheduledDate, tripData.scheduledTime);
      const scheduledReturnTime = tripData.tripType === "round_trip" && tripData.returnTime 
        ? createDateTimeString(tripData.scheduledDate, tripData.returnTime)
        : null;

      // Format special requirements
      let specialRequirementsValue: string | null = null;
      if (tripData.specialRequirementIds.length > 0 || tripData.specialRequirementOther) {
        const hasOther = tripData.specialRequirementIds.includes('sr_other');
        if (hasOther && tripData.specialRequirementOther) {
          specialRequirementsValue = JSON.stringify({
            ids: tripData.specialRequirementIds,
            other: tripData.specialRequirementOther
          });
        } else {
          specialRequirementsValue = JSON.stringify(tripData.specialRequirementIds);
        }
      }

      const apiData: any = {
        program_id: trip?.program_id,
        client_id: tripData.selectionType === "individual" ? tripData.clientId : undefined,
        client_group_id: tripData.selectionType === "group" ? tripData.clientGroupId : undefined,
        driver_id: tripData.driverId === "none" ? null : tripData.driverId || null,
        trip_type: tripData.tripType,
        pickup_address: tripData.pickupAddress,
        dropoff_address: tripData.dropoffAddress,
        scheduled_pickup_time: scheduledPickupTime,
        scheduled_return_time: scheduledReturnTime,
        special_requirements: specialRequirementsValue,
        notes: tripData.notes || null,
      };

      const response = await apiRequest("PATCH", `/api/trips/${tripId}`, apiData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trip Updated",
        description: "Trip has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      
      // Navigate back to previous page
      // Priority: trips/calendar pages > other valid pages > default to /trips
      const previousPath = sessionStorage.getItem('previousPath');
      
      // Prefer trips-related pages (including hierarchical URLs)
      const tripsRelatedPages = ['/trips', '/calendar', '/schedule'];
      const isTripsRelated = (path: string) => {
        // Extract base path from hierarchical URLs
        const basePath = path.replace(/^\/corporate-client\/[^/]+/, '').replace(/^\/corporate-client\/[^/]+\/program\/[^/]+/, '');
        return tripsRelatedPages.some(page => basePath === page || basePath.startsWith(page + '/') || path.includes(page));
      };
      
      // Valid paths to navigate to (exclude trip edit/new pages, but allow hierarchical URLs)
      const isValidPath = (path: string) => {
        if (!path || !path.startsWith('/')) return false;
        
        // Extract base path to check for trip edit/new
        const basePath = path.replace(/^\/corporate-client\/[^/]+/, '').replace(/^\/corporate-client\/[^/]+\/program\/[^/]+/, '');
        
        // Exclude trip edit/new pages and root
        if (basePath === `/trips/edit/${tripId}` || 
            basePath === '/trips/new' || 
            basePath === '/' ||
            path === `/trips/edit/${tripId}` ||
            path === '/trips/new' ||
            path === '/') {
          return false;
        }
        
        return true;
      };
      
      // Check if previous path is trips-related (highest priority)
      if (previousPath && isTripsRelated(previousPath) && isValidPath(previousPath)) {
        sessionStorage.removeItem('previousPath');
        setLocation(previousPath);
        return;
      }
      
      // Check referrer for trips-related pages
      const referrer = document.referrer;
      if (referrer && !referrer.includes(`/trips/edit/${tripId}`)) {
        try {
          const referrerUrl = new URL(referrer);
          const referrerPath = referrerUrl.pathname;
          if (isTripsRelated(referrerPath) && isValidPath(referrerPath)) {
            setLocation(referrerPath);
            return;
          }
        } catch (e) {
          // If referrer parsing fails, continue
        }
      }
      
      // Fallback to any valid previous path
      if (previousPath && isValidPath(previousPath)) {
        sessionStorage.removeItem('previousPath');
        setLocation(previousPath);
        return;
      }
      
      // Check referrer for any valid path
      if (referrer && !referrer.includes(`/trips/edit/${tripId}`)) {
        try {
          const referrerUrl = new URL(referrer);
          const referrerPath = referrerUrl.pathname;
          if (isValidPath(referrerPath)) {
            setLocation(referrerPath);
            return;
          }
        } catch (e) {
          // If referrer parsing fails, fall through to default
        }
      }
      
      // Default: navigate to trips page
      setLocation('/trips');
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectionType === "individual" && !formData.clientId) {
      toast({
        title: "Missing Information",
        description: "Please select a client.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.selectionType === "group" && !formData.clientGroupId) {
      toast({
        title: "Missing Information",
        description: "Please select a client group.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.pickupAddress || !formData.dropoffAddress || !formData.scheduledDate || !formData.scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.tripType === "round_trip" && !formData.returnTime) {
      toast({
        title: "Missing Return Time",
        description: "Please specify a return time for round-trip bookings.",
        variant: "destructive",
      });
      return;
    }

    updateTripMutation.mutate(formData);
  };

  const handleCancel = () => {
    // Navigate back to previous page using same logic as success handler
    const previousPath = sessionStorage.getItem('previousPath');
    
    // Prefer trips-related pages (including hierarchical URLs)
    const tripsRelatedPages = ['/trips', '/calendar', '/schedule'];
    const isTripsRelated = (path: string) => {
      // Extract base path from hierarchical URLs
      const basePath = path.replace(/^\/corporate-client\/[^/]+/, '').replace(/^\/corporate-client\/[^/]+\/program\/[^/]+/, '');
      return tripsRelatedPages.some(page => basePath === page || basePath.startsWith(page + '/') || path.includes(page));
    };
    
    // Valid paths to navigate to (exclude trip edit/new pages, but allow hierarchical URLs)
    const isValidPath = (path: string) => {
      if (!path || !path.startsWith('/')) return false;
      
      // Extract base path to check for trip edit/new
      const basePath = path.replace(/^\/corporate-client\/[^/]+/, '').replace(/^\/corporate-client\/[^/]+\/program\/[^/]+/, '');
      
      // Exclude trip edit/new pages and root
      if (basePath === `/trips/edit/${tripId}` || 
          basePath === '/trips/new' || 
          basePath === '/' ||
          path === `/trips/edit/${tripId}` ||
          path === '/trips/new' ||
          path === '/') {
        return false;
      }
      
      return true;
    };
    
    // Check if previous path is trips-related (highest priority)
    if (previousPath && isTripsRelated(previousPath) && isValidPath(previousPath)) {
      sessionStorage.removeItem('previousPath');
      setLocation(previousPath);
      return;
    }
    
    // Check referrer for trips-related pages
    const referrer = document.referrer;
    if (referrer && !referrer.includes(`/trips/edit/${tripId}`)) {
      try {
        const referrerUrl = new URL(referrer);
        const referrerPath = referrerUrl.pathname;
        if (isTripsRelated(referrerPath) && isValidPath(referrerPath)) {
          setLocation(referrerPath);
          return;
        }
      } catch (e) {
        // If referrer parsing fails, continue
      }
    }
    
    // Fallback to any valid previous path
    if (previousPath && isValidPath(previousPath)) {
      sessionStorage.removeItem('previousPath');
      setLocation(previousPath);
      return;
    }
    
    // Check referrer for any valid path
    if (referrer && !referrer.includes(`/trips/edit/${tripId}`)) {
      try {
        const referrerUrl = new URL(referrer);
        const referrerPath = referrerUrl.pathname;
        if (isValidPath(referrerPath)) {
          setLocation(referrerPath);
          return;
        }
      } catch (e) {
        // If referrer parsing fails, fall through to default
      }
    }
    
    // Default: navigate to trips page
    setLocation('/trips');
  };

  const handleSpecialRequirementToggle = (requirementId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        specialRequirementIds: [...formData.specialRequirementIds, requirementId],
      });
    } else {
      setFormData({
        ...formData,
        specialRequirementIds: formData.specialRequirementIds.filter(id => id !== requirementId),
        specialRequirementOther: requirementId === 'sr_other' ? "" : formData.specialRequirementOther,
      });
    }
  };

  if (tripLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading trip...</div>
        </CardContent>
      </Card>
    );
  }

  if (!trip) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Trip not found</div>
        </CardContent>
      </Card>
    );
  }

  const sortedSpecialRequirements = [...specialRequirements].sort((a, b) => a.display_order - b.display_order);
  const otherRequirement = sortedSpecialRequirements.find(r => r.is_custom);
  const standardRequirements = sortedSpecialRequirements.filter(r => !r.is_custom);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit Trip</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
              <Label>Client *</Label>
              <Select 
                value={formData.clientId} 
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
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
              <Label>Client Group *</Label>
              <Select 
                value={formData.clientGroupId} 
                onValueChange={(value) => setFormData({ ...formData, clientGroupId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client group" />
                </SelectTrigger>
                <SelectContent>
                  {clientGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.member_count || 0} clients)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Driver (Optional)</Label>
            <Select 
              value={formData.driverId} 
              onValueChange={(value) => setFormData({ ...formData, driverId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver or leave unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No driver assigned</SelectItem>
                {drivers.map((driver: any) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.users?.user_name || driver.user_name || 'Unknown Driver'}
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
            placeholder="Enter drop-off address"
            locationType="dropoff"
            label="Drop-off Address"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Trip Type</Label>
            <Select 
              value={formData.tripType} 
              onValueChange={(value) => setFormData({ ...formData, tripType: value as "one_way" | "round_trip" })}
            >
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
              <Label>Return Time</Label>
              <Input
                type="time"
                value={formData.returnTime}
                onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                placeholder="Select return time"
              />
            </div>
          )}

          {/* Special Requirements */}
          <div>
            <Label>Special Requirements</Label>
            <div className="space-y-2 mt-2">
              {standardRequirements.map((requirement) => (
                <div key={requirement.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sr-${requirement.id}`}
                    checked={formData.specialRequirementIds.includes(requirement.id)}
                    onCheckedChange={(checked) => handleSpecialRequirementToggle(requirement.id, checked as boolean)}
                  />
                  <label htmlFor={`sr-${requirement.id}`} className="text-sm cursor-pointer">
                    {requirement.name}
                  </label>
                </div>
              ))}
              {otherRequirement && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`sr-${otherRequirement.id}`}
                      checked={formData.specialRequirementIds.includes(otherRequirement.id)}
                      onCheckedChange={(checked) => handleSpecialRequirementToggle(otherRequirement.id, checked as boolean)}
                    />
                    <label htmlFor={`sr-${otherRequirement.id}`} className="text-sm cursor-pointer">
                      {otherRequirement.name}
                    </label>
                  </div>
                  {formData.specialRequirementIds.includes(otherRequirement.id) && (
                    <Input
                      placeholder="Specify other special requirement"
                      value={formData.specialRequirementOther}
                      onChange={(e) => setFormData({ ...formData, specialRequirementOther: e.target.value })}
                      className="ml-6"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any additional notes..."
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={updateTripMutation.isPending}
          >
            <Clock className="w-4 h-4 mr-2" />
            {updateTripMutation.isPending ? "Updating..." : "Update Trip"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

