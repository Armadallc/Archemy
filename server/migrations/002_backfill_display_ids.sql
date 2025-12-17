-- ============================================================================
-- HIPAA-Compliant Identifier System Migration
-- Phase 1: Backfill Existing Data
-- ============================================================================
-- This script backfills display IDs for existing records
-- Run this AFTER the schema migration (001_hipaa_identifier_system.sql)
-- Created: 2024-12-15

-- ============================================================================
-- STEP 1: Backfill Corporate Client Codes
-- ============================================================================
-- Note: Corporate client codes should be manually set, but we'll generate
-- a default based on name for existing records
UPDATE corporate_clients
SET code = UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^A-Z]', '', 'g'), 1, 3))
WHERE code IS NULL;

-- ============================================================================
-- STEP 2: Backfill Program Codes
-- ============================================================================
-- Derive program codes from program names
UPDATE programs
SET code = derive_program_code(name)
WHERE code IS NULL;

-- ============================================================================
-- STEP 3: Backfill Location Codes
-- ============================================================================
-- Derive location codes from location names
UPDATE locations
SET code = derive_location_code(name)
WHERE code IS NULL;

-- ============================================================================
-- STEP 4: Backfill Client SCIDs
-- ============================================================================
-- First, initialize sequence table based on existing SCIDs to avoid duplicates
-- This ensures we continue from the highest existing sequence number
DO $$
DECLARE
    program_record RECORD;
    max_seq INTEGER;
BEGIN
    -- For each program, find the maximum sequence number from existing SCIDs
    FOR program_record IN
        SELECT 
            p.code as program_code,
            COALESCE(MAX(CAST(SUBSTRING(c.scid FROM '-(.+)$') AS INTEGER)), 0) as max_seq_num
        FROM programs p
        LEFT JOIN clients c ON c.program_id = p.id AND c.scid IS NOT NULL AND c.scid ~ '^[A-Z0-9]+-[0-9]+$'
        WHERE p.code IS NOT NULL
        GROUP BY p.code
    LOOP
        -- Initialize or update the sequence to start from max existing + 1
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_scid', program_record.program_code, NULL, program_record.max_seq_num)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = GREATEST(id_sequences.last_value, program_record.max_seq_num),
            updated_at = NOW();
    END LOOP;
END $$;

-- Generate SCIDs (Service Client IDs) for all existing clients, ordered by creation date
-- This ensures consistent numbering based on when clients were created
-- Note: SCID is used instead of MRN to accurately reflect HALCYON's role as a
-- Transportation Management System (TMS) rather than a clinical health record system.
DO $$
DECLARE
    client_record RECORD;
    program_code_val VARCHAR(10);
    new_scid VARCHAR(20);
BEGIN
    -- Process clients in order of creation
    -- Support both mrn (legacy) and scid column names for backward compatibility
    FOR client_record IN 
        SELECT c.id, c.program_id, p.code as program_code
        FROM clients c
        JOIN programs p ON c.program_id = p.id
        WHERE (c.scid IS NULL AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = 'mrn'
        )) OR (EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = 'mrn'
        ) AND c.mrn IS NULL)
        ORDER BY c.created_at ASC
    LOOP
        -- Get or derive program code
        IF client_record.program_code IS NULL OR client_record.program_code = '' THEN
            SELECT code INTO program_code_val
            FROM programs
            WHERE id = client_record.program_id;
            
            -- If still null, derive it
            IF program_code_val IS NULL OR program_code_val = '' THEN
                SELECT derive_program_code(name) INTO program_code_val
                FROM programs
                WHERE id = client_record.program_id;
                
                -- Update program with derived code
                UPDATE programs
                SET code = program_code_val
                WHERE id = client_record.program_id;
            END IF;
        ELSE
            program_code_val := client_record.program_code;
        END IF;
        
        -- Generate SCID
        SELECT generate_client_scid(program_code_val) INTO new_scid;
        
        -- Update client with SCID (support both column names for migration period)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = 'scid'
        ) THEN
            UPDATE clients
            SET scid = new_scid
            WHERE id = client_record.id;
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = 'mrn'
        ) THEN
            -- Legacy support: update mrn if scid column doesn't exist yet
            UPDATE clients
            SET mrn = new_scid
            WHERE id = client_record.id;
        END IF;
        
        -- Log progress (optional, can be removed in production)
        RAISE NOTICE 'Generated SCID % for client %', new_scid, client_record.id;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: Backfill Trip Reference IDs
