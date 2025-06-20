const { createClient } = require('@supabase/supabase-js');

// Remote Supabase credentials
const supabaseUrl = 'https://kktmizfxgtkodtujursv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdG1pemZ4Z3Rrb2R0dWp1cnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU4NjAwMSwiZXhwIjoyMDY0MTYyMDAxfQ.EComR2_5PS_fdW2XzOTPjSfOjBacve0nrblAEHUsLwk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateImageUrls() {
    console.log('🔄 Updating image URLs in database...');

    // Get all listings
    const { data: listings, error: fetchError } = await supabase
        .from('listings')
        .select('id, image_urls');

    if (fetchError) {
        console.error('❌ Failed to fetch listings:', fetchError);
        return;
    }

    console.log(`📋 Found ${listings.length} listings to check`);

    let updateCount = 0;

    for (const listing of listings) {
        if (!listing.image_urls || !Array.isArray(listing.image_urls)) continue;

        // Update image URLs
        const updatedUrls = listing.image_urls.map(url => {
            if (typeof url === 'string') {
                // Convert old static paths to Supabase storage URLs
                if (url.startsWith('/assets/listing-1.jpg')) {
                    return `${supabaseUrl}/storage/v1/object/public/listing-images/original/listing-1.jpg`;
                } else if (url.startsWith('/assets/listing-2.jpg')) {
                    return `${supabaseUrl}/storage/v1/object/public/listing-images/original/listing-2.jpg`;
                } else if (url.startsWith('/assets/listing-3.jpg')) {
                    return `${supabaseUrl}/storage/v1/object/public/listing-images/original/listing-3.jpg`;
                } else if (url.startsWith('/assets/listing-4.jpg')) {
                    return `${supabaseUrl}/storage/v1/object/public/listing-images/original/listing-4.jpg`;
                } else if (url.startsWith('/assets/listing-5.jpg')) {
                    return `${supabaseUrl}/storage/v1/object/public/listing-images/original/listing-5.jpg`;
                } else if (url.startsWith('/assets/listing-assets/')) {
                    // Extract filename from path like /assets/listing-assets/listing-001-7bda5389.jpg
                    const filename = url.replace('/assets/listing-assets/', '');
                    return `${supabaseUrl}/storage/v1/object/public/listing-images/listing-assets/${filename}`;
                }
            }
            return url; // Keep unchanged if no match
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
                console.log(`   Old: ${JSON.stringify(listing.image_urls)}`);
                console.log(`   New: ${JSON.stringify(updatedUrls)}`);
            }
        }
    }

    console.log(`\n🎉 Update complete!`);
    console.log(`📋 Updated ${updateCount} listings with Supabase storage URLs`);
    console.log(`\n🔗 All images should now load correctly in production!`);
}

// Run the update
updateImageUrls().catch(console.error);
