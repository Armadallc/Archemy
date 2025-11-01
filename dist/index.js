// server/index.ts
import "dotenv/config";
import express16 from "express";
import { createServer } from "http";

// server/routes/index.ts
import express14 from "express";

// server/routes/auth.ts
import express from "express";
import { createClient as createClient3 } from "@supabase/supabase-js";

// server/db.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  );
}
console.log("\u{1F50D} Connecting to Supabase:", process.env.SUPABASE_URL);
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase.from("users").select("count", { count: "exact", head: true }).then(({ count, error }) => {
  if (error) {
    console.log("\u274C Supabase connection failed:", error.message);
  } else {
    console.log("\u2705 Supabase connected, users count:", count);
  }
});

// server/supabase-auth.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase2 = createClient2(supabaseUrl, supabaseAnonKey);
var supabaseAdmin = createClient2(supabaseUrl, supabaseServiceKey);
async function verifySupabaseToken(token) {
  try {
    console.log("\u{1F50D} Verifying Supabase token with Supabase...");
    console.log("Token (first 50 chars):", token.substring(0, 50));
    console.log("Supabase URL:", supabaseUrl);
    console.log("Supabase Anon Key (first 20 chars):", supabaseAnonKey.substring(0, 20));
    const { data: { user }, error } = await supabase2.auth.getUser(token);
    if (error || !user) {
      console.log("\u274C Supabase token verification failed:", error?.message);
      return null;
    }
    console.log("\u2705 Supabase token verified, user ID:", user.id, "email:", user.email);
    console.log("\u{1F50D} Looking up user in database with auth_user_id:", user.id);
    const { data: dbUser, error: dbError } = await supabaseAdmin.from("users").select(`
        user_id,
        email,
        role,
        primary_program_id,
        corporate_client_id,
        is_active
      `).eq("auth_user_id", user.id).eq("is_active", true).single();
    if (dbError || !dbUser) {
      console.log("\u274C User not found in database:", user.email, "Error:", dbError?.message);
      return null;
    }
    console.log("\u2705 User found in database:", dbUser.email, "role:", dbUser.role);
    return {
      userId: dbUser.user_id,
      email: dbUser.email,
      role: dbUser.role,
      primaryProgramId: dbUser.primary_program_id,
      corporateClientId: dbUser.corporate_client_id
    };
  } catch (error) {
    console.error("\u274C Token verification error:", error);
    return null;
  }
}
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}
async function requireSupabaseAuth(req, res, next) {
  try {
    console.log("\u{1F50D} requireSupabaseAuth middleware called for:", req.method, req.path);
    const token = extractToken(req);
    if (!token) {
      console.log("\u274C No token found in request");
      return res.status(401).json({ message: "Not authenticated" });
    }
    console.log("\u{1F50D} Verifying token:", token.substring(0, 20) + "...");
    const user = await verifySupabaseToken(token);
    if (!user) {
      console.log("\u274C Invalid or expired token");
      return res.status(401).json({ message: "Not authenticated" });
    }
    req.user = user;
    console.log("\u2705 Supabase Auth successful:", user.email, user.role);
    next();
  } catch (error) {
    console.error("\u274C Auth middleware error:", error);
    res.status(401).json({ message: "Not authenticated" });
  }
}
function requireSupabaseRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: "Access denied: User not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied: Requires one of roles: ${allowedRoles.join(", ")}` });
    }
    next();
  };
}

