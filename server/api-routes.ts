import express from "express";
import { 
  corporateClientsStorage,
  programsStorage,
  locationsStorage,
  usersStorage,
  driversStorage,
  clientsStorage,
  tripsStorage,
  clientGroupsStorage
} from "./minimal-supabase";
import { 
  getFrequentLocations,
  getFrequentLocationById,
  createFrequentLocation,
  updateFrequentLocation,
  deleteFrequentLocation,
  incrementUsageCount,
  getFrequentLocationsForProgram,
  getFrequentLocationsForCorporateClient
} from "./frequent-locations-storage";
import { tripCategoriesStorage } from "./trip-categories-storage";
import { enhancedTripsStorage } from "./enhanced-trips-storage";
import { driverSchedulesStorage } from "./driver-schedules-storage";
import { vehiclesStorage } from "./vehicles-storage";
import { calendarSystem } from "./calendar-system";
import { mobileApi } from "./mobile-api";
import { notificationSystem } from "./notification-system";
import { supabase } from "./db";
import { createClient } from '@supabase/supabase-js';
import bcrypt from "bcrypt";
import { 
  requireSupabaseAuth as requireSupabaseAuth, 
  requireSupabaseRole as requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "./supabase-auth";
import { 
  createUser,
  updateUser,
  deleteUser,
  requirePermission, 
  requireProgramAccess,
  requireCorporateClientAccess
} from "./auth";
import { PERMISSIONS } from "./permissions";
import { upload, processAvatar, processLogo, deleteFile } from "./upload";
import { broadcastTripUpdate, broadcastDriverUpdate, broadcastClientUpdate } from "./websocket-instance";

const router = express.Router();

// Add middleware to ensure API routes are handled correctly
router.use((req, res, next) => {
  console.log(`🔍 API Route called: ${req.method} ${req.originalUrl}`);
  res.setHeader('Content-Type', 'application/json');
  next();
});

// ============================================================================
// MOBILE API ROUTES (MUST BE FIRST TO AVOID CONFLICTS)
// ============================================================================

// Test endpoint
router.get("/mobile/test", (req, res) => {
  res.json({ message: "Mobile API test endpoint working" });
});

// Mobile endpoint to get trips for current authenticated driver
router.get("/mobile/trips/driver", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;
    console.log('🔍 Mobile: Fetching trips for user:', userId);
    
    // First, find the driver record associated with this user
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (driverError || !driver) {
      console.log('❌ Mobile: No driver found for user:', userId, driverError);
      // Return empty array if no driver found
      return res.json([]);
    }
    
    const driverId = driver.id;
    console.log('👤 Mobile: Found driver ID:', driverId);
    
    // Get trips for this driver using the enhanced trips storage
    console.log('🔍 Mobile: Calling enhancedTripsStorage.getTripsByDriver with driverId:', driverId);
    const trips = await enhancedTripsStorage.getTripsByDriver(driverId);
    console.log('✅ Mobile: Found', trips?.length || 0, 'trips for driver');
    console.log('📋 Mobile: Trip data:', trips);
    
    res.json(trips || []);
  } catch (error) {
    console.error("❌ Mobile: Error fetching driver trips:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("❌ Mobile: Error details:", errorMessage, errorStack);
    res.status(500).json({ message: "Failed to fetch driver trips", error: errorMessage });
  }
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Mobile authentication endpoint
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Mobile Login: Received credentials:', { email, password: password ? password.substring(0, 3) + '***' : 'missing' });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create anon client for authentication
    const supabaseAnon = createClient(
      process.env.SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Authenticate with Supabase
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('Supabase auth error:', error.message);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!data.user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Get user data from database
    console.log('Looking up user with auth_user_id:', data.user.id);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        user_id,
        auth_user_id,
        user_name,
        email,
        role,
        primary_program_id,
        corporate_client_id,
        avatar_url,
        is_active
      `)
      .eq('auth_user_id', data.user.id)
      .single();

    console.log('User lookup result:', { userData, userError });

    if (userError || !userData) {
      console.log('User lookup error:', userError);
      return res.status(404).json({ 
        error: 'User not found in database',
        debug: {
          authUserId: data.user.id,
          userError: userError?.message,
          userData: userData
        }
      });
    }

    res.json({
      user: userData,
      token: data.session?.access_token,
      sessionId: data.session?.access_token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Supabase Auth routes - handled by frontend Supabase client
router.get("/auth/user", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get full user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        user_id,
        user_name,
        email,
        role,
        primary_program_id,
        corporate_client_id,
        avatar_url,
        is_active,
        created_at,
        updated_at
      `)
      .eq('user_id', req.user.userId)
      .single();

    if (error || !user) {
      console.error("Error fetching user:", error);
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error in /auth/user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test database schema endpoint
router.get('/test-schema', async (req, res) => {
  try {
    // Try to get user by email first
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@monarch.com')
      .single();
    
    // Try to get all users to see the schema
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    res.json({
      userByEmail: userByEmail || null,
      emailError: emailError?.message || null,
      allUsers: allUsers || [],
      allError: allError?.message || null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Test Supabase auth endpoint
router.post('/test-auth', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Create anon client for authentication
    const supabaseAnon = createClient(
      process.env.SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Test authentication
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });

    res.json({
      success: !error,
      error: error?.message || null,
      user: data?.user ? {
        id: data.user.id,
        email: data.user.email
      } : null,
      session: data?.session ? {
        access_token: data.session.access_token ? 'present' : 'missing'
      } : null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

router.post("/users", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userData = req.body;
    const result = await createUser(userData);
    res.json(result);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});
router.get("/users", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const users = await usersStorage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/users/:userId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const user = await usersStorage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

router.patch("/users/:userId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const result = await updateUser(userId, updates);
    res.json(result);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});
router.delete("/users/:userId", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    await deleteUser(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// User avatar management
router.post("/users/:userId/avatar", requireSupabaseAuth, upload.single('avatar'), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { userId } = req.params;
    
    // Check if user can update this profile
    if (req.user?.userId !== userId && req.user?.role !== 'super_admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    // Process avatar
    const avatarPath = await processAvatar(req.file.buffer, userId);
    
    // Update user with new avatar URL
    const updatedUser = await usersStorage.updateUser(userId, {
      avatar_url: avatarPath,
      updated_at: new Date().toISOString()
    });

    res.json({ 
      message: "Avatar updated successfully",
      avatarUrl: avatarPath,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ message: "Failed to update avatar" });
  }
});

router.delete("/users/:userId/avatar", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user can update this profile
    if (req.user?.userId !== userId && req.user?.role !== 'super_admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get current user to find avatar URL
    const user = await usersStorage.getUser(userId);
    if (user?.avatar_url) {
      await deleteFile(user.avatar_url);
    }

    // Update user to remove avatar URL
    const updatedUser = await usersStorage.updateUser(userId, {
      avatar_url: null,
      updated_at: new Date().toISOString()
    });

    res.json({ 
      message: "Avatar deleted successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    res.status(500).json({ message: "Failed to delete avatar" });
  }
});

// ============================================================================
// CORPORATE CLIENTS ROUTES
// ============================================================================

// Moved to corporate dashboard routes section below

// Moved to corporate dashboard routes section below

router.post("/corporate-clients", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const corporateClient = await corporateClientsStorage.createCorporateClient(req.body);
    res.status(201).json(corporateClient);
  } catch (error) {
    console.error("Error creating corporate client:", error);
    res.status(500).json({ message: "Failed to create corporate client" });
  }
});

router.patch("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const corporateClient = await corporateClientsStorage.updateCorporateClient(id, req.body);
    res.json(corporateClient);
  } catch (error) {
    console.error("Error updating corporate client:", error);
    res.status(500).json({ message: "Failed to update corporate client" });
  }
});

router.delete("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await corporateClientsStorage.deleteCorporateClient(id);
    res.json({ message: "Corporate client deleted successfully" });
  } catch (error) {
    console.error("Error deleting corporate client:", error);
    res.status(500).json({ message: "Failed to delete corporate client" });
  }
});

// ============================================================================
// PROGRAMS ROUTES (renamed from organizations)
// ============================================================================

router.get("/programs", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const programs = await programsStorage.getAllPrograms();
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

router.get("/programs/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const program = await programsStorage.getProgram(id);
    
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    
    res.json(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ message: "Failed to fetch program" });
  }
});

router.get("/programs/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const programs = await programsStorage.getProgramsByCorporateClient(corporateClientId);
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs by corporate client:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

router.post("/programs", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const program = await programsStorage.createProgram(req.body);
    res.status(201).json(program);
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ message: "Failed to create program" });
  }
});

