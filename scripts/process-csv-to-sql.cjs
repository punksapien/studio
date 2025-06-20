#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createHash } = require('crypto');

/**
 * Robust CSV to SQL Data Processing Script
 *
 * This script:
 * 1. Reads more_data.csv line by line
 * 2. Filters out duplicates based on title and location
 * 3. Downloads all images to public/assets/listing-assets/
 * 4. Generates clean SQL to append to supabase/seed.sql
 */

console.log('🚀 Starting CSV to SQL processing...');

// Configuration
const CSV_FILE = 'more_data.csv';
const IMAGE_DIR = 'public/assets/listing-assets';
const SEED_FILE = 'supabase/seed.sql';

// Create image directory if it doesn't exist
if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    console.log(`📁 Created directory: ${IMAGE_DIR}`);
}

// Helper function to download image
function downloadImage(url, filename) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(path.join(IMAGE_DIR, filename));

        client.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                file.close();
                fs.unlinkSync(path.join(IMAGE_DIR, filename));
                resolve(false);
            }
        }).on('error', () => {
            file.close();
            if (fs.existsSync(path.join(IMAGE_DIR, filename))) {
                fs.unlinkSync(path.join(IMAGE_DIR, filename));
            }
            resolve(false);
        });
    });
}

// Helper function to generate hash from string
function generateHash(str) {
    return createHash('md5').update(str).digest('hex').substring(0, 8);
}

// Helper function to escape SQL strings
function escapeSql(str) {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

// Helper function to clean and format text
function cleanText(text) {
    if (!text || text === 'undefined' || text.trim() === '') return null;
    return text.trim();
}

// Helper function to format money amounts
function formatMoney(amount) {
    if (!amount || isNaN(amount)) return null;
    const num = parseInt(amount);
    if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(0)}M USD`;
    } else if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}K USD`;
    }
    return `$${num} USD`;
}

// Helper function to determine revenue range
function getRevenueRange(revenue) {
    if (!revenue || isNaN(revenue)) return '$1M - $5M USD';
    const num = parseInt(revenue);
    if (num >= 20000000) return '$20M+ USD';
    if (num >= 10000000) return '$10M - $20M USD';
    if (num >= 5000000) return '$5M - $10M USD';
    if (num >= 1000000) return '$1M - $5M USD';
    return 'Under $1M USD';
}

// Helper function to get profit margin range
function getProfitMarginRange(margin) {
    if (!margin || isNaN(margin)) return '10% - 20%';
    const num = parseInt(margin);
    if (num >= 30) return '30%+';
    if (num >= 20) return '20% - 30%';
    if (num >= 10) return '10% - 20%';
    return 'Under 10%';
}

// Helper function to map industry
function mapIndustry(industry) {
    if (!industry) return 'Other';
    const ind = industry.toLowerCase();
    if (ind.includes('construction') || ind.includes('contractor')) return 'Construction & Trades';
    if (ind.includes('restaurant') || ind.includes('food') || ind.includes('coffee') || ind.includes('pizza')) return 'Restaurants & Food Service';
    if (ind.includes('automotive')) return 'Automotive (Sales & Repair)';
    if (ind.includes('logistics') || ind.includes('transport')) return 'Transportation & Logistics';
    if (ind.includes('real estate')) return 'Real Estate';
    if (ind.includes('marketing') || ind.includes('advertising')) return 'Marketing & Advertising';
    if (ind.includes('it') || ind.includes('technology') || ind.includes('software')) return 'Information Technology (IT)';
    if (ind.includes('legal') || ind.includes('law')) return 'Accounting & Legal';
    if (ind.includes('health') || ind.includes('fitness')) return 'Health & Wellness';
    if (ind.includes('landscaping')) return 'Agriculture';
    return industry || 'Other';
}