// server/routes/auth.ts
var router = express.Router();
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("\u{1F50D} Mobile Login: Received credentials:", { email, password: password ? password.substring(0, 3) + "***" : "missing" });
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const supabaseAnon = createClient3(
      process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      console.log("Supabase auth error:", error.message);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!data.user) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    console.log("Looking up user with auth_user_id:", data.user.id);
    const { data: userData, error: userError } = await supabase.from("users").select(`
        user_id,
        auth_user_id,
        user_name,
        email,
        role,
        primary_program_id,
        corporate_client_id,
        avatar_url,
        is_active
      `).eq("auth_user_id", data.user.id).single();
    console.log("User lookup result:", { userData, userError });
    if (userError || !userData) {
      console.log("User lookup error:", userError);
      return res.status(404).json({
        error: "User not found in database",
        debug: {
          authUserId: data.user.id,
          userError: userError?.message,
          userData
        }
      });
    }
    res.json({
      user: userData,
      token: data.session?.access_token,
      sessionId: data.session?.access_token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/user", requireSupabaseAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { data: user, error } = await supabase.from("users").select(`
        user_id,
        auth_user_id,
        user_name,
        email,
        role,
        primary_program_id,
        corporate_client_id,
        avatar_url,
        is_active,
        created_at,
        updated_at
      `).eq("user_id", req.user.userId).single();
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
router.get("/test-schema", async (req, res) => {
  try {
    const { data: userByEmail, error: emailError } = await supabase.from("users").select("*").eq("email", "admin@monarch.com").single();
    const { data: allUsers, error: allError } = await supabase.from("users").select("*").limit(1);
    res.json({
      userByEmail: userByEmail || null,
      emailError: emailError?.message || null,
      allUsers: allUsers || [],
      allError: allError?.message || null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});
router.post("/test-auth", async (req, res) => {
  try {
    const { email, password } = req.body;
    const supabaseAnon = createClient3(
      process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
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
        access_token: data.session.access_token ? "present" : "missing"
      } : null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});
var auth_default = router;

// server/routes/mobile.ts
import express2 from "express";

// server/enhanced-trips-storage.ts
var enhancedTripsStorage = {
  async getAllTrips() {
    const { data, error } = await supabase.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          name,
          description
        )
      `).order("scheduled_pickup_time", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async getTrip(id) {
    const { data, error } = await supabase.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          name,
          description
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getTripsByProgram(programId) {
    const { data, error } = await supabase.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          name,
          description
        )
      `).eq("program_id", programId).order("scheduled_pickup_time", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async getTripsByDriver(driverId) {
    const { data, error } = await supabase.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          name,
          description
        )
      `).eq("driver_id", driverId).order("scheduled_pickup_time", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async getTripsByCategory(categoryId) {
    const { data, error } = await supabase.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          name,
          description
        )
      `).eq("trip_category_id", categoryId).order("scheduled_pickup_time", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async getGroupTrips(programId) {
    const { data, error } = await supabase.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          name,
          description
        )
      `).eq("program_id", programId).eq("is_group_trip", true).order("scheduled_pickup_time", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async getRecurringTrips(programId) {
    const { data, error } = await supabase.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        trip_categories:trip_category_id (
          id,
          name,
          description
        ),
        client_groups:client_group_id (
          id,
          name,
          description
        )
      `).eq("program_id", programId).not("recurring_trip_id", "is", null).order("scheduled_pickup_time", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async createTrip(trip) {
    const { data, error } = await supabase.from("trips").insert({
      ...trip,
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateTrip(id, updates) {
    const { data, error } = await supabase.from("trips").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteTrip(id) {
    const { data, error } = await supabase.from("trips").delete().eq("id", id);
    if (error) throw error;
    return data;
  },
  // Create recurring trip series
  async createRecurringTripSeries(trip, pattern) {
    const recurringTripId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trips = [];
    const startDate = new Date(trip.scheduled_pickup_time);
    const endDate = new Date(trip.recurring_end_date || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1e3));
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const newTrip = {
        ...trip,
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scheduled_pickup_time: currentDate.toISOString(),
        scheduled_return_time: trip.scheduled_return_time ? new Date(currentDate.getTime() + (new Date(trip.scheduled_return_time).getTime() - startDate.getTime())).toISOString() : void 0,
        recurring_trip_id: recurringTripId,
        recurring_pattern: pattern,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      trips.push(newTrip);
      if (pattern.frequency === "daily") {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (pattern.frequency === "weekly") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (pattern.frequency === "monthly") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    const { data, error } = await supabase.from("trips").insert(trips).select();
    if (error) throw error;
    return data;
  },
  // Update trip status
  async updateTripStatus(id, status, actualTimes) {
    const updates = {
      status,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (actualTimes?.pickup) updates.actual_pickup_time = actualTimes.pickup;
    if (actualTimes?.dropoff) updates.actual_dropoff_time = actualTimes.dropoff;
    if (actualTimes?.return) updates.actual_return_time = actualTimes.return;
    const { data, error } = await supabase.from("trips").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
};

// server/routes/mobile.ts
var router2 = express2.Router();
router2.get("/test", (req, res) => {
  res.json({ message: "Mobile API test endpoint working" });
});
router2.get("/trips/driver", requireSupabaseAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const userId = req.user.userId;
    console.log("\u{1F50D} Mobile: Fetching trips for user:", userId);
    const { data: driver, error: driverError } = await supabase.from("drivers").select("id").eq("user_id", userId).eq("is_active", true).single();
    if (driverError || !driver) {
      console.log("\u274C Mobile: No driver found for user:", userId, driverError);
      return res.json([]);
    }
    const driverId = driver.id;
    console.log("\u{1F464} Mobile: Found driver ID:", driverId);
    console.log("\u{1F50D} Mobile: Calling enhancedTripsStorage.getTripsByDriver with driverId:", driverId);
    const trips = await enhancedTripsStorage.getTripsByDriver(driverId);
    console.log("\u2705 Mobile: Found", trips?.length || 0, "trips for driver");
    console.log("\u{1F4CB} Mobile: Trip data:", trips);
    res.json(trips || []);
  } catch (error) {
    console.error("\u274C Mobile: Error fetching driver trips:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : void 0;
    console.error("\u274C Mobile: Error details:", errorMessage, errorStack);
    res.status(500).json({ message: "Failed to fetch driver trips", error: errorMessage });
  }
});
var mobile_default = router2;

// server/routes/clients.ts
import express3 from "express";

// server/auth.ts
import bcrypt from "bcrypt";

// server/minimal-supabase.ts
import { createClient as createClient4 } from "@supabase/supabase-js";
import "dotenv/config";
var supabaseUrl2 = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl2 || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}
var supabase3 = createClient4(supabaseUrl2, supabaseKey);
var corporateClientsStorage = {
  async getAllCorporateClients() {
    const { data, error } = await supabase3.from("corporate_clients").select("*").eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async getCorporateClient(id) {
    const { data, error } = await supabase3.from("corporate_clients").select("*").eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async createCorporateClient(corporateClient) {
    const { data, error } = await supabase3.from("corporate_clients").insert(corporateClient).select().single();
    if (error) throw error;
    return data;
  },
  async updateCorporateClient(id, updates) {
    const { data, error } = await supabase3.from("corporate_clients").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteCorporateClient(id) {
    const { data, error } = await supabase3.from("corporate_clients").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var programsStorage = {
  async getAllPrograms() {
    const { data, error } = await supabase3.from("programs").select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `).eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async getProgram(id) {
    const { data, error } = await supabase3.from("programs").select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getProgramsByCorporateClient(corporateClientId) {
    const { data, error } = await supabase3.from("programs").select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `).eq("corporate_client_id", corporateClientId).eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async createProgram(program) {
    const { data, error } = await supabase3.from("programs").insert(program).select().single();
    if (error) throw error;
    return data;
  },
  async updateProgram(id, updates) {
    const { data, error } = await supabase3.from("programs").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteProgram(id) {
    const { data, error } = await supabase3.from("programs").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var locationsStorage = {
  async getAllLocations() {
    const { data, error } = await supabase3.from("locations").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async getLocation(id) {
    const { data, error } = await supabase3.from("locations").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getLocationsByProgram(programId) {
    const { data, error } = await supabase3.from("locations").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("program_id", programId).eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async createLocation(location) {
    const { data, error } = await supabase3.from("locations").insert(location).select().single();
    if (error) throw error;
    return data;
  },
  async updateLocation(id, updates) {
    const { data, error } = await supabase3.from("locations").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteLocation(id) {
    const { data, error } = await supabase3.from("locations").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var usersStorage = {
  async getAllUsers() {
    const { data, error } = await supabase3.from("users").select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `);
    if (error) throw error;
    return data || [];
  },
  async getUser(userId) {
    const { data, error } = await supabase3.from("users").select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("user_id", userId).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getUserByEmail(email) {
    const { data, error } = await supabase3.from("users").select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("email", email).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getUsersByRole(role) {
    const { data, error } = await supabase3.from("users").select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("role", role);
    if (error) throw error;
    return data || [];
  },
  async getUsersByProgram(programId) {
    const { data, error } = await supabase3.from("users").select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("primary_program_id", programId);
    if (error) throw error;
    return data || [];
  },
  async createUser(user) {
    const { data, error } = await supabase3.from("users").insert(user).select().single();
    if (error) throw error;
    return data;
  },
  async updateUser(userId, updates) {
    const { data, error } = await supabase3.from("users").update(updates).eq("user_id", userId).select().single();
    if (error) throw error;
    return data;
  },
  async deleteUser(userId) {
    const { data, error } = await supabase3.from("users").delete().eq("user_id", userId);
    if (error) throw error;
    return data;
  }
};
var driversStorage = {
  async getAllDrivers() {
    const { data, error } = await supabase3.from("drivers").select(`
        *,
        users:user_id (
          user_id,
          user_name,
          email,
          role,
          primary_program_id,
          programs:primary_program_id (
            id,
            name,
            corporate_clients:corporate_client_id (
              id,
              name
            )
          )
        )
      `).eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async getDriver(id) {
    const { data, error } = await supabase3.from("drivers").select(`
        *,
        users:user_id (
          user_id,
          user_name,
          email,
          role,
          primary_program_id,
          programs:primary_program_id (
            id,
            name,
            corporate_clients:corporate_client_id (
              id,
              name
            )
          )
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getDriversByProgram(programId) {
    const { data, error } = await supabase3.from("drivers").select(`
        *,
        users:user_id (
          user_id,
          user_name,
          email,
          role,
          primary_program_id,
          programs:primary_program_id (
            id,
            name,
            corporate_clients:corporate_client_id (
              id,
              name
            )
          )
        )
      `).eq("is_active", true);
    if (error) throw error;
    return (data || []).filter(
      (driver) => driver.users?.primary_program_id === programId || driver.users?.authorized_programs?.includes(programId)
    );
  },
  async createDriver(driver) {
    const { data, error } = await supabase3.from("drivers").insert(driver).select().single();
    if (error) throw error;
    return data;
  },
  async updateDriver(id, updates) {
    const { data, error } = await supabase3.from("drivers").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteDriver(id) {
    const { data, error } = await supabase3.from("drivers").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var clientsStorage = {
  async getAllClients() {
    const { data, error } = await supabase3.from("clients").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        locations:location_id (
          id,
          name,
          address
        )
      `).eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async getClient(id) {
    const { data, error } = await supabase3.from("clients").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        locations:location_id (
          id,
          name,
          address
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getClientsByProgram(programId) {
    const { data, error } = await supabase3.from("clients").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        locations:location_id (
          id,
          name,
          address
        )
      `).eq("program_id", programId).eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async getClientsByLocation(locationId) {
    const { data, error } = await supabase3.from("clients").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        locations:location_id (
          id,
          name,
          address
        )
      `).eq("location_id", locationId).eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async createClient(client) {
    const { data, error } = await supabase3.from("clients").insert(client).select().single();
    if (error) throw error;
    return data;
  },
  async updateClient(id, updates) {
    const { data, error } = await supabase3.from("clients").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteClient(id) {
    const { data, error } = await supabase3.from("clients").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var tripsStorage = {
  async getAllTrips() {
    const { data, error } = await supabase3.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        )
      `);
    if (error) throw error;
    return data || [];
  },
  async getTrip(id) {
    const { data, error } = await supabase3.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getTripsByProgram(programId) {
    const { data, error } = await supabase3.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        )
      `).eq("program_id", programId);
    if (error) throw error;
    return data || [];
  },
  async getTripsByDriver(driverId) {
    const { data, error } = await supabase3.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        )
      `).eq("driver_id", driverId);
    if (error) throw error;
    return data || [];
  },
  async getTripsByCorporateClient(corporateClientId) {
    const { data, error } = await supabase3.from("trips").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        pickup_locations:pickup_location_id (
          id,
          name,
          address
        ),
        dropoff_locations:dropoff_location_id (
          id,
          name,
          address
        ),
        clients:client_id (
          id,
          first_name,
          last_name,
          phone,
          address
        ),
        drivers:driver_id (
          id,
          users:user_id (
            user_name,
            email
          )
        )
      `).eq("programs.corporate_client_id", corporateClientId).order("scheduled_pickup_time", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async createTrip(trip) {
    const { data, error } = await supabase3.from("trips").insert(trip).select().single();
    if (error) throw error;
    return data;
  },
  async updateTrip(id, updates) {
    const { data, error } = await supabase3.from("trips").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteTrip(id) {
    const { data, error } = await supabase3.from("trips").delete().eq("id", id);
    if (error) throw error;
    return data;
  }
};
var clientGroupsStorage = {
  async getAllClientGroups() {
    const { data, error } = await supabase3.from("client_groups").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        client_group_memberships(count)
      `).eq("is_active", true);
    if (error) throw error;
    const groupsWithCount = (data || []).map((group) => ({
      ...group,
      member_count: group.client_group_memberships?.[0]?.count || 0
    }));
    return groupsWithCount;
  },
  async getClientGroup(id) {
    const { data, error } = await supabase3.from("client_groups").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getClientGroupsByProgram(programId) {
    const { data, error } = await supabase3.from("client_groups").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        client_group_memberships(count)
      `).eq("program_id", programId).eq("is_active", true);
    if (error) throw error;
    const groupsWithCount = (data || []).map((group) => ({
      ...group,
      member_count: group.client_group_memberships?.[0]?.count || 0
    }));
    return groupsWithCount;
  },
  async createClientGroup(clientGroup) {
    const groupWithId = {
      ...clientGroup,
      id: clientGroup.id || crypto.randomUUID()
    };
    const { data, error } = await supabase3.from("client_groups").insert(groupWithId).select().single();
    if (error) throw error;
    return data;
  },
  async updateClientGroup(id, updates) {
    const { data, error } = await supabase3.from("client_groups").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteClientGroup(id) {
    const { data, error } = await supabase3.from("client_groups").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  },
  // Member management functions
  async getClientGroupMembers(groupId) {
    const { data, error } = await supabase3.from("client_group_memberships").select("id, client_id, clients:client_id (id, first_name, last_name, email)").eq("client_group_id", groupId);
    if (error) throw error;
    return data || [];
  },
  async addClientToGroup(groupId, clientId) {
    const { data, error } = await supabase3.from("client_group_memberships").insert({
      id: crypto.randomUUID(),
      client_group_id: groupId,
      client_id: clientId
    }).select().single();
    if (error) throw error;
    return data;
  },
  async removeClientFromGroup(membershipId) {
    const { data, error } = await supabase3.from("client_group_memberships").delete().eq("id", membershipId);
    if (error) throw error;
    return data;
  }
};
async function setupPermissionTables() {
  try {
    console.log("\u2705 Enhanced permission system activated (using hardcoded permissions)");
  } catch (error) {
    console.log("\u{1F4CB} Using hardcoded permissions system");
  }
}
setupPermissionTables();

// server/permissions.ts
var PERMISSIONS = {
  // Corporate client management
  MANAGE_CORPORATE_CLIENTS: "manage_corporate_clients",
  VIEW_CORPORATE_CLIENTS: "view_corporate_clients",
  // Program management (renamed from organizations)
  MANAGE_PROGRAMS: "manage_programs",
  VIEW_PROGRAMS: "view_programs",
  // Location management (renamed from service areas)
  MANAGE_LOCATIONS: "manage_locations",
  VIEW_LOCATIONS: "view_locations",
  // User management
  MANAGE_USERS: "manage_users",
  VIEW_USERS: "view_users",
  // Client management
  MANAGE_CLIENTS: "manage_clients",
  VIEW_CLIENTS: "view_clients",
  // Client group management (new)
  MANAGE_CLIENT_GROUPS: "manage_client_groups",
  VIEW_CLIENT_GROUPS: "view_client_groups",
  // Driver management
  MANAGE_DRIVERS: "manage_drivers",
  VIEW_DRIVERS: "view_drivers",
  // Vehicle management
  MANAGE_VEHICLES: "manage_vehicles",
  VIEW_VEHICLES: "view_vehicles",
  // Trip management
  MANAGE_TRIPS: "manage_trips",
  VIEW_TRIPS: "view_trips",
  CREATE_TRIPS: "create_trips",
  UPDATE_TRIP_STATUS: "update_trip_status",
  // Trip categories (new)
  MANAGE_TRIP_CATEGORIES: "manage_trip_categories",
  VIEW_TRIP_CATEGORIES: "view_trip_categories",
  // Cross-corporate permissions
  VIEW_CLIENTS_CROSS_CORPORATE: "view_clients_cross_corporate",
  MANAGE_CLIENTS_CROSS_CORPORATE: "manage_clients_cross_corporate",
  CREATE_TRIPS_CROSS_CORPORATE: "create_trips_cross_corporate",
  VIEW_PROGRAMS_CROSS_CORPORATE: "view_programs_cross_corporate",
  // Reports and analytics
  VIEW_REPORTS: "view_reports",
  VIEW_ANALYTICS: "view_analytics",
  // Mobile app permissions
  MOBILE_APP_ACCESS: "mobile_app_access",
  LOCATION_TRACKING: "location_tracking",
  // Notification permissions
  MANAGE_NOTIFICATIONS: "manage_notifications",
  VIEW_NOTIFICATIONS: "view_notifications",
  // Calendar permissions
  MANAGE_CALENDAR: "manage_calendar",
  VIEW_CALENDAR: "view_calendar",
  // Webhook permissions
  MANAGE_WEBHOOKS: "manage_webhooks",
  VIEW_WEBHOOKS: "view_webhooks"
};
var ROLE_PERMISSIONS = {
  super_admin: [
    // Full system access
    PERMISSIONS.MANAGE_CORPORATE_CLIENTS,
    PERMISSIONS.VIEW_CORPORATE_CLIENTS,
    PERMISSIONS.MANAGE_PROGRAMS,
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_LOCATIONS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_CLIENT_GROUPS,
    PERMISSIONS.VIEW_CLIENT_GROUPS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.MANAGE_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_CLIENTS_CROSS_CORPORATE,
    PERMISSIONS.MANAGE_CLIENTS_CROSS_CORPORATE,
    PERMISSIONS.CREATE_TRIPS_CROSS_CORPORATE,
    PERMISSIONS.VIEW_PROGRAMS_CROSS_CORPORATE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.LOCATION_TRACKING,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.VIEW_WEBHOOKS
  ],
  corporate_admin: [
    // Corporate client level access
    PERMISSIONS.VIEW_CORPORATE_CLIENTS,
    PERMISSIONS.MANAGE_PROGRAMS,
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_LOCATIONS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_CLIENT_GROUPS,
    PERMISSIONS.VIEW_CLIENT_GROUPS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.MANAGE_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.LOCATION_TRACKING,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.VIEW_WEBHOOKS
  ],
  program_admin: [
    // Program level access
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_LOCATIONS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_CLIENT_GROUPS,
    PERMISSIONS.VIEW_CLIENT_GROUPS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.MANAGE_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.LOCATION_TRACKING,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.VIEW_WEBHOOKS
  ],
  program_user: [
    // Limited program access
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.VIEW_CLIENT_GROUPS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_CALENDAR
  ],
  driver: [
    // Driver-specific permissions
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.LOCATION_TRACKING,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_CALENDAR
  ]
};
function hasPermission(userRole, permission) {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

// server/auth.ts
function requirePermission(permission) {
  return (req, res, next) => {
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

// server/routes/clients.ts
var router3 = express3.Router();
router3.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req, res) => {
  try {
    const clients = await clientsStorage.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});
router3.get("/groups", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
  try {
    const clientGroups = await clientGroupsStorage.getAllClientGroups();
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});
router3.get("/groups/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
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
router3.get("/groups/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups by program:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});
router3.post("/groups", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const clientGroup = await clientGroupsStorage.createClientGroup(req.body);
    res.status(201).json(clientGroup);
  } catch (error) {
    console.error("Error creating client group:", error);
    res.status(500).json({ message: "Failed to create client group" });
  }
});
router3.patch("/groups/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const clientGroup = await clientGroupsStorage.updateClientGroup(id, req.body);
    res.json(clientGroup);
  } catch (error) {
    console.error("Error updating client group:", error);
    res.status(500).json({ message: "Failed to update client group" });
  }
});
router3.delete("/groups/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await clientGroupsStorage.deleteClientGroup(id);
    res.json({ message: "Client group deleted successfully" });
  } catch (error) {
    console.error("Error deleting client group:", error);
    res.status(500).json({ message: "Failed to delete client group" });
  }
});
router3.get("/group-memberships/:groupId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await clientGroupsStorage.getClientGroupMembers(groupId);
    res.json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ message: "Failed to fetch group members" });
  }
});
router3.post("/group-memberships", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { groupId, clientId } = req.body;
    const membership = await clientGroupsStorage.addClientToGroup(groupId, clientId);
    res.status(201).json(membership);
  } catch (error) {
    console.error("Error adding client to group:", error);
    res.status(500).json({ message: "Failed to add client to group" });
  }
});
router3.delete("/group-memberships/:membershipId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { membershipId } = req.params;
    await clientGroupsStorage.removeClientFromGroup(membershipId);
    res.json({ message: "Client removed from group successfully" });
  } catch (error) {
    console.error("Error removing client from group:", error);
    res.status(500).json({ message: "Failed to remove client from group" });
  }
});
router3.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req, res) => {
  try {
    const { programId } = req.params;
    const clients = await clientsStorage.getClientsByProgram(programId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients by program:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});
router3.get("/location/:locationId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req, res) => {
  try {
    const { locationId } = req.params;
    const clients = await clientsStorage.getClientsByLocation(locationId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients by location:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});
router3.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req, res) => {
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
router3.post("/", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const client = await clientsStorage.createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ message: "Failed to create client" });
  }
});
router3.patch("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientsStorage.updateClient(id, req.body);
    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ message: "Failed to update client" });
  }
});
router3.delete("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await clientsStorage.deleteClient(id);
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ message: "Failed to delete client" });
  }
});
var clients_default = router3;

// server/routes/trips.ts
import express4 from "express";

