-- ============================================================================
-- Add Reference ID for Client Groups
-- ============================================================================
-- This migration adds a reference_id column to client_groups table and creates
-- a function to generate reference IDs similar to SCID for clients.
-- Format: [PROGRAM_CODE]-G[SEQ] (e.g., MC-G0001, MC-G0002)
-- The 'G' prefix distinguishes group reference IDs from client SCIDs
-- Created: 2025-12-23

-- ============================================================================
-- STEP 1: Add reference_id Column to client_groups Table
-- ============================================================================
ALTER TABLE client_groups 
    ADD COLUMN IF NOT EXISTS reference_id VARCHAR(30);

-- Add unique constraint on reference_id (once populated)
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_groups_reference_id_unique 
    ON client_groups(reference_id) 
    WHERE reference_id IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_groups_reference_id 
    ON client_groups(reference_id) 
    WHERE reference_id IS NOT NULL;

COMMENT ON COLUMN client_groups.reference_id IS 
'Human-readable reference identifier for client groups. Format: [PROGRAM_CODE]-G[SEQ] (e.g., MC-G0001). Generated automatically when a group is created.';

-- ============================================================================
-- STEP 2: Create Function to Generate Client Group Reference ID
-- ============================================================================
-- Drop existing function if it exists (to ensure clean replacement)
DROP FUNCTION IF EXISTS generate_client_group_reference_id(VARCHAR);

CREATE OR REPLACE FUNCTION generate_client_group_reference_id(p_program_code VARCHAR(10))
RETURNS VARCHAR(30) AS $$
DECLARE
    next_seq INTEGER;
    new_reference_id VARCHAR(30);
    target_id VARCHAR(50);
BEGIN
    -- Handle case where duplicates might exist: select the one with highest last_value
    -- Use FOR UPDATE to lock the row and prevent race conditions
    SELECT id, last_value INTO target_id, next_seq
    FROM id_sequences
    WHERE entity_type = 'client_group_reference_id' 
      AND program_code = p_program_code 
      AND date_key IS NULL
    ORDER BY last_value DESC, updated_at DESC
    LIMIT 1
    FOR UPDATE;
    
    -- If sequence exists, increment it by ID (ensures single row update)
    IF target_id IS NOT NULL THEN
        UPDATE id_sequences
        SET last_value = last_value + 1,
            updated_at = NOW()
        WHERE id = target_id
        RETURNING last_value INTO next_seq;
    ELSE
        -- Sequence doesn't exist, create it starting at 1
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_group_reference_id', p_program_code, NULL, 1)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = id_sequences.last_value + 1,
            updated_at = NOW()
        RETURNING last_value INTO next_seq;
        
        -- Safety check: if still NULL, fetch it
        IF next_seq IS NULL THEN
            SELECT last_value INTO next_seq
            FROM id_sequences
            WHERE entity_type = 'client_group_reference_id' 
              AND program_code = p_program_code 
              AND date_key IS NULL
            ORDER BY last_value DESC
            LIMIT 1;
        END IF;
    END IF;
    
    -- Format: [PROGRAM_CODE]-G[SEQ] with zero-padded 4-digit sequence
    -- The 'G' prefix distinguishes group reference IDs from client SCIDs
    new_reference_id := p_program_code || '-G' || LPAD(next_seq::TEXT, 4, '0');
    
    RETURN new_reference_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_client_group_reference_id(VARCHAR) IS 
'Generates a reference ID for client groups. Format: [PROGRAM_CODE]-G[SEQ] (e.g., MC-G0001). The "G" prefix distinguishes group reference IDs from client SCIDs.';

-- ============================================================================
-- STEP 3: Create RPC Wrapper for Supabase API
-- ============================================================================
DROP FUNCTION IF EXISTS generate_client_group_reference_id_rpc(VARCHAR);