// Main processing function
async function processCSV() {
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].replace(/"/g, '').split(',');

    console.log('📋 CSV Headers:', headers.slice(0, 5));

    const processedListings = new Set();
    const sqlStatements = [];
    let imageCounter = 1;

    // Process each line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            // Parse CSV line manually to handle quoted fields
            const values = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim()); // Add the last value

            if (values.length < 10) continue; // Skip incomplete rows

            // Extract data with safe indexing
            const listingTitle = cleanText(values[0]);
            const imageUrl = cleanText(values[1]);
            const industry = cleanText(values[2]);
            const country = cleanText(values[3]);
            const city = cleanText(values[4]);
            const businessModel = cleanText(values[5]);
            const yearEstablished = cleanText(values[6]);
            const registeredName = cleanText(values[7]);
            const websiteUrl = cleanText(values[8]);
            const socialMedia = cleanText(values[9]);
            const revenue = cleanText(values[10]);
            const profitMargin = cleanText(values[11]);
            const askingPrice = cleanText(values[12]);
            const cashFlowExplanation = cleanText(values[13]);
            const cashFlow = cleanText(values[14]);
            const dealStructure = cleanText(values[15]);
            const reasonSelling = cleanText(values[16]);
            const employees = cleanText(values[17]);
            const description = cleanText(values[18]);
            const growth1 = cleanText(values[19]);
            const growth2 = cleanText(values[20]);
            const growth3 = cleanText(values[21]);
            const strength1 = cleanText(values[22]);
            const strength2 = cleanText(values[23]);
            const strength3 = cleanText(values[24]);

            // Skip if missing essential data
            if (!listingTitle || !country) continue;

            // Create unique identifier for duplicate detection
            const uniqueId = `${listingTitle}-${country}-${city}`;
            if (processedListings.has(uniqueId)) continue;
            processedListings.add(uniqueId);

            // Download image if available
            let imageFilename = null;
            if (imageUrl && imageUrl.startsWith('http')) {
                const extension = '.jpg';
                imageFilename = `listing-${String(imageCounter).padStart(3, '0')}-${generateHash(imageUrl)}${extension}`;

                console.log(`📸 Downloading image ${imageCounter}: ${imageUrl}`);
                const downloaded = await downloadImage(imageUrl, imageFilename);

                if (!downloaded) {
                    console.log(`❌ Failed to download image: ${imageUrl}`);
                    imageFilename = null;
                }
                imageCounter++;
            }

            // Generate SQL statement
            const sql = `
-- Listing: ${listingTitle || 'Untitled Business'}
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
    ${escapeSql(listingTitle)},
    ${escapeSql(mapIndustry(industry))},
    ${escapeSql(country)},
    ${escapeSql(city)},
    ${escapeSql(description)},
    ${JSON.stringify([strength1, strength2, strength3].filter(s => s).slice(0, 4))}::jsonb,
    ${escapeSql(getRevenueRange(revenue))},
    ${escapeSql(getProfitMarginRange(profitMargin))},
    ${escapeSql(formatMoney(askingPrice))},
    ${JSON.stringify([dealStructure || 'Full'])}::jsonb,
    ${escapeSql(reasonSelling)},
    ${escapeSql(businessModel || 'Service-based business model')},
    ${yearEstablished ? parseInt(yearEstablished) : 'NULL'},
    ${escapeSql(registeredName)},
    ${escapeSql(listingTitle + ' Corp')},
    ${escapeSql(websiteUrl)},
    ${escapeSql(socialMedia)},
    ${employees ? parseInt(employees) : 'NULL'},
    ${revenue ? parseInt(revenue) : 'NULL'},
    ${cashFlow ? parseInt(cashFlow) : 'NULL'},
    ${cashFlow ? parseInt(cashFlow) : 'NULL'},
    ${escapeSql(reasonSelling)},
    ${escapeSql([growth1, growth2, growth3].filter(g => g).join('\n• '))},
    'active',
    true,
    ${imageFilename ? `'["/assets/listing-assets/${imageFilename}"]'` : "'[]'"}::jsonb,
    NOW(),
    NOW()
FROM seller_info;
`;

            sqlStatements.push(sql);

        } catch (error) {
            console.log(`⚠️ Error processing line ${i}: ${error.message}`);
            continue;
        }
    }

    // Write SQL to file
    const sqlHeader = `\n\n-- ===================================================================\n-- ADDITIONAL BUSINESS LISTINGS - Generated from CSV\n-- ===================================================================\n\n`;
    const fullSql = sqlHeader + sqlStatements.join('\n\n');

    // Append to existing seed.sql
    fs.appendFileSync(SEED_FILE, fullSql);

    console.log(`✅ Processing complete!`);
    console.log(`📊 Processed ${processedListings.size} unique listings`);
    console.log(`📸 Downloaded ${imageCounter - 1} images`);
    console.log(`💾 SQL appended to ${SEED_FILE}`);

    // Clean up
    process.exit(0);
}

// Run the script
processCSV().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
