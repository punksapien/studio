const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

async function downloadImage(url, outputPath) {
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

function generateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
}

function sanitizeString(str) {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function formatPrice(priceStr) {
  if (!priceStr) return 'NULL';
  const cleanPrice = priceStr.replace(/[$,]/g, '');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? 'NULL' : price.toString();
}

function formatStringArray(str) {
  if (!str) return "'{}'";
  const items = str.split(',').map(item => `"${item.trim()}"`);
  return `'{${items.join(',')}}'`;
}

function generateBusinessDescription(business) {
  const parts = [];

  const businessType = business['Business Model'] || business.business_type;
  if (businessType) {
    parts.push(`${businessType} business`);
  }

  const industry = business['Industry'] || business.industry;
  if (industry) {
    parts.push(`in the ${industry} industry`);
  }

  const location = business['Location (Country)'] || business.location;
  if (location) {
    parts.push(`located in ${location}`);
  }

  const revenue = business['Halved Revenue'] || business.revenue;
  if (revenue) {
    parts.push(`with annual revenue of ${revenue}`);
  }

  const employees = business['Employees'] || business.employees;
  if (employees) {
    parts.push(`employing ${employees} people`);
  }

  const description = business['Business Description (2)'] || business.description;
  if (description) {
    parts.push(`${description}`);
  } else {
    parts.push('A well-established business with strong fundamentals and growth potential.');
  }

  return parts.join('. ').replace(/\.\./g, '.').trim();
}

async function processCSVToSQL() {
  console.log('🚀 Starting Smart CSV to SQL Processing...');

  // Read CSV file
  const csvPath = './more_data.csv';

  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: more_data.csv not found!');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.error('❌ Error: CSV file is empty!');
    return;
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('📋 Found CSV headers:', headers);

  // Ensure assets directory exists
  const assetsDir = './public/assets/listing-assets';
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  let successfulListings = [];
  let skippedCount = 0;

  console.log(`📊 Processing ${lines.length - 1} listings from CSV...`);

  // Process each listing
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

    if (values.length < headers.length) {
      console.log(`⚠️  Row ${i}: Skipping incomplete row`);
      skippedCount++;
      continue;
    }

    const business = {};
    headers.forEach((header, index) => {
      business[header] = values[index] || '';
    });

    // Skip if no image URL (check both possible column names)
    const imageUrl = business.image_url || business['Image Link'];
    if (!imageUrl) {
      console.log(`⚠️  Row ${i}: Skipping listing without image URL`);
      skippedCount++;
      continue;
    }

    // Generate listing ID and image filename
    const listingId = String(i).padStart(3, '0');
    const businessName = business.business_name || business['Listing Title (Anonymous)'] || 'Unknown Business';
    const imageHash = generateHash(imageUrl + businessName);
    const imageExtension = imageUrl.includes('.png') ? 'png' : 'jpg';
    const imageFilename = `listing-${listingId}-${imageHash}.${imageExtension}`;
    const imagePath = path.join(assetsDir, imageFilename);

        console.log(`📥 [${i}/${lines.length - 1}] Downloading image for: ${businessName}`);

    try {
      // Download image
      await downloadImage(imageUrl, imagePath);

      // Verify the file was created and is not empty
      const stats = fs.statSync(imagePath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      console.log(`✅ [${i}/${lines.length - 1}] Successfully downloaded image (${stats.size} bytes)`);

      // Add to successful listings with correct image path
      business.local_image_path = `/assets/listing-assets/${imageFilename}`;
      business.listing_id = parseInt(listingId);
      successfulListings.push(business);

    } catch (error) {
      console.log(`❌ [${i}/${lines.length - 1}] Failed to download image: ${error.message}`);
      console.log(`   Skipping listing: ${businessName}`);

      // Clean up any partial file
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      skippedCount++;
    }
  }

  console.log(`\n📊 Processing Summary:`);
  console.log(`   Total CSV rows: ${lines.length - 1}`);
  console.log(`   Successful downloads: ${successfulListings.length}`);
  console.log(`   Skipped listings: ${skippedCount}`);

  if (successfulListings.length === 0) {
    console.error('❌ No listings with successful image downloads. Cannot generate SQL.');
    return;
  }

  // Generate SQL for successful listings only
  console.log('\n🔧 Generating SQL for successful listings...');

  let sql = `-- Generated SQL for ${successfulListings.length} business listings with confirmed images
-- Only includes listings where image downloads were successful
-- Total skipped due to download failures: ${skippedCount}

`;

  for (const business of successfulListings) {
    const businessName = sanitizeString(business['Listing Title (Anonymous)'] || business.business_name || 'Untitled Business');
    const description = sanitizeString(generateBusinessDescription(business));
    const location = business['Location (Country)'] || business.location || 'United States';
    const askingPrice = formatPrice(business['Asking Price'] || business.asking_price);
    const revenue = formatPrice(business['Halved Revenue'] || business.revenue);
    const employees = business['Employees'] || business.employees || 'NULL';
    const assets = formatStringArray(business.key_assets || '');
    const strengths = formatStringArray(business.key_strengths || '');
    const industry = sanitizeString(business['Industry'] || business.industry || 'General Business');
    const businessType = sanitizeString(business['Business Model'] || business.business_type || 'Business');
    const establishedYear = business['Year Business Established'] || business.established_year || 'NULL';
    const imagePath = business.local_image_path;

    sql += `-- Listing ${business.listing_id}: ${businessName}
INSERT INTO listings (
  seller_id, title, description, industry, business_type,
  asking_price, annual_revenue, employee_count, established_year,
  key_assets, key_strengths, location_country, location_state,
  location_city, image_url, status, created_at
) VALUES (
  (SELECT id FROM user_profiles WHERE role = 'seller' LIMIT 1),
  '${businessName}',
  '${description}',
  '${industry}',
  '${businessType}',
  ${askingPrice},
  ${revenue},
  ${employees},
  ${establishedYear},
  ${assets},
  ${strengths},
  '${location}',
  NULL,
  NULL,
  '${imagePath}',
  'approved',
  NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days'
);

`;
  }

  // Write SQL file
  const sqlOutputPath = './supabase/seed.sql';

  // Read existing seed.sql to preserve original listings
  let existingSql = '';
  if (fs.existsSync(sqlOutputPath)) {
    existingSql = fs.readFileSync(sqlOutputPath, 'utf-8');

    // Extract everything before the CSV section
    const csvSectionStart = existingSql.indexOf('-- Business listings from CSV data');
    if (csvSectionStart !== -1) {
      existingSql = existingSql.substring(0, csvSectionStart).trim() + '\n\n';
    } else {
      existingSql += '\n\n';
    }
  }

  const finalSql = existingSql + `-- Business listings from CSV data
-- Generated by smart-csv-processor.cjs
-- Only includes ${successfulListings.length} listings with successfully downloaded images
-- ${skippedCount} listings were skipped due to image download failures

${sql}`;

  fs.writeFileSync(sqlOutputPath, finalSql);

  console.log(`\n✅ Success! Generated SQL with ${successfulListings.length} listings`);
  console.log(`📁 Updated: ${sqlOutputPath}`);
  console.log(`🖼️  Downloaded ${successfulListings.length} images to: ${assetsDir}`);
  console.log(`⚠️  Skipped ${skippedCount} listings due to image download failures`);

  console.log('\n🎯 Perfect image-to-listing mapping maintained!');
  console.log('💡 To apply: npx supabase db reset --linked && npm run migrate-images');
}

// Run the processor
processCSVToSQL().catch(console.error);
