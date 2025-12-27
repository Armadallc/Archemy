-- ============================================================================
-- Verification Query: Check if driver record exists for user sef
-- Migration: 0052_verify_driver_sef.sql
-- Date: 2025-01-18
-- Description: Verifies the driver record was created correctly
-- ============================================================================

-- Check if driver record exists (this is the key query)
SELECT 
    d.id as driver_id,
    d.user_id,
    d.program_id,
    d.license_number,
    d.phone,
    d.is_active,
    d.created_at,
    u.user_name,
    u.email,
    u.role,
    u.primary_program_id
FROM drivers d
JOIN users u ON d.user_id = u.user_id
WHERE u.email = 'driver@monarch.com' OR d.user_id = 'driver_monarch_1758946085589';

-- If the above returns no rows, the driver record doesn't exist - run this to create it:
-- INSERT INTO drivers (id, user_id, program_id, license_number, phone, is_active, created_at, updated_at)
-- VALUES (
--     'driver_monarch_1758946085589',
--     'driver_monarch_1758946085589',
--     'monarch_competency',
--     'TBD',
--     '555-4001',
--     true,
--     NOW(),
--     NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Check all drivers with similar user_id pattern
SELECT 
    id,
    user_id,
    program_id,
    is_active,
    created_at
FROM drivers
WHERE user_id LIKE '%driver_monarch%' OR user_id LIKE '%1758946085589%'
ORDER BY created_at DESC;

-- Check if user exists
SELECT 
    user_id,
    user_name,
    email,
    role,
    primary_program_id,
    is_active
FROM users
WHERE email = 'driver@monarch.com' OR user_id = 'driver_monarch_1758946085589';

