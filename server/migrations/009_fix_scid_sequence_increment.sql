-- ============================================================================
-- Fix SCID Sequence Increment Logic
-- ============================================================================
-- This migration fixes the generate_client_scid function to ensure it
-- properly increments sequences and returns the correct next value
-- Also handles the case where duplicate sequences might exist
-- Created: 2024-12-16

-- ============================================================================
-- STEP 1: Fix generate_client_scid Function
-- ============================================================================
-- The issue: 
-- 1. RETURNING in ON CONFLICT might not return the updated value correctly
-- 2. UPDATE with multiple matching rows causes "query returned more than one row" error
-- Solution: Select target row first, then update it by ID to ensure single row update

CREATE OR REPLACE FUNCTION generate_client_scid(p_program_code VARCHAR(10))
RETURNS VARCHAR(20) AS $$
DECLARE
    next_seq INTEGER;
    new_scid VARCHAR(20);
    target_id VARCHAR(50);
BEGIN
    -- Handle case where duplicates might exist: select the one with highest last_value
    -- Use FOR UPDATE to lock the row and prevent race conditions
    SELECT id, last_value INTO target_id, next_seq
    FROM id_sequences
    WHERE entity_type = 'client_scid' 
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
        VALUES ('client_scid', p_program_code, NULL, 1)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = id_sequences.last_value + 1,
            updated_at = NOW()
        RETURNING last_value INTO next_seq;
        
        -- Safety check: if still NULL, fetch it
        IF next_seq IS NULL THEN
            SELECT last_value INTO next_seq
            FROM id_sequences
            WHERE entity_type = 'client_scid' 
              AND program_code = p_program_code 
              AND date_key IS NULL
            ORDER BY last_value DESC
            LIMIT 1;
        END IF;
    END IF;
    
    -- Format: [PROGRAM_CODE]-[SEQ] with zero-padded 4-digit sequence
    new_scid := p_program_code || '-' || LPAD(next_seq::TEXT, 4, '0');
    
    RETURN new_scid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Verify Function Works
-- ============================================================================
-- Test the function (uncomment to test):
-- SELECT generate_client_scid('MC');  -- Should return MC-0002 (if sequence is at 1)
-- SELECT generate_client_scid('MC');  -- Should return MC-0003 (if sequence is now at 2)

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- The function now properly increments sequences by:
-- 1. Selecting the target sequence row first (handles duplicates by picking highest)
-- 2. Updating by ID (ensures single row update, no "multiple rows" error)
-- 3. Falling back to INSERT if sequence doesn't exist
-- 4. This ensures sequences increment correctly: 1 -> 2 -> 3 -> 4, etc.
