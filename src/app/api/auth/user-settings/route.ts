import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'

// GET /api/auth/user-settings - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const authService = AuthenticationService.getInstance()
    const result = await authService.authenticateUser(request)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = result.user!
    const profile = result.profile!

    return NextResponse.json({
      settings: {
        email_notifications_general: profile.email_notifications_general ?? true,
        email_notifications_inquiries: profile.email_notifications_inquiries ?? true,
        email_notifications_listing_updates: profile.email_notifications_listing_updates ?? true,
        email_notifications_system: profile.email_notifications_system ?? true,
      }
    })
  } catch (error) {
    console.error('Get user settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/user-settings - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const authService = AuthenticationService.getInstance()
    const result = await authService.authenticateUser(request)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = result.user!
    const profile = result.profile!

    const body = await request.json()
    const {
      email_notifications_general,
      email_notifications_inquiries,
      email_notifications_listing_updates,
      email_notifications_system,
    } = body

    // Validate that all values are booleans if provided
    const settings = {}
    if (typeof email_notifications_general === 'boolean') {
      settings.email_notifications_general = email_notifications_general
    }
    if (typeof email_notifications_inquiries === 'boolean') {
      settings.email_notifications_inquiries = email_notifications_inquiries
    }
    if (typeof email_notifications_listing_updates === 'boolean') {
      settings.email_notifications_listing_updates = email_notifications_listing_updates
    }
    if (typeof email_notifications_system === 'boolean') {
      settings.email_notifications_system = email_notifications_system
    }

    if (Object.keys(settings).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings provided' },
        { status: 400 }
      )
    }

    // Update the user's notification preferences using the auth service
    const { auth } = await import('@/lib/auth')
    await auth.updateUserSettings(settings)

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings
    })
  } catch (error) {
    console.error('Update user settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    )
  }
}