router.patch("/programs/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const program = await programsStorage.updateProgram(id, req.body);
    res.json(program);
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Failed to update program" });
  }
});

router.delete("/programs/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await programsStorage.deleteProgram(id);
    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Failed to delete program" });
  }
});

// ============================================================================
// LOCATIONS ROUTES (renamed from service areas)
// ============================================================================

router.get("/locations", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const locations = await locationsStorage.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});

router.get("/locations/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const location = await locationsStorage.getLocation(id);
    
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    
    res.json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ message: "Failed to fetch location" });
  }
});

router.get("/locations/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const locations = await locationsStorage.getLocationsByProgram(programId);
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations by program:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});

router.post("/locations", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const location = await locationsStorage.createLocation(req.body);
    res.status(201).json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ message: "Failed to create location" });
  }
});

router.patch("/locations/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const location = await locationsStorage.updateLocation(id, req.body);
    res.json(location);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
});

router.delete("/locations/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await locationsStorage.deleteLocation(id);
    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ message: "Failed to delete location" });
  }
});

// ============================================================================
// FREQUENT LOCATIONS ROUTES
// ============================================================================

// Get all frequent locations with optional filtering
router.get("/frequent-locations", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const filters = {
      corporate_client_id: req.query.corporate_client_id as string,
      program_id: req.query.program_id as string,
      location_id: req.query.location_id as string,
      location_type: req.query.location_type as string,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string
    };

    const frequentLocations = await getFrequentLocations(filters);
    res.json(frequentLocations);
  } catch (error) {
    console.error("Error fetching frequent locations:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations" });
  }
});

// Get frequent location by ID
router.get("/frequent-locations/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const frequentLocation = await getFrequentLocationById(id);
    
    if (!frequentLocation) {
      return res.status(404).json({ message: "Frequent location not found" });
    }
    
    res.json(frequentLocation);
  } catch (error) {
    console.error("Error fetching frequent location:", error);
    res.status(500).json({ message: "Failed to fetch frequent location" });
  }
});

// Create new frequent location
router.post("/frequent-locations", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const frequentLocation = await createFrequentLocation(req.body);
    res.status(201).json(frequentLocation);
  } catch (error) {
    console.error("Error creating frequent location:", error);
    res.status(500).json({ message: "Failed to create frequent location" });
  }
});

// Update frequent location
router.patch("/frequent-locations/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const frequentLocation = await updateFrequentLocation(id, req.body);
    res.json(frequentLocation);
  } catch (error) {
    console.error("Error updating frequent location:", error);
    res.status(500).json({ message: "Failed to update frequent location" });
  }
});

