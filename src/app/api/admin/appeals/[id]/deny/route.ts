import { NextRequest, NextResponse } from 'next/server';
import { authServer } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appealId = params.id;

    // Get current user and verify admin access
    const user = await authServer.getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const profile = await authServer.getCurrentUserProfile(request);
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { adminResponse } = body;

    // Validate admin response
    if (!adminResponse || typeof adminResponse !== 'string' || adminResponse.trim().length === 0) {
      return NextResponse.json(
        { error: 'Admin response is required when denying an appeal' },
        { status: 400 }
      );
    }

    if (adminResponse.length > 1000) {
      return NextResponse.json(
        { error: 'Admin response must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // Get appeal details with listing information
    const { data: appeal, error: appealError } = await supabaseAdmin
      .from('listing_appeals')
      .select(`
        id,
        listing_id,
        seller_id,
        status,
        appeal_message,
        listings (
          id,
          listing_title_anonymous,
          status,
          seller_id
        )
      `)
      .eq('id', appealId)
      .single();

    if (appealError || !appeal) {
      console.error('[ADMIN_APPEAL_DENY] Appeal fetch error:', appealError);
      return NextResponse.json(
        { error: 'Appeal not found' },
        { status: 404 }
      );
    }

    // Verify appeal can be denied
    if (appeal.status !== 'pending' && appeal.status !== 'under_review') {
      return NextResponse.json(
        { error: 'Only pending or under review appeals can be denied' },
        { status: 400 }
      );
    }

    // Verify listing exists and is in appealing state
    if (!appeal.listings || appeal.listings.status !== 'appealing_rejection') {
      return NextResponse.json(
        { error: 'Associated listing is not in appealing rejection state' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update appeal status to denied
    const { error: appealUpdateError } = await supabaseAdmin
      .from('listing_appeals')
      .update({
        status: 'denied',
        admin_response: adminResponse.trim(),
        reviewed_by: user.id,
        reviewed_at: now
      })
      .eq('id', appealId);

    if (appealUpdateError) {
      console.error('[ADMIN_APPEAL_DENY] Appeal update error:', appealUpdateError);
      return NextResponse.json(
        { error: 'Failed to deny appeal' },
        { status: 500 }
      );
    }

    // Update listing status back to rejected_by_admin (final rejection)
    const { error: listingUpdateError } = await supabase
      .from('listings')
      .update({
        status: 'rejected_by_admin',
        updated_at: now
        // Keep existing admin rejection fields intact
      })
      .eq('id', appeal.listing_id);

    if (listingUpdateError) {
      console.error('[ADMIN_APPEAL_DENY] Listing update error:', listingUpdateError);
      // Don't fail the request, appeal is still denied
    }

    // Create admin action audit record
    const { error: auditError } = await supabaseAdmin
      .from('admin_listing_actions')
      .insert({
        listing_id: appeal.listing_id,
        admin_id: user.id,
        action_type: 'appeal_denied',
        previous_status: 'appealing_rejection',
        new_status: 'rejected_by_admin',
        reason_category: 'appeal_denied',
        admin_notes: `Appeal denied: ${adminResponse.trim()}`,
        created_at: now
      });

    if (auditError) {
      console.error('[ADMIN_APPEAL_DENY] Audit log error:', auditError);
      // Don't fail the request, main action succeeded
    }

    console.log(`[ADMIN_APPEAL_DENY] Appeal ${appealId} denied by admin ${user.id}:`, {
      listingId: appeal.listing_id,
      listingTitle: appeal.listings?.listing_title_anonymous,
      sellerId: appeal.seller_id
    });

    return NextResponse.json({
      success: true,
      message: 'Appeal denied',
      appeal: {
        id: appeal.id,
        status: 'denied',
        admin_response: adminResponse.trim(),
        reviewed_by: user.id,
        reviewed_at: now
      },
      listing: {
        id: appeal.listing_id,
        title: appeal.listings?.listing_title_anonymous,
        new_status: 'rejected_by_admin'
      }
    });

  } catch (error) {
    console.error('[ADMIN_APPEAL_DENY] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
