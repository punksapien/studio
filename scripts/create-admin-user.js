#!/usr/bin/env node

/**
 * Script to create an admin user in Supabase Auth + user_profiles table
 * Usage: node scripts/create-admin-user.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
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

  console.log('🚀 Creating admin user...');

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

    console.log('\n🎉 Admin user setup complete!');
    console.log('💡 You can now login with:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   URL: http://localhost:9002/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
