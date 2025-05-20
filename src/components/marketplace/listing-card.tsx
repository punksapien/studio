import type { Listing } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Briefcase, ShieldCheck, ExternalLink } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const truncatedDescription = listing.anonymousBusinessDescription.length > 100 
    ? listing.anonymousBusinessDescription.substring(0, 100) + "..."
    : listing.anonymousBusinessDescription;

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0 relative">
        <Image
          src={listing.imageUrl || "https://placehold.co/400x250.png"}
          alt={listing.listingTitleAnonymous}
          width={400}
          height={250}
          className="w-full h-48 object-cover"
          data-ai-hint="business storefront building"
        />
        {listing.isSellerVerified && (
          <Badge variant="secondary" className="absolute top-2 right-2 bg-accent text-accent-foreground">
            <ShieldCheck className="h-4 w-4 mr-1" />
            Verified
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-2 leading-tight">
          <Link href={`/listings/${listing.id}`} className="hover:text-primary transition-colors">
            {listing.listingTitleAnonymous}
          </Link>
        </CardTitle>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            <span>{listing.industry}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            <span>{listing.locationCityRegionGeneral}, {listing.locationCountry}</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-primary" />
            <span>Revenue: {listing.annualRevenueRange}</span>
          </div>
          <p className="text-sm text-foreground pt-1">{truncatedDescription}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm text-muted-foreground">
            Listed: {new Date(listing.createdAt).toLocaleDateString()}
          </span>
          <Button asChild size="sm">
            <Link href={`/listings/${listing.id}`}>
              View Details <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