// Delete frequent location
router.delete("/frequent-locations/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await deleteFrequentLocation(id);
    res.json({ message: "Frequent location deleted successfully" });
  } catch (error) {
    console.error("Error deleting frequent location:", error);
    res.status(500).json({ message: "Failed to delete frequent location" });
  }
});

// Increment usage count
router.post("/frequent-locations/:id/increment-usage", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const frequentLocation = await incrementUsageCount(id);
    res.json(frequentLocation);
  } catch (error) {
    console.error("Error incrementing usage count:", error);
    res.status(500).json({ message: "Failed to increment usage count" });
  }
});

// Get frequent locations for program (for trip creation)
router.get("/frequent-locations/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const locationType = req.query.location_type as string;
    const frequentLocations = await getFrequentLocationsForProgram(programId, locationType);
    res.json(frequentLocations);
  } catch (error) {
    console.error("Error fetching frequent locations for program:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations for program" });
  }
});

// Get frequent locations for corporate client
router.get("/frequent-locations/corporate-client/:corporateClientId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const locationType = req.query.location_type as string;
    const frequentLocations = await getFrequentLocationsForCorporateClient(corporateClientId, locationType);
    res.json(frequentLocations);
  } catch (error) {
    console.error("Error fetching frequent locations for corporate client:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations for corporate client" });
  }
});

// ============================================================================
// CLIENTS ROUTES
// ============================================================================

router.get("/clients", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const clients = await clientsStorage.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

router.get("/clients/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const client = await clientsStorage.getClient(id);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ message: "Failed to fetch client" });
  }
});

router.get("/clients/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const clients = await clientsStorage.getClientsByProgram(programId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients by program:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

router.get("/clients/location/:locationId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { locationId } = req.params;
    const clients = await clientsStorage.getClientsByLocation(locationId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients by location:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

router.post("/clients", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const client = await clientsStorage.createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ message: "Failed to create client" });
  }
});

router.patch("/clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const client = await clientsStorage.updateClient(id, req.body);
    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ message: "Failed to update client" });
  }
});

router.delete("/clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await clientsStorage.deleteClient(id);
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ message: "Failed to delete client" });
  }
});

// ============================================================================
// CLIENT GROUPS ROUTES (new)
// ============================================================================

router.get("/client-groups", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const clientGroups = await clientGroupsStorage.getAllClientGroups();
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});

router.get("/client-groups/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const clientGroup = await clientGroupsStorage.getClientGroup(id);
    
    if (!clientGroup) {
      return res.status(404).json({ message: "Client group not found" });
    }
    
    res.json(clientGroup);
  } catch (error) {
    console.error("Error fetching client group:", error);
    res.status(500).json({ message: "Failed to fetch client group" });
  }
});

router.get("/client-groups/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups by program:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});

router.post("/client-groups", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const clientGroup = await clientGroupsStorage.createClientGroup(req.body);
    res.status(201).json(clientGroup);
  } catch (error) {
    console.error("Error creating client group:", error);
    res.status(500).json({ message: "Failed to create client group" });
  }
});

router.patch("/client-groups/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const clientGroup = await clientGroupsStorage.updateClientGroup(id, req.body);
    res.json(clientGroup);
  } catch (error) {
    console.error("Error updating client group:", error);
    res.status(500).json({ message: "Failed to update client group" });
  }
});

router.delete("/client-groups/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await clientGroupsStorage.deleteClientGroup(id);
    res.json({ message: "Client group deleted successfully" });
  } catch (error) {
    console.error("Error deleting client group:", error);
    res.status(500).json({ message: "Failed to delete client group" });
  }
});

// ============================================================================
// CLIENT GROUP MEMBERSHIPS ROUTES
// ============================================================================

router.get("/client-group-memberships/:groupId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { groupId } = req.params;
    const members = await clientGroupsStorage.getClientGroupMembers(groupId);
    res.json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ message: "Failed to fetch group members" });
  }
});

router.post("/client-group-memberships", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { client_group_id, client_id } = req.body;
    const membership = await clientGroupsStorage.addClientToGroup(client_group_id, client_id);
    res.status(201).json(membership);
  } catch (error) {
    console.error("Error adding client to group:", error);
    res.status(500).json({ message: "Failed to add client to group" });
  }
});

router.delete("/client-group-memberships/:membershipId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { membershipId } = req.params;
    await clientGroupsStorage.removeClientFromGroup(membershipId);
    res.json({ message: "Client removed from group successfully" });
  } catch (error) {
    console.error("Error removing client from group:", error);
    res.status(500).json({ message: "Failed to remove client from group" });
  }
});

// ============================================================================
// DRIVERS ROUTES
// ============================================================================

router.get("/drivers", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const drivers = await driversStorage.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

router.get("/drivers/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const driver = await driversStorage.getDriver(id);
    
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    
    res.json(driver);
  } catch (error) {
    console.error("Error fetching driver:", error);
    res.status(500).json({ message: "Failed to fetch driver" });
  }
});

router.get("/drivers/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const drivers = await driversStorage.getDriversByProgram(programId);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers by program:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

router.post("/drivers", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const driver = await driversStorage.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    console.error("Error creating driver:", error);
    res.status(500).json({ message: "Failed to create driver" });
  }
});

router.patch("/drivers/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const driver = await driversStorage.updateDriver(id, req.body);
    res.json(driver);
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ message: "Failed to update driver" });
  }
});

router.delete("/drivers/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await driversStorage.deleteDriver(id);
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ message: "Failed to delete driver" });
  }
});

// ============================================================================
// TRIPS ROUTES
// ============================================================================

