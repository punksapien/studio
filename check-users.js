const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure and data...')

    // Check if users table exists and what data is in it
    console.log('\n1. Checking users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10)

    if (usersError) {
      console.error('❌ Users table query failed:', usersError)

      // Maybe the table doesn't exist? Check auth.users instead
      console.log('\n2. Checking auth.users table...')
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('*')
        .limit(5)

      if (authError) {
        console.error('❌ Auth users query failed:', authError)
      } else {
        console.log('✅ Auth users found:', authUsers.length)
        console.log('Auth users data:', authUsers)
      }
    } else {
      console.log('✅ Users table exists!')
      console.log(`Found ${users.length} users`)
      if (users.length > 0) {
        console.log('Sample user columns:', Object.keys(users[0]))
        console.log('Users data:', users)
      }

      // Check if our specific user exists
      console.log('\nChecking for our specific user...')
      const { data: specificUser, error: specificError } = await supabase
        .from('users')
        .select('*')
        .eq('id', '2fad0689-95a5-413b-9a38-5885f14f6a7b')
        .single()

      if (specificError) {
        console.error('❌ Our user not found in users table:', specificError)
      } else {
        console.log('✅ Our user exists in users table:', specificUser)
      }
    }

    // Try to see what's in user_profiles
    console.log('\n3. Checking user_profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)

    if (profilesError) {
      console.error('❌ User profiles query failed:', profilesError)
    } else {
      console.log('✅ User profiles table exists!')
      console.log(`Found ${profiles.length} profiles`)
      if (profiles.length > 0) {
        console.log('Sample profile columns:', Object.keys(profiles[0]))
        console.log('Profiles data:', profiles)
      }
    }

    // Check database constraints to understand the relationship
    console.log('\n4. Trying to create minimal user in users table...')
    const { data: newUser, error: newUserError } = await supabase
      .from('users')
      .insert({
        id: '2fad0689-95a5-413b-9a38-5885f14f6a7b',
        email: 'seller@gmail.com'
      })
      .select()
      .single()

    if (newUserError) {
      console.error('❌ Failed to create user in users table:', newUserError)
    } else {
      console.log('✅ User created in users table:', newUser)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkUsersTable()
