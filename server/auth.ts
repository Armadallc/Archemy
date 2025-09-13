import express from "express";
import bcrypt from "bcrypt";
import { storage } from "./minimal-supabase";
import { supabase } from "./minimal-supabase";
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
    user?: DatabaseUser;
    userRole?: string;
    userEmail?: string;
    currentOrganizationId?: string | null;
    organizationId?: string | null;
  }
}

// DATABASE USES SNAKE_CASE - DO NOT CONVERT TO CAMELCASE
interface DatabaseUser {
  user_id: string;
  user_name: string;
  email: string;
  password_hash: string;
  role: string;
  primary_organization_id: string | null;
  authorized_organizations: string[] | null;
  is_active: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface AuthenticatedRequest extends express.Request {
  user?: DatabaseUser;
  currentOrganizationId?: string;
}

// Validation function to catch snake_case/camelCase errors
function validateSessionMapping(user: any) {
  if (!user.user_id) {
    throw new Error("CRITICAL: user.user_id is undefined - check database query");
  }
  if (user.userId !== undefined) {
    throw new Error("CRITICAL: Found camelCase userId - database uses snake_case user_id");
  }
}

// Session mapping function with explicit snake_case awareness
function storeUserSession(req: express.Request, dbUser: DatabaseUser) {
  // DATABASE USES SNAKE_CASE - DO NOT CONVERT TO CAMELCASE
  req.session.userId = dbUser.user_id;
  req.session.currentOrganizationId = dbUser.primary_organization_id || undefined;
}

// Secure authentication middleware
export async function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  // Remove sensitive logging in production
  if (process.env.NODE_ENV !== 'production') {
    console.log("Auth check:", { 
      sessionId: req.sessionID, 
      userId: req.session?.userId,
      cookies: req.headers.cookie,
      sessionExists: !!req.session,
      sessionData: req.session
    });
  }

  // Check session first - this is the primary authentication method
  let userId = req.session?.userId;
  
  // Bearer tokens for development persistence - allow valid user IDs
  if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.substring(7);
    
    // Check if token is a valid user ID by attempting to look up the user
    try {
      const user = await storage.getUser(token);
      if (user && user.is_active) {
        userId = token;
        console.log("🔑 Using valid user token:", user.email);
      } else {
        console.log("❌ Invalid or inactive user token:", token);
      }
    } catch (error) {
      console.log("❌ Token validation failed:", token);
    }
  }

  if (!userId) {
    console.log("❌ No userId found in session or auth header");
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await storage.getUser(userId!);
    if (!user) {
      console.log("❌ User not found in database");
      if (req.session) req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ User authenticated:", user.user_id);
    req.user = user;
    req.currentOrganizationId = req.session?.currentOrganizationId || user.primary_organization_id || undefined;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
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

// Organization access validation
export function requireOrganizationAccess(organizationIdParam: string = 'organizationId') {
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
      req.user.primary_organization_id || '',
      req.user.authorized_organizations,
      requestedOrgId as string
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied to organization",
        organization_id: requestedOrgId
      });
    }

    req.currentOrganizationId = requestedOrgId as string;
    next();
  };
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

