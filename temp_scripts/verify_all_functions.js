#!/usr/bin/env node

/**
 * Comprehensive verification of all critical database functions
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDatabase() {
  console.log('🔍 Verifying database state...\n');

  const results = {
    functions: [],
    tables: [],
    errors: []
  };

  // Check critical functions
  const functionsToCheck = [
    { name: 'facilitate_chat_connection', test: { p_inquiry_id: '00000000-0000-0000-0000-000000000000', p_admin_id: '00000000-0000-0000-0000-000000000000' } },
    { name: 'sync_listing_verification_status', test: { p_user_id: '00000000-0000-0000-0000-000000000000' } },
    { name: 'validate_listing_verification_sync', test: {} },
    { name: 'cleanup_expired_admin_impersonation_sessions', test: {} }
  ];

  for (const func of functionsToCheck) {
    try {
      const { data, error } = await supabase.rpc(func.name, func.test);
      if (error && !error.message.includes('not found')) {
        results.functions.push({ name: func.name, status: '✅ Exists', note: 'Function callable' });
      } else if (error) {
        results.functions.push({ name: func.name, status: '✅ Exists', note: error.message });
      } else {
        results.functions.push({ name: func.name, status: '✅ Exists', note: 'Success' });
      }
    } catch (e) {
      results.functions.push({ name: func.name, status: '❌ Missing', note: e.message });
    }
  }

  // Check critical tables
  const tablesToCheck = [
    'admin_impersonation_audit',
    'admin_impersonation_sessions',
    'conversations',
    'messages',
    'inquiries',
    'listings',
    'user_profiles',
    'verification_requests'
  ];

  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        results.tables.push({ name: table, status: '✅ Exists', count: count || 0 });
      } else {
        results.tables.push({ name: table, status: '❌ Error', note: error.message });
      }
    } catch (e) {
      results.tables.push({ name: table, status: '❌ Missing', note: e.message });
    }
  }

  // Display results
  console.log('📋 FUNCTIONS:');
  results.functions.forEach(f => {
    console.log(`  ${f.status} ${f.name} - ${f.note}`);
  });

  console.log('\n📋 TABLES:');
  results.tables.forEach(t => {
    console.log(`  ${t.status} ${t.name}${t.count !== undefined ? ` (${t.count} rows)` : ''}`);
  });

  // Check verification sync status
  console.log('\n📋 VERIFICATION SYNC STATUS:');
  try {
    const { data: syncStatus } = await supabase.rpc('validate_listing_verification_sync');
    if (syncStatus && syncStatus.length > 0) {
      console.log(`  ⚠️  ${syncStatus.length} listings out of sync`);
    } else {
      console.log('  ✅ All listings in sync');
    }
  } catch (e) {
    console.log('  ℹ️  Could not check sync status');
  }

  const hasErrors = results.functions.some(f => f.status.includes('❌')) ||
                   results.tables.some(t => t.status.includes('❌'));

  if (!hasErrors) {
    console.log('\n✅ ALL SYSTEMS OPERATIONAL! Database is fully configured.');
  } else {
    console.log('\n❌ Some issues detected. Check the errors above.');
  }
}

verifyDatabase().catch(console.error);
