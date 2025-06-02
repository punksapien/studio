-- Create storage bucket for onboarding documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-documents', 'onboarding-documents', false);

-- Create RLS policies for onboarding documents bucket
-- Note: storage.objects already has RLS enabled by default in Supabase

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
