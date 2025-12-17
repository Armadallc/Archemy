# HIPAA-Compliant Identifier System Migration Guide

## Overview
This migration implements a dual-key identifier system:
- **Internal Keys**: UUIDs remain as primary keys (no breaking changes)
- **Display Keys**: Human-readable IDs (SCID for clients, reference_id for trips)

**Note**: SCID (Service Client ID) is used instead of MRN (Medical Record Number) to accurately reflect HALCYON's role as a Transportation Management System (TMS) rather than a clinical health record system. This avoids regulatory confusion while serving the same purpose as a permanent, human-readable client identifier.

## Migration Files

### 001_hipaa_identifier_system.sql
**Purpose**: Add schema changes and PostgreSQL functions

**What it does**:
1. Creates `id_sequences` table for safe concurrent sequence generation
2. Adds `code` columns to `corporate_clients`, `programs`, and `locations`
3. Adds `scid` column to `clients` table (Service Client ID)
4. Adds `reference_id` column to `trips` table
5. Creates PostgreSQL functions:
   - `generate_client_scid(program_code)` - Generates SCIDs like "MC-0158"
   - `generate_trip_reference_id(program_code, date)` - Generates IDs like "T241030-MC-001"
   - `derive_program_code(name)` - Helper to extract code from program name
   - `derive_location_code(name)` - Helper to extract code from location name
6. Creates indexes for performance

**Run this first** before any application code changes.

### 002_backfill_display_ids.sql
**Purpose**: Backfill existing records with display IDs

**What it does**:
1. Generates codes for existing corporate clients, programs, and locations
2. Generates SCIDs for all existing clients (ordered by creation date)
3. Generates reference_ids for all existing trips (ordered by creation date)
4. Adds unique constraints after backfill completes

**Run this second** after the schema migration.

### 003_rename_mrn_to_scid.sql
**Purpose**: Rename MRN to SCID (for existing deployments that used MRN)

**What it does**:
1. Updates sequence data (`client_mrn` → `client_scid` in `id_sequences` table)
2. Drops old `generate_client_mrn()` function and creates `generate_client_scid()`
3. Renames `clients.mrn` column to `clients.scid`
4. Updates indexes and constraints to use SCID naming
5. Adds documentation comments

**When to run**: 
- **Only needed** if you already ran migrations 001 and 002 with the old MRN naming
- **Skip this** if you're running migrations 001 and 002 for the first time (they now use SCID from the start)

### 004_create_scid_rpc_wrapper.sql
**Purpose**: Create Supabase RPC wrapper functions for SCID generation

**What it does**:
1. Creates `generate_client_scid_rpc()` - RPC wrapper for client SCID generation
2. Creates `generate_trip_reference_id_rpc()` - RPC wrapper for trip reference ID generation
3. Grants execute permissions to authenticated users and service_role
4. Allows application code to call these functions via `supabase.rpc()`

**When to run**: 
- **Required** for Phase 2 (Application Layer Integration)
- Run this after migrations 001, 002, and optionally 003
- This enables automatic SCID generation when creating new clients/trips via the API

### 006_sync_scid_sequences.sql
**Purpose**: Sync sequence table with existing SCIDs to prevent duplicates

**What it does**:
1. Finds the maximum SCID sequence number for each program
2. Updates `id_sequences` table to start from the correct number
3. Prevents duplicate SCID errors when creating new clients
4. Initializes sequences for programs with no existing clients

**When to run**: 
- **Run this if you're getting duplicate SCID errors** when creating new clients
- Run this after migration 002 (backfill) if sequences seem out of sync
- This ensures new SCIDs don't conflict with existing ones

### 009_fix_scid_sequence_increment.sql
**Purpose**: Fix sequence increment logic to ensure proper incrementation

**What it does**:
1. Rewrites `generate_client_scid()` to use UPDATE first, then INSERT
2. Ensures `RETURNING` clause returns the NEW incremented value
3. Fixes issue where sequences weren't incrementing properly

**When to run**: 
- **Run this if sequences are stuck** (generating same SCID repeatedly)
- Run this after migration 008 if sequences still aren't incrementing
- This fixes the root cause of duplicate SCID generation

### 011a_diagnose_code_format_issues.sql
**Purpose**: Diagnose code format issues before running migration 011

**What it does**:
1. Identifies corporate client codes that don't match format `^[A-Z]{2,5}$`
2. Identifies program codes that don't match format `^[A-Z]{2,4}$`
3. Identifies location codes that don't match format `^[A-Z]{2,5}$`
4. Provides summary counts of valid vs invalid codes

**When to run**: 
- **Run this BEFORE migration 011** if you get format constraint errors
- Use this to identify which codes need fixing

