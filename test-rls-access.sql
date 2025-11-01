-- Test basic access to newly RLS-enabled tables
-- This will help identify if any policies are missing

-- Test 1: Check if we can still access data
SELECT 'client_group_memberships' as table_name, COUNT(*) as record_count FROM client_group_memberships
UNION ALL
SELECT 'notification_templates' as table_name, COUNT(*) as record_count FROM notification_templates  
UNION ALL
SELECT 'offline_updates' as table_name, COUNT(*) as record_count FROM offline_updates
UNION ALL
SELECT 'trip_status_logs' as table_name, COUNT(*) as record_count FROM trip_status_logs
UNION ALL
SELECT 'vehicle_assignments' as table_name, COUNT(*) as record_count FROM vehicle_assignments
UNION ALL
SELECT 'vehicle_maintenance' as table_name, COUNT(*) as record_count FROM vehicle_maintenance;











