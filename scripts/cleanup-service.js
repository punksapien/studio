#!/usr/bin/env node

/**
 * Background Cleanup Service for Zombie Account Management
 *
 * This script handles automated cleanup of unverified accounts
 * Can be run manually or via cron job
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

class CleanupService {
  constructor() {
    this.serviceName = '[ZOMBIE-CLEANUP-SERVICE]';
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${timestamp} ${prefix} ${this.serviceName} ${message}`);
  }

  async findExpiredAccounts() {
    this.log('Finding accounts that need cleanup...');

    const { data: expiredAccounts, error } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        email,
        account_status,
        verification_deadline,
        deletion_scheduled_at,
        created_at,
        first_name,
        last_name,
        role
      `)
      .in('account_status', ['unverified', 'pending_deletion'])
      .order('created_at', { ascending: true });

    if (error) {
      this.log(`Failed to fetch accounts: ${error.message}`, 'error');
      throw error;
    }

    const now = new Date();
    const needsProcessing = expiredAccounts.filter(account => {
      if (account.account_status === 'unverified') {
        // Check if verification deadline has passed
        return account.verification_deadline && new Date(account.verification_deadline) < now;
      } else if (account.account_status === 'pending_deletion') {
        // Check if deletion schedule has passed (if set)
        return account.deletion_scheduled_at && new Date(account.deletion_scheduled_at) < now;
      }
      return false;
    });

    this.log(`Found ${expiredAccounts.length} accounts needing attention`);
    this.log(`Found ${needsProcessing.length} accounts ready for processing`);

    if (this.verbose) {
      needsProcessing.forEach(account => {
        this.log(`  - ${account.email} (${account.account_status}, created: ${account.created_at})`);
      });
    }

    return needsProcessing;
  }

  async processUnverifiedAccount(account) {
    this.log(`Processing unverified account: ${account.email}`);

    if (this.dryRun) {
      this.log(`DRY RUN: Would mark ${account.email} for deletion`, 'warn');
      return { success: true, action: 'dry_run_pending_deletion' };
    }

    try {
      // Mark account for pending deletion (7-day grace period)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 7); // 7 days from now

      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          account_status: 'pending_deletion',
          deletion_scheduled_at: deletionDate.toISOString()
        })
        .eq('id', account.id);

      if (updateError) {
        throw updateError;
      }

      // Log in audit trail
      const { error: auditError } = await supabaseAdmin
        .from('account_cleanup_audit')
        .insert({
          user_id: account.id,
          user_email: account.email,
          action: 'marked_for_deletion',
          reason: 'Email verification deadline expired (24 hours)',
          metadata: {
            original_status: 'unverified',
            verification_deadline: account.verification_deadline,
            deletion_scheduled_at: deletionDate.toISOString(),
            automated: true,
            service: 'cleanup-service'
          }
        });

      if (auditError) {
        this.log(`Audit logging failed for ${account.email}: ${auditError.message}`, 'warn');
      }

      this.log(`✅ Marked ${account.email} for deletion (7-day grace period)`);
      return { success: true, action: 'marked_for_deletion', deletion_date: deletionDate };

    } catch (error) {
      this.log(`Failed to process ${account.email}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async processAccountForDeletion(account) {
    this.log(`Processing account for final deletion: ${account.email}`);

    if (this.dryRun) {
      this.log(`DRY RUN: Would permanently delete ${account.email}`, 'warn');
      return { success: true, action: 'dry_run_deletion' };
    }

    try {
      // First, log the deletion in audit trail (before deleting user)
      const { error: auditError } = await supabaseAdmin
        .from('account_cleanup_audit')
        .insert({
          user_id: account.id,
          user_email: account.email,
          action: 'permanently_deleted',
          reason: 'Grace period expired after failed email verification',
          metadata: {
            original_status: 'pending_deletion',
            deletion_scheduled_at: account.deletion_scheduled_at,
            final_deletion_at: new Date().toISOString(),
            automated: true,
            service: 'cleanup-service'
          }
        });

      if (auditError) {
        this.log(`Audit logging failed for ${account.email}: ${auditError.message}`, 'warn');
      }

      // Delete from auth.users (this will cascade to user_profiles)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(account.id);

      if (deleteError) {
        throw deleteError;
      }

      this.log(`🗑️ Permanently deleted ${account.email}`);
      return { success: true, action: 'permanently_deleted' };

    } catch (error) {
      this.log(`Failed to delete ${account.email}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async run() {
    this.log('Starting cleanup service...');

    if (this.dryRun) {
      this.log('🔍 DRY RUN MODE - No changes will be made', 'warn');
    }

    try {
      const expiredAccounts = await this.findExpiredAccounts();

      if (expiredAccounts.length === 0) {
        this.log('✅ No accounts need cleanup at this time');
        return { processed: 0, results: [] };
      }

      const results = [];
      let processed = 0;

      for (const account of expiredAccounts) {
        let result;

        if (account.account_status === 'unverified') {
          result = await this.processUnverifiedAccount(account);
        } else if (account.account_status === 'pending_deletion') {
          result = await this.processAccountForDeletion(account);
        }

        if (result) {
          results.push({ account: account.email, ...result });
          if (result.success) processed++;
        }

        // Small delay between operations to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.log(`✅ Cleanup completed. Processed ${processed}/${expiredAccounts.length} accounts`);

      if (this.verbose) {
        results.forEach(result => {
          const status = result.success ? '✅' : '❌';
          this.log(`  ${status} ${result.account}: ${result.action || result.error}`);
        });
      }

      return { processed, total: expiredAccounts.length, results };

    } catch (error) {
      this.log(`Cleanup service failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run the service if called directly
if (require.main === module) {
  const service = new CleanupService();

  service.run()
    .then(result => {
      console.log('\n📊 Cleanup Summary:');
      console.log(`   Processed: ${result.processed}/${result.total} accounts`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Cleanup service crashed:', error.message);
      process.exit(1);
    });
}

module.exports = CleanupService;
