
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { ListingCard } from '@/components/marketplace/listing-card';
import { Filters } from '@/components/marketplace/filters';
import { SortDropdown } from '@/components/marketplace/sort-dropdown';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { sampleListings } from '@/lib/placeholder-data'; // Direct import for simplicity
import type { Listing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Simulate fetching data. In a real app, this would be an API call or DB query.
async function getFullListings(page: number = 1, limit: number = 9): Promise<{ listings: Listing[], totalPages: number, totalListings: number }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  const totalListings = sampleListings.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedListings = sampleListings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalListings / limit);
  return { listings: paginatedListings, totalPages, totalListings };
}

export default function MarketplacePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null for loading state
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalListings, setTotalListings] = useState(0);

  useEffect(() => {
    // Simulate auth check
    const authStatus = false; // TODO: Replace with actual auth check (e.g., from Clerk's useAuth())
    setIsAuthenticated(authStatus);

    if (authStatus === false) { // Explicitly check for false after initial load
      router.push('/auth/login?redirect=/marketplace');
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated === true) { // Only fetch if authenticated
      setIsLoading(true);
      const params = new URLSearchParams(window.location.search);
      const pageQuery = params.get('page');
      const page = pageQuery ? parseInt(pageQuery, 10) : 1;
      setCurrentPage(page);

      getFullListings(page).then(data => {
        setListings(data.listings);
        setTotalPages(data.totalPages);
        setTotalListings(data.totalListings);
        setIsLoading(false);
      });
    }
  }, [isAuthenticated]); // Re-run when auth status is confirmed


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    router.push(`/marketplace?page=${page}`, { scroll: false }); // Update URL
    // Fetching will be triggered by the isAuthenticated & currentPage useEffect
     getFullListings(page).then(data => {
        setListings(data.listings);
        setTotalPages(data.totalPages);
        setTotalListings(data.totalListings);
        setIsLoading(false);
      });
  };

  if (isAuthenticated === null) {
    // Optional: Show a loading spinner while checking auth
    return (
        <div className="container py-8 md:py-12">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <aside className="md:col-span-3">
                    <Skeleton className="h-[500px] w-full" />
                </aside>
                <main className="md:col-span-9">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                    </div>
                </main>
            </div>
        </div>
    );
  }
  
  if (!isAuthenticated) {
    // User will be redirected, but we can show a message or loader
    return <div className="container py-12 text-center"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Business Marketplace</h1>
          <p className="text-muted-foreground">Explore all available business opportunities. Found {totalListings} listings.</p>
        </div>
        <SortDropdown />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <aside className="md:col-span-3 md:sticky md:top-24 h-fit">
          <Filters />
        </aside>
        <main className="md:col-span-9">
          {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 col-span-full">
              <p className="text-xl text-muted-foreground">No listings found.</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/marketplace">Clear filters</Link>
              </Button>
            </div>
          )}
          {!isLoading && totalPages > 1 && (
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </main>
      </div>
    </div>
  );
}
