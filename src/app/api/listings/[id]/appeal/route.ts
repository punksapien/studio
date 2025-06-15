import { NextRequest, NextResponse } from 'next/server';
import { authServer } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;

    // Get current user
    const user = await authServer.getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { appealMessage, originalRejectionReason, originalRejectionCategory } = body;

    // Validate appeal message
    if (!appealMessage || typeof appealMessage !== 'string' || appealMessage.trim().length === 0) {
      return NextResponse.json(
        { error: 'Appeal message is required' },
        { status: 400 }
      );
    }

    if (appealMessage.length > 1000) {
      return NextResponse.json(
        { error: 'Appeal message must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // Verify listing exists and belongs to user
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, title, status, seller_id, admin_notes, rejection_category')
      .eq('id', listingId)
      .eq('seller_id', user.id)
      .single();

    if (listingError || !listing) {
      console.error('[APPEAL] Listing fetch error:', listingError);
      return NextResponse.json(
        { error: 'Listing not found or access denied' },
        { status: 404 }
      );
    }

    // Verify listing is rejected and can be appealed
    if (listing.status !== 'rejected_by_admin') {
      return NextResponse.json(
        { error: 'Only rejected listings can be appealed' },
        { status: 400 }
      );
    }

    // Check if appeal already exists
    const { data: existingAppeal, error: appealCheckError } = await supabaseAdmin
      .from('listing_appeals')
      .select('id')
      .eq('listing_id', listingId)
      .single();

    if (existingAppeal) {
      return NextResponse.json(
        { error: 'An appeal has already been submitted for this listing' },
        { status: 400 }
      );
    }

    // Create appeal record
    const { data: appeal, error: appealError } = await supabaseAdmin
      .from('listing_appeals')
      .insert({
        listing_id: listingId,
        seller_id: user.id,
        appeal_message: appealMessage.trim(),
        original_rejection_reason: originalRejectionReason || listing.admin_notes,
        original_rejection_category: originalRejectionCategory || listing.rejection_category,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (appealError) {
      console.error('[APPEAL] Appeal creation error:', appealError);
      return NextResponse.json(
        { error: 'Failed to submit appeal' },
        { status: 500 }
      );
    }

    // Update listing status to appealing_rejection
    const { error: statusUpdateError } = await supabaseAdmin
      .from('listings')
      .update({
        status: 'appealing_rejection',
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (statusUpdateError) {
      console.error('[APPEAL] Status update error:', statusUpdateError);
      // Don't fail the request if status update fails, appeal is still created
    }

    // Log the appeal submission
    console.log(`[APPEAL] Appeal submitted successfully:`, {
      listingId,
      sellerId: user.id,
      appealId: appeal.id,
      listingTitle: listing.title
    });

    return NextResponse.json({
      success: true,
      message: 'Appeal submitted successfully',
      appeal: {
        id: appeal.id,
        status: appeal.status,
        created_at: appeal.created_at,
        appeal_message: appeal.appeal_message
      },
      listing: {
        id: listing.id,
        title: listing.title,
        new_status: 'appealing_rejection'
      }
    });

  } catch (error) {
    console.error('[APPEAL] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
