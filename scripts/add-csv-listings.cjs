#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📚 Reading and analyzing existing seed.sql structure...');

// Read the original seed.sql
const seedPath = path.join('supabase', 'seed.sql');
const seedContent = fs.readFileSync(seedPath, 'utf8');

// Find the verification section - this is where we need to insert new listings BEFORE
const verificationMarker = '-- ===================================================================\n-- 3. VERIFICATION AND CLEANUP';
const verificationIndex = seedContent.indexOf(verificationMarker);

if (verificationIndex === -1) {
    console.error('❌ Could not find verification section in seed.sql');
    process.exit(1);
}

// Split the content
const beforeVerification = seedContent.substring(0, verificationIndex);
const verificationSection = seedContent.substring(verificationIndex);

console.log('✅ Found proper insertion point in seed.sql');

// Read CSV data
const csvContent = fs.readFileSync('more_data.csv', 'utf8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Simple CSV parser that handles quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Helper to format SQL text with proper escaping and length limits
function sqlText(text, maxLength = 255) {
    if (!text || text.trim() === '' || text === 'NULL') return 'NULL';

    // Clean and escape the text
    let cleaned = text
        .replace(/'/g, "''")  // Escape single quotes
        .replace(/\n/g, ' ')  // Replace newlines
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    // Truncate if needed
    if (maxLength && cleaned.length > maxLength) {
        cleaned = cleaned.substring(0, maxLength - 3) + '...';
    }

    return `'${cleaned}'`;
}

// Get list of available images
const imageDir = path.join('public', 'assets', 'listing-assets');
const availableImages = fs.readdirSync(imageDir)
    .filter(f => f.endsWith('.jpg'))
    .sort();

console.log(`📸 Found ${availableImages.length} images in listing-assets`);

// Industry mapping
const industryMap = {
    'Construction': 'Construction & Trades',
    'Automotive': 'Manufacturing & Automotive',
    'Food': 'Restaurants & Food Service',
    'Technology': 'Technology & Software',
    'Manufacturing': 'Manufacturing & Automotive',
    'Retail': 'Retail & E-commerce',
    'Healthcare': 'Healthcare & Medical',
    'Finance': 'Financial Services',
    'Real Estate': 'Real Estate & Property',
    'Education': 'Education & Training',
    'Services': 'Professional Services',
    'Logistics': 'Transportation & Logistics'
};

// Process CSV and create listings
const listings = [];
const processedTitles = new Set();
let imageIndex = 0;

console.log('🔄 Processing CSV data...');

// Skip header and first 5 rows (already in seed.sql), process remaining rows
for (let i = 6; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 20) continue;

    // Extract fields
    const title = values[0] || `Business Listing ${i}`;
    const imageUrl = values[1];
    const industry = values[2] || 'Other';
    const country = values[3] || 'Indonesia';
    const city = values[4] || 'Jakarta';
    const businessModel = values[5] || 'B2B';
    const yearEst = parseInt(values[6]) || 2015;
    const regName = values[7] || title + ' Ltd';
    const website = values[8];
    const social = values[9];
    const revenue = parseInt(values[10]) || 1000000;
    const netProfitMargin = parseInt(values[11]) || 20;
    const askingPrice = parseInt(values[12]) || 2000000;
    const cashFlowExplanation = values[13];
    const cashFlow = parseInt(values[14]) || 500000;
    const dealStructure = values[15];
    const reasonForSelling = values[16] || 'Strategic business decision';
    const employees = parseInt(values[17]) || 50;
    const description = values[18] || 'Established business with strong growth potential.';
    const growth1 = values[19];
    const growth2 = values[20];
    const growth3 = values[21];

    // Skip duplicates
    const key = `${title}-${country}-${city}`;
    if (processedTitles.has(key)) continue;
    processedTitles.add(key);

    // Map industry
    const mappedIndustry = industryMap[industry] || 'Other';

    // Get image path - use existing downloaded images
    const imagePath = availableImages[imageIndex % availableImages.length];
    imageIndex++;

    // Calculate revenue range
    let revenueRange = '$1M - $5M USD';
    if (revenue > 10000000) revenueRange = '$10M+ USD';
    else if (revenue > 5000000) revenueRange = '$5M - $10M USD';

    // Calculate profit margin range
    let profitRange = '10% - 20%';
    if (netProfitMargin > 30) profitRange = '30%+ ';
    else if (netProfitMargin > 20) profitRange = '20% - 30%';

    // Format growth opportunities (avoiding problematic bullet characters)
    const growthOps = [];
    if (growth1) growthOps.push('Growth opportunity: ' + growth1.substring(0, 100));
    if (growth2) growthOps.push('Expansion potential: ' + growth2.substring(0, 100));
    if (growth3) growthOps.push('Development area: ' + growth3.substring(0, 100));
    const growthText = growthOps.join('. ') || 'Multiple growth opportunities available';

    // Create SQL for this listing (continuing from listing 5)
    const sql = `
-- Listing ${listings.length + 6}: ${title}
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
    ${sqlText(title)},
    ${sqlText(mappedIndustry)},
    ${sqlText(country)},
    ${sqlText(city)},
    ${sqlText(description, 1000)},
    '["Established market presence", "Experienced management team", "Strong financial performance", "Growth potential"]'::jsonb,
    '${revenueRange}',
    '${profitRange}',
    ${askingPrice}.00,
    '["Asset Purchase", "Share Purchase"]'::jsonb,
    ${sqlText(reasonForSelling)},
    ${sqlText(businessModel)},
    ${yearEst},
    ${sqlText(regName)},
    ${sqlText(title + ' Corp')},
    ${sqlText(website)},
    ${sqlText(social)},
    ${employees},
    ${revenue}.00,
    ${Math.floor(revenue * netProfitMargin / 100)}.00,
    ${cashFlow}.00,
    ${sqlText(reasonForSelling + '. ' + (cashFlowExplanation || ''))},
    ${sqlText(growthText, 1000)},
    'active',
    true,
    '["/assets/listing-assets/${imagePath}"]'::jsonb,
    NOW(),
    NOW()
FROM seller_info;`;

    listings.push(sql);
}

console.log(`✅ Prepared ${listings.length} listings for insertion`);

// Create the new seed content
const newSeedContent = beforeVerification +
    '\n-- ===================================================================\n' +
    '-- ADDITIONAL LISTINGS FROM CSV DATA\n' +
    '-- ===================================================================\n' +
    '-- Generated by add-csv-listings.cjs\n' +
    '-- Images use existing downloaded files in public/assets/listing-assets/\n' +
    listings.join('\n') + '\n\n' +
    verificationSection;

// Write the updated seed.sql
fs.writeFileSync(seedPath, newSeedContent);

console.log('✅ Successfully updated supabase/seed.sql');
console.log(`📊 Added ${listings.length} new listings`);
console.log('🎯 Next step: Run "supabase db reset" to apply changes');
