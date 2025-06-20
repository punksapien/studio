import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { AuthenticationService } from '@/lib/auth-service';

/**
 * API endpoint to sync seller verification status to their listings
 *
 * This can be called:
 * 1. With a specific seller_id to sync just that seller's listings
 * 2. With sync_all=true to sync all sellers' listings
 * 3. With fix_mismatches=true to only update listings that are out of sync
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authService = AuthenticationService.getInstance();
    const authResult = await authService.authenticateUser(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admin users can run this sync
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { seller_id, sync_all = false, fix_mismatches = false } = body;

    // Validate input
    if (!seller_id && !sync_all) {
      return NextResponse.json(
        { error: 'Either seller_id or sync_all must be provided' },
        { status: 400 }
      );
    }

    const results = {
      success: true,
      sellers_processed: 0,
      listings_updated: 0,
      details: [] as any[]
    };

    // If syncing a specific seller
    if (seller_id) {
      const result = await syncSellerListings(seller_id, fix_mismatches);
      results.sellers_processed = 1;
      results.listings_updated = result.listings_updated;
      results.details.push(result);
    }
    // If syncing all sellers
    else if (sync_all) {
      // Get all sellers
      const { data: sellers, error: sellersError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, verification_status')
        .eq('role', 'seller');

      if (sellersError) {
        console.error('Error fetching sellers:', sellersError);
        return NextResponse.json(
          { error: 'Failed to fetch sellers' },
          { status: 500 }
        );
      }

      // Process each seller
      for (const seller of sellers || []) {
        try {
          const result = await syncSellerListings(seller.id, fix_mismatches);
          results.sellers_processed++;
          results.listings_updated += result.listings_updated;
          results.details.push(result);
        } catch (error) {
          console.error(`Error syncing seller ${seller.id}:`, error);
          results.details.push({
            seller_id: seller.id,
            seller_name: seller.full_name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in sync-seller-verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Syncs a seller's verification status to all their listings
 */
async function syncSellerListings(sellerId: string, fixMismatchesOnly: boolean = false) {
  // Get seller details
  const { data: seller, error: sellerError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, verification_status')
    .eq('id', sellerId)
    .single();

  if (sellerError || !seller) {
    throw new Error(`Seller not found: ${sellerError?.message || 'Unknown error'}`);
  }

  // Determine if seller is verified
  const isSellerVerified = seller.verification_status === 'verified';

  // Base query to get listings for this seller
  let query = supabaseAdmin
    .from('listings')
    .select('id, is_seller_verified')
    .eq('seller_id', sellerId);

  // If only fixing mismatches, add filter
  if (fixMismatchesOnly) {
    if (isSellerVerified) {
      // Only update listings where is_seller_verified is false but should be true
      query = query.eq('is_seller_verified', false);
    } else {
      // Only update listings where is_seller_verified is true but should be false
      query = query.eq('is_seller_verified', true);
    }
  }

  // Get listings that need updating
  const { data: listings, error: listingsError } = await query;

  if (listingsError) {
    throw new Error(`Failed to fetch listings: ${listingsError.message}`);
  }

  // If no listings need updating, return early
  if (!listings || listings.length === 0) {
    return {
      seller_id: sellerId,
      seller_name: seller.full_name,
      verification_status: seller.verification_status,
      is_seller_verified: isSellerVerified,
      listings_updated: 0,
      listings_processed: 0,
      already_in_sync: true
    };
  }

  // Update all listings that need it
  const { error: updateError } = await supabaseAdmin
    .from('listings')
    .update({
      is_seller_verified: isSellerVerified,
      updated_at: new Date().toISOString()
    })
    .eq('seller_id', sellerId)
    .in('id', listings.map(l => l.id));

  if (updateError) {
    throw new Error(`Failed to update listings: ${updateError.message}`);
  }

  console.log(`Synced ${listings.length} listings for seller ${seller.full_name} (${sellerId})`);

  return {
    seller_id: sellerId,
    seller_name: seller.full_name,
    verification_status: seller.verification_status,
    is_seller_verified: isSellerVerified,
    listings_updated: listings.length,
    listings_processed: listings.length,
    already_in_sync: false
  };
}
