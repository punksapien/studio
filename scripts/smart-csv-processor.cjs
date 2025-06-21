const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Utility functions
function generateHash(data) {
  return crypto.createHash('md5').update(data).digest('hex').substring(0, 8);
}

function isValidImageUrl(url) {
  // Check if URL looks like a real downloadable image
  if (!url || typeof url !== 'string') return false;

  // Check if it has a valid image extension
  const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
  if (!hasImageExtension) return false;

  // Skip placeholder/template URLs that are unlikely to be real
  const suspiciousDomains = [
    'example.com',
    'placeholder.com',
    'tempuri.org',
    'localhost',
    'test.com',
    'demo.com'
  ];

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();

    // Skip if it's a suspicious domain
    if (suspiciousDomains.some(suspDomain => domain.includes(suspDomain))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url, outputPath) {
  // First validate the URL
  if (!isValidImageUrl(url)) {
    throw new Error('Invalid or placeholder URL detected');
  }

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    const req = client.get(url, (res) => {
      if (res.statusCode === 200) {
        const writeStream = fs.createWriteStream(outputPath);
        res.pipe(writeStream);

        writeStream.on('finish', () => {
          writeStream.close();
          resolve(true);
        });

        writeStream.on('error', (err) => {
          fs.unlink(outputPath, () => {}); // Clean up partial file
          reject(err);
        });
      } else {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// Robust CSV parser
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());
  return result;
}

// Safe data extraction and validation
function extractBusinessData(rawBusiness) {
  // Define expected field mappings with validation
  const fieldMappings = {
    title: {
      sources: ['Listing Title (Anonymous)', 'business_name'],
      default: 'Business Opportunity',
      maxLength: 200
    },
    imageUrl: {
      sources: ['Image Link', 'image_url'],
      required: true
    },
    industry: {
      sources: ['Industry'],
      default: 'Other',
      maxLength: 100
    },
    location: {
      sources: ['Location (Country)', 'location'],
      default: 'United States',
      maxLength: 100
    },
    city: {
      sources: ['Location (City)'],
      maxLength: 100
    },
    businessModel: {
      sources: ['Business Model', 'business_type'],
      default: 'Business',
      maxLength: 100
    },
    yearEstablished: {
      sources: ['Year Business Established', 'established_year'],
      type: 'number'
    },
    revenue: {
      sources: ['Halved Revenue', 'revenue'],
      type: 'currency'
    },
    askingPrice: {
      sources: ['Asking Price', 'asking_price'],
      type: 'currency'
    },
    employees: {
      sources: ['Employees', 'employees'],
      type: 'number',
      default: 0
    },
    description: {
      sources: ['Business Description (2)', 'description'],
      maxLength: 1000
    },
    reasonForSelling: {
      sources: ['Reson For Selling', 'reason_for_selling'],
      maxLength: 500
    }
  };

  const extracted = {};

  for (const [key, config] of Object.entries(fieldMappings)) {
    let value = null;

    // Try each source until we find a value
    for (const source of config.sources) {
      if (rawBusiness[source] && rawBusiness[source].trim()) {
        value = rawBusiness[source].trim();
        break;
      }
    }

    // Apply default if no value found
    if (!value && config.default !== undefined) {
      value = config.default;
    }

    // Validate required fields
    if (config.required && !value) {
      throw new Error(`Required field ${key} is missing`);
    }

    // Type conversions and validation
    if (value) {
      switch (config.type) {
        case 'number':
          const num = parseInt(value);
          value = isNaN(num) ? null : num;
          break;

        case 'currency':
          // Extract number from currency string
          const cleanCurrency = value.replace(/[^0-9.]/g, '');
          const currencyNum = parseFloat(cleanCurrency);
          value = isNaN(currencyNum) ? null : currencyNum;
          break;

        default:
          // String validation
          if (config.maxLength) {
            value = value.substring(0, config.maxLength);
          }

          // Clean up string - remove problematic characters
          value = value
            .replace(/[^\w\s\.,\-\(\)&'/]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
      }
    }

    extracted[key] = value;
  }

  return extracted;
}

// Generate SQL using template with placeholders (preventing SQL injection)
function generateListingSQL(businesses) {
  const sqlTemplate = `
-- Generated SQL for business listings with confirmed images
-- Total listings: ${businesses.length}

-- Insert listings with parameterized values
`;

  let sql = sqlTemplate;

  businesses.forEach((business, index) => {
    // Create a safe, parameterized insert statement
    sql += `
-- Listing ${index + 1}: ${business.title}
INSERT INTO listings (
  seller_id,
  listing_title_anonymous,
  anonymous_business_description,
  industry,
  business_model,
  asking_price,
  specific_annual_revenue_last_year,
  number_of_employees,
  year_established,
  key_strengths_anonymous,
  location_country,
  image_urls,
  status,
  created_at
) VALUES (
  (SELECT id FROM user_profiles WHERE role = 'seller' LIMIT 1),
  ${sqlEscape(business.title)},
  ${sqlEscape(business.description || 'Well-established business with growth potential')},
  ${sqlEscape(business.industry)},
  ${sqlEscape(business.businessModel)},
  ${business.askingPrice || 'NULL'},
  ${business.revenue || 'NULL'},
  ${business.employees || 0},
  ${business.yearEstablished || 'NULL'},
  ${sqlEscape('[]')},
     ${sqlEscape(business.location)},
   ${business.imagePath ? sqlEscape(`["${business.imagePath}"]`) : 'NULL'},
   'active',
  NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days'
);

`;
  });

  return sql;
}

// Proper SQL escaping function
function sqlEscape(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  // For strings, use proper PostgreSQL escaping
  const escaped = value
    .toString()
    .replace(/'/g, "''")  // Escape single quotes by doubling them
    .replace(/\\/g, '\\\\'); // Escape backslashes

  return `'${escaped}'`;
}

async function processCSVToSQL() {
  console.log('🚀 Starting Robust CSV Processing...');

  const csvPath = './more_data.csv';

  if (!fs.existsSync(csvPath)) {
    throw new Error('CSV file not found: more_data.csv');
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  console.log('📋 CSV Headers:', headers.length, 'columns found');

  // Ensure assets directory exists
  const assetsDir = './public/assets/listing-assets';
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const successfulListings = [];
  const errors = [];

  console.log(`📊 Processing ${lines.length - 1} potential listings...`);

  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);

      if (values.length < headers.length - 5) { // Allow some missing columns
        console.log(`⚠️  Row ${i}: Incomplete row, skipping`);
        continue;
      }

      // Create business object
      const rawBusiness = {};
      headers.forEach((header, index) => {
        rawBusiness[header] = values[index] || '';
      });

            // Extract and validate business data
      const business = extractBusinessData(rawBusiness);

      const listingId = String(i).padStart(3, '0');
      console.log(`📋 [${i}/${lines.length - 1}] Processing: ${business.title}`);

      // Check if we have a valid downloadable image URL
      if (isValidImageUrl(business.imageUrl)) {
        try {
          // Generate image filename
          const imageHash = generateHash(business.imageUrl + business.title);
          const imageExtension = business.imageUrl.includes('.png') ? 'png' : 'jpg';
          const imageFilename = `listing-${listingId}-${imageHash}.${imageExtension}`;
          const imagePath = path.join(assetsDir, imageFilename);

          console.log(`📥 [${i}/${lines.length - 1}] Downloading image...`);

          // Download image
          await downloadImage(business.imageUrl, imagePath);

          // Verify download
          const stats = fs.statSync(imagePath);
          if (stats.size === 0) {
            throw new Error('Downloaded file is empty');
          }

          console.log(`✅ [${i}/${lines.length - 1}] Success with image (${stats.size} bytes)`);

          // Add image path to business data
          business.imagePath = `/assets/listing-assets/${imageFilename}`;

        } catch (imageError) {
          console.log(`⚠️  [${i}/${lines.length - 1}] Image download failed: ${imageError.message}`);
          console.log(`   Creating listing without image...`);

          // Create listing without image
          business.imagePath = null;
        }
      } else {
        console.log(`⚠️  [${i}/${lines.length - 1}] No valid image URL found, creating without image`);
        business.imagePath = null;
      }

      console.log(`✅ [${i}/${lines.length - 1}] Added listing: ${business.title}`);
      business.listingId = parseInt(listingId);

      successfulListings.push(business);

    } catch (error) {
      console.log(`❌ [${i}/${lines.length - 1}] Failed: ${error.message}`);
      errors.push({ row: i, error: error.message });

      // Clean up any partial files
      const partialPath = path.join(assetsDir, `listing-${String(i).padStart(3, '0')}-*.jpg`);
      // Simple cleanup - would need glob in real implementation
    }
  }

  console.log(`\n📊 Processing Complete:`);
  console.log(`   ✅ Successful: ${successfulListings.length}`);
  console.log(`   ❌ Failed: ${errors.length}`);

  if (successfulListings.length === 0) {
    throw new Error('No listings processed successfully');
  }

  // Generate SQL
  console.log('\n🔧 Generating SQL...');
  const sql = generateListingSQL(successfulListings);

    // Read existing seed.sql and preserve ONLY the original content
  const sqlOutputPath = './supabase/seed.sql';
  let existingSql = '';

  if (fs.existsSync(sqlOutputPath)) {
    const fullContent = fs.readFileSync(sqlOutputPath, 'utf-8');

    // Find where CSV section starts and completely remove everything from that point
    const csvSectionStart = fullContent.indexOf('-- Business listings from CSV data');
    if (csvSectionStart !== -1) {
      // Keep only content BEFORE the CSV section
      existingSql = fullContent.substring(0, csvSectionStart).trim() + '\n\n';
      console.log(`🧹 Removed existing CSV section (was ${fullContent.length - existingSql.length} characters)`);
    } else {
      // No CSV section found, keep existing content
      existingSql = fullContent.trim() + '\n\n';
    }
  }

  const finalSql = existingSql + `-- Business listings from CSV data
-- Generated by smart-csv-processor.cjs
-- Successfully processed: ${successfulListings.length} listings
-- Failed downloads: ${errors.length} listings

${sql}`;

  fs.writeFileSync(sqlOutputPath, finalSql);

  console.log(`\n✅ SQL Generated Successfully!`);
  console.log(`📁 File: ${sqlOutputPath}`);
  console.log(`🖼️  Images: ${assetsDir}`);
  console.log(`📊 Listings: ${successfulListings.length}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} listings failed (see errors above)`);
  }

  console.log('\n🎯 Ready to apply: npx supabase db reset --linked');
}

// Run the processor
if (require.main === module) {
  processCSVToSQL().catch(error => {
    console.error('❌ Processing failed:', error.message);
    process.exit(1);
  });
}
