const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function setupTestData() {
  try {
    console.log('🚀 Setting up test data...');

    // 1. Create test user profile
    console.log('\n1. Creating test user profile...');
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .insert({
        id: '2fad0689-95a5-413b-9a38-5885f14f6a7b',
        email: 'seller@gmail.com',
        full_name: 'Test Seller',
        phone_number: '+1234567890',
        country: 'United States',
        role: 'seller',
        password_hash: '$2b$12$hashed_password_here', // placeholder
        is_email_verified: true,
        email_verified_at: new Date().toISOString(),
        verification_status: 'verified',
        initial_company_name: 'Tech Solutions Inc',
        // Set notification preferences to default values
        email_notifications_general: true,
        email_notifications_inquiries: true,
        email_notifications_listing_updates: true,
        email_notifications_system: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
    } else {
      console.log('✅ User created successfully');
    }

    // 2. Create test listings
    console.log('\n2. Creating test listings...');
    const testListings = [
      {
        seller_id: '2fad0689-95a5-413b-9a38-5885f14f6a7b',
        listing_title_anonymous: 'Profitable SaaS Business for Sale',
        industry: 'Technology',
        location_country: 'United States',
        location_city_region_general: 'San Francisco, CA',
        anonymous_business_description: 'A thriving software-as-a-service business with recurring revenue and strong growth potential.',
        key_strengths_anonymous: ['Recurring revenue model', 'Strong customer retention', 'Scalable technology'],
        annual_revenue_range: '$500K - $1M',
        net_profit_margin_range: '20-30%',
        asking_price: 750000,
        deal_structure_looking_for: ['Asset purchase', 'Stock purchase'],
        reason_for_selling_anonymous: 'Founder moving to new venture',
        business_model: 'B2B SaaS with monthly subscriptions',
        year_established: 2020,
        number_of_employees: '10-20',
        business_website_url: 'https://example-saas.com',
        status: 'verified_anonymous',
        is_seller_verified: true,
        specific_annual_revenue_last_year: 875000,
        specific_net_profit_last_year: 218750,
        adjusted_cash_flow: 200000
      },
      {
        seller_id: '2fad0689-95a5-413b-9a38-5885f14f6a7b',
        listing_title_anonymous: 'E-commerce Store - Health & Wellness',
        industry: 'E-commerce',
        location_country: 'United States',
        location_city_region_general: 'Austin, TX',
        anonymous_business_description: 'Established online store selling health and wellness products with strong brand recognition.',
        key_strengths_anonymous: ['Strong brand', 'Loyal customer base', 'High margins'],
        annual_revenue_range: '$1M - $2M',
        net_profit_margin_range: '15-25%',
        asking_price: 1200000,
        deal_structure_looking_for: ['Asset purchase'],
        reason_for_selling_anonymous: 'Owner retirement',
        business_model: 'Direct-to-consumer e-commerce',
        year_established: 2018,
        number_of_employees: '5-10',
        business_website_url: 'https://example-health.com',
        status: 'active',
        is_seller_verified: false,
        specific_annual_revenue_last_year: 1450000,
        specific_net_profit_last_year: 290000,
        adjusted_cash_flow: 275000
      }
    ];

    for (const listing of testListings) {
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .insert(listing)
        .select()
        .single();

      if (listingError) {
        console.error('Error creating listing:', listingError);
      } else {
        console.log(`✅ Listing created: ${listingData.listing_title_anonymous}`);
      }
    }

    // 3. Create test inquiries
    console.log('\n3. Creating test inquiries...');

    // First create a test buyer
    const { data: buyer, error: buyerError } = await supabase
      .from('user_profiles')
      .insert({
        email: 'buyer@gmail.com',
        full_name: 'Test Buyer',
        role: 'buyer',
        password_hash: '$2b$12$hashed_password_here',
        is_email_verified: true,
        verification_status: 'verified',
        buyer_persona_type: 'Individual Investor',
        preferred_investment_size: '$500K - $1M'
      })
      .select()
      .single();

    if (buyerError && buyerError.code !== '23505') { // Ignore duplicate key error
      console.error('Error creating buyer:', buyerError);
    }

    // Get the first listing to create inquiries against
    const { data: firstListing } = await supabase
      .from('listings')
      .select('id')
      .eq('seller_id', '2fad0689-95a5-413b-9a38-5885f14f6a7b')
      .limit(1)
      .single();

    if (firstListing && buyer) {
      const { data: inquiry, error: inquiryError } = await supabase
        .from('inquiries')
        .insert({
          listing_id: firstListing.id,
          buyer_id: buyer.id,
          seller_id: '2fad0689-95a5-413b-9a38-5885f14f6a7b',
          status: 'new_inquiry'
        })
        .select()
        .single();

      if (inquiryError) {
        console.error('Error creating inquiry:', inquiryError);
      } else {
        console.log('✅ Test inquiry created');
      }
    }

    console.log('\n🎉 Test data setup complete!');
    console.log('\nTest user details:');
    console.log('- ID: 2fad0689-95a5-413b-9a38-5885f14f6a7b');
    console.log('- Email: seller@gmail.com');
    console.log('- Role: seller');
    console.log('- Verification: verified');
    console.log('- Notification preferences: all enabled');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupTestData();
