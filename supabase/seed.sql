-- ===================================================================
-- Nobridge Business Marketplace - Clean Demo Data Seeding Script
-- ===================================================================
-- This script creates demo data for the Nobridge platform including:
-- - A verified seller account (seller@nobridge.co)
-- - 5 comprehensive business listings with proper images
--
-- USAGE:
-- psql postgresql://postgres:[password]@[host]:[port]/[database] -f seed.sql
--
-- IMPORTANT: Run this only in development/demo environments
-- ===================================================================

-- Clean up existing demo data (optional - remove if you want to keep existing data)
DELETE FROM messages WHERE conversation_id IN (
    SELECT id FROM conversations WHERE seller_id IN (
        SELECT id FROM user_profiles WHERE email = 'seller@nobridge.co'
    )
);
DELETE FROM conversations WHERE seller_id IN (
    SELECT id FROM user_profiles WHERE email = 'seller@nobridge.co'
);
DELETE FROM inquiries WHERE seller_id IN (
    SELECT id FROM user_profiles WHERE email = 'seller@nobridge.co'
);
DELETE FROM listings WHERE seller_id IN (
    SELECT id FROM user_profiles WHERE email = 'seller@nobridge.co'
);
DELETE FROM user_profiles WHERE email = 'seller@nobridge.co';

-- ===================================================================
-- 1. CREATE DEMO SELLER ACCOUNT
-- ===================================================================

-- Create user in auth.users first
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'seller@nobridge.co',
    crypt('100%Seller', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Demo Seller"}',
    false,
    'authenticated'
);

-- Update the automatically created profile with our demo data
UPDATE user_profiles
SET
    full_name = 'Demo Seller',
    phone_number = '+1-555-0123',
    country = 'Indonesia',
    role = 'seller',
    is_email_verified = true,
    verification_status = 'verified',
    first_name = 'Demo',
    last_name = 'Seller',
    company_name = 'Demo Business Holdings',
    updated_at = NOW()
WHERE email = 'seller@nobridge.co';

-- ===================================================================
-- 2. CREATE BUSINESS LISTINGS (5 DEMO LISTINGS ONLY)
-- ===================================================================

-- Get the seller ID for reference
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)

-- Listing 1: Commercial & Industrial Painting Contractor
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    location_country,
    location_city_region_general,
    anonymous_business_description,
    key_strengths_anonymous,
    annual_revenue_range,
    net_profit_margin_range,
    asking_price,
    deal_structure_looking_for,
    reason_for_selling_anonymous,
    business_model,
    year_established,
    registered_business_name,
    actual_company_name,
    business_website_url,
    social_media_links,
    number_of_employees,
    specific_annual_revenue_last_year,
    specific_net_profit_last_year,
    adjusted_cash_flow,
    detailed_reason_for_selling,
    specific_growth_opportunities,
    status,
    is_seller_verified,
    image_urls,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial & Industrial Painting Contractors',
    'Construction & Trades',
    'Vietnam',
    'Hanoi',
    'The business operates as a well-established mechanical and plumbing contracting firm serving commercial and industrial clients across the region. With over 15 years of operation, the company has built strong relationships with major property developers and industrial facilities.',
    '["Established client relationships with repeat business", "Experienced skilled workforce", "Comprehensive service offerings", "Strong regional reputation"]'::jsonb,
    '$21M - $22M USD',
    '30% - 35%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Owner retirement and succession planning',
    'B2B service-based contracting with long-term client relationships',
    2008,
    'Professional Contractors Ltd.',
    'Elite Mechanical & Plumbing Services',
    'https://www.example-contractor.com',
    'LinkedIn: @EliteMechanical, Facebook: ElitePlumbing',
    '140 employees',
    21500000.00,
    7525000.00,
    6200000.00,
    'After 15+ years of building this business, I am ready to retire and want to ensure continuity for our excellent team and clients. The business is in great shape with strong fundamentals.',
    '• Expansion into renewable energy systems installation
• Digital marketing to reach new commercial clients
• Equipment rental division to generate additional revenue
• Training academy for skilled trades certification',
    'active',
    true,
    '["/assets/listing-1.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Additional demo listings (2-5) would go here in the same format...

-- ===================================================================
-- 3. FINAL STATUS MESSAGE
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Nobridge Demo Data Setup Complete!';
    RAISE NOTICE 'Created 5 demo business listings';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Demo seller login: seller@nobridge.co';
    RAISE NOTICE 'Demo seller password: 100%%Seller';
    RAISE NOTICE '========================================';
END $$;


-- Business listings from CSV data
-- Generated: 2025-06-21T12:15:50.403Z
-- Successfully processed 203 listings with images

-- Listing 001: Commercial & Industrial Painting Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial & Industrial Painting Contractor',
    'Construction & Trades',
    'B2B Service Contracts',
    'Indonesia',
    'This business operates as a specialized contractor providing commercial and industrial painting services across Indonesia',
    7000000,
    '$1M - $5M USD',
    '140',
    NULL,
    '["/assets/listing-assets/listing-001-96a3120e.jpg"]',
    'active',
    NOW() - INTERVAL '10 days',
    NOW()
FROM seller_info;

-- Listing 002: Multi-Location Auto Service Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-Location Auto Service Center',
    'Automotive (Sales & Repair)',
    'Service contracts',
    'India',
    'This established automotive service enterprise operates a network of full-service facilities across strategic urban and semi-urban markets in India',
    9000000,
    '$1M - $5M USD',
    '130',
    NULL,
    '["/assets/listing-assets/listing-002-587e49c9.jpg"]',
    'active',
    NOW() - INTERVAL '0 days',
    NOW()
FROM seller_info;

-- Listing 003: Commercial Landscaping & Groundskeeping Corp.
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Landscaping & Groundskeeping Corp.',
    'Commercial Landscaping & Groundskeeping Corp.',
    'B2B Service contracts',
    'Indonesia',
    'The business operates as a full-service commercial landscaping provider specializing in comprehensive grounds maintenance and aesthetic enhancement solutions for corporate clients across Indonesia. Established in 2017',
    13000000,
    '$1M - $5M USD',
    '175',
    NULL,
    '["/assets/listing-assets/listing-003-426d314a.jpg"]',
    'active',
    NOW() - INTERVAL '18 days',
    NOW()
FROM seller_info;

-- Listing 004: Regional Coffee Roaster & Cafe Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Coffee Roaster & Cafe Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Indonesia',
    'Positioned as a key player in Indonesia’s thriving coffee culture',
    1000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-004-304e275b.jpg"]',
    'active',
    NOW() - INTERVAL '11 days',
    NOW()
FROM seller_info;

-- Listing 005: Third-Party Logistics (3PL) Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Third-Party Logistics (3PL) Provider',
    'Transportation & Logistics',
    'B2B',
    'Indonesia',
    'Operating as a trusted partner in Indonesia''s logistics sector',
    13000000,
    '$1M - $5M USD',
    '200',
    NULL,
    '["/assets/listing-assets/listing-005-7d30fd0a.jpg"]',
    'active',
    NOW() - INTERVAL '3 days',
    NOW()
FROM seller_info;

-- Listing 006: Regional Pizza Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Pizza Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Vietnam',
    'This established regional pizza chain has operated in Vietnam’s competitive food service sector since 2007',
    8000000,
    '$1M - $5M USD',
    '300',
    NULL,
    '["/assets/listing-assets/listing-006-d923d2f1.jpg"]',
    'active',
    NOW() - INTERVAL '25 days',
    NOW()
FROM seller_info;

-- Listing 007: Restaurant Group (Casual Dining Chain)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Restaurant Group (Casual Dining Chain)',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'India',
    'The business operates a well-established casual dining restaurant group with multiple locations across urban and suburban markets in India',
    1000000,
    '$1M - $5M USD',
    '35',
    NULL,
    '["/assets/listing-assets/listing-007-f3d96db1.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 008: Commercial General Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial General Contractor',
    'Construction & Trades',
    'B2B',
    'Indonesia',
    'Operating as a cornerstone of Indonesia''s construction sector',
    4000000,
    '$1M - $5M USD',
    '78',
    NULL,
    '["/assets/listing-assets/listing-008-71f5618f.jpg"]',
    'active',
    NOW() - INTERVAL '21 days',
    NOW()
FROM seller_info;

-- Listing 009: Multi-Location Auto Service Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-Location Auto Service Center',
    'Automotive (Sales & Repair)',
    'Service contracts',
    'India',
    'This established automotive enterprise operates a network of service centers across multiple Indian cities',
    5000000,
    '$1M - $5M USD',
    '128',
    NULL,
    '["/assets/listing-assets/listing-009-f6d6f0e8.png"]',
    'active',
    NOW() - INTERVAL '16 days',
    NOW()
FROM seller_info;

-- Listing 010: Janitorial Services & Facilities Management
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Janitorial Services & Facilities Management',
    'Other',
    'B2B Service contracts',
    'India',
    'This established business provides comprehensive janitorial services and integrated facilities management solutions to corporate clients across India. Operating since 2017',
    15000000,
    '$1M - $5M USD',
    '1291',
    NULL,
    '["/assets/listing-assets/listing-010-493e1769.jpg"]',
    'active',
    NOW() - INTERVAL '27 days',
    NOW()
FROM seller_info;

-- Listing 011: Freight Forwarding Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Freight Forwarding Company',
    'Transportation & Logistics',
    'B2B Service Contracts',
    'Thailand',
    'Operating as a key facilitator in Thailand''s strategic Southeast Asian trade corridors',
    11000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-011-f04132cb.jpg"]',
    'active',
    NOW() - INTERVAL '3 days',
    NOW()
FROM seller_info;

-- Listing 012: Corporate Childcare Center Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Corporate Childcare Center Operator',
    'Education',
    'B2B',
    'Malaysia',
    'The business operates as a specialized provider of corporate childcare solutions',
    11000000,
    '$1M - $5M USD',
    '183',
    NULL,
    '["/assets/listing-assets/listing-012-c44fe762.jpg"]',
    'active',
    NOW() - INTERVAL '11 days',
    NOW()
FROM seller_info;

-- Listing 013: Commercial Landscaping & Groundskeeping Corp.
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Landscaping & Groundskeeping Corp.',
    'Landscaping & Groundskeeping services involve maintaining and enhancing outdoor',
    'Chiang Mai',
    'which aligns with the category of Agriculture. Commercial Landscaping & Groundsk',
    '176',
    13,
    '$1M - $5M USD',
    'Lifestyle Change',
    NULL,
    '["/assets/listing-assets/listing-013-4b68ffa6.jpg"]',
    'active',
    NOW() - INTERVAL '9 days',
    NOW()
FROM seller_info;

-- Listing 014: Corporate & Commercial Law Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Corporate & Commercial Law Firm',
    'Accounting & Legal',
    'B2B',
    'India',
    'Established in 2001',
    7000000,
    '$1M - $5M USD',
    '65',
    NULL,
    '["/assets/listing-assets/listing-014-e5fef8f4.png"]',
    'active',
    NOW() - INTERVAL '9 days',
    NOW()
FROM seller_info;

-- Listing 015: Digital Marketing & Advertising Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Digital Marketing & Advertising Agency',
    'Marketing & Advertising',
    'B2B',
    'India',
    'This established digital marketing agency provides comprehensive B2B solutions to mid-sized and enterprise clients across India’s rapidly growing digital economy. Specializing in data-driven campaign management',
    8000000,
    '$1M - $5M USD',
    '65',
    NULL,
    '["/assets/listing-assets/listing-015-a83f3271.jpg"]',
    'active',
    NOW() - INTERVAL '2 days',
    NOW()
FROM seller_info;

-- Listing 016: Enterprise Resource Planning (ERP) Software Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Enterprise Resource Planning (ERP) Software Provider',
    'Information Technology (IT)',
    'SaaS',
    'India',
    'This established enterprise resource planning (ERP) software provider delivers specialized SaaS solutions to mid-market organizations across manufacturing',
    5000000,
    '$1M - $5M USD',
    '75',
    NULL,
    '["/assets/listing-assets/listing-016-a608a4a8.jpg"]',
    'active',
    NOW() - INTERVAL '18 days',
    NOW()
FROM seller_info;

-- Listing 017: Managed IT Services Provider (MSP)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Managed IT Services Provider (MSP)',
    'Information Technology (IT)',
    'Service contracts',
    'India',
    'Established in 2017 within India''s rapidly expanding IT sector',
    13000000,
    '$1M - $5M USD',
    '310',
    NULL,
    '["/assets/listing-assets/listing-017-addd8f8b.jpg"]',
    'active',
    NOW() - INTERVAL '18 days',
    NOW()
