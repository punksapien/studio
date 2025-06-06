'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, MessageSquare, PlusCircle, ShieldCheck, CheckCircle2, Bell, Edit3, Loader2 } from "lucide-react";
import { useSellerDashboard } from "@/hooks/use-seller-dashboard";
import { VerificationRequestModal } from "@/components/verification/verification-request-modal";

export default function SellerDashboardPage() {
  const { user, stats, recentListings, isLoading, error } = useSellerDashboard()

  if (error) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Error Loading Dashboard</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in as a seller to view this page.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }

  // Filter listings for the recent listings section (same logic as original)
  const activeListingsForSection = recentListings.filter(l =>
    l.status === 'active' || l.status === 'verified_anonymous' || l.status === 'verified_with_financials'
  );

  // Prepare listings for verification modal
  const userListingsForVerification = recentListings.map(l => ({
    id: l.id,
    listing_title_anonymous: l.title,
    status: l.status
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.fullName}!</h1>
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
            <div className="text-2xl font-bold">{stats.activeListingsCount}</div>
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
            <div className="text-2xl font-bold">{stats.totalInquiriesReceived}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inquiriesAwaitingEngagement > 0 ? `${stats.inquiriesAwaitingEngagement} new inquiries awaiting your engagement.` : 'All inquiries viewed.'}
            </p>
             <Button variant="link" asChild className="px-0 mt-2">
                <Link href="/seller-dashboard/inquiries">View All Inquiries</Link>
              </Button>
          </CardContent>
        </Card>

        <Card className={`shadow-lg ${stats.verificationStatus === 'verified' ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
            <ShieldCheck className={`h-5 w-5 ${stats.verificationStatus === 'verified' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.verificationStatus === 'verified' ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {stats.verificationStatus === 'verified' ? 'Verified Seller' :
               stats.verificationStatus === 'pending_verification' ? 'Verification Pending' :
               'Anonymous Seller'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.verificationStatus === 'verified'
                ? 'Your profile and listings (if verified) show full details to verified buyers.'
                : 'Verify your profile and listings to attract serious buyers.'}
            </p>
            {stats.verificationStatus !== 'verified' && (
              <VerificationRequestModal userListings={userListingsForVerification}>
                <Button variant="link" className="px-0 mt-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                  {stats.verificationStatus === 'pending_verification' ? 'Check Verification Status' : 'Request Verification'}
                </Button>
              </VerificationRequestModal>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Active Listings Section - ALWAYS show this section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recent Active Listings</CardTitle>
          <CardDescription>A quick look at your latest active businesses for sale.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeListingsForSection.length > 0 ? (
            // Show listings if available
            <>
              {activeListingsForSection.slice(0, 3).map(listing => (
                <div key={listing.id} className="p-3 border rounded-md hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/listings/${listing.id}`} target="_blank" className="font-medium text-primary hover:underline">
                        {listing.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Inquiries: {listing.inquiry_count || 0} | Status: <span className="font-medium">{listing.status}</span>
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/seller-dashboard/listings/${listing.id}/edit`}><Edit3 className="mr-2 h-4 w-4" />Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            // Show empty state when no listings
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No active listings yet. Create your first listing to get started!</p>
              <Button asChild>
                <Link href="/seller-dashboard/listings/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Listing
                </Link>
              </Button>
            </div>
          )}
          <Button variant="outline" asChild className="w-full mt-4">
            <Link href="/seller-dashboard/listings">Manage All Listings</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Verification Prompt Section - Show for anonymous sellers (regardless of listing count) */}
      {stats.verificationStatus === 'anonymous' && (
        <Card className="shadow-md bg-primary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary flex items-center"><CheckCircle2 className="mr-2"/> Unlock Full Potential for Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {stats.activeListingsCount > 0
                ? 'Get your listings verified to attract serious buyers and enable them to view full business details. Verified listings gain more trust and visibility.'
                : 'Get verified to attract serious buyers when you create listings. Verified sellers gain more trust and visibility.'
              }
            </p>
            <VerificationRequestModal userListings={userListingsForVerification}>
              <Button>Request Verification</Button>
            </VerificationRequestModal>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
