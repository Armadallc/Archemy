/**
 * HALCYON NMT Transportation System - Current Database Schema
 * 
 * This file contains the TypeScript schema definitions that match the current
 * database schema defined in server/create-complete-schema.sql
 * 
 * Architecture: Corporate Clients → Programs → Locations → Clients
 * Version: 2.0.0
 * Created: 2024-01-01
 */

import { pgTable, text, varchar, boolean, timestamp, uuid, integer, decimal, jsonb, time, date, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'corporate_admin', 
  'program_admin',
  'program_user',
  'driver'
]);

export const tripTypeEnum = pgEnum('trip_type', [
  'medical',
  'non_medical',
  'emergency',
  'group'
]);

export const tripStatusEnum = pgEnum('trip_status', [
  'order',
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
]);

export const vehicleStatusEnum = pgEnum('vehicle_status', [
  'active',
  'maintenance',
  'inactive',
  'retired'
]);

export const dutyStatusEnum = pgEnum('duty_status', [
  'off_duty',
  'on_duty',
  'on_trip',
  'break',
  'unavailable'
]);

// Role Type for Hybrid RBAC (polymorphic discriminator)
// Note: This is a CHECK constraint in the database, but we use a type for TypeScript
export type RoleType = 'system' | 'tenant';

// ============================================================================
// CORE TABLES
// ============================================================================