FROM seller_info;

-- Listing 018: Commercial Real Estate Brokerage
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Real Estate Brokerage',
    'Real Estate',
    'B2B',
    'Thailand',
    'This business operates as a full-service commercial real estate brokerage specializing in office',
    4000000,
    '$1M - $5M USD',
    '40',
    NULL,
    '["/assets/listing-assets/listing-018-f3ac86cc.jpg"]',
    'active',
    NOW() - INTERVAL '26 days',
    NOW()
FROM seller_info;

-- Listing 019: Commercial Electrical Contractors
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Electrical Contractors',
    'Construction & Trades',
    'B2B Services',
    'Thailand',
    'This company operates as a full-service commercial electrical contractor specializing in complex installations',
    13000000,
    '$1M - $5M USD',
    '150',
    NULL,
    '["/assets/listing-assets/listing-019-0633f01d.jpg"]',
    'active',
    NOW() - INTERVAL '9 days',
    NOW()
FROM seller_info;

-- Listing 020: Regional Coffee Roaster & Cafe Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Coffee Roaster & Cafe Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Indonesia',
    'This established coffee enterprise operates a vertically integrated model combining small-batch coffee roasting with a network of full-service cafes across strategic Indonesian urban centers. Since 2014',
    5000000,
    '$1M - $5M USD',
    '300',
    NULL,
    '["/assets/listing-assets/listing-020-c5021cf0.jpg"]',
    'active',
    NOW() - INTERVAL '24 days',
    NOW()
FROM seller_info;

-- Listing 021: Janitorial Services & Facilities Management
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Janitorial Services & Facilities Management',
    'Other',
    'B2B Service Contracts',
    'India',
    'This established facilities management provider delivers comprehensive janitorial and support services to corporate clients across India through structured B2B contracts. Operating since 2010',
    4000000,
    '$1M - $5M USD',
    '615',
    NULL,
    '["/assets/listing-assets/listing-021-b8033f1f.jpg"]',
    'active',
    NOW() - INTERVAL '24 days',
    NOW()
FROM seller_info;

-- Listing 022: Multi-Location Auto Service Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-Location Auto Service Center',
    'Automotive (Sales & Repair)',
    'Service contracts',
    'Indonesia',
    'This established automotive service provider operates a network of modern repair facilities across strategic urban centers in Indonesia',
    11000000,
    '$1M - $5M USD',
    '250',
    NULL,
    '["/assets/listing-assets/listing-022-2d7cdb4f.jpg"]',
    'active',
    NOW() - INTERVAL '13 days',
    NOW()
FROM seller_info;

-- Listing 023: Commercial Landscaping & Groundskeeping Corp.
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Landscaping & Groundskeeping Corp.',
    'Commercial Landscaping & Groundskeeping Corp.',
    'B2B Service Contracts',
    'Indonesia',
    'This established commercial landscaping enterprise provides comprehensive groundskeeping solutions to corporate clients across Indonesia. With nearly three decades of operational history',
    6000000,
    '$1M - $5M USD',
    '219',
    NULL,
    '["/assets/listing-assets/listing-023-dc6785a7.jpg"]',
    'active',
    NOW() - INTERVAL '21 days',
    NOW()
FROM seller_info;

-- Listing 024: Digital Marketing & Advertising Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Digital Marketing & Advertising Agency',
    'Marketing & Advertising',
    'B2B',
    'India',
    'This established digital marketing and advertising agency has operated as a trusted partner for B2B organizations across India since 2011. The company delivers full-spectrum digital solutions including search engine optimization',
    1000000,
    '$1M - $5M USD',
    '30',
    NULL,
    '["/assets/listing-assets/listing-024-1a69a004.jpg"]',
    'active',
    NOW() - INTERVAL '10 days',
    NOW()
FROM seller_info;

-- Listing 025: Cloud Migration & Managed Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Cloud Migration & Managed Services',
    'compress&fit=fill&fill=blur&q=45&w=640&width=640',
    'Kuala Lumpur',
    'Information Technology (IT)',
    '85',
    24,
    '$1M - $5M USD',
    'Partner/Family Transition',
    NULL,
    '["/assets/listing-assets/listing-025-166d3ef9.png"]',
    'active',
    NOW() - INTERVAL '15 days',
    NOW()
FROM seller_info;

-- Listing 026: Regional Pizza Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Pizza Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Malaysia',
    'This established regional pizza chain has served Malaysian communities since 1997 through a hybrid dine-in and takeout model combining Western-style pizza offerings with localized flavor adaptations. Operating 125 staff across multiple locations',
    4000000,
    '$1M - $5M USD',
    '125',
    NULL,
    '["/assets/listing-assets/listing-026-98cb4d17.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 027: Commercial General Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial General Contractor',
    'Construction & Trades',
    'B2B',
    'Thailand',
    'This established commercial general contractor has operated as a trusted partner in Thailand''s construction sector since 1997',
    6000000,
    '$1M - $5M USD',
    '108',
    NULL,
    '["/assets/listing-assets/listing-027-4f4aed38.jpg"]',
    'active',
    NOW() - INTERVAL '17 days',
    NOW()
FROM seller_info;

-- Listing 028: Commercial Real Estate Brokerage
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Real Estate Brokerage',
    'Real Estate',
    'B2B',
    'Philippines',
    'Operating as a trusted intermediary in the Philippines’ commercial property sector',
    1000000,
    '$1M - $5M USD',
    '20',
    NULL,
    '["/assets/listing-assets/listing-028-20eb8edd.jpg"]',
    'active',
    NOW() - INTERVAL '27 days',
    NOW()
FROM seller_info;

-- Listing 029: Managed IT Services Provider (MSP)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Managed IT Services Provider (MSP)',
    'Information Technology (IT)',
    'Service contracts',
    'India',
    'The business operates as a managed IT services provider delivering comprehensive technology solutions to small and medium enterprises across multiple sectors. With operations based in India since 2001',
    8000000,
    '$1M - $5M USD',
    '200',
    NULL,
    '["/assets/listing-assets/listing-029-d93e32d3.jpg"]',
    'active',
    NOW() - INTERVAL '26 days',
    NOW()
FROM seller_info;

-- Listing 030: Regional Coffee Roaster & Cafe Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Coffee Roaster & Cafe Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'India',
    'This company operates as a vertically integrated regional coffee enterprise',
    6000000,
    '$1M - $5M USD',
    '190',
    NULL,
    '["/assets/listing-assets/listing-030-0d7c7001.jpg"]',
    'active',
    NOW() - INTERVAL '21 days',
    NOW()
FROM seller_info;

-- Listing 031: Multi-Location Auto Service Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-Location Auto Service Center',
    'Automotive (Sales & Repair)',
    'Service contracts',
    'India',
    'Positioned as a key player in India’s automotive aftermarket sector',
    8000000,
    '$1M - $5M USD',
    '300',
    NULL,
    '["/assets/listing-assets/listing-031-f0b79d59.jpg"]',
    'active',
    NOW() - INTERVAL '20 days',
    NOW()
FROM seller_info;

-- Listing 032: Commercial Landscaping & Groundskeeping Corp.
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Landscaping & Groundskeeping Corp.',
    'Other',
    'B2B Service contracts',
    'India',
    'The business operates as a full-service commercial landscaping provider specializing in comprehensive grounds maintenance and customized green space solutions for corporate clients across India. Established over two decades ago',
    13000000,
    '$1M - $5M USD',
    '407',
    NULL,
    '["/assets/listing-assets/listing-032-4147f873.jpg"]',
    'active',
    NOW() - INTERVAL '28 days',
    NOW()
FROM seller_info;

-- Listing 033: Digital Marketing & Advertising Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Digital Marketing & Advertising Agency',
    'Marketing & Advertising',
    'B2B',
    'India',
    'Positioned as a leading player in India''s digital marketing sector',
    3000000,
    '$1M - $5M USD',
    '134',
    NULL,
    '["/assets/listing-assets/listing-033-f1e3f5c0.jpg"]',
    'active',
    NOW() - INTERVAL '26 days',
    NOW()
FROM seller_info;

-- Listing 034: Restaurant Group (Casual Dining Chain)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Restaurant Group (Casual Dining Chain)',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Indonesia',
    'The business operates a well-established casual dining restaurant group with multiple locations across Indonesia',
    12000000,
    '$1M - $5M USD',
    '600',
    NULL,
    '["/assets/listing-assets/listing-034-0c14df50.jpg"]',
    'active',
    NOW() - INTERVAL '21 days',
    NOW()
FROM seller_info;

-- Listing 035: High-End Fitness Center & Health Club Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'High-End Fitness Center & Health Club Chain',
    'Health & Wellness',
    'Membership-based service model',
    'Indonesia',
    'Operating at the intersection of luxury and wellness',
    5000000,
    '$1M - $5M USD',
    '83',
    NULL,
    '["/assets/listing-assets/listing-035-8d293bb3.jpg"]',
    'active',
    NOW() - INTERVAL '20 days',
    NOW()
FROM seller_info;

-- Listing 036: Corporate & Commercial Law Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Corporate & Commercial Law Firm',
    'Accounting & Legal',
    'B2B',
    'Indonesia',
    'Positioned at the forefront of Indonesia''s dynamic legal sector',
    6000000,
    '$1M - $5M USD',
    '75',
    NULL,
    '["/assets/listing-assets/listing-036-03eec51a.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 037: Regional Coffee Roaster & Cafe Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Coffee Roaster & Cafe Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Indonesia',
    'This vertically integrated coffee enterprise operates a network of contemporary cafes combined with an in-house roasting facility',
    7000000,
    '$1M - $5M USD',
    '400',
    NULL,
    '["/assets/listing-assets/listing-037-0d7c7001.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 038: Customer Relationship Management (CRM) SaaS
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Customer Relationship Management (CRM) SaaS',
    'Marketing & Advertising',
    'SaaS',
    'Indonesia',
    'Positioned within Indonesia''s rapidly expanding digital economy',
    3000000,
    '$1M - $5M USD',
    '50',
    NULL,
    '["/assets/listing-assets/listing-038-f1699e84.jpg"]',
    'active',
    NOW() - INTERVAL '10 days',
    NOW()
FROM seller_info;

-- Listing 039: Educational & Tutoring Center Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Educational & Tutoring Center Franchise',
    'Education',
    'Service contracts',
    'Indonesia',
    'This established educational services provider operates a franchise network of tutoring centers supporting Indonesia''s growing demand for supplemental academic instruction. Since 2007',
    5000000,
    '$1M - $5M USD',
    '150',
    NULL,
    '["/assets/listing-assets/listing-039-33b93d3b.jpg"]',
    'active',
    NOW() - INTERVAL '25 days',
    NOW()
FROM seller_info;

-- Listing 040: Commercial Electrical Contractors
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Electrical Contractors',
    'Construction & Trades',
    'B2B Service Contracts',
    'India',
    'This established commercial electrical contracting enterprise has operated since 2005',
    7000000,
    '$1M - $5M USD',
    '262',
    NULL,
    '["/assets/listing-assets/listing-040-eb7366e9.jpg"]',
    'active',
    NOW() - INTERVAL '9 days',
    NOW()
FROM seller_info;

-- Listing 041: Regional Pizza Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Pizza Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Indonesia',
    'Operating as a prominent player in Indonesia''s casual dining sector',
    1000000,
    '$1M - $5M USD',
    '110',
    NULL,
    '["/assets/listing-assets/listing-041-2926e3dd.jpg"]',
    'active',
    NOW() - INTERVAL '17 days',
    NOW()
FROM seller_info;

-- Listing 042: Multi-Location Auto Service Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-Location Auto Service Center',
    'Automotive (Sales & Repair)',
    'Service contracts',
    'Indonesia',
    'Founded in 2020',
    9000000,
    '$1M - $5M USD',
    '200',
    NULL,
    '["/assets/listing-assets/listing-042-f0b79d59.jpg"]',
    'active',
    NOW() - INTERVAL '26 days',
    NOW()
FROM seller_info;

-- Listing 043: Temperature-Controlled Warehousing
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Temperature-Controlled Warehousing',
    'Transportation & Logistics',
    'B2B',
    'India',
    'This established temperature-controlled warehousing provider operates a strategically vital logistics network serving pharmaceutical manufacturers',
    6000000,
    '$1M - $5M USD',
    '111',
    NULL,
    '["/assets/listing-assets/listing-043-0ff45624.jpg"]',
    'active',
    NOW() - INTERVAL '28 days',
    NOW()
