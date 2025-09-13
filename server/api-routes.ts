import express from "express";
import { storage } from "./minimal-supabase";
import { supabase } from "./db";
import bcrypt from "bcrypt";
import { 
  login, 
  logout, 
  getCurrentUser, 
  demoLogin, 
  register,
  requireAuth, 
  requirePermission, 
  requireOrganizationAccess, 
  requireRole,
  AuthenticatedRequest
} from "./auth";
import { PERMISSIONS } from "./permissions";
import { upload, processAvatar, processLogo, deleteFile } from "./upload";

const router = express.Router();

// Add middleware to ensure API routes are handled correctly
router.use((req, res, next) => {
  console.log(`🔍 API Route called: ${req.method} ${req.originalUrl}`);
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Authentication routes
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.post("/auth/register", register);
router.post("/auth/demo-login", demoLogin);
router.get("/auth/user", getCurrentUser);

// Billing PIN management routes
router.post("/user/billing-pin", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { pin } = req.body;
    
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }

    // Check for weak PINs
    const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
    if (weakPins.includes(pin)) {
      return res.status(400).json({ message: "Please choose a more secure PIN" });
    }

    // Hash the PIN for security
    const hashedPin = await bcrypt.hash(pin, 12);
    
    // Update user's billing PIN
    const userId = req.user.user_id; // Use snake_case field name
    
    const { data, error } = await supabase
      .from('users')
      .update({ billing_pin: hashedPin })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error("Failed to update billing PIN:", error);
      return res.status(500).json({ message: "Failed to set billing PIN" });
    }

    res.json({ message: "Billing PIN set successfully" });
  } catch (error) {
    console.error("Billing PIN setup error:", error);
    res.status(500).json({ message: "Failed to set billing PIN" });
  }
});

router.post("/user/validate-billing-pin", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { pin } = req.body;
    
    if (!pin || pin.length !== 4) {
      return res.status(400).json({ message: "Invalid PIN format" });
    }

    // Get user's billing PIN
    const userId = req.user.user_id; // Use snake_case field name
    const { data: userData, error } = await supabase
      .from('users')
      .select('billing_pin')
      .eq('user_id', userId)
      .single();

    if (error || !userData || !userData.billing_pin) {
      return res.status(400).json({ message: "No billing PIN set" });
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, userData.billing_pin);
    
    if (!isValid) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    res.json({ message: "PIN validated successfully" });
  } catch (error) {
    console.error("PIN validation error:", error);
    res.status(500).json({ message: "Failed to validate PIN" });
  }
});

// Remove duplicate recurring trips route

router.post("/recurring-trips", requireAuth, async (req, res) => {
  console.log("🚀 POST /recurring-trips endpoint reached");
  try {
    const { 
      selectionType,
      clientId,
      clientGroupId,
      organizationId, 
      pickupAddress, 
      dropoffAddress, 
      scheduledTime,
      frequency,
      daysOfWeek,
      duration,
      tripType,
      tripNickname
    } = req.body;
    
    // Map days of week to numbers (Sunday = 0, Monday = 1, etc.)
    const dayMapping = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const firstDay = daysOfWeek && daysOfWeek[0] ? daysOfWeek[0].toLowerCase() : 'monday';
    const dayOfWeekNumber = dayMapping[firstDay] || 1;
    
    const recurringTripId = `recurring_trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Lookup group name if creating group trip
    let tripName = `Individual Trip - ${clientId}`;
    if (selectionType === 'group' && clientGroupId) {
      const { data: groupData } = await supabase
        .from('client_groups')
        .select('name')
        .eq('id', clientGroupId)
        .single();
      tripName = `Group Trip - ${groupData?.name || 'Unknown Group'}`;
    }

    // Insert recurring trip template
    const { data, error } = await supabase
      .from('recurring_trips')
      .insert({
        id: recurringTripId,
        organization_id: organizationId,
        client_id: selectionType === 'individual' ? clientId : null,
        client_group_id: selectionType === 'group' ? clientGroupId : null,
        name: tripName,
        trip_nickname: tripNickname || null,
        day_of_week: dayOfWeekNumber,
        time_of_day: scheduledTime,
        pickup_location: pickupAddress,
        dropoff_location: dropoffAddress,
        duration_weeks: parseInt(duration),
        is_round_trip: tripType === 'round_trip',
        is_active: true,
        created_by: (req as AuthenticatedRequest).user?.user_id || 'unknown'
      })
      .select();

    if (error) {
      console.error('Database insertion error:', error);
      throw error;
    }
    
    console.log("✅ Recurring trip template created:", recurringTripId);
    
    // Generate actual trip instances for the calendar
    const trips = [];
    const now = new Date();
    
    for (let week = 0; week < parseInt(duration); week++) {
      const tripDate = new Date(now);
      // Calculate next occurrence of the specified day
      const daysUntilTarget = (dayOfWeekNumber - now.getDay() + 7) % 7;
      tripDate.setDate(now.getDate() + daysUntilTarget + (week * 7));
      
      // Skip if date is in the past
      if (tripDate < now) continue;
      
      const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_w${week}`;
      
      // Create pickup datetime
      const [hours, minutes] = scheduledTime.split(':');
      const pickupDateTime = new Date(tripDate);
      pickupDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Add group name for display
      let groupName = null;
      if (selectionType === 'group' && clientGroupId) {
        const { data: groupData } = await supabase
          .from('client_groups')
          .select('name')
          .eq('id', clientGroupId)
          .single();
        groupName = groupData?.name || null;
      }

      trips.push({
        id: tripId,
        organization_id: organizationId,
        client_id: selectionType === 'individual' ? clientId : null,
        client_group_id: selectionType === 'group' ? clientGroupId : null,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        scheduled_pickup_time: pickupDateTime.toISOString(),
        trip_type: tripType,
        status: 'scheduled',
        is_recurring: true,
        recurring_trip_id: recurringTripId,
        group_name: groupName
      });
    }
    
    // Insert all trip instances
    if (trips.length > 0) {
      const { error: tripsError } = await supabase
        .from('trips')
        .insert(trips);
        
      if (tripsError) {
        console.error('Error creating trip instances:', tripsError);
        throw tripsError;
      }
      
      console.log(`✅ Created ${trips.length} trip instances for recurring trip`);
    }
    
    res.json({ 
      success: true, 
      recurringTripId,
      tripInstancesCreated: trips.length,
      message: "Recurring trip created successfully with calendar entries" 
    });
  } catch (error) {
    console.error('Error creating recurring trip:', error);
    res.status(500).json({ error: 'Failed to create recurring trip' });
  }
});

// Modify recurring trip - single instance or all future instances
router.patch("/recurring-trips/:id/modify", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tripInstanceId, 
      modifyScope, // 'single' or 'all_future'
      updates 
    } = req.body;
    
    console.log('🔄 Modifying recurring trip:', { id, tripInstanceId, modifyScope, updates });
    
    if (modifyScope === 'single') {
      // Modify only the specific trip instance
      const { data: updatedTrip, error } = await supabase
        .from('trips')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripInstanceId)
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        modifiedTrip: updatedTrip,
        scope: 'single'
      });
      
    } else if (modifyScope === 'all_future') {
      // Modify the recurring trip template and all future instances
      const currentDate = new Date().toISOString();
      
      // Update recurring trip template
      if (updates.recurring_updates) {
        await supabase
          .from('recurring_trips')
          .update({
            ...updates.recurring_updates,
            updated_at: currentDate
          })
          .eq('id', id);
      }
      
      // Update all future trip instances (scheduled_pickup_time >= today)
      const { data: updatedTrips, error } = await supabase
        .from('trips')
        .update({
          ...updates,
          updated_at: currentDate
        })
        .eq('recurring_trip_id', id)
        .gte('scheduled_pickup_time', currentDate)
        .select();
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        modifiedTrips: updatedTrips,
        scope: 'all_future',
        count: updatedTrips?.length || 0
      });
    }
    
  } catch (error) {
    console.error('Error modifying recurring trip:', error);
    res.status(500).json({ error: 'Failed to modify recurring trip' });
  }
});





