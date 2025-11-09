-- Fix driver user auth_user_id if it doesn't match Supabase Auth
-- Run this in Supabase SQL Editor after verifying the correct auth_user_id

-- First, check what auth_user_id exists in Supabase Auth for driver@monarch.com
-- Then update the users table to match:

-- UPDATE users 
-- SET auth_user_id = 'CORRECT_AUTH_USER_ID_FROM_SUPABASE_AUTH'
-- WHERE email = 'driver@monarch.com';

-- To find the correct auth_user_id:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Find driver@monarch.com
-- 3. Copy the User UID
-- 4. Replace CORRECT_AUTH_USER_ID_FROM_SUPABASE_AUTH above with that UID
-- 5. Run the UPDATE statement

