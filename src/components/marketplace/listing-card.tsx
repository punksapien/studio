'use client';

import * as React from "react";
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Briefcase, CheckCircle2, ExternalLink, TrendingUp } from 'lucide-react'; // Replaced ShieldCheck with CheckCircle2
import { NobridgeIcon } from '@/components/ui/nobridge-icon';

interface ApiListing {
  id: string;
  title: string;
  short_description: string;
  asking_price?: number;
  industry: string;
  location_country: string;
  location_city: string;
  verification_status: string;
  images?: string[];
  annual_revenue_range?: string;
  verified_annual_revenue?: number;
  created_at: string;
}

interface ListingCardProps {
  listing: ApiListing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const truncatedDescription = listing.short_description && listing.short_description.length > 100
    ? listing.short_description.substring(0, 100) + "..."
    : listing.short_description || 'No description available';

  const displayPrice = listing.asking_price ? `$${listing.asking_price.toLocaleString()} USD` : 'Contact for Price';

  const formatRevenueDisplay = (listing: ApiListing): string => {
    if (typeof listing.verified_annual_revenue === 'number' && listing.verified_annual_revenue > 0) {
      return `$${listing.verified_annual_revenue.toLocaleString()} USD (Verified)`;
    }
    if (listing.annual_revenue_range) {
      return listing.annual_revenue_range;
    }
    return 'N/A';
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-brand-white">
      <CardHeader className="p-0 relative">
        <Image
          src={
            listing.images
              ? (typeof listing.images === 'string'
                  ? JSON.parse(listing.images)[0]
                  : listing.images[0]) || "https://placehold.co/400x250.png"
              : "https://placehold.co/400x250.png"
          }
          alt={listing.title}
          width={400}
          height={250}
          className="w-full h-48 object-cover"
          data-ai-hint={listing.images ? (listing.industry ? listing.industry.toLowerCase().replace(/\s+/g, '-') : "business") : "generic business"}
        />
        {listing.verification_status === 'verified' && (
          <Badge variant="outline" className="absolute top-2 right-2 bg-green-100 border-green-500 text-green-700 dark:bg-green-700 dark:text-green-200 dark:border-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified Seller
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg text-brand-dark-blue mb-2 leading-tight">
          <Link href={`/listings/${listing.id}`} className="hover:text-brand-sky-blue transition-colors">
            {listing.title}
          </Link>
        </CardTitle>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-brand-dark-blue/70" />
            <span>{listing.industry}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-brand-dark-blue/70" />
            <span>{listing.location_city}, {listing.location_country}</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-brand-dark-blue/70" />
            <span>Revenue: {formatRevenueDisplay(listing)}</span>
          </div>
            <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-brand-dark-blue/70" />
                <span>Asking Price: {displayPrice}</span>
            </div>
          <p className="text-sm text-brand-dark-blue/90 pt-1">{truncatedDescription}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t border-brand-light-gray/80">
        <div className="flex justify-end items-center w-full">

          <Button asChild size="sm" className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
            <Link href={`/listings/${listing.id}`}>
              View Details <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

