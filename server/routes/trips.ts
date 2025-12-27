import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission, requireProgramAccess } from "../auth";
import { PERMISSIONS } from "../permissions";
import { tripsStorage } from "../minimal-supabase";
import { tripCategoriesStorage } from "../trip-categories-storage";
import { enhancedTripsStorage, EnhancedTrip } from "../enhanced-trips-storage";
import { broadcastTripUpdate, broadcastTripCreated } from "../websocket-instance";
import { pushNotificationService } from "../services/push-notification-service";
import { driversStorage, clientsStorage } from "../minimal-supabase";
import { supabase } from "../db";
// TODO: Implement logTripActivity when activity logging is needed
// import { logTripActivity } from "../services/activityLogService";

const router = express.Router();

// ============================================================================
// TRIPS ROUTES
// ============================================================================

router.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trips = await tripsStorage.getAllTrips();
    
    // Debug logging to inspect client/group data structure
    if (trips && trips.length > 0) {
      const firstTrip = trips[0] as any;
      console.log('🔍 [BACKEND] First trip structure:', {
        id: firstTrip.id,
        reference_id: firstTrip.reference_id,
        client_id: firstTrip.client_id,
        client_group_id: firstTrip.client_group_id,
        is_group_trip: firstTrip.is_group_trip,
        hasClient: !!firstTrip.clients,
        hasClientGroup: !!firstTrip.client_groups,
        clientKeys: firstTrip.clients ? Object.keys(firstTrip.clients) : 'no client',
        clientGroupKeys: firstTrip.client_groups ? Object.keys(firstTrip.client_groups) : 'no group',
        allKeys: Object.keys(firstTrip).filter(k => k.includes('client') || k.includes('group'))
      });
      
      // Check if client data exists but under different key
      if (firstTrip.clients) {
        console.log('🔍 [BACKEND] Client data found:', firstTrip.clients);
      }
      if (firstTrip.client_groups) {
        console.log('🔍 [BACKEND] Client group data found:', firstTrip.client_groups);
      }
    }
    
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

// IMPORTANT: More specific routes MUST come before /:id to avoid route conflicts
router.get("/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const trips = await tripsStorage.getTripsByCorporateClient(corporateClientId);
    
    // Debug logging
    if (trips && trips.length > 0) {
      const firstTrip = trips[0] as any;
      console.log('🔍 [BACKEND] Corporate client trip structure:', {
        corporateClientId,
        trip_id: firstTrip.id,
        hasClient: !!firstTrip.clients,
        hasClientGroup: !!firstTrip.client_groups,
        client_id: firstTrip.client_id,
        client_group_id: firstTrip.client_group_id
      });
    }
    
    res.json(trips);
  } catch (error) {
    console.error("Error fetching corporate client trips:", error);
    res.status(500).json({ message: "Failed to fetch corporate client trips" });
  }
});

router.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const trips = await tripsStorage.getTripsByProgram(programId);
    
    // Debug logging
    if (trips && trips.length > 0) {
      const firstTrip = trips[0] as any;
      console.log('🔍 [BACKEND] Program trip structure:', {
        programId,
        trip_id: firstTrip.id,
        hasClient: !!firstTrip.clients,
        hasClientGroup: !!firstTrip.client_groups,
        client_id: firstTrip.client_id,
        client_group_id: firstTrip.client_group_id
      });
    }
    
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by program:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const trips = await tripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by driver:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

// ============================================================================
// RECURRING TRIPS ROUTES (must come before /:id route)
// ============================================================================

