import { NextRequest, NextResponse } from 'next/server';
import { authServer } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ListingStatus, RejectionCategory } from '@/lib/types';

// PATCH /api/admin/listings/[id]/reject - Reject a listing
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

    // Parse request body for rejection details
    const body = await request.json();
    const {
      rejectionCategory,
      adminNotes,
      notifySellerImmediately = true
    } = body;

    // Validate rejection category is provided
    if (!rejectionCategory) {
      return NextResponse.json(
        { error: 'Rejection category is required' },
        { status: 400 }
      );
    }

    const validRejectionCategories: RejectionCategory[] = [
      'quality', 'compliance', 'incomplete', 'fraud', 'duplicate', 'inappropriate', 'other'
    ];

    if (!validRejectionCategories.includes(rejectionCategory)) {
      return NextResponse.json(
        { error: `Invalid rejection category. Must be one of: ${validRejectionCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // If category is 'other', admin notes are required
    if (rejectionCategory === 'other' && !adminNotes?.trim()) {
      return NextResponse.json(
        { error: 'Admin notes are required when rejection category is "other"' },
        { status: 400 }
      );
    }

    console.log(`[ADMIN-REJECT] Admin ${user.id} rejecting listing ${listingId} for: ${rejectionCategory}`);

    // Check if listing exists and get current status
    const { data: existingListing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('id, status, listing_title_anonymous, seller_id')
      .eq('id', listingId)
      .single();

    if (fetchError || !existingListing) {
      console.error('[ADMIN-REJECT] Listing not found:', fetchError);
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if listing is in a state that can be rejected
    const rejectableStatuses: ListingStatus[] = [
      'pending_approval',
      'under_review',
      'active',
      'verified_anonymous',
      'verified_public',
      'appealing_rejection'
    ];

    if (!rejectableStatuses.includes(existingListing.status)) {
      return NextResponse.json(
        { error: `Cannot reject listing with status '${existingListing.status}'. Must be one of: ${rejectableStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare rejection reason message for seller
    const rejectionReasonMessages: Record<RejectionCategory, string> = {
      quality: 'The listing content, images, or information quality does not meet our platform standards.',
      compliance: 'The listing does not comply with our platform policies and guidelines.',
      incomplete: 'The listing is missing required information or documentation.',
      fraud: 'The listing appears to contain fraudulent or misleading information.',
      duplicate: 'This listing appears to be a duplicate of an existing listing.',
      inappropriate: 'The listing contains inappropriate content or violates community standards.',
      other: adminNotes || 'The listing was rejected for reasons specified by our admin team.'
    };

    const rejectionReason = rejectionReasonMessages[rejectionCategory];

    // Update the listing with rejection
    const updateData = {
      status: 'rejected_by_admin' as ListingStatus,
      admin_action_by: user.id,
      admin_action_at: new Date().toISOString(),
      admin_notes: adminNotes || rejectionReason,
      rejection_category: rejectionCategory,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update(updateData)
      .eq('id', listingId)
      .select('*')
      .single();

    if (updateError) {
      console.error('[ADMIN-REJECT] Failed to update listing:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject listing' },
        { status: 500 }
      );
    }

    // The audit trail is automatically created by the database trigger

    // If this was rejecting an appeal, update the appeal status
    if (existingListing.status === 'appealing_rejection') {
      const { error: appealUpdateError } = await supabaseAdmin
        .from('listing_appeals')
        .update({
          status: 'denied',
          admin_response: adminNotes || `Appeal denied. ${rejectionReason}`,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('listing_id', listingId)
        .eq('status', 'under_review');

      if (appealUpdateError) {
        console.warn('[ADMIN-REJECT] Failed to update appeal status:', appealUpdateError);
        // Don't fail the rejection, just log the warning
      }
    }

    // Get seller information for response and potential notification
    const { data: seller } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('id', existingListing.seller_id)
      .single();

    // TODO: In a production system, you might want to send an email notification to the seller
    // For now, we'll create a notification in the database
    if (notifySellerImmediately && seller) {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: seller.id,
          type: 'listing_update',
          message: `Your listing "${existingListing.listing_title_anonymous}" has been rejected. Reason: ${rejectionReason}`,
          link: `/seller-dashboard/listings/${listingId}`,
          is_read: false,
        });

      if (notificationError) {
        console.warn('[ADMIN-REJECT] Failed to create notification:', notificationError);
        // Don't fail the rejection, just log the warning
      }
    }

    console.log(`[ADMIN-REJECT] Successfully rejected listing ${listingId} from ${existingListing.status} for: ${rejectionCategory}`);

    // Return success response with comprehensive data
    return NextResponse.json({
      success: true,
      message: `Listing '${existingListing.listing_title_anonymous}' has been rejected`,
      data: {
        listing: {
          id: updatedListing.id,
          title: updatedListing.listing_title_anonymous,
          previousStatus: existingListing.status,
          newStatus: updatedListing.status,
          rejectionCategory: updatedListing.rejection_category,
          rejectionReason: rejectionReason,
          adminNotes: updatedListing.admin_notes,
          rejectedBy: user.id,
          rejectedAt: updatedListing.admin_action_at,
        },
        seller: seller ? {
          id: seller.id,
          name: seller.full_name,
          email: seller.email,
          notified: notifySellerImmediately,
        } : null,
        action: {
          type: 'rejected',
          adminId: user.id,
          timestamp: new Date().toISOString(),
          category: rejectionCategory,
          reason: rejectionReason,
          notes: adminNotes,
        },
        appealInfo: {
          canAppeal: true,
          appealDeadline: null, // Could implement a deadline system later
          appealInstructions: 'Sellers can appeal this decision through their dashboard.',
        },
      },
    });

  } catch (error) {
    console.error('[ADMIN-REJECT] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
