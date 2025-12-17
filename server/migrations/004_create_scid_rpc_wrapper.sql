-- ============================================================================
-- HIPAA-Compliant Identifier System Migration
-- Phase 2: Create Supabase RPC Wrapper Functions
-- ============================================================================
-- This migration creates RPC wrapper functions so Supabase can call our
-- PostgreSQL functions via the REST API
-- Created: 2024-12-15
-- Version: 1.0.0

-- ============================================================================
-- STEP 1: Create RPC Wrapper for generate_client_scid
-- ============================================================================
-- Supabase requires functions to be explicitly exposed as RPCs
-- This wrapper allows the function to be called via supabase.rpc()

CREATE OR REPLACE FUNCTION generate_client_scid_rpc(p_program_code VARCHAR(10))
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN generate_client_scid(p_program_code);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_client_scid_rpc(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_client_scid_rpc(VARCHAR) TO service_role;

COMMENT ON FUNCTION generate_client_scid_rpc(VARCHAR) IS 
'RPC wrapper for generate_client_scid. Allows Supabase REST API to call the SCID generation function.';

-- ============================================================================
-- STEP 2: Create RPC Wrapper for generate_trip_reference_id
-- ============================================================================
-- This wrapper allows trip reference ID generation via RPC

CREATE OR REPLACE FUNCTION generate_trip_reference_id_rpc(
  p_program_code VARCHAR(10),
  p_trip_date DATE
)
RETURNS VARCHAR(30)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN generate_trip_reference_id(p_program_code, p_trip_date);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_trip_reference_id_rpc(VARCHAR, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_trip_reference_id_rpc(VARCHAR, DATE) TO service_role;

COMMENT ON FUNCTION generate_trip_reference_id_rpc(VARCHAR, DATE) IS 
'RPC wrapper for generate_trip_reference_id. Allows Supabase REST API to call the trip reference ID generation function.';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- These RPC wrapper functions can now be called via:
-- supabase.rpc('generate_client_scid_rpc', { p_program_code: 'MC' })
-- supabase.rpc('generate_trip_reference_id_rpc', { p_program_code: 'MC', p_trip_date: '2024-12-15' })




