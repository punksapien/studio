const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://kktmizfxgtkodtujursv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdG1pemZ4Z3Rrb2R0dWp1cnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU4NjAwMSwiZXhwIjoyMDY0MTYyMDAxfQ.EComR2_5PS_fdW2XzOTPjSfOjBacve0nrblAEHUsLwk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function smartImageMigration() {
    console.log('🚀 Smart Image Migration - Safe to run after any db reset');

    // Step 1: Check and setup bucket
    console.log('📂 Ensuring bucket is properly configured...');

    // Make bucket public
    const { error: bucketError } = await supabase.storage
        .updateBucket('listing-images', { public: true });

    if (bucketError && !bucketError.message.includes('already')) {
        console.log('⚠️  Bucket setup:', bucketError.message);
    } else {
        console.log('✅ Bucket is public');
    }

    // Step 2: Upload images (skip existing)
    console.log('\n📸 Uploading images to storage...');

    const imagesToUpload = [
        // Original images
        ...['listing-1.jpg', 'listing-2.jpg', 'listing-3.jpg', 'listing-4.jpg', 'listing-5.jpg']
            .map(file => ({
                localPath: path.join('public/assets', file),
                storageKey: `original/${file}`,
                staticPath: `/assets/${file}`
            })),

        // CSV images
        ...fs.readdirSync('public/assets/listing-assets')
            .filter(file => file.match(/\.(jpg|jpeg|png)$/i))
            .map(file => ({
                localPath: path.join('public/assets/listing-assets', file),
                storageKey: `listing-assets/${file}`,
                staticPath: `/assets/listing-assets/${file}`
            }))
    ];

    let uploadCount = 0;
    let skipCount = 0;
    const urlMapping = new Map();

    for (const image of imagesToUpload) {
        if (!fs.existsSync(image.localPath)) {
            console.log(`⚠️  File not found: ${image.localPath}`);
            continue;
        }

        // Check if already exists
        const { data: existingFile } = await supabase.storage
            .from('listing-images')
            .list(path.dirname(image.storageKey), {
                search: path.basename(image.storageKey)
            });

        if (existingFile && existingFile.length > 0) {
            skipCount++;
        } else {
            // Upload file
            const file = fs.readFileSync(image.localPath);
            const { error } = await supabase.storage
                .from('listing-images')
                .upload(image.storageKey, file, {
                    contentType: image.localPath.endsWith('.png') ? 'image/png' : 'image/jpeg',
                    upsert: true
                });

            if (error) {
                console.log(`⚠️  Upload failed for ${image.storageKey}:`, error.message);
            } else {
                uploadCount++;
                if (uploadCount % 20 === 0) {
                    console.log(`✅ Uploaded ${uploadCount} images...`);
                }
            }
        }

        // Generate URL mapping (for both existing and new files)
        const { data: urlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(image.storageKey);

        urlMapping.set(image.staticPath, urlData.publicUrl);
    }

    console.log(`📸 Upload summary: ${uploadCount} uploaded, ${skipCount} skipped`);

    // Step 3: Update database records
    console.log('\n📋 Updating database records...');

    const { data: listings, error: fetchError } = await supabase
        .from('listings')
        .select('id, image_urls');

    if (fetchError) {
        console.error('❌ Failed to fetch listings:', fetchError);
        return;
    }

    let updateCount = 0;
    let alreadyCorrect = 0;

    for (const listing of listings) {
        if (!listing.image_urls || !Array.isArray(listing.image_urls)) {
            continue;
        }

        // Check if already using Supabase URLs
        const hasSupabaseUrls = listing.image_urls.every(url =>
            typeof url === 'string' && url.includes('supabase.co/storage')
        );

        if (hasSupabaseUrls) {
            alreadyCorrect++;
            continue;
        }

        // Convert static paths to Supabase URLs
        const updatedUrls = listing.image_urls.map(url => {
            return urlMapping.get(url) || url;
        });

        const { error: updateError } = await supabase
            .from('listings')
            .update({ image_urls: updatedUrls })
            .eq('id', listing.id);

        if (updateError) {
            console.error(`❌ Failed to update listing ${listing.id}`);
        } else {
            updateCount++;
        }
    }

    // Step 4: Verify a few URLs
    console.log('\n🔍 Testing image accessibility...');
    const testUrls = Array.from(urlMapping.values()).slice(0, 3);

    for (const url of testUrls) {
        try {
            const response = await fetch(url);
            console.log(`✅ ${response.ok ? 'OK' : 'FAIL'} (${response.status}): ${url.split('/').pop()}`);
        } catch (error) {
            console.log(`❌ ERROR: ${url.split('/').pop()}`);
        }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`📸 Images: ${uploadCount} uploaded, ${skipCount} existed`);
    console.log(`📋 Database: ${updateCount} updated, ${alreadyCorrect} already correct`);
    console.log(`📊 Total listings: ${listings.length}`);
    console.log(`\n✅ Your deployment should now show all images correctly!`);
    console.log(`🔗 Safe to run this script after any 'supabase db reset'`);
}

// Check if this is being run directly
if (require.main === module) {
    smartImageMigration().catch(console.error);
}

module.exports = { smartImageMigration };
