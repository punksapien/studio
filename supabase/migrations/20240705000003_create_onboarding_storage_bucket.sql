
-- This SQL script is a placeholder for setting up the Supabase Storage bucket and its policies.
-- Bucket creation and RLS policies for Storage are typically managed via the Supabase Dashboard or CLI.

-- 1. Bucket Creation (Conceptual - Use Supabase Dashboard or CLI)
-- Bucket Name: onboarding-documents
-- Public: false (Private bucket)
-- Allowed MIME types: image/jpeg, image/png, application/pdf (and others as needed like .docx, .xlsx)
-- Max file size: e.g., 5MB

-- Example Supabase CLI command (run this manually if needed):
-- supabase storage buckets create onboarding-documents --public=false --allowed-mime-types="image/jpeg,image/png,application/pdf" --file-size-limit="5MB"

-- 2. Storage RLS Policies (To be configured in Supabase Dashboard -> Storage -> Policies)

-- Policy Name: Allow authenticated users to upload to their own folder
-- Bucket: onboarding-documents
-- Operations: INSERT
-- Target roles: authenticated
-- USING expression (SQL):
-- (bucket_id = 'onboarding-documents') AND ((storage.foldername(name))[1] = auth.uid()::text)
-- WITH CHECK expression (SQL):
-- (bucket_id = 'onboarding-documents') AND ((storage.foldername(name))[1] = auth.uid()::text)
-- Note: This policy assumes files are uploaded to a path like `user_id/document_type_filename.ext`

-- Policy Name: Allow authenticated users to read their own documents
-- Bucket: onboarding-documents
-- Operations: SELECT
-- Target roles: authenticated
-- USING expression (SQL):
-- (bucket_id = 'onboarding-documents') AND ((storage.foldername(name))[1] = auth.uid()::text)

-- Policy Name: Allow authenticated users to update/delete their own documents (Optional, if needed)
-- Bucket: onboarding-documents
-- Operations: UPDATE, DELETE
-- Target roles: authenticated
-- USING expression (SQL):
-- (bucket_id = 'onboarding-documents') AND ((storage.foldername(name))[1] = auth.uid()::text)
-- WITH CHECK expression (SQL):
-- (bucket_id = 'onboarding-documents') AND ((storage.foldername(name))[1] = auth.uid()::text)

-- Policy Name: Allow admins to manage all documents
-- Bucket: onboarding-documents
-- Operations: SELECT, INSERT, UPDATE, DELETE
-- Target roles: authenticated
-- USING expression (SQL):
-- (bucket_id = 'onboarding-documents') AND (storage.role_check_function(auth.uid(), 'admin')) -- Requires a helper SQL function
-- WITH CHECK expression (SQL):
-- (bucket_id = 'onboarding-documents') AND (storage.role_check_function(auth.uid(), 'admin'))

-- Helper SQL function for admin role check (create this in your DB if using the admin policy above):
/*
CREATE OR REPLACE FUNCTION storage.role_check_function(user_id_to_check uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = user_id_to_check AND role = required_role
  );
END;
$$;
*/

SELECT 'Remember to create the onboarding-documents bucket and set up RLS policies in Supabase Storage settings.';