// Driver schedules for organization
router.get('/driver-schedules/organization/:organizationId', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.params;
    console.log('🔍 Fetching driver schedules for organization:', organizationId);
    
    const { data, error } = await supabase
      .from('driver_schedules')
      .select(`
        *,
        drivers!inner(
          id,
          users!inner(user_name)
        )
      `)
      .eq('organization_id', organizationId);
    
    if (error) {
      console.error('Error fetching driver schedules:', error);
      throw error;
    }
    
    const schedules = data?.map(schedule => ({
      id: schedule.id,
      driver_id: schedule.driver_id,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      days_of_week: schedule.day_of_week !== null ? [schedule.day_of_week] : [],
      is_active: schedule.is_available !== false,
      created_at: schedule.created_at,
      updated_at: schedule.updated_at || schedule.created_at,
      driver_name: schedule.drivers?.users?.user_name || 'Unknown Driver'
    })) || [];
    
    console.log(`📊 Found ${schedules.length} driver schedules for ${organizationId}`);
    res.json(schedules);
    
  } catch (error) {
    console.error("Error fetching driver schedules:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});

// User management routes (super admin only)
router.post("/users", requireAuth, requireRole('super_admin'), async (req, res) => {
  try {
    console.log("Creating user with data:", req.body);
    
    // Generate unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    
    const userData = {
      userId: userId,
      userName: req.body.email,
      email: req.body.email,
      passwordHash: hashedPassword,
      role: req.body.role,
      primaryOrganizationId: req.body.primaryOrganizationId,
      authorizedOrganizations: req.body.authorizedOrganizations || [req.body.primaryOrganizationId],
      isActive: true
    };
    
    const user = await storage.createUser(userData);
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ message: "Failed to create user", error: error.message });
  }
});

// Update user (edit profile or toggle status)
router.patch("/users/:userId", requireAuth, requireRole('super_admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    console.log("Updating user:", userId, "with:", updates);
    
    // Build update object based on provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.hasOwnProperty('isActive')) {
      updateData.is_active = updates.isActive;
    }
    if (updates.userName) {
      updateData.user_name = updates.userName;
    }
    if (updates.email) {
      updateData.email = updates.email;
    }
    if (updates.role) {
      updateData.role = updates.role;
    }
    if (updates.primaryOrganizationId) {
      updateData.primary_organization_id = updates.primaryOrganizationId;
    }
    if (updates.authorizedOrganizations) {
      updateData.authorized_organizations = updates.authorizedOrganizations;
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error("User update error:", error);
      return res.status(400).json({ message: "Failed to update user", error: error.message });
    }

    console.log("User updated successfully:", data.email);
    
    // Transform response to match frontend expectations
    const userResponse = {
      userId: data.user_id,
      userName: data.user_name,
      email: data.email,
      role: data.role,
      primaryOrganizationId: data.primary_organization_id,
      authorizedOrganizations: data.authorized_organizations,
      isActive: data.is_active
    };
    
    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
});

// Delete user
router.delete("/users/:userId", requireAuth, requireRole('super_admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log("Deleting user:", userId);
    
    // First check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error("User deletion error:", error);
      return res.status(400).json({ message: "Failed to delete user", error: error.message });
    }

    console.log("User deleted successfully:", existingUser.email);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
});

