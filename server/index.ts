import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import apiRoutes from "./api-routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeVehicles } from "./initialize-vehicles";
import { seedTrips, seedAllOrganizationTrips } from "./seed-trips";
import { validateResponseFormat } from "./validation-middleware";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcrypt";

// Environment validation - no logging of sensitive data
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const app = express();

// Dynamic CORS configuration for Replit deployments
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.get('host');
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Auto-detect Replit domain and allow it
  const allowedOrigins = isProduction 
    ? [
        `https://${host}`, // Current domain
        process.env.REPLIT_DOMAIN,
        ...(host ? [`https://${host}`] : [])
      ].filter(Boolean)
    : ['http://localhost:5000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin && !isProduction) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5000');
  } else if (!origin && isProduction && host) {
    res.header('Access-Control-Allow-Origin', `https://${host}`);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Secure request parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Add snake_case validation middleware in development
// Temporarily disabled to fix authentication issues
// if (process.env.NODE_ENV === 'development') {
//   app.use(validateResponseFormat);
// }

// Create memory store for sessions
const MemoryStoreSession = MemoryStore(session);

// Secure session configuration
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  console.error("SESSION_SECRET environment variable is required");
  process.exit(1);
}

app.use(session({
  secret: sessionSecret,
  resave: false, // Only save when session data changes
  saveUninitialized: false, // Don't create empty sessions
  store: new MemoryStoreSession({
    checkPeriod: 86400000,
    ttl: 4 * 60 * 60 * 1000 // 4 hours TTL to match cookie
  }),
  cookie: { 
    secure: false, // HTTP for development
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
    httpOnly: false, // Allow JavaScript access for session debugging
    sameSite: 'lax' as const,
    path: '/',
    domain: undefined // Let Express handle domain automatically
  },
  name: 'connect.sid',
  rolling: true // Reset maxAge on every request
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize vehicle tables and data first
  try {
    await initializeVehicles();
    
    // Seed trip data after vehicles are initialized
    // Disabled demo trip seeding for production environment
    // await seedTrips();
    // await seedAllOrganizationTrips();
  } catch (error) {
    console.log('Vehicle/trip initialization skipped or failed:', error);
  }

  // Direct permissions endpoint (bypasses auth middleware)
  app.get("/api/permissions/all", async (req, res) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

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

  // Direct user creation endpoint before router registration
  app.post("/api/users", async (req, res) => {
    try {
      // Check authentication
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user and check role
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (currentUser?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      console.log("Creating user with data:", req.body);
      
      // Generate readable user ID
      const nameSlug = req.body.userName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      
      // For executive roles, use company prefix instead of specific organization
      let userIdSuffix;
      if (req.body.role && req.body.role.endsWith('_owner')) {
        const companyPrefix = req.body.role.replace('_owner', '');
        userIdSuffix = `${companyPrefix}_executive_001`;
      } else {
        const orgSlug = req.body.organizationId.replace('_', '_');
        userIdSuffix = `${orgSlug}_001`;
      }
      
      const newUserId = `user_${nameSlug}_${userIdSuffix}`;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(req.body.password, 12);
      
      const userData = {
        user_id: newUserId,
        user_name: req.body.userName || req.body.email,
        email: req.body.email,
        password_hash: hashedPassword,
        role: req.body.role,
        primary_organization_id: req.body.organizationId || req.body.primaryOrganizationId,
        authorized_organizations: req.body.authorizedOrganizations || [req.body.organizationId || req.body.primaryOrganizationId],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newUser, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error("User creation error:", error);
        return res.status(400).json({ message: "Failed to create user", error: error.message });
      }

      console.log("User created successfully:", newUser.email);
      
      // If the role is 'driver', automatically create a driver profile
      if (req.body.role === 'driver') {
        try {
          const driverData = {
            user_id: newUser.user_id,
            primary_organization_id: newUser.primary_organization_id,
            authorized_organizations: newUser.authorized_organizations,
            license_number: 'TBD-' + Date.now().toString().slice(-6), // Temporary license number
            license_expiry: null,
            vehicle_info: 'Vehicle TBD',
            phone: null,
            emergency_contact: null,
            emergency_phone: null,
            is_available: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: newDriver, error: driverError } = await supabase
            .from('drivers')
            .insert(driverData)
            .select()
            .single();
            
          if (driverError) {
            console.error("Driver profile creation error:", driverError);
            // Don't fail the user creation, just log the error
          } else {
            console.log("Driver profile created successfully for:", newUser.email);
          }
        } catch (driverCreationError) {
          console.error("Error creating driver profile:", driverCreationError);
          // Don't fail the user creation, just log the error
        }
      }
      
      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user", error: error.message });
    }
  });

  // Serve static uploaded files
  app.use('/uploads', express.static('public/uploads', {
    setHeaders: (res, path) => {
      // Set proper content types for images
      if (path.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      }
      // Enable caching for uploaded files
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }));

  // Register all API routes FIRST, before any catch-all handlers
  app.use('/api', apiRoutes);

  // Add 404 handler for unmatched API routes AFTER route registration
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Create HTTP server after routes are registered
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup frontend serving only for non-API routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();