### 011b_fix_code_format_issues.sql
**Purpose**: Fix code format issues to prepare for migration 011

**What it does**:
1. Normalizes corporate client codes to uppercase, letters only, 2-5 chars
2. Normalizes program codes to uppercase, letters only, 2-4 chars
3. Normalizes location codes to uppercase, letters only, 2-5 chars
4. Handles duplicates by adding number suffixes
5. Generates codes from names if missing or invalid

**When to run**: 
- **Run this AFTER 011a** if format issues are found
- **Run this BEFORE migration 011** to fix format violations
- This ensures all codes match the required format before constraints are added

### 011_formalize_identifier_constraints.sql
**Purpose**: Formalize Tenant/Program/Location identifier system with constraints

**What it does**:
1. Validates that all codes are populated, unique, and match format (fails if data issues found)
2. Adds NOT NULL constraints to `corporate_clients.code`, `programs.code`, and `locations.code`
3. Adds UNIQUE constraints:
   - Global uniqueness for `corporate_clients.code` (Tenant ID)
   - Global uniqueness for `programs.code` (required for SCID system)
   - Composite uniqueness for `locations.code` (unique within `program_id`)
4. Adds CHECK constraints for format validation:
   - Corporate clients: `^[A-Z]{2,5}$` (2-5 uppercase letters)
   - Programs: `^[A-Z]{2,4}$` (2-4 uppercase letters)
   - Locations: `^[A-Z]{2,5}$` (2-5 uppercase letters)
5. Verifies SCID generation compatibility

**When to run**: 
- **Run this after migrations 001 and 002** (schema and backfill complete)
- **If you get format errors**: Run 011a (diagnose) → 011b (fix) → 011 (constraints)
- **Prerequisites**: All codes must be populated, unique, and match format
- This formalizes the identifier system and ensures data integrity
- Creates complete hierarchy: Tenant → Program → Location → Client SCID → Trip Reference

## Running the Migrations

### Option 1: Using psql
```bash
# Connect to your database
psql -h <host> -U <user> -d <database>

# Run migrations in order
\i server/migrations/001_hipaa_identifier_system.sql
\i server/migrations/002_backfill_display_ids.sql

# Only run 003 if you previously ran 001/002 with MRN naming
# \i server/migrations/003_rename_mrn_to_scid.sql

# Required for Phase 2: Application Layer Integration
\i server/migrations/004_create_scid_rpc_wrapper.sql
```

### Option 2: Using Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `001_hipaa_identifier_system.sql`
3. Execute
4. Repeat for `002_backfill_display_ids.sql`

### Option 3: Programmatic (Node.js)
```typescript
import { readFileSync } from 'fs';
import { supabase } from './minimal-supabase';

async function runMigration(filePath: string) {
  const sql = readFileSync(filePath, 'utf-8');
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
}

// Run in order
await runMigration('server/migrations/001_hipaa_identifier_system.sql');
await runMigration('server/migrations/002_backfill_display_ids.sql');

// Only run 003 if you previously ran 001/002 with MRN naming
// await runMigration('server/migrations/003_rename_mrn_to_scid.sql');

// Required for Phase 2: Application Layer Integration
await runMigration('server/migrations/004_create_scid_rpc_wrapper.sql');
```

## Verification

After running migrations, verify:

```sql
-- Check that sequences table exists
SELECT * FROM id_sequences LIMIT 5;

-- Check that clients have SCIDs
SELECT id, scid, first_name, last_name FROM clients WHERE scid IS NOT NULL LIMIT 10;

-- Check that trips have reference_ids
SELECT id, reference_id, scheduled_pickup_time FROM trips WHERE reference_id IS NOT NULL LIMIT 10;

-- Check program codes
SELECT id, name, code FROM programs WHERE code IS NOT NULL LIMIT 10;

-- Test SCID generation function
SELECT generate_client_scid('MC');

-- Test trip reference ID generation
SELECT generate_trip_reference_id('MC', CURRENT_DATE);
```

## Next Steps (Phase 2)

After migrations are complete:
1. Update `clientsStorage.createClient()` to generate SCID after insertion
2. Update trip creation endpoints to generate reference_id
3. Create lookup endpoint: `GET /api/clients/lookup?scid=MC-0158`
4. Update UI to display human-readable IDs (SCID) instead of UUIDs

### 012_create_contact_categories.sql
**Purpose**: Create table for predefined contact categories

**What it does**:
1. Creates `contact_categories` table with 8 predefined categories
2. Categories: Recovery, Comp/Rest, Liaison, Case Management, Referrals, Clinical, CMA, Other
3. The "Other" category allows custom text input (`allows_custom_text = true`)

