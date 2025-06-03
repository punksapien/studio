-- Add onboarding protection fields and tables
-- This migration enables the onboarding flow protection middleware

-- ================================================
-- STEP 1: Add onboarding fields to user_profiles
-- ================================================

-- Add onboarding completion tracking to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS submitted_documents JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_step_completed INTEGER DEFAULT 0;

-- Create indexes for onboarding status queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed ON user_profiles(is_onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_step ON user_profiles(onboarding_step_completed);

-- Update existing users to bypass onboarding (grandfather them in)
-- This ensures existing users don't get blocked from dashboard access
UPDATE user_profiles
SET is_onboarding_completed = true,
    onboarding_completed_at = NOW()
WHERE created_at < NOW() AND (is_onboarding_completed = false OR is_onboarding_completed IS NULL);

-- ================================================
-- STEP 2: Create onboarding documents table
-- ================================================

-- Create onboarding_documents table to store uploaded documents
CREATE TABLE IF NOT EXISTS onboarding_documents (
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

CREATE INDEX IF NOT EXISTS idx_onboarding_documents_user_id ON onboarding_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_type ON onboarding_documents(document_type);

-- ================================================
-- STEP 3: Create storage bucket for documents
-- ================================================

-- Create storage bucket for onboarding documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-documents', 'onboarding-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- STEP 4: Set up RLS policies for storage
-- ================================================

-- Drop existing policies if they exist (to handle re-runs)
DROP POLICY IF EXISTS "Users can upload own onboarding documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own onboarding documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own onboarding documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all onboarding documents" ON storage.objects;

-- Policy: Users can upload their own documents
CREATE POLICY "Users can upload own onboarding documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'onboarding-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own onboarding documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'onboarding-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own documents (for re-uploads)
CREATE POLICY "Users can delete own onboarding documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'onboarding-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can access all documents
CREATE POLICY "Admins can access all onboarding documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'onboarding-documents'
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ================================================
-- STEP 5: Set up RLS policies for onboarding_documents table
-- ================================================

-- Enable RLS on onboarding_documents table
ALTER TABLE onboarding_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to handle re-runs)
DROP POLICY IF EXISTS "Users can manage own onboarding documents" ON onboarding_documents;
DROP POLICY IF EXISTS "Admins can view all onboarding documents" ON onboarding_documents;

-- Policy: Users can manage their own documents
CREATE POLICY "Users can manage own onboarding documents"
ON onboarding_documents
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all onboarding documents"
ON onboarding_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
