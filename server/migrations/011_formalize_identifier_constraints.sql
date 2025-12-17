-- ============================================================================
-- Formalize Tenant/Program/Location Identifier System
-- Migration 011: Add NOT NULL, UNIQUE, and CHECK Constraints
-- ============================================================================
-- This migration formalizes the existing code columns into a complete,
-- consistent, and enforced identifier system.
--
-- Hierarchy: Tenant (corporate_client.code) → Program (programs.code) → 
--            Location (locations.code) → Client SCID → Trip Reference
--
-- Created: 2025-12-17
-- Version: 1.0.0
--
-- Prerequisites:
-- - Migration 001: Schema changes (code columns added)
-- - Migration 002: Backfill existing data (all codes populated)
-- - All codes must be populated and unique (validated in this migration)
-- ============================================================================

-- ============================================================================
-- STEP 1: Validation Queries (Run these first to verify data integrity)
-- ============================================================================
-- These queries will help identify any issues before applying constraints.
-- If any of these return rows, fix the data before proceeding.

-- Check for NULL corporate client codes
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM corporate_clients
    WHERE code IS NULL OR code = '';
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Found % corporate clients with NULL or empty codes. Please backfill codes before running this migration.', null_count;
    END IF;
END $$;

-- Check for NULL program codes
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM programs
    WHERE code IS NULL OR code = '';
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Found % programs with NULL or empty codes. Please backfill codes before running this migration.', null_count;
    END IF;
END $$;

-- Check for NULL location codes
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM locations
    WHERE code IS NULL OR code = '';
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Found % locations with NULL or empty codes. Please backfill codes before running this migration.', null_count;
    END IF;
END $$;

-- Check for duplicate corporate client codes
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT code, COUNT(*) as cnt
        FROM corporate_clients
        WHERE code IS NOT NULL
        GROUP BY code
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Found duplicate corporate client codes. Please resolve duplicates before running this migration.';
    END IF;
END $$;

-- Check for invalid corporate client code formats
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM corporate_clients
    WHERE code IS NOT NULL 
      AND code != ''
      AND code !~ '^[A-Z]{2,5}$';
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % corporate clients with invalid code formats. Codes must be 2-5 uppercase letters. Please run migration 011b_fix_code_format_issues.sql to fix format issues before running this migration.', invalid_count;
    END IF;
END $$;

-- Check for duplicate program codes (global uniqueness required for SCID system)
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT code, COUNT(*) as cnt
        FROM programs
        WHERE code IS NOT NULL
        GROUP BY code
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Found duplicate program codes. Program codes must be globally unique for SCID system. Please resolve duplicates before running this migration.';
    END IF;
END $$;

-- Check for invalid program code formats
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM programs
    WHERE code IS NOT NULL 
      AND code != ''
      AND code !~ '^[A-Z]{2,4}$';
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % programs with invalid code formats. Codes must be 2-4 uppercase letters. Please run migration 011b_fix_code_format_issues.sql to fix format issues before running this migration.', invalid_count;
    END IF;
END $$;

-- Check for duplicate location codes within the same program
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT program_id, code, COUNT(*) as cnt
        FROM locations
        WHERE code IS NOT NULL AND program_id IS NOT NULL
        GROUP BY program_id, code
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Found duplicate location codes within the same program. Please resolve duplicates before running this migration.';
    END IF;
END $$;

-- Check for invalid location code formats
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM locations
    WHERE code IS NOT NULL 
      AND code != ''
      AND code !~ '^[A-Z]{2,5}$';
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % locations with invalid code formats. Codes must be 2-5 uppercase letters. Please run migration 011b_fix_code_format_issues.sql to fix format issues before running this migration.', invalid_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Formalize Corporate Client (Tenant) Code
-- ============================================================================
-- Corporate client code is the Tenant ID - must be unique globally
-- Format: 2-5 uppercase letters (e.g., MON, APN, ABCDE)

-- Add NOT NULL constraint
ALTER TABLE corporate_clients
    ALTER COLUMN code SET NOT NULL;