// server/trip-categories-storage.ts
var tripCategoriesStorage = {
  async getAllTripCategories() {
    const { data, error } = await supabase.from("trip_categories").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("is_active", true).order("name");
    if (error) throw error;
    return data || [];
  },
  async getTripCategory(id) {
    const { data, error } = await supabase.from("trip_categories").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getTripCategoriesByProgram(programId) {
    const { data, error } = await supabase.from("trip_categories").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("program_id", programId).eq("is_active", true).order("name");
    if (error) throw error;
    return data || [];
  },
  async createTripCategory(category) {
    const { data, error } = await supabase.from("trip_categories").insert({
      ...category,
      id: `trip_category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateTripCategory(id, updates) {
    const { data, error } = await supabase.from("trip_categories").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteTripCategory(id) {
    const { data, error } = await supabase.from("trip_categories").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  },
  // Get default trip categories for a program
  async getDefaultTripCategories(programId) {
    const defaultCategories = [
      { name: "Medical", description: "Medical appointments and healthcare visits" },
      { name: "Legal", description: "Legal appointments and court visits" },
      { name: "Personal", description: "Personal errands and appointments" },
      { name: "Program", description: "Program-related activities and meetings" },
      { name: "12-Step", description: "12-Step program meetings and activities" },
      { name: "Group", description: "Group activities and outings" },
      { name: "Staff", description: "Staff transportation and meetings" },
      { name: "Carpool", description: "Carpool and shared transportation" }
    ];
    const categories = [];
    for (const category of defaultCategories) {
      try {
        const newCategory = await this.createTripCategory({
          program_id: programId,
          name: category.name,
          description: category.description,
          is_active: true
        });
        categories.push(newCategory);
      } catch (error) {
        console.log(`Category ${category.name} may already exist for program ${programId}`);
      }
    }
    return categories;
  }
};

// server/websocket-instance.ts
var wsServerInstance = null;
function setWebSocketServer(wsServer) {
  wsServerInstance = wsServer;
}
function getWebSocketServer() {
  return wsServerInstance;
}
function broadcastTripUpdate(tripData, target) {
  if (!wsServerInstance) return;
  const event = {
    type: "trip_update",
    data: tripData,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    target
  };
  if (target?.userId) {
    wsServerInstance.sendToUser(target.userId, event);
  } else if (target?.role) {
    wsServerInstance.broadcastToRole(target.role, event);
  } else if (target?.programId) {
    wsServerInstance.broadcastToProgram(target.programId, event);
  } else if (target?.corporateClientId) {
    wsServerInstance.broadcastToCorporateClient(target.corporateClientId, event);
  } else {
    wsServerInstance.broadcast(event);
  }
}
function broadcastDriverUpdate(driverData, target) {
  if (!wsServerInstance) return;
  const event = {
    type: "driver_update",
    data: driverData,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    target
  };
  if (target?.userId) {
    wsServerInstance.sendToUser(target.userId, event);
  } else if (target?.role) {
    wsServerInstance.broadcastToRole(target.role, event);
  } else if (target?.programId) {
    wsServerInstance.broadcastToProgram(target.programId, event);
  } else if (target?.corporateClientId) {
    wsServerInstance.broadcastToCorporateClient(target.corporateClientId, event);
  } else {
    wsServerInstance.broadcast(event);
  }
}

// server/routes/trips.ts
var router4 = express4.Router();
router4.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const trips = await tripsStorage.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router4.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
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
router4.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const trips = await tripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by program:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router4.get("/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { driverId } = req.params;
    const trips = await tripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by driver:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router4.post("/", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const trip = await tripsStorage.createTrip(req.body);
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ message: "Failed to create trip" });
  }
});
router4.patch("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user", "driver"]), async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await tripsStorage.updateTrip(id, req.body);
    broadcastTripUpdate(trip, {
      programId: trip.program_id,
      corporateClientId: req.user?.corporateClientId || void 0,
      role: req.user?.role
    });
    res.json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ message: "Failed to update trip" });
  }
});
router4.delete("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await tripsStorage.deleteTrip(id);
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ message: "Failed to delete trip" });
  }
});
router4.get("/categories", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const categories = await tripCategoriesStorage.getAllTripCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});
router4.get("/categories/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
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
router4.get("/categories/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const categories = await tripCategoriesStorage.getTripCategoriesByProgram(programId);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories by program:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});
router4.post("/categories", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const category = await tripCategoriesStorage.createTripCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating trip category:", error);
    res.status(500).json({ message: "Failed to create trip category" });
  }
});
router4.patch("/categories/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const category = await tripCategoriesStorage.updateTripCategory(id, req.body);
    res.json(category);
  } catch (error) {
    console.error("Error updating trip category:", error);
    res.status(500).json({ message: "Failed to update trip category" });
  }
});
router4.delete("/categories/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await tripCategoriesStorage.deleteTripCategory(id);
    res.json({ message: "Trip category deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip category:", error);
    res.status(500).json({ message: "Failed to delete trip category" });
  }
});
router4.get("/enhanced", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const trips = await enhancedTripsStorage.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router4.get("/enhanced/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
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
var trips_default = router4;

// server/routes/drivers.ts
import express5 from "express";

// server/driver-schedules-storage.ts
var driverSchedulesStorage = {
  // Driver Schedules
  async getAllDriverSchedules() {
    const { data, error } = await supabase.from("driver_schedules").select(`
        *,
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).order("day_of_week, start_time");
    if (error) throw error;
    return data || [];
  },
  async getDriverSchedule(id) {
    const { data, error } = await supabase.from("driver_schedules").select(`
        *,
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getDriverSchedulesByDriver(driverId) {
    const { data, error } = await supabase.from("driver_schedules").select(`
        *,
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("driver_id", driverId).order("day_of_week, start_time");
    if (error) throw error;
    return data || [];
  },
  async getDriverSchedulesByProgram(programId) {
    const { data, error } = await supabase.from("driver_schedules").select(`
        *,
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("program_id", programId).order("day_of_week, start_time");
    if (error) throw error;
    return data || [];
  },
  async createDriverSchedule(schedule) {
    const { data, error } = await supabase.from("driver_schedules").insert({
      ...schedule,
      id: `driver_schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateDriverSchedule(id, updates) {
    const { data, error } = await supabase.from("driver_schedules").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteDriverSchedule(id) {
    const { data, error } = await supabase.from("driver_schedules").delete().eq("id", id);
    if (error) throw error;
    return data;
  },
  // Driver Duty Status
  async getCurrentDutyStatus(driverId) {
    const { data, error } = await supabase.from("driver_duty_status").select(`
        *,
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("driver_id", driverId).is("ended_at", null).order("started_at", { ascending: false }).limit(1).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async updateDutyStatus(driverId, status, location, notes) {
    await supabase.from("driver_duty_status").update({
      ended_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("driver_id", driverId).is("ended_at", null);
    const { data, error } = await supabase.from("driver_duty_status").insert({
      id: `duty_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      driver_id: driverId,
      program_id: "",
      // Will be set by the calling function
      status,
      location,
      notes,
      started_at: (/* @__PURE__ */ new Date()).toISOString(),
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async getDutyStatusHistory(driverId, limit = 50) {
    const { data, error } = await supabase.from("driver_duty_status").select(`
        *,
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("driver_id", driverId).order("started_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },
  // Get available drivers for a specific time
  async getAvailableDrivers(programId, date, startTime, endTime) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const { data, error } = await supabase.from("driver_schedules").select(`
        *,
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("program_id", programId).eq("day_of_week", dayOfWeek).eq("is_available", true).lte("start_time", startTime).gte("end_time", endTime);
    if (error) throw error;
    return data || [];
  },
  // Get driver workload for a specific date
  async getDriverWorkload(driverId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const { data, error } = await supabase.from("trips").select("*").eq("driver_id", driverId).gte("scheduled_pickup_time", startOfDay.toISOString()).lte("scheduled_pickup_time", endOfDay.toISOString()).order("scheduled_pickup_time");
    if (error) throw error;
    return data || [];
  }
};

// server/routes/drivers.ts
var router5 = express5.Router();
router5.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const drivers = await driversStorage.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});
router5.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
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
router5.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { programId } = req.params;
    const drivers = await driversStorage.getDriversByProgram(programId);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers by program:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});
router5.post("/", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const driver = await driversStorage.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    console.error("Error creating driver:", error);
    res.status(500).json({ message: "Failed to create driver" });
  }
});
router5.patch("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await driversStorage.updateDriver(id, req.body);
    broadcastDriverUpdate(driver, {
      programId: driver.program_id,
      corporateClientId: req.user?.corporateClientId || void 0,
      role: req.user?.role
    });
    res.json(driver);
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ message: "Failed to update driver" });
  }
});
router5.delete("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await driversStorage.deleteDriver(id);
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ message: "Failed to delete driver" });
  }
});
router5.get("/schedules", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const schedules = await driverSchedulesStorage.getAllDriverSchedules();
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});
router5.get("/schedules/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
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
router5.get("/schedules/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { driverId } = req.params;
    const schedules = await driverSchedulesStorage.getDriverSchedulesByDriver(driverId);
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules by driver:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});
router5.post("/schedules", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const schedule = await driverSchedulesStorage.createDriverSchedule(req.body);
    res.status(201).json(schedule);
  } catch (error) {
    console.error("Error creating driver schedule:", error);
    res.status(500).json({ message: "Failed to create driver schedule" });
  }
});
router5.patch("/schedules/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await driverSchedulesStorage.updateDriverSchedule(id, req.body);
    res.json(schedule);
  } catch (error) {
    console.error("Error updating driver schedule:", error);
    res.status(500).json({ message: "Failed to update driver schedule" });
  }
});
router5.delete("/schedules/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await driverSchedulesStorage.deleteDriverSchedule(id);
    res.json({ message: "Driver schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver schedule:", error);
    res.status(500).json({ message: "Failed to delete driver schedule" });
  }
});
var drivers_default = router5;

// server/routes/corporate.ts
import express6 from "express";
var router6 = express6.Router();
router6.get("/clients", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CORPORATE_CLIENTS), async (req, res) => {
  try {
    const corporateClients = await corporateClientsStorage.getAllCorporateClients();
    res.json(corporateClients);
  } catch (error) {
    console.error("Error fetching corporate clients:", error);
    res.status(500).json({ message: "Failed to fetch corporate clients" });
  }
});
router6.get("/clients/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CORPORATE_CLIENTS), async (req, res) => {
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
router6.post("/clients", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const corporateClient = await corporateClientsStorage.createCorporateClient(req.body);
    res.status(201).json(corporateClient);
  } catch (error) {
    console.error("Error creating corporate client:", error);
    res.status(500).json({ message: "Failed to create corporate client" });
  }
});
router6.patch("/clients/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const corporateClient = await corporateClientsStorage.updateCorporateClient(id, req.body);
    res.json(corporateClient);
  } catch (error) {
    console.error("Error updating corporate client:", error);
    res.status(500).json({ message: "Failed to update corporate client" });
  }
});
router6.delete("/clients/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await corporateClientsStorage.deleteCorporateClient(id);
    res.json({ message: "Corporate client deleted successfully" });
  } catch (error) {
    console.error("Error deleting corporate client:", error);
    res.status(500).json({ message: "Failed to delete corporate client" });
  }
});
router6.get("/programs", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req, res) => {
  try {
    const programs = await programsStorage.getAllPrograms();
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});
router6.get("/programs/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req, res) => {
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
router6.get("/programs/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req, res) => {
  try {
    const { corporateClientId } = req.params;
    const programs = await programsStorage.getProgramsByCorporateClient(corporateClientId);
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs by corporate client:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});
router6.post("/programs", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const program = await programsStorage.createProgram(req.body);
    res.status(201).json(program);
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ message: "Failed to create program" });
  }
});
router6.patch("/programs/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const program = await programsStorage.updateProgram(id, req.body);
    res.json(program);
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Failed to update program" });
  }
});
router6.delete("/programs/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await programsStorage.deleteProgram(id);
    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Failed to delete program" });
  }
});
var corporate_default = router6;

// server/routes/locations.ts
import express7 from "express";