CREATE OR REPLACE FUNCTION generate_client_group_reference_id_rpc(p_program_code VARCHAR(10))
RETURNS VARCHAR(30) AS $$
BEGIN
  RETURN generate_client_group_reference_id(p_program_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_client_group_reference_id_rpc(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_client_group_reference_id_rpc(VARCHAR) TO service_role;

COMMENT ON FUNCTION generate_client_group_reference_id_rpc(VARCHAR) IS 
'RPC wrapper for generate_client_group_reference_id. Allows Supabase REST API to call the client group reference ID generation function.';

-- ============================================================================
-- STEP 4: Backfill Existing Client Groups
-- ============================================================================
-- Generate reference_ids for all existing client groups that don't have one
-- Ordered by creation date to maintain consistency
DO $$
DECLARE
    group_record RECORD;
    program_record RECORD;
    program_code_val VARCHAR(10);
    new_reference_id VARCHAR(30);
BEGIN
    -- Loop through all client groups without reference_id, ordered by creation date
    FOR group_record IN 
        SELECT cg.id, cg.program_id, cg.created_at
        FROM client_groups cg
        WHERE cg.reference_id IS NULL
        ORDER BY cg.created_at ASC
    LOOP
        -- Get program code for this group
        SELECT code INTO program_code_val
        FROM programs
        WHERE id = group_record.program_id;
        
        -- Skip if program code is missing
        IF program_code_val IS NULL OR program_code_val = '' THEN
            RAISE NOTICE 'Skipping client group % - program % has no code', group_record.id, group_record.program_id;
            CONTINUE;
        END IF;
        
        -- Generate reference_id
        SELECT generate_client_group_reference_id(program_code_val) INTO new_reference_id;
        
        -- Update client group with reference_id
        UPDATE client_groups
        SET reference_id = new_reference_id
        WHERE id = group_record.id;
        
        RAISE NOTICE 'Generated reference_id % for client group %', new_reference_id, group_record.id;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: Sync Sequences with Existing Reference IDs
-- ============================================================================
-- Update sequences to match the maximum existing reference_id for each program
-- This prevents duplicate reference_id errors when creating new groups
DO $$
DECLARE
    program_record RECORD;
    program_code_val VARCHAR(10);
    max_seq INTEGER;
BEGIN
    -- For each program that has client groups with reference_ids
    FOR program_record IN 
        SELECT DISTINCT p.id, p.code
        FROM programs p
        INNER JOIN client_groups cg ON cg.program_id = p.id
        WHERE cg.reference_id IS NOT NULL
          AND p.code IS NOT NULL
          AND p.code != ''
    LOOP
        program_code_val := program_record.code;
        
        -- Find the maximum sequence number for this program's reference_ids
        -- Reference ID format: PROGRAM_CODE-G#### (e.g., MC-G0001, MC-G0002)
        SELECT COALESCE(
            MAX(
                CAST(SUBSTRING(cg.reference_id FROM '-G(.+)$') AS INTEGER)
            ),
            0
        ) INTO max_seq
        FROM client_groups cg
        WHERE cg.program_id = program_record.id
          AND cg.reference_id IS NOT NULL 
          AND cg.reference_id ~ ('^' || program_code_val || '-G[0-9]+$');  -- Match this program's reference IDs
        
        -- Update or insert sequence
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_group_reference_id', program_code_val, NULL, max_seq)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = GREATEST(id_sequences.last_value, max_seq),
            updated_at = NOW();
        
        RAISE NOTICE 'Synced sequence for program %: max_seq = %', program_code_val, max_seq;
    END LOOP;
    
    -- For programs without any groups yet, initialize sequence at 0
    FOR program_record IN 
        SELECT p.id, p.code
        FROM programs p
        WHERE p.code IS NOT NULL
          AND p.code != ''
          AND NOT EXISTS (
              SELECT 1 FROM id_sequences s
              WHERE s.entity_type = 'client_group_reference_id'
                AND s.program_code = p.code
                AND s.date_key IS NULL
          )
    LOOP
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_group_reference_id', program_record.code, NULL, 0)
        ON CONFLICT (entity_type, program_code, date_key) DO NOTHING;
    END LOOP;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
-- 1. Added reference_id column to client_groups table
-- 2. Created generate_client_group_reference_id() function
-- 3. Created RPC wrapper for API access
-- 4. Backfilled reference_ids for existing client groups
-- 5. Synced sequences with existing reference_ids
--
-- Next Steps:
-- 1. Update client_groups storage functions to generate reference_id on creation
-- 2. Update UI to display reference_id instead of UUID
-- 3. Update API queries to include reference_id in responses


