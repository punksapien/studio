'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function SortDropdown() {
  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="sort-by" className="text-sm font-medium text-brand-dark-blue">Sort by:</Label>
      <Select defaultValue="newest">
        <SelectTrigger id="sort-by" className="w-full sm:w-[200px] bg-brand-white border-brand-light-gray focus:ring-brand-sky-blue">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="price-low-high">Asking Price: Low to High</SelectItem>
          <SelectItem value="price-high-low">Asking Price: High to Low</SelectItem>
          {/* Revenue range sorting might be less relevant if asking price is fixed, but kept for now */}
          <SelectItem value="revenue-low-high">Revenue Range: Low to High</SelectItem>
          <SelectItem value="revenue-high-low">Revenue Range: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}