-- ============================================================================
-- Generate reference IDs for all existing trips, ordered by creation date
DO $$
DECLARE
    trip_record RECORD;
    program_code_val VARCHAR(10);
    trip_date_val DATE;
    new_reference_id VARCHAR(30);
BEGIN
    -- Process trips in order of creation
    FOR trip_record IN 
        SELECT t.id, t.program_id, t.scheduled_pickup_time, p.code as program_code
        FROM trips t
        JOIN programs p ON t.program_id = p.id
        WHERE t.reference_id IS NULL
        ORDER BY t.created_at ASC
    LOOP
        -- Get or derive program code
        IF trip_record.program_code IS NULL OR trip_record.program_code = '' THEN
            SELECT code INTO program_code_val
            FROM programs
            WHERE id = trip_record.program_id;
            
            -- If still null, derive it
            IF program_code_val IS NULL OR program_code_val = '' THEN
                SELECT derive_program_code(name) INTO program_code_val
                FROM programs
                WHERE id = trip_record.program_id;
                
                -- Update program with derived code
                UPDATE programs
                SET code = program_code_val
                WHERE id = trip_record.program_id;
            END IF;
        ELSE
            program_code_val := trip_record.program_code;
        END IF;
        
        -- Extract date from scheduled_pickup_time
        trip_date_val := trip_record.scheduled_pickup_time::DATE;
        
        -- Generate reference ID
        SELECT generate_trip_reference_id(program_code_val, trip_date_val) INTO new_reference_id;
        
        -- Update trip with reference_id
        UPDATE trips
        SET reference_id = new_reference_id
        WHERE id = trip_record.id;
        
        -- Log progress (optional, can be removed in production)
        RAISE NOTICE 'Generated reference_id % for trip %', new_reference_id, trip_record.id;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 6: Clean Up Duplicate SCIDs (if any exist)
-- ============================================================================
-- If there are duplicate SCIDs from a previous partial run, clear all duplicates
-- so we can regenerate them properly. Keep only the first occurrence (oldest by created_at).
UPDATE clients
SET scid = NULL
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY scid ORDER BY created_at ASC) as row_num
        FROM clients
        WHERE scid IS NOT NULL
    ) ranked
    WHERE row_num > 1
);

-- ============================================================================
-- STEP 7: Add Unique Constraints (After Backfill)
-- ============================================================================
-- Now that all records have display IDs and duplicates are cleaned up,
-- we can safely add unique constraints

-- Add unique constraint on SCID (or mrn if migration hasn't run yet)
-- This handles both the new scid column and legacy mrn column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'scid'
    ) THEN
        -- Use scid column (new naming)
        CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_scid_unique 
            ON clients(scid) 
            WHERE scid IS NOT NULL;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'mrn'
    ) THEN
        -- Use mrn column (legacy, will be renamed by migration 003)
        CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_mrn_unique 
            ON clients(mrn) 
            WHERE mrn IS NOT NULL;
    END IF;
END $$;

-- Add unique constraint on reference_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_reference_id_unique 
    ON trips(reference_id) 
    WHERE reference_id IS NOT NULL;

-- ============================================================================
-- STEP 8: Add NOT NULL Constraints (Optional - for new records)
-- ============================================================================
-- Note: We keep these nullable for now to allow gradual migration
-- Once all records are backfilled and verified, we can add NOT NULL constraints
-- in a future migration if desired

-- ALTER TABLE clients ALTER COLUMN scid SET NOT NULL;
-- ALTER TABLE trips ALTER COLUMN reference_id SET NOT NULL;
-- ALTER TABLE programs ALTER COLUMN code SET NOT NULL;
