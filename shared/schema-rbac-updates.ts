/**
 * DRIZZLE ORM SCHEMA UPDATES FOR HYBRID RBAC
 * 
 * INSTRUCTIONS:
 * 1. Copy the relevant sections below into shared/schema.ts
 * 2. Place the enum after the existing enums (around line 60)
 * 3. Place the new tables after the rolePermissions table (around line 530)
 * 4. Update the existing users and rolePermissions table definitions
 * 
 * DO NOT replace the entire schema.ts file - only add/update these sections.
 */

import { pgTable, text, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { corporateClients } from './schema';
import { programs } from './schema';
import { users } from './schema';

// ============================================================================
// NEW ENUM: ROLE TYPE
// ============================================================================
// Add this after the existing enums (around line 60 in schema.ts)

export const roleTypeEnum = pgEnum('role_type', ['system', 'tenant']);

// ============================================================================
// NEW TABLE: TENANT ROLES
// ============================================================================
// Add this after the rolePermissions table definition (around line 530)

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
  created_by: varchar("created_by", { length: 50 })
    .references(() => users.user_id, { onDelete: 'set null' }),
});

// ============================================================================
// NEW TABLE: TENANT ROLE PERMISSIONS
// ============================================================================
// Add this after the tenantRoles table definition

export const tenantRolePermissions = pgTable("tenant_role_permissions", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  tenant_role_id: varchar("tenant_role_id", { length: 50 })
    .notNull()
    .references(() => tenantRoles.id, { onDelete: 'cascade' }),
  permission: varchar("permission", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 50 }).notNull().default('*'),
  program_id: varchar("program_id", { length: 50 })
    .references(() => programs.id, { onDelete: 'cascade' }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 })
    .references(() => corporateClients.id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// UPDATES TO EXISTING TABLES
// ============================================================================
// 
// UPDATE 1: USERS TABLE
// Location: Around line 137 in schema.ts
// Add these two columns to the existing users table definition:
//
//   tenant_role_id: varchar("tenant_role_id", { length: 50 })
//     .references(() => tenantRoles.id, { onDelete: 'set null' }),
//   active_tenant_id: varchar("active_tenant_id", { length: 50 })
//     .references(() => corporateClients.id, { onDelete: 'set null' }),
//
// Example of updated users table:
//
// export const users = pgTable("users", {
//   user_id: varchar("user_id", { length: 50 }).primaryKey(),
//   user_name: varchar("user_name", { length: 255 }).notNull(),
//   email: varchar("email", { length: 255 }).unique().notNull(),
//   password_hash: varchar("password_hash", { length: 255 }).notNull(),
//   role: userRoleEnum("role").notNull(),
//   primary_program_id: varchar("primary_program_id", { length: 50 })
//     .references(() => programs.id, { onDelete: 'set null' }),
//   authorized_programs: text("authorized_programs").array(),
//   corporate_client_id: varchar("corporate_client_id", { length: 50 })
//     .references(() => corporateClients.id, { onDelete: 'set null' }),
//   avatar_url: text("avatar_url"),
//   phone: varchar("phone", { length: 20 }),
//   first_name: varchar("first_name", { length: 255 }),
//   last_name: varchar("last_name", { length: 255 }),
//   is_active: boolean("is_active").default(true),
//   last_login: timestamp("last_login"),
//   tenant_role_id: varchar("tenant_role_id", { length: 50 })  // ADD THIS
//     .references(() => tenantRoles.id, { onDelete: 'set null' }),
//   active_tenant_id: varchar("active_tenant_id", { length: 50 })  // ADD THIS
//     .references(() => corporateClients.id, { onDelete: 'set null' }),
//   created_at: timestamp("created_at").defaultNow(),
//   updated_at: timestamp("updated_at").defaultNow(),
// });
//
// UPDATE 2: ROLE PERMISSIONS TABLE
// Location: Around line 521 in schema.ts
// Add the role_type column to the existing rolePermissions table:
//
//   role_type: varchar("role_type", { length: 20 })
//     .default('system')
//     .$type<'system' | 'tenant'>(),
//
// Example of updated rolePermissions table:
//
// export const rolePermissions = pgTable("role_permissions", {
//   id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
//   role: varchar("role", { length: 50 }).notNull(),
//   role_type: varchar("role_type", { length: 20 })  // ADD THIS
//     .default('system')
//     .$type<'system' | 'tenant'>(),
//   permission: varchar("permission", { length: 100 }).notNull(),
//   resource: varchar("resource", { length: 50 }).notNull().default('*'),
//   program_id: varchar("program_id", { length: 50 }),
//   corporate_client_id: varchar("corporate_client_id", { length: 50 }),
//   created_at: timestamp("created_at").defaultNow(),
//   updated_at: timestamp("updated_at").defaultNow(),
// });


