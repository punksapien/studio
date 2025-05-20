
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sampleListings, sampleUsers } from "@/lib/placeholder-data"; 
import type { Listing, User } from "@/lib/types";
import Image from "next/image";
import { PlusCircle, Edit3, Trash2, Eye, ShieldCheck, AlertTriangle, MessageSquare, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Placeholder for current seller - in a real app, this would come from session/auth
const currentSellerId = 'user1'; // Or 'user3' to test anonymous seller
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentSellerId && u.role === 'seller');

export default function ManageSellerListingsPage() {
  const { toast } = useToast();
  const sellerListings: Listing[] = sampleListings.filter(l => l.sellerId === currentUser?.id);

  const handleDeactivate = (listingId: string, listingTitle: string) => {
    console.log("Deactivating listing:", listingId);
    // Placeholder: Update listing status in backend/state
    toast({ title: "Listing Deactivated", description: `'${listingTitle}' has been deactivated.` });
  };

  const handleReactivate = (listingId: string, listingTitle: string) => {
    console.log("Reactivating listing:", listingId);
    // Placeholder: Update listing status in backend/state
    toast({ title: "Listing Reactivated", description: `'${listingTitle}' is now active.` });
  };
  
  if (!currentUser) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in as a seller to view this page.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
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

      {sellerListings.length === 0 ? (
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
          {sellerListings.map((listing) => (
            <Card key={listing.id} className="shadow-lg flex flex-col">
              <CardHeader className="relative p-0">
                 <Image
                    src={listing.imageUrl || "https://placehold.co/400x200.png"}
                    alt={listing.listingTitleAnonymous}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover rounded-t-lg"
                    data-ai-hint="business building city"
                  />
                   {listing.isSellerVerified ? (
                    <Badge className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                    ) : listing.status === 'pending_verification' ? (
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
                <CardTitle className="text-lg mb-1">{listing.listingTitleAnonymous}</CardTitle>
                <CardDescription className="text-xs mb-2">{listing.industry} - {listing.locationCityRegionGeneral}, {listing.locationCountry}</CardDescription>
                <p className="text-sm text-muted-foreground mb-1">Revenue: {listing.annualRevenueRange}</p>
                <p className="text-sm text-muted-foreground">Asking Price: {listing.askingPriceRange}</p>
                <p className="text-sm text-muted-foreground">Inquiries: {listing.inquiryCount || 0}</p>
                <Badge 
                  variant={listing.status === 'active' ? 'default' : 'secondary'}
                  className={`mt-2 ${listing.status === 'active' ? 'bg-accent text-accent-foreground' : listing.status === 'pending_verification' ? 'bg-yellow-500 text-white' :'bg-muted text-muted-foreground'}`}
                >
                  Status: {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
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
                        <Link href={`/seller-dashboard/inquiries?listingId=${listing.id}`}> {/* Conceptual link */}
                        <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" /> Inquiries ({listing.inquiryCount || 0})
                        </Link>
                    </Button>
                    {listing.status === 'active' ? (
                        <Button variant="destructive" size="sm" onClick={() => handleDeactivate(listing.id, listing.listingTitleAnonymous)}>
                            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" /> Deactivate
                        </Button>
                    ) : (
                         <Button variant="default" size="sm" onClick={() => handleReactivate(listing.id, listing.listingTitleAnonymous)}>
                            <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" /> Reactivate
                        </Button>
                    )}
                </div>
                 {!listing.isSellerVerified && listing.status !== 'pending_verification' && (
                    <Button variant="secondary" size="sm" className="w-full mt-2" asChild>
                         <Link href={`/seller-dashboard/verification?listingId=${listing.id}`}>
                            <ShieldCheck className="h-4 w-4 mr-2" /> Request Verification
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