// General trips endpoint for calendar component
// Get individual trip by ID
router.get("/trips/:tripId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { tripId } = req.params;
    
    console.log(`🔍 Fetching trip: ${tripId}`);
    
    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        *,
        clients (
          first_name,
          last_name
        )
      `)
      .eq('id', tripId)
      .single();
    
    if (error) {
      console.error('Error fetching trip:', error);
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Get driver information if driver_id exists
    let driverName = null;
    if (trip.driver_id) {
      const { data: driver } = await supabase
        .from('drivers')
        .select('user_name')
        .eq('id', trip.driver_id)
        .single();
      driverName = driver?.user_name || null;
    }

    // Format the response with joined data
    const formattedTrip = {
      ...trip,
      client_name: trip.clients ? `${trip.clients.first_name} ${trip.clients.last_name}` : 'Unknown Client',
      driver_name: driverName
    };
    
    res.json(formattedTrip);
  } catch (error) {
    console.error('Error in trip fetch endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

router.get("/trips", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { organization_id } = req.query;
    
    if (!organization_id) {
      return res.status(400).json({ message: "organization_id is required" });
    }
    
    console.log(`🔍 Fetching trips for organization: ${organization_id}`);
    const trips = await storage.getTripsByOrganization(organization_id as string);
    console.log(`📋 Found ${trips.length} trips for organization ${organization_id}`);
    
    // Enhance trips with client and driver details
    const tripsWithDetails = await Promise.all(
      trips.map(async (trip) => {
        const client = await storage.getClient(trip.client_id);
        const driver = trip.driver_id ? await storage.getDriver(trip.driver_id) : null;
        
        return {
          ...trip,
          client_first_name: client?.first_name || "Unknown",
          client_last_name: client?.last_name || "Client", 
          driver_name: driver?.user_name || null
        };
      })
    );
    
    res.json(tripsWithDetails);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

// Health check for mobile app connectivity
router.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    mobileSupport: true 
  });
});

// Driver trips endpoint for web application
router.get("/trips/driver/:driverId", async (req, res) => {
  try {
    const driverId = req.params.driverId;
    console.log(`🔍 Fetching trips for driver: ${driverId}`);
    
    const trips = await storage.getTripsByDriver(driverId);
    console.log(`📋 Found ${trips.length} trips for driver ${driverId}`);
    
    // Enhance trips with client details
    const enhancedTrips = await Promise.all(
      trips.map(async (trip) => {
        const client = await storage.getClient(trip.client_id);
        return {
          ...trip,
          pickup_location: trip.pickup_address || trip.pickup_location,
          dropoff_location: trip.dropoff_address || trip.dropoff_location,
          scheduled_pickup_time: trip.scheduled_pickup_time,
          passenger_count: trip.passenger_count || 1,
          status: trip.status || 'scheduled',
          client_first_name: client?.first_name || "Unknown",
          client_last_name: client?.last_name || "Client",
          client_name: client ? `${client.first_name} ${client.last_name}` : "Unknown Client"
        };
      })
    );
    
    console.log(`📋 Enhanced ${enhancedTrips.length} trips with client details for driver ${driverId}`);
    res.json(enhancedTrips);
  } catch (error) {
    console.error("Error fetching driver trips:", error);
    res.status(500).json({ message: "Failed to fetch driver trips" });
  }
});

// Trip status update endpoint with tracking data support
router.put("/trips/:tripId/status", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = req.params.tripId;
    const { 
      status, 
      start_latitude, 
      start_longitude, 
      end_latitude, 
      end_longitude,
      distance_miles,
      fuel_cost,
      driver_notes,
      actual_pickup_time,
      actual_dropoff_time
    } = req.body;
    
    // Validate status transitions
    const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    console.log(`🔄 Updating trip ${tripId} with tracking data:`, {
      status,
      hasStartLocation: !!(start_latitude && start_longitude),
      hasEndLocation: !!(end_latitude && end_longitude),
      distance_miles,
      fuel_cost
    });
    
    // Get current trip to verify it exists and user has permission
    const organizationTrips = await storage.getTripsByOrganization(req.user!.primary_organization_id!);
    const currentTrip = organizationTrips.find(trip => trip.id === tripId);
    if (!currentTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    // For drivers, verify they own this trip
    if (req.user!.role === 'driver') {
      const drivers = await storage.getDriversByOrganization(req.user!.primary_organization_id!);
      const driverRecord = drivers.find(d => d.user_id === req.user!.user_id);
      
      if (!driverRecord || currentTrip.driver_id !== driverRecord.id) {
        return res.status(403).json({ message: "Not authorized to update this trip" });
      }
    }
    
    // Build update object with only provided fields
    const updateData: any = { status };
    
    if (start_latitude !== undefined) updateData.start_latitude = start_latitude;
    if (start_longitude !== undefined) updateData.start_longitude = start_longitude;
    if (end_latitude !== undefined) updateData.end_latitude = end_latitude;
    if (end_longitude !== undefined) updateData.end_longitude = end_longitude;
    if (distance_miles !== undefined) updateData.distance_miles = distance_miles;
    if (fuel_cost !== undefined) updateData.fuel_cost = fuel_cost;
    if (driver_notes !== undefined) updateData.driver_notes = driver_notes;
    if (actual_pickup_time !== undefined) updateData.actual_pickup_time = actual_pickup_time;
    if (actual_dropoff_time !== undefined) updateData.actual_dropoff_time = actual_dropoff_time;
    
    // Update trip with tracking data using direct Supabase query for new fields
    const { data: updatedTrip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .select()
      .single();
    
    if (error) {
      console.error("Database update error:", error);
      throw error;
    }
    
    console.log(`✅ Trip ${tripId} updated successfully with tracking data`);
    res.json(updatedTrip);
  } catch (error) {
    console.error("Error updating trip with tracking data:", error);
    res.status(500).json({ message: "Failed to update trip" });
  }
});

// Mobile driver trips endpoint
router.get("/mobile/driver/trips", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.user.primary_organization_id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log("🔍 Mobile driver endpoint - User:", req.user.email, "Org:", req.user.primary_organization_id);

    // Get the driver record for this user
    const drivers = await storage.getDriversByOrganization(req.user.primary_organization_id);
    const driver = drivers.find(d => d.user_id === req.user?.user_id);
    
    console.log("🔍 Found driver record:", driver ? driver.id : "NOT FOUND", "for user:", req.user.user_id);
    
    if (!driver) {
      return res.status(404).json({ error: "Driver record not found" });
    }

    // Get trips assigned to this driver
    const allTrips = await storage.getTripsByOrganization(req.user.primary_organization_id);
    console.log("🔍 All trips for org:", allTrips.length, "Looking for driver_id:", driver.id);
    const driverTrips = allTrips.filter(trip => trip.driver_id === driver.id);
    console.log("🔍 Driver trips found:", driverTrips.length);

    // Enhance with client details
    const tripsWithDetails = await Promise.all(
      driverTrips.map(async (trip) => {
        const client = await storage.getClient(trip.client_id);
        return {
          ...trip,
          client_first_name: client?.first_name || "Unknown",
          client_last_name: client?.last_name || "Client"
        };
      })
    );

    res.json(tripsWithDetails);
  } catch (error) {
    console.error("Error fetching driver trips:", error);
    res.status(500).json({ error: "Failed to fetch driver trips" });
  }
});

// Debug session endpoint
router.get("/debug/session", (req: any, res) => {
  console.log('🔍 Session debug:', {
    sessionID: req.sessionID,
    session: req.session,
    cookies: req.headers.cookie
  });
  
  res.json({
    sessionID: req.sessionID,
    sessionExists: !!req.session,
    userId: req.session?.userId,
    role: req.session?.role,
    authenticated: !!req.session?.userId
  });
});

// Organization endpoints - removed duplicate, kept the one with PUT route

// Trips by organization
router.get('/trips/organization/:orgId', requireAuth, async (req, res) => {
  // Force no cache and disable etag
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': 'W/"debug-' + Date.now() + '"'
  });
  
  try {
    const { orgId } = req.params;
    const trips = await storage.getTripsByOrganization(orgId);
    
    // Enhance trips with client and driver details
    const tripsWithDetails = await Promise.all(
      trips.map(async (trip) => {
        const client = await storage.getClient(trip.client_id);
        const driver = trip.driver_id ? await storage.getDriver(trip.driver_id) : null;
        
        let clientName = "Unassigned Client";
        let clientFirstName = "";
        let clientLastName = "";
        
        // For group trips, ALWAYS use the group name
        if (trip.client_group_id) {
          const { data: groupData } = await supabase
            .from('client_groups')
            .select('name')
            .eq('id', trip.client_group_id)
            .single();
          if (groupData?.name) {
            clientName = groupData.name;
            clientFirstName = groupData.name;
            clientLastName = "";
          }
        } else if (client && client.first_name && client.last_name) {
          clientFirstName = client.first_name;
          clientLastName = client.last_name;
          clientName = `${clientFirstName} ${clientLastName}`;
        }
        
        const driverName = driver?.user_name || driver?.users?.user_name || null;
        
        // Get passenger count for group trips
        let passengerCount = trip.passenger_count || 1;
        if (trip.client_group_id) {
          const { data: memberData } = await supabase
            .from('client_group_memberships')
            .select('client_id')
            .eq('group_id', trip.client_group_id);
          passengerCount = memberData?.length || 1;
        }

        return {
          ...trip,
          client_name: clientName,
          client_first_name: clientFirstName,
          client_last_name: clientLastName,
          clientName: clientName,
          passengerCount: passengerCount,
          passenger_count: passengerCount,
          driver_name: driverName,
          // Also include direct client object for compatibility
          client: client ? {
            first_name: clientFirstName,
            last_name: clientLastName,
            phone: client.phone,
            email: client.email
          } : null
        };
      })
    );
    
    // Force no cache for debugging
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(tripsWithDetails);
  } catch (error) {
    console.error("Error fetching trips by organization:", error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Drivers by organization
router.get('/drivers/organization/:orgId', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    const drivers = await storage.getDriversByOrganization(orgId);
    res.json(drivers || []);
  } catch (error) {
    console.error("Error fetching drivers by organization:", error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Clients by organization
router.get('/clients/organization/:orgId', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    const clients = await storage.getClientsByOrganization(orgId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients by organization:", error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Update client
router.put('/clients/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedClient = await storage.updateClient(id, updates);
    res.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Organizations endpoint
router.get('/organizations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const organizations = await storage.getAllOrganizations();
    const organization = organizations.find(org => org.id === id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// Update organization
router.put('/organizations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Update organization in Supabase
    const { data: updatedOrg, error } = await supabase
      .from('organizations')
      .update({
        name: updates.name,
        address: updates.address,
        phone: updates.phone,
        email: updates.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating organization:", error);
      return res.status(500).json({ error: 'Failed to update organization' });
    }
    
    if (!updatedOrg) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// All vehicles (super admin only)
router.get('/super-admin/vehicles', requireAuth, requirePermission(PERMISSIONS.MANAGE_ORGANIZATIONS), async (req, res) => {
  try {
    const vehicles = await storage.getAllVehicles();
    res.json(vehicles || []);
  } catch (error) {
    console.error("Error fetching all vehicles:", error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Vehicles by organization
router.get('/vehicles/organization/:orgId', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    const vehicles = await storage.getVehiclesByOrganization(orgId);
    res.json(vehicles || []);
  } catch (error) {
    console.error("Error fetching vehicles by organization:", error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Create vehicle
router.post('/vehicles', requireAuth, requirePermission(PERMISSIONS.MANAGE_VEHICLES), async (req, res) => {
  try {
    const vehicleData = {
      id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organization_id: req.body.organization_id,
      year: parseInt(req.body.year),
      make: req.body.make,
      model: req.body.model,
      color: req.body.color,
      license_plate: req.body.license_plate || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const vehicle = await storage.createVehicle(vehicleData);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(400).json({ error: 'Failed to create vehicle' });
  }
});

// Update vehicle
router.patch('/vehicles/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_VEHICLES), async (req, res) => {
  try {
    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    // Convert year to integer if provided
    if (updates.year) {
      updates.year = parseInt(updates.year);
    }
    
    const vehicle = await storage.updateVehicle(req.params.id, updates);
    res.json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(400).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle
router.delete('/vehicles/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_VEHICLES), async (req, res) => {
  try {
    await storage.deleteVehicle(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// Create client
router.post('/clients', requireAuth, requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res) => {
  try {
    const clientData = {
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId: req.body.organizationId || req.body.organization_id,
      serviceAreaId: req.body.serviceAreaId || req.body.service_area_id,
      firstName: req.body.firstName || req.body.first_name,
      lastName: req.body.lastName || req.body.last_name,
      phone: req.body.phone,
      email: req.body.email || '',
      address: req.body.address,
      emergencyContact: req.body.emergencyContact || req.body.emergency_contact || null,
      emergencyPhone: req.body.emergencyPhone || req.body.emergency_phone || null,
      medicalNotes: req.body.medicalNotes || req.body.medical_notes || null,
      mobilityRequirements: req.body.mobilityRequirements || req.body.mobility_requirements || null,
      isActive: true
    };
    
    const client = await storage.createClient(clientData);
    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(400).json({ error: 'Failed to create client' });
  }
});

// Update client
router.patch('/clients/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res) => {
  try {
    const client = await storage.updateClient(req.params.id, req.body);
    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(400).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/clients/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res) => {
  try {
    await storage.deleteClient(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Create trip
router.post('/trips', requireAuth, requirePermission(PERMISSIONS.MANAGE_TRIPS), async (req, res) => {
  try {
    console.log("🚗 Creating trip with data:", req.body);
    
    // Handle client group trips vs individual client trips
    if (req.body.clientGroupId) {
      // Get all clients in the group
      const { data: groupClients, error } = await supabase
        .from('client_group_memberships')
        .select(`
          client_id,
          clients:client_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('group_id', req.body.clientGroupId);
      
      if (error) {
        throw new Error(`Failed to fetch group clients: ${error.message}`);
      }
      
      if (!groupClients || groupClients.length === 0) {
        return res.status(400).json({ error: 'No clients found in the selected group' });
      }
      
      // Create individual trips for each client in the group
      const createdTrips = [];
      for (const membership of groupClients) {
        const tripData = {
          id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          organization_id: req.body.organizationId || req.body.organization_id,
          client_id: membership.client_id,
          driver_id: req.body.driverId || req.body.driver_id || null,
          trip_type: req.body.tripType || req.body.trip_type,
          pickup_address: req.body.pickupAddress || req.body.pickup_address,
          dropoff_address: req.body.dropoffAddress || req.body.dropoff_address,
          scheduled_pickup_time: req.body.scheduledPickupTime || req.body.scheduled_pickup_time,
          scheduled_return_time: req.body.scheduledReturnTime || req.body.scheduled_return_time || null,
          passenger_count: 1, // Individual client per trip
          special_requirements: req.body.specialRequirements || req.body.special_requirements || null,
          status: 'scheduled',
          notes: req.body.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const trip = await storage.createTrip(tripData);
        createdTrips.push(trip);
      }
      
      console.log(`✅ Created ${createdTrips.length} trips for client group`);
      res.status(201).json({ 
        success: true, 
        message: `Created ${createdTrips.length} trips for client group`,
        trips: createdTrips 
      });
    } else {
      // Regular individual client trip
      const tripData = {
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organization_id: req.body.organizationId || req.body.organization_id,
        client_id: req.body.clientId || req.body.client_id,
        driver_id: req.body.driverId || req.body.driver_id || null,
        trip_type: req.body.tripType || req.body.trip_type,
        pickup_address: req.body.pickupAddress || req.body.pickup_address,
        dropoff_address: req.body.dropoffAddress || req.body.dropoff_address,
        scheduled_pickup_time: req.body.scheduledPickupTime || req.body.scheduled_pickup_time,
        scheduled_return_time: req.body.scheduledReturnTime || req.body.scheduled_return_time || null,
        passenger_count: req.body.passengerCount || req.body.passenger_count || 1,
        special_requirements: req.body.specialRequirements || req.body.special_requirements || null,
        status: 'scheduled',
        notes: req.body.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const trip = await storage.createTrip(tripData);
      console.log("✅ Trip created successfully:", trip.id);
      res.status(201).json(trip);
    }
  } catch (error) {
    console.error("❌ Error creating trip:", error);
    res.status(400).json({ error: 'Failed to create trip' });
  }
});

