-- ============================================================================
-- Migration 014a: Fix Contacts RPC Permissions
-- ============================================================================
-- Purpose: Add missing GRANT EXECUTE permissions and create RPC wrapper for sync_tenant_users_to_contacts
-- Created: 2025-01-17
-- Dependencies: Migration 014 (must be run first)

-- Verify the base function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'sync_tenant_users_to_contacts'
    ) THEN
        RAISE EXCEPTION 'Function sync_tenant_users_to_contacts does not exist. Please run migration 014 first.';
    END IF;
END $$;

-- Add SECURITY DEFINER to the base function (if not already present)
-- This allows the function to run with the privileges of the function owner
ALTER FUNCTION sync_tenant_users_to_contacts(VARCHAR) SECURITY DEFINER;

-- Grant execute permission to authenticated users and service_role on base function
GRANT EXECUTE ON FUNCTION sync_tenant_users_to_contacts(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_tenant_users_to_contacts(VARCHAR) TO service_role;

-- Create RPC wrapper function for better Supabase PostgREST compatibility
-- This ensures the function can be called via supabase.rpc()
CREATE OR REPLACE FUNCTION sync_tenant_users_to_contacts_rpc(p_owner_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Call the base function with VARCHAR cast
    RETURN sync_tenant_users_to_contacts(p_owner_user_id::VARCHAR(50));
END;
$$;

-- Grant execute permission on the RPC wrapper
GRANT EXECUTE ON FUNCTION sync_tenant_users_to_contacts_rpc(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_tenant_users_to_contacts_rpc(TEXT) TO service_role;

COMMENT ON FUNCTION sync_tenant_users_to_contacts_rpc(TEXT) IS 
'RPC wrapper for sync_tenant_users_to_contacts. Allows Supabase REST API to call the sync function via supabase.rpc().';

-- Verify both functions exist
DO $$
BEGIN
    RAISE NOTICE '✅ Function sync_tenant_users_to_contacts found';
    RAISE NOTICE '✅ RPC wrapper sync_tenant_users_to_contacts_rpc created';
    RAISE NOTICE '✅ Permissions granted - function is now callable via Supabase RPC';
END $$;
