-- SAFE: Check current RLS status on all tables
-- This is NON-DESTRUCTIVE - just shows current state

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

