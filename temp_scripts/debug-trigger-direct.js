#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTriggerLogicDirectly() {
  console.log('🧪 Testing what the handle_new_user trigger is trying to do...');

  // Simulate what the trigger function tries to insert
  const testUserId = 'test-uuid-' + Date.now();
  const testEmail = 'test@example.com';
  const testFullName = 'Test User';

  try {
    console.log('📝 Attempting direct insert into user_profiles...');
    console.log('   ID:', testUserId);
    console.log('   Email:', testEmail);
    console.log('   Full Name:', testFullName);
    console.log('   Role: buyer');

    // This simulates what the trigger does:
    // INSERT INTO public.user_profiles (id, email, full_name, role)
    // VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'buyer');

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: testFullName,
        role: 'buyer'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Direct insert failed:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
    } else {
      console.log('✅ Direct insert succeeded:', data.id);

      // Clean up
      await supabase.from('user_profiles').delete().eq('id', testUserId);
      console.log('🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testWithMissingColumns() {
  console.log('\n🧪 Testing trigger logic with minimal required columns...');

  try {
    // Check what columns are actually required (NOT NULL without defaults)
    console.log('📝 Checking user_profiles table constraints...');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Table query failed:', error);
    } else {
      console.log('✅ Table accessible - checking required fields...');

      // Try insert with only fields the trigger provides
      const testId = 'minimal-test-' + Date.now();

      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: testId,
          email: 'minimal@test.com',
          full_name: 'Minimal Test',
          role: 'buyer'
          // Not providing other NOT NULL fields to see what's missing
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Minimal insert failed:', insertError);
        console.error('   This is likely what the trigger is failing on!');

        if (insertError.message.includes('violates not-null constraint')) {
          console.log('💡 SOLUTION: The trigger needs to provide more NOT NULL columns!');
        }
      } else {
        console.log('✅ Minimal insert succeeded - trigger should work');
        // Clean up
        await supabase.from('user_profiles').delete().eq('id', testId);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  console.log('🚀 Testing trigger function logic directly...\n');

  await testTriggerLogicDirectly();
  await testWithMissingColumns();
}

main();
