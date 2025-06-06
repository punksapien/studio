-- Add notification preferences to user_profiles table
-- Migration: 20250107000001_add_notification_preferences.sql

ALTER TABLE user_profiles
ADD COLUMN email_notifications_general BOOLEAN DEFAULT true,
ADD COLUMN email_notifications_inquiries BOOLEAN DEFAULT true,
ADD COLUMN email_notifications_listing_updates BOOLEAN DEFAULT true,
ADD COLUMN email_notifications_system BOOLEAN DEFAULT true;

-- Add index for faster notification preference queries
CREATE INDEX idx_user_profiles_email_notifications ON user_profiles(email_notifications_general, email_notifications_inquiries);

-- Update existing users to have default notification preferences
UPDATE user_profiles
SET
  email_notifications_general = true,
  email_notifications_inquiries = true,
  email_notifications_listing_updates = true,
  email_notifications_system = true
WHERE
  email_notifications_general IS NULL;
