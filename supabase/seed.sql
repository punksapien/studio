-- ===================================================================
-- Nobridge Business Marketplace - Demo Data Seeding Script
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
-- 2. CREATE BUSINESS LISTINGS
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

-- Listing 2: Multi-Location Auto Service Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Multi-Location Auto Service Center Chain',
    'Automotive',
    'India',
    'Mumbai',
    'A profitable chain of automotive service centers specializing in comprehensive vehicle maintenance, repair, and inspection services. The business serves both individual consumers and fleet operators with consistent quality across all locations.',
    '["Multiple strategic locations", "Certified technician team", "Fleet service contracts", "Modern diagnostic equipment"]'::jsonb,
    '$8M - $10M USD',
    '25% - 30%',
    9000000.00,
    '["Asset Purchase", "Management Buyout"]'::jsonb,
    'Geographic relocation and portfolio diversification',
    'Multi-location automotive service franchise model',
    2012,
    'AutoCare Services Pvt Ltd',
    'Premium Auto Solutions',
    'https://www.premiumauto-services.com',
    'Instagram: @PremiumAutoSolutions, Twitter: @AutoServicesPro',
    '130 employees',
    8750000.00,
    2625000.00,
    2100000.00,
    'Moving internationally for family reasons and looking to divest from automotive sector to focus on tech investments.',
    '• Electric vehicle servicing capabilities
• Mobile repair service expansion
• Parts wholesale distribution channel
• Corporate fleet management software platform',
    'active',
    false,
    '["/assets/listing-2.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 3: Commercial Landscaping & Groundskeeping
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Landscaping & Groundskeeping Corp.',
    'Commercial Landscaping & Groundskeeping',
    'Indonesia',
    'Banjarmasin',
    'The business operates as a full-service commercial landscaping provider specializing in comprehensive grounds maintenance for corporate complexes, retail centers, and municipal facilities across the region.',
    '["Large contract portfolio", "Specialized equipment fleet", "Sustainable practices certification", "Year-round revenue stability"]'::jsonb,
    '$12M - $15M USD',
    '35% - 40%',
    13000000.00,
    '["Asset Purchase", "Share Purchase", "Management Buyout"]'::jsonb,
    'Partnership dissolution and business focus change',
    'Commercial B2B landscaping with recurring service contracts',
    2010,
    'GreenScape Commercial Solutions',
    'Professional Landscaping Corp',
    'https://www.greenscape-solutions.id',
    'Facebook: GreenScapeIndonesia, LinkedIn: @CommercialLandscaping',
    '175 employees',
    13500000.00,
    5400000.00,
    4700000.00,
    'Business partnership is dissolving amicably, and I prefer to focus on real estate development rather than continue in the landscaping industry.',
    '• Smart irrigation system installation services
• Organic lawn care product development
• Landscape design consultation division
• Municipal government contract expansion',
    'active',
    true,
    '["/assets/listing-3.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 4: Regional Coffee Roaster & Cafe Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Coffee Roaster & Cafe Chain',
    'Restaurants & Food Service',
    'Indonesia',
    'Surabaya',
    'Positioned as a key player in Indonesia''s thriving coffee culture, this vertically integrated operation combines small-batch coffee roasting with a growing chain of premium cafes, serving both wholesale and retail markets.',
    '["Vertically integrated operation", "Premium brand positioning", "Growing market presence", "Local sourcing relationships"]'::jsonb,
    '$1.5M - $2M USD',
    '20% - 25%',
    1000000.00,
    '["Asset Purchase", "Franchise Opportunity"]'::jsonb,
    'Health reasons and lifestyle change',
    'Vertically integrated coffee roasting and retail cafe operation',
    2015,
    'Archipelago Coffee Roasters',
    'Java Premium Coffee Co',
    'https://www.javapremium.co.id',
    'Instagram: @JavaPremiumCoffee, Facebook: ArchipelagoCoffeeRoasters',
    '85 employees',
    1750000.00,
    437500.00,
    320000.00,
    'Due to health challenges, I need to step back from the demanding day-to-day operations of managing a growing food service business.',
    '• Online coffee subscription service
• Corporate catering and office coffee services
• Coffee education and barista training center
• Export opportunities to neighboring countries',
    'active',
    false,
    '["/assets/listing-4.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 5: Mechanical & Plumbing Contractors
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Mechanical & Plumbing Contractors',
    'Construction & Trades',
    'Vietnam',
    'Ho Chi Minh City',
    'A well-established mechanical and plumbing contracting firm serving commercial and industrial clients across Vietnam. The company specializes in HVAC systems, industrial plumbing, and mechanical installations for large-scale projects.',
    '["Strong client relationships", "Experienced workforce", "Modern equipment fleet", "Quality certifications"]'::jsonb,
    '$9M - $11M USD',
    '28% - 32%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'International expansion requiring capital reallocation',
    'B2B mechanical and plumbing contracting services',
    2009,
    'Vietnam Mechanical Solutions Ltd',
    'Advanced Mechanical & Plumbing Co',
    'https://www.advancedmech.vn',
    'LinkedIn: @AdvancedMechanicalVN, Facebook: VietnamMechanical',
    '100 employees',
    10200000.00,
    3060000.00,
    2650000.00,
    'Expanding business interests into manufacturing sector and need to consolidate capital for larger industrial investments.',
    '• Green building certification services
• Preventive maintenance contract division
• Equipment manufacturing and distribution
• Regional expansion into Cambodia and Laos',
    'active',
    true,
    '["/assets/listing-5.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;


-- ===================================================================
-- ADDITIONAL LISTINGS FROM CSV DATA
-- ===================================================================
-- Generated by add-csv-listings.cjs
-- Images use existing downloaded files in public/assets/listing-assets/

