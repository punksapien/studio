#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDirectInsert() {
  console.log('🧪 Testing direct insert into user_profiles...');

  try {
    // Test what happens when we try to insert with minimal data
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        email: 'test-direct@example.com',
        full_name: 'Test User',
        role: 'buyer'
        // Not providing other potentially required fields
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Direct insert failed:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);

      if (error.message.includes('not-null constraint')) {
        console.log('💡 FOUND IT: There are NOT NULL fields we need to provide!');
      }
    } else {
      console.log('✅ Direct insert succeeded:', data.id);
      // Clean up
      await supabase.from('user_profiles').delete().eq('id', data.id);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testActualTrigger() {
  console.log('\n🧪 Testing what the actual trigger does...');

  try {
    // First, let's see if we can list existing users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Cannot list users:', listError);
      return;
    }

    console.log('✅ Can access auth.admin API');
    console.log('   Existing users count:', users.users.length);

    // Try a minimal auth user creation
    console.log('\n📝 Attempting to create auth user with minimal data...');

    const testEmail = `test-${Date.now()}@example.com`;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      email_confirm: true
      // NOT providing password or user_metadata
    });

    if (authError) {
      console.error('❌ Minimal auth user creation failed:', authError);
      console.error('   This suggests the issue is in auth user creation, not the trigger');
    } else {
      console.log('✅ Minimal auth user created:', authUser.user.id);

      // Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile not created by trigger:', profileError);
      } else {
        console.log('✅ Profile created by trigger:', profile);
      }

      // Clean up
      await supabase.auth.admin.deleteUser(authUser.user.id);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  console.log('🚀 Testing NOT NULL constraints and trigger behavior...\n');

  await testDirectInsert();
  await testActualTrigger();
}

main();