router.post("/recurring-trips", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), requireProgramAccess('program_id'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // Log at the very start to ensure we're hitting this code
    console.log('🔍 [ROUTE HANDLER] Recurring trips route called');
    console.log('🔍 [ROUTE HANDLER] req.body keys:', Object.keys(req.body));
    console.log('🔍 [ROUTE HANDLER] Full req.body:', JSON.stringify(req.body, null, 2));
    
    const {
      program_id,
      client_id: rawClientId,
      client_group_id,
      driver_id,
      trip_type,
      pickup_address,
      dropoff_address,
      scheduled_time,
      return_time,
      frequency,
      days_of_week,
      duration, // weeks
      start_date,
      passenger_count,
      is_group_trip,
      special_requirements,
      notes,
      trip_category_id
    } = req.body;
    
    // Log incoming request to debug UUID issues
    console.log('🔍 Recurring trip request body:', {
      has_client_id: !!rawClientId,
      client_id_value: rawClientId,
      client_id_type: typeof rawClientId,
      has_client_group_id: !!client_group_id,
      client_group_id_value: client_group_id,
      is_group_trip: is_group_trip
    });
    
    // Normalize client_id - convert empty string to undefined for group trips
    const client_id = (rawClientId && rawClientId.trim() !== '') ? rawClientId : undefined;
    
    console.log('🔍 After normalization:', {
      client_id: client_id,
      client_id_type: typeof client_id,
      client_group_id: client_group_id
    });

    // Validate required fields
    if (!program_id || !pickup_address || !dropoff_address || !scheduled_time || !frequency) {
      return res.status(400).json({ 
        message: "Missing required fields: program_id, pickup_address, dropoff_address, scheduled_time, frequency" 
      });
    }

    // Validate client or client_group is provided (after normalization)
    if (!client_id && !client_group_id) {
      return res.status(400).json({ 
        message: "Either client_id or client_group_id must be provided" 
      });
    }
    
    // Ensure we don't have both client_id and client_group_id (should be mutually exclusive)
    if (client_id && client_group_id) {
      return res.status(400).json({ 
        message: "Cannot specify both client_id and client_group_id. Use client_id for individual trips or client_group_id for group trips." 
      });
    }

    // Validate frequency
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ 
        message: "Frequency must be 'daily', 'weekly', or 'monthly'" 
      });
    }

    // Validate weekly pattern has days_of_week
    if (frequency === 'weekly' && (!days_of_week || days_of_week.length === 0)) {
      return res.status(400).json({ 
        message: "Weekly frequency requires days_of_week array" 
      });
    }

    // Create datetime string from date and time
    const createDateTimeString = (date: string, time: string): string => {
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes).toISOString();
    };

    const scheduledPickupTime = createDateTimeString(start_date, scheduled_time);
    const scheduledReturnTime = return_time ? createDateTimeString(start_date, return_time) : undefined;

    // Calculate end date based on duration (weeks)
    const startDate = new Date(scheduledPickupTime);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (duration * 7));

    // Build trip object
    // For group trips, don't include client_id (similar to regular group trip creation)
    // client_id must be a valid UUID or omitted entirely (not empty string)
    const tripData: any = {
      program_id,
    };
    
    // Only include client_id if it's a valid non-empty string (not undefined, null, or empty)
    if (client_id && typeof client_id === 'string' && client_id.trim() !== '') {
      tripData.client_id = client_id;
    }
    
    // Only include client_group_id if provided
    if (client_group_id) {
      tripData.client_group_id = client_group_id;
    }
    
    console.log('🔍 Built tripData:', {
      has_client_id: !!tripData.client_id,
      client_id_value: tripData.client_id,
      has_client_group_id: !!tripData.client_group_id,
      client_group_id_value: tripData.client_group_id,
      is_group_trip: is_group_trip
    });
    
    // Add remaining fields
    tripData.driver_id = driver_id || undefined;
    tripData.trip_type = trip_type as 'one_way' | 'round_trip';
    tripData.pickup_address = pickup_address;
    tripData.dropoff_address = dropoff_address;
    tripData.scheduled_pickup_time = scheduledPickupTime;
    tripData.scheduled_return_time = scheduledReturnTime;
    tripData.passenger_count = passenger_count || 1;
    tripData.special_requirements = special_requirements || undefined;
    tripData.status = 'scheduled';
    tripData.notes = notes || undefined;
    tripData.trip_category_id = trip_category_id || undefined;
    tripData.recurring_end_date = endDate.toISOString().split('T')[0]; // Store as DATE
    tripData.is_group_trip = is_group_trip || false;

    // Build pattern object
    const pattern = {
      frequency: frequency as 'daily' | 'weekly' | 'monthly',
      days_of_week: days_of_week || undefined,
      end_date: endDate.toISOString().split('T')[0]
    };

    // Create recurring trip series
    const createdTrips = await enhancedTripsStorage.createRecurringTripSeries(tripData, pattern);

    // Broadcast trip creation for each trip
    createdTrips.forEach(trip => {
      broadcastTripCreated(trip);
    });

    // Log trip creation activity (single log entry for all recurring trips)
    try {
      const metadata: any = {
        trip_count: createdTrips.length,
      };
      
      // Get client/group info from first trip (all trips in series have same client/group)
      if (createdTrips.length > 0) {
        const firstTrip = createdTrips[0];
        
        // Handle single client trip
        if (client_id) {
          try {
            const client = await clientsStorage.getClient(client_id);
            if (client) {
              metadata.client_id = client.id;
              const clientName = [client.first_name, client.last_name].filter(Boolean).join(' ');
              if (clientName) {
                metadata.client_name = clientName;
              }
            }
          } catch (clientError) {
            console.warn('Could not fetch client for activity log:', clientError);
          }
        }
        
        // Handle group trip
        if (client_group_id) {
          try {
            const { data: group } = await supabase
              .from('client_groups')
              .select('id, name')
              .eq('id', client_group_id)
              .single();
            if (group) {
              metadata.client_group_id = group.id;
              metadata.client_group_name = group.name;
            }
          } catch (groupError) {
            console.warn('Could not fetch client group for activity log:', groupError);
          }
        }
      }

      // Get program corporate_client_id for scoping
      let programCorporateClientId: string | null = null;
      try {
        const { programsStorage } = await import('../minimal-supabase');
        const program = await programsStorage.getProgram(program_id);
        if (program?.corporate_client_id) {
          programCorporateClientId = program.corporate_client_id;
        }
      } catch (programError) {
        console.warn("Could not fetch program for activity log:", programError);
      }

      // Log activity using first trip ID (all trips in series share same metadata)
      // TODO: Re-enable when logTripActivity is implemented
      // await logTripActivity(
      //   createdTrips[0].id,
      //   req.user!.userId,
      //   metadata,
      //   programCorporateClientId || req.user?.corporateClientId || null,
      //   program_id
      // );
    } catch (activityError) {
      console.error('Error logging recurring trip activity:', activityError);
      // Don't throw - activity logging is non-critical
    }

    res.status(201).json({
      message: `Successfully created ${createdTrips.length} recurring trips`,
      recurring_trip_id: createdTrips[0]?.recurring_trip_id,
      trips: createdTrips,
      count: createdTrips.length
    });
  } catch (error: any) {
    console.error("Error creating recurring trips:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    console.error("Request body:", JSON.stringify(req.body, null, 2));
    res.status(500).json({ 
      message: "Failed to create recurring trips",
      error: error.message,
      details: error.details || error.hint || error.code || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Single trip by ID - must come LAST to avoid matching other routes
router.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const trip = await tripsStorage.getTrip(id);
    
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    res.json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(500).json({ message: "Failed to fetch trip" });
  }
});

router.post("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), requireProgramAccess('program_id'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    // Validate required fields
    if (!req.body.program_id) {
      console.error("❌ POST /trips: Missing program_id in request body");
      console.error("❌ Request body:", JSON.stringify(req.body, null, 2));
      return res.status(400).json({ 
        message: "Program ID is required",
        error: "MISSING_PROGRAM_ID"
      });
    }

    const trip = await tripsStorage.createTrip(req.body);
    
    // Prepare notification targets
    let driverUserId: string | undefined;
    let programCorporateClientId: string | undefined;
    
    // Fetch program to get corporate_client_id for proper notification scoping
    try {
      const { programsStorage } = await import('../minimal-supabase');
      const program = await programsStorage.getProgram(trip.program_id);
      if (program?.corporate_client_id) {
        programCorporateClientId = program.corporate_client_id;
      }
    } catch (programError) {
      console.warn("Could not fetch program for notification:", programError);
      // Continue without program corporate_client_id - will use fallback
    }
    
    // If trip has an assigned driver, get their user_id for targeted notification
    if (trip.driver_id) {
      try {
        const driver = await driversStorage.getDriver(trip.driver_id);
        console.log(`🔍 Driver data for driver_id ${trip.driver_id}:`, {
          driver_id: driver?.id,
          user_id: driver?.user_id,
          hasUser: !!driver?.user_id
        });
        if (driver?.user_id) {
          driverUserId = driver.user_id;
          console.log(`✅ Found driver user_id for trip ${trip.id}: ${driverUserId} (driver_id: ${trip.driver_id})`);
        } else {
          console.warn(`⚠️ Driver ${trip.driver_id} has no user_id assigned`);
        }
      } catch (driverError) {
        console.error("❌ Could not fetch driver for notification:", driverError);
        // Continue without driver notification - still notify program users
      }
    } else {
      console.log(`ℹ️ Trip ${trip.id} has no driver assigned, will only notify program users`);
    }
    
    // Fetch trip with client data BEFORE broadcasting to ensure client name is available
    const tripWithClient = await tripsStorage.getTrip(trip.id);
    
    // Broadcast trip creation notification with client data
    // Use program's corporate_client_id (fetched above) or fallback to user's corporate_client_id
    if (tripWithClient) {
      broadcastTripCreated(tripWithClient, {
        userId: driverUserId, // Send to assigned driver if exists
        programId: trip.program_id, // Also notify all program users
        corporateClientId: programCorporateClientId || req.user?.corporateClientId || undefined
      });
    } else {
      // Fallback to trip without client data if fetch fails
      broadcastTripCreated(trip, {
        userId: driverUserId,
        programId: trip.program_id,
        corporateClientId: programCorporateClientId || req.user?.corporateClientId || undefined
      });
    }

    // Use tripWithClient for push notifications and activity logging
    if (tripWithClient) {
      (async () => {
        // Send push notification to client(s) for new trip (async, don't block response)
        sendClientPushNotifications(tripWithClient, undefined, 'scheduled').catch((error) => {
          console.error('Error sending client push notification for new trip:', error);
          // Don't throw - push notifications are non-critical
        });

        // Log trip creation activity
        try {
          console.log('🔍 [Trip Activity] Starting activity log for trip:', trip.id);
          const metadata: any = {};
          
          // Handle single client trip
          if (tripWithClient.client_id && tripWithClient.clients) {
            const client = Array.isArray(tripWithClient.clients) ? tripWithClient.clients[0] : tripWithClient.clients;
            if (client) {
              metadata.client_id = client.id;
              const clientName = [client.first_name, client.last_name].filter(Boolean).join(' ');
              if (clientName) {
                metadata.client_name = clientName;
              }
              console.log('🔍 [Trip Activity] Client info:', { client_id: client.id, client_name: metadata.client_name });
            }
          }
          
          // Handle group trip
          if (tripWithClient.client_group_id && tripWithClient.client_groups) {
            const group = Array.isArray(tripWithClient.client_groups) ? tripWithClient.client_groups[0] : tripWithClient.client_groups;
            if (group) {
              metadata.client_group_id = group.id;
              metadata.client_group_name = group.name;
              console.log('🔍 [Trip Activity] Group info:', { group_id: group.id, group_name: group.name });
            }
          }

          console.log('🔍 [Trip Activity] Logging with:', {
            tripId: trip.id,
            userId: req.user!.userId,
            programId: trip.program_id,
            corporateClientId: programCorporateClientId || req.user?.corporateClientId || null,
            metadata,
          });

          // TODO: Re-enable when logTripActivity is implemented
          // await logTripActivity(
          //   trip.id,
          //   req.user!.userId,
          //   metadata,
          //   programCorporateClientId || req.user?.corporateClientId || null,
          //   trip.program_id
          // );
          
          console.log('⏭️ [Trip Activity] Activity logging skipped (not implemented)');
        } catch (activityError) {
          console.error('❌ [Trip Activity] Error logging trip activity:', activityError);
          console.error('❌ [Trip Activity] Error stack:', activityError instanceof Error ? activityError.stack : 'No stack trace');
          // Don't throw - activity logging is non-critical
        }
      })().catch((error) => {
        console.error('Error in async trip processing:', error);
      });
    }
    
    res.status(201).json(trip);
  } catch (error: any) {
    console.error("❌ Error creating trip - FULL ERROR:");
    console.error("❌ Error type:", typeof error);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error code:", error?.code);
    console.error("❌ Error details:", error?.details);
    console.error("❌ Error hint:", error?.hint);
    console.error("❌ Request body:", JSON.stringify(req.body, null, 2));
    console.error("❌ Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Return detailed error information in response
    const errorResponse: any = {
      message: "Failed to create trip",
      error: error?.message || String(error),
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
    };
    
    // Include all error properties
    if (error?.code) errorResponse.code = error.code;
    if (error?.details) errorResponse.details = error.details;
    if (error?.hint) errorResponse.hint = error.hint;
    if (error?.stack) errorResponse.stack = error.stack;
    
    // Include request body for debugging
    errorResponse.requestBody = req.body;
    
    // Try to stringify full error
    try {
      errorResponse.fullError = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch (e) {
      errorResponse.fullError = "Could not stringify error";
    }
    
    res.status(500).json(errorResponse);
  }
});

// Helper function to get driver display name
async function getDriverDisplayName(driverId: string): Promise<string | undefined> {
  try {
    const driver = await driversStorage.getDriver(driverId);
    if (!driver) return undefined;
    
    // Try to get name from driver.users or driver directly
    if (driver.users?.user_name) {
      return driver.users.user_name;
    }
    // If driver has first_name/last_name, use those (might not be in schema but check anyway)
    if ((driver as any).first_name && (driver as any).last_name) {
      return `${(driver as any).first_name} ${(driver as any).last_name}`;
    }
    return undefined;
  } catch (error) {
    console.warn("Could not fetch driver name:", error);
    return undefined;
  }
}

/**
 * Send push notifications to clients when trip status changes
 */
async function sendClientPushNotifications(
  trip: any,
  previousStatus: string | undefined,
  newStatus: string
): Promise<void> {
  try {
    // Only send notifications for certain status changes
    const statusChanges: Record<string, string> = {
      'scheduled': 'Trip scheduled',
      'confirmed': 'Trip confirmed',
      'in_progress': 'Driver is on the way!',
      'completed': 'Trip completed',
      'cancelled': 'Trip cancelled'
    };

    const statusMessage = statusChanges[newStatus];
    if (!statusMessage) {
      return; // Don't send notification for this status
    }

    // Format trip time
    const formatTime = (dateString: string | undefined) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      } catch {
        return '';
      }
    };

    const pickupTime = formatTime(trip.scheduled_pickup_time);
    const clientName = trip.client ? `${trip.client.first_name} ${trip.client.last_name}` : 'Client';

    // Build notification payload
    const notificationPayload = {
      title: statusMessage,
      body: newStatus === 'in_progress' 
        ? `Your driver is on the way! Pickup scheduled for ${pickupTime}.`
        : newStatus === 'completed'
        ? `Your trip has been completed. Thank you!`
        : newStatus === 'cancelled'
        ? `Your trip scheduled for ${pickupTime} has been cancelled.`
        : `Your trip is ${newStatus}. Pickup scheduled for ${pickupTime}.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: {
        tripId: trip.id,
        status: newStatus,
        url: `/trips/${trip.id}`
      },
      tag: `trip-${trip.id}`,
      requireInteraction: newStatus === 'in_progress' // Require interaction for "driver on the way"
    };

    // Send to individual client
    if (trip.client_id && !trip.is_group_trip) {
      await pushNotificationService.sendPushToClient(trip.client_id, notificationPayload);
    }
    // Send to group members
    else if (trip.client_group_id || trip.is_group_trip) {
      const groupId = trip.client_group_id;
      if (groupId) {
        await pushNotificationService.sendPushToGroupMembers(groupId, notificationPayload);
      }
    }
  } catch (error) {
    console.error('Error sending client push notifications:', error);
    // Don't throw - push notifications are non-critical
  }
}

router.patch("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('🔍 PATCH /api/trips/:id called:', {
      tripId: id,
      updates: updates,
      userRole: req.user?.role,
      userId: req.user?.userId
    });
    
    // Fetch current trip to get previous status and driver info for notifications
    let previousStatus: string | undefined;
    let previousDriverId: string | undefined;
    let driverUserId: string | undefined;
    let driverName: string | undefined;
    let oldDriverUserId: string | undefined;
    
    try {
      const currentTrip = await tripsStorage.getTrip(id);
      if (currentTrip) {
        previousStatus = currentTrip.status;
        previousDriverId = currentTrip.driver_id;
        
        // Get driver's user_id if trip has an assigned driver
        if (currentTrip.driver_id) {
          try {
            const driver = await driversStorage.getDriver(currentTrip.driver_id);
            if (driver?.user_id) {
              driverUserId = driver.user_id;
            }
          } catch (driverError) {
            console.warn("Could not fetch driver for notification:", driverError);
          }
        }
      }
    } catch (fetchError) {
      console.warn("Could not fetch current trip for notification context:", fetchError);
      // Continue with update even if fetch fails
    }
    
    // Determine action type and detect driver assignment/modification
    let actionType: 'status_update' | 'assignment' | 'modification' | 'cancellation' = 'status_update';
    const isDriverUpdate = req.user?.role === 'driver';
    
    // Detect driver assignment (driver_id changed)
    if (updates.driver_id !== undefined && updates.driver_id !== previousDriverId) {
      actionType = 'assignment';
      // Get old driver's user_id if driver was reassigned
      if (previousDriverId) {
        try {
          const oldDriver = await driversStorage.getDriver(previousDriverId);
          if (oldDriver?.user_id) {
            oldDriverUserId = oldDriver.user_id;
          }
        } catch (error) {
          console.warn("Could not fetch old driver for notification:", error);
        }
      }
    }
    
    // Detect cancellation
    if (updates.status === 'cancelled' || (updates.status === undefined && previousStatus && previousStatus !== 'cancelled' && updates.notes?.toLowerCase().includes('cancel'))) {
      actionType = 'cancellation';
    }
    
    // Detect modification (non-status, non-assignment changes)
    if (!updates.status && updates.driver_id === undefined && Object.keys(updates).length > 0) {
      actionType = 'modification';
    }
    
    // If driver is making the update, get their name for admin notifications
    if (isDriverUpdate && req.user?.userId) {
      // Find driver record for this user
      try {
        const { data: driver } = await supabase
          .from('drivers')
          .select('id, users:user_id (user_name)')
          .eq('user_id', req.user.userId)
          .single();
        
        if (driver) {
          const users = Array.isArray(driver.users) ? driver.users : [driver.users];
          driverName = users[0]?.user_name || 'Driver';
        }
      } catch (error) {
        console.warn("Could not fetch driver name:", error);
      }
    }
    
    // If status is being updated, use the validated updateTripStatus method
    if (updates.status) {
      const { status, actualTimes, skipValidation, skipTimestampAutoSet, ...otherUpdates } = updates;
      
      // Use enhanced trips storage for status updates (includes validation)
      const trip = await enhancedTripsStorage.updateTripStatus(
        id,
        status,
        actualTimes,
        {
          userId: req.user?.userId,
          skipValidation: skipValidation === true,
          skipTimestampAutoSet: skipTimestampAutoSet === true
        }
      );
      
      // Apply any other updates if provided
      let finalTrip = trip;
      if (Object.keys(otherUpdates).length > 0) {
        finalTrip = await tripsStorage.updateTrip(id, otherUpdates);
      }
      
      // Update driverUserId if trip's driver changed
      if (finalTrip.driver_id && finalTrip.driver_id !== previousDriverId) {
        try {
          const driver = await driversStorage.getDriver(finalTrip.driver_id);
          if (driver?.user_id) {
            driverUserId = driver.user_id;
          }
          // Get driver name for new assignment
          if (actionType === 'assignment') {
            driverName = await getDriverDisplayName(finalTrip.driver_id);
          }
        } catch (driverError) {
          console.warn("Could not fetch updated driver for notification:", driverError);
        }
      } else if (finalTrip.driver_id && isDriverUpdate) {
        // If driver is updating their own trip status, get their name
        driverName = await getDriverDisplayName(finalTrip.driver_id);
        // Also get driver's user_id if not already set
        if (!driverUserId && finalTrip.driver_id) {
          try {
            const driver = await driversStorage.getDriver(finalTrip.driver_id);
            if (driver?.user_id) {
              driverUserId = driver.user_id;
            }
          } catch (driverError) {
            console.warn("Could not fetch driver user_id for notification:", driverError);
          }
        }
      }
      
      // Fetch trip with client data before broadcasting to ensure client name is available
      const tripWithClientData = await tripsStorage.getTrip(id);
      const tripForBroadcast = tripWithClientData || finalTrip;
      
      console.log('🔍 About to broadcast trip update:', {
        tripId: id,
        status: finalTrip.status,
        previousStatus: previousStatus,
        programId: finalTrip.program_id,
        driverUserId: driverUserId,
        driverName: driverName,
        actionType: actionType,
        isDriverUpdate: isDriverUpdate,
        userRole: req.user?.role
      });
      
      // Broadcast trip update via WebSocket with driver context
      broadcastTripUpdate(
        tripForBroadcast,
        previousStatus,
        {
          programId: finalTrip.program_id,
          corporateClientId: req.user?.corporateClientId || undefined,
          role: req.user?.role,
          driverId: driverUserId,
          userId: driverUserId, // Also send to driver's user_id
          updatedBy: req.user?.userId,
          driverName: driverName,
          action: actionType
        }
      );
      
      console.log('✅ broadcastTripUpdate call completed');
      
      // If driver was reassigned, notify old driver
      if (oldDriverUserId && actionType === 'assignment') {
        broadcastTripUpdate(
          finalTrip,
          previousStatus,
          {
            userId: oldDriverUserId,
            programId: finalTrip.program_id,
            corporateClientId: req.user?.corporateClientId || undefined,
            role: 'driver',
            action: 'assignment',
            updatedBy: req.user?.userId
          }
        );
      }

    // Fetch trip with client data for push notifications
    // Send push notifications to clients (async, don't block response)
    tripsStorage.getTrip(id).then((tripWithClient) => {
      if (tripWithClient) {
        sendClientPushNotifications(tripWithClient, previousStatus, status).catch((error) => {
          console.error('Error sending client push notifications:', error);
          // Don't throw - push notifications are non-critical
        });
      }
    }).catch((error) => {
      console.error('Error fetching trip for push notifications:', error);
    });
      
      res.json(finalTrip);
    } else {
      // For non-status updates, use the regular update method
      const trip = await tripsStorage.updateTrip(id, updates);
      
      // Update driverUserId if trip's driver changed
      if (trip.driver_id && trip.driver_id !== previousDriverId) {
        try {
          const driver = await driversStorage.getDriver(trip.driver_id);
          if (driver?.user_id) {
            driverUserId = driver.user_id;
          }
          // Get driver name for new assignment
          if (actionType === 'assignment') {
            driverName = await getDriverDisplayName(trip.driver_id);
          }
        } catch (driverError) {
          console.warn("Could not fetch updated driver for notification:", driverError);
        }
      }
      
      // Broadcast trip update via WebSocket with action context
      broadcastTripUpdate(
        trip,
        undefined,
        {
          programId: trip.program_id,
          corporateClientId: req.user?.corporateClientId || undefined,
          role: req.user?.role,
          driverId: driverUserId,
          updatedBy: req.user?.userId,
          driverName: driverName,
          action: actionType
        }
      );
      
      // If driver was reassigned, notify old driver
      if (oldDriverUserId && actionType === 'assignment') {
        broadcastTripUpdate(
          trip,
          undefined,
          {
            userId: oldDriverUserId,
            programId: trip.program_id,
            corporateClientId: req.user?.corporateClientId || undefined,
            role: 'driver',
            action: 'assignment',
            updatedBy: req.user?.userId
          }
        );
      }
      
      res.json(trip);
    }
  } catch (error: any) {
    console.error("❌ Error updating trip:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    
    // Return 400 for validation errors, 500 for other errors
    if (error.message && error.message.includes('Invalid status transition')) {
      res.status(400).json({ 
        message: error.message,
        error: 'VALIDATION_ERROR'
      });
    } else {
      // Return detailed error information to help debug
      const errorResponse: any = {
        message: error.message || "Failed to update trip",
        error: error.code || 'UNKNOWN_ERROR'
      };
      
      // Include additional Supabase error details if available
      if (error.details) errorResponse.details = error.details;
      if (error.hint) errorResponse.hint = error.hint;
      if (error.code) errorResponse.code = error.code;
      
      res.status(500).json(errorResponse);
    }
  }
});

router.delete("/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Fetch trip before deletion to get driver info for notification
    let driverUserId: string | undefined;
    let tripProgramId: string | undefined;
    
    try {
      const trip = await tripsStorage.getTrip(id);
      if (trip) {
        tripProgramId = trip.program_id;
        
        // Get driver's user_id if trip has an assigned driver
        if (trip.driver_id) {
          try {
            const driver = await driversStorage.getDriver(trip.driver_id);
            if (driver?.user_id) {
              driverUserId = driver.user_id;
            }
          } catch (driverError) {
            console.warn("Could not fetch driver for deletion notification:", driverError);
          }
        }
      }
    } catch (fetchError) {
      console.warn("Could not fetch trip for deletion notification context:", fetchError);
    }
    
    // Delete the trip
    await tripsStorage.deleteTrip(id);
    
    // Notify driver and program users about trip deletion/cancellation
    if (tripProgramId) {
      broadcastTripUpdate(
        { id, status: 'cancelled' }, // Minimal trip data for deletion notification
        undefined,
        {
          programId: tripProgramId,
          corporateClientId: req.user?.corporateClientId || undefined,
          role: req.user?.role,
          driverId: driverUserId,
          updatedBy: req.user?.userId,
          action: 'cancellation'
        }
      );
    }
    
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ message: "Failed to delete trip" });
  }
});

// ============================================================================
// TRIP CATEGORIES ROUTES
// ============================================================================

router.get("/categories", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const categories = await tripCategoriesStorage.getAllTripCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});

router.get("/categories/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const category = await tripCategoriesStorage.getTripCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: "Trip category not found" });
    }
    
    res.json(category);
  } catch (error) {
    console.error("Error fetching trip category:", error);
    res.status(500).json({ message: "Failed to fetch trip category" });
  }
});

router.get("/categories/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const categories = await tripCategoriesStorage.getTripCategoriesByProgram(programId);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories by program:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});

router.post("/categories", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const category = await tripCategoriesStorage.createTripCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating trip category:", error);
    res.status(500).json({ message: "Failed to create trip category" });
  }
});

router.patch("/categories/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const category = await tripCategoriesStorage.updateTripCategory(id, req.body);
    res.json(category);
  } catch (error) {
    console.error("Error updating trip category:", error);
    res.status(500).json({ message: "Failed to update trip category" });
  }
});

router.delete("/categories/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await tripCategoriesStorage.deleteTripCategory(id);
    res.json({ message: "Trip category deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip category:", error);
    res.status(500).json({ message: "Failed to delete trip category" });
  }
});

// ============================================================================
// ENHANCED TRIPS ROUTES
// ============================================================================

router.get("/enhanced", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trips = await enhancedTripsStorage.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/enhanced/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const trip = await enhancedTripsStorage.getTrip(id);
    
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    res.json(trip);
  } catch (error) {
    console.error("Error fetching enhanced trip:", error);
    res.status(500).json({ message: "Failed to fetch trip" });
  }
});

// ============================================================================
// ROUTE ESTIMATION ROUTES
// ============================================================================

router.post("/estimate-route", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { fromAddress, toAddress, fromCoords, toCoords } = req.body;

    if (!fromAddress || !toAddress) {
      return res.status(400).json({ message: "fromAddress and toAddress are required" });
    }

    console.log(`📏 [API] Route estimation request: "${fromAddress}" → "${toAddress}"`);
    
    const { estimateRoute } = await import("../services/openroute-service");
    const result = await estimateRoute(
      fromAddress,
      toAddress,
      fromCoords ? { lat: fromCoords.lat, lng: fromCoords.lng } : undefined,
      toCoords ? { lat: toCoords.lat, lng: toCoords.lng } : undefined
    );

    if (!result) {
      console.error(`❌ [API] Route estimation failed for: "${fromAddress}" → "${toAddress}"`);
      return res.status(500).json({ 
        message: "Could not estimate route",
        details: "Geocoding or route calculation failed. Check server logs for details."
      });
    }

    console.log(`✅ [API] Route estimated: ${result.distance} mi, ${result.duration} min`);
    res.json(result);
  } catch (error) {
    console.error("❌ [API] Error estimating route:", error);
    res.status(500).json({ 
      message: "Failed to estimate route",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

router.post("/estimate-multi-leg-route", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { addresses, coordinates } = req.body;

    if (!addresses || !Array.isArray(addresses) || addresses.length < 2) {
      return res.status(400).json({ message: "addresses array with at least 2 addresses is required" });
    }

    const { estimateMultiLegRoute } = await import("../services/openroute-service");
    const coords = coordinates?.map((c: any) => ({ lat: c.lat, lng: c.lng }));
    const results = await estimateMultiLegRoute(addresses, coords);

    res.json({ legs: results });
  } catch (error) {
    console.error("Error estimating multi-leg route:", error);
    res.status(500).json({ message: "Failed to estimate multi-leg route" });
  }
});

export default router;










