-- Migration: Enhance Listing Form Fields for Client Requirements
-- Date: 2025-06-12
-- Purpose: Add separate fields for key strengths and growth opportunities to support
--          client-requested form modifications (splitting JSONB arrays into individual text fields)

-- Add individual key strength fields (replaces JSONB array for better form UX)
ALTER TABLE listings
ADD COLUMN key_strength_1 VARCHAR(200),
ADD COLUMN key_strength_2 VARCHAR(200),
ADD COLUMN key_strength_3 VARCHAR(200);

-- Add individual growth opportunity fields (replaces text area for better form UX)
ALTER TABLE listings
ADD COLUMN growth_opportunity_1 VARCHAR(200),
ADD COLUMN growth_opportunity_2 VARCHAR(200),
ADD COLUMN growth_opportunity_3 VARCHAR(200);

-- Add comments for documentation
COMMENT ON COLUMN listings.key_strength_1 IS 'First key business strength (replaces JSONB array for better UX)';
COMMENT ON COLUMN listings.key_strength_2 IS 'Second key business strength (optional)';
COMMENT ON COLUMN listings.key_strength_3 IS 'Third key business strength (optional)';
COMMENT ON COLUMN listings.growth_opportunity_1 IS 'First growth opportunity (replaces text area for better UX)';
COMMENT ON COLUMN listings.growth_opportunity_2 IS 'Second growth opportunity (optional)';
COMMENT ON COLUMN listings.growth_opportunity_3 IS 'Third growth opportunity (optional)';

-- Data migration: Populate new fields from existing JSONB data
-- This ensures we don't lose any existing data during the transition
DO $$
DECLARE
    listing_record RECORD;
    strengths_array TEXT[];
    opportunities_array TEXT[];
BEGIN
    -- Process each listing to migrate existing data
    FOR listing_record IN
        SELECT id, key_strengths_anonymous, specific_growth_opportunities
        FROM listings
        WHERE key_strengths_anonymous IS NOT NULL OR specific_growth_opportunities IS NOT NULL
    LOOP
        -- Migrate key strengths from JSONB array to individual fields
        IF listing_record.key_strengths_anonymous IS NOT NULL THEN
            BEGIN
                -- Extract array from JSONB
                strengths_array := ARRAY(SELECT jsonb_array_elements_text(listing_record.key_strengths_anonymous));

                -- Update individual strength fields
                UPDATE listings SET
                    key_strength_1 = CASE WHEN array_length(strengths_array, 1) >= 1 THEN strengths_array[1] END,
                    key_strength_2 = CASE WHEN array_length(strengths_array, 1) >= 2 THEN strengths_array[2] END,
                    key_strength_3 = CASE WHEN array_length(strengths_array, 1) >= 3 THEN strengths_array[3] END
                WHERE id = listing_record.id;
            EXCEPTION WHEN OTHERS THEN
                -- Log error but continue (graceful handling of malformed data)
                RAISE NOTICE 'Failed to migrate key strengths for listing %: %', listing_record.id, SQLERRM;
            END;
        END IF;

        -- Migrate growth opportunities from text to individual fields
        IF listing_record.specific_growth_opportunities IS NOT NULL THEN
            BEGIN
                -- Split text by newlines and bullet points
                opportunities_array := string_to_array(
                    regexp_replace(listing_record.specific_growth_opportunities, '^[\s\-\•\*]+', '', 'g'),
                    E'\n'
                );

                -- Clean up array elements (remove leading/trailing whitespace and bullet points)
                FOR i IN 1..array_length(opportunities_array, 1) LOOP
                    opportunities_array[i] := trim(regexp_replace(opportunities_array[i], '^[\s\-\•\*]+', ''));
                END LOOP;

                -- Filter out empty elements
                opportunities_array := ARRAY(SELECT unnest(opportunities_array) WHERE trim(unnest) != '');

                -- Update individual opportunity fields
                UPDATE listings SET
                    growth_opportunity_1 = CASE WHEN array_length(opportunities_array, 1) >= 1 THEN opportunities_array[1] END,
                    growth_opportunity_2 = CASE WHEN array_length(opportunities_array, 1) >= 2 THEN opportunities_array[2] END,
                    growth_opportunity_3 = CASE WHEN array_length(opportunities_array, 1) >= 3 THEN opportunities_array[3] END
                WHERE id = listing_record.id;
            EXCEPTION WHEN OTHERS THEN
                -- Log error but continue (graceful handling of malformed data)
                RAISE NOTICE 'Failed to migrate growth opportunities for listing %: %', listing_record.id, SQLERRM;
            END;
        END IF;
    END LOOP;

    RAISE NOTICE 'Migration completed. Individual fields populated from existing JSONB/text data.';
END $$;

-- Add indexes for performance (these fields will be searchable)
CREATE INDEX IF NOT EXISTS idx_listings_key_strength_1 ON listings(key_strength_1) WHERE key_strength_1 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_growth_opportunity_1 ON listings(growth_opportunity_1) WHERE growth_opportunity_1 IS NOT NULL;

-- Update the full-text search index to include new fields
DROP INDEX IF EXISTS idx_listings_search;
CREATE INDEX idx_listings_search ON listings USING GIN (
    to_tsvector('english',
        listing_title_anonymous || ' ' ||
        anonymous_business_description || ' ' ||
        COALESCE(business_model, '') || ' ' ||
        COALESCE(key_strength_1, '') || ' ' ||
        COALESCE(key_strength_2, '') || ' ' ||
        COALESCE(key_strength_3, '') || ' ' ||
        COALESCE(growth_opportunity_1, '') || ' ' ||
        COALESCE(growth_opportunity_2, '') || ' ' ||
        COALESCE(growth_opportunity_3, '')
    )
);

-- Create a view for backward compatibility (in case any existing code depends on JSONB format)
CREATE OR REPLACE VIEW listings_with_legacy_format AS
SELECT
    *,
    -- Reconstruct JSONB array from individual fields for backward compatibility
    CASE
        WHEN key_strength_1 IS NOT NULL THEN
            jsonb_build_array(
                key_strength_1,
                CASE WHEN key_strength_2 IS NOT NULL THEN key_strength_2 END,
                CASE WHEN key_strength_3 IS NOT NULL THEN key_strength_3 END
            ) - NULL  -- Remove null elements
        ELSE key_strengths_anonymous
    END AS computed_key_strengths_anonymous,

    -- Reconstruct text from individual fields for backward compatibility
    CASE
        WHEN growth_opportunity_1 IS NOT NULL THEN
            concat_ws(E'\n',
                '• ' || growth_opportunity_1,
                CASE WHEN growth_opportunity_2 IS NOT NULL THEN '• ' || growth_opportunity_2 END,
                CASE WHEN growth_opportunity_3 IS NOT NULL THEN '• ' || growth_opportunity_3 END
            )
        ELSE specific_growth_opportunities
    END AS computed_specific_growth_opportunities
FROM listings;