router.get("/trips", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trips = await tripsStorage.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/trips/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
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

router.get("/trips/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const trips = await tripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by program:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/trips/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const trips = await tripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by driver:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.post("/trips", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trip = await tripsStorage.createTrip(req.body);
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ message: "Failed to create trip" });
  }
});

router.patch("/trips/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const trip = await tripsStorage.updateTrip(id, req.body);
    
    // Broadcast trip update via WebSocket
    broadcastTripUpdate(trip, {
      programId: trip.program_id,
      corporateClientId: req.user?.corporateClientId || undefined,
      role: req.user?.role
    });
    
    res.json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ message: "Failed to update trip" });
  }
});

router.delete("/trips/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await tripsStorage.deleteTrip(id);
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ message: "Failed to delete trip" });
  }
});

// ============================================================================
// LEGACY COMPATIBILITY ROUTES REMOVED
// ============================================================================
// All legacy organization-based routes have been removed as the frontend
// has been fully migrated to the new hierarchical system (corporate_clients → programs → locations)

// ============================================================================
// TRIP CATEGORIES ROUTES
// ============================================================================

router.get("/trip-categories", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const categories = await tripCategoriesStorage.getAllTripCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});

router.get("/trip-categories/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
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

router.get("/trip-categories/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const categories = await tripCategoriesStorage.getTripCategoriesByProgram(programId);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories by program:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});

router.post("/trip-categories", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const category = await tripCategoriesStorage.createTripCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating trip category:", error);
    res.status(500).json({ message: "Failed to create trip category" });
  }
});

router.patch("/trip-categories/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const category = await tripCategoriesStorage.updateTripCategory(id, req.body);
    res.json(category);
  } catch (error) {
    console.error("Error updating trip category:", error);
    res.status(500).json({ message: "Failed to update trip category" });
  }
});

router.delete("/trip-categories/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
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

router.get("/enhanced-trips", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trips = await enhancedTripsStorage.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/enhanced-trips/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
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

router.get("/enhanced-trips/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const trips = await enhancedTripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips by program:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/enhanced-trips/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const trips = await enhancedTripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips by driver:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/enhanced-trips/category/:categoryId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { categoryId } = req.params;
    const trips = await enhancedTripsStorage.getTripsByCategory(categoryId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips by category:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});

router.get("/enhanced-trips/group/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const trips = await enhancedTripsStorage.getGroupTrips(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching group trips:", error);
    res.status(500).json({ message: "Failed to fetch group trips" });
  }
});

router.get("/enhanced-trips/recurring/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const trips = await enhancedTripsStorage.getRecurringTrips(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching recurring trips:", error);
    res.status(500).json({ message: "Failed to fetch recurring trips" });
  }
});

router.post("/enhanced-trips", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const trip = await enhancedTripsStorage.createTrip(req.body);
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating enhanced trip:", error);
    res.status(500).json({ message: "Failed to create trip" });
  }
});

router.post("/enhanced-trips/recurring", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { trip, pattern } = req.body;
    const trips = await enhancedTripsStorage.createRecurringTripSeries(trip, pattern);
    res.status(201).json(trips);
  } catch (error) {
    console.error("Error creating recurring trip series:", error);
    res.status(500).json({ message: "Failed to create recurring trip series" });
  }
});

router.patch("/enhanced-trips/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const trip = await enhancedTripsStorage.updateTrip(id, req.body);
    res.json(trip);
  } catch (error) {
    console.error("Error updating enhanced trip:", error);
    res.status(500).json({ message: "Failed to update trip" });
  }
});

router.patch("/enhanced-trips/:id/status", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, actualTimes } = req.body;
    const trip = await enhancedTripsStorage.updateTripStatus(id, status, actualTimes);
    res.json(trip);
  } catch (error) {
    console.error("Error updating trip status:", error);
    res.status(500).json({ message: "Failed to update trip status" });
  }
});

router.delete("/enhanced-trips/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await enhancedTripsStorage.deleteTrip(id);
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting enhanced trip:", error);
    res.status(500).json({ message: "Failed to delete trip" });
  }
});

// ============================================================================
// DRIVER SCHEDULES ROUTES
// ============================================================================

router.get("/driver-schedules", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const schedules = await driverSchedulesStorage.getAllDriverSchedules();
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});

router.get("/driver-schedules/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const schedule = await driverSchedulesStorage.getDriverSchedule(id);
    
    if (!schedule) {
      return res.status(404).json({ message: "Driver schedule not found" });
    }
    
    res.json(schedule);
  } catch (error) {
    console.error("Error fetching driver schedule:", error);
    res.status(500).json({ message: "Failed to fetch driver schedule" });
  }
});

router.get("/driver-schedules/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const schedules = await driverSchedulesStorage.getDriverSchedulesByDriver(driverId);
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules by driver:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});

router.get("/driver-schedules/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const schedules = await driverSchedulesStorage.getDriverSchedulesByProgram(programId);
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules by program:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});

router.get("/driver-schedules/available/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { date, startTime, endTime } = req.query;
    
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: "Date, startTime, and endTime are required" });
    }
    
    const drivers = await driverSchedulesStorage.getAvailableDrivers(programId, date as string, startTime as string, endTime as string);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching available drivers:", error);
    res.status(500).json({ message: "Failed to fetch available drivers" });
  }
});

router.post("/driver-schedules", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const schedule = await driverSchedulesStorage.createDriverSchedule(req.body);
    res.status(201).json(schedule);
  } catch (error) {
    console.error("Error creating driver schedule:", error);
    res.status(500).json({ message: "Failed to create driver schedule" });
  }
});

router.patch("/driver-schedules/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const schedule = await driverSchedulesStorage.updateDriverSchedule(id, req.body);
    res.json(schedule);
  } catch (error) {
    console.error("Error updating driver schedule:", error);
    res.status(500).json({ message: "Failed to update driver schedule" });
  }
});