**When to run**: 
- **Run this first** before migration 013 (contacts table depends on categories)
- Part of Contacts Tab feature implementation

### 013_create_contacts_table.sql
**Purpose**: Create table for user contacts (personal phone book)

**What it does**:
1. Creates `contacts` table for user-created and auto-populated contacts
2. Supports both app users (linked via `user_id`) and external contacts
3. Includes fields for: name, email, phone, organization, role, category, program, location
4. Includes `category_custom_text` for "Other" category custom descriptions
5. Creates indexes for performance
6. Creates unique constraint to prevent duplicate app user contacts per owner

**When to run**: 
- **Run this after migration 012** (depends on contact_categories table)
- Part of Contacts Tab feature implementation

**Important**: After running 013, you should also run `013a_fix_contacts_unique_constraint.sql` to fix the unique constraint for ON CONFLICT support.

### 013a_fix_contacts_unique_constraint.sql
**Purpose**: Fix unique constraint to work with ON CONFLICT in sync functions

**What it does**:
1. Drops the partial unique index from migration 013
2. Cleans up any duplicate app user contacts
3. Creates a proper unique constraint that works with ON CONFLICT
4. Allows external contacts (user_id IS NULL) to have duplicates

**When to run**: 
- **Run this immediately after migration 013**
- Required for the sync functions in migration 014 to work properly
- Safe to run if you already ran 013 (cleans up duplicates first)

### 014_auto_populate_contacts.sql
**Purpose**: Functions to auto-populate contacts from tenant users

**What it does**:
1. Creates `auto_populate_tenant_contacts()` trigger function (not enabled by default)
2. Creates `sync_tenant_users_to_contacts(user_id)` function for manual sync
3. Sync function adds all users from same tenant as contacts
4. Updates existing contacts if user info changed
5. Adds SECURITY DEFINER and GRANT EXECUTE permissions for RPC access

**When to run**: 
- **Run this after migration 013** (depends on contacts table)
- Part of Contacts Tab feature implementation
- Note: Trigger is commented out - manual sync via API is preferred

**If you get RPC errors**: If you already ran migration 014 before it included the GRANT statements, run `014a_fix_contacts_rpc_permissions.sql` to add the missing permissions.

### 014a_fix_contacts_rpc_permissions.sql
**Purpose**: Fix missing RPC permissions for sync_tenant_users_to_contacts function

**What it does**:
1. Adds SECURITY DEFINER to the function (if not already present)
2. Grants EXECUTE permission to authenticated and service_role
3. Verifies the function exists before applying changes

**When to run**: 
- **Only needed if you ran migration 014 before it included GRANT statements**
- Run this if you get "Could not find the function" errors when syncing contacts
- Safe to run multiple times (idempotent)

### 015_backfill_existing_contacts.sql
**Purpose**: Initial sync of tenant users to contacts for all existing users

**What it does**:
1. Loops through all active users with corporate_client_id
2. Calls `sync_tenant_users_to_contacts()` for each user
3. Populates contacts table with tenant users automatically
4. Provides summary statistics of contacts created

**When to run**: 
- **Run this after migrations 012, 013, and 014** to populate contacts for existing users
- This is optional - users can also sync manually via the UI "Sync Tenant Users" button
- Provides a one-time backfill for all existing users
- After running, check the output for total contacts synced

## Rollback (if needed)

If you need to rollback:

```sql
-- Remove unique constraints
DROP INDEX IF EXISTS idx_clients_scid_unique;
DROP INDEX IF EXISTS idx_clients_mrn_unique; -- Legacy
DROP INDEX IF EXISTS idx_trips_reference_id_unique;

-- Remove columns (WARNING: This will delete data)
ALTER TABLE clients DROP COLUMN IF EXISTS scid;
ALTER TABLE clients DROP COLUMN IF EXISTS mrn; -- Legacy
ALTER TABLE trips DROP COLUMN IF EXISTS reference_id;
ALTER TABLE programs DROP COLUMN IF EXISTS code;
ALTER TABLE corporate_clients DROP COLUMN IF EXISTS code;
ALTER TABLE locations DROP COLUMN IF EXISTS code;

-- Drop functions
DROP FUNCTION IF EXISTS generate_client_scid(VARCHAR);
DROP FUNCTION IF EXISTS generate_client_mrn(VARCHAR); -- Legacy
DROP FUNCTION IF EXISTS generate_trip_reference_id(VARCHAR, DATE);
DROP FUNCTION IF EXISTS derive_program_code(VARCHAR);
DROP FUNCTION IF EXISTS derive_location_code(VARCHAR);

-- Drop sequences table
DROP TABLE IF EXISTS id_sequences;
```