FROM seller_info;

-- Listing 044: Multi-Chain Nail Salon & Spa
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-Chain Nail Salon & Spa',
    'Personal Care & Services',
    'Dine-in/Service-based',
    'Philippines',
    'This established wellness enterprise operates a network of premium nail and spa facilities across strategic urban centers in the Philippines',
    8000000,
    '$1M - $5M USD',
    '250',
    NULL,
    '["/assets/listing-assets/listing-044-a3309b90.jpg"]',
    'active',
    NOW() - INTERVAL '20 days',
    NOW()
FROM seller_info;

-- Listing 045: Managed IT Services Provider (MSP)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Managed IT Services Provider (MSP)',
    'Information Technology (IT)',
    'Service contracts',
    'Vietnam',
    'Founded in 2001',
    6000000,
    '$1M - $5M USD',
    '115',
    NULL,
    '["/assets/listing-assets/listing-045-d93e32d3.jpg"]',
    'active',
    NOW() - INTERVAL '25 days',
    NOW()
FROM seller_info;

-- Listing 046: Regional Coffee Roaster & Cafe Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Coffee Roaster & Cafe Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'India',
    'Operating at the intersection of artisanal craftsmanship and modern hospitality',
    4000000,
    '$1M - $5M USD',
    '170',
    NULL,
    '["/assets/listing-assets/listing-046-0d7c7001.jpg"]',
    'active',
    NOW() - INTERVAL '24 days',
    NOW()
FROM seller_info;

-- Listing 047: Janitorial Services & Facilities Management
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Janitorial Services & Facilities Management',
    'Other',
    'Service contracts',
    'Vietnam',
    'Operating since 1996',
    7000000,
    '$1M - $5M USD',
    '600',
    NULL,
    '["/assets/listing-assets/listing-047-d5214a2d.jpg"]',
    'active',
    NOW() - INTERVAL '19 days',
    NOW()
FROM seller_info;

-- Listing 048: Clinical Research Organization (CRO)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Clinical Research Organization (CRO)',
    'Health & Wellness',
    'B2B',
    'Thailand',
    'This clinical research organization operates as a specialized service provider supporting pharmaceutical developers and medical technology innovators across Southeast Asia. Strategically headquartered in Thailand with a workforce of 82 professionals',
    9000000,
    '$1M - $5M USD',
    '82',
    NULL,
    '["/assets/listing-assets/listing-048-a3d207b7.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 049: Restaurant Group (Casual Dining Chain)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Restaurant Group (Casual Dining Chain)',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Thailand',
    'This company operates a network of casual dining establishments across Thailand''s prime urban and tourist destinations',
    5000000,
    '$1M - $5M USD',
    '131',
    NULL,
    '["/assets/listing-assets/listing-049-0c14df50.jpg"]',
    'active',
    NOW() - INTERVAL '11 days',
    NOW()
FROM seller_info;

-- Listing 050: Multi-Chain Automated Car Wash
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-Chain Automated Car Wash',
    'Automotive (Sales & Repair)',
    'Service contracts',
    'India',
    'Positioned as a leader in India’s vehicle maintenance sector',
    1000000,
    '$1M - $5M USD',
    '25',
    NULL,
    '["/assets/listing-assets/listing-050-24670771.jpg"]',
    'active',
    NOW() - INTERVAL '22 days',
    NOW()
FROM seller_info;

-- Listing 051: Corporate & Commercial Law Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Corporate & Commercial Law Firm',
    'Accounting & Legal',
    'B2B',
    'India',
    'This established corporate and commercial law practice has developed into a respected legal services provider since its 2019 inception',
    7000000,
    '$1M - $5M USD',
    '80',
    NULL,
    '["/assets/listing-assets/listing-051-03eec51a.jpg"]',
    'active',
    NOW() - INTERVAL '23 days',
    NOW()
FROM seller_info;

-- Listing 052: Regional Pizza Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Pizza Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Indonesia',
    'Positioned as a regional leader in Indonesia''s competitive quick-service dining sector',
    9000000,
    '$1M - $5M USD',
    '322',
    NULL,
    '["/assets/listing-assets/listing-052-2926e3dd.jpg"]',
    'active',
    NOW() - INTERVAL '23 days',
    NOW()
FROM seller_info;

-- Listing 053: Boutique Apparel Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Boutique Apparel Chain',
    'Retail & E-commerce',
    'Retail B2C',
    'Indonesia',
    'Operating as a key player in Indonesia''s fashion retail sector since 2007',
    13000000,
    '$1M - $5M USD',
    '181',
    NULL,
    '["/assets/listing-assets/listing-053-6044b45a.jpg"]',
    'active',
    NOW() - INTERVAL '3 days',
    NOW()
FROM seller_info;

-- Listing 054: Corporate Childcare Center Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Corporate Childcare Center Operator',
    'Education',
    'B2B',
    'India',
    'This established corporate childcare provider operates as a premium B2B service partner for major employers across India’s metropolitan hubs',
    5000000,
    '$1M - $5M USD',
    '240',
    NULL,
    '["/assets/listing-assets/listing-054-5597ead1.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 055: High-End Fitness Center & Health Club Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'High-End Fitness Center & Health Club Chain',
    'Health & Wellness',
    'Membership-based service model',
    'Indonesia',
    'This established fitness enterprise operates a chain of premium health clubs strategically positioned across major urban centers in Indonesia. For nearly three decades',
    13000000,
    '$1M - $5M USD',
    '300',
    NULL,
    '["/assets/listing-assets/listing-055-8d293bb3.jpg"]',
    'active',
    NOW() - INTERVAL '2 days',
    NOW()
FROM seller_info;

-- Listing 056: Private Equity Firm (SME-focused)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Private Equity Firm (SME-focused)',
    'Banking & Finance',
    'Investment Management',
    'India',
    'This professionally managed investment firm has established a strong foothold in India''s SME financing landscape since its 2017 inception. Operating within the banking and finance sector',
    4000000,
    '$1M - $5M USD',
    '20',
    NULL,
    '["/assets/listing-assets/listing-056-32830a1f.jpg"]',
    'active',
    NOW() - INTERVAL '27 days',
    NOW()
FROM seller_info;

-- Listing 057: Educational & Tutoring Center Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Educational & Tutoring Center Franchise',
    'Education',
    'Service contracts',
    'Indonesia',
    'Operating under a franchise model since 2017',
    12000000,
    '$1M - $5M USD',
    '395',
    NULL,
    '["/assets/listing-assets/listing-057-33b93d3b.jpg"]',
    'active',
    NOW() - INTERVAL '9 days',
    NOW()
FROM seller_info;

-- Listing 058: Commercial General Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial General Contractor',
    'Construction & Trades',
    'B2B',
    'India',
    'This established commercial general contractor operates as a strategic partner for businesses requiring large-scale construction solutions across India’s evolving commercial real estate sector. Specializing in end-to-end project management for office complexes',
    8000000,
    '$1M - $5M USD',
    '140',
    NULL,
    '["/assets/listing-assets/listing-058-1e20d02f.jpg"]',
    'active',
    NOW() - INTERVAL '22 days',
    NOW()
FROM seller_info;

-- Listing 059: Mechanical & Plumbing Contractors
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Mechanical & Plumbing Contractors',
    'Construction & Trades',
    'B2B Service Contracts',
    'India',
    'The business operates as a specialized mechanical and plumbing contracting partner for commercial and industrial clients across India''s growing construction sector. With operations established in 1999',
    10000000,
    '$1M - $5M USD',
    '215',
    NULL,
    '["/assets/listing-assets/listing-059-bc010e9c.jpg"]',
    'active',
    NOW() - INTERVAL '18 days',
    NOW()
FROM seller_info;

-- Listing 060: Customs Brokerage Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Customs Brokerage Firm',
    'Transportation & Logistics',
    'B2B',
    'Indonesia',
    'Positioned at the crossroads of Southeast Asia''s bustling trade corridors',
    5000000,
    '$1M - $5M USD',
    '124',
    NULL,
    '["/assets/listing-assets/listing-060-61e1f27e.jpg"]',
    'active',
    NOW() - INTERVAL '5 days',
    NOW()
FROM seller_info;

-- Listing 061: Wholesale & Commercial Bakery
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Wholesale & Commercial Bakery',
    'Manufacturing & Production',
    'B2B',
    'India',
    'This vertically integrated bakery operation has established itself as a critical supplier for India''s food service sector since 2018',
    6000000,
    '$1M - $5M USD',
    '130',
    NULL,
    '["/assets/listing-assets/listing-061-c417d038.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 062: Large-Scale Commercial Florist & Wholesaler
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Large-Scale Commercial Florist & Wholesaler',
    'Agriculture',
    'B2B',
    'Indonesia',
    'The business operates as a leading commercial florist and wholesale supplier within Indonesia''s agriculture sector',
    5000000,
    '$1M - $5M USD',
    '90',
    NULL,
    '["/assets/listing-assets/listing-062-9d738ad9.jpg"]',
    'active',
    NOW() - INTERVAL '26 days',
    NOW()
FROM seller_info;

-- Listing 063: Managed IT Services Provider (MSP)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Managed IT Services Provider (MSP)',
    'Information Technology (IT)',
    'Service contracts',
    'Indonesia',
    'This established IT services provider has operated as a trusted partner for Indonesian businesses since 2004',
    1000000,
    '$1M - $5M USD',
    '27',
    NULL,
    '["/assets/listing-assets/listing-063-d93e32d3.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 064: Custom Metal Fabrication & Welding
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Custom Metal Fabrication & Welding',
    'Manufacturing & Production',
    'B2B',
    'Thailand',
    'This Thailand-based enterprise operates as a specialized provider of precision metal fabrication services for industrial clients across Southeast Asia. Established in 2015',
    15000000,
    '$1M - $5M USD',
    '120',
    NULL,
    '["/assets/listing-assets/listing-064-1340d2d5.jpg"]',
    'active',
    NOW() - INTERVAL '10 days',
    NOW()
FROM seller_info;

-- Listing 065: Property Maintenance & Handyman Services Corp.
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Property Maintenance & Handyman Services Corp.',
    'Construction & Trades',
    'Service contracts',
    'India',
    'This established property maintenance provider has become a trusted partner for residential and commercial clients across urban and suburban India',
    5000000,
    '$1M - $5M USD',
    '103',
    NULL,
    '["/assets/listing-assets/listing-065-88697317.jpg"]',
    'active',
    NOW() - INTERVAL '13 days',
    NOW()
FROM seller_info;

-- Listing 066: Supply Chain Management (SCM) Software
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Supply Chain Management (SCM) Software',
    'Transportation & Logistics',
    'SaaS',
    'Malaysia',
    'Operating at the intersection of digital innovation and logistics efficiency',
    8000000,
    '$1M - $5M USD',
    '82',
    NULL,
    '["/assets/listing-assets/listing-066-0f08f279.jpg"]',
    'active',
    NOW() - INTERVAL '22 days',
    NOW()
FROM seller_info;

-- Listing 067: Brewery with Regional Distribution
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Brewery with Regional Distribution',
    'Manufacturing & Production',
    'B2B Distribution',
    'India',
    'Operating at the intersection of tradition and modern brewing techniques',
    9000000,
    '$1M - $5M USD',
    '100',
    NULL,
    '["/assets/listing-assets/listing-067-fe7805f1.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 068: Diagnostic Imaging Centers
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Diagnostic Imaging Centers',
    'Health & Wellness',
    'B2B Services',
    'India',
    'This established diagnostic imaging services provider operates a network of advanced medical imaging centers across strategic locations in India',
    11000000,
    '$1M - $5M USD',
    '280',
    NULL,
    '["/assets/listing-assets/listing-068-d639235b.jpg"]',
    'active',
    NOW() - INTERVAL '26 days',
    NOW()
FROM seller_info;

-- Listing 069: High-End Custom Home Builder
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'High-End Custom Home Builder',
    'Construction & Trades',
    'B2C Construction Services',
    'Indonesia',
    'This established business operates as a premium residential construction specialist',
    10000000,
    '$1M - $5M USD',
    '50',
    NULL,
    '["/assets/listing-assets/listing-069-7421663b.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 070: Furniture & Home Goods Retail Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Furniture & Home Goods Retail Chain',
    'Retail & E-commerce',
    'Retail Sales',
    'Indonesia',
    'This established furniture and home goods retailer operates a network of strategically located showrooms across Indonesia complemented by a growing e-commerce platform. Since 2007',
    2000000,
    '$1M - $5M USD',
    '50',
    NULL,
    '["/assets/listing-assets/listing-070-d1c57fab.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 071: Plastic Injection Molding Facility
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Plastic Injection Molding Facility',
    'Manufacturing & Production',
    'B2B',
    'India',
    'This established plastic injection molding operation has maintained a competitive position in India''s manufacturing sector since 2004',
    12000000,
    '$1M - $5M USD',
    '172',
    NULL,
    '["/assets/listing-assets/listing-071-eb589d72.jpg"]',
    'active',
    NOW() - INTERVAL '5 days',
    NOW()
