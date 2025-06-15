'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from './use-debounce';

export interface MarketplaceFilters {
  // Pagination
  page: number;
  limit: number;

  // Filters
  search?: string;
  industry?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  keywords: string[];

  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: MarketplaceFilters = {
  page: 1,
  limit: 9,
  keywords: [],
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export function useMarketplaceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current URL parameters into filter state
  const parseFiltersFromURL = useCallback((): MarketplaceFilters => {
    return {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '9', 10),
      search: searchParams.get('search') || undefined,
      industry: searchParams.get('industry') || undefined,
      country: searchParams.get('country') || undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined,
      keywords: searchParams.get('keywords')?.split(',').filter(Boolean) || [],
      sortBy: searchParams.get('sort_by') || DEFAULT_FILTERS.sortBy,
      sortOrder: (searchParams.get('sort_order') as 'asc' | 'desc') || DEFAULT_FILTERS.sortOrder,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<MarketplaceFilters>(parseFiltersFromURL);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced values for text inputs (search, price)
  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedMinPrice = useDebounce(filters.minPrice, 300);
  const debouncedMaxPrice = useDebounce(filters.maxPrice, 300);

  // Create the effective filters object with debounced values
  const effectiveFilters = useMemo((): MarketplaceFilters => ({
    ...filters,
    search: debouncedSearch,
    minPrice: debouncedMinPrice,
    maxPrice: debouncedMaxPrice,
  }), [filters, debouncedSearch, debouncedMinPrice, debouncedMaxPrice]);

  // Convert filters to URL search params
  const filtersToURLParams = useCallback((filterValues: MarketplaceFilters): URLSearchParams => {
    const params = new URLSearchParams();

    // Add pagination
    if (filterValues.page !== DEFAULT_FILTERS.page) {
      params.set('page', filterValues.page.toString());
    }
    if (filterValues.limit !== DEFAULT_FILTERS.limit) {
      params.set('limit', filterValues.limit.toString());
    }

    // Add filters
    if (filterValues.search) {
      params.set('search', filterValues.search);
    }
    if (filterValues.industry && filterValues.industry !== 'all') {
      params.set('industry', filterValues.industry);
    }
    if (filterValues.country && filterValues.country !== 'all') {
      params.set('country', filterValues.country);
    }
    if (filterValues.minPrice !== undefined) {
      params.set('minPrice', filterValues.minPrice.toString());
    }
    if (filterValues.maxPrice !== undefined) {
      params.set('maxPrice', filterValues.maxPrice.toString());
    }
    if (filterValues.keywords.length > 0) {
      params.set('keywords', filterValues.keywords.join(','));
    }

    // Add sorting
    if (filterValues.sortBy !== DEFAULT_FILTERS.sortBy) {
      params.set('sort_by', filterValues.sortBy);
    }
    if (filterValues.sortOrder !== DEFAULT_FILTERS.sortOrder) {
      params.set('sort_order', filterValues.sortOrder);
    }

    return params;
  }, []);

  // Update URL when filters change (for non-debounced filters)
  const updateURL = useCallback((newFilters: MarketplaceFilters, replace = false) => {
    const urlParams = filtersToURLParams(newFilters);
    const newURL = `${pathname}?${urlParams.toString()}`;

    if (replace) {
      router.replace(newURL, { scroll: false });
    } else {
      router.push(newURL, { scroll: false });
    }
  }, [pathname, router, filtersToURLParams]);

  // Sync URL parameters with internal state when URL changes
  useEffect(() => {
    const urlFilters = parseFiltersFromURL();
    setFilters(urlFilters);
  }, [parseFiltersFromURL]);

  // Update individual filter values
  const updateFilter = useCallback(<K extends keyof MarketplaceFilters>(
    key: K,
    value: MarketplaceFilters[K]
  ) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };

      // Reset to page 1 when filters change (except for page itself)
      if (key !== 'page' && key !== 'limit') {
        newFilters.page = 1;
      }

      // For non-debounced filters, update URL immediately
      if (!['search', 'minPrice', 'maxPrice'].includes(key)) {
        updateURL(newFilters);
      }

      return newFilters;
    });
  }, [updateURL]);

  // Update multiple filters at once
  const updateFilters = useCallback((updates: Partial<MarketplaceFilters>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };

      // Reset to page 1 when filters change (unless page is being explicitly set)
      if (!('page' in updates)) {
        newFilters.page = 1;
      }

      updateURL(newFilters);
      return newFilters;
    });
  }, [updateURL]);

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    const resetFilters = { ...DEFAULT_FILTERS };
    setFilters(resetFilters);
    updateURL(resetFilters, true);
  }, [updateURL]);

  // Page navigation
  const setPage = useCallback((page: number) => {
    updateFilter('page', page);
  }, [updateFilter]);

  // Generate API parameters from effective filters
  const getAPIParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {
      page: effectiveFilters.page.toString(),
      limit: effectiveFilters.limit.toString(),
      sort_by: effectiveFilters.sortBy,
      sort_order: effectiveFilters.sortOrder,
    };

    if (effectiveFilters.search) {
      params.search = effectiveFilters.search;
    }
    if (effectiveFilters.industry && effectiveFilters.industry !== 'all') {
      params.industry = effectiveFilters.industry;
    }
    if (effectiveFilters.country && effectiveFilters.country !== 'all') {
      params.country = effectiveFilters.country;
    }
    if (effectiveFilters.minPrice !== undefined) {
      params.min_price = effectiveFilters.minPrice.toString();
    }
    if (effectiveFilters.maxPrice !== undefined) {
      params.max_price = effectiveFilters.maxPrice.toString();
    }
    if (effectiveFilters.keywords.length > 0) {
      params.keywords = effectiveFilters.keywords.join(',');
    }

    return params;
  }, [effectiveFilters]);

  return {
    // Current filter state
    filters,
    effectiveFilters,

    // State management
    updateFilter,
    updateFilters,
    resetFilters,
    setPage,

    // API integration
    getAPIParams,

    // Loading state
    isLoading,
    setIsLoading,

    // Helper functions
    hasActiveFilters: useMemo(() => {
      return (
        !!effectiveFilters.search ||
        !!effectiveFilters.industry ||
        !!effectiveFilters.country ||
        effectiveFilters.minPrice !== undefined ||
        effectiveFilters.maxPrice !== undefined ||
        effectiveFilters.keywords.length > 0 ||
        effectiveFilters.sortBy !== DEFAULT_FILTERS.sortBy ||
        effectiveFilters.sortOrder !== DEFAULT_FILTERS.sortOrder
      );
    }, [effectiveFilters]),
  };
}
