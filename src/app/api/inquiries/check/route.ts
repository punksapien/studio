
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticationService } from '@/lib/auth-service'

// Create Supabase client - using service key for direct DB access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/inquiries/check?listing_id=xxx - Check if user has already inquired about a listing
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await AuthenticationService.getInstance().authenticateUser(request);
    if (!authResult.success || !authResult.user) {
      // If not authenticated, they haven't inquired
      return NextResponse.json({ has_inquired: false, inquiry: null });
    }

    const { user, profile } = authResult;
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');

    if (!listingId) {
      return NextResponse.json({ error: 'listing_id parameter is required' }, { status: 400 });
    }

    // Only buyers can check inquiries (for their own inquiries)
    if (profile?.role !== 'buyer') {
      return NextResponse.json({
        has_inquired: false,
        message: 'Only buyers can inquire about listings.',
        inquiry: null
      });
    }

    // Check if buyer has an inquiry for this listing
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .select('id, status, created_at')
      .eq('buyer_id', user.id)
      .eq('listing_id', listingId)
      .maybeSingle(); // Use maybeSingle to handle no rows found gracefully

    if (error) {
      console.error('Error checking inquiry:', error);
      // Don't expose DB errors, just indicate failure to check
      return NextResponse.json({ error: 'Failed to check inquiry status' }, { status: 500 });
    }

    const hasInquired = !!inquiry;

    return NextResponse.json({
      has_inquired: hasInquired,
      inquiry: inquiry || null
    });

  } catch (error) {
    console.error('Unexpected error in inquiry check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

    