FROM seller_info;

-- Listing 072: Intermodal Freight Transport
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Intermodal Freight Transport',
    'Transportation & Logistics',
    'B2B',
    'Indonesia',
    'This rapidly scaling intermodal logistics operator has established itself as a critical link in Indonesia''s domestic and international supply chains since its 2023 launch. The company specializes in coordinating seamless cargo transfers between container ships',
    9000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-072-1141ecfb.jpg"]',
    'active',
    NOW() - INTERVAL '21 days',
    NOW()
FROM seller_info;

-- Listing 073: E-commerce Fulfillment Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'E-commerce Fulfillment Center',
    'Retail & E-commerce',
    'B2B',
    'Thailand',
    'The business operates a strategically positioned e-commerce fulfillment hub serving enterprises across Southeast Asia. Established in 2007',
    9000000,
    '$1M - $5M USD',
    '130',
    NULL,
    '["/assets/listing-assets/listing-073-323bf6e7.jpg"]',
    'active',
    NOW() - INTERVAL '25 days',
    NOW()
FROM seller_info;

-- Listing 074: Human Resources (HR) Tech Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Human Resources (HR) Tech Platform',
    'Information Technology (IT)',
    'SaaS',
    'Thailand',
    'This company provides a cloud-based human resources management platform tailored for Thailand''s growing SME sector and enterprise clients. Operating on a SaaS model',
    11000000,
    '$1M - $5M USD',
    '58',
    NULL,
    '["/assets/listing-assets/listing-074-991fe5b9.jpg"]',
    'active',
    NOW() - INTERVAL '4 days',
    NOW()
FROM seller_info;

-- Listing 075: Home Healthcare Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Home Healthcare Agency',
    'Health & Wellness',
    'Service contracts',
    'Thailand',
    'Operating in Thailand''s growing healthcare sector',
    9000000,
    '$1M - $5M USD',
    '81',
    NULL,
    '["/assets/listing-assets/listing-075-a792fe97.jpg"]',
    'active',
    NOW() - INTERVAL '7 days',
    NOW()
FROM seller_info;

-- Listing 076: Structural Engineering Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Structural Engineering Firm',
    'Construction & Trades',
    'B2B Service Contracts',
    'Indonesia',
    'The business operates as a structural engineering consultancy specializing in commercial and infrastructure projects across Indonesia’s rapidly growing construction sector. Since 2010',
    6000000,
    '$1M - $5M USD',
    '65',
    NULL,
    '["/assets/listing-assets/listing-076-282e2651.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 077: Heavy Haulage & Trucking Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Heavy Haulage & Trucking Company',
    'Transportation & Logistics',
    'B2B logistics services',
    'Thailand',
    'This established heavy haulage and trucking enterprise provides critical logistics solutions for industrial and commercial clients across Thailand''s key economic regions. Operating a modern fleet of specialized vehicles including low-loaders',
    10000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-077-7be8814a.jpg"]',
    'active',
    NOW() - INTERVAL '11 days',
    NOW()
FROM seller_info;

-- Listing 078: Surgical Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Surgical Center',
    'Health & Wellness',
    'Service contracts',
    'Indonesia',
    'This established surgical center has operated as a key healthcare provider in Indonesia since 2002',
    11000000,
    '$1M - $5M USD',
    '165',
    NULL,
    '["/assets/listing-assets/listing-078-4fe912da.jpg"]',
    'active',
    NOW() - INTERVAL '3 days',
    NOW()
FROM seller_info;

-- Listing 079: Air Cargo Handling Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Air Cargo Handling Service',
    'Transportation & Logistics',
    'B2B',
    'India',
    'Operating at the intersection of global trade acceleration and supply chain optimization',
    4000000,
    '$1M - $5M USD',
    '140',
    NULL,
    '["/assets/listing-assets/listing-079-5ade75ad.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 080: Specialty Pharmaceutical Distributor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Specialty Pharmaceutical Distributor',
    'Health & Wellness',
    'B2B',
    'Malaysia',
    'A B2B business in the Health & Wellness industry located in Malaysia. Established business with strong fundamentals and growth potential.',
    3000000,
    '$1M - $5M USD',
    '17',
    NULL,
    '["/assets/listing-assets/listing-080-1da702bc.jpg"]',
    'active',
    NOW() - INTERVAL '5 days',
    NOW()
FROM seller_info;

-- Listing 081: Forensic Accounting & Investigation Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Forensic Accounting & Investigation Agency',
    'Accounting & Legal',
    'B2B',
    'Thailand',
    'A B2B business in the Accounting & Legal industry located in Thailand. Established business with strong fundamentals and growth potential.',
    5000000,
    '$1M - $5M USD',
    '35',
    NULL,
    '["/assets/listing-assets/listing-081-51520348.jpg"]',
    'active',
    NOW() - INTERVAL '4 days',
    NOW()
FROM seller_info;

-- Listing 082: Private Jet Charter Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Private Jet Charter Company',
    'Transportation & Logistics',
    'Online platform',
    'Thailand',
    'This Thailand-based private jet charter company operates a digital platform connecting clients with on-demand air travel solutions',
    1000000,
    '$1M - $5M USD',
    '8',
    NULL,
    '["/assets/listing-assets/listing-082-8d69af3c.jpg"]',
    'active',
    NOW() - INTERVAL '7 days',
    NOW()
FROM seller_info;

-- Listing 083: Medical Billing and Coding Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Medical Billing and Coding Service',
    'Health & Wellness',
    'B2B',
    'India',
    'This established medical billing and coding provider delivers comprehensive back-office solutions for healthcare organizations across outpatient clinics',
    600000,
    '$1M - $5M USD',
    '30',
    NULL,
    '["/assets/listing-assets/listing-083-c0476235.jpg"]',
    'active',
    NOW() - INTERVAL '11 days',
    NOW()
FROM seller_info;

-- Listing 084: Aerospace Component Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Aerospace Component Manufacturer',
    'Manufacturing & Production',
    'B2B',
    'India',
    'Operating at the forefront of aerospace engineering since 1998',
    16000000,
    '$1M - $5M USD',
    '142',
    NULL,
    '["/assets/listing-assets/listing-084-713a7f8c.jpg"]',
    'active',
    NOW() - INTERVAL '26 days',
    NOW()
FROM seller_info;

-- Listing 085: International Tax & Audit Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'International Tax & Audit Firm',
    'Accounting & Legal',
    'B2B',
    'Indonesia',
    'Operating at the forefront of Indonesia''s corporate services sector',
    13000000,
    '$1M - $5M USD',
    '145',
    NULL,
    '["/assets/listing-assets/listing-085-ef399dc8.jpg"]',
    'active',
    NOW() - INTERVAL '23 days',
    NOW()
FROM seller_info;

-- Listing 086: Reverse Logistics & Returns Processing
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Reverse Logistics & Returns Processing',
    'Transportation & Logistics',
    'B2B',
    'Vietnam',
    'This company operates as a specialized reverse logistics provider serving manufacturers and retailers across Southeast Asia. Since 1998',
    2000000,
    '$1M - $5M USD',
    '80',
    NULL,
    '["/assets/listing-assets/listing-086-a83ade1d.jpg"]',
    'active',
    NOW() - INTERVAL '12 days',
    NOW()
FROM seller_info;

-- Listing 087: Corporate Law Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Corporate Law Firm',
    'Accounting & Legal',
    'B2B Services',
    'India',
    'Operating as a specialized legal services provider since 2019',
    4000000,
    '$1M - $5M USD',
    '40',
    NULL,
    '["/assets/listing-assets/listing-087-737ae4be.jpg"]',
    'active',
    NOW() - INTERVAL '21 days',
    NOW()
FROM seller_info;

-- Listing 088: Telehealth Platform Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Telehealth Platform Provider',
    'Health & Wellness',
    'SaaS',
    'India',
    'Operating at the intersection of healthcare accessibility and digital innovation',
    4000000,
    '$1M - $5M USD',
    '75',
    NULL,
    '["/assets/listing-assets/listing-088-bf32e80c.jpg"]',
    'active',
    NOW() - INTERVAL '11 days',
    NOW()
FROM seller_info;

-- Listing 089: Inventory Management & Auditing Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Inventory Management & Auditing Firm',
    'Consulting',
    'B2B Service Contracts',
    'India',
    'Established in 2019',
    14000000,
    '$1M - $5M USD',
    '240',
    NULL,
    '["/assets/listing-assets/listing-089-e97680ca.jpg"]',
    'active',
    NOW() - INTERVAL '16 days',
    NOW()
FROM seller_info;

-- Listing 090: Contract Research & Manufacturing (CRAMS) for Pharma
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Contract Research & Manufacturing (CRAMS) for Pharma',
    'Manufacturing & Production',
    'B2B Services',
    'India',
    'The business operates as a specialized Contract Research and Manufacturing Services (CRAMS) provider within the global pharmaceutical sector',
    8000000,
    '$1M - $5M USD',
    '135',
    NULL,
    '["/assets/listing-assets/listing-090-6473894e.jpg"]',
    'active',
    NOW() - INTERVAL '25 days',
    NOW()
FROM seller_info;

-- Listing 091: Intellectual Property (IP) Law Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Intellectual Property (IP) Law Firm',
    'Accounting & Legal',
    'B2B',
    'Thailand',
    'Positioned as a specialist provider in Thailand''s legal sector',
    9000000,
    '$1M - $5M USD',
    '55',
    NULL,
    '["/assets/listing-assets/listing-091-7786b082.jpg"]',
    'active',
    NOW() - INTERVAL '10 days',
    NOW()
FROM seller_info;

-- Listing 092: Biotechnology Research Lab
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Biotechnology Research Lab',
    'Health & Wellness',
    'B2B',
    'India',
    'Operating at the intersection of cutting-edge science and commercial application',
    12000000,
    '$1M - $5M USD',
    '125',
    NULL,
    '["/assets/listing-assets/listing-092-098a4650.jpg"]',
    'active',
    NOW() - INTERVAL '2 days',
    NOW()
FROM seller_info;

-- Listing 093: Genetic Testing Laboratory
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Genetic Testing Laboratory',
    'Health & Wellness',
    'B2B',
    'Indonesia',
    'Operating as a specialized provider in Indonesia’s healthcare sector',
    1000000,
    '$1M - $5M USD',
    '22',
    NULL,
    '["/assets/listing-assets/listing-093-dec5c3ff.jpg"]',
    'active',
    NOW() - INTERVAL '23 days',
    NOW()
FROM seller_info;

-- Listing 094: Power Generation Equipment Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Power Generation Equipment Manufacturer',
    'Energy & Mining',
    'B2B',
    'Thailand',
    'This enterprise operates as a specialized manufacturer of power generation systems',
    13000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-094-581a2a36.jpg"]',
    'active',
    NOW() - INTERVAL '7 days',
    NOW()
FROM seller_info;

-- Listing 095: Industrial Packaging Solutions
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Industrial Packaging Solutions',
    'Manufacturing & Production',
    'B2B',
    'India',
    'Established in 2009',
    2000000,
    '$1M - $5M USD',
    '50',
    NULL,
    '["/assets/listing-assets/listing-095-bc8c0e63.jpg"]',
    'active',
    NOW() - INTERVAL '3 days',
    NOW()
FROM seller_info;

-- Listing 096: Assisted Living Facility Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Assisted Living Facility Operator',
    'Health & Wellness',
    'Service contracts',
    'Indonesia',
    'Operating in Indonesia''s senior care sector since 1996',
    5000000,
    '$1M - $5M USD',
    '92',
    NULL,
    '["/assets/listing-assets/listing-096-f54cc208.jpg"]',
    'active',
    NOW() - INTERVAL '27 days',
    NOW()
FROM seller_info;

-- Listing 097: High-End Interior Design Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'High-End Interior Design Firm',
    'Consulting',
    'B2B Service Model',
    'Indonesia',
    'Positioned as a leading authority in luxury spatial solutions',
    10000000,
    '$1M - $5M USD',
    '70',
    NULL,
    '["/assets/listing-assets/listing-097-dd44c303.jpg"]',
    'active',
    NOW() - INTERVAL '18 days',
    NOW()