// server/frequent-locations-storage.ts
import { createClient as createClient5 } from "@supabase/supabase-js";
var supabaseUrl3 = process.env.SUPABASE_URL;
var supabaseServiceKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase4 = createClient5(supabaseUrl3, supabaseServiceKey2);
async function getFrequentLocations(filters = {}) {
  try {
    let query = supabase4.from("frequent_locations").select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        ),
        programs:program_id (
          id,
          name
        ),
        locations:location_id (
          id,
          name
        )
      `).order("usage_count", { ascending: false });
    if (filters.corporate_client_id) {
      query = query.eq("corporate_client_id", filters.corporate_client_id);
    }
    if (filters.program_id) {
      query = query.eq("program_id", filters.program_id);
    }
    if (filters.location_id) {
      query = query.eq("location_id", filters.location_id);
    }
    if (filters.location_type) {
      query = query.eq("location_type", filters.location_type);
    }
    if (filters.is_active !== void 0) {
      query = query.eq("is_active", filters.is_active);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,full_address.ilike.%${filters.search}%`);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching frequent locations:", error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error("Error in getFrequentLocations:", error);
    throw error;
  }
}
async function getFrequentLocationById(id) {
  try {
    const { data, error } = await supabase4.from("frequent_locations").select(`
        *,
        corporate_clients:corporate_client_id (
          id,
          name
        ),
        programs:program_id (
          id,
          name
        ),
        locations:location_id (
          id,
          name
        )
      `).eq("id", id).single();
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching frequent location by ID:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error in getFrequentLocationById:", error);
    throw error;
  }
}
async function createFrequentLocation(data) {
  try {
    const { data: result, error } = await supabase4.from("frequent_locations").insert(data).select().single();
    if (error) {
      console.error("Error creating frequent location:", error);
      throw error;
    }
    return result;
  } catch (error) {
    console.error("Error in createFrequentLocation:", error);
    throw error;
  }
}
async function updateFrequentLocation(id, updates) {
  try {
    const { data, error } = await supabase4.from("frequent_locations").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) {
      console.error("Error updating frequent location:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error in updateFrequentLocation:", error);
    throw error;
  }
}
async function deleteFrequentLocation(id) {
  try {
    const { error } = await supabase4.from("frequent_locations").delete().eq("id", id);
    if (error) {
      console.error("Error deleting frequent location:", error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Error in deleteFrequentLocation:", error);
    throw error;
  }
}
async function incrementUsageCount(id) {
  try {
    const { data: currentData, error: fetchError } = await supabase4.from("frequent_locations").select("usage_count").eq("id", id).single();
    if (fetchError) {
      console.error("Error fetching current usage count:", fetchError);
      throw fetchError;
    }
    const { data, error } = await supabase4.from("frequent_locations").update({
      usage_count: (currentData.usage_count || 0) + 1,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) {
      console.error("Error incrementing usage count:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error in incrementUsageCount:", error);
    throw error;
  }
}
async function getFrequentLocationsForProgram(programId, locationType) {
  try {
    let query = supabase4.from("frequent_locations").select("*").eq("program_id", programId).eq("is_active", true).order("usage_count", { ascending: false });
    if (locationType) {
      query = query.eq("location_type", locationType);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching frequent locations for program:", error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error("Error in getFrequentLocationsForProgram:", error);
    throw error;
  }
}
async function getFrequentLocationsForCorporateClient(corporateClientId, locationType) {
  try {
    let query = supabase4.from("frequent_locations").select("*").eq("corporate_client_id", corporateClientId).eq("is_active", true).order("usage_count", { ascending: false });
    if (locationType) {
      query = query.eq("location_type", locationType);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching frequent locations for corporate client:", error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error("Error in getFrequentLocationsForCorporateClient:", error);
    throw error;
  }
}

// server/routes/locations.ts
var router7 = express7.Router();
router7.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req, res) => {
  try {
    const locations = await locationsStorage.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});
router7.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req, res) => {
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
router7.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req, res) => {
  try {
    const { programId } = req.params;
    const locations = await locationsStorage.getLocationsByProgram(programId);
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations by program:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});
router7.post("/", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const location = await locationsStorage.createLocation(req.body);
    res.status(201).json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ message: "Failed to create location" });
  }
});
router7.patch("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationsStorage.updateLocation(id, req.body);
    res.json(location);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
});
router7.delete("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await locationsStorage.deleteLocation(id);
    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ message: "Failed to delete location" });
  }
});
router7.get("/frequent", requireSupabaseAuth, async (req, res) => {
  try {
    const filters = {
      corporate_client_id: req.query.corporate_client_id,
      program_id: req.query.program_id,
      location_id: req.query.location_id,
      location_type: req.query.location_type,
      is_active: req.query.is_active === "true" ? true : req.query.is_active === "false" ? false : void 0,
      search: req.query.search
    };
    const frequentLocations = await getFrequentLocations(filters);
    res.json(frequentLocations);
  } catch (error) {
    console.error("Error fetching frequent locations:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations" });
  }
});
router7.get("/frequent/:id", requireSupabaseAuth, async (req, res) => {
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
router7.post("/frequent", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const frequentLocation = await createFrequentLocation(req.body);
    res.status(201).json(frequentLocation);
  } catch (error) {
    console.error("Error creating frequent location:", error);
    res.status(500).json({ message: "Failed to create frequent location" });
  }
});
router7.patch("/frequent/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const { id } = req.params;
    const frequentLocation = await updateFrequentLocation(id, req.body);
    res.json(frequentLocation);
  } catch (error) {
    console.error("Error updating frequent location:", error);
    res.status(500).json({ message: "Failed to update frequent location" });
  }
});
router7.delete("/frequent/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const { id } = req.params;
    await deleteFrequentLocation(id);
    res.json({ message: "Frequent location deleted successfully" });
  } catch (error) {
    console.error("Error deleting frequent location:", error);
    res.status(500).json({ message: "Failed to delete frequent location" });
  }
});
router7.post("/frequent/:id/increment-usage", requireSupabaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const frequentLocation = await incrementUsageCount(id);
    res.json(frequentLocation);
  } catch (error) {
    console.error("Error incrementing usage count:", error);
    res.status(500).json({ message: "Failed to increment usage count" });
  }
});
router7.get("/frequent/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const frequentLocations = await getFrequentLocationsForProgram(programId);
    res.json(frequentLocations);
  } catch (error) {
    console.error("Error fetching frequent locations for program:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations" });
  }
});
router7.get("/frequent/corporate-client/:corporateClientId", requireSupabaseAuth, async (req, res) => {
  try {
    const { corporateClientId } = req.params;
    const frequentLocations = await getFrequentLocationsForCorporateClient(corporateClientId);
    res.json(frequentLocations);
  } catch (error) {
    console.error("Error fetching frequent locations for corporate client:", error);
    res.status(500).json({ message: "Failed to fetch frequent locations" });
  }
});
var locations_default = router7;

// server/routes/vehicles.ts
import express8 from "express";

// server/vehicles-storage.ts
var vehiclesStorage = {
  // Vehicles
  async getAllVehicles() {
    const { data, error } = await supabase.from("vehicles").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        current_drivers:current_driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        )
      `).order("make, model, year");
    if (error) throw error;
    return data || [];
  },
  async getVehicle(id) {
    const { data, error } = await supabase.from("vehicles").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        current_drivers:current_driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        )
      `).eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async getVehiclesByProgram(programId) {
    const { data, error } = await supabase.from("vehicles").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        current_drivers:current_driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        )
      `).eq("program_id", programId).eq("is_active", true).order("make, model, year");
    if (error) throw error;
    return data || [];
  },
  async getAvailableVehicles(programId, vehicleType) {
    let query = supabase.from("vehicles").select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        current_drivers:current_driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        )
      `).eq("program_id", programId).eq("is_active", true).is("current_driver_id", null);
    if (vehicleType) {
      query = query.eq("vehicle_type", vehicleType);
    }
    const { data, error } = await query.order("make, model, year");
    if (error) throw error;
    return data || [];
  },
  async createVehicle(vehicle) {
    const { data, error } = await supabase.from("vehicles").insert({
      ...vehicle,
      id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateVehicle(id, updates) {
    const { data, error } = await supabase.from("vehicles").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteVehicle(id) {
    const { data, error } = await supabase.from("vehicles").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  },
  // Vehicle Maintenance
  async getVehicleMaintenance(vehicleId) {
    const { data, error } = await supabase.from("vehicle_maintenance").select(`
        *,
        vehicles:vehicle_id (
          id,
          make,
          model,
          year,
          license_plate
        )
      `).eq("vehicle_id", vehicleId).order("performed_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async createMaintenanceRecord(maintenance) {
    const { data, error } = await supabase.from("vehicle_maintenance").insert({
      ...maintenance,
      id: `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateMaintenanceRecord(id, updates) {
    const { data, error } = await supabase.from("vehicle_maintenance").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  // Vehicle Assignments
  async assignVehicleToDriver(vehicleId, driverId, programId, notes) {
    await supabase.from("vehicles").update({ current_driver_id: null }).eq("id", vehicleId);
    const { data, error } = await supabase.from("vehicle_assignments").insert({
      id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vehicle_id: vehicleId,
      driver_id: driverId,
      program_id: programId,
      assigned_at: (/* @__PURE__ */ new Date()).toISOString(),
      notes,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    await supabase.from("vehicles").update({ current_driver_id: driverId }).eq("id", vehicleId);
    return data;
  },
  async unassignVehicleFromDriver(vehicleId, driverId) {
    const { data, error } = await supabase.from("vehicle_assignments").update({
      unassigned_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("vehicle_id", vehicleId).eq("driver_id", driverId).is("unassigned_at", null).select().single();
    if (error) throw error;
    await supabase.from("vehicles").update({ current_driver_id: null }).eq("id", vehicleId);
    return data;
  },
  async getVehicleAssignments(vehicleId) {
    const { data, error } = await supabase.from("vehicle_assignments").select(`
        *,
        vehicles:vehicle_id (
          id,
          make,
          model,
          year,
          license_plate
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("vehicle_id", vehicleId).order("assigned_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async getDriverVehicleHistory(driverId) {
    const { data, error } = await supabase.from("vehicle_assignments").select(`
        *,
        vehicles:vehicle_id (
          id,
          make,
          model,
          year,
          license_plate
        ),
        drivers:driver_id (
          id,
          user_id,
          users:user_id (
            user_name,
            email
          )
        ),
        programs:program_id (
          id,
          name,
          corporate_client_id,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        )
      `).eq("driver_id", driverId).order("assigned_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
};

// server/routes/vehicles.ts
var router8 = express8.Router();
router8.get("/", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});
router8.get("/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
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
router8.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { programId } = req.params;
    const vehicles = await vehiclesStorage.getVehiclesByProgram(programId);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles by program:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});
router8.get("/available/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { programId } = req.params;
    const { vehicleType } = req.query;
    const vehicles = await vehiclesStorage.getAvailableVehicles(programId, vehicleType);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching available vehicles:", error);
    res.status(500).json({ message: "Failed to fetch available vehicles" });
  }
});
router8.post("/", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const vehicle = await vehiclesStorage.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ message: "Failed to create vehicle" });
  }
});
router8.patch("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await vehiclesStorage.updateVehicle(id, req.body);
    res.json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Failed to update vehicle" });
  }
});
router8.delete("/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await vehiclesStorage.deleteVehicle(id);
    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
});
router8.get("/:vehicleId/maintenance", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const maintenance = await vehiclesStorage.getVehicleMaintenance(vehicleId);
    res.json(maintenance);
  } catch (error) {
    console.error("Error fetching vehicle maintenance:", error);
    res.status(500).json({ message: "Failed to fetch vehicle maintenance" });
  }
});
router8.post("/:vehicleId/maintenance", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router8.patch("/maintenance/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const maintenance = await vehiclesStorage.updateMaintenanceRecord(id, req.body);
    res.json(maintenance);
  } catch (error) {
    console.error("Error updating maintenance record:", error);
    res.status(500).json({ message: "Failed to update maintenance record" });
  }
});
router8.post("/:vehicleId/assign", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router8.post("/:vehicleId/unassign", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router8.get("/:vehicleId/assignments", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const assignments = await vehiclesStorage.getVehicleAssignments(vehicleId);
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching vehicle assignments:", error);
    res.status(500).json({ message: "Failed to fetch vehicle assignments" });
  }
});
router8.get("/drivers/:driverId/vehicle-history", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { driverId } = req.params;
    const history = await vehiclesStorage.getDriverVehicleHistory(driverId);
    res.json(history);
  } catch (error) {
    console.error("Error fetching driver vehicle history:", error);
    res.status(500).json({ message: "Failed to fetch driver vehicle history" });
  }
});
var vehicles_default = router8;

// server/routes/calendar.ts
import express9 from "express";

