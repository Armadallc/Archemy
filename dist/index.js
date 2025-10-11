// server/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";

// server/api-routes.ts
import express from "express";

// server/minimal-supabase.ts
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}
var supabase = createClient(supabaseUrl, supabaseKey);
var corporateClientsStorage = {
  async getAllCorporateClients() {
    const { data, error } = await supabase.from("corporate_clients").select("*").eq("is_active", true);
    if (error) throw error;
    return data || [];
  },
  async getCorporateClient(id) {
    const { data, error } = await supabase.from("corporate_clients").select("*").eq("id", id).single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },
  async createCorporateClient(corporateClient) {
    const { data, error } = await supabase.from("corporate_clients").insert(corporateClient).select().single();
    if (error) throw error;
    return data;
  },
  async updateCorporateClient(id, updates) {
    const { data, error } = await supabase.from("corporate_clients").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteCorporateClient(id) {
    const { data, error } = await supabase.from("corporate_clients").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var programsStorage = {
  async getAllPrograms() {
    const { data, error } = await supabase.from("programs").select(`
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
    const { data, error } = await supabase.from("programs").select(`
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
    const { data, error } = await supabase.from("programs").select(`
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
    const { data, error } = await supabase.from("programs").insert(program).select().single();
    if (error) throw error;
    return data;
  },
  async updateProgram(id, updates) {
    const { data, error } = await supabase.from("programs").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteProgram(id) {
    const { data, error } = await supabase.from("programs").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var locationsStorage = {
  async getAllLocations() {
    const { data, error } = await supabase.from("locations").select(`
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
    const { data, error } = await supabase.from("locations").select(`
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
    const { data, error } = await supabase.from("locations").select(`
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
    const { data, error } = await supabase.from("locations").insert(location).select().single();
    if (error) throw error;
    return data;
  },
  async updateLocation(id, updates) {
    const { data, error } = await supabase.from("locations").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteLocation(id) {
    const { data, error } = await supabase.from("locations").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var usersStorage = {
  async getAllUsers() {
    const { data, error } = await supabase.from("users").select(`
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
    const { data, error } = await supabase.from("users").select(`
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
    const { data, error } = await supabase.from("users").select(`
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
    const { data, error } = await supabase.from("users").select(`
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
    const { data, error } = await supabase.from("users").select(`
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
    const { data, error } = await supabase.from("users").insert(user).select().single();
    if (error) throw error;
    return data;
  },
  async updateUser(userId, updates) {
    const { data, error } = await supabase.from("users").update(updates).eq("user_id", userId).select().single();
    if (error) throw error;
    return data;
  },
  async deleteUser(userId) {
    const { data, error } = await supabase.from("users").delete().eq("user_id", userId);
    if (error) throw error;
    return data;
  }
};
var driversStorage = {
  async getAllDrivers() {
    const { data, error } = await supabase.from("drivers").select(`
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
    const { data, error } = await supabase.from("drivers").select(`
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
    const { data, error } = await supabase.from("drivers").select(`
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
    const { data, error } = await supabase.from("drivers").insert(driver).select().single();
    if (error) throw error;
    return data;
  },
  async updateDriver(id, updates) {
    const { data, error } = await supabase.from("drivers").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteDriver(id) {
    const { data, error } = await supabase.from("drivers").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var clientsStorage = {
  async getAllClients() {
    const { data, error } = await supabase.from("clients").select(`
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
    const { data, error } = await supabase.from("clients").select(`
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
    const { data, error } = await supabase.from("clients").select(`
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
    const { data, error } = await supabase.from("clients").select(`
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
    const { data, error } = await supabase.from("clients").insert(client).select().single();
    if (error) throw error;
    return data;
  },
  async updateClient(id, updates) {
    const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteClient(id) {
    const { data, error } = await supabase.from("clients").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  }
};
var tripsStorage = {
  async getAllTrips() {
    const { data, error } = await supabase.from("trips").select(`
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
    const { data, error } = await supabase.from("trips").select(`
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
    const { data, error } = await supabase.from("trips").select(`
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
    const { data, error } = await supabase.from("trips").select(`
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
    const { data, error } = await supabase.from("trips").insert(trip).select().single();
    if (error) throw error;
    return data;
  },
  async updateTrip(id, updates) {
    const { data, error } = await supabase.from("trips").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteTrip(id) {
    const { data, error } = await supabase.from("trips").delete().eq("id", id);
    if (error) throw error;
    return data;
  }
};
var clientGroupsStorage = {
  async getAllClientGroups() {
    const { data, error } = await supabase.from("client_groups").select(`
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
  async getClientGroup(id) {
    const { data, error } = await supabase.from("client_groups").select(`
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
    const { data, error } = await supabase.from("client_groups").select(`
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
  async createClientGroup(clientGroup) {
    const { data, error } = await supabase.from("client_groups").insert(clientGroup).select().single();
    if (error) throw error;
    return data;
  },
  async updateClientGroup(id, updates) {
    const { data, error } = await supabase.from("client_groups").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteClientGroup(id) {
    const { data, error } = await supabase.from("client_groups").update({ is_active: false }).eq("id", id);
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

// server/db.ts
import "dotenv/config";
import { createClient as createClient2 } from "@supabase/supabase-js";
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  );
}
console.log("\u{1F50D} Connecting to Supabase:", process.env.SUPABASE_URL);
var supabase2 = createClient2(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase2.from("users").select("count", { count: "exact", head: true }).then(({ count, error }) => {
  if (error) {
    console.log("\u274C Supabase connection failed:", error.message);
  } else {
    console.log("\u2705 Supabase connected, users count:", count);
  }
});

// server/trip-categories-storage.ts
var tripCategoriesStorage = {
  async getAllTripCategories() {
    const { data, error } = await supabase2.from("trip_categories").select(`
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
    const { data, error } = await supabase2.from("trip_categories").select(`
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
    const { data, error } = await supabase2.from("trip_categories").select(`
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
    const { data, error } = await supabase2.from("trip_categories").insert({
      ...category,
      id: `trip_category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateTripCategory(id, updates) {
    const { data, error } = await supabase2.from("trip_categories").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteTripCategory(id) {
    const { data, error } = await supabase2.from("trip_categories").update({ is_active: false }).eq("id", id);
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

// server/enhanced-trips-storage.ts
var enhancedTripsStorage = {
  async getAllTrips() {
    const { data, error } = await supabase2.from("trips").select(`
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
    const { data, error } = await supabase2.from("trips").select(`
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
    const { data, error } = await supabase2.from("trips").select(`
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
    const { data, error } = await supabase2.from("trips").select(`
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
    const { data, error } = await supabase2.from("trips").select(`
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
    const { data, error } = await supabase2.from("trips").select(`
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
    const { data, error } = await supabase2.from("trips").select(`
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
    const { data, error } = await supabase2.from("trips").insert({
      ...trip,
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateTrip(id, updates) {
    const { data, error } = await supabase2.from("trips").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteTrip(id) {
    const { data, error } = await supabase2.from("trips").delete().eq("id", id);
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
    const { data, error } = await supabase2.from("trips").insert(trips).select();
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
    const { data, error } = await supabase2.from("trips").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
};

// server/driver-schedules-storage.ts
var driverSchedulesStorage = {
  // Driver Schedules
  async getAllDriverSchedules() {
    const { data, error } = await supabase2.from("driver_schedules").select(`
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
    const { data, error } = await supabase2.from("driver_schedules").select(`
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
    const { data, error } = await supabase2.from("driver_schedules").select(`
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
    const { data, error } = await supabase2.from("driver_schedules").select(`
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
    const { data, error } = await supabase2.from("driver_schedules").insert({
      ...schedule,
      id: `driver_schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateDriverSchedule(id, updates) {
    const { data, error } = await supabase2.from("driver_schedules").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteDriverSchedule(id) {
    const { data, error } = await supabase2.from("driver_schedules").delete().eq("id", id);
    if (error) throw error;
    return data;
  },
  // Driver Duty Status
  async getCurrentDutyStatus(driverId) {
    const { data, error } = await supabase2.from("driver_duty_status").select(`
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
    await supabase2.from("driver_duty_status").update({
      ended_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("driver_id", driverId).is("ended_at", null);
    const { data, error } = await supabase2.from("driver_duty_status").insert({
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
    const { data, error } = await supabase2.from("driver_duty_status").select(`
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
    const { data, error } = await supabase2.from("driver_schedules").select(`
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
    const { data, error } = await supabase2.from("trips").select("*").eq("driver_id", driverId).gte("scheduled_pickup_time", startOfDay.toISOString()).lte("scheduled_pickup_time", endOfDay.toISOString()).order("scheduled_pickup_time");
    if (error) throw error;
    return data || [];
  }
};

// server/vehicles-storage.ts
var vehiclesStorage = {
  // Vehicles
  async getAllVehicles() {
    const { data, error } = await supabase2.from("vehicles").select(`
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
    const { data, error } = await supabase2.from("vehicles").select(`
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
    const { data, error } = await supabase2.from("vehicles").select(`
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
    let query = supabase2.from("vehicles").select(`
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
    const { data, error } = await supabase2.from("vehicles").insert({
      ...vehicle,
      id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateVehicle(id, updates) {
    const { data, error } = await supabase2.from("vehicles").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteVehicle(id) {
    const { data, error } = await supabase2.from("vehicles").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return data;
  },
  // Vehicle Maintenance
  async getVehicleMaintenance(vehicleId) {
    const { data, error } = await supabase2.from("vehicle_maintenance").select(`
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
    const { data, error } = await supabase2.from("vehicle_maintenance").insert({
      ...maintenance,
      id: `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  },
  async updateMaintenanceRecord(id, updates) {
    const { data, error } = await supabase2.from("vehicle_maintenance").update({
      ...updates,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  // Vehicle Assignments
  async assignVehicleToDriver(vehicleId, driverId, programId, notes) {
    await supabase2.from("vehicles").update({ current_driver_id: null }).eq("id", vehicleId);
    const { data, error } = await supabase2.from("vehicle_assignments").insert({
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
    await supabase2.from("vehicles").update({ current_driver_id: driverId }).eq("id", vehicleId);
    return data;
  },
  async unassignVehicleFromDriver(vehicleId, driverId) {
    const { data, error } = await supabase2.from("vehicle_assignments").update({
      unassigned_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("vehicle_id", vehicleId).eq("driver_id", driverId).is("unassigned_at", null).select().single();
    if (error) throw error;
    await supabase2.from("vehicles").update({ current_driver_id: null }).eq("id", vehicleId);
    return data;
  },
  async getVehicleAssignments(vehicleId) {
    const { data, error } = await supabase2.from("vehicle_assignments").select(`
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
    const { data, error } = await supabase2.from("vehicle_assignments").select(`
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

// server/mobile-api.ts
var mobileApi = {
  // Driver authentication and profile
  async getDriverProfile(driverId) {
    try {
      const { data: driver, error } = await supabase2.from("drivers").select(`
          *,
          users:user_id (
            user_name,
            email,
            avatar_url
          ),
          vehicles:current_vehicle_id (
            id,
            make,
            model,
            year,
            license_plate,
            color
          )
        `).eq("id", driverId).single();
      if (error) throw error;
      const currentStatus = await driverSchedulesStorage.getCurrentDutyStatus(driverId);
      const lastLocation = await this.getLastLocation(driverId);
      return {
        id: driver.id,
        user_id: driver.user_id,
        user_name: driver.users?.user_name || "Unknown",
        email: driver.users?.email || "",
        phone: driver.phone,
        avatar_url: driver.users?.avatar_url,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        emergency_contact: driver.emergency_contact,
        vehicle_assignment: driver.vehicles ? {
          id: driver.vehicles.id,
          make: driver.vehicles.make,
          model: driver.vehicles.model,
          year: driver.vehicles.year,
          license_plate: driver.vehicles.license_plate,
          color: driver.vehicles.color
        } : void 0,
        current_status: currentStatus?.status || "off_duty",
        last_location: lastLocation
      };
    } catch (error) {
      console.error("Error fetching driver profile:", error);
      throw error;
    }
  },
  // Update driver profile
  async updateDriverProfile(driverId, updates) {
    try {
      const { data, error } = await supabase2.from("drivers").update({
        phone: updates.phone,
        license_number: updates.license_number,
        license_expiry: updates.license_expiry,
        emergency_contact: updates.emergency_contact,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", driverId).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating driver profile:", error);
      throw error;
    }
  },
  // Get driver's trips for mobile
  async getDriverTrips(driverId, date) {
    try {
      let trips;
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        trips = await enhancedTripsStorage.getTripsByDriver(driverId);
        trips = trips.filter((trip) => {
          const tripDate = new Date(trip.scheduled_pickup_time);
          return tripDate >= startOfDay && tripDate <= endOfDay;
        });
      } else {
        trips = await enhancedTripsStorage.getTripsByDriver(driverId);
      }
      return await Promise.all(trips.map(async (trip) => ({
        id: trip.id,
        client_name: `${trip.client?.first_name || ""} ${trip.client?.last_name || ""}`.trim(),
        pickup_address: trip.pickup_address,
        dropoff_address: trip.dropoff_address,
        scheduled_pickup_time: trip.scheduled_pickup_time,
        scheduled_return_time: trip.scheduled_return_time,
        status: trip.status,
        passenger_count: trip.passenger_count,
        special_requirements: trip.special_requirements,
        notes: trip.notes,
        trip_category: {
          name: trip.trip_category?.name || "Personal",
          color: this.getCategoryColor(trip.trip_category?.name || "Personal")
        },
        client: {
          id: trip.client_id,
          first_name: trip.client?.first_name || "",
          last_name: trip.client?.last_name || "",
          phone: trip.client?.phone,
          address: trip.client?.address
        },
        pickup_location: trip.pickup_location ? {
          name: trip.pickup_location.name,
          address: trip.pickup_location.address
        } : void 0,
        dropoff_location: trip.dropoff_location ? {
          name: trip.dropoff_location.name,
          address: trip.dropoff_location.address
        } : void 0,
        is_group_trip: trip.is_group_trip,
        group_members: trip.is_group_trip ? await this.getGroupMembers(trip.client_group_id) : void 0
      })));
    } catch (error) {
      console.error("Error fetching driver trips:", error);
      throw error;
    }
  },
  // Update trip status from mobile
  async updateTripStatus(tripId, status, actualTimes, driverId) {
    try {
      const trip = await enhancedTripsStorage.updateTripStatus(tripId, status, actualTimes);
      await supabase2.from("trip_status_logs").insert({
        id: `status_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trip_id: tripId,
        driver_id: driverId,
        status,
        actual_times: actualTimes,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      return trip;
    } catch (error) {
      console.error("Error updating trip status:", error);
      throw error;
    }
  },
  // Location tracking
  async updateDriverLocation(driverId, location) {
    try {
      const { data, error } = await supabase2.from("driver_locations").insert({
        id: `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        driver_id: driverId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        address: location.address,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating driver location:", error);
      throw error;
    }
  },
  // Get last known location
  async getLastLocation(driverId) {
    try {
      const { data, error } = await supabase2.from("driver_locations").select("latitude, longitude, timestamp").eq("driver_id", driverId).eq("is_active", true).order("timestamp", { ascending: false }).limit(1).single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error fetching last location:", error);
      return null;
    }
  },
  // Update duty status
  async updateDutyStatus(driverId, status, location, notes) {
    try {
      const dutyStatus = await driverSchedulesStorage.updateDutyStatus(
        driverId,
        status,
        location,
        notes
      );
      if (status === "on_duty" && location) {
        await this.updateDriverLocation(driverId, location);
      }
      return dutyStatus;
    } catch (error) {
      console.error("Error updating duty status:", error);
      throw error;
    }
  },
  // Offline data sync
  async getOfflineData(driverId) {
    try {
      const profile = await this.getDriverProfile(driverId);
      const trips = await this.getDriverTrips(driverId);
      const pendingUpdates = await this.getPendingUpdates(driverId);
      return {
        trips,
        profile,
        last_sync: (/* @__PURE__ */ new Date()).toISOString(),
        pending_updates: pendingUpdates
      };
    } catch (error) {
      console.error("Error getting offline data:", error);
      throw error;
    }
  },
  // Sync pending updates when back online
  async syncPendingUpdates(driverId, updates) {
    try {
      const results = [];
      for (const update of updates) {
        try {
          switch (update.type) {
            case "trip_status":
              await this.updateTripStatus(update.data.tripId, update.data.status, update.data.actualTimes, driverId);
              break;
            case "location":
              await this.updateDriverLocation(driverId, update.data);
              break;
            case "duty_status":
              await this.updateDutyStatus(driverId, update.data.status, update.data.location, update.data.notes);
              break;
          }
          results.push({ id: update.id, success: true });
        } catch (error) {
          results.push({ id: update.id, success: false, error: error.message });
        }
      }
      return results;
    } catch (error) {
      console.error("Error syncing pending updates:", error);
      throw error;
    }
  },
  // Helper methods
  async getGroupMembers(clientGroupId) {
    if (!clientGroupId) return [];
    try {
      const { data, error } = await supabase2.from("client_group_memberships").select(`
          clients:client_id (
            id,
            first_name,
            last_name,
            phone
          )
        `).eq("client_group_id", clientGroupId);
      if (error) throw error;
      return data?.map((membership) => ({
        id: membership.clients?.id || "",
        name: `${membership.clients?.first_name || ""} ${membership.clients?.last_name || ""}`.trim(),
        phone: membership.clients?.phone
      })) || [];
    } catch (error) {
      console.error("Error fetching group members:", error);
      return [];
    }
  },
  async getPendingUpdates(driverId) {
    try {
      const { data, error } = await supabase2.from("offline_updates").select("*").eq("driver_id", driverId).eq("synced", false).order("created_at");
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching pending updates:", error);
      return [];
    }
  },
  getCategoryColor(category) {
    const colorMap = {
      "Medical": "#3B82F6",
      "Legal": "#EF4444",
      "Personal": "#10B981",
      "Program": "#8B5CF6",
      "12-Step": "#F59E0B",
      "Group": "#06B6D4",
      "Staff": "#6B7280",
      "Carpool": "#84CC16"
    };
    return colorMap[category] || "#6B7280";
  }
};

// server/notification-system.ts
var notificationSystem = {
  // Create notification template
  async createTemplate(template) {
    try {
      const { data, error } = await supabase2.from("notification_templates").insert({
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
      let query = supabase2.from("notification_templates").select("*").eq("is_active", true);
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
      const { data, error } = await supabase2.from("notifications").insert({
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
      const { error } = await supabase2.from("notification_deliveries").insert(deliveries);
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
      const { data: trip, error: tripError } = await supabase2.from("trips").select(`
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
      const { data: driver, error } = await supabase2.from("drivers").select("user_id, users:user_id (user_name, email, phone)").eq("id", driverId).single();
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
        const { data: users, error } = await supabase2.from("users").select("user_id").eq("is_active", true);
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
      const { data: notifications, error } = await supabase2.from("notifications").select(`
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
      await supabase2.from("notifications").update({
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
      await supabase2.from("notifications").update({
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
      const { error } = await supabase2.from("notification_deliveries").update(updates).eq("id", deliveryId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating delivery status:", error);
      throw error;
    }
  },
  // Increment retry count
  async incrementRetryCount(deliveryId) {
    try {
      const { data, error } = await supabase2.from("notification_deliveries").select("retry_count").eq("id", deliveryId).single();
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
      const { data, error } = await supabase2.from("notification_preferences").select("*").eq("user_id", userId);
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
      const { data, error } = await supabase2.from("notification_preferences").upsert({
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

// server/supabase-auth.ts
import { createClient as createClient3 } from "@supabase/supabase-js";
var supabaseUrl2 = process.env.SUPABASE_URL;
var supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase3 = createClient3(supabaseUrl2, supabaseAnonKey);
var supabaseAdmin = createClient3(supabaseUrl2, supabaseServiceKey);
async function verifySupabaseToken(token) {
  try {
    console.log("\u{1F50D} Verifying Supabase token with Supabase...");
    console.log("Token (first 50 chars):", token.substring(0, 50));
    console.log("Supabase URL:", supabaseUrl2);
    console.log("Supabase Anon Key (first 20 chars):", supabaseAnonKey.substring(0, 20));
    const { data: { user }, error } = await supabase3.auth.getUser(token);
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

// server/auth.ts
import bcrypt from "bcrypt";

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
async function createUser(userData) {
  try {
    const hashedPassword = await bcrypt.hash(userData.password || "temp123", 12);
    const { data, error } = await supabase.from("users").insert({
      user_name: userData.user_name,
      email: userData.email,
      password_hash: hashedPassword,
      role: userData.role || "program_user",
      primary_program_id: userData.primary_program_id,
      corporate_client_id: userData.corporate_client_id,
      is_active: true
    }).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}
async function updateUser(userId, updates) {
  try {
    const updateData = { ...updates };
    if (updates.password) {
      updateData.password_hash = await bcrypt.hash(updates.password, 12);
      delete updateData.password;
    }
    const { data, error } = await supabase.from("users").update(updateData).eq("user_id", userId).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}
async function deleteUser(userId) {
  try {
    const { error } = await supabase.from("users").update({ is_active: false }).eq("user_id", userId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// server/upload.ts
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
var uploadsDir = path.join(process.cwd(), "public", "uploads");
var avatarsDir = path.join(uploadsDir, "avatars");
var logosDir = path.join(uploadsDir, "logos");
[uploadsDir, avatarsDir, logosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
var storage = multer.memoryStorage();
var fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};
var upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  }
});
async function processAvatar(buffer, userId) {
  const filename = `avatar-${userId}-${nanoid()}.webp`;
  const filepath = path.join(avatarsDir, filename);
  await sharp(buffer).resize(150, 150, {
    fit: "cover",
    position: "center"
  }).webp({ quality: 85 }).toFile(filepath);
  return `/uploads/avatars/${filename}`;
}
function deleteFile(filePath) {
  try {
    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    const fullPath = path.join(process.cwd(), cleanPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`\u{1F4C1} Deleted file: ${fullPath}`);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

// server/api-routes.ts
var router = express.Router();
router.use((req, res, next) => {
  console.log(`\u{1F50D} API Route called: ${req.method} ${req.originalUrl}`);
  res.setHeader("Content-Type", "application/json");
  next();
});
router.get("/auth/user", requireSupabaseAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { data: user, error } = await supabase2.from("users").select(`
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
router.post("/users", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const userData = req.body;
    const result = await createUser(userData);
    res.json(result);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});
router.get("/users", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
  try {
    const users = await usersStorage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});
router.get("/users/:userId", requireSupabaseAuth, async (req, res) => {
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
router.patch("/users/:userId", requireSupabaseAuth, async (req, res) => {
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
router.delete("/users/:userId", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const { userId } = req.params;
    await deleteUser(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});
router.post("/users/:userId/avatar", requireSupabaseAuth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const { userId } = req.params;
    if (req.user?.userId !== userId && req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const avatarPath = await processAvatar(req.file.buffer, userId);
    const updatedUser = await usersStorage.updateUser(userId, {
      avatar_url: avatarPath,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
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
router.delete("/users/:userId/avatar", requireSupabaseAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.userId !== userId && req.user?.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await usersStorage.getUser(userId);
    if (user?.avatar_url) {
      await deleteFile(user.avatar_url);
    }
    const updatedUser = await usersStorage.updateUser(userId, {
      avatar_url: null,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
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
router.post("/corporate-clients", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const corporateClient = await corporateClientsStorage.createCorporateClient(req.body);
    res.status(201).json(corporateClient);
  } catch (error) {
    console.error("Error creating corporate client:", error);
    res.status(500).json({ message: "Failed to create corporate client" });
  }
});
router.patch("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const corporateClient = await corporateClientsStorage.updateCorporateClient(id, req.body);
    res.json(corporateClient);
  } catch (error) {
    console.error("Error updating corporate client:", error);
    res.status(500).json({ message: "Failed to update corporate client" });
  }
});
router.delete("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await corporateClientsStorage.deleteCorporateClient(id);
    res.json({ message: "Corporate client deleted successfully" });
  } catch (error) {
    console.error("Error deleting corporate client:", error);
    res.status(500).json({ message: "Failed to delete corporate client" });
  }
});
router.get("/programs", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req, res) => {
  try {
    const programs = await programsStorage.getAllPrograms();
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});
router.get("/programs/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req, res) => {
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
router.get("/programs/corporate-client/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_PROGRAMS), async (req, res) => {
  try {
    const { corporateClientId } = req.params;
    const programs = await programsStorage.getProgramsByCorporateClient(corporateClientId);
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs by corporate client:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});
router.post("/programs", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const program = await programsStorage.createProgram(req.body);
    res.status(201).json(program);
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ message: "Failed to create program" });
  }
});
router.patch("/programs/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const program = await programsStorage.updateProgram(id, req.body);
    res.json(program);
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Failed to update program" });
  }
});
router.delete("/programs/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await programsStorage.deleteProgram(id);
    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Failed to delete program" });
  }
});
router.get("/locations", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req, res) => {
  try {
    const locations = await locationsStorage.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});
router.get("/locations/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req, res) => {
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
router.get("/locations/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_LOCATIONS), async (req, res) => {
  try {
    const { programId } = req.params;
    const locations = await locationsStorage.getLocationsByProgram(programId);
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations by program:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});
router.post("/locations", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const location = await locationsStorage.createLocation(req.body);
    res.status(201).json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ message: "Failed to create location" });
  }
});
router.patch("/locations/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationsStorage.updateLocation(id, req.body);
    res.json(location);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
});
router.delete("/locations/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await locationsStorage.deleteLocation(id);
    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ message: "Failed to delete location" });
  }
});
router.get("/clients", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req, res) => {
  try {
    const clients = await clientsStorage.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});
router.get("/clients/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req, res) => {
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
router.get("/clients/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req, res) => {
  try {
    const { programId } = req.params;
    const clients = await clientsStorage.getClientsByProgram(programId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients by program:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});
router.get("/clients/location/:locationId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENTS), async (req, res) => {
  try {
    const { locationId } = req.params;
    const clients = await clientsStorage.getClientsByLocation(locationId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients by location:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});
router.post("/clients", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const client = await clientsStorage.createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ message: "Failed to create client" });
  }
});
router.patch("/clients/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientsStorage.updateClient(id, req.body);
    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ message: "Failed to update client" });
  }
});
router.delete("/clients/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await clientsStorage.deleteClient(id);
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ message: "Failed to delete client" });
  }
});
router.get("/client-groups", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
  try {
    const clientGroups = await clientGroupsStorage.getAllClientGroups();
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});
router.get("/client-groups/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
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
router.get("/client-groups/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_CLIENT_GROUPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching client groups by program:", error);
    res.status(500).json({ message: "Failed to fetch client groups" });
  }
});
router.post("/client-groups", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const clientGroup = await clientGroupsStorage.createClientGroup(req.body);
    res.status(201).json(clientGroup);
  } catch (error) {
    console.error("Error creating client group:", error);
    res.status(500).json({ message: "Failed to create client group" });
  }
});
router.patch("/client-groups/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const clientGroup = await clientGroupsStorage.updateClientGroup(id, req.body);
    res.json(clientGroup);
  } catch (error) {
    console.error("Error updating client group:", error);
    res.status(500).json({ message: "Failed to update client group" });
  }
});
router.delete("/client-groups/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await clientGroupsStorage.deleteClientGroup(id);
    res.json({ message: "Client group deleted successfully" });
  } catch (error) {
    console.error("Error deleting client group:", error);
    res.status(500).json({ message: "Failed to delete client group" });
  }
});
router.get("/drivers", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const drivers = await driversStorage.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});
router.get("/drivers/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
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
router.get("/drivers/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { programId } = req.params;
    const drivers = await driversStorage.getDriversByProgram(programId);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers by program:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});
router.post("/drivers", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const driver = await driversStorage.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    console.error("Error creating driver:", error);
    res.status(500).json({ message: "Failed to create driver" });
  }
});
router.patch("/drivers/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await driversStorage.updateDriver(id, req.body);
    res.json(driver);
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ message: "Failed to update driver" });
  }
});
router.delete("/drivers/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await driversStorage.deleteDriver(id);
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ message: "Failed to delete driver" });
  }
});
router.get("/trips", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const trips = await tripsStorage.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router.get("/trips/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
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
router.get("/trips/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const trips = await tripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by program:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router.get("/trips/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { driverId } = req.params;
    const trips = await tripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips by driver:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router.post("/trips", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const trip = await tripsStorage.createTrip(req.body);
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ message: "Failed to create trip" });
  }
});
router.patch("/trips/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user", "driver"]), async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await tripsStorage.updateTrip(id, req.body);
    res.json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ message: "Failed to update trip" });
  }
});
router.delete("/trips/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await tripsStorage.deleteTrip(id);
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ message: "Failed to delete trip" });
  }
});
router.get("/trip-categories", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const categories = await tripCategoriesStorage.getAllTripCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});
router.get("/trip-categories/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
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
router.get("/trip-categories/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const categories = await tripCategoriesStorage.getTripCategoriesByProgram(programId);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching trip categories by program:", error);
    res.status(500).json({ message: "Failed to fetch trip categories" });
  }
});
router.post("/trip-categories", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const category = await tripCategoriesStorage.createTripCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating trip category:", error);
    res.status(500).json({ message: "Failed to create trip category" });
  }
});
router.patch("/trip-categories/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const category = await tripCategoriesStorage.updateTripCategory(id, req.body);
    res.json(category);
  } catch (error) {
    console.error("Error updating trip category:", error);
    res.status(500).json({ message: "Failed to update trip category" });
  }
});
router.delete("/trip-categories/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await tripCategoriesStorage.deleteTripCategory(id);
    res.json({ message: "Trip category deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip category:", error);
    res.status(500).json({ message: "Failed to delete trip category" });
  }
});
router.get("/enhanced-trips", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const trips = await enhancedTripsStorage.getAllTrips();
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router.get("/enhanced-trips/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
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
router.get("/enhanced-trips/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const trips = await enhancedTripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips by program:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router.get("/enhanced-trips/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { driverId } = req.params;
    const trips = await enhancedTripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips by driver:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router.get("/enhanced-trips/category/:categoryId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { categoryId } = req.params;
    const trips = await enhancedTripsStorage.getTripsByCategory(categoryId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching enhanced trips by category:", error);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
});
router.get("/enhanced-trips/group/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const trips = await enhancedTripsStorage.getGroupTrips(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching group trips:", error);
    res.status(500).json({ message: "Failed to fetch group trips" });
  }
});
router.get("/enhanced-trips/recurring/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
  try {
    const { programId } = req.params;
    const trips = await enhancedTripsStorage.getRecurringTrips(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching recurring trips:", error);
    res.status(500).json({ message: "Failed to fetch recurring trips" });
  }
});
router.post("/enhanced-trips", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const trip = await enhancedTripsStorage.createTrip(req.body);
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating enhanced trip:", error);
    res.status(500).json({ message: "Failed to create trip" });
  }
});
router.post("/enhanced-trips/recurring", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
  try {
    const { trip, pattern } = req.body;
    const trips = await enhancedTripsStorage.createRecurringTripSeries(trip, pattern);
    res.status(201).json(trips);
  } catch (error) {
    console.error("Error creating recurring trip series:", error);
    res.status(500).json({ message: "Failed to create recurring trip series" });
  }
});
router.patch("/enhanced-trips/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user", "driver"]), async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await enhancedTripsStorage.updateTrip(id, req.body);
    res.json(trip);
  } catch (error) {
    console.error("Error updating enhanced trip:", error);
    res.status(500).json({ message: "Failed to update trip" });
  }
});
router.patch("/enhanced-trips/:id/status", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user", "driver"]), async (req, res) => {
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
router.delete("/enhanced-trips/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await enhancedTripsStorage.deleteTrip(id);
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting enhanced trip:", error);
    res.status(500).json({ message: "Failed to delete trip" });
  }
});
router.get("/driver-schedules", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const schedules = await driverSchedulesStorage.getAllDriverSchedules();
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});
router.get("/driver-schedules/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
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
router.get("/driver-schedules/driver/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { driverId } = req.params;
    const schedules = await driverSchedulesStorage.getDriverSchedulesByDriver(driverId);
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules by driver:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});
router.get("/driver-schedules/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { programId } = req.params;
    const schedules = await driverSchedulesStorage.getDriverSchedulesByProgram(programId);
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching driver schedules by program:", error);
    res.status(500).json({ message: "Failed to fetch driver schedules" });
  }
});
router.get("/driver-schedules/available/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { programId } = req.params;
    const { date, startTime, endTime } = req.query;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: "Date, startTime, and endTime are required" });
    }
    const drivers = await driverSchedulesStorage.getAvailableDrivers(programId, date, startTime, endTime);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching available drivers:", error);
    res.status(500).json({ message: "Failed to fetch available drivers" });
  }
});
router.post("/driver-schedules", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const schedule = await driverSchedulesStorage.createDriverSchedule(req.body);
    res.status(201).json(schedule);
  } catch (error) {
    console.error("Error creating driver schedule:", error);
    res.status(500).json({ message: "Failed to create driver schedule" });
  }
});
router.patch("/driver-schedules/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await driverSchedulesStorage.updateDriverSchedule(id, req.body);
    res.json(schedule);
  } catch (error) {
    console.error("Error updating driver schedule:", error);
    res.status(500).json({ message: "Failed to update driver schedule" });
  }
});
router.delete("/driver-schedules/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await driverSchedulesStorage.deleteDriverSchedule(id);
    res.json({ message: "Driver schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver schedule:", error);
    res.status(500).json({ message: "Failed to delete driver schedule" });
  }
});
router.get("/driver-duty-status/:driverId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { driverId } = req.params;
    const status = await driverSchedulesStorage.getCurrentDutyStatus(driverId);
    res.json(status);
  } catch (error) {
    console.error("Error fetching driver duty status:", error);
    res.status(500).json({ message: "Failed to fetch driver duty status" });
  }
});
router.post("/driver-duty-status/:driverId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "driver"]), async (req, res) => {
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
router.get("/driver-duty-status/:driverId/history", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
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
router.get("/vehicles", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});
router.get("/vehicles/:id", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
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
router.get("/vehicles/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { programId } = req.params;
    const vehicles = await vehiclesStorage.getVehiclesByProgram(programId);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles by program:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});
router.get("/vehicles/available/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
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
router.post("/vehicles", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const vehicle = await vehiclesStorage.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ message: "Failed to create vehicle" });
  }
});
router.patch("/vehicles/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await vehiclesStorage.updateVehicle(id, req.body);
    res.json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Failed to update vehicle" });
  }
});
router.delete("/vehicles/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await vehiclesStorage.deleteVehicle(id);
    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
});
router.get("/vehicles/:vehicleId/maintenance", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const maintenance = await vehiclesStorage.getVehicleMaintenance(vehicleId);
    res.json(maintenance);
  } catch (error) {
    console.error("Error fetching vehicle maintenance:", error);
    res.status(500).json({ message: "Failed to fetch vehicle maintenance" });
  }
});
router.post("/vehicles/:vehicleId/maintenance", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router.patch("/vehicles/maintenance/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const maintenance = await vehiclesStorage.updateMaintenanceRecord(id, req.body);
    res.json(maintenance);
  } catch (error) {
    console.error("Error updating maintenance record:", error);
    res.status(500).json({ message: "Failed to update maintenance record" });
  }
});
router.post("/vehicles/:vehicleId/assign", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router.post("/vehicles/:vehicleId/unassign", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router.get("/vehicles/:vehicleId/assignments", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const assignments = await vehiclesStorage.getVehicleAssignments(vehicleId);
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching vehicle assignments:", error);
    res.status(500).json({ message: "Failed to fetch vehicle assignments" });
  }
});
router.get("/drivers/:driverId/vehicle-history", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_DRIVERS), async (req, res) => {
  try {
    const { driverId } = req.params;
    const history = await vehiclesStorage.getDriverVehicleHistory(driverId);
    res.json(history);
  } catch (error) {
    console.error("Error fetching driver vehicle history:", error);
    res.status(500).json({ message: "Failed to fetch driver vehicle history" });
  }
});
router.get("/calendar/program/:programId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
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
router.get("/calendar/corporate/:corporateClientId", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_TRIPS), async (req, res) => {
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
router.get("/calendar/universal", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
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
router.post("/calendar/optimize/ride-sharing/:programId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router.get("/calendar/capacity-forecast/:programId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router.get("/mobile/driver/:driverId/profile", requireSupabaseAuth, requireSupabaseRole(["driver"]), async (req, res) => {
  try {
    const { driverId } = req.params;
    const profile = await mobileApi.getDriverProfile(driverId);
    res.json(profile);
  } catch (error) {
    console.error("Error fetching driver profile:", error);
    res.status(500).json({ message: "Failed to fetch driver profile" });
  }
});
router.patch("/mobile/driver/:driverId/profile", requireSupabaseAuth, requireSupabaseRole(["driver"]), async (req, res) => {
  try {
    const { driverId } = req.params;
    const profile = await mobileApi.updateDriverProfile(driverId, req.body);
    res.json(profile);
  } catch (error) {
    console.error("Error updating driver profile:", error);
    res.status(500).json({ message: "Failed to update driver profile" });
  }
});
router.get("/mobile/driver/:driverId/trips", requireSupabaseAuth, requireSupabaseRole(["driver"]), async (req, res) => {
  try {
    const { driverId } = req.params;
    const { date } = req.query;
    const trips = await mobileApi.getDriverTrips(driverId, date);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching driver trips:", error);
    res.status(500).json({ message: "Failed to fetch driver trips" });
  }
});
router.patch("/mobile/trips/:tripId/status", requireSupabaseAuth, requireSupabaseRole(["driver"]), async (req, res) => {
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
router.post("/mobile/driver/:driverId/location", requireSupabaseAuth, requireSupabaseRole(["driver"]), async (req, res) => {
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
router.get("/mobile/driver/:driverId/location", requireSupabaseAuth, requireSupabaseRole(["driver"]), async (req, res) => {
  try {
    const { driverId } = req.params;
    const location = await mobileApi.getLastLocation(driverId);
    res.json(location);
  } catch (error) {
    console.error("Error fetching driver location:", error);
    res.status(500).json({ message: "Failed to fetch driver location" });
  }
});
router.post("/mobile/driver/:driverId/duty-status", requireSupabaseAuth, requireSupabaseRole(["driver"]), async (req, res) => {
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
router.get("/mobile/driver/:driverId/offline-data", requireSupabaseAuth, requireSupabaseRole(["driver"]), async (req, res) => {
  try {
    const { driverId } = req.params;
    const offlineData = await mobileApi.getOfflineData(driverId);
    res.json(offlineData);
  } catch (error) {
    console.error("Error fetching offline data:", error);
    res.status(500).json({ message: "Failed to fetch offline data" });
  }
});
router.post("/mobile/driver/:driverId/sync", requireSupabaseAuth, requireSupabaseRole(["driver"]), async (req, res) => {
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
router.get("/notifications/templates", requireSupabaseAuth, requirePermission(PERMISSIONS.VIEW_USERS), async (req, res) => {
  try {
    const { type } = req.query;
    const templates = await notificationSystem.getTemplates(type);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching notification templates:", error);
    res.status(500).json({ message: "Failed to fetch notification templates" });
  }
});
router.post("/notifications/templates", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const template = await notificationSystem.createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating notification template:", error);
    res.status(500).json({ message: "Failed to create notification template" });
  }
});
router.post("/notifications/send", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
  try {
    const notification = await notificationSystem.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});
router.post("/notifications/trip-reminder/:tripId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin", "program_user"]), async (req, res) => {
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
router.post("/notifications/driver-update/:driverId", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin", "program_admin"]), async (req, res) => {
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
router.post("/notifications/system-alert", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const { alertType, message, targetUsers, priority } = req.body;
    const result = await notificationSystem.sendSystemAlert(alertType, message, targetUsers, priority);
    res.json(result);
  } catch (error) {
    console.error("Error sending system alert:", error);
    res.status(500).json({ message: "Failed to send system alert" });
  }
});
router.post("/notifications/process-scheduled", requireSupabaseAuth, requireSupabaseRole(["super_admin"]), async (req, res) => {
  try {
    const result = await notificationSystem.processScheduledNotifications();
    res.json(result);
  } catch (error) {
    console.error("Error processing scheduled notifications:", error);
    res.status(500).json({ message: "Failed to process scheduled notifications" });
  }
});
router.get("/notifications/preferences/:userId", requireSupabaseAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await notificationSystem.getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ message: "Failed to fetch notification preferences" });
  }
});
router.patch("/notifications/preferences/:userId", requireSupabaseAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await notificationSystem.updateUserPreferences(userId, req.body);
    res.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ message: "Failed to update notification preferences" });
  }
});
router.get("/corporate-clients", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
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
router.get("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
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
router.get("/programs", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const programs = await programsStorage.getAllPrograms();
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});
router.get("/trips/universal", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
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
router.get("/vehicles", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});
router.get("/drivers", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const drivers = await driversStorage.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});
router.get("/vehicles", requireSupabaseAuth, requireSupabaseRole(["super_admin", "corporate_admin"]), async (req, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});
router.get("/trips/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const trips = await tripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching program trips:", error);
    res.status(500).json({ message: "Failed to fetch program trips" });
  }
});
router.get("/trips/corporate-client/:corporateClientId", requireSupabaseAuth, async (req, res) => {
  try {
    const { corporateClientId } = req.params;
    const trips = await tripsStorage.getTripsByCorporateClient(corporateClientId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching corporate client trips:", error);
    res.status(500).json({ message: "Failed to fetch corporate client trips" });
  }
});
router.get("/drivers/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const drivers = await driversStorage.getDriversByProgram(programId);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching program drivers:", error);
    res.status(500).json({ message: "Failed to fetch program drivers" });
  }
});
router.get("/clients/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const clients = await clientsStorage.getClientsByProgram(programId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching program clients:", error);
    res.status(500).json({ message: "Failed to fetch program clients" });
  }
});
router.get("/client-groups/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching program client groups:", error);
    res.status(500).json({ message: "Failed to fetch program client groups" });
  }
});
router.get("/vehicles/program/:programId", requireSupabaseAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const vehicles = await vehiclesStorage.getVehiclesByProgram(programId);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching program vehicles:", error);
    res.status(500).json({ message: "Failed to fetch program vehicles" });
  }
});
router.get("/trips/driver/:driverId", requireSupabaseAuth, async (req, res) => {
  try {
    const { driverId } = req.params;
    const trips = await tripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching driver trips:", error);
    res.status(500).json({ message: "Failed to fetch driver trips" });
  }
});
var api_routes_default = router;

// server/index.ts
import session from "express-session";
import bcrypt2 from "bcrypt";
console.log("\u{1F50D} Server environment check:");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "Set" : "Missing");
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "Set" : "Missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}
var app = express2();
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.get("host");
  const isProduction2 = process.env.NODE_ENV === "production";
  const allowedOrigins = isProduction2 ? [
    `https://${host}`,
    // Current domain
    process.env.REPLIT_DOMAIN,
    ...host ? [`https://${host}`] : []
  ].filter(Boolean) : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5177", "http://localhost:8081"];
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
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
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
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
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
  app.post("/api/users", async (req, res) => {
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
          const { createClient: createClient4 } = await import("@supabase/supabase-js");
          const supabase4 = createClient4(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );
          const { data: newDriver, error: driverError } = await supabase4.from("drivers").insert(driverData).select().single();
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
      res.status(500).json({ message: "Failed to create user", error: error.message });
    }
  });
  app.use("/uploads", express2.static("public/uploads", {
    setHeaders: (res, path2) => {
      if (path2.endsWith(".svg")) {
        res.setHeader("Content-Type", "image/svg+xml");
      } else if (path2.endsWith(".webp")) {
        res.setHeader("Content-Type", "image/webp");
      } else if (path2.endsWith(".png")) {
        res.setHeader("Content-Type", "image/png");
      } else if (path2.endsWith(".jpg") || path2.endsWith(".jpeg")) {
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
  app.use("/api", api_routes_default);
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });
  const server = createServer(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    app.use(express2.static("client/dist"));
  } else {
    app.use(express2.static("client/dist"));
  }
  const port = 8081;
  server.listen(port, () => {
    console.log(`\u{1F680} HALCYON NMT Server running on port ${port}`);
  });
})();
