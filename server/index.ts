import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import apiRoutes from "./routes";
import fileStorageRoutes from "./file-storage-routes";
// Vite imports removed - using static file serving
import session from "express-session";
import bcrypt from "bcrypt";
import { usersStorage, programsStorage, corporateClientsStorage } from "./minimal-supabase";
import { RealtimeWebSocketServer } from "./websocket";
import { setWebSocketServer, getWebSocketServer } from "./websocket-instance";
import { requireSupabaseAuth, SupabaseAuthenticatedRequest } from "./supabase-auth";

// Environment validation - no logging of sensitive data
console.log('🔍 Server environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

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
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5177', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:19006', 'http://192.168.12.215:8082', 'exp://192.168.12.215:8082'];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin && !isProduction) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5174');
  } else if (!origin && isProduction && host) {
    res.header('Access-Control-Allow-Origin', `https://${host}`);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
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

// Create memory store for sessions
// Using default memory store

// Secure session configuration
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  console.error("SESSION_SECRET environment variable is required");
  process.exit(1);
}

app.use(session({
  secret: sessionSecret,
  resave: false, // Don't save session if not modified
  saveUninitialized: false, // Don't create empty sessions
  cookie: { 
    secure: false, // HTTP for development
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
    httpOnly: false, // Allow JavaScript access for session debugging
    sameSite: 'lax' as const,
    path: '/',
    domain: undefined // Let Express handle domain automatically
  },
  name: 'connect.sid',
  rolling: false // Don't reset maxAge on every request
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

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  // Vehicle initialization handled by database schema

  // Health check endpoint (bypasses auth middleware)
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // WebSocket test endpoint
  app.get("/api/ws-test", (req, res) => {
    const wsServer = getWebSocketServer();
    if (wsServer) {
      res.json({ 
        status: "WebSocket server is running",
        connectedClients: wsServer.getConnectedClients().length
      });
    } else {
      res.json({ 
        status: "WebSocket server not initialized",
        connectedClients: 0
      });
    }
  });

  // Direct permissions endpoint (bypasses auth middleware)
  app.get("/api/permissions/all", async (req, res) => {
    try {
      // Return hardcoded permissions since role_permissions table doesn't exist
      const permissions = [
        { role: 'super_admin', permission: 'VIEW_TRIPS', resource: '*', corporate_client_id: null, program_id: null },
        { role: 'corporate_admin', permission: 'VIEW_TRIPS', resource: 'corporate', corporate_client_id: null, program_id: null },
        { role: 'program_admin', permission: 'VIEW_TRIPS', resource: 'program', corporate_client_id: null, program_id: null },
        { role: 'program_user', permission: 'VIEW_TRIPS', resource: 'program', corporate_client_id: null, program_id: null },
        { role: 'driver', permission: 'VIEW_TRIPS', resource: 'assigned', corporate_client_id: null, program_id: null }
      ];

      const permissionsWithIds = permissions.map((perm, index) => ({
        ...perm,
        id: `${perm.role}-${perm.permission}-${perm.resource}-${index}`
      }));

      console.log(`Returning ${permissionsWithIds.length} permissions to frontend`);
      res.json(permissionsWithIds);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Direct user creation endpoint before router registration
  app.post("/api/users", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
    try {
      // Check authentication
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user and check role
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      console.log("Creating user with data:", req.body);
      
      // Generate readable user ID
      const nameSlug = req.body.userName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      
      // For executive roles, use company prefix instead of specific program
      let userIdSuffix;
      if (req.body.role && req.body.role.endsWith('_owner')) {
        const companyPrefix = req.body.role.replace('_owner', '');
        userIdSuffix = `${companyPrefix}_executive_001`;
      } else {
        const programSlug = req.body.programId?.replace('_', '_') || 'default';
        userIdSuffix = `${programSlug}_001`;
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
        primary_program_id: req.body.programId || req.body.primaryProgramId,
        authorized_programs: req.body.authorizedPrograms || [req.body.programId || req.body.primaryProgramId],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const newUser = await usersStorage.createUser(userData);

      console.log("User created successfully:", newUser.email);
      
      // If the role is 'driver', automatically create a driver profile
      if (req.body.role === 'driver') {
        try {
          const driverData = {
            id: `driver_${newUser.user_id}_${Date.now()}`,
            user_id: newUser.user_id,
            license_number: 'TBD-' + Date.now().toString().slice(-6), // Temporary license number
            vehicle_info: 'Vehicle TBD',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to create user", error: errorMessage });
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

  // Debug endpoint to test authentication
  app.get('/api/debug', (req, res) => {
    console.log('🔍 Debug endpoint called');
    console.log('Headers:', req.headers);
    console.log('Auth header:', req.headers.authorization);
    res.json({ 
      message: 'Debug endpoint working',
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization
    });
  });

  // Register all API routes FIRST, before any catch-all handlers
  app.use('/api', apiRoutes);
  console.log('🔍 API routes registered');
  
  app.use('/api/files', fileStorageRoutes);
  console.log('🔍 File storage routes registered');

  // Add 404 handler for unmatched API routes AFTER route registration
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Create HTTP server after routes are registered
  const server = createServer(app);

  // Initialize WebSocket server
  const wsServer = new RealtimeWebSocketServer(server);
  setWebSocketServer(wsServer);
  console.log('🔌 WebSocket server initialized on /ws');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup frontend serving only for non-API routes
  if (app.get("env") === "development") {
    // Development mode - serve static files
    app.use(express.static('client/dist'));
  } else {
    // Production mode - serve static files
    app.use(express.static('client/dist'));
  }

  // Serve the app on port 8081
  // this serves both the API and the client.
  const port = 8081;
  server.listen(port, () => {
    console.log(`🚀 HALCYON NMT Server running on port ${port}`);
  });
})();