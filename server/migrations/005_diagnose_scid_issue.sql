-- ============================================================================
-- SCID Generation Diagnostic Queries
-- ============================================================================
-- Run these queries in Supabase SQL Editor to diagnose why SCID generation
-- might not be working for new clients
-- Created: 2024-12-16

-- ============================================================================
-- 1. Check if RPC wrapper function exists
-- ============================================================================
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines
WHERE routine_name = 'generate_client_scid_rpc'
  AND routine_schema = 'public';

-- Expected: Should return 1 row
-- If empty: Run migration 004_create_scid_rpc_wrapper.sql

-- ============================================================================
-- 2. Check if programs have codes
-- ============================================================================
SELECT 
    id,
    name,
    code,
    CASE 
        WHEN code IS NULL THEN '❌ MISSING CODE'
        WHEN code = '' THEN '❌ EMPTY CODE'
        ELSE '✅ HAS CODE'
    END as status
FROM programs
ORDER BY name;

-- Expected: All programs should have non-null, non-empty codes
-- If any are missing: Run migration 002_backfill_display_ids.sql

-- ============================================================================
-- 3. Check specific program (monarch_competency)
-- ============================================================================
SELECT 
    id,
    name,
    code,
    corporate_client_id
FROM programs
WHERE id = 'monarch_competency';

-- Expected: Should have a code value (e.g., 'MC', 'MON', etc.)

-- ============================================================================
-- 4. Check recent clients without SCID
-- ============================================================================
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.program_id,
    c.scid,
    c.created_at,
    p.name as program_name,
    p.code as program_code
FROM clients c
LEFT JOIN programs p ON c.program_id = p.id
WHERE c.scid IS NULL
ORDER BY c.created_at DESC
LIMIT 10;

-- Expected: Should show clients that need SCID generation
-- Action: Run migration 002_backfill_display_ids.sql to generate SCIDs

-- ============================================================================
-- 5. Test SCID generation function directly
-- ============================================================================
-- First, get a program code
SELECT code FROM programs WHERE id = 'monarch_competency' LIMIT 1;

-- Then test the function (replace 'MC' with actual program code from above)
-- SELECT generate_client_scid('MC');

-- Test the RPC wrapper
-- SELECT generate_client_scid_rpc('MC');

-- Expected: Should return a SCID like 'MC-0001', 'MC-0002', etc.

-- ============================================================================
-- 6. Check id_sequences table for client_scid
-- ============================================================================
SELECT 
    entity_type,
    program_code,
    date_key,
    last_value,
    updated_at
FROM id_sequences
WHERE entity_type = 'client_scid'
ORDER BY updated_at DESC
LIMIT 10;

-- Expected: Should show sequence tracking for each program
-- If empty: Sequences haven't been initialized yet




