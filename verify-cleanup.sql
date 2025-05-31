-- ========================================
-- QUICK CLEANUP VERIFICATION SCRIPT
-- ========================================
-- Run this after the database cleanup to verify success
-- ========================================

-- Check all table counts (should all be 0 after cleanup)
SELECT
  'user_profiles' as table_name,
  COUNT(*) as record_count
FROM user_profiles
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
SELECT 'otp_verifications', COUNT(*) FROM otp_verifications
UNION ALL
SELECT 'user_events', COUNT(*) FROM user_events;

-- Check remaining auth users (these need manual deletion)
SELECT
  'auth_users' as table_name,
  COUNT(*) as record_count,
  'MANUAL_DELETION_REQUIRED' as note
FROM auth.users;

-- List auth users for manual deletion reference
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  'DELETE_THIS_USER' as action_needed
FROM auth.users
ORDER BY created_at DESC;
