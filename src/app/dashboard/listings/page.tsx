import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sampleListings } from "@/lib/placeholder-data"; // Assuming current user is seller1
import type { Listing } from "@/lib/types";
import Image from "next/image";
import { Eye, ShieldCheck, AlertTriangle, Briefcase, Info } from "lucide-react";
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";

// Auth-gated segment: keep dynamic rendering (previously inherited from the root layout).
export const dynamic = 'force-dynamic';

// Filter listings for the current seller (placeholder: 'user1')
const sellerListings: Listing[] = sampleListings.filter(l => l.sellerId === 'user1');

export default function ManageListingsPage() {
  return (
    <DashboardPageShell
      title="Listings"
      description="View your business listings."
      scrollable
    >
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Managed by the Nobridge team</AlertTitle>
        <AlertDescription>
          Your listings are created and managed by the Nobridge team. Contact us to request changes.
        </AlertDescription>
      </Alert>

      {sellerListings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No listings yet.</p>
            <p className="text-sm text-muted-foreground mt-1">The Nobridge team will create your listing on your behalf.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {sellerListings.map((listing) => (
            <Card key={listing.id} className="flex flex-col">
              <CardHeader className="relative p-0">
                 <Image
                    src={listing.imageUrls?.[0] || "https://placehold.co/400x200.png"}
                    alt={listing.listingTitleAnonymous}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover"
                    data-ai-hint="business building city"
                  />
                   {listing.isSellerVerified ? (
                    <Badge className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                ) : (
                     <Badge variant="outline" className="absolute top-2 right-2 bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Awaiting Verification
                    </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg mb-1">{listing.listingTitleAnonymous}</CardTitle>
                <CardDescription className="text-xs mb-2">{listing.industry} - {listing.locationCityRegionGeneral}, {listing.locationCountry}</CardDescription>
                <p className="text-sm text-muted-foreground mb-1">Revenue: {listing.annualRevenueRange}</p>
                <p className="text-sm text-muted-foreground">Asking Price: {listing.askingPrice}</p>
                <Badge
                  variant={listing.status === 'active' ? 'default' : 'secondary'}
                  className={`mt-2 ${listing.status === 'active' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  Status: {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </Badge>
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/listings/${listing.id}`} target="_blank">
                    <Eye className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">View</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardPageShell>
  );
}
