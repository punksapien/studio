const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...')

    // 1. Create user in Supabase Auth
    console.log('\n1. Creating admin user in Supabase Auth...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@nobridge.com',
      password: '100%Test',
      email_confirm: true // Skip email confirmation for local dev
    })

    if (authError) {
      console.error('❌ Error creating auth user:', authError)
      return
    }

    console.log('✅ Admin user created in Supabase Auth!')
    console.log('User ID:', authUser.user.id)

    // 2. Create admin profile
    console.log('\n2. Creating admin profile...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: 'admin@nobridge.com',
        full_name: 'Admin User',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_email_verified: true,
        email_verified_at: new Date().toISOString(),
        verification_status: 'verified',
        // Set notification preferences to default values
        email_notifications_general: true,
        email_notifications_inquiries: true,
        email_notifications_listing_updates: true,
        email_notifications_system: true,
        is_onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step_completed: 5
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError)
      return
    }

    console.log('✅ Admin profile created successfully!')

    console.log('\n🎉 Admin user setup complete!')
    console.log('\nAdmin credentials:')
    console.log('- Email: admin@nobridge.com')
    console.log('- Password: 100%Test')
    console.log('- User ID:', authUser.user.id)
    console.log('- Role: admin')
    console.log('- Access: http://localhost:9002/admin/login')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createAdminUser()
