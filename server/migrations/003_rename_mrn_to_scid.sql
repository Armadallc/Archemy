-- ============================================================================
-- HIPAA-Compliant Identifier System Migration
-- Phase 2: Rename MRN to SCID (Service Client ID)
-- ============================================================================
-- This migration renames all MRN (Medical Record Number) references to SCID
-- (Service Client ID) to accurately reflect HALCYON's role as a Transportation
-- Management System (TMS) rather than a clinical health record system.
-- 
-- This is a safe, idempotent rename operation that preserves all data.
-- Created: 2024-12-15
-- Version: 1.1.0

-- ============================================================================
-- IMPORTANT: Order of Operations
-- ============================================================================
-- This script follows a safe order to minimize inconsistencies:
-- 1. Update sequence data (entity_type in id_sequences table)
-- 2. Drop old function and create new function with SCID naming
-- 3. Rename database column (clients.mrn → clients.scid)
-- 4. Update indexes and constraints
-- 5. Update any comments/documentation

-- ============================================================================
-- STEP 1: Update Sequence Data
-- ============================================================================
-- Update entity_type in id_sequences table from 'client_mrn' to 'client_scid'
-- This ensures sequence tracking continues seamlessly
UPDATE id_sequences 
SET entity_type = 'client_scid' 
WHERE entity_type = 'client_mrn';

-- Log the update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated % sequence records from client_mrn to client_scid', updated_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop Old Function and Create New Function
-- ============================================================================
-- Drop the old generate_client_mrn function
DROP FUNCTION IF EXISTS generate_client_mrn(VARCHAR);

-- Create the new generate_client_scid function with identical logic
-- This function generates Service Client IDs (SCIDs) in the format: [PROGRAM_CODE]-[SEQ]
-- Example: MC-0158
CREATE OR REPLACE FUNCTION generate_client_scid(p_program_code VARCHAR(10))
RETURNS VARCHAR(20) AS $$
DECLARE
    next_seq INTEGER;
    new_scid VARCHAR(20); -- Variable renamed from new_mrn to new_scid
BEGIN
    -- Safely increment sequence using UPSERT to prevent race conditions
    INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
    VALUES ('client_scid', p_program_code, NULL, 1)
    ON CONFLICT (entity_type, program_code, date_key)
    DO UPDATE SET 
        last_value = id_sequences.last_value + 1,
        updated_at = NOW()
    RETURNING last_value INTO next_seq;
    
    -- If INSERT didn't return a value (conflict occurred), fetch the updated value
    IF next_seq IS NULL THEN
        SELECT last_value INTO next_seq
        FROM id_sequences
        WHERE entity_type = 'client_scid' 
          AND program_code = p_program_code 
          AND date_key IS NULL;
    END IF;
    
    -- Format: [PROGRAM_CODE]-[SEQ] with zero-padded 4-digit sequence
    new_scid := p_program_code || '-' || LPAD(next_seq::TEXT, 4, '0');
    
    RETURN new_scid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_client_scid(VARCHAR) IS 
'Generates a Service Client ID (SCID) for transportation clients. Format: [PROGRAM_CODE]-[SEQ] (e.g., MC-0158). This identifier is used instead of MRN to avoid regulatory confusion with clinical Medical Record Numbers.';

-- ============================================================================
-- STEP 3: Rename Database Column
-- ============================================================================
-- Safely rename the column from mrn to scid
-- Note: This operation requires that no active transactions are using the mrn column
-- The column rename is atomic and safe if the application is not actively querying it

-- Check if column exists and rename it (only if mrn exists and scid doesn't)
DO $$
BEGIN
    -- Check if mrn column exists and scid doesn't exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'clients' 
          AND column_name = 'mrn'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'clients' 
          AND column_name = 'scid'
    ) THEN
        -- Rename the column
        ALTER TABLE clients RENAME COLUMN mrn TO scid;
        RAISE NOTICE 'Successfully renamed clients.mrn to clients.scid';
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'clients' 
          AND column_name = 'scid'
    ) THEN
        -- scid already exists - this migration is not needed
        -- This happens if migrations 001/002 were run with SCID from the start
        RAISE NOTICE 'Column clients.scid already exists. This migration is not needed - migrations 001/002 already use SCID naming.';
        
        -- If mrn also exists, we should drop it (it's a leftover)
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'clients' 
              AND column_name = 'mrn'
        ) THEN
            -- Copy any data from mrn to scid if scid is NULL
            UPDATE clients
            SET scid = mrn
            WHERE scid IS NULL AND mrn IS NOT NULL;
            
            -- Drop the old mrn column
            ALTER TABLE clients DROP COLUMN IF EXISTS mrn;
            RAISE NOTICE 'Dropped legacy clients.mrn column (data was already in clients.scid).';
        END IF;
    ELSE
        RAISE WARNING 'Neither clients.mrn nor clients.scid column found. This may indicate a schema issue.';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Update Indexes
-- ============================================================================
-- Drop old indexes that reference mrn
DROP INDEX IF EXISTS idx_clients_mrn;
DROP INDEX IF EXISTS idx_clients_mrn_unique;

-- Create new indexes with scid naming
CREATE INDEX IF NOT EXISTS idx_clients_scid 
    ON clients(scid) 
    WHERE scid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_scid_unique 
    ON clients(scid) 
    WHERE scid IS NOT NULL;

-- ============================================================================
-- STEP 5: Update Comments and Documentation
-- ============================================================================
-- Add comment to the scid column explaining its purpose
COMMENT ON COLUMN clients.scid IS 
'Service Client ID (SCID) - A permanent, human-readable identifier for transportation clients. Format: [PROGRAM_CODE]-[SEQ] (e.g., MC-0158). This replaces the previous MRN terminology to accurately reflect HALCYON''s role as a Transportation Management System (TMS) rather than a clinical health record system.';

-- ============================================================================
-- STEP 6: Verification Queries (Optional - for manual verification)
-- ============================================================================
-- Uncomment these queries to verify the migration:
-- 
-- -- Check that column was renamed
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'clients' AND column_name IN ('mrn', 'scid');
-- 
-- -- Check that function exists
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_name = 'generate_client_scid';
-- 
-- -- Check that sequences were updated
-- SELECT entity_type, COUNT(*) 
-- FROM id_sequences 
-- WHERE entity_type IN ('client_mrn', 'client_scid')
-- GROUP BY entity_type;
-- 
-- -- Check that indexes exist
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'clients' AND indexname LIKE '%scid%';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- The rename from MRN to SCID is now complete. All future references should
-- use SCID terminology. The underlying data and logic remain unchanged; only
-- the naming has been updated to reflect HALCYON's TMS context.
