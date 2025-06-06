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

-- Quick verification check
SELECT
    id,
    email,
    email_confirmed_at,
    confirmation_token,
    confirmation_sent_at,
    created_at
FROM auth.users
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 5;
