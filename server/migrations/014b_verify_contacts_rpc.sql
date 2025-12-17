-- ============================================================================
-- Migration 014b: Verify Contacts RPC Functions
-- ============================================================================
-- Purpose: Diagnostic queries to verify RPC functions are properly set up
-- Created: 2025-01-17

-- Check if base function exists
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.prosecdef as is_security_definer,
    n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('sync_tenant_users_to_contacts', 'sync_tenant_users_to_contacts_rpc')
ORDER BY p.proname;

-- Check permissions on functions
SELECT 
    p.proname as function_name,
    r.rolname as role_name,
    has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND p.proname IN ('sync_tenant_users_to_contacts', 'sync_tenant_users_to_contacts_rpc')
  AND r.rolname IN ('authenticated', 'service_role', 'anon')
ORDER BY p.proname, r.rolname;

-- Test call to RPC wrapper (will fail if function doesn't exist, but that's ok for diagnostics)
DO $$
DECLARE
    test_result INTEGER;
BEGIN
    -- Try calling with a test user_id (this will fail if user doesn't exist, but function should be callable)
    BEGIN
        SELECT sync_tenant_users_to_contacts_rpc('test_user_id') INTO test_result;
        RAISE NOTICE '✅ RPC wrapper function is callable (test returned: %)', test_result;
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%not found%' OR SQLERRM LIKE '%does not exist%' THEN
            RAISE WARNING '❌ RPC wrapper function does not exist or is not callable: %', SQLERRM;
        ELSE
            RAISE NOTICE '✅ RPC wrapper function exists and is callable (expected error for test user: %)', SQLERRM;
        END IF;
    END;
END $$;

