-- Enable realtime for messages table
-- This allows real-time updates to work by permitting realtime service to read messages
-- Without this, postgres_changes events are blocked by RLS

DO $$
BEGIN
    -- Add policy to allow realtime service to read messages
    -- Check if supabase_realtime role exists (production) or use service_role (local)
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime') THEN
        -- Production: use supabase_realtime role
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'messages'
            AND policyname = 'Enable realtime for messages'
        ) THEN
            CREATE POLICY "Enable realtime for messages"
            ON "public"."messages"
            FOR SELECT
            TO supabase_realtime
            USING (true);
        END IF;
    ELSE
        -- Local development: use service_role for realtime
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'messages'
            AND policyname = 'Enable realtime for messages'
        ) THEN
            CREATE POLICY "Enable realtime for messages"
            ON "public"."messages"
            FOR SELECT
            TO service_role
            USING (true);
        END IF;
    END IF;

    -- Also allow authenticated/anon for regular app access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'messages'
        AND policyname = 'Enable realtime for all authenticated users'
    ) THEN
        CREATE POLICY "Enable realtime for all authenticated users"
        ON "public"."messages"
        FOR SELECT
        TO authenticated, anon, service_role
        USING (true);
    END IF;
END $$;