// Login handler
export async function login(req: express.Request, res: express.Response) {
  const { email, password } = req.body;

  console.log("🔐 Login attempt for:", email, "with password length:", password?.length);

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    // Create demo accounts if they don't exist
    if (email === "sarah@monarch.com") {
      let existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        console.log("🔄 Creating monarch_owner user for:", email);
        try {
          const hashedPassword = await bcrypt.hash("password123", 10);
          await storage.createUser({
            user_id: "sarah_monarch_owner",
            user_name: "Sarah Johnson",
            email: "sarah@monarch.com",
            role: "monarch_owner",
            password_hash: hashedPassword,
            primary_organization_id: "monarch_competency",
            authorized_organizations: ["monarch_competency", "monarch_mental_health", "monarch_sober_living", "monarch_launch"],
            is_active: true
          });
          console.log("✅ Created monarch_owner user:", email);
        } catch (error) {
          console.error("❌ Failed to create monarch_owner user:", error);
          return res.status(500).json({ message: "Account creation failed" });
        }
      }
    }

    // Create organization user accounts for trip management
    const orgUserAccounts = [
      {
        email: "melissa@monarch.com",
        userId: "melissa_org_user",
        userName: "Melissa Chen",
        organization: "monarch_competency",
        password: "trips123"
      },
      {
        email: "david@monarch.com", 
        userId: "david_org_user",
        userName: "David Rodriguez",
        organization: "monarch_mental_health",
        password: "schedule123"
      },
      {
        email: "lisa@monarch.com",
        userId: "lisa_org_user", 
        userName: "Lisa Thompson",
        organization: "monarch_sober_living",
        password: "transport123"
      },
      {
        email: "mike@monarch.com",
        userId: "mike_org_user",
        userName: "Mike Johnson", 
        organization: "monarch_launch",
        password: "booking123"
      }
    ];

    // Create driver accounts
    const driverAccounts = [
      {
        email: "alex@monarch.com",
        userId: "alex_driver_user",
        userName: "Alex Thompson",
        organization: "monarch_competency",
        password: "drive123"
      },
      {
        email: "maria@monarch.com",
        userId: "maria_driver_user", 
        userName: "Maria Garcia",
        organization: "monarch_mental_health",
        password: "driver123"
      },
      {
        email: "james@monarch.com",
        userId: "james_driver_user",
        userName: "James Wilson",
        organization: "monarch_sober_living", 
        password: "transport123"
      },
      {
        email: "jessica@monarch.com",
        userId: "jessica_driver_user",
        userName: "Jessica Davis",
        organization: "monarch_launch",
        password: "mobile123"
      },
      {
        email: "ryan@monarch.com",
        userId: "ryan_driver_user",
        userName: "Ryan Mitchell",
        organization: "monarch_competency",
        password: "webapp123"
      }
    ];

    const matchingAccount = orgUserAccounts.find(account => account.email === email);
    if (matchingAccount) {
      let existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        console.log(`🔄 Creating organization_user account for: ${email}`);
        try {
          const hashedPassword = await bcrypt.hash(matchingAccount.password, 10);
          await storage.createUser({
            user_id: matchingAccount.userId,
            user_name: matchingAccount.userName,
            email: matchingAccount.email,
            role: "organization_user",
            password_hash: hashedPassword,
            primary_organization_id: matchingAccount.organization,
            authorized_organizations: [matchingAccount.organization],
            is_active: true
          });
          console.log(`✅ Created organization_user: ${email}`);
        } catch (error) {
          console.error(`❌ Failed to create organization_user ${email}:`, error);
          return res.status(500).json({ message: "Account creation failed" });
        }
      }
    }

    const matchingDriver = driverAccounts.find(account => account.email === email);
    if (matchingDriver) {
      let existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        console.log(`🔄 Creating driver account for: ${email}`);
        try {
          const hashedPassword = await bcrypt.hash(matchingDriver.password, 10);
          await storage.createUser({
            user_id: matchingDriver.userId,
            user_name: matchingDriver.userName,
            email: matchingDriver.email,
            role: "driver",
            password_hash: hashedPassword,
            primary_organization_id: matchingDriver.organization,
            authorized_organizations: [matchingDriver.organization],
            is_active: true
          });
          console.log(`✅ Created driver: ${email}`);
        } catch (error) {
          console.error(`❌ Failed to create driver ${email}:`, error);
          return res.status(500).json({ message: "Account creation failed" });
        }
      }
    }
    
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ User found:", user.email, "Hash:", user.password_hash.substring(0, 20) + "...");
    
    // Special handling for demo accounts - allow alternative passwords
    let isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid && email === "sarah@monarch.com" && password === "password") {
      isValid = true; // Allow "password" as alternative for Sarah
    }
    
    // Allow alternative passwords for organization users and drivers
    const altPasswords: Record<string, string[]> = {
      "melissa@monarch.com": ["trips123"],
      "david@monarch.com": ["schedule123"], 
      "lisa@monarch.com": ["transport123"],
      "mike@monarch.com": ["booking123"],
      "alex@monarch.com": ["drive123", "driver123"],
      "alex@littlemonarch.com": ["drive123", "driver123"],
      "maria@monarch.com": ["driver123"],
      "james@monarch.com": ["transport123"],
      "jessica@monarch.com": ["mobile123"],
      "ryan@monarch.com": ["webapp123"]
    };
    
    if (!isValid && email in altPasswords && altPasswords[email].includes(password)) {
      isValid = true;
    }
    
    console.log("🔑 Password valid:", isValid);
    
    if (!isValid) {
      console.log("❌ Password comparison failed for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update admin user to super_admin role if needed
    if (email === "admin@monarch.com" && user.role !== "super_admin") {
      console.log("🔄 Updating admin user to super_admin role");
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ 
            role: 'super_admin',
            authorized_organizations: ['monarch_competency', 'monarch_mental_health', 'monarch_sober_living', 'monarch_launch']
          })
          .eq('user_id', user.user_id)
          .select();
        
        if (error) {
          console.error("❌ Database update error:", error);
        } else {
          // Update the user object for this session
          user.role = 'super_admin';
          user.authorized_organizations = ['monarch_competency', 'monarch_mental_health', 'monarch_sober_living', 'monarch_launch'];
          console.log("✅ Updated admin user to super_admin:", data);
        }
      } catch (error) {
        console.error("❌ Failed to update admin role:", error);
      }
    }

    // DATABASE USES SNAKE_CASE - DO NOT CONVERT TO CAMELCASE
    validateSessionMapping(user);
    
    // Store session data simply and directly
    req.session.userId = user.user_id;
    req.session.user = user;
    req.session.currentOrganizationId = user.primary_organization_id || undefined;

    console.log("Session created:", { 
      sessionId: req.sessionID, 
      userId: req.session.userId,
      userRole: user.role,
      userIdFromDb: user.user_id
    });

    // Set role-specific session timeout
    req.session.cookie.maxAge = getSessionTimeout(user.role);

    // Force session save to ensure persistence
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("Session save error:", saveErr);
      }

      console.log("🍪 Session saved, ID:", req.sessionID);
      console.log("🍪 Session data stored:", { 
        userId: req.session.userId, 
        role: user.role,
        sessionExists: !!req.session
      });

      // Return user without password hash, include userId as token for authorization header fallback
      const { password_hash, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token: user.user_id, // Provide token for client-side storage
        sessionId: req.sessionID,
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
    const { userType } = req.body;
    
    let user;
    
    if (userType === 'booking_kiosk') {
      // Create or find demo booking kiosk user with cross-org access
      user = await storage.getUserByEmail("booking@monarch.com");
      
      if (!user) {
        const hashedPassword = await bcrypt.hash("demo123", 10);
        user = await storage.createUser({
          user_id: "booking_kiosk_user",
          user_name: "Booking Kiosk",
          email: "booking@monarch.com",
          role: "organization_user",
          password_hash: hashedPassword,
          primary_organization_id: "monarch_competency",
          authorized_organizations: ["monarch_competency", "monarch_mental_health", "monarch_sober_living", "monarch_launch"],
          is_active: true
        });
      }
    } else {
      // Create or find demo admin user
      user = await storage.getUserByEmail("admin@monarch.com");
      
      if (!user) {
        const hashedPassword = await bcrypt.hash("demo123", 10);
        user = await storage.createUser({
          user_id: "demo_admin_user",
          user_name: "Demo Admin",
          email: "admin@monarch.com",
          role: "super_admin",
          password_hash: hashedPassword,
          primary_organization_id: "monarch_competency",
          authorized_organizations: ["monarch_competency", "monarch_mental_health", "monarch_sober_living", "monarch_launch"],
          is_active: true
        });
      }
    }

    // DATABASE USES SNAKE_CASE - DO NOT CONVERT TO CAMELCASE
    validateSessionMapping(user);
    
    req.session.userId = user.user_id;
    req.session.user = user;
    req.session.currentOrganizationId = user.primary_organization_id || undefined;

    console.log("✅ Demo user logged in:", user.user_id);

    // Set role-specific session timeouts
    req.session.cookie.maxAge = getSessionTimeout(user.role);

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
  
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    
    res.clearCookie('connect.sid');
    res.json({ message: "Logged out successfully" });
  });
}

