
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticationService } from '@/lib/auth-service'

// Service-role client for direct DB access. All queries are explicitly scoped
// to the authenticated user's id below (defense in depth on top of RLS).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/notifications - Fetch the authenticated user's notifications
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await AuthenticationService.getInstance().authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = authResult
    const { searchParams } = new URL(request.url)

    // limit: default 50, capped at 100
    const parsedLimit = parseInt(searchParams.get('limit') || '50')
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 1), 100)
    const unreadOnly = searchParams.get('unread_only') === 'true'

    let query = supabase
      .from('notifications')
      .select('id, user_id, type, message, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Always compute the total unread count for the user (independent of filters/limit)
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (countError) {
      console.error('Error counting unread notifications:', countError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    return NextResponse.json({
      notifications: data || [],
      unread_count: unreadCount || 0,
    })

  } catch (error) {
    console.error('Unexpected error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark one or all of the user's notifications as read
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await AuthenticationService.getInstance().authenticateUser(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = authResult

    let body: { notification_id?: string; mark_all?: boolean }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { notification_id, mark_all } = body

    if (!mark_all && !notification_id) {
      return NextResponse.json(
        { error: 'Either notification_id or mark_all is required' },
        { status: 400 }
      )
    }

    if (mark_all) {
      // Mark all of the user's unread notifications as read
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (updateError) {
        console.error('Error marking all notifications read:', updateError)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
      }
    } else {
      // Mark a single notification as read (scoped to the user's id)
      const { data: updated, error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification_id)
        .eq('user_id', user.id)
        .select('id')

      if (updateError) {
        console.error('Error marking notification read:', updateError)
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
      }

      if (!updated || updated.length === 0) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
      }
    }

    // Recompute the user's unread count after the update
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (countError) {
      console.error('Error counting unread notifications:', countError)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true, unread_count: unreadCount || 0 })

  } catch (error) {
    console.error('Unexpected error in notifications PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
