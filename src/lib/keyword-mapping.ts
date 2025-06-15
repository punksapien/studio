/**
 * Keyword Mapping System
 *
 * Maps frontend keywords to intelligent database field searches.
 * Provides robust, extensible keyword filtering without requiring schema changes.
 *
 * Design Principles:
 * - Performance-first: efficient SQL queries
 * - Intelligent mapping: keywords search relevant fields
 * - Graceful degradation: unknown keywords don't break search
 * - Future-proof: easy to extend with new keywords
 */

import { placeholderKeywords } from './types';

/**
 * Keyword to database field mapping configuration
 * Each keyword maps to specific database fields and search patterns
 */
export const KEYWORD_FIELD_MAPPING: Record<string, {
  fields: string[];
  searchTerms: string[];
  description: string;
}> = {
  // Technology & Business Model Keywords
  'SaaS': {
    fields: ['industry', 'listing_title_anonymous', 'anonymous_business_description', 'key_strength_1', 'key_strength_2', 'key_strength_3'],
    searchTerms: ['saas', 'software', 'subscription', 'cloud', 'platform', 'service', 'technology', 'tech'],
    description: 'Software as a Service businesses'
  },

  'E-commerce': {
    fields: ['industry', 'listing_title_anonymous', 'anonymous_business_description', 'key_strength_1', 'key_strength_2', 'key_strength_3'],
    searchTerms: ['ecommerce', 'e-commerce', 'online', 'retail', 'marketplace', 'store', 'shopping', 'sales'],
    description: 'Online retail and marketplace businesses'
  },

  'Retail': {
    fields: ['industry', 'listing_title_anonymous', 'anonymous_business_description'],
    searchTerms: ['retail', 'store', 'shop', 'merchandise', 'consumer', 'brick', 'mortar'],
    description: 'Physical retail and consumer businesses'
  },

  'Service Business': {
    fields: ['industry', 'listing_title_anonymous', 'anonymous_business_description', 'key_strength_1', 'key_strength_2', 'key_strength_3'],
    searchTerms: ['service', 'consulting', 'professional', 'agency', 'solutions', 'support'],
    description: 'Service-based business models'
  },

  'Fintech': {
    fields: ['industry', 'listing_title_anonymous', 'anonymous_business_description', 'key_strength_1', 'key_strength_2', 'key_strength_3'],
    searchTerms: ['fintech', 'financial', 'finance', 'banking', 'payment', 'crypto', 'blockchain', 'trading', 'investment'],
    description: 'Financial technology businesses'
  },

  'Logistics': {
    fields: ['industry', 'listing_title_anonymous', 'anonymous_business_description'],
    searchTerms: ['logistics', 'shipping', 'delivery', 'transport', 'warehouse', 'supply', 'chain', 'fulfillment'],
    description: 'Logistics and supply chain businesses'
  },

  'Healthcare Tech': {
    fields: ['industry', 'listing_title_anonymous', 'anonymous_business_description', 'key_strength_1', 'key_strength_2', 'key_strength_3'],
    searchTerms: ['healthcare', 'health', 'medical', 'telemedicine', 'biotech', 'pharma', 'wellness'],
    description: 'Healthcare and medical technology'
  },

  // Performance & Growth Keywords
  'High Growth': {
    fields: ['growth_opportunity_1', 'growth_opportunity_2', 'growth_opportunity_3', 'specific_growth_opportunities', 'key_strength_1', 'key_strength_2', 'key_strength_3'],
    searchTerms: ['growth', 'growing', 'expansion', 'scaling', 'increase', 'rising', 'upward', 'trend'],
    description: 'Businesses with high growth potential'
  },

  'Profitable': {
    fields: ['key_strength_1', 'key_strength_2', 'key_strength_3', 'anonymous_business_description', 'net_profit_margin_range'],
    searchTerms: ['profitable', 'profit', 'revenue', 'earning', 'margin', 'cash', 'flow', 'financial'],
    description: 'Profitable businesses with strong financials'
  }
};

/**
 * Validates that a keyword exists in our mapping system
 */
export function isValidKeyword(keyword: string): boolean {
  return keyword in KEYWORD_FIELD_MAPPING || placeholderKeywords.includes(keyword);
}

/**
 * Gets all valid keywords that can be filtered
 */
export function getValidKeywords(): string[] {
  return Object.keys(KEYWORD_FIELD_MAPPING);
}

/**
 * Builds Supabase query conditions for keyword filtering
 * Returns an array of OR conditions that can be combined
 */
export function buildKeywordQuery(keywords: string[]): string[] {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  const validKeywords = keywords.filter(isValidKeyword);
  if (validKeywords.length === 0) {
    return [];
  }

  const queryConditions: string[] = [];

  for (const keyword of validKeywords) {
    const mapping = KEYWORD_FIELD_MAPPING[keyword];
    if (!mapping) {
      continue; // Skip unmapped keywords gracefully
    }

    // Build field-specific search conditions for this keyword
    const fieldConditions: string[] = [];

    for (const field of mapping.fields) {
      for (const searchTerm of mapping.searchTerms) {
        fieldConditions.push(`${field}.ilike.%${searchTerm}%`);
      }
    }

    // Combine all field conditions for this keyword with OR
    if (fieldConditions.length > 0) {
      queryConditions.push(`(${fieldConditions.join(',')})`);
    }
  }

  return queryConditions;
}

/**
 * Creates a human-readable description of active keyword filters
 */
export function describeKeywordFilters(keywords: string[]): string {
  if (!keywords || keywords.length === 0) {
    return '';
  }

  const validKeywords = keywords.filter(isValidKeyword);
  if (validKeywords.length === 0) {
    return '';
  }

  const descriptions = validKeywords.map(keyword => {
    const mapping = KEYWORD_FIELD_MAPPING[keyword];
    return mapping ? `${keyword} (${mapping.description})` : keyword;
  });

  return `Filtering by keywords: ${descriptions.join(', ')}`;
}

/**
 * Validates keyword array and filters out invalid entries
 * Used for input sanitization
 */
export function sanitizeKeywords(keywords: unknown): string[] {
  if (!Array.isArray(keywords)) {
    return [];
  }

  return keywords
    .filter((keyword): keyword is string => typeof keyword === 'string')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0)
    .filter(isValidKeyword);
}

/**
 * Performance optimization: Pre-compile frequently used keyword combinations
 * This could be extended for caching popular search combinations
 */
export function getOptimizedKeywordQuery(keywords: string[]): {
  conditions: string[];
  cacheKey: string;
  performance: 'fast' | 'medium' | 'slow';
} {
  const sanitized = sanitizeKeywords(keywords);
  const conditions = buildKeywordQuery(sanitized);

  // Create cache key for potential future caching
  const cacheKey = sanitized.sort().join('|');

  // Estimate query performance based on complexity
  let performance: 'fast' | 'medium' | 'slow' = 'fast';
  if (conditions.length > 3) {
    performance = 'medium';
  }
  if (conditions.length > 6) {
    performance = 'slow';
  }

  return {
    conditions,
    cacheKey,
    performance
  };
}

/**
 * Debug utility: Explain what fields will be searched for given keywords
 */
export function explainKeywordSearch(keywords: string[]): {
  keyword: string;
  fields: string[];
  searchTerms: string[];
  valid: boolean;
}[] {
  return keywords.map(keyword => {
    const mapping = KEYWORD_FIELD_MAPPING[keyword];
    return {
      keyword,
      fields: mapping?.fields || [],
      searchTerms: mapping?.searchTerms || [],
      valid: isValidKeyword(keyword)
    };
  });
}
