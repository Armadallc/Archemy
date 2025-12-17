-- ============================================================================
-- HIPAA-Compliant Identifier System Migration
-- Phase 1: Database Schema Migration
-- ============================================================================
-- This migration adds human-readable display IDs while preserving UUIDs as primary keys
-- Created: 2024-12-15
-- Version: 1.0.0

-- ============================================================================
-- STEP 1: Create ID Sequences Table
-- ============================================================================
-- This table manages safe, concurrent sequence generation per program and date
CREATE TABLE IF NOT EXISTS id_sequences (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    entity_type VARCHAR(50) NOT NULL, -- 'client_scid' or 'trip_reference'
    program_code VARCHAR(10) NOT NULL,
    date_key VARCHAR(10), -- NULL for client_scid, YYYY-MM-DD for trips
    last_value INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entity_type, program_code, date_key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_id_sequences_lookup 
    ON id_sequences(entity_type, program_code, COALESCE(date_key, ''));

-- ============================================================================
-- STEP 2: Add Code Columns to Corporate Clients, Programs, and Locations
-- ============================================================================

-- Add code column to corporate_clients (3-5 character code, manually set)
ALTER TABLE corporate_clients 
    ADD COLUMN IF NOT EXISTS code VARCHAR(5);

-- Add code column to programs (derived from program name)
ALTER TABLE programs 
    ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- Add code column to locations (short name for operational context)
ALTER TABLE locations 
    ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- ============================================================================
-- STEP 3: Add Display ID Columns to Clients and Trips
-- ============================================================================

-- Add SCID (Service Client ID) to clients table
-- Format: [PROGRAM_CODE]-[SEQ] (e.g., MC-0158)
-- Note: SCID is used instead of MRN to accurately reflect HALCYON's role as a
-- Transportation Management System (TMS) rather than a clinical health record system.
ALTER TABLE clients 
    ADD COLUMN IF NOT EXISTS scid VARCHAR(20);

-- Add unique constraint on SCID (once populated)
-- Note: We'll add this constraint after backfilling to avoid issues with NULLs
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_scid_unique ON clients(scid) WHERE scid IS NOT NULL;

-- Add reference_id to trips table
-- Format: T[YYMMDD]-[PROGRAM_CODE]-[SEQ] (e.g., T241030-MC-001)
ALTER TABLE trips 
    ADD COLUMN IF NOT EXISTS reference_id VARCHAR(30);

-- Add unique constraint on reference_id (once populated)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_reference_id_unique ON trips(reference_id) WHERE reference_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Create PostgreSQL Function to Generate Client SCID
-- ============================================================================
-- Drop existing function if it exists (to ensure clean replacement)
DROP FUNCTION IF EXISTS generate_client_scid(VARCHAR);
DROP FUNCTION IF EXISTS generate_client_mrn(VARCHAR); -- Legacy support

CREATE OR REPLACE FUNCTION generate_client_scid(p_program_code VARCHAR(10))
RETURNS VARCHAR(20) AS $$
DECLARE
    next_seq INTEGER;
    new_scid VARCHAR(20);
BEGIN
    -- Safely increment sequence using UPSERT to prevent race conditions
    -- First, try to update existing sequence (increment it)
    UPDATE id_sequences
    SET last_value = last_value + 1,
        updated_at = NOW()
    WHERE entity_type = 'client_scid' 
      AND program_code = p_program_code 
      AND date_key IS NULL
    RETURNING last_value INTO next_seq;
    
    -- If no row was updated (sequence doesn't exist), insert a new one starting at 1
    IF next_seq IS NULL THEN
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_scid', p_program_code, NULL, 1)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = id_sequences.last_value + 1,
            updated_at = NOW()
        RETURNING last_value INTO next_seq;
        
        -- If still NULL after INSERT (shouldn't happen, but safety check)
        IF next_seq IS NULL THEN
            SELECT last_value INTO next_seq
            FROM id_sequences
            WHERE entity_type = 'client_scid' 
              AND program_code = p_program_code 
              AND date_key IS NULL;
        END IF;
    END IF;
    
    -- Format: [PROGRAM_CODE]-[SEQ] with zero-padded 4-digit sequence
    new_scid := p_program_code || '-' || LPAD(next_seq::TEXT, 4, '0');
    
    RETURN new_scid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_client_scid(VARCHAR) IS 'Generates a Service Client ID (SCID) for transportation clients. Format: [PROGRAM_CODE]-[SEQ] (e.g., MC-0158). This identifier is used instead of MRN to avoid regulatory confusion with clinical Medical Record Numbers.';

-- ============================================================================
-- STEP 5: Create PostgreSQL Function to Generate Trip Reference ID
-- ============================================================================
-- Drop existing function if it exists (to ensure clean replacement)
DROP FUNCTION IF EXISTS generate_trip_reference_id(VARCHAR, DATE);

CREATE OR REPLACE FUNCTION generate_trip_reference_id(
    p_program_code VARCHAR(10),
    p_trip_date DATE
)
RETURNS VARCHAR(30) AS $$
DECLARE
    next_seq INTEGER;
    v_date_key VARCHAR(10);
    new_reference_id VARCHAR(30);
    v_date_str VARCHAR(6); -- YYMMDD format
BEGIN
    -- Format date as YYMMDD (e.g., 241030 for October 30, 2024)
    v_date_str := TO_CHAR(p_trip_date, 'YYMMDD');
    v_date_key := p_trip_date::TEXT; -- Store as YYYY-MM-DD for lookup
    
    -- Safely increment sequence using UPSERT to prevent race conditions
    INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
    VALUES ('trip_reference', p_program_code, v_date_key, 1)
    ON CONFLICT (entity_type, program_code, date_key)
    DO UPDATE SET 
        last_value = id_sequences.last_value + 1,
        updated_at = NOW()
    RETURNING last_value INTO next_seq;
    
    -- If INSERT didn't return a value (conflict occurred), fetch the updated value
    IF next_seq IS NULL THEN
        SELECT last_value INTO next_seq
        FROM id_sequences
        WHERE entity_type = 'trip_reference' 
          AND program_code = p_program_code 
          AND date_key = v_date_key;
    END IF;
    
    -- Format: T[YYMMDD]-[PROGRAM_CODE]-[SEQ] with zero-padded 3-digit sequence
    new_reference_id := 'T' || v_date_str || '-' || p_program_code || '-' || LPAD(next_seq::TEXT, 3, '0');
    
    RETURN new_reference_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Helper Function to Derive Program Code from Program Name
-- ============================================================================
-- Drop existing function if it exists (to ensure clean replacement)
DROP FUNCTION IF EXISTS derive_program_code(VARCHAR);

CREATE OR REPLACE FUNCTION derive_program_code(p_program_name VARCHAR(255))
RETURNS VARCHAR(10) AS $$
DECLARE
    v_code VARCHAR(10);
BEGIN
    -- Extract first 2-3 uppercase letters from program name
    -- Remove common words and extract meaningful initials
    v_code := UPPER(REGEXP_REPLACE(
        REGEXP_REPLACE(p_program_name, '\s+(the|of|and|for|in|on|at|to|a|an)\s+', ' ', 'gi'),
        '[^A-Z]', '', 'g'
    ));
    
    -- Take first 2-3 characters, default to first 2 if name is short
    IF LENGTH(v_code) >= 3 THEN
        v_code := SUBSTRING(v_code, 1, 3);
    ELSIF LENGTH(v_code) >= 2 THEN
        v_code := SUBSTRING(v_code, 1, 2);
    ELSE
        -- Fallback: use first 2 uppercase letters or 'PR' if none found
        v_code := COALESCE(SUBSTRING(UPPER(p_program_name), 1, 2), 'PR');
    END IF;
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Helper Function to Derive Location Code from Location Name
-- ============================================================================
-- Drop existing function if it exists (to ensure clean replacement)
DROP FUNCTION IF EXISTS derive_location_code(VARCHAR);

CREATE OR REPLACE FUNCTION derive_location_code(p_location_name VARCHAR(255))
RETURNS VARCHAR(10) AS $$
DECLARE
    v_code VARCHAR(10);
BEGIN
    -- Extract first 3 uppercase letters from location name
    v_code := UPPER(REGEXP_REPLACE(p_location_name, '[^A-Z]', '', 'g'));
    
    -- Take first 3 characters, or first 2 if name is short
    IF LENGTH(v_code) >= 3 THEN
        v_code := SUBSTRING(v_code, 1, 3);
    ELSIF LENGTH(v_code) >= 2 THEN
        v_code := SUBSTRING(v_code, 1, 2);
    ELSE
        -- Fallback: use first 3 uppercase letters or 'LOC' if none found
        v_code := COALESCE(SUBSTRING(UPPER(p_location_name), 1, 3), 'LOC');
    END IF;
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: Create Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_scid ON clients(scid) WHERE scid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_reference_id ON trips(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_corporate_clients_code ON corporate_clients(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(code) WHERE code IS NOT NULL;

