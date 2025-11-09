import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Calendar, Clock, MapPin, ChevronDown, Plus, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";
import { apiRequest } from "../../lib/queryClient";
import QuickAddLocation from "./quick-add-location";

function SimpleBookingForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();

  // Track where user came from for navigation after trip creation
  useEffect(() => {
    // Store current path before navigating to trip creation
    // Only store if we're not already on the trip creation page
    const currentPath = window.location.pathname;
    const basePath = currentPath.replace(/^\/corporate-client\/[^/]+/, '').replace(/^\/corporate-client\/[^/]+\/program\/[^/]+/, '');
    
    if (basePath !== '/trips/new' && currentPath !== '/trips/new') {
      // Store the full path (including hierarchical parts) if valid
      if (currentPath && currentPath !== '/' && basePath !== '/') {
        sessionStorage.setItem('previousPath', currentPath);
      }
    } else {
      // If we're already on /trips/new, try to get the referrer
      const referrer = document.referrer;
      if (referrer) {
        try {
          const referrerUrl = new URL(referrer);
          const referrerPath = referrerUrl.pathname;
          const referrerBasePath = referrerPath.replace(/^\/corporate-client\/[^/]+/, '').replace(/^\/corporate-client\/[^/]+\/program\/[^/]+/, '');
          
          // Only store if it's a valid app route and not the trip creation page (allow hierarchical URLs)
          if (referrerPath.startsWith('/') && 
              referrerBasePath !== '/trips/new' && 
              referrerPath !== '/trips/new' &&
              referrerBasePath !== '/' &&
              referrerPath !== '/') {
            sessionStorage.setItem('previousPath', referrerPath);
          }
        } catch (e) {
          // If referrer parsing fails, ignore
        }
      }
    }
  }, []);

  const [formData, setFormData] = useState({
    selectionType: "individual",
    clientId: "",
    clientIds: [] as string[], // Array for multiple individual clients
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
    daysOfWeek: [] as string[],
    duration: 4,
    tripNickname: "",
    specialRequirementIds: [] as string[],
    specialRequirementOther: "",
    notes: ""
  });

  // Local state for program selection (for super admins)
  const [selectedProgramLocal, setSelectedProgramLocal] = useState<string>("");
  const [selectedCorporateClientLocal, setSelectedCorporateClientLocal] = useState<string>("");

  // Determine which program/corporate client to use
  const effectiveProgram = selectedProgram || selectedProgramLocal;
  const effectiveCorporateClient = selectedCorporateClient || selectedCorporateClientLocal;

  // Fetch corporate clients (for super admins)
  const { data: corporateClients = [] } = useQuery({
    queryKey: ["/api/corporate-clients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/corporate/clients");
      return await response.json();
    },
    enabled: level === 'corporate' && !selectedCorporateClient,
  });

  // Fetch programs (for super admins or when corporate client is selected)
  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs", effectiveCorporateClient],
    queryFn: async () => {
      let endpoint = "/api/programs";
      if (effectiveCorporateClient) {
        endpoint = `/api/programs/corporate-client/${effectiveCorporateClient}`;
      }
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: (level === 'corporate' && (!selectedProgram || !!effectiveCorporateClient)) || 
              (level === 'client' && user?.role === 'corporate_admin' && !!effectiveCorporateClient),
  });

  // Auto-select program for super admins or corporate admins
  React.useEffect(() => {
    // For super admins: auto-select first program when corporate client is selected
    if (level === 'corporate' && !selectedProgram && programs.length > 0 && !selectedProgramLocal) {
      setSelectedProgramLocal(programs[0].id);
    }
    
    // For corporate admins: auto-select program if they have only one program
    // or use their primary_program_id if available
    if (level === 'client' && user?.role === 'corporate_admin' && !selectedProgram && !selectedProgramLocal) {
      const primaryProgramId = (user as any).primary_program_id;
      
      if (primaryProgramId) {
        // Use primary program ID if available
        setSelectedProgramLocal(primaryProgramId);
      } else if (programs.length === 1) {
        // Auto-select if only one program available
        setSelectedProgramLocal(programs[0].id);
      } else if (programs.length > 1) {
        // If multiple programs, still auto-select first one (user can change)
        setSelectedProgramLocal(programs[0].id);
      }
    }
  }, [level, selectedProgram, programs, selectedProgramLocal, user]);

  // Fetch clients based on current hierarchy level
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients", level, effectiveCorporateClient, effectiveProgram],
    queryFn: async () => {
      let endpoint = "/api/clients";
      
      if (level === 'program' && effectiveProgram) {
        endpoint = `/api/clients/program/${effectiveProgram}`;
      } else if (level === 'client' && effectiveCorporateClient) {
        endpoint = `/api/clients/corporate-client/${effectiveCorporateClient}`;
      } else if (level === 'corporate' && effectiveProgram) {
        endpoint = `/api/clients/program/${effectiveProgram}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!(effectiveProgram || effectiveCorporateClient),
  });

  // Fetch client groups based on current hierarchy level
  const { data: clientGroups = [] } = useQuery({
    queryKey: ["/api/client-groups", level, effectiveCorporateClient, effectiveProgram],
    queryFn: async () => {
      let endpoint = "/api/client-groups";
      
      if (level === 'program' && effectiveProgram) {
        endpoint = `/api/client-groups/program/${effectiveProgram}`;
      } else if (level === 'client' && effectiveCorporateClient) {
        endpoint = `/api/client-groups/corporate-client/${effectiveCorporateClient}`;
      } else if (level === 'corporate' && effectiveProgram) {
        endpoint = `/api/client-groups/program/${effectiveProgram}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!(effectiveProgram || effectiveCorporateClient),
  });

  // Fetch drivers based on current hierarchy level
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers", level, effectiveCorporateClient, effectiveProgram],
    queryFn: async () => {
      let endpoint = "/api/drivers";
      
      if (level === 'program' && effectiveProgram) {
        endpoint = `/api/drivers/program/${effectiveProgram}`;
      } else if (level === 'client' && effectiveCorporateClient) {
        endpoint = `/api/drivers/corporate-client/${effectiveCorporateClient}`;
      } else if (level === 'corporate' && effectiveProgram) {
        endpoint = `/api/drivers/program/${effectiveProgram}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      console.log('🔍 Drivers API response:', data);
      return data;
    },
    enabled: !!(effectiveProgram || effectiveCorporateClient),
  });

  // Fetch frequent locations based on current hierarchy level
  const { data: frequentLocationsData = [], isLoading: frequentLocationsLoading } = useQuery({
    queryKey: ["/api/frequent-locations", level, selectedCorporateClient, selectedProgram],
    queryFn: async () => {
      if (!selectedProgram && !selectedCorporateClient) return [];
      
      let endpoint = "/api/frequent-locations";
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/frequent-locations/program/${selectedProgram}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/frequent-locations/corporate-client/${selectedCorporateClient}`;
      } else if (level === 'corporate' && selectedProgram) {
        endpoint = `/api/frequent-locations/program/${selectedProgram}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!(selectedProgram || selectedCorporateClient),
  });

  // Fetch locations based on current hierarchy level
  const { data: locationsData = [] } = useQuery({
    queryKey: ["/api/locations", level, effectiveCorporateClient, effectiveProgram],
    queryFn: async () => {
      let endpoint = "/api/locations";
      
      if (level === 'program' && effectiveProgram) {
        endpoint = `/api/locations/program/${effectiveProgram}`;
      } else if (level === 'client' && effectiveCorporateClient) {
        endpoint = `/api/locations/corporate-client/${effectiveCorporateClient}`;
      } else if (level === 'corporate' && effectiveProgram) {
        endpoint = `/api/locations/program/${effectiveProgram}`;
      }
      
      const response = await apiRequest("GET", endpoint);
      return await response.json();
    },
    enabled: !!(effectiveProgram || effectiveCorporateClient),
  });

  const frequentLocations = Array.isArray(frequentLocationsData) ? frequentLocationsData : [];
  const locations = Array.isArray(locationsData) ? locationsData : [];

  // Fetch special requirements
  const { data: specialRequirements = [] } = useQuery({
    queryKey: ["/api/special-requirements"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/special-requirements");
      return await response.json();
    },
  });

  // Get program for selected client
  const selectedClient = clients.find((client: any) => client.id === formData.clientId);
  const clientProgram = selectedClient?.program_id;

  // Filter drivers by client's program (they should all be from same program already)
  const availableDrivers = drivers.filter((driver: any) => 
    driver.program_id === clientProgram || driver.program_id === effectiveProgram
  );
  
  console.log('🔍 Available drivers:', availableDrivers);
  console.log('🔍 Drivers count:', drivers.length);
  console.log('🔍 Available drivers count:', availableDrivers.length);
  console.log('🔍 effectiveProgram:', effectiveProgram);
  console.log('🔍 selectedProgram:', selectedProgram);
  console.log('🔍 selectedProgramLocal:', selectedProgramLocal);
  console.log('🔍 clientProgram:', clientProgram);

  // Helper function to format special requirements
  const formatSpecialRequirements = (ids: string[], other: string): string | null => {
    if (ids.length === 0 && !other) return null;
    const hasOther = ids.includes('sr_other');
    if (hasOther && other) {
      return JSON.stringify({ ids, other });
    }
    return JSON.stringify(ids);
  };

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      // Create datetime strings with proper timezone handling
      // The date and time inputs are in the user's local timezone
      // We need to preserve this when storing to the database
      const createDateTimeString = (date: string, time: string) => {
        // Create a date object from the date and time strings
        // JavaScript interprets this as local time (user's timezone)
        const localDateTime = new Date(`${date}T${time}:00`);
        
        // Check if the date is valid
        if (isNaN(localDateTime.getTime())) {
          throw new Error(`Invalid date/time: ${date} ${time}`);
        }
        
        // Get timezone offset in minutes (returns offset from UTC)
        // Positive offset means behind UTC (e.g., MST is +420 minutes = UTC-7)
        // Negative offset means ahead of UTC
        const offsetMinutes = localDateTime.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        
        // Format offset as +/-HH:MM
        // Note: getTimezoneOffset() returns positive for timezones behind UTC
        // So we need to invert the sign for ISO format
        const offsetSign = offsetMinutes > 0 ? '-' : '+';
        const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
        
        // Format the date components from the local date object
        const year = localDateTime.getFullYear();
        const month = String(localDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(localDateTime.getDate()).padStart(2, '0');
        const hours = String(localDateTime.getHours()).padStart(2, '0');
        const minutes = String(localDateTime.getMinutes()).padStart(2, '0');
        const seconds = String(localDateTime.getSeconds()).padStart(2, '0');
        
        // Return ISO 8601 string with timezone offset
        // This preserves the local time the user entered
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
      };
      
      const scheduledPickupTime = createDateTimeString(tripData.scheduledDate, tripData.scheduledTime);
      const scheduledReturnTime = tripData.tripType === "round_trip" && tripData.returnTime 
        ? createDateTimeString(tripData.scheduledDate, tripData.returnTime)
        : null;
      
      if (tripData.isRecurring) {
        // Create recurring trip
        const apiData = {
          program_id: effectiveProgram,
          client_id: tripData.selectionType === "individual" ? tripData.clientId : undefined,
          client_group_id: tripData.selectionType === "group" ? tripData.clientGroupId : undefined,
          driver_id: tripData.driverId === "unassigned" ? null : tripData.driverId || null,
          trip_type: tripData.tripType,
          pickup_address: tripData.pickupAddress,
          dropoff_address: tripData.dropoffAddress,
          scheduled_time: tripData.scheduledTime,
          return_time: tripData.tripType === "round_trip" ? tripData.returnTime : null,
          frequency: tripData.frequency,
          days_of_week: tripData.daysOfWeek,
          duration: tripData.duration,
          start_date: tripData.scheduledDate,
          passenger_count: tripData.selectionType === "group" ? (clientGroups.find(g => g.id === tripData.clientGroupId)?.member_count || 1) : 1,
          is_group_trip: tripData.selectionType === "group",
          is_active: true
        };
        const response = await apiRequest("POST", "/api/recurring-trips", apiData);
        return response;
      } else {
        // Create regular trip(s)
        if (tripData.selectionType === "individual") {
          // Create separate trips for each individual client
          const allClientIds = [tripData.clientId, ...tripData.clientIds].filter(id => id);
          const tripPromises = allClientIds.map((clientId, index) => {
            const apiData = {
              id: `trip_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              program_id: effectiveProgram,
              client_id: clientId,
              driver_id: tripData.driverId === "unassigned" ? null : tripData.driverId || null,
              trip_type: tripData.tripType,
              pickup_address: tripData.pickupAddress,
              dropoff_address: tripData.dropoffAddress,
              scheduled_pickup_time: scheduledPickupTime,
              scheduled_return_time: scheduledReturnTime,
              passenger_count: 1,
              is_group_trip: false,
              status: "scheduled",
              special_requirements: formatSpecialRequirements(tripData.specialRequirementIds, tripData.specialRequirementOther),
              notes: tripData.notes || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            return apiRequest("POST", "/api/trips", apiData);
          });
          
          const responses = await Promise.all(tripPromises);
          return responses;
        } else {
          // Create group trip
          const apiData = {
            id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            program_id: effectiveProgram,
            client_group_id: tripData.clientGroupId,
            driver_id: tripData.driverId === "unassigned" ? null : tripData.driverId || null,
            trip_type: tripData.tripType,
            pickup_address: tripData.pickupAddress,
            dropoff_address: tripData.dropoffAddress,
            scheduled_pickup_time: scheduledPickupTime,
            scheduled_return_time: scheduledReturnTime,
            passenger_count: clientGroups.find(g => g.id === tripData.clientGroupId)?.member_count || 1,
            is_group_trip: true,
            status: "scheduled",
            special_requirements: formatSpecialRequirements(tripData.specialRequirementIds, tripData.specialRequirementOther),
            notes: tripData.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const response = await apiRequest("POST", "/api/trips", apiData);
          return response;
        }
      }
    },
    onSuccess: (data) => {
      const isMultipleTrips = Array.isArray(data);
      const tripCount = isMultipleTrips ? data.length : 1;
      
      toast({
        title: formData.isRecurring ? "Recurring Trip Scheduled" : (isMultipleTrips ? "Trips Scheduled" : "Trip Scheduled"),
        description: formData.isRecurring 
          ? "Recurring trip has been successfully created." 
          : (isMultipleTrips 
              ? `${tripCount} trips have been successfully scheduled.` 
              : "Trip has been successfully scheduled."),
      });
      setFormData({
        selectionType: "individual",
        clientId: "",
        clientIds: [] as string[],
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
        daysOfWeek: [] as string[],
        duration: 4,
        tripNickname: "",
        specialRequirementIds: [] as string[],
        specialRequirementOther: "",
        notes: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      if (formData.isRecurring) {
        queryClient.invalidateQueries({ queryKey: ["/api/recurring-trips"] });
      }
      
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
      
      // Valid paths to navigate to (exclude trip creation/new pages, but allow hierarchical URLs)
      const isValidPath = (path: string) => {
        if (!path || !path.startsWith('/')) return false;
        
        // Extract base path to check for trip new
        const basePath = path.replace(/^\/corporate-client\/[^/]+/, '').replace(/^\/corporate-client\/[^/]+\/program\/[^/]+/, '');
        
        // Exclude trip new page and root
        if (basePath === '/trips/new' || 
            basePath === '/' ||
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
      if (referrer && !referrer.includes('/trips/new')) {
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
      if (referrer && !referrer.includes('/trips/new')) {
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
        title: formData.isRecurring ? "Recurring Trip Failed" : "Booking Failed",
        description: formData.isRecurring ? "Failed to create recurring trip. Please try again." : "Failed to book trip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate program is selected
    if (!effectiveProgram) {
      toast({
        title: "Program Required",
        description: "Please select a program before creating a trip.",
        variant: "destructive",
      });
      return;
    }

    // Validation based on selection type
    if (formData.selectionType === "individual") {
      // Check if at least one client is selected (either clientId or any clientIds)
      const hasClient = formData.clientId || formData.clientIds.some(id => id);
      if (!hasClient || !formData.pickupAddress || !formData.dropoffAddress || !formData.scheduledDate || !formData.scheduledTime) {
        toast({
          title: "Missing Information",
          description: "Please select at least one client and fill in all required fields.",
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
          {/* Program Selection for Super Admins */}
          {level === 'corporate' && !selectedProgram && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
              <div className="text-sm font-medium text-blue-800">Program Selection Required</div>
              
              {corporateClients.length > 0 && (
                <div>
                  <Label htmlFor="corporateClient">Corporate Client</Label>
                  <Select 
                    value={selectedCorporateClientLocal} 
                    onValueChange={(value) => {
                      setSelectedCorporateClientLocal(value);
                      setSelectedProgramLocal(""); // Reset program when corporate client changes
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select corporate client" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                      {corporateClients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id} className="text-gray-900 hover:bg-gray-100">
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {programs.length > 0 && (
                <div>
                  <Label htmlFor="program">Program</Label>
                  <Select 
                    value={selectedProgramLocal} 
                    onValueChange={setSelectedProgramLocal}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                      {programs.map((program: any) => (
                        <SelectItem key={program.id} value={program.id} className="text-gray-900 hover:bg-gray-100">
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!effectiveProgram && (
                <div className="text-sm text-gray-600">
                  Please select a program to load clients and continue with trip booking.
                </div>
              )}
            </div>
          )}

          {/* Client Selection Type */}
          <div>
            <Label className="text-sm font-medium">Select Clients *</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="individual"
                  checked={formData.selectionType === "individual"}
                  onChange={(e) => setFormData({...formData, selectionType: e.target.value as "individual" | "group", clientId: "", clientIds: [], clientGroupId: ""})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Individual Client</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="group"
                  checked={formData.selectionType === "group"}
                  onChange={(e) => setFormData({...formData, selectionType: e.target.value as "individual" | "group", clientId: "", clientIds: [], clientGroupId: ""})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Client Group</span>
              </label>
            </div>
          </div>

          {formData.selectionType === "individual" ? (
            <div>
              <Label>Individual Clients *</Label>
              <div className="space-y-2">
                {/* First client selection */}
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select first client" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id} className="text-gray-900 hover:bg-gray-100">
                        {client.first_name} {client.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Additional client selections */}
                {formData.clientIds.map((clientId, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select 
                      value={clientId} 
                      onValueChange={(value) => {
                        const newClientIds = [...formData.clientIds];
                        newClientIds[index] = value;
                        setFormData({ ...formData, clientIds: newClientIds });
                      }}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select additional client" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id} className="text-gray-900 hover:bg-gray-100">
                            {client.first_name} {client.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newClientIds = formData.clientIds.filter((_, i) => i !== index);
                        setFormData({ ...formData, clientIds: newClientIds });
                      }}
                      className="px-2 py-1 h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {/* Add client button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({ ...formData, clientIds: [...formData.clientIds, ""] });
                  }}
                  className="w-full"
                  disabled={formData.clientIds.length >= 4} // Limit to 5 total clients (1 + 4 additional)
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client ({formData.clientIds.length + 1}/5)
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="clientGroupId">Client Group *</Label>
              <Select value={formData.clientGroupId} onValueChange={(value) => setFormData({ ...formData, clientGroupId: value })}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select client group" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                  {clientGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id} className="text-gray-900 hover:bg-gray-100">
                      {group.name} ({group.member_count || 0} clients)
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
              <SelectTrigger className="bg-white text-gray-900">
                <SelectValue placeholder="Select a driver or leave unassigned" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                <SelectItem value="unassigned" className="text-gray-900 hover:bg-gray-100">
                  No driver assigned
                </SelectItem>
                {availableDrivers.map((driver: any) => (
                  <SelectItem 
                    key={driver.id} 
                    value={driver.id}
                    className="text-gray-900 hover:bg-gray-100"
                  >
                    {driver.users?.user_name || driver.user_name || 'Unknown Driver'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.clientId && availableDrivers.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No drivers available for this program. The trip will be created without a driver assigned.
              </p>
            )}
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
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                <SelectItem value="one_way" className="text-gray-900 hover:bg-gray-100">One Way</SelectItem>
                <SelectItem value="round_trip" className="text-gray-900 hover:bg-gray-100">Round Trip</SelectItem>
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
                aria-label="Enable recurring trip"
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
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
                    <SelectItem value="weekly" className="text-gray-900 hover:bg-gray-100">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-gray-900 hover:bg-gray-100">Monthly</SelectItem>
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

          {/* Special Requirements */}
          <div>
            <Label>Special Requirements</Label>
            <div className="space-y-2 mt-2">
              {specialRequirements
                .filter((r: any) => !r.is_custom)
                .sort((a: any, b: any) => a.display_order - b.display_order)
                .map((requirement: any) => (
                  <div key={requirement.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sr-${requirement.id}`}
                      checked={formData.specialRequirementIds.includes(requirement.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            specialRequirementIds: [...formData.specialRequirementIds, requirement.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            specialRequirementIds: formData.specialRequirementIds.filter(id => id !== requirement.id),
                          });
                        }
                      }}
                    />
                    <label htmlFor={`sr-${requirement.id}`} className="text-sm cursor-pointer">
                      {requirement.name}
                    </label>
                  </div>
                ))}
              {specialRequirements
                .find((r: any) => r.is_custom) && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sr-other"
                        checked={formData.specialRequirementIds.includes('sr_other')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              specialRequirementIds: [...formData.specialRequirementIds, 'sr_other'],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              specialRequirementIds: formData.specialRequirementIds.filter(id => id !== 'sr_other'),
                              specialRequirementOther: "",
                            });
                          }
                        }}
                      />
                      <label htmlFor="sr-other" className="text-sm cursor-pointer">
                        {specialRequirements.find((r: any) => r.is_custom)?.name || "Other"}
                      </label>
                    </div>
                    {formData.specialRequirementIds.includes('sr_other') && (
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