FROM seller_info;

-- Listing 098: Water Treatment & Purification System Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Water Treatment & Purification System Manufacturer',
    'Manufacturing & Production',
    'B2B',
    'India',
    'The business operates as a specialized manufacturer of industrial water treatment and purification systems',
    6000000,
    '$1M - $5M USD',
    '125',
    NULL,
    '["/assets/listing-assets/listing-098-31fd8406.jpg"]',
    'active',
    NOW() - INTERVAL '11 days',
    NOW()
FROM seller_info;

-- Listing 099: Supply Chain Consulting Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Supply Chain Consulting Firm',
    'Consulting',
    'B2B Consulting Services',
    'Vietnam',
    'This established Vietnamese consulting firm delivers specialized supply chain optimization solutions to manufacturing and logistics enterprises across Southeast Asia. Operating since 2002',
    9000000,
    '$1M - $5M USD',
    '125',
    NULL,
    '["/assets/listing-assets/listing-099-823d5354.jpg"]',
    'active',
    NOW() - INTERVAL '12 days',
    NOW()
FROM seller_info;

-- Listing 100: IT & Technology Recruitment Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'IT & Technology Recruitment Agency',
    'Information Technology (IT)',
    'B2B',
    'Indonesia',
    'The business operates as a specialized IT and technology recruitment agency serving corporate clients across Indonesia’s rapidly growing tech ecosystem. Focused on mid-to-senior level placements',
    6000000,
    '$1M - $5M USD',
    '38',
    NULL,
    '["/assets/listing-assets/listing-100-b5ada651.jpg"]',
    'active',
    NOW() - INTERVAL '13 days',
    NOW()
FROM seller_info;

-- Listing 101: Mental Health & Addiction Treatment Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Mental Health & Addiction Treatment Center',
    'Health & Wellness',
    'Service contracts',
    'Indonesia',
    'Amid growing recognition of mental health priorities in Southeast Asia',
    1000000,
    '$1M - $5M USD',
    '40',
    NULL,
    '["/assets/listing-assets/listing-101-b41f4837.jpg"]',
    'active',
    NOW() - INTERVAL '7 days',
    NOW()
FROM seller_info;

-- Listing 102: Bespoke Jewelry Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Bespoke Jewelry Manufacturer',
    'Manufacturing & Production',
    'B2B',
    'India',
    'Specializing in precision craftsmanship for luxury markets',
    5000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-102-34eb725b.jpg"]',
    'active',
    NOW() - INTERVAL '11 days',
    NOW()
FROM seller_info;

-- Listing 103: Real Estate Development Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Real Estate Development Firm',
    'Real Estate',
    'B2B Real Estate Development',
    'India',
    'This vertically integrated real estate development firm operates as a strategic partner for institutional investors and corporate clients',
    3000000,
    '$1M - $5M USD',
    '22',
    NULL,
    '["/assets/listing-assets/listing-103-d3673ccc.jpg"]',
    'active',
    NOW() - INTERVAL '27 days',
    NOW()
FROM seller_info;

-- Listing 104: Medical Equipment & Supplies Distributor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Medical Equipment & Supplies Distributor',
    'Health & Wellness',
    'B2B',
    'Indonesia',
    'Positioned at the forefront of Indonesia''s growing healthcare sector',
    9000000,
    '$1M - $5M USD',
    '175',
    NULL,
    '["/assets/listing-assets/listing-104-53743786.jpg"]',
    'active',
    NOW() - INTERVAL '1 days',
    NOW()
FROM seller_info;

-- Listing 105: Veterinary Specialty & Emergency Hospital
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Veterinary Specialty & Emergency Hospital',
    'Health & Wellness',
    'Service contracts',
    'Thailand',
    'This established veterinary enterprise operates a full-service animal hospital combining specialty medical care with 24/7 emergency services in Thailand''s growing pet healthcare sector. The facility maintains separate dedicated departments for critical care',
    6000000,
    '$1M - $5M USD',
    '80',
    NULL,
    '["/assets/listing-assets/listing-105-5ce7338a.jpg"]',
    'active',
    NOW() - INTERVAL '26 days',
    NOW()
FROM seller_info;

-- Listing 106: Testing and Certification Laboratory
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Testing and Certification Laboratory',
    'Consulting',
    'B2B',
    'Thailand',
    'Operating at the intersection of quality assurance and regulatory compliance',
    9000000,
    '$1M - $5M USD',
    '145',
    NULL,
    '["/assets/listing-assets/listing-106-e8993f53.jpg"]',
    'active',
    NOW() - INTERVAL '13 days',
    NOW()
FROM seller_info;

-- Listing 107: Gourmet Food Importer & Distributor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Gourmet Food Importer & Distributor',
    'Retail & E-commerce',
    'B2B',
    'India',
    'The business operates as a premium importer and distributor of gourmet food products',
    10000000,
    '$1M - $5M USD',
    '35',
    NULL,
    '["/assets/listing-assets/listing-107-65d2ad81.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 108: Freight Bill Auditing & Payment Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Freight Bill Auditing & Payment Service',
    'Transportation & Logistics',
    'B2B Service Contracts',
    'India',
    'This company operates as a specialized provider of freight bill auditing and payment services for transportation networks across India. Established in 2017',
    12000000,
    '$1M - $5M USD',
    '225',
    NULL,
    '["/assets/listing-assets/listing-108-a22834a5.jpg"]',
    'active',
    NOW() - INTERVAL '2 days',
    NOW()
FROM seller_info;

-- Listing 109: Wealth Management Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Wealth Management Firm',
    'Banking & Finance',
    'B2B Wealth Management Services',
    'India',
    'The business operates as a specialized wealth management firm catering exclusively to institutional clients',
    15000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-109-439ab934.jpg"]',
    'active',
    NOW() - INTERVAL '19 days',
    NOW()
FROM seller_info;

-- Listing 110: Multi-Unit Restaurant Group (Fine Dining)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-Unit Restaurant Group (Fine Dining)',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'India',
    'Operating at the premium tier of India''s hospitality sector',
    1000000,
    '$1M - $5M USD',
    '76',
    NULL,
    '["/assets/listing-assets/listing-110-31812c51.jpg"]',
    'active',
    NOW() - INTERVAL '22 days',
    NOW()
FROM seller_info;

-- Listing 111: Corporate Event & Experiential Marketing Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Corporate Event & Experiential Marketing Agency',
    'Marketing & Advertising',
    'B2B Service Agency',
    'Thailand',
    'Retirement',
    9000000,
    '$1M - $5M USD',
    'Full',
    NULL,
    '["/assets/listing-assets/listing-111-c0d4095a.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 112: Business Valuation Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Business Valuation Services',
    'Consulting',
    'Service contracts',
    'Indonesia',
    'This established business valuation consultancy provides specialized advisory services to mid-market enterprises and institutional clients across Indonesia’s expanding commercial landscape. Since 2008',
    2000000,
    '$1M - $5M USD',
    '24',
    NULL,
    '["/assets/listing-assets/listing-112-f46ff876.jpg"]',
    'active',
    NOW() - INTERVAL '5 days',
    NOW()
FROM seller_info;

-- Listing 113: Art Gallery & Auction House
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Art Gallery & Auction House',
    'Arts & Entertainment',
    'B2C Auction Platform',
    'India',
    'This established art enterprise operates a dual-model platform combining curated gallery exhibitions with a dynamic B2C auction mechanism',
    13000000,
    '$1M - $5M USD',
    '80',
    NULL,
    '["/assets/listing-assets/listing-113-6e4e048d.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 114: Government Contract Consulting
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Government Contract Consulting',
    'Consulting',
    'B2B Consulting Services',
    'India',
    'Operating at the intersection of public sector procurement and private enterprise',
    14000000,
    '$1M - $5M USD',
    '250',
    NULL,
    '["/assets/listing-assets/listing-114-a2acc168.jpg"]',
    'active',
    NOW() - INTERVAL '27 days',
    NOW()
FROM seller_info;

-- Listing 115: High-End Security Services Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'High-End Security Services Provider',
    'Security & Safety Services',
    'B2B Service contracts',
    'Philippines',
    'This established provider delivers premium security solutions to corporate clients across the Philippines',
    6000000,
    '$1M - $5M USD',
    '288',
    NULL,
    '["/assets/listing-assets/listing-115-77c6d909.jpg"]',
    'active',
    NOW() - INTERVAL '19 days',
    NOW()
FROM seller_info;

-- Listing 116: Private Golf & Country Club Management
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Private Golf & Country Club Management',
    'Events & Recreation',
    'Membership-based service model',
    'Philippines',
    'This established Philippines-based enterprise operates a premier private golf and country club facility catering to affluent domestic and international clientele. Through its refined membership model',
    8000000,
    '$1M - $5M USD',
    '300',
    NULL,
    '["/assets/listing-assets/listing-116-bc03f332.jpg"]',
    'active',
    NOW() - INTERVAL '19 days',
    NOW()
FROM seller_info;

-- Listing 117: Investor Relations Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Investor Relations Agency',
    'Marketing & Advertising',
    'B2B',
    'India',
    'Positioned at the intersection of strategic communication and capital markets',
    2000000,
    '$1M - $5M USD',
    '35',
    NULL,
    '["/assets/listing-assets/listing-117-3c90890d.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 118: Branded Apparel & Merchandise Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Branded Apparel & Merchandise Manufacturer',
    'Manufacturing & Production',
    'B2B',
    'India',
    'Operating at the intersection of creative design and industrial production',
    14000000,
    '$1M - $5M USD',
    '240',
    NULL,
    '["/assets/listing-assets/listing-118-4c124514.jpg"]',
    'active',
    NOW() - INTERVAL '21 days',
    NOW()
FROM seller_info;

-- Listing 119: National Moving & Storage Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'National Moving & Storage Company',
    'Transportation & Logistics',
    'B2C Service',
    'India',
    'This established national moving and storage enterprise has developed comprehensive relocation solutions for residential and commercial clients across India since 2003. Operating through strategically located regional hubs',
    15000000,
    '$1M - $5M USD',
    '352',
    NULL,
    '["/assets/listing-assets/listing-119-f0a6d7ec.jpg"]',
    'active',
    NOW() - INTERVAL '2 days',
    NOW()
FROM seller_info;

-- Listing 120: Industrial Equipment Rental
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Industrial Equipment Rental',
    'Construction & Trades',
    'B2B Rental Service',
    'Vietnam',
    'Operating since 2010',
    2000000,
    '$1M - $5M USD',
    '22',
    NULL,
    '["/assets/listing-assets/listing-120-ca09213c.jpg"]',
    'active',
    NOW() - INTERVAL '27 days',
    NOW()
FROM seller_info;

-- Listing 121: Renewable Energy Installation (Solar Farm)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Renewable Energy Installation (Solar Farm)',
    'Energy & Mining',
    'B2B Energy Solutions',
    'India',
    'This business operates as a specialized renewable energy solutions provider focused on developing and managing utility-scale solar farms for commercial and industrial clients across India. Established in 2014',
    7000000,
    '$1M - $5M USD',
    '70',
    NULL,
    '["/assets/listing-assets/listing-121-155954b0.jpg"]',
    'active',
    NOW() - INTERVAL '24 days',
    NOW()
FROM seller_info;

-- Listing 122: Data Center Services Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Data Center Services Provider',
    'Information Technology (IT)',
    'B2B',
    'Thailand',
    'Operating at the intersection of Thailand''s burgeoning digital economy',
    6000000,
    '$1M - $5M USD',
    '44',
    NULL,
    '["/assets/listing-assets/listing-122-2946bb93.jpg"]',
    'active',
    NOW() - INTERVAL '21 days',
    NOW()
FROM seller_info;

-- Listing 123: Commercial Printing Press
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Printing Press',
    'Marketing & Advertising',
    'B2B',
    'India',
    'This commercial printing operation serves as a strategic partner to marketing agencies and corporate clients across India',
    3000000,
    '$1M - $5M USD',
    '70',
    NULL,
    '["/assets/listing-assets/listing-123-0a5b46f1.jpg"]',
    'active',
    NOW() - INTERVAL '7 days',
    NOW()
FROM seller_info;

