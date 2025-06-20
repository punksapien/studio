const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://kktmizfxgtkodtujursv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdG1pemZ4Z3Rrb2R0dWp1cnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU4NjAwMSwiZXhwIjoyMDY0MTYyMDAxfQ.EComR2_5PS_fdW2XzOTPjSfOjBacve0nrblAEHUsLwk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function completeStorageMigration() {
    console.log('🚀 Starting complete migration to Supabase storage...');

    // Step 1: Get all existing files in storage
    console.log('📋 Checking existing files in storage...');

    const existingFiles = new Set();

    try {
        const { data: originalFiles } = await supabase.storage
            .from('listing-images')
            .list('original');
        if (originalFiles) {
            originalFiles.forEach(file => existingFiles.add(`original/${file.name}`));
        }
    } catch (e) {
        console.log('Original folder check failed');
    }

    try {
        const { data: assetFiles } = await supabase.storage
            .from('listing-images')
            .list('listing-assets');
        if (assetFiles) {
            assetFiles.forEach(file => existingFiles.add(`listing-assets/${file.name}`));
        }
    } catch (e) {
        console.log('Listing-assets folder check failed');
    }

    console.log(`📸 Found ${existingFiles.size} existing files in storage`);

    // Step 2: Upload remaining CSV images in batches
    console.log('\n📸 Uploading remaining CSV images...');

    const listingAssetsPath = 'public/assets/listing-assets';
    const allCsvImages = fs.readdirSync(listingAssetsPath)
        .filter(file => file.match(/\.(jpg|jpeg|png)$/i));

    let uploadCount = 0;
    let skipCount = 0;

    for (let i = 0; i < allCsvImages.length; i++) {
        const imageFile = allCsvImages[i];
        const storageKey = `listing-assets/${imageFile}`;

        if (existingFiles.has(storageKey)) {
            skipCount++;
            continue;
        }

        const localPath = path.join(listingAssetsPath, imageFile);
        const file = fs.readFileSync(localPath);

        const { data, error } = await supabase.storage
            .from('listing-images')
            .upload(storageKey, file, {
                contentType: imageFile.endsWith('.png') ? 'image/png' : 'image/jpeg',
                upsert: false
            });

        if (error) {
            console.log(`⚠️  Upload error for ${imageFile}:`, error.message);
        } else {
            uploadCount++;
            if (uploadCount % 10 === 0) {
                console.log(`✅ Uploaded ${uploadCount} images so far...`);
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    console.log(`📸 Upload complete: ${uploadCount} new, ${skipCount} skipped`);

    // Step 3: Update ALL database records
    console.log('\n📋 Updating ALL database records with Supabase URLs...');

    const { data: allListings, error: fetchError } = await supabase
        .from('listings')
        .select('id, image_urls');

    if (fetchError) {
        console.error('❌ Failed to fetch listings:', fetchError);
        return;
    }

    console.log(`📋 Found ${allListings.length} listings to update`);

    let updateCount = 0;

    for (const listing of allListings) {
        if (!listing.image_urls || !Array.isArray(listing.image_urls)) {
            continue;
        }

        // Convert static paths to Supabase storage URLs
        const updatedUrls = listing.image_urls.map(url => {
            if (typeof url === 'string') {
                if (url.startsWith('/assets/listing-assets/')) {
                    // CSV images
                    const filename = url.replace('/assets/listing-assets/', '');
                    return `${supabaseUrl}/storage/v1/object/public/listing-images/listing-assets/${filename}`;
                } else if (url.startsWith('/assets/listing-')) {
                    // Original images
                    const filename = url.replace('/assets/', '');
                    return `${supabaseUrl}/storage/v1/object/public/listing-images/original/${filename}`;
                }
            }
            return url; // Return as-is if it's already a Supabase URL
        });

        const { error: updateError } = await supabase
            .from('listings')
            .update({ image_urls: updatedUrls })
            .eq('id', listing.id);

        if (updateError) {
            console.error(`❌ Failed to update listing ${listing.id}:`, updateError);
        } else {
            updateCount++;
        }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`📸 Images uploaded: ${uploadCount} new images`);
    console.log(`📋 Database records updated: ${updateCount}/${allListings.length}`);
    console.log(`\n🔗 All images now use Supabase storage URLs`);
    console.log(`✅ Your deployment should now show images correctly!`);
}

completeStorageMigration().catch(console.error);
