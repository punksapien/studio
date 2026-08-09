import { NextRequest, NextResponse } from 'next/server'
import { isAdvisoryApiAuthorized, listAdvisories } from '@/lib/advisory-sync'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!isAdvisoryApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const rawLimit = Number(searchParams.get('limit') || 100)
    const rawOffset = Number(searchParams.get('offset') || 0)
    const statusParam = searchParams.get('status')

    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 500) : 100
    const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0
    const status = statusParam === 'pending' || statusParam === 'pending_reason' || statusParam === 'resolved'
      ? statusParam
      : undefined

    const result = await listAdvisories({
      status,
      advisor: searchParams.get('advisor') || undefined,
      token: searchParams.get('token') || undefined,
      limit,
      offset,
    })

    return NextResponse.json({ ok: true, ...result, limit, offset })
  } catch (error) {
    console.error('Advisory list failed:', error)
    return NextResponse.json({ error: 'Failed to load advisories' }, { status: 500 })
  }
}
