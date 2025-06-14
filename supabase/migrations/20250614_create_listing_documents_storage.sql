-- Create storage bucket for listing documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-documents', 'listing-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for listing documents bucket
-- Note: storage.objects already has RLS enabled by default in Supabase

-- Policy: Sellers can upload their own listing documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Sellers can upload own listing documents'
  ) THEN
    CREATE POLICY "Sellers can upload own listing documents"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'listing-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'seller'
      )
    );
  END IF;
END $$;

-- Policy: Sellers can view their own listing documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Sellers can view own listing documents'
  ) THEN
    CREATE POLICY "Sellers can view own listing documents"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'listing-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'seller'
      )
    );
  END IF;
END $$;

-- Policy: Sellers can delete their own listing documents (for re-uploads)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Sellers can delete own listing documents'
  ) THEN
    CREATE POLICY "Sellers can delete own listing documents"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'listing-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'seller'
      )
    );
  END IF;
END $$;

-- Policy: Verified paid buyers can view listing documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Verified buyers can view listing documents'
  ) THEN
    CREATE POLICY "Verified buyers can view listing documents"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'listing-documents'
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'buyer'
        AND verification_status = 'verified'
        AND is_paid = true
      )
    );
  END IF;
END $$;

-- Policy: Admins can access all listing documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admins can access all listing documents'
  ) THEN
    CREATE POLICY "Admins can access all listing documents"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'listing-documents'
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- Verify the storage bucket was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'listing-documents') THEN
    RAISE NOTICE '✅ Storage bucket "listing-documents" created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create storage bucket "listing-documents"';
  END IF;
END $$;
