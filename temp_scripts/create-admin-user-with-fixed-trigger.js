#!/usr/bin/env node

/**
 * Script to create an admin user with the fixed trigger function
 * This requires the trigger to be updated to use COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
 * Usage: node scripts/create-admin-user-with-fixed-trigger.js
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

  console.log('🚀 Creating admin user (with fixed trigger)...');

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
        } else {
          // Update profile to admin
          const { data: updatedProfile, error: updateError } = await supabase
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
            console.error('❌ Profile update failed:', updateError);
            throw updateError;
          }

          console.log('✅ Profile updated to admin role');
        }
      } else {
        console.log('⚠️ User exists but profile not found - creating profile');
        await createProfileForUser(userId, adminEmail);
      }
    } else {
      // Step 2: Create auth user with role=admin in metadata
      // The updated trigger should use this role instead of hardcoding 'buyer'
      console.log('📧 Creating auth user with role=admin in metadata:', adminEmail);

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin User',
          role: 'admin'  // This is the key - the fixed trigger will use this
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

      // Step 3: Verify profile was created with admin role by the trigger
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Profile query failed:', profileError);
        console.log('⚠️ Creating profile manually...');
        await createProfileForUser(userId, adminEmail);
      } else {
        console.log('✅ Profile created by trigger:');
        console.log('   Role:', profile.role);

        if (profile.role !== 'admin') {
          console.log('⚠️ Warning: Profile role is not admin, updating...');

          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              role: 'admin',
              is_email_verified: true,
              verification_status: 'verified',
              is_onboarding_completed: true
            })
            .eq('id', userId);

          if (updateError) {
            console.error('❌ Profile update failed:', updateError);
            throw updateError;
          }

          console.log('✅ Profile updated to admin role');
        }
      }
    }

    // Final verification
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
    console.log('   Role:', finalProfile.role);
    console.log('   Email Verified:', finalProfile.is_email_verified);
    console.log('   Verification Status:', finalProfile.verification_status);
    console.log('   Onboarding Complete:', finalProfile.is_onboarding_completed);

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

async function createProfileForUser(userId, email) {
  console.log('👤 Creating admin profile manually...');

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email: email,
      full_name: 'Admin User',
      role: 'admin',
      is_email_verified: true,
      verification_status: 'verified',
      is_onboarding_completed: true
    })
    .select()
    .single();

  if (profileError) {
    console.error('❌ Manual profile creation failed:', profileError);
    throw profileError;
  }

  console.log('✅ Manual profile created with admin role');
  return profile;
}

// Run the script
createAdminUser();
