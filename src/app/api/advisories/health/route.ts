import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'advisory-sync-api',
    timestamp: new Date().toISOString(),
    databaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    apiKeyConfigured: Boolean(process.env.ADVISORY_SYNC_API_KEY),
  })
}
