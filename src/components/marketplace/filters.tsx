'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search, RotateCcw, Filter, Plus } from 'lucide-react';
import { useMarketplaceFilters } from '@/hooks/use-marketplace-filters';
import {
  INDUSTRIES,
  COUNTRIES,
  validatePriceRange,
  formatPrice,
  parsePriceInput
} from '@/lib/marketplace-utils';
import { placeholderKeywords } from '@/lib/types';

export function Filters() {
  const {
    draftFilters,
    appliedFilters,
    updateDraftFilter,
    updateDraftFilters,
    applyFilters,
    resetAndApplyFilters,
    isLoading,
    hasActiveFilters,
  } = useMarketplaceFilters();

  // Local state for custom keyword input
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [priceErrors, setPriceErrors] = useState<{ min?: string; max?: string }>({});

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);
  }, [draftFilters, appliedFilters]);

  // Handle price input with validation
  const handlePriceChange = useCallback((type: 'min' | 'max', value: string) => {
    const numericValue = parsePriceInput(value);

    if (type === 'min') {
      updateDraftFilter('minPrice', numericValue);
    } else {
      updateDraftFilter('maxPrice', numericValue);
    }

    // Validate price range
    const minPrice = type === 'min' ? numericValue : draftFilters.minPrice;
    const maxPrice = type === 'max' ? numericValue : draftFilters.maxPrice;

    const validation = validatePriceRange(minPrice, maxPrice);
    setPriceErrors(validation.errors);
  }, [draftFilters.minPrice, draftFilters.maxPrice, updateDraftFilter]);

  // Handle predefined keyword toggle
  const handlePredefinedKeywordToggle = useCallback((keyword: string) => {
    const currentKeywords = draftFilters.keywords || [];
    const isSelected = currentKeywords.includes(keyword);

    const newKeywords = isSelected
      ? currentKeywords.filter(k => k !== keyword)
      : [...currentKeywords, keyword];

    updateDraftFilter('keywords', newKeywords);
  }, [draftFilters.keywords, updateDraftFilter]);

  // Handle custom keyword addition
  const handleAddCustomKeyword = useCallback(() => {
    const trimmedKeyword = customKeywordInput.trim();
    if (!trimmedKeyword) return;

    const currentKeywords = draftFilters.keywords || [];

    // Avoid duplicates (case-insensitive)
    const keywordExists = currentKeywords.some(
      k => k.toLowerCase() === trimmedKeyword.toLowerCase()
    );

    if (!keywordExists) {
      updateDraftFilter('keywords', [...currentKeywords, trimmedKeyword]);
    }

    setCustomKeywordInput('');
  }, [customKeywordInput, draftFilters.keywords, updateDraftFilter]);

  // Handle keyword removal
  const handleRemoveKeyword = useCallback((keywordToRemove: string) => {
    const currentKeywords = draftFilters.keywords || [];
    const newKeywords = currentKeywords.filter(k => k !== keywordToRemove);
    updateDraftFilter('keywords', newKeywords);
  }, [draftFilters.keywords, updateDraftFilter]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if there are price validation errors
    if (priceErrors.min || priceErrors.max) {
      return;
    }

    applyFilters();
  }, [applyFilters, priceErrors]);

  // Handle reset
  const handleReset = useCallback(() => {
    resetAndApplyFilters();
    setCustomKeywordInput('');
    setPriceErrors({});
  }, [resetAndApplyFilters]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-brand-dark-blue" />
          <h3 className="text-lg font-semibold text-brand-dark-blue">Filter Listings</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {Object.values(appliedFilters).filter(v =>
                v !== undefined && v !== '' &&
                (Array.isArray(v) ? v.length > 0 : true)
              ).length} active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">
            Search
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="Search listings..."
            value={draftFilters.search || ''}
            onChange={(e) => updateDraftFilter('search', e.target.value || undefined)}
            className="w-full"
          />
        </div>

        {/* Industry Filter */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
            Industry
          </Label>
          <Select
            value={draftFilters.industry || 'all'}
            onValueChange={(value) => updateDraftFilter('industry', value === 'all' ? undefined : value)}
          >
            <SelectTrigger id="industry" className="w-full">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {Object.entries(INDUSTRIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country Filter */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium text-gray-700">
            Country
          </Label>
          <Select
            value={draftFilters.country || 'all'}
            onValueChange={(value) => updateDraftFilter('country', value === 'all' ? undefined : value)}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {Object.entries(COUNTRIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Asking Price Range (USD)
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="Min price"
                value={draftFilters.minPrice ? formatPrice(draftFilters.minPrice) : ''}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className={priceErrors.min ? 'border-red-500' : ''}
              />
              {priceErrors.min && (
                <p className="text-xs text-red-600">{priceErrors.min}</p>
              )}
            </div>
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="Max price"
                value={draftFilters.maxPrice ? formatPrice(draftFilters.maxPrice) : ''}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className={priceErrors.max ? 'border-red-500' : ''}
              />
              {priceErrors.max && (
                <p className="text-xs text-red-600">{priceErrors.max}</p>
              )}
            </div>
          </div>
        </div>

        {/* Keywords Section */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            Keywords
          </Label>

          {/* Custom Keyword Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-keyword" className="text-xs font-medium text-gray-600">
              Add Custom Keywords
            </Label>
            <div className="flex space-x-2">
              <Input
                id="custom-keyword"
                type="text"
                placeholder="Enter custom keyword..."
                value={customKeywordInput}
                onChange={(e) => setCustomKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomKeyword();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomKeyword}
                disabled={!customKeywordInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Predefined Keywords */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-600">
              Popular Keywords
            </Label>
            <div className="flex flex-wrap gap-2">
              {placeholderKeywords.map((keyword) => {
                const isSelected = draftFilters.keywords?.includes(keyword) || false;
                return (
                  <Button
                    key={keyword}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePredefinedKeywordToggle(keyword)}
                    className="text-xs"
                  >
                    {keyword}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Selected Keywords Display */}
          {draftFilters.keywords && draftFilters.keywords.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">
                Selected Keywords ({draftFilters.keywords.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {draftFilters.keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{keyword}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            disabled={isLoading || (priceErrors.min || priceErrors.max) ? true : false}
            className="flex-1"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Searching...' : 'Apply Filters'}
          </Button>

          {hasUnsavedChanges && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Reset draft to applied (discard changes)
                updateDraftFilters(appliedFilters);
                setCustomKeywordInput('');
                setPriceErrors({});
              }}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            You have unsaved filter changes. Click "Apply Filters" to search with these settings.
          </div>
        )}
      </form>
    </div>
  );
}
