const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Remote Supabase credentials
const supabaseUrl = 'https://kktmizfxgtkodtujursv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdG1pemZ4Z3Rrb2R0dWp1cnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU4NjAwMSwiZXhwIjoyMDY0MTYyMDAxfQ.EComR2_5PS_fdW2XzOTPjSfOjBacve0nrblAEHUsLwk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPublicStorage() {
    console.log('🚀 Setting up public storage for listing images...');

    // Step 1: Make bucket public
    console.log('📂 Making listing-images bucket public...');

    const { data: bucketData, error: bucketError } = await supabase.storage
        .updateBucket('listing-images', { public: true });

    if (bucketError) {
        console.log('⚠️  Bucket update error (might already be public):', bucketError.message);
    } else {
        console.log('✅ Bucket is now public');
    }

    // Step 2: Upload original images (listing-1.jpg to listing-5.jpg)
    console.log('\n📸 Uploading original listing images...');

    const originalImages = ['listing-1.jpg', 'listing-2.jpg', 'listing-3.jpg', 'listing-4.jpg', 'listing-5.jpg'];
    const urlMappings = new Map();

    for (const imageFile of originalImages) {
        const localPath = path.join('public/assets', imageFile);
        if (fs.existsSync(localPath)) {
            const file = fs.readFileSync(localPath);
            const storageKey = `original/${imageFile}`;

            const { data, error } = await supabase.storage
                .from('listing-images')
                .upload(storageKey, file, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) {
                console.log(`⚠️  Upload error for ${imageFile}:`, error.message);
            } else {
                console.log(`✅ Uploaded ${imageFile}`);
            }

            // Get public URL regardless of upload result
            const { data: urlData } = supabase.storage
                .from('listing-images')
                .getPublicUrl(storageKey);

            urlMappings.set(`/assets/${imageFile}`, urlData.publicUrl);
        }
    }

    // Step 3: Upload CSV images (sample first, then all)
    console.log('\n📸 Uploading CSV listing images (first 20)...');

    const listingAssetsPath = 'public/assets/listing-assets';
    const csvImages = fs.readdirSync(listingAssetsPath)
        .filter(file => file.match(/\.(jpg|jpeg|png)$/i))
        .slice(0, 20); // Start with first 20

    for (const imageFile of csvImages) {
        const localPath = path.join(listingAssetsPath, imageFile);
        const file = fs.readFileSync(localPath);
        const storageKey = `listing-assets/${imageFile}`;

        const { data, error } = await supabase.storage
            .from('listing-images')
            .upload(storageKey, file, {
                contentType: imageFile.endsWith('.png') ? 'image/png' : 'image/jpeg',
                upsert: true
            });

        if (error) {
            console.log(`⚠️  Upload error for ${imageFile}:`, error.message);
        } else {
            console.log(`✅ Uploaded ${imageFile}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(storageKey);

        urlMappings.set(`/assets/listing-assets/${imageFile}`, urlData.publicUrl);
    }

    // Step 4: Test public access
    console.log('\n🔍 Testing public access...');

    const testUrl = Array.from(urlMappings.values())[0];
    console.log(`Testing URL: ${testUrl}`);

    try {
        const response = await fetch(testUrl);
        console.log(`Response status: ${response.status}`);
        if (response.ok) {
            console.log('✅ Public access working!');
        } else {
            console.log('❌ Public access failed');
        }
    } catch (error) {
        console.log('❌ Fetch error:', error.message);
    }

    // Step 5: Update database with new URLs (just the first few for testing)
    console.log('\n📋 Updating database URLs (first 10 listings)...');

    const { data: listings, error: fetchError } = await supabase
        .from('listings')
        .select('id, image_urls')
        .limit(10);

    if (fetchError) {
        console.error('❌ Failed to fetch listings:', fetchError);
        return;
    }

    let updateCount = 0;
    for (const listing of listings) {
        if (!listing.image_urls || !Array.isArray(listing.image_urls)) continue;

        const updatedUrls = listing.image_urls.map(url => {
            return urlMappings.get(url) || url;
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

    console.log(`\n🎉 Setup complete!`);
    console.log(`📸 Images uploaded: ${urlMappings.size}`);
    console.log(`📋 Database records updated: ${updateCount}`);
    console.log(`\n🔗 Test the first URL: ${Array.from(urlMappings.values())[0]}`);
}

setupPublicStorage().catch(console.error);
