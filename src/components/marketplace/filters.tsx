'use client';

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { industries, asianCountries, revenueRanges, placeholderKeywords } from '@/lib/types';
import { Filter, Loader2, AlertCircle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { useMarketplaceFilters } from '@/hooks/use-marketplace-filters';
import {
  industryToSelectValue,
  countryToSelectValue,
  formatPriceForDisplay,
  validateFilters,
  createFilterSummary
} from '@/lib/marketplace-utils';

export function Filters() {
  const { toast } = useToast();
  const {
    filters,
    effectiveFilters,
    updateFilter,
    resetFilters,
    isLoading,
    hasActiveFilters
  } = useMarketplaceFilters();

  // Local state for form inputs (before debouncing)
  const [searchInput, setSearchInput] = React.useState(filters.search || '');
  const [minPriceInput, setMinPriceInput] = React.useState(
    filters.minPrice ? formatPriceForDisplay(filters.minPrice) : ''
  );
  const [maxPriceInput, setMaxPriceInput] = React.useState(
    filters.maxPrice ? formatPriceForDisplay(filters.maxPrice) : ''
  );

  // Sync inputs with URL changes (for browser back/forward)
  React.useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  React.useEffect(() => {
    setMinPriceInput(filters.minPrice ? formatPriceForDisplay(filters.minPrice) : '');
  }, [filters.minPrice]);

  React.useEffect(() => {
    setMaxPriceInput(filters.maxPrice ? formatPriceForDisplay(filters.maxPrice) : '');
  }, [filters.maxPrice]);

  // Form validation
  const validation = React.useMemo(() => {
    return validateFilters({
      industry: effectiveFilters.industry,
      country: effectiveFilters.country,
      minPrice: effectiveFilters.minPrice,
      maxPrice: effectiveFilters.maxPrice,
      keywords: effectiveFilters.keywords,
      search: effectiveFilters.search,
    });
  }, [effectiveFilters]);

  // Event handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    updateFilter('search', value || undefined);
  };

  const handleIndustryChange = (value: string) => {
    updateFilter('industry', value === 'all' ? undefined : value);
  };

  const handleCountryChange = (value: string) => {
    updateFilter('country', value === 'all' ? undefined : value);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinPriceInput(value);

    const numericValue = value ? parseFloat(value.replace(/,/g, '')) : undefined;
    updateFilter('minPrice', numericValue);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxPriceInput(value);

    const numericValue = value ? parseFloat(value.replace(/,/g, '')) : undefined;
    updateFilter('maxPrice', numericValue);
  };

  const handleKeywordChange = (keyword: string, checked: boolean) => {
    const currentKeywords = filters.keywords || [];
    const newKeywords = checked
      ? [...currentKeywords, keyword]
      : currentKeywords.filter(k => k !== keyword);

    updateFilter('keywords', newKeywords);
  };

  const handleResetFilters = () => {
    resetFilters();
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');

    toast({
      title: "Filters Reset",
      description: "All filters have been cleared.",
    });
  };

  // Get current values for controlled components
  const currentIndustry = filters.industry || 'all';
  const currentCountry = filters.country || 'all';
  const currentKeywords = filters.keywords || [];

  return (
    <Card className="sticky top-20 shadow-md bg-brand-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-dark-blue">
          <Filter className="h-5 w-5 text-brand-dark-blue" />
          Filter Listings
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-brand-sky-blue" />
          )}
        </CardTitle>
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground">
            {createFilterSummary(effectiveFilters)}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-brand-dark-blue">Search</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search listings..."
            value={searchInput}
            onChange={handleSearchChange}
            disabled={isLoading}
            className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50"
          />
        </div>

        {/* Industry Filter */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="text-brand-dark-blue">Industry</Label>
          <Select
            value={currentIndustry}
            onValueChange={handleIndustryChange}
            disabled={isLoading}
          >
            <SelectTrigger
              id="industry"
              className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50"
            >
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industryToSelectValue(industry)}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country Filter */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-brand-dark-blue">Country</Label>
          <Select
            value={currentCountry}
            onValueChange={handleCountryChange}
            disabled={isLoading}
          >
            <SelectTrigger
              id="country"
              className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50"
            >
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {asianCountries.map((country) => (
                <SelectItem key={country} value={countryToSelectValue(country)}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range Filters */}
        <div className="space-y-2">
          <Label className="text-brand-dark-blue">Price Range (USD)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="minPrice" className="text-xs text-muted-foreground">Min</Label>
              <Input
                id="minPrice"
                type="text"
                placeholder="0"
                value={minPriceInput}
                onChange={handleMinPriceChange}
                disabled={isLoading}
                className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">Max</Label>
              <Input
                id="maxPrice"
                type="text"
                placeholder="1,000,000"
                value={maxPriceInput}
                onChange={handleMaxPriceChange}
                disabled={isLoading}
                className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Keywords Filter */}
        <div className="space-y-2">
          <Label className="text-brand-dark-blue">Keywords</Label>
          <ScrollArea className="h-40 rounded-md border border-brand-light-gray p-3 bg-brand-light-gray/20">
            <div className="space-y-2">
              {placeholderKeywords.map((keyword) => (
                <div key={keyword} className="flex items-center space-x-2">
                  <Checkbox
                    id={`keyword-${keyword.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={currentKeywords.includes(keyword)}
                    onCheckedChange={(checked) => handleKeywordChange(keyword, checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`keyword-${keyword.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm font-normal text-brand-dark-blue/90 cursor-pointer"
                  >
                    {keyword}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <p className="text-xs text-muted-foreground">
            Note: Keyword filtering is currently client-side only
          </p>
        </div>

        {/* Validation Errors */}
        {!validation.isValid && (
          <div className="space-y-1">
            {validation.errors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleResetFilters}
            variant="outline"
            className="w-full border-brand-dark-blue/50 text-brand-dark-blue hover:bg-brand-light-gray disabled:opacity-50"
            disabled={isLoading || !hasActiveFilters}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Filters'
            )}
          </Button>
          {hasActiveFilters && (
            <p className="text-xs text-center text-muted-foreground">
              Filters are applied automatically as you change them
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
