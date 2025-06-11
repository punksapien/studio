import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdmin() {
  console.log('Checking for admin user...\n');

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, verification_status')
      .eq('email', 'admin@nobridge.com')
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data) {
      console.log('✅ Admin user found!');
      console.log('ID:', data.id);
      console.log('Email:', data.email);
      console.log('Role:', data.role);
      console.log('Status:', data.verification_status);
    } else {
      console.log('❌ Admin user not found');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAdmin();