// Update trip
router.patch('/trips/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_TRIPS), async (req, res) => {
  try {
    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const trip = await storage.updateTrip(req.params.id, updates);
    res.json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(400).json({ error: 'Failed to update trip' });
  }
});

// Assign driver to trip
router.patch('/trips/:tripId/assign-driver', 
  requireAuth,
  requirePermission(PERMISSIONS.MANAGE_TRIPS),
  async (req: AuthenticatedRequest, res) => {
  try {
    const { tripId } = req.params;
    const { driverId } = req.body;
    
    console.log(`🚗 Attempting to assign driver ${driverId} to trip ${tripId}`);
    
    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required" });
    }
    
    // Update trip in Supabase directly
    const { data: updatedTrip, error } = await supabase
      .from('trips')
      .update({ 
        driver_id: driverId,
        updated_at: new Date().toISOString()
      })
      .eq('id', tripId)
      .select(`
        *,
        clients:client_id (
          first_name,
          last_name
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name
          )
        )
      `)
      .single();
    
    if (error) {
      console.error("❌ Error updating trip in database:", error);
      return res.status(500).json({ message: "Failed to assign driver to trip" });
    }
    
    console.log(`✅ Successfully assigned driver ${driverId} to trip ${tripId}`);
    res.json(updatedTrip);
  } catch (error) {
    console.error("❌ Error assigning driver:", error);
    res.status(500).json({ message: "Failed to assign driver" });
  }
});

// Delete trip endpoint removed - using the advanced delete endpoint below that handles recurring trips

// Service areas by organization
router.get('/serviceareas/organization/:orgId', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    const serviceAreas = await storage.getServiceAreasByOrganization(orgId);
    res.json(serviceAreas || []);
  } catch (error) {
    console.error("Error fetching service areas by organization:", error);
    res.status(500).json({ error: 'Failed to fetch service areas' });
  }
});

// Create service area
router.post('/serviceareas', requireAuth, async (req, res) => {
  try {
    const { organizationId, nickname, description, streetAddress, city, state, zipCode, fullAddress, boundaryCoordinates, isActive } = req.body;
    
    if (!organizationId || !nickname) {
      return res.status(400).json({ error: 'Organization ID and nickname are required' });
    }

    const serviceAreaData = {
      organization_id: organizationId,
      nickname,
      description: description || null,
      street_address: streetAddress || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      full_address: fullAddress || null,
      boundary_coordinates: boundaryCoordinates || null,
      is_active: isActive !== false // Default to true if not specified
    };

    const newServiceArea = await storage.createServiceArea(serviceAreaData);
    res.status(201).json(newServiceArea);
  } catch (error) {
    console.error("Error creating service area:", error);
    res.status(500).json({ error: 'Failed to create service area' });
  }
});

// Update service area
router.put('/serviceareas/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedServiceArea = await storage.updateServiceArea(id, updates);
    res.json(updatedServiceArea);
  } catch (error) {
    console.error("Error updating service area:", error);
    res.status(500).json({ error: 'Failed to update service area' });
  }
});

// Delete service area
router.delete('/serviceareas/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteServiceArea(id);
    res.json({ message: 'Service area deleted successfully' });
  } catch (error) {
    console.error("Error deleting service area:", error);
    res.status(500).json({ error: 'Failed to delete service area' });
  }
});

