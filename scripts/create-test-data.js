const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestData() {
  console.log('🚀 Creating test data...')

  try {
    // 1. Create test users
    console.log('👥 Creating test users...')

    // Create test buyers
    const { data: buyer1, error: buyer1Error } = await supabase.auth.admin.createUser({
      email: 'buyer1@test.com',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Alice Wong',
        role: 'buyer'
      }
    })

    const { data: buyer2, error: buyer2Error } = await supabase.auth.admin.createUser({
      email: 'buyer2@test.com',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Bob Chen',
        role: 'buyer'
      }
    })

    // Create test sellers
    const { data: seller1, error: seller1Error } = await supabase.auth.admin.createUser({
      email: 'seller1@test.com',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Charlie Lim',
        role: 'seller'
      }
    })

    const { data: seller2, error: seller2Error } = await supabase.auth.admin.createUser({
      email: 'seller2@test.com',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Diana Tan',
        role: 'seller'
      }
    })

    // Create admin user
    const { data: admin, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'AdminPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    })

    if (buyer1Error || buyer2Error || seller1Error || seller2Error || adminError) {
      console.error('Error creating users:', { buyer1Error, buyer2Error, seller1Error, seller2Error, adminError })
      return
    }

    console.log('✅ Users created successfully')

    // 2. Create user profiles
    console.log('📝 Creating user profiles...')

    const profiles = [
      {
        id: buyer1.user.id,
        full_name: 'Alice Wong',
        email: 'buyer1@test.com',
        role: 'buyer',
        verification_status: 'verified',
        buying_persona: 'SMALL_INVESTOR',
        phone_number: '+65-8888-1111',
        location_country: 'Singapore'
      },
      {
        id: buyer2.user.id,
        full_name: 'Bob Chen',
        email: 'buyer2@test.com',
        role: 'buyer',
        verification_status: 'anonymous',
        buying_persona: 'STRATEGIC_BUYER',
        phone_number: '+60-3-1234-5678',
        location_country: 'Malaysia'
      },
      {
        id: seller1.user.id,
        full_name: 'Charlie Lim',
        email: 'seller1@test.com',
        role: 'seller',
        verification_status: 'verified',
        phone_number: '+65-9999-2222',
        location_country: 'Singapore'
      },
      {
        id: seller2.user.id,
        full_name: 'Diana Tan',
        email: 'seller2@test.com',
        role: 'seller',
        verification_status: 'anonymous',
        phone_number: '+66-2-123-4567',
        location_country: 'Thailand'
      },
      {
        id: admin.user.id,
        full_name: 'Admin User',
        email: 'admin@test.com',
        role: 'admin',
        verification_status: 'verified',
        phone_number: '+65-6666-0000',
        location_country: 'Singapore'
      }
    ]

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(profiles)

    if (profileError) {
      console.error('Error creating profiles:', profileError)
      return
    }

    console.log('✅ User profiles created successfully')

    // 3. Create test listings
    console.log('🏢 Creating test listings...')

    const listings = [
      {
        seller_id: seller1.user.id,
        listing_title_anonymous: 'Established F&B Chain in Singapore',
        anonymous_business_description: 'Profitable restaurant chain with 3 locations in prime areas. Specializing in local cuisine with strong customer base.',
        industry: 'Food & Beverage',
        location_country: 'Singapore',
        location_city_region_general: 'Central Singapore',
        year_established: 2018,
        asking_price: 850000,
        annual_revenue: 1200000,
        annual_net_profit: 180000,
        number_of_employees: 25,
        business_website_url: 'https://example-fb.com',
        specific_growth_opportunities: 'Expansion to delivery platforms, catering services, franchise opportunities',
        status: 'verified_with_financials',
        image_urls: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400']
      },
      {
        seller_id: seller1.user.id,
        listing_title_anonymous: 'E-commerce Beauty Products Store',
        anonymous_business_description: 'Online beauty and skincare retailer with established supplier relationships and loyal customer base.',
        industry: 'E-commerce',
        location_country: 'Singapore',
        location_city_region_general: 'Singapore',
        year_established: 2020,
        asking_price: 320000,
        annual_revenue: 480000,
        annual_net_profit: 72000,
        number_of_employees: 8,
        business_website_url: 'https://example-beauty.com',
        specific_growth_opportunities: 'Social media marketing, product line expansion, international shipping',
        status: 'verified_anonymous',
        image_urls: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400']
      },
      {
        seller_id: seller2.user.id,
        listing_title_anonymous: 'Digital Marketing Agency',
        anonymous_business_description: 'Full-service digital marketing agency serving SMEs across Southeast Asia. Strong recurring client base.',
        industry: 'Professional Services',
        location_country: 'Thailand',
        location_city_region_general: 'Bangkok',
        year_established: 2019,
        asking_price: 650000,
        annual_revenue: 890000,
        annual_net_profit: 125000,
        number_of_employees: 15,
        business_website_url: 'https://example-marketing.com',
        specific_growth_opportunities: 'AI/automation tools, enterprise clients, team expansion',
        status: 'verified_anonymous',
        image_urls: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400']
      }
    ]

    const { error: listingError } = await supabase
      .from('listings')
      .insert(listings)

    if (listingError) {
      console.error('Error creating listings:', listingError)
      return
    }

    console.log('✅ Test listings created successfully')

    // 4. Create test inquiries
    console.log('💬 Creating test inquiries...')

    // Get the created listings
    const { data: createdListings } = await supabase
      .from('listings')
      .select('id, seller_id')
      .in('seller_id', [seller1.user.id, seller2.user.id])

    if (createdListings && createdListings.length > 0) {
      const inquiries = [
        {
          listing_id: createdListings[0].id,
          buyer_id: buyer1.user.id,
          seller_id: createdListings[0].seller_id,
          message: 'Hi, I am very interested in this F&B business. Could you provide more details about the lease terms and financial performance?',
          status: 'new_inquiry'
        },
        {
          listing_id: createdListings[1].id,
          buyer_id: buyer2.user.id,
          seller_id: createdListings[1].seller_id,
          message: 'This e-commerce business looks promising. I would like to understand the current marketing strategies and customer acquisition costs.',
          status: 'new_inquiry'
        }
      ]

      const { error: inquiryError } = await supabase
        .from('inquiries')
        .insert(inquiries)

      if (inquiryError) {
        console.error('Error creating inquiries:', inquiryError)
        return
      }

      console.log('✅ Test inquiries created successfully')
    }

    console.log('\n🎉 Test data creation completed!')
    console.log('\nTest accounts created:')
    console.log('👤 Buyers:')
    console.log('  - buyer1@test.com (verified) - Password: TestPass123!')
    console.log('  - buyer2@test.com (anonymous) - Password: TestPass123!')
    console.log('👤 Sellers:')
    console.log('  - seller1@test.com (verified) - Password: TestPass123!')
    console.log('  - seller2@test.com (anonymous) - Password: TestPass123!')
    console.log('👤 Admin:')
    console.log('  - admin@test.com (verified) - Password: AdminPass123!')
    console.log('\n🏢 3 test listings created')
    console.log('💬 2 test inquiries created')

  } catch (error) {
    console.error('❌ Error creating test data:', error)
  }
}

// Run the function
createTestData()
