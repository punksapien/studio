const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkConstraints() {
  try {
    console.log('🔍 Checking database constraints...');

    // Check foreign key constraints
    console.log('\n1. Checking foreign key constraints...');
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('exec', {
        sql: `
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'user_profiles';
        `
      });

    if (constraintsError) {
      console.error('❌ Constraints query failed:', constraintsError);
    } else {
      console.log('✅ Foreign key constraints on user_profiles:');
      if (constraints && constraints.length > 0) {
        constraints.forEach(constraint => {
          console.log(`- ${constraint.constraint_name}:`);
          console.log(`  Table: ${constraint.table_name}.${constraint.column_name}`);
          console.log(`  References: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        });
      } else {
        console.log('No foreign key constraints found');
      }
    }

    // Check if auth.users exists and contains our user
    console.log('\n2. Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase
      .rpc('exec', {
        sql: `SELECT id, email, created_at FROM auth.users WHERE id = '2fad0689-95a5-413b-9a38-5885f14f6a7b';`
      });

    if (authError) {
      console.error('❌ Auth users query failed:', authError);
    } else {
      console.log('✅ Auth users query result:', authUsers);
    }

    // Check what tables exist in the auth schema
    console.log('\n3. Checking auth schema tables...');
    const { data: authTables, error: authTablesError } = await supabase
      .rpc('exec', {
        sql: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'auth'
        ORDER BY table_name;
        `
      });

    if (authTablesError) {
      console.error('❌ Auth tables query failed:', authTablesError);
    } else {
      console.log('✅ Tables in auth schema:', authTables);
    }

    // Let's try to drop the problematic constraint and recreate it correctly
    console.log('\n4. Attempting to fix the foreign key constraint...');

    // First drop the existing constraint
    const { data: dropResult, error: dropError } = await supabase
      .rpc('exec', {
        sql: `ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;`
      });

    if (dropError) {
      console.error('❌ Drop constraint failed:', dropError);
    } else {
      console.log('✅ Dropped existing constraint');
    }

    // Now create the correct constraint pointing to auth.users
    const { data: createResult, error: createError } = await supabase
      .rpc('exec', {
        sql: `ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;`
      });

    if (createError) {
      console.error('❌ Create new constraint failed:', createError);
    } else {
      console.log('✅ Created new constraint referencing auth.users');
    }

    // Verify the new constraint
    console.log('\n5. Verifying the fixed constraint...');
    const { data: newConstraints, error: newConstraintsError } = await supabase
      .rpc('exec', {
        sql: `
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'user_profiles';
        `
      });

    if (newConstraintsError) {
      console.error('❌ New constraints query failed:', newConstraintsError);
    } else {
      console.log('✅ Updated foreign key constraints on user_profiles:');
      if (newConstraints && newConstraints.length > 0) {
        newConstraints.forEach(constraint => {
          console.log(`- ${constraint.constraint_name}:`);
          console.log(`  Table: ${constraint.table_name}.${constraint.column_name}`);
          console.log(`  References: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        });
      } else {
        console.log('No foreign key constraints found');
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkConstraints();
