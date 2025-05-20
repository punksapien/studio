
import { ListingCard } from '@/components/marketplace/listing-card';
// Removed Filters and SortDropdown imports as they are not used here anymore
// Removed PaginationControls import
import { sampleListings } from '@/lib/placeholder-data';
import type { Listing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Simulate fetching data. For landing page, we show a fixed number of listings.
async function getPreviewListings(limit: number = 6): Promise<{ listings: Listing[] }> {
  // Simulate API call delay for realism if needed, but for preview it's often instant
  // await new Promise(resolve => setTimeout(resolve, 300)); 
  const previewListings = sampleListings.slice(0, limit);
  return { listings: previewListings };
}

export default async function HomePage({
  searchParams, // Kept for consistency, though not used for pagination on landing anymore
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { listings: previewListings } = await getPreviewListings(6); // Fetch 6 listings for preview

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
              {/* Updated href to point to the new marketplace page */}
              <Link href="/marketplace">Browse Listings</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/register/seller">List Your Business</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Marketplace Preview Section */}
      <div id="marketplace-preview" className="container py-8 md:py-12">
        <div className="mb-8 text-center"> {/* Removed SortDropdown, centered title */}
          <h2 className="text-3xl font-semibold tracking-tight">Featured Business Listings</h2>
          <p className="text-muted-foreground mt-2">A Glimpse into Our Marketplace</p>
        </div>

        {/* Removed Filters sidebar and main/aside structure for preview */}
        {previewListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No featured listings available at the moment.</p>
          </div>
        )}
        {/* Removed PaginationControls */}
        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/marketplace">Explore Full Marketplace</Link>
          </Button>
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
