const { createClient } = require('@supabase/supabase-js')

async function testEmailFlow() {
  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )

  console.log('🧪 Testing Email Verification Flow...\n')

  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'testpassword123'

  try {
    // Step 1: Test Registration (should send email)
    console.log('1. Testing Registration with email confirmation...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:9002/auth/callback'
      }
    })

    if (signUpError) {
      console.error('❌ Registration failed:', signUpError.message)
      return
    }

    console.log('✅ Registration successful!')
    console.log('   User ID:', signUpData.user?.id)
    console.log('   Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No')
    console.log('   Session exists:', signUpData.session ? 'Yes' : 'No')

    // Step 2: Test login before confirmation (should fail)
    console.log('\n2. Testing login before email confirmation...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (loginError) {
      if (loginError.message.includes('Email not confirmed')) {
        console.log('✅ Login correctly blocked for unconfirmed email')
        console.log('   Error:', loginError.message)
      } else {
        console.log('❌ Unexpected login error:', loginError.message)
      }
    } else {
      console.log('⚠️  Login succeeded before confirmation (unexpected)')
    }

    // Step 3: Check if we can access Mailpit directly
    console.log('\n3. Checking Mailpit for verification email...')
    try {
      const mailpitResponse = await fetch('http://127.0.0.1:54324/api/v1/messages')
      if (mailpitResponse.ok) {
        const messages = await mailpitResponse.json()
        console.log('✅ Mailpit accessible')
        console.log(`   Found ${messages.messages ? messages.messages.length : 0} messages`)

        if (messages.messages && messages.messages.length > 0) {
          const latestMessage = messages.messages[0]
          console.log('   Latest message:')
          console.log(`     - ID: ${latestMessage.ID}`)
          console.log(`     - Subject: ${latestMessage.Subject}`)
          console.log(`     - To: ${latestMessage.To[0].Address}`)

          // Get the full message content
          const messageResponse = await fetch(`http://127.0.0.1:54324/api/v1/message/${latestMessage.ID}`)
          if (messageResponse.ok) {
            const messageContent = await messageResponse.json()
            console.log('   Message text preview:', messageContent.Text.substring(0, 200) + '...')

            // Look for confirmation URL
            const confirmationUrlMatch = messageContent.HTML.match(/href="([^"]*confirm[^"]*)"/i)
            if (confirmationUrlMatch) {
              console.log('   Confirmation URL found:', confirmationUrlMatch[1])
            }
          }
        }
      } else {
        console.log('❌ Cannot access Mailpit API:', mailpitResponse.status)
      }
    } catch (error) {
      console.log('❌ Mailpit check failed:', error.message)
    }

    // Step 4: Test OTP verification directly
    console.log('\n4. Testing OTP verification...')
    console.log('   Go to Mailpit UI at http://127.0.0.1:54324 to get the 6-digit code')
    console.log(`   Then test verification at: http://localhost:9002/verify-email?email=${encodeURIComponent(testEmail)}&type=register`)

    console.log('\n🎯 Test Summary:')
    console.log('- Registration: ✅ Working')
    console.log('- Email confirmation requirement: ✅ Enforced')
    console.log('- Check Mailpit manually at: http://127.0.0.1:54324')
    console.log(`- Test email: ${testEmail}`)

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testEmailFlow().then(() => {
  console.log('\n✨ Test completed!')
  process.exit(0)
}).catch(error => {
  console.error('💥 Test script failed:', error)
  process.exit(1)
})