-- Listing 6: Third-Party Logistics (3PL) Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Third-Party Logistics (3PL) Provider',
    'Other',
    'Indonesia',
    'Makassar',
    'Operating as a trusted partner in Indonesia''s logistics sector, this established third-party logistics provider delivers comprehensive supply chain solutions tailored to domestic and international enterprises. The business specializes in integrated warehousing, regional distribution, and customs brokerage services, supported by a network of strategically located fulfillment centers across major economic hubs. Core operations focus on optimizing inventory management through real-time tracking systems, coordinating cross-border transportation via established carrier partnerships, and providing value-added services including packaging customization and last-mile delivery coordination. With a team of 200 skilled professionals managing operations across 12 facilities, the company serves manufacturers, retailers, and e-commerce platforms through long-term service agreements that emphasize operational reliability. Strategic positioning within Southeast Asia''s fastest-growing economy prov...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B',
    2011,
    '"',
    'Third-Party Logistics (3PL) Provider Corp',
    NULL,
    '"',
    200,
    11323819.00,
    2491240.00,
    2491240.00,
    'Lifestyle Change. "',
    'Growth opportunity: Expansion of cross-docking facilities near major seaports to capture increasing transshipment demand. Expansion potential: Development of specialized cold chain solutions to capitalize on Indonesia''s growing pharmaceutical . Development area: Implementation of AI-driven route optimization to enhance fuel efficiency and delivery timelines acr',
    'active',
    true,
    '["/assets/listing-assets/listing-001-7bda5389.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 7: Regional Pizza Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Pizza Chain',
    'Other',
    'Vietnam',
    'Hanoi',
    'This established regional pizza chain has operated in Vietnam’s competitive food service sector since 2007, combining Western-style pizza offerings with localized flavors to cater to both expatriate and domestic customer segments. The business operates through 14 strategically located dine-in/takeout facilities across major urban centers, emphasizing quick service without compromising artisanal preparation standards. A core differentiator lies in its menu engineering – blending traditional Italian techniques with Vietnamese-inspired toppings like lemongrass-marinated pork and fish sauce-infused sauces – creating a distinct market position that balances novelty and accessibility. Daily operations leverage a hub-and-spoke kitchen model, with three centralized production kitchens supporting satellite locations to maintain ingredient consistency while minimizing waste. The company serves approximately 12,000 weekly customers through multiple channels: 55% walk-in traffic, 30% through de...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Dine-in/Takeout',
    2007,
    '"',
    'Regional Pizza Chain Corp',
    '"',
    '"',
    300,
    6243309.00,
    998929.00,
    1311094.00,
    'Wealth Diversification. "',
    'Growth opportunity: Implementation of AI-driven dynamic pricing model could optimize lunchtime promotions and reduce ing. Expansion potential: Development of frozen pizza line for retail distribution could leverage existing production capacity. Development area: Untapped potential in suburban expansion through compact express-style outlets targeting emerging mi',
    'active',
    true,
    '["/assets/listing-assets/listing-001-c3503e82.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 8: Cybersecurity Solutions Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Cybersecurity Solutions Provider',
    'Other',
    'Indonesia',
    'Medan',
    'Operating at the forefront of Indonesia''s digital security landscape since 2013, this enterprise has established itself as a critical infrastructure partner for organizations navigating complex cyber threats. The business delivers comprehensive protection through managed firewall services, intrusion detection systems, and tailored security protocol development, servicing mid-sized to large corporate clients across banking, telecommunications, and public sector verticals. A dedicated technical team of 85 cybersecurity specialists maintains 24/7 network monitoring operations from strategically located security operations centers, supported by advanced threat intelligence platforms that analyze regional attack patterns. The company''s value proposition centers on hybrid solutions combining proprietary security algorithms with localized compliance expertise critical for operating under Indonesia''s strict data sovereignty regulations. Market differentiation stems from its certification...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    11000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Service Contracts',
    2013,
    '"',
    'Cybersecurity Solutions Provider Corp',
    '"',
    '"',
    85,
    10806650.00,
    2593596.00,
    2593596.00,
    'Retirement. "',
    'Growth opportunity: Strategic partnerships with hyperscale cloud providers to develop Indonesia-specific security archit. Expansion potential: Expansion of managed detection and response (MDR) capabilities leveraging existing SOC infrastructur. Development area: Untapped potential in SME market through packaged security-as-a-service offerings for regional digit',
    'active',
    true,
    '["/assets/listing-assets/listing-002-173416fe.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 9: Commercial Real Estate Brokerage
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Real Estate Brokerage',
    'Real Estate & Property',
    'Indonesia',
    'Bandung',
    'Operating at the intersection of Indonesia''s dynamic commercial property market and institutional investment activity, this established brokerage facilitates high-value transactions across office, retail, and industrial asset classes. The firm delivers end-to-end advisory services spanning market analysis, portfolio optimization, lease negotiations, and disposition strategies for corporate clients, investment funds, and property developers. A vertically integrated operating model combines dedicated tenant representation teams with capital markets specialists, supported by proprietary databases tracking 18 major Indonesian markets. Strategic differentiation stems from deep relationships with REIT operators and multinational corporations establishing regional hubs, complemented by white-glove account management for repeat clients. The 15-member team combines multilingual negotiators with technical experts in zoning regulations and tax-efficient deal structuring. Current buyer appeal ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2019,
    '"',
    'Commercial Real Estate Brokerage Corp',
    '"',
    '"',
    15,
    1927163.00,
    346889.00,
    346889.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implementation of AI-driven client matching algorithms to enhance tenant-landlord pairing efficiency. Expansion potential: Geographic expansion through satellite offices in Surakarta and Medan leveraging infrastructure deve. Development area: Vertical specialization in emerging asset classes including cold storage facilities and data center',
    'active',
    true,
    '["/assets/listing-assets/listing-002-be552071.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 10: High-End Fitness Center & Health Club Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'High-End Fitness Center & Health Club Chain',
    'Other',
    'India',
    'Lucknow',
    'Established in 1998, this premium fitness enterprise operates multiple high-end health clubs across India''s metropolitan centers, combining luxury wellness facilities with scientifically-backed training methodologies. The business caters primarily to urban professionals and affluent clientele through tiered membership plans offering access to Olympic-grade equipment, specialized studios (yoga, Pilates, HIIT), and recovery amenities including hydrotherapy pools and cryotherapy chambers. A team of 150 certified trainers, nutritionists, and wellness consultants deliver personalized programming, complemented by proprietary member engagement systems that maintain industry-leading 89% annual retention rates. Strategic positioning in premium commercial real estate locations ensures visibility among target demographics while differentiating from budget competitors through concierge-level services like biometric tracking integration and exclusive partner spa access. The membership-based mod...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Membership-based service model',
    1998,
    '"',
    'High-End Fitness Center & Health Club Chain Corp',
    '"',
    '"',
    150,
    3234256.00,
    420453.00,
    420453.00,
    'Wealth Diversification. "',
    'Growth opportunity: Development of signature wellness tourism packages integrating regional Ayurvedic traditions with mo. Expansion potential: Expansion of corporate wellness partnerships through customized B2B programming for India''s growing . Development area: Implementation of AI-driven dynamic pricing models to optimize off-peak capacity utilization and mem',
    'active',
    true,
    '["/assets/listing-assets/listing-003-7cbb9574.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 11: Commercial Electrical Contractors
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Electrical Contractors',
    'Other',
    'Malaysia',
    'Kota Kinabalu',
    'The business operates as a commercial electrical contracting specialist providing comprehensive installation, maintenance, and project management services to corporate clients across Malaysia. With a focus on institutional facilities, retail complexes, and industrial parks, this company delivers end-to-end solutions including high-voltage system installations, energy efficiency retrofits, and 24/7 emergency repair services. Its operations are supported by a team of 70 NICET-certified technicians and project managers handling multiple concurrent contracts through a structured hub-and-spoke service model across three regional bases. The company maintains strategic partnerships with property management firms and construction conglomerates, securing recurring service agreements that account for 65% of annual engagements. Through ISO 9001-certified workflows and real-time project tracking systems, the business has established itself as a preferred vendor for complex electrical infrastruc...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Service Contracts',
    2006,
    '"',
    'Commercial Electrical Contractors Corp',
    '"',
    '"',
    70,
    6992524.00,
    978953.00,
    978953.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement augmented reality-assisted maintenance through 5G-enabled field technician tablets.. Expansion potential: Develop energy-as-a-service model leveraging Malaysia''s new building efficiency regulations.. Development area: Expand into adjacent mechanical/HVAC services using existing client relationships and shared project',
    'active',
    true,
    '["/assets/listing-assets/listing-004-a92c18d1.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 12: Restaurant Group (Casual Dining Chain)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Restaurant Group (Casual Dining Chain)',
    'Other',
    'India',
    'Hyderabad',
    'The business operates a well-established casual dining restaurant group with multiple locations across urban and suburban markets in India, serving a diverse menu of approachable, regionally inspired dishes through dine-in and takeout channels. Founded in 2012, the company has built its reputation on consistent food quality, efficient service turnaround, and strategically positioned outlets that cater to middle-class families, young professionals, and social diners seeking affordable yet satisfying meal experiences. Operational infrastructure includes centralized kitchen facilities supporting all locations, standardized recipe systems maintained by trained culinary staff, and a workforce of 35 employees managing front-of-house operations, logistics, and customer service. The company maintains competitive differentiation through its hybrid service model that balances traditional dine-in hospitality with modern convenience through takeout packaging optimized for home consumption and t...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Dine-in/Takeout',
    2012,
    '"',
    'Restaurant Group (Casual Dining Chain) Corp',
    '"',
    '"',
    35,
    549661.00,
    76952.00,
    61562.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Optimize delivery channel profitability by renegotiating third-party platform terms and implementing. Expansion potential: Enhance digital customer engagement through loyalty app development and targeted social media campai. Development area: Leverage underutilized daytime capacity through breakfast menu expansion and office lunch combo prom',
    'active',
    true,
    '["/assets/listing-assets/listing-006-c3503e82.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 13: Commercial General Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial General Contractor',
    'Other',
    'Indonesia',
    'Bandung',
    'Operating as a cornerstone of Indonesia''s construction sector, this established commercial general contractor delivers turnkey solutions for institutional clients and corporate enterprises. Since 2005, the business has cultivated expertise in managing complex projects including warehouse developments, retail complexes, and office tower renovations through its vertically integrated model combining design coordination, skilled labor management, and materials procurement. A team of 78 professionals maintains rigorous quality control protocols across three operational divisions: pre-construction planning, on-site engineering supervision, and post-completion facilities optimization. The company differentiates itself through a proprietary project management platform that enables real-time progress tracking for clients across multiple time zones, coupled with long-standing partnerships with tier-1 material suppliers ensuring consistent access to structural steel and premium concrete mixes...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2005,
    '"',
    'Commercial General Contractor Corp',
    '"',
    '"',
    78,
    4677821.00,
    561338.00,
    449000.00,
    'Retirement. "',
    'Growth opportunity: Leverage existing government approvals to establish regional satellite offices in emerging economic . Expansion potential: Implement drone-based site surveying and AI-powered progress analytics to enhance bid accuracy and m. Development area: Expand service offerings into modular construction and prefabricated building systems to capture Ind',
    'active',
    true,
    '["/assets/listing-assets/listing-007-1db96754.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 14: Multi-Location Auto Service Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Multi-Location Auto Service Center',
    'Other',
    'India',
    'Hyderabad',
    'This established automotive enterprise operates a network of service centers across multiple Indian cities, specializing in comprehensive vehicle maintenance and repair solutions. Established in 2001, the business has built its operations around service contracts that provide recurring maintenance packages for both individual vehicle owners and commercial fleets. Its core offerings encompass preventative maintenance, mechanical repairs, and OEM-compliant servicing across multiple vehicle categories including passenger cars, light commercial vehicles, and two-wheelers. The company maintains strategic partnerships with parts suppliers and utilizes standardized operational protocols across all locations, ensuring service consistency while allowing local managers flexibility in addressing regional market requirements. Operating through 128 full-time technicians and support staff trained in modular skill development programs, the organization serves a diversified client base of approxima...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Service contracts',
    2001,
    '"',
    'Multi-Location Auto Service Center Corp',
    '"',
    '"',
    128,
    3056301.00,
    641823.00,
    641823.00,
    'Wealth Diversification. "',
    'Growth opportunity: Develop mobile service units for corporate clients to increase contract value through on-site offeri. Expansion potential: Expand into electric vehicle service certifications to capture emerging market segment.. Development area: Implement digital customer portals for service tracking and preventive maintenance alerts to enhance',
    'active',
    true,
    '["/assets/listing-assets/listing-007-be552071.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 15: Janitorial Services & Facilities Management
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Janitorial Services & Facilities Management',
    'Other',
    'India',
    'Hyderabad',
    'This established business provides comprehensive janitorial services and integrated facilities management solutions to corporate clients across India. Operating since 2017, the company has developed a vertically integrated service model combining routine cleaning operations with specialized maintenance capabilities across commercial real estate, educational institutions, and healthcare facilities. Day-to-day operations are supported by a workforce of over 1,200 trained technicians organized into regional service hubs, enabling rapid response to client requirements. The core offering includes daily sanitation services, waste management systems, and preventative maintenance programs, with additional capabilities in HVAC servicing and grounds maintenance. Clients range from multinational corporations requiring standardized cross-location services to mid-sized enterprises seeking outsourced facility management. A centralized operations center coordinates service delivery through proprie...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    15000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B Service contracts',
    2017,
    '"',
    'Janitorial Services & Facilities Management Corp',
    '"',
    '"',
    1291,
    10381079.00,
    2491458.00,
    2491459.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of IoT-enabled monitoring systems to enhance predictive maintenance capabilities and . Expansion potential: Untapped potential in Tier 2/3 cities where organized facility management services remain underpenet. Development area: Opportunity to expand into adjacent service lines such as smart building maintenance and energy effi',
    'active',
    true,
    '["/assets/listing-assets/listing-008-178813da.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 16: Freight Forwarding Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Freight Forwarding Company',
    'Other',
    'Thailand',
    'Chiang Mai',
    'Operating as a key facilitator in Thailand''s strategic Southeast Asian trade corridors, this established freight forwarding enterprise has built a reputation for reliable cross-border logistics solutions since 1996. The company specializes in multimodal transportation management, coordinating seamless air/ocean/road shipments for industrial manufacturers, agricultural exporters, and consumer goods importers through customized service-level agreements. With 85 trained personnel operating from three regional hubs, the organization combines localized customs brokerage expertise with global partner networks across 35+ countries. Core operational differentiators include proprietary cargo tracking systems, bonded warehouse access near Laem Chabang port, and niche capabilities in handling temperature-sensitive pharmaceuticals. The business maintains long-term contracts with 60+ corporate clients demonstrating 92% annual retention rates, supported by a multilingual client service team mana...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    11000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B Service Contracts',
    1996,
    '"',
    'Freight Forwarding Company Corp',
    '"',
    '"',
    85,
    8496994.00,
    934669.00,
    934670.00,
    'New Ventures. "',
    'Growth opportunity: Expand cross-selling opportunities through value-added warehousing services at strategic Eastern Eco. Expansion potential: Implement AI-powered route optimization software to enhance fuel efficiency and load consolidation a. Development area: Develop dedicated cold chain division leveraging existing pharma client base and underutilized wareh',
    'active',
    true,
    '["/assets/listing-assets/listing-009-8aa651a4.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 17: Corporate Childcare Center Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Corporate Childcare Center Operator',
    'Education & Training',
    'Malaysia',
    'Kuala Lumpur',
    'The business operates as a specialized provider of corporate childcare solutions, delivering tailored early education programs through long-term partnerships with Malaysian enterprises. Established in 2021, the company manages modern childcare facilities integrated within corporate campuses or strategically located near business districts, serving white-collar employees seeking reliable care for children aged 18 months to 6 years. Operations center on delivering structured learning curricula aligned with national early childhood education standards while maintaining extended hours compatible with corporate work schedules. Key services encompass full-day care programs, developmental milestone tracking, and complementary nutrition plans - all supported by 183 trained staff including certified educators and pediatric first-aid responders. The model demonstrates particular relevance in Malaysia''s evolving labor market where 67.3% of women participate in the workforce, driving corporate...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    11000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2021,
    '"',
    'Corporate Childcare Center Operator Corp',
    '"',
    '"',
    183,
    8074714.00,
    1291954.00,
    1291954.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement digital learning augmentation tools to enhance curriculum delivery and parental reporting . Expansion potential: Replicate operational model in East Malaysia''s emerging industrial corridors with growing multinatio. Development area: Expand service offerings to include after-hours care solutions and weekend enrichment programs targe',
    'active',
    true,
    '["/assets/listing-assets/listing-010-032f6c6d.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 18: Commercial Landscaping & Groundskeeping Corp.
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Landscaping & Groundskeeping Corp.',
    'Other',
    'Thailand',
    'Chiang Mai',
    'With a heritage spanning over two decades, this commercial landscaping enterprise has cultivated a strong operational foundation in Thailand’s outdoor maintenance sector. Specializing in comprehensive groundskeeping solutions, the company serves commercial clients through multi-year contracts spanning hospitality venues, corporate campuses, and industrial complexes. Its service portfolio encompasses landscape design, seasonal planting programs, irrigation system management, and hardscape maintenance, supported by a fleet of specialized equipment and a 176-member team trained in horticultural best practices. The business operates through a hub-and-spoke model, with regional teams strategically positioned to service clients across key economic zones. A certified implementer of environmentally sustainable practices, it holds long-standing relationships with property management firms and developers seeking turnkey solutions for high-value commercial properties. The combination of recurr...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B service contracts',
    1998,
    '"',
    'Commercial Landscaping & Groundskeeping Corp. Corp',
    '"',
    '"',
    176,
    7056457.00,
    917339.00,
    917339.00,
    'Lifestyle Change. "',
    'Growth opportunity: Leverage existing municipal relationships to capture government contracts for public space beautific. Expansion potential: Develop technology-enabled landscape monitoring platforms using IoT sensors to enhance predictive ma. Development area: Expand service offerings into emerging sustainability sectors including water reclamation systems an',
    'active',
    true,
    '["/assets/listing-assets/listing-010-360546ff.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 19: Corporate & Commercial Law Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Corporate & Commercial Law Firm',
    'Other',
    'India',
    'Hyderabad',
    'Established in 2001, this corporate law practice has evolved into a trusted advisor for domestic and international organizations navigating India''s complex regulatory environment. The business provides full-spectrum corporate legal services including mergers & acquisitions advisory, contract lifecycle management, joint venture structuring, and cross-border compliance support. With a team of 65 experienced legal professionals, the firm maintains specialized practice groups handling commercial litigation, corporate governance matters, and foreign investment frameworks. Core clients include publicly traded companies, private equity firms, and multinational corporations expanding operations across South Asia. The company leverages its two-decade market presence to deliver institutional-grade legal services through a combination of deep regulatory knowledge, multi-jurisdictional expertise, and technology-enhanced workflow systems. Strategic value is anchored in established referral netw...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2001,
    '"',
    'Corporate & Commercial Law Firm Corp',
    '"',
    '"',
    65,
    5953942.00,
    1250327.00,
    1250328.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Expand regional footprint through satellite offices in high-growth industrial corridors like Pune an. Expansion potential: Implement AI-assisted legal research tools to enhance service speed and scalability.. Development area: Develop dedicated practice group for emerging areas including data privacy compliance and cryptocurr',
    'active',
    true,
    '["/assets/listing-assets/listing-011-2d06ad80.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 20: Digital Marketing & Advertising Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Digital Marketing & Advertising Agency',
    'Other',
    'India',
    'Ahmedabad',
    'This established digital marketing agency provides comprehensive B2B solutions to mid-sized and enterprise clients across India’s rapidly growing digital economy. Specializing in data-driven campaign management, the business delivers end-to-end services including search engine marketing, social media strategy, programmatic advertising, and analytics-driven content creation. Its core value proposition centers on helping technology firms, e-commerce platforms, and professional service providers navigate complex digital transformation challenges through customized audience targeting and conversion optimization frameworks. A team of 65 specialists operates through departmentalized workflows covering client services, creative development, and performance analytics, supported by proprietary campaign tracking systems and MarTech integrations. The agency maintains strong positioning in India’s $4.8B digital advertising market through ISO-certified processes, partnerships with major ad platf...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2017,
    '"',
    'Digital Marketing & Advertising Agency Corp',
    '"',
    '"',
    65,
    6455240.00,
    903733.00,
    768174.00,
    'New Ventures. "',
    'Growth opportunity: Expansion into high-margin adjacent services including marketing automation integration and conversi. Expansion potential: Implementation of predictive audience modeling tools to enhance cross-selling opportunities across c. Development area: Untapped potential in India’s emerging Tier 2/3 cities where digital ad spending grew 27% YoY (2023)',
    'active',
    true,
    '["/assets/listing-assets/listing-012-1db96754.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 21: Mechanical & Plumbing Contractors
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Mechanical & Plumbing Contractors',
    'Other',
    'Indonesia',
    'Surabaya',
    'This established mechanical and plumbing contracting enterprise has operated as a trusted service provider in Indonesia''s construction sector since 1995. Specializing in comprehensive mechanical systems installation, maintenance, and repair services, the business serves commercial clients through long-term service agreements that form the backbone of its operations. With a focus on industrial facilities, retail complexes, and office developments, technicians execute precision HVAC installations, pressurized piping systems, and emergency repair services using standardized operational protocols. The company maintains strategic partnerships with equipment manufacturers to ensure access to premium components while controlling procurement costs. A combination of in-house project managers, certified technicians, and apprentice-trained support staff enables efficient execution of both scheduled maintenance contracts and urgent service callouts. Market differentiation stems from 29 years o...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'Service contracts',
    1995,
    '"',
    'Mechanical & Plumbing Contractors Corp',
    '"',
    '"',
    30,
    2228265.00,
    311957.00,
    311957.00,
    'Retirement. "',
    'Growth opportunity: Expansion of energy-efficiency retrofitting services for ESG-conscious corporate clients.. Expansion potential: Implementation of mobile workforce management software to optimize service route efficiency.. Development area: Untapped potential in residential high-rise market through partnerships with property developers.',
    'active',
    true,
    '["/assets/listing-assets/listing-013-178813da.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 22: Enterprise Resource Planning (ERP) Software Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Enterprise Resource Planning (ERP) Software Provider',
    'Other',
    'India',
    'Kolkata',
    'This established enterprise resource planning (ERP) software provider delivers specialized SaaS solutions to mid-market organizations across manufacturing, logistics, and retail sectors. Operating since 1997, the company has evolved from on-premise installations to a cloud-native platform offering inventory management, financial analytics, and supply chain optimization modules. With 75 technical staff and support personnel, the business maintains a vertically-aligned customer base of 220+ active clients through annual renewable contracts, supported by multilingual customer success teams operating across Indian time zones. Its proprietary architecture enables rapid customization for regional compliance requirements while maintaining ISO-certified security standards. The organization''s value stems from deep domain expertise in Asian manufacturing workflows, frictionless client onboarding processes, and a technology stack designed for incremental module upgrades rather than full syste...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'SaaS',
    1997,
    '"',
    'Enterprise Resource Planning (ERP) Software Provider Corp',
    '"',
    '"',
    75,
    5566926.00,
    668031.00,
    668031.00,
    'Retirement. "',
    'Growth opportunity: Leverage cloud infrastructure to pursue underserved markets in Southeast Asia and Middle Eastern cor. Expansion potential: Develop partner ecosystem for cross-selling HRMS and CRM modules through system integrator alliances. Development area: Expand solution stack with embedded analytics/AI capabilities to address demand for predictive suppl',
    'active',
    true,
    '["/assets/listing-assets/listing-013-6a5003ec.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 23: Managed IT Services Provider (MSP)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Managed IT Services Provider (MSP)',
    'Other',
    'India',
    'Bangalore',
    'Established in 2017 within India''s rapidly expanding IT sector, this managed services provider delivers comprehensive technology support through structured service agreements. The business specializes in remote infrastructure monitoring, cybersecurity solutions, and cloud migration services, primarily serving mid-market enterprises across manufacturing, healthcare, and financial services sectors. With a team of 310 certified professionals, operations center around three regional hubs providing 24/7 technical support through standardized processes and proprietary monitoring platforms. The company has cultivated long-term relationships through customizable service tiers and a client retention rate exceeding 85% across its 300+ active contracts. Strategic value derives from its entrenched position in India''s SME digital transformation market, vertically specialized service offerings, and a completely recurring revenue model through multi-year agreements.',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Service contracts',
    2017,
    '"',
    'Managed IT Services Provider (MSP) Corp',
    '"',
    '"',
    310,
    12380735.00,
    2599954.00,
    1688863.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement AI-driven predictive maintenance tools to enhance service differentiation and operational . Expansion potential: Expand managed detection and response capabilities to address underserved cybersecurity needs in cur. Development area: Develop industry-specific compliance packages leveraging growing data protection regulations in Asia',
    'active',
    true,
    '["/assets/listing-assets/listing-014-3303fc4c.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 24: Commercial Real Estate Brokerage
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Real Estate Brokerage',
    'Real Estate & Property',
    'Thailand',
    'Chiang Mai',
    'This business operates as a full-service commercial real estate brokerage specializing in office, retail, and industrial property transactions within Thailand''s growing market. The company serves institutional investors, regional developers, and corporate occupiers through tailored leasing advisory, portfolio optimization strategies, and investment sales services. Its operations leverage Thailand''s post-pandemic economic recovery, particularly in Bangkok''s prime business districts and expanding industrial corridors near Eastern Economic Corridor (EEC) infrastructure projects. A team of 40 professionals including licensed brokers, market analysts, and multilingual negotiators supports transactions across three core divisions: tenant representation, landlord advisory, and cross-border investment services. The business maintains competitive differentiation through its proprietary database of off-market opportunities and established partnerships with regional property management firm...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2023,
    '"',
    'Commercial Real Estate Brokerage Corp',
    '"',
    '"',
    40,
    5029489.00,
    1056192.00,
    1056193.00,
    'Retirement. "',
    'Growth opportunity: Develop corporate subscription model for real-time market data feeds to institutional clients.. Expansion potential: Expand service lines into renewable energy site acquisition for solar/wind farm developments.. Development area: Implement AI-driven predictive analytics for commercial lease rate forecasting and vacancy pattern a',
    'active',
    true,
    '["/assets/listing-assets/listing-014-5d2e702b.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 25: Commercial Electrical Contractors
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Electrical Contractors',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This company operates as a full-service commercial electrical contractor specializing in complex installations, maintenance, and system upgrades for Thailand''s growing infrastructure and construction sectors. Its core operations involve executing turnkey electrical solutions for industrial facilities, retail complexes, and hospitality developments through 150 skilled technicians and project managers. The business maintains strategic positioning through ISO-certified processes and BIM coordination capabilities, serving both multinational corporations and domestic developers through competitive bidding and framework agreements. A vertically integrated model combining in-house design teams with vetted material suppliers ensures quality control across Thailand''s Eastern Economic Corridor and Bangkok metropolitan markets. The operation demonstrates buyer appeal through its certification portfolio meeting international engineering standards, multi-year service contracts with blue-chip c...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B Services',
    2024,
    '"',
    'Commercial Electrical Contractors Corp',
    '"',
    '"',
    150,
    11855256.00,
    2371051.00,
    2015393.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implement predictive maintenance systems using IoT sensors across existing client facilities.. Expansion potential: Expand prefabrication capabilities to capture higher-margin modular construction projects regionally. Development area: Develop energy efficiency auditing division to capitalize on Thailand''s new building sustainability',
    'active',
    true,
    '["/assets/listing-assets/listing-015-488dec3f.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 26: Regional Coffee Roaster & Cafe Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Coffee Roaster & Cafe Chain',
    'Other',
    'Indonesia',
    'Bandung',
    'This established coffee enterprise operates a vertically integrated model combining small-batch coffee roasting with a network of full-service cafes across strategic Indonesian urban centers. Since 2014, the business has cultivated a distinctive operational identity through its direct control of coffee bean sourcing from regional growers, on-site roasting facilities at each location, and menu offerings showcasing seasonal Indonesian coffee varietals alongside Western-style espresso beverages. The company maintains 12 physical locations staffed by approximately 300 employees trained in specialty coffee preparation and customer service protocols. Day-to-day operations emphasize consistent quality control through proprietary roast profiling systems and standardized barista training programs, while the cafes’ contemporary design aesthetic positions the brand as a premium yet accessible third-place destination. Key differentiators include direct trade relationships with Sumatran/Aceh cof...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Dine-in/Takeout',
    2014,
    '"',
    'Regional Coffee Roaster & Cafe Chain Corp',
    '"',
    '"',
    300,
    3464217.00,
    623559.00,
    623559.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implementation of subscription-based coffee delivery service leveraging existing roasting capacity.. Expansion potential: Development of private-label packaged coffee products for regional supermarket distribution.. Development area: Untapped potential in suburban market penetration through compact kiosk-style satellite locations.',
    'active',
    true,
    '["/assets/listing-assets/listing-015-8aa651a4.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 27: Janitorial Services & Facilities Management
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Janitorial Services & Facilities Management',
    'Other',
    'India',
    'Jaipur',
    'This established facilities management provider delivers comprehensive janitorial and support services to corporate clients across India through structured B2B contracts. Operating since 2010, the company maintains cleaning crews, quality control teams, and account management personnel supporting 600+ employees trained in commercial hygiene protocols. Core operations involve scheduled disinfection services, restroom maintenance, waste management solutions, and specialized cleaning for critical environments including IT server rooms and pharmaceutical facilities. Clients span office complexes, industrial parks, healthcare campuses, and retail chains, with service agreements typically structured as 1-3 year contracts featuring automatic renewals. The business holds ISO certifications for quality management and green cleaning practices, differentiating itself through documented compliance tracking systems and multilingual workforce coordination capabilities. Its value proposition cente...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Service Contracts',
    2010,
    '"',
    'Janitorial Services & Facilities Management Corp',
    '"',
    '"',
    615,
    4281337.00,
    685013.00,
    685014.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Expansion into adjacent facility support services such as landscape management, security coordinatio. Expansion potential: Implementation of IoT-enabled smart cleaning equipment and predictive maintenance analytics to enhan. Development area: Untapped potential in tier 2/3 cities where infrastructure development outpaces professional facilit',
    'active',
    true,
    '["/assets/listing-assets/listing-016-032f6c6d.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 28: Multi-Location Auto Service Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Multi-Location Auto Service Center',
    'Other',
    'Indonesia',
    'Bandung',
    'This established automotive service provider operates a network of modern repair facilities across strategic urban centers in Indonesia, delivering comprehensive vehicle maintenance and repair solutions under recurring service agreements. Since 2003, the business has cultivated a specialized position through its integrated offering of scheduled maintenance programs, emergency repair services, and OEM-certified technical expertise across multiple vehicle categories. The company serves both individual consumers through membership-based plans and commercial clients via customized fleet management contracts, supported by a workforce of 250 ASE-certified technicians and customer service staff. Core operations leverage a centralized scheduling system coordinating operations across 14 service bays equipped with advanced diagnostics tools, enabling efficient throughput of 180+ daily service orders. Market differentiation stems from exclusive partnerships with major lubricant suppliers and r...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    11000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Service contracts',
    2003,
    '"',
    'Multi-Location Auto Service Center Corp',
    '"',
    '"',
    250,
    11546321.00,
    1962874.00,
    1772984.00,
    'New Ventures. "',
    'Growth opportunity: Introduce EV maintenance certification programs ahead of anticipated electric vehicle adoption trend. Expansion potential: Expand corporate fleet management offerings through integrated telematics and predictive maintenance. Development area: Develop mobile servicing capabilities and app-based booking to capture underserved suburban/rural ma',
    'active',
    true,
    '["/assets/listing-assets/listing-016-f67a367a.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 29: Commercial Landscaping & Groundskeeping Corp.
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Landscaping & Groundskeeping Corp.',
    'Other',
    'Indonesia',
    'Bandung',
    'This established commercial landscaping enterprise provides comprehensive groundskeeping solutions to corporate clients across Indonesia. With nearly three decades of operational history, the business maintains long-term service contracts for landscape design, installation, and maintenance across office parks, retail complexes, and industrial facilities. The company differentiates itself through certified horticultural expertise, ISO-compliant safety protocols, and a fleet of specialized equipment maintained through rigorous preventive care programs. A dedicated workforce of 219 trained technicians operates through regional hubs, supported by centralized dispatch systems and real-time job tracking technology. Strategic advantages include exclusive supplier agreements with premium plant nurseries, proprietary soil treatment formulations, and multi-year maintenance contracts representing 83% of recurring revenue. The operation demonstrates particular attractiveness through its entrenc...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B Service Contracts',
    1995,
    '"',
    'Commercial Landscaping & Groundskeeping Corp. Corp',
    '"',
    '"',
    219,
    5475366.00,
    1368841.00,
    1095073.00,
    'Wealth Diversification. "',
    'Growth opportunity: Develop cross-selling programs for complementary stormwater management services using existing clien. Expansion potential: Expand municipal contracting capabilities to address growing public sector infrastructure developmen. Development area: Implement IoT-enabled irrigation systems to capture premium pricing for smart facility management so',
    'active',
    true,
    '["/assets/listing-assets/listing-017-0fa0058b.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 30: Digital Marketing & Advertising Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Digital Marketing & Advertising Agency',
    'Other',
    'India',
    'Hyderabad',
    'This established digital marketing and advertising agency has operated as a trusted partner for B2B organizations across India since 2011. The company delivers full-spectrum digital solutions including search engine optimization, social media marketing, pay-per-click advertising, and data-driven campaign analytics. A team of 30 skilled professionals manages client relationships through dedicated account managers, supported by specialized departments for creative development, technical implementation, and performance reporting. The business maintains particular strength in serving mid-market manufacturing and technology firms, with 85% of revenue derived from retained clients on 12+ month contracts. Its market positioning combines deep technical expertise in India''s complex digital landscape with the agility to customize solutions for sector-specific requirements. Strategic buyers would value the operational infrastructure supporting seamless client onboarding processes, proprietary...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2011,
    '"',
    'Digital Marketing & Advertising Agency Corp',
    '"',
    '"',
    30,
    1198599.00,
    275677.00,
    248110.00,
    'Retirement. "',
    'Growth opportunity: Implement vertical-specific service packages for high-growth industries like renewable energy and he. Expansion potential: Develop strategic alliances with complementary SaaS platforms to access new customer segments.. Development area: Expand service offerings into emerging marketing automation technologies and AI-driven personalizati',
    'active',
    true,
    '["/assets/listing-assets/listing-017-2d06ad80.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 31: Cloud Migration & Managed Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Cloud Migration & Managed Services',
    'Other',
    'Malaysia',
    'Kuala Lumpur',
    'This company operates as a specialized provider of cloud migration solutions and ongoing managed IT services for enterprise clients across Southeast Asia. Established in 2018, the business has positioned itself as a critical enabler of digital transformation, assisting organizations with server virtualization, workload transition to AWS/Azure platforms, and 24/7 cloud infrastructure management. Core operations involve customized migration road mapping, multi-cloud environment optimization, and cybersecurity-integrated managed services delivered through a team of 85 certified engineers and architects. The business maintains strategic partnerships with major cloud providers and cybersecurity vendors, operating through regional offices in Malaysia''s tech corridor that serve both domestic clients and multinational corporations with ASEAN operations. Its value proposition centers on reducing cloud expenditure through rightsizing recommendations while maintaining performance SLAs, partic...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Managed Services',
    2018,
    '"',
    'Cloud Migration & Managed Services Corp',
    '"',
    '"',
    85,
    10925723.00,
    2622173.00,
    2097173.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Leverage Malaysia''s multilingual workforce to establish dedicated service desks for underserved ASEA. Expansion potential: Develop industry-specific cloud optimization modules targeting high-growth verticals like digital he. Development area: Expand cybersecurity integration capabilities to address growing demand for holistic cloud protectio',
    'active',
    true,
    '["/assets/listing-assets/listing-018-80222d60.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 32: Regional Pizza Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Pizza Chain',
    'Other',
    'Malaysia',
    'Kota Kinabalu',
    'This established regional pizza chain has served Malaysian communities since 1997 through a hybrid dine-in and takeout model combining Western-style pizza offerings with localized flavor adaptations. Operating 125 staff across multiple locations, the business maintains standardized operations through recipe consistency protocols, centralized procurement systems, and regional distribution hubs that ensure uniform product quality. Core offerings include stone-baked pizzas featuring both traditional toppings and locally inspired combinations using Malaysian ingredients, complemented by appetizers, pasta dishes, and dessert options. The company occupies a unique market position as one of the first pizza specialists in its operating regions, having cultivated strong brand recognition through 27 years of community engagement and repeat customer patterns. Its vertically integrated operations encompass in-house dough production, proprietary sauce formulations, and a dedicated fleet for inte...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Dine-in/Takeout',
    1997,
    '"',
    'Regional Pizza Chain Corp',
    '"',
    '"',
    125,
    3731870.00,
    522461.00,
    522462.00,
    'Wealth Diversification. "',
    'Growth opportunity: Development of premium catering packages for corporate events and family gatherings.. Expansion potential: Expansion of cloud kitchen concepts to penetrate high-density urban markets with lower overhead.. Development area: Implementation of loyalty programs and mobile app ordering to boost customer retention rates.',
    'active',
    true,
    '["/assets/listing-assets/listing-018-df8cf486.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 33: Building Materials & Hardware Supplier
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Building Materials & Hardware Supplier',
    'Other',
    'India',
    'Kolkata',
    'Operating at the intersection of India''s booming construction sector and industrial supply chains, this established building materials provider has served trade professionals through reliable B2B partnerships since 1999. The company maintains strategic inventory hubs stocking 4,500+ SKUs spanning structural components, finishing materials, and contractor-grade tools, optimized for commercial construction projects and infrastructure development. A seasoned 63-member team supports regional contractors, architectural firms, and hardware retailers through dedicated account management and just-in-time delivery systems reinforced by longstanding relationships with 85+ domestic manufacturers. Proprietary inventory algorithms and a mobile-optimized ordering portal enable 98% same-day fulfillment rates for repeat clients representing 83% of annual orders. The operation holds particular appeal for buyers seeking entrenched market positioning through its certification as a government-approved...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    1999,
    '"',
    'Building Materials & Hardware Supplier Corp',
    '"',
    '"',
    63,
    2534011.00,
    481462.00,
    481462.00,
    'Retirement. "',
    'Growth opportunity: Expansion of value-added services like jobsite delivery coordination and bulk purchase financing pro. Expansion potential: Implementation of AI-driven predictive restocking models could reduce current 18% carrying costs thr. Development area: Untapped potential in modular construction materials segment projected to grow 28% CAGR through 2030',
    'active',
    true,
    '["/assets/listing-assets/listing-019-d1e9d8e1.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 34: Commercial General Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial General Contractor',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This established commercial general contractor has operated as a trusted partner in Thailand''s construction sector since 1997, specializing in turnkey project delivery for corporate clients and institutional entities. The business maintains focused operations across commercial building construction, renovation projects, and specialized industrial installations, serving domestic and multinational clients through competitive bidding processes and repeat engagements. With a workforce of 108 skilled professionals, the company implements rigorous quality control protocols and maintains ISO-certified project management systems, enabling consistent delivery of mid-to-large scale developments within budget parameters. The organization''s strategic value stems from its multi-decade portfolio of completed projects across Bangkok and key economic zones, established relationships with class-A subcontractors, and proprietary vendor pricing agreements cementing cost advantages in material sourci...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    1997,
    '"',
    'Commercial General Contractor Corp',
    '"',
    '"',
    108,
    5401969.00,
    1134413.00,
    1134413.00,
    'New Ventures. "',
    'Growth opportunity: Development of maintenance contracts and facility management verticals to capture post-construction . Expansion potential: Expansion into adjacent sectors including data center construction and smart building retrofits.. Development area: Implementation of predictive analytics tools for optimized resource allocation across project portfo',
    'active',
    true,
    '["/assets/listing-assets/listing-019-e9780ede.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 35: Commercial Real Estate Brokerage
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Real Estate Brokerage',
    'Real Estate & Property',
    'Philippines',
    'Davao City',
    'Operating as a trusted intermediary in the Philippines’ commercial property sector, this established brokerage facilitates complex transactions across office, retail, and industrial real estate segments. The firm employs a consultative approach to tenant representation, investment sales, and landlord advisory services, supported by a team of 20 seasoned brokers with deep regional market knowledge. Its operational framework combines direct client engagement through strategic account management with sophisticated digital tools for market analysis and portfolio optimization. The business maintains distinctive positioning through specialization in high-value urban redevelopment projects and cross-border investment facilitation, with 75% of active clients representing multinational corporations and institutional investors. A decentralized operational structure enables efficient service delivery across Luzon, Visayas, and Mindanao regions through strategic sub-offices. Defensible market p...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    1995,
    '"',
    'Commercial Real Estate Brokerage Corp',
    '"',
    '"',
    20,
    1575944.00,
    157594.00,
    126075.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expand cross-border investor outreach through strategic alliances with Asian capital market advisors. Expansion potential: Develop ancillary property management division leveraging existing landlord relationships.. Development area: Implement advanced data analytics platform to enhance investment modeling capabilities for instituti',
    'active',
    true,
    '["/assets/listing-assets/listing-020-6a5003ec.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 36: Managed IT Services Provider (MSP)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Managed IT Services Provider (MSP)',
    'Other',
    'India',
    'Jaipur',
    'The business operates as a managed IT services provider delivering comprehensive technology solutions to small and medium enterprises across multiple sectors. With operations based in India since 2001, the company has developed a hybrid service model combining remote infrastructure monitoring with on-site technical support, serving domestic and international clients through multi-year service contracts. Core offerings include network management, cybersecurity protocols, cloud integration services, and disaster recovery planning, supported by a 200-member team of certified engineers and client success specialists. A tiered service structure allows customization for verticals including financial services, healthcare, and manufacturing, with 24/7 operations centers maintaining uptime guarantees. The company maintains defensible market positioning through ISO 27001-certified processes and proprietary monitoring tools, complemented by strategic partnerships with leading software vendors....',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'Service contracts',
    2001,
    '"',
    'Managed IT Services Provider (MSP) Corp',
    '"',
    '"',
    200,
    7589419.00,
    1669672.00,
    1669672.00,
    'Retirement. "',
    'Growth opportunity: Opportunity to expand predictive maintenance capabilities through AI-driven analytics integration ac. Expansion potential: Underutilized capacity for white-label IT management partnerships with regional hardware distributor. Development area: Untapped potential in vertical-specific service bundles for high-compliance industries like healthca',
    'active',
    true,
    '["/assets/listing-assets/listing-021-5ed54562.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 37: Regional Coffee Roaster & Cafe Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Coffee Roaster & Cafe Chain',
    'Other',
    'India',
    'Hyderabad',
    'This company operates as a vertically integrated regional coffee enterprise, combining artisanal roasting operations with a chain of contemporary cafes across urban centers in India. Founded in 2011, the business has cultivated a distinctive position in the food service sector through its control of the entire production cycle - from sourcing high-quality Arabica and Robusta beans through direct farmer relationships to operating 190-employee cafe locations offering dine-in experiences and premium takeaway options. Day-to-day operations center on maintaining rigorous quality standards across its six roasting facilities while delivering consistent customer experiences through barista-trained staff, seasonal menu innovations, and modern cafe environments appealing to both traditional coffee enthusiasts and younger professional demographics. The dual revenue model leverages wholesale bean distribution to hotels and restaurants alongside direct consumer sales through strategically locate...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Dine-in/Takeout',
    2011,
    '"',
    'Regional Coffee Roaster & Cafe Chain Corp',
    '"',
    '"',
    190,
    4780112.00,
    764817.00,
    611854.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Geographic expansion into underserved secondary cities through compact cafe formats requiring lower . Expansion potential: Development of packaged retail products leveraging existing roasting capabilities for supermarket di. Development area: Implementation of mobile ordering technology and delivery partnerships to capture emerging quick-com',
    'active',
    true,
    '["/assets/listing-assets/listing-021-bc88f68d.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 38: Multi-Location Auto Service Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Multi-Location Auto Service Center',
    'Other',
    'India',
    'Bangalore',
    'Positioned as a key player in India’s automotive aftermarket sector, this multi-location enterprise operates through a network of service centers specializing in comprehensive vehicle maintenance and repair solutions. Established in 2019, the business leverages service contracts as its core revenue driver, offering customers predictable pricing and scheduled maintenance plans for both individual vehicle owners and commercial fleets. Daily operations center around diagnostic services, mechanical repairs, and preventative maintenance across locations, supported by a workforce of 300 trained technicians and customer service staff. The company has strategically positioned itself to capitalize on India’s growing vehicle ownership rates and increasing demand for organized automotive care providers, distinguishing itself through standardized service protocols and a client retention rate bolstered by contract renewals. Its multi-site infrastructure provides geographic diversification across...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Service contracts',
    2019,
    '"',
    'Multi-Location Auto Service Center Corp',
    '"',
    '"',
    300,
    5931477.00,
    949036.00,
    759229.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement predictive maintenance capabilities using IoT-enabled diagnostics to enhance service value. Expansion potential: Develop dedicated commercial vehicle maintenance vertical to serve India’s growing logistics and tra. Development area: Expand digital customer engagement through mobile app integration for service scheduling and real-ti',
    'active',
    true,
    '["/assets/listing-assets/listing-022-5d2e702b.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 39: Commercial Landscaping & Groundskeeping Corp.
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Landscaping & Groundskeeping Corp.',
    'Other',
    'India',
    'Jaipur',
    'The business operates as a full-service commercial landscaping provider specializing in comprehensive grounds maintenance and customized green space solutions for corporate clients across India. Established over two decades ago, the company has developed a vertically integrated service model combining landscape design, seasonal planting programs, irrigation system management, and hardscape installation. Core operations center on long-term B2B contracts with office park developers, industrial complexes, and institutional facilities requiring year-round landscape upkeep. A workforce of 407 trained horticultural technicians and project managers supports operations through regional hubs, utilizing a fleet of specialized equipment maintained through centralized logistics systems. The company differentiates itself through accredited sustainable practices certifications and proprietary soil health monitoring protocols, positioning it as a preferred vendor for environmentally conscious clie...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B Service contracts',
    2002,
    '"',
    'Commercial Landscaping & Groundskeeping Corp. Corp',
    '"',
    '"',
    407,
    10186996.00,
    2037399.00,
    1528049.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of IoT-enabled equipment tracking systems to optimize preventive maintenance cycles a. Expansion potential: Expansion of climate-adaptive landscaping services to address increasing corporate ESG commitments i. Development area: Untapped potential in vertical farming installations for corporate clients seeking sustainability-li',
    'active',
    true,
    '["/assets/listing-assets/listing-023-3715f3cf.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 40: Restaurant Group (Casual Dining Chain)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Restaurant Group (Casual Dining Chain)',
    'Other',
    'Indonesia',
    'Medan',
    'The business operates a well-established casual dining restaurant group with multiple locations across Indonesia, combining dine-in experiences with takeout services to cater to contemporary consumer preferences. Specializing in Indonesian fusion cuisine with international accessibility, the company has cultivated a loyal customer base through consistent quality, efficient service, and strategic urban/suburban locations near commercial hubs. With standardized kitchen operations and inventory systems refined over 13 years of operation, the enterprise maintains strong vendor relationships for fresh ingredient sourcing while balancing cost controls with menu versatility. The combination of 600 trained staff across front-of-house and culinary teams supports high-volume operations during peak dining periods while maintaining brand consistency through centralized training programs. Core buyer appeal lies in its proven operational template for expansion, established regional supply chain i...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    12000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Dine-in/Takeout',
    2011,
    '"',
    'Restaurant Group (Casual Dining Chain) Corp',
    '"',
    '"',
    600,
    10068076.00,
    1107488.00,
    1107488.00,
    'New Ventures. "',
    'Growth opportunity: Strategic suburban expansion targeting emerging middle-class residential corridors with customizable. Expansion potential: Menu optimization through regional Indonesian culinary specializations to differentiate from competi. Development area: Untapped potential in digital customer engagement through AI-driven loyalty programs and app-based o',
    'active',
    true,
    '["/assets/listing-assets/listing-023-488dec3f.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 41: High-End Fitness Center & Health Club Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'High-End Fitness Center & Health Club Chain',
    'Other',
    'Indonesia',
    'Bandung',
    'Operating at the intersection of luxury and wellness, this established fitness enterprise maintains multiple premium facilities across Indonesia''s metropolitan centers. For 23 years, the business has cultivated a reputation for delivering white-glove health club experiences through expansive workout floors featuring cutting-edge cardio and resistance equipment, Olympic-grade swimming pools, and dedicated spaces for functional training. Core operations center on personalized member engagement supported by certified trainers, nutrition consultants, and recovery specialists who develop tailored fitness roadmaps. Beyond physical amenities, the organization differentiates through integrated wellness programming including stress management workshops, sleep optimization courses, and corporate partnership packages that account for 28% of recurring memberships. Strategic site selection in mixed-use developments adjacent to upscale residential and commercial hubs ensures consistent foot traf...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Membership-based service model',
    2001,
    '"',
    'High-End Fitness Center & Health Club Chain Corp',
    '"',
    '"',
    83,
    3695948.00,
    443513.00,
    354811.00,
    'Lifestyle Change. "',
    'Growth opportunity: Leverage existing real estate partnerships to enter emerging secondary markets like Bandung and Sura. Expansion potential: Expand recovery service verticals through cryotherapy chambers and compression therapy suites to cap. Development area: Develop hybrid digital platform combining live-streamed classes with AI-driven fitness tracking to e',
    'active',
    true,
    '["/assets/listing-assets/listing-024-ad5c47a2.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 42: Customer Relationship Management (CRM) SaaS
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Customer Relationship Management (CRM) SaaS',
    'Other',
    'Indonesia',
    'Bandung',
    'Positioned within Indonesia''s rapidly expanding digital economy, this SaaS enterprise provides tailored customer relationship management solutions designed specifically for local market dynamics. The business delivers a cloud-based CRM platform combining sales automation, marketing campaign management, and customer service tools optimized for Southeast Asian business practices. Its core operations focus on continuous product development, supported by an agile team of 50 software engineers and customer success specialists maintaining 99.9% uptime across AWS-hosted infrastructure. The platform serves over 2,800 active business clients primarily in e-commerce, retail banking, and digital media sectors through direct sales and strategic partnerships with regional IT consultancies. Key differentiators include native Bahasa Indonesia interface support, integrated social commerce features for platforms like TikTok Shop and Tokopedia, and flexible pricing models catering to micro-enterpris...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'SaaS',
    2020,
    '"',
    'Customer Relationship Management (CRM) SaaS Corp',
    '"',
    '"',
    50,
    3737658.00,
    635401.00,
    535000.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of usage-based pricing tiers to capture emerging micro-enterprise segment adopting di. Expansion potential: Strategic partnerships with telecom providers could enable bundled SaaS offerings across Malaysia an. Development area: Untapped potential in offering AI-driven market intelligence modules using accumulated customer inte',
    'active',
    true,
    '["/assets/listing-assets/listing-024-f67a367a.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 43: Educational & Tutoring Center Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Educational & Tutoring Center Franchise',
    'Education & Training',
    'Indonesia',
    'Bandung',
    'This established educational services provider operates a franchise network of tutoring centers supporting Indonesia''s growing demand for supplemental academic instruction. Since 2007, the business has developed a vertically integrated model combining standardized curriculum delivery with localized operational support across its 150-person workforce. Core operations focus on structured after-school programs and exam preparation services for K-12 students, delivered through service contracts averaging 6-12 month durations that ensure predictable recurring revenue. The company maintains competitive differentiation through its proprietary learning management system, which enables centralized content development while allowing franchisees to customize pacing for regional curriculum requirements. Market positioning capitalizes on Indonesia''s expanding middle-class prioritization of education expenditure, with particular strength in greater Jakarta and secondary cities demonstrating abo...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Service contracts',
    2007,
    '"',
    'Educational & Tutoring Center Franchise Corp',
    '"',
    '"',
    150,
    4245810.00,
    891620.00,
    802458.00,
    'Lifestyle Change. "',
    'Growth opportunity: Optimization of franchise marketing toolkit to accelerate new territory penetration in under-served . Expansion potential: Development of premium-tier offerings including university admission consulting and international cu. Development area: Implementation of hybrid learning platforms to expand addressable market beyond physical center catc',
    'active',
    true,
    '["/assets/listing-assets/listing-025-0fa0058b.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 44: Commercial Electrical Contractors
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Electrical Contractors',
    'Other',
    'India',
    'Jaipur',
    'This established commercial electrical contracting enterprise has operated since 2005, providing specialized electrical installation and maintenance services to corporate clients across India''s growing construction sector. The company serves as a crucial partner for commercial real estate developers, manufacturing facilities, and infrastructure projects requiring complex electrical systems integration. Its core operations center on end-to-end project execution - from initial design consultation and regulatory compliance to precision installation of high-voltage systems and ongoing maintenance contracts. A workforce of 262 skilled technicians and project managers enables simultaneous handling of multiple large-scale engagements while maintaining strict safety protocols. The business differentiates itself through ISO-certified quality control processes, 24/7 emergency response capabilities, and a track record of completing projects within aggressive construction timelines. Strategic ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B Service Contracts',
    2005,
    '"',
    'Commercial Electrical Contractors Corp',
    '"',
    '"',
    262,
    7859772.00,
    1571954.00,
    1571954.00,
    'Lifestyle Change. "',
    'Growth opportunity: Leverage existing industry relationships to penetrate underserved secondary cities with infrastructu. Expansion potential: Develop mobile app platform for client self-service portal and predictive maintenance scheduling.. Development area: Expand service offerings into emerging renewable energy system installations for corporate sustainab',
    'active',
    true,
    '["/assets/listing-assets/listing-025-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 45: Regional Pizza Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Pizza Chain',
    'Other',
    'Indonesia',
    'Medan',
    'Operating as a prominent player in Indonesia''s casual dining sector, this regional pizza chain delivers a carefully curated menu blending authentic Italian-inspired recipes with locally preferred flavors across multiple urban centers. The business operates through a network of strategically located dine-in restaurants featuring full kitchen operations and dedicated takeout counters, supported by efficient delivery partnerships. Core menu offerings center on artisanal wood-fired pizzas using fresh regional ingredients, complemented by pasta dishes, appetizers, and house-made beverages catering to both family dining occasions and quick-service demand. With all locations situated near high-traffic commercial and residential zones, the company has cultivated strong brand recognition through consistent quality, competitive pricing, and tailored promotions appealing to Indonesia''s growing middle-class consumers. A workforce of 110 trained staff members maintains streamlined operations a...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Dine-in/Takeout',
    2022,
    '"',
    'Regional Pizza Chain Corp',
    '"',
    '"',
    110,
    1375344.00,
    178794.00,
    247562.00,
    'Lifestyle Change. "',
    'Growth opportunity: Strategic expansion into secondary cities demonstrating comparable demographic profiles to current h. Expansion potential: Development of premium catering packages targeting corporate clients in major business districts nea. Development area: Implementation of a proprietary mobile ordering platform to capture higher-margin direct digital sal',
    'active',
    true,
    '["/assets/listing-assets/listing-026-cf3e085b.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 46: Temperature-Controlled Warehousing
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Temperature-Controlled Warehousing',
    'Other',
    'India',
    'Ahmedabad',
    'This established temperature-controlled warehousing provider operates a strategically vital logistics network serving pharmaceutical manufacturers, food processors, and agricultural exporters across India''s growing cold chain sector. The business manages multiple Class-A storage facilities equipped with multi-zone climate systems, real-time temperature monitoring technologies, and automated inventory management platforms. Core operations focus on maintaining precise environmental controls for perishable goods while optimizing last-mile distribution through partnerships with refrigerated transport providers. With 14 years of sector-specific expertise, the company has developed customized protocols for handling temperature-sensitive biologics and processed foods, positioning it as a critical link in clients'' supply chain continuity plans. The asset-heavy operation combines 24/7 technical monitoring teams with preventative maintenance programs to ensure >99% facility uptime. Current ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2010,
    '"',
    'Temperature-Controlled Warehousing Corp',
    '"',
    '"',
    111,
    4440746.00,
    888149.00,
    666111.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement predictive maintenance systems and automation upgrades to optimize energy consumption cost. Expansion potential: Expand service footprint into underserved eastern states through modular facility deployments.. Development area: Develop integrated track-and-trace solutions to capture emerging cold chain visibility requirements',
    'active',
    true,
    '["/assets/listing-assets/listing-026-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 47: Multi-Chain Nail Salon & Spa
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Multi-Chain Nail Salon & Spa',
    'Other',
    'Philippines',
    'Cebu City',
    'This established wellness enterprise operates a network of premium nail and spa facilities across strategic urban centers in the Philippines, providing comprehensive beauty services through 17 locations. The business distinguishes itself through integrated nail artistry, skin therapies, and body treatments delivered by 250 trained technicians using internationally certified products. Core offerings include gel extensions, therapeutic massages, and premium waxing services tailored to middle-to-upper-income clients aged 25-55, with particular appeal to corporate professionals and destination tourists seeking luxury self-care experiences. Operations leverage centralized training academies ensuring consistent service quality, coupled with inventory management systems that optimize product costs across all outlets. Strategic advantages include prime retail footprints in mixed-use developments, membership programs retaining 42% of clients through loyalty incentives, and partnerships with ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Dine-in/Service-based',
    2007,
    '"',
    'Multi-Chain Nail Salon & Spa Corp',
    '"',
    '"',
    250,
    6982107.00,
    1117137.00,
    1117137.00,
    'New Ventures. "',
    'Growth opportunity: Expand corporate wellness partnerships offering on-site employee pampering services to major busines. Expansion potential: Develop private-label organic product line leveraging existing distribution networks to capture well. Development area: Implement omnichannel booking platforms and AI-powered personalized treatment recommendations to enh',
    'active',
    true,
    '["/assets/listing-assets/listing-027-df8cf486.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 48: Managed IT Services Provider (MSP)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Managed IT Services Provider (MSP)',
    'Other',
    'Vietnam',
    'Hanoi',
    'Founded in 2001, this managed IT services provider has become a trusted partner for businesses seeking comprehensive technology solutions in Vietnam. The company delivers end-to-end IT infrastructure management through standardized service tiers, including network monitoring, cybersecurity protocols, cloud system integration, and 24/7 technical support. With a focus on predictable operational outcomes, it structures multi-year contracts with small-to-medium enterprises and corporate clients across manufacturing, financial services, and public sector verticals. A centralized NOC (Network Operations Center) in Ho Chi Minh City coordinates regional technical teams supporting 400+ client sites nationwide. The business differentiates itself through localized compliance expertise, maintaining certifications for handling sensitive government and financial sector workloads while offering cost advantages versus multinational competitors. Strategic partnerships with Microsoft, Cisco, and AWS ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Service contracts',
    2001,
    '"',
    'Managed IT Services Provider (MSP) Corp',
    '"',
    '"',
    115,
    4499666.00,
    1079919.00,
    1349900.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Leverage existing partner ecosystem to offer bundled hardware-as-a-service solutions alongside manag. Expansion potential: Develop industry-specific compliance packages for newly regulated sectors like digital banking and h. Development area: Expand edge computing capabilities to support manufacturing clients implementing Industry 4.0 IoT de',
    'active',
    true,
    '["/assets/listing-assets/listing-027-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 49: Regional Coffee Roaster & Cafe Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Coffee Roaster & Cafe Chain',
    'Other',
    'India',
    'Chennai',
    'Operating at the intersection of artisanal craftsmanship and modern hospitality, this established coffee enterprise has cultivated a strong regional presence through vertically integrated operations spanning bean sourcing, proprietary roasting, and multi-format retail experiences. The business operates 26 cafes across tier-1 and tier-2 Indian cities, supported by a dedicated roasting facility producing signature blends for both cafe service and B2B wholesale clients. Day-to-day operations emphasize quality control through direct farmer relationships in coffee-growing regions, small-batch roasting protocols, and standardized cafe workflows managed by a 170-member team trained in specialty beverage preparation and customer service. Primary revenue streams derive from cafe sales (60% beverages, 30% food items, 10% retail coffee products), supplemented by growing wholesale accounts with premium hotels and office campuses. Strategic differentiators include a recognized private-label coff...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Dine-in/Takeout',
    2014,
    '"',
    'Regional Coffee Roaster & Cafe Chain Corp',
    '"',
    '"',
    170,
    3088154.00,
    463223.00,
    463223.00,
    'Lifestyle Change. "',
    'Growth opportunity: Optimizing underutilized morning daypart through breakfast menu engineering and commuter-focused gra. Expansion potential: Expanding private-label coffee product distribution through modern trade partnerships and export cha. Development area: Implementing a centralized e-commerce platform for subscription coffee sales and cafe meal kits to c',
    'active',
    true,
    '["/assets/listing-assets/listing-028-36961dae.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 50: Janitorial Services & Facilities Management
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Janitorial Services & Facilities Management',
    'Other',
    'Vietnam',
    'Da Nang',
    'Operating since 1996, this Vietnamese enterprise has developed into a comprehensive facilities management provider specializing in commercial janitorial services, technical maintenance, and integrated facility solutions. The company maintains long-term service contracts with clients across office complexes, industrial parks, healthcare facilities, and retail centers, leveraging a workforce of 600 trained technicians and cleaning specialists. Daily operations center on preventative maintenance programs, AI-driven scheduling systems, and quality assurance protocols aligned with international cleanliness standards. Clients benefit from 24/7 support capabilities and customized service packages that adapt to varying facility requirements. Market differentiation stems from ISO-certified processes, bilingual account management teams, and proprietary staff training modules developed through decades of localized experience. Strategic value is enhanced by multi-year contract structures with a...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Service contracts',
    1996,
    '"',
    'Janitorial Services & Facilities Management Corp',
    '"',
    '"',
    600,
    7746194.00,
    1084467.00,
    1084467.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement mobile-first client portal with real-time service tracking and AI-powered analytics dashbo. Expansion potential: Develop corporate sustainability consulting arm leveraging existing client relationships and operati. Development area: Expand high-margin specialty services including HVAC optimization, green building certifications, an',
    'active',
    true,
    '["/assets/listing-assets/listing-028-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 51: Clinical Research Organization (CRO)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Clinical Research Organization (CRO)',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This clinical research organization operates as a specialized service provider supporting pharmaceutical developers and medical technology innovators across Southeast Asia. Strategically headquartered in Thailand with a workforce of 82 professionals, the company delivers comprehensive trial management solutions including protocol design optimization, multi-site coordination, and regulatory submission support for clients pursuing market authorization in ASEAN territories. The business maintains established partnerships with hospital networks and academic research institutions, enabling efficient patient recruitment across therapeutic areas including tropical disease studies and biosimilar development programs. Its operational model combines a core team of clinical research associates with flexible contract staffing solutions, allowing scalable resource allocation to accommodate fluctuating trial timelines. The organization has developed proprietary quality management systems aligned ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2019,
    '"',
    'Clinical Research Organization (CRO) Corp',
    '"',
    '"',
    82,
    8220740.00,
    1479733.00,
    1479733.00,
    'Wealth Diversification. "',
    'Growth opportunity: Implement AI-driven site selection algorithms and electronic data capture systems to reduce trial se. Expansion potential: Develop technology transfer services capitalizing on growing regional demand for local vaccine produ. Development area: Leverage Thailand''s medical tourism sector to establish dedicated patient recruitment channels for r',
    'active',
    true,
    '["/assets/listing-assets/listing-029-6b3b00be.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 52: Restaurant Group (Casual Dining Chain)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Restaurant Group (Casual Dining Chain)',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This company operates a network of casual dining establishments across Thailand''s prime urban and tourist destinations, combining full-service restaurant operations with takeout capabilities. The business has rapidly established itself as a modern purveyor of authentic Thai cuisine blended with pan-Asian flavors, catering to both local patrons and international visitors. Day-to-day operations are managed through a centralized hub-and-spoke model, with standardized recipes and service protocols ensuring consistent quality across multiple locations while allowing menu adaptations to regional preferences. A workforce of 131 full-time employees supports kitchen operations, front-of-house service, and dedicated takeout coordination through integrated POS systems. The company leverages Thailand''s thriving tourism sector and growing domestic middle class through strategically located storefronts in mixed commercial-residential areas and transit-adjacent zones. Market differentiation is a...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Dine-in/Takeout',
    2023,
    '"',
    'Restaurant Group (Casual Dining Chain) Corp',
    '"',
    '"',
    131,
    6580875.00,
    855513.00,
    855513.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expand private label offerings of signature sauces and spice blends through existing retail partners. Expansion potential: Develop ghost kitchen infrastructure to serve underpenetrated suburban markets without dine-in overh. Development area: Implement dynamic pricing models for tourist-heavy locations during peak travel seasons.',
    'active',
    true,
    '["/assets/listing-assets/listing-029-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 53: Multi-Chain Automated Car Wash
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Multi-Chain Automated Car Wash',
    'Other',
    'India',
    'Bengaluru',
    'Positioned as a leader in India’s vehicle maintenance sector, this established automated car wash operator has cultivated a robust service infrastructure since 2007. The business operates through strategically located, tech-enabled facilities utilizing touchless cleaning systems and water recycling technology to serve both individual vehicle owners and commercial fleet clients. Its core revenue model revolves around tiered subscription packages and corporate service agreements, ensuring predictable recurring income while addressing urban consumers’ demand for convenient, eco-conscious cleaning solutions. Staffed by 25 trained technicians and support personnel, the operation maintains standardized processes across all locations through centralized management software, enabling efficient resource allocation and quality control. The company’s positioning capitalizes on India’s expanding middle-class demographic and rising private vehicle ownership rates, with particular strength in ser...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Service contracts',
    2007,
    '"',
    'Multi-Chain Automated Car Wash Corp',
    '"',
    '"',
    25,
    756940.00,
    189235.00,
    189235.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of mobile app-based scheduling and loyalty programs to improve customer retention met. Expansion potential: Expansion into tier-2 cities through franchise partnerships leveraging existing operational playbook. Development area: Development of complementary detailing services and ceramic coating upgrades to increase average tra',
    'active',
    true,
    '["/assets/listing-assets/listing-030-e9780ede.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 54: Corporate & Commercial Law Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Corporate & Commercial Law Firm',
    'Other',
    'India',
    'Bhopal',
    'This established corporate and commercial law practice has developed into a respected legal services provider since its 2019 inception, operating from strategic locations across India. The firm delivers comprehensive legal solutions to domestic corporations and international enterprises, specializing in contract law, mergers and acquisitions, regulatory compliance, and commercial dispute resolution. With a team of 80 legal professionals and support staff, the organization maintains structured practice groups that handle complex transactions while providing ongoing advisory services to clients across technology, manufacturing, and financial services sectors. The business operates through a hub-and-spoke model with centralized expertise in corporate law complemented by specialized teams handling sector-specific regulatory matters. Its value proposition centers on combining deep knowledge of India''s evolving legal landscape with responsiveness to client needs, maintaining long-term re...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2019,
    '"',
    'Corporate & Commercial Law Firm Corp',
    '"',
    '"',
    80,
    8086279.00,
    808627.00,
    808628.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Establish strategic partnerships with international law firms to capture inbound investment mandates. Expansion potential: Implement AI-powered contract analysis tools to enhance service speed and margin improvement.. Development area: Develop dedicated practice groups for emerging sectors like renewable energy and digital asset regul',
    'active',
    true,
    '["/assets/listing-assets/listing-030-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 55: Boutique Apparel Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Boutique Apparel Chain',
    'Other',
    'Indonesia',
    'Makassar',
    'Operating as a key player in Indonesia''s fashion retail sector since 2007, this boutique apparel chain combines curated physical retail experiences with strategically developed e-commerce capabilities. The business serves style-conscious urban professionals through 18 strategically located stores across major cities, complemented by a transactional website and mobile app driving 34% of total sales. Core operations emphasize lean inventory management through a centralized distribution hub, real-time sales analytics, and a vertically integrated design-to-production workflow that enables bi-monthly collection refreshes. A 181-member team maintains specialized expertise in trend forecasting, visual merchandising, and omnichannel customer service, supported by established partnerships with 23 domestic textile suppliers and 7 international fabric importers. Key buyer attractions include exclusive control of three registered clothing trademarks, a 92% customer retention rate among loyalty...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Retail B2C',
    2007,
    '"',
    'Boutique Apparel Chain Corp',
    '"',
    '"',
    181,
    9044409.00,
    2080214.00,
    2080213.00,
    'New Ventures. "',
    'Growth opportunity: Enhanced cross-selling opportunities via strategic expansion into complementary accessory categories. Expansion potential: Monetization of proprietary textile technologies through white-label manufacturing partnerships or B. Development area: Untapped potential in underpenetrated secondary cities through compact store formats and localized m',
    'active',
    true,
    '["/assets/listing-assets/listing-031-30f764b2.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 56: Corporate Childcare Center Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Corporate Childcare Center Operator',
    'Education & Training',
    'India',
    'Jaipur',
    'This established corporate childcare provider operates as a premium B2B service partner for major employers across India’s metropolitan hubs, offering onsite childcare solutions designed to support workforce retention and productivity. The business manages full-service facilities within corporate campuses and commercial complexes, providing structured early education programs, nutritional meal plans, and extended hours to align with professional schedules. With 240 trained caregivers and administrative staff, operations emphasize regulatory compliance with India’s National Early Childhood Care and Education Policy, coupled with customized corporate reporting on attendance patterns and developmental milestones. The model thrives on three-year renewable contracts with multinational corporations and large domestic enterprises, increasingly positioned as essential employer infrastructure given India’s 18% five-year CAGR in urban dual-income households. Strategic value derives from estab...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2010,
    '"',
    'Corporate Childcare Center Operator Corp',
    '"',
    '"',
    240,
    4550082.00,
    1092019.00,
    1092020.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expand service model to mid-sized cities experiencing rapid growth in IT/ITeS sector employment base. Expansion potential: Implement AI-driven capacity optimization tools to increase facility utilization rates during non-pe. Development area: Develop after-school tutoring modules leveraging existing facilities to capture secondary revenue fr',
    'active',
    true,
    '["/assets/listing-assets/listing-031-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 57: Commercial General Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial General Contractor',
    'Other',
    'India',
    'Jaipur',
    'This established commercial general contractor operates as a strategic partner for businesses requiring large-scale construction solutions across India’s evolving commercial real estate sector. Specializing in end-to-end project management for office complexes, retail developments, and institutional facilities, the company coordinates design teams, skilled labor, and regulatory compliance through vertically integrated operations. A workforce of 140 professionals supports site preparation, structural engineering oversight, and quality-controlled implementation across multiple concurrent projects. The business differentiates itself through ISO-certified safety protocols, vendor partnerships ensuring material cost predictability, and a proprietary project tracking system that minimizes delays. Its client portfolio includes repeat engagements with regional property developers, corporate tenants requiring build-to-suit spaces, and government-awarded infrastructure projects. A buyer would...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2001,
    '"',
    'Commercial General Contractor Corp',
    '"',
    '"',
    140,
    7032912.00,
    1687898.00,
    1434714.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Geographic expansion into secondary cities like Coimbatore and Rajkot where commercial real estate d. Expansion potential: Development of a modular construction division targeting fast-turnaround retail and warehouse projec. Development area: Implementation of green building certifications (LEED/IGBC) to capitalize on India’s $35B sustainabl',
    'active',
    true,
    '["/assets/listing-assets/listing-032-bc88f68d.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 58: Mechanical & Plumbing Contractors
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Mechanical & Plumbing Contractors',
    'Other',
    'India',
    'Kolkata',
    'The business operates as a specialized mechanical and plumbing contracting partner for commercial and industrial clients across India''s growing construction sector. With operations established in 1999, the company has evolved into a turnkey solutions provider handling HVAC installations, piping systems, water treatment infrastructure, and maintenance contracts for manufacturing facilities, office complexes, and institutional projects. Its operational framework combines experienced field teams certified in international engineering standards with centralized project management offices that coordinate workflow through proprietary scheduling software. The company maintains long-standing partnerships with 85+ recurring clients, including multinational corporations and government-approved contractors, benefiting from India''s $1.4 trillion infrastructure development initiative. Strategic value stems from its certification portfolio (including ISO 9001 and PMVY accreditation), vertically...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Service Contracts',
    1999,
    '"',
    'Mechanical & Plumbing Contractors Corp',
    '"',
    '"',
    215,
    8582111.00,
    1115674.00,
    1544780.00,
    'Retirement. "',
    'Growth opportunity: Diversification into renewable energy integration services for plumbing/mechanical systems to align . Expansion potential: Geographic expansion into Tier 2 cities through regional partnerships to capture underserved industr. Development area: Implementation of IoT-enabled equipment monitoring could create predictive maintenance upselling opp',
    'active',
    true,
    '["/assets/listing-assets/listing-032-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 59: Customs Brokerage Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Customs Brokerage Firm',
    'Other',
    'Indonesia',
    'Bandung',
    'Positioned at the crossroads of Southeast Asia''s bustling trade corridors, this established customs brokerage firm has operated as a critical facilitator of international commerce since 2013. Specializing in end-to-end clearance solutions, the company streamlines complex import/export processes for businesses navigating Indonesia’s regulatory landscape. A team of 124 certified professionals manages documentation validation, duty optimization, and compliance audits while maintaining seamless coordination between port authorities, freight forwarders, and clients across manufacturing, retail, and industrial sectors. The business leverages proprietary workflow management systems and government-approved compliance protocols to expedite cargo releases – particularly valuable given Indonesia’s evolving customs modernization initiatives and ASEAN trade agreement participation. Its value proposition centers on transforming regulatory complexity into competitive advantage for clients through...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2013,
    '"',
    'Customs Brokerage Firm Corp',
    '"',
    '"',
    124,
    6192741.00,
    1486257.00,
    1189006.00,
    'Wealth Diversification. "',
    'Growth opportunity: Develop integrated trade finance partnerships offering clients duty deferral programs and bonded war. Expansion potential: Establish regional satellite offices near Batam and Bintan free trade zones to capture transshipment. Development area: Implement AI-powered classification engines to automate HS code assignments and reduce manual review',
    'active',
    true,
    '["/assets/listing-assets/listing-033-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 60: Wholesale & Commercial Bakery
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Wholesale & Commercial Bakery',
    'Other',
    'India',
    'Bangalore',
    'This vertically integrated bakery operation has established itself as a critical supplier for India''s food service sector since 2018, combining large-scale production capabilities with artisanal baking techniques. The business maintains 24/7 operations across two shifts in its 18,000 sq ft facility, specializing in crusty artisan breads, laminated pastries, and custom-formulated bakery solutions for hotel chains, restaurant groups, and institutional caterers. Advanced dough processing lines merge with hand-finishing stations to achieve both commercial scale and premium presentation standards, supported by a fleet of 12 refrigerated distribution vehicles ensuring same-day delivery across its 150km service radius. Strategic differentiation comes through its hybrid model balancing private-label production for national QSR brands (35% of output) with proprietary product lines maintained for regional clients. The 130-member workforce features specialized teams in product development, bu...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2018,
    '"',
    'Wholesale & Commercial Bakery Corp',
    '"',
    '"',
    130,
    3868722.00,
    889806.00,
    1083242.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expand certified organic production lines to capture growing demand in premium institutional markets. Expansion potential: Develop subscription-based bakery programs for cloud kitchens and virtual restaurant concepts.. Development area: Implement co-packing services for emerging food brands seeking federally compliant production facili',
    'active',
    true,
    '["/assets/listing-assets/listing-034-3715f3cf.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 61: Large-Scale Commercial Florist & Wholesaler
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Large-Scale Commercial Florist & Wholesaler',
    'Other',
    'Indonesia',
    'Banjarmasin',
    'The business operates as a leading commercial florist and wholesale supplier within Indonesia''s agriculture sector, leveraging over two decades of established operations since its 2004 founding. Specializing in large-scale production and distribution of premium cut flowers and foliage, it serves a diversified B2B client base including event planners, luxury hotels, corporate accounts, and retail florist networks nationwide. Core operations integrate climate-controlled greenhouse cultivation across multiple regional facilities with a centralized distribution hub, ensuring year-round production consistency. Proprietary post-harvest preservation protocols and cold chain logistics enable reliable delivery of perishable products to mainland customers within 24-hour windows. Market positioning is reinforced through strategic partnerships with transportation providers and preferential supplier agreements with key hospitality industry accounts. Operational infrastructure includes advanced ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2004,
    '"',
    'Large-Scale Commercial Florist & Wholesaler Corp',
    '"',
    '"',
    90,
    3658517.00,
    512192.00,
    409754.00,
    'New Ventures. "',
    'Growth opportunity: Establish export channels to neighboring Southeast Asian markets with underserved premium floral dem. Expansion potential: Develop digital ordering portal with real-time inventory tracking to enhance service tiers for exist. Development area: Expand value-added product lines through dried flower preservation or decorative botanical installat',
    'active',
    true,
    '["/assets/listing-assets/listing-034-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 62: Managed IT Services Provider (MSP)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Managed IT Services Provider (MSP)',
    'Other',
    'Indonesia',
    'Banjarmasin',
    'This established IT services provider has operated as a trusted partner for Indonesian businesses since 2004, delivering comprehensive managed IT solutions through a service contract model. The company maintains critical technology infrastructure for 150+ SMEs and mid-market enterprises across Jakarta, Surabaya, and emerging industrial regions, offering remote monitoring, cybersecurity management, cloud migration support, and 24/7 technical helpdesk services. A team of 27 certified professionals utilizes centralized management platforms to deliver proactive system maintenance, ensuring 98% client retention through rapid response times and customized service-level agreements. The operation holds strategic value as Indonesia''s digital transformation accelerates, with particular strength supporting manufacturers adopting Industry 4.0 systems and healthcare providers implementing electronic medical records. Buyers would inherit an institutionalized delivery framework, multi-year contra...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'Service contracts',
    2004,
    '"',
    'Managed IT Services Provider (MSP) Corp',
    '"',
    '"',
    27,
    818035.00,
    196328.00,
    196328.00,
    'Retirement. "',
    'Growth opportunity: Develop industry-specific service packages for underserved education and logistics sectors.. Expansion potential: Implement AI-powered predictive maintenance tools to reduce onsite service calls by 25-40%.. Development area: Expand cybersecurity revenue stream through managed detection services for new data localization reg',
    'active',
    true,
    '["/assets/listing-assets/listing-035-ad5c47a2.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 63: Custom Metal Fabrication & Welding
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Custom Metal Fabrication & Welding',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This Thailand-based enterprise operates as a specialized provider of precision metal fabrication services for industrial clients across Southeast Asia. Established in 2015, the company has developed robust capabilities in complex welding solutions, structural steel components, and custom machinery parts production. Its 120-member workforce combines traditional craftsmanship with advanced CNC machining and robotic welding systems to serve clients in construction, marine equipment manufacturing, and heavy machinery sectors. The business maintains strategic partnerships with regional raw material suppliers while operating from a 14,000 sqm facility equipped with ASME-certified pressure vessel production lines. Its value proposition centers on rapid prototyping abilities, strict adherence to international welding standards (AWS/ISO), and a project management system that ensures on-time delivery for both recurring orders and bespoke engineering projects. The company''s attractiveness ste...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    15000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2015,
    '"',
    'Custom Metal Fabrication & Welding Corp',
    '"',
    '"',
    120,
    10890366.00,
    1089036.00,
    871230.00,
    'New Ventures. "',
    'Growth opportunity: Expand value-added services through strategic partnerships offering on-site installation and lifecyc. Expansion potential: Implement AI-driven predictive maintenance systems to optimize equipment uptime across three-shift o. Development area: Develop dedicated production lines for renewable energy infrastructure components to capitalize on A',
    'active',
    true,
    '["/assets/listing-assets/listing-035-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 64: Property Maintenance & Handyman Services Corp.
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Property Maintenance & Handyman Services Corp.',
    'Other',
    'India',
    'Ahmedabad',
    'This established property maintenance provider has become a trusted partner for residential and commercial clients across urban and suburban India, addressing the growing demand for quality upkeep solutions in rapidly developing markets. The business delivers a diversified suite of handyman services through scheduled maintenance contracts, emergency repair dispatches, and specialized renovation projects. Core operations center on preventive maintenance programs for property managers and facility operators, complemented by reactive services for individual homeowners. A vertically integrated approach combines in-house skilled technicians (electrical, plumbing, carpentry) with vetted subcontractor networks for specialty trades. The 103-member workforce operates through regional service hubs using cloud-based dispatch systems and mobile workforce management tools, enabling efficient service coverage across multiple metropolitan areas. Customer retention is reinforced through annual serv...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Service contracts',
    2008,
    '"',
    'Property Maintenance & Handyman Services Corp. Corp',
    '"',
    '"',
    103,
    5178780.00,
    1139331.00,
    1398271.00,
    'Wealth Diversification. "',
    'Growth opportunity: Develop white-label maintenance programs for equipment manufacturers and warranty providers.. Expansion potential: Implement AI-driven predictive maintenance analytics to upsell targeted service packages.. Development area: Expand service footprint through strategic partnerships with real estate developers in emerging Tier',
    'active',
    true,
    '["/assets/listing-assets/listing-036-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 65: Supply Chain Management (SCM) Software
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Supply Chain Management (SCM) Software',
    'Other',
    'Malaysia',
    'Kota Kinabalu',
    'Operating at the intersection of digital innovation and logistics efficiency, this Malaysia-based SaaS company provides cutting-edge supply chain management solutions tailored for the transportation sector. The cloud-native platform offers real-time inventory tracking, route optimization algorithms, and predictive analytics tools designed specifically for Southeast Asia''s complex logistics networks. With a workforce of 82 technical and operational professionals, the business maintains a customer-centric development cycle, continuously refining its API-driven platform to address challenges like port congestion and cross-border documentation. Its vertical-specific approach has secured adoption by 40+ mid-sized freight forwarders and regional e-commerce fulfillment operators seeking modernized operations. The company''s asset-light model and containerized microservices architecture create a foundation for rapid feature deployment, while its compliance-focused design accommodates ASEAN...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'SaaS',
    2023,
    '"',
    'Supply Chain Management (SCM) Software Corp',
    '"',
    '"',
    82,
    8184537.00,
    1718752.00,
    1718753.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Expansion into cold chain monitoring through IoT sensor integrations for perishables logistics.. Expansion potential: Development of AI-assisted documentation processing to address regional customs complexity.. Development area: Untapped potential in Vietnam/Thailand markets where logistics digitalization initiatives are accele',
    'active',
    true,
    '["/assets/listing-assets/listing-037-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 66: Brewery with Regional Distribution
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Brewery with Regional Distribution',
    'Other',
    'India',
    'Hyderabad',
    'Operating at the intersection of tradition and modern brewing techniques, this established brewery has cultivated a strong presence in India''s growing craft beverage market through strategic B2B distribution partnerships. Specializing in producing premium beers for institutional clients, the company supplies hotels, restaurant chains, and regional distributors across multiple states from its centrally located production facility. The 100-member operational team maintains rigorous quality control processes while managing end-to-end operations including raw material sourcing, batch brewing, packaging, and cold chain logistics. A vertically integrated model allows direct management of critical processes from malt processing to fleet-based last-mile delivery, ensuring product consistency across its service territory. With fifteen years of market presence, the business has developed durable relationships with hospitality industry purchasers who value its reliable order fulfillment and a...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B Distribution',
    2009,
    '"',
    'Brewery with Regional Distribution Corp',
    '"',
    '"',
    100,
    8396266.00,
    1763215.00,
    923590.00,
    'Wealth Diversification. "',
    'Growth opportunity: Implementation of predictive analytics for inventory management and route optimization in distributi. Expansion potential: Expansion of distributor partnerships into adjacent states with developing hospitality sectors.. Development area: Untapped potential in premium canned/craft beer segments driven by India''s urban youth demographic.',
    'active',
    true,
    '["/assets/listing-assets/listing-038-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 67: Diagnostic Imaging Centers
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Diagnostic Imaging Centers',
    'Other',
    'India',
    'Kolkata',
    'This established diagnostic imaging services provider operates a network of advanced medical imaging centers across strategic locations in India, serving hospitals, specialty clinics, and healthcare networks since 2004. The business specializes in delivering high-quality MRI, CT scan, ultrasound, and X-ray services through a hub-and-spoke model that combines centralized radiologist expertise with localized patient access points. With 280 trained technicians and support staff, the company maintains morning-to-late-night operations across 15 facilities, utilizing cutting-edge 3T MRI machines and low-radiation CT scanners that meet international quality standards. Its core value proposition lies in providing rapid turnaround diagnostic reports to healthcare partners through a proprietary digital platform that integrates directly with hospital EMR systems. The operation demonstrates particular strength in serving corporate health checkup programs and multispecialty hospital chains throu...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    11000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Services',
    2004,
    '"',
    'Diagnostic Imaging Centers Corp',
    '"',
    '"',
    280,
    8609209.00,
    1635749.00,
    3271499.00,
    'Retirement. "',
    'Growth opportunity: Implement AI-powered preliminary screening tools to increase radiologist productivity and offer valu. Expansion potential: Develop specialized imaging protocols for emerging diagnostic needs in oncology and neurology to cap. Development area: Expand teleradiology capabilities to serve rural healthcare providers through mobile imaging units a',
    'active',
    true,
    '["/assets/listing-assets/listing-039-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 68: High-End Custom Home Builder
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'High-End Custom Home Builder',
    'Other',
    'Indonesia',
    'Bandung',
    'This established business operates as a premium residential construction specialist, delivering turnkey solutions for luxury properties across Indonesia''s growing high-net-worth market. Since 2017, the company has positioned itself as a trusted partner for discerning clients seeking architecturally distinctive homes that blend contemporary design with local craftsmanship traditions. Core operations revolve around complete project management from concept to completion, including site acquisition consultation, custom design development through in-house architectural teams, and precision construction using premium materials. The firm differentiates through its vertically integrated approach, maintaining direct oversight of skilled tradespeople while collaborating with trusted subcontractor networks for specialized installations. With 50 full-time professionals managing operations, the business sustains multiple concurrent projects through standardized quality control protocols and pro...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2C Construction Services',
    2017,
    '"',
    'High-End Custom Home Builder Corp',
    '"',
    '"',
    50,
    6484789.00,
    648478.00,
    518783.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement advanced client experience tools including virtual reality walkthroughs and AI-assisted de. Expansion potential: Develop standardized prefabricated elements for frequently requested architectural features to reduc. Development area: Expand service offerings into complementary luxury sectors through villa renovation packages and pre',
    'active',
    true,
    '["/assets/listing-assets/listing-040-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 69: Furniture & Home Goods Retail Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Furniture & Home Goods Retail Chain',
    'Other',
    'Indonesia',
    'Bandung',
    'This established furniture and home goods retailer operates a network of strategically located showrooms across Indonesia complemented by a growing e-commerce platform. Since 2007, the business has cultivated strong brand recognition through its curated selection of modern furnishings that balance contemporary design with local cultural preferences. Core operations focus on maintaining lean inventory through just-in-time logistics partnerships while operating a centralized distribution hub that serves both retail locations and direct-to-consumer deliveries. The company employs a 50-member team skilled in visual merchandising, customer experience management, and supply chain coordination. Key differentiators include exclusive regional distribution rights for several international homeware brands and a proprietary customer preference database developed through 15+ years of market operations. This infrastructure positions the business as an attractive platform for buyers seeking to cap...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'Retail Sales',
    2007,
    '"',
    'Furniture & Home Goods Retail Chain Corp',
    '"',
    '"',
    50,
    1312886.00,
    328221.00,
    262577.00,
    'Retirement. "',
    'Growth opportunity: Expand B2B sales channel targeting Indonesia''s booming hospitality and co-working space sectors.. Expansion potential: Implement enhanced augmented reality tools to boost online conversion rates for big-ticket furniture. Development area: Develop private label product lines to capture higher margins in fast-growing decor accessory catego',
    'active',
    true,
    '["/assets/listing-assets/listing-041-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 70: Plastic Injection Molding Facility
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Plastic Injection Molding Facility',
    'Other',
    'India',
    'Kolkata',
    'This established plastic injection molding operation has maintained a competitive position in India''s manufacturing sector since 2004, specializing in high-volume production of precision components for industrial clients. The company serves global OEMs and domestic manufacturers through custom tooling design and production of complex plastic parts for automotive, consumer durables, and medical equipment sectors. A workforce of 172 skilled technicians operates advanced hydraulic and electric presses across three dedicated production lines, supported by in-house mold maintenance and repair capabilities. Strategic advantages include ISO-certified quality management systems, JIT delivery programs for key accounts, and proprietary process documentation that ensures consistent output quality. The facility''s established vendor network for polymer resins and technical plastics provides cost stability, while long-term service contracts with 60% of clients demonstrate strong operational cre...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    12000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2004,
    '"',
    'Plastic Injection Molding Facility Corp',
    '"',
    '"',
    172,
    8630348.00,
    1553462.00,
    1320444.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement predictive maintenance systems and IIoT-enabled process monitoring to reduce machine downt. Expansion potential: Develop proprietary polymer blends using in-house compounding expertise to capture higher-margin spe. Development area: Expand into medical device manufacturing through cleanroom certification and bio-compatible material',
    'active',
    true,
    '["/assets/listing-assets/listing-042-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 71: Intermodal Freight Transport
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Intermodal Freight Transport',
    'Other',
    'Indonesia',
    'Bandung',
    'This rapidly scaling intermodal logistics operator has established itself as a critical link in Indonesia''s domestic and international supply chains since its 2023 launch. The company specializes in coordinating seamless cargo transfers between container ships, rail networks, and trucking fleets across Java and Sumatra, leveraging strategic partnerships with multiple port authorities and regional transport providers. Its tech-enabled operation utilizes a proprietary routing algorithm that optimizes container utilization while meeting stringent delivery timelines for industrial clients. The business maintains long-term service contracts with 14 multinational manufacturers and commodity exporters, supported by a workforce of 85 logistics specialists managing round-the-clock operations from three regional hubs. Buyers would inherit an asset-light model with established protocols for customs clearance, hazardous materials handling, and cross-dock coordination - all critical capabilitie...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2023,
    '"',
    'Intermodal Freight Transport Corp',
    '"',
    '"',
    85,
    6419414.00,
    1604853.00,
    1283883.00,
    'New Ventures. "',
    'Growth opportunity: Develop dedicated cold chain capabilities for growing pharmaceutical and perishables sectors.. Expansion potential: Expand cross-border coordination with new Malaysia-Indonesia joint logistics initiatives.. Development area: Implement IoT container tracking systems to enable premium monitored shipping services.',
    'active',
    true,
    '["/assets/listing-assets/listing-043-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 72: E-commerce Fulfillment Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'E-commerce Fulfillment Center',
    'Other',
    'Thailand',
    'Chiang Mai',
    'The business operates a strategically positioned e-commerce fulfillment hub serving enterprises across Southeast Asia. Established in 2007, this Thailand-based operation provides integrated warehousing, inventory management, and last-mile delivery solutions to mid-sized online retailers and cross-border commerce platforms. Its 130-strong workforce manages a technology-enabled infrastructure with multiple temperature-controlled zones, automated sorting systems, and real-time shipment tracking capabilities that currently process approximately 12,000 daily orders across consumer electronics, beauty products, and lifestyle goods categories. The company maintains long-term partnerships with major regional logistics carriers and holds certifications for hazardous materials handling, positioning it to service specialized product verticals. Continuous process optimization through warehouse management system upgrades and staff cross-training programs has maintained fulfillment accuracy rates...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2007,
    '"',
    'E-commerce Fulfillment Center Corp',
    '"',
    '"',
    130,
    8130496.00,
    975659.00,
    975660.00,
    'Wealth Diversification. "',
    'Growth opportunity: Implement AI-driven demand forecasting tools to optimize clients'' inventory prepositioning strategie. Expansion potential: Develop white-label returns management system addressing regional merchants'' growing reverse logisti. Development area: Expand value-added services through partnerships with packaging suppliers and customs brokerage firm',
    'active',
    true,
    '["/assets/listing-assets/listing-044-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 73: Human Resources (HR) Tech Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Human Resources (HR) Tech Platform',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This company provides a cloud-based human resources management platform tailored for Thailand''s growing SME sector and enterprise clients. Operating on a SaaS model, the business delivers end-to-end HR automation tools including payroll processing, attendance tracking, performance management, and compliance modules specifically configured for Thailand''s labor regulations. The platform serves 420+ active clients through web and mobile interfaces, with particular traction among mid-sized manufacturing firms and regional service providers requiring localized solutions. A hybrid team of 58 developers, customer success specialists, and HR consultants supports operations through remote work infrastructure established post-launch. Strategic value stems from its first-mover advantage in Thai-language HR tech, API integrations with popular regional accounting software, and a 92% annual customer retention rate driven by personalized onboarding workflows. The business maintains defensibility...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    11000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'SaaS',
    2022,
    '"',
    'Human Resources (HR) Tech Platform Corp',
    '"',
    '"',
    58,
    11518566.00,
    1382227.00,
    1382228.00,
    'New Ventures. "',
    'Growth opportunity: Expansion into adjacent talent management verticals through strategic partnerships with regional job. Expansion potential: Underutilized data assets could enable predictive analytics for workforce planning and employee rete. Development area: Untapped potential in Vietnam and Indonesia through localized versioning of existing compliance modu',
    'active',
    true,
    '["/assets/listing-assets/listing-045-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 74: Structural Engineering Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Structural Engineering Firm',
    'Other',
    'Indonesia',
    'Banjarmasin',
    'The business operates as a structural engineering consultancy specializing in commercial and infrastructure projects across Indonesia’s rapidly growing construction sector. Since 2010, it has delivered comprehensive design solutions including seismic analysis, foundation engineering, and building code compliance services to contractors, developers, and government entities. Core operations involve a 65-member team of certified engineers and project managers handling site evaluations, CAD modeling, and construction oversight through long-term service contracts. The company maintains strategic positioning as a technical partner for complex projects in earthquake-prone regions, leveraging localized expertise in regional building codes and material specifications. Its value proposition centers on combining international engineering standards with deep knowledge of Indonesian regulatory frameworks and local construction practices. Key operational systems include cloud-based project manage...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B Service Contracts',
    2010,
    '"',
    'Structural Engineering Firm Corp',
    '"',
    '"',
    65,
    4458488.00,
    936282.00,
    936282.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implement AI-assisted load calculation tools to increase design throughput and capture smaller-scale. Expansion potential: Develop modular structural systems division to capitalize on Indonesia’s growing prefabricated housi. Development area: Expand service footprint to underserved eastern provinces where new infrastructure development budge',
    'active',
    true,
    '["/assets/listing-assets/listing-046-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 75: Heavy Haulage & Trucking Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Heavy Haulage & Trucking Company',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This established heavy haulage and trucking enterprise provides critical logistics solutions for industrial and commercial clients across Thailand''s key economic regions. Operating a modern fleet of specialized vehicles including low-loaders, flatbeds, and equipment transporters, the company facilitates the movement of oversized machinery, construction materials, and industrial components for sectors spanning infrastructure development, energy projects, and manufacturing operations. The business has developed robust operational protocols for complex logistics challenges, handling route planning, regulatory compliance, and cargo security through a combination of experienced personnel and customized tracking systems. With strategic positioning near major industrial zones and port facilities, the organization serves as a vital link in regional supply chains, maintaining long-term partnerships with construction firms, plant operators, and engineering contractors. The company''s value p...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B logistics services',
    2015,
    '"',
    'Heavy Haulage & Trucking Company Corp',
    '"',
    '"',
    85,
    10473726.00,
    1990007.00,
    1691507.00,
    'Wealth Diversification. "',
    'Growth opportunity: Implementation of telematics systems to enable dynamic pricing models and fuel efficiency gains. Expansion potential: Expansion into integrated logistics services through strategic partnerships with warehousing provide. Development area: Development of digital freight matching platform to capture spot market demand from SMEs',
    'active',
    true,
    '["/assets/listing-assets/listing-047-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 76: Surgical Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Surgical Center',
    'Other',
    'Indonesia',
    'Bandung',
    'This established surgical center has operated as a key healthcare provider in Indonesia since 2002, specializing in advanced outpatient procedures through institutional service contracts. The facility partners with hospitals, physician networks, and insurance providers to deliver orthopedic, ophthalmologic, and minimally invasive surgeries through modern operating theaters staffed by 165 clinical and administrative professionals. Its value proposition centers on turnkey surgical capacity for healthcare organizations needing to expand procedural throughput without capital investments. The operation maintains long-term contracts with 18 regional hospitals and 4 national health insurers, with 86% of revenue recurring through multi-year agreements. A buyer would inherit an institutional-grade facility with accreditation from Indonesia''s Healthcare Facility Accreditation Committee and ISO 9001 certification for operational quality. Strategic advantages include advanced anesthesia capabi...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    11000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'Service contracts',
    2002,
    '"',
    'Surgical Center Corp',
    '"',
    '"',
    165,
    12311482.00,
    2339181.00,
    2339182.00,
    'Retirement. "',
    'Growth opportunity: Develop specialty surgical packages for emerging procedures like robotic-assisted surgeries.. Expansion potential: Implement telemedicine pre-op assessments to increase geographical catchment area.. Development area: Expand contract services to corporate wellness programs and medical tourism operators.',
    'active',
    true,
    '["/assets/listing-assets/listing-048-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 77: Air Cargo Handling Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Air Cargo Handling Service',
    'Other',
    'India',
    'Ahmedabad',
    'Operating at the intersection of global trade acceleration and supply chain optimization, this air cargo handling enterprise provides critical logistics infrastructure at a major Indian aviation hub. Specializing in time-sensitive freight management, the company offers comprehensive ground handling services including aircraft loading system operations, customs brokerage, dangerous goods certification, and temperature-controlled storage solutions for pharmaceutical shipments. With dedicated teams operating across three shifts, the business maintains 24/7 coordination between airline partners, freight forwarders, and regulatory authorities. Its integrated digital platform enables real-time cargo tracking, automated documentation processing, and predictive capacity planning tools for clients in automotive, electronics, and e-commerce sectors. The operation''s strategic positioning near New Delhi''s international airport capitalizes on India''s growing status as an Asia-Pacific transshi...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2023,
    '"',
    'Air Cargo Handling Service Corp',
    '"',
    '"',
    140,
    4415744.00,
    750676.00,
    1192250.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of AI-powered predictive logistics modules to offer route optimization as value-added. Expansion potential: Geographic diversification via partnerships with regional airports under India''s UDAN cargo scheme t. Development area: Expansion into specialized cargo verticals through certification for perishables handling and invest',
    'active',
    true,
    '["/assets/listing-assets/listing-049-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 78: Specialty Pharmaceutical Distributor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Specialty Pharmaceutical Distributor',
    'Other',
    'Malaysia',
    'Kuala Lumpur',
    'Established business with strong growth potential.',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    1999,
    '"',
    'Specialty Pharmaceutical Distributor Corp',
    '"',
    '"',
    17,
    3364405.00,
    841101.00,
    841101.00,
    'Retirement. "',
    'Multiple growth opportunities available',
    'active',
    true,
    '["/assets/listing-assets/listing-050-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 79: Forensic Accounting & Investigation Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Forensic Accounting & Investigation Agency',
    'Other',
    'Thailand',
    'Chiang Mai',
    'Established business with strong growth potential.',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B',
    1996,
    '"',
    'Forensic Accounting & Investigation Agency Corp',
    '"',
    '"',
    35,
    3449128.00,
    586351.00,
    586352.00,
    'Lifestyle Change. "',
    'Multiple growth opportunities available',
    'active',
    true,
    '["/assets/listing-assets/listing-051-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 80: Private Jet Charter Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Private Jet Charter Company',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This Thailand-based private jet charter company operates a digital platform connecting clients with on-demand air travel solutions, leveraging the country’s strategic position as a gateway to Southeast Asia’s luxury tourism and business corridors. Since 2009, the business has developed a streamlined model combining proprietary booking software with vetted regional aircraft operators, serving high-net-worth leisure travelers, corporate groups, and diplomatic clients. Daily operations center on a lean, tech-forward team managing flight coordination, crew logistics, and 24/7 customer support through a centralized system that handles route optimization, regulatory compliance, and partner operator payments. The platform differentiates itself through curated access to underutilized charter capacity at regional airports and exclusive partnerships offering bespoke cabin configurations. With a recurring base of multinational corporations and VIP travel agencies, the company capitalizes on Th...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Online platform',
    2009,
    '"',
    'Private Jet Charter Company Corp',
    '"',
    '"',
    8,
    523838.00,
    110005.00,
    110006.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement AI-driven dynamic pricing tools to optimize revenue from repositioning flights and seasona. Expansion potential: Develop corporate subscription packages targeting mid-market firms expanding regional operations in . Development area: Expand interline agreements with commercial airlines to capture premium-class travelers needing regi',
    'active',
    true,
    '["/assets/listing-assets/listing-052-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 81: Medical Billing and Coding Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Medical Billing and Coding Service',
    'Other',
    'India',
    'Kolkata',
    'This established medical billing and coding provider delivers comprehensive back-office solutions for healthcare organizations across outpatient clinics, diagnostic centers, and specialized medical practices. Operating through a hub-and-spoke model with centralized operations in India, the company combines deep regulatory expertise with advanced coding software to process claims, manage denials, and optimize revenue cycles for international clients. A team of 30 certified professionals supports clients through dedicated account managers, multilingual capabilities, and HIPAA-compliant workflows adapted for both U.S. and emerging market requirements. The business maintains particularly strong positioning in mid-sized healthcare providers seeking cost-effective outsourcing without sacrificing claims accuracy, evidenced by 85% client retention over five years. Strategic acquirers would value its entrenched relationships with 120+ active accounts, proprietary audit trail systems ensuring...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    600000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    1999,
    '"',
    'Medical Billing and Coding Service Corp',
    '"',
    '"',
    30,
    552166.00,
    55216.00,
    27608.00,
    'New Ventures. "',
    'Growth opportunity: Pursue strategic partnerships with EHR vendors to embed coding services into platform workflows.. Expansion potential: Leverage existing infrastructure to add medical transcription services for current client base.. Development area: Develop AI-assisted coding audit tools to expand into higher-margin compliance consulting services.',
    'active',
    true,
    '["/assets/listing-assets/listing-053-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 82: Aerospace Component Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Aerospace Component Manufacturer',
    'Other',
    'India',
    'Jaipur',
    'Operating at the forefront of aerospace engineering since 1998, this established manufacturer specializes in precision components for commercial aircraft, defense systems, and space exploration equipment. The business maintains AS9100D and NADCAP certifications, underscoring its adherence to rigorous aerospace quality standards while serving global OEMs and tier-1 suppliers through long-term contractual agreements. A vertically integrated production ecosystem combines CNC machining, advanced forging technologies, and specialty welding capabilities within a 142-member technical workforce supervised by metallurgical experts. Strategic positioning within India''s manufacturing corridor enables cost-competitive production while maintaining proximity to raw material suppliers and major seaport logistics hubs. The company''s value proposition centers on three pillars: proprietary machining techniques that reduce component weight by 12-18% vs. industry averages, accelerated prototyping ser...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    16000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    1998,
    '"',
    'Aerospace Component Manufacturer Corp',
    '"',
    '"',
    142,
    11338771.00,
    1587427.00,
    1269942.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Leverage India''s PLI scheme incentives to establish dedicated MRO division for regional aircraft fle. Expansion potential: Develop robotic process automation for secondary machining operations to increase throughput by 25-3. Development area: Expand into adjacent defense electronics packaging through existing metallurgical expertise and clea',
    'active',
    true,
    '["/assets/listing-assets/listing-054-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 83: International Tax & Audit Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'International Tax & Audit Firm',
    'Other',
    'Indonesia',
    'Medan',
    'Operating at the forefront of Indonesia''s corporate services sector, this established firm delivers comprehensive tax advisory and audit solutions to domestic enterprises and multinational corporations. With specialized teams managing cross-border compliance, transfer pricing documentation, and regulatory reporting, the business has become a critical partner for organizations navigating Indonesia''s complex fiscal landscape. Its operational backbone combines senior practitioners with advanced workflow automation tools, maintaining rigorous quality control across 850+ active client engagements. The company''s defensible market position stems from rare dual accreditation for both Indonesian GAAP and IFRS reporting standards, coupled with long-term contracts covering 78% of its revenue base. Strategic buyers would value the embedded institutional knowledge in emerging market taxation protocols and the untapped potential to expand advisory services across Southeast Asia''s growing mult...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    1995,
    '"',
    'International Tax & Audit Firm Corp',
    '"',
    '"',
    145,
    11938249.00,
    2507032.00,
    2507032.00,
    'Wealth Diversification. "',
    'Growth opportunity: Establish satellite offices in secondary Indonesian economic hubs like Surabaya and Makassar to capt. Expansion potential: Leverage existing multinational relationships to introduce ESG reporting advisory services for Jakar. Development area: Develop cloud-based client portal to monetize real-time compliance analytics and predictive regulato',
    'active',
    true,
    '["/assets/listing-assets/listing-055-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 84: Reverse Logistics & Returns Processing
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Reverse Logistics & Returns Processing',
    'Other',
    'Vietnam',
    'Hanoi',
    'This company operates as a specialized reverse logistics provider serving manufacturers and retailers across Southeast Asia. Since 1998, the business has developed comprehensive returns processing capabilities including product inspection, refurbishment, and inventory reintegration services. Its Vietnam-based facilities handle electronic components, consumer appliances, and automotive parts through a combination of manual quality control stations and automated sorting systems, processing approximately 12,000 units weekly. The operation employs 80 skilled technicians and logistics coordinators working across three shifts, supported by a customized warehouse management system that tracks items from receipt through final disposition. Key differentiators include same-cycle processing that returns 68% of items to salable condition within 72 hours, and API integrations with major enterprise resource planning platforms. Clients benefit from reduced inventory write-offs and compliance with ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    1998,
    '"',
    'Reverse Logistics & Returns Processing Corp',
    '"',
    '"',
    80,
    2060961.00,
    247315.00,
    247315.00,
    'New Ventures. "',
    'Growth opportunity: Implement machine vision systems to automate initial product grading stages.. Expansion potential: Replicate operational model in emerging Philippines manufacturing corridors.. Development area: Expand value-added services into warranty fulfillment and certified pre-owned programs.',
    'active',
    true,
    '["/assets/listing-assets/listing-056-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 85: Corporate Law Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Corporate Law Firm',
    'Other',
    'India',
    'Jaipur',
    'Operating as a specialized legal services provider since 2019, this corporate law firm delivers comprehensive B2B solutions to domestic and international clients across India''s major commercial hubs. The business focuses on mid-market corporate clients requiring transactional support, compliance advisory, and dispute resolution services, with particular expertise in cross-border M&A documentation, commercial contract structuring, and regulatory adherence frameworks. A team of 40 legal professionals and paralegals supports operations through centralized practice groups specializing in corporate governance, intellectual property, and labor law – sectors demonstrating consistent demand growth in India''s evolving regulatory landscape. Strategic positioning combines traditional legal advisory with tech-enabled service delivery, utilizing secure client portals for document sharing and AI-assisted contract review tools to enhance turnaround times. The firm maintains strong relationships ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B Services',
    2019,
    '"',
    'Corporate Law Firm Corp',
    '"',
    '"',
    40,
    4274900.00,
    983227.00,
    983227.00,
    'New Ventures. "',
    'Growth opportunity: Expand regional footprint through satellite offices in emerging Tier-2 cities demonstrating 15%+ ann. Expansion potential: Implement subscription-based legal health check services leveraging existing compliance audit framew. Development area: Develop international arbitration practice to capture growing cross-border commercial disputes in In',
    'active',
    true,
    '["/assets/listing-assets/listing-057-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 86: Telehealth Platform Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Telehealth Platform Provider',
    'Other',
    'India',
    'Chennai',
    'Operating at the intersection of healthcare accessibility and digital innovation, this SaaS-based telehealth platform has served as a critical infrastructure provider in India''s evolving health ecosystem since 1995. The business operates a white-label solution enabling hospitals, clinics, and insurance providers to deliver HIPAA-compliant virtual consultations, automated prescription management, and integrated diagnostic data sharing. Its platform supports 22 regional languages and integrates with 40+ major EHR systems, processing approximately 1.2 million monthly consultations through web and mobile interfaces. The company maintains strategic partnerships with 650+ healthcare institutions and corporate wellness programs, supported by a 75-member team specializing in cloud architecture, medical compliance, and customer success management. A tiered subscription model creates predictable recurring revenue while maintaining 93% client retention through continuous feature updates align...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'SaaS',
    1995,
    '"',
    'Telehealth Platform Provider Corp',
    '"',
    '"',
    75,
    4419081.00,
    928007.00,
    928007.00,
    'Lifestyle Change. "',
    'Growth opportunity: Expansion of API integrations with Ayushman Bharat Digital Mission infrastructure to position as gov. Expansion potential: Monetization of aggregated anonymized data through partnerships with clinical research organizations. Development area: Untapped potential in chronic disease management modules for diabetes and hypertension care pathways',
    'active',
    true,
    '["/assets/listing-assets/listing-058-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 87: Inventory Management & Auditing Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Inventory Management & Auditing Firm',
    'Other',
    'India',
    'Bangalore',
    'Established in 2019, this company provides specialized inventory management and auditing solutions to manufacturing, retail, and logistics enterprises across India. The business combines on-site auditing teams with cloud-based tracking software to help clients optimize warehouse operations, reduce shrinkage, and maintain compliance with inventory reporting standards. Day-to-day operations center around scheduled auditing cycles, real-time stock monitoring through IoT-enabled devices, and customized reporting dashboards that integrate with clients'' existing ERP systems. With 240 trained professionals organized into regional service pods, the company maintains service contracts with 85+ mid-sized and large enterprises, demonstrating particular strength in automotive parts suppliers and pharmaceutical distributors. The hybrid service model blending physical audits with digital tools creates a defensible market position, while a 92% client retention rate over three years underscores op...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    14000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B Service Contracts',
    2019,
    '"',
    'Inventory Management & Auditing Firm Corp',
    '"',
    '"',
    240,
    9573340.00,
    2010401.00,
    2010401.00,
    'New Ventures. "',
    'Growth opportunity: Implement mobile auditing suites to capture underserved SME market through streamlined, cost-effecti. Expansion potential: Expand blockchain-based audit trail solutions for export-oriented clients requiring cross-border com. Development area: Develop predictive analytics module leveraging historical audit data to offer clients inventory fore',
    'active',
    true,
    '["/assets/listing-assets/listing-059-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 88: Contract Research & Manufacturing (CRAMS) for Pharma
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Contract Research & Manufacturing (CRAMS) for Pharma',
    'Other',
    'India',
    'Chennai',
    'The business operates as a specialized Contract Research and Manufacturing Services (CRAMS) provider within the global pharmaceutical sector, offering end-to-end solutions from drug discovery to commercial production. Established in 2000, this India-based company maintains modern facilities compliant with USFDA, EMA, and WHO standards, serving multinational pharmaceutical firms and emerging biotech companies through a B2B model. Core activities include API synthesis, formulation development, analytical testing, and secondary packaging, supported by a 135-member team of chemists, process engineers, and quality assurance professionals. Its operational framework combines validated manufacturing systems with dedicated project management teams that coordinate multi-phase client engagements. Strategic value stems from two decades of technical documentation expertise, a 92% client retention rate across three regulatory cycles, and infrastructure capable of handling complex molecules. The c...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Services',
    2000,
    '"',
    'Contract Research & Manufacturing (CRAMS) for Pharma Corp',
    '"',
    '"',
    135,
    9471687.00,
    1515469.00,
    1515470.00,
    'Retirement. "',
    'Growth opportunity: Develop turnkey regulatory submission packages as value-added service for mid-sized biopharma client. Expansion potential: Implement predictive analytics across supply chain operations to optimize raw material inventory tur. Development area: Expand containment capabilities for antibody-drug conjugates and oligonucleotides to capture emergin',
    'active',
    true,
    '["/assets/listing-assets/listing-060-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 89: Intellectual Property (IP) Law Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Intellectual Property (IP) Law Firm',
    'Other',
    'Thailand',
    'Khon Kaen',
    'Positioned as a specialist provider in Thailand''s legal sector, this established intellectual property law firm delivers comprehensive protection and advisory services for domestic and international clients. Since 2004, the business has cultivated expertise in patent registration, trademark portfolio management, and IP litigation support, operating through a team of 55 specialized legal professionals. The firm serves corporate clients across manufacturing, technology, and consumer goods sectors, with particular strength in supporting foreign enterprises navigating Thailand''s complex regulatory environment. A technology-enhanced workflow combines proprietary case management systems with multilingual client portals, enabling efficient handling of regional IP filings through partnerships with ASEAN counterpart firms. Market differentiation stems from dual capabilities in both enforcement defense strategies and proactive IP commercialization guidance, particularly valued by clients in...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2004,
    '"',
    'Intellectual Property (IP) Law Firm Corp',
    '"',
    '"',
    55,
    6842108.00,
    889474.00,
    889474.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Expand alternative dispute resolution capabilities to capture growing regional IP arbitration demand. Expansion potential: Implement subscription-based monitoring programs for trademark renewals and infringement detection.. Development area: Develop comprehensive IP valuation services for merger/acquisition support in technology-driven indu',
    'active',
    true,
    '["/assets/listing-assets/listing-061-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 90: Biotechnology Research Lab
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Biotechnology Research Lab',
    'Other',
    'India',
    'Chennai',
    'Operating at the intersection of cutting-edge science and commercial application, this biotechnology enterprise has established itself as a specialized research partner for pharmaceutical developers and healthcare institutions. With modern laboratory facilities strategically located in India''s growing biotech corridor, the company focuses on analytical testing services, molecular diagnostics development, and customized bioinformatics solutions. Its core operational framework combines advanced genomic sequencing capabilities with AI-assisted data interpretation tools, serving as a critical support system for clinical trial management and therapeutic innovation. The business maintains strategic partnerships with 45+ domestic and international clients through multi-year service agreements, demonstrating particular expertise in oncology research and rare disease biomarker identification. A vertically integrated operational model encompassing sample processing, data generation, and regu...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    12000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2021,
    '"',
    'Biotechnology Research Lab Corp',
    '"',
    '"',
    125,
    8326771.00,
    1915157.00,
    1915157.00,
    'Retirement. "',
    'Growth opportunity: Develop agricultural biotechnology vertical leveraging existing genomic sequencing infrastructure fo. Expansion potential: Implement machine learning modules to enhance predictive modeling in personalized treatment recommen. Development area: Expand companion diagnostic co-development programs with mid-sized pharmaceutical manufacturers in S',
    'active',
    true,
    '["/assets/listing-assets/listing-062-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 91: Genetic Testing Laboratory
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Genetic Testing Laboratory',
    'Other',
    'Indonesia',
    'Bandung',
    'Operating as a specialized provider in Indonesia’s healthcare sector, this genetic testing laboratory delivers advanced diagnostic solutions to medical institutions and wellness organizations. The company focuses on comprehensive DNA analysis services, including hereditary disease risk assessments, pharmacogenomic testing, and personalized wellness profiling. Through automated workflows and partnerships with regional sample collection centers, the business maintains a seamless operation that serves hospitals, private clinics, and corporate health programs nationwide. A team of 22 skilled professionals oversees molecular diagnostics, bioinformatics analysis, and client relationship management, supported by Next-Generation Sequencing technology and ISO 15189-accredited protocols. The laboratory’s established repute stems from its ability to combine clinical-grade precision with scalable B2B service models, positioning it as a critical partner in Indonesia’s growing precision medicine ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B',
    2014,
    '"',
    'Genetic Testing Laboratory Corp',
    '"',
    '"',
    22,
    1089469.00,
    196104.00,
    156883.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implement AI-driven data interpretation tools to enhance report customization and client-facing anal. Expansion potential: Expand test menu into underpenetrated areas like prenatal genetic screening and agricultural biotech. Development area: Introduce direct-to-consumer testing options through white-label partnerships with telehealth platfo',
    'active',
    true,
    '["/assets/listing-assets/listing-063-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 92: Power Generation Equipment Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Power Generation Equipment Manufacturer',
    'Other',
    'Thailand',
    'Khon Kaen',
    'This enterprise operates as a specialized manufacturer of power generation systems, serving industrial and commercial clients across Southeast Asia. Established in 2005, the business has evolved into a trusted provider of customized energy solutions tailored to mining operations, manufacturing facilities, and regional utility providers. Its core operations focus on engineering gas/diesel generators, turbine systems, and modular power plants, complemented by ongoing maintenance contracts that ensure long-term client relationships. The company maintains strategic advantages through ISO-certified production facilities near Bangkok, a technical team comprising 35% of its 85-person workforce, and established partnerships with component suppliers across ASEAN markets. Its position as a domestic manufacturer enables competitive lead times compared to international competitors while meeting strict regional certification standards. The business demonstrates particular appeal through its mix ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2005,
    '"',
    'Power Generation Equipment Manufacturer Corp',
    '"',
    '"',
    85,
    8471649.00,
    2117912.00,
    2117912.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expand turnkey energy solutions to neighboring Mekong region countries with underdeveloped power inf. Expansion potential: Implement IoT-enabled predictive maintenance platforms to enhance service contract profitability.. Development area: Develop solar-hybrid power systems to capitalize on Thailand''s 30% renewable energy target by 2037.',
    'active',
    true,
    '["/assets/listing-assets/listing-064-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 93: Industrial Packaging Solutions
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Industrial Packaging Solutions',
    'Other',
    'India',
    'Ahmedabad',
    'Established in 2009, this industrial packaging enterprise operates as a critical supply chain partner for manufacturing sectors across India, specializing in customized protective solutions for heavy machinery and bulk material transportation. The company designs and fabricates steel-strap reinforced wooden crates, polymer-based composite containers, and anti-corrosion vapor barrier systems, serving clients in automotive components, industrial machinery exports, and chemical processing sectors. With strategically located production facilities near major industrial corridors, the business combines workshop-based manufacturing with onsite packaging services, enabling just-in-time delivery for time-sensitive export consignments. A team of 50 skilled craftsmen and logistics specialists maintains relationships with 120+ active B2B clients through account-based sales strategies and annual service contracts. The operation demonstrates particular strength in serving multinational corporatio...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B',
    2009,
    '"',
    'Industrial Packaging Solutions Corp',
    '"',
    '"',
    50,
    1237818.00,
    136159.00,
    235185.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implement e-commerce portal for standardized packaging product lines targeting mid-sized manufacture. Expansion potential: Develop IoT-enabled smart packaging solutions with embedded sensors for real-time shipment condition. Development area: Expand service offerings into reusable packaging systems aligned with circular economy mandates in E',
    'active',
    true,
    '["/assets/listing-assets/listing-065-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 94: Assisted Living Facility Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Assisted Living Facility Operator',
    'Other',
    'Indonesia',
    'Bandung',
    'Operating in Indonesia''s senior care sector since 1996, this established assisted living provider delivers comprehensive residential care through purpose-built facilities across multiple regions. The business maintains 24/7 operational capabilities with a 92-member clinical and support team, offering medication management, mobility assistance, and personalized wellness programs. Its service contract model creates recurring revenue streams through multi-year agreements with residents'' families, supplemented by partnerships with regional health insurers. As Indonesia''s elderly population grows at 3.8% annually, the company leverages two decades of operational expertise to serve middle-to-upper-income families seeking culturally attuned care solutions. Facilities feature dementia-friendly designs, communal activity hubs, and preventive health screening capabilities that distinguish services from basic retirement homes. A centralized training institute ensures consistent care standar...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Service contracts',
    1996,
    '"',
    'Assisted Living Facility Operator Corp',
    '"',
    '"',
    92,
    5483755.00,
    658050.00,
    658051.00,
    'Lifestyle Change. "',
    'Growth opportunity: Expand into Indonesia''s secondary cities where senior care infrastructure remains underdeveloped.. Expansion potential: Implement IoT-enabled monitoring systems to enhance care efficiency and premium service tiers.. Development area: Develop hybrid care models combining residential services with outpatient rehabilitation programs.',
    'active',
    true,
    '["/assets/listing-assets/listing-066-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 95: High-End Interior Design Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'High-End Interior Design Firm',
    'Other',
    'Indonesia',
    'Medan',
    'Positioned as a leading authority in luxury spatial solutions, this established Indonesian interior design practice delivers tailored creative services to commercial clients across the hospitality, corporate, and premium retail sectors. With two decades of operational history, the business has cultivated a reputation for executing large-scale projects that blend functional sophistication with culturally nuanced aesthetics. Core offerings encompass comprehensive design packages including space planning, material specification, custom furnishings, and lighting design – supported by an in-house team of 70 professionals spanning architects, CAD technicians, and project managers. The firm maintains strategic partnerships with regional artisans and premium material suppliers, enabling execution of high-specification interiors meeting international standards while retaining distinct local design sensibilities. Key differentiators include a vertically integrated project delivery system comb...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Service Model',
    2003,
    '"',
    'High-End Interior Design Firm Corp',
    '"',
    '"',
    70,
    12082755.00,
    2537378.00,
    2537379.00,
    'Retirement. "',
    'Growth opportunity: Expand cross-selling opportunities through strategic partnerships with architecture firms and proper. Expansion potential: Develop standardized design packages targeting mid-market entrants seeking premium branding through . Development area: Implement augmented reality visualization tools to enhance client presentations and remote collabora',
    'active',
    true,
    '["/assets/listing-assets/listing-067-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 96: Water Treatment & Purification System Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Water Treatment & Purification System Manufacturer',
    'Other',
    'India',
    'Bangalore',
    'The business operates as a specialized manufacturer of industrial water treatment and purification systems, serving clients across India''s pharmaceutical, food processing, and municipal infrastructure sectors. Established in 2009, this enterprise combines advanced membrane filtration technology with customized engineering solutions to address critical water quality challenges. Its production facilities house automated assembly lines for reverse osmosis systems, electro-deionization units, and ultrafiltration modules, supported by in-house R&D capabilities for client-specific adaptations. A workforce of 125 technical staff maintains strong client relationships through turnkey project execution – from system design and installation to ongoing maintenance contracts. The company differentiates itself through ISO-certified manufacturing processes, rapid prototyping abilities for bespoke solutions, and strategic partnerships with raw material suppliers. With India''s water treatment equi...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2009,
    '"',
    'Water Treatment & Purification System Manufacturer Corp',
    '"',
    '"',
    125,
    4519291.00,
    949051.00,
    949051.00,
    'New Ventures. "',
    'Growth opportunity: Leverage existing certifications to pursue government tenders for smart city water infrastructure pr. Expansion potential: Expand into adjacent wastewater recovery solutions for textile and chemical manufacturing verticals.. Development area: Develop IoT-enabled monitoring systems to transition maintenance contracts into predictive service m',
    'active',
    true,
    '["/assets/listing-assets/listing-068-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 97: Supply Chain Consulting Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Supply Chain Consulting Firm',
    'Other',
    'Vietnam',
    'Da Nang',
    'This established Vietnamese consulting firm delivers specialized supply chain optimization solutions to manufacturing and logistics enterprises across Southeast Asia. Operating since 2002, the business assists clients in streamlining procurement workflows, enhancing distribution network efficiency, and implementing cost-reduction strategies through customized process redesign. Core competencies include cross-border trade compliance advisory, warehouse automation roadmaps, and supplier relationship management programs tailored to Vietnam''s evolving regulatory landscape. The company maintains strategic partnerships with enterprise resource planning software vendors and domestic logistics associations, positioning itself as a knowledge hub for companies navigating ASEAN supply chain diversification trends. With 125 multilingual professionals organized into industry-specific practice groups, the firm supports both multinational corporations establishing regional hubs and large domestic...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Consulting Services',
    2002,
    '"',
    'Supply Chain Consulting Firm Corp',
    '"',
    '"',
    125,
    9332550.00,
    933255.00,
    933255.00,
    'Retirement. "',
    'Growth opportunity: Implement subscription-based digital knowledge portal for SME clients. Expansion potential: Expand cross-border consulting services to Cambodia and Laos through strategic partnerships. Development area: Develop AI-powered supply chain simulation tools using accumulated client data assets',
    'active',
    true,
    '["/assets/listing-assets/listing-069-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 98: IT & Technology Recruitment Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'IT & Technology Recruitment Agency',
    'Other',
    'Indonesia',
    'Bandung',
    'The business operates as a specialized IT and technology recruitment agency serving corporate clients across Indonesia’s rapidly growing tech ecosystem. Focused on mid-to-senior level placements, the company bridges talent gaps for software developers, cybersecurity experts, and data science professionals through proactive headhunting and candidate assessment systems. Its operational framework combines AI-enhanced resume screening tools with human-led technical vetting processes, ensuring precise matching for roles requiring niche skill sets. A dedicated team of 38 recruitment consultants and technical evaluators maintains relationships with over 150 enterprise clients, primarily in fintech, e-commerce, and digital transformation sectors. Strategic positioning as a quality-focused alternative to generalist agencies has enabled the capture of emerging demand from multinational corporations establishing regional tech hubs in Jakarta and Surabaya. The vertically specialized model demon...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2024,
    '"',
    'IT & Technology Recruitment Agency Corp',
    '"',
    '"',
    38,
    3865766.00,
    695837.00,
    695838.00,
    'Retirement. "',
    'Growth opportunity: Establish regional talent hubs in secondary cities like Bandung and Medan to service growing tech in. Expansion potential: Implement video-based micro-assessment platform to streamline preliminary technical evaluations and . Development area: Develop dedicated recruitment verticals for renewable energy tech and climate tech sectors aligned w',
    'active',
    true,
    '["/assets/listing-assets/listing-070-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 99: Mental Health & Addiction Treatment Center
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Mental Health & Addiction Treatment Center',
    'Other',
    'Indonesia',
    'Bali',
    'Amid growing recognition of mental health priorities in Southeast Asia, this established provider delivers comprehensive treatment services for psychological disorders and addiction recovery. Operating through outpatient facilities and community partnerships across Indonesia, the organization specializes in cognitive-behavioral therapies, group counseling, and personalized recovery plans. Its service contract model secures recurring engagements with corporate clients, insurance providers, and government health programs while maintaining direct patient care through clinic operations. A team of 40 licensed psychiatrists, clinical psychologists, and certified addiction counselors supports treatment delivery through standardized protocols and continuing education programs. The business has cultivated particularly strong relationships with manufacturing employers and urban hospital networks, positioning it as a critical partner in workforce mental health initiatives. Strategic value deri...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Service contracts',
    2015,
    '"',
    'Mental Health & Addiction Treatment Center Corp',
    '"',
    '"',
    40,
    632832.00,
    113909.00,
    102519.00,
    'New Ventures. "',
    'Growth opportunity: Establish specialized treatment tracks for under-addressed demographics like adolescents or trauma s. Expansion potential: Develop corporate wellness partnerships to offer workplace mental health programs and employee assis. Development area: Implement telehealth infrastructure to expand geographic reach and service accessibility across Indo',
    'active',
    true,
    '["/assets/listing-assets/listing-071-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 100: Bespoke Jewelry Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Bespoke Jewelry Manufacturer',
    'Other',
    'India',
    'Hyderabad',
    'Specializing in precision craftsmanship for luxury markets, this established bespoke jewelry enterprise serves as a critical production partner for international retailers and design houses. Operating from a 23,000 sq ft facility in India''s primary jewelry manufacturing corridor, the business combines traditional goldsmith techniques with advanced CAD/CAM technology to produce intricate bridal collections, statement necklaces, and heritage-inspired pieces meeting exacting client specifications. A dedicated team of 85 skilled artisans, gemologists, and quality control specialists executes approximately 340 custom projects annually through streamlined workflows spanning 3D modeling, lost-wax casting, and hand-finishing stations. The company maintains strategic partnerships with 22 recurring wholesale clients across North America and Europe, supported by a made-to-order production model that minimizes inventory risk while commanding premium pricing through value-added services like pr...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2001,
    '"',
    'Bespoke Jewelry Manufacturer Corp',
    '"',
    '"',
    85,
    6375078.00,
    765009.00,
    765009.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Expand certification capabilities for lab-grown diamonds and recycled precious metals to align with . Expansion potential: Develop semi-customized jewelry lines using existing molds and patterns to capture mid-tier luxury m. Development area: Implement e-commerce platforms for direct designer collaborations to reduce reliance on traditional',
    'active',
    true,
    '["/assets/listing-assets/listing-072-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 101: Real Estate Development Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Real Estate Development Firm',
    'Real Estate & Property',
    'India',
    'Lucknow',
    'This vertically integrated real estate development firm operates as a strategic partner for institutional investors and corporate clients, specializing in turnkey commercial and mixed-use projects across India''s high-growth urban corridors. The business has established a differentiated position through its end-to-end development capabilities spanning land acquisition, regulatory approvals, architectural design, and construction management. A streamlined operational model combines in-house expertise in zoning compliance and value engineering with vetted contractor networks, enabling consistent delivery of Grade A office spaces and premium retail developments. The company''s asset-light approach focuses on joint development agreements and fee-based projects, minimizing capital exposure while maintaining strong margins through design optimization and supply chain efficiencies. With a lean team of 22 specialized professionals managing all aspects from due diligence to handover, the fir...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Real Estate Development',
    2022,
    '"',
    'Real Estate Development Firm Corp',
    '"',
    '"',
    22,
    2210775.00,
    287400.00,
    229921.00,
    'Retirement. "',
    'Growth opportunity: Develop standardized urban regeneration packages for government Smart Cities Mission projects across. Expansion potential: Expand service offering into post-construction facility management through strategic partnerships or. Development area: Implement BIM (Building Information Modeling) technology to enhance design coordination and client p',
    'active',
    true,
    '["/assets/listing-assets/listing-073-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 102: Medical Equipment & Supplies Distributor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Medical Equipment & Supplies Distributor',
    'Other',
    'Indonesia',
    'Bandung',
    'Positioned at the forefront of Indonesia''s growing healthcare sector, this established medical equipment distributor operates an essential supply chain node connecting global manufacturers with healthcare providers across the archipelago. The company maintains strategic partnerships with 40+ international brands to supply diagnostic devices, surgical instruments, and disposable medical consumables to hospitals, clinics, and laboratory networks. Its vertically integrated operations combine centralized warehousing in Greater Jakarta with regional distribution hubs in 12 provinces, supported by a fleet of temperature-controlled vehicles meeting pharmaceutical-grade logistics standards. The business serves as a critical infrastructure partner for Indonesia''s public health system, holding preferred vendor status with 7 provincial health ministries while simultaneously supporting private hospital chains expanding into secondary cities. A team of 175 trained professionals oversees qualit...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2000,
    '"',
    'Medical Equipment & Supplies Distributor Corp',
    '"',
    '"',
    175,
    9436547.00,
    1981674.00,
    1684425.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of digital procurement portals to streamline hospital purchasing workflows and captur. Expansion potential: Expansion into underserviced Eastern Indonesia regions through strategic partnerships with provincia. Development area: Untapped potential in adjacent product verticals such as telemedicine integration kits and AI-assist',
    'active',
    true,
    '["/assets/listing-assets/listing-074-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 103: Veterinary Specialty & Emergency Hospital
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Veterinary Specialty & Emergency Hospital',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This established veterinary enterprise operates a full-service animal hospital combining specialty medical care with 24/7 emergency services in Thailand''s growing pet healthcare sector. The facility maintains separate dedicated departments for critical care, diagnostic imaging, surgical suites, and rehabilitation services, staffed by a team of 80 veterinary professionals including board-certified specialists in cardiology, oncology, and orthopedics. Operating through a service contract model, the business has cultivated long-term relationships with both individual pet owners and corporate clients including animal rescue organizations and luxury pet boarding facilities. Its strategic location in a major urban center provides accessibility to a concentrated population of high-income households while also serving as a regional referral hub for complex cases from provincial veterinary clinics. The combination of advanced medical capabilities with round-the-clock availability has positi...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Service contracts',
    1998,
    '"',
    'Veterinary Specialty & Emergency Hospital Corp',
    '"',
    '"',
    80,
    5151075.00,
    1030215.00,
    1287769.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expand corporate B2B contracts with pet insurance providers, breeder associations, and hospitality b. Expansion potential: Introduce integrated wellness programs including pet nutrition counseling and behavioral training se. Development area: Develop telemedicine platform to serve remote clients and expand cross-border consultation services',
    'active',
    true,
    '["/assets/listing-assets/listing-075-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 104: Testing and Certification Laboratory
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Testing and Certification Laboratory',
    'Other',
    'Thailand',
    'Chiang Mai',
    'Operating at the intersection of quality assurance and regulatory compliance, this established testing and certification laboratory serves as a critical partner for manufacturers and exporters across multiple sectors in Southeast Asia. With comprehensive capabilities spanning product safety verification, materials analysis, and compliance documentation, the business has become an essential link in regional supply chains since 1994. The company maintains ISO/IEC 17025 accreditation along with specialized certifications for electrical equipment, construction materials, and food contact substances, positioning it as a trusted verification partner for both domestic Thai clients and multinational corporations navigating ASEAN market requirements. A workforce of 145 technical professionals operates through three specialized divisions - industrial goods testing, consumer product certification, and environmental analysis - supported by advanced spectrometry, chromatography, and mechanical t...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B',
    1995,
    '"',
    'Testing and Certification Laboratory Corp',
    '"',
    '"',
    145,
    10886835.00,
    1415288.00,
    1415289.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implementation of AI-powered anomaly detection systems to expand high-margin predictive maintenance . Expansion potential: Development of premium consulting services for ESG compliance documentation leveraging existing clie. Development area: Untapped potential in Vietnam and Indonesia through strategic partnerships or satellite labs to capt',
    'active',
    true,
    '["/assets/listing-assets/listing-076-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 105: Gourmet Food Importer & Distributor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Gourmet Food Importer & Distributor',
    'Other',
    'India',
    'Jaipur',
    'The business operates as a premium importer and distributor of gourmet food products, serving India’s hospitality industry and specialty retailers through a vertically integrated B2B model. Since its establishment in 2002, the company has cultivated partnerships with 60+ international producers across Europe, Southeast Asia, and South America, specializing in high-margin categories including artisanal cheeses, premium olive oils, rare spices, and ethically sourced specialty ingredients. Operations are supported by climate-controlled warehousing facilities in three strategic Indian ports and a 35-member team managing quality control, customs clearance, and last-mile delivery through dedicated refrigerated logistics. The company maintains particularly strong relationships with five-star hotel chains and fine-dining restaurant groups, which account for 68% of recurring revenue through annual supply contracts. A lean e-commerce platform supplements core distribution channels, enabling b...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2002,
    '"',
    'Gourmet Food Importer & Distributor Corp',
    '"',
    '"',
    35,
    8309765.00,
    1412660.00,
    1412660.00,
    'Retirement. "',
    'Growth opportunity: Repurpose existing European supplier relationships to introduce plant-based gourmet alternatives tar. Expansion potential: Expand private label offerings using underutilized warehouse capacity to package imported ingredient. Development area: Develop direct-to-consumer channels leveraging existing inventory through white-label subscription b',
    'active',
    true,
    '["/assets/listing-assets/listing-077-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 106: Freight Bill Auditing & Payment Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Freight Bill Auditing & Payment Service',
    'Other',
    'India',
    'Pune',
    'This company operates as a specialized provider of freight bill auditing and payment services for transportation networks across India. Established in 2017, the business addresses critical pain points in logistics operations through systematic verification of shipping invoices, identification of billing errors, and optimization of payment workflows. With a dedicated team of over 200 professionals, the organization serves mid-to-large enterprises in manufacturing, retail, and third-party logistics through annual service contracts. Core operations involve automated invoice validation using proprietary auditing algorithms, coupled with human expert review for complex cases. The business maintains strategic positioning as an essential cost-containment partner in India''s rapidly modernizing logistics sector, particularly relevant given recent GST implementation and increased focus on supply chain efficiency. Attractive qualities include a fully developed tech stack requiring minimal cap...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    12000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Service Contracts',
    2017,
    '"',
    'Freight Bill Auditing & Payment Service Corp',
    '"',
    '"',
    225,
    11363848.00,
    1250023.00,
    1125021.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Develop self-service analytics portal enabling real-time freight spend tracking and benchmarking.. Expansion potential: Leverage existing client base to introduce cross-border auditing capabilities for international logi. Development area: Expand service offerings into adjacent supply chain finance products like dynamic discounting and ca',
    'active',
    true,
    '["/assets/listing-assets/listing-078-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 107: Wealth Management Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Wealth Management Firm',
    'Other',
    'India',
    'Ahmedabad',
    'The business operates as a specialized wealth management firm catering exclusively to institutional clients, corporate entities, and high-net-worth family offices across India. With operations commencing in 2009, the company has built a reputation for delivering customized asset allocation strategies, investment advisory services, and comprehensive financial planning solutions through its team of 85 professionals. Daily operations center around portfolio monitoring, market trend analysis, and client consultation cycles supported by proprietary analytical tools and CRM systems. Its service suite includes retirement fund management, alternative investment sourcing, and legacy wealth structuring, primarily targeting financial institutions requiring outsourced expertise. The firm differentiates itself through deep regulatory compliance knowledge within India''s evolving financial landscape and a consultative approach emphasizing multi-generational wealth preservation. Operationally stru...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    15000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Wealth Management Services',
    2009,
    '"',
    'Wealth Management Firm Corp',
    '"',
    '"',
    85,
    10871516.00,
    2174303.00,
    2174303.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Geographic expansion into emerging Tier 2 financial hubs through satellite office deployments.. Expansion potential: Implementation of AI-driven client risk profiling tools to accelerate onboarding and portfolio custo. Development area: Untapped potential in mid-market corporate pension funds through white-label service partnerships.',
    'active',
    true,
    '["/assets/listing-assets/listing-079-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 108: Multi-Unit Restaurant Group (Fine Dining)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Multi-Unit Restaurant Group (Fine Dining)',
    'Other',
    'India',
    'Kolkata',
    'Operating at the premium tier of India''s hospitality sector, this established multi-unit restaurant group has cultivated a reputation for delivering refined culinary experiences through its collection of upscale dine-in venues and premium takeout services. Founded in 2019, the business capitalizes on India''s growing appetite for experiential fine dining, blending contemporary gastronomic techniques with locally sourced ingredients across its curated menus. The operation maintains four strategically located venues in major metropolitan areas, each featuring distinct interior designs while sharing centralized kitchen workflows and standardized service protocols. A workforce of 76 employees - including award-winning chefs, certified sommeliers, and hospitality-trained staff - supports round-the-clock operations through optimized shift scheduling and cross-location resource allocation. The company''s dual revenue model combines elevated dine-in service (representing ~65% of transactio...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Dine-in/Takeout',
    2019,
    '"',
    'Multi-Unit Restaurant Group (Fine Dining) Corp',
    '"',
    '"',
    76,
    1140658.00,
    171098.00,
    136879.00,
    'New Ventures. "',
    'Growth opportunity: Conversion of underutilized daytime restaurant spaces into premium culinary workshop venues or priva. Expansion potential: Development of signature retail products (spice blends, artisanal chocolates) for e-commerce platfor. Development area: Implementation of AI-driven dynamic menu pricing could optimize table turnover rates and kitchen yie',
    'active',
    true,
    '["/assets/listing-assets/listing-080-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 109: Corporate Event & Experiential Marketing Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Corporate Event & Experiential Marketing Agency',
    'Other',
    'Thailand',
    'Chiang Mai',
    'Operating at the intersection of creativity and logistics, this established corporate event and experiential marketing agency has served as a strategic partner for multinational corporations and regional enterprises since 1996. The business specializes in end-to-end event management including product launches, brand activations, conference executions, and custom immersive experiences across Thailand''s dynamic MICE (Meetings, Incentives, Conventions & Exhibitions) landscape. A team of 185 professionals manages all operational aspects from concept development and venue sourcing to technical production and post-event analytics, leveraging long-standing vendor relationships and proprietary project management systems. The company maintains particular strength in serving luxury brands, automotive manufacturers, and technology firms seeking turnkey solutions combining local market expertise with international-grade execution standards. Its defensible market position stems from 28 years of...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Service Agency',
    1996,
    '"',
    'Corporate Event & Experiential Marketing Agency Corp',
    '"',
    '"',
    185,
    9237485.00,
    1293247.00,
    1.00,
    'Retirement. "',
    'Growth opportunity: Implement data-as-a-service offerings through enhanced attendee tracking technologies and post-event. Expansion potential: Develop subsidiary operations in neighboring ASEAN markets using existing regional client relationsh. Development area: Expand into hybrid/virtual event production capabilities to capture demand for phygital experiences',
    'active',
    true,
    '["/assets/listing-assets/listing-081-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 110: Business Valuation Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Business Valuation Services',
    'Other',
    'Indonesia',
    'Bandung',
    'This established business valuation consultancy provides specialized advisory services to mid-market enterprises and institutional clients across Indonesia’s expanding commercial landscape. Since 2008, the company has developed rigorous methodologies for valuing complex business assets, intellectual property portfolios, and merger/acquisition targets through fixed-scope engagements and multi-year service contracts. Core operations center on delivering court-admissible valuation reports, shareholder dispute resolutions, and transaction support services for clients in manufacturing, agribusiness, and infrastructure sectors. A team of 24 credentialed professionals combines international valuation standards with localized market intelligence, maintaining certifications from recognized industry bodies. Strategic advantages include proprietary sector-specific valuation models, a centralized knowledge repository with 15+ years of transactional data, and automated report generation systems ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Service contracts',
    2008,
    '"',
    'Business Valuation Services Corp',
    '"',
    '"',
    24,
    2456605.00,
    294792.00,
    235834.00,
    'New Ventures. "',
    'Growth opportunity: Implement AI-assisted comparables analysis to reduce report turnaround time and enhance service capa. Expansion potential: Expand sector specialization into renewable energy and digital infrastructure verticals aligned with. Development area: Develop subscription-based digital valuation tools for SMEs lacking in-house financial expertise.',
    'active',
    true,
    '["/assets/listing-assets/listing-082-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 111: Art Gallery & Auction House
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Art Gallery & Auction House',
    'Other',
    'India',
    'Bangalore',
    'This established art enterprise operates a dual-model platform combining curated gallery exhibitions with a dynamic B2C auction mechanism, serving as a cultural bridge between traditional Indian artistry and contemporary collectors. Since 2010, the business has cultivated a sophisticated digital marketplace complemented by physical galleries in key metropolitan areas, offering authenticated works ranging from emerging regional artists to established international creators. Day-to-day operations involve artist relationship management, inventory curation across painting, sculpture, and digital art formats, and orchestration of monthly themed auctions that attract participation from domestic collectors and international buyers through its localized multilingual platform. The company maintains strategic partnerships with cultural institutions for exclusive preview events while utilizing proprietary bidding algorithms and AI-driven valuation tools that enhance buyer confidence. A dedicat...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2C Auction Platform',
    2010,
    '"',
    'Art Gallery & Auction House Corp',
    '"',
    '"',
    80,
    9786248.00,
    2348699.00,
    2348700.00,
    'Lifestyle Change. "',
    'Growth opportunity: Geographic expansion opportunities via satellite galleries in secondary cities combined with regiona. Expansion potential: Underutilized digital asset potential through NFT integrations for limited edition reproductions and. Development area: Untapped potential in corporate art leasing programs for office spaces and hospitality venues across',
    'active',
    true,
    '["/assets/listing-assets/listing-083-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 112: Government Contract Consulting
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Government Contract Consulting',
    'Other',
    'India',
    'Chennai',
    'Operating at the intersection of public sector procurement and private enterprise, this established government contract consulting firm has developed specialized expertise in facilitating complex B2B engagements between corporate clients and Indian government entities. The company’s core services encompass end-to-end tender management, compliance framework development, and bid strategy optimization for infrastructure projects, defense contracts, and municipal service agreements. A team of 250 professionals combines regulatory analysts, technical writers, and former procurement officers to manage client portfolios ranging from mid-sized suppliers to multinational corporations pursuing opportunities in India’s $500B+ annual government spending market. Daily operations center on maintaining a dynamic knowledge repository tracking 78 central and state government procurement portals, supported by proprietary workflow systems for deadline management and document automation. Strategic posi...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    14000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Consulting Services',
    2012,
    '"',
    'Government Contract Consulting Corp',
    '"',
    '"',
    250,
    12433083.00,
    2113624.00,
    1864962.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Development of subscription-based compliance monitoring platform to create recurring revenue streams. Expansion potential: Expansion into emerging sectors through targeted lobbying for renewable energy and smart city infras. Development area: Implementation of AI-driven contract analytics tools to enhance proposal personalization and success',
    'active',
    true,
    '["/assets/listing-assets/listing-084-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 113: High-End Security Services Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'High-End Security Services Provider',
    'Other',
    'Philippines',
    'Cebu City',
    'This established provider delivers premium security solutions to corporate clients across the Philippines, specializing in tailored protection services for high-value commercial assets. Through a combination of advanced surveillance technologies and highly trained personnel, the company maintains 24/7 operational capabilities supporting enterprise clients in banking, industrial complexes, and luxury retail sectors. Its service portfolio encompasses executive protection details, secure transport logistics, and integrated alarm response systems, supported by proprietary protocols developed over 15 years of market presence. The organization operates through a hub-and-spoke model with regional command centers coordinating 288 security professionals, leveraging the Philippines'' competitive labor market to maintain exceptional service standards at commercially sustainable rates. Strategic buyers would recognize value in its fully vetted workforce, long-term contracts with renewal rates e...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Service contracts',
    2009,
    '"',
    'High-End Security Services Provider Corp',
    '"',
    '"',
    288,
    5751310.00,
    1150262.00,
    862697.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement predictive analytics tools to optimize patrol routes and resource allocation efficiency.. Expansion potential: Develop regional satellite offices to capture underserved markets in emerging economic zones.. Development area: Expand cybersecurity integration services to address growing demand for hybrid physical-digital prot',
    'active',
    true,
    '["/assets/listing-assets/listing-085-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 114: Private Golf & Country Club Management
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Private Golf & Country Club Management',
    'Other',
    'Philippines',
    'Cebu City',
    'This established Philippines-based enterprise operates a premier private golf and country club facility catering to affluent domestic and international clientele. Through its refined membership model, the business provides exclusive access to an 18-hole championship golf course complemented by comprehensive lifestyle amenities including multiple dining venues, tennis courts, swimming pools, and spa facilities. The operation maintains rigorous service standards through dedicated teams managing grounds maintenance (110 staff), hospitality services (130 employees), and specialized roles in event coordination and membership management. Core revenue streams derive from initiation fees, tiered annual membership dues, and ancillary spending across F&B outlets and private event hosting. Strategic value lies in its position as one of fewer than a dozen ultra-premium private clubs in the archipelago nation, with demonstrated success capturing high-net-worth individuals through curated experie...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Membership-based service model',
    2021,
    '"',
    'Private Golf & Country Club Management Corp',
    '"',
    '"',
    300,
    9403753.00,
    2162863.00,
    2162863.00,
    'Wealth Diversification. "',
    'Growth opportunity: Development of eco-tourism integrations through mangrove conservation areas and sustainability-certi. Expansion potential: Expansion of corporate event packages targeting multinational companies in nearby business districts. Development area: Implementation of digital membership platforms could enhance engagement with younger demographics th',
    'active',
    true,
    '["/assets/listing-assets/listing-086-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 115: Investor Relations Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Investor Relations Agency',
    'Other',
    'India',
    'Hyderabad',
    'Positioned at the intersection of strategic communication and capital markets, this investor relations agency operates as a specialized B2B service provider within India’s dynamic Marketing & Advertising sector. The business focuses on crafting tailored investor outreach programs, financial narrative development, and regulatory compliance support for publicly traded companies and pre-IPO organizations. Leveraging a hybrid model combining in-depth market research, digital communication platforms, and executive advisory services, the firm helps clients articulate their value propositions to institutional investors, analysts, and stakeholders. A team of 35 professionals – including financial writers, data analysts, and corporate communication specialists – supports operations through standardized workflow systems and cloud-based collaboration tools. The agency has cultivated a reputation for bridging Western corporate reporting standards with emerging market realities, particularly ser...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2024,
    '"',
    'Investor Relations Agency Corp',
    '"',
    '"',
    35,
    2117573.00,
    381163.00,
    381163.00,
    'Wealth Diversification. "',
    'Growth opportunity: Leverage existing regulatory expertise to establish satellite offices in ASEAN markets with similar . Expansion potential: Develop subscription-based digital platform offering self-service investor targeting tools for SME c. Development area: Expand service lines into ESG benchmarking and sustainability reporting to capitalize on evolving di',
    'active',
    true,
    '["/assets/listing-assets/listing-087-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 116: Branded Apparel & Merchandise Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Branded Apparel & Merchandise Manufacturer',
    'Other',
    'India',
    'Jaipur',
    'Operating at the intersection of creative design and industrial production, this established apparel manufacturer specializes in delivering customized branding solutions for corporate clients and promotional agencies. The business maintains vertically integrated operations spanning digital textile printing, embroidery services, and garment finishing, supported by three production facilities strategically located across India''s major textile hubs. Its core offering focuses on producing premium-quality branded workwear, event merchandise, and promotional accessories for domestic and international clients across banking, hospitality, and consumer goods sectors. A 240-member workforce oversees precision operations including computerized pattern making, bulk dyeing processes, and quality assurance protocols compliant with international textile standards. The company distinguishes itself through rapid prototyping capabilities, handling average order volumes of 50,000+ units with 15-day t...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    14000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2014,
    '"',
    'Branded Apparel & Merchandise Manufacturer Corp',
    '"',
    '"',
    240,
    11968215.00,
    1675550.00,
    2178215.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of AI-driven inventory optimization systems to enhance just-in-time production capabi. Expansion potential: Development of sustainable apparel lines using recycled materials to capitalize on global ESG-focuse. Development area: Untapped potential in Southeast Asian markets where textile trade agreements could be leveraged thro',
    'active',
    true,
    '["/assets/listing-assets/listing-088-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 117: National Moving & Storage Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'National Moving & Storage Company',
    'Other',
    'India',
    'Jaipur',
    'This established national moving and storage enterprise has developed comprehensive relocation solutions for residential and commercial clients across India since 2003. Operating through strategically located regional hubs, the company provides door-to-door moving services combined with climate-controlled storage facilities, specializing in handling fragile items and large-volume relocations. Daily operations leverage a fleet of GPS-enabled vehicles maintained through rigorous service protocols, supported by 352 trained personnel handling packing, logistics coordination, and inventory management. The business maintains strong positioning in India''s growing urban mobility market through real-time tracking systems and a customer portal enabling digital bookings and document management. Its value proposition centers on pain-point reduction for clients navigating complex relocation processes, with particular expertise serving corporate transferees and military personnel rotations. The ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    15000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2C Service',
    2003,
    '"',
    'National Moving & Storage Company Corp',
    '"',
    '"',
    352,
    10641588.00,
    1170574.00,
    1170575.00,
    'New Ventures. "',
    'Growth opportunity: Expansion of value-added services such as smart home integration assistance and virtual inventory ma. Expansion potential: Development of specialized relocation packages for niche markets including international student mob. Development area: Implementation of AI-powered demand forecasting could optimize fleet utilization rates and storage c',
    'active',
    true,
    '["/assets/listing-assets/listing-089-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 118: Industrial Equipment Rental
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Industrial Equipment Rental',
    'Other',
    'Vietnam',
    'Hanoi',
    'Operating since 2010, this enterprise has become a trusted partner for construction firms and trade specialists across Vietnam''s developing infrastructure sector. Specializing in heavy equipment rentals, the company maintains an extensive inventory of excavators, loaders, compactors, and specialized tools tailored to commercial construction projects. Its operational model emphasizes flexible rental agreements coupled with full-service equipment maintenance, creating value for contractors needing capital-efficient access to modern machinery without ownership burdens. The business serves a loyal base of 85+ recurring clients through regional distribution hubs staffed by 22 trained technicians and logistics personnel. Strategic positioning in Vietnam''s construction equipment rental market - projected to grow at 6.8% CAGR through 2030 - is reinforced by proprietary maintenance protocols that ensure 98% operational uptime rates. Attractive elements for buyers include established vendor...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Rental Service',
    2010,
    '"',
    'Industrial Equipment Rental Corp',
    '"',
    '"',
    22,
    1118948.00,
    201410.00,
    313306.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement GPS tracking across fleet to enable usage-based billing models and preventive maintenance . Expansion potential: Expand inventory into underserved specialty equipment categories like aerial work platforms and tunn. Development area: Develop digital portal for real-time equipment reservations and usage analytics to enhance client re',
    'active',
    true,
    '["/assets/listing-assets/listing-090-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 119: Renewable Energy Installation (Solar Farm)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Renewable Energy Installation (Solar Farm)',
    'Other',
    'India',
    'Bengaluru',
    'This business operates as a specialized renewable energy solutions provider focused on developing and managing utility-scale solar farms for commercial and industrial clients across India. Established in 2014, the company designs, installs, and maintains photovoltaic systems tailored to meet corporate energy demands, serving manufacturing facilities, data centers, and agricultural processing hubs through long-term power purchase agreements (PPAs). Its vertically integrated model combines site acquisition expertise with advanced solar engineering capabilities, managing the complete project lifecycle from land leasing and grid integration to ongoing performance optimization. With a 70-member team of renewable energy specialists, electrical engineers, and project managers, the organization maintains strategic partnerships with tier-1 equipment suppliers and holds key certifications for grid compliance. The company''s value proposition centers on enabling B2B clients to achieve energy c...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B Energy Solutions',
    2014,
    '"',
    'Renewable Energy Installation (Solar Farm) Corp',
    '"',
    '"',
    70,
    8345372.00,
    917990.00,
    1314576.00,
    'New Ventures. "',
    'Growth opportunity: Leverage existing regulatory expertise to replicate success model in emerging ASEAN markets with sim. Expansion potential: Develop AI-powered yield optimization platforms to enhance energy output and predictive maintenance . Development area: Expand into hybrid energy systems by integrating battery storage solutions to address corporate dema',
    'active',
    true,
    '["/assets/listing-assets/listing-091-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 120: Data Center Services Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Data Center Services Provider',
    'Other',
    'Thailand',
    'Chiang Mai',
    'Operating at the intersection of Thailand''s burgeoning digital economy, this established data center services provider delivers critical infrastructure solutions to enterprise clients across Southeast Asia. Since 2005, the company has operated purpose-built facilities meeting Tier III standards, offering colocation services, cloud connectivity, and managed IT infrastructure support. Its core operations focus on maintaining 99.982% uptime SLAs through advanced cooling systems, dual power feeds, and 24/7 network monitoring - capabilities that have attracted a stable base of financial institutions, telecom operators, and e-commerce platforms. The business differentiates through hyperlocal expertise in Thailand''s regulatory environment, including PDPA-compliant data handling and certified disaster recovery protocols tailored to regional climate risks. Client engagements typically follow 3-5 year contracts with auto-renewal clauses, creating predictable recurring revenue streams. Strat...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2005,
    '"',
    'Data Center Services Provider Corp',
    '"',
    '"',
    44,
    4441991.00,
    444199.00,
    444199.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of AIOps platforms to predictive maintenance capabilities and offer margin-boosting m. Expansion potential: Expansion into secondary economic zones through modular micro-data center deployments targeting East. Development area: Untapped potential in mid-market cloud migration services for Thailand''s 400,000+ SMEs currently rel',
    'active',
    true,
    '["/assets/listing-assets/listing-092-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 121: Commercial Printing Press
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Printing Press',
    'Other',
    'India',
    'Kolkata',
    'This commercial printing operation serves as a strategic partner to marketing agencies and corporate clients across India, providing high-volume print solutions for branded collateral, packaging materials, and promotional items. Established in 2014, the business combines offset and digital printing technologies with in-house design support to deliver customized print runs ranging from 500 to 500,000 units. Its vertically integrated facility houses cutting-edge Heidelberg presses, digital finishing equipment, and quality control systems that maintain ISO-certified production standards. The company maintains recurring contracts with 35+ advertising agencies while expanding its direct engagements with e-commerce brands requiring specialized packaging solutions. With 70 skilled technicians and account managers, the operation demonstrates particular strength in rapid turnaround times for time-sensitive campaigns and regulatory-compliant production for pharmaceutical clients. Strategic ad...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2014,
    '"',
    'Commercial Printing Press Corp',
    '"',
    '"',
    70,
    2451208.00,
    514753.00,
    441217.00,
    'New Ventures. "',
    'Growth opportunity: Implement AI-driven predictive maintenance systems to further reduce equipment downtime and consumab. Expansion potential: Expand digital textile printing capabilities to capture growing demand for event branding and retail. Development area: Develop subscription-based print management services for corporate clients with recurring marketing',
    'active',
    true,
    '["/assets/listing-assets/listing-093-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 122: Public Relations (PR) Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Public Relations (PR) Firm',
    'Other',
    'India',
    'Jaipur',
    'Positioned as a key player in India''s dynamic marketing landscape, this established public relations firm delivers strategic communications solutions to domestic and international corporate clients. Operating since 2014, the business specializes in media relations, crisis management, and reputation-building campaigns through integrated digital/traditional channels. Its team of 250 seasoned professionals supports enterprise clients across technology, healthcare, and financial services sectors - maintaining particular strength in corporate communications strategy for cross-border market entry initiatives. The company employs a hub-and-spoke operational model with regional offices supporting centralized client strategy teams, utilizing proprietary project management frameworks to maintain service consistency. Core differentiators include multilingual campaign execution capabilities (12+ Indian languages), certified crisis response protocols, and AI-enhanced media monitoring systems. A...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B',
    2014,
    '"',
    'Public Relations (PR) Firm Corp',
    '"',
    '"',
    250,
    11139053.00,
    2561982.00,
    2305784.00,
    'Lifestyle Change. "',
    'Growth opportunity: Geographic diversification via strategic alliances with global PR networks seeking India foothold.. Expansion potential: Expansion of data storytelling capabilities through strategic hires in analytics or tech partnership. Development area: Untapped potential in mid-market segment through standardized service packages for regional enterpri',
    'active',
    true,
    '["/assets/listing-assets/listing-094-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 123: Architectural Firm (Large-Scale Projects)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Architectural Firm (Large-Scale Projects)',
    'Other',
    'Indonesia',
    'Makassar',
    'Established in 1996, this Indonesian architectural practice has become a trusted partner in delivering complex, large-scale construction projects across commercial, infrastructure, and mixed-use developments. Operating as a full-service firm, the business handles all project phases from initial concept development and regulatory compliance to construction documentation and site supervision. Its team of 50 skilled professionals specializes in designing institutional facilities, transportation hubs, and high-density urban developments that align with Indonesia''s rapid infrastructure growth. The company maintains strong B2B relationships with property developers, government entities, and construction conglomerates, with particular expertise navigating local building codes and environmental regulations. A structured project management system enables simultaneous execution of multiple major developments, supported by advanced CAD/BIM capabilities and established partnerships with engine...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    1996,
    '"',
    'Architectural Firm (Large-Scale Projects) Corp',
    '"',
    '"',
    50,
    2332081.00,
    513057.00,
    410446.00,
    'Wealth Diversification. "',
    'Growth opportunity: Leverage established reputation to pursue public-private partnership projects in Indonesia''s new cap. Expansion potential: Develop standardized design modules for recurring project types to improve proposal turnaround and r. Development area: Expand service offering into post-occupancy evaluation and smart building integration to capture hig',
    'active',
    true,
    '["/assets/listing-assets/listing-095-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 124: Executive Recruitment Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Executive Recruitment Firm',
    'Other',
    'Thailand',
    'Khon Kaen',
    'This Thailand-based executive recruitment firm has rapidly established itself as a specialized partner for organizational leadership development since its 2024 inception. Operating within the competitive consulting sector, the business streamlines C-suite and senior management placements for multinational corporations and domestic enterprises across technology, manufacturing, and financial services industries. A team of 45 multilingual professionals combines regional market intelligence with global recruitment methodologies, delivering tailored talent solutions through three core service lines: retained executive search, leadership assessment programs, and compensation benchmarking analyses. The operational model emphasizes proprietary candidate mapping techniques that leverage both AI-driven database mining and traditional headhunting approaches, creating a defensible position in Thailand''s evolving professional services landscape. Client retention is reinforced through quarterly ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    12000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2024,
    '"',
    'Executive Recruitment Firm Corp',
    '"',
    '"',
    45,
    9281711.00,
    1113805.00,
    1856342.00,
    'Wealth Diversification. "',
    'Growth opportunity: Leverage existing ASEAN client base to establish satellite offices in Vietnam and Indonesia''s growin. Expansion potential: Expand sector-specific expertise into emerging industries including renewable energy and digital hea. Development area: Develop digital platform for client self-service talent analytics and succession planning visualizat',
    'active',
    true,
    '["/assets/listing-assets/listing-096-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 125: Automotive Tire & Service Center Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Automotive Tire & Service Center Chain',
    'Other',
    'India',
    'Jaipur',
    'The business operates as a prominent automotive tire and service center chain across India, providing integrated solutions spanning tire sales, wheel alignment, brake services, and routine vehicle maintenance. Established in 2012, the company has cultivated a vertically integrated service model combining retail distribution with technical expertise across 25+ urban and semi-urban markets. Day-to-day operations leverage a hub-and-spoke infrastructure with regional technical centers supporting satellite outlets, staffed by 225 ASE-certified technicians and customer service personnel. Core customer segments include fleet operators requiring scheduled maintenance programs, retail vehicle owners seeking warranty-compliant services, and commercial transport partners needing emergency roadside assistance. Strategic partnerships with three major tire manufacturers ensure competitive procurement costs and exclusive product allocations, while proprietary workshop management software streamlin...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2C service model',
    2012,
    '"',
    'Automotive Tire & Service Center Chain Corp',
    '"',
    '"',
    225,
    6709728.00,
    1073556.00,
    1073556.00,
    'New Ventures. "',
    'Growth opportunity: Extend B2B outreach program targeting logistics parks and last-mile delivery fleets in underserved i. Expansion potential: Implement AI-driven predictive maintenance platforms to upsell customized service packages via mobil. Development area: Introduce battery replacement and EV charging station installations to capture emerging electric veh',
    'active',
    true,
    '["/assets/listing-assets/listing-097-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 126: Regional Convenience Store Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Convenience Store Chain',
    'Other',
    'Malaysia',
    'Kota Kinabalu',
    'This established convenience store chain operates a network of strategically located retail outlets across key urban and suburban areas in Malaysia. Specializing in quick-service retail, the business provides daily essentials ranging from packaged foods and beverages to household goods and personal care products, supplemented by high-margin impulse purchase items positioned near checkout zones. With operations refined over nearly three decades, the company has cultivated strong relationships with both international FMCG distributors and local specialty suppliers, enabling a product mix that balances global brands with regionally relevant offerings. The business maintains particular strength in capturing morning and evening commuter traffic through optimized store layouts and extended operating hours across all locations. A dedicated workforce of 120 employees supports operations through standardized processes for inventory management, staff training, and customer service protocols d...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Brick-and-Mortar Retail',
    1996,
    '"',
    'Regional Convenience Store Chain Corp',
    '"',
    '"',
    120,
    6974870.00,
    697487.00,
    697487.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Expansion of value-added services including bill payment kiosks and prepaid mobile top-ups to increa. Expansion potential: Development of private-label products in snack food and household categories to improve margins usin. Development area: Implementation of click-and-collect services and last-mile delivery partnerships to capture Malaysia',
    'active',
    true,
    '["/assets/listing-assets/listing-098-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 127: Commercial Dry Cleaning & Laundry Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Dry Cleaning & Laundry Service',
    'Other',
    'India',
    'Hyderabad',
    'Established in 2009, this commercial dry cleaning and laundry service operates as a critical support partner for hospitality, healthcare, and corporate sectors across urban centers in India. The company delivers professional garment care through industrial-grade machinery capable of handling bulk orders, specialized stain removal protocols, and premium pressing services. A centralized processing facility with ISO-certified quality controls serves as the operational hub, complemented by an optimized logistics network providing daily pickup/delivery cycles to 300+ contracted clients. The business has cultivated enduring relationships with mid-sized hotels, private hospitals, and corporate uniform providers through reliability in meeting stringent turnaround requirements and adapting services to client-specific hygiene standards. With 75 trained technicians and route managers operating under documented workflows, the operation demonstrates scalability through standardized processes tha...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Service',
    2009,
    '"',
    'Commercial Dry Cleaning & Laundry Service Corp',
    '"',
    '"',
    75,
    1107918.00,
    110791.00,
    110792.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Margin expansion through vertical integration by developing in-house linen supply division for hospi. Expansion potential: Implementation of customer portal for real-time order tracking and automated inventory management to. Development area: Untapped potential in secondary cities through satellite facility deployment to service India''s expa',
    'active',
    true,
    '["/assets/listing-assets/listing-099-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 128: Corporate Event Planning & Management Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Corporate Event Planning & Management Firm',
    'Other',
    'India',
    'Ahmedabad',
    'The business operates as a full-service corporate event planning and management provider, specializing in designing and executing large-scale conferences, product launches, and employee engagement programs for domestic and multinational corporations. With regional offices in three major Indian cities, the company combines local market expertise with international service standards through a 150-member team of certified event planners, technical specialists, and logistics coordinators. Its vertically integrated operational model manages all aspects from venue sourcing and agenda design to digital直播 integration and post-event analytics, serving as a single-point solution for clients in technology, pharmaceuticals, and financial services sectors. The company maintains competitive differentiation through proprietary vendor management systems and strategic partnerships with premium hotel chains, enabling consistent delivery of 350+ events annually. Buyers would inherit an established bra...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    15000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Service',
    2018,
    '"',
    'Corporate Event Planning & Management Firm Corp',
    '"',
    '"',
    150,
    10949055.00,
    1970829.00,
    1675205.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Development of subscription-based event management software for client self-service portals.. Expansion potential: Expansion into government and public sector contracts through CSR program design services.. Development area: Implementation of AI-driven attendee engagement analytics to upsell personalized event packages.',
    'active',
    true,
    '["/assets/listing-assets/listing-100-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 129: Creative & Branding Agency
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Creative & Branding Agency',
    'Other',
    'Thailand',
    'Chiang Mai',
    'Specializing in delivering integrated brand strategy and creative execution, this established agency has operated as a trusted partner for corporate clients across Thailand and Southeast Asia since 2003. The business combines strategic brand architecture with full-service creative production, offering end-to-end solutions including corporate identity development, campaign ideation, digital content creation, and cross-platform media implementation. With a team of 100 seasoned professionals spanning account management, creative direction, and technical production roles, the agency maintains long-term relationships with regional enterprises across financial services, hospitality, and consumer goods sectors. Its operational model emphasizes collaborative client engagement through dedicated project pods that blend strategic planners, visual designers, and digital specialists - a structure enabling both tailored solutions and efficient scalability. The company''s market position benefits ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2003,
    '"',
    'Creative & Branding Agency Corp',
    '"',
    '"',
    100,
    8153940.00,
    978472.00,
    978473.00,
    'Retirement. "',
    'Growth opportunity: Strategic partnerships with regional e-commerce platforms to access SME marketing verticals.. Expansion potential: Expansion into complementary corporate training services leveraging existing brand strategy IP.. Development area: Untapped potential in AI-driven campaign optimization tools to enhance digital service offerings.',
    'active',
    true,
    '["/assets/listing-assets/listing-101-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 130: Home & Commercial Inspection Service Group
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Home & Commercial Inspection Service Group',
    'Other',
    'India',
    'Kolkata',
    'This company operates as a specialized provider of home and commercial inspection services, addressing India’s rapidly growing real estate sector through technical evaluations of structural integrity, electrical systems, and regulatory compliance. The business leverages a network of 196 certified inspectors and technical staff to deliver pre-purchase inspections, construction quality audits, and maintenance assessments for residential complexes, office buildings, and industrial facilities. Service contracts with property developers, facility management firms, and corporate clients form the core revenue model, ensuring recurring engagement through multi-year agreements. Strategically positioned at the intersection of construction quality oversight and risk mitigation, the company has established credibility through partnerships with 12 regional real estate associations and accreditation under India’s National Building Code framework. Operational workflows are supported by proprietary...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'Service contracts',
    2024,
    '"',
    'Home & Commercial Inspection Service Group Corp',
    '"',
    '"',
    196,
    7869348.00,
    1573869.00,
    1967337.00,
    'Retirement. "',
    'Growth opportunity: Develop franchise model to penetrate underserved Tier 2/3 cities using existing operational playbook. Expansion potential: Implement AI-powered predictive maintenance analytics through software upgrades to enhance contract . Development area: Expand service lines into adjacent compliance verticals including fire safety certifications and her',
    'active',
    true,
    '["/assets/listing-assets/listing-102-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 131: Regional Insurance Brokerage
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Insurance Brokerage',
    'Other',
    'Indonesia',
    'Bandung',
    'Operating as a key intermediary in Indonesia''s growing insurance sector, this established brokerage provides specialized risk management solutions to corporate clients across multiple industries. The business operates through a vertically integrated service model combining technical underwriting expertise with hands-on client relationship management. Core operations focus on designing tailored commercial insurance programs for mid-sized enterprises, including property & casualty coverage, liability protection, and marine cargo policies for import/export businesses. A team of 85 licensed brokers and account managers supports approximately 1,200 active corporate accounts through regional offices strategically located near industrial hubs. The company maintains partnerships with 18 domestic and international carriers, enabling competitive placement of complex risks while retaining full fiduciary responsibility to clients. Key differentiators include multilingual policy documentation c...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    11000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2006,
    '"',
    'Regional Insurance Brokerage Corp',
    '"',
    '"',
    85,
    7442555.00,
    1265234.00,
    1265234.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of predictive analytics tools to identify cross-selling opportunities within existing. Expansion potential: Expansion of value-added services including captive insurance program design and parametric risk sol. Development area: Untapped potential in embedded insurance products through partnerships with regional fintech platfor',
    'active',
    true,
    '["/assets/listing-assets/listing-103-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 132: High-Value Jewelry & Watch Retailer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'High-Value Jewelry & Watch Retailer',
    'Other',
    'Philippines',
    'Cebu City',
    'This established retailer specializes in curated high-end jewelry and timepieces, combining boutique-level service with e-commerce capabilities to serve affluent clients in the Philippines'' growing luxury market. Operating since 2013, the business has cultivated relationships with certified gem suppliers and Swiss watchmakers to offer authenticated luxury items ranging from diamond-encrusted pieces to limited-edition horological collections. A team of 12 skilled professionals manages the full operational cycle including procurement, quality verification, personalized client consultations, and nationwide logistics through a hybrid model featuring a strategically located showroom and optimized digital storefront. The company differentiates itself through rigorous gemological certification processes (GIA/IGI accredited), exclusive manufacturer partnerships, and a proprietary clienteling system that tracks customer preferences for anniversary/bespoke commissions. With 80% repeat client...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2C retail',
    2013,
    '"',
    'High-Value Jewelry & Watch Retailer Corp',
    '"',
    '"',
    12,
    1394260.00,
    278852.00,
    278852.00,
    'New Ventures. "',
    'Growth opportunity: Leverage existing vendor relationships to develop private-label bridal jewelry line at accessible lu. Expansion potential: Introduce branded aftercare services including in-house polishing/insurance partnerships to increase. Development area: Expand digital client acquisition through luxury-focused social media campaigns targeting overseas F',
    'active',
    true,
    '["/assets/listing-assets/listing-104-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 133: Regional Locksmith & Security Solutions
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Locksmith & Security Solutions',
    'Other',
    'Vietnam',
    'Hanoi',
    'This established provider delivers comprehensive locksmith services and physical security solutions across residential and commercial sectors in Vietnam''s growing urban markets. Operating through a network of mobile technicians and centralized monitoring systems, the business specializes in emergency lockout response, high-security lock installations, access control systems, and preventive maintenance programs. Its core revenue derives from annual service contracts with property management firms, retail chains, and residential communities seeking 24/7 security infrastructure support. The operation utilizes GPS-enabled dispatch systems and proprietary technician training protocols to maintain <3-hour average response times across its coverage area. With 118 certified locksmiths and security engineers organized into regional service pods, the company has secured dominant market share in secondary cities through strategic partnerships with real estate developers and insurance provider...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Service contracts',
    2022,
    '"',
    'Regional Locksmith & Security Solutions Corp',
    '"',
    '"',
    118,
    5904750.00,
    590475.00,
    885713.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement predictive maintenance analytics using installed base data to upsell premium monitoring pa. Expansion potential: Develop franchise model to replicate urban service framework in underserved provincial markets.. Development area: Expand digital security offerings through partnerships with smart home technology providers to addre',
    'active',
    true,
    '["/assets/listing-assets/listing-105-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 134: Corporate Massage & Wellness Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Corporate Massage & Wellness Services',
    'Other',
    'Indonesia',
    'Bandung',
    'This company provides workplace wellness solutions through onsite corporate massage programs and stress management services across Indonesia. Operating since 2001, the business maintains contractual relationships with enterprise clients across banking, technology, and manufacturing sectors, delivering weekly wellness sessions at corporate offices and industrial facilities. A team of 185 certified therapists and support staff manages recurring service schedules through dedicated account managers and proprietary scheduling software. The operation combines logistical expertise in multisite coordination with therapeutic program development tailored to white-collar and blue-collar workforce needs. Established as one of Indonesia''s first corporate wellness providers, the company benefits from long-term contracts (3-5 year terms) with 82% client retention rate. Strategic value stems from preventive healthcare positioning in ASEAN''s third-largest economy, where workplace stress costs empl...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    12000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B Service Contracts',
    2001,
    '"',
    'Corporate Massage & Wellness Services Corp',
    '"',
    '"',
    185,
    12274559.00,
    1841183.00,
    1225988.00,
    'Lifestyle Change. "',
    'Growth opportunity: Pursue regional ASEAN expansion through strategic partnerships in Malaysia and Vietnam''s growing cor. Expansion potential: Develop digital wellness platform for client employee engagement and preventive care metrics trackin. Development area: Expand service menu to include ergonomic assessments and mental health workshops leveraging existing',
    'active',
    true,
    '["/assets/listing-assets/listing-106-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 135: Multi-State Optometry & Eyewear Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Multi-State Optometry & Eyewear Chain',
    'Other',
    'Indonesia',
    'Bandung',
    'This established multi-state optical enterprise operates an integrated network of full-service eyewear retail locations across strategic Indonesian markets. Combining comprehensive vision care services with contemporary eyewear merchandising, the business addresses both medical and lifestyle needs through its hybrid operational model. Day-to-day activities center around 60 trained staff members conducting eye examinations, dispensing prescription lenses, and selling designer frames across physical locations that balance clinical functionality with modern retail environments. The operation maintains relevance through dual revenue streams from (1) recurring optometric services including eye tests, contact lens fittings, and vision therapy consultations, and (2) high-margin eyewear sales encompassing prescription glasses, sunglasses, and specialty lenses. Its strategic positioning bridges healthcare necessities with fashion-conscious consumer preferences, capturing both mandatory visio...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Brick-and-mortar retail with service elements',
    2006,
    '"',
    'Multi-State Optometry & Eyewear Chain Corp',
    '"',
    '"',
    60,
    1856776.00,
    445626.00,
    445626.00,
    'Lifestyle Change. "',
    'Growth opportunity: Leverage existing geographic footprint to introduce boutique optical concepts targeting premium urba. Expansion potential: Expand optometric service offerings into high-growth specialty areas including pediatric vision ther. Development area: Implement e-commerce capabilities for contact lens subscriptions and non-prescription eyewear to cap',
    'active',
    true,
    '["/assets/listing-assets/listing-107-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 136: Personal Training & Fitness Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Personal Training & Fitness Franchise',
    'Other',
    'Thailand',
    'Chiang Mai',
    'This dynamic fitness enterprise operates a franchise network offering personalized training programs and wellness services across Thailand''s growing health-conscious market. Established in 2021, the business has developed a turnkey operational model supporting franchise owners through comprehensive training systems, proprietary workout methodologies, and centralized marketing resources. Day-to-day operations center on delivering science-backed fitness programs through certified trainers, combining one-on-one coaching with small group sessions tailored to diverse client needs ranging from weight management to sports-specific conditioning. The company maintains strategic positioning in urban centers and resort communities, capitalizing on Thailand''s US$6.3 billion wellness tourism industry while serving local residents through accessible neighborhood locations. Its value proposition lies in combining international fitness standards with culturally adapted programming, including modi...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Franchise model',
    2021,
    '"',
    'Personal Training & Fitness Franchise Corp',
    '"',
    '"',
    55,
    2670568.00,
    347173.00,
    347174.00,
    'Lifestyle Change. "',
    'Growth opportunity: Development of premium corporate wellness packages targeting Bangkok''s multinational company headqua. Expansion potential: Expansion into underserved secondary cities demonstrating 18% YoY GDP growth and limited quality fit. Development area: Implementation of mobile app-based training platforms to capture Thailand''s 94% smartphone penetrati',
    'active',
    true,
    '["/assets/listing-assets/listing-108-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 137: Commercial Pest Control Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Pest Control Services',
    'Other',
    'Indonesia',
    'Medan',
    'Operating across Indonesia''s major urban centers and industrial zones since 2000, this commercial pest control business has established itself as an essential service provider through maintenance contracts with corporate clients. The company delivers comprehensive solutions including rodent management, insect eradication, and preventive treatments for facilities ranging from food processing plants to hospitality venues. A workforce of 120 certified technicians maintains daily operations through zone-based service routes, supported by centralized scheduling systems and real-time monitoring of contract compliance. The tropical climate and stringent public health regulations in Southeast Asia create consistent demand, positioning the business as a critical partner for maintaining operational continuity in sensitive environments. Long-term relationships with multinational corporations and government agencies demonstrate its capacity to meet international sanitation standards through IS...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Service contracts',
    2000,
    '"',
    'Commercial Pest Control Services Corp',
    '"',
    '"',
    120,
    4079394.00,
    938260.00,
    938261.00,
    'Lifestyle Change. "',
    'Growth opportunity: Leverage existing municipal contracts to enter underpenetrated public sector markets including schoo. Expansion potential: Develop IoT-enabled monitoring systems for predictive pest control interventions and resource optimi. Development area: Expand service offerings into adjacent sanitation sectors such as air quality management or waste di',
    'active',
    true,
    '["/assets/listing-assets/listing-109-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 138: Regional Property Management Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Property Management Firm',
    'Real Estate & Property',
    'Indonesia',
    'Jakarta',
    'This established property management enterprise provides comprehensive operational solutions for commercial and residential real estate portfolios across Indonesia''s growing urban centers. Operating since 2007, the business supports property investors and institutional clients through full-cycle management services including tenant acquisition, facilities maintenance, lease administration, and financial reporting. Its team of 40 professionals utilizes cloud-based management platforms to oversee mixed-use developments, office complexes, and residential communities, with particular expertise in serving corporate clients requiring turnkey property solutions. The company maintains strategic positioning through long-term service contracts with recurring revenue streams, representing approximately 85% of total engagements. Buyers would inherit an infrastructure-light operation with established vendor networks, standardized operating procedures, and trained personnel capable of managing p...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2007,
    '"',
    'Regional Property Management Firm Corp',
    '"',
    '"',
    40,
    3076825.00,
    523060.00,
    418448.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Expand service footprint into emerging economic corridors through strategic partnerships with region. Expansion potential: Implement AI-driven predictive maintenance systems to enhance service margins and differentiate from. Development area: Develop energy efficiency consulting services leveraging existing maintenance teams to capitalize on',
    'active',
    true,
    '["/assets/listing-assets/listing-110-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 139: Commercial & Industrial Roofing Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial & Industrial Roofing Contractor',
    'Other',
    'India',
    'Pune',
    'The business operates as a specialized commercial and industrial roofing contractor serving corporate clients and institutional facilities across India''s growing construction sector. Established in 2020, the company provides end-to-end roofing solutions including installation, maintenance, and repair services for factories, warehouses, logistics parks, and large-scale commercial complexes. Its technical expertise spans conventional roofing systems, insulated metal panel installations, and solar-compatible roofing infrastructure tailored to India''s climate conditions. The operation maintains 185 skilled technicians and project managers organized into regional teams that handle approximately 250-300 active contracts annually through a hub-and-spoke operational model. Key differentiators include certified safety protocols aligned with international construction standards, proprietary project management software for materials tracking, and strategic partnerships with premium material ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2020,
    '"',
    'Commercial & Industrial Roofing Contractor Corp',
    '"',
    '"',
    185,
    12396706.00,
    1735538.00,
    1735539.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expand service offerings into complementary facade engineering and industrial insulation markets.. Expansion potential: Implement IoT-enabled roof monitoring systems to create recurring revenue through predictive mainten. Development area: Develop rooftop solar installation vertical leveraging existing industrial client relationships and',
    'active',
    true,
    '["/assets/listing-assets/listing-111-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 140: Custom Tailoring & Formalwear Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Custom Tailoring & Formalwear Chain',
    'Other',
    'Indonesia',
    'Bandung',
    'Positioned as a leading provider of bespoke formalwear solutions in Indonesia’s growing retail sector, this established custom tailoring chain combines traditional craftsmanship with modern e-commerce capabilities. Since 2016, the business has cultivated a reputation for delivering made-to-measure suits, traditional ethnic formalwear, and occasion-specific attire through eight strategically located showrooms across Greater Jakarta, Surabaya, and Bandung, complemented by a transactional website handling 28% of total orders. Daily operations center around in-store consultations with master tailors, regional fabric sourcing partnerships, and a centralized production facility employing 68 skilled artisans capable of fulfilling 350+ custom orders weekly. The company serves both premium individual clients (55% of revenue) requiring wedding attire or executive wardrobes, and corporate accounts (45%) providing uniform solutions for banking, hospitality, and government sectors. A vertically ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2C Service',
    2016,
    '"',
    'Custom Tailoring & Formalwear Chain Corp',
    '"',
    '"',
    105,
    5229718.00,
    1307429.00,
    653715.00,
    'New Ventures. "',
    'Growth opportunity: Implement AI-driven style recommendation engine to boost e-commerce conversion rates and average ord. Expansion potential: Expand mobile tailoring units to underserved secondary cities using existing regional production hub. Development area: Develop private label accessories line leveraging existing customer traffic for higher-margin add-on',
    'active',
    true,
    '["/assets/listing-assets/listing-112-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 141: Fleet Taxi & Livery Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Fleet Taxi & Livery Service',
    'Other',
    'Thailand',
    'Chiang Mai',
    'The business operates a modern fleet management and premium transportation service catering to corporate clients, tourism operators, and high-end hospitality providers across Thailand''s urban centers and major tourist destinations. Through structured service contracts, the company coordinates daily dispatch operations for 300+ vehicles ranging from standard sedans to luxury vans, supported by centralized maintenance facilities and a proprietary scheduling platform. A workforce of 250 trained drivers and logistics personnel enables 24/7 coverage for recurring airport transfers, executive commutes, and hotel partner shuttle services. Strategic positioning in Thailand''s rebounding tourism sector is reinforced by multi-year agreements with five international hotel chains and three corporate accounts representing 60% of recurring bookings. Operational infrastructure includes real-time GPS tracking systems, automated billing integrations for contract clients, and a dispatch center manag...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Service contracts',
    2024,
    '"',
    'Fleet Taxi & Livery Service Corp',
    '"',
    '"',
    250,
    6253395.00,
    1500814.00,
    1500815.00,
    'New Ventures. "',
    'Growth opportunity: Cross-selling corporate clients premium event transportation packages during off-peak service window. Expansion potential: Expansion of electric vehicle fleet to qualify for government green transportation incentives and lu. Development area: Development of direct consumer booking channels through mobile app integration to capture walk-in to',
    'active',
    true,
    '["/assets/listing-assets/listing-113-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 142: Commercial & Structural Welding Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial & Structural Welding Services',
    'Other',
    'India',
    'Hyderabad',
    'Specializing in precision welding solutions for industrial and construction applications, this established business serves as a critical partner to infrastructure developers, manufacturing facilities, and engineering firms across India. With two decades of operational history, the company has positioned itself as a trusted provider of structural steel welding, custom fabrication, and specialized repair services for heavy machinery. Core operations revolve around project-based contracts for commercial building frameworks, industrial plant maintenance, and infrastructure components, supported by teams of certified welders operating from centralized workshops and mobile service units. The business maintains strategic partnerships with steel suppliers and construction conglomerates while employing rigorous quality control protocols aligned with international welding standards. Its value proposition centers on technical expertise in complex welding configurations, rapid project turnaroun...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2003,
    '"',
    'Commercial & Structural Welding Services Corp',
    '"',
    '"',
    140,
    8481548.00,
    2035571.00,
    1703589.00,
    'Retirement. "',
    'Growth opportunity: Develop strategic partnerships with renewable energy firms for wind turbine and solar farm structura. Expansion potential: Expand service offerings into corrosion-resistant alloy welding for coastal infrastructure projects.. Development area: Implement digital quoting systems and fleet tracking technology to improve mobile unit utilization r',
    'active',
    true,
    '["/assets/listing-assets/listing-114-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 143: Used Car Dealership Network
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Used Car Dealership Network',
    'Other',
    'Malaysia',
    'Kuala Lumpur',
    'This established used car dealership network operates Malaysia''s leading digital platform connecting buyers with rigorously inspected pre-owned vehicles. Transitioning from traditional showrooms to a hybrid online model in the mid-2010s, the business demonstrates adaptability through its nationwide virtual showroom complemented by strategic regional refurbishment centers and test drive hubs. Daily operations focus on vehicle acquisition through trade-in programs and dealer partnerships, comprehensive mechanical/esthetic reconditioning processes, and digital sales through proprietary inventory management systems. The platform serves both individual consumers and corporate fleet operators, with particular strength in mid-range family vehicles and commercial vans. Operating in Malaysia''s RM40 billion used car market, the company differentiates through third-party certification partnerships, flexible financing integrations, and a unique trade-up guarantee program that builds customer ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    18000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'Online platform',
    1999,
    '"',
    'Used Car Dealership Network Corp',
    '"',
    '"',
    70,
    12166131.00,
    2311564.00,
    1964830.00,
    'Retirement. "',
    'Growth opportunity: Implement AI-driven pricing optimization and personalized inventory recommendations to boost convers. Expansion potential: Develop premium certified pre-owned program leveraging existing refurbishment infrastructure to acce. Development area: Expand digital remarketing capabilities for corporate fleet operators seeking turncycle management s',
    'active',
    true,
    '["/assets/listing-assets/listing-115-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 144: Frozen Yogurt & Dessert Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Frozen Yogurt & Dessert Chain',
    'Other',
    'Malaysia',
    'Kota Kinabalu',
    'Operating within Malaysia’s thriving food and beverage sector, this established frozen yogurt and dessert chain has cultivated a distinctive presence through its combination of customizable treats and modern café-style experiences. The business operates multiple strategically located outlets offering artisanal frozen yogurt bases, premium toppings, and complementary dessert items like waffles and specialty beverages. Its operational model balances dine-in foot traffic with takeaway orders, supported by an efficient hub-and-spoke production system centered around a main commissary kitchen that ensures consistent quality across locations. The concept capitalizes on growing consumer demand for indulgence-with-balance offerings, positioning itself as a lifestyle destination through Instagram-worthy store designs and seasonal menu innovations. A workforce of 70 trained staff maintains daily operations encompassing ingredient preparation, customer service, and inventory management, with s...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Dine-in/Takeout',
    2017,
    '"',
    'Frozen Yogurt & Dessert Chain Corp',
    '"',
    '"',
    70,
    5139726.00,
    976547.00,
    976548.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Development of retail product lines featuring proprietary frozen yogurt bases and signature toppings. Expansion potential: Expansion into complementary daypart offerings through breakfast parfaits or afternoon tea sets to i. Development area: Implementation of mobile ordering technology and delivery platform partnerships to capture convenien',
    'active',
    true,
    '["/assets/listing-assets/listing-116-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 145: Regional Sandwich Shop Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Regional Sandwich Shop Franchise',
    'Other',
    'Indonesia',
    'Bandung',
    'This established sandwich shop franchise operates multiple locations across urban centers in Indonesia, combining quick-service efficiency with a curated menu of Western-style sandwiches adapted to local taste preferences. Operating under a proven franchise model since 2022, the business has developed standardized processes for food preparation, inventory management, and staff training that maintain quality across all outlets. Day-to-day operations focus on high-volume lunch service complemented by all-day takeaway options, with a customer base comprising office workers, delivery app users, and families seeking affordable casual dining. The company maintains strategic positioning through prime retail locations near commercial districts and transit hubs, supported by a centralized commissary kitchen that ensures consistent supply chain operations. For potential acquirers, the operation offers immediate cash flow through its established brand recognition in the quick-service segment, ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Dine-in/Takeout',
    2022,
    '"',
    'Regional Sandwich Shop Franchise Corp',
    '"',
    '"',
    120,
    5602416.00,
    1120483.00,
    840362.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implement cloud kitchen model to serve residential areas beyond current physical locations through d. Expansion potential: Expand private-label beverage program featuring locally sourced ingredients to increase average tran. Development area: Develop breakfast daypart offerings to capitalize on morning commuter traffic in existing high-footf',
    'active',
    true,
    '["/assets/listing-assets/listing-117-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 146: Cold-Pressed Juice & Health Food Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Cold-Pressed Juice & Health Food Chain',
    'Other',
    'Vietnam',
    'Hanoi',
    'Operating at the intersection of nutrition and convenience, this established Vietnamese health food enterprise has cultivated a loyal following through its network of contemporary retail outlets specializing in cold-pressed juices and wellness-focused cuisine. With operational roots dating back to 2001, the business capitalizes on Vietnam''s growing middle class and increasing consumer preference for functional nutrition, positioning itself as a pioneer in the premium health food segment. Core offerings include daily-made cold-pressed juices utilizing hyperlocal tropical fruits, plant-based meal bowls, and nutrient-dense snacks - all prepared in small batches using traditional Vietnamese preparation methods adapted for modern health-conscious consumers. The operation maintains tight quality control through vertical integration of key processes including produce sourcing from contracted regional farms, in-house cold-press production facilities, and centralized kitchen operations supp...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Dine-in/Takeout',
    2001,
    '"',
    'Cold-Pressed Juice & Health Food Chain Corp',
    '"',
    '"',
    122,
    4861746.00,
    486174.00,
    388940.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implement AI-driven inventory management system to optimize perishable goods utilization across loca. Expansion potential: Expand private label offerings through Vietnam''s growing modern trade channels and e-health platform. Development area: Develop subscription-based delivery model leveraging existing production capacity and urban fulfillm',
    'active',
    true,
    '["/assets/listing-assets/listing-118-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 147: Large-Scale Catering & Events Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Large-Scale Catering & Events Company',
    'Other',
    'India',
    'Jaipur',
    'Established in 1999, this large-scale catering enterprise has become a cornerstone of India''s corporate and social events landscape. Operating through a B2B model, the company provides end-to-end culinary solutions for high-volume events ranging from 500 to 5,000+ attendees, serving multinational corporations, luxury hotel chains, and premium wedding planners. Daily operations leverage a 400-member workforce divided into specialized teams handling ingredient sourcing, industrial-scale food production, and onsite event execution through a hub-and-spoke facility network across major metropolitan areas. The business maintains market leadership through its patented cold-chain logistics system ensuring consistent quality for simultaneous multi-location events – a critical differentiator in serving India''s geographically dispersed corporate clients. Strategic value stems from 85% repeat business from blue-chip clients and exclusive vendor contracts with premium venues, creating substant...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Catering Services',
    1999,
    '"',
    'Large-Scale Catering & Events Company Corp',
    '"',
    '"',
    400,
    6072461.00,
    1093042.00,
    1093043.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Geographic expansion into secondary cities through asset-light franchise models targeting India''s gr. Expansion potential: Development of premium packaged food lines leveraging existing production infrastructure for retail . Development area: Implementation of AI-driven demand forecasting to optimize seasonal staffing and reduce food waste.',
    'active',
    true,
    '["/assets/listing-assets/listing-119-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 148: Multi-State Liquor Store Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Multi-State Liquor Store Chain',
    'Other',
    'India',
    'Bangalore',
    'Operating across multiple Indian states, this established liquor retail chain has built a reputable presence in the competitive alcobeverage sector through strategically located storefronts and a customer-centric approach. The business capitalizes on India’s evolving consumption patterns by offering a curated selection of domestic and imported spirits, wines, and beers tailored to regional preferences. Its vertically integrated operations combine premium high-street locations with licensed dark stores supporting last-mile delivery, catering to both walk-in patrons and e-commerce orders through partnerships with leading delivery platforms. A dedicated workforce of 95 trained staff maintains stringent inventory controls and age verification protocols while fostering relationships with regular clientele through personalized service. The company’s defensible market position stems from hard-to-replicate liquor licenses in prime urban corridors, established procurement agreements with maj...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Retail B2C',
    2020,
    '"',
    'Multi-State Liquor Store Chain Corp',
    '"',
    '"',
    95,
    3810929.00,
    762185.00,
    609749.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expand into corporate gifting and subscription services targeting India’s growing premium consumer s. Expansion potential: Introduce private-label product lines leveraging existing supplier relationships for higher margin o. Development area: Develop proprietary e-commerce platform to capture direct online sales and customer data ownership.',
    'active',
    true,
    '["/assets/listing-assets/listing-120-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 149: Footwear Retail Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Footwear Retail Chain',
    'Other',
    'India',
    'Ahmedabad',
    'Positioned at the forefront of India''s dynamic footwear market, this business operates a network of modern brick-and-mortar stores strategically located across key urban and suburban hubs. Specializing in affordable yet stylish footwear for adults and children, the company has cultivated strong brand recognition through consistent quality, trend-responsive inventory, and accessible price points. A workforce of 260 trained staff members supports daily operations spanning inventory procurement, visual merchandising, and customer service, with robust systems managing regional distribution centers that enable rapid stock replenishment across all locations. The company maintains particular strength in secondary cities where premium footwear options remain limited, capturing aspirational middle-class shoppers through bright, contemporary store formats that elevate the footwear shopping experience above traditional market stalls. Strategic buyer appeal lies in its established infrastructu...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Brick-and-Mortar Retail',
    2016,
    '"',
    'Footwear Retail Chain Corp',
    '"',
    '"',
    260,
    4509894.00,
    676484.00,
    676484.00,
    'Wealth Diversification. "',
    'Growth opportunity: Operational efficiencies through advanced inventory forecasting tools and RFID stock tracking system. Expansion potential: Expansion into complementary accessories like orthopedic insoles or weather-specific footwear to inc. Development area: Implementation of e-commerce capabilities to capture India''s rapidly growing online footwear market',
    'active',
    true,
    '["/assets/listing-assets/listing-121-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 150: Children's Toy & Game Retailer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Children''s Toy & Game Retailer',
    'Other',
    'Thailand',
    'Chiang Mai',
    'Positioned at the intersection of play and learning within Thailand''s thriving family entertainment sector, this business operates as a modern omnichannel retailer specializing in curated toys, games, and educational products. Through strategically located urban storefronts and an expanding e-commerce platform, the company serves both domestic families and international tourists seeking culturally relevant play solutions. Its inventory balances globally recognized branded merchandise with locally sourced artisanal toys, creating a differentiated product mix that appeals to Thailand''s growing middle class and premium gift shoppers. The operation employs a vertically integrated supply chain with direct partnerships with 85+ Asian manufacturers, enabling rapid inventory turnover and margin optimization. A workforce of 120 manages end-to-end operations including in-store experiences, regional logistics from a central Bangkok warehouse, and digital customer engagement through localized...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Retail B2C',
    2024,
    '"',
    'Children''s Toy & Game Retailer Corp',
    '"',
    '"',
    120,
    7054166.00,
    1340291.00,
    1072233.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expansion of corporate gifting programs targeting Thailand''s growing family-friendly workplace initi. Expansion potential: Implementation of augmented reality features for virtual toy try-ons could enhance digital conversio. Development area: Untapped potential in educational STEM/STEAM product verticals aligned with Thailand''s national lear',
    'active',
    true,
    '["/assets/listing-assets/listing-122-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 151: Automotive Parts Distributor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Automotive Parts Distributor',
    'Other',
    'Indonesia',
    'Medan',
    'Operating at the heart of Indonesia''s expanding automotive ecosystem, this established distributor serves as a critical supply chain partner for vehicle service providers and parts retailers nationwide. The company maintains an extensive catalog of mechanical components, electrical systems, and maintenance consumables tailored to Southeast Asia''s diverse vehicle parc. Through strategically located warehouses in Java and Sumatra, the business provides just-in-time deliveries to more than 850 active clients including multi-location repair franchises and independent workshops. A dedicated technical support team assists customers with parts identification and application guidance, while automated inventory replenishment systems ensure 98% order fulfillment rates. The operation benefits from long-standing partnerships with both international manufacturers and regional component producers, creating a hybrid sourcing model that combines premium branded items with cost-competitive local a...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B',
    2009,
    '"',
    'Automotive Parts Distributor Corp',
    '"',
    '"',
    98,
    9812081.00,
    1275570.00,
    1092131.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implement vendor-managed inventory programs with key accounts to deepen client integration and secur. Expansion potential: Expand product range into electric vehicle components and charging accessories to align with Indones. Development area: Develop e-commerce portal with VIN-based parts lookup functionality to capture emerging demand from',
    'active',
    true,
    '["/assets/listing-assets/listing-123-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 152: National Dance Studio Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'National Dance Studio Franchise',
    'Other',
    'India',
    'Kolkata',
    'This established dance studio franchise operates a national network offering structured training across multiple dance genres including classical Indian styles, Bollywood, contemporary, and fitness-oriented programs. The business has cultivated a reputable brand through standardized franchise operations, comprehensive instructor training protocols, and community-focused programming appealing to students aged 4-65. Its vertically integrated model combines centralized curriculum development with localized studio management, supported by proprietary operational playbooks and ongoing franchisee mentoring. Strategic value stems from recurring membership revenue streams, a capital-efficient expansion model leveraging franchisee investments, and established vendor partnerships for dancewear retail operations. The company maintains competitive differentiation through its hybrid approach preserving cultural traditions while incorporating modern fitness trends, positioning it as both an arts ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Franchise model',
    2002,
    '"',
    'National Dance Studio Franchise Corp',
    '"',
    '"',
    220,
    8817540.00,
    1410806.00,
    1128645.00,
    'New Ventures. "',
    'Growth opportunity: Strategic partnerships with schools and corporate wellness programs to establish institutional dance. Expansion potential: Development of subscription-based digital coaching platforms to complement in-person instruction.. Development area: Untapped potential in secondary cities through micro-studio formats requiring smaller footprints and',
    'active',
    true,
    '["/assets/listing-assets/listing-124-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 153: Martial Arts School Chain
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Martial Arts School Chain',
    'Education & Training',
    'India',
    'Chennai',
    'Operating as a multi-unit franchise network, this martial arts education provider delivers standardized training programs across urban and suburban markets in India. The business operates through a hub-and-spoke model with centrally developed curriculum modules covering diverse disciplines including karate, taekwondo, and self-defense techniques, adapted for different age groups from children to adults. Daily operations focus on franchisee support through instructor certification programs, marketing collateral distribution, and centralized scheduling systems coordinating class timetables across locations. With 85 full-time staff managing regional training centers and corporate support functions, the enterprise maintains quality control through monthly franchise audits and a proprietary digital platform tracking student progression metrics. The company capitalizes on growing health consciousness and parental demand for structured extracurricular activities, positioning itself as a pr...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'Franchise model',
    2019,
    '"',
    'Martial Arts School Chain Corp',
    '"',
    '"',
    85,
    1913902.00,
    478475.00,
    478476.00,
    'New Ventures. "',
    'Growth opportunity: Introduce complementary wellness services including meditation programs and sports nutrition counsel. Expansion potential: Expand franchise network into underserved tier-2 cities with younger demographic profiles.. Development area: Develop digital training modules and on-demand video platforms to complement physical classes.',
    'active',
    true,
    '["/assets/listing-assets/listing-125-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 154: Commercial Driving & Fleet Training School
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Driving & Fleet Training School',
    'Education & Training',
    'India',
    'Bengaluru',
    'Operating as a specialized provider within India''s commercial transportation sector, this established training organization delivers comprehensive driver education programs tailored for corporate clients and fleet operators. The business maintains focus on safety compliance and skill development through modular courses spanning defensive driving techniques, advanced vehicle handling, and logistics management protocols. Leveraging 13 years of industry presence, it operates 18 training centers equipped with simulation technology and purpose-built driving ranges across strategic industrial corridors. The company primarily serves major logistics providers and automotive manufacturers through annual service contracts that account for 85% of recurring engagements. Core operational infrastructure includes a 260-member team of certified instructors and road safety experts, supported by a centralized scheduling system managing over 1,200 corporate trainees monthly. Its market differentiatio...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Training Services',
    2011,
    '"',
    'Commercial Driving & Fleet Training School Corp',
    '"',
    '"',
    260,
    7831548.00,
    1957887.00,
    1566310.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Opportunity to cross-sell fleet management consulting services to existing corporate training client. Expansion potential: Untapped market potential in electric vehicle operator certification programs as commercial fleets t. Development area: Underutilized capacity for digital course delivery expansion through existing technology infrastruct',
    'active',
    true,
    '["/assets/listing-assets/listing-126-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 155: Tanning Salon Franchise
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Tanning Salon Franchise',
    'Other',
    'Vietnam',
    'Hanoi',
    'Operating within Vietnam''s expanding personal care sector, this established tanning salon franchise has cultivated a strong market presence through standardized service delivery and strategic urban locations. The business operates through a network of modern facilities offering sunbed sessions, spray tanning applications, and complementary skincare products, catering primarily to urban professionals and style-conscious demographics aged 18-45. Its franchise model incorporates centralized training academies, proprietary equipment maintenance protocols, and brand-approved interior designs that ensure consistent customer experiences across all locations. The company maintains competitive differentiation through rigorous staff certification programs, UV exposure monitoring systems, and membership packages that drive repeat visits. Strategic partnerships with local fitness centers and beauty clinics create cross-promotional opportunities, while a cloud-based reservation system enables e...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    15000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'Service-based franchise',
    2018,
    '"',
    'Tanning Salon Franchise Corp',
    '"',
    '"',
    300,
    12291921.00,
    2089626.00,
    2089627.00,
    'Retirement. "',
    'Growth opportunity: Expansion into adjacent beauty services such as red light therapy or vitamin infusion treatments. Expansion potential: Development of premium mobile tanning services for corporate events and private functions. Development area: Implementation of targeted digital marketing campaigns to engage younger demographics through social',
    'active',
    true,
    '["/assets/listing-assets/listing-127-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 156: Commercial & Fleet Bicycle Supplier
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial & Fleet Bicycle Supplier',
    'Other',
    'India',
    'Pune',
    'Operating at the intersection of urban mobility and commercial logistics, this established B2B enterprise has served as a critical supplier of commercial-grade bicycles and fleet solutions across India since 1998. The business specializes in providing durable, purpose-built cycles tailored for last-mile delivery networks, municipal bike-sharing programs, and corporate campus mobility systems. Through strategic partnerships with domestic manufacturers and global component suppliers, it maintains a catalog of 80+ standardized models alongside custom-configured solutions, balancing volume production capabilities with specialized client requirements. A vertically integrated operation combines warehousing, assembly quality control, and nationwide distribution through regional hubs, supported by a proprietary e-commerce portal handling 65% of recurring orders. Core clients include major e-commerce fulfillment platforms, food delivery aggregators, and government smart city initiatives, wit...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    12000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    1998,
    '"',
    'Commercial & Fleet Bicycle Supplier Corp',
    '"',
    '"',
    120,
    10696621.00,
    2460222.00,
    2459223.00,
    'Wealth Diversification. "',
    'Growth opportunity: Digital twin technology integration would enable predictive maintenance upselling across existing fl. Expansion potential: Underutilized dealership network could be expanded through franchise models in tier-2/3 cities.. Development area: Untapped potential in electric cargo bike segment aligns with government subsidies for sustainable l',
    'active',
    true,
    '["/assets/listing-assets/listing-128-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 157: Bridal & Formalwear Retail Group
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Bridal & Formalwear Retail Group',
    'Other',
    'India',
    'Jaipur',
    'Positioned at the intersection of tradition and contemporary fashion, this bridal and formalwear retail group has carved a distinctive niche in India’s thriving wedding apparel market through its hybrid retail model. Operating since 2019, the business combines curated physical showrooms with a growing e-commerce presence, offering an extensive collection of bridal lehengas, designer sarees, and occasion wear that blends regional craftsmanship with modern silhouettes. Its inventory strategy focuses on maintaining 40% evergreen designs alongside seasonal collections, supported by a network of 35 domestic suppliers and in-house tailoring teams for customization. With 12 physical locations across tier-1 and tier-2 cities complemented by a transactional website and third-party marketplace partnerships, the company serves approximately 18,000 customers annually through both appointment-based consultations and walk-in traffic. The operation leverages a 70% inventory turnover ratio through ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'Retail sales',
    2019,
    '"',
    'Bridal & Formalwear Retail Group Corp',
    '"',
    '"',
    80,
    1962239.00,
    392447.00,
    147168.00,
    'Wealth Diversification. "',
    'Growth opportunity: Strategic partnerships with wedding planners and venue operators could create captive demand channel. Expansion potential: Implementation of AI-driven virtual try-on tools and regional language support would strengthen e-co. Development area: Untapped potential in adjacent categories such as bridal accessories, groom’s formalwear, and rental',
    'active',
    true,
    '["/assets/listing-assets/listing-129-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 158: Professional Photography Equipment Retailer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Professional Photography Equipment Retailer',
    'Other',
    'Thailand',
    'Khon Kaen',
    'Established in 1996, this company operates as a specialized retailer catering to photography professionals and enthusiasts through both physical and digital channels in Thailand''s growing visual arts market. The business maintains a curated inventory of premium cameras, lenses, lighting equipment, and accessories from established global brands, complemented by niche products meeting professional studio requirements. A team of 25 photography-knowledgeable staff supports daily operations spanning retail sales, equipment demonstrations, technical consultations, and workshop coordination through a flagship Bangkok location and optimized e-commerce platform handling nationwide deliveries. Its market position benefits from nearly three decades of serving Thailand''s thriving creative industries, with particular strength among commercial photographers, content studios, and serious hobbyists seeking expert guidance. Strategic value lies in its reputation as a technical authority, hybrid re...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2C Retail',
    1996,
    '"',
    'Professional Photography Equipment Retailer Corp',
    '"',
    '"',
    25,
    2441120.00,
    488224.00,
    366168.00,
    'Lifestyle Change. "',
    'Growth opportunity: Enhance e-commerce capabilities with AI-powered gear recommendation tools and virtual equipment test. Expansion potential: Develop targeted B2B sales program for corporate clients and media production houses requiring bulk . Development area: Expand educational monetization through structured photography masterclasses leveraging existing stu',
    'active',
    true,
    '["/assets/listing-assets/listing-130-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 159: Commercial Signage & Graphics Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Commercial Signage & Graphics Company',
    'Other',
    'Indonesia',
    'Yogyakarta',
    'Operating at the intersection of visual communication and brand strategy, this established commercial signage specialist has served as a critical partner to Indonesian businesses for over 25 years. The company executes complete large-format graphics solutions including architectural wayfinding systems, retail store branding installations, and customized environmental graphics for corporate campuses. Its production workflow integrates computer-aided design with state-of-the-art digital printing technologies and CNC fabrication capabilities, supporting projects ranging from vehicle fleet wraps to permanent building-mounted displays. A team of 65 skilled technicians, project managers, and client service professionals maintains operations through three primary revenue streams: recurring corporate account maintenance contracts (40% of business), competitive-bid commercial construction projects (35%), and direct-to-business marketing department partnerships (25%). The business holds parti...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B',
    1997,
    '"',
    'Commercial Signage & Graphics Company Corp',
    '"',
    '"',
    65,
    3230183.00,
    710640.00,
    604044.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implement advanced CRM system to systematically upsell adjacent graphic design and branding consulta. Expansion potential: Develop subscription-based signage content management services leveraging existing maintenance contr. Development area: Expand digital signage offerings and interactive display capabilities to address growing smart build',
    'active',
    true,
    '["/assets/listing-assets/listing-131-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 160: Fleet Graphics & Vehicle Wrap Installer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Fleet Graphics & Vehicle Wrap Installer',
    'Other',
    'India',
    'Ahmedabad',
    'Established in 2006, this specialized provider operates at the intersection of marketing solutions and automotive customization, delivering comprehensive fleet branding services to corporate clients across India. The company focuses on high-quality vehicle wrap installation using advanced adhesive vinyl technologies and custom graphic design capabilities, serving logistics firms, ride-sharing platforms, and enterprise marketing departments through organized regional teams. Its operational backbone features a 150-member workforce divided into mobile installation crews, in-house design studios, and account management divisions, supported by a centralized project coordination system ensuring nationwide service consistency. Strategic value stems from established partnerships with material suppliers, proprietary wrap durability testing protocols, and ownership of specialized mobile workshop vehicles enabling on-site client service. The business maintains defensible market positioning thr...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Services',
    2006,
    '"',
    'Fleet Graphics & Vehicle Wrap Installer Corp',
    '"',
    '"',
    150,
    8123409.00,
    893574.00,
    893575.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Strategic partnerships with electric vehicle manufacturers and charging networks to establish first-. Expansion potential: Expansion into adjacent industrial wrapping services for machinery, warehouse interiors, and retail . Development area: Untapped potential in developing subscription-based digital design asset management platforms for fl',
    'active',
    true,
    '["/assets/listing-assets/listing-132-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 161: Office Furniture Dealership
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Office Furniture Dealership',
    'Other',
    'India',
    'Chennai',
    'This established office furniture dealership operates as a key B2B solutions provider in India’s growing commercial furnishings sector, serving corporate clients, educational institutions, and coworking spaces since 2016. The business combines showroom-based consultations with a streamlined e-commerce platform, offering ergonomic workstations, modular meeting systems, and customized layout design services. Its operations leverage strategic partnerships with certified manufacturers and a 35-member team specializing in space planning, bulk order fulfillment, and post-installation maintenance contracts. The company maintains competitive positioning through exclusive distribution rights for mid-premium furniture lines and a proprietary project management system that coordinates deliveries across 18 states. Strategic advantages include recurring revenue from corporate account retainer agreements and a 78% repeat client rate among enterprise customers. With India’s office space sector pro...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2016,
    '"',
    'Office Furniture Dealership Corp',
    '"',
    '"',
    35,
    2098484.00,
    419696.00,
    839394.00,
    'Retirement. "',
    'Growth opportunity: Develop a dedicated vertical serving India’s rapidly expanding healthcare infrastructure sector.. Expansion potential: Implement AI-driven space planning software to enhance client consultation capabilities.. Development area: Expand into hybrid workplace solutions including acoustic pods and hot-desking equipment for flexibl',
    'active',
    true,
    '["/assets/listing-assets/listing-133-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 162: Copier & Managed Print Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Copier & Managed Print Services',
    'Other',
    'Indonesia',
    'Bandung',
    'The business operates as a specialized provider of copier equipment solutions and managed print services for corporate clients across Indonesia. Established in 2000, the company has evolved into a trusted partner for organizations seeking to optimize document workflows through a service-oriented model combining hardware provision, maintenance support, and consumables management. Core operations center on servicing long-term contracts with mid-sized to large enterprises across banking, education, and government sectors, supported by a 60-member team of certified technicians, account managers, and logistics personnel. Its value proposition lies in reducing clients’ operational costs through print volume monitoring, automated supply replenishment systems, and predictive maintenance protocols enabled by IoT-connected devices. The company maintains strategic partnerships with major OEM manufacturers, allowing customized leasing arrangements that lock in multi-year revenue streams. Market...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B Service contracts',
    2000,
    '"',
    'Copier & Managed Print Services Corp',
    '"',
    '"',
    60,
    3042443.00,
    760610.00,
    760611.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implement AI-driven supply chain optimization to reduce service vehicle downtime and parts inventory. Expansion potential: Leverage existing corporate relationships to introduce print-related cybersecurity audits and compli. Development area: Expand into adjacent workflow automation services including secure document management and digital a',
    'active',
    true,
    '["/assets/listing-assets/listing-134-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 163: IT Hardware Reseller (VAR)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'IT Hardware Reseller (VAR)',
    'Other',
    'India',
    'Jaipur',
    'Founded in 2017, this IT hardware reseller operates as a value-added partner for enterprise and institutional clients across India''s growing technology sector. The business specializes in procuring and configuring computing infrastructure from tier-1 manufacturers, delivering customized solutions that address specific client requirements across server architecture, network systems, and endpoint devices. Core operations combine strategic procurement logistics with technical integration services, supporting clients through equipment lifecycle management from needs assessment to post-deployment optimization. A dedicated team of 45 professionals manages vendor partnerships, solution engineering, and account management through structured divisions handling procurement, technical support, and client relations. The company has carved a niche serving government entities and educational institutions through competitive bidding processes, complemented by commercial contracts with mid-market ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    9000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2017,
    '"',
    'IT Hardware Reseller (VAR) Corp',
    '"',
    '"',
    45,
    8690114.00,
    1564220.00,
    1407800.00,
    'Wealth Diversification. "',
    'Growth opportunity: Implement digital procurement platform to streamline bidding processes and enhance client self-servi. Expansion potential: Expand geographic coverage through regional partnerships in underserved Tier 2/3 cities.. Development area: Develop managed IT services division to capitalize on existing client infrastructure refresh cycles.',
    'active',
    true,
    '["/assets/listing-assets/listing-135-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 164: Telecommunications Contractor
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Telecommunications Contractor',
    'Other',
    'Thailand',
    'Chiang Mai',
    'Operating within Thailand''s rapidly evolving telecommunications sector since 2003, this established contractor provides mission-critical infrastructure solutions to corporate clients and communication service providers. The business specializes in end-to-end network deployment including fiber optic installation, tower maintenance, and enterprise-grade system integration, supported by a 108-member team of certified technicians and project managers. Its operational backbone combines two decades of localized expertise with ISO-certified processes for site surveys, equipment sourcing, and compliance management. A diversified client portfolio spanning banking institutions, industrial parks, and regional ISPs ensures recurring revenue through multi-year service agreements, with 78% of current contracts featuring automatic renewal clauses. Strategic advantages include proprietary inventory tracking systems that reduce equipment downtime by 40%, along with long-standing partnerships with m...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B Service Contracts',
    2003,
    '"',
    'Telecommunications Contractor Corp',
    '"',
    '"',
    108,
    5400592.00,
    594065.00,
    594065.00,
    'Lifestyle Change. "',
    'Growth opportunity: Implementation of AI-assisted network monitoring could create new managed service revenue streams.. Expansion potential: Underutilized workforce capacity allows immediate 30% contract volume increase without new hires.. Development area: Untapped potential in government smart city initiatives requiring street-level IoT infrastructure ro',
    'active',
    true,
    '["/assets/listing-assets/listing-136-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 165: Fiber Optic Installation Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Fiber Optic Installation Company',
    'Other',
    'Indonesia',
    'Makassar',
    'The business operates as a specialized fiber optic network installation provider serving enterprise and institutional clients across Indonesia''s rapidly expanding digital infrastructure market. Established in 2023, the company focuses on turnkey solutions for high-speed connectivity projects, including fiber trenching, cable laying, splicing, and network testing services. Day-to-day operations center on managing installation crews across multiple concurrent projects, with particular expertise in navigating Indonesia''s complex regulatory environment for right-of-way permissions and municipal coordination. The company maintains strategic partnerships with major telecommunications equipment distributors and serves a diversified client base of telecom carriers, ISPs, and corporate campus operators. Its value proposition combines rapid deployment capabilities with a deep understanding of regional infrastructure challenges, positioning it as a preferred vendor for time-sensitive connect...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Services',
    2023,
    '"',
    'Fiber Optic Installation Company Corp',
    '"',
    '"',
    75,
    4928806.00,
    690032.00,
    621030.00,
    'Retirement. "',
    'Growth opportunity: Implement predictive maintenance AI platforms to upsell network optimization services to existing cl. Expansion potential: Develop strategic alliances with renewable energy providers to co-locate fiber routes with new solar. Development area: Expand service offerings to include in-building microtrenching solutions for high-density commercial',
    'active',
    true,
    '["/assets/listing-assets/listing-137-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 166: Cell Tower Maintenance Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Cell Tower Maintenance Service',
    'Other',
    'Philippines',
    'Cebu City',
    'Established business with strong growth potential.',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2009,
    '"',
    'Cell Tower Maintenance Service Corp',
    '"',
    '"',
    110,
    1933186.00,
    309309.00,
    502629.00,
    'New Ventures. "',
    'Multiple growth opportunities available',
    'active',
    true,
    '["/assets/listing-assets/listing-138-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 167: Broadcast Engineering Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Broadcast Engineering Services',
    'Other',
    'India',
    'Ahmedabad',
    'Operating at the intersection of technology and media infrastructure, this established broadcast engineering provider delivers mission-critical technical services to India''s evolving media landscape. The business specializes in designing, installing, and maintaining broadcast systems for television networks, radio stations, and streaming platforms, with core capabilities spanning transmission infrastructure, studio technical operations, and IP-based content distribution. Its team of 145 certified engineers supports major clients through long-term service contracts encompassing system health monitoring, equipment lifecycle management, and compliance with evolving digital broadcasting standards. The company has strategically positioned itself as a technical partner for media enterprises navigating India''s rapid digitization of broadcast infrastructure, maintaining active certifications with global equipment manufacturers and regulatory bodies. A combination of recurring maintenance ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    7000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2002,
    '"',
    'Broadcast Engineering Services Corp',
    '"',
    '"',
    145,
    7246215.00,
    1811553.00,
    1449243.00,
    'Retirement. "',
    'Growth opportunity: Leverage India''s technical talent base to establish offshore broadcast engineering support for inter. Expansion potential: Develop proprietary software-defined broadcast solutions to address growing demand for cloud-based p. Development area: Expand service offerings to support emerging OTT platforms and hybrid IP-broadcast architectures gai',
    'active',
    true,
    '["/assets/listing-assets/listing-139-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 168: Satellite Communications Provider
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Satellite Communications Provider',
    'Other',
    'India',
    'Chennai',
    'This company operates as a specialized satellite communications provider serving enterprise and institutional clients across India. Established in 2009, the business delivers mission-critical connectivity solutions through a combination of owned infrastructure and strategic partnerships with global satellite operators. Core operations focus on designing and maintaining secure communication networks for corporate clients, government agencies, and telecom carriers requiring reliable connectivity in remote or challenging environments. The technical team manages end-to-end solutions including bandwidth allocation, terminal installation, and 24/7 network monitoring through a centralized operations center. With the Indian satellite communication market projected to grow at 13% CAGR through 2030, driven by digital transformation initiatives and rural connectivity demands, the company maintains strategic relevance through its focus on customized enterprise solutions. Its value proposition c...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2009,
    '"',
    'Satellite Communications Provider Corp',
    '"',
    '"',
    100,
    4096220.00,
    901168.00,
    901168.00,
    'Wealth Diversification. "',
    'Growth opportunity: Leverage spectrum licenses to establish private 5G networks for enterprise clients seeking hybrid sa. Expansion potential: Develop proprietary customer portal with real-time bandwidth management tools to enhance service sti. Development area: Expand into adjacent verticals like maritime communications and IoT-enabled asset tracking through e',
    'active',
    true,
    '["/assets/listing-assets/listing-140-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 169: Environmental Consulting Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Environmental Consulting Firm',
    'Other',
    'India',
    'Pune',
    'This established environmental consulting firm provides specialized advisory services to corporate clients and government entities across India, addressing complex ecological compliance and sustainability challenges. Operating with a 210-member team of scientists, engineers, and regulatory experts, the business delivers tailored solutions including environmental impact assessments, pollution control system design, and climate adaptation planning. Its operational framework combines field investigation capabilities with advanced data analytics, serving clients in manufacturing, urban development, and renewable energy sectors through a mix of long-term contracts and project-based engagements. The company''s value proposition centers on navigating India''s increasingly stringent environmental regulations while helping clients implement cost-effective sustainability measures. With regional offices strategically located near industrial clusters and government hubs, the firm maintains stro...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    16000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    1995,
    '"',
    'Environmental Consulting Firm Corp',
    '"',
    '"',
    210,
    10529048.00,
    2421681.00,
    2058429.00,
    'Wealth Diversification. "',
    'Growth opportunity: Leverage existing client relationships to offer integrated ESG reporting and certification services.. Expansion potential: Expand waste management advisory services to capitalize on India''s new circular economy mandates.. Development area: Develop digital compliance monitoring platforms to create recurring SaaS revenue streams.',
    'active',
    true,
    '["/assets/listing-assets/listing-141-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 170: Air Quality Monitoring Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Air Quality Monitoring Service',
    'Other',
    'Philippines',
    'Cebu City',
    'This established enterprise specializes in SaaS-based air quality monitoring solutions for commercial, municipal, and industrial clients across the Philippines. Operating since 2015, the business combines IoT sensor networks with cloud-based analytics to deliver real-time pollution tracking, regulatory compliance reporting, and predictive air quality management tools. Core operations center on maintaining distributed hardware infrastructure, developing platform features through an agile engineering team, and providing technical support to subscription clients through dedicated account managers. The company holds strategic partnerships with environmental agencies and urban development authorities, positioning it as critical infrastructure in Southeast Asia''s growing smart city ecosystem. With 45 specialized staff managing full-stack development from hardware maintenance to data visualization, the business demonstrates vertical integration capabilities particularly appealing for buye...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'SaaS',
    2015,
    '"',
    'Air Quality Monitoring Service Corp',
    '"',
    '"',
    45,
    2147258.00,
    429451.00,
    322089.00,
    'New Ventures. "',
    'Growth opportunity: Implement white-label platform options for environmental consultancies and smart city integrators.. Expansion potential: Develop predictive analytics add-ons using historical data archives accumulated since 2015 launch.. Development area: Expand sensor-as-a-service model to adjacent Southeast Asian markets facing similar air quality regu',
    'active',
    true,
    '["/assets/listing-assets/listing-142-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 171: Soil & Groundwater Testing Laboratory
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Soil & Groundwater Testing Laboratory',
    'Other',
    'India',
    'Hyderabad',
    'This company operates a specialized soil and groundwater testing laboratory providing critical environmental compliance services to industrial and development sectors across India. The business combines field sampling operations with advanced laboratory analysis, offering contamination assessment, environmental impact evaluations, and regulatory compliance reporting. Serving manufacturing facilities, infrastructure developers, and agricultural enterprises, the laboratory has positioned itself as a vital partner in India''s evolving environmental protection landscape through ISO-certified testing protocols and rapid turnaround times. A network of 120 technically skilled personnel supports operations through regional sample collection hubs and centralized processing facilities, maintaining strict chain-of-custody documentation that meets judicial evidentiary standards. The business demonstrates particular appeal through its multi-year municipal government contracts, recurring private ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B Services',
    2024,
    '"',
    'Soil & Groundwater Testing Laboratory Corp',
    '"',
    '"',
    120,
    6045112.00,
    1269473.00,
    1015579.00,
    'Wealth Diversification. "',
    'Growth opportunity: Strategic partnerships with environmental consultancies to create bundled remediation planning servi. Expansion potential: Expansion into emerging testing verticals including microplastic detection and atmospheric particula. Development area: Implementation of mobile app-based reporting could enhance client engagement through real-time data',
    'active',
    true,
    '["/assets/listing-assets/listing-143-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 172: Renewable Energy Credit (REC) Brokerage
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Renewable Energy Credit (REC) Brokerage',
    'Other',
    'Malaysia',
    'Kota Kinabalu',
    'This business operates as a specialized intermediary in Malaysia''s renewable energy sector, facilitating the purchase and sale of Renewable Energy Certificates (RECs) between energy producers, corporate buyers, and regulatory bodies. Serving as a critical compliance partner for organizations meeting environmental mandates, the company maintains an extensive network of 45+ solar and hydroelectric generators while managing relationships with 120+ corporate clients across manufacturing, technology, and financial sectors. Core operations center on REC portfolio management, market analysis, and transaction auditing – supported by proprietary pricing algorithms and a team of 12 energy policy specialists with average tenure exceeding 8 years. Its defensible market position stems from early-mover advantage in ASEAN carbon markets (established 1995), deep understanding of Malaysia''s Green Investment Tax Allowance program, and recurring revenue streams through multi-year offtake agreements ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    1995,
    '"',
    'Renewable Energy Credit (REC) Brokerage Corp',
    '"',
    '"',
    12,
    2028493.00,
    243419.00,
    194735.00,
    'New Ventures. "',
    'Growth opportunity: Strategic partnerships with ESG software platforms to embed REC purchasing workflows directly into c. Expansion potential: Implementation of AI-driven REC pricing forecasts could enhance margin capture during market volatil. Development area: Untapped potential in cross-selling carbon offset products to existing REC clients, particularly avi',
    'active',
    true,
    '["/assets/listing-assets/listing-144-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 173: Carbon Offset Project Developer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Carbon Offset Project Developer',
    'Other',
    'India',
    'Hyderabad',
    'Positioned as a key player in India''s environmental solutions sector, this carbon offset project developer partners with corporations to design and implement emission reduction initiatives aligned with global climate frameworks. The company specializes in end-to-end project lifecycle management, from feasibility assessments and regulatory compliance to carbon credit certification and retirement. Leveraging a team of 60 professionals with expertise in environmental science, data analytics, and sustainability reporting, the organization delivers tailored solutions for industrial clients across manufacturing, energy, and transportation sectors. Its vertically integrated model combines ground-level project execution with strategic advisory services, maintaining long-term partnerships with 45+ corporate clients through annual retainer agreements. The business holds differentiated value through its proprietary monitoring platform that integrates satellite imagery with IoT sensors, ensuri...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    4000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2008,
    '"',
    'Carbon Offset Project Developer Corp',
    '"',
    '"',
    60,
    3241724.00,
    486258.00,
    486259.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement AI-driven project siting algorithms to optimize land use efficiency and credit yield per o. Expansion potential: Replicate successful agricultural methane capture models across Southeast Asian markets with similar. Development area: Develop bundled ESG reporting services leveraging existing climate data infrastructure to capture an',
    'active',
    true,
    '["/assets/listing-assets/listing-145-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 174: Sustainable Building (LEED) Consulting
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Sustainable Building (LEED) Consulting',
    'Other',
    'Indonesia',
    'Surabaya',
    'Positioned at the forefront of Indonesia''s green construction movement, this established consultancy specializes in guiding commercial developers and public entities through LEED certification processes. The business operates through a vertically integrated service model encompassing energy efficiency audits, sustainable materials sourcing strategies, and compliance documentation management. Its 120-member team of accredited professionals supports clients across project lifecycles – from initial design-phase recommendations to post-construction performance benchmarking. Core clientele include commercial real estate developers (60%), government infrastructure agencies (25%), and industrial operators (15%) seeking operational cost reductions through green building practices. The company maintains strategic partnerships with materials testing laboratories and BIM software providers, enhancing its technical credibility in a market where only 12% of Indonesian construction firms current...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    13000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B Consulting Services',
    2005,
    '"',
    'Sustainable Building (LEED) Consulting Corp',
    '"',
    '"',
    120,
    9045845.00,
    2080544.00,
    2080544.00,
    'New Ventures. "',
    'Growth opportunity: Strategic partnerships with Singapore/Malaysian consultancies to capture regional project overflow f. Expansion potential: Development of subscription-based digital tools for automated energy modeling could create recurring. Development area: Untapped potential in mid-market manufacturing sector where ESG compliance pressures are increasing',
    'active',
    true,
    '["/assets/listing-assets/listing-146-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 175: Energy Auditing Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Energy Auditing Firm',
    'Other',
    'Malaysia',
    'Kota Bharu',
    'The business operates as a specialized energy auditing firm providing technical consulting services to commercial and industrial clients across Malaysia. Established in 2005, the company has developed into a trusted advisor for organizations seeking to optimize energy consumption, reduce operational costs, and meet environmental compliance requirements. Core services encompass comprehensive facility audits, energy efficiency benchmarking, HVAC system analysis, and sustainability reporting aligned with Malaysia''s National Energy Transition Roadmap. The operational model combines on-site technical assessments with advanced data analytics delivered through customized software platforms, creating turnkey solutions for manufacturing plants, hospitality groups, and large-scale property portfolios. A team of 67 professionals including certified energy managers, mechanical engineers, and environmental specialists supports operations through regional offices in Kuala Lumpur, Penang, and Joh...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    14000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B Service Contracts',
    2005,
    '"',
    'Energy Auditing Firm Corp',
    '"',
    '"',
    67,
    9999243.00,
    1299901.00,
    1299902.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of AI-powered predictive maintenance modules as value-added service for existing HVAC. Expansion potential: Expansion into Singapore and Vietnam where energy efficiency regulations mandate annual commercial b. Development area: Development of carbon footprint monetization services leveraging Malaysia''s nascent voluntary carbon',
    'active',
    true,
    '["/assets/listing-assets/listing-147-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 176: Wind Turbine Maintenance Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Wind Turbine Maintenance Service',
    'Other',
    'Philippines',
    'Iloilo City',
    'Positioned at the forefront of renewable energy infrastructure support, this Philippines-based enterprise delivers specialized maintenance solutions for utility-scale wind turbines across the archipelago. The company operates through structured service contracts encompassing preventive maintenance schedules, component lifecycle management, and emergency repair protocols. A dedicated workforce of 85 certified technicians conducts blade integrity assessments, gearbox overhauls, and power converter system optimizations using industry-standard diagnostic tools and OEM-approved methodologies. Client relationships with major energy developers are reinforced through customized digital reporting portals that provide real-time equipment health analytics and maintenance history tracking. The business holds strategic value as an established partner in the Philippines'' accelerating transition to wind energy, with operational certifications aligning with the Department of Energy''s renewable en...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    11000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'Service contracts',
    2019,
    '"',
    'Wind Turbine Maintenance Service Corp',
    '"',
    '"',
    85,
    9905630.00,
    1882069.00,
    1485845.00,
    'Lifestyle Change. "',
    'Growth opportunity: Strategic partnerships with vocational institutes to establish the country''s first wind energy techn. Expansion potential: Expansion into adjacent renewable sectors through cross-training programs for solar farm maintenance. Development area: Deployment of IoT-enabled diagnostic tools to enable premium remote monitoring service tiers for off',
    'active',
    true,
    '["/assets/listing-assets/listing-148-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 177: Hydroelectric Power Plant Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Hydroelectric Power Plant Operator',
    'Other',
    'India',
    'Jaipur',
    'This hydroelectric power plant operator manages a critical renewable energy infrastructure asset in India’s growing power sector. The business specializes in generating clean electricity through strategically positioned dams and turbine systems, serving regional energy distributors, industrial consumers, and government entities under long-term power purchase agreements. Day-to-day operations focus on water flow management, equipment maintenance, and 24/7 grid synchronization, supported by a skilled team of 30 engineers and technicians with deep expertise in hydroelectric systems. As one of few privately held hydro operators in its region, the company benefits from prime waterway access rights and regulatory permits that create high barriers to entry. Its vertically integrated model combines energy production with transmission infrastructure management, ensuring consistent B2B service delivery to creditworthy off-takers. Strategic buyers would value the plant’s operational maturity s...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2009,
    '"',
    'Hydroelectric Power Plant Operator Corp',
    '"',
    '"',
    30,
    2435867.00,
    389738.00,
    389739.00,
    'New Ventures. "',
    'Growth opportunity: Expansion of energy trading capabilities through direct participation in India’s open electricity ma. Expansion potential: Strategic diversification into complementary renewable storage solutions like pumped hydro or batter. Development area: Untapped potential for capacity augmentation through turbine modernization and reservoir optimizatio',
    'active',
    true,
    '["/assets/listing-assets/listing-149-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 178: Geothermal Energy Exploration
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Geothermal Energy Exploration',
    'Other',
    'Indonesia',
    'Medan',
    'The business specializes in geothermal energy exploration and development, operating within Indonesia''s resource-rich volcanic regions. With a focus on B2B partnerships, the company provides turnkey solutions for geothermal resource identification, feasibility studies, and early-stage development support to energy producers and government entities. Its operations combine advanced geological surveying technologies with deep local expertise in Indonesia''s unique geothermal landscape, positioning it as a critical enabler of the country''s renewable energy transition. The firm maintains strategic partnerships with drilling contractors and environmental consultants, offering integrated project management from site assessment through preliminary permitting stages. A workforce of 130 technical specialists and operations staff supports field surveys, data analysis, and stakeholder engagement activities across multiple concurrent projects. The company''s value proposition centers on its de...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '20% - 30%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2013,
    '"',
    'Geothermal Energy Exploration Corp',
    '"',
    '"',
    130,
    5321168.00,
    1170656.00,
    1170657.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement AI-driven site prioritization tools to reduce pre-drilling assessment timelines.. Expansion potential: Develop modular exploration packages for Southeast Asian markets sharing similar volcanic geology.. Development area: Expand into geothermal reservoir management services leveraging existing subsurface data assets.',
    'active',
    true,
    '["/assets/listing-assets/listing-150-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 179: EV Charging Network Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'EV Charging Network Operator',
    'Other',
    'India',
    'Pune',
    'Positioned at the forefront of India''s electric mobility transition, this business operates a strategically distributed network of EV charging stations serving commercial clients across urban and industrial corridors. Specializing in turnkey charging solutions for corporate fleets, logistics hubs, and commercial real estates, the company has established 78 operational charging points since its 2022 launch through targeted infrastructure investments and B2B partnerships. Core operations involve site identification analysis, customized hardware installation, and 24/7 remote monitoring through proprietary charge management software, supported by a lean technical team handling maintenance through certified third-party contractors. The company''s value proposition centers on reliability-focused hardware configurations supporting multiple vehicle types, dynamic pricing models for high-utilization clients, and API integrations for fleet management systems. Market positioning leverages Ind...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    1000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2022,
    '"',
    'EV Charging Network Operator Corp',
    '"',
    '"',
    8,
    639743.00,
    140743.00,
    140743.00,
    'Retirement. "',
    'Growth opportunity: Partnerships with public transit authorities to develop depot charging solutions for municipal elect. Expansion potential: Integration of battery-swapping stations could diversify service offerings for last-mile delivery fl. Development area: Untapped potential in 11 Tier-2 cities along government-designated freight EV corridors lacking dedi',
    'active',
    true,
    '["/assets/listing-assets/listing-151-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 180: Machine Learning (ML) Consulting
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Machine Learning (ML) Consulting',
    'Other',
    'Malaysia',
    'Kuala Lumpur',
    'The business operates as a specialized machine learning consulting firm providing tailored AI solutions to enterprises across Southeast Asia. Established in 2004, this Malaysia-based company has evolved alongside technological advancements to deliver predictive analytics, process automation, and intelligent system design services through a team of 20 technical specialists. Its core operations involve collaborating with clients in financial services, manufacturing, and logistics sectors to implement customized ML models that optimize supply chain forecasting, quality control systems, and customer experience platforms. The company maintains a project-based engagement model supplemented by annual technical support retainers, utilizing agile development methodologies to align solutions with client operational requirements. Strategic value is anchored in its deep technical bench of data scientists and engineers, proprietary frameworks for rapid model deployment, and established partnersh...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B Consulting Services',
    2004,
    '"',
    'Machine Learning (ML) Consulting Corp',
    '"',
    '"',
    20,
    2226719.00,
    244939.00,
    356275.00,
    'Wealth Diversification. "',
    'Growth opportunity: Development of standardized ML compliance toolkits for regulated industries like banking and healthc. Expansion potential: Geographic expansion into ASEAN neighboring markets using existing regional client references.. Development area: Untapped potential in vertical SaaS integration through white-labeling proprietary analytics tools.',
    'active',
    true,
    '["/assets/listing-assets/listing-152-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 181: Cloud Cost Management Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Cloud Cost Management Platform',
    'Other',
    'India',
    'Pune',
    'The company operates a specialized SaaS platform focused on cloud expenditure optimization, serving organizations navigating complex multi-cloud environments. Founded in 2020 within India''s thriving IT sector, the business provides real-time cost visibility tools, automated budget governance features, and machine learning-powered resource allocation recommendations. Its target clientele encompasses technology-centric enterprises, digital-native startups, and IT departments undergoing cloud migration strategies. The platform''s core functionality addresses the critical industry challenge of uncontrolled cloud spend, which Gartner estimates consumes 30-50% of enterprise IT budgets. Day-to-day operations leverage a distributed team of 50 cloud architects, full-stack developers, and FinOps-certified support specialists maintaining continuous product iterations. Strategic partnerships with major hyperscalers like AWS and Azure enhance integration capabilities while creating co-marketing...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'SaaS',
    2020,
    '"',
    'Cloud Cost Management Platform Corp',
    '"',
    '"',
    50,
    3527583.00,
    458585.00,
    458586.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Opportunity to enhance AI-driven forecasting capabilities through strategic hiring in machine learni. Expansion potential: Underdeveloped channel partnerships with global system integrators and managed service providers.. Development area: Untapped potential in adjacent optimization verticals including carbon footprint tracking and contai',
    'active',
    true,
    '["/assets/listing-assets/listing-153-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 182: Penetration Testing as a Service (PtaaS)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Penetration Testing as a Service (PtaaS)',
    'Other',
    'India',
    'Kolkata',
    'This cybersecurity-focused enterprise delivers critical penetration testing solutions through an adaptable service model tailored for modern enterprise needs. Operating within India''s expanding information security sector, the organization provides on-demand vulnerability assessments, compliance verification, and cyberattack simulation services to financial institutions, e-commerce platforms, technology firms, and government entities. The team of 30 certified professionals combines ethical hacking expertise with proprietary testing frameworks to identify network weaknesses, application vulnerabilities, and infrastructure gaps across cloud and on-premise environments. Core operations revolve around a standardized engagement process encompassing scoping workshops, multi-layered system probing, detailed risk prioritization, and mitigation roadmap development – all supported by automated reporting tools and client collaboration portals. Strategic positioning as a pure-play testing spec...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2020,
    '"',
    'Penetration Testing as a Service (PtaaS) Corp',
    '"',
    '"',
    30,
    2444469.00,
    293336.00,
    293336.00,
    'Retirement. "',
    'Growth opportunity: Implement AI-driven prioritization tools to enhance testing efficiency and create upsell opportuniti. Expansion potential: Develop strategic partnerships with cloud service providers to integrate testing solutions into migr. Development area: Expand service catalog into adjacent cybersecurity verticals including incident response planning an',
    'active',
    true,
    '["/assets/listing-assets/listing-154-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 183: Threat Intelligence Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Threat Intelligence Platform',
    'Other',
    'Malaysia',
    'Kuala Lumpur',
    'This cybersecurity-focused SaaS enterprise provides an advanced threat intelligence platform designed to proactively identify and neutralize emerging digital risks for organizations across Southeast Asia. Operating since 2015, the business combines machine learning algorithms with curated dark web monitoring to deliver predictive security insights tailored for financial institutions, government agencies, and multinational corporations. Its cloud-native solution integrates with existing security infrastructure through API-first architecture, offering automated threat detection, incident response workflows, and compliance reporting capabilities. The platform''s value proposition centers on reducing false positive alerts through proprietary correlation engines while maintaining industry-leading detection rates verified by third-party security auditors. With 80 specialized personnel organized into agile development squads and regional support pods, the operation maintains continuous pro...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'SaaS',
    2015,
    '"',
    'Threat Intelligence Platform Corp',
    '"',
    '"',
    80,
    10647457.00,
    2342440.00,
    2342441.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Develop industry-specific threat intelligence packages for high-value verticals like digital banking. Expansion potential: Implement partner program for MSSPs and regional system integrators to access underserved SME market. Development area: Expand solution stack through development/add-on acquisitions in adjacent security verticals like de',
    'active',
    true,
    '["/assets/listing-assets/listing-155-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 184: Digital Forensics & Incident Response Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Digital Forensics & Incident Response Firm',
    'Other',
    'India',
    'Chennai',
    'This established digital forensics and incident response provider delivers critical cybersecurity services to corporate clients across India’s rapidly expanding technology landscape. Since 2014, the business has built specialized capabilities in investigating data breaches, analyzing cyberattacks, and conducting complex digital evidence recovery for financial institutions, multinational corporations, and legal entities. Core operational workflows combine certified forensic examiners with proprietary data analysis tools to provide 24/7 incident response, malware reverse-engineering, and expert courtroom testimony support. The company maintains long-term service agreements with 85+ enterprise clients while supporting law enforcement agencies on high-profile cybercrime cases through formal partnerships. With 65 technical staff holding advanced certifications (CISSP, EnCE, GCFA), the business operates through regional response hubs in major Indian tech corridors, supported by a secure c...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    6000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Services',
    2014,
    '"',
    'Digital Forensics & Incident Response Firm Corp',
    '"',
    '"',
    65,
    3959264.00,
    950223.00,
    950223.00,
    'Retirement. "',
    'Growth opportunity: Replicate successful government engagement model in Southeast Asian markets through strategic allian. Expansion potential: Develop automated threat intelligence feeds from historical case data to create new SaaS revenue str. Development area: Expand managed detection services leveraging existing forensic infrastructure to capture growing XDR',
    'active',
    true,
    '["/assets/listing-assets/listing-156-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 185: Contact Center as a Service (CCaaS)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Contact Center as a Service (CCaaS)',
    'Other',
    'Indonesia',
    'Surabaya',
    'Operating at the intersection of digital transformation and customer engagement, this enterprise provides comprehensive Contact Center as a Service (CCaaS) solutions tailored for Indonesia''s growing corporate sector. Specializing in cloud-based communication infrastructure, the company enables businesses across banking, telecommunications, and e-commerce sectors to manage omnichannel customer interactions through voice, chat, email, and social media integration. Its platform incorporates advanced analytics, AI-driven routing, and CRM compatibility, serving over 150 mid-sized to large enterprises through subscription-based contracts. With a 300-member technical and support team operating from Jakarta, the organization has established itself as one of Indonesia''s first-movers in enterprise-grade cloud contact solutions. Strategic value lies in its fully developed proprietary platform requiring minimal third-party dependencies, 94% client retention rate over five years, and establish...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '10% - 20%',
    14000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2008,
    '"',
    'Contact Center as a Service (CCaaS) Corp',
    '"',
    '"',
    300,
    12464541.00,
    1495744.00,
    1196596.00,
    'New Ventures. "',
    'Growth opportunity: Strategic partnerships with adjacent SaaS providers in CRM and workforce management sectors to creat. Expansion potential: Implementation of generative AI capabilities for real-time agent assistance and multilingual support. Development area: Untapped potential in provincial markets beyond Java, where digital transformation initiatives are a',
    'active',
    true,
    '["/assets/listing-assets/listing-157-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 186: Quarry & Aggregate Supplier
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Quarry & Aggregate Supplier',
    'Other',
    'India',
    'Kolkata',
    'Operating as a critical resource provider within India''s construction sector, this vertically integrated quarry and aggregates business maintains full-cycle operations from raw material extraction to finished product distribution. The company specializes in supplying graded stone aggregates, crushed gravel, and specialized sands through owned quarries and processing facilities, serving infrastructure developers, road construction contractors, and concrete manufacturers. A streamlined production process combines modernized crushing equipment with rigorous quality control protocols, ensuring consistent material specifications that meet national building standards and large-scale project requirements. With strategic site locations near major urban corridors and transportation arteries, the business operates a fleet of 60+ tipper trucks complemented by third-party logistics partnerships, enabling reliable just-in-time delivery to construction sites across three states. The 110-member w...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2006,
    '"',
    'Quarry & Aggregate Supplier Corp',
    '"',
    '"',
    110,
    2218879.00,
    332831.00,
    332832.00,
    'New Ventures. "',
    'Growth opportunity: Expansion of rail-linked distribution network to access untested regional markets beyond current ope. Expansion potential: Development of recycled concrete aggregate line to capture emerging sustainable construction mandate. Development area: Implementation of automated sorting systems to increase processing capacity and reduce material wast',
    'active',
    true,
    '["/assets/listing-assets/listing-158-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 187: Steel Fabrication and Erection Company
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Steel Fabrication and Erection Company',
    'Other',
    'Malaysia',
    'Kota Bharu',
    'The business operates as a specialized steel fabrication and erection enterprise serving commercial and industrial clients across Malaysia. Established in 2013, this company provides comprehensive structural steel solutions including custom component manufacturing, erection services, and project management for construction projects ranging from warehouse developments to infrastructure upgrades. Utilizing modern CNC cutting systems and automated welding equipment, the operation maintains precision manufacturing capabilities while servicing both short-run custom orders and large-volume contracts. The workforce of 34 skilled personnel includes certified welders, erection crews, and project coordinators managing projects through dedicated client portals. Current operations demonstrate particular strength in serving oil & gas sector clients and transportation infrastructure developers, with approximately 60% of revenue derived from repeat clients in these verticals. Strategic advantages ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B',
    2013,
    '"',
    'Steel Fabrication and Erection Company Corp',
    '"',
    '"',
    34,
    1827228.00,
    401990.00,
    341692.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement advanced BIM modeling capabilities to enhance design collaboration and secure higher-margi. Expansion potential: Expand service offerings into corrosion-resistant coatings and maintenance contracts to increase pos. Development area: Develop modular steel structure product line to capitalize on Malaysia''s growing industrial prefab c',
    'active',
    true,
    '["/assets/listing-assets/listing-159-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 188: Uniform & Linen Supply Service
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Uniform & Linen Supply Service',
    'Other',
    'Indonesia',
    'Medan',
    'This established enterprise operates as a critical support partner for service-oriented industries across Indonesia, providing managed textile solutions through a capital-efficient operational model. The business specializes in professional garment and linen lifecycle management, offering comprehensive rental, maintenance, and replacement services for corporate workwear, healthcare textiles, and hospitality linens. Its vertically integrated operations encompass textile procurement, industrial laundry facilities, custom embroidery capabilities, and a modern fleet supporting scheduled deliveries to commercial clients nationwide. Core client sectors include hospital networks, hotel chains, manufacturing enterprises, and food processing facilities that require hygienic, standardized apparel solutions without capital investment in laundry infrastructure. The company''s value proposition centers on guaranteed service-level agreements that ensure 24/7 availability of sanitized, inspection-...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '20% - 30%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B Service Contracts',
    2007,
    '"',
    'Uniform & Linen Supply Service Corp',
    '"',
    '"',
    200,
    2669089.00,
    640581.00,
    576523.00,
    'Wealth Diversification. "',
    'Growth opportunity: Develop textile-as-a-service platform integrating client workforce management systems for real-time . Expansion potential: Implement predictive textile replacement algorithms using existing IoT sensor data to upsell clients. Development area: Expand high-margin specialty cleaning services for industrial workwear contaminated with hydrocarbon',
    'active',
    true,
    '["/assets/listing-assets/listing-160-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 189: Blasting Services (Mining & Construction)
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Blasting Services (Mining & Construction)',
    'Other',
    'Thailand',
    'Chiang Mai',
    'Specializing in critical infrastructure development support, this Thailand-based enterprise delivers precision-controlled blasting solutions to the mining and construction sectors. Established in 2020, the company operates through seven mobile units staffed by 85 certified technicians, providing site preparation, rock fragmentation, and demolition services across Southeast Asia''s resource-rich territories. Its operational model centers on multi-year service agreements with quarry operators, civil engineering firms, and mineral extraction companies, maintaining an 82% client retention rate through rigorous safety protocols and adaptive project execution. The business distinguishes itself through ISO-certified blast design capabilities and a proprietary vibration monitoring system that minimizes environmental impact, positioning it as a preferred vendor for environmentally sensitive projects. Strategic advantages include a fully-equipped fleet of modern drilling rigs, exclusive partn...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B Service Contracts',
    2020,
    '"',
    'Blasting Services (Mining & Construction) Corp',
    '"',
    '"',
    85,
    9559551.00,
    955955.00,
    955955.00,
    'Retirement. "',
    'Growth opportunity: Geographic expansion into Laos'' emerging rare earth mining corridor using existing Thailand operatio. Expansion potential: Vertical integration through acquisition of drilling equipment maintenance providers to capture addi. Development area: Deployment of AI-powered geological mapping tools to enhance blast planning accuracy and reduce pre-',
    'active',
    true,
    '["/assets/listing-assets/listing-161-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 190: Traffic Control Services
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Traffic Control Services',
    'Other',
    'Indonesia',
    'Bandung',
    'The business provides critical traffic management solutions across Indonesia''s rapidly developing infrastructure sectors, serving construction firms, event organizers, and municipal authorities. Operating within transportation and logistics, this company coordinates temporary road closures, detour planning, and safety protocol enforcement through a fleet of modern equipment including variable message signs, automatic barrier systems, and IoT-enabled monitoring devices. With 235 trained personnel organized into specialized response teams, operations follow strict safety certifications compliant with Indonesian transportation regulations. The company maintains strategic positioning through long-term service contracts with infrastructure developers and government partners, supported by regional equipment depots in key urban growth corridors. Its value proposition centers on reducing project delays through 24/7 incident response capabilities and AI-powered traffic pattern analysis tool...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    14000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2019,
    '"',
    'Traffic Control Services Corp',
    '"',
    '"',
    235,
    9400954.00,
    1786181.00,
    1518254.00,
    'Wealth Diversification. "',
    'Growth opportunity: Implement workforce development program to certify additional technicians in emerging traffic AI sys. Expansion potential: Develop mobile application platform for clients to manage service requests and access compliance doc. Development area: Expand service offerings into smart city integration through sensor-based traffic monitoring solutio',
    'active',
    true,
    '["/assets/listing-assets/listing-162-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 191: Geomatics & Land Surveying Firm
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Geomatics & Land Surveying Firm',
    'Other',
    'India',
    'Hyderabad',
    'The business operates as a specialized geomatics and land surveying provider serving infrastructure developers, construction firms, and government entities across India. Core services include topographic mapping, boundary demarcation, cadastral surveys, and construction alignment monitoring using advanced equipment like GNSS receivers, total stations, and drone-based LiDAR systems. This operational framework supports critical projects in road development, urban planning, and renewable energy installations through precise geospatial data collection and analysis. With 60 technical staff including licensed surveyors and GIS specialists, the company maintains ISO-certified quality control processes and proprietary data validation protocols. Its positioning as a compliance-focused partner for regulated projects creates recurring engagement through multi-phase contracts, particularly with repeat clients in the transportation and utilities sectors. Strategic value derives from established ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'B2B Service Contracts',
    2021,
    '"',
    'Geomatics & Land Surveying Firm Corp',
    '"',
    '"',
    60,
    2262493.00,
    452498.00,
    904997.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Implement AI-assisted anomaly detection in survey data processing to reduce manual quality check hou. Expansion potential: Develop subscription-based digital twin modeling services for infrastructure maintenance clients.. Development area: Expand into adjacent sectors requiring precision geodata, including telecom tower installations and',
    'active',
    true,
    '["/assets/listing-assets/listing-163-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 192: Nutraceutical & Supplement Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Nutraceutical & Supplement Manufacturer',
    'Other',
    'Malaysia',
    'Kota Kinabalu',
    'This Malaysia-based nutraceutical and supplement manufacturer operates as a business-to-business partner for domestic and international brands seeking premium private-label solutions. Specializing in tablets, capsules, powdered formulations, and functional foods, the company serves established wellness brands, emerging direct-to-consumer startups, and healthcare distributors through custom product development and small-batch manufacturing. Its modern facility combines automated production lines with artisanal compounding capabilities, positioning it uniquely to serve clients requiring both scale and specialized formulations. Strategic advantages include ASEAN GMP certification, halal compliance, and access to Malaysia''s biodiversity for ethically sourced botanicals. The 70-person operation maintains robust quality control systems managed by a technical team with pharmaceutical-grade expertise, while its commercial division focuses on long-term contract partnerships. Buyers would in...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    14000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B',
    2024,
    '"',
    'Nutraceutical & Supplement Manufacturer Corp',
    '"',
    '"',
    70,
    9358507.00,
    1403776.00,
    1871701.00,
    'Wealth Diversification. "',
    'Growth opportunity: Expansion into cosmeceutical lines leveraging existing botanical expertise and manufacturing infrast. Expansion potential: Development of white-label e-commerce platforms to empower client partners'' direct consumer engageme. Development area: Implementation of AI-driven predictive analytics for raw material procurement and demand forecasting',
    'active',
    true,
    '["/assets/listing-assets/listing-164-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 193: Pet Food Manufacturer
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Pet Food Manufacturer',
    'Other',
    'India',
    'Bangalore',
    'Established in 2001, this pet food manufacturing operation has developed into a trusted partner for distributors and specialty retailers across India''s growing companion animal care sector. The business focuses on producing nutritionally balanced dry and wet food formulations for dogs and cats, utilizing automated production lines in its 8,500 sqm facility that maintains FSSC 22000-certified food safety standards. With a technical team overseeing rigorous quality control protocols and raw material sourcing from approved agricultural suppliers, the company has built particular expertise in creating customized private-label solutions for regional pet store chains. The operational model combines batch production planning with inventory management systems designed to accommodate both standing purchase agreements and seasonal demand fluctuations. A 12-person sales team manages relationships with 140+ active accounts through a combination of direct engagements and participation in major ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    2000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Retirement',
    'B2B',
    2001,
    '"',
    'Pet Food Manufacturer Corp',
    '"',
    '"',
    63,
    1903106.00,
    247403.00,
    247404.00,
    'Retirement. "',
    'Growth opportunity: Leverage FSSC 22000 certification to pursue export opportunities in Southeast Asian and Middle Easte. Expansion potential: Expand into functional treat categories and veterinary-prescribed diets using existing production in. Development area: Develop direct e-commerce capabilities to serve India''s rapidly growing online pet product retailers',
    'active',
    true,
    '["/assets/listing-assets/listing-165-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 194: Beverage Bottling and Canning Plant
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Beverage Bottling and Canning Plant',
    'Other',
    'India',
    'Bhopal',
    'Operating at the heart of India''s thriving beverage sector, this established bottling and canning enterprise provides critical production infrastructure for domestic and international beverage brands. With nearly three decades of continuous operation, the facility specializes in high-speed filling operations for carbonated soft drinks, functional waters, and ready-to-drink teas across aluminum cans, PET bottles, and glass containers. The business maintains strategic partnerships with regional raw material suppliers and logistics providers, ensuring reliable access to food-grade aluminum and resin inputs while serving clients through just-in-time delivery models. A workforce of 139 technical operators and quality assurance professionals supports three-shift operations across climate-controlled production halls equipped with semi-automated bottling lines certified for ISO 22000 food safety standards. This long-standing market presence has cultivated durable relationships with eight a...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    5000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    1995,
    '"',
    'Beverage Bottling and Canning Plant Corp',
    '"',
    '"',
    139,
    5560815.00,
    889730.00,
    711784.00,
    'New Ventures. "',
    'Growth opportunity: Modernization roadmap for IoT-enabled predictive maintenance systems to reduce machine downtime and . Expansion potential: Underdeveloped export infrastructure to service Middle Eastern and Southeast Asian markets facing be. Development area: Untapped potential in aseptic cold-fill capabilities for premium juice and dairy-alternative segment',
    'active',
    true,
    '["/assets/listing-assets/listing-166-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 195: E-Learning & Corporate Training Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'E-Learning & Corporate Training Platform',
    'Education & Training',
    'Malaysia',
    'Kuala Lumpur',
    'This established B2B SaaS company provides a comprehensive e-learning platform specializing in corporate training solutions for Malaysian enterprises. Operating since 2008, the business combines proprietary learning management technology with a curated library of professional development courses, compliance training modules, and customizable upskilling programs. The platform integrates seamlessly with clients'' existing HR systems through API connectivity, serving medium-to-large organizations across banking, healthcare, and manufacturing sectors. Day-to-day operations leverage an 85-member team organized into specialized divisions for content development, platform engineering, and enterprise customer support, maintaining a 92% client retention rate through personalized service agreements. Strategic value lies in its entrenched position as a certified training provider for multiple industry regulators, coupled with AI-driven content recommendations that adapt to organizational skill...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Wealth Diversification',
    'B2B SaaS',
    2008,
    '"',
    'E-Learning & Corporate Training Platform Corp',
    '"',
    '"',
    85,
    7406662.00,
    1407265.00,
    1407266.00,
    'Wealth Diversification. "',
    'Growth opportunity: Implement channel partnerships with management consultancies to bundle training solutions with digit. Expansion potential: Develop microlearning modules and VR-based training simulations to address manufacturing sector upsk. Development area: Expand API integrations to emerging Southeast Asian HR tech platforms targeting Singaporean and Indo',
    'active',
    true,
    '["/assets/listing-assets/listing-167-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 196: Game Development Studio
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Game Development Studio',
    'Other',
    'Indonesia',
    'Medan',
    'The business operates as a full-service game development studio specializing in custom game creation and technical solutions for domestic and international clients in the entertainment sector. Since 2016, it has cultivated a reputation for delivering polished 2D/3D mobile and PC games while maintaining strategic B2B relationships with publishers, media companies, and interactive content producers. The 65-member team combines artistic talent with technical expertise across concept development, programming, quality assurance, and post-launch support operations. A standardized production pipeline enables efficient project management for concurrent game developments while maintaining flexibility for client-driven customization requests. Strategic advantages include an extensive proprietary asset library, established local talent network across Java and Bali, and long-term contracts with Southeast Asian streaming platforms seeking original gaming content. The company''s positioning as a ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$1M - $5M USD',
    '10% - 20%',
    3000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'New Ventures',
    'B2B',
    2016,
    '"',
    'Game Development Studio Corp',
    '"',
    '"',
    65,
    2879133.00,
    460661.00,
    460661.00,
    'New Ventures. "',
    'Growth opportunity: Implementation of machine learning tools for player behavior analytics to enhance client white-label. Expansion potential: Expansion into gamification services for corporate training modules and educational software markets. Development area: Untapped potential in developing branded merchandise and ancillary content monetization strategies a',
    'active',
    true,
    '["/assets/listing-assets/listing-168-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 197: Online Auction Platform
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'Online Auction Platform',
    'Other',
    'Indonesia',
    'Surabaya',
    'This established online auction platform has operated as a key player in Indonesia''s e-commerce sector since 1999, connecting buyers and sellers through its digital marketplace. The business supports multiple transaction formats including timed auctions, buy-it-now options, and bulk lot sales, primarily serving consumer electronics, collectibles, and home goods categories. Its mobile-first platform attracts over 150,000 active monthly users through native iOS/Android apps accounting for 68% of transactions. The operations team coordinates with third-party logistics partners for nationwide delivery while maintaining a proprietary payment escrow system that holds funds until buyer confirmation. With 75 employees spanning platform development, seller onboarding, and customer experience teams, the company benefits from institutional knowledge accumulated through 25 years of adapting to Southeast Asia''s evolving digital commerce landscape. Strategic advantages include high seller reten...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$5M - $10M USD',
    '10% - 20%',
    8000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Partner/Family Transition',
    'Online platform',
    1999,
    '"',
    'Online Auction Platform Corp',
    '"',
    '"',
    75,
    8932748.00,
    1429239.00,
    982603.00,
    'Partner/Family Transition. "',
    'Growth opportunity: Development of B2B auction solutions for corporate clients managing asset disposals.. Expansion potential: Implementation of value-added services including authentication guarantees and extended warranty opt. Development area: Expansion of vertical-specific auction categories targeting underpenetrated markets like industrial',
    'active',
    true,
    '["/assets/listing-assets/listing-169-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- Listing 198: ATM Fleet Operator