// server/calendar-system.ts
var calendarSystem = {
  // Program Calendar - Shows trips for a specific program
  async getProgramCalendar(programId, startDate, endDate, filters) {
    try {
      const trips = await enhancedTripsStorage.getTripsByProgram(programId);
      const program = await programsStorage.getProgram(programId);
      if (!program) {
        throw new Error(`Program ${programId} not found`);
      }
      const events = trips.filter((trip) => {
        const tripDate = new Date(trip.scheduled_pickup_time);
        return tripDate >= new Date(startDate) && tripDate <= new Date(endDate);
      }).map((trip) => ({
        id: trip.id,
        title: `${trip.client?.first_name || "Unknown"} ${trip.client?.last_name || "Client"}`,
        start: trip.scheduled_pickup_time,
        end: trip.scheduled_return_time || trip.scheduled_pickup_time,
        allDay: false,
        color: this.getCategoryColor(trip.trip_category?.name || "Personal"),
        category: trip.trip_category?.name || "Personal",
        programId: trip.program_id,
        programName: program.name,
        corporateClientId: program.corporate_client_id,
        corporateClientName: program.corporateClient?.name || "Unknown",
        locationId: trip.pickup_location_id,
        locationName: trip.pickup_location?.name,
        clientId: trip.client_id,
        clientName: `${trip.client?.first_name || ""} ${trip.client?.last_name || ""}`.trim(),
        driverId: trip.driver_id,
        driverName: trip.driver?.users?.user_name || "Unassigned",
        tripType: trip.trip_type,
        tripStatus: trip.status,
        isGroupTrip: trip.is_group_trip,
        passengerCount: trip.passenger_count,
        notes: trip.notes,
        recurringPattern: trip.recurring_pattern,
        metadata: {
          type: "trip",
          priority: this.getPriorityFromStatus(trip.status),
          isRecurring: !!trip.recurring_trip_id,
          isGroup: trip.is_group_trip
        }
      }));
      return {
        events,
        program: {
          id: program.id,
          name: program.name,
          corporateClientId: program.corporate_client_id,
          corporateClientName: program.corporateClient?.name
        },
        view: "program",
        totalEvents: events.length,
        filteredEvents: this.applyFilters(events, filters)
      };
    } catch (error) {
      console.error("Error fetching program calendar:", error);
      throw error;
    }
  },
  // Corporate Calendar - Shows trips across all programs for a corporate client
  async getCorporateCalendar(corporateClientId, startDate, endDate, filters) {
    try {
      const programs = await programsStorage.getProgramsByCorporateClient(corporateClientId);
      const allEvents = [];
      for (const program of programs) {
        const programEvents = await this.getProgramCalendar(program.id, startDate, endDate, filters);
        allEvents.push(...programEvents.events);
      }
      return {
        events: allEvents,
        corporateClient: {
          id: corporateClientId,
          name: programs[0]?.corporateClient?.name || "Unknown",
          programs: programs.map((p) => ({ id: p.id, name: p.name }))
        },
        view: "corporate",
        totalEvents: allEvents.length,
        filteredEvents: this.applyFilters(allEvents, filters)
      };
    } catch (error) {
      console.error("Error fetching corporate calendar:", error);
      throw error;
    }
  },
  // Universal Calendar - Shows all trips across all corporate clients
  async getUniversalCalendar(startDate, endDate, filters) {
    try {
      const allPrograms = await programsStorage.getAllPrograms();
      const allEvents = [];
      for (const program of allPrograms) {
        const programEvents = await this.getProgramCalendar(program.id, startDate, endDate, filters);
        allEvents.push(...programEvents.events);
      }
      return {
        events: allEvents,
        view: "universal",
        totalEvents: allEvents.length,
        filteredEvents: this.applyFilters(allEvents, filters),
        corporateClients: [...new Set(allEvents.map((e) => e.corporateClientId))],
        programs: [...new Set(allEvents.map((e) => e.programId))]
      };
    } catch (error) {
      console.error("Error fetching universal calendar:", error);
      throw error;
    }
  },
  // Color-coded identification system
  getCategoryColor(category) {
    const colorMap = {
      "Medical": "#3B82F6",
      // Blue
      "Legal": "#EF4444",
      // Red
      "Personal": "#10B981",
      // Green
      "Program": "#8B5CF6",
      // Purple
      "12-Step": "#F59E0B",
      // Orange
      "Group": "#06B6D4",
      // Cyan
      "Staff": "#6B7280",
      // Gray
      "Carpool": "#84CC16"
      // Lime
    };
    return colorMap[category] || "#6B7280";
  },
  getPriorityFromStatus(status) {
    const priorityMap = {
      "scheduled": "medium",
      "confirmed": "high",
      "in_progress": "urgent",
      "completed": "low",
      "cancelled": "low"
    };
    return priorityMap[status] || "medium";
  },
  // Apply filters to events
  applyFilters(events, filters) {
    if (!filters) return events;
    return events.filter((event) => {
      if (filters.categories && !filters.categories.includes(event.category)) return false;
      if (filters.statuses && !filters.statuses.includes(event.tripStatus)) return false;
      if (filters.tripTypes && !filters.tripTypes.includes(event.tripType)) return false;
      if (filters.drivers && !filters.drivers.includes(event.driverId || "")) return false;
      if (filters.locations && !filters.locations.includes(event.locationId || "")) return false;
      return true;
    });
  },
  // Ride sharing optimization
  async optimizeRideSharing(programId, date, options) {
    try {
      const trips = await enhancedTripsStorage.getTripsByProgram(programId);
      const dayTrips = trips.filter((trip) => {
        const tripDate = new Date(trip.scheduled_pickup_time).toDateString();
        return tripDate === new Date(date).toDateString();
      });
      const optimizedGroups = this.groupTripsForRideSharing(dayTrips, options);
      return optimizedGroups;
    } catch (error) {
      console.error("Error optimizing ride sharing:", error);
      throw error;
    }
  },
  groupTripsForRideSharing(trips, options) {
    const groups = [];
    const processed = /* @__PURE__ */ new Set();
    for (const trip of trips) {
      if (processed.has(trip.id)) continue;
      const group = [trip];
      processed.add(trip.id);
      for (const otherTrip of trips) {
        if (processed.has(otherTrip.id)) continue;
        if (this.canShareRide(trip, otherTrip, options)) {
          group.push(otherTrip);
          processed.add(otherTrip.id);
        }
      }
      groups.push({
        id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trips: group,
        totalPassengers: group.reduce((sum, t) => sum + t.passenger_count, 0),
        estimatedDuration: this.calculateGroupDuration(group),
        savings: this.calculateSavings(group)
      });
    }
    return groups;
  },
  canShareRide(trip1, trip2, options) {
    const time1 = new Date(trip1.scheduled_pickup_time);
    const time2 = new Date(trip2.scheduled_pickup_time);
    const timeDiff = Math.abs(time1.getTime() - time2.getTime()) / (1e3 * 60);
    const totalPassengers = trip1.passenger_count + trip2.passenger_count;
    return timeDiff <= options.maxDetourMinutes && totalPassengers <= options.maxPassengers && trip1.pickup_address === trip2.pickup_address;
  },
  calculateGroupDuration(trips) {
    return trips.length * 30;
  },
  calculateSavings(trips) {
    return trips.length * 15;
  },
  // Capacity planning
  async getCapacityForecast(programId, days) {
    try {
      const endDate = /* @__PURE__ */ new Date();
      endDate.setDate(endDate.getDate() + days);
      const trips = await enhancedTripsStorage.getTripsByProgram(programId);
      const forecast = [];
      for (let i = 0; i < days; i++) {
        const date = /* @__PURE__ */ new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split("T")[0];
        const dayTrips = trips.filter((trip) => {
          const tripDate = new Date(trip.scheduled_pickup_time).toISOString().split("T")[0];
          return tripDate === dateString;
        });
        const totalPassengers = dayTrips.reduce((sum, trip) => sum + trip.passenger_count, 0);
        const uniqueDrivers = new Set(dayTrips.map((trip) => trip.driver_id).filter(Boolean)).size;
        forecast.push({
          date: dateString,
          totalTrips: dayTrips.length,
          totalPassengers,
          driversNeeded: uniqueDrivers,
          utilization: Math.min(totalPassengers / 20, 1),
          // Assuming 20 passenger capacity
          peakHours: this.calculatePeakHours(dayTrips)
        });
      }
      return forecast;
    } catch (error) {
      console.error("Error generating capacity forecast:", error);
      throw error;
    }
  },
  calculatePeakHours(trips) {
    const hourCounts = {};
    trips.forEach((trip) => {
      const hour = new Date(trip.scheduled_pickup_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const sortedHours = Object.entries(hourCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([hour]) => `${hour}:00`);
    return sortedHours;
  }
};

// server/routes/calendar.ts
var router9 = express9.Router();
router9.get("/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const { startDate, endDate, filters } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    const calendar = await calendarSystem.getProgramCalendar(programId, startDate, endDate, filters ? JSON.parse(filters) : void 0);
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching program calendar:", error);
    res.status(500).json({ message: "Failed to fetch program calendar" });
  }
});
router9.get("/corporate/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { corporateClientId } = req.params;
    const { startDate, endDate, filters } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    const calendar = await calendarSystem.getCorporateCalendar(corporateClientId, startDate, endDate, filters ? JSON.parse(filters) : void 0);
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching corporate calendar:", error);
    res.status(500).json({ message: "Failed to fetch corporate calendar" });
  }
});
router9.get("/universal", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const { startDate, endDate, filters } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    const calendar = await calendarSystem.getUniversalCalendar(startDate, endDate, filters ? JSON.parse(filters) : void 0);
    res.json(calendar);
  } catch (error) {
    console.error("Error fetching universal calendar:", error);
    res.status(500).json({ message: "Failed to fetch universal calendar" });
  }
});
router9.post("/optimize/ride-sharing/:programId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router9.get("/capacity-forecast/:programId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
var calendar_default = router9;

// server/routes/notifications.ts
import express10 from "express";

// server/notification-system.ts
var notificationSystem = {
  // Create notification template
  async createTemplate(template) {
    try {
      const { data, error } = await supabase.from("notification_templates").insert({
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating notification template:", error);
      throw error;
    }
  },
  // Get notification templates
  async getTemplates(type) {
    try {
      let query = supabase.from("notification_templates").select("*").eq("is_active", true);
      if (type) {
        query = query.eq("type", type);
      }
      const { data, error } = await query.order("name");
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching notification templates:", error);
      throw error;
    }
  },
  // Create notification
  async createNotification(notification) {
    try {
      const { data, error } = await supabase.from("notifications").insert({
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (error) throw error;
      await this.createDeliveryRecords(data.id, notification.user_id, notification.channels);
      return data;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },
  // Create delivery records
  async createDeliveryRecords(notificationId, userId, channels) {
    try {
      const deliveries = channels.map((channel) => ({
        id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        notification_id: notificationId,
        user_id: userId,
        channel,
        status: "pending",
        retry_count: 0,
        max_retries: 3,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }));
      const { error } = await supabase.from("notification_deliveries").insert(deliveries);
      if (error) throw error;
      return deliveries;
    } catch (error) {
      console.error("Error creating delivery records:", error);
      throw error;
    }
  },
  // Send trip reminder
  async sendTripReminder(tripId, advanceMinutes = 30) {
    try {
      const { data: trip, error: tripError } = await supabase.from("trips").select(`
          *,
          clients:client_id (first_name, last_name, phone, email),
          drivers:driver_id (user_id, users:user_id (user_name, email, phone))
        `).eq("id", tripId).single();
      if (tripError) throw tripError;
      const scheduledTime = new Date(trip.scheduled_pickup_time);
      const reminderTime = new Date(scheduledTime.getTime() - advanceMinutes * 60 * 1e3);
      if (trip.driver_id) {
        await this.createNotification({
          user_id: trip.drivers?.user_id || "",
          type: "trip_reminder",
          title: "Upcoming Trip",
          body: `You have a trip scheduled for ${scheduledTime.toLocaleString()}`,
          data: {
            trip_id: tripId,
            client_name: `${trip.clients?.first_name || ""} ${trip.clients?.last_name || ""}`.trim(),
            pickup_address: trip.pickup_address,
            dropoff_address: trip.dropoff_address,
            scheduled_time: trip.scheduled_pickup_time
          },
          priority: "high",
          scheduled_for: reminderTime.toISOString(),
          channels: ["push", "sms"],
          status: "scheduled"
        });
      }
      if (trip.clients?.email) {
        await this.createNotification({
          user_id: trip.client_id,
          type: "trip_reminder",
          title: "Trip Reminder",
          body: `Your trip is scheduled for ${scheduledTime.toLocaleString()}`,
          data: {
            trip_id: tripId,
            driver_name: trip.drivers?.users?.user_name || "TBD",
            pickup_address: trip.pickup_address,
            dropoff_address: trip.dropoff_address,
            scheduled_time: trip.scheduled_pickup_time
          },
          priority: "medium",
          scheduled_for: reminderTime.toISOString(),
          channels: ["email", "sms"],
          status: "scheduled"
        });
      }
      return { success: true };
    } catch (error) {
      console.error("Error sending trip reminder:", error);
      throw error;
    }
  },
  // Send driver update
  async sendDriverUpdate(driverId, updateType, data) {
    try {
      const { data: driver, error } = await supabase.from("drivers").select("user_id, users:user_id (user_name, email, phone)").eq("id", driverId).single();
      if (error) throw error;
      let title = "Driver Update";
      let body = "You have a driver update";
      switch (updateType) {
        case "trip_assigned":
          title = "New Trip Assigned";
          body = `You have been assigned a new trip: ${data.client_name}`;
          break;
        case "trip_cancelled":
          title = "Trip Cancelled";
          body = `Trip cancelled: ${data.client_name}`;
          break;
        case "schedule_change":
          title = "Schedule Change";
          body = "Your schedule has been updated";
          break;
        case "vehicle_assignment":
          title = "Vehicle Assignment";
          body = `You have been assigned vehicle: ${data.vehicle_info}`;
          break;
      }
      await this.createNotification({
        user_id: driver.user_id,
        type: "driver_update",
        title,
        body,
        data: {
          update_type: updateType,
          ...data
        },
        priority: "high",
        channels: ["push", "sms"],
        status: "draft"
      });
      return { success: true };
    } catch (error) {
      console.error("Error sending driver update:", error);
      throw error;
    }
  },
  // Send system alert
  async sendSystemAlert(alertType, message, targetUsers, priority = "medium") {
    try {
      let userIds = targetUsers;
      if (!userIds) {
        const { data: users, error } = await supabase.from("users").select("user_id").eq("is_active", true);
        if (error) throw error;
        userIds = users.map((u) => u.user_id);
      }
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        type: "system_alert",
        title: "System Alert",
        body: message,
        data: {
          alert_type: alertType,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        },
        priority,
        channels: ["push", "email"],
        status: "draft"
      }));
      for (const notification of notifications) {
        await this.createNotification(notification);
      }
      return { success: true, sent_to: userIds.length };
    } catch (error) {
      console.error("Error sending system alert:", error);
      throw error;
    }
  },
  // Process scheduled notifications
  async processScheduledNotifications() {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { data: notifications, error } = await supabase.from("notifications").select(`
          *,
          deliveries:notification_deliveries (*)
        `).eq("status", "scheduled").lte("scheduled_for", now);
      if (error) throw error;
      for (const notification of notifications || []) {
        await this.sendNotification(notification);
      }
      return { processed: notifications?.length || 0 };
    } catch (error) {
      console.error("Error processing scheduled notifications:", error);
      throw error;
    }
  },
  // Send notification through appropriate channels
  async sendNotification(notification) {
    try {
      await supabase.from("notifications").update({
        status: "sending",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", notification.id);
      for (const delivery of notification.deliveries) {
        if (delivery.status === "pending") {
          try {
            await this.sendToChannel(delivery, notification);
          } catch (error) {
            console.error(`Error sending to ${delivery.channel}:`, error);
            await this.updateDeliveryStatus(delivery.id, "failed", error.message);
          }
        }
      }
      await supabase.from("notifications").update({
        status: "sent",
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", notification.id);
      return { success: true };
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  },
  // Send to specific channel
  async sendToChannel(delivery, notification) {
    switch (delivery.channel) {
      case "push":
        await this.sendPushNotification(delivery, notification);
        break;
      case "sms":
        await this.sendSMS(delivery, notification);
        break;
      case "email":
        await this.sendEmail(delivery, notification);
        break;
    }
  },
  // Send push notification
  async sendPushNotification(delivery, notification) {
    console.log(`Sending push notification to ${delivery.user_id}: ${notification.title}`);
    await this.updateDeliveryStatus(delivery.id, "sent");
    await this.updateDeliveryStatus(delivery.id, "delivered");
  },
  // Send SMS
  async sendSMS(delivery, notification) {
    console.log(`Sending SMS to ${delivery.user_id}: ${notification.body}`);
    await this.updateDeliveryStatus(delivery.id, "sent");
    await this.updateDeliveryStatus(delivery.id, "delivered");
  },
  // Send email
  async sendEmail(delivery, notification) {
    console.log(`Sending email to ${delivery.user_id}: ${notification.title}`);
    await this.updateDeliveryStatus(delivery.id, "sent");
    await this.updateDeliveryStatus(delivery.id, "delivered");
  },
  // Update delivery status
  async updateDeliveryStatus(deliveryId, status, errorMessage) {
    try {
      const updates = {
        status,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (status === "sent") {
        updates.sent_at = (/* @__PURE__ */ new Date()).toISOString();
      } else if (status === "delivered") {
        updates.delivered_at = (/* @__PURE__ */ new Date()).toISOString();
      } else if (status === "failed") {
        updates.error_message = errorMessage;
        updates.retry_count = await this.incrementRetryCount(deliveryId);
      }
      const { error } = await supabase.from("notification_deliveries").update(updates).eq("id", deliveryId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating delivery status:", error);
      throw error;
    }
  },
  // Increment retry count
  async incrementRetryCount(deliveryId) {
    try {
      const { data, error } = await supabase.from("notification_deliveries").select("retry_count").eq("id", deliveryId).single();
      if (error) throw error;
      return (data.retry_count || 0) + 1;
    } catch (error) {
      console.error("Error incrementing retry count:", error);
      return 1;
    }
  },
  // Get user notification preferences
  async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      throw error;
    }
  },
  // Update user notification preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const { data, error } = await supabase.from("notification_preferences").upsert({
        ...preferences,
        user_id: userId,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }
  }
};

// server/routes/notifications.ts
var router10 = express10.Router();
router10.get("/templates", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
  try {
    const { type } = req.query;
    const templates = await notificationSystem.getTemplates(type);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching notification templates:", error);
    res.status(500).json({ message: "Failed to fetch notification templates" });
  }
});
router10.post("/templates", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const template = await notificationSystem.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating notification template:", error);
    res.status(500).json({ message: "Failed to create notification template" });
  }
});
router10.post("/send", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const notification = await notificationSystem.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});
router10.post("/trip-reminder/:tripId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
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
router10.post("/driver-update/:driverId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router10.post("/system-alert", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const { alertType, message, targetUsers, priority } = req.body;
    const result = await notificationSystem.sendSystemAlert(alertType, message, targetUsers, priority);
    res.json(result);
  } catch (error) {
    console.error("Error sending system alert:", error);
    res.status(500).json({ message: "Failed to send system alert" });
  }
});
router10.post("/process-scheduled", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const result = await notificationSystem.processScheduledNotifications();
    res.json(result);
  } catch (error) {
    console.error("Error processing scheduled notifications:", error);
    res.status(500).json({ message: "Failed to process scheduled notifications" });
  }
});
router10.get("/preferences/:userId", requireSupabaseAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await notificationSystem.getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ message: "Failed to fetch notification preferences" });
  }
});
router10.patch("/preferences/:userId", requireSupabaseAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await notificationSystem.updateUserPreferences(userId, req.body);
    res.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ message: "Failed to update notification preferences" });
  }
});
var notifications_default = router10;

