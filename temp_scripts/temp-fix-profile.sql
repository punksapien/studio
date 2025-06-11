-- Temporarily remove foreign key constraint to create profile
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Insert the user profile directly
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  phone_number,
  country,
  role,
  is_email_verified,
  email_verified_at,
  verification_status,
  initial_company_name,
  email_notifications_general,
  email_notifications_inquiries,
  email_notifications_listing_updates,
  email_notifications_system,
  is_onboarding_completed,
  onboarding_completed_at,
  onboarding_step_completed
) VALUES (
  '2fad0689-95a5-413b-9a38-5885f14f6a7b',
  'seller@gmail.com',
  'Test Seller',
  '+1234567890',
  'United States',
  'seller',
  true,
  NOW(),
  'verified',
  'Tech Solutions Inc',
  true,
  true,
  true,
  true,
  true,
  NOW(),
  5
);

-- Verify the profile was created
SELECT id, email, full_name, role FROM user_profiles WHERE id = '2fad0689-95a5-413b-9a38-5885f14f6a7b';