WITH seller_info AS (
    SELECT id as seller_id FROM user_profiles WHERE email = 'seller@nobridge.co'
)
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
    'ATM Fleet Operator',
    'Other',
    'Indonesia',
    'Banjarmasin',
    'This company operates a strategically positioned ATM network across Indonesia''s urban and semi-urban centers, serving as critical cash access infrastructure in a market where physical currency remains vital for daily transactions. Managing 300+ terminals through partnerships with national banks and retail chains, the business combines terminal ownership, cash management, and transaction processing into a vertically integrated model. Day-to-day operations focus on predictive maintenance cycles, cash replenishment logistics coordinated through regional hubs, and performance monitoring via proprietary fleet management software. The 240-member workforce includes specialized teams for field operations, security transport coordination, and bank liaison functions, maintaining 98% uptime across the network. With multi-year contracts anchoring relationships with three major banking partners, the business benefits from predictable transaction-based revenue streams while maintaining capacity ...',
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '$10M+ USD',
    '20% - 30%',
    10000000.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    'Lifestyle Change',
    'B2B',
    2017,
    '"',
    'ATM Fleet Operator Corp',
    '"',
    '"',
    240,
    11908868.00,
    2619950.00,
    2390171.00,
    'Lifestyle Change. "',
    'Growth opportunity: Expand deposit-taking capabilities to capture SME cash management business in underserved provincial. Expansion potential: Develop API-driven cash withdrawal reservations to integrate with digital banking apps and e-wallets. Development area: Monetize underutilized terminal screens through dynamic advertising partnerships with local consumer',
    'active',
    true,
    '["/assets/listing-assets/listing-170-eeaf4d3e.jpg"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;

