-- Migration: Add onboarding completion tracking to user_profiles
-- This allows us to track whether users have completed their onboarding process

-- Add onboarding completion flag to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN is_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add document submission tracking
ALTER TABLE user_profiles
ADD COLUMN submitted_documents JSONB DEFAULT '{}',
ADD COLUMN onboarding_step_completed INTEGER DEFAULT 0;

-- Create index for onboarding status queries
CREATE INDEX idx_user_profiles_onboarding_completed ON user_profiles(is_onboarding_completed);
CREATE INDEX idx_user_profiles_onboarding_step ON user_profiles(onboarding_step_completed);

-- Update existing users to bypass onboarding (since they weren't required to complete it)
-- This ensures existing users don't get blocked from dashboard access
UPDATE user_profiles
SET is_onboarding_completed = true,
    onboarding_completed_at = NOW()
WHERE created_at < NOW(); -- All existing users

-- Create onboarding_documents table to store uploaded documents
CREATE TABLE onboarding_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'identity', 'business_registration', 'ownership_proof', 'financial_statement'
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Supabase Storage path
    file_size INTEGER, -- File size in bytes
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Index for faster queries
    UNIQUE(user_id, document_type) -- One document per type per user
);

CREATE INDEX idx_onboarding_documents_user_id ON onboarding_documents(user_id);
CREATE INDEX idx_onboarding_documents_type ON onboarding_documents(document_type);
