-- Quick verification that database is clean
SELECT
  'user_profiles' as table_name,
  COUNT(*) as count
FROM user_profiles
UNION ALL
SELECT 'listings', COUNT(*) FROM listings
UNION ALL
SELECT 'inquiries', COUNT(*) FROM inquiries
UNION ALL
SELECT 'auth_users', COUNT(*) FROM auth.users;
