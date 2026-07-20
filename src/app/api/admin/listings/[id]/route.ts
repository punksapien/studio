import { NextRequest, NextResponse } from 'next/server';
import { authServer } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ADMIN_LISTING_UPDATABLE_FIELDS } from '@/lib/admin-listing-fields';

// GET /api/admin/listings/[id] - Fetch single listing with all details for admin editing
export async function GET(
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

    // Fetch listing with seller details
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        seller:user_profiles!listings_seller_id_fkey(
          id,
          full_name,
          email,
          verification_status,
          created_at
        )
      `)
      .eq('id', listingId)
      .single();

    if (fetchError || !listing) {
      console.error('[ADMIN-GET-LISTING] Listing not found:', fetchError);
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Fetch recent admin actions on this listing
    const { data: adminActions } = await supabaseAdmin
      .from('admin_listing_actions')
      .select(`
        *,
        admin:user_profiles!admin_listing_actions_admin_user_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      listing,
      adminActions: adminActions || [],
    });

  } catch (error) {
    console.error('[ADMIN-GET-LISTING] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/listings/[id] - Comprehensive update for admin editing (all fields)
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

    // Parse request body
    const body = await request.json();
    const { adminReason, notifySeller, ...listingUpdates } = body;

    // Validate admin reason is provided
    if (!adminReason || typeof adminReason !== 'string' || adminReason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Admin reason for edit is required' },
        { status: 400 }
      );
    }

    console.log(`[ADMIN-UPDATE-LISTING] Admin ${user.id} updating listing ${listingId}`);

    // Check if listing exists and get current data
    const { data: existingListing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (fetchError || !existingListing) {
      console.error('[ADMIN-UPDATE-LISTING] Listing not found:', fetchError);
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Filter updates to only include the shared admin-updatable field whitelist
    const updateData: Record<string, any> = {};
    const changedFields: string[] = [];

    for (const field of ADMIN_LISTING_UPDATABLE_FIELDS) {
      if (field in listingUpdates) {
        // Track what changed for audit trail
        if (JSON.stringify(existingListing[field]) !== JSON.stringify(listingUpdates[field])) {
          changedFields.push(field);
        }
        updateData[field] = listingUpdates[field];
      }
    }

    // Add admin tracking fields
    updateData.admin_action_by = user.id;
    updateData.admin_action_at = new Date().toISOString();
    updateData.admin_notes = adminReason;
    updateData.updated_at = new Date().toISOString();

    // Skip the "no changes" check if image_urls or document URLs are in the payload
    // These fields are updated directly by the /api/listings/upload endpoint,
    // so by the time this PATCH runs, the DB already has the new values.
    // The comparison would incorrectly show "no changes" even though images were uploaded.
    const documentUrlFields = [
      'image_urls',
      'financial_documents_url',
      'key_metrics_report_url',
      'ownership_documents_url',
      'financial_snapshot_url',
      'ownership_details_url',
      'location_real_estate_info_url',
      'web_presence_info_url'
    ];
    const hasUploadedFiles = documentUrlFields.some(field => field in listingUpdates);

    if (changedFields.length === 0 && !hasUploadedFiles) {
      return NextResponse.json(
        { error: 'No changes detected' },
        { status: 400 }
      );
    }

    console.log(`[ADMIN-UPDATE-LISTING] Updating fields: ${changedFields.join(', ')}`);

    // Update the listing
    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update(updateData)
      .eq('id', listingId)
      .select('*')
      .single();

    if (updateError) {
      console.error('[ADMIN-UPDATE-LISTING] Failed to update listing:', updateError);
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      );
    }

    // Log admin action for audit trail.
    // admin_listing_actions columns: listing_id, admin_user_id, action_type,
    // previous_status, new_status, admin_notes, created_at. There is no
    // `details` JSON column, so fold the useful context into admin_notes text.
    const changeSummary = changedFields.length > 0
      ? ` [changed: ${changedFields.join(', ')}]`
      : '';
    const { error: auditError } = await supabaseAdmin
      .from('admin_listing_actions')
      .insert({
        listing_id: listingId,
        admin_user_id: user.id,
        action_type: 'edited',
        previous_status: existingListing.status,
        new_status: updatedListing.status,
        admin_notes: `${adminReason}${changeSummary}`,
      });

    if (auditError) {
      console.warn('[ADMIN-UPDATE-LISTING] Failed to log audit trail:', auditError);
      // Don't fail the update, just log the warning
    }

    // Get seller information for response
    const { data: seller } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('id', existingListing.seller_id)
      .single();

    console.log(`[ADMIN-UPDATE-LISTING] Successfully updated listing ${listingId} with ${changedFields.length} changes`);

    return NextResponse.json({
      success: true,
      message: `Listing '${updatedListing.listing_title_anonymous}' has been updated successfully`,
      data: {
        listing: updatedListing,
        seller: seller ? {
          id: seller.id,
          name: seller.full_name,
          email: seller.email,
        } : null,
        changes: {
          fields: changedFields,
          count: changedFields.length,
          reason: adminReason,
          updatedBy: user.id,
          updatedAt: updatedListing.updated_at,
        },
      },
    });

  } catch (error) {
    console.error('[ADMIN-UPDATE-LISTING] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
