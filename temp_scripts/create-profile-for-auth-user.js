const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function createProfileForExistingUser() {
  try {
    console.log('🚀 Creating user profile for existing authenticated user...');

    // The user ID 2fad0689-95a5-413b-9a38-5885f14f6a7b exists in auth.users
    // We need to create the corresponding profile in user_profiles

    console.log('\n1. Creating user profile...');
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .insert({
        id: '2fad0689-95a5-413b-9a38-5885f14f6a7b', // Must match auth.users.id
        email: 'seller@gmail.com',
        full_name: 'Test Seller',
        phone_number: '+1234567890',
        country: 'United States',
        role: 'seller',
        is_email_verified: true,
        email_verified_at: new Date().toISOString(),
        verification_status: 'verified',
        initial_company_name: 'Tech Solutions Inc',
        // Set notification preferences to default values
        email_notifications_general: true,
        email_notifications_inquiries: true,
        email_notifications_listing_updates: true,
        email_notifications_system: true,
        is_onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step_completed: 5
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user profile:', userError);
      return;
    }

    console.log('✅ User profile created successfully!');
    console.log('Profile data:', user);

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
        console.error('❌ Error creating listing:', listingError);
      } else {
        console.log(`✅ Listing created: ${listingData.listing_title_anonymous}`);
      }
    }

    console.log('\n🎉 User profile and test data setup complete!');
    console.log('\nTest user details:');
    console.log('- ID: 2fad0689-95a5-413b-9a38-5885f14f6a7b');
    console.log('- Email: seller@gmail.com');
    console.log('- Role: seller');
    console.log('- Verification: verified');
    console.log('- Notification preferences: all enabled');
    console.log('- Onboarding: completed');

    console.log('\n🔄 You can now refresh the seller dashboard to see data!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createProfileForExistingUser();
