import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationService } from '@/lib/auth-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/conversations - List all conversations, optionally filtered by user (buyer or seller)
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
      .from('conversations')
      .select(`
        id,
        buyer_id,
        seller_id,
        inquiry_id,
        status,
        last_message_snippet,
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

    query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: conversations, count: totalCount, error } = await query

    if (error) {
      console.error('[ADMIN-CONVERSATIONS] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: error.message },
        { status: 500 }
      )
    }

    // Fetch related profiles and inquiry->listing titles separately to avoid PostgREST join ambiguity
    const userIds = [...new Set((conversations || []).flatMap((c: any) => [c.buyer_id, c.seller_id]))]
    const inquiryIds = [...new Set((conversations || []).map((c: any) => c.inquiry_id).filter(Boolean))]

    const [{ data: profiles }, { data: inquiries }] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from('user_profiles').select('id, full_name, email').in('id', userIds)
        : Promise.resolve({ data: [] as any[] }),
      inquiryIds.length
        ? supabaseAdmin.from('inquiries').select('id, listing_id').in('id', inquiryIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const listingIds = [...new Set((inquiries || []).map((i: any) => i.listing_id).filter(Boolean))]
    const { data: listings } = listingIds.length
      ? await supabaseAdmin.from('listings').select('id, listing_title_anonymous').in('id', listingIds)
      : { data: [] as any[] }

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const inquiryMap = new Map((inquiries || []).map((i: any) => [i.id, i]))
    const listingMap = new Map((listings || []).map((l: any) => [l.id, l]))

    const transformed = (conversations || []).map((conv: any) => {
      const buyer = profileMap.get(conv.buyer_id)
      const seller = profileMap.get(conv.seller_id)
      const inquiry = conv.inquiry_id ? inquiryMap.get(conv.inquiry_id) : null
      const listing = inquiry?.listing_id ? listingMap.get(inquiry.listing_id) : null
      return {
        id: conv.id,
        status: conv.status,
        lastMessageSnippet: conv.last_message_snippet,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        listing: listing
          ? { id: inquiry.listing_id, title: listing.listing_title_anonymous }
          : null,
        buyer: {
          id: conv.buyer_id,
          fullName: buyer?.full_name || 'Unknown',
          email: buyer?.email || '',
        },
        seller: {
          id: conv.seller_id,
          fullName: seller?.full_name || 'Unknown',
          email: seller?.email || '',
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        conversations: transformed,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((totalCount || 0) / limit),
          totalCount: totalCount || 0,
          limit,
        },
      },
    })
  } catch (error) {
    console.error('[ADMIN-CONVERSATIONS] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
