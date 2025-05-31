-- ========================================
-- SUPABASE DATABASE CLEANUP SCRIPT
-- ========================================
-- Use this script to clean all test data from your Supabase project
-- Run these commands in your Supabase SQL Editor
--
-- WARNING: This will delete ALL data. Only use in development!
-- ========================================

-- Step 1: Clean up application data tables
-- (These need to be done first due to foreign key constraints)

-- Clear messages table
DELETE FROM messages;

-- Clear conversations table
DELETE FROM conversations;

-- Clear inquiries table
DELETE FROM inquiries;

-- Clear verification requests
DELETE FROM verification_requests;

-- Clear OTP verifications
DELETE FROM otp_verifications;

-- Clear listings table
DELETE FROM listings;

-- Clear user profiles
DELETE FROM user_profiles;

-- Clear user events (if exists)
DELETE FROM user_events;

-- Step 2: Reset sequences (optional, but keeps IDs clean)
-- Note: Supabase uses UUIDs by default, so this might not be needed
-- But if you have any auto-incrementing IDs, this will reset them

-- If you have any SERIAL columns, reset their sequences like this:
-- ALTER SEQUENCE table_name_id_seq RESTART WITH 1;

-- Step 3: Clean Auth Users (MANUAL STEP REQUIRED)
-- =====================================================
-- You CANNOT delete auth.users via SQL from the SQL Editor for security reasons
-- Instead, you need to manually delete users from the Supabase Dashboard:
--
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication → Users
-- 3. Select all test users
-- 4. Click "Delete User" for each one
--
-- Alternatively, you can use the Supabase Management API:
-- curl -X DELETE 'https://api.supabase.com/v1/projects/{ref}/auth/users/{user_id}' \
--   -H 'Authorization: Bearer {service_role_key}'
-- =====================================================

-- Step 4: Verify cleanup
-- Run these queries to confirm everything is clean:

SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles
UNION ALL
SELECT 'listings', COUNT(*) FROM listings
UNION ALL
SELECT 'inquiries', COUNT(*) FROM inquiries
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'verification_requests', COUNT(*) FROM verification_requests
UNION ALL
SELECT 'otp_verifications', COUNT(*) FROM otp_verifications;

-- If everything worked, all counts should be 0

-- Step 5: Check auth users (read-only query)
-- This will show remaining auth users that need manual deletion
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- ========================================
-- POST-CLEANUP VERIFICATION
-- ========================================
-- After running this script and manually deleting auth users:
-- 1. All tables should have 0 records
-- 2. Auth users table should be empty
-- 3. Your registration workflow should be ready for clean testing
-- ========================================
