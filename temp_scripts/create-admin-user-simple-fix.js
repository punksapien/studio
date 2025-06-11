#!/usr/bin/env node

/**
 * Simple fix for admin user creation that works WITH the trigger
 * Strategy: Let the trigger create the profile with 'buyer' role, then update to 'admin'
 * Usage: node scripts/create-admin-user-simple-fix.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  console.log('🚀 Creating admin user (working WITH the trigger)...');

  try {
    // Step 1: Check if admin user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = existingUsers.users.find(u => u.email === adminEmail);
    let userId;

    if (existingUser) {
      console.log('⚠️  Admin user already exists in auth.users:', existingUser.id);
      userId = existingUser.id;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        console.log('📋 Existing profile found with role:', existingProfile.role);
        if (existingProfile.role === 'admin') {
          console.log('✅ Admin user already fully set up!');
          console.log('💡 You can login with:');
          console.log('   Email:', adminEmail);
          console.log('   Password:', adminPassword);
          console.log('   URL: http://localhost:9002/admin/login');
          return;
        }
      }
    } else {
      // Step 2: Create auth user (trigger will create profile with 'buyer' role)
      console.log('📧 Creating auth user (trigger will auto-create profile):', adminEmail);

      // The key insight: DON'T put role in user_metadata, trigger doesn't use it anyway
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin User'
          // Note: NOT setting role here - trigger ignores it anyway
        }
      });

      if (authError) {
        console.error('❌ Auth user creation failed:', authError);
        throw authError;
      }

      console.log('✅ Auth user created:', authUser.user.id);
      userId = authUser.user.id;

      // Wait a moment for trigger to complete
      console.log('⏳ Waiting for trigger to create profile...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Step 3: Check what the trigger created
    console.log('🔍 Checking profile created by trigger...');

    const { data: triggerProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileCheckError) {
      console.error('❌ Could not find profile created by trigger:', profileCheckError);

      // Fallback: manually create profile
      console.log('🔧 Manually creating profile as fallback...');

      const { data: manualProfile, error: manualError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: adminEmail,
          full_name: 'Admin User',
          role: 'admin',
          is_email_verified: true,
          verification_status: 'verified',
          is_onboarding_completed: true
        })
        .select()
        .single();

      if (manualError) {
        console.error('❌ Manual profile creation failed:', manualError);
        throw manualError;
      }

      console.log('✅ Manual profile created with admin role');
    } else {
      console.log('✅ Profile found created by trigger:');
      console.log('   Role:', triggerProfile.role);
      console.log('   Email:', triggerProfile.email);
      console.log('   Full Name:', triggerProfile.full_name);

      // Step 4: Update the profile to admin role and admin-specific settings
      console.log('🔄 Updating profile to admin role...');

      const { data: adminProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'admin',
          is_email_verified: true,
          verification_status: 'verified',
          is_onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Profile update to admin failed:', updateError);
        throw updateError;
      }

      console.log('✅ Profile successfully updated to admin role');
    }

    // Step 5: Final verification
    console.log('🔍 Final verification...');

    const { data: finalProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (verifyError) throw verifyError;

    console.log('📋 Final admin user details:');
    console.log('   User ID:', finalProfile.id);
    console.log('   Email:', finalProfile.email);
    console.log('   Full Name:', finalProfile.full_name);
    console.log('   Role:', finalProfile.role);
    console.log('   Email Verified:', finalProfile.is_email_verified);
    console.log('   Verification Status:', finalProfile.verification_status);
    console.log('   Onboarding Complete:', finalProfile.is_onboarding_completed);

    if (finalProfile.role !== 'admin') {
      throw new Error('Final verification failed: Role is not admin');
    }

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
