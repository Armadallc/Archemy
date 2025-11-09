-- Get all table names from the database
-- Run this in Supabase SQL Editor to see all 27 tables

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

















