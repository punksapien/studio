const { createClient } = require('@supabase/supabase-js')

async function testUnifiedEmailService() {
  console.log('🧪 Testing Unified Email Service v2.0...\n')

  const testEmails = [
    'test-forgot-password@example.com',
    'test-resend-verification@example.com',
    'nonexistent-user@example.com'
  ]

  // Test the unified email API endpoints
  for (const email of testEmails) {
    console.log(`\n📧 Testing unified email service for: ${email}`)

    try {
      // Test forgot password with new retry logic
      console.log('1. Testing forgot password with retry logic...')
      const passwordResetResponse = await fetch('http://localhost:9002/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot-password',
          email: email
        })
      })

      const passwordResetResult = await passwordResetResponse.json()
      console.log('   Forgot Password Result:', {
        success: passwordResetResult.success,
        service: passwordResetResult.service,
        attempts: passwordResetResult.attempts,
        message: passwordResetResult.message
      })

      // Test resend verification with improved reliability
      console.log('2. Testing resend verification with improved reliability...')
      const resendResponse = await fetch('http://localhost:9002/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend-verification',
          email: email
        })
      })

      const resendResult = await resendResponse.json()
      console.log('   Resend Verification Result:', {
        success: resendResult.success,
        service: resendResult.service,
        attempts: resendResult.attempts,
        message: resendResult.message
      })

      // Test custom email functionality
      console.log('3. Testing custom email functionality...')
      const customResponse = await fetch('http://localhost:9002/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom-email',
          email: email
        })
      })

      const customResult = await customResponse.json()
      console.log('   Custom Email Result:', {
        success: customResult.success,
        service: customResult.service,
        attempts: customResult.attempts,
        message: customResult.message
      })

    } catch (error) {
      console.error(`❌ Test failed for ${email}:`, error.message)
    }
  }

  // Test the email service status endpoint
  try {
    console.log('\n📊 Getting email service status...')
    const statusResponse = await fetch('http://localhost:9002/api/email/test')
    const statusResult = await statusResponse.json()

    console.log('✅ Email Service Status:')
    console.log('   Service:', statusResult.status.service)
    console.log('   Version:', statusResult.status.version)
    console.log('   Environment:', statusResult.status.environment)
    console.log('   Resend Enabled:', statusResult.status.resendEnabled)
    console.log('   Max Retries:', statusResult.status.retryConfig.maxRetries)
    console.log('   Available Actions:', statusResult.availableActions)

    if (statusResult.status.improvements) {
      console.log('\n🎯 Key Improvements:')
      statusResult.status.improvements.forEach(improvement => {
        console.log(`   - ${improvement}`)
      })
    }

  } catch (error) {
    console.error('❌ Failed to get service status:', error.message)
  }

  console.log('\n🎉 Unified Email Service Test Complete!')
  console.log('📧 Check Mailpit at http://localhost:54324 for captured emails')
  console.log('🌐 Test the web interface at http://localhost:9002/test-email-system')
}

testUnifiedEmailService().then(() => {
  console.log('\n✨ All tests completed!')
  process.exit(0)
}).catch(error => {
  console.error('💥 Test script failed:', error)
  process.exit(1)
})
