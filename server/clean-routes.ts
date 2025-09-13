import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";

// Simple in-memory storage for fresh start
const organizations = [
  { id: "monarch_competency", name: "Monarch Competency Services", slug: "monarch_competency" }
];

const users = [
  {
    userId: "admin-1",
    userName: "Admin User",
    email: "admin@monarch.com",
    passwordHash: "$2b$10$EIXw8Z2rZ5Y5Y5Y5Y5Y5YOr5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y",
    role: "super_admin" as const,
    primaryOrganizationId: "monarch_competency"
  }
];

const serviceAreas = [
  { id: "sa-1", organizationId: "monarch_competency", nickname: "Downtown", address: "123 Main St" }
];

const clients: any[] = [];
const drivers: any[] = [];
const trips: any[] = [];

export async function registerRoutes(app: Express): Promise<Server> {

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // For demo, accept any password
    req.session.userId = user.userId;
    req.session.user = user;

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = users.find(u => u.userId === req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ message: "Logout successful" });
  });

  // Organization routes
  app.get("/api/organizations", async (req, res) => {
    res.json(organizations);
  });

  // Service area routes
  app.get("/api/service-areas/organization/:organizationId", async (req, res) => {
    const filtered = serviceAreas.filter(sa => sa.organizationId === req.params.organizationId);
    res.json(filtered);
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    const { organizationId } = req.query;
    const filtered = clients.filter(c => c.organizationId === organizationId);
    res.json(filtered);
  });

  // Driver routes
  app.get("/api/drivers", async (req, res) => {
    const { organizationId } = req.query;
    const filtered = drivers.filter(d => d.primaryOrganizationId === organizationId);
    res.json(filtered);
  });

  // Trip routes
  app.get("/api/trips", async (req, res) => {
    const { organizationId } = req.query;
    const filtered = trips.filter(t => t.organizationId === organizationId);
    res.json(filtered);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats/:organizationId", async (req, res) => {
    res.json({
      todaysTrips: 0,
      completedTrips: 0,
      activeDrivers: 0,
      totalClients: clients.length
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}