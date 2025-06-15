
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // TODO: Add robust admin authentication check here

    const { listings } = await request.json();

    if (!Array.isArray(listings)) {
      return NextResponse.json({ error: 'Invalid input. Expects an array of listings.' }, { status: 400 });
    }

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const listingData of listings) {
      const { sellerEmail, listingTitleAnonymous, industry, locationCountry, askingPrice /* other fields */ } = listingData;

      if (!sellerEmail || !listingTitleAnonymous || !industry || !locationCountry) {
        failed++;
        errors.push(`Skipped: Missing required fields (sellerEmail, title, industry, country) for listing '${listingTitleAnonymous || 'N/A'}'.`);
        continue;
      }

      try {
        // Find seller by email to get seller_id
        const { data: sellerProfile, error: sellerError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('email', sellerEmail)
          .single();

        if (sellerError || !sellerProfile) {
          throw new Error(`Seller with email ${sellerEmail} not found. Listing '${listingTitleAnonymous}' not created.`);
        }

        const newListing = {
          seller_id: sellerProfile.id,
          listing_title_anonymous: listingTitleAnonymous,
          industry: industry,
          location_country: locationCountry,
          location_city_region_general: listingData.locationCityRegionGeneral || 'N/A',
          anonymous_business_description: listingData.anonymousBusinessDescription || 'N/A',
          key_strengths_anonymous: listingData.keyStrengthsAnonymous ? listingData.keyStrengthsAnonymous.split('|') : [], // Assuming pipe-separated for CSV
          annual_revenue_range: listingData.annualRevenueRange || 'N/A',
          net_profit_margin_range: listingData.netProfitMarginRange,
          asking_price: parseFloat(askingPrice) || null,
          // ... map other CSV columns to database fields
          status: listingData.status || 'active', // Default status
          is_seller_verified: listingData.isSellerVerified === 'true' || listingData.isSellerVerified === true || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: createError } = await supabaseAdmin
          .from('listings')
          .insert(newListing);

        if (createError) {
          throw new Error(`Database error for listing '${listingTitleAnonymous}': ${createError.message}`);
        }
        
        successful++;
      } catch (e) {
        failed++;
        const message = e instanceof Error ? e.message : String(e);
        errors.push(`Failed for listing '${listingTitleAnonymous || 'N/A'}': ${message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Batch listing processing complete.',
      processed: listings.length,
      successful,
      failed,
      errors,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: 'Batch listing processing failed.', details: message }, { status: 500 });
  }
}
