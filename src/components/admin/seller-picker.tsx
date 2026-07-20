'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { VerificationStatusBadge } from '@/components/shared/verification-status-badge';
import { useDebounce } from '@/hooks/use-debounce';
import { Check, ChevronsUpDown, Loader2, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SellerOption {
  id: string;
  fullName: string;
  email: string;
  verificationStatus: string;
}

interface SellerPickerProps {
  /** Currently selected seller id (controlled). */
  value?: string | null;
  /** Called when a seller is picked. */
  onSelect: (sellerId: string, seller: SellerOption) => void;
  disabled?: boolean;
}

export function SellerPicker({ value, onSelect, disabled }: SellerPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [sellers, setSellers] = React.useState<SellerOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedSeller, setSelectedSeller] = React.useState<SellerOption | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Keep the displayed selection in sync when the controlled value is cleared.
  React.useEffect(() => {
    if (!value) {
      setSelectedSeller(null);
    }
  }, [value]);

  // Fetch sellers whenever the popover is open and the (debounced) query changes.
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ role: 'seller', limit: '20' });
        if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to fetch sellers: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const options: SellerOption[] = (data.users || []).map((u: any) => ({
          id: u.id,
          fullName: u.fullName || 'Unknown',
          email: u.email || 'No email',
          verificationStatus: u.verificationStatus || 'anonymous',
        }));
        setSellers(options);
      } catch (err) {
        if (!cancelled) setSellers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSellers();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch]);

  const handleSelect = (seller: SellerOption) => {
    setSelectedSeller(seller);
    onSelect(seller.id, seller);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selectedSeller ? (
            <span className="flex items-center gap-2 truncate">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{selectedSeller.fullName}</span>
              <span className="truncate text-muted-foreground">({selectedSeller.email})</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select a seller...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="h-10 border-0 px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading sellers...
            </div>
          ) : sellers.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No sellers found.
            </div>
          ) : (
            sellers.map((seller) => (
              <button
                key={seller.id}
                type="button"
                onClick={() => handleSelect(seller)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                  value === seller.id && 'bg-accent/50'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Check className={cn('h-4 w-4 shrink-0', value === seller.id ? 'opacity-100' : 'opacity-0')} />
                    <span className="truncate font-medium">{seller.fullName}</span>
                  </div>
                  <div className="ml-6 truncate text-xs text-muted-foreground">{seller.email}</div>
                </div>
                <VerificationStatusBadge status={seller.verificationStatus} />
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