// Frequent locations by organization
router.get('/frequentlocations/organization/:orgId', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    const locations = await storage.getFrequentLocationsByOrganization(orgId);
    res.json(locations || []);
  } catch (error) {
    console.error("Error fetching frequent locations:", error);
    res.status(500).json({ error: 'Failed to fetch frequent locations' });
  }
});

// Create frequent location
router.post('/frequentlocations', requireAuth, async (req, res) => {
  try {
    const { organizationId, name, description, streetAddress, city, state, zipCode, fullAddress, locationType, isActive } = req.body;
    
    if (!organizationId || !name || !streetAddress || !city || !state) {
      return res.status(400).json({ error: 'Organization ID, name, street address, city, and state are required' });
    }

    const locationData = {
      organization_id: organizationId,
      name,
      description: description || null,
      street_address: streetAddress,
      city,
      state,
      zip_code: zipCode || null,
      full_address: fullAddress,
      location_type: locationType || 'destination',
      usage_count: 0,
      is_active: isActive !== false
    };

    const newLocation = await storage.createFrequentLocation(locationData);
    res.status(201).json(newLocation);
  } catch (error) {
    console.error("Error creating frequent location:", error);
    res.status(500).json({ error: 'Failed to create frequent location' });
  }
});

// Update frequent location
router.put('/frequentlocations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedLocation = await storage.updateFrequentLocation(id, updates);
    res.json(updatedLocation);
  } catch (error) {
    console.error("Error updating frequent location:", error);
    res.status(500).json({ error: 'Failed to update frequent location' });
  }
});

// Delete frequent location
router.delete('/frequentlocations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteFrequentLocation(id);
    res.json({ message: 'Frequent location deleted successfully' });
  } catch (error) {
    console.error("Error deleting frequent location:", error);
    res.status(500).json({ error: 'Failed to delete frequent location' });
  }
});

// Client groups by organization
router.get('/clientgroups/organization/:orgId', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    
    // Fetch client groups with client count
    const { data: clientGroups, error } = await supabase
      .from('client_groups')
      .select(`
        id,
        name,
        description,
        organization_id,
        service_area_id,
        expires_at,
        is_active,
        created_at,
        client_group_memberships (
          client_id
        )
      `)
      .eq('organization_id', orgId)
      .eq('is_active', true);
    
    if (error) {
      throw new Error(`Failed to fetch client groups: ${error.message}`);
    }
    
    // Add client count to each group
    const groupsWithCount = (clientGroups || []).map(group => ({
      ...group,
      clientCount: group.client_group_memberships?.length || 0
    }));
    
    res.json(groupsWithCount);
  } catch (error) {
    console.error("Error fetching client groups by organization:", error);
    res.status(500).json({ error: 'Failed to fetch client groups' });
  }
});

// Users by organization
router.get('/users/organization/:orgId', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    const users = await storage.getUsersByOrganization(orgId);
    res.json(users || []);
  } catch (error) {
    console.error("Error fetching users by organization:", error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Driver schedules by organization
router.get('/driverschedules/organization/:orgId', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    // Return empty array for now - driver schedules functionality can be implemented later
    res.json([]);
  } catch (error) {
    console.error("Error fetching driver schedules by organization:", error);
    res.status(500).json({ error: 'Failed to fetch driver schedules' });
  }
});

// Get all system permissions (temporarily bypassing auth for demonstration)
router.get('/permissions/all', async (req, res) => {
  try {
    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role', { ascending: true });

    if (error) {
      console.error("Error fetching all permissions:", error);
      return res.status(500).json({ message: "Failed to fetch permissions" });
    }

    const permissionsWithIds = permissions?.map((perm, index) => ({
      ...perm,
      id: `${perm.role}-${perm.permission}-${perm.resource}-${index}`
    })) || [];

    console.log(`Returning ${permissionsWithIds.length} permissions to frontend`);
    res.json(permissionsWithIds);
  } catch (error) {
    console.error("Error fetching all permissions:", error);
    res.status(500).json({ message: "Failed to fetch permissions" });
  }
});

// Super admin endpoints
router.get('/super-admin/drivers', requireRole('super_admin'), async (req, res) => {
  try {
    const drivers = await storage.getAllDrivers();
    res.json(drivers || []);
  } catch (error) {
    console.error("Error fetching all drivers:", error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

router.get('/super-admin/clients', requireRole('super_admin'), async (req, res) => {
  try {
    const clients = await storage.getAllClients();
    res.json(clients || []);
  } catch (error) {
    console.error("Error fetching all clients:", error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.get('/super-admin/vehicles', async (req, res) => {
  try {
    const organizations = await storage.getAllOrganizations();
    const allVehicles = [];
    
    for (const org of organizations) {
      const orgVehicles = await storage.getVehiclesByOrganization(org.id);
      const vehiclesWithOrgName = orgVehicles.map(vehicle => ({
        ...vehicle,
        organizationName: org.name
      }));
      allVehicles.push(...vehiclesWithOrgName);
    }

    res.json(allVehicles);
  } catch (error) {
    console.error("Error fetching all vehicles:", error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.get('/super-admin/trips', requireAuth, requireRole('super_admin'), async (req, res) => {
  try {
    console.log('🔐 Super admin trips request - Auth user:', req.user?.email || 'Unknown');
    
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        clients!inner(first_name, last_name, organization_id),
        drivers(
          id,
          users!inner(user_name)
        ),
        organizations!inner(id, name)
      `)
      .order('scheduled_pickup_time', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching super admin trips:', error);
      throw error;
    }
    
    // Transform the data to match expected format
    const trips = data?.map(trip => ({
      ...trip,
      organization_id: trip.clients?.organization_id,
      organization_name: trip.organizations?.name,
      clients: {
        first_name: trip.clients?.first_name,
        last_name: trip.clients?.last_name
      },
      drivers: trip.drivers ? {
        users: {
          user_name: trip.drivers.users?.user_name
        }
      } : null
    })) || [];
    
    console.log(`📊 Found ${trips.length} trips across all organizations`);
    res.json(trips);
    
  } catch (error) {
    console.error('❌ Super admin trips error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch trips',
      error: error.message 
    });
  }
});



// Client Groups API
router.post('/client-groups', requireAuth, async (req, res) => {
  try {
    const { name, description, organizationId, selectedClients, expiryOption } = req.body;
    
    // Generate group ID
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate expiry date
    let expiresAt = null;
    if (expiryOption && expiryOption !== 'never') {
      const now = new Date();
      switch (expiryOption) {
        case 'single':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
          break;
        case '7days':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }
    
    // Use direct Supabase query for client group creation
    const { data: newClientGroup, error: groupError } = await supabase
      .from('client_groups')
      .insert({
        id: groupId,
        organization_id: organizationId,
        name,
        description: description || null,
        service_area_id: null, // Cross-service area groups
        is_active: true,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (groupError) {
      throw groupError;
    }
    
    // Add client memberships using direct Supabase
    if (selectedClients && selectedClients.length > 0) {
      const memberships = selectedClients.map(clientId => ({
        id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${clientId}`,
        client_id: clientId,
        group_id: groupId,
        joined_at: new Date().toISOString()
      }));
      
      const { error: membershipError } = await supabase
        .from('client_group_memberships')
        .insert(memberships);
      
      if (membershipError) {
        throw membershipError;
      }
    }
    
    res.status(201).json({ 
      id: groupId, 
      name, 
      description, 
      clientCount: selectedClients?.length || 0,
      expiresAt 
    });
  } catch (error) {
    console.error("Error creating client group:", error);
    res.status(400).json({ error: 'Failed to create client group' });
  }
});

router.get('/client-groups/organization/:orgId', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const groups = await storage.getClientGroupsByOrganization(orgId);
    
    // Get client counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const clients = await storage.getClientsByGroup(group.id);
        return {
          ...group,
          clientCount: clients.length
        };
      })
    );
    
    res.json(groupsWithCounts);
  } catch (error) {
    console.error("Error fetching client groups:", error);
    res.status(500).json({ error: 'Failed to fetch client groups' });
  }
});

// Update client group
router.put('/client-groups/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const { data: updatedGroup, error } = await supabase
      .from('client_groups')
      .update({
        name,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating client group:', error);
      return res.status(500).json({ error: 'Failed to update client group' });
    }
    
    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating client group:', error);
    res.status(500).json({ error: 'Failed to update client group' });
  }
});

// Get clients in a group
router.get('/client-groups/:id/clients', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const clients = await storage.getClientsByGroup(id);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching group clients:', error);
    res.status(500).json({ error: 'Failed to fetch group clients' });
  }
});

