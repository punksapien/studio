-- Add optional extra contact points that sellers can provide before verification.
-- These are supplementary to the primary email/phone_number on user_profiles and
-- give the Nobridge team additional ways to reach a seller while completing
-- verification. Both are optional and nullable.

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS additional_email VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS additional_phone VARCHAR(50);

COMMENT ON COLUMN user_profiles.additional_email IS 'Optional extra email a seller provides pre-verification so the Nobridge team has another way to reach them. Supplementary to the primary email column.';
COMMENT ON COLUMN user_profiles.additional_phone IS 'Optional extra phone number a seller provides pre-verification so the Nobridge team has another way to reach them. Supplementary to the primary phone_number column.';
