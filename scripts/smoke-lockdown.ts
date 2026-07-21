#!/usr/bin/env node
/**
 * Buyer Verification Lockdown — Authenticated E2E Smoke Test
 *
 * Exercises the runtime API lockdown for unverified buyers against a RUNNING app.
 * It drives the real HTTP endpoints with a real Supabase session token, so it
 * proves the server-side gate actually blocks unverified buyers and lets verified
 * ones through.
 *
 * What it does (each step logs ✅ / ❌; exits 1 on any failure):
 *   1. Admin (service-role) setup of the designated test buyer.
 *   2. Sign in with the anon client to capture a real access token.
 *   3. Assert the gated endpoints reject the unverified buyer (403 + code).
 *   4. Flip the buyer to verified and assert the gate now passes.
 *   5. Restore the buyer to the clean baseline (always, even on failure).
 *
 * Prerequisites:
 *   - The app must be running and reachable at BASE_URL (default http://localhost:9002).
 *   - .env.local must contain NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *     and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage:
 *   BASE_URL=http://localhost:9002 npx tsx scripts/smoke-lockdown.ts
 *   # or, once the npm script exists:
 *   npm run smoke:lockdown
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const baseUrl = (process.env.BASE_URL || 'http://localhost:9002').replace(/\/+$/, '')

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('   and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Designated test account + fixtures
const TEST_EMAIL = 'buyer@gmail.com'
const TEST_PASSWORD = 'Test1234!'
// A syntactically valid but non-existent listing id. This guarantees the request
// can never create a real inquiry: once the verification gate passes, the handler
// fails later (400/404/409) instead — which is the success signal for step 4.
const BOGUS_LISTING_ID = '00000000-0000-0000-0000-000000000000'

// Admin client (service-role) — mirrors reset-test-users.ts
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Track pass/fail so we can produce a summary and correct exit code.
let failures = 0
function pass(msg: string) {
  console.log(`   ✅ ${msg}`)
}
function fail(msg: string) {
  failures++
  console.error(`   ❌ ${msg}`)
}

interface ApiResult {
  status: number
  body: any
}

async function callApi(pathname: string, token: string, payload: unknown): Promise<ApiResult> {
  const res = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  let body: any = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }
  return { status: res.status, body }
}

async function findTestUserId(): Promise<string> {
  // listUsers is paginated; page through until we find the test buyer.
  let page = 1
  const perPage = 200
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const user = data.users.find(u => (u.email || '').toLowerCase() === TEST_EMAIL)
    if (user) return user.id

    if (data.users.length < perPage) break
    page++
  }
  throw new Error(`Test user ${TEST_EMAIL} not found. Run reset-test-users first.`)
}

async function setProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await admin.from('user_profiles').update(updates).eq('id', userId)
  if (error) throw error
}

async function main() {
  console.log('🔒 Buyer Verification Lockdown Smoke Test')
  console.log(`   Target: ${baseUrl}`)
  console.log(`   Account: ${TEST_EMAIL}\n`)

  let userId: string | null = null

  try {
    // --- Step 1: Admin setup (service-role) --------------------------------
    console.log('1️⃣  Admin setup (service-role)')
    userId = await findTestUserId()
    pass(`Found ${TEST_EMAIL} (id: ${userId})`)

    const { error: pwError } = await admin.auth.admin.updateUserById(userId, {
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (pwError) throw pwError
    pass('Set known password + confirmed email')

    await setProfile(userId, {
      verification_status: 'pending_verification',
      is_email_verified: true,
      is_onboarding_completed: true,
    })
    pass("Profile set to 'pending_verification' (unverified, onboarded)")

    // Clear any verification_requests so they don't interfere with the gate.
    const { error: delError } = await admin
      .from('verification_requests')
      .delete()
      .eq('user_id', userId)
    if (delError) throw delError
    pass('Cleared any existing verification_requests')

    // --- Step 2: Sign in (anon client) -------------------------------------
    console.log('\n2️⃣  Sign in (anon client)')
    const anon = createClient(supabaseUrl!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    if (signInError) throw signInError
    const token = signInData.session?.access_token
    if (!token) throw new Error('No access_token returned from signInWithPassword')
    pass('Signed in and captured access_token')

    // --- Step 3: Assert gated (unverified buyer) ---------------------------
    console.log('\n3️⃣  Assert gated (unverified buyer)')

    const inqGated = await callApi('/api/inquiries', token, { listing_id: BOGUS_LISTING_ID })
    if (inqGated.status === 403 && inqGated.body?.code === 'verification_required') {
      pass(`POST /api/inquiries → 403 verification_required`)
    } else {
      fail(
        `POST /api/inquiries expected 403 + code 'verification_required', ` +
          `got ${inqGated.status} ${JSON.stringify(inqGated.body)}`
      )
    }

    const reqGated = await callApi('/api/verification/request', token, {
      request_type: 'user_verification',
    })
    if (reqGated.status === 403) {
      pass(`POST /api/verification/request → 403`)
    } else {
      fail(
        `POST /api/verification/request expected 403, ` +
          `got ${reqGated.status} ${JSON.stringify(reqGated.body)}`
      )
    }

    // --- Step 4: Flip to verified, assert gate passes ----------------------
    console.log('\n4️⃣  Flip to verified, assert gate passes')
    await setProfile(userId, { verification_status: 'verified' })
    pass("Profile updated to 'verified'")

    // The profile is re-read server-side on every request, so the same token is
    // fine — no need to re-sign-in.
    const inqVerified = await callApi('/api/inquiries', token, { listing_id: BOGUS_LISTING_ID })
    const stillGated =
      inqVerified.status === 403 && inqVerified.body?.code === 'verification_required'
    if (!stillGated) {
      pass(
        `POST /api/inquiries no longer verification-gated ` +
          `(got ${inqVerified.status} ${JSON.stringify(inqVerified.body)}; ` +
          `a 400/404/409 means the gate passed and it failed later — expected for a bogus listing)`
      )
    } else {
      fail(
        `POST /api/inquiries still returns verification_required after verifying ` +
          `(got ${inqVerified.status} ${JSON.stringify(inqVerified.body)})`
      )
    }
  } catch (error) {
    failures++
    console.error('\n❌ Unexpected error during smoke test:', error)
  } finally {
    // --- Step 5: Cleanup (always) ----------------------------------------
    console.log('\n5️⃣  Cleanup')
    if (userId) {
      try {
        await setProfile(userId, {
          verification_status: 'anonymous',
          is_onboarding_completed: false,
        })
        pass("Restored profile to baseline ('anonymous', onboarding incomplete)")
      } catch (cleanupError) {
        failures++
        console.error('   ❌ Failed to restore profile baseline:', cleanupError)
      }
    } else {
      console.log('   ⏭️  No user id resolved — nothing to clean up')
    }
  }

  // --- Summary -----------------------------------------------------------
  console.log('\n──────────────────────────────────────────')
  if (failures === 0) {
    console.log('✅ Lockdown smoke test PASSED')
  } else {
    console.log(`❌ Lockdown smoke test FAILED (${failures} failure${failures === 1 ? '' : 's'})`)
  }
  console.log(
    '\n📝 NOTE: This is a token-based (Bearer) test of the API lockdown only.\n' +
      '   Middleware *page* redirects are cookie-based and are NOT covered here —\n' +
      '   verify those in a browser or via the lockdown unit tests.'
  )

  process.exit(failures === 0 ? 0 : 1)
}

main()
