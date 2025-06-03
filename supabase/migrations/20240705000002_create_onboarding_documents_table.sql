
CREATE TABLE IF NOT EXISTS public.onboarding_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- e.g., 'identity', 'business_registration', 'financial_statement'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL UNIQUE, -- Path in Supabase Storage, should be unique
    file_size INTEGER NOT NULL, -- Size in bytes
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- Any additional metadata about the upload
);

CREATE INDEX IF NOT EXISTS idx_onboarding_documents_user_id ON public.onboarding_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_document_type ON public.onboarding_documents(document_type);

COMMENT ON TABLE public.onboarding_documents IS 'Stores records of documents uploaded by users during the onboarding process.';
COMMENT ON COLUMN public.onboarding_documents.user_id IS 'Foreign key to the user_profiles table.';
COMMENT ON COLUMN public.onboarding_documents.document_type IS 'Type of document uploaded (e.g., identity_proof, business_license).';
COMMENT ON COLUMN public.onboarding_documents.file_path IS 'Full path to the file in Supabase Storage.';

-- RLS for onboarding_documents
ALTER TABLE public.onboarding_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding documents"
ON public.onboarding_documents
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can access all onboarding documents"
ON public.onboarding_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
