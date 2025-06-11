#!/usr/bin/env node

/**
 * Script to create an admin user by temporarily disabling the trigger
 * This is a workaround for the "relation does not exist" error
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
  });

  try {
    await client.connect();
    console.log('🚀 Creating admin user with trigger bypass...\n');

    // Step 1: Temporarily disable the trigger
    console.log('1️⃣ Disabling trigger...');
    await client.query('ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created');
    console.log('✅ Trigger disabled\n');

    // Step 2: Create the auth user
    console.log('2️⃣ Creating auth user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@nobridge.com',
      password: 'Test123!@#',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    });

    if (authError) {
      throw new Error(`Auth user creation failed: ${authError.message}`);
    }

    console.log('✅ Auth user created:', authUser.user.id);
    console.log('📧 Email:', authUser.user.email, '\n');

    // Step 3: Manually create the user profile
    console.log('3️⃣ Creating user profile...');
    await client.query(`
      INSERT INTO public.user_profiles (id, email, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [authUser.user.id, authUser.user.email, 'Admin User', 'admin']);
    console.log('✅ User profile created\n');

    // Step 4: Re-enable the trigger
    console.log('4️⃣ Re-enabling trigger...');
    await client.query('ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created');
    console.log('✅ Trigger re-enabled\n');

    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: admin@nobridge.com');
    console.log('🔑 Password: Test123!@#');
    console.log('🔐 Role: admin');
    console.log('\nYou can now login with these credentials.');

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Try to re-enable trigger if something went wrong
    try {
      await client.query('ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created');
      console.log('⚠️  Trigger re-enabled after error');
    } catch (e) {
      console.error('⚠️  Could not re-enable trigger:', e.message);
    }
  } finally {
    await client.end();
  }
}

createAdminUser();
