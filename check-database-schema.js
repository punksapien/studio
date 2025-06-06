const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkSchema() {
  try {
    console.log('Checking user_profiles table schema...');

    // Check table structure
    const { data: columns, error } = await supabase
      .rpc('exec', {
        sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
        `
      });

    if (error) {
      console.error('Error checking schema:', error);

      // Try alternative method - test by querying the table
      console.log('\nTrying alternative method - querying user_profiles...');
      const { data: users, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email_notifications_general, email_notifications_inquiries, email_notifications_listing_updates, email_notifications_system')
        .limit(1);

      if (userError) {
        console.error('User query error:', userError);
        console.log('❌ Notification preference columns likely do not exist');
      } else {
        console.log('✅ Notification preference columns exist!');
        console.log('Sample user:', users?.[0]);
      }
    } else {
      console.log('Schema query successful:', columns);
    }

    // Check if user exists
    console.log('\nChecking current user data...');
    const { data: currentUser, error: currentUserError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', '2fad0689-95a5-413b-9a38-5885f14f6a7b')
      .single();

    if (currentUserError) {
      console.error('Current user fetch error:', currentUserError);
    } else {
      console.log('Current user data:');
      console.log('- ID:', currentUser.id);
      console.log('- Email:', currentUser.email);
      console.log('- Notification columns:');
      console.log('  - email_notifications_general:', currentUser.email_notifications_general);
      console.log('  - email_notifications_inquiries:', currentUser.email_notifications_inquiries);
      console.log('  - email_notifications_listing_updates:', currentUser.email_notifications_listing_updates);
      console.log('  - email_notifications_system:', currentUser.email_notifications_system);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSchema();
