import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/listings-debug - Simple version to debug the issue
export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Starting listings query')

    // Try the simplest possible query first
    const { data, error, count } = await supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .limit(5)

    console.log('Debug: Query completed', { data, error, count })

    if (error) {
      console.error('Debug: Database error:', error)
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
      listings: data || [],
      message: 'Debug query successful'
    })
  } catch (error) {
    console.error('Debug: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Unexpected error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