// Add client to group
router.post('/client-groups/:groupId/clients/:clientId', requireAuth, async (req, res) => {
  try {
    const { groupId, clientId } = req.params;
    const membership = await storage.addClientToGroup(clientId, groupId);
    res.status(201).json(membership);
  } catch (error) {
    console.error('Error adding client to group:', error);
    res.status(400).json({ error: 'Failed to add client to group' });
  }
});

// Remove client from group
router.delete('/client-groups/:groupId/clients/:clientId', requireAuth, async (req, res) => {
  try {
    const { groupId, clientId } = req.params;
    await storage.removeClientFromGroup(clientId, groupId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing client from group:', error);
    res.status(400).json({ error: 'Failed to remove client from group' });
  }
});

// Get recurring trips by organization
router.get('/recurring-trips/organization/:orgId', requireAuth, async (req, res) => {
  try {
    console.log(`🔍 Starting recurring trips fetch for org: ${req.params.orgId}`);
    const { orgId } = req.params;
    
    const { data: recurringTrips, error } = await supabase
      .from('recurring_trips')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recurring trips:', error);
      // Return empty array instead of error for better UX
      return res.json([]);
    }

    // Format the response with complete client information
    const formattedRecurringTrips = await Promise.all(recurringTrips.map(async trip => {
      let clientName = "Unassigned Client";
      let passengerCount = 1;
      
      // For group trips, ALWAYS use the group name first
      if (trip.client_group_id) {
        const { data: groupData } = await supabase
          .from('client_groups')
          .select('name')
          .eq('id', trip.client_group_id)
          .single();
        clientName = groupData?.name || "Group";
        
        // Get actual member count for the group
        const { data: memberData } = await supabase
          .from('client_group_memberships')
          .select('client_id')
          .eq('group_id', trip.client_group_id);
        passengerCount = memberData?.length || 1;
      } else if (trip.client_id) {
        const client = await storage.getClient(trip.client_id);
        if (client && client.first_name && client.last_name) {
          clientName = `${client.first_name} ${client.last_name}`;
        }
      }
      
      // Format days of week
      let daysDisplay = "No days specified";
      if (trip.days_of_week && Array.isArray(trip.days_of_week) && trip.days_of_week.length > 0) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        daysDisplay = trip.days_of_week.map(day => dayNames[day] || day).join(', ');
      }
      
      // Format time with proper START_TIME - END_TIME format
      let timeDisplay = "Time not specified";
      let scheduledPickupTime = null;
      let scheduledReturnTime = null;
      
      if (trip.scheduled_time || trip.time_of_day) {
        const baseTime = trip.scheduled_time || trip.time_of_day;
        scheduledPickupTime = baseTime;
        
        // For round trips, calculate return time (add 2 hours if not specified)
        if (trip.is_round_trip && trip.scheduled_return_time) {
          scheduledReturnTime = trip.scheduled_return_time;
          timeDisplay = `${baseTime} - ${trip.scheduled_return_time}`;
        } else if (trip.is_round_trip) {
          // Calculate return time by adding 2 hours to pickup time
          const [hours, minutes] = baseTime.split(':');
          const returnHour = (parseInt(hours) + 2) % 24;
          scheduledReturnTime = `${returnHour.toString().padStart(2, '0')}:${minutes}`;
          timeDisplay = `${baseTime} - ${scheduledReturnTime}`;
        } else {
          // For one-way trips, show pickup time and estimated dropoff (add 30 minutes)
          const [hours, minutes] = baseTime.split(':');
          const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + 30;
          const dropoffHour = Math.floor(totalMinutes / 60) % 24;
          const dropoffMinute = totalMinutes % 60;
          const estimatedDropoff = `${dropoffHour.toString().padStart(2, '0')}:${dropoffMinute.toString().padStart(2, '0')}`;
          timeDisplay = `${baseTime} - ${estimatedDropoff}`;
          scheduledReturnTime = estimatedDropoff;
        }
      }
      
      // Calculate next occurrence date
      let nextOccurrenceDate = null;
      if (trip.days_of_week && Array.isArray(trip.days_of_week) && trip.days_of_week.length > 0) {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Find the next occurrence of any of the specified days
        let nextDay = trip.days_of_week[0]; // Default to first day
        let daysUntilNext = 7; // Max a week ahead
        
        for (const day of trip.days_of_week) {
          let daysUntil = (day - currentDay + 7) % 7;
          if (daysUntil === 0) daysUntil = 7; // If today, show next week
          if (daysUntil < daysUntilNext) {
            daysUntilNext = daysUntil;
            nextDay = day;
          }
        }
        
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntilNext);
        nextOccurrenceDate = nextDate.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });
      }

      return {
        ...trip,
        clientName: clientName,
        tripNickname: trip.trip_nickname || null,
        pickupAddress: trip.pickup_address || trip.pickup_location || "Not specified",
        dropoffAddress: trip.dropoff_address || trip.dropoff_location || "Not specified",
        frequency: trip.frequency || "Weekly",
        daysDisplay: daysDisplay,
        timeDisplay: timeDisplay,
        scheduled_pickup_time: scheduledPickupTime,
        scheduled_return_time: scheduledReturnTime,
        daysOfWeek: daysDisplay,
        timeOfDay: timeDisplay,
        passengerCount: passengerCount,
        duration: trip.duration || trip.duration_weeks || "Not specified",
        tripType: trip.trip_type || (trip.is_round_trip ? "round_trip" : "one_way"),
        isActive: trip.is_active !== false,
        nextDate: nextOccurrenceDate || trip.start_date || null
      };
    }));

    console.log(`✅ Sent ${formattedRecurringTrips.length} recurring trips`);
    res.json(formattedRecurringTrips);
  } catch (error) {
    console.error('Error in recurring trips endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch recurring trips' });
  }
});