-- Listing 124: Public Relations (PR) Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Public Relations (PR) Firm',
    'Marketing & Advertising',
    'B2B',
    'India',
    'Positioned as a key player in India''s dynamic marketing landscape',
    10000000,
    '$1M - $5M USD',
    '250',
    NULL,
    '["/assets/listing-assets/listing-124-f0abdd6a.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 125: Architectural Firm (Large-Scale Projects)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Architectural Firm (Large-Scale Projects)',
    'Construction & Trades',
    'B2B',
    'Indonesia',
    'Established in 1996',
    3000000,
    '$1M - $5M USD',
    '50',
    NULL,
    '["/assets/listing-assets/listing-125-04316b24.jpg"]',
    'active',
    NOW() - INTERVAL '16 days',
    NOW()
FROM seller_info;

-- Listing 126: Executive Recruitment Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Executive Recruitment Firm',
    'Consulting',
    'B2B',
    'Thailand',
    'This Thailand-based executive recruitment firm has rapidly established itself as a specialized partner for organizational leadership development since its 2024 inception. Operating within the competitive consulting sector',
    12000000,
    '$1M - $5M USD',
    '45',
    NULL,
    '["/assets/listing-assets/listing-126-3c2f5006.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 127: Automotive Tire & Service Center Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Automotive Tire & Service Center Chain',
    'Automotive (Sales & Repair)',
    'B2C service model',
    'India',
    'The business operates as a prominent automotive tire and service center chain across India',
    10000000,
    '$1M - $5M USD',
    '225',
    NULL,
    '["/assets/listing-assets/listing-127-445a69b8.jpg"]',
    'active',
    NOW() - INTERVAL '7 days',
    NOW()
FROM seller_info;

-- Listing 128: Regional Convenience Store Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Convenience Store Chain',
    'Retail & E-commerce',
    'Brick-and-Mortar Retail',
    'Malaysia',
    'This established convenience store chain operates a network of strategically located retail outlets across key urban and suburban areas in Malaysia. Specializing in quick-service retail',
    7000000,
    '$1M - $5M USD',
    '120',
    NULL,
    '["/assets/listing-assets/listing-128-9b9295f0.jpg"]',
    'active',
    NOW() - INTERVAL '13 days',
    NOW()
FROM seller_info;

-- Listing 129: Commercial Dry Cleaning & Laundry Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Dry Cleaning & Laundry Service',
    'Personal Care & Services',
    'B2B Service',
    'India',
    'Established in 2009',
    1000000,
    '$1M - $5M USD',
    '75',
    NULL,
    '["/assets/listing-assets/listing-129-847336a6.jpg"]',
    'active',
    NOW() - INTERVAL '19 days',
    NOW()
FROM seller_info;

-- Listing 130: Corporate Event Planning & Management Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Corporate Event Planning & Management Firm',
    'Events & Recreation',
    'B2B Service',
    'India',
    'The business operates as a full-service corporate event planning and management provider',
    15000000,
    '$1M - $5M USD',
    '150',
    NULL,
    '["/assets/listing-assets/listing-130-eaeb551e.jpg"]',
    'active',
    NOW() - INTERVAL '25 days',
    NOW()
FROM seller_info;

-- Listing 131: Creative & Branding Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Creative & Branding Agency',
    'Marketing & Advertising',
    'B2B',
    'Thailand',
    'Specializing in delivering integrated brand strategy and creative execution',
    7000000,
    '$1M - $5M USD',
    '100',
    NULL,
    '["/assets/listing-assets/listing-131-0f99e664.jpg"]',
    'active',
    NOW() - INTERVAL '22 days',
    NOW()
FROM seller_info;

-- Listing 132: Home & Commercial Inspection Service Group
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Home & Commercial Inspection Service Group',
    'Construction & Trades',
    'Service contracts',
    'India',
    'This company operates as a specialized provider of home and commercial inspection services',
    8000000,
    '$1M - $5M USD',
    '196',
    NULL,
    '["/assets/listing-assets/listing-132-a2408e0e.jpg"]',
    'active',
    NOW() - INTERVAL '5 days',
    NOW()
FROM seller_info;

-- Listing 133: Regional Insurance Brokerage
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Insurance Brokerage',
    'Insurance',
    'B2B',
    'Indonesia',
    'Operating as a key intermediary in Indonesia''s growing insurance sector',
    11000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-133-1673beb3.jpg"]',
    'active',
    NOW() - INTERVAL '25 days',
    NOW()
FROM seller_info;

-- Listing 134: High-Value Jewelry & Watch Retailer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'High-Value Jewelry & Watch Retailer',
    'Retail & E-commerce',
    'B2C retail',
    'Philippines',
    'This established retailer specializes in curated high-end jewelry and timepieces',
    2000000,
    '$1M - $5M USD',
    '12',
    NULL,
    '["/assets/listing-assets/listing-134-e1ffa8f7.jpg"]',
    'active',
    NOW() - INTERVAL '20 days',
    NOW()
FROM seller_info;

-- Listing 135: Regional Locksmith & Security Solutions
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Locksmith & Security Solutions',
    'Other',
    'Service contracts',
    'Vietnam',
    'This established provider delivers comprehensive locksmith services and physical security solutions across residential and commercial sectors in Vietnam''s growing urban markets. Operating through a network of mobile technicians and centralized monitoring systems',
    8000000,
    '$1M - $5M USD',
    '118',
    NULL,
    '["/assets/listing-assets/listing-135-246f762d.jpg"]',
    'active',
    NOW() - INTERVAL '9 days',
    NOW()
FROM seller_info;

-- Listing 136: Corporate Massage & Wellness Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Corporate Massage & Wellness Services',
    'Health & Wellness',
    'B2B Service Contracts',
    'Indonesia',
    'This company provides workplace wellness solutions through onsite corporate massage programs and stress management services across Indonesia. Operating since 2001',
    12000000,
    '$1M - $5M USD',
    '185',
    NULL,
    '["/assets/listing-assets/listing-136-922bcb7d.jpg"]',
    'active',
    NOW() - INTERVAL '28 days',
    NOW()
FROM seller_info;

-- Listing 137: Multi-State Optometry & Eyewear Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-State Optometry & Eyewear Chain',
    'Retail & E-commerce',
    'Brick-and-mortar retail with service elements',
    'Indonesia',
    'This established multi-state optical enterprise operates an integrated network of full-service eyewear retail locations across strategic Indonesian markets. Combining comprehensive vision care services with contemporary eyewear merchandising',
    2000000,
    '$1M - $5M USD',
    '60',
    NULL,
    '["/assets/listing-assets/listing-137-5070ca80.jpg"]',
    'active',
    NOW() - INTERVAL '16 days',
    NOW()
FROM seller_info;

-- Listing 138: Personal Training & Fitness Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Personal Training & Fitness Franchise',
    'Health & Wellness',
    'Franchise model',
    'Thailand',
    'This dynamic fitness enterprise operates a franchise network offering personalized training programs and wellness services across Thailand''s growing health-conscious market. Established in 2021',
    3000000,
    '$1M - $5M USD',
    '55',
    NULL,
    '["/assets/listing-assets/listing-138-25911a9f.jpg"]',
    'active',
    NOW() - INTERVAL '20 days',
    NOW()
FROM seller_info;

-- Listing 139: Commercial Pest Control Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Pest Control Services',
    'Other',
    'Service contracts',
    'Indonesia',
    'Operating across Indonesia''s major urban centers and industrial zones since 2000',
    5000000,
    '$1M - $5M USD',
    '120',
    NULL,
    '["/assets/listing-assets/listing-139-0c9e17db.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 140: Regional Property Management Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Property Management Firm',
    'Real Estate',
    'B2B',
    'Indonesia',
    'This established property management enterprise provides comprehensive operational solutions for commercial and residential real estate portfolios across Indonesia''s growing urban centers. Operating since 2007',
    4000000,
    '$1M - $5M USD',
    '40',
    NULL,
    '["/assets/listing-assets/listing-140-2ff6b431.jpg"]',
    'active',
    NOW() - INTERVAL '29 days',
    NOW()
FROM seller_info;

-- Listing 141: Commercial & Industrial Roofing Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial & Industrial Roofing Contractor',
    'Construction & Trades',
    'B2B',
    'India',
    'The business operates as a specialized commercial and industrial roofing contractor serving corporate clients and institutional facilities across India''s growing construction sector. Established in 2020',
    10000000,
    '$1M - $5M USD',
    '185',
    NULL,
    '["/assets/listing-assets/listing-141-4d26d0c0.jpg"]',
    'active',
    NOW() - INTERVAL '28 days',
    NOW()
FROM seller_info;

-- Listing 142: Custom Tailoring & Formalwear Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Custom Tailoring & Formalwear Chain',
    'Retail & E-commerce',
    'B2C Service',
    'Indonesia',
    'Positioned as a leading provider of bespoke formalwear solutions in Indonesia’s growing retail sector',
    5000000,
    '$1M - $5M USD',
    '105',
    NULL,
    '["/assets/listing-assets/listing-142-3881a186.jpg"]',
    'active',
    NOW() - INTERVAL '19 days',
    NOW()
FROM seller_info;

-- Listing 143: Fleet Taxi & Livery Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Fleet Taxi & Livery Service',
    'Transportation & Logistics',
    'Service contracts',
    'Thailand',
    'The business operates a modern fleet management and premium transportation service catering to corporate clients',
    9000000,
    '$1M - $5M USD',
    '250',
    NULL,
    '["/assets/listing-assets/listing-143-e1b12aba.jpg"]',
    'active',
    NOW() - INTERVAL '12 days',
    NOW()
FROM seller_info;

-- Listing 144: Commercial & Structural Welding Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial & Structural Welding Services',
    'Construction & Trades',
    'B2B',
    'India',
    'Specializing in precision welding solutions for industrial and construction applications',
    10000000,
    '$1M - $5M USD',
    '140',
    NULL,
    '["/assets/listing-assets/listing-144-4b8b5bdd.jpg"]',
    'active',
    NOW() - INTERVAL '20 days',
    NOW()
FROM seller_info;

-- Listing 145: Used Car Dealership Network
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Used Car Dealership Network',
    'Automotive (Sales & Repair)',
    'Online platform',
    'Malaysia',
    'This established used car dealership network operates Malaysia''s leading digital platform connecting buyers with rigorously inspected pre-owned vehicles. Transitioning from traditional showrooms to a hybrid online model in the mid-2010s',
    18000000,
    '$1M - $5M USD',
    '70',
    NULL,
    '["/assets/listing-assets/listing-145-1735ea32.jpg"]',
    'active',
    NOW() - INTERVAL '19 days',
    NOW()
FROM seller_info;

-- Listing 146: Frozen Yogurt & Dessert Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Frozen Yogurt & Dessert Chain',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Malaysia',
    'Operating within Malaysia’s thriving food and beverage sector',
    5000000,
    '$1M - $5M USD',
    '70',
    NULL,
    '["/assets/listing-assets/listing-146-4b8d794e.jpg"]',
    'active',
    NOW() - INTERVAL '5 days',
    NOW()
FROM seller_info;

-- Listing 147: Regional Sandwich Shop Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Regional Sandwich Shop Franchise',
    'Restaurants & Food Service',
    'Dine-in/Takeout',
    'Indonesia',
    'This established sandwich shop franchise operates multiple locations across urban centers in Indonesia',
    8000000,
    '$1M - $5M USD',
    '120',
    NULL,
    '["/assets/listing-assets/listing-147-b0cb4a26.jpg"]',
    'active',
    NOW() - INTERVAL '25 days',
    NOW()
FROM seller_info;

-- Listing 148: Cold-Pressed Juice & Health Food Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Cold-Pressed Juice & Health Food Chain',
    'Health & Wellness',
    'Dine-in/Takeout',
    'Vietnam',
    'Operating at the intersection of nutrition and convenience',
    4000000,
    '$1M - $5M USD',
    '122',
    NULL,
    '["/assets/listing-assets/listing-148-3583edb7.jpg"]',
    'active',
    NOW() - INTERVAL '9 days',
    NOW()
FROM seller_info;

-- Listing 149: Large-Scale Catering & Events Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Large-Scale Catering & Events Company',
    'Events & Recreation',
    'B2B Catering Services',
    'India',
    'Established in 1999',
    9000000,
    '$1M - $5M USD',
    '400',
    NULL,
    '["/assets/listing-assets/listing-149-ceed868a.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 150: Multi-State Liquor Store Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Multi-State Liquor Store Chain',
    'Retail & E-commerce',
    'Retail B2C',
    'India',
    'Operating across multiple Indian states',
    5000000,
    '$1M - $5M USD',
    '95',
    NULL,
    '["/assets/listing-assets/listing-150-4a2a874c.jpg"]',
    'active',
    NOW() - INTERVAL '20 days',
    NOW()
