-- ============================================================================
-- Migration 014c: Refresh PostgREST Schema Cache
-- ============================================================================
-- Purpose: Force PostgREST to refresh its schema cache so it can see new RPC functions
-- Created: 2025-01-17
-- Note: This may require Supabase admin access or a restart

-- Method 1: Notify PostgREST to reload schema (if pg_notify is available)
-- This sends a notification that PostgREST listens for to reload its schema
DO $$
BEGIN
    PERFORM pg_notify('pgrst', 'reload schema');
    RAISE NOTICE '✅ Sent schema reload notification to PostgREST';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not send notification (this is ok, PostgREST may auto-refresh): %', SQLERRM;
END $$;

-- Method 2: Verify functions are in the correct schema and have correct signatures
-- PostgREST looks for functions in the 'public' schema with specific signatures
SELECT 
    'Function exists check' as check_type,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    n.nspname as schema_name,
    CASE 
        WHEN n.nspname = 'public' THEN '✅ In public schema'
        ELSE '❌ NOT in public schema'
    END as schema_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('sync_tenant_users_to_contacts_rpc', 'sync_tenant_users_to_contacts')
ORDER BY p.proname;

-- Method 3: Check if function is accessible to authenticated role
SELECT 
    'Permission check' as check_type,
    p.proname as function_name,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('sync_tenant_users_to_contacts_rpc', 'sync_tenant_users_to_contacts')
ORDER BY p.proname;

-- Note: If PostgREST still can't see the function after this, you may need to:
-- 1. Restart your Supabase instance (if self-hosted)
-- 2. Wait a few minutes for auto-refresh
-- 3. Contact Supabase support if using hosted Supabase

