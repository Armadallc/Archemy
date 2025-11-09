-- SAFE: Enable RLS only on tables that don't have it yet
-- This only affects 6 tables that currently have RLS disabled

-- Enable RLS on the 6 tables that are missing it
ALTER TABLE client_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'client_group_memberships',
    'notification_templates', 
    'offline_updates',
    'trip_status_logs',
    'vehicle_assignments',
    'vehicle_maintenance'
)
ORDER BY tablename;
