// server/routes/dashboard.ts
import express11 from "express";
var router11 = express11.Router();
router11.get("/corporate-clients", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const corporateClients = await corporateClientsStorage.getAllCorporateClients();
    const corporateClientsWithPrograms = await Promise.all(
      corporateClients.map(async (client) => {
        try {
          const programs = await programsStorage.getProgramsByCorporateClient(client.corporate_client_id);
          return {
            ...client,
            programs: programs.map((program) => ({
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
router11.get("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
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
router11.get("/programs", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const programs = await programsStorage.getAllPrograms();
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});
router11.get("/trips/universal", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    console.log("\u{1F50D} Fetching universal trips...");
    const trips = await tripsStorage.getAllTrips();
    console.log("\u2705 Universal trips fetched:", trips?.length || 0, "trips");
    res.json(trips || []);
  } catch (error) {
    console.error("\u274C Error fetching universal trips:", error);
    res.status(500).json({ message: "Failed to fetch universal trips" });
  }
});
router11.get("/vehicles", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});
router11.get("/trips/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const trips = await tripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching program trips:", error);
    res.status(500).json({ message: "Failed to fetch program trips" });
  }
});
router11.get("/trips/corporate-client/:corporateClientId", requireSupabaseAuth, async (req, res) => {
  try {
    const { corporateClientId } = req.params;
    const trips = await tripsStorage.getTripsByCorporateClient(corporateClientId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching corporate client trips:", error);
    res.status(500).json({ message: "Failed to fetch corporate client trips" });
  }
});
router11.get("/drivers/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const drivers = await driversStorage.getDriversByProgram(programId);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching program drivers:", error);
    res.status(500).json({ message: "Failed to fetch program drivers" });
  }
});
router11.get("/clients/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const clients = await clientsStorage.getClientsByProgram(programId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching program clients:", error);
    res.status(500).json({ message: "Failed to fetch program clients" });
  }
});
router11.get("/client-groups/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching program client groups:", error);
    res.status(500).json({ message: "Failed to fetch program client groups" });
  }
});
router11.get("/vehicles/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const vehicles = await vehiclesStorage.getVehiclesByProgram(programId);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching program vehicles:", error);
    res.status(500).json({ message: "Failed to fetch program vehicles" });
  }
});
router11.get("/trips/driver/:driverId", requireSupabaseAuth, async (req, res) => {
  try {
    const { driverId } = req.params;
    const trips = await tripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching driver trips:", error);
    res.status(500).json({ message: "Failed to fetch driver trips" });
  }
});
var dashboard_default = router11;

// server/routes/bulk.ts
import express12 from "express";
var router12 = express12.Router();
router12.post("/trips", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
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
          case "status_scheduled":
            result = await tripsStorage.updateTrip(tripId, { status: "scheduled" });
            break;
          case "status_in_progress":
            result = await tripsStorage.updateTrip(tripId, { status: "in_progress" });
            break;
          case "status_completed":
            result = await tripsStorage.updateTrip(tripId, { status: "completed" });
            break;
          case "status_cancelled":
            result = await tripsStorage.updateTrip(tripId, { status: "cancelled" });
            break;
          case "delete":
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
router12.post("/drivers", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
          case "status_active":
            result = await driversStorage.updateDriver(driverId, { status: "active" });
            break;
          case "status_inactive":
            result = await driversStorage.updateDriver(driverId, { status: "inactive" });
            break;
          case "delete":
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
router12.post("/clients", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
          case "status_active":
            result = await clientsStorage.updateClient(clientId, { is_active: true });
            break;
          case "status_inactive":
            result = await clientsStorage.updateClient(clientId, { is_active: false });
            break;
          case "delete":
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
router12.post("/locations", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
          case "status_active":
            result = await locationsStorage.updateLocation(locationId, { is_active: true });
            break;
          case "status_inactive":
            result = await locationsStorage.updateLocation(locationId, { is_active: false });
            break;
          case "delete":
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
var bulk_default = router12;

// server/routes/legacy.ts
import express13 from "express";
var router13 = express13.Router();
router13.get("/corporate-clients", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  res.redirect(307, "/api/corporate/clients");
});
router13.get("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  res.redirect(307, `/api/corporate/clients/${req.params.id}`);
});
router13.get("/programs", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  res.redirect(307, "/api/corporate/programs");
});
router13.get("/programs/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  res.redirect(307, `/api/corporate/programs/${req.params.id}`);
});
router13.get("/service-areas", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req, res) => {
  res.redirect(307, "/api/locations");
});
router13.get("/service-areas/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req, res) => {
  res.redirect(307, `/api/locations/${req.params.id}`);
});
router13.get("/organizations", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  res.redirect(307, "/api/corporate/clients");
});
router13.get("/organizations/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  res.redirect(307, `/api/corporate/clients/${req.params.id}`);
});
router13.get("/trip-categories", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  res.redirect(307, "/api/trips/categories");
});
router13.get("/trip-categories/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  res.redirect(307, `/api/trips/categories/${req.params.id}`);
});
router13.get("/enhanced-trips", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  res.redirect(307, "/api/trips/enhanced");
});
router13.get("/enhanced-trips/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  res.redirect(307, `/api/trips/enhanced/${req.params.id}`);
});
router13.get("/driver-schedules", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  res.redirect(307, "/api/drivers/schedules");
});
router13.get("/driver-schedules/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  res.redirect(307, `/api/drivers/schedules/${req.params.id}`);
});
router13.get("/vehicle-maintenance", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  res.redirect(307, "/api/vehicles/maintenance");
});
router13.get("/vehicle-maintenance/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  res.redirect(307, `/api/vehicles/maintenance/${req.params.id}`);
});
router13.get("/frequent-locations", requireSupabaseAuth, async (req, res) => {
  res.redirect(307, "/api/locations/frequent");
});
router13.get("/frequent-locations/:id", requireSupabaseAuth, async (req, res) => {
  res.redirect(307, `/api/locations/frequent/${req.params.id}`);
});
router13.get("/notification-templates", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
  res.redirect(307, "/api/notifications/templates");
});
router13.post("/notification-templates", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  res.redirect(307, "/api/notifications/templates");
});
router13.get("/calendar", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  res.redirect(307, "/api/calendar");
});
router13.post("/bulk-trips", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  res.redirect(307, "/api/bulk/trips");
});
router13.post("/bulk-drivers", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  res.redirect(307, "/api/bulk/drivers");
});
router13.post("/bulk-clients", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  res.redirect(307, "/api/bulk/clients");
});
router13.get("/client-groups", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
  try {
    const clientGroups = await clientGroupsStorage.getAllClientGroups();
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});
router13.get("/client-groups/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
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
router13.get("/client-groups/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups by program:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});
router13.get("/client-groups/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
  try {
    const clientGroups = await clientGroupsStorage.getAllClientGroups();
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups by corporate client:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});
router13.post("/client-groups", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const clientGroup = await clientGroupsStorage.createClientGroup(req.body);
    res.status(201).json(clientGroup);
  } catch (error) {
    console.error("Error creating client group:", error);
    res.status(500).json({ message: "Failed to create client group" });
  }
});
router13.patch("/client-groups/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const clientGroup = await clientGroupsStorage.updateClientGroup(id, req.body);
    res.json(clientGroup);
  } catch (error) {
    console.error("Error updating client group:", error);
    res.status(500).json({ message: "Failed to update client group" });
  }
});
router13.delete("/client-groups/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await clientGroupsStorage.deleteClientGroup(id);
    res.json({ message: "Client group deleted successfully" });
  } catch (error) {
    console.error("Error deleting client group:", error);
    res.status(500).json({ message: "Failed to delete client group" });
  }
});
var legacy_default = router13;

// server/routes/middleware.ts
var apiLogger = (req, res, next) => {
  console.log(`\u{1F50D} API Route called: ${req.method} ${req.originalUrl}`);
  res.setHeader("Content-Type", "application/json");
  next();
};
var errorHandler = (error, req, res, next) => {
  console.error("API Error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message
  });
};
var notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl
  });
};

// server/routes/index.ts
var router14 = express14.Router();
router14.use(apiLogger);
router14.use("/auth", auth_default);
router14.use("/mobile", mobile_default);
router14.use("/clients", clients_default);
router14.use("/trips", trips_default);
router14.use("/drivers", drivers_default);
router14.use("/corporate", corporate_default);
router14.use("/locations", locations_default);
router14.use("/vehicles", vehicles_default);
router14.use("/calendar", calendar_default);
router14.use("/notifications", notifications_default);
router14.use("/dashboard", dashboard_default);
router14.use("/bulk", bulk_default);
router14.use("/", legacy_default);
router14.use(errorHandler);
router14.use(notFoundHandler);
var routes_default = router14;

// server/file-storage-routes.ts
import * as express15 from "express";
import multer from "multer";