// Delete trip (handles both regular and recurring)
router.delete('/trips/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_TRIPS), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { scope } = req.body;
    
    console.log('🗑️ DELETE trip request:', { id, scope });
    
    // Get the trip to check if it's recurring
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching trip:', fetchError);
      throw fetchError;
    }
    
    if (trip.is_recurring && scope === 'all_future') {
      // Delete all future instances of this recurring trip series
      const currentDate = new Date().toISOString();
      const recurringTripId = trip.recurring_trip_id;
      
      // First, mark the recurring template as inactive
      const { error: deactivateError } = await supabase
        .from('recurring_trips')
        .update({ is_active: false })
        .eq('id', recurringTripId);
      
      if (deactivateError) {
        console.error('Error deactivating recurring trip template:', deactivateError);
        throw deactivateError;
      }
      
      // Delete all future trip instances with this recurring_trip_id
      const { data: deletedTrips, error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('recurring_trip_id', recurringTripId)
        .gte('scheduled_pickup_time', currentDate)
        .select('id');
      
      if (deleteError) {
        console.error('Error deleting recurring trips:', deleteError);
        throw deleteError;
      }
      
      console.log('✅ Recurring trip series deleted:', { 
        templateId: recurringTripId,
        deletedInstances: deletedTrips?.length 
      });
      res.json({ 
        success: true,
        message: 'Recurring trip series deleted successfully',
        scope: 'all_future',
        deletedTripIds: deletedTrips?.map(t => t.id) || [],
        count: deletedTrips?.length || 0
      });
      
    } else {
      // Delete single trip instance
      const { data: deletedTrip, error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .select('id');
      
      if (deleteError) {
        console.error('Error deleting single trip:', deleteError);
        throw deleteError;
      }
      
      console.log('✅ Single trip deleted:', id);
      res.json({ 
        success: true, 
        message: 'Trip deleted successfully',
        scope: 'single',
        deletedTripId: id
      });
    }
    
  } catch (error) {
    console.error('❌ Error deleting trip:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// Delete recurring trip template (legacy endpoint for compatibility)
router.delete('/recurring-trips/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { scope, tripInstanceId } = req.body;
    
    console.log('🗑️ DELETE recurring trip template:', { id, scope, tripInstanceId });
    
    if (scope === 'all_future') {
      // Mark template as inactive
      const { error: deactivateError } = await supabase
        .from('recurring_trips')
        .update({ is_active: false })
        .eq('id', id);
      
      if (deactivateError) {
        console.error('Error deactivating recurring trip template:', deactivateError);
        throw deactivateError;
      }
      
      // Delete all future trip instances
      const currentDate = new Date().toISOString();
      const { data: deletedTrips, error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('recurring_trip_id', id)
        .gte('scheduled_pickup_time', currentDate)
        .select('id');
      
      if (deleteError) {
        console.error('Error deleting future trip instances:', deleteError);
        throw deleteError;
      }
      
      console.log('✅ Recurring trip template deactivated and instances deleted:', { 
        templateId: id, 
        deletedInstances: deletedTrips?.length 
      });
      
      res.json({ 
        success: true,
        message: 'Recurring trip series deleted successfully',
        scope: 'all_future',
        deletedTripIds: deletedTrips?.map(t => t.id) || [],
        count: deletedTrips?.length || 0
      });
      
    } else if (scope === 'single' && tripInstanceId) {
      // Delete only specific trip instance
      const { data: deletedTrip, error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripInstanceId)
        .select('id');
      
      if (deleteError) {
        console.error('Error deleting single trip instance:', deleteError);
        throw deleteError;
      }
      
      console.log('✅ Single trip instance deleted:', tripInstanceId);
      res.json({ 
        success: true, 
        message: 'Single trip instance deleted successfully',
        scope: 'single',
        deletedTripId: tripInstanceId
      });
    } else {
      return res.status(400).json({ error: 'Invalid scope or missing tripInstanceId' });
    }
    
  } catch (error) {
    console.error('❌ Error deleting recurring trip:', error);
    res.status(500).json({ error: 'Failed to delete recurring trip' });
  }
});

// File Upload Routes
// Avatar upload for users
router.post("/users/:userId/avatar", requireAuth, upload.single('avatar'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Permission check: users can only upload their own avatar unless super admin
    if (requestingUser?.user_id !== userId && requestingUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process and save avatar
    const avatarUrl = await processAvatar(req.file.buffer, userId);

    // Get current user to delete old avatar if exists
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user for avatar update:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Delete old avatar file if exists
    if (userData?.avatar_url) {
      deleteFile(userData.avatar_url);
    }

    // Update user with new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user avatar:', updateError);
      deleteFile(avatarUrl); // Clean up uploaded file
      return res.status(500).json({ error: 'Failed to update avatar' });
    }

    console.log(`✅ Avatar uploaded for user ${userId}:`, avatarUrl);
    res.json({ avatar_url: avatarUrl });

  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Logo upload for organizations (super admin only)
router.post("/organizations/:organizationId/logo", requireAuth, requireRole('super_admin'), upload.single('logo'), async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process and save logo
    const logoUrl = await processLogo(req.file.buffer, organizationId);

    // Get current organization to delete old logo if exists
    const { data: orgData, error: fetchError } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', organizationId)
      .single();

    if (fetchError) {
      console.error('Error fetching organization for logo update:', fetchError);
      return res.status(500).json({ error: 'Organization not found' });
    }

    // Delete old logo file if exists
    if (orgData?.logo_url) {
      deleteFile(orgData.logo_url);
    }

    // Update organization with new logo URL
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization logo:', updateError);
      deleteFile(logoUrl); // Clean up uploaded file
      return res.status(500).json({ error: 'Failed to update logo' });
    }

    console.log(`✅ Logo uploaded for organization ${organizationId}:`, logoUrl);
    res.json({ logo_url: logoUrl });

  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Delete avatar
router.delete("/users/:userId/avatar", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Permission check
    if (requestingUser?.user_id !== userId && requestingUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Get current avatar to delete file
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete file if exists
    if (userData.avatar_url) {
      deleteFile(userData.avatar_url);
    }

    // Remove avatar URL from database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error removing avatar from database:', updateError);
      return res.status(500).json({ error: 'Failed to remove avatar' });
    }

    console.log(`✅ Avatar removed for user ${userId}`);
    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error deleting avatar:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

// Delete organization logo (super admin only)
router.delete("/organizations/:organizationId/logo", requireAuth, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.params;

    // Get current logo to delete file
    const { data: orgData, error: fetchError } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', organizationId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Delete file if exists
    if (orgData.logo_url) {
      deleteFile(orgData.logo_url);
    }

    // Remove logo URL from database
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        logo_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error removing logo from database:', updateError);
      return res.status(500).json({ error: 'Failed to remove logo' });
    }

    console.log(`✅ Logo removed for organization ${organizationId}`);
    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error deleting logo:', error);
    res.status(500).json({ error: 'Failed to delete logo' });
  }
});

// System settings endpoints
router.get("/system/settings", requireAuth, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'app_settings')
      .single();

    if (error) {
      console.error('Error fetching system settings:', error);
      return res.status(500).json({ error: 'Failed to fetch system settings' });
    }

    res.json(settings || { id: 'app_settings', app_name: 'Amish Limo Service', main_logo_url: null });
  } catch (error) {
    console.error('❌ Error getting system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

// Main logo upload for application (super admin only)
router.post("/system/main-logo", requireAuth, requireRole('super_admin'), upload.single('logo'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process and save main logo
    const logoUrl = await processLogo(req.file.buffer, 'main');

    // Get current settings to delete old logo if exists
    const { data: settingsData, error: fetchError } = await supabase
      .from('system_settings')
      .select('main_logo_url')
      .eq('id', 'app_settings')
      .single();

    // Delete old logo file if exists
    if (settingsData?.main_logo_url) {
      deleteFile(settingsData.main_logo_url);
    }

    // Update system settings with new main logo URL
    const { error: updateError } = await supabase
      .from('system_settings')
      .upsert({ 
        id: 'app_settings',
        main_logo_url: logoUrl,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating system main logo:', updateError);
      deleteFile(logoUrl); // Clean up uploaded file
      return res.status(500).json({ error: 'Failed to update main logo' });
    }

    console.log(`✅ Main logo uploaded:`, logoUrl);
    res.json({ main_logo_url: logoUrl });

  } catch (error) {
    console.error('❌ Error uploading main logo:', error);
    res.status(500).json({ error: 'Failed to upload main logo' });
  }
});

// Delete main logo
router.delete("/system/main-logo", requireAuth, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    // Get current settings to delete logo file
    const { data: settingsData, error: fetchError } = await supabase
      .from('system_settings')
      .select('main_logo_url')
      .eq('id', 'app_settings')
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'System settings not found' });
    }

    // Delete logo file if exists
    if (settingsData?.main_logo_url) {
      deleteFile(settingsData.main_logo_url);
    }

    // Update system settings to remove main logo URL
    const { error: updateError } = await supabase
      .from('system_settings')
      .update({ 
        main_logo_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'app_settings');

    if (updateError) {
      console.error('Error removing main logo from database:', updateError);
      return res.status(500).json({ error: 'Failed to remove main logo' });
    }

    console.log(`✅ Main logo removed`);
    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error deleting main logo:', error);
    res.status(500).json({ error: 'Failed to delete main logo' });
  }
});

