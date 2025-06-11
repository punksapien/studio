require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkVerificationRequests() {
  console.log('🔍 Checking verification requests...');
  console.log('VERIFICATION_REQUEST_TIMEOUT:', process.env.VERIFICATION_REQUEST_TIMEOUT, 'seconds');

  const { data, error } = await supabase
    .from('verification_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📋 Found ${data.length} verification requests:\n`);

  data.forEach((req, index) => {
    const now = new Date();
    const lastRequest = new Date(req.last_request_time);
    const timeDiff = (now - lastRequest) / 1000;
    const timeoutSeconds = parseInt(process.env.VERIFICATION_REQUEST_TIMEOUT || '86400', 10);
    const canSubmitNew = timeDiff >= timeoutSeconds;

    console.log(`${index + 1}. Request ID: ${req.id.slice(0, 8)}...`);
    console.log(`   User: ${req.user_id.slice(0, 8)}...`);
    console.log(`   Type: ${req.request_type}`);
    console.log(`   Status: ${req.status}`);
    console.log(`   Last Request: ${req.last_request_time}`);
    console.log(`   Time Ago: ${Math.floor(timeDiff)} seconds`);
    console.log(`   Can Submit New: ${canSubmitNew ? '✅ YES' : '❌ NO'} (need ${timeoutSeconds}s)`);
    console.log(`   Remaining: ${canSubmitNew ? 0 : Math.ceil(timeoutSeconds - timeDiff)} seconds`);
    console.log('');
  });
}

checkVerificationRequests().catch(console.error);
