const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkUserSchema() {
  try {
    console.log('Checking user_profiles table schema...');

    // Try to insert a minimal user to see what columns are required/available
    const { data: testUser, error: testError } = await supabase
      .from('user_profiles')
      .insert({
        email: 'test-schema@gmail.com',
        full_name: 'Schema Test',
        role: 'seller'
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Minimal insert failed:', testError);

      // Try to see what columns exist by querying an empty result
      console.log('\nTrying to query structure...');
      const { data: emptyQuery, error: emptyError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(0);

      if (emptyError) {
        console.error('Empty query error:', emptyError);
      } else {
        console.log('✅ Table exists, trying different approach...');
      }
    } else {
      console.log('✅ Minimal user insert succeeded!');
      console.log('Available columns in created user:', Object.keys(testUser));

      // Clean up test user
      await supabase
        .from('user_profiles')
        .delete()
        .eq('email', 'test-schema@gmail.com');
    }

    // Try to create user without password_hash
    console.log('\nAttempting to create user without password_hash...');
    const { data: realUser, error: realError } = await supabase
      .from('user_profiles')
      .insert({
        id: '2fad0689-95a5-413b-9a38-5885f14f6a7b',
        email: 'seller@gmail.com',
        full_name: 'Test Seller',
        phone_number: '+1234567890',
        country: 'United States',
        role: 'seller',
        is_email_verified: true,
        email_verified_at: new Date().toISOString(),
        verification_status: 'verified',
        initial_company_name: 'Tech Solutions Inc',
        email_notifications_general: true,
        email_notifications_inquiries: true,
        email_notifications_listing_updates: true,
        email_notifications_system: true
      })
      .select()
      .single();

    if (realError) {
      console.error('❌ Real user creation failed:', realError);
    } else {
      console.log('✅ Real user created successfully!');
      console.log('User data:', realUser);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkUserSchema();
