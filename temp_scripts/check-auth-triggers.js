import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function checkTriggers() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
  });

  try {
    await client.connect();
    console.log('Checking triggers on auth.users...\n');

    // Check all triggers on auth.users
    const triggersResult = await client.query(`
      SELECT
        t.tgname AS trigger_name,
        n.nspname || '.' || p.proname AS function_name,
        pg_get_triggerdef(t.oid) AS trigger_definition
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace cn ON c.relnamespace = cn.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE cn.nspname = 'auth'
      AND c.relname = 'users'
      AND NOT t.tgisinternal
    `);

    if (triggersResult.rows.length === 0) {
      console.log('✅ No custom triggers found on auth.users');
    } else {
      console.log(`Found ${triggersResult.rows.length} trigger(s):`);
      triggersResult.rows.forEach(row => {
        console.log(`\n🔧 Trigger: ${row.trigger_name}`);
        console.log(`   Function: ${row.function_name}`);
        console.log(`   Definition: ${row.trigger_definition}`);
      });
    }

    // Check if handle_new_user function exists anywhere
    const functionResult = await client.query(`
      SELECT
        n.nspname AS schema_name,
        p.proname AS function_name,
        pg_get_functiondef(p.oid) AS function_def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'handle_new_user'
    `);

    if (functionResult.rows.length > 0) {
      console.log('\n⚠️  Found handle_new_user functions:');
      functionResult.rows.forEach(row => {
        console.log(`\n   Schema: ${row.schema_name}`);
        console.log(`   Function: ${row.function_name}`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkTriggers();
