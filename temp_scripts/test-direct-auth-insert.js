import pg from 'pg';
const { Client } = pg;

async function testDirectInsert() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
  });

  try {
    await client.connect();
    console.log('Testing direct auth.users insert...\n');

    // First, clean up any existing test user
    await client.query(`DELETE FROM auth.users WHERE email = 'test-direct@example.com'`);

    // Try direct insert into auth.users
    const testId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    try {
      await client.query(`
        INSERT INTO auth.users (
          id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_user_meta_data,
          raw_app_meta_data,
          aud,
          role,
          created_at,
          updated_at
        ) VALUES (
          $1,
          $2,
          crypt('Test123!@#', gen_salt('bf')),
          NOW(),
          '{"full_name": "Test User", "role": "buyer"}'::jsonb,
          '{}'::jsonb,
          'authenticated',
          'authenticated',
          NOW(),
          NOW()
        )
      `, [testId, 'test-direct@example.com']);

      console.log('✅ Direct insert succeeded!');

      // Clean up
      await client.query(`DELETE FROM auth.users WHERE id = $1`, [testId]);

    } catch (err) {
      console.error('❌ Direct insert failed:', err.message);
      console.error('   Error detail:', err.detail);
    }

  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.end();
  }
}

testDirectInsert();
