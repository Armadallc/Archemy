/**
 * PROJECT STANDARD: Database fields use snake_case
 * NEVER convert to camelCase - causes authentication failures
 * Examples: user_id, organization_id, service_area_id, pickup_time
 */
import { 
  pgTable, 
  text, 
  varchar, 
  uuid, 
  timestamp, 
  time, 
  integer, 
  boolean,
  pgEnum,
  jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'super_admin', 
  'monarch_owner', 
  'organization_admin', 
  'organization_user', 
  'driver'
]);

export const tripTypeEnum = pgEnum('trip_type', ['one_way', 'round_trip']);

export const tripStatusEnum = pgEnum('trip_status', [
  'scheduled', 
  'confirmed', 
  'in_progress', 
  'completed', 
  'cancelled'
]);

// System settings table for application-wide branding
export const system_settings = pgTable("system_settings", {
  id: text("id").primaryKey().default('app_settings'),
  app_name: text("app_name").default('Amish Limo Service'),
  main_logo_url: text("main_logo_url"), // Main application logo displayed above app name
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logo_url: text("logo_url"), // Organization logo
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  user_id: varchar("user_id").primaryKey(),
  user_name: varchar("user_name").notNull(),
  email: varchar("email").unique().notNull(),
  password_hash: varchar("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  primary_organization_id: varchar("primary_organization_id").references(() => organizations.id),
  authorized_organizations: varchar("authorized_organizations").array(),
  avatar_url: text("avatar_url"), // User profile avatar
  billing_pin: text("billing_pin"), // Individual billing PIN (hashed)
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Service areas table
export const serviceAreas = pgTable("service_areas", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  nickname: text("nickname").notNull(),
  description: text("description"),
  boundaryCoordinates: jsonb("boundary_coordinates"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client groups table
export const clientGroups = pgTable("client_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  serviceAreaId: uuid("service_area_id").references(() => serviceAreas.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client group memberships table (many-to-many relationship)
export const clientGroupMemberships = pgTable("client_group_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  groupId: uuid("group_id").references(() => clientGroups.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  serviceAreaId: text("service_area_id").references(() => serviceAreas.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  medicalNotes: text("medical_notes"),
  mobilityRequirements: text("mobility_requirements"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Drivers table
export const drivers = pgTable("drivers", {
  id: text("id").primaryKey(),
  userId: varchar("user_id").references(() => users.user_id).notNull(),
  primaryOrganizationId: varchar("primary_organization_id").references(() => organizations.id).notNull(),
  authorizedOrganizations: varchar("authorized_organizations").array(),
  licenseNumber: varchar("license_number").notNull(),
  licenseExpiry: timestamp("license_expiry"),
  vehicleInfo: text("vehicle_info"),
  phone: varchar("phone"),
  emergencyContact: varchar("emergency_contact"),
  emergencyPhone: varchar("emergency_phone"),
  isAvailable: boolean("is_available").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver schedules table
export const driverSchedules = pgTable("driver_schedules", {
  id: text("id").primaryKey(),
  driverId: varchar("driver_id").references(() => users.user_id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isOnCall: boolean("is_on_call").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trips table
export const trips = pgTable("trips", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  clientId: text("client_id").references(() => clients.id).notNull(),
  driverId: text("driver_id"),
  tripType: tripTypeEnum("trip_type").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  scheduledPickupTime: timestamp("scheduled_pickup_time").notNull(),
  scheduledReturnTime: timestamp("scheduled_return_time"),
  actualPickupTime: timestamp("actual_pickup_time"),
  actualDropoffTime: timestamp("actual_dropoff_time"),
  actualReturnTime: timestamp("actual_return_time"),
  passengerCount: integer("passenger_count").default(1),
  specialRequirements: text("special_requirements"),
  status: tripStatusEnum("status").default('scheduled'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  created_at: true,
  updated_at: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  created_at: true,
  updated_at: true,
});

export const insertServiceAreaSchema = createInsertSchema(serviceAreas).omit({
  created_at: true,
  updated_at: true,
});

export const insertClientGroupSchema = createInsertSchema(clientGroups).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertClientGroupMembershipSchema = createInsertSchema(clientGroupMemberships).omit({
  id: true,
  joinedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertDriverScheduleSchema = createInsertSchema(driverSchedules).omit({
  id: true,
  created_at: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  scheduledPickupTime: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  scheduledReturnTime: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val).optional(),
  actualPickupTime: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val).optional(),
  actualDropoffTime: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val).optional(),
  actualReturnTime: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val).optional(),
});

// Select types
export type Organization = typeof organizations.$inferSelect;
export type SystemSettings = typeof system_settings.$inferSelect;
export type User = typeof users.$inferSelect;
export type ServiceArea = typeof serviceAreas.$inferSelect;
export type ClientGroup = typeof clientGroups.$inferSelect;
export type ClientGroupMembership = typeof clientGroupMemberships.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type DriverSchedule = typeof driverSchedules.$inferSelect;
export type Trip = typeof trips.$inferSelect;

// Webhook Integration Tables
export const webhookIntegrations = pgTable("webhook_integrations", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // 'ritten', 'google_calendar', etc.
  
  // Configuration
  webhook_url: text("webhook_url"), // URL for Ritten to call
  secret_key: text("secret_key"), // For webhook validation
  api_key: text("api_key"), // For API authentication
  
  // Filtering rules
  filter_keywords: text("filter_keywords").array(), // ['transport', 'your_name']
  filter_attendees: text("filter_attendees").array(), // Specific attendee names/emails
  
  // Status
  status: text("status").default('inactive'), // 'active', 'inactive', 'error'
  last_sync: timestamp("last_sync"),
  sync_errors: jsonb("sync_errors"),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const webhookEventLogs = pgTable("webhook_event_logs", {
  id: text("id").primaryKey(),
  integration_id: text("integration_id").references(() => webhookIntegrations.id).notNull(),
  organization_id: text("organization_id").references(() => organizations.id).notNull(),
  
  // Event details
  event_type: text("event_type").notNull(), // 'created', 'updated', 'deleted'
  event_data: jsonb("event_data").notNull(), // Raw webhook payload
  
  // Processing results
  status: text("status").notNull(), // 'success', 'error', 'skipped'
  trips_created: text("trips_created").array(), // Trip IDs created
  error_message: text("error_message"),
  
  created_at: timestamp("created_at").defaultNow(),
});

export const tripCreationRules = pgTable("trip_creation_rules", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").references(() => organizations.id).notNull(),
  integration_id: text("integration_id").references(() => webhookIntegrations.id).notNull(),
  
  name: text("name").notNull(),
  description: text("description"),
  is_active: boolean("is_active").default(true),
  
  // Trigger conditions
  keyword_matches: text("keyword_matches").array(), // Keywords that must be present
  attendee_matches: text("attendee_matches").array(), // Attendees that must be present
  time_advance_hours: integer("time_advance_hours").default(2), // Only create trips X hours in advance
  
  // Trip creation settings
  auto_create: boolean("auto_create").default(true),
  trip_type: tripTypeEnum("trip_type").default('round_trip'),
  pickup_offset_minutes: integer("pickup_offset_minutes").default(-30), // 30 min before appointment
  dropoff_offset_minutes: integer("dropoff_offset_minutes").default(15), // 15 min after appointment
  default_pickup_location: text("default_pickup_location"), // Service area ID
  default_dropoff_location: text("default_dropoff_location"), // Service area ID
  requires_approval: boolean("requires_approval").default(false),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Billing module tables
export const billingCodes = pgTable("billing_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(), // T2003, T2004, A0120, etc.
  description: text("description").notNull(),
  category: text("category").notNull(), // 'transport', 'waiver', 'modifier'
  rate_colorado: text("rate_colorado"), // Colorado Medicaid rate
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const billingModifiers = pgTable("billing_modifiers", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(), // U1, U2, QM, TK, etc.
  description: text("description").notNull(),
  applies_to_codes: text("applies_to_codes").array(), // Which billing codes this modifier applies to
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const clientBillingInfo = pgTable("client_billing_info", {
  id: text("id").primaryKey(),
  client_id: text("client_id").references(() => clients.id).notNull(),
  organization_id: text("organization_id").references(() => organizations.id).notNull(),
  
  // Insurance information
  insurance_type: text("insurance_type").notNull(), // 'medicaid', 'medicare', 'private'
  medicaid_id: text("medicaid_id"),
  medicare_id: text("medicare_id"),
  group_number: text("group_number"),
  
  // Waiver information
  waiver_type: text("waiver_type"), // 'HCBS', 'CMHS', etc.
  waiver_id: text("waiver_id"),
  prior_authorization_number: text("prior_authorization_number"),
  authorization_expiry: timestamp("authorization_expiry"),
  
  // Billing provider
  billing_provider_npi: text("billing_provider_npi"),
  billing_provider_name: text("billing_provider_name"),
  billing_provider_taxonomy: text("billing_provider_taxonomy"),
  
  // Compliance
  hipaa_authorization_date: timestamp("hipaa_authorization_date"),
  billing_consent_date: timestamp("billing_consent_date"),
  
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const billingClaims = pgTable("billing_claims", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").references(() => organizations.id).notNull(),
  client_id: text("client_id").references(() => clients.id).notNull(),
  trip_id: text("trip_id").references(() => trips.id).notNull(),
  
  // Claim details
  claim_number: text("claim_number").unique(),
  service_date: timestamp("service_date").notNull(),
  billing_code: text("billing_code").references(() => billingCodes.code).notNull(),
  modifiers: text("modifiers").array(), // Array of modifier codes
  units: integer("units").default(1),
  rate: text("rate"), // Rate charged
  total_amount: text("total_amount"), // Total claim amount
  
  // Submission details
  status: text("status").notNull().default('draft'), // 'draft', 'submitted', 'paid', 'denied', 'resubmitted'
  submission_date: timestamp("submission_date"),
  payment_date: timestamp("payment_date"),
  paid_amount: text("paid_amount"),
  denial_reason: text("denial_reason"),
  
  // Generated form data
  cms_1500_data: jsonb("cms_1500_data"), // Complete CMS-1500 form data
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const billingBatches = pgTable("billing_batches", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").references(() => organizations.id).notNull(),
  
  name: text("name").notNull(), // e.g., "January 2025 Medicaid Claims"
  description: text("description"),
  claim_ids: text("claim_ids").array(), // Array of claim IDs in this batch
  total_claims: integer("total_claims").default(0),
  total_amount: text("total_amount"),
  
  status: text("status").notNull().default('draft'), // 'draft', 'submitted', 'processed'
  created_by: text("created_by").references(() => users.user_id).notNull(),
  submitted_date: timestamp("submitted_date"),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Insert schemas for webhook tables
export const insertWebhookIntegrationSchema = createInsertSchema(webhookIntegrations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTripCreationRuleSchema = createInsertSchema(tripCreationRules).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Insert schemas for billing tables
export const insertBillingCodeSchema = createInsertSchema(billingCodes).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertBillingModifierSchema = createInsertSchema(billingModifiers).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertClientBillingInfoSchema = createInsertSchema(clientBillingInfo).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertBillingClaimSchema = createInsertSchema(billingClaims).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertBillingBatchSchema = createInsertSchema(billingBatches).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Insert types
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
export type InsertClientGroup = z.infer<typeof insertClientGroupSchema>;
export type InsertClientGroupMembership = z.infer<typeof insertClientGroupMembershipSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertDriverSchedule = z.infer<typeof insertDriverScheduleSchema>;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertWebhookIntegration = z.infer<typeof insertWebhookIntegrationSchema>;
export type InsertTripCreationRule = z.infer<typeof insertTripCreationRuleSchema>;
export type InsertBillingCode = z.infer<typeof insertBillingCodeSchema>;
export type InsertBillingModifier = z.infer<typeof insertBillingModifierSchema>;
export type InsertClientBillingInfo = z.infer<typeof insertClientBillingInfoSchema>;
export type InsertBillingClaim = z.infer<typeof insertBillingClaimSchema>;
export type InsertBillingBatch = z.infer<typeof insertBillingBatchSchema>;

// Additional select types for webhook tables
export type WebhookIntegration = typeof webhookIntegrations.$inferSelect;
export type WebhookEventLog = typeof webhookEventLogs.$inferSelect;
export type TripCreationRule = typeof tripCreationRules.$inferSelect;

// Select types for billing tables
export type BillingCode = typeof billingCodes.$inferSelect;
export type BillingModifier = typeof billingModifiers.$inferSelect;
export type ClientBillingInfo = typeof clientBillingInfo.$inferSelect;
export type BillingClaim = typeof billingClaims.$inferSelect;
export type BillingBatch = typeof billingBatches.$inferSelect;
