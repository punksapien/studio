'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useMarketplaceFilters } from '@/hooks/use-marketplace-filters';
import { apiToSortOption, sortOptionToAPI, SORT_OPTIONS } from '@/lib/marketplace-utils';

export function SortDropdown() {
  const { effectiveFilters, updateFilters, isLoading } = useMarketplaceFilters();

  // Convert current API sorting to display value
  const currentSortOption = apiToSortOption(effectiveFilters.sortBy, effectiveFilters.sortOrder);

  const handleSortChange = (value: string) => {
    try {
      const { sortBy, sortOrder } = sortOptionToAPI(value);
      updateFilters({ sortBy, sortOrder });
    } catch (error) {
      console.error('Error updating sort:', error);
      // Graceful fallback - don't update if there's an error
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="sort-by" className="text-sm font-medium text-brand-dark-blue">
        Sort by:
      </Label>
      <Select
        value={currentSortOption}
        onValueChange={handleSortChange}
        disabled={isLoading}
      >
        <SelectTrigger
          id="sort-by"
          className="w-full sm:w-[200px] bg-brand-white border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50"
        >
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SORT_OPTIONS).map(([key, _]) => (
            <SelectItem key={key} value={key}>
              {getSortOptionLabel(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && (
        <div className="text-xs text-muted-foreground">
          Updating...
        </div>
      )}
    </div>
  );
}

/**
 * Get human-readable label for sort options
 */
function getSortOptionLabel(option: string): string {
  const labels: Record<string, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    'price-low-high': 'Asking Price: Low to High',
    'price-high-low': 'Asking Price: High to Low',
    'revenue-low-high': 'Revenue Range: Low to High',
    'revenue-high-low': 'Revenue Range: High to Low',
  };

  return labels[option] || 'Unknown';
}
