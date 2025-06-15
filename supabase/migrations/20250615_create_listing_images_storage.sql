-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for listing images bucket
-- Note: storage.objects already has RLS enabled by default in Supabase

-- Policy: Sellers can upload their own listing images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Sellers can upload own listing images'
  ) THEN
    CREATE POLICY "Sellers can upload own listing images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'listing-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'seller'
      )
    );
  END IF;
END $$;

-- Policy: Sellers can view their own listing images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Sellers can view own listing images'
  ) THEN
    CREATE POLICY "Sellers can view own listing images"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'listing-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'seller'
      )
    );
  END IF;
END $$;

-- Policy: Sellers can delete their own listing images (for re-uploads)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Sellers can delete own listing images'
  ) THEN
    CREATE POLICY "Sellers can delete own listing images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'listing-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'seller'
      )
    );
  END IF;
END $$;

-- Policy: All authenticated users can view listing images (more permissive than documents)
-- This allows buyers to see images in marketplace without being paid/verified
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can view listing images'
  ) THEN
    CREATE POLICY "Authenticated users can view listing images"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'listing-images'
    );
  END IF;
END $$;

-- Policy: Admins can access all listing images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admins can access all listing images'
  ) THEN
    CREATE POLICY "Admins can access all listing images"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'listing-images'
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
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'listing-images') THEN
    RAISE NOTICE '✅ Storage bucket "listing-images" created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create storage bucket "listing-images"';
  END IF;
END $$;
