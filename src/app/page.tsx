import { ListingCard } from '@/components/marketplace/listing-card';
import { Filters } from '@/components/marketplace/filters';
import { SortDropdown } from '@/components/marketplace/sort-dropdown';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { sampleListings } from '@/lib/placeholder-data';
import type { Listing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Simulate fetching data. In a real app, this would be an API call or DB query.
async function getListings(page: number = 1, limit: number = 9): Promise<{ listings: Listing[], totalPages: number }> {
  // Simulate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedListings = sampleListings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sampleListings.length / limit);
  return { listings: paginatedListings, totalPages };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const currentPage = typeof searchParams?.page === 'string' ? Number(searchParams.page) : 1;
  const { listings, totalPages } = await getListings(currentPage);

  // Placeholder function for page change handling
  const handlePageChange = (page: number) => {
    // In a real client component, this would useRouter().push(...)
    console.log("Navigate to page:", page);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Find Your Next Business Venture in Asia
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            BizMatch Asia is the premier marketplace connecting SME owners with motivated investors and buyers across the continent. Discover, inquire, and engage with verified opportunities.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild>
              <Link href="#marketplace">Browse Listings</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/register/seller">List Your Business</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Marketplace Section */}
      <div id="marketplace" className="container py-8 md:py-12">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-3xl font-semibold tracking-tight">Business Listings</h2>
          <SortDropdown />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <aside className="md:col-span-3">
            <Filters />
          </aside>
          <main className="md:col-span-9">
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">No listings found matching your criteria.</p>
              </div>
            )}
            {totalPages > 1 && (
               <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
          </main>
        </div>
      </div>

      {/* How It Works Section (Placeholder) */}
      <section id="how-it-works-sellers" className="py-16 md:py-24 bg-secondary/30">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight">How It Works for Sellers</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Easily list your business, connect with verified buyers, and navigate the sales process with expert support.
          </p>
          {/* Add more details or steps here */}
        </div>
      </section>
      <section id="how-it-works-buyers" className="py-16 md:py-24 bg-background">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight">How It Works for Buyers</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover unique investment opportunities, access detailed information on verified businesses, and engage with sellers.
          </p>
           {/* Add more details or steps here */}
        </div>
      </section>
    </>
  );
}