// Get contacts for organization
router.get('/contacts/:organizationId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.params;
    console.log(`🔍 Fetching contacts for organization: ${organizationId}`);

    // Fetch all users in the organization with their contact info
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, user_name, email, phone_number, role, avatar_url')
      .or(`primary_organization_id.eq.${organizationId},authorized_organizations.cs.{${organizationId}}`)
      .eq('is_active', true)
      .order('role')
      .order('user_name');

    if (error) {
      console.error('Error fetching contacts:', error);
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    console.log(`📋 Found ${users?.length || 0} contacts for organization ${organizationId}`);
    res.json(users || []);

  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// CMS-1500 Form Management Routes
router.get('/cms1500/forms/:organizationId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.params;

    const { data: forms, error } = await supabase
      .from('cms1500_forms')
      .select(`
        *,
        clients(first_name, last_name, phone),
        trips(scheduled_pickup_time, pickup_address, dropoff_address),
        billing_claims(status, total_amount)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching CMS-1500 forms:', error);
      return res.status(500).json({ message: 'Failed to fetch CMS-1500 forms' });
    }

    res.json(forms || []);
  } catch (error) {
    console.error('Error fetching CMS-1500 forms:', error);
    res.status(500).json({ message: 'Failed to fetch CMS-1500 forms' });
  }
});

router.get('/cms1500/forms/:organizationId/:formId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId, formId } = req.params;

    const { data: form, error } = await supabase
      .from('cms1500_forms')
      .select(`
        *,
        clients(first_name, last_name, phone, address),
        trips(scheduled_pickup_time, pickup_address, dropoff_address),
        billing_claims(status, total_amount, denial_reason)
      `)
      .eq('organization_id', organizationId)
      .eq('id', formId)
      .single();

    if (error) {
      console.error('Error fetching CMS-1500 form:', error);
      return res.status(500).json({ message: 'Failed to fetch CMS-1500 form' });
    }

    // Get service lines
    const { data: serviceLines, error: serviceLinesError } = await supabase
      .from('cms1500_service_lines')
      .select('*')
      .eq('form_id', formId)
      .order('line_number');

    if (serviceLinesError) {
      console.error('Error fetching service lines:', serviceLinesError);
      return res.status(500).json({ message: 'Failed to fetch service lines' });
    }

    res.json({
      ...form,
      serviceLines: serviceLines || []
    });
  } catch (error) {
    console.error('Error fetching CMS-1500 form:', error);
    res.status(500).json({ message: 'Failed to fetch CMS-1500 form' });
  }
});

router.post('/cms1500/forms/:organizationId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.params;
    const formData = req.body;

    console.log('📋 Creating CMS-1500 form for organization:', organizationId);
    console.log('📋 Form data received:', JSON.stringify(formData, null, 2));

    // Generate unique form number
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
    const formNumber = `CMS-${timestamp}`;

    // Extract service lines from form data
    const { serviceLine1, ...formFields } = formData;

    // Create the form
    const { data: form, error: formError } = await supabase
      .from('cms1500_forms')
      .insert({
        ...formFields,
        organization_id: organizationId,
        form_number: formNumber,
        created_by: req.user.user_id,
        updated_by: req.user.user_id
      })
      .select()
      .single();

    if (formError) {
      console.error('Error creating CMS-1500 form:', formError);
      return res.status(500).json({ message: 'Failed to create CMS-1500 form', error: formError });
    }

    console.log('✅ CMS-1500 form created:', form.id);

    // Create service line if provided
    if (serviceLine1 && Object.keys(serviceLine1).length > 0) {
      const { error: serviceLineError } = await supabase
        .from('cms1500_service_lines')
        .insert({
          form_id: form.id,
          line_number: 1,
          ...serviceLine1
        });

      if (serviceLineError) {
        console.error('Error creating service line:', serviceLineError);
        // Don't fail the entire operation, just log the error
      } else {
        console.log('✅ Service line created for form:', form.id);
      }
    }

    res.status(201).json({
      message: 'CMS-1500 form created successfully',
      form: {
        ...form,
        form_number: formNumber
      }
    });
  } catch (error) {
    console.error('Error creating CMS-1500 form:', error);
    res.status(500).json({ message: 'Failed to create CMS-1500 form', error: error.message });
  }
});

router.put('/cms1500/forms/:organizationId/:formId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId, formId } = req.params;
    const formData = req.body;

    console.log('📋 Updating CMS-1500 form:', formId);

    // Extract service lines from form data
    const { serviceLine1, ...formFields } = formData;

    // Update the form
    const { data: form, error: formError } = await supabase
      .from('cms1500_forms')
      .update({
        ...formFields,
        updated_by: req.user.user_id
      })
      .eq('id', formId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (formError) {
      console.error('Error updating CMS-1500 form:', formError);
      return res.status(500).json({ message: 'Failed to update CMS-1500 form' });
    }

    // Update service line if provided
    if (serviceLine1 && Object.keys(serviceLine1).length > 0) {
      const { error: serviceLineError } = await supabase
        .from('cms1500_service_lines')
        .upsert({
          form_id: formId,
          line_number: 1,
          ...serviceLine1
        });

      if (serviceLineError) {
        console.error('Error updating service line:', serviceLineError);
      }
    }

    res.json({
      message: 'CMS-1500 form updated successfully',
      form
    });
  } catch (error) {
    console.error('Error updating CMS-1500 form:', error);
    res.status(500).json({ message: 'Failed to update CMS-1500 form' });
  }
});

router.delete('/cms1500/forms/:organizationId/:formId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId, formId } = req.params;

    const { error } = await supabase
      .from('cms1500_forms')
      .delete()
      .eq('id', formId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting CMS-1500 form:', error);
      return res.status(500).json({ message: 'Failed to delete CMS-1500 form' });
    }

    res.json({ message: 'CMS-1500 form deleted successfully' });
  } catch (error) {
    console.error('Error deleting CMS-1500 form:', error);
    res.status(500).json({ message: 'Failed to delete CMS-1500 form' });
  }
});

// Auto-populate CMS-1500 from trip data
router.post('/cms1500/auto-generate/:organizationId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.params;
    const { clientId, tripId } = req.body;

    console.log('📋 Auto-generating CMS-1500 form for trip:', tripId);

    if (!clientId || !tripId) {
      return res.status(400).json({ message: 'Client ID and Trip ID are required' });
    }

    // Call the database function to auto-populate the form
    const { data: result, error } = await supabase
      .rpc('populate_cms1500_from_client_trip', {
        p_organization_id: organizationId,
        p_client_id: clientId,
        p_trip_id: tripId,
        p_created_by: req.user.user_id
      });

    if (error) {
      console.error('Error auto-generating CMS-1500 form:', error);
      return res.status(500).json({ message: 'Failed to auto-generate CMS-1500 form' });
    }

    res.json({
      message: 'CMS-1500 form auto-generated successfully',
      formId: result
    });
  } catch (error) {
    console.error('Error auto-generating CMS-1500 form:', error);
    res.status(500).json({ message: 'Failed to auto-generate CMS-1500 form' });
  }
});

// Webhook Integration Routes
import webhookRoutes from "./webhook-routes";
router.use("/webhooks", webhookRoutes);

export default router;