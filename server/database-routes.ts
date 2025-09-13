import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./supabase";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {

  // Database initialization disabled - using Supabase directly
  console.log("Using Supabase database - initialization skipped");

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      const user = users[0];
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.userId;
      req.session.user = user;

      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    // Check session first
    let userId = req.session?.userId;
    
    // If no session, check Authorization header
    if (!userId) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        userId = authHeader.substring(7); // Extract token after "Bearer "
      }
    }
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.user_id, userId)).limit(1);
      const user = users[0];
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { password_hash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Authentication error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ message: "Logout successful" });
  });

  // Organization routes
  app.get("/api/organizations", async (req, res) => {
    try {
      const organizations = await db.select().from(schema.organizations);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Service area routes
  app.get("/api/service-areas/organization/:organizationId", async (req, res) => {
    try {
      const serviceAreas = await db.select().from(schema.serviceAreas)
        .where(eq(schema.serviceAreas.organizationId, req.params.organizationId));
      res.json(serviceAreas);
    } catch (error) {
      console.error("Error fetching service areas:", error);
      res.status(500).json({ message: "Failed to fetch service areas" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const { organizationId } = req.query;
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      const clients = await db.select().from(schema.clients)
        .where(eq(schema.clients.organizationId, organizationId as string));
      
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Driver routes  
  app.get("/api/drivers", async (req, res) => {
    try {
      const { organizationId } = req.query;
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      const drivers = await db.select().from(schema.drivers)
        .where(eq(schema.drivers.primaryOrganizationId, organizationId as string));
      
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  // Trip routes
  app.get("/api/trips", async (req, res) => {
    try {
      const { organizationId } = req.query;
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }

      const trips = await db.select().from(schema.trips)
        .where(eq(schema.trips.organizationId, organizationId as string));
      
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats/:organizationId", async (req, res) => {
    try {
      const organizationId = req.params.organizationId;
      
      const [trips, clients, drivers] = await Promise.all([
        db.select().from(schema.trips).where(eq(schema.trips.organizationId, organizationId)),
        db.select().from(schema.clients).where(eq(schema.clients.organizationId, organizationId)),
        db.select().from(schema.drivers).where(eq(schema.drivers.primaryOrganizationId, organizationId))
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

      res.json({
        todaysTrips: todaysTrips.length,
        completedTrips: completedTrips.length,
        activeDrivers: drivers.length,
        totalClients: clients.length
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}