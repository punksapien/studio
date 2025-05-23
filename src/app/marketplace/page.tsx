
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { ListingCard } from '@/components/marketplace/listing-card';
import { Filters } from '@/components/marketplace/filters';
import { SortDropdown } from '@/components/marketplace/sort-dropdown';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { sampleListings } from '@/lib/placeholder-data';
import type { Listing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { SlidersHorizontal, Briefcase } from 'lucide-react';

// Simulate fetching data for the full marketplace with pagination
async function getPaginatedListings(page: number = 1, limit: number = 9): Promise<{ listings: Listing[], totalPages: number, totalListings: number }> {
  await new Promise(resolve => setTimeout(resolve, 300)); 
  
  const totalListings = sampleListings.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedListings = sampleListings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalListings / limit);
  return { listings: paginatedListings, totalPages, totalListings };
}

export default function MarketplacePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalListings, setTotalListings] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Placeholder for authentication - in a real app, use Clerk's useAuth hook
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true for dev
  const [authLoading, setAuthLoading] = useState(false); // Simulate auth check loading

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
    if (authLoading || !isAuthenticated) return; // Don't fetch if auth is loading or not authenticated

    setIsLoading(true);
    const pageQuery = searchParams.get('page');
    const page = pageQuery ? parseInt(pageQuery, 10) : 1;
    setCurrentPage(page);

    getPaginatedListings(page).then(data => {
      setListings(data.listings);
      setTotalPages(data.totalPages);
      setTotalListings(data.totalListings);
      setIsLoading(false);
    }).catch(error => {
      console.error("Failed to fetch listings:", error);
      setIsLoading(false);
    });
  }, [searchParams, authLoading, isAuthenticated]);

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
          {isLoading ? (
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
          {!isLoading && totalListings > 0 && totalPages > 1 && (
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </main>
      </div>
    </div>
  );
}