router.delete("/driver-schedules/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await driverSchedulesStorage.deleteDriverSchedule(id);
    res.json({ message: "Driver schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver schedule:", error);
    res.status(500).json({ message: "Failed to delete driver schedule" });
  }
});

// ============================================================================
// DRIVER DUTY STATUS ROUTES
// ============================================================================

router.get("/driver-duty-status/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const status = await driverSchedulesStorage.getCurrentDutyStatus(driverId);
    res.json(status);
  } catch (error) {
    console.error("Error fetching driver duty status:", error);
    res.status(500).json({ message: "Failed to fetch driver duty status" });
  }
});

router.post("/driver-duty-status/:driverId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const { status, location, notes } = req.body;
    const dutyStatus = await driverSchedulesStorage.updateDutyStatus(driverId, status, location, notes);
    res.json(dutyStatus);
  } catch (error) {
    console.error("Error updating driver duty status:", error);
    res.status(500).json({ message: "Failed to update driver duty status" });
  }
});

router.get("/driver-duty-status/:driverId/history", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const { limit = 50 } = req.query;
    const history = await driverSchedulesStorage.getDutyStatusHistory(driverId, Number(limit));
    res.json(history);
  } catch (error) {
    console.error("Error fetching driver duty status history:", error);
    res.status(500).json({ message: "Failed to fetch driver duty status history" });
  }
});

// ============================================================================
// VEHICLES ROUTES
// ============================================================================

router.get("/vehicles", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

router.get("/vehicles/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const vehicle = await vehiclesStorage.getVehicle(id);
    
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    res.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Failed to fetch vehicle" });
  }
});

router.get("/vehicles/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const vehicles = await vehiclesStorage.getVehiclesByProgram(programId);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles by program:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

router.get("/vehicles/available/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { vehicleType } = req.query;
    const vehicles = await vehiclesStorage.getAvailableVehicles(programId, vehicleType as string);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching available vehicles:", error);
    res.status(500).json({ message: "Failed to fetch available vehicles" });
  }
});

router.post("/vehicles", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const vehicle = await vehiclesStorage.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ message: "Failed to create vehicle" });
  }
});

router.patch("/vehicles/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const vehicle = await vehiclesStorage.updateVehicle(id, req.body);
    res.json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Failed to update vehicle" });
  }
});

router.delete("/vehicles/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await vehiclesStorage.deleteVehicle(id);
    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
});

// ============================================================================
// VEHICLE MAINTENANCE ROUTES
// ============================================================================

router.get("/vehicles/:vehicleId/maintenance", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const maintenance = await vehiclesStorage.getVehicleMaintenance(vehicleId);
    res.json(maintenance);
  } catch (error) {
    console.error("Error fetching vehicle maintenance:", error);
    res.status(500).json({ message: "Failed to fetch vehicle maintenance" });
  }
});

router.post("/vehicles/:vehicleId/maintenance", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const maintenance = await vehiclesStorage.createMaintenanceRecord({
      ...req.body,
      vehicle_id: vehicleId
    });
    res.status(201).json(maintenance);
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    res.status(500).json({ message: "Failed to create maintenance record" });
  }
});

router.patch("/vehicles/maintenance/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const maintenance = await vehiclesStorage.updateMaintenanceRecord(id, req.body);
    res.json(maintenance);
  } catch (error) {
    console.error("Error updating maintenance record:", error);
    res.status(500).json({ message: "Failed to update maintenance record" });
  }
});

// ============================================================================
// VEHICLE ASSIGNMENTS ROUTES
// ============================================================================

router.post("/vehicles/:vehicleId/assign", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const { driverId, programId, notes } = req.body;
    const assignment = await vehiclesStorage.assignVehicleToDriver(vehicleId, driverId, programId, notes);
    res.json(assignment);
  } catch (error) {
    console.error("Error assigning vehicle to driver:", error);
    res.status(500).json({ message: "Failed to assign vehicle to driver" });
  }
});

router.post("/vehicles/:vehicleId/unassign", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const { driverId } = req.body;
    const assignment = await vehiclesStorage.unassignVehicleFromDriver(vehicleId, driverId);
    res.json(assignment);
  } catch (error) {
    console.error("Error unassigning vehicle from driver:", error);
    res.status(500).json({ message: "Failed to unassign vehicle from driver" });
  }
});

router.get("/vehicles/:vehicleId/assignments", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const assignments = await vehiclesStorage.getVehicleAssignments(vehicleId);
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching vehicle assignments:", error);
    res.status(500).json({ message: "Failed to fetch vehicle assignments" });
  }
});

router.get("/drivers/:driverId/vehicle-history", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const history = await vehiclesStorage.getDriverVehicleHistory(driverId);
    res.json(history);
  } catch (error) {
    console.error("Error fetching driver vehicle history:", error);
    res.status(500).json({ message: "Failed to fetch driver vehicle history" });
  }
});

// ============================================================================
// CALENDAR SYSTEM ROUTES
// ============================================================================

router.get("/calendar/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { startDate, endDate, filters } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    
    const calendar = await calendarSystem.getProgramCalendar(programId, startDate as string, endDate as string, filters ? JSON.parse(filters as string) : undefined);
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching program calendar:", error);
    res.status(500).json({ message: "Failed to fetch program calendar" });
  }
});

router.get("/calendar/corporate/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const { startDate, endDate, filters } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    
    const calendar = await calendarSystem.getCorporateCalendar(corporateClientId, startDate as string, endDate as string, filters ? JSON.parse(filters as string) : undefined);
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching corporate calendar:", error);
    res.status(500).json({ message: "Failed to fetch corporate calendar" });
  }
});

