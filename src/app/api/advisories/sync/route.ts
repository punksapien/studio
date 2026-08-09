import { NextRequest, NextResponse } from 'next/server'
import { isAdvisoryApiAuthorized, parseSyncRequestBody, upsertAdvisories } from '@/lib/advisory-sync'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isAdvisoryApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const records = parseSyncRequestBody(body)
    const upserted = await upsertAdvisories(records)

    return NextResponse.json({
      ok: true,
      received: records.length,
      upserted: upserted.length,
      records: upserted,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isValidationError =
      message.startsWith('Request body') ||
      message.startsWith('records') ||
      message.startsWith('Maximum batch')

    console.error('Advisory sync failed:', error)
    return NextResponse.json(
      { error: isValidationError ? message : 'Failed to sync advisories' },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
