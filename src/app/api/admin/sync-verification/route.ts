import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { AuthenticationService } from '@/lib/auth-service';

interface SyncRequest {
  user_id?: string;
  sync_all?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[SYNC-VERIFICATION] Starting verification sync...');

    // Authenticate admin user
    const authService = AuthenticationService.getInstance();
    const authResult = await authService.authenticateUser(request);

    if (!authResult.success || !authResult.user || authResult.user.role !== 'admin') {
      console.log('[SYNC-VERIFICATION] Authentication failed or insufficient permissions');
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const body: SyncRequest = await request.json();
    const { user_id, sync_all = false } = body;

    if (!sync_all && !user_id) {
      return NextResponse.json(
        { error: 'Either user_id or sync_all must be provided' },
        { status: 400 }
      );
    }

    let syncResults = {
      total_users_processed: 0,
      total_listings_updated: 0,
      users_processed: [] as any[],
      errors: [] as string[]
    };

    if (sync_all) {
      // Sync all sellers
      console.log('[SYNC-VERIFICATION] Syncing all sellers...');

      const { data: allSellers, error: sellersError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, verification_status, full_name')
        .eq('role', 'seller');

      if (sellersError) {
        console.error('[SYNC-VERIFICATION] Error fetching sellers:', sellersError);
        return NextResponse.json(
          { error: 'Failed to fetch sellers' },
          { status: 500 }
        );
      }

      // Process each seller
      for (const seller of allSellers || []) {
        try {
          const result = await syncUserListings(seller.id, seller.verification_status);
          syncResults.total_users_processed++;
          syncResults.total_listings_updated += result.listings_updated;
          syncResults.users_processed.push({
            user_id: seller.id,
            user_name: seller.full_name,
            verification_status: seller.verification_status,
            listings_updated: result.listings_updated
          });
        } catch (error) {
          console.error(`[SYNC-VERIFICATION] Error syncing user ${seller.id}:`, error);
          syncResults.errors.push(`User ${seller.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } else {
      // Sync specific user
      console.log(`[SYNC-VERIFICATION] Syncing user ${user_id}...`);

      const { data: user, error: userError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, verification_status, full_name, role')
        .eq('id', user_id)
        .single();

      if (userError || !user) {
        console.error('[SYNC-VERIFICATION] User not found:', userError);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      if (user.role !== 'seller') {
        return NextResponse.json(
          { error: 'User is not a seller' },
          { status: 400 }
        );
      }

      try {
        const result = await syncUserListings(user.id, user.verification_status);
        syncResults.total_users_processed = 1;
        syncResults.total_listings_updated = result.listings_updated;
        syncResults.users_processed.push({
          user_id: user.id,
          user_name: user.full_name,
          verification_status: user.verification_status,
          listings_updated: result.listings_updated
        });
      } catch (error) {
        console.error(`[SYNC-VERIFICATION] Error syncing user ${user_id}:`, error);
        syncResults.errors.push(`User ${user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('[SYNC-VERIFICATION] Sync completed:', syncResults);

    return NextResponse.json({
      success: true,
      message: `Sync completed. Processed ${syncResults.total_users_processed} users, updated ${syncResults.total_listings_updated} listings.`,
      data: syncResults
    });

  } catch (error) {
    console.error('[SYNC-VERIFICATION] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function syncUserListings(userId: string, verificationStatus: string) {
  console.log(`[SYNC-VERIFICATION] Syncing listings for user ${userId}, status: ${verificationStatus}`);

  // Determine the correct is_seller_verified value
  const isSellerVerified = verificationStatus === 'verified';

  // Update all listings for this seller
  const { data, error, count } = await supabaseAdmin
    .from('listings')
    .update({
      is_seller_verified: isSellerVerified,
      updated_at: new Date().toISOString()
    })
    .eq('seller_id', userId)
    .select('id', { count: 'exact' });

  if (error) {
    console.error(`[SYNC-VERIFICATION] Error updating listings for user ${userId}:`, error);
    throw new Error(`Failed to update listings: ${error.message}`);
  }

  const listingsUpdated = count || 0;
  console.log(`[SYNC-VERIFICATION] Updated ${listingsUpdated} listings for user ${userId}`);

  return {
    listings_updated: listingsUpdated,
    updated_listing_ids: data?.map(l => l.id) || []
  };
}
