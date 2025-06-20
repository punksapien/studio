#!/usr/bin/env node

/**
 * Script to create an admin user in REMOTE Supabase Auth + user_profiles table
 * Usage: node scripts/create-admin-user-remote.js
 *
 * Set these environment variables before running:
 * REMOTE_SUPABASE_URL=https://your-project.supabase.co
 * REMOTE_SUPABASE_SERVICE_KEY=your-service-role-key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Use remote environment variables (set these before running)
const supabaseUrl = process.env.REMOTE_SUPABASE_URL;
const supabaseServiceKey = process.env.REMOTE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing remote environment variables:');
  console.error('REMOTE_SUPABASE_URL:', !!supabaseUrl);
  console.error('REMOTE_SUPABASE_SERVICE_KEY:', !!supabaseServiceKey);
  console.error('\n💡 Set these environment variables before running:');
  console.error('export REMOTE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('export REMOTE_SUPABASE_SERVICE_KEY=your-service-role-key');
  process.exit(1);
}

// Create Supabase client with service role (can bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const adminEmail = 'admin@nobridge.com';
  const adminPassword = '100%Test';

  console.log('🚀 Creating admin user in REMOTE Supabase...');
  console.log('🌐 Target URL:', supabaseUrl);

  try {
    // Step 1: Create auth user using admin API
    console.log('📧 Creating auth user:', adminEmail);

    let { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already exists') || authError.code === 'email_exists') {
        console.log('⚠️  Auth user already exists, continuing with profile creation...');

        // Get existing user
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = existingUsers.users.find(u => u.email === adminEmail);
        if (!existingUser) throw new Error('User exists but could not be found');

        console.log('✅ Found existing auth user:', existingUser.id);

        // Use existing user data
        authUser = { user: existingUser };
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Auth user created:', authUser.user.id);
    }

    const userId = authUser.user.id;

    // Step 2: Create or update user profile
    console.log('👤 Creating user profile...');

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: adminEmail,
        full_name: 'Admin User',
        role: 'admin',
        is_email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      throw profileError;
    }

    console.log('✅ User profile created/updated:', profile.id);

    // Step 3: Verify the setup
    console.log('🔍 Verifying admin user setup...');

    const { data: verifyProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (verifyError) throw verifyError;

    console.log('📋 Final admin user details:');
    console.log('   User ID:', verifyProfile.id);
    console.log('   Email:', verifyProfile.email);
    console.log('   Role:', verifyProfile.role);
    console.log('   Email Verified:', verifyProfile.is_email_verified);
    console.log('   Onboarding Complete:', verifyProfile.is_onboarding_completed);

    console.log('\n🎉 Remote admin user setup complete!');
    console.log('💡 You can now login with:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   URL: https://your-app.vercel.app/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