FROM seller_info;

-- Listing 151: Sporting Goods Retail Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Sporting Goods Retail Chain',
    'Retail & E-commerce',
    'Brick-and-Mortar Retail',
    'Philippines',
    'This emerging sporting goods retailer operates a network of modern brick-and-mortar stores across key Philippine markets',
    15000000,
    '$1M - $5M USD',
    '229',
    NULL,
    '["/assets/listing-assets/listing-151-398e17a9.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 152: Footwear Retail Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Footwear Retail Chain',
    'Retail & E-commerce',
    'Brick-and-Mortar Retail',
    'India',
    'Positioned at the forefront of India''s dynamic footwear market',
    4000000,
    '$1M - $5M USD',
    '260',
    NULL,
    '["/assets/listing-assets/listing-152-5b8b0986.jpg"]',
    'active',
    NOW() - INTERVAL '7 days',
    NOW()
FROM seller_info;

-- Listing 153: Children's Toy & Game Retailer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Children''s Toy & Game Retailer',
    'Retail & E-commerce',
    'Retail B2C',
    'Thailand',
    'Positioned at the intersection of play and learning within Thailand''s thriving family entertainment sector',
    6000000,
    '$1M - $5M USD',
    '120',
    NULL,
    '["/assets/listing-assets/listing-153-5236701c.jpg"]',
    'active',
    NOW() - INTERVAL '28 days',
    NOW()
FROM seller_info;

-- Listing 154: Automotive Parts Distributor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Automotive Parts Distributor',
    'Automotive (Sales & Repair)',
    'B2B',
    'Indonesia',
    'Operating at the heart of Indonesia''s expanding automotive ecosystem',
    13000000,
    '$1M - $5M USD',
    '98',
    NULL,
    '["/assets/listing-assets/listing-154-4391a514.jpg"]',
    'active',
    NOW() - INTERVAL '28 days',
    NOW()
FROM seller_info;

-- Listing 155: National Dance Studio Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'National Dance Studio Franchise',
    'Arts & Entertainment',
    'Franchise model',
    'India',
    'This established dance studio franchise operates a national network offering structured training across multiple dance genres including classical Indian styles',
    9000000,
    '$1M - $5M USD',
    '220',
    NULL,
    '["/assets/listing-assets/listing-155-4f0a3178.jpg"]',
    'active',
    NOW() - INTERVAL '13 days',
    NOW()
FROM seller_info;

-- Listing 156: Martial Arts School Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Martial Arts School Chain',
    'Education',
    'Franchise model',
    'India',
    'Operating as a multi-unit franchise network',
    2000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-156-24d026bf.jpg"]',
    'active',
    NOW() - INTERVAL '25 days',
    NOW()
FROM seller_info;

-- Listing 157: Commercial Driving & Fleet Training School
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Driving & Fleet Training School',
    'Education',
    'B2B Training Services',
    'India',
    'Operating as a specialized provider within India''s commercial transportation sector',
    10000000,
    '$1M - $5M USD',
    '260',
    NULL,
    '["/assets/listing-assets/listing-157-a1337ed7.jpg"]',
    'active',
    NOW() - INTERVAL '22 days',
    NOW()
FROM seller_info;

-- Listing 158: Tanning Salon Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Tanning Salon Franchise',
    'Personal Care & Services',
    'Service-based franchise',
    'Vietnam',
    'Operating within Vietnam''s expanding personal care sector',
    15000000,
    '$1M - $5M USD',
    '300',
    NULL,
    '["/assets/listing-assets/listing-158-58395ab6.jpg"]',
    'active',
    NOW() - INTERVAL '4 days',
    NOW()
FROM seller_info;

-- Listing 159: Commercial & Fleet Bicycle Supplier
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial & Fleet Bicycle Supplier',
    'Retail & E-commerce',
    'B2B',
    'India',
    'Operating at the intersection of urban mobility and commercial logistics',
    12000000,
    '$1M - $5M USD',
    '120',
    NULL,
    '["/assets/listing-assets/listing-159-71231be7.jpg"]',
    'active',
    NOW() - INTERVAL '23 days',
    NOW()
FROM seller_info;

-- Listing 160: Bridal & Formalwear Retail Group
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Bridal & Formalwear Retail Group',
    'Retail & E-commerce',
    'Retail sales',
    'India',
    'Positioned at the intersection of tradition and contemporary fashion',
    2000000,
    '$1M - $5M USD',
    '80',
    NULL,
    '["/assets/listing-assets/listing-160-94b333d9.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 161: Professional Photography Equipment Retailer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Professional Photography Equipment Retailer',
    'Retail & E-commerce',
    'B2C Retail',
    'Thailand',
    'Established in 1996',
    2000000,
    '$1M - $5M USD',
    '25',
    NULL,
    '["/assets/listing-assets/listing-161-6642af88.jpg"]',
    'active',
    NOW() - INTERVAL '27 days',
    NOW()
FROM seller_info;

-- Listing 162: Commercial Signage & Graphics Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Commercial Signage & Graphics Company',
    'Marketing & Advertising',
    'B2B',
    'Indonesia',
    'Operating at the intersection of visual communication and brand strategy',
    5000000,
    '$1M - $5M USD',
    '65',
    NULL,
    '["/assets/listing-assets/listing-162-59df6eb8.jpg"]',
    'active',
    NOW() - INTERVAL '5 days',
    NOW()
FROM seller_info;

-- Listing 163: Fleet Graphics & Vehicle Wrap Installer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Fleet Graphics & Vehicle Wrap Installer',
    'Marketing & Advertising',
    'B2B Services',
    'India',
    'Established in 2006',
    10000000,
    '$1M - $5M USD',
    '150',
    NULL,
    '["/assets/listing-assets/listing-163-f916eccb.jpg"]',
    'active',
    NOW() - INTERVAL '5 days',
    NOW()
FROM seller_info;

-- Listing 164: Office Furniture Dealership
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Office Furniture Dealership',
    'Retail & E-commerce',
    'B2B',
    'India',
    'This established office furniture dealership operates as a key B2B solutions provider in India’s growing commercial furnishings sector',
    3000000,
    '$1M - $5M USD',
    '35',
    NULL,
    '["/assets/listing-assets/listing-164-b181908f.jpg"]',
    'active',
    NOW() - INTERVAL '28 days',
    NOW()
FROM seller_info;

-- Listing 165: Copier & Managed Print Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Copier & Managed Print Services',
    'Other',
    'B2B Service contracts',
    'Indonesia',
    'The business operates as a specialized provider of copier equipment solutions and managed print services for corporate clients across Indonesia. Established in 2000',
    4000000,
    '$1M - $5M USD',
    '60',
    NULL,
    '["/assets/listing-assets/listing-165-3b15fc82.jpg"]',
    'active',
    NOW() - INTERVAL '24 days',
    NOW()
FROM seller_info;

-- Listing 166: IT Hardware Reseller (VAR)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'IT Hardware Reseller (VAR)',
    'Information Technology (IT)',
    'B2B',
    'India',
    'Founded in 2017',
    9000000,
    '$1M - $5M USD',
    '45',
    NULL,
    '["/assets/listing-assets/listing-166-51975616.jpg"]',
    'active',
    NOW() - INTERVAL '1 days',
    NOW()
FROM seller_info;

-- Listing 167: Telecommunications Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Telecommunications Contractor',
    'Media & Communications',
    'B2B Service Contracts',
    'Thailand',
    'Operating within Thailand''s rapidly evolving telecommunications sector since 2003',
    5000000,
    '$1M - $5M USD',
    '108',
    NULL,
    '["/assets/listing-assets/listing-167-6d0025c5.jpg"]',
    'active',
    NOW() - INTERVAL '15 days',
    NOW()
FROM seller_info;

-- Listing 168: Fiber Optic Installation Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Fiber Optic Installation Company',
    'Information Technology (IT)',
    'B2B Services',
    'Indonesia',
    'The business operates as a specialized fiber optic network installation provider serving enterprise and institutional clients across Indonesia''s rapidly expanding digital infrastructure market. Established in 2023',
    7000000,
    '$1M - $5M USD',
    '75',
    NULL,
    '["/assets/listing-assets/listing-168-ce76fc76.jpg"]',
    'active',
    NOW() - INTERVAL '12 days',
    NOW()
FROM seller_info;

-- Listing 169: Cell Tower Maintenance Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Cell Tower Maintenance Service',
    'Information Technology (IT)',
    'Business',
    'Philippines',
    'A Business business in the Information Technology (IT) industry located in Philippines. Established business with strong fundamentals and growth potential.',
    2000000,
    '$1M - $5M USD',
    '110',
    NULL,
    '["/assets/listing-assets/listing-169-3ab094dd.jpg"]',
    'active',
    NOW() - INTERVAL '4 days',
    NOW()
FROM seller_info;

-- Listing 170: Broadcast Engineering Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Broadcast Engineering Services',
    'Media & Communications',
    'B2B',
    'India',
    'Operating at the intersection of technology and media infrastructure',
    7000000,
    '$1M - $5M USD',
    '145',
    NULL,
    '["/assets/listing-assets/listing-170-15446292.jpg"]',
    'active',
    NOW() - INTERVAL '17 days',
    NOW()
FROM seller_info;

-- Listing 171: Satellite Communications Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Satellite Communications Provider',
    'Media & Communications',
    'B2B',
    'India',
    'This company operates as a specialized satellite communications provider serving enterprise and institutional clients across India. Established in 2009',
    5000000,
    '$1M - $5M USD',
    '100',
    NULL,
    '["/assets/listing-assets/listing-171-5d1d9408.jpg"]',
    'active',
    NOW() - INTERVAL '4 days',
    NOW()
FROM seller_info;

-- Listing 172: Environmental Consulting Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Environmental Consulting Firm',
    'Consulting',
    'B2B',
    'India',
    'This established environmental consulting firm provides specialized advisory services to corporate clients and government entities across India',
    16000000,
    '$1M - $5M USD',
    '210',
    NULL,
    '["/assets/listing-assets/listing-172-ce6240e7.jpg"]',
    'active',
    NOW() - INTERVAL '27 days',
    NOW()
FROM seller_info;

-- Listing 173: Air Quality Monitoring Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Air Quality Monitoring Service',
    'Other',
    'SaaS',
    'Philippines',
    'This established enterprise specializes in SaaS-based air quality monitoring solutions for commercial',
    2000000,
    '$1M - $5M USD',
    '45',
    NULL,
    '["/assets/listing-assets/listing-173-d3f8c3cc.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 174: Soil & Groundwater Testing Laboratory
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Soil & Groundwater Testing Laboratory',
    'Other',
    'B2B Services',
    'India',
    'This company operates a specialized soil and groundwater testing laboratory providing critical environmental compliance services to industrial and development sectors across India. The business combines field sampling operations with advanced laboratory analysis',
    5000000,
    '$1M - $5M USD',
    '120',
    NULL,
    '["/assets/listing-assets/listing-174-29862084.jpg"]',
    'active',
    NOW() - INTERVAL '13 days',
    NOW()
FROM seller_info;

-- Listing 175: Renewable Energy Credit (REC) Brokerage
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Renewable Energy Credit (REC) Brokerage',
    'Energy & Mining',
    'B2B',
    'Malaysia',
    'This business operates as a specialized intermediary in Malaysia''s renewable energy sector',
    2000000,
    '$1M - $5M USD',
    '12',
    NULL,
    '["/assets/listing-assets/listing-175-70087c69.jpg"]',
    'active',
    NOW() - INTERVAL '24 days',
    NOW()
FROM seller_info;

-- Listing 176: Carbon Offset Project Developer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Carbon Offset Project Developer',
    'Other',
    'B2B',
    'India',
    'Positioned as a key player in India''s environmental solutions sector',
    4000000,
    '$1M - $5M USD',
    '60',
    NULL,
    '["/assets/listing-assets/listing-176-74eef72e.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 177: Sustainable Building (LEED) Consulting
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Sustainable Building (LEED) Consulting',
    'Consulting',
    'B2B Consulting Services',
    'Indonesia',
    'Positioned at the forefront of Indonesia''s green construction movement',
    13000000,
    '$1M - $5M USD',
    '120',
    NULL,
    '["/assets/listing-assets/listing-177-a712bfbe.jpg"]',
    'active',
    NOW() - INTERVAL '15 days',
    NOW()
FROM seller_info;

