
import * as React from "react";
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

  const displayPrice = listing.askingPrice ? `$${listing.askingPrice.toLocaleString()} USD` : 'Contact for Price';

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-brand-white">
      <CardHeader className="p-0 relative">
        <Image
          src={listing.imageUrls?.[0] || "https://placehold.co/400x250.png"}
          alt={listing.listingTitleAnonymous}
          width={400}
          height={250}
          className="w-full h-48 object-cover"
          data-ai-hint={listing.imageUrls?.[0] ? "business storefront building" : "generic business"}
        />
        {listing.isSellerVerified && (
          <Badge variant="outline" className="absolute top-2 right-2 bg-green-100 border-green-500 text-green-700 dark:bg-green-700 dark:text-green-200 dark:border-green-500">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Verified Seller
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg text-brand-dark-blue mb-2 leading-tight">
          <Link href={`/listings/${listing.id}`} className="hover:text-brand-sky-blue transition-colors">
            {listing.listingTitleAnonymous}
          </Link>
        </CardTitle>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-brand-dark-blue/70" />
            <span>{listing.industry}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-brand-dark-blue/70" />
            <span>{listing.locationCityRegionGeneral}, {listing.locationCountry}</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-brand-dark-blue/70" />
            <span>Revenue: {listing.annualRevenueRange}</span>
          </div>
            <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-brand-dark-blue/70" />
                <span>Asking Price: {displayPrice}</span>
            </div>
          <p className="text-sm text-brand-dark-blue/90 pt-1">{truncatedDescription}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t border-brand-light-gray/80">
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-muted-foreground">
            {listing.inquiryCount || 0} Inquiries
          </span>
          <Button asChild size="sm" className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
            <Link href={`/listings/${listing.id}`}>
              View Details <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  