// Corporate Clients Table
export const corporateClients = pgTable("corporate_clients", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"), // Legacy field - kept for backward compatibility
  street_address: text("street_address"),
  city: text("city"),
  state: varchar("state", { length: 2 }),
  zip_code: varchar("zip_code", { length: 5 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logo_url: text("logo_url"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Programs Table (renamed from organizations)
export const programs = pgTable("programs", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  short_name: varchar("short_name", { length: 100 }),
  description: text("description"),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).notNull().references(() => corporateClients.id, { onDelete: 'cascade' }),
  address: text("address"), // Legacy field - kept for backward compatibility
  street_address: text("street_address"),
  city: text("city"),
  state: varchar("state", { length: 2 }),
  zip_code: varchar("zip_code", { length: 5 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  logo_url: text("logo_url"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Locations Table (renamed from service_areas)
export const locations = pgTable("locations", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  address: text("address").notNull(), // Legacy field - kept for backward compatibility
  street_address: text("street_address"),
  city: text("city"),
  state: varchar("state", { length: 2 }),
  zip_code: varchar("zip_code", { length: 5 }),
  phone: varchar("phone", { length: 20 }),
  contact_person: varchar("contact_person", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Frequent Locations Table
export const frequentLocations = pgTable("frequent_locations", {
  id: text("id").primaryKey().default(sql`'fl_'::text || gen_random_uuid()`),
  corporate_client_id: text("corporate_client_id").references(() => corporateClients.id, { onDelete: 'cascade' }),
  program_id: text("program_id").references(() => programs.id, { onDelete: 'cascade' }),
  location_id: text("location_id").references(() => locations.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  street_address: text("street_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip_code: text("zip_code"),
  full_address: text("full_address").notNull(),
  location_type: text("location_type").default("service_location").$type<'service_location' | 'legal' | 'healthcare' | 'dmv' | 'grocery' | 'other'>(),
  // New tag system columns
  tag: text("tag").default("other").$type<'service_location' | 'grocery_store' | 'dmv' | 'legal_services' | 'medical' | 'non_medical' | 'group_activity' | 'fellowship' | 'other'>(),
  is_service_location: boolean("is_service_location").default(false),
  priority: integer("priority").default(0),
  auto_synced: boolean("auto_synced").default(false),
  usage_count: integer("usage_count").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Users Table
export const users = pgTable("users", {
  user_id: varchar("user_id", { length: 50 }).primaryKey(),
  user_name: varchar("user_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  primary_program_id: varchar("primary_program_id", { length: 50 }).references(() => programs.id, { onDelete: 'set null' }),
  authorized_programs: text("authorized_programs").array(),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'set null' }),
  tenant_role_id: varchar("tenant_role_id", { length: 50 }).references(() => tenantRoles.id, { onDelete: 'set null' }),
  active_tenant_id: varchar("active_tenant_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'set null' }),
  display_id: varchar("display_id", { length: 20 }), // Human-readable display ID (e.g., MON-CAD-001)
  avatar_url: text("avatar_url"),
  phone: varchar("phone", { length: 20 }),
  first_name: varchar("first_name", { length: 255 }),
  last_name: varchar("last_name", { length: 255 }),
  is_active: boolean("is_active").default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Clients Table
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  first_name: varchar("first_name", { length: 255 }).notNull(),
  last_name: varchar("last_name", { length: 255 }).notNull(),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  location_id: varchar("location_id", { length: 50 }).references(() => locations.id, { onDelete: 'set null' }),
  phone: varchar("phone", { length: 20 }),
  phone_type: varchar("phone_type", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"), // Legacy field - kept for backward compatibility
  street_address: text("street_address"),
  city: text("city"),
  state: varchar("state", { length: 2 }),
  zip_code: varchar("zip_code", { length: 5 }),
  use_location_address: boolean("use_location_address").default(false),
  date_of_birth: date("date_of_birth"),
  birth_sex: varchar("birth_sex", { length: 10 }),
  age: integer("age"),
  race: varchar("race", { length: 50 }),
  avatar_url: text("avatar_url"),
  emergency_contact_name: varchar("emergency_contact_name", { length: 255 }),
  emergency_contact_phone: varchar("emergency_contact_phone", { length: 20 }),
  medical_conditions: text("medical_conditions"),
  special_requirements: text("special_requirements"),
  billing_pin: varchar("billing_pin", { length: 10 }),
  room_number: varchar("room_number", { length: 50 }), // e.g., "1A", "6B"
  bed_number: varchar("bed_number", { length: 50 }), // e.g., "1", "2", "1 top", "2 bottom"
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Client Groups Table
export const clientGroups = pgTable("client_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  reference_id: varchar("reference_id", { length: 30 }), // Human-readable reference ID (e.g., MC-G0001)
  // Telematics Phase 1: Default trip purpose for group (remains constant even if clients change)
  trip_purpose: varchar("trip_purpose", { length: 20 }), // Legal, Groceries, Community, Program (adjacent), Medical, Non-Medical
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Client Group Memberships Table
export const clientGroupMemberships = pgTable("client_group_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  client_id: uuid("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  client_group_id: uuid("client_group_id").notNull().references(() => clientGroups.id, { onDelete: 'cascade' }),
  joined_at: timestamp("joined_at").defaultNow(),
});

// Client Program Contacts Table
export const clientProgramContacts = pgTable("client_program_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  client_id: uuid("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  first_name: varchar("first_name", { length: 255 }).notNull(),
  last_name: varchar("last_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  is_preferred_poc: boolean("is_preferred_poc").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Mobility Requirements Lookup Table
export const mobilityRequirements = pgTable("mobility_requirements", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  is_active: boolean("is_active").default(true),
});

// Client Mobility Requirements Junction Table
export const clientMobilityRequirements = pgTable("client_mobility_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  client_id: uuid("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  mobility_requirement_id: varchar("mobility_requirement_id", { length: 50 }).notNull().references(() => mobilityRequirements.id),
  custom_note: text("custom_note"),
  created_at: timestamp("created_at").defaultNow(),
});

// Special Requirements Lookup Table
export const specialRequirements = pgTable("special_requirements", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  is_active: boolean("is_active").default(true),
});

// Client Special Requirements Junction Table
export const clientSpecialRequirements = pgTable("client_special_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  client_id: uuid("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  special_requirement_id: varchar("special_requirement_id", { length: 50 }).notNull().references(() => specialRequirements.id),
  custom_note: text("custom_note"),
  created_at: timestamp("created_at").defaultNow(),
});

// Communication Needs Lookup Table
export const communicationNeeds = pgTable("communication_needs", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  is_active: boolean("is_active").default(true),
});

// Client Communication Needs Junction Table
export const clientCommunicationNeeds = pgTable("client_communication_needs", {
  id: uuid("id").primaryKey().defaultRandom(),
  client_id: uuid("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  communication_need_id: varchar("communication_need_id", { length: 50 }).notNull().references(() => communicationNeeds.id),
  custom_note: text("custom_note"),
  created_at: timestamp("created_at").defaultNow(),
});

// Client Safety Preferences Table
export const clientSafetyPreferences = pgTable("client_safety_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  client_id: uuid("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  preferred_driver_request: text("preferred_driver_request"),
  other_preferences: text("other_preferences"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Drivers Table
export const drivers = pgTable("drivers", {
  id: varchar("id", { length: 50 }).primaryKey(),
  user_id: varchar("user_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  license_number: varchar("license_number", { length: 50 }).notNull(),
  license_expiry: date("license_expiry"),
  vehicle_info: text("vehicle_info"),
  display_id: varchar("display_id", { length: 20 }), // Human-readable display ID (e.g., DRV-MON-001)
  is_active: boolean("is_active").default(true),
  is_available: boolean("is_available").default(false), // Location sharing availability toggle - drivers must explicitly enable
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Vehicles Table
export const vehicles = pgTable("vehicles", {
  id: varchar("id", { length: 50 }).primaryKey(),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  license_plate: varchar("license_plate", { length: 20 }).notNull(),
  color: varchar("color", { length: 50 }),
  vehicle_type: varchar("vehicle_type", { length: 50 }),
  capacity: integer("capacity"),
  display_id: varchar("display_id", { length: 20 }), // Human-readable display ID (e.g., MON-BUS-001)
  status: vehicleStatusEnum("status").default('active'),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Vehicle Assignments Table
export const vehicleAssignments = pgTable("vehicle_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  driver_id: varchar("driver_id", { length: 50 }).notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  vehicle_id: varchar("vehicle_id", { length: 50 }).notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  assigned_at: timestamp("assigned_at").defaultNow(),
  unassigned_at: timestamp("unassigned_at"),
  is_active: boolean("is_active").default(true),
});

// Vehicle Maintenance Table
export const vehicleMaintenance = pgTable("vehicle_maintenance", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicle_id: varchar("vehicle_id", { length: 50 }).notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  maintenance_type: varchar("maintenance_type", { length: 100 }).notNull(),
  description: text("description"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  maintenance_date: date("maintenance_date").notNull(),
  next_maintenance_date: date("next_maintenance_date"),
  created_at: timestamp("created_at").defaultNow(),
});

// Trip Categories Table
export const tripCategories = pgTable("trip_categories", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color code
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Trips Table
export const trips = pgTable("trips", {
  id: varchar("id", { length: 50 }).primaryKey(),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  client_id: uuid("client_id").references(() => clients.id, { onDelete: 'cascade' }),
  client_group_id: uuid("client_group_id").references(() => clientGroups.id, { onDelete: 'cascade' }),
  driver_id: varchar("driver_id", { length: 50 }).references(() => drivers.id, { onDelete: 'set null' }),
  vehicle_id: varchar("vehicle_id", { length: 50 }).references(() => vehicles.id, { onDelete: 'set null' }),
  trip_type: tripTypeEnum("trip_type").notNull(),
  trip_category_id: varchar("trip_category_id", { length: 50 }).references(() => tripCategories.id, { onDelete: 'set null' }),
  pickup_address: text("pickup_address").notNull(), // Legacy field - kept for backward compatibility
  pickup_street: text("pickup_street"),
  pickup_city: text("pickup_city"),
  pickup_state: varchar("pickup_state", { length: 2 }),
  pickup_zip: varchar("pickup_zip", { length: 5 }),
  dropoff_address: text("dropoff_address").notNull(), // Legacy field - kept for backward compatibility
  dropoff_street: text("dropoff_street"),
  dropoff_city: text("dropoff_city"),
  dropoff_state: varchar("dropoff_state", { length: 2 }),
  dropoff_zip: varchar("dropoff_zip", { length: 5 }),
  stops: jsonb("stops").default('[]'), // Array of intermediate stop addresses (max 8) - TODO: Update to use separated fields
  scheduled_pickup_time: timestamp("scheduled_pickup_time").notNull(),
  scheduled_return_time: timestamp("scheduled_return_time"),
  actual_pickup_time: timestamp("actual_pickup_time"),
  actual_dropoff_time: timestamp("actual_dropoff_time"),
  passenger_count: integer("passenger_count").default(1),
  status: tripStatusEnum("status").default('order'),
  special_requirements: text("special_requirements"),
  notes: text("notes"),
  // Telematics Phase 1: Trip Purpose & Billing
  trip_purpose: varchar("trip_purpose", { length: 20 }), // Legal, Groceries, Community, Program (adjacent), Medical, Non-Medical
  trip_code: varchar("trip_code", { length: 20 }), // CPT/HCPCS code (A0120, T2001, T2004, etc.) - optional
  trip_modifier: varchar("trip_modifier", { length: 2 }), // 2 uppercase letters (e.g., 'HA') - optional, only if trip_code selected
  // Telematics Phase 1: Appointment & Timing
  appointment_time: timestamp("appointment_time"), // When client needs to be at appointment
  // Telematics Phase 1: Wait Time Tracking
  wait_time_minutes: integer("wait_time_minutes").default(0),
  wait_time_started_at: timestamp("wait_time_started_at"),
  wait_time_stopped_at: timestamp("wait_time_stopped_at"),
  // Telematics Phase 1: HCBS Waiver
  hcbs_waiver_verified: boolean("hcbs_waiver_verified").default(false),
  created_by: varchar("created_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_by: varchar("updated_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Trip Legs Table (Telematics Phase 1)
// Supports multi-leg trips: Leg A (initial pickup to dropoff), Leg B (return or additional legs), etc.
export const tripLegs = pgTable("trip_legs", {
  id: varchar("id", { length: 50 }).primaryKey(),
  trip_id: varchar("trip_id", { length: 50 }).notNull().references(() => trips.id, { onDelete: 'cascade' }),
  leg_number: varchar("leg_number", { length: 10 }).notNull(), // 'A', 'B', 'C', etc.
  leg_type: varchar("leg_type", { length: 50 }).notNull(), // 'pickup_to_dropoff', 'return', 'additional_pickup', 'additional_dropoff'
  from_address: text("from_address").notNull(),
  to_address: text("to_address").notNull(),
  from_latitude: decimal("from_latitude", { precision: 10, scale: 8 }),
  from_longitude: decimal("from_longitude", { precision: 11, scale: 8 }),
  to_latitude: decimal("to_latitude", { precision: 10, scale: 8 }),
  to_longitude: decimal("to_longitude", { precision: 11, scale: 8 }),
  distance_miles: decimal("distance_miles", { precision: 10, scale: 2 }), // Calculated distance between from and to addresses
  estimated_time_minutes: integer("estimated_time_minutes"), // Estimated travel time using maps API, traffic, time of day
  actual_time_minutes: integer("actual_time_minutes"), // Actual time taken for this leg
  started_at: timestamp("started_at"), // When driver started this leg
  completed_at: timestamp("completed_at"), // When driver completed this leg
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Driver Schedules Table
export const driverSchedules = pgTable("driver_schedules", {
  id: varchar("id", { length: 50 }).primaryKey(),
  driver_id: varchar("driver_id", { length: 50 }).notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  day_of_week: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Driver Duty Status Table
export const driverDutyStatus = pgTable("driver_duty_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  driver_id: varchar("driver_id", { length: 50 }).notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  status: dutyStatusEnum("status").notNull(),
  started_at: timestamp("started_at").notNull(),
  ended_at: timestamp("ended_at"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

// Driver Locations Table
export const driverLocations = pgTable("driver_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  driver_id: varchar("driver_id", { length: 50 }).notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }),
  heading: decimal("heading", { precision: 5, scale: 2 }),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  address: text("address"),
  timestamp: timestamp("timestamp").defaultNow(),
  is_active: boolean("is_active").default(true),
});

// Notification Templates Table
export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: varchar("user_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  data: jsonb("data"),
  priority: varchar("priority", { length: 20 }).default('medium'),
  channels: text("channels").array(),
  status: varchar("status", { length: 20 }).default('draft'),
  scheduled_for: timestamp("scheduled_for"),
  sent_at: timestamp("sent_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Notification Deliveries Table
export const notificationDeliveries = pgTable("notification_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  notification_id: uuid("notification_id").notNull().references(() => notifications.id, { onDelete: 'cascade' }),
  channel: varchar("channel", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  sent_at: timestamp("sent_at"),
  delivered_at: timestamp("delivered_at"),
  error_message: text("error_message"),
  created_at: timestamp("created_at").defaultNow(),
});

// Notification Preferences Table
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: varchar("user_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  notification_type: varchar("notification_type", { length: 50 }).notNull(),
  email_enabled: boolean("email_enabled").default(true),
  push_enabled: boolean("push_enabled").default(true),
  sms_enabled: boolean("sms_enabled").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Themes Table (Shared themes created by super admins)
export const themes = pgTable("themes", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  light_mode_tokens: jsonb("light_mode_tokens").notNull(),
  dark_mode_tokens: jsonb("dark_mode_tokens").notNull(),
  is_active: boolean("is_active").default(true),
  created_by: varchar("created_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// User Theme Selections Table (User's selected theme and mode preference)
export const userThemeSelections = pgTable("user_theme_selections", {
  id: varchar("id", { length: 50 }).primaryKey(),
  user_id: varchar("user_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }).unique(),
  theme_id: varchar("theme_id", { length: 50 }).notNull().references(() => themes.id, { onDelete: 'restrict' }),
  theme_mode: varchar("theme_mode", { length: 10 }).notNull().default('light'), // 'light' or 'dark'
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// User Theme Preferences Table (Legacy - kept for backward compatibility)
export const userThemePreferences = pgTable("user_theme_preferences", {
  id: varchar("id", { length: 50 }).primaryKey(),
  user_id: varchar("user_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  light_mode_tokens: jsonb("light_mode_tokens"),
  dark_mode_tokens: jsonb("dark_mode_tokens"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Trip Status Logs Table
export const tripStatusLogs = pgTable("trip_status_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  trip_id: varchar("trip_id", { length: 50 }).notNull().references(() => trips.id, { onDelete: 'cascade' }),
  old_status: tripStatusEnum("old_status"),
  new_status: tripStatusEnum("new_status").notNull(),
  changed_by: varchar("changed_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  reason: text("reason"),
  created_at: timestamp("created_at").defaultNow(),
});

// Offline Updates Table
export const offlineUpdates = pgTable("offline_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  driver_id: varchar("driver_id", { length: 50 }).notNull().references(() => drivers.id, { onDelete: 'cascade' }),
  update_type: varchar("update_type", { length: 50 }).notNull(),
  update_data: jsonb("update_data").notNull(),
  status: varchar("status", { length: 20 }).default('pending'),
  created_at: timestamp("created_at").defaultNow(),
  synced_at: timestamp("synced_at"),
});

// System Settings Table
export const systemSettings = pgTable("system_settings", {
  id: varchar("id", { length: 50 }).primaryKey().default('system'),
  app_name: varchar("app_name", { length: 255 }).notNull().default('HALCYON Transportation Management'),
  main_logo_url: text("main_logo_url"),
  support_email: varchar("support_email", { length: 255 }).notNull().default('support@halcyon.com'),
  support_phone: varchar("support_phone", { length: 50 }).notNull().default('+1 (555) 123-4567'),
  timezone: varchar("timezone", { length: 50 }).notNull().default('America/New_York'),
  language: varchar("language", { length: 10 }).notNull().default('en'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Role Permissions Table
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  role: varchar("role", { length: 50 }).notNull(), // Uses CHECK constraint instead of enum to match database
  role_type: varchar("role_type", { length: 20 }).default('system').$type<RoleType>(), // 'system' or 'tenant' discriminator
  permission: varchar("permission", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 50 }).notNull().default('*'),
  program_id: varchar("program_id", { length: 50 }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tenant Roles Table (Hybrid RBAC)
// Note: Circular reference with users table (created_by -> users.user_id, users.tenant_role_id -> tenant_roles.id)
// Drizzle handles this with lazy function references
export const tenantRoles = pgTable("tenant_roles", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  corporate_client_id: varchar("corporate_client_id", { length: 50 })
    .notNull()
    .references(() => corporateClients.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: varchar("created_by", { length: 50 }),
});

// User Mentions Table (Universal Tagging System)
export const userMentions = pgTable("user_mentions", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  source_type: varchar("source_type", { length: 50 }).notNull(), // trip, task, client, discussion, note, comment
  source_id: varchar("source_id", { length: 50 }).notNull(),
  user_id: varchar("user_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  created_by: varchar("created_by", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Activity Log Table (Activity Feed Module)
export const activityLog = pgTable("activity_log", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  activity_type: varchar("activity_type", { length: 50 }).notNull(), // discussion_created, task_created, kanban_card_moved, etc.
  source_type: varchar("source_type", { length: 50 }).notNull(), // discussion, task, kanban, comment, note, etc.
  source_id: varchar("source_id", { length: 50 }).notNull(),
  user_id: varchar("user_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  action_description: text("action_description"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Flexible storage for activity-specific data
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'set null' }),
  program_id: varchar("program_id", { length: 50 }).references(() => programs.id, { onDelete: 'set null' }),
  created_at: timestamp("created_at").defaultNow(),
});

// ============================================================================
// COLLABORATION MODULE TABLES
// ============================================================================

// Tasks Table
export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, in_progress, completed, cancelled
  priority: varchar("priority", { length: 20 }).notNull().default('medium'), // low, medium, high, urgent
  task_type: varchar("task_type", { length: 50 }), // review, approval, maintenance, billing, training, follow_up, other
  assigned_to: varchar("assigned_to", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  created_by: varchar("created_by", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  linked_type: varchar("linked_type", { length: 50 }), // trip, client, driver, vehicle, program, corporate_client
  linked_id: varchar("linked_id", { length: 50 }),
  due_date: timestamp("due_date"),
  completed_at: timestamp("completed_at"),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 }).references(() => programs.id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// User Todos Table (Personal Todo List)
export const userTodos = pgTable("user_todos", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  user_id: varchar("user_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  is_completed: boolean("is_completed").default(false),
  priority: varchar("priority", { length: 20 }).default('medium'), // low, medium, high
  due_date: timestamp("due_date"),
  position: integer("position").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

// ============================================================================
// PROGRAM MANAGEMENT TABLES
// ============================================================================

// Program Licensures Table
export const programLicensures = pgTable("program_licensures", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  license_type: varchar("license_type", { length: 255 }).notNull(),
  license_number: varchar("license_number", { length: 255 }).notNull(),
  issuing_authority: varchar("issuing_authority", { length: 255 }),
  issue_date: date("issue_date"),
  expiry_date: date("expiry_date").notNull(),
  renewal_reminder_days: integer("renewal_reminder_days").default(30),
  notes: text("notes"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: varchar("created_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  updated_by: varchar("updated_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
});

// Staff Certifications Table
export const staffCertifications = pgTable("staff_certifications", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  staff_member_id: varchar("staff_member_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  certification_type: varchar("certification_type", { length: 100 }).notNull(),
  certification_name: varchar("certification_name", { length: 255 }).notNull(),
  issuing_organization: varchar("issuing_organization", { length: 255 }),
  certificate_number: varchar("certificate_number", { length: 255 }),
  issue_date: date("issue_date"),
  expiry_date: date("expiry_date").notNull(),
  notes: text("notes"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: varchar("created_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  updated_by: varchar("updated_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
});

// Program Forms Table
export const programForms = pgTable("program_forms", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  form_name: varchar("form_name", { length: 255 }).notNull(),
  form_type: varchar("form_type", { length: 100 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 50 }).default('1.0'),
  document_url: text("document_url"),
  file_path: text("file_path"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: varchar("created_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  updated_by: varchar("updated_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
});

// Program Curriculum Table
export const programCurriculum = pgTable("program_curriculum", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  document_url: text("document_url"),
  file_path: text("file_path"),
  version: varchar("version", { length: 50 }).default('1.0'),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: varchar("created_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  updated_by: varchar("updated_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
});

// Program Onboarding Items Table
export const programOnboardingItems = pgTable("program_onboarding_items", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  program_id: varchar("program_id", { length: 50 }).notNull().references(() => programs.id, { onDelete: 'cascade' }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  item_type: varchar("item_type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  document_url: text("document_url"),
  file_path: text("file_path"),
  target_audience: varchar("target_audience", { length: 50 }).notNull().default('both'),
  is_required: boolean("is_required").default(true),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: varchar("created_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  updated_by: varchar("updated_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
});

// Location Room/Bed Inventory Table
export const locationRoomBeds = pgTable("location_room_beds", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  location_id: varchar("location_id", { length: 50 }).notNull().references(() => locations.id, { onDelete: 'cascade' }),
  room_number: varchar("room_number", { length: 50 }).notNull(), // e.g., "1A", "6B"
  bed_number: varchar("bed_number", { length: 50 }).notNull(), // e.g., "1", "2", "1 top", "2 bottom"
  bed_label: varchar("bed_label", { length: 100 }), // Optional human-readable label like "Bed 1 (Top Bunk)"
  bed_type: varchar("bed_type", { length: 50 }), // e.g., "single", "bunk_top", "bunk_bottom", "twin", "full"
  is_occupied: boolean("is_occupied").default(false),
  assigned_client_id: uuid("assigned_client_id").references(() => clients.id, { onDelete: 'set null' }),
  notes: text("notes"), // For special arrangements or notes
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: varchar("created_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  updated_by: varchar("updated_by", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
});

// Comments Table
export const comments = pgTable("comments", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  content: text("content").notNull(),
  source_type: varchar("source_type", { length: 50 }).notNull(), // trip, task, client, driver, vehicle, note, discussion
  source_id: varchar("source_id", { length: 50 }).notNull(),
  parent_comment_id: varchar("parent_comment_id", { length: 50 }).references(() => comments.id, { onDelete: 'cascade' }),
  created_by: varchar("created_by", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"),
});

// Notes Table
export const notes = pgTable("notes", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  note_type: varchar("note_type", { length: 50 }), // general, meeting, client_note, trip_note, internal, reminder
  linked_type: varchar("linked_type", { length: 50 }), // trip, client, driver, vehicle, program, corporate_client
  linked_id: varchar("linked_id", { length: 50 }),
  created_by: varchar("created_by", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 }).references(() => programs.id, { onDelete: 'cascade' }),
  is_private: boolean("is_private").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"),
});

// ============================================================================
// DISCUSSIONS MODULE TABLES (Chat)
// ============================================================================

// Discussions Table (Chat threads/conversations)
export const discussions = pgTable("discussions", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  title: varchar("title", { length: 255 }), // Optional title for group chats
  discussion_type: varchar("discussion_type", { length: 20 }).notNull().default('personal'), // personal, group
  is_open: boolean("is_open").default(false), // If true, anyone in scope can join
  tagged_user_ids: jsonb("tagged_user_ids").default(sql`'[]'::jsonb`), // Array of user IDs explicitly tagged
  tagged_roles: jsonb("tagged_roles").default(sql`'[]'::jsonb`), // Array of role names tagged (e.g., ['program_admin', 'driver'])
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 }).references(() => programs.id, { onDelete: 'cascade' }),
  created_by: varchar("created_by", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  last_message_id: varchar("last_message_id", { length: 50 }), // References discussion_messages(id)
  last_message_at: timestamp("last_message_at"),
  archived_at: timestamp("archived_at"), // Timestamp when archived (soft delete)
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Discussion Messages Table
export const discussionMessages = pgTable("discussion_messages", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  discussion_id: varchar("discussion_id", { length: 50 }).notNull().references(() => discussions.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  parent_message_id: varchar("parent_message_id", { length: 50 }).references(() => discussionMessages.id, { onDelete: 'cascade' }),
  created_by: varchar("created_by", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  read_by: jsonb("read_by").default(sql`'[]'::jsonb`), // Array of user_ids who have read this message
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"),
});

// Discussion Participants Table (Many-to-many: users in discussions)
export const discussionParticipants = pgTable("discussion_participants", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  discussion_id: varchar("discussion_id", { length: 50 }).notNull().references(() => discussions.id, { onDelete: 'cascade' }),
  user_id: varchar("user_id", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 20 }).default('member'), // admin, member
  last_read_message_id: varchar("last_read_message_id", { length: 50 }).references(() => discussionMessages.id, { onDelete: 'set null' }),
  last_read_at: timestamp("last_read_at"),
  joined_at: timestamp("joined_at").defaultNow(),
  left_at: timestamp("left_at"),
});

// Export schemas
export const insertDiscussionSchema = createInsertSchema(discussions);
export const insertDiscussionMessageSchema = createInsertSchema(discussionMessages);
export const insertDiscussionParticipantSchema = createInsertSchema(discussionParticipants);

export const selectDiscussionSchema = createSelectSchema(discussions);
export const selectDiscussionMessageSchema = createSelectSchema(discussionMessages);
export const selectDiscussionParticipantSchema = createSelectSchema(discussionParticipants);

export type Discussion = typeof discussions.$inferSelect;
export type InsertDiscussion = typeof discussions.$inferInsert;
export type DiscussionMessage = typeof discussionMessages.$inferSelect;
export type InsertDiscussionMessage = typeof discussionMessages.$inferInsert;
export type DiscussionParticipant = typeof discussionParticipants.$inferSelect;
export type InsertDiscussionParticipant = typeof discussionParticipants.$inferInsert;

// ============================================================================
// KANBAN BOARD MODULE TABLES
// ============================================================================

// Kanban Boards Table
export const kanbanBoards = pgTable("kanban_boards", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 }).references(() => programs.id, { onDelete: 'cascade' }),
  is_default: boolean("is_default").default(false),
  board_type: varchar("board_type", { length: 50 }).default('task'), // task, trip, custom
  created_by: varchar("created_by", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Kanban Columns Table
export const kanbanColumns = pgTable("kanban_columns", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  board_id: varchar("board_id", { length: 50 }).notNull().references(() => kanbanBoards.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  position: integer("position").notNull(),
  color: varchar("color", { length: 7 }), // Hex color (e.g., #3b82f6)
  wip_limit: integer("wip_limit"), // Work-in-progress limit
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Kanban Cards Table
export const kanbanCards = pgTable("kanban_cards", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  board_id: varchar("board_id", { length: 50 }).notNull().references(() => kanbanBoards.id, { onDelete: 'cascade' }),
  column_id: varchar("column_id", { length: 50 }).notNull().references(() => kanbanColumns.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  task_id: varchar("task_id", { length: 50 }).references(() => tasks.id, { onDelete: 'set null' }),
  position: integer("position").notNull(),
  priority: varchar("priority", { length: 20 }).default('medium'), // low, medium, high, urgent
  due_date: timestamp("due_date"),
  assigned_to: varchar("assigned_to", { length: 50 }).references(() => users.user_id, { onDelete: 'set null' }),
  created_by: varchar("created_by", { length: 50 }).notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 }).references(() => corporateClients.id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 }).references(() => programs.id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// INSERT SCHEMAS (Zod validation)
// ============================================================================

export const insertCorporateClientSchema = createInsertSchema(corporateClients);
export const insertProgramSchema = createInsertSchema(programs);
export const insertLocationSchema = createInsertSchema(locations);
export const insertFrequentLocationSchema = createInsertSchema(frequentLocations);
export const insertUserSchema = createInsertSchema(users);
export const insertClientSchema = createInsertSchema(clients);
export const insertClientGroupSchema = createInsertSchema(clientGroups);
export const insertClientGroupMembershipSchema = createInsertSchema(clientGroupMemberships);
export const insertKanbanBoardSchema = createInsertSchema(kanbanBoards);
export const insertKanbanColumnSchema = createInsertSchema(kanbanColumns);
export const insertKanbanCardSchema = createInsertSchema(kanbanCards);
export const insertDriverSchema = createInsertSchema(drivers);
export const insertVehicleSchema = createInsertSchema(vehicles);
export const insertVehicleAssignmentSchema = createInsertSchema(vehicleAssignments);
export const insertVehicleMaintenanceSchema = createInsertSchema(vehicleMaintenance);
export const insertTripCategorySchema = createInsertSchema(tripCategories);
export const insertTripSchema = createInsertSchema(trips);
export const insertDriverScheduleSchema = createInsertSchema(driverSchedules);
export const insertDriverDutyStatusSchema = createInsertSchema(driverDutyStatus);
export const insertDriverLocationSchema = createInsertSchema(driverLocations);
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertNotificationDeliverySchema = createInsertSchema(notificationDeliveries);
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences);
export const insertTripStatusLogSchema = createInsertSchema(tripStatusLogs);
export const insertOfflineUpdateSchema = createInsertSchema(offlineUpdates);
export const insertSystemSettingsSchema = createInsertSchema(systemSettings);
export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
export const insertTenantRoleSchema = createInsertSchema(tenantRoles);
export const insertUserMentionSchema = createInsertSchema(userMentions);
export const insertActivityLogSchema = createInsertSchema(activityLog);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertCommentSchema = createInsertSchema(comments);
export const insertNoteSchema = createInsertSchema(notes);
export const insertUserTodoSchema = createInsertSchema(userTodos);
export const insertProgramLicensureSchema = createInsertSchema(programLicensures);
export const insertStaffCertificationSchema = createInsertSchema(staffCertifications);
export const insertProgramFormSchema = createInsertSchema(programForms);
export const insertProgramCurriculumSchema = createInsertSchema(programCurriculum);
export const insertProgramOnboardingItemSchema = createInsertSchema(programOnboardingItems);
export const insertLocationRoomBedSchema = createInsertSchema(locationRoomBeds);

// ============================================================================
// SELECT SCHEMAS (Zod validation)
// ============================================================================

export const selectCorporateClientSchema = createSelectSchema(corporateClients);
export const selectProgramSchema = createSelectSchema(programs);
export const selectLocationSchema = createSelectSchema(locations);
export const selectFrequentLocationSchema = createSelectSchema(frequentLocations);
export const selectUserSchema = createSelectSchema(users);
export const selectClientSchema = createSelectSchema(clients);
export const selectClientGroupSchema = createSelectSchema(clientGroups);
export const selectClientGroupMembershipSchema = createSelectSchema(clientGroupMemberships);
export const selectDriverSchema = createSelectSchema(drivers);
export const selectVehicleSchema = createSelectSchema(vehicles);
export const selectVehicleAssignmentSchema = createSelectSchema(vehicleAssignments);
export const selectVehicleMaintenanceSchema = createSelectSchema(vehicleMaintenance);
export const selectTripCategorySchema = createSelectSchema(tripCategories);
export const selectTripSchema = createSelectSchema(trips);
export const selectDriverScheduleSchema = createSelectSchema(driverSchedules);
export const selectDriverDutyStatusSchema = createSelectSchema(driverDutyStatus);
export const selectDriverLocationSchema = createSelectSchema(driverLocations);
export const selectNotificationTemplateSchema = createSelectSchema(notificationTemplates);
export const selectNotificationSchema = createSelectSchema(notifications);
export const selectNotificationDeliverySchema = createSelectSchema(notificationDeliveries);
export const selectNotificationPreferenceSchema = createSelectSchema(notificationPreferences);
export const selectTripStatusLogSchema = createSelectSchema(tripStatusLogs);
export const selectOfflineUpdateSchema = createSelectSchema(offlineUpdates);
export const selectSystemSettingsSchema = createSelectSchema(systemSettings);
export const selectRolePermissionSchema = createSelectSchema(rolePermissions);
export const selectUserMentionSchema = createSelectSchema(userMentions);
export const selectActivityLogSchema = createSelectSchema(activityLog);
export const selectTaskSchema = createSelectSchema(tasks);
export const selectCommentSchema = createSelectSchema(comments);
export const selectNoteSchema = createSelectSchema(notes);
export const selectUserTodoSchema = createSelectSchema(userTodos);
export const selectProgramLicensureSchema = createSelectSchema(programLicensures);
export const selectStaffCertificationSchema = createSelectSchema(staffCertifications);
export const selectProgramFormSchema = createSelectSchema(programForms);
export const selectProgramCurriculumSchema = createSelectSchema(programCurriculum);
export const selectProgramOnboardingItemSchema = createSelectSchema(programOnboardingItems);
export const selectLocationRoomBedSchema = createSelectSchema(locationRoomBeds);

// ============================================================================
// SELECT TYPES (TypeScript types)
// ============================================================================

export type CorporateClient = typeof corporateClients.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type FrequentLocation = typeof frequentLocations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type ClientGroup = typeof clientGroups.$inferSelect;
export type ClientGroupMembership = typeof clientGroupMemberships.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type VehicleAssignment = typeof vehicleAssignments.$inferSelect;
export type VehicleMaintenance = typeof vehicleMaintenance.$inferSelect;
export type TripCategory = typeof tripCategories.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type DriverSchedule = typeof driverSchedules.$inferSelect;
export type DriverDutyStatus = typeof driverDutyStatus.$inferSelect;
export type DriverLocation = typeof driverLocations.$inferSelect;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type TripStatusLog = typeof tripStatusLogs.$inferSelect;
export type OfflineUpdate = typeof offlineUpdates.$inferSelect;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type TenantRole = typeof tenantRoles.$inferSelect;
export type UserMention = typeof userMentions.$inferSelect;
export type InsertUserMention = typeof userMentions.$inferInsert;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;
export type UserTodo = typeof userTodos.$inferSelect;
export type InsertUserTodo = typeof userTodos.$inferInsert;
export type ProgramLicensure = typeof programLicensures.$inferSelect;
export type InsertProgramLicensure = typeof programLicensures.$inferInsert;
export type StaffCertification = typeof staffCertifications.$inferSelect;
export type InsertStaffCertification = typeof staffCertifications.$inferInsert;
export type ProgramForm = typeof programForms.$inferSelect;
export type InsertProgramForm = typeof programForms.$inferInsert;
export type ProgramCurriculum = typeof programCurriculum.$inferSelect;
export type InsertProgramCurriculum = typeof programCurriculum.$inferInsert;
export type ProgramOnboardingItem = typeof programOnboardingItems.$inferSelect;
export type InsertProgramOnboardingItem = typeof programOnboardingItems.$inferInsert;
export type LocationRoomBed = typeof locationRoomBeds.$inferSelect;
export type InsertLocationRoomBed = typeof locationRoomBeds.$inferInsert;
export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type InsertKanbanBoard = typeof kanbanBoards.$inferInsert;
export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type InsertKanbanColumn = typeof kanbanColumns.$inferInsert;
export type KanbanCard = typeof kanbanCards.$inferSelect;
export type InsertKanbanCard = typeof kanbanCards.$inferInsert;

// ============================================================================
// INSERT TYPES (TypeScript types for inserts)
// ============================================================================

export type InsertCorporateClient = typeof insertCorporateClientSchema._type;
export type InsertProgram = typeof insertProgramSchema._type;
export type InsertLocation = typeof insertLocationSchema._type;
export type InsertFrequentLocation = typeof insertFrequentLocationSchema._type;
export type InsertUser = typeof insertUserSchema._type;
export type InsertClient = typeof insertClientSchema._type;
export type InsertClientGroup = typeof insertClientGroupSchema._type;
export type InsertClientGroupMembership = typeof insertClientGroupMembershipSchema._type;
export type InsertDriver = typeof insertDriverSchema._type;
export type InsertVehicle = typeof insertVehicleSchema._type;
export type InsertVehicleAssignment = typeof insertVehicleAssignmentSchema._type;
export type InsertVehicleMaintenance = typeof insertVehicleMaintenanceSchema._type;
export type InsertTripCategory = typeof insertTripCategorySchema._type;
export type InsertTrip = typeof insertTripSchema._type;
export type InsertDriverSchedule = typeof insertDriverScheduleSchema._type;
export type InsertDriverDutyStatus = typeof insertDriverDutyStatusSchema._type;
export type InsertDriverLocation = typeof insertDriverLocationSchema._type;
export type InsertNotificationTemplate = typeof insertNotificationTemplateSchema._type;
export type InsertNotification = typeof insertNotificationSchema._type;
export type InsertNotificationDelivery = typeof insertNotificationDeliverySchema._type;
export type InsertNotificationPreference = typeof insertNotificationPreferenceSchema._type;
export type InsertTripStatusLog = typeof insertTripStatusLogSchema._type;
export type InsertOfflineUpdate = typeof insertOfflineUpdateSchema._type;
export type InsertRolePermission = typeof insertRolePermissionSchema._type;
export type InsertTenantRole = typeof insertTenantRoleSchema._type;
export type InsertUserMention = typeof insertUserMentionSchema._type;
export type InsertActivityLog = typeof insertActivityLogSchema._type;
export type InsertTask = typeof insertTaskSchema._type;
export type InsertComment = typeof insertCommentSchema._type;
export type InsertNote = typeof insertNoteSchema._type;
export type InsertUserTodo = typeof insertUserTodoSchema._type;
export type InsertProgramLicensure = typeof insertProgramLicensureSchema._type;
export type InsertStaffCertification = typeof insertStaffCertificationSchema._type;
export type InsertProgramForm = typeof insertProgramFormSchema._type;
export type InsertProgramCurriculum = typeof insertProgramCurriculumSchema._type;
export type InsertProgramOnboardingItem = typeof insertProgramOnboardingItemSchema._type;
export type InsertLocationRoomBed = typeof insertLocationRoomBedSchema._type;