-- ===================================================================
-- 3. VERIFICATION AND CLEANUP
-- ===================================================================

-- Update listing counts and refresh any materialized views if they exist
UPDATE user_profiles
SET updated_at = NOW()
WHERE email = 'seller@nobridge.co';

-- Display summary of created data
DO $$
DECLARE
    seller_count INTEGER;
    listing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO seller_count FROM user_profiles WHERE email = 'seller@nobridge.co';
    SELECT COUNT(*) INTO listing_count FROM listings WHERE seller_id IN (
        SELECT id FROM user_profiles WHERE email = 'seller@nobridge.co'
    );

    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEEDING COMPLETED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created seller accounts: %', seller_count;
    RAISE NOTICE 'Created business listings: %', listing_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Demo seller login: seller@nobridge.co';
    RAISE NOTICE 'Demo seller password: 100%%Seller';
    RAISE NOTICE '========================================';
END $$;

-- Business listings from CSV data
-- Generated: 2025-06-21T09:53:03.567Z
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
    NOW() - INTERVAL '3 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '9 days',
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
    NOW() - INTERVAL '27 days',
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
    NOW() - INTERVAL '0 days',
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
    NOW() - INTERVAL '4 days',
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
    NOW() - INTERVAL '21 days',
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
    NOW() - INTERVAL '2 days',
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
    NOW() - INTERVAL '7 days',
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
    NOW() - INTERVAL '22 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '4 days',
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
    NOW() - INTERVAL '21 days',
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
    NOW() - INTERVAL '3 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '26 days',
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
    NOW() - INTERVAL '10 days',
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
    NOW() - INTERVAL '25 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '15 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '17 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '20 days',
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
    NOW() - INTERVAL '2 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '8 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '26 days',
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
    NOW() - INTERVAL '25 days',
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
    NOW() - INTERVAL '15 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '7 days',
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
    NOW() - INTERVAL '27 days',
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
    NOW() - INTERVAL '7 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '18 days',
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
    NOW() - INTERVAL '3 days',
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
    NOW() - INTERVAL '29 days',
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
    NOW() - INTERVAL '3 days',
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
    NOW() - INTERVAL '4 days',
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
    NOW() - INTERVAL '18 days',
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
    NOW() - INTERVAL '9 days',
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
    NOW() - INTERVAL '2 days',
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
    NOW() - INTERVAL '27 days',
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
    NOW() - INTERVAL '6 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '29 days',
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
    NOW() - INTERVAL '13 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '25 days',
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
    NOW() - INTERVAL '14 days',
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
    NOW() - INTERVAL '17 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '8 days',
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
    NOW() - INTERVAL '7 days',
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
    NOW() - INTERVAL '0 days',
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
    NOW() - INTERVAL '2 days',
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
    NOW() - INTERVAL '25 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '0 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '3 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '6 days',
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
    NOW() - INTERVAL '4 days',
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
    NOW() - INTERVAL '2 days',
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
    NOW() - INTERVAL '15 days',
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
    NOW() - INTERVAL '23 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '2 days',
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
    NOW() - INTERVAL '26 days',
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
    NOW() - INTERVAL '8 days',
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
    NOW() - INTERVAL '17 days',
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
    NOW() - INTERVAL '6 days',
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
    NOW() - INTERVAL '13 days',
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
    NOW() - INTERVAL '9 days',
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
    NOW() - INTERVAL '26 days',
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
    NOW() - INTERVAL '0 days',
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
    NOW() - INTERVAL '25 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '2 days',
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
    NOW() - INTERVAL '5 days',
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
    NOW() - INTERVAL '15 days',
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
    NOW() - INTERVAL '9 days',
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
    NOW() - INTERVAL '7 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '14 days',
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
    NOW() - INTERVAL '3 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '5 days',
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
    NOW() - INTERVAL '8 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '29 days',
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
    NOW() - INTERVAL '1 days',
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
    NOW() - INTERVAL '4 days',
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
    NOW() - INTERVAL '18 days',
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
    NOW() - INTERVAL '6 days',
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
    NOW() - INTERVAL '12 days',
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
    NOW() - INTERVAL '9 days',
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
    NOW() - INTERVAL '21 days',
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
    NOW() - INTERVAL '22 days',
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
    NOW() - INTERVAL '27 days',
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
    NOW() - INTERVAL '7 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '29 days',
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
    NOW() - INTERVAL '9 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '26 days',
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
    NOW() - INTERVAL '0 days',
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
    NOW() - INTERVAL '10 days',
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
    NOW() - INTERVAL '2 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '10 days',
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
    NOW() - INTERVAL '0 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '29 days',
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
    NOW() - INTERVAL '17 days',
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
    NOW() - INTERVAL '14 days',
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
    NOW() - INTERVAL '18 days',
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
    NOW() - INTERVAL '23 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '0 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '1 days',
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
    NOW() - INTERVAL '15 days',
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
    NOW() - INTERVAL '26 days',
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
    NOW() - INTERVAL '6 days',
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
    NOW() - INTERVAL '5 days',
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
    NOW() - INTERVAL '1 days',
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
    NOW() - INTERVAL '2 days',
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
    NOW() - INTERVAL '4 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '17 days',
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
    NOW() - INTERVAL '14 days',
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
    NOW() - INTERVAL '17 days',
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
    NOW() - INTERVAL '22 days',
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
    NOW() - INTERVAL '23 days',
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
    NOW() - INTERVAL '4 days',
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
    NOW() - INTERVAL '23 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '10 days',
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
    NOW() - INTERVAL '25 days',
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
    NOW() - INTERVAL '23 days',
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
    NOW() - INTERVAL '13 days',
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
    NOW() - INTERVAL '22 days',
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
    NOW() - INTERVAL '29 days',
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
    NOW() - INTERVAL '4 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '13 days',
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
    NOW() - INTERVAL '6 days',
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
    NOW() - INTERVAL '1 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '11 days',
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
    NOW() - INTERVAL '14 days',
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
    NOW() - INTERVAL '17 days',
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
    NOW() - INTERVAL '17 days',
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
    NOW() - INTERVAL '15 days',
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
    NOW() - INTERVAL '20 days',
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
    NOW() - INTERVAL '17 days',
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
    NOW() - INTERVAL '8 days',
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
    NOW() - INTERVAL '24 days',
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
    NOW() - INTERVAL '28 days',
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
    NOW() - INTERVAL '9 days',
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
    NOW() - INTERVAL '26 days',
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
    NOW() - INTERVAL '8 days',
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
    NOW() - INTERVAL '27 days',
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
    NOW() - INTERVAL '14 days',
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
    NOW() - INTERVAL '12 days',
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
    NOW() - INTERVAL '14 days',
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
    NOW() - INTERVAL '23 days',
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
    NOW() - INTERVAL '22 days',
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
    NOW() - INTERVAL '1 days',
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
    NOW() - INTERVAL '7 days',
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
    NOW() - INTERVAL '14 days',
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
    NOW() - INTERVAL '21 days',
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
    NOW() - INTERVAL '16 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '21 days',
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
    NOW() - INTERVAL '15 days',
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
    NOW() - INTERVAL '6 days',
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
    NOW() - INTERVAL '19 days',
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
    NOW() - INTERVAL '18 days',
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
    NOW() - INTERVAL '22 days',
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
    NOW() - INTERVAL '18 days',
    NOW()
FROM seller_info;