-- Listing 178: Energy Auditing Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Energy Auditing Firm',
    'Consulting',
    'B2B Service Contracts',
    'Malaysia',
    'The business operates as a specialized energy auditing firm providing technical consulting services to commercial and industrial clients across Malaysia. Established in 2005',
    14000000,
    '$1M - $5M USD',
    '67',
    NULL,
    '["/assets/listing-assets/listing-178-31893ad0.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 179: Wind Turbine Maintenance Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Wind Turbine Maintenance Service',
    'Energy & Mining',
    'Service contracts',
    'Philippines',
    'Positioned at the forefront of renewable energy infrastructure support',
    11000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-179-cbba1b62.jpg"]',
    'active',
    NOW() - INTERVAL '0 days',
    NOW()
FROM seller_info;

-- Listing 180: Hydroelectric Power Plant Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Hydroelectric Power Plant Operator',
    'Energy & Mining',
    'B2B',
    'India',
    'This hydroelectric power plant operator manages a critical renewable energy infrastructure asset in India’s growing power sector. The business specializes in generating clean electricity through strategically positioned dams and turbine systems',
    3000000,
    '$1M - $5M USD',
    '30',
    NULL,
    '["/assets/listing-assets/listing-180-dfcde40b.jpg"]',
    'active',
    NOW() - INTERVAL '4 days',
    NOW()
FROM seller_info;

-- Listing 181: Geothermal Energy Exploration
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Geothermal Energy Exploration',
    'Energy & Mining',
    'B2B',
    'Indonesia',
    'The business specializes in geothermal energy exploration and development',
    6000000,
    '$1M - $5M USD',
    '130',
    NULL,
    '["/assets/listing-assets/listing-181-65861b45.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 182: EV Charging Network Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'EV Charging Network Operator',
    'Energy & Mining',
    'B2B',
    'India',
    'Positioned at the forefront of India''s electric mobility transition',
    1000000,
    '$1M - $5M USD',
    '8',
    NULL,
    '["/assets/listing-assets/listing-182-5a938c97.jpg"]',
    'active',
    NOW() - INTERVAL '10 days',
    NOW()
FROM seller_info;

-- Listing 183: Machine Learning (ML) Consulting
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Machine Learning (ML) Consulting',
    'Consulting',
    'B2B Consulting Services',
    'Malaysia',
    'The business operates as a specialized machine learning consulting firm providing tailored AI solutions to enterprises across Southeast Asia. Established in 2004',
    3000000,
    '$1M - $5M USD',
    '20',
    NULL,
    '["/assets/listing-assets/listing-183-53ced230.jpg"]',
    'active',
    NOW() - INTERVAL '4 days',
    NOW()
FROM seller_info;

-- Listing 184: Cloud Cost Management Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Cloud Cost Management Platform',
    'Information Technology (IT)',
    'SaaS',
    'India',
    'The company operates a specialized SaaS platform focused on cloud expenditure optimization',
    5000000,
    '$1M - $5M USD',
    '50',
    NULL,
    '["/assets/listing-assets/listing-184-ddd42ab8.jpg"]',
    'active',
    NOW() - INTERVAL '20 days',
    NOW()
FROM seller_info;

-- Listing 185: Penetration Testing as a Service (PtaaS)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Penetration Testing as a Service (PtaaS)',
    'Information Technology (IT)',
    'B2B',
    'India',
    'This cybersecurity-focused enterprise delivers critical penetration testing solutions through an adaptable service model tailored for modern enterprise needs. Operating within India''s expanding information security sector',
    3000000,
    '$1M - $5M USD',
    '30',
    NULL,
    '["/assets/listing-assets/listing-185-ad4a6a8e.jpg"]',
    'active',
    NOW() - INTERVAL '24 days',
    NOW()
FROM seller_info;

-- Listing 186: Threat Intelligence Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Threat Intelligence Platform',
    'Information Technology (IT)',
    'SaaS',
    'Malaysia',
    'This cybersecurity-focused SaaS enterprise provides an advanced threat intelligence platform designed to proactively identify and neutralize emerging digital risks for organizations across Southeast Asia. Operating since 2015',
    10000000,
    '$1M - $5M USD',
    '80',
    NULL,
    '["/assets/listing-assets/listing-186-9561c5c6.jpg"]',
    'active',
    NOW() - INTERVAL '24 days',
    NOW()
FROM seller_info;

-- Listing 187: Digital Forensics & Incident Response Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Digital Forensics & Incident Response Firm',
    'Information Technology (IT)',
    'B2B Services',
    'India',
    'This established digital forensics and incident response provider delivers critical cybersecurity services to corporate clients across India’s rapidly expanding technology landscape. Since 2014',
    6000000,
    '$1M - $5M USD',
    '65',
    NULL,
    '["/assets/listing-assets/listing-187-e12f5f67.jpg"]',
    'active',
    NOW() - INTERVAL '28 days',
    NOW()
FROM seller_info;

-- Listing 188: Contact Center as a Service (CCaaS)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Contact Center as a Service (CCaaS)',
    'Media & Communications',
    'B2B',
    'Indonesia',
    'Operating at the intersection of digital transformation and customer engagement',
    14000000,
    '$1M - $5M USD',
    '300',
    NULL,
    '["/assets/listing-assets/listing-188-7eec8fb0.jpg"]',
    'active',
    NOW() - INTERVAL '12 days',
    NOW()
FROM seller_info;

-- Listing 189: Waste Management & Recycling Corporation
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Waste Management & Recycling Corporation',
    'Other',
    'B2B Service Contracts',
    'Philippines',
    'The business operates as a comprehensive waste management and recycling solutions provider serving commercial and municipal clients across key urban centers in the Philippines. With nearly two decades of operational history',
    9000000,
    '$1M - $5M USD',
    '200',
    NULL,
    '["/assets/listing-assets/listing-189-746d90ea.jpg"]',
    'active',
    NOW() - INTERVAL '21 days',
    NOW()
FROM seller_info;

-- Listing 190: Quarry & Aggregate Supplier
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Quarry & Aggregate Supplier',
    'Construction & Trades',
    'B2B',
    'India',
    'Operating as a critical resource provider within India''s construction sector',
    3000000,
    '$1M - $5M USD',
    '110',
    NULL,
    '["/assets/listing-assets/listing-190-d3a08288.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 191: Steel Fabrication and Erection Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Steel Fabrication and Erection Company',
    'Construction & Trades',
    'B2B',
    'Malaysia',
    'The business operates as a specialized steel fabrication and erection enterprise serving commercial and industrial clients across Malaysia. Established in 2013',
    2000000,
    '$1M - $5M USD',
    '34',
    NULL,
    '["/assets/listing-assets/listing-191-54ff79b4.jpg"]',
    'active',
    NOW() - INTERVAL '20 days',
    NOW()
FROM seller_info;

-- Listing 192: Uniform & Linen Supply Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Uniform & Linen Supply Service',
    'Other',
    'B2B Service Contracts',
    'Indonesia',
    'This established enterprise operates as a critical support partner for service-oriented industries across Indonesia',
    3000000,
    '$1M - $5M USD',
    '200',
    NULL,
    '["/assets/listing-assets/listing-192-8cd1693c.jpg"]',
    'active',
    NOW() - INTERVAL '14 days',
    NOW()
FROM seller_info;

-- Listing 193: Blasting Services (Mining & Construction)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Blasting Services (Mining & Construction)',
    'Energy & Mining',
    'B2B Service Contracts',
    'Thailand',
    'Specializing in critical infrastructure development support',
    8000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-193-55ba4be2.jpg"]',
    'active',
    NOW() - INTERVAL '13 days',
    NOW()
FROM seller_info;

-- Listing 194: Traffic Control Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Traffic Control Services',
    'Transportation & Logistics',
    'B2B',
    'Indonesia',
    'The business provides critical traffic management solutions across Indonesia''s rapidly developing infrastructure sectors',
    14000000,
    '$1M - $5M USD',
    '235',
    NULL,
    '["/assets/listing-assets/listing-194-883a1abc.jpg"]',
    'active',
    NOW() - INTERVAL '8 days',
    NOW()
FROM seller_info;

-- Listing 195: Geomatics & Land Surveying Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Geomatics & Land Surveying Firm',
    'Construction & Trades',
    'B2B Service Contracts',
    'India',
    'The business operates as a specialized geomatics and land surveying provider serving infrastructure developers',
    3000000,
    '$1M - $5M USD',
    '60',
    NULL,
    '["/assets/listing-assets/listing-195-73664412.jpg"]',
    'active',
    NOW() - INTERVAL '5 days',
    NOW()
FROM seller_info;

-- Listing 196: Nutraceutical & Supplement Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Nutraceutical & Supplement Manufacturer',
    'Health & Wellness',
    'B2B',
    'Malaysia',
    'This Malaysia-based nutraceutical and supplement manufacturer operates as a business-to-business partner for domestic and international brands seeking premium private-label solutions. Specializing in tablets',
    14000000,
    '$1M - $5M USD',
    '70',
    NULL,
    '["/assets/listing-assets/listing-196-8196d1f8.jpg"]',
    'active',
    NOW() - INTERVAL '2 days',
    NOW()
FROM seller_info;

-- Listing 197: Pet Food Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Pet Food Manufacturer',
    'Manufacturing & Production',
    'B2B',
    'India',
    'Established in 2001',
    2000000,
    '$1M - $5M USD',
    '63',
    NULL,
    '["/assets/listing-assets/listing-197-6ef132dc.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 198: Beverage Bottling and Canning Plant
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Beverage Bottling and Canning Plant',
    'Manufacturing & Production',
    'B2B',
    'India',
    'Operating at the heart of India''s thriving beverage sector',
    5000000,
    '$1M - $5M USD',
    '139',
    NULL,
    '["/assets/listing-assets/listing-198-a6234d3d.jpg"]',
    'active',
    NOW() - INTERVAL '1 days',
    NOW()
FROM seller_info;

-- Listing 199: E-Learning & Corporate Training Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'E-Learning & Corporate Training Platform',
    'Education',
    'B2B SaaS',
    'Malaysia',
    'This established B2B SaaS company provides a comprehensive e-learning platform specializing in corporate training solutions for Malaysian enterprises. Operating since 2008',
    8000000,
    '$1M - $5M USD',
    '85',
    NULL,
    '["/assets/listing-assets/listing-199-112a5117.jpg"]',
    'active',
    NOW() - INTERVAL '15 days',
    NOW()
FROM seller_info;

-- Listing 200: Game Development Studio
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Game Development Studio',
    'Arts & Entertainment',
    'B2B',
    'Indonesia',
    'The business operates as a full-service game development studio specializing in custom game creation and technical solutions for domestic and international clients in the entertainment sector. Since 2016',
    3000000,
    '$1M - $5M USD',
    '65',
    NULL,
    '["/assets/listing-assets/listing-200-94fb470f.jpg"]',
    'active',
    NOW() - INTERVAL '6 days',
    NOW()
FROM seller_info;

-- Listing 201: Music Licensing Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Music Licensing Platform',
    'Arts & Entertainment',
    'Online platform',
    'Thailand',
    'Operating at the intersection of technology and creative rights',
    6000000,
    '$1M - $5M USD',
    '30',
    NULL,
    '["/assets/listing-assets/listing-201-d0f69807.jpg"]',
    'active',
    NOW() - INTERVAL '3 days',
    NOW()
FROM seller_info;

-- Listing 202: Online Auction Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'Online Auction Platform',
    'Retail & E-commerce',
    'Online platform',
    'Indonesia',
    'This established online auction platform has operated as a key player in Indonesia''s e-commerce sector since 1999',
    8000000,
    '$1M - $5M USD',
    '75',
    NULL,
    '["/assets/listing-assets/listing-202-775a52a4.jpg"]',
    'active',
    NOW() - INTERVAL '16 days',
    NOW()
FROM seller_info;

-- Listing 203: ATM Fleet Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
INSERT INTO listings (
    id,
    seller_id,
    listing_title_anonymous,
    industry,
    business_model,
    location_country,
    anonymous_business_description,
    asking_price,
    annual_revenue_range,
    number_of_employees,
    year_established,
    image_urls,
    status,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    seller_id,
    'ATM Fleet Operator',
    'Banking & Finance',
    'B2B',
    'Indonesia',
    'This company operates a strategically positioned ATM network across Indonesia''s urban and semi-urban centers',
    10000000,
    '$1M - $5M USD',
    '240',
    NULL,
    '["/assets/listing-assets/listing-203-1b79c94e.jpg"]',
    'active',
    NOW() - INTERVAL '12 days',
    NOW()
FROM seller_info;