-- Add UNIQUE constraint (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_corporate_clients_code'
        AND conrelid = 'corporate_clients'::regclass
    ) THEN
        ALTER TABLE corporate_clients
            ADD CONSTRAINT uq_corporate_clients_code UNIQUE (code);
    END IF;
END $$;

-- Add format CHECK constraint (2-5 uppercase letters)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_corporate_client_code_format'
        AND conrelid = 'corporate_clients'::regclass
    ) THEN
        ALTER TABLE corporate_clients
            ADD CONSTRAINT chk_corporate_client_code_format 
            CHECK (code ~ '^[A-Z]{2,5}$');
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Formalize Program Code
-- ============================================================================
-- Program code must be globally unique (used in SCID generation)
-- Format: 2-4 uppercase letters (e.g., MC, ABC, ABCD)

-- Add NOT NULL constraint
ALTER TABLE programs
    ALTER COLUMN code SET NOT NULL;

-- Add UNIQUE constraint (global uniqueness required for SCID system)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_programs_code'
        AND conrelid = 'programs'::regclass
    ) THEN
        ALTER TABLE programs
            ADD CONSTRAINT uq_programs_code UNIQUE (code);
    END IF;
END $$;

-- Add format CHECK constraint (2-4 uppercase letters)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_program_code_format'
        AND conrelid = 'programs'::regclass
    ) THEN
        ALTER TABLE programs
            ADD CONSTRAINT chk_program_code_format 
            CHECK (code ~ '^[A-Z]{2,4}$');
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Formalize Location Code
-- ============================================================================
-- Location code must be unique within its program (composite unique constraint)
-- Format: Flexible (typically 2-5 uppercase letters)

-- Add NOT NULL constraint
ALTER TABLE locations
    ALTER COLUMN code SET NOT NULL;

-- Add composite UNIQUE constraint (unique within program_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_location_program_code'
        AND conrelid = 'locations'::regclass
    ) THEN
        ALTER TABLE locations
            ADD CONSTRAINT uq_location_program_code 
            UNIQUE (program_id, code);
    END IF;
END $$;

-- Add format CHECK constraint (2-5 uppercase letters, flexible for locations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_location_code_format'
        AND conrelid = 'locations'::regclass
    ) THEN
        ALTER TABLE locations
            ADD CONSTRAINT chk_location_code_format 
            CHECK (code ~ '^[A-Z]{2,5}$');
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Verification Queries
-- ============================================================================
-- Run these after the migration to verify constraints are in place

-- Verify constraints exist
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('corporate_clients', 'programs', 'locations')
    AND tc.constraint_type IN ('UNIQUE', 'CHECK')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Verify NOT NULL constraints
SELECT 
    table_name,
    column_name,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('corporate_clients', 'programs', 'locations')
    AND column_name = 'code'
ORDER BY table_name;

-- ============================================================================
-- STEP 6: Test SCID Generation Compatibility
-- ============================================================================
-- Verify that the generate_client_scid function still works correctly
-- with the new constraints. This ensures backward compatibility.

-- Test SCID generation (should work if program codes are valid)
-- Uncomment to test:
-- SELECT generate_client_scid('MC');  -- Replace 'MC' with an actual program code

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All identifier columns are now formalized with:
-- ✅ NOT NULL constraints (ensures all records have identifiers)
-- ✅ UNIQUE constraints (ensures identifier uniqueness)
-- ✅ CHECK constraints (ensures format consistency)
--
-- The hierarchical identifier system is now complete:
-- Tenant (corporate_client.code) → Program (programs.code) → 
-- Location (locations.code) → Client SCID → Trip Reference
--
-- Next Steps:
-- 1. Update backend API endpoints to handle constraint violations gracefully
-- 2. Add validation in frontend forms to prevent invalid codes
-- 3. Consider creating a helper function for hierarchical display:
--    [Tenant]-[Program]-[Location]-[SCID] → MON-MC-LOW-MC-0157
