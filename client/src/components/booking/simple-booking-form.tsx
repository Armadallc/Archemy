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
import { useFeatureFlag } from "../../hooks/use-permissions";
import QuickAddLocation from "./quick-add-location";
import { parseAddressString } from "../../lib/address-utils";
import { TripPurposeBillingSelector } from "../telematics/TripPurposeBillingSelector";

// Billing Calculation Display Component
function BillingCalculationDisplay({ 
  tripCode, 
  legCalculations, 
  serviceCodes 
}: { 
  tripCode: string; 
  legCalculations: Array<{ estimatedMiles: number | null }>;
  serviceCodes: any[];
}) {
  if (!tripCode || legCalculations.length === 0) return null;

  const totalMiles = legCalculations.reduce((sum, leg) => sum + (leg.estimatedMiles || 0), 0);
  const selectedCode = serviceCodes.find((code: any) => code.code === tripCode);
  
  if (!selectedCode) return null;

  // Determine mileage band
  const getMileageBand = (miles: number) => {
    if (miles <= 10) return { band: 1, modifier: 'U1', rate: 22.28, range: '0-10' };
    if (miles <= 25) return { band: 2, modifier: 'U2', rate: 33.42, range: '11-25' };
    if (miles <= 50) return { band: 3, modifier: 'U3', rate: 55.70, range: '26-50' };
    return { band: 4, modifier: 'U4', rate: 78.00, range: '51+' };
  };

  const mileageBand = getMileageBand(totalMiles);
  const baseRate = selectedCode.baseRate || 0;
  const mileageRate = selectedCode.mileageRate || 0;
  const rateType = selectedCode.rateType || 'per_trip';

  // Calculate billing
  let totalBilling = 0;
  const breakdown: Array<{ label: string; amount: number }> = [];

  if (baseRate > 0 && rateType !== 'per_trip') {
    breakdown.push({ label: 'Base Rate', amount: baseRate });
    totalBilling += baseRate;
  }

  if (rateType === 'per_trip' && mileageBand) {
    // For per_trip codes with mileage bands, use the band rate
    breakdown.push({ 
      label: `Mileage Band ${mileageBand.band} (${mileageBand.range} mi)`, 
      amount: mileageBand.rate 
    });
    totalBilling = mileageBand.rate; // Band rate replaces base rate
  } else if (mileageRate > 0) {
    const mileageCharge = totalMiles * mileageRate;
    breakdown.push({ label: 'Mileage', amount: mileageCharge });
    totalBilling += mileageCharge;
  }

  // Check if it's a flat rate code
  if (rateType === 'per_trip' && !mileageBand && baseRate > 0 && mileageRate === 0) {
    breakdown.push({ label: 'Flat Rate', amount: baseRate });
    totalBilling = baseRate;
  }

  if (breakdown.length === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <h4 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Billing Calculation</h4>
      <div className="space-y-2 text-sm">
        {breakdown.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-medium">${item.amount.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
          <span className="font-semibold">Total:</span>
          <span className="font-bold text-lg">${totalBilling.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function SimpleBookingForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();
  
  // Feature flag for recurring trips
  const { isEnabled: recurringTripsEnabled } = useFeatureFlag('recurring_trips_enabled');

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
    originAddress: "", // Changed from pickupAddress
    destinationAddress: "", // Changed from dropoffAddress
    stops: [] as string[], // Array of intermediate stops (max 8)
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
    notes: "",
    // Telematics Phase 1 fields
    tripPurpose: "",
    tripCode: "",
    tripModifier: "",
    appointmentTime: "",
    hasAppointmentTime: false // Checkbox state for appointment time
  });

  // State for leg calculations
  const [legCalculations, setLegCalculations] = useState<Array<{
    legNumber: number;
    fromAddress: string;
    toAddress: string;
    estimatedMiles: number | null;
    estimatedTimeMinutes: number | null;
    isLoading: boolean;
  }>>([]);

  // Calculate legs when addresses change
  useEffect(() => {
    const calculateLegs = async () => {
      // Build address array: Origin, Stops, Destination
      const addresses: string[] = [];
      if (formData.originAddress) addresses.push(formData.originAddress);
      addresses.push(...formData.stops.filter(s => s.trim()));
      if (formData.destinationAddress) addresses.push(formData.destinationAddress);

      // If round trip and no stops, add return leg
      const isRoundTrip = formData.tripType === "round_trip" && formData.stops.length === 0;
      if (isRoundTrip && formData.destinationAddress && formData.originAddress) {
        addresses.push(formData.originAddress); // Return to origin
      }

      if (addresses.length < 2) {
        setLegCalculations([]);
        return;
      }

      // Calculate each leg
      const newLegs = addresses.slice(0, -1).map((fromAddress, index) => {
        const toAddress = addresses[index + 1];
        return {
          legNumber: index + 1,
          fromAddress,
          toAddress,
          estimatedMiles: null,
          estimatedTimeMinutes: null,
          isLoading: true,
        };
      });

      setLegCalculations(newLegs);

      // Calculate route for each leg
      for (let i = 0; i < newLegs.length; i++) {
        const leg = newLegs[i];
        try {
          console.log(`📏 Calculating leg ${i + 1}: ${leg.fromAddress} → ${leg.toAddress}`);
          const response = await apiRequest("POST", "/api/trips/estimate-route", {
            fromAddress: leg.fromAddress,
            toAddress: leg.toAddress,
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Leg ${i + 1} calculated: ${data.distance} mi, ${data.duration} min`);
            setLegCalculations(prev => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                estimatedMiles: data.distance,
                estimatedTimeMinutes: data.duration,
                isLoading: false,
              };
              return updated;
            });
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Leg ${i + 1} calculation failed:`, response.status, errorText);
            setLegCalculations(prev => {
              const updated = [...prev];
              updated[i] = { ...updated[i], isLoading: false };
              return updated;
            });
          }
        } catch (error) {
          console.error(`❌ Error calculating leg ${i + 1}:`, error);
          setLegCalculations(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], isLoading: false };
            return updated;
          });
        }
      }
    };

    calculateLegs();
  }, [formData.originAddress, formData.destinationAddress, formData.stops, formData.tripType]);

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
  const { data: clientGroups = [], isLoading: clientGroupsLoading, error: clientGroupsError } = useQuery({
    queryKey: ["/api/client-groups", level, effectiveCorporateClient, effectiveProgram],
    queryFn: async () => {
      console.log('🔍 [Booking Form] Client groups query STARTING:', {
        level,
        effectiveProgram,
        effectiveCorporateClient,
        enabled: !!(effectiveProgram || effectiveCorporateClient)
      });
      
      let endpoint = "/api/client-groups";
      
      if (level === 'program' && effectiveProgram) {
        endpoint = `/api/client-groups/program/${effectiveProgram}`;
      } else if (level === 'client' && effectiveCorporateClient) {
        endpoint = `/api/client-groups/corporate-client/${effectiveCorporateClient}`;
      } else if (level === 'corporate' && effectiveProgram) {
        endpoint = `/api/client-groups/program/${effectiveProgram}`;
      }
      
      console.log('🔍 [Booking Form] Fetching client groups from:', endpoint);
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      
      // Debug: Log client groups data to verify member_count
      console.log('🔍 [Booking Form] Client groups fetched:', {
        endpoint,
        level,
        effectiveProgram,
        effectiveCorporateClient,
        count: data?.length || 0,
        groups: data?.map((g: any) => ({
          id: g.id,
          name: g.name,
          program_id: g.program_id,
          member_count: g.member_count,
          memberships_array: g.client_group_memberships,
          memberships_length: Array.isArray(g.client_group_memberships) ? g.client_group_memberships.length : 'not array',
          raw_data: g
        })) || []
      });
      
      return data;
    },
    enabled: !!(effectiveProgram || effectiveCorporateClient),
  });
  
  // Debug: Log query status
  React.useEffect(() => {
    console.log('🔍 [Booking Form] Client groups query status:', {
      enabled: !!(effectiveProgram || effectiveCorporateClient),
      effectiveProgram,
      effectiveCorporateClient,
      isLoading: clientGroupsLoading,
      error: clientGroupsError,
      dataLength: clientGroups?.length || 0,
      groups: clientGroups
    });
  }, [clientGroupsLoading, clientGroupsError, clientGroups, effectiveProgram, effectiveCorporateClient]);

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

  // Fetch service codes for billing calculation
  const { data: serviceCodes = [] } = useQuery({
    queryKey: ["service-codes"],
    queryFn: async () => {
      try {
        const module = await import("../prophet/data/coloradoMedicaidCodes");
        const { bhstCodes, nemtCodes, nmtCodes } = module;
        return [
          ...(bhstCodes || []),
          ...(nemtCodes || []),
          ...(nmtCodes || []),
        ];
      } catch (error) {
        console.error("Error loading service codes:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 60,
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
      
      // Parse addresses into separated fields
      const pickupAddress = parseAddressString(tripData.originAddress);
      const dropoffAddress = parseAddressString(tripData.destinationAddress);
      
      if (tripData.isRecurring && recurringTripsEnabled) {
        // Create recurring trip
        // Build API payload - explicitly omit client_id for group trips
        const apiData: any = {
          program_id: effectiveProgram,
          driver_id: tripData.driverId === "unassigned" ? null : tripData.driverId || null,
          trip_type: tripData.tripType,
          pickup_address: tripData.originAddress, // Legacy field for backward compatibility
          pickup_street: pickupAddress.street,
          pickup_city: pickupAddress.city,
          pickup_state: pickupAddress.state,
          pickup_zip: pickupAddress.zip,
          dropoff_address: tripData.destinationAddress, // Legacy field for backward compatibility
          dropoff_street: dropoffAddress.street,
          dropoff_city: dropoffAddress.city,
          dropoff_state: dropoffAddress.state,
          dropoff_zip: dropoffAddress.zip,
          stops: tripData.stops || [],
          scheduled_time: tripData.scheduledTime,
          return_time: tripData.tripType === "round_trip" ? tripData.returnTime : null,
          frequency: tripData.frequency,
          days_of_week: tripData.daysOfWeek,
          duration: tripData.duration,
          start_date: tripData.scheduledDate,
          passenger_count: tripData.selectionType === "group" ? (clientGroups.find((g: { id: string; member_count?: number }) => g.id === tripData.clientGroupId)?.member_count || 1) : 1,
          is_group_trip: tripData.selectionType === "group",
          is_active: true
        };
        
        // Only include client_id for individual trips (never for group trips)
        if (tripData.selectionType === "individual" && tripData.clientId) {
          apiData.client_id = tripData.clientId;
        }
        
        // Only include client_group_id for group trips
        if (tripData.selectionType === "group" && tripData.clientGroupId) {
          apiData.client_group_id = tripData.clientGroupId;
        }
        
        // Telematics Phase 1 fields
        apiData.trip_purpose = tripData.tripPurpose || null;
        apiData.trip_code = tripData.tripCode || null;
        apiData.trip_modifier = tripData.tripModifier || null;
        // Only set appointment_time if checkbox is checked
        apiData.appointment_time = tripData.hasAppointmentTime && tripData.appointmentTime ? tripData.appointmentTime : null;
        
        // Debug: Log what we're sending
        console.log('🔍 [Frontend] Sending recurring trip request:', {
          selectionType: tripData.selectionType,
          has_client_id: 'client_id' in apiData,
          client_id_value: apiData.client_id,
          has_client_group_id: 'client_group_id' in apiData,
          client_group_id_value: apiData.client_group_id,
          is_group_trip: apiData.is_group_trip,
          apiData_keys: Object.keys(apiData)
        });
        
        const response = await apiRequest("POST", "/api/trips/recurring-trips", apiData);
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
              pickup_address: tripData.originAddress, // Legacy field for backward compatibility
              pickup_street: pickupAddress.street,
              pickup_city: pickupAddress.city,
              pickup_state: pickupAddress.state,
              pickup_zip: pickupAddress.zip,
              dropoff_address: tripData.destinationAddress, // Legacy field for backward compatibility
              dropoff_street: dropoffAddress.street,
              dropoff_city: dropoffAddress.city,
              dropoff_state: dropoffAddress.state,
              dropoff_zip: dropoffAddress.zip,
              stops: tripData.stops || [],
              scheduled_pickup_time: scheduledPickupTime,
              scheduled_return_time: scheduledReturnTime,
              passenger_count: 1,
              is_group_trip: false,
              status: "scheduled",
              special_requirements: formatSpecialRequirements(tripData.specialRequirementIds, tripData.specialRequirementOther),
              notes: tripData.notes || null,
              // Telematics Phase 1 fields
              trip_purpose: tripData.tripPurpose || null,
              trip_code: tripData.tripCode || null,
              trip_modifier: tripData.tripModifier || null,
              // Only set appointment_time if checkbox is checked
              appointment_time: tripData.hasAppointmentTime && tripData.appointmentTime ? tripData.appointmentTime : null,
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
            pickup_address: tripData.originAddress, // Legacy field for backward compatibility
            pickup_street: pickupAddress.street,
            pickup_city: pickupAddress.city,
            pickup_state: pickupAddress.state,
            pickup_zip: pickupAddress.zip,
            dropoff_address: tripData.destinationAddress, // Legacy field for backward compatibility
            dropoff_street: dropoffAddress.street,
            dropoff_city: dropoffAddress.city,
            dropoff_state: dropoffAddress.state,
            dropoff_zip: dropoffAddress.zip,
            stops: tripData.stops || [],
            scheduled_pickup_time: scheduledPickupTime,
            scheduled_return_time: scheduledReturnTime,
            passenger_count: clientGroups.find((g: { id: string; member_count?: number }) => g.id === tripData.clientGroupId)?.member_count || 1,
            is_group_trip: true,
            status: "scheduled",
            special_requirements: formatSpecialRequirements(tripData.specialRequirementIds, tripData.specialRequirementOther),
            notes: tripData.notes || null,
            // Telematics Phase 1 fields
            trip_purpose: tripData.tripPurpose || null,
            trip_code: tripData.tripCode || null,
            trip_modifier: tripData.tripModifier || null,
            // Only set appointment_time if checkbox is checked
            appointment_time: tripData.hasAppointmentTime && tripData.appointmentTime ? tripData.appointmentTime : null,
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
        originAddress: "",
        destinationAddress: "",
        stops: [] as string[],
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
        notes: "",
        // Telematics Phase 1 fields
        tripPurpose: "",
        tripCode: "",
        tripModifier: "",
        appointmentTime: "",
        hasAppointmentTime: false
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      if (formData.isRecurring) {
        queryClient.invalidateQueries({ queryKey: ["/api/trips/recurring-trips"] });
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
    
    console.log('🔍 [Form Submit] Starting validation:', {
      effectiveProgram,
      selectionType: formData.selectionType,
      clientId: formData.clientId,
      clientGroupId: formData.clientGroupId,
      pickupAddress: formData.pickupAddress,
      dropoffAddress: formData.dropoffAddress,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      isRecurring: formData.isRecurring,
      recurringTripsEnabled,
      frequency: formData.frequency,
      daysOfWeek: formData.daysOfWeek,
      daysOfWeekLength: formData.daysOfWeek?.length,
      tripType: formData.tripType,
      returnTime: formData.returnTime
    });
    
    // Validate program is selected
    if (!effectiveProgram) {
      console.log('❌ [Form Submit] Validation failed: No effectiveProgram');
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
      if (!hasClient || !formData.originAddress || !formData.destinationAddress || !formData.scheduledDate || !formData.scheduledTime) {
        console.log('❌ [Form Submit] Validation failed: Missing individual trip fields');
        toast({
          title: "Missing Information",
          description: "Please select at least one client and fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.clientGroupId || !formData.originAddress || !formData.destinationAddress || !formData.scheduledDate || !formData.scheduledTime) {
        console.log('❌ [Form Submit] Validation failed: Missing group trip fields', {
          clientGroupId: formData.clientGroupId,
          originAddress: formData.originAddress,
          destinationAddress: formData.destinationAddress,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime
        });
        toast({
          title: "Missing Information",
          description: "Please select a client group and fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
    }

    // Recurring trip validation (only if feature flag is enabled)
    if (formData.isRecurring && recurringTripsEnabled) {
      if (!formData.frequency || formData.daysOfWeek.length === 0) {
        console.log('❌ [Form Submit] Validation failed: Missing recurring trip info', {
          frequency: formData.frequency,
          daysOfWeek: formData.daysOfWeek,
          daysOfWeekLength: formData.daysOfWeek?.length
        });
        toast({
          title: "Missing Recurring Information",
          description: "Please select frequency and days of the week for recurring trips.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (formData.tripType === "round_trip" && !formData.returnTime) {
      console.log('❌ [Form Submit] Validation failed: Missing return time for round trip');
      toast({
        title: "Missing Return Time",
        description: "Please specify a return time for round-trip bookings.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ [Form Submit] All validations passed, calling createTripMutation.mutate');
    createTripMutation.mutate(formData);
  };

  return (
    <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <CardHeader className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardTitle className="flex items-center gap-2" style={{ fontSize: '26px' }}>
          QUICK BOOKING
        </CardTitle>
      </CardHeader>
      <CardContent style={{ backgroundColor: 'var(--background)' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Program Selection for Super Admins */}
          {level === 'corporate' && !selectedProgram && (
            <div 
              className="space-y-4 px-6 py-4 rounded-lg card-neu-flat -mx-6 mt-6"
              style={{
                backgroundColor: 'var(--background)',
                border: 'none'
              }}
            >
              <div className="font-medium" style={{ color: 'var(--primary)', fontSize: '16px' }}>SELECT PROGRAM *</div>
              
              {corporateClients.length > 0 && (
                <div>
                  <Label htmlFor="corporateClient" className="font-medium" style={{ fontSize: '16px' }}>TENANT</Label>
                  <Select 
                    value={selectedCorporateClientLocal} 
                    onValueChange={(value) => {
                      setSelectedCorporateClientLocal(value);
                      setSelectedProgramLocal(""); // Reset program when corporate client changes
                    }}
                  >
                    <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <SelectValue placeholder="Select corporate client" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-50 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      {corporateClients.map((client: any) => (
                        <SelectItem 
                          key={client.id} 
                          value={client.id} 
                          className="hover:card-neu-flat"
                        >
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {programs.length > 0 && (
                <div>
                  <Label htmlFor="program" className="font-medium" style={{ fontSize: '16px' }}>PROGRAM</Label>
                  <Select 
                    value={selectedProgramLocal} 
                    onValueChange={setSelectedProgramLocal}
                  >
                    <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-50 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      {programs.map((program: any) => (
                        <SelectItem 
                          key={program.id} 
                          value={program.id} 
                          className="hover:card-neu-flat"
                        >
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!effectiveProgram && (
                <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Please select a program to load clients and continue with trip booking.
                </div>
              )}
            </div>
          )}

          {/* Client Selection Section */}
          <div className="space-y-4 px-6 py-4 rounded-lg card-neu-flat -mx-6" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <Label className="font-medium" style={{ fontSize: '16px' }}>SELECT CLIENT/GROUP *</Label>
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

          {formData.selectionType === "individual" ? (
            <div className="mt-4">
              <Label className="font-medium" style={{ fontSize: '16px' }}>Clients *</Label>
              <div className="space-y-2">
                {/* First client selection */}
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectValue placeholder="Select first client" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 z-50 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    {clients.map((client: any) => (
                      <SelectItem 
                        key={client.id} 
                        value={client.id} 
                        className="hover:card-neu-flat"
                      >
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
                      <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        <SelectValue placeholder="Select additional client" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 z-50 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                        {clients.map((client: any) => (
                          <SelectItem 
                            key={client.id} 
                            value={client.id} 
                            className="hover:card-neu-flat"
                          >
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
                      className="px-2 py-1 h-8 w-8 card-neu-flat hover:card-neu [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
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
                  className="w-full card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
                  disabled={formData.clientIds.length >= 4} // Limit to 5 total clients (1 + 4 additional)
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Additional Clients ({formData.clientIds.length + 1}/5)
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Label htmlFor="clientGroupId">Client Group *</Label>
              <Select value={formData.clientGroupId} onValueChange={(value) => setFormData({ ...formData, clientGroupId: value })}>
                <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <SelectValue placeholder="Select client group" />
                </SelectTrigger>
                <SelectContent className="max-h-60 z-50 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  {clientGroups.map((group: any) => (
                    <SelectItem 
                      key={group.id} 
                      value={group.id} 
                      className="hover:card-neu-flat"
                    >
                      {group.name} ({group.member_count || 0} clients)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          </div>

          {/* Driver Section */}
          <div className="space-y-4 px-6 py-4 rounded-lg card-neu-flat -mx-6" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <Label htmlFor="driverId" className="font-normal" style={{ fontSize: '16px' }}>DRIVER (Optional)</Label>
            <Select 
              value={formData.driverId} 
              onValueChange={(value) => setFormData({ ...formData, driverId: value })}
            >
              <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <SelectValue placeholder="Select a driver or leave unassigned" />
              </SelectTrigger>
              <SelectContent className="max-h-60 z-50 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <SelectItem 
                  value="unassigned" 
                  className="hover:card-neu-flat"
                >
                  No driver assigned
                </SelectItem>
                {availableDrivers.map((driver: any) => (
                  <SelectItem 
                    key={driver.id} 
                    value={driver.id}
                    className="hover:card-neu-flat"
                  >
                    {driver.users?.user_name || driver.user_name || 'Unknown Driver'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.clientId && availableDrivers.length === 0 && (
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                No drivers available for this program. The trip will be created without a driver assigned.
              </p>
            )}
          </div>

          {/* Origin/Destination Section */}
          <div className="space-y-4 px-6 py-4 rounded-lg card-neu-flat -mx-6" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <QuickAddLocation
            value={formData.originAddress}
            onChange={(value) => setFormData({ ...formData, originAddress: value })}
            placeholder="Enter origin address"
            locationType="pickup"
            label="ORIGIN"
            required
            programId={effectiveProgram}
            corporateClientId={effectiveCorporateClient}
          />

          {/* Intermediate Stops */}
          {formData.stops.map((stop, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <QuickAddLocation
                  value={stop}
                  onChange={(value) => {
                    const newStops = [...formData.stops];
                    newStops[index] = value;
                    setFormData({ ...formData, stops: newStops, tripType: "one_way" }); // Disable round trip when stops added
                  }}
                  placeholder={`Enter stop ${index + 1} address`}
                  locationType="dropoff"
                  label={`Stop ${index + 1}`}
                  required
                  programId={effectiveProgram}
                  corporateClientId={effectiveCorporateClient}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newStops = formData.stops.filter((_, i) => i !== index);
                  setFormData({ ...formData, stops: newStops });
                }}
                className="mt-8 px-2 py-1 h-8 w-8 card-neu-flat hover:card-neu [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Add Stop Button */}
          {formData.stops.length < 8 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({ 
                  ...formData, 
                  stops: [...formData.stops, ""],
                  tripType: "one_way" // Disable round trip when adding stops
                });
              }}
              className="w-full card-neu-flat hover:card-neu [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none', boxShadow: '0 0 8px rgba(122, 255, 254, 0.15)' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stop ({formData.stops.length}/8)
            </Button>
          )}

          <QuickAddLocation
            value={formData.destinationAddress}
            onChange={(value) => setFormData({ ...formData, destinationAddress: value })}
            placeholder="Enter destination address"
            locationType="dropoff"
            label="DESTINATION"
            required
            programId={effectiveProgram}
            corporateClientId={effectiveCorporateClient}
          />
          </div>

          {/* Date/Time/Type Section */}
          <div className="space-y-4 px-6 py-4 rounded-lg card-neu-flat -mx-6" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledDate" className="font-medium" style={{ fontSize: '16px' }}>DATE</Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="card-neu-flat [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
            <div>
              <Label htmlFor="scheduledTime">Pickup Time</Label>
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="card-neu-flat [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              />
            </div>
          </div>

          {/* Appointment Time - right after pickup time */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasAppointmentTime"
                checked={formData.hasAppointmentTime}
                onCheckedChange={(checked) => {
                  setFormData({ 
                    ...formData, 
                    hasAppointmentTime: checked as boolean,
                    appointmentTime: checked ? formData.appointmentTime : ""
                  });
                }}
              />
              <Label htmlFor="hasAppointmentTime" className="cursor-pointer">
                Client has appointment - must arrive at DO by appointment time
              </Label>
            </div>
            {formData.hasAppointmentTime && (
              <div>
                <Label htmlFor="appointmentTime">Appointment Time</Label>
                <Input
                  id="appointmentTime"
                  type="time"
                  value={
                    formData.appointmentTime 
                      ? (formData.appointmentTime.includes('T') 
                          ? new Date(formData.appointmentTime).toTimeString().slice(0, 5)
                          : formData.appointmentTime.slice(0, 5))
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value && formData.scheduledDate) {
                      // Combine date and time for appointment_time (store as ISO string)
                      const appointmentDateTime = `${formData.scheduledDate}T${e.target.value}:00`;
                      setFormData({ ...formData, appointmentTime: appointmentDateTime });
                    } else {
                      setFormData({ ...formData, appointmentTime: "" });
                    }
                  }}
                  placeholder="When client needs to be at appointment"
                  className="card-neu-flat [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Trip Type - Only show if no stops added */}
          {formData.stops.length === 0 && (
            <>
              <div>
                <Label htmlFor="tripType" className="font-medium" style={{ fontSize: '16px' }}>TYPE</Label>
                <Select value={formData.tripType} onValueChange={(value) => setFormData({ ...formData, tripType: value })}>
                  <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 z-50 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                    <SelectItem 
                      value="one_way" 
                      className="hover:card-neu-flat"
                    >
                      One Way
                    </SelectItem>
                    <SelectItem 
                      value="round_trip" 
                      className="hover:card-neu-flat"
                    >
                      Round Trip
                    </SelectItem>
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
                    className="card-neu-flat [&]:shadow-none"
                    style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  />
                </div>
              )}
            </>
          )}
          </div>

          {/* Leg Display Section - Show when we have origin and destination */}
          {(formData.originAddress && formData.destinationAddress) && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                Trip Legs {legCalculations.length === 0 && <span className="text-sm font-normal text-muted-foreground">(Calculating...)</span>}
              </h3>
              {legCalculations.length === 0 ? (
                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="text-sm text-muted-foreground">Enter origin and destination addresses to calculate trip legs</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {legCalculations.map((leg) => (
                  <div key={leg.legNumber} className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Leg {leg.legNumber}</span>
                      {leg.isLoading && (
                        <span className="text-xs text-muted-foreground">Calculating...</span>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-muted-foreground">From: </span>
                        <span>{leg.fromAddress}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To: </span>
                        <span>{leg.toAddress}</span>
                      </div>
                      {leg.estimatedMiles !== null && (
                        <div className="flex gap-4 mt-2">
                          <div>
                            <span className="text-muted-foreground">Distance: </span>
                            <span className="font-medium">{leg.estimatedMiles.toFixed(2)} mi</span>
                          </div>
                          {leg.estimatedTimeMinutes !== null && (
                            <div>
                              <span className="text-muted-foreground">Time: </span>
                              <span className="font-medium">{leg.estimatedTimeMinutes} min</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
              )}

              {/* Total Summary */}
              {legCalculations.some(leg => leg.estimatedMiles !== null) && (
                <div className="p-4 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Trip Summary</h4>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-muted-foreground">Total Distance: </span>
                      <span className="font-bold text-lg">
                        {legCalculations
                          .reduce((sum, leg) => sum + (leg.estimatedMiles || 0), 0)
                          .toFixed(2)} mi
                      </span>
                    </div>
                    {legCalculations.some(leg => leg.estimatedTimeMinutes !== null) && (
                      <div>
                        <span className="text-muted-foreground">Total Time: </span>
                        <span className="font-bold text-lg">
                          {legCalculations
                            .reduce((sum, leg) => sum + (leg.estimatedTimeMinutes || 0), 0)} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Telematics Phase 1: Trip Purpose & Billing */}
          <div className="space-y-4 px-6 py-4 rounded-lg card-neu-flat -mx-6 mt-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--foreground)', fontSize: '16px' }}>
              PURPOSE & BILLING
            </h3>
            <TripPurposeBillingSelector
              tripPurpose={formData.tripPurpose}
              tripCode={formData.tripCode}
              tripModifier={formData.tripModifier}
              onTripPurposeChange={(value) => setFormData({ ...formData, tripPurpose: value })}
              onTripCodeChange={(value) => setFormData({ ...formData, tripCode: value })}
              onTripModifierChange={(value) => setFormData({ ...formData, tripModifier: value })}
            />

            {/* Billing Calculation Display */}
            <BillingCalculationDisplay 
              tripCode={formData.tripCode}
              legCalculations={legCalculations}
              serviceCodes={serviceCodes}
            />
          </div>

          {/* Recurring Trip Toggle - Only show if feature flag is enabled */}
          {recurringTripsEnabled && (
            <>
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
                <div 
                  className="space-y-4 p-4 rounded-lg card-neu-flat"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: 'none'
                  }}
                >
                  <div>
                    <Label htmlFor="tripNickname">Trip Nickname</Label>
                    <Input
                      type="text"
                      placeholder="e.g., Phoenix Gym, Therapy Center"
                      value={formData.tripNickname}
                      onChange={(e) => setFormData({ ...formData, tripNickname: e.target.value })}
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Optional: Give this recurring trip an easy-to-identify name</p>
                  </div>

                  <div>
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                    <SelectTrigger className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-50 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                      <SelectItem 
                        value="weekly" 
                        className="hover:card-neu-flat"
                      >
                        Weekly
                      </SelectItem>
                      <SelectItem 
                        value="monthly" 
                        className="hover:card-neu-flat"
                      >
                        Monthly
                      </SelectItem>
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
                      className="card-neu-flat [&]:shadow-none"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                </div>
              )}
            </>
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
                        className="ml-6 card-neu-flat [&]:shadow-none"
                        style={{ backgroundColor: 'var(--background)', border: 'none' }}
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
              className="card-neu-flat [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full card-neu hover:card-neu [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none', fontSize: '26px', boxShadow: '0 0 12px rgba(122, 255, 254, 0.2)' }}
            disabled={createTripMutation.isPending}
          >
            <span style={{ textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)' }}>
              {createTripMutation.isPending ? "Scheduling..." : "BOOK IT!"}
            </span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export { SimpleBookingForm };
export default SimpleBookingForm;