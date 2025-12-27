-- ============================================================================
-- Add Driver Record for User: driver_monarch_1758946085589 (sef)
-- Migration: 0052_add_driver_sef_to_drivers_table.sql
-- Date: 2025-01-18
-- Description: Creates driver record for user sef (driver@monarch.com)
-- ============================================================================

-- Insert driver record
INSERT INTO drivers (
    id,
    user_id,
    program_id,
    license_number,
    phone,
    is_active,
    created_at,
    updated_at
) VALUES (
    'driver_monarch_1758946085589',  -- Official driver ID (matches user_id)
    'driver_monarch_1758946085589',  -- user_id from users table
    'monarch_competency',             -- primary_program_id from users table
    'TBD',                            -- License number (to be updated)
    '555-4001',                       -- Phone from users table
    true,                             -- is_active
    NOW(),                            -- created_at
    NOW()                             -- updated_at
)
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    program_id = EXCLUDED.program_id,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify the driver was created
SELECT 
    d.id as driver_id,
    d.user_id,
    d.program_id,
    d.license_number,
    d.phone,
    d.is_active,
    u.user_name,
    u.email,
    u.role
FROM drivers d
JOIN users u ON d.user_id = u.user_id
WHERE d.id = 'driver_monarch_1758946085589';

SELECT 'Driver record created successfully for user: sef (driver@monarch.com)' as status;

