#!/usr/bin/env node

/**
 * Real-time Sync System Test & Demonstration
 *
 * This script demonstrates the Phase 2 real-time capabilities:
 * 1. Creates test data to trigger sync events
 * 2. Monitors PostgreSQL NOTIFY channels for real-time updates
 * 3. Shows live count synchronization and status cascades
 *
 * Usage: node test-realtime-sync.js
 */

const { Client } = require('pg')

// PostgreSQL client setup
const client = new Client({
  host: 'localhost',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
})

let notificationCount = 0
const maxNotifications = 10

async function connectAndListen() {
  try {
    await client.connect()
    console.log('🚀 Connected to PostgreSQL for real-time sync monitoring')
    console.log('=' .repeat(60))

    // Set up NOTIFY/LISTEN channels
    await client.query('LISTEN sync_events')
    await client.query('LISTEN count_updates')
    await client.query('LISTEN sync_user_profiles')
    await client.query('LISTEN sync_listings')

    console.log('✅ Subscribed to real-time channels:')
    console.log('   • sync_events (all sync operations)')
    console.log('   • count_updates (count field changes)')
    console.log('   • sync_user_profiles (user profile syncs)')
    console.log('   • sync_listings (listing syncs)')
    console.log('')

    // Handle incoming notifications
    client.on('notification', (msg) => {
      notificationCount++

      try {
        const payload = JSON.parse(msg.payload)
        console.log(`📡 Real-time notification #${notificationCount} [${msg.channel}]:`)

        switch (msg.channel) {
          case 'sync_events':
            console.log(`   Event: ${payload.event_type}`)
            console.log(`   Source: ${payload.source_table} → ${payload.target_table || 'N/A'}`)
            console.log(`   Operation: ${payload.operation}`)
            console.log(`   Processing: ${payload.processing_time_ms || 'N/A'}ms`)
            break

          case 'count_updates':
            console.log(`   Table: ${payload.table_name}.${payload.count_field}`)
            console.log(`   Change: ${payload.old_count} → ${payload.new_count} (${payload.delta > 0 ? '+' : ''}${payload.delta})`)
            console.log(`   Record: ${payload.record_id}`)
            break

          default:
            console.log(`   Data:`, JSON.stringify(payload, null, 2))
        }

        console.log(`   Timestamp: ${new Date(payload.timestamp || Date.now()).toLocaleTimeString()}`)
        console.log('')

        // Auto-exit after receiving enough notifications
        if (notificationCount >= maxNotifications) {
          console.log(`🎉 Received ${maxNotifications} real-time notifications. Demo complete!`)
          process.exit(0)
        }
      } catch (error) {
        console.log(`   Raw payload: ${msg.payload}`)
        console.log('')
      }
    })

    console.log('🔄 Starting test data creation to trigger real-time events...')
    console.log('')

    // Create test data in separate connection
    await createTestData()

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

async function createTestData() {
  // Use a separate client for data operations to avoid interfering with LISTEN
  const dataClient = new Client({
    host: 'localhost',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
  })

  try {
    await dataClient.connect()

    console.log('1️⃣ Creating test users...')

    // Clean up any existing test data
    await dataClient.query(`
      DELETE FROM inquiries WHERE buyer_id IN (
        SELECT id FROM user_profiles WHERE email LIKE 'realtime_test_%@example.com'
      )
    `)
    await dataClient.query(`
      DELETE FROM listings WHERE seller_id IN (
        SELECT id FROM user_profiles WHERE email LIKE 'realtime_test_%@example.com'
      )
    `)
    await dataClient.query(`DELETE FROM user_profiles WHERE email LIKE 'realtime_test_%@example.com'`)
    await dataClient.query(`DELETE FROM auth.users WHERE email LIKE 'realtime_test_%@example.com'`)

    // Create test users
    await dataClient.query(`
      INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at) VALUES
      ('aaaaaaaa-1111-1111-1111-111111111111', 'realtime_test_seller1@example.com', NOW(), NOW(), NOW()),
      ('bbbbbbbb-2222-2222-2222-222222222222', 'realtime_test_buyer1@example.com', NOW(), NOW(), NOW())
    `)

    await dataClient.query(`
      INSERT INTO user_profiles (id, email, full_name, role, verification_status, listing_count, inquiry_count) VALUES
      ('aaaaaaaa-1111-1111-1111-111111111111', 'realtime_test_seller1@example.com', 'Realtime Test Seller', 'seller', 'anonymous', 0, 0),
      ('bbbbbbbb-2222-2222-2222-222222222222', 'realtime_test_buyer1@example.com', 'Realtime Test Buyer', 'buyer', 'anonymous', 0, 0)
    `)

    await delay(2000)

    console.log('2️⃣ Creating test listings (should trigger count sync)...')

    // Create listings to trigger count sync
    await dataClient.query(`
      INSERT INTO listings (seller_id, listing_title_anonymous, industry, location_country, anonymous_business_description, status)
      VALUES
        ('aaaaaaaa-1111-1111-1111-111111111111', 'Realtime Test Business 1', 'Technology', 'USA', 'First test business', 'active'),
        ('aaaaaaaa-1111-1111-1111-111111111111', 'Realtime Test Business 2', 'Technology', 'USA', 'Second test business', 'active')
    `)

    await delay(2000)

    console.log('3️⃣ Creating test inquiry (should trigger more count sync)...')

    // Get a listing ID for the inquiry
    const { rows } = await dataClient.query(`
      SELECT id FROM listings WHERE seller_id = 'aaaaaaaa-1111-1111-1111-111111111111' LIMIT 1
    `)

    if (rows.length > 0) {
      await dataClient.query(`
        INSERT INTO inquiries (listing_id, buyer_id, seller_id, status)
        VALUES ('${rows[0].id}', 'bbbbbbbb-2222-2222-2222-222222222222', 'aaaaaaaa-1111-1111-1111-111111111111', 'new_inquiry')
      `)
    }

    await delay(2000)

    console.log('4️⃣ Updating user verification status (should trigger status cascade)...')

    // Update verification status to trigger status cascade
    await dataClient.query(`
      UPDATE user_profiles
      SET verification_status = 'verified'
      WHERE id = 'aaaaaaaa-1111-1111-1111-111111111111'
    `)

    await delay(2000)

    console.log('5️⃣ Updating listing status (should trigger count sync)...')

    // Change listing status
    await dataClient.query(`
      UPDATE listings
      SET status = 'inactive'
      WHERE seller_id = 'aaaaaaaa-1111-1111-1111-111111111111'
      LIMIT 1
    `)

    await delay(2000)

    console.log('6️⃣ Test data creation complete. Waiting for remaining notifications...')
    console.log('')

    // Keep connection open to continue receiving notifications
    setTimeout(() => {
      if (notificationCount < maxNotifications) {
        console.log(`⏰ Timeout reached. Received ${notificationCount}/${maxNotifications} notifications.`)
        console.log('💡 Tip: Check if Supabase Realtime is enabled and triggers are properly configured.')
        process.exit(0)
      }
    }, 10000) // 10 second timeout

  } catch (error) {
    console.error('❌ Error creating test data:', error.message)
  } finally {
    await dataClient.end()
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal. Cleaning up...')
  await client.end()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received termination signal. Cleaning up...')
  await client.end()
  process.exit(0)
})

// Start the demo
console.log('🎯 Universal Sync Trigger System - Phase 2 Real-time Demo')
console.log('=' .repeat(60))
console.log('')

connectAndListen()
