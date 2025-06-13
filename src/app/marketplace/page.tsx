
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { ListingCard } from '@/components/marketplace/listing-card';
import { Filters } from '@/components/marketplace/filters';
import { SortDropdown } from '@/components/marketplace/sort-dropdown';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { SlidersHorizontal, Briefcase, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Real API function to fetch marketplace listings with filters and pagination
async function getMarketplaceListings(
  page: number = 1,
  limit: number = 9,
  filters: {
    search?: string;
    industry?: string;
    country?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}
): Promise<{ listings: any[], totalPages: number, totalListings: number }> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters.search && { search: filters.search }),
    ...(filters.industry && { industry: filters.industry }),
    ...(filters.country && { country: filters.country }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    ...(filters.sortBy && { sort_by: filters.sortBy }),
    ...(filters.sortOrder && { sort_order: filters.sortOrder }),
  });

  const response = await fetch(`/api/listings?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch listings: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    listings: data.listings || [],
    totalPages: data.pagination?.totalPages || 0,
    totalListings: data.pagination?.total || 0
  };
}

export default function MarketplacePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [listings, setListings] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalListings, setTotalListings] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication can be added later - for now allow public access
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Simulate auth check
    // setAuthLoading(true);
    // const authStatus = true; // Replace with actual auth check from Clerk
    // setIsAuthenticated(authStatus);
    // setAuthLoading(false);

    // if (!authLoading && !isAuthenticated) {
    //   router.replace(`/auth/login?redirect=${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    // }
  }, [authLoading, isAuthenticated, router, pathname, searchParams]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    // Extract filters from URL params
    const page = parseInt(searchParams.get('page') || '1', 10);
    const filters = {
      search: searchParams.get('search') || undefined,
      industry: searchParams.get('industry') || undefined,
      country: searchParams.get('country') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      sortBy: searchParams.get('sort_by') || 'created_at',
      sortOrder: searchParams.get('sort_order') || 'desc',
    };

    setCurrentPage(page);

    getMarketplaceListings(page, 9, filters)
      .then(data => {
        setListings(data.listings);
        setTotalPages(data.totalPages);
        setTotalListings(data.totalListings);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch listings:", error);
        setError(error.message || 'Failed to load listings');
        setIsLoading(false);
        toast({
          title: "Error Loading Listings",
          description: "Unable to load marketplace listings. Please try again.",
          variant: "destructive"
        });
      });
  }, [searchParams, authLoading, isAuthenticated, toast]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (authLoading) {
    return (
      <div className="container py-8 md:py-12 text-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-brand-dark-blue">Business Marketplace</h1>
          <p className="text-muted-foreground">
            {isLoading ? 'Loading listings...' : `Explore all available business opportunities. Found ${totalListings} listings.`}
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="md:hidden flex-grow">
             <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
                <Filters />
                <SheetClose asChild>
                    <Button className="m-4">Apply Filters & Close</Button>
                </SheetClose>
              </SheetContent>
            </Sheet>
          </div>
          <SortDropdown />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <aside className="hidden md:block md:col-span-3 md:sticky md:top-24 h-fit">
          <Filters />
        </aside>
        <main className="md:col-span-9">
          {error ? (
            <div className="text-center py-12 col-span-full flex flex-col items-center justify-center h-[400px] bg-red-50 dark:bg-red-950/10 rounded-md border border-red-200 dark:border-red-800">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-xl text-red-700 dark:text-red-400 font-semibold mb-2">Failed to Load Listings</p>
              <p className="text-sm text-red-600 dark:text-red-500 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-lg" />)}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 col-span-full flex flex-col items-center justify-center h-[400px] bg-muted/20 rounded-md border border-dashed">
              <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground font-semibold">No listings found matching your criteria.</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or check back later.</p>
              <Button variant="link" asChild className="mt-4 text-brand-dark-blue hover:text-brand-sky-blue">
                <Link href="/marketplace">Clear all filters</Link>
              </Button>
            </div>
          )}
          {!isLoading && !error && totalListings > 0 && totalPages > 1 && (
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </main>
      </div>
    </div>
  );
}
