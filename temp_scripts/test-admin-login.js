#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAdminLogin() {
  console.log('🔐 Testing admin login...\n');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@nobridge.com',
      password: 'Test123!@#'
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      return;
    }

    console.log('✅ Login successful!');
    console.log('👤 User ID:', data.user.id);
    console.log('📧 Email:', data.user.email);
    console.log('🔑 Role:', data.user.user_metadata?.role);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('\n❌ Profile not found:', profileError.message);
    } else {
      console.log('\n✅ Profile found:');
      console.log('   Role:', profile.role);
      console.log('   Full Name:', profile.full_name);
      console.log('   Account Status:', profile.account_status);
    }

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAdminLogin();