router.get("/calendar/universal", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, filters } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    
    const calendar = await calendarSystem.getUniversalCalendar(startDate as string, endDate as string, filters ? JSON.parse(filters as string) : undefined);
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching universal calendar:", error);
    res.status(500).json({ message: "Failed to fetch universal calendar" });
  }
});

router.post("/calendar/optimize/ride-sharing/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { date, options } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }
    
    const optimization = await calendarSystem.optimizeRideSharing(programId, date, options);
    res.json(optimization);
  } catch (error) {
    console.error("Error optimizing ride sharing:", error);
    res.status(500).json({ message: "Failed to optimize ride sharing" });
  }
});

router.get("/calendar/capacity-forecast/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const { days = 7 } = req.query;
    
    const forecast = await calendarSystem.getCapacityForecast(programId, Number(days));
    res.json(forecast);
  } catch (error) {
    console.error("Error generating capacity forecast:", error);
    res.status(500).json({ message: "Failed to generate capacity forecast" });
  }
});

// ============================================================================
// MOBILE API ROUTES
// ============================================================================

router.get("/mobile/driver/:driverId/profile", requireSupabaseAuth, requireSupabaseRole(['driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const profile = await mobileApi.getDriverProfile(driverId);
    res.json(profile);
  } catch (error) {
    console.error("Error fetching driver profile:", error);
    res.status(500).json({ message: "Failed to fetch driver profile" });
  }
});

router.patch("/mobile/driver/:driverId/profile", requireSupabaseAuth, requireSupabaseRole(['driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const profile = await mobileApi.updateDriverProfile(driverId, req.body);
    res.json(profile);
  } catch (error) {
    console.error("Error updating driver profile:", error);
    res.status(500).json({ message: "Failed to update driver profile" });
  }
});

router.get("/mobile/driver/:driverId/trips", requireSupabaseAuth, requireSupabaseRole(['driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const { date } = req.query;
    const trips = await mobileApi.getDriverTrips(driverId, date as string);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching driver trips:", error);
    res.status(500).json({ message: "Failed to fetch driver trips" });
  }
});

router.patch("/mobile/trips/:tripId/status", requireSupabaseAuth, requireSupabaseRole(['driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { tripId } = req.params;
    const { status, actualTimes, driverId } = req.body;
    const trip = await mobileApi.updateTripStatus(tripId, status, actualTimes, driverId);
    res.json(trip);
  } catch (error) {
    console.error("Error updating trip status:", error);
    res.status(500).json({ message: "Failed to update trip status" });
  }
});

router.post("/mobile/driver/:driverId/location", requireSupabaseAuth, requireSupabaseRole(['driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const { latitude, longitude, accuracy, heading, speed, address } = req.body;
    const location = await mobileApi.updateDriverLocation(driverId, {
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      address
    });
    res.json(location);
  } catch (error) {
    console.error("Error updating driver location:", error);
    res.status(500).json({ message: "Failed to update driver location" });
  }
});

router.get("/mobile/driver/:driverId/location", requireSupabaseAuth, requireSupabaseRole(['driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const location = await mobileApi.getLastLocation(driverId);
    res.json(location);
  } catch (error) {
    console.error("Error fetching driver location:", error);
    res.status(500).json({ message: "Failed to fetch driver location" });
  }
});

// Web app driver trips endpoint
router.get("/trips/driver/:driverId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    console.log('🔍 Web: Fetching trips for driver:', driverId);
    
    // Get trips for this driver using the enhanced trips storage
    const trips = await enhancedTripsStorage.getTripsByDriver(driverId);
    console.log('✅ Web: Found', trips?.length || 0, 'trips for driver');
    
    res.json(trips || []);
  } catch (error) {
    console.error("❌ Web: Error fetching driver trips:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: "Failed to fetch driver trips", error: errorMessage });
  }
});

// Emergency API endpoints
router.post("/emergency/panic", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { location, tripId } = req.body;
    const driverId = req.user.userId;
    
    console.log('🚨 Emergency panic activated by driver:', driverId);
    console.log('📍 Location:', location);
    console.log('🚗 Trip ID:', tripId);
    
    // Get driver info
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', driverId)
      .single();
    
    if (driverError || !driver) {
      console.error('❌ Driver not found:', driverError);
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    // Get driver name
    const driverName = driver.users?.first_name && driver.users?.last_name 
      ? `${driver.users.first_name} ${driver.users.last_name}`
      : 'Driver';
    
    // Create emergency record
    const emergencyData = {
      id: `emergency_${Date.now()}_${driverId}`,
      driver_id: driverId,
      driver_name: driverName,
      location: location,
      trip_id: tripId,
      status: 'active',
      created_at: new Date().toISOString(),
      resolved_at: null
    };
    
    // TODO: Store emergency in database
    console.log('📝 Emergency record created:', emergencyData);
    
    // TODO: Send SMS alerts to admins
    console.log('📱 SMS alerts would be sent to admins for:', driverName);
    
    // Send WebSocket notification to admins
    const websocket = require('./websocket');
    websocket.broadcastToAdmins({
      type: 'emergency',
      data: emergencyData
    });
    
    res.json({ 
      success: true, 
      message: 'Emergency alert sent',
      emergencyId: emergencyData.id
    });
    
  } catch (error) {
    console.error("❌ Error processing emergency panic:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: "Failed to process emergency alert", error: errorMessage });
  }
});

