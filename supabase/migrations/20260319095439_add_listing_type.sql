-- Add listing_type enum and column to listings table
-- Replaces the old verified/unverified badge system with:
-- full_acquisition, partial_acquisition, open_to_talks, external_full_acquisition

DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM (
    'full_acquisition',
    'partial_acquisition',
    'open_to_talks',
    'external_full_acquisition'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS listing_type listing_type NOT NULL DEFAULT 'full_acquisition';

COMMENT ON COLUMN listings.listing_type IS 'Type of listing: full_acquisition, partial_acquisition, open_to_talks, or external_full_acquisition';
