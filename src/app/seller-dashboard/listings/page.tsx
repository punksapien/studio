'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { PlusCircle, Edit3, Trash2, Eye, ShieldCheck, AlertTriangle, MessageSquare, Briefcase, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ListingData {
  id: string;
  title: string;
  short_description: string;
  asking_price: number;
  industry: string;
  location_country: string;
  location_city: string;
  established_year?: number;
  number_of_employees?: string;
  website_url?: string;
  images: string[];
  status: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
  annual_revenue_range?: string;
  net_profit_margin_range?: string;
  key_strength_1?: string;
  key_strength_2?: string;
  key_strength_3?: string;
  growth_opportunity_1?: string;
  growth_opportunity_2?: string;
  growth_opportunity_3?: string;
}

export default function ManageSellerListingsPage() {
  const { toast } = useToast();
  const { profile } = useCurrentUser();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Fetch listings on component mount
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);

        // Fetch user listings
        const listingsResponse = await fetch('/api/user/listings?limit=50&sort_by=updated_at&sort_order=desc');
        if (listingsResponse.ok) {
          const data = await listingsResponse.json();
          setListings(data.listings || []);
        } else {
          toast({
            title: "Error Loading Listings",
            description: "Failed to load your listings. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your connection.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [toast]);

  const handleDeactivate = async (listingId: string, listingTitle: string) => {
    setIsUpdating(listingId);
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }),
      });

      if (response.ok) {
        setListings(prev => prev.map(listing =>
          listing.id === listingId ? { ...listing, status: 'inactive' } : listing
        ));
        toast({
          title: "Listing Deactivated",
          description: `'${listingTitle}' has been deactivated.`
        });
      } else {
        throw new Error('Failed to deactivate listing');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleReactivate = async (listingId: string, listingTitle: string) => {
    setIsUpdating(listingId);
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });

      if (response.ok) {
        setListings(prev => prev.map(listing =>
          listing.id === listingId ? { ...listing, status: 'active' } : listing
        ));
        toast({
          title: "Listing Reactivated",
          description: `'${listingTitle}' is now active.`
        });
      } else {
        throw new Error('Failed to reactivate listing');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-lg flex flex-col">
              <CardHeader className="p-0">
                <Skeleton className="w-full h-40 rounded-t-lg" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
              <CardFooter className="p-4 border-t">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">My Business Listings</h1>
        <Button asChild>
          <Link href="/seller-dashboard/listings/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="shadow-md text-center py-12">
          <CardContent>
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No listings yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Start by creating your first business listing.</p>
            <Button asChild className="mt-6">
              <Link href="/seller-dashboard/listings/create">
                Create Listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
                        <Card key={listing.id} className="shadow-lg flex flex-col">
              <CardHeader className="relative p-0">
                 <Image
                    src={listing.images?.[0] || "https://placehold.co/400x200.png"}
                    alt={listing.title}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover rounded-t-lg"
                    data-ai-hint="business building city"
                  />
                   {listing.verification_status === 'verified' ? (
                    <Badge className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                    ) : listing.verification_status === 'pending' ? (
                    <Badge variant="outline" className="absolute top-2 right-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Pending Verification
                    </Badge>
                    ) : (
                    <Badge variant="outline" className="absolute top-2 right-2 bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Anonymous
                    </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg mb-1">{listing.title}</CardTitle>
                <CardDescription className="text-xs mb-2">{listing.industry} - {listing.location_city}, {listing.location_country}</CardDescription>
                <p className="text-sm text-muted-foreground mb-1">Revenue: {listing.annual_revenue_range || 'Not specified'}</p>
                <p className="text-sm text-muted-foreground">Asking Price: ${listing.asking_price?.toLocaleString() || 'Not specified'}</p>
                <p className="text-sm text-muted-foreground">Created: {new Date(listing.created_at).toLocaleDateString()}</p>
                <Badge
                  variant={listing.status === 'active' || listing.status === 'verified_public' || listing.status === 'verified_anonymous' ? 'default' : 'secondary'}
                  className={`mt-2 ${listing.status === 'active' || listing.status === 'verified_public' || listing.status === 'verified_anonymous' ? 'bg-accent text-accent-foreground' : listing.status === 'pending_verification' ? 'bg-yellow-500 text-white' :'bg-muted text-muted-foreground'}`}
                >
                  Status: {listing.status.charAt(0).toUpperCase() + listing.status.slice(1).replace('_', ' ')}
                </Badge>
              </CardContent>
              <CardFooter className="p-4 border-t flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/listings/${listing.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">View</span> Public
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/seller-dashboard/listings/${listing.id}/edit`}>
                        <Edit3 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span> Details
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/seller-dashboard/inquiries?listingId=${listing.id}`}>
                        <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" /> Inquiries
                        </Link>
                    </Button>
                    {listing.status === 'active' || listing.status === 'verified_public' || listing.status === 'verified_anonymous' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeactivate(listing.id, listing.title)}
                          disabled={isUpdating === listing.id}
                        >
                          {isUpdating === listing.id ? (
                            <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                          )}
                          Deactivate
                        </Button>
                    ) : (
                         <Button
                           variant="default"
                           size="sm"
                           onClick={() => handleReactivate(listing.id, listing.title)}
                           disabled={isUpdating === listing.id}
                         >
                           {isUpdating === listing.id ? (
                             <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                           ) : (
                             <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
                           )}
                           Reactivate
                        </Button>
                    )}
                </div>
                 {profile?.verification_status !== 'verified' && listing.verification_status !== 'pending' && (
                    <Button variant="secondary" size="sm" className="w-full mt-2" asChild>
                         <Link href="/seller-dashboard/verification">
                            <ShieldCheck className="h-4 w-4 mr-2" /> Get Verified
                        </Link>
                    </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
