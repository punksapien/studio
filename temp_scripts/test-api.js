require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testAPI() {
  console.log('Testing API response for user verification...');

  // Get the rejected user
  const userId = '71b2427e-a5fb-42c9-93e6-a526f96c1f3e';

  console.log('\n1. User Profile (full debug):');
  const { data: profileResult, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId);

  console.log('  Profile query error:', profileError);
  console.log('  Profile count:', profileResult?.length || 0);

  if (profileResult && profileResult.length > 0) {
    const profile = profileResult[0];
    console.log('  Profile data keys:', Object.keys(profile));
    console.log('  Verification status:', profile.verification_status);
    console.log('  Full name:', profile.full_name);
  }

  console.log('\n2. Verification Requests:');
  const { data: requests } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('request_type', 'user_verification')
    .order('created_at', { ascending: false });

  console.log('  Found', requests?.length || 0, 'requests');

  requests?.forEach((req, i) => {
    const now = new Date();
    const lastRequest = new Date(req.last_request_time);
    const timeDiff = (now - lastRequest) / 1000;
    console.log(`  Request ${i + 1}:`);
    console.log(`    ID: ${req.id}`);
    console.log(`    Status: ${req.status}`);
    console.log(`    Last request: ${Math.floor(timeDiff)}s ago`);
    console.log(`    Can submit after 20s? ${timeDiff >= 20 ? 'YES' : 'NO'}`);
    console.log(`    Is pending: ${req.is_pending}`);
  });

  console.log('\n3. Expected Behavior:');
  const latestRequest = requests?.[0];
  const profile = profileResult?.[0];
  if (latestRequest && profile) {
    const now = new Date();
    const lastRequest = new Date(latestRequest.last_request_time);
    const timeDiff = (now - lastRequest) / 1000;

    console.log(`  Profile status: ${profile.verification_status}`);
    console.log(`  Time since last request: ${Math.floor(timeDiff)}s`);
    console.log(`  Cooldown requirement: 20s`);

    if (profile.verification_status === 'rejected' && timeDiff >= 20) {
      console.log('  ✅ User should be able to submit new verification request');
      console.log('  ✅ Button should show "Request Verification Again" and be clickable');
    } else if (timeDiff < 20) {
      console.log('  ❌ User should not be able to submit yet');
      console.log(`  ❌ Cooldown remaining: ${Math.ceil(20 - timeDiff)}s`);
    } else {
      console.log('  ❓ Unexpected state - check logic');
    }
  } else {
    console.log('  ❓ Missing data - profile or request not found');
    console.log(`  Profile found: ${!!profile}`);
    console.log(`  Request found: ${!!latestRequest}`);
  }
}

testAPI().catch(console.error);
