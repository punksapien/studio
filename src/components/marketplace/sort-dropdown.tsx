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
      <Label htmlFor="sort-by" className="text-sm font-medium">Sort by:</Label>
      <Select defaultValue="newest">
        <SelectTrigger id="sort-by" className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="price-low-high">Price: Low to High</SelectItem>
          <SelectItem value="price-high-low">Price: High to Low</SelectItem>
          <SelectItem value="revenue-low-high">Revenue: Low to High</SelectItem>
          <SelectItem value="revenue-high-low">Revenue: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
