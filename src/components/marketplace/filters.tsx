
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
import { Filter } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";


export function Filters() {
  const [selectedKeywords, setSelectedKeywords] = React.useState<string[]>([]);
  // TODO: Manage other filter states (industry, country, revenue, price) similarly

  const handleKeywordChange = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };
  
  const handleApplyFilters = () => {
    // Placeholder: In a real app, this would likely update URL query params
    // or call a context/state update function to trigger filtering.
    console.log("Applying filters with selected keywords:", selectedKeywords);
    // Potentially: router.push(`/marketplace?keywords=${selectedKeywords.join(',')}&...otherFilters`);
  };

  const handleResetFilters = () => {
    setSelectedKeywords([]);
    // TODO: Reset other filter states here
    console.log("Filters reset");
    // Potentially: router.push('/marketplace');
  };


  return (
    <Card className="sticky top-20 shadow-md bg-brand-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-dark-blue">
          <Filter className="h-5 w-5 text-brand-dark-blue" />
          Filter Listings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="industry" className="text-brand-dark-blue">Industry</Label>
          <Select name="industry">
            <SelectTrigger id="industry" className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry.toLowerCase().replace(/\s+/g, '-')}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="text-brand-dark-blue">Country</Label>
          <Select name="country">
            <SelectTrigger id="country" className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {asianCountries.map((country) => (
                <SelectItem key={country} value={country.toLowerCase().replace(/\s+/g, '-')}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="revenue" className="text-brand-dark-blue">Annual Revenue Range</Label>
          <Select name="revenue">
            <SelectTrigger id="revenue" className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue">
              <SelectValue placeholder="Any Revenue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Revenue</SelectItem>
              {revenueRanges.map((range) => (
                <SelectItem key={range} value={range}>
                  {range}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAskingPrice" className="text-brand-dark-blue">Asking Price (Max USD)</Label>
          <Input type="number" name="maxAskingPrice" id="maxAskingPrice" placeholder="e.g., 500000" className="bg-brand-light-gray/30 border-brand-light-gray focus:ring-brand-sky-blue placeholder:text-brand-dark-blue/50" />
        </div>

        <div className="space-y-2">
            <Label className="text-brand-dark-blue">Keywords</Label>
            <ScrollArea className="h-40 rounded-md border border-brand-light-gray p-3 bg-brand-light-gray/20">
              <div className="space-y-2">
                {placeholderKeywords.map((keyword) => (
                    <div key={keyword} className="flex items-center space-x-2">
                        <Checkbox
                            id={`keyword-${keyword.toLowerCase().replace(/\s+/g, '-')}`}
                            checked={selectedKeywords.includes(keyword)}
                            onCheckedChange={() => handleKeywordChange(keyword)}
                        />
                        <Label htmlFor={`keyword-${keyword.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-normal text-brand-dark-blue/90 cursor-pointer">
                            {keyword}
                        </Label>
                    </div>
                ))}
              </div>
            </ScrollArea>
        </div>

        <Button onClick={handleApplyFilters} className="w-full bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">Apply Filters</Button>
        <Button onClick={handleResetFilters} variant="outline" className="w-full border-brand-dark-blue/50 text-brand-dark-blue hover:bg-brand-light-gray">Reset Filters</Button>
      </CardContent>
    </Card>
  );
}
