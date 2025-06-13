
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { PlusCircle, Edit3, Trash2, Eye, ShieldCheck, AlertTriangle, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NobridgeIcon } from "@/components/ui/nobridge-icon"; // Import NobridgeIcon

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

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
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
        method: 'PATCH', // Should be PATCH for partial updates like status
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }), // Assuming 'inactive' is the correct status
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <Skeleton className="h-9 w-64 rounded-md" />
          <Skeleton className="h-10 w-48 mt-4 md:mt-0 rounded-md" />
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-lg flex flex-col bg-card rounded-lg">
              <CardHeader className="p-0">
                <Skeleton className="w-full h-40 rounded-t-lg" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-4 w-1/3 rounded" />
              </CardContent>
              <CardFooter className="p-4 border-t border-border">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Skeleton className="h-8 rounded-md" />
                  <Skeleton className="h-8 rounded-md" />
                  <Skeleton className="h-8 rounded-md" />
                  <Skeleton className="h-8 rounded-md" />
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">My Business Listings</h1>
        {/* "Create New Listing" button is in the sidebar and empty state card, removed from header */}
      </div>

      {listings.length === 0 ? (
        <Card className="shadow-lg text-center py-12 md:py-20 bg-card border border-dashed border-border rounded-lg">
          <CardContent className="flex flex-col items-center">
            <NobridgeIcon icon="business-listing" size="xl" className="mb-6 text-muted-foreground opacity-70" />
            <h2 className="text-2xl font-semibold text-foreground mb-2 font-heading">No Listings Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Showcase your business to motivated buyers. Create your first listing to get started.
            </p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/seller-dashboard/listings/create">
                <PlusCircle className="mr-2 h-5 w-5" /> Create First Listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="shadow-lg flex flex-col bg-card rounded-lg overflow-hidden transition-all hover:shadow-xl">
              <CardHeader className="relative p-0">
                 <Image
                    src={listing.images?.[0] || "https://placehold.co/400x200.png"}
                    alt={listing.title}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover" // Consistent image height
                    data-ai-hint="business building city"
                  />
                   {listing.verification_status === 'verified' ? (
                    <Badge className="absolute top-3 right-3 bg-green-100 text-green-700 border-green-300 dark:bg-green-700/20 dark:text-green-300">
                        <ShieldCheck className="h-3 w-3 mr-1.5" /> Verified
                    </Badge>
                    ) : listing.verification_status === 'pending' ? (
                    <Badge variant="outline" className="absolute top-3 right-3 bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/20 dark:text-yellow-300">
                        <AlertTriangle className="h-3 w-3 mr-1.5" /> Pending Verification
                    </Badge>
                    ) : (
                    <Badge variant="outline" className="absolute top-3 right-3 bg-muted text-muted-foreground border-border">
                        <AlertTriangle className="h-3 w-3 mr-1.5" /> Anonymous
                    </Badge>
                )}
              </CardHeader>
              <CardContent className="p-5 flex-grow space-y-2">
                <CardTitle className="text-lg font-semibold text-foreground font-heading leading-tight hover:text-primary transition-colors">
                  <Link href={`/listings/${listing.id}`} target="_blank" title={`View public page for ${listing.title}`}>
                    {listing.title}
                  </Link>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-2">{listing.industry} - {listing.location_city}, {listing.location_country}</CardDescription>
                <p className="text-sm text-muted-foreground">Revenue: {listing.annual_revenue_range || 'Not specified'}</p>
                <p className="text-sm text-muted-foreground">Asking Price: ${listing.asking_price?.toLocaleString() || 'Not specified'}</p>
                <p className="text-xs text-muted-foreground">Created: {new Date(listing.created_at).toLocaleDateString()}</p>
                <Badge
                  variant={listing.status === 'active' || listing.status === 'verified_public' || listing.status === 'verified_anonymous' ? 'default' : 'secondary'}
                  className={`mt-2 text-xs ${listing.status === 'active' || listing.status === 'verified_public' || listing.status === 'verified_anonymous' ? 'bg-accent text-accent-foreground' : listing.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-300' :'bg-muted text-muted-foreground'}`}
                >
                  Status: {listing.status.charAt(0).toUpperCase() + listing.status.slice(1).replace(/_/g, ' ')}
                </Badge>
              </CardContent>
              <CardFooter className="p-4 border-t border-border bg-muted/30">
                <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" size="sm" asChild className="border-input hover:bg-accent/50 hover:text-accent-foreground">
                        <Link href={`/listings/${listing.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Public View</span>
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="border-input hover:bg-accent/50 hover:text-accent-foreground">
                        <Link href={`/seller-dashboard/listings/${listing.id}/edit`}>
                        <Edit3 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="border-input hover:bg-accent/50 hover:text-accent-foreground">
                        <Link href={`/seller-dashboard/inquiries?listingId=${listing.id}`}>
                        <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" /> Inquiries
                        </Link>
                    </Button>
                    {listing.status === 'active' || listing.status === 'verified_public' || listing.status === 'verified_anonymous' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivate(listing.id, listing.title)}
                          disabled={isUpdating === listing.id}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                           variant="outline"
                           size="sm"
                           onClick={() => handleReactivate(listing.id, listing.title)}
                           disabled={isUpdating === listing.id}
                           className="border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-700"
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
                    <Button variant="secondary" size="sm" className="w-full mt-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-700/20 dark:text-yellow-300" asChild>
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
