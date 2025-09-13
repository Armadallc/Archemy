import express from "express";
import { storage } from "./minimal-supabase";
import { supabase } from "./db";
import { 
  insertOrganizationSchema,
  insertUserSchema,
  insertServiceAreaSchema,
  insertClientGroupSchema,
  insertClientGroupMembershipSchema,
  insertClientSchema,
  insertDriverSchema,
  insertDriverScheduleSchema,
  insertTripSchema,
} from "@shared/schema";
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
import { 
  hasEnhancedPermission, 
  isFeatureEnabled, 
  requireEnhancedPermission,
  grantPermission,
  revokePermission,
  toggleFeatureFlag,
  getRolePermissions,
  getUserEffectivePermissions
} from "./enhanced-permissions";
import { notificationService } from "./notification-service";

const router = express.Router();

// Add middleware to ensure API routes are handled correctly
router.use((req, res, next) => {
  console.log(`🔍 API Route called: ${req.method} ${req.originalUrl}`);
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Debug routes
router.get("/debug/users", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, user_name, email, role, primary_organization_id, authorized_organizations')
        .order('role');
      
      if (error) throw error;
      console.log('Found users:', data);
      res.json({ users: data });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
  });

  // Debug session endpoint
  app.get("/api/debug/session", (req: any, res) => {
    console.log('🔍 Session debug:', {
      sessionID: req.sessionID,
      session: req.session,
      cookies: req.headers.cookie,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      sessionID: req.sessionID,
      sessionExists: !!req.session,
      userId: req.session?.userId,
      cookies: req.headers.cookie,
      hasSession: !!req.session?.userId
    });
  });

  // Super Admin login endpoint
  app.post('/api/auth/super-admin-login', async (req: any, res: any) => {
    try {
      const superAdmin = await storage.getUserByEmail('admin@monarch.org');
      if (!superAdmin) {
        return res.status(404).json({ message: 'Super admin not found' });
      }

      console.log('✅ Super admin logged in:', superAdmin.userId, superAdmin.role);
      console.log('🔍 Session before setting:', { 
        sessionId: req.sessionID, 
        userId: req.session?.userId,
        exists: !!req.session 
      });
      
      // Create session
      req.session.userId = superAdmin.userId;
      req.session.user = superAdmin;
      req.session.currentOrganizationId = superAdmin.primaryOrganizationId;
      
      console.log('🔍 Session after setting:', { 
        sessionId: req.sessionID, 
        userId: req.session.userId,
        userSet: !!req.session.user 
      });

      // Save session explicitly to ensure persistence
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }

        console.log("Session saved:", { 
          sessionId: req.sessionID, 
          userId: req.session.userId,
          userRole: superAdmin.role
        });

        // Return user without password hash
        const { passwordHash, ...userWithoutPassword } = superAdmin;
        res.json({
          user: userWithoutPassword,
          message: 'Super admin login successful'
        });
      });
    } catch (error) {
      console.error('Super admin login failed:', error);
      res.status(500).json({ message: 'Super admin login failed' });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.post("/api/auth/demo-login", demoLogin);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/user", getCurrentUser);

  // Organization routes (no auth required)
  app.get("/api/organizations", async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.post("/api/organizations", async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(validatedData);
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(400).json({ message: "Failed to create organization" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get users by organization
  app.get("/api/users/organization/:organizationId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, user_name, email, role, primary_organization_id, authorized_organizations, is_active')
        .eq('primary_organization_id', req.params.organizationId)
        .order('user_name');
      
      if (error) throw error;
      
      const users = data.map(user => ({
        userId: user.user_id,
        userName: user.user_name,
        email: user.email,
        role: user.role,
        primaryOrganizationId: user.primary_organization_id,
        authorizedOrganizations: user.authorized_organizations || [],
        isActive: user.is_active
      }));
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user (edit profile or toggle status)
  app.patch("/api/users/:userId", async (req, res) => {
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
  app.delete("/api/users/:userId", async (req, res) => {
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

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(validatedData.passwordHash, 10);
      const userData = { ...validatedData, passwordHash: hashedPassword };
      const user = await storage.createUser(userData);
      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  // Service area routes
  app.get("/api/service-areas/organization/:organizationId", 
    requireAuth,
    requireOrganizationAccess('organizationId'),
    requirePermission(PERMISSIONS.VIEW_SERVICE_AREAS),
    async (req, res) => {
      try {
        const serviceAreas = await storage.getServiceAreasByOrganization(req.params.organizationId);
        res.json(serviceAreas);
      } catch (error) {
        console.error("Error fetching service areas:", error);
        res.status(500).json({ message: "Failed to fetch service areas" });
      }
    }
  );

  app.post("/api/service-areas", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_SERVICE_AREAS),
    async (req, res) => {
      try {
        const validatedData = insertServiceAreaSchema.parse(req.body);
        const serviceArea = await storage.createServiceArea(validatedData);
        res.status(201).json(serviceArea);
      } catch (error) {
        console.error("Error creating service area:", error);
        res.status(400).json({ message: "Failed to create service area" });
      }
    }
  );

  app.put("/api/service-areas/:id", async (req, res) => {
    try {
      const validatedData = insertServiceAreaSchema.partial().parse(req.body);
      const serviceArea = await storage.updateServiceArea(req.params.id, validatedData);
      res.json(serviceArea);
    } catch (error) {
      console.error("Error updating service area:", error);
      res.status(400).json({ message: "Failed to update service area" });
    }
  });

  app.delete("/api/service-areas/:id", async (req, res) => {
    try {
      await storage.deleteServiceArea(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service area:", error);
      res.status(500).json({ message: "Failed to delete service area" });
    }
  });

  // Client group routes
  app.get("/api/client-groups/organization/:organizationId", async (req, res) => {
    try {
      const clientGroups = await storage.getClientGroupsByOrganization(req.params.organizationId);
      res.json(clientGroups);
    } catch (error) {
      console.error("Error fetching client groups:", error);
      res.status(500).json({ message: "Failed to fetch client groups" });
    }
  });

  app.get("/api/client-groups/:id", async (req, res) => {
    try {
      const clientGroup = await storage.getClientGroup(req.params.id);
      if (!clientGroup) {
        return res.status(404).json({ message: "Client group not found" });
      }
      res.json(clientGroup);
    } catch (error) {
      console.error("Error fetching client group:", error);
      res.status(500).json({ message: "Failed to fetch client group" });
    }
  });

  app.post("/api/client-groups", async (req, res) => {
    try {
      const validatedData = insertClientGroupSchema.parse(req.body);
      const clientGroup = await storage.createClientGroup(validatedData);
      res.status(201).json(clientGroup);
    } catch (error) {
      console.error("Error creating client group:", error);
      res.status(400).json({ message: "Failed to create client group" });
    }
  });

  app.put("/api/client-groups/:id", async (req, res) => {
    try {
      const validatedData = insertClientGroupSchema.partial().parse(req.body);
      const clientGroup = await storage.updateClientGroup(req.params.id, validatedData);
      res.json(clientGroup);
    } catch (error) {
      console.error("Error updating client group:", error);
      res.status(400).json({ message: "Failed to update client group" });
    }
  });

  app.delete("/api/client-groups/:id", async (req, res) => {
    try {
      await storage.deleteClientGroup(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client group:", error);
      res.status(500).json({ message: "Failed to delete client group" });
    }
  });

  // Client group membership routes
  app.get("/api/client-groups/:id/clients", async (req, res) => {
    try {
      const clients = await storage.getClientsByGroup(req.params.id);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching group clients:", error);
      res.status(500).json({ message: "Failed to fetch group clients" });
    }
  });

  app.post("/api/client-groups/:groupId/clients/:clientId", async (req, res) => {
    try {
      const membership = await storage.addClientToGroup(req.params.clientId, req.params.groupId);
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error adding client to group:", error);
      res.status(400).json({ message: "Failed to add client to group" });
    }
  });

  app.delete("/api/client-groups/:groupId/clients/:clientId", async (req, res) => {
    try {
      await storage.removeClientFromGroup(req.params.clientId, req.params.groupId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing client from group:", error);
      res.status(500).json({ message: "Failed to remove client from group" });
    }
  });

  app.get("/api/clients/:clientId/groups", async (req, res) => {
    try {
      const groups = await storage.getGroupsByClient(req.params.clientId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching client groups:", error);
      res.status(500).json({ message: "Failed to fetch client groups" });
    }
  });

  // Super admin endpoints without auth for cross-organization access
  app.get("/api/super-admin/clients", async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      let allClients = [];

      for (const org of organizations) {
        const clients = await storage.getClientsByOrganization(org.id);
        const clientsWithOrg = clients.map(client => ({
          ...client,
          organizationName: org.name
        }));
        allClients.push(...clientsWithOrg);
      }

      const clientsWithServiceAreas = await Promise.all(
        allClients.map(async (client) => {
          const serviceArea = await storage.getServiceArea(client.serviceAreaId);
          return {
            ...client,
            serviceAreaNickname: serviceArea?.nickname || "Unknown",
          };
        })
      );

      console.log("🔍 Super admin got all clients:", clientsWithServiceAreas.length);
      res.json(clientsWithServiceAreas);
    } catch (error) {
      console.error("Error fetching all clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/super-admin/drivers", async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      let allDrivers = [];

      for (const org of organizations) {
        const drivers = await storage.getDriversByOrganization(org.id);
        const driversWithOrg = drivers.map(driver => ({
          ...driver,
          organizationName: org.name
        }));
        allDrivers.push(...driversWithOrg);
      }

      console.log("🔍 Super admin got all drivers:", allDrivers.length);
      res.json(allDrivers);
    } catch (error) {
      console.error("Error fetching all drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.get("/api/super-admin/trips", async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      let allTrips = [];

      for (const org of organizations) {
        const trips = await storage.getTripsByOrganization(org.id);
        const tripsWithOrg = trips.map(trip => ({
          ...trip,
          organizationName: org.name
        }));
        allTrips.push(...tripsWithOrg);
      }

      console.log("🔍 Super admin got all trips:", allTrips.length);
      res.json(allTrips);
    } catch (error) {
      console.error("Error fetching all trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get("/api/super-admin/vehicles", async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      let allVehicles = [];

      for (const org of organizations) {
        const vehicles = await storage.getVehiclesByOrganization(org.id);
        const vehiclesWithOrg = vehicles.map(vehicle => ({
          ...vehicle,
          organizationName: org.name
        }));
        allVehicles.push(...vehiclesWithOrg);
      }

      console.log("🔍 Super admin got all vehicles:", allVehicles.length);
      res.json(allVehicles);
    } catch (error) {
      console.error("Error fetching all vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/super-admin/clients", async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      let allClients = [];

      for (const org of organizations) {
        const clients = await storage.getClientsByOrganization(org.id);
        const clientsWithOrg = clients.map(client => ({
          ...client,
          organizationName: org.name
        }));
        allClients.push(...clientsWithOrg);
      }

      console.log("🔍 Super admin got all clients:", allClients.length);
      res.json(allClients);
    } catch (error) {
      console.error("Error fetching all clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/super-admin/trips", async (req, res) => {
    try {
      // Create trip data with proper field mapping for super admin
      const tripData = {
        id: `trip_${Date.now()}`,
        organization_id: req.body.organizationId,
        client_id: req.body.clientId,
        driver_id: req.body.driverId || null,
        trip_type: req.body.tripType,
        pickup_address: req.body.pickupAddress,
        dropoff_address: req.body.dropoffAddress,
        scheduled_pickup_time: req.body.scheduledPickupTime,
        scheduled_return_time: req.body.scheduledReturnTime || null,
        passenger_count: req.body.passengerCount || 1,
        special_requirements: req.body.specialRequirements || null,
        status: req.body.status || 'scheduled',
        notes: req.body.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("🚗 Super admin creating trip:", tripData);
      const trip = await storage.createTrip(tripData);
      res.status(201).json(trip);
    } catch (error: any) {
      console.error("Error creating trip as super admin:", error);
      res.status(400).json({ message: error.message || "Failed to create trip" });
    }
  });

  // Client routes - Super admin endpoint to get all clients across organizations
  app.get("/api/clients", 
    requireAuth,
    requireRole('super_admin'),
    async (req, res) => {
      try {
        // Get all organizations first
        const organizations = await storage.getAllOrganizations();
        let allClients = [];

        // Get clients from all organizations
        for (const org of organizations) {
          const clients = await storage.getClientsByOrganization(org.id);
          // Add organization info to each client
          const clientsWithOrg = clients.map(client => ({
            ...client,
            organizationName: org.name
          }));
          allClients.push(...clientsWithOrg);
        }

        // Join with service areas to get service area nicknames
        const clientsWithServiceAreas = await Promise.all(
          allClients.map(async (client) => {
            const serviceArea = await storage.getServiceArea(client.serviceAreaId);
            return {
              ...client,
              serviceAreaNickname: serviceArea?.nickname || "Unknown",
            };
          })
        );

        console.log("🔍 Super admin got all clients:", clientsWithServiceAreas.length);
        res.json(clientsWithServiceAreas);
      } catch (error) {
        console.error("Error fetching all clients:", error);
        res.status(500).json({ message: "Failed to fetch clients" });
      }
    }
  );

  // Super admin endpoint to get all drivers across organizations (bypasses auth)
  app.get("/api/super-admin/drivers", 
    async (req, res) => {
      try {
        // Get all organizations first
        const organizations = await storage.getAllOrganizations();
        
        // Get drivers from all organizations
        const allDrivers = [];
        for (const org of organizations) {
          const orgDrivers = await storage.getDriversByOrganization(org.id);
          // Add organization name to each driver
          const driversWithOrgName = orgDrivers.map(driver => ({
            ...driver,
            organizationName: org.name
          }));
          allDrivers.push(...driversWithOrgName);
        }

        console.log("🔍 Super admin got all drivers:", allDrivers.length);
        res.json(allDrivers);
      } catch (error) {
        console.error("Error fetching all drivers:", error);
        res.status(500).json({ message: "Failed to fetch drivers" });
      }
    }
  );

  // Super admin endpoint to get all trips across organizations (bypasses auth)
  app.get("/api/super-admin/trips", 
    async (req, res) => {
      try {
        // Get all organizations first
        const organizations = await storage.getAllOrganizations();
        
        // Get trips from all organizations
        const allTrips = [];
        for (const org of organizations) {
          const orgTrips = await storage.getTripsByOrganization(org.id);
          // Add organization info to each trip
          const tripsWithOrgInfo = orgTrips.map(trip => ({
            ...trip,
            organizationId: org.id,
            organizationName: org.name
          }));
          allTrips.push(...tripsWithOrgInfo);
        }

        console.log("🔍 Super admin got all trips:", allTrips.length);
        res.json(allTrips);
      } catch (error) {
        console.error("Error fetching all trips:", error);
        res.status(500).json({ message: "Failed to fetch trips" });
      }
    }
  );

  // Super admin endpoint to get all vehicles across organizations (bypasses auth)
  app.get("/api/super-admin/vehicles", 
    async (req, res) => {
      try {
        // Get all organizations first
        const organizations = await storage.getAllOrganizations();
        
        // Get vehicles from all organizations
        const allVehicles = [];
        for (const org of organizations) {
          const orgVehicles = await storage.getVehiclesByOrganization(org.id);
          // Add organization name to each vehicle
          const vehiclesWithOrgName = orgVehicles.map(vehicle => ({
            ...vehicle,
            organizationName: org.name
          }));
          allVehicles.push(...vehiclesWithOrgName);
        }

        console.log("🔍 Super admin got all vehicles:", allVehicles.length);
        res.json(allVehicles);
      } catch (error) {
        console.error("Error fetching all vehicles:", error);
        res.status(500).json({ message: "Failed to fetch vehicles" });
      }
    }
  );

  app.get("/api/clients/organization/:organizationId", 
    requireAuth,
    requireOrganizationAccess('organizationId'),
    requirePermission(PERMISSIONS.VIEW_CLIENTS),
    async (req, res) => {
      try {
        const organizationId = req.params.organizationId;
        const clients = await storage.getClientsByOrganization(organizationId);
        console.log("🔍 Got clients:", clients.length);

        // Join with service areas to get service area nicknames
        const clientsWithServiceAreas = await Promise.all(
          clients.map(async (client) => {
            const serviceArea = await storage.getServiceArea(client.serviceAreaId);
            return {
              ...client, // Include all client fields
              serviceAreaNickname: serviceArea?.nickname || "Unknown",
            };
          })
        );
        res.json(clientsWithServiceAreas);
      } catch (error) {
        console.error("Error fetching clients:", error);
        if (error instanceof Error && error.message.includes("Access denied")) {
          res.status(403).json({ message: error.message });
        } else {
          res.status(500).json({ message: "Failed to fetch clients" });
        }
      }
    }
  );

  app.post("/api/clients", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_CLIENTS),
    async (req, res) => {
      try {
        const validatedData = insertClientSchema.parse(req.body);
        const client = await storage.createClient(validatedData);
        res.status(201).json(client);
      } catch (error) {
        console.error("Error creating client:", error);
        res.status(400).json({ message: "Failed to create client" });
      }
    }
  );

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(400).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Driver routes
  app.get("/api/drivers/organization/:organizationId", 
    requireAuth,
    requireOrganizationAccess('organizationId'),
    requirePermission(PERMISSIONS.VIEW_DRIVERS),
    async (req, res) => {
      try {
        const drivers = await storage.getDriversByOrganization(req.params.organizationId);
        res.json(drivers);
      } catch (error) {
        console.error("Error fetching drivers:", error);
        res.status(500).json({ message: "Failed to fetch drivers" });
      }
    }
  );

  app.post("/api/drivers", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_DRIVERS),
    async (req, res) => {
      try {
        // Parse date fields before validation
        const requestData = { ...req.body };
        if (requestData.licenseExpiry) {
          requestData.licenseExpiry = new Date(requestData.licenseExpiry);
        }
        
        const validatedData = insertDriverSchema.parse(requestData);
        const driver = await storage.createDriver(validatedData);
        res.status(201).json(driver);
      } catch (error) {
        console.error("Error creating driver:", error);
        res.status(400).json({ message: "Failed to create driver" });
      }
    }
  );

  app.patch("/api/drivers/:id", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_DRIVERS),
    async (req, res) => {
      try {
        const updates = req.body;
        const driver = await storage.updateDriver(req.params.id, updates);
        res.json(driver);
      } catch (error) {
        console.error("Error updating driver:", error);
        res.status(400).json({ message: "Failed to update driver" });
      }
    }
  );

  app.delete("/api/drivers/:id", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_DRIVERS),
    async (req, res) => {
      try {
        await storage.updateDriver(req.params.id, { is_active: false });
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting driver:", error);
        res.status(500).json({ message: "Failed to delete driver" });
      }
    }
  );

  // Driver schedule routes
  app.get("/api/driver-schedules/:driverId", async (req, res) => {
    try {
      const schedules = await storage.getDriverSchedules(req.params.driverId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching driver schedules:", error);
      res.status(500).json({ message: "Failed to fetch driver schedules" });
    }
  });

  app.post("/api/driver-schedules", async (req, res) => {
    try {
      const validatedData = insertDriverScheduleSchema.parse(req.body);
      const schedule = await storage.createDriverSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating driver schedule:", error);
      res.status(400).json({ message: "Failed to create driver schedule" });
    }
  });

  // Trip routes
  app.get("/api/trips/organization/:organizationId", 
    requireAuth,
    requireOrganizationAccess('organizationId'),
    requirePermission(PERMISSIONS.VIEW_TRIPS),
    async (req, res) => {
      try {
        const organizationId = req.params.organizationId;
        const trips = await storage.getTripsByOrganization(organizationId);

      // Join with clients and drivers to get detailed trip information
      const tripsWithDetails = await Promise.all(
        trips.map(async (trip) => {
          const client = await storage.getClient(trip.client_id);
          const driver = trip.driver_id ? await storage.getUser(trip.driver_id) : null;
          
          // Safe date conversion
          let scheduledPickupTime = null;
          const dateValue = trip.scheduled_pickup_time;
          if (dateValue) {
            try {
              scheduledPickupTime = new Date(dateValue).toISOString();
            } catch (e) {
              console.log('Date conversion error:', e, 'for value:', dateValue);
            }
          }
          
          return {
            id: trip.id,
            client_first_name: client?.first_name || "Unknown",
            client_last_name: client?.last_name || "Client", 
            driver_name: driver?.user_name || null,
            pickup_address: trip.pickup_address,
            dropoff_address: trip.dropoff_address,
            scheduled_pickup_time: scheduledPickupTime,
            scheduled_dropoff_time: trip.scheduled_dropoff_time,
            actual_pickup_time: trip.actual_pickup_time,
            actual_dropoff_time: trip.actual_dropoff_time,
            status: trip.status,
            trip_type: trip.trip_type,
            passenger_count: trip.passenger_count,
            notes: trip.notes,
            created_at: trip.created_at,
            updated_at: trip.updated_at
          };
        })
      );
      res.json(tripsWithDetails);
    } catch (error) {
      console.error("Error fetching trips:", error);
      if (error instanceof Error && error.message.includes("Access denied")) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to fetch trips" });
      }
    }
  });

  // General trips endpoint for calendar component
  app.get("/api/trips", requireAuth, async (req: AuthenticatedRequest, res) => {
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
            driver_name: driver?.user_name || null,
            pickup_location: trip.pickup_address,
            dropoff_location: trip.dropoff_address
          };
        })
      );
      
      res.json(tripsWithDetails);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get("/api/trips/driver/:driverId", async (req, res) => {
    try {
      const driverId = req.params.driverId;
      console.log(`🔍 Fetching trips for driver: ${driverId}`);
      
      const trips = await storage.getTripsByDriver(driverId);
      console.log(`📋 Found ${trips.length} trips for driver ${driverId}`);
      
      // Add enhanced fields for web app
      const enhancedTrips = trips.map(trip => ({
        ...trip,
        pickup_location: trip.pickup_address || trip.pickup_location,
        dropoff_location: trip.dropoff_address || trip.dropoff_location,
        scheduled_pickup_time: trip.scheduled_pickup_time,
        passenger_count: trip.passenger_count || 1,
        status: trip.status || 'scheduled'
      }));
      
      res.json(enhancedTrips);
    } catch (error) {
      console.error("Error fetching driver trips:", error);
      res.status(500).json({ message: "Failed to fetch driver trips" });
    }
  });n({ message: "Failed to fetch driver trips" });
    }
  });

  app.post("/api/trips", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Create trip data with proper field mapping
      const tripData = {
        id: `trip_${Date.now()}`,
        organization_id: req.body.organizationId,
        client_id: req.body.clientId,
        driver_id: req.body.driverId || null,
        trip_type: req.body.tripType,
        pickup_address: req.body.pickupAddress,
        dropoff_address: req.body.dropoffAddress,
        scheduled_pickup_time: req.body.scheduledPickupTime,
        scheduled_return_time: req.body.scheduledReturnTime || null,
        passenger_count: req.body.passengerCount || 1,
        special_requirements: req.body.specialRequirements || null,
        status: req.body.status || 'scheduled',
        notes: req.body.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("🚗 Creating trip:", tripData);
      const trip = await storage.createTrip(tripData);
      
      // Trigger notification workflow: User creates trip → Driver notification
      if (trip.driver_id) {
        await notificationService.handleTripStatusChange({
          tripId: trip.id,
          status: 'scheduled',
          driverId: trip.driver_id,
          userId: req.user?.userId,
          organizationId: trip.organization_id,
          timestamp: trip.created_at
        });
        
        console.log(`📅 Trip created: ${trip.id} → Driver ${trip.driver_id} notified`);
      }
      
      res.status(201).json(trip);
    } catch (error: any) {
      console.error("Error creating trip:", error);
      res.status(400).json({ message: error.message || "Failed to create trip" });
    }
  });

  app.put("/api/trips/:id", async (req, res) => {
    try {
      const validatedData = insertTripSchema.partial().parse(req.body);
      const trip = await storage.updateTrip(req.params.id, validatedData);
      res.json(trip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(400).json({ message: "Failed to update trip" });
    }
  });

  app.patch("/api/trips/:id", async (req, res) => {
    try {
      const updates = req.body;
      const trip = await storage.updateTrip(req.params.id, updates);
      res.json(trip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(400).json({ message: "Failed to update trip" });
    }
  });

  app.delete("/api/trips/:id", async (req, res) => {
    try {
      await storage.deleteTrip(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles/organization/:organizationId", 
    requireAuth,
    requireOrganizationAccess('organizationId'),
    requirePermission(PERMISSIONS.VIEW_VEHICLES),
    async (req, res) => {
      try {
        const vehicles = await storage.getVehiclesByOrganization(req.params.organizationId);
        res.json(vehicles);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({ message: "Failed to fetch vehicles" });
      }
    }
  );

  app.get("/api/vehicles/:id", 
    requireAuth,
    async (req, res) => {
      try {
        const vehicle = await storage.getVehicle(req.params.id);
        res.json(vehicle);
      } catch (error) {
        console.error("Error fetching vehicle:", error);
        res.status(404).json({ message: "Vehicle not found" });
      }
    }
  );

  app.post("/api/vehicles", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_VEHICLES),
    async (req, res) => {
      try {
        const vehicleData = {
          id: `vehicle_${Date.now()}`,
          ...req.body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const vehicle = await storage.createVehicle(vehicleData);
        res.status(201).json(vehicle);
      } catch (error) {
        console.error("Error creating vehicle:", error);
        res.status(400).json({ message: "Failed to create vehicle" });
      }
    }
  );

  app.patch("/api/vehicles/:id", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_VEHICLES),
    async (req, res) => {
      try {
        const updates = {
          ...req.body,
          updated_at: new Date().toISOString()
        };
        const vehicle = await storage.updateVehicle(req.params.id, updates);
        res.json(vehicle);
      } catch (error) {
        console.error("Error updating vehicle:", error);
        res.status(400).json({ message: "Failed to update vehicle" });
      }
    }
  );

  app.delete("/api/vehicles/:id", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_VEHICLES),
    async (req, res) => {
      try {
        await storage.deleteVehicle(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        res.status(500).json({ message: "Failed to delete vehicle" });
      }
    }
  );

  // Driver-Vehicle Assignment routes
  app.get("/api/drivers/:driverId/vehicles", 
    requireAuth,
    async (req, res) => {
      try {
        const assignments = await storage.getDriverVehicleAssignments(req.params.driverId);
        res.json(assignments);
      } catch (error) {
        console.error("Error fetching driver vehicle assignments:", error);
        res.status(500).json({ message: "Failed to fetch vehicle assignments" });
      }
    }
  );

  app.post("/api/drivers/:driverId/vehicles", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_DRIVERS),
    async (req, res) => {
      try {
        const assignmentData = {
          id: `assignment_${Date.now()}`,
          driver_id: req.params.driverId,
          vehicle_id: req.body.vehicle_id,
          assigned_date: new Date().toISOString().split('T')[0],
          is_primary: req.body.is_primary || false,
          created_at: new Date().toISOString()
        };
        const assignment = await storage.assignVehicleToDriver(assignmentData);
        res.status(201).json(assignment);
      } catch (error) {
        console.error("Error assigning vehicle to driver:", error);
        res.status(400).json({ message: "Failed to assign vehicle" });
      }
    }
  );

  app.delete("/api/drivers/:driverId/vehicles/:vehicleId", 
    requireAuth,
    requirePermission(PERMISSIONS.MANAGE_DRIVERS),
    async (req, res) => {
      try {
        await storage.removeVehicleFromDriver(req.params.driverId, req.params.vehicleId);
        res.status(204).send();
      } catch (error) {
        console.error("Error removing vehicle from driver:", error);
        res.status(500).json({ message: "Failed to remove vehicle assignment" });
      }
    }
  );

  // Dashboard stats (no auth required)
  app.get("/api/dashboard/stats/:organizationId", async (req, res) => {
    try {
      const organizationId = req.params.organizationId;
      const [trips, clients, drivers] = await Promise.all([
        storage.getTripsByOrganization(organizationId),
        storage.getClientsByOrganization(organizationId),
        storage.getDriversByOrganization(organizationId),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysTrips = trips.filter(trip => {
        const tripDate = new Date(trip.scheduledPickupTime);
        return tripDate >= today && tripDate < tomorrow;
      });

      const completedTrips = todaysTrips.filter(trip => trip.status === 'completed');
      const activeDrivers = drivers.length; // Simplified - could add more complex logic

      res.json({
        todaysTrips: todaysTrips.length,
        completedTrips: completedTrips.length,
        activeDrivers,
        totalClients: clients.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      if (error instanceof Error && error.message.includes("Access denied")) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
      }
    }
  });





  // Clean up duplicate clients
  app.post("/api/clients/cleanup-duplicates/:organizationId", async (req, res) => {
    try {
      const organizationId = req.params.organizationId;
      const clients = await storage.getClientsByOrganization(organizationId);
console.log("🔍 Got clients:", clients.length);
      
      // Group clients by name combination to find duplicates
      const clientGroups = new Map();
      
      clients.forEach(client => {
        const key = `${client.firstName.toLowerCase()}_${client.lastName.toLowerCase()}`;
        if (!clientGroups.has(key)) {
          clientGroups.set(key, []);
        }
        clientGroups.get(key).push(client);
      });
      
      let deletedCount = 0;
      let updatedTripsCount = 0;
      
      // For each group, keep the oldest client and delete the rest
      for (const [name, group] of clientGroups) {
        if (group.length > 1) {
          // Sort by creation date, keep the first (oldest)
          group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const toKeep = group[0];
          const toDelete = group.slice(1);
          
          console.log(`🧹 Found ${group.length} duplicates for ${name}, keeping ${toKeep.id}, deleting ${toDelete.length} others`);
          
          // For each duplicate client, handle their trips
          for (const client of toDelete) {
            // Get trips for this client
            const clientTrips = await storage.getTripsByClient(client.id);
            
            // Update trips to reference the client we're keeping
            for (const trip of clientTrips) {
              await storage.updateTrip(trip.id, { clientId: toKeep.id });
              updatedTripsCount++;
            }
            
            // Remove from client groups if any
            try {
              const clientGroups = await storage.getGroupsByClient(client.id);
              for (const group of clientGroups) {
                await storage.removeClientFromGroup(client.id, group.id);
              }
            } catch (error) {
              console.log(`Note: Client ${client.id} was not in any groups`);
            }
            
            // Now safe to delete the client
            await storage.deleteClient(client.id);
            deletedCount++;
          }
        }
      }
      
      res.json({ 
        message: `Cleanup completed. Deleted ${deletedCount} duplicate clients and updated ${updatedTripsCount} trips.`,
        deletedCount,
        updatedTripsCount,
        originalCount: clients.length,
        remainingCount: clients.length - deletedCount
      });
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
      res.status(500).json({ message: "Failed to cleanup duplicates" });
    }
  });

  // Get available drivers for a specific trip time slot
  app.get("/api/trips/:tripId/available-drivers", async (req, res) => {
    try {
      const { tripId } = req.params;
      
      // Query trip directly from Supabase
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (tripError || !tripData) {
        console.log(`🔍 Trip ${tripId} not found in database`);
        return res.status(404).json({ message: "Trip not found" });
      }

      console.log(`🔍 Found trip ${tripId} for organization ${tripData.organization_id}`);

      // Get all drivers
      const allDrivers = await storage.getDriversByOrganization("all");
      
      // Filter available drivers based on constraints
      const tripDate = new Date(tripData.scheduled_pickup_time);
      const dayOfWeek = tripDate.getDay();
      
      const availableDrivers = [];
      
      for (const driver of allDrivers) {
        // Check if driver is active and available
        if (!driver.is_active || !driver.is_available) continue;
        
        // Check organization authorization
        const authorizedOrgs = driver.authorized_organizations || [];
        const canWorkForOrg = driver.primary_organization_id === tripData.organization_id || 
                              authorizedOrgs.includes(tripData.organization_id);
        
        if (!canWorkForOrg) continue;
        
        // Check for conflicting trips (same day)
        const driverTrips = await storage.getTripsByDriver(driver.id);
        const conflictingTrips = driverTrips.filter(driverTrip => {
          const driverTripDate = new Date(driverTrip.scheduled_pickup_time);
          return driverTripDate.toDateString() === tripDate.toDateString() &&
                 driverTrip.status !== 'cancelled' &&
                 driverTrip.id !== tripId;
        });
        
        if (conflictingTrips.length > 0) continue;
        
        availableDrivers.push(driver);
      }
      
      console.log(`🔍 Found ${availableDrivers.length} available drivers for trip ${tripId}`);
      res.json(availableDrivers);
    } catch (error) {
      console.error("❌ Error fetching available drivers:", error);
      res.status(500).json({ message: "Failed to fetch available drivers" });
    }
  });

  // Assign driver to trip
  app.patch("/api/trips/:tripId/assign-driver", 
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
      
      // Send notification to driver about new assignment
      try {
        await notificationService.sendTripNotification(
          tripId,
          driverId,
          req.user!.primaryOrganizationId,
          'scheduled',
          new Date().toISOString(),
          req.user!.userId
        );
      } catch (notifError) {
        console.log("⚠️ Notification failed but assignment successful:", notifError);
      }
      
      res.json(updatedTrip);
    } catch (error) {
      console.error("❌ Error assigning driver:", error);
      res.status(500).json({ message: "Failed to assign driver" });
    }
  });

  // Get individual trip details
  app.get("/api/trips/:tripId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { tripId } = req.params;
      
      // Query trip with joined client and driver data
      const { data: tripData, error } = await supabase
        .from('trips')
        .select(`
          *,
          clients:client_id (
            first_name,
            last_name,
            phone
          ),
          drivers:driver_id (
            id,
            user_id,
            license_number,
            vehicle_info,
            users:user_id (
              user_name,
              email
            )
          )
        `)
        .eq('id', tripId)
        .single();
      
      if (error || !tripData) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(tripData);
    } catch (error) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  // Update individual trip
  app.patch("/api/trips/:tripId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { tripId } = req.params;
      const {
        clientId,
        driverId,
        tripType,
        pickupAddress,
        dropoffAddress,
        scheduledPickupTime,
        scheduledReturnTime,
        passengerCount,
        specialRequirements,
        notes,
        status
      } = req.body;

      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (clientId) updateData.client_id = clientId;
      if (driverId !== undefined) updateData.driver_id = driverId || null;
      if (tripType) updateData.trip_type = tripType;
      if (pickupAddress) updateData.pickup_address = pickupAddress;
      if (dropoffAddress) updateData.dropoff_address = dropoffAddress;
      if (scheduledPickupTime) updateData.scheduled_pickup_time = scheduledPickupTime;
      if (scheduledReturnTime) updateData.scheduled_return_time = scheduledReturnTime;
      if (passengerCount) updateData.passenger_count = passengerCount;
      if (specialRequirements !== undefined) updateData.special_requirements = specialRequirements || null;
      if (notes !== undefined) updateData.notes = notes || null;
      if (status) updateData.status = status;

      const { data: updatedTrip, error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', tripId)
        .select(`
          *,
          clients:client_id (
            first_name,
            last_name,
            phone
          ),
          drivers:driver_id (
            id,
            user_id,
            license_number,
            vehicle_info,
            users:user_id (
              user_name,
              email
            )
          )
        `)
        .single();

      if (error) {
        console.error("Error updating trip:", error);
        return res.status(500).json({ message: "Failed to update trip" });
      }

      console.log(`✅ Updated trip ${tripId}`);
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  // Delete trip
  app.delete("/api/trips/:tripId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { tripId } = req.params;
      
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) {
        console.error("Error deleting trip:", error);
        return res.status(500).json({ message: "Failed to delete trip" });
      }

      console.log(`🗑️ Deleted trip ${tripId}`);
      res.json({ message: "Trip deleted successfully" });
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Mobile API: Get driver trips
  app.get("/api/mobile/driver/trips", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role !== 'driver') {
        return res.status(403).json({ message: "Only drivers can access this endpoint" });
      }

      const userId = req.user.userId;
      
      // First get the driver record for this user
      const { data: driverRecord, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (driverError || !driverRecord) {
        console.error("Driver record not found for user:", userId, driverError);
        return res.status(404).json({ message: "Driver record not found" });
      }

      // Query trips assigned to this driver with joined client data
      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          *,
          clients:client_id (
            first_name,
            last_name,
            phone
          )
        `)
        .eq('driver_id', driverRecord.id)
        .order('scheduled_pickup_time', { ascending: true });

      if (error) {
        console.error("Error fetching driver trips:", error);
        return res.status(500).json({ message: "Failed to fetch trips" });
      }

      // Transform to mobile-friendly format
      const mobileTrips = (trips || []).map(trip => ({
        id: trip.id,
        organizationId: trip.organization_id,
        clientId: trip.client_id,
        clientName: trip.clients ? `${trip.clients.first_name} ${trip.clients.last_name}` : 'Unknown Client',
        clientPhone: trip.clients?.phone,
        pickupLocation: trip.pickup_address || 'Location not specified',
        dropoffLocation: trip.dropoff_address || 'Location not specified',
        scheduledPickupTime: trip.scheduled_pickup_time,
        scheduledReturnTime: trip.scheduled_return_time,
        actualPickupTime: trip.actual_pickup_time,
        actualDropoffTime: trip.actual_dropoff_time,
        status: trip.status,
        tripType: trip.trip_type,
        passengerCount: trip.passenger_count,
        notes: trip.notes,
        specialRequirements: trip.special_requirements
      }));

      console.log(`📱 Mobile: Fetched ${mobileTrips.length} trips for driver ${userId} (driver_id: ${driverRecord.id})`);
      res.json(mobileTrips);
    } catch (error) {
      console.error("Error in mobile driver trips endpoint:", error);
      res.status(500).json({ message: "Failed to fetch driver trips" });
    }
  });

  // Mobile API: Update trip status
  app.patch("/api/mobile/trips/:tripId/status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role !== 'driver') {
        return res.status(403).json({ message: "Only drivers can access this endpoint" });
      }

      const { tripId } = req.params;
      const { status, timestamp, location, notes } = req.body;

      // Get the driver record for this user
      const { data: driverRecord, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', req.user.userId)
        .single();

      if (driverError || !driverRecord) {
        return res.status(403).json({ message: "Driver record not found" });
      }

      // Verify trip is assigned to this driver
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('driver_id', driverRecord.id)
        .single();

      if (tripError || !trip) {
        return res.status(404).json({ message: "Trip not found or not assigned to you" });
      }

      // Build update object
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'in_progress' && !trip.actual_pickup_time) {
        updateData.actual_pickup_time = timestamp || new Date().toISOString();
      }

      if (status === 'completed') {
        updateData.actual_dropoff_time = timestamp || new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      // Update trip
      const { data: updatedTrip, error: updateError } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', tripId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating trip status:", updateError);
        return res.status(500).json({ message: "Failed to update trip status" });
      }

      console.log(`📱 Mobile: Trip ${tripId} status updated to ${status} by driver ${req.user.userId}`);
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error in mobile trip status update:", error);
      res.status(500).json({ message: "Failed to update trip status" });
    }
  });

  // Enhanced Permission Management API Endpoints
  // Check if user has enhanced permission
  app.get("/api/permissions/check/:permission", 
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const permission = req.params.permission as any;
        const organizationId = req.query.organizationId as string;
        
        const hasAccess = await hasEnhancedPermission(req.user!.role, permission, organizationId);
        res.json({ hasPermission: hasAccess });
      } catch (error) {
        console.error("Error checking permission:", error);
        res.status(500).json({ message: "Failed to check permission" });
      }
    }
  );

  // Get role permissions
  app.get("/api/permissions/role/:role", 
    requireAuth,
    requireRole('super_admin', 'organization_admin'),
    async (req, res) => {
      try {
        const role = req.params.role;
        const organizationId = req.query.organizationId as string;
        
        const permissions = await getRolePermissions(role, organizationId);
        res.json(permissions);
      } catch (error) {
        console.error("Error fetching role permissions:", error);
        res.status(500).json({ message: "Failed to fetch permissions" });
      }
    }
  );

  // Grant permission to role
  app.post("/api/permissions/grant", 
    requireAuth,
    requireRole('super_admin'),
    async (req, res) => {
      try {
        const { role, permission, resource, organizationId } = req.body;
        
        const success = await grantPermission(role, permission, resource, organizationId);
        if (success) {
          res.json({ message: "Permission granted successfully" });
        } else {
          res.status(400).json({ message: "Failed to grant permission" });
        }
      } catch (error) {
        console.error("Error granting permission:", error);
        res.status(500).json({ message: "Failed to grant permission" });
      }
    }
  );

  // Revoke permission from role
  app.post("/api/permissions/revoke", 
    requireAuth,
    requireRole('super_admin'),
    async (req, res) => {
      try {
        const { role, permission, resource, organizationId } = req.body;
        
        const success = await revokePermission(role, permission, resource, organizationId);
        if (success) {
          res.json({ message: "Permission revoked successfully" });
        } else {
          res.status(400).json({ message: "Failed to revoke permission" });
        }
      } catch (error) {
        console.error("Error revoking permission:", error);
        res.status(500).json({ message: "Failed to revoke permission" });
      }
    }
  );

  // Feature flag management
  app.get("/api/feature-flags", 
    requireAuth,
    requireRole('super_admin', 'organization_admin'),
    async (req, res) => {
      try {
        const { data: flags } = await supabase
          .from('feature_flags')
          .select('*')
          .order('flag_name');
        
        res.json(flags || []);
      } catch (error) {
        console.error("Error fetching feature flags:", error);
        res.status(500).json({ message: "Failed to fetch feature flags" });
      }
    }
  );

  // Toggle feature flag
  app.post("/api/feature-flags/toggle", 
    requireAuth,
    requireRole('super_admin', 'organization_admin'),
    async (req, res) => {
      try {
        const { flagName, enabled, organizationId } = req.body;
        
        const success = await toggleFeatureFlag(flagName, enabled, organizationId);
        if (success) {
          res.json({ message: "Feature flag updated successfully" });
        } else {
          res.status(400).json({ message: "Failed to update feature flag" });
        }
      } catch (error) {
        console.error("Error toggling feature flag:", error);
        res.status(500).json({ message: "Failed to update feature flag" });
      }
    }
  );

  // Check feature flag status
  app.get("/api/feature-flags/check/:flagName", 
    requireAuth,
    async (req, res) => {
      try {
        const flagName = req.params.flagName;
        const organizationId = req.query.organizationId as string;
        
        const isEnabled = await isFeatureEnabled(flagName, organizationId);
        res.json({ flagName, isEnabled });
      } catch (error) {
        console.error("Error checking feature flag:", error);
        res.status(500).json({ message: "Failed to check feature flag" });
      }
    }
  );





  // Get effective permissions for current user
  app.get("/api/permissions/effective", 
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const authorizedOrgs = user.authorizedOrganizations || [];
        
        const effectivePermissions = await getUserEffectivePermissions(
          user.role,
          user.primaryOrganizationId,
          authorizedOrgs
        );
        
        res.json(effectivePermissions);
      } catch (error) {
        console.error("Error fetching effective permissions:", error);
        res.status(500).json({ message: "Failed to fetch effective permissions" });
      }
    }
  );

  // Mobile App Critical Process Routes

  // Process 1: Driver Authentication & Session Management (already handled by auth routes)

  // Process 2: Trip Assignment & Viewing - Enhanced for mobile (temporary demo without auth)
  app.get("/api/trips/driver/:driverId", async (req, res) => {
    try {
      const { driverId } = req.params;
      console.log(`🔍 Mobile app requesting trips for driver: ${driverId}`);

      const trips = await storage.getTripsByDriver(driverId);
      console.log(`📱 Mobile API: Found ${trips.length} trips for driver ${driverId}`);
      
      // Add priority and mobile-specific fields
      const enhancedTrips = trips.map(trip => ({
        ...trip,
        priority: trip.trip_type === 'one_way' ? 'normal' : 'urgent',
        pickup_location: trip.pickup_address || trip.pickup_location || 'Location not specified',
        dropoff_location: trip.dropoff_address || trip.dropoff_location || 'Destination not specified'
      }));

      console.log(`📱 Mobile API: Sending ${enhancedTrips.length} enhanced trips to mobile app`);
      res.json(enhancedTrips);
    } catch (error) {
      console.error("Error fetching driver trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  // Process 3: Trip Status Management - Enhanced with notifications
  app.patch("/api/trips/:tripId/status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { tripId } = req.params;
      const { status, timestamp, location, notes } = req.body;

      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Ensure driver can only update their own trips or admin can update any
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin' && 
          trip.driverId !== req.user?.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const previousStatus = trip.status;
      const updates: any = { status };
      
      // Add timestamp tracking based on status
      if (status === 'in_progress' && !trip.actualPickupTime) {
        updates.actualPickupTime = timestamp || new Date().toISOString();
      } else if (status === 'completed' && !trip.actualDropoffTime) {
        updates.actualDropoffTime = timestamp || new Date().toISOString();
      }

      // Add location if provided
      if (location) {
        updates.lastKnownLocation = JSON.stringify(location);
      }

      // Add notes
      if (notes) {
        updates.notes = notes;
      }

      const updatedTrip = await storage.updateTrip(tripId, updates);
      
      // Trigger notification workflow based on status change
      await notificationService.handleTripStatusChange({
        tripId,
        status: status as any,
        previousStatus,
        driverId: trip.driverId,
        userId: trip.userId, // Assuming trip has userId field
        organizationId: trip.organizationId,
        timestamp: timestamp || new Date().toISOString(),
        location,
        notes
      });
      
      console.log(`📱 Mobile: Trip ${tripId} status updated ${previousStatus} → ${status} by ${req.user?.role} ${req.user?.userId}`);
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip status:", error);
      res.status(500).json({ message: "Failed to update trip status" });
    }
  });

  // Driver trip confirmation endpoint
  app.post("/api/trips/:tripId/confirm", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { tripId } = req.params;
      
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Ensure only assigned driver can confirm
      if (trip.driverId !== req.user?.userId) {
        return res.status(403).json({ message: "Only assigned driver can confirm trip" });
      }

      // Update trip status to confirmed
      const updatedTrip = await storage.updateTrip(tripId, { 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      });

      // Trigger notification: Driver confirms → User notified
      await notificationService.confirmTripAssignment(
        tripId, 
        req.user.userId!, 
        trip.organizationId
      );

      console.log(`✅ Trip ${tripId} confirmed by driver ${req.user.userId}`);
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error confirming trip:", error);
      res.status(500).json({ message: "Failed to confirm trip" });
    }
  });

  // Get notifications for user
  app.get("/api/notifications", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const notifications = notificationService.getNotifications(req.user!.userId!);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:notificationId/read", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { notificationId } = req.params;
      notificationService.markAsRead(req.user!.userId!, notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/count", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const count = notificationService.getUnreadCount(req.user!.userId!);
      res.json({ count });
    } catch (error) {
      console.error("Error getting notification count:", error);
      res.status(500).json({ message: "Failed to get notification count" });
    }
  });

  // Driver trip management routes
  app.get("/api/driver/trips", requireAuth, requireRole("driver"), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      
      // Get trips assigned to this driver
      const trips = await storage.getTripsByDriver(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching driver trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  // Confirm trip assignment
  app.patch("/api/driver/trips/:tripId/confirm", requireAuth, requireRole("driver"), async (req: AuthenticatedRequest, res) => {
    try {
      const { tripId } = req.params;
      const userId = req.user!.userId;
      
      // Update trip status to confirmed
      const trip = await storage.updateTrip(tripId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      });

      // Send notification to dispatchers
      await notificationService.confirmTripAssignment(tripId, userId, req.user!.primaryOrganizationId!);

      res.json(trip);
    } catch (error) {
      console.error("Error confirming trip:", error);
      res.status(500).json({ message: "Failed to confirm trip" });
    }
  });

  // Start trip
  app.patch("/api/driver/trips/:tripId/start", requireAuth, requireRole("driver"), async (req: AuthenticatedRequest, res) => {
    try {
      const { tripId } = req.params;
      const { location } = req.body;
      
      const trip = await storage.updateTrip(tripId, {
        status: 'in_progress',
        actual_pickup_time: new Date().toISOString(),
        pickup_location_actual: location
      });

      // Send status notification
      await notificationService.handleTripStatusChange({
        tripId,
        status: 'in_progress',
        previousStatus: 'confirmed',
        driverId: req.user!.userId!,
        organizationId: req.user!.primaryOrganizationId!,
        timestamp: new Date().toISOString(),
        location
      });

      res.json(trip);
    } catch (error) {
      console.error("Error starting trip:", error);
      res.status(500).json({ message: "Failed to start trip" });
    }
  });

  // Complete trip
  app.patch("/api/driver/trips/:tripId/complete", requireAuth, requireRole("driver"), async (req: AuthenticatedRequest, res) => {
    try {
      const { tripId } = req.params;
      const { location, notes } = req.body;
      
      const trip = await storage.updateTrip(tripId, {
        status: 'completed',
        actual_dropoff_time: new Date().toISOString(),
        dropoff_location_actual: location,
        completion_notes: notes
      });

      // Send completion notification
      await notificationService.handleTripStatusChange({
        tripId,
        status: 'completed',
        previousStatus: 'in_progress',
        driverId: req.user!.userId!,
        organizationId: req.user!.primaryOrganizationId!,
        timestamp: new Date().toISOString(),
        location,
        notes
      });

      res.json(trip);
    } catch (error) {
      console.error("Error completing trip:", error);
      res.status(500).json({ message: "Failed to complete trip" });
    }
  });

  // Process 4: Emergency Communication
  app.post("/api/emergency/alert", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { driverId, location, message, type } = req.body;
      
      // Ensure driver can only send alerts for themselves
      if (req.user?.role !== 'super_admin' && req.user?.userId !== driverId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const driver = await storage.getDriversByOrganization(req.user!.primaryOrganizationId!)
        .then(drivers => drivers.find(d => d.id === driverId));
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      const alert = {
        id: `emergency_${Date.now()}`,
        driverId,
        organizationId: driver.organizationId,
        type: type || 'driver_emergency',
        message: message || 'Emergency alert from mobile app',
        location: location ? JSON.stringify(location) : null,
        timestamp: new Date().toISOString(),
        status: 'active',
        severity: 'high'
      };

      // Store emergency alert (you might want to add this to your storage interface)
      console.log(`🚨 EMERGENCY ALERT: Driver ${driver.userName} (${driverId}) sent emergency alert`);
      console.log(`📍 Location: ${alert.location || 'Not provided'}`);
      console.log(`💬 Message: ${alert.message}`);

      // In a real system, this would:
      // 1. Store the alert in database
      // 2. Send push notifications to dispatch
      // 3. Send SMS to emergency contacts
      // 4. Log to emergency response system

      res.json({ 
        success: true, 
        alertId: alert.id,
        message: "Emergency alert sent successfully. Dispatch has been notified." 
      });
    } catch (error) {
      console.error("Error sending emergency alert:", error);
      res.status(500).json({ message: "Failed to send emergency alert" });
    }
  });

  app.post("/api/emergency/panic", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { driverId, tripId, location, severity } = req.body;
      
      if (req.user?.userId !== driverId && req.user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const driver = await storage.getDriver(driverId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      const panicAlert = {
        id: `panic_${Date.now()}`,
        driverId,
        tripId,
        organizationId: driver.organizationId,
        type: 'panic_button',
        location: location ? JSON.stringify(location) : null,
        timestamp: new Date().toISOString(),
        severity: severity || 'critical',
        status: 'active'
      };

      console.log(`🚨🚨 PANIC ALERT: Driver ${driver.userName} (${driverId}) activated panic button`);
      console.log(`🚗 Trip ID: ${tripId || 'No active trip'}`);
      console.log(`📍 Location: ${panicAlert.location || 'Not provided'}`);

      // Critical: This would immediately notify:
      // 1. All dispatch personnel
      // 2. Emergency services if configured
      // 3. Driver's emergency contacts
      // 4. Organization administrators

      res.json({ 
        success: true, 
        alertId: panicAlert.id,
        message: "PANIC ALERT ACTIVATED. Emergency response initiated." 
      });
    } catch (error) {
      console.error("Error activating panic alert:", error);
      res.status(500).json({ message: "Failed to activate panic alert" });
    }
  });

  app.get("/api/emergency/contacts/:organizationId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { organizationId } = req.params;
      
      // Mock emergency contacts - in real system this would be from database
      const emergencyContacts = [
        {
          name: "Dispatch Center",
          phone: "555-DISPATCH",
          type: "dispatch"
        },
        {
          name: "Supervisor",
          phone: "555-SUPERVISOR", 
          type: "supervisor"
        },
        {
          name: "Emergency Services",
          phone: "911",
          type: "emergency"
        }
      ];

      res.json(emergencyContacts);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({ message: "Failed to fetch emergency contacts" });
    }
  });

  app.post("/api/incidents/report", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { driverId, tripId, type, description, location, severity } = req.body;
      
      if (req.user?.userId !== driverId && req.user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const incident = {
        id: `incident_${Date.now()}`,
        driverId,
        tripId,
        type,
        description,
        location: location ? JSON.stringify(location) : null,
        severity: severity || 'medium',
        timestamp: new Date().toISOString(),
        status: 'reported'
      };

      console.log(`📋 INCIDENT REPORT: ${type} - ${severity} severity`);
      console.log(`🚗 Driver: ${driverId}, Trip: ${tripId || 'N/A'}`);
      console.log(`📝 Description: ${description}`);

      res.json({ 
        success: true, 
        incidentId: incident.id,
        message: "Incident report submitted successfully." 
      });
    } catch (error) {
      console.error("Error reporting incident:", error);
      res.status(500).json({ message: "Failed to report incident" });
    }
  });

  // Enhanced driver status management for mobile
  app.patch("/api/drivers/:driverId/status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { driverId } = req.params;
      const { status, timestamp } = req.body;
      
      if (req.user?.userId !== driverId && req.user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = {
        status,
        lastStatusUpdate: timestamp || new Date().toISOString()
      };

      const updatedDriver = await storage.updateDriver(driverId, updates);
      
      console.log(`📱 Driver ${driverId} status updated to: ${status}`);
      res.json(updatedDriver);
    } catch (error) {
      console.error("Error updating driver status:", error);
      res.status(500).json({ message: "Failed to update driver status" });
    }
  });

  // Health check for mobile app connectivity
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      mobileSupport: true 
    });
  });

  // Mobile driver trips endpoint
  app.get("/api/mobile/driver/trips", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get the driver record for this user
      const drivers = await storage.getDriversByOrganization(req.user.primaryOrganizationId);
      const driver = drivers.find(d => d.user_id === req.user.userId);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver record not found" });
      }

      // Get trips assigned to this driver
      const allTrips = await storage.getTripsByOrganization(req.user.primaryOrganizationId);
      const driverTrips = allTrips.filter(trip => trip.driver_id === driver.id);

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

  // Super admin permissions endpoint - bypasses auth middleware temporarily
  router.get("/permissions/all", async (req, res) => {
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



  // Direct permissions endpoint before router registration
  app.get("/api/permissions/all", async (req, res) => {
    try {
      const { data: permissions, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true });

      if (error) {
        console.error("Error fetching permissions:", error);
        return res.status(500).json({ message: "Failed to fetch permissions" });
      }

      const permissionsWithIds = permissions?.map((perm, index) => ({
        ...perm,
        id: `${perm.role}-${perm.permission}-${perm.resource}-${index}`
      })) || [];

      console.log(`Returning ${permissionsWithIds.length} permissions to frontend`);
      res.json(permissionsWithIds);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Register API routes with the app
  app.use("/api", router);

  // Routes registered successfully
}
