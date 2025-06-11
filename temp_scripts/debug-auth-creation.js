#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuthUserCreation() {
  const adminEmail = 'admin@nobridge.com';
  const adminPassword = '100%Test';

  console.log('🧪 Testing ONLY auth user creation (no profile)...');
  console.log('📧 Email:', adminEmail);

  try {
    // Test just the auth user creation part
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      console.error('   Error code:', authError.code);
      console.error('   Error status:', authError.status);
      console.error('   Error message:', authError.message);

      // Check if it's because user already exists
      if (authError.message.includes('already exists') || authError.code === 'email_exists') {
        console.log('📝 User already exists - checking current state...');
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === adminEmail);
        if (existingUser) {
          console.log('✅ Found existing auth user:', existingUser.id);
          return { success: true, user: existingUser, isExisting: true };
        }
      }
      return { success: false, error: authError };
    } else {
      console.log('✅ Auth user created successfully!');
      console.log('   User ID:', authUser.user.id);
      console.log('   Email:', authUser.user.email);
      console.log('   Created at:', authUser.user.created_at);
      console.log('   Email confirmed:', authUser.user.email_confirmed_at ? 'Yes' : 'No');
      return { success: true, user: authUser.user, isExisting: false };
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error };
  }
}

async function testProfileCreation(userId) {
  console.log('\n🧪 Testing profile creation for user:', userId);

  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email: 'admin@nobridge.com',
        full_name: 'Admin User',
        role: 'admin',
        is_email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      console.error('   Error code:', profileError.code);
      console.error('   Error message:', profileError.message);
      console.error('   Error hint:', profileError.hint);
      console.error('   Error details:', profileError.details);
      return { success: false, error: profileError };
    } else {
      console.log('✅ Profile created successfully!');
      console.log('   Profile ID:', profile.id);
      return { success: true, profile };
    }
  } catch (error) {
    console.error('❌ Unexpected profile error:', error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 Starting isolated admin user creation test...\n');

  // Step 1: Test auth user creation
  const authResult = await testAuthUserCreation();

  if (!authResult.success) {
    console.log('\n❌ Auth user creation failed - stopping here');
    return;
  }

  const userId = authResult.user.id;
  console.log('\n📝 Auth user exists with ID:', userId);

  // Step 2: Test profile creation
  const profileResult = await testProfileCreation(userId);

  if (profileResult.success) {
    console.log('\n🎉 Complete admin user creation successful!');
    console.log('   Auth user:', userId);
    console.log('   Profile created:', profileResult.profile.id);
  } else {
    console.log('\n❌ Profile creation failed - auth user exists but profile creation blocked');
  }
}

main();