router.post("/mobile/driver/:driverId/duty-status", requireSupabaseAuth, requireSupabaseRole(['driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const { status, location, notes } = req.body;
    const dutyStatus = await mobileApi.updateDutyStatus(driverId, status, location, notes);
    res.json(dutyStatus);
  } catch (error) {
    console.error("Error updating duty status:", error);
    res.status(500).json({ message: "Failed to update duty status" });
  }
});

router.get("/mobile/driver/:driverId/offline-data", requireSupabaseAuth, requireSupabaseRole(['driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const offlineData = await mobileApi.getOfflineData(driverId);
    res.json(offlineData);
  } catch (error) {
    console.error("Error fetching offline data:", error);
    res.status(500).json({ message: "Failed to fetch offline data" });
  }
});

router.post("/mobile/driver/:driverId/sync", requireSupabaseAuth, requireSupabaseRole(['driver']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const { updates } = req.body;
    const results = await mobileApi.syncPendingUpdates(driverId, updates);
    res.json(results);
  } catch (error) {
    console.error("Error syncing pending updates:", error);
    res.status(500).json({ message: "Failed to sync pending updates" });
  }
});

// ============================================================================
// NOTIFICATION SYSTEM ROUTES
// ============================================================================

router.get("/notifications/templates", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { type } = req.query;
    const templates = await notificationSystem.getTemplates(type as string);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching notification templates:", error);
    res.status(500).json({ message: "Failed to fetch notification templates" });
  }
});

router.post("/notifications/templates", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const template = await notificationSystem.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating notification template:", error);
    res.status(500).json({ message: "Failed to create notification template" });
  }
});

router.post("/notifications/send", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const notification = await notificationSystem.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

router.post("/notifications/trip-reminder/:tripId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { tripId } = req.params;
    const { advanceMinutes = 30 } = req.body;
    const result = await notificationSystem.sendTripReminder(tripId, advanceMinutes);
    res.json(result);
  } catch (error) {
    console.error("Error sending trip reminder:", error);
    res.status(500).json({ message: "Failed to send trip reminder" });
  }
});

router.post("/notifications/driver-update/:driverId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const { updateType, data } = req.body;
    const result = await notificationSystem.sendDriverUpdate(driverId, updateType, data);
    res.json(result);
  } catch (error) {
    console.error("Error sending driver update:", error);
    res.status(500).json({ message: "Failed to send driver update" });
  }
});

router.post("/notifications/system-alert", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { alertType, message, targetUsers, priority } = req.body;
    const result = await notificationSystem.sendSystemAlert(alertType, message, targetUsers, priority);
    res.json(result);
  } catch (error) {
    console.error("Error sending system alert:", error);
    res.status(500).json({ message: "Failed to send system alert" });
  }
});

router.post("/notifications/process-scheduled", requireSupabaseAuth, requireSupabaseRole(['super_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const result = await notificationSystem.processScheduledNotifications();
    res.json(result);
  } catch (error) {
    console.error("Error processing scheduled notifications:", error);
    res.status(500).json({ message: "Failed to process scheduled notifications" });
  }
});

router.get("/notifications/preferences/:userId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const preferences = await notificationSystem.getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ message: "Failed to fetch notification preferences" });
  }
});

router.patch("/notifications/preferences/:userId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const preferences = await notificationSystem.updateUserPreferences(userId, req.body);
    res.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ message: "Failed to update notification preferences" });
  }
});

// ============================================================================
// CORPORATE DASHBOARD ROUTES
// ============================================================================

// Get all corporate clients (for corporate dashboard)
router.get("/corporate-clients", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const corporateClients = await corporateClientsStorage.getAllCorporateClients();
    
    // For each corporate client, fetch their programs
    const corporateClientsWithPrograms = await Promise.all(
      corporateClients.map(async (client) => {
        try {
          const programs = await programsStorage.getProgramsByCorporateClient(client.corporate_client_id);
          return {
            ...client,
            programs: programs.map(program => ({
              program_id: program.program_id,
              program_name: program.program_name
            }))
          };
        } catch (error) {
          console.error(`Error fetching programs for client ${client.corporate_client_id}:`, error);
          return {
            ...client,
            programs: []
          };
        }
      })
    );
    
    res.json({ corporateClients: corporateClientsWithPrograms });
  } catch (error) {
    console.error("Error fetching corporate clients:", error);
    res.status(500).json({ message: "Failed to fetch corporate clients" });
  }
});

// Get specific corporate client by ID
router.get("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const corporateClient = await corporateClientsStorage.getCorporateClient(id);
    
    if (!corporateClient) {
      return res.status(404).json({ message: "Corporate client not found" });
    }
    
    res.json(corporateClient);
  } catch (error) {
    console.error("Error fetching corporate client:", error);
    res.status(500).json({ message: "Failed to fetch corporate client" });
  }
});

// Get all programs (for corporate dashboard)
router.get("/programs", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const programs = await programsStorage.getAllPrograms();
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

// Get universal trips (all trips across all programs)
router.get("/trips/universal", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 Fetching universal trips...');
    const trips = await tripsStorage.getAllTrips();
    console.log('✅ Universal trips fetched:', trips?.length || 0, 'trips');
    res.json(trips || []);
  } catch (error) {
    console.error("❌ Error fetching universal trips:", error);
    res.status(500).json({ message: "Failed to fetch universal trips" });
  }
});

// Get all vehicles (for corporate dashboard)
router.get("/vehicles", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

// Get all drivers (for corporate dashboard)
router.get("/drivers", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const drivers = await driversStorage.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

// Get all vehicles (for corporate dashboard)
router.get("/vehicles", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

// ============================================================================
// PROGRAM-SPECIFIC API ENDPOINTS FOR DASHBOARD
// ============================================================================

// Get trips for a specific program
router.get("/trips/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const trips = await tripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching program trips:", error);
    res.status(500).json({ message: "Failed to fetch program trips" });
  }
});

