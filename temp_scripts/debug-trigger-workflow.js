#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTriggerWorkflow() {
  console.log('🧪 Testing trigger workflow with test user...');

  const testEmail = 'test-trigger@example.com';
  const testPassword = 'TestPassword123';

  try {
    // Step 1: Create a test auth user to see what the trigger does
    console.log('📧 Creating test auth user:', testEmail);

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User'
        // Note: NOT setting role in metadata
      }
    });

    if (authError) {
      console.error('❌ Test user creation failed:', authError);
      return;
    }

    console.log('✅ Test auth user created:', authUser.user.id);

    // Step 2: Check what the trigger created in user_profiles
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
    } else {
      console.log('✅ Trigger created profile:');
      console.log('   ID:', profile.id);
      console.log('   Email:', profile.email);
      console.log('   Full Name:', profile.full_name);
      console.log('   Role:', profile.role);
      console.log('   Created At:', profile.created_at);
    }

    // Step 3: Try to update the role to admin
    console.log('\n🔄 Trying to update role to admin...');

    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', authUser.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Role update failed:', updateError);
    } else {
      console.log('✅ Role updated successfully:', updatedProfile.role);
    }

    // Step 4: Clean up test user
    console.log('\n🧹 Cleaning up test user...');
    await supabase.auth.admin.deleteUser(authUser.user.id);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testAdminWithTrigger() {
  console.log('\n🧪 Testing admin creation WITH trigger awareness...');

  const adminEmail = 'admin@nobridge.com';
  const adminPassword = '100%Test';

  try {
    // Step 1: Create auth user and let trigger create profile with 'buyer' role
    console.log('📧 Creating admin auth user (letting trigger create profile)...');

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    });

    if (authError) {
      console.error('❌ Admin auth user creation failed:', authError);
      return;
    }

    console.log('✅ Admin auth user created:', authUser.user.id);

    // Step 2: Wait for trigger and check profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: initialProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    console.log('📋 Initial profile created by trigger:');
    console.log('   Role:', initialProfile.role);

    // Step 3: Update the profile to admin role and other admin fields
    console.log('\n🔄 Updating profile to admin...');

    const { data: adminProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        role: 'admin',
        is_email_verified: true,
        verification_status: 'verified',
        is_onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Admin profile update failed:', updateError);
    } else {
      console.log('✅ Admin profile updated successfully!');
      console.log('   ID:', adminProfile.id);
      console.log('   Email:', adminProfile.email);
      console.log('   Role:', adminProfile.role);
      console.log('   Verified:', adminProfile.is_email_verified);
      console.log('\n🎉 Admin user creation SUCCESSFUL!');
    }

  } catch (error) {
    console.error('❌ Admin creation failed:', error);
  }
}

async function main() {
  console.log('🚀 Testing trigger behavior and admin creation workflow...\n');

  // Test 1: Understand trigger behavior
  await testTriggerWorkflow();

  // Test 2: Try admin creation with trigger awareness
  await testAdminWithTrigger();
}

main();
