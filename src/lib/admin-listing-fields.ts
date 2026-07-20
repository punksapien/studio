// Shared whitelist of listing columns an admin may write via the admin
// listing endpoints (create + edit). Keeping this in one place ensures the
// POST /api/admin/listings and PATCH /api/admin/listings/[id] handlers accept
// exactly the same set of fields.
//
// These are raw database column names (snake_case) — the admin listing forms
// submit payloads keyed by column name.
export const ADMIN_LISTING_UPDATABLE_FIELDS = [
  'listing_title_anonymous',
  'industry',
  'location_country',
  'location_city_region_general',
  'anonymous_business_description',
  'key_strength_1',
  'key_strength_2',
  'key_strength_3',
  'business_model',
  'year_established',
  'registered_business_name',
  'business_website_url',
  'social_media_links',
  'number_of_employees',
  'technology_stack',
  'actual_company_name',
  'full_business_address',
  'annual_revenue_range',
  'net_profit_margin_range',
  'asking_price',
  'specific_annual_revenue_last_year',
  'specific_net_profit_last_year',
  'adjusted_cash_flow',
  'ebitda',
  'adjusted_cash_flow_explanation',
  'deal_structure_looking_for',
  'reason_for_selling_anonymous',
  'detailed_reason_for_selling',
  'seller_role_and_time_commitment',
  'post_sale_transition_support',
  'specific_growth_opportunities',
  'growth_opportunity_1',
  'growth_opportunity_2',
  'growth_opportunity_3',
  'secure_data_room_link',
  'image_urls', // JSONB array for images
  // Document URLs
  'financial_documents_url',
  'key_metrics_report_url',
  'ownership_documents_url',
  'financial_snapshot_url',
  'ownership_details_url',
  'location_real_estate_info_url',
  'web_presence_info_url',
  // Status field (admin-only)
  'status',
] as const;

export type AdminListingUpdatableField = typeof ADMIN_LISTING_UPDATABLE_FIELDS[number];
