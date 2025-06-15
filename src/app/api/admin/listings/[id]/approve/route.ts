import { NextRequest, NextResponse } from 'next/server';
import { authServer } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ListingStatus } from '@/lib/types';

// PATCH /api/admin/listings/[id]/approve - Approve a listing
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and verify admin role
    const user = await authServer.getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await authServer.getCurrentUserProfile(request);
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id: listingId } = await params;
    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Parse request body for approval details
    const body = await request.json();
    const {
      newStatus = 'active', // Default to active, but can be verified_anonymous or verified_public
      adminNotes
    } = body;

    // Validate the new status
    const validApprovalStatuses: ListingStatus[] = ['active', 'verified_anonymous', 'verified_public'];
    if (!validApprovalStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid approval status. Must be one of: ${validApprovalStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`[ADMIN-APPROVE] Admin ${user.id} approving listing ${listingId} to status: ${newStatus}`);

    // Check if listing exists and get current status
    const { data: existingListing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('id, status, listing_title_anonymous, seller_id')
      .eq('id', listingId)
      .single();

    if (fetchError || !existingListing) {
      console.error('[ADMIN-APPROVE] Listing not found:', fetchError);
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if listing is in a state that can be approved
    const approvableStatuses: ListingStatus[] = [
      'pending_approval',
      'under_review',
      'rejected_by_admin',
      'appealing_rejection',
      'inactive'
    ];

    if (!approvableStatuses.includes(existingListing.status)) {
      return NextResponse.json(
        { error: `Cannot approve listing with status '${existingListing.status}'. Must be one of: ${approvableStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update the listing with approval
    const updateData = {
      status: newStatus,
      admin_action_by: user.id,
      admin_action_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
      rejection_category: null, // Clear any previous rejection category
      updated_at: new Date().toISOString(),
    };

    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update(updateData)
      .eq('id', listingId)
      .select('*')
      .single();

    if (updateError) {
      console.error('[ADMIN-APPROVE] Failed to update listing:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve listing' },
        { status: 500 }
      );
    }

    // The audit trail is automatically created by the database trigger
    // But we can also manually insert for additional context if needed

    // If this was an appeal approval, update the appeal status
    if (existingListing.status === 'appealing_rejection') {
      const { error: appealUpdateError } = await supabaseAdmin
        .from('listing_appeals')
        .update({
          status: 'approved',
          admin_response: adminNotes || 'Appeal approved - listing reinstated',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('listing_id', listingId)
        .eq('status', 'pending');

      if (appealUpdateError) {
        console.warn('[ADMIN-APPROVE] Failed to update appeal status:', appealUpdateError);
        // Don't fail the approval, just log the warning
      }
    }

    // Get seller information for response
    const { data: seller } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('id', existingListing.seller_id)
      .single();

    console.log(`[ADMIN-APPROVE] Successfully approved listing ${listingId} from ${existingListing.status} to ${newStatus}`);

    // Return success response with comprehensive data
    return NextResponse.json({
      success: true,
      message: `Listing '${existingListing.listing_title_anonymous}' has been approved and is now ${newStatus}`,
      data: {
        listing: {
          id: updatedListing.id,
          title: updatedListing.listing_title_anonymous,
          previousStatus: existingListing.status,
          newStatus: updatedListing.status,
          adminNotes: updatedListing.admin_notes,
          approvedBy: user.id,
          approvedAt: updatedListing.admin_action_at,
        },
        seller: seller ? {
          id: seller.id,
          name: seller.full_name,
          email: seller.email,
        } : null,
        action: {
          type: 'approved',
          adminId: user.id,
          timestamp: new Date().toISOString(),
          notes: adminNotes,
        },
      },
    });

  } catch (error) {
    console.error('[ADMIN-APPROVE] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
