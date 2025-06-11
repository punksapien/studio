const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkListingsSchema() {
  try {
    console.log('Checking listings table...');

    // Test query similar to what the API uses
    console.log('\nTesting API-style query...');
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        short_description,
        business_overview,
        asking_price,
        business_type,
        industry,
        location_country,
        location_city,
        established_year,
        number_of_employees,
        website_url,
        images,
        status,
        verification_status,
        created_at,
        updated_at
      `)
      .limit(5);

    if (listingsError) {
      console.error('❌ API-style query failed:', listingsError);

      // Try to see what columns actually exist
      console.log('\nTrying basic query to see what exists...');
      const { data: basicListings, error: basicError } = await supabase
        .from('listings')
        .select('*')
        .limit(1);

      if (basicError) {
        console.error('❌ Basic query also failed:', basicError);
      } else {
        console.log('✅ Basic query succeeded. Available columns:');
        if (basicListings && basicListings.length > 0) {
          console.log('Available columns:', Object.keys(basicListings[0]));
        } else {
          console.log('No data in listings table');
        }
      }
    } else {
      console.log('✅ API-style query succeeded!');
      console.log(`Found ${listings.length} listings`);
      if (listings.length > 0) {
        console.log('Sample listing keys:', Object.keys(listings[0]));
      }
    }

    // Check if our user has any listings
    console.log('\nChecking for user listings...');
    const { data: userListings, error: userError } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', '2fad0689-95a5-413b-9a38-5885f14f6a7b');

    if (userError) {
      console.error('User listings error:', userError);
    } else {
      console.log(`User has ${userListings?.length || 0} listings`);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkListingsSchema();
