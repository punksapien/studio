#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function diagnoseIssue() {
  console.log('🔍 Comprehensive Trigger Diagnostic\n');

  // Connect directly to Postgres
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // 1. Check if trigger function exists in any schema
    console.log('1️⃣ Looking for handle_new_user function across all schemas...');
    const functionSearch = await client.query(`
      SELECT n.nspname AS schema_name, p.proname AS function_name
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'handle_new_user'
    `);
    console.log('Functions found:', functionSearch.rows);
    console.log();

    // 2. Get the function definition if found
    if (functionSearch.rows.length > 0) {
      for (const func of functionSearch.rows) {
        console.log(`📋 Function definition in schema ${func.schema_name}:`);
        const funcDef = await client.query(`
          SELECT pg_get_functiondef(p.oid) as definition
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE p.proname = 'handle_new_user' AND n.nspname = $1
        `, [func.schema_name]);
        console.log(funcDef.rows[0].definition);
        console.log();
      }
    }

    // 3. Check triggers on auth.users
    console.log('2️⃣ Checking triggers on auth.users...');
    const triggers = await client.query(`
      SELECT tgname, tgenabled, tgtype,
             n.nspname || '.' || p.proname as function_full_name
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace cn ON c.relnamespace = cn.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE cn.nspname = 'auth' AND c.relname = 'users'
      AND t.tgname NOT LIKE 'pg_%' AND t.tgname NOT LIKE 'RI_%'
    `);
    console.log('Triggers:', triggers.rows);
    console.log();

    // 4. Check table structure
    console.log('3️⃣ Checking user_profiles table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);
    console.log('Columns:', columns.rows);
    console.log();

    // 5. Check if the supabase_auth_admin role has permissions
    console.log('4️⃣ Checking supabase_auth_admin permissions on user_profiles...');
    const permissions = await client.query(`
      SELECT privilege_type
      FROM information_schema.table_privileges
      WHERE grantee = 'supabase_auth_admin'
      AND table_schema = 'public'
      AND table_name = 'user_profiles'
    `);
    console.log('Permissions:', permissions.rows);
    console.log();

    // 6. Try a manual insert to see if it works
    console.log('5️⃣ Testing manual insert into user_profiles...');
    try {
      await client.query('BEGIN');
      const testId = '00000000-0000-0000-0000-000000000000';

      // First delete if exists
      await client.query('DELETE FROM public.user_profiles WHERE id = $1', [testId]);

      // Try minimal insert
      const result = await client.query(`
        INSERT INTO public.user_profiles (id, email, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [testId, 'test@example.com', 'Test User', 'buyer']);

      console.log('✅ Manual insert successful:', result.rows[0]);

      // Clean up
      await client.query('DELETE FROM public.user_profiles WHERE id = $1', [testId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Manual insert failed:', error.message);
    }
    console.log();

    // 7. Check if there are any RLS policies
    console.log('6️⃣ Checking RLS status on user_profiles...');
    const rlsStatus = await client.query(`
      SELECT relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname = 'user_profiles'
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    console.log('RLS enabled:', rlsStatus.rows[0]?.relrowsecurity || false);
    console.log('RLS forced:', rlsStatus.rows[0]?.relforcerowsecurity || false);

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  } finally {
    await client.end();
  }
}

diagnoseIssue();
