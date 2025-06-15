
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
import { industries, asianCountries, placeholderKeywords } from '@/lib/types';
import { Filter, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
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
    draftFilters,
    appliedFilters,
    updateDraftFilter,
    applyFilters,
    resetAndApplyFilters,
    isLoading,
    hasActiveFilters
  } = useMarketplaceFilters();

  // Local state for form inputs that are directly bound to draftFilters
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, filterKey: 'search' | 'minPrice' | 'maxPrice') => {
    const value = e.target.value;
    if (filterKey === 'search') {
      updateDraftFilter('search', value || undefined);
    } else {
      const numericValue = value ? parseFloat(value.replace(/,/g, '')) : undefined;
      updateDraftFilter(filterKey, numericValue);
    }
  };

  const handleSelectChange = (value: string, filterKey: 'industry' | 'country') => {
    updateDraftFilter(filterKey, value === 'all' ? undefined : value);
  };

  const handleKeywordChange = (keyword: string, checked: boolean) => {
    const currentKeywords = draftFilters.keywords || [];
    const newKeywords = checked
      ? [...currentKeywords, keyword]
      : currentKeywords.filter(k => k !== keyword);
    updateDraftFilter('keywords', newKeywords);
  };

  const validation = React.useMemo(() => {
    return validateFilters({
      industry: draftFilters.industry,
      country: draftFilters.country,
      minPrice: draftFilters.minPrice,
      maxPrice: draftFilters.maxPrice,
      keywords: draftFilters.keywords,
      search: draftFilters.search,
    });
  }, [draftFilters]);

  const handleApply = () => {
    if (!validation.isValid) {
      toast({
        title: "Invalid Filters",
        description: validation.errors.join(' '),
        variant: "destructive",
      });
      return;
    }
    applyFilters();
    toast({
      title: "Filters Applied",
      description: "Marketplace listings have been updated.",
    });
  };

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
            Currently active: {createFilterSummary(appliedFilters)}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-brand-dark-blue">Search & Custom Keywords</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search listings or add keywords..."
            value={draftFilters.search || ''}
            onChange={(e) => handleInputChange(e, 'search')}
            disabled={isLoading}
            className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50"
          />
        </div>

        {/* Industry Filter */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="text-brand-dark-blue">Industry</Label>
          <Select
            value={draftFilters.industry || 'all'}
            onValueChange={(value) => handleSelectChange(value, 'industry')}
            disabled={isLoading}
          >
            <SelectTrigger id="industry" className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50">
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
            value={draftFilters.country || 'all'}
            onValueChange={(value) => handleSelectChange(value, 'country')}
            disabled={isLoading}
          >
            <SelectTrigger id="country" className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50">
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
                type="number"
                placeholder="0"
                value={draftFilters.minPrice === undefined ? '' : draftFilters.minPrice}
                onChange={(e) => handleInputChange(e, 'minPrice')}
                disabled={isLoading}
                className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">Max</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="1,000,000"
                value={draftFilters.maxPrice === undefined ? '' : draftFilters.maxPrice}
                onChange={(e) => handleInputChange(e, 'maxPrice')}
                disabled={isLoading}
                className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Keywords Filter */}
        <div className="space-y-2">
          <Label className="text-brand-dark-blue">Predefined Keywords</Label>
          <ScrollArea className="h-40 rounded-md border border-brand-light-gray p-3 bg-brand-light-gray/20">
            <div className="space-y-2">
              {placeholderKeywords.map((keyword) => (
                <div key={keyword} className="flex items-center space-x-2">
                  <Checkbox
                    id={`keyword-${keyword.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={(draftFilters.keywords || []).includes(keyword)}
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
        <div className="space-y-2 pt-4 border-t">
          <Button
            onClick={handleApply}
            className="w-full bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 disabled:opacity-50"
            disabled={isLoading || !validation.isValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              'Apply Filters'
            )}
          </Button>
          <Button
            onClick={resetAndApplyFilters}
            variant="outline"
            className="w-full border-brand-dark-blue/50 text-brand-dark-blue hover:bg-brand-light-gray disabled:opacity-50"
            disabled={isLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
