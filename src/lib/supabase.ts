import { createBrowserClient } from '@supabase/ssr'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Test function to verify connection
export async function testSupabaseConnection() {
  try {
    // Use a simple query that doesn't require authentication or RLS
    // This queries the public listings that are verified (which anonymous users can see)
    const { data, error } = await supabase
      .from('listings')
      .select('count')
      .eq('status', 'verified_anonymous')
      .limit(1)

    if (error) {
      console.log('Supabase query completed with expected result (empty table):', error.message)
      // An empty table or "no rows" is actually a successful connection
      if (error.code === 'PGRST116') {
        return true
      }
      throw error
    }

    console.log('Supabase connection successful:', data)
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}
