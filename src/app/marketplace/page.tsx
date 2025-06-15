'use client';

import { useEffect, useState, Suspense } from 'react';
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
import { useMarketplaceFilters } from '@/hooks/use-marketplace-filters';

// Real API function to fetch marketplace listings with filters and pagination
async function getMarketplaceListings(
  apiParams: Record<string, string>
): Promise<{ listings: any[], totalPages: number, totalListings: number }> {
  const searchParams = new URLSearchParams(apiParams);
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

function MarketplaceContent() {
  const { toast } = useToast();

  // Use our new centralized filter hook
  const {
    effectiveFilters,
    setPage,
    getAPIParams,
    isLoading,
    setIsLoading,
    hasActiveFilters
  } = useMarketplaceFilters();

  const [listings, setListings] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalListings, setTotalListings] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication can be added later - for now allow public access
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Simulate auth check - can be enhanced later
    // setAuthLoading(true);
    // const authStatus = true; // Replace with actual auth check
    // setIsAuthenticated(authStatus);
    // setAuthLoading(false);
  }, []);

  // Fetch listings whenever effective filters change
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchListings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiParams = getAPIParams();
        const data = await getMarketplaceListings(apiParams);

        setListings(data.listings);
        setTotalPages(data.totalPages);
        setTotalListings(data.totalListings);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load listings';
        setError(errorMessage);
        toast({
          title: "Error Loading Listings",
          description: "Unable to load marketplace listings. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [effectiveFilters, authLoading, isAuthenticated, getAPIParams, setIsLoading, toast]);

  const handlePageChange = (page: number) => {
    setPage(page);
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
            {hasActiveFilters && !isLoading && (
              <span className="ml-2 text-brand-sky-blue">
                (Filtered results)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="md:hidden flex-grow">
             <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 bg-brand-sky-blue text-white text-xs rounded-full px-2 py-1">
                      Active
                    </span>
                  )}
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
            <PaginationControls
              currentPage={effectiveFilters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
