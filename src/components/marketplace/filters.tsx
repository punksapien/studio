
'use client';

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
import { industries, asianCountries, revenueRanges } from '@/lib/types'; // Removed askingPriceRanges
import { Filter } from 'lucide-react';

export function Filters() {
  // In a real app, these would update query params or state
  return (
    <Card className="sticky top-20 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Filter Listings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select name="industry">
            <SelectTrigger id="industry">
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
          <Label htmlFor="country">Country</Label>
          <Select name="country">
            <SelectTrigger id="country">
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
          <Label htmlFor="revenue">Annual Revenue Range</Label>
          <Select name="revenue">
            <SelectTrigger id="revenue">
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
          <Label htmlFor="askingPrice">Asking Price (Max USD)</Label>
          <Input type="number" name="askingPrice" id="askingPrice" placeholder="e.g., 500000" />
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Input id="keywords" name="keywords" placeholder="e.g., SaaS, Retail Tech" />
        </div>

        <Button className="w-full">Apply Filters</Button>
        <Button variant="outline" className="w-full">Reset Filters</Button>
      </CardContent>
    </Card>
  );
}
