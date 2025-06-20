const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Remote Supabase credentials
const supabaseUrl = 'https://kktmizfxgtkodtujursv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdG1pemZ4Z3Rrb2R0dWp1cnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU4NjAwMSwiZXhwIjoyMDY0MTYyMDAxfQ.EComR2_5PS_fdW2XzOTPjSfOjBacve0nrblAEHUsLwk';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingFiles() {
    console.log('📋 Checking existing files in Supabase storage...');

    const existingFiles = new Set();

    // Check original folder
    try {
        const { data: originalFiles, error } = await supabase.storage
            .from('listing-images')
            .list('original');

        if (!error && originalFiles) {
            originalFiles.forEach(file => existingFiles.add(`original/${file.name}`));
        }
    } catch (e) {
        console.log('Original folder check failed, continuing...');
    }

    // Check listing-assets folder
    try {
        const { data: assetFiles, error } = await supabase.storage
            .from('listing-images')
            .list('listing-assets');

        if (!error && assetFiles) {
            assetFiles.forEach(file => existingFiles.add(`listing-assets/${file.name}`));
        }
    } catch (e) {
        console.log('Listing-assets folder check failed, continuing...');
    }

    console.log(`📸 Found ${existingFiles.size} existing files in storage`);
    return existingFiles;
}

async function uploadImagesAndUpdateDatabase() {
    console.log('🚀 Starting image upload to Supabase storage...');

    // Check what's already uploaded
    const existingFiles = await checkExistingFiles();

    // Define image sources
    const originalImagesPath = 'public/assets';
    const listingAssetsPath = 'public/assets/listing-assets';

    // Get all original listing images (listing-1.jpg through listing-5.jpg)
    const originalImages = ['listing-1.jpg', 'listing-2.jpg', 'listing-3.jpg', 'listing-4.jpg', 'listing-5.jpg'];

    // Get all listing-assets images
    const listingAssetImages = fs.readdirSync(listingAssetsPath)
        .filter(file => file.match(/\.(jpg|jpeg|png)$/i));

    console.log(`📸 Found ${originalImages.length} original images`);
    console.log(`📸 Found ${listingAssetImages.length} listing-asset images`);

    const urlMappings = new Map(); // Map old path to new Supabase URL
    let uploadCount = 0;
    let skippedCount = 0;

    // Upload original images
    for (const imageFile of originalImages) {
        const localPath = path.join(originalImagesPath, imageFile);
        const storageKey = `original/${imageFile}`;

        if (existingFiles.has(storageKey)) {
            // Already exists, just get the URL
            const { data: urlData } = supabase.storage
                .from('listing-images')
                .getPublicUrl(storageKey);

            urlMappings.set(`/assets/${imageFile}`, urlData.publicUrl);
            console.log(`⏭️  Skipped ${imageFile} (already exists)`);
            skippedCount++;
            continue;
        }

        if (fs.existsSync(localPath)) {
            const file = fs.readFileSync(localPath);

            const { data, error } = await supabase.storage
                .from('listing-images')
                .upload(storageKey, file, {
                    contentType: 'image/jpeg',
                    upsert: false // Don't overwrite existing files
                });

            if (error) {
                console.error(`❌ Failed to upload ${imageFile}:`, error);
                // Still get URL in case it exists
                const { data: urlData } = supabase.storage
                    .from('listing-images')
                    .getPublicUrl(storageKey);
                urlMappings.set(`/assets/${imageFile}`, urlData.publicUrl);
            } else {
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('listing-images')
                    .getPublicUrl(storageKey);

                urlMappings.set(`/assets/${imageFile}`, urlData.publicUrl);
                console.log(`✅ Uploaded ${imageFile} -> ${urlData.publicUrl}`);
                uploadCount++;
            }
        }
    }

    // Upload listing-assets images
    for (const imageFile of listingAssetImages) {
        const localPath = path.join(listingAssetsPath, imageFile);
        const storageKey = `listing-assets/${imageFile}`;

        if (existingFiles.has(storageKey)) {
            // Already exists, just get the URL
            const { data: urlData } = supabase.storage
                .from('listing-images')
                .getPublicUrl(storageKey);

            urlMappings.set(`/assets/listing-assets/${imageFile}`, urlData.publicUrl);
            console.log(`⏭️  Skipped ${imageFile} (already exists)`);
            skippedCount++;
            continue;
        }

        const file = fs.readFileSync(localPath);

        const { data, error } = await supabase.storage
            .from('listing-images')
            .upload(storageKey, file, {
                contentType: imageFile.endsWith('.png') ? 'image/png' : 'image/jpeg',
                upsert: false // Don't overwrite existing files
            });

        if (error) {
            console.error(`❌ Failed to upload ${imageFile}:`, error);
            // Still get URL in case it exists
            const { data: urlData } = supabase.storage
                .from('listing-images')
                .getPublicUrl(storageKey);
            urlMappings.set(`/assets/listing-assets/${imageFile}`, urlData.publicUrl);
        } else {
            // Get public URL
            const { data: urlData } = supabase.storage
                .from('listing-images')
                .getPublicUrl(storageKey);

            urlMappings.set(`/assets/listing-assets/${imageFile}`, urlData.publicUrl);
            console.log(`✅ Uploaded ${imageFile} -> ${urlData.publicUrl}`);
            uploadCount++;
        }

        // Add a small delay to avoid rate limiting
        if (uploadCount > 0 && uploadCount % 10 === 0) {
            console.log(`⏸️  Pausing briefly after ${uploadCount} uploads...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log(`\n🔄 Updating database with new image URLs...`);

    // Get all listings with image URLs
    const { data: listings, error: fetchError } = await supabase
        .from('listings')
        .select('id, image_urls');

    if (fetchError) {
        console.error('❌ Failed to fetch listings:', fetchError);
        return;
    }

    console.log(`📋 Found ${listings.length} listings to update`);

    let updateCount = 0;
    for (const listing of listings) {
        if (!listing.image_urls || !Array.isArray(listing.image_urls)) continue;

        // Update image URLs
        const updatedUrls = listing.image_urls.map(url => {
            if (typeof url === 'string' && urlMappings.has(url)) {
                return urlMappings.get(url);
            }
            return url;
        });

        // Check if any URLs were actually updated
        const hasChanges = JSON.stringify(listing.image_urls) !== JSON.stringify(updatedUrls);

        if (hasChanges) {
            const { error: updateError } = await supabase
                .from('listings')
                .update({ image_urls: updatedUrls })
                .eq('id', listing.id);

            if (updateError) {
                console.error(`❌ Failed to update listing ${listing.id}:`, updateError);
            } else {
                updateCount++;
                console.log(`✅ Updated listing ${listing.id}`);
            }
        }
    }

    console.log(`\n🎉 Upload complete!`);
    console.log(`📸 Total images processed: ${urlMappings.size}`);
    console.log(`⬆️  Newly uploaded: ${uploadCount}`);
    console.log(`⏭️  Skipped (already existed): ${skippedCount}`);
    console.log(`📋 Updated ${updateCount} listings with new URLs`);
    console.log(`\n🔗 All images are now served from Supabase storage and should work in production!`);
}

// Run the upload
uploadImagesAndUpdateDatabase().catch(console.error);
