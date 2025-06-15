/**
 * Marketplace Utilities
 *
 * Provides robust value mapping, transformations, and validation
 * between frontend UI components and backend API parameters.
 *
 * Key principles:
 * - Graceful handling of invalid/undefined values
 * - Clear separation between display and API values
 * - Comprehensive error handling and fallbacks
 */

// Sort option mappings
export const SORT_OPTIONS = {
  newest: { sortBy: 'created_at', sortOrder: 'desc' as const },
  oldest: { sortBy: 'created_at', sortOrder: 'asc' as const },
  'price-low-high': { sortBy: 'asking_price', sortOrder: 'asc' as const },
  'price-high-low': { sortBy: 'asking_price', sortOrder: 'desc' as const },
  'revenue-low-high': { sortBy: 'specific_annual_revenue_last_year', sortOrder: 'asc' as const },
  'revenue-high-low': { sortBy: 'specific_annual_revenue_last_year', sortOrder: 'desc' as const },
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

/**
 * Converts sort option key to API parameters
 */
export function sortOptionToAPI(sortOption: string): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const option = SORT_OPTIONS[sortOption as SortOption];
  if (option) {
    return { sortBy: option.sortBy, sortOrder: option.sortOrder };
  }

  // Fallback to default sorting
  return { sortBy: 'created_at', sortOrder: 'desc' };
}

/**
 * Converts API sort parameters back to sort option key
 */
export function apiToSortOption(sortBy: string, sortOrder: string): SortOption {
  const entries = Object.entries(SORT_OPTIONS) as [SortOption, typeof SORT_OPTIONS[SortOption]][];

  for (const [key, value] of entries) {
    if (value.sortBy === sortBy && value.sortOrder === sortOrder) {
      return key;
    }
  }

  // Fallback to newest
  return 'newest';
}

/**
 * Normalizes industry value for API
 * - Converts display values to API format
 * - Handles "all" case by returning undefined
 * - Sanitizes input
 */
export function normalizeIndustryValue(industry: string | undefined): string | undefined {
  if (!industry || industry === 'all' || industry === '') {
    return undefined;
  }

  // Convert kebab-case back to proper format if needed
  if (industry.includes('-')) {
    return industry
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' & ');
  }

  return industry;
}

/**
 * Normalizes country value for API
 * - Converts display values to API format
 * - Handles "all" case by returning undefined
 * - Sanitizes input
 */
export function normalizeCountryValue(country: string | undefined): string | undefined {
  if (!country || country === 'all' || country === '') {
    return undefined;
  }

  // Convert kebab-case back to proper format if needed
  if (country.includes('-')) {
    return country
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return country;
}

/**
 * Validates and normalizes price input
 * - Ensures positive numbers only
 * - Handles string/number conversion
 * - Returns undefined for invalid inputs
 */
export function normalizePriceValue(price: string | number | undefined): number | undefined {
  if (price === undefined || price === null || price === '') {
    return undefined;
  }

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice) || numericPrice < 0) {
    return undefined;
  }

  return Math.floor(numericPrice); // Remove decimal places for pricing
}

/**
 * Validates and normalizes keyword array
 * - Filters out empty/invalid keywords
 * - Deduplicates keywords
 * - Trims whitespace
 */
export function normalizeKeywords(keywords: string[]): string[] {
  if (!Array.isArray(keywords)) {
    return [];
  }

  return [...new Set(
    keywords
      .filter(keyword => typeof keyword === 'string' && keyword.trim().length > 0)
      .map(keyword => keyword.trim())
  )];
}

/**
 * Converts display industry to select value format
 * Used for populating form dropdowns
 */
export function industryToSelectValue(industry: string): string {
  return industry.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Converts display country to select value format
 * Used for populating form dropdowns
 */
export function countryToSelectValue(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Formats price for display in UI
 * - Adds proper formatting and currency
 * - Handles undefined/null values
 */
export function formatPriceForDisplay(price: number | undefined): string {
  if (price === undefined || price === null) {
    return '';
  }

  return price.toLocaleString();
}

/**
 * Validates all filter values and provides error messages
 * Used for form validation and user feedback
 */
export function validateFilters(filters: {
  industry?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  keywords?: string[];
  search?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate price range
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
    if (filters.minPrice > filters.maxPrice) {
      errors.push('Minimum price cannot be greater than maximum price');
    }
  }

  // Validate price values
  if (filters.minPrice !== undefined && filters.minPrice < 0) {
    errors.push('Minimum price must be a positive number');
  }

  if (filters.maxPrice !== undefined && filters.maxPrice < 0) {
    errors.push('Maximum price must be a positive number');
  }

  // Validate search length
  if (filters.search && filters.search.length > 100) {
    errors.push('Search query is too long (maximum 100 characters)');
  }

  // Validate keywords
  if (filters.keywords && filters.keywords.length > 10) {
    errors.push('Too many keywords selected (maximum 10)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates a human-readable summary of active filters
 * Used for UI feedback and accessibility
 */
export function createFilterSummary(filters: {
  industry?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  keywords?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}): string {
  const parts: string[] = [];

  if (filters.search) {
    parts.push(`search: "${filters.search}"`);
  }

  if (filters.industry) {
    parts.push(`industry: ${filters.industry}`);
  }

  if (filters.country) {
    parts.push(`country: ${filters.country}`);
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = filters.minPrice ? `$${filters.minPrice.toLocaleString()}` : '';
    const max = filters.maxPrice ? `$${filters.maxPrice.toLocaleString()}` : '';

    if (min && max) {
      parts.push(`price: ${min} - ${max}`);
    } else if (min) {
      parts.push(`price: ${min}+`);
    } else if (max) {
      parts.push(`price: up to ${max}`);
    }
  }

  if (filters.keywords && filters.keywords.length > 0) {
    parts.push(`keywords: ${filters.keywords.join(', ')}`);
  }

  if (filters.sortBy && filters.sortOrder) {
    const sortOption = apiToSortOption(filters.sortBy, filters.sortOrder);
    const sortLabels: Record<SortOption, string> = {
      newest: 'newest first',
      oldest: 'oldest first',
      'price-low-high': 'price: low to high',
      'price-high-low': 'price: high to low',
      'revenue-low-high': 'revenue: low to high',
      'revenue-high-low': 'revenue: high to low',
    };
    parts.push(`sorted by: ${sortLabels[sortOption]}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'no filters active';
}
