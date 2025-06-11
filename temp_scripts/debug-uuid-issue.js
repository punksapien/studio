#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWithProperUUID() {
  console.log('🧪 Testing trigger logic with proper UUID...');

  const properUUID = randomUUID();
  console.log('📝 Using proper UUID:', properUUID);

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: properUUID,
        email: 'uuid-test@example.com',
        full_name: 'UUID Test',
        role: 'buyer'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Insert with proper UUID failed:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);

      if (error.code === '23503') {
        console.log('💡 FOREIGN KEY CONSTRAINT: UUID must exist in auth.users first!');
        console.log('   This confirms the trigger fails because auth.users insert');
        console.log('   and user_profiles insert are not in the same transaction.');
      }
    } else {
      console.log('✅ Insert with proper UUID succeeded:', data.id);

      // Clean up
      await supabase.from('user_profiles').delete().eq('id', properUUID);
      console.log('🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testTriggerFix() {
  console.log('\n🧪 Testing if we can fix the trigger by updating it...');

  try {
    // The current trigger function is:
    // INSERT INTO public.user_profiles (id, email, full_name, role)
    // VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'buyer');

    // Issue might be:
    // 1. NEW.email might be NULL in some cases
    // 2. NEW.raw_user_meta_data->>'full_name' might be NULL
    // 3. Foreign key constraint requires NEW.id to exist in auth.users

    console.log('📝 Checking what a real auth.users record looks like...');

    // Since we know admin API works, let's check the structure
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Cannot list users:', usersError);
    } else {
      console.log('✅ Auth users count:', users.users.length);

      if (users.users.length > 0) {
        const sampleUser = users.users[0];
        console.log('📋 Sample auth user structure:');
        console.log('   ID type:', typeof sampleUser.id);
        console.log('   Email:', sampleUser.email);
        console.log('   Metadata:', sampleUser.raw_user_meta_data);
      } else {
        console.log('📝 No existing users to examine');
      }
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

async function testTriggerBypass() {
  console.log('\n🧪 Testing solution: Disable trigger, create user, enable trigger...');

  try {
    // We could temporarily disable the trigger, create the auth user,
    // manually create the profile, then re-enable the trigger

    console.log('💡 PROPOSED SOLUTION:');
    console.log('   1. Temporarily disable the handle_new_user trigger');
    console.log('   2. Create the auth user (no trigger fires)');
    console.log('   3. Manually create the user profile with admin role');
    console.log('   4. Re-enable the trigger');
    console.log('');
    console.log('   This would avoid the trigger constraint issues entirely.');

  } catch (error) {
    console.error('❌ Planning failed:', error);
  }
}

async function main() {
  console.log('🚀 Investigating UUID and trigger issues...\n');

  await testWithProperUUID();
  await testTriggerFix();
  await testTriggerBypass();
}

main();
