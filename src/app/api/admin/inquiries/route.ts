import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/inquiries - List all inquiries, optionally filtered by user (buyer or seller)
export async function GET(request: NextRequest) {
  try {
    const authService = AuthenticationService.getInstance()
    const authResult = await authService.authenticateUser(request)

    if (!authResult.success || !authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = (page - 1) * limit
    const userIdFilter = searchParams.get('user_id')
    const statusFilter = searchParams.get('status')

    let query = supabaseAdmin
      .from('inquiries')
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        inquiry_timestamp,
        created_at,
        updated_at
      `, { count: 'exact' })
      .is('deleted_at', null)

    if (userIdFilter) {
      query = query.or(`buyer_id.eq.${userIdFilter},seller_id.eq.${userIdFilter}`)
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: inquiries, count: totalCount, error } = await query

    if (error) {
      console.error('[ADMIN-INQUIRIES] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch inquiries', details: error.message },
        { status: 500 }
      )
    }

    // Fetch related user profiles and listings separately to avoid PostgREST join ambiguity
    const userIds = [...new Set((inquiries || []).flatMap((i: any) => [i.buyer_id, i.seller_id]))]
    const listingIds = [...new Set((inquiries || []).map((i: any) => i.listing_id))]

    const [{ data: profiles }, { data: listings }] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from('user_profiles').select('id, full_name, email').in('id', userIds)
        : Promise.resolve({ data: [] as any[] }),
      listingIds.length
        ? supabaseAdmin.from('listings').select('id, listing_title_anonymous').in('id', listingIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const listingMap = new Map((listings || []).map((l: any) => [l.id, l]))

    const transformed = (inquiries || []).map((inquiry: any) => {
      const buyer = profileMap.get(inquiry.buyer_id)
      const seller = profileMap.get(inquiry.seller_id)
      const listing = listingMap.get(inquiry.listing_id)
      return {
        id: inquiry.id,
        status: inquiry.status,
        createdAt: inquiry.created_at,
        inquiryTimestamp: inquiry.inquiry_timestamp,
        listing: {
          id: inquiry.listing_id,
          title: listing?.listing_title_anonymous || 'Deleted listing',
        },
        buyer: {
          id: inquiry.buyer_id,
          fullName: buyer?.full_name || 'Unknown',
          email: buyer?.email || '',
        },
        seller: {
          id: inquiry.seller_id,
          fullName: seller?.full_name || 'Unknown',
          email: seller?.email || '',
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        inquiries: transformed,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((totalCount || 0) / limit),
          totalCount: totalCount || 0,
          limit,
        },
      },
    })
  } catch (error) {
    console.error('[ADMIN-INQUIRIES] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
