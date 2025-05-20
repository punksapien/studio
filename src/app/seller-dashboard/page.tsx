
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, MessageSquare, PlusCircle, ShieldCheck, CheckCircle2, Bell, Edit3 } from "lucide-react";
import type { User, Listing, Inquiry } from "@/lib/types";
import { sampleUsers, sampleListings, sampleSellerInquiries } from "@/lib/placeholder-data";

// Placeholder data - replace with actual user data fetched based on auth
// For Seller Dashboard V1, assuming current user is user1 (John Doe - Verified Seller)
// or user3 (Alex Tan - Anonymous Seller)
const currentSellerId = 'user3'; // Change to 'user1' to see verified state
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentSellerId && u.role === 'seller');

const sellerListings: Listing[] = sampleListings.filter(l => l.sellerId === currentUser?.id);
const activeListingsCount = sellerListings.filter(l => l.status === 'active').length;

const recentInquiries: Inquiry[] = sampleSellerInquiries
  .filter(inq => inq.sellerId === currentUser?.id)
  .sort((a, b) => new Date(b.inquiryTimestamp).getTime() - new Date(a.inquiryTimestamp).getTime())
  .slice(0, 3);
const totalInquiriesReceived = sampleSellerInquiries.filter(inq => inq.sellerId === currentUser?.id).length;
const inquiriesAwaitingEngagement = sampleSellerInquiries.filter(inq => 
    inq.sellerId === currentUser?.id && 
    inq.statusSellerPerspective === 'New Inquiry'
).length;


export default function SellerDashboardPage() {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {currentUser.fullName}!</h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your seller activity.</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/seller-dashboard/listings/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Listing
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeListingsCount}</div>
            <p className="text-xs text-muted-foreground">
              Manage your businesses for sale.
            </p>
             <Button variant="link" asChild className="px-0 mt-2">
                <Link href="/seller-dashboard/listings">View All My Listings</Link>
              </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries Received</CardTitle>
            <MessageSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInquiriesReceived}</div>
            <p className="text-xs text-muted-foreground">
              {inquiriesAwaitingEngagement > 0 ? `${inquiriesAwaitingEngagement} new inquiries awaiting your engagement.` : 'All inquiries viewed.'}
            </p>
             <Button variant="link" asChild className="px-0 mt-2">
                <Link href="/seller-dashboard/inquiries">View All Inquiries</Link>
              </Button>
          </CardContent>
        </Card>

        <Card className={`shadow-lg ${currentUser.verificationStatus === 'verified' ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
            <ShieldCheck className={`h-5 w-5 ${currentUser.verificationStatus === 'verified' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentUser.verificationStatus === 'verified' ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {currentUser.verificationStatus === 'verified' ? 'Verified Seller' : 
               currentUser.verificationStatus === 'pending_verification' ? 'Verification Pending' :
               'Anonymous Seller'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentUser.verificationStatus === 'verified' 
                ? 'Your profile and listings (if verified) show full details to verified buyers.' 
                : 'Verify your profile and listings to attract serious buyers.'}
            </p>
            {currentUser.verificationStatus !== 'verified' && (
              <Button variant="link" asChild className="px-0 mt-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                <Link href="/seller-dashboard/verification">
                  {currentUser.verificationStatus === 'pending_verification' ? 'Check Verification Status' : 'Request Verification Call'}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {sellerListings.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Active Listings</CardTitle>
            <CardDescription>A quick look at your latest active businesses for sale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sellerListings.filter(l => l.status === 'active').slice(0, 3).map(listing => (
              <div key={listing.id} className="p-3 border rounded-md hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/listings/${listing.id}`} target="_blank" className="font-medium text-primary hover:underline">
                      {listing.listingTitleAnonymous}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Inquiries: {listing.inquiryCount || 0} | Status: <span className="font-medium">{listing.status}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/seller-dashboard/listings/${listing.id}/edit`}><Edit3 className="mr-2 h-4 w-4" />Edit</Link>
                  </Button>
                </div>
              </div>
            ))}
             <Button variant="outline" asChild className="w-full mt-4">
                <Link href="/seller-dashboard/listings">Manage All Listings</Link>
              </Button>
          </CardContent>
        </Card>
      )}

       {currentUser.verificationStatus === 'anonymous' && activeListingsCount > 0 && (
        <Card className="shadow-md bg-primary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary flex items-center"><CheckCircle2 className="mr-2"/> Unlock Full Potential for Your Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get your listings verified to attract serious buyers and enable them to view full business details. Verified listings gain more trust and visibility.
            </p>
            <Button asChild>
              <Link href="/seller-dashboard/verification">Request Verification for Listings</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
