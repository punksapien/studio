#!/usr/bin/env node
/**
 * Reset Test Users Script
 *
 * This script helps reset test users to a clean state for testing authentication flows.
 * It handles common issues like unconfirmed emails, missing profiles, and stale verification data.
 *
 * Usage: npm run reset-test-users
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetTestUsers() {
  console.log('🔄 Starting test user reset...\n')

  try {
    // 1. Get all test users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    const testEmails = ['seller@gmail.com', 'buyer@gmail.com', 'admin@gmail.com']
    const testUsers = users.users.filter(u => testEmails.includes(u.email || ''))

    console.log(`📊 Found ${testUsers.length} test users to process:\n`)

    for (const user of testUsers) {
      console.log(`\n👤 Processing ${user.email}...`)

      // 2. Check and update email confirmation status
      if (!user.email_confirmed_at) {
        console.log(`   ⚠️  Email not confirmed - fixing...`)
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        )
        if (confirmError) {
          console.error(`   ❌ Failed to confirm email: ${confirmError.message}`)
        } else {
          console.log(`   ✅ Email confirmed`)
        }
      } else {
        console.log(`   ✅ Email already confirmed`)
      }

      // 3. Check and fix user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist - create it
        console.log(`   ⚠️  Profile missing - creating...`)

        const metadata = user.user_metadata || {}
        const role = metadata.role || (user.email?.includes('seller') ? 'seller' :
                                      user.email?.includes('admin') ? 'admin' : 'buyer')

        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: metadata.full_name || user.email?.split('@')[0] || 'Test User',
            role: role,
            verification_status: 'anonymous',
            is_email_verified: true,
            email_verified_at: new Date().toISOString(),
            is_onboarding_completed: false,
            onboarding_step_completed: 0
          })

        if (createError) {
          console.error(`   ❌ Failed to create profile: ${createError.message}`)
        } else {
          console.log(`   ✅ Profile created with role: ${role}`)
        }
      } else if (profile) {
        // Profile exists - update verification status
        const updates: any = {}

        if (!profile.is_email_verified) {
          updates.is_email_verified = true
          updates.email_verified_at = new Date().toISOString()
        }

        if (profile.verification_status === 'pending_verification' && !hasActiveVerificationRequest(profile.id)) {
          updates.verification_status = 'anonymous'
        }

        if (Object.keys(updates).length > 0) {
          console.log(`   ⚠️  Updating profile...`)
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id)

          if (updateError) {
            console.error(`   ❌ Failed to update profile: ${updateError.message}`)
          } else {
            console.log(`   ✅ Profile updated`)
          }
        } else {
          console.log(`   ✅ Profile already in good state`)
        }
      }

      // 4. Clean up stale verification requests
      const { data: requests, error: requestsError } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)

      if (!requestsError && requests && requests.length > 0) {
        console.log(`   🗑️  Found ${requests.length} verification requests - cleaning up...`)
        const { error: deleteError } = await supabase
          .from('verification_requests')
          .delete()
          .eq('user_id', user.id)

        if (deleteError) {
          console.error(`   ❌ Failed to clean up requests: ${deleteError.message}`)
        } else {
          console.log(`   ✅ Verification requests cleaned up`)
        }
      }
    }

    console.log('\n\n✅ Test user reset complete!')
    console.log('\n📝 Summary:')
    console.log('   - All test users have confirmed emails')
    console.log('   - All test users have valid profiles')
    console.log('   - Stale verification requests removed')
    console.log('   - Users reset to "anonymous" verification status')
    console.log('\n🚀 You can now test the authentication flows!\n')

  } catch (error) {
    console.error('\n❌ Error during reset:', error)
    process.exit(1)
  }
}

async function hasActiveVerificationRequest(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['New Request', 'Contacted', 'Docs Under Review'])
    .limit(1)

  return !error && data && data.length > 0
}

// Run the script
resetTestUsers().then(() => process.exit(0))
