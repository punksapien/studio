#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  try {
    console.log('🔍 Testing basic admin API connectivity...');
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('❌ Admin API error:', error);
      return false;
    } else {
      console.log('✅ Admin API connection successful');
      console.log('📊 Current users count:', data.users.length);
      if (data.users.length > 0) {
        console.log('👥 Existing users:');
        data.users.forEach(user => {
          console.log('   -', user.email, '(ID:', user.id + ')');
        });

        // Check specifically for admin user
        const adminUser = data.users.find(u => u.email === 'admin@nobridge.com');
        if (adminUser) {
          console.log('⚠️  Admin user already exists in auth.users:', adminUser.id);
          console.log('   Created:', adminUser.created_at);
          console.log('   Email confirmed:', adminUser.email_confirmed_at ? 'Yes' : 'No');
          console.log('   Last sign in:', adminUser.last_sign_in_at || 'Never');
        }
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

async function checkUserProfiles() {
  try {
    console.log('\n🔍 Checking user_profiles table...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'admin@nobridge.com');

    if (error) {
      console.error('❌ User profiles query error:', error);
    } else {
      if (data.length > 0) {
        console.log('⚠️  Admin profile already exists in user_profiles:');
        console.log('   ', JSON.stringify(data[0], null, 2));
      } else {
        console.log('✅ No admin profile found in user_profiles');
      }
    }
  } catch (error) {
    console.error('❌ User profiles check failed:', error);
  }
}

async function main() {
  const connectionOk = await testConnection();
  if (connectionOk) {
    await checkUserProfiles();
  }
}

main();