// server/file-storage-helpers.ts
async function uploadFile(params, authenticatedUser) {
  try {
    const { file, category, programId, locationId, clientId, tripId, driverId, vehicleId, userId, uploadReason, isHipaaProtected = false } = params;
    const validationResult = validateFileType(file, category);
    if (!validationResult.valid) {
      return { success: false, error: validationResult.error };
    }
    let user;
    if (authenticatedUser) {
      user = authenticatedUser;
      console.log("\u{1F50D} Using authenticatedUser:", authenticatedUser);
    } else {
      const { data: { user: authUser }, error: authError } = await supabase3.auth.getUser();
      if (authError || !authUser) {
        return { success: false, error: "Authentication required" };
      }
      user = authUser;
    }
    const filePath = await generateFilePath(category, {
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId
    }, file.name);
    const bucketId = getBucketForCategory(category);
    const { data: uploadData, error: uploadError } = await supabase3.storage.from(bucketId).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });
    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }
    const { data: metadataData, error: metadataError } = await supabase3.from("file_metadata").insert({
      bucket_id: bucketId,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      file_category: category,
      is_hipaa_protected: isHipaaProtected,
      program_id: programId,
      location_id: locationId,
      client_id: clientId,
      trip_id: tripId,
      driver_id: driverId,
      vehicle_id: vehicleId,
      user_id: userId,
      uploaded_by: authenticatedUser ? authenticatedUser.userId : user.id,
      upload_reason: uploadReason
    }).select().single();
    if (metadataError) {
      await supabase3.storage.from(bucketId).remove([filePath]);
      return { success: false, error: `Metadata creation failed: ${metadataError.message}` };
    }
    await logFileAccess(metadataData.id, user.id, "upload");
    return { success: true, fileMetadata: metadataData };
  } catch (error) {
    return { success: false, error: `Upload error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
async function uploadFiles(files, authenticatedUser) {
  const results = await Promise.all(
    files.map((file) => uploadFile(file, authenticatedUser))
  );
  const allSuccessful = results.every((result) => result.success);
  return {
    success: allSuccessful,
    results
  };
}
async function getFileDownloadUrl(fileId) {
  try {
    const { data: { user }, error: authError } = await supabase3.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }
    const { data: canAccess, error: accessError } = await supabase3.rpc("can_user_access_file", {
      user_id_param: user.id,
      file_id_param: fileId
    });
    if (accessError || !canAccess) {
      return { success: false, error: "Access denied" };
    }
    const { data: fileMetadata, error: metadataError } = await supabase3.from("file_metadata").select("bucket_id, file_path").eq("id", fileId).single();
    if (metadataError || !fileMetadata) {
      return { success: false, error: "File not found" };
    }
    const { data: urlData, error: urlError } = await supabase3.storage.from(fileMetadata.bucket_id).createSignedUrl(fileMetadata.file_path, 3600);
    if (urlError || !urlData?.signedUrl) {
      return { success: false, error: "Failed to generate download URL" };
    }
    await logFileAccess(fileId, user.id, "download");
    return { success: true, url: urlData.signedUrl };
  } catch (error) {
    return { success: false, error: `Download error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
async function getFilesForEntity(params) {
  try {
    const { programId, locationId, clientId, tripId, driverId, vehicleId, category, limit = 50, offset = 0 } = params;
    let query = supabase3.from("file_metadata").select("*").order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (programId) query = query.eq("program_id", programId);
    if (locationId) query = query.eq("location_id", locationId);
    if (clientId) query = query.eq("client_id", clientId);
    if (tripId) query = query.eq("trip_id", tripId);
    if (driverId) query = query.eq("driver_id", driverId);
    if (vehicleId) query = query.eq("vehicle_id", vehicleId);
    if (category) query = query.eq("file_category", category);
    const { data: files, error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, files: files || [] };
  } catch (error) {
    return { success: false, error: `Query error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
async function getFilesByCategory(category) {
  try {
    const { data: files, error } = await supabase3.from("file_metadata").select("*").eq("file_category", category).order("created_at", { ascending: false });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, files: files || [] };
  } catch (error) {
    return { success: false, error: `Query error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
async function updateFileMetadata(fileId, updates) {
  try {
    const { data: fileMetadata, error } = await supabase3.from("file_metadata").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", fileId).select().single();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, fileMetadata };
  } catch (error) {
    return { success: false, error: `Update error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
async function deleteFile(fileId) {
  try {
    const { data: { user }, error: authError } = await supabase3.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }
    const { data: fileMetadata, error: metadataError } = await supabase3.from("file_metadata").select("bucket_id, file_path, uploaded_by").eq("id", fileId).single();
    if (metadataError || !fileMetadata) {
      return { success: false, error: "File not found" };
    }
    const { data: userData, error: userError } = await supabase3.from("users").select("role").eq("user_id", user.id).single();
    if (userError || !userData) {
      return { success: false, error: "User not found" };
    }
    if (!["super_admin", "corporate_admin"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions to delete file" };
    }
    const { error: storageError } = await supabase3.storage.from(fileMetadata.bucket_id).remove([fileMetadata.file_path]);
    if (storageError) {
      return { success: false, error: `Storage deletion failed: ${storageError.message}` };
    }
    const { error: deleteError } = await supabase3.from("file_metadata").delete().eq("id", fileId);
    if (deleteError) {
      return { success: false, error: `Metadata deletion failed: ${deleteError.message}` };
    }
    await logFileAccess(fileId, user.id, "delete");
    return { success: true };
  } catch (error) {
    return { success: false, error: `Delete error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
async function getFilesNearingRetention(daysAhead = 30) {
  try {
    const { data: files, error } = await supabase3.rpc("get_files_nearing_retention", { days_ahead: daysAhead });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, files: files || [] };
  } catch (error) {
    return { success: false, error: `Query error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
async function archiveExpiredFiles() {
  try {
    const { data: result, error } = await supabase3.rpc("archive_expired_files");
    if (error) {
      return { success: false, error: error.message };
    }
    const { archived_count, archived_files } = result[0];
    return {
      success: true,
      archivedCount: archived_count,
      archivedFiles: archived_files
    };
  } catch (error) {
    return { success: false, error: `Archive error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
async function logFileAccess(fileId, userId, action, ipAddress, userAgent) {
  try {
    await supabase3.rpc("log_file_access", {
      file_id_param: fileId,
      user_id_param: userId,
      action_param: action,
      ip_address_param: ipAddress,
      user_agent_param: userAgent
    });
  } catch (error) {
    console.error("Failed to log file access:", error);
  }
}
async function getFileAccessLog(fileId) {
  try {
    const { data: logs, error } = await supabase3.from("file_access_audit").select("*").eq("file_id", fileId).order("accessed_at", { ascending: false });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, logs: logs || [] };
  } catch (error) {
    return { success: false, error: `Query error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
function validateFileType(file, category) {
  const allowedTypes = {
    intake_form: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    trip_photo: ["image/jpeg", "image/png", "image/heic", "image/webp"],
    driver_license: ["image/jpeg", "image/png", "application/pdf"],
    facility_contract: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    vehicle_maintenance: ["application/pdf", "image/jpeg", "image/png"],
    incident_report: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    client_document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    insurance_document: ["application/pdf", "image/jpeg", "image/png"],
    inspection_report: ["application/pdf", "image/jpeg", "image/png"],
    signature: ["image/jpeg", "image/png", "image/webp"],
    other: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"]
  };
  const allowedMimeTypes = allowedTypes[category] || allowedTypes.other;
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed for category ${category}`
    };
  }
  return { valid: true };
}
function getBucketForCategory(category) {
  const photoCategories = ["trip_photo", "signature"];
  return photoCategories.includes(category) ? "photos" : "documents";
}
async function generateFilePath(category, entityIds, fileName) {
  const { data, error } = await supabase3.rpc("generate_file_path", {
    category_param: category,
    entity_type: getEntityType(entityIds),
    entity_id: getPrimaryEntityId(entityIds),
    file_name_param: fileName
  });
  if (error) {
    throw new Error(`Failed to generate file path: ${error.message}`);
  }
  return data;
}
function getEntityType(entityIds) {
  if (entityIds.tripId) return "trip";
  if (entityIds.driverId) return "driver";
  if (entityIds.vehicleId) return "vehicle";
  if (entityIds.clientId) return "client";
  if (entityIds.locationId) return "location";
  if (entityIds.programId) return "program";
  if (entityIds.userId) return "user";
  return "misc";
}
function getPrimaryEntityId(entityIds) {
  return entityIds.tripId || entityIds.driverId || entityIds.vehicleId || entityIds.clientId || entityIds.locationId || entityIds.programId || entityIds.userId || "unknown";
}
async function canUserAccessFile(fileId) {
  try {
    const { data: { user }, error: authError } = await supabase3.auth.getUser();
    if (authError || !user) return false;
    const { data: canAccess, error } = await supabase3.rpc("can_user_access_file", {
      user_id_param: user.id,
      file_id_param: fileId
    });
    return !error && canAccess === true;
  } catch (error) {
    return false;
  }
}
async function getUserAccessiblePrograms() {
  try {
    const { data: { user }, error: authError } = await supabase3.auth.getUser();
    if (authError || !user) return [];
    const { data: programs, error } = await supabase3.rpc("get_user_accessible_programs", {
      user_id_param: user.id
    });
    return error ? [] : programs?.map((p) => p.program_id) || [];
  } catch (error) {
    return [];
  }
}
async function getUserAccessibleLocations() {
  try {
    const { data: { user }, error: authError } = await supabase3.auth.getUser();
    if (authError || !user) return [];
    const { data: locations, error } = await supabase3.rpc("get_user_accessible_locations", {
      user_id_param: user.id
    });
    return error ? [] : locations?.map((l) => l.location_id) || [];
  } catch (error) {
    return [];
  }
}
var fileStorageHelpers = {
  // Upload functions
  uploadFile,
  uploadFiles,
  // Retrieval functions
  getFileDownloadUrl,
  getFilesForEntity,
  getFilesByCategory,
  // Management functions
  updateFileMetadata,
  deleteFile,
  // Retention functions
  getFilesNearingRetention,
  archiveExpiredFiles,
  // Audit functions
  logFileAccess,
  getFileAccessLog,
  // Utility functions
  canUserAccessFile,
  getUserAccessiblePrograms,
  getUserAccessibleLocations
};

// server/file-storage-routes.ts
var router15 = express15.Router();
console.log("\u{1F50D} File storage routes module loaded");
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/webp",
      "text/plain"
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});
router15.get("/test-auth", requireSupabaseAuth, async (req, res) => {
  console.log("\u{1F50D} Test auth route called");
  console.log("\u{1F50D} User from middleware:", req.user);
  res.json({
    success: true,
    message: "Authentication test successful",
    user: req.user
  });
});
router15.post("/upload", requireSupabaseAuth, upload.single("file"), async (req, res) => {
  try {
    console.log("\u{1F50D} File upload route called");
    console.log("\u{1F50D} User from middleware:", req.user);
    console.log("\u{1F50D} File received:", req.file ? "Yes" : "No");
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const {
      category,
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId,
      uploadReason,
      isHipaaProtected
    } = req.body;
    if (!category) {
      return res.status(400).json({ error: "File category is required" });
    }
    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype
    });
    const uploadParams = {
      file,
      category,
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId,
      uploadReason,
      isHipaaProtected: isHipaaProtected === "true"
    };
    const result = await fileStorageHelpers.uploadFile(uploadParams, req.user);
    if (result.success) {
      res.status(201).json({
        success: true,
        fileMetadata: result.fileMetadata
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.post("/upload-multiple", requireSupabaseAuth, upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }
    const {
      category,
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId,
      uploadReason,
      isHipaaProtected
    } = req.body;
    if (!category) {
      return res.status(400).json({ error: "File category is required" });
    }
    const uploadParams = files.map((file) => ({
      file: new File([file.buffer], file.originalname, { type: file.mimetype }),
      category,
      programId,
      locationId,
      clientId,
      tripId,
      driverId,
      vehicleId,
      userId,
      uploadReason,
      isHipaaProtected: isHipaaProtected === "true"
    }));
    const result = await fileStorageHelpers.uploadFiles(uploadParams, req.user);
    res.status(201).json(result);
  } catch (error) {
    console.error("Multiple file upload error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.get("/:fileId/download", requireSupabaseAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const result = await fileStorageHelpers.getFileDownloadUrl(fileId);
    if (result.success) {
      res.json({
        success: true,
        downloadUrl: result.url
      });
    } else {
      res.status(403).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("File download error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.get("/entity/:entityType/:entityId", requireSupabaseAuth, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { category, limit = "50", offset = "0" } = req.query;
    let params = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    switch (entityType) {
      case "program":
        params.programId = entityId;
        break;
      case "location":
        params.locationId = entityId;
        break;
      case "client":
        params.clientId = entityId;
        break;
      case "trip":
        params.tripId = entityId;
        break;
      case "driver":
        params.driverId = entityId;
        break;
      case "vehicle":
        params.vehicleId = entityId;
        break;
      case "user":
        params.userId = entityId;
        break;
      default:
        return res.status(400).json({ error: "Invalid entity type" });
    }
    if (category) {
      params.category = category;
    }
    const result = await fileStorageHelpers.getFilesForEntity(params);
    if (result.success) {
      res.json({
        success: true,
        files: result.files
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Get files for entity error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.get("/category/:category", requireSupabaseAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const result = await fileStorageHelpers.getFilesByCategory(category);
    if (result.success) {
      res.json({
        success: true,
        files: result.files
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Get files by category error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.put("/:fileId", requireSupabaseAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const updates = req.body;
    const result = await fileStorageHelpers.updateFileMetadata(fileId, updates);
    if (result.success) {
      res.json({
        success: true,
        fileMetadata: result.fileMetadata
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Update file metadata error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.delete("/:fileId", requireSupabaseAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const result = await fileStorageHelpers.deleteFile(fileId);
    if (result.success) {
      res.json({
        success: true,
        message: "File deleted successfully"
      });
    } else {
      res.status(403).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.get("/retention/nearing-expiry", requireSupabaseAuth, async (req, res) => {
  try {
    const { daysAhead = "30" } = req.query;
    const result = await fileStorageHelpers.getFilesNearingRetention(parseInt(daysAhead));
    if (result.success) {
      res.json({
        success: true,
        files: result.files
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Get files nearing retention error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.post("/retention/archive-expired", requireSupabaseAuth, async (req, res) => {
  try {
    const result = await fileStorageHelpers.archiveExpiredFiles();
    if (result.success) {
      res.json({
        success: true,
        archivedCount: result.archivedCount,
        archivedFiles: result.archivedFiles
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Archive expired files error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.get("/:fileId/audit-log", requireSupabaseAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const result = await fileStorageHelpers.getFileAccessLog(fileId);
    if (result.success) {
      res.json({
        success: true,
        logs: result.logs
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Get file audit log error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.get("/user/accessible-programs", requireSupabaseAuth, async (req, res) => {
  try {
    const programs = await fileStorageHelpers.getUserAccessiblePrograms();
    res.json({
      success: true,
      programs
    });
  } catch (error) {
    console.error("Get accessible programs error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.get("/user/accessible-locations", requireSupabaseAuth, async (req, res) => {
  try {
    const locations = await fileStorageHelpers.getUserAccessibleLocations();
    res.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error("Get accessible locations error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.get("/user/can-access/:fileId", requireSupabaseAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const canAccess = await fileStorageHelpers.canUserAccessFile(fileId);
    res.json({
      success: true,
      canAccess
    });
  } catch (error) {
    console.error("Check file access error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router15.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 50MB."
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Maximum is 10 files per request."
      });
    }
  }
  if (error.message === "Invalid file type") {
    return res.status(400).json({
      success: false,
      error: "Invalid file type. Allowed types: PDF, DOC, DOCX, JPEG, PNG, HEIC, WEBP"
    });
  }
  next(error);
});
var file_storage_routes_default = router15;

// server/index.ts
import session from "express-session";
import bcrypt2 from "bcrypt";

// server/websocket.ts
import { WebSocketServer, WebSocket } from "ws";
var RealtimeWebSocketServer = class {
  wss;
  clients = /* @__PURE__ */ new Map();
  heartbeatInterval;
  constructor(server) {
    console.log("\u{1F50C} Creating WebSocket server...");
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      verifyClient: this.verifyClient.bind(this)
    });
    console.log("\u{1F50C} WebSocket server created successfully");
    this.setupEventHandlers();
    this.startHeartbeat();
  }
  async verifyClient(info) {
    try {
      console.log("\u{1F50D} WebSocket verification started");
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get("token");
      console.log("\u{1F50D} Token received:", token ? token.substring(0, 20) + "..." : "null");
      if (!token) {
        console.log("\u274C WebSocket connection rejected: No token provided");
        return false;
      }
      let user;
      if (token.startsWith("eyJ")) {
        user = await verifySupabaseToken(token);
      } else {
        const { createClient: createClient6 } = await import("@supabase/supabase-js");
        const supabaseAdmin2 = createClient6(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data: dbUser, error } = await supabaseAdmin2.from("users").select("*").eq("auth_user_id", token).single();
        if (error || !dbUser) {
          console.log("\u274C WebSocket connection rejected: User not found");
          return false;
        }
        user = {
          userId: dbUser.user_id,
          email: dbUser.email,
          role: dbUser.role,
          primaryProgramId: dbUser.primary_program_id,
          corporateClientId: dbUser.corporate_client_id
        };
      }
      if (!user) {
        console.log("\u274C WebSocket connection rejected: Invalid token");
        return false;
      }
      info.req.user = user;
      console.log("\u2705 WebSocket connection verified for user:", user.email, user.role);
      return true;
    } catch (error) {
      console.error("\u274C WebSocket verification error:", error);
      return false;
    }
  }
  setupEventHandlers() {
    this.wss.on("connection", async (ws, req) => {
      console.log("\u{1F50C} WebSocket connection event triggered");
      let user = req.user;
      if (!user) {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const token = url.searchParams.get("token");
          if (token) {
            console.log("\u{1F50D} Re-verifying token in connection handler...");
            if (token.startsWith("eyJ")) {
              user = await verifySupabaseToken(token);
            } else {
              const { createClient: createClient6 } = await import("@supabase/supabase-js");
              const supabaseAdmin2 = createClient6(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
              );
              const { data: dbUser, error } = await supabaseAdmin2.from("users").select("*").eq("auth_user_id", token).single();
              if (!error && dbUser) {
                user = {
                  userId: dbUser.user_id,
                  email: dbUser.email,
                  role: dbUser.role,
                  primaryProgramId: dbUser.primary_program_id,
                  corporateClientId: dbUser.corporate_client_id
                };
              }
            }
          }
        } catch (error) {
          console.error("\u274C Error re-verifying token in connection handler:", error);
        }
      }
      if (!user) {
        console.log("\u274C WebSocket connection rejected: No user in request");
        ws.close(1008, "Authentication failed");
        return;
      }
      console.log(`\u{1F50C} Setting up WebSocket for user: ${user.email} (${user.role})`);
      ws.userId = user.userId;
      ws.role = user.role;
      ws.programId = user.primaryProgramId;
      ws.corporateClientId = user.corporateClientId;
      ws.isAlive = true;
      this.clients.set(user.userId, ws);
      console.log(`\u{1F50C} WebSocket connected: ${user.email} (${user.role})`);
      ws.on("pong", () => {
        ws.isAlive = true;
      });
      ws.on("close", (code, reason) => {
        this.clients.delete(user.userId);
        console.log(`\u{1F50C} WebSocket disconnected: ${user.email} (${code}: ${reason})`);
      });
      ws.on("error", (error) => {
        console.error(`\u274C WebSocket error for ${user.email}:`, error);
        this.clients.delete(user.userId);
      });
      try {
        ws.send(JSON.stringify({
          type: "connection",
          message: "Connected to real-time updates",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }));
        console.log(`\u{1F4E8} Welcome message sent to ${user.email}`);
      } catch (error) {
        console.error(`\u274C Error sending welcome message to ${user.email}:`, error);
      }
    });
  }
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          console.log("\u{1F480} Removing dead WebSocket connection");
          ws.terminate();
          this.clients.delete(ws.userId);
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 3e4);
  }
  // Broadcast to all clients
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  // Broadcast to specific user
  sendToUser(userId, data) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
  // Broadcast to users by role
  broadcastToRole(role, data) {
    const message = JSON.stringify(data);
    this.clients.forEach((ws) => {
      if (ws.role === role && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  // Broadcast to users by program
  broadcastToProgram(programId, data) {
    const message = JSON.stringify(data);
    this.clients.forEach((ws) => {
      if (ws.programId === programId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  // Broadcast to users by corporate client
  broadcastToCorporateClient(corporateClientId, data) {
    const message = JSON.stringify(data);
    this.clients.forEach((ws) => {
      if (ws.corporateClientId === corporateClientId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  // Get connected clients info
  getConnectedClients() {
    return Array.from(this.clients.values()).map((ws) => ({
      userId: ws.userId,
      role: ws.role,
      programId: ws.programId,
      corporateClientId: ws.corporateClientId,
      isAlive: ws.isAlive
    }));
  }
  // Cleanup
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }
};

// server/index.ts
console.log("\u{1F50D} Server environment check:");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "Set" : "Missing");
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "Set" : "Missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}
var app = express16();
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.get("host");
  const isProduction2 = process.env.NODE_ENV === "production";
  const allowedOrigins = isProduction2 ? [
    `https://${host}`,
    // Current domain
    process.env.REPLIT_DOMAIN,
    ...host ? [`https://${host}`] : []
  ].filter(Boolean) : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5177", "http://localhost:8081", "http://localhost:8082", "http://localhost:19006", "http://192.168.12.215:8082", "exp://192.168.12.215:8082"];
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (!origin && !isProduction2) {
    res.header("Access-Control-Allow-Origin", "http://localhost:5174");
  } else if (!origin && isProduction2 && host) {
    res.header("Access-Control-Allow-Origin", `https://${host}`);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control");
  res.header("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express16.json({ limit: "10mb" }));
app.use(express16.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
var isProduction = process.env.NODE_ENV === "production";
var sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.error("SESSION_SECRET environment variable is required");
  process.exit(1);
}
app.use(session({
  secret: sessionSecret,
  resave: false,
  // Don't save session if not modified
  saveUninitialized: false,
  // Don't create empty sessions
  cookie: {
    secure: false,
    // HTTP for development
    maxAge: 4 * 60 * 60 * 1e3,
    // 4 hours
    httpOnly: false,
    // Allow JavaScript access for session debugging
    sameSite: "lax",
    path: "/",
    domain: void 0
    // Let Express handle domain automatically
  },
  name: "connect.sid",
  rolling: false
  // Don't reset maxAge on every request
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
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
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      console.log(logLine);
    }
  });
  next();
});
(async () => {
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });
  app.get("/api/ws-test", (req, res) => {
    const wsServer2 = getWebSocketServer();
    if (wsServer2) {
      res.json({
        status: "WebSocket server is running",
        connectedClients: wsServer2.getConnectedClients().length
      });
    } else {
      res.json({
        status: "WebSocket server not initialized",
        connectedClients: 0
      });
    }
  });
  app.get("/api/permissions/all", async (req, res) => {
    try {
      const permissions = [
        { role: "super_admin", permission: "VIEW_TRIPS", resource: "*", corporate_client_id: null, program_id: null },
        { role: "corporate_admin", permission: "VIEW_TRIPS", resource: "corporate", corporate_client_id: null, program_id: null },
        { role: "program_admin", permission: "VIEW_TRIPS", resource: "program", corporate_client_id: null, program_id: null },
        { role: "program_user", permission: "VIEW_TRIPS", resource: "program", corporate_client_id: null, program_id: null },
        { role: "driver", permission: "VIEW_TRIPS", resource: "assigned", corporate_client_id: null, program_id: null }
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
  app.post("/api/users", requireSupabaseAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Super admin access required" });
      }
      console.log("Creating user with data:", req.body);
      const nameSlug = req.body.userName.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
      let userIdSuffix;
      if (req.body.role && req.body.role.endsWith("_owner")) {
        const companyPrefix = req.body.role.replace("_owner", "");
        userIdSuffix = `${companyPrefix}_executive_001`;
      } else {
        const programSlug = req.body.programId?.replace("_", "_") || "default";
        userIdSuffix = `${programSlug}_001`;
      }
      const newUserId = `user_${nameSlug}_${userIdSuffix}`;
      const hashedPassword = await bcrypt2.hash(req.body.password, 12);
      const userData = {
        user_id: newUserId,
        user_name: req.body.userName || req.body.email,
        email: req.body.email,
        password_hash: hashedPassword,
        role: req.body.role,
        primary_program_id: req.body.programId || req.body.primaryProgramId,
        authorized_programs: req.body.authorizedPrograms || [req.body.programId || req.body.primaryProgramId],
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const newUser = await usersStorage.createUser(userData);
      console.log("User created successfully:", newUser.email);
      if (req.body.role === "driver") {
        try {
          const driverData = {
            id: `driver_${newUser.user_id}_${Date.now()}`,
            user_id: newUser.user_id,
            license_number: "TBD-" + Date.now().toString().slice(-6),
            // Temporary license number
            vehicle_info: "Vehicle TBD",
            is_active: true,
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          const { createClient: createClient6 } = await import("@supabase/supabase-js");
          const supabase5 = createClient6(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );
          const { data: newDriver, error: driverError } = await supabase5.from("drivers").insert(driverData).select().single();
          if (driverError) {
            console.error("Driver profile creation error:", driverError);
          } else {
            console.log("Driver profile created successfully for:", newUser.email);
          }
        } catch (driverCreationError) {
          console.error("Error creating driver profile:", driverCreationError);
        }
      }
      const { password_hash, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create user", error: errorMessage });
    }
  });
  app.use("/uploads", express16.static("public/uploads", {
    setHeaders: (res, path) => {
      if (path.endsWith(".svg")) {
        res.setHeader("Content-Type", "image/svg+xml");
      } else if (path.endsWith(".webp")) {
        res.setHeader("Content-Type", "image/webp");
      } else if (path.endsWith(".png")) {
        res.setHeader("Content-Type", "image/png");
      } else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
        res.setHeader("Content-Type", "image/jpeg");
      }
      res.setHeader("Cache-Control", "public, max-age=31536000");
    }
  }));
  app.get("/api/debug", (req, res) => {
    console.log("\u{1F50D} Debug endpoint called");
    console.log("Headers:", req.headers);
    console.log("Auth header:", req.headers.authorization);
    res.json({
      message: "Debug endpoint working",
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization
    });
  });
  app.use("/api", routes_default);
  console.log("\u{1F50D} API routes registered");
  app.use("/api/files", file_storage_routes_default);
  console.log("\u{1F50D} File storage routes registered");
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });
  const server = createServer(app);
  const wsServer = new RealtimeWebSocketServer(server);
  setWebSocketServer(wsServer);
  console.log("\u{1F50C} WebSocket server initialized on /ws");
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    app.use(express16.static("client/dist"));
  } else {
    app.use(express16.static("client/dist"));
  }
  const port = 8081;
  server.listen(port, () => {
    console.log(`\u{1F680} HALCYON NMT Server running on port ${port}`);
  });
})();
