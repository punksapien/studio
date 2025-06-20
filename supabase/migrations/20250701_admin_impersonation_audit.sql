-- Create admin impersonation audit table for security and compliance
-- This migration is idempotent and handles existing tables gracefully

DO $$
BEGIN
    -- Create admin_impersonation_audit table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public'
                   AND table_name = 'admin_impersonation_audit') THEN
        CREATE TABLE public.admin_impersonation_audit (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            admin_email text NOT NULL,
            target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            target_email text NOT NULL,
            action text NOT NULL CHECK (action IN ('magic_link_generated', 'magic_link_used', 'impersonation_started', 'impersonation_ended')),
            ip_address text,
            user_agent text,
            metadata jsonb DEFAULT '{}'::jsonb,
            timestamp timestamptz NOT NULL DEFAULT now(),
            created_at timestamptz NOT NULL DEFAULT now()
        );
    END IF;

    -- Create admin_impersonation_sessions table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public'
                   AND table_name = 'admin_impersonation_sessions') THEN
        CREATE TABLE public.admin_impersonation_sessions (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            token text UNIQUE NOT NULL,
            admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            admin_email text NOT NULL,
            target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            target_email text NOT NULL,
            expires_at timestamptz NOT NULL,
            used boolean DEFAULT false,
            used_at timestamptz,
            correlation_id text,
            created_at timestamptz NOT NULL DEFAULT now()
        );
    END IF;

    -- Add any missing columns to existing tables
    -- For admin_impersonation_audit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'admin_impersonation_audit'
                   AND column_name = 'timestamp') THEN
        ALTER TABLE public.admin_impersonation_audit
        ADD COLUMN timestamp timestamptz NOT NULL DEFAULT now();
    END IF;

    -- Create indexes (these are already IF NOT EXISTS)
    CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_admin_user
        ON public.admin_impersonation_audit(admin_user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_target_user
        ON public.admin_impersonation_audit(target_user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_timestamp
        ON public.admin_impersonation_audit(timestamp);
    CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_action
        ON public.admin_impersonation_audit(action);

    CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_token
        ON public.admin_impersonation_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_admin_user
        ON public.admin_impersonation_sessions(admin_user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_target_user
        ON public.admin_impersonation_sessions(target_user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_expires_at
        ON public.admin_impersonation_sessions(expires_at);

    -- Enable RLS (safe to run multiple times)
    ALTER TABLE public.admin_impersonation_audit ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_impersonation_audit'
        AND policyname = 'Admin impersonation audit - Admin access only'
    ) THEN
        CREATE POLICY "Admin impersonation audit - Admin access only"
            ON public.admin_impersonation_audit
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles
                    WHERE user_profiles.id = auth.uid()
                    AND user_profiles.role = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'admin_impersonation_sessions'
        AND policyname = 'Admin impersonation sessions - Admin access only'
    ) THEN
        CREATE POLICY "Admin impersonation sessions - Admin access only"
            ON public.admin_impersonation_sessions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles
                    WHERE user_profiles.id = auth.uid()
                    AND user_profiles.role = 'admin'
                )
            );
    END IF;

    -- Grant permissions (safe to run multiple times)
    GRANT USAGE ON SCHEMA public TO service_role;
    GRANT ALL ON public.admin_impersonation_audit TO service_role;
    GRANT ALL ON public.admin_impersonation_sessions TO service_role;

    RAISE NOTICE 'Admin impersonation audit tables configured successfully';
END $$;

-- Add cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_impersonation_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    DELETE FROM public.admin_impersonation_sessions
    WHERE expires_at < now() - interval '1 hour';
$$;
