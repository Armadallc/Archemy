import express from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { 
  hasPermission, 
  canAccessOrganization, 
  getSessionTimeout,
  type Permission 
} from "./permissions";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    user?: User;
    currentOrganizationId?: string;
  }
}

export interface AuthenticatedRequest extends express.Request {
  user?: User;
  currentOrganizationId?: string;
}

// Authentication middleware
export async function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  console.log("🔍 Auth check:", { 
    sessionId: req.sessionID, 
    userId: req.session?.userId,
    hasSession: !!req.session 
  });

  if (!req.session?.userId) {
    console.log("❌ No session or userId");
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      console.log("❌ User not found in database");
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ User authenticated:", user.userId);
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
}

// Organization access control middleware
export function requireOrganizationAccess(organizationId: string) {
  return async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user;

    // Super admin has access to everything
    if (user.role === 'super_admin') {
      return next();
    }

    // Monarch owner has access to all Monarch organizations
    if (user.role === 'monarch_owner') {
      return next();
    }

    // Check if user has access to this organization
    const hasAccess = 
      user.primaryOrganizationId === organizationId ||
      (user.authorizedOrganizations && user.authorizedOrganizations.includes(organizationId));

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied to this organization",
        userOrganizations: user.authorizedOrganizations || [user.primaryOrganizationId]
      });
    }

    next();
  };
}

// Extract organization ID from request and verify access
export function extractAndVerifyOrganization(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const organizationId = req.params.organizationId || req.body.organizationId;

  if (!organizationId) {
    return res.status(400).json({ message: "Organization ID required" });
  }

  return requireOrganizationAccess(organizationId)(req, res, next);
}

// Role-based authorization
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

// Permission-based authorization
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        requiredPermission: permission,
        userRole: req.user.role
      });
    }

    next();
  };
}

// Enhanced organization access validation with permission checking
export function requireOrganizationAccessNew(organizationIdParam: string = 'organizationId') {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const requestedOrgId = req.params[organizationIdParam] || req.body.organizationId || req.query.organizationId;
    
    if (!requestedOrgId) {
      return res.status(400).json({ message: "Organization ID required" });
    }

    const hasAccess = canAccessOrganization(
      req.user.role,
      req.user.primaryOrganizationId || '',
      req.user.authorizedOrganizations,
      requestedOrgId as string
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied to organization",
        organizationId: requestedOrgId
      });
    }

    req.currentOrganizationId = requestedOrgId as string;
    next();
  };
}

// Login handler
export async function login(req: express.Request, res: express.Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Store user ID in session
    req.session.userId = user.userId;
    req.session.user = user;

    console.log("Session created:", { 
      sessionId: req.sessionID, 
      userId: req.session.userId,
      userRole: user.role
    });

    // Set role-specific session timeouts
    req.session.cookie.maxAge = getSessionTimeout(user.role);
    
    // Set current organization context
    req.session.currentOrganizationId = user.primaryOrganizationId;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Session save failed" });
      }

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        message: "Login successful"
      });
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
}

// Demo login endpoint for testing
export async function demoLogin(req: express.Request, res: express.Response) {
  try {
    // Create or find demo admin user
    let user = await storage.getUserByEmail("admin@monarch.com");
    
    if (!user) {
      const hashedPassword = await bcrypt.hash("demo123", 10);
      user = await storage.createUser({
        userId: "demo_admin_user",
        userName: "Demo Admin",
        email: "admin@monarch.com",
        role: "organization_admin",
        passwordHash: hashedPassword,
        primaryOrganizationId: "monarch_competency"
      });
    }

    req.session.userId = user.userId;
    req.session.user = user;

    console.log("✅ Demo user logged in:", user.userId);

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Session save failed" });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        message: "Demo login successful"
      });
    });
  } catch (error) {
    console.error("❌ Demo login error:", error);
    res.status(500).json({ message: "Demo login failed" });
  }
}

// Logout handler
export function logout(req: express.Request, res: express.Response) {
  console.log("🔄 Logging out user:", req.session?.userId);
  
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid', { path: '/' });
      console.log("✅ Logout successful");
      res.json({ message: "Logout successful" });
    });
  } else {
    res.clearCookie('connect.sid', { path: '/' });
    res.json({ message: "Logout successful" });
  }
}

// Get current user
export async function getCurrentUser(req: express.Request, res: express.Response) {
  console.log("🔍 Auth check:", { 
    sessionId: req.sessionID, 
    userId: req.session?.userId,
    hasSession: !!req.session 
  });

  if (!req.session?.userId) {
    console.log("❌ No session or userId");
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      console.log("❌ User not found in database");
      // Clear session properly
      req.session.userId = undefined;
      req.session.user = undefined;
      req.session.save((err) => {
        if (err) console.error("Session save error:", err);
      });
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ User found:", user.email);
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
}

// Filter data based on user's organization access
export function filterByUserOrganizations(user: User, organizationId?: string): string[] {
  // Super admin can access all organizations
  if (user.role === 'super_admin') {
    return []; // Empty array means no filtering
  }

  // Monarch owner can access all Monarch organizations  
  if (user.role === 'monarch_owner') {
    return ['monarch_competency', 'monarch_mental_health', 'monarch_sober_living', 'monarch_launch'];
  }

  // For specific organization request, verify access
  if (organizationId) {
    const hasAccess = 
      user.primaryOrganizationId === organizationId ||
      (user.authorizedOrganizations && user.authorizedOrganizations.includes(organizationId));

    if (!hasAccess) {
      throw new Error(`Access denied to organization: ${organizationId}`);
    }

    return [organizationId];
  }

  // Return user's accessible organizations
  const orgs = user.authorizedOrganizations || [];
  if (user.primaryOrganizationId && !orgs.includes(user.primaryOrganizationId)) {
    orgs.push(user.primaryOrganizationId);
  }

  return orgs;
}