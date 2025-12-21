-- ============================================================================
-- MIGRATION: Add Contract Analysis Feature Flag
-- Migration: 0051
-- Date: 2025-12-21
-- ============================================================================
-- 
-- Purpose: Create the 'contract_analysis' feature flag for the Prophet
--          calculator Contract Analysis feature.
-- 
-- This flag controls the visibility of the "Analyze Contract" button and
-- Contract Analysis modal in the Treatment Facilities section.
-- ============================================================================

BEGIN;

-- Insert the feature flag (global scope - no program_id or corporate_client_id)
-- Using ON CONFLICT to safely handle if flag already exists
INSERT INTO feature_flags (id, flag_name, is_enabled, description, program_id, corporate_client_id)
VALUES (
  gen_random_uuid()::text,
  'contract_analysis',
  false,  -- Disabled by default for safety
  'Contract Analysis feature for Prophet calculator - A/B comparison tool for analyzing transportation service contracts',
  NULL,   -- Global flag (not program-specific)
  NULL    -- Global flag (not corporate-client-specific)
)
ON CONFLICT (flag_name, program_id, corporate_client_id) 
DO UPDATE SET 
  is_enabled = false,  -- Keep disabled if already exists
  description = 'Contract Analysis feature for Prophet calculator - A/B comparison tool for analyzing transportation service contracts',
  updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- ============================================================================
-- NOTES:
-- 
-- To enable the feature flag after running this migration:
-- 
-- UPDATE feature_flags 
-- SET is_enabled = true 
-- WHERE flag_name = 'contract_analysis' 
--   AND program_id IS NULL 
--   AND corporate_client_id IS NULL;
-- 
-- To disable the feature flag:
-- 
-- UPDATE feature_flags 
-- SET is_enabled = false 
-- WHERE flag_name = 'contract_analysis' 
--   AND program_id IS NULL 
--   AND corporate_client_id IS NULL;
-- ============================================================================
