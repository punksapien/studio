#!/usr/bin/env node

/**
 * Fixed script to create an admin user in Supabase Auth + user_profiles table
 * This version works around the problematic handle_new_user trigger
 * Usage: node scripts/create-admin-user-fixed.js
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

async function disableTrigger() {
  console.log('🔧 Temporarily disabling handle_new_user trigger...');

  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;'
    });

    if (error) {
      // Try alternative approach using direct SQL
      const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
      const { spawn } = await import('child_process');

      return new Promise((resolve, reject) => {
        const psql = spawn('psql', [dbUrl, '-c', 'ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;']);

        psql.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Trigger disabled successfully');
            resolve();
          } else {
            reject(new Error(`Failed to disable trigger: exit code ${code}`));
          }
        });

        psql.on('error', reject);
      });
    } else {
      console.log('✅ Trigger disabled successfully');
    }
  } catch (error) {
    console.error('❌ Failed to disable trigger:', error.message);
    throw error;
  }
}

async function enableTrigger() {
  console.log('🔧 Re-enabling handle_new_user trigger...');

  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;'
    });

    if (error) {
      // Try alternative approach using direct SQL
      const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
      const { spawn } = await import('child_process');

      return new Promise((resolve, reject) => {
        const psql = spawn('psql', [dbUrl, '-c', 'ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;']);

        psql.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Trigger re-enabled successfully');
            resolve();
          } else {
            console.error(`⚠️ Warning: Failed to re-enable trigger: exit code ${code}`);
            console.log('💡 You may need to manually run: ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;');
            resolve(); // Don't fail the entire process
          }
        });

        psql.on('error', (err) => {
          console.error('⚠️ Warning: Error re-enabling trigger:', err.message);
          console.log('💡 You may need to manually run: ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;');
          resolve(); // Don't fail the entire process
        });
      });
    } else {
      console.log('✅ Trigger re-enabled successfully');
    }
  } catch (error) {
    console.error('⚠️ Warning: Failed to re-enable trigger:', error.message);
    console.log('💡 You may need to manually run: ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;');
  }
}

async function createAdminUser() {
  const adminEmail = 'admin@nobridge.com';
  const adminPassword = '100%Test';

  console.log('🚀 Creating admin user with trigger workaround...');

  try {
    // Step 1: Disable the problematic trigger
    await disableTrigger();

    // Step 2: Create auth user (no trigger will fire)
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
        authUser = { user: existingUser };
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Auth user created:', authUser.user.id);
    }

    const userId = authUser.user.id;

    // Step 3: Manually create user profile with admin role
    console.log('👤 Creating admin user profile...');

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: adminEmail,
        full_name: 'Admin User',
        role: 'admin',
        is_email_verified: true,
        verification_status: 'verified',
        is_onboarding_completed: true,
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

    console.log('✅ Admin profile created:', profile.id);

    // Step 4: Re-enable trigger for future users
    await enableTrigger();

    // Step 5: Verify the setup
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
    console.log('   Verification Status:', verifyProfile.verification_status);
    console.log('   Onboarding Complete:', verifyProfile.is_onboarding_completed);

    console.log('\n🎉 Admin user setup complete!');
    console.log('💡 You can now login with:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   URL: http://localhost:9002/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);

    // Ensure trigger is re-enabled even if there's an error
    try {
      await enableTrigger();
    } catch (enableError) {
      console.error('⚠️ Critical: Failed to re-enable trigger after error!');
      console.log('💡 MANUAL ACTION REQUIRED: Run this SQL command:');
      console.log('   ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;');
    }

    process.exit(1);
  }
}

// Run the script
createAdminUser();