// Organization registration
export async function register(req: express.Request, res: express.Response) {
  const { 
    organizationName, 
    organizationAddress, 
    organizationPhone, 
    organizationEmail,
    adminName, 
    adminEmail, 
    adminPhone,
    password 
  } = req.body;

  if (!organizationName || !organizationAddress || !organizationEmail || !adminName || !adminEmail || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    // Check if admin email already exists
    const existingUser = await storage.getUserByEmail(adminEmail);
    if (existingUser) {
      return res.status(409).json({ message: "Email address already in use" });
    }

    // Generate organization ID
    const organizationId = organizationName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50) + '_' + Date.now();

    // Create organization using the correct storage method
    const organization = await storage.createOrganization({
      id: organizationId,
      name: organizationName,
      address: organizationAddress,
      phone: organizationPhone || undefined,
      email: organizationEmail,
      is_active: true
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    const adminUserId = `admin_${organizationId}_${Date.now()}`;
    
    const adminUser = await storage.createUser({
      userId: adminUserId,
      userName: adminName,
      email: adminEmail,
      role: "organization_admin",
      passwordHash: hashedPassword,
      primaryOrganizationId: organizationId,
      authorizedOrganizations: [organizationId],
      isActive: true
    });

    console.log("✅ Organization registered:", organizationId, "Admin:", adminUserId);

    // Return success without sensitive data
    res.status(201).json({
      message: "Organization registered successfully",
      organization: {
        id: organization.id,
        name: organization.name
      },
      adminUser: {
        id: adminUser.userId,
        name: adminUser.userName,
        email: adminUser.email
      }
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
}

// Get current user
export async function getCurrentUser(req: express.Request, res: express.Response) {
  // Check session first - this is the primary authentication method
  let userId = req.session?.userId;
  
  // Only allow specific pre-approved Bearer tokens for development
  if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.substring(7);
    const allowedTokens = ['super_admin_monarch_001']; // Only super admin
    if (allowedTokens.includes(token)) {
      userId = token;
      console.log("🔑 Using authorized development token");
    } else {
      console.log("❌ Unauthorized Bearer token attempted:", token);
    }
  }

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user) {
      if (req.session) req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Failed to get user info" });
  }
}

// Helper function to filter organizations by user access
export function filterByUserOrganizations(user: User, organizationId?: string): string[] {
  if (user.role === 'super_admin' || user.role === 'monarch_owner') {
    return []; // Return empty array to indicate access to all
  }
  
  const authorizedOrgs = user.authorized_organizations || [];
  const primaryOrg = user.primary_organization_id;
  
  const accessibleOrgs = primaryOrg ? [primaryOrg, ...authorizedOrgs] : authorizedOrgs;
  
  return organizationId ? 
    accessibleOrgs.filter((orgId: string) => orgId === organizationId) : 
    [...new Set(accessibleOrgs)]; // Remove duplicates
}