// Get trips for a specific corporate client (all programs under that client)
router.get("/trips/corporate-client/:corporateClientId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const trips = await tripsStorage.getTripsByCorporateClient(corporateClientId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching corporate client trips:", error);
    res.status(500).json({ message: "Failed to fetch corporate client trips" });
  }
});

// Get drivers for a specific program
router.get("/drivers/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const drivers = await driversStorage.getDriversByProgram(programId);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching program drivers:", error);
    res.status(500).json({ message: "Failed to fetch program drivers" });
  }
});

// Get clients for a specific program
router.get("/clients/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const clients = await clientsStorage.getClientsByProgram(programId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching program clients:", error);
    res.status(500).json({ message: "Failed to fetch program clients" });
  }
});

// Get client groups for a specific program
router.get("/client-groups/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching program client groups:", error);
    res.status(500).json({ message: "Failed to fetch program client groups" });
  }
});

// Get vehicles for a specific program
router.get("/vehicles/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const vehicles = await vehiclesStorage.getVehiclesByProgram(programId);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching program vehicles:", error);
    res.status(500).json({ message: "Failed to fetch program vehicles" });
  }
});

// Get trips for a specific driver
router.get("/trips/driver/:driverId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const trips = await tripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching driver trips:", error);
    res.status(500).json({ message: "Failed to fetch driver trips" });
  }
});

// ============================================================================
// BULK OPERATIONS ROUTES
// ============================================================================

// Bulk operations for trips
router.post("/trips/bulk", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { action, itemIds } = req.body;
    
    if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "Action and itemIds are required" });
    }

    const results = [];
    const failedItems = [];

    for (const tripId of itemIds) {
      try {
        let result;
        switch (action) {
          case 'status_scheduled':
            result = await tripsStorage.updateTrip(tripId, { status: 'scheduled' });
            break;
          case 'status_in_progress':
            result = await tripsStorage.updateTrip(tripId, { status: 'in_progress' });
            break;
          case 'status_completed':
            result = await tripsStorage.updateTrip(tripId, { status: 'completed' });
            break;
          case 'status_cancelled':
            result = await tripsStorage.updateTrip(tripId, { status: 'cancelled' });
            break;
          case 'delete':
            await tripsStorage.deleteTrip(tripId);
            result = { id: tripId, deleted: true };
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push(result);
      } catch (error) {
        console.error(`Error processing trip ${tripId}:`, error);
        failedItems.push(tripId);
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} trips successfully`,
      processedCount: results.length,
      failedItems,
      results
    });
  } catch (error) {
    console.error("Error in bulk trip operations:", error);
    res.status(500).json({ message: "Failed to process bulk trip operations" });
  }
});

// Bulk operations for drivers
router.post("/drivers/bulk", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { action, itemIds } = req.body;
    
    if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "Action and itemIds are required" });
    }

    const results = [];
    const failedItems = [];

    for (const driverId of itemIds) {
      try {
        let result;
        switch (action) {
          case 'status_active':
            result = await driversStorage.updateDriver(driverId, { status: 'active' });
            break;
          case 'status_inactive':
            result = await driversStorage.updateDriver(driverId, { status: 'inactive' });
            break;
          case 'delete':
            await driversStorage.deleteDriver(driverId);
            result = { id: driverId, deleted: true };
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push(result);
      } catch (error) {
        console.error(`Error processing driver ${driverId}:`, error);
        failedItems.push(driverId);
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} drivers successfully`,
      processedCount: results.length,
      failedItems,
      results
    });
  } catch (error) {
    console.error("Error in bulk driver operations:", error);
    res.status(500).json({ message: "Failed to process bulk driver operations" });
  }
});

// Bulk operations for clients
router.post("/clients/bulk", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { action, itemIds } = req.body;
    
    if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "Action and itemIds are required" });
    }

    const results = [];
    const failedItems = [];

    for (const clientId of itemIds) {
      try {
        let result;
        switch (action) {
          case 'status_active':
            result = await clientsStorage.updateClient(clientId, { status: 'active' });
            break;
          case 'status_inactive':
            result = await clientsStorage.updateClient(clientId, { status: 'inactive' });
            break;
          case 'delete':
            await clientsStorage.deleteClient(clientId);
            result = { id: clientId, deleted: true };
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push(result);
      } catch (error) {
        console.error(`Error processing client ${clientId}:`, error);
        failedItems.push(clientId);
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} clients successfully`,
      processedCount: results.length,
      failedItems,
      results
    });
  } catch (error) {
    console.error("Error in bulk client operations:", error);
    res.status(500).json({ message: "Failed to process bulk client operations" });
  }
});

// Bulk operations for locations
router.post("/locations/bulk", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { action, itemIds } = req.body;
    
    if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "Action and itemIds are required" });
    }

    const results = [];
    const failedItems = [];

    for (const locationId of itemIds) {
      try {
        let result;
        switch (action) {
          case 'status_active':
            result = await locationsStorage.updateLocation(locationId, { is_active: true });
            break;
          case 'status_inactive':
            result = await locationsStorage.updateLocation(locationId, { is_active: false });
            break;
          case 'delete':
            await locationsStorage.deleteLocation(locationId);
            result = { id: locationId, deleted: true };
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push(result);
      } catch (error) {
        console.error(`Error processing location ${locationId}:`, error);
        failedItems.push(locationId);
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} locations successfully`,
      processedCount: results.length,
      failedItems,
      results
    });
  } catch (error) {
    console.error("Error in bulk location operations:", error);
    res.status(500).json({ message: "Failed to process bulk location operations" });
  }
});

export default router;
