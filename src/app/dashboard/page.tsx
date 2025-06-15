
'use client';

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, ShieldCheck, CheckCircle2, Eye, Search, LayoutDashboard, ExternalLink, User, Clock, AlertCircle, TrendingUp, Send, UserCircle, ListFilter, Bookmark, Inbox, UserCheck, ArrowRight, Loader2 } from "lucide-react"; // Added ArrowRight
import type { User as UserType, Inquiry, Listing } from "@/lib/types"; // Renamed User to UserType to avoid conflict
import { sampleUsers, sampleBuyerInquiries, sampleListings } from "@/lib/placeholder-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NobridgeIcon } from "@/components/ui/nobridge-icon";
import { Progress } from "@/components/ui/progress";
import { useVerificationRequest } from "@/hooks/use-verification-request";
import { VERIFICATION_CONFIG } from "@/lib/verification-config";
import { ListingCard } from "@/components/marketplace/listing-card"; // Using the actual listing card

// Helper to format timestamp
function FormattedTimestamp({ timestamp }: { timestamp: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (timestamp) {
      const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp); // Ensure it's a Date object
      if (!isNaN(dateObj.getTime())) {
        setFormattedDate(dateObj.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }));
      } else {
        setFormattedDate('Invalid Date');
      }
    } else {
      setFormattedDate('N/A');
    }
  }, [timestamp]);

  if (timestamp && !formattedDate) {
    return <span className="italic text-xs">Loading date...</span>;
  }
  return <>{formattedDate || 'N/A'}</>;
}


export default function BuyerDashboardPage() {
  const { user, profile, loading } = useCurrentUser();
  const { requests: verificationRequests, currentStatus: verificationStatus } = useVerificationRequest();

  const [recentInquiries, setRecentInquiries] = React.useState<Inquiry[]>([]);
  const [activeInquiriesCount, setActiveInquiriesCount] = React.useState(0);
  const [savedListingsCount, setSavedListingsCount] = React.useState(5); // Placeholder
  const [newMessagesCount, setNewMessagesCount] = React.useState(2); // Placeholder
  const [recommendedListings, setRecommendedListings] = React.useState<Listing[]>([]);

  React.useEffect(() => {
    if (profile && profile.role === 'buyer') {
      const userInquiries = sampleBuyerInquiries
        .filter(inq => inq.buyerId === profile.id)
        .sort((a, b) => new Date(b.inquiryTimestamp).getTime() - new Date(a.inquiryTimestamp).getTime());
      
      setRecentInquiries(userInquiries.slice(0, 2)); // Show 2 recent inquiries
      setActiveInquiriesCount(
        userInquiries.filter(inq =>
          inq.statusBuyerPerspective !== 'Archived' &&
          inq.statusBuyerPerspective !== 'Connection Facilitated - Chat Open'
        ).length
      );
      // Placeholder recommended listings logic
      setRecommendedListings(sampleListings.filter(l => l.status === 'verified_public' && l.industry !== profile.keyIndustriesOfInterest?.split(',')[0]).slice(0,2));
    }
  }, [profile]);

  const getVerificationStatusInfo = () => {
    const pendingUserRequest = verificationRequests.find(r =>
      r.request_type === 'user_verification' &&
      ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'].includes(r.status)
    );
    
    const isProfileOnboardingConsideredComplete = (profile?.onboarding_step_completed || 0) >= 2; // Buyer onboarding has 2 steps before success page

    let progress = 10; // Base for anonymous
    let progressText = "Get Started";
    let progressColor = "bg-primary";
    let title = "Become a Verified Buyer";
    let description = "Complete verification to unlock full features and gain trust with sellers.";
    let actionText = "Start Verification";
    let actionLink = "/onboarding/buyer/1";
    let icon = <User className="h-6 w-6 text-muted-foreground" />;

    if (profile?.onboarding_step_completed === 1) {
        progress = 50;
        progressText = "Step 1 of 2 Complete";
        actionLink = "/onboarding/buyer/2";
        actionText = "Continue Verification";
    }


    switch (verificationStatus) {
      case 'verified':
        progress = 100;
        progressText = "Profile 100% Verified & Optimized!";
        progressColor = "bg-green-500";
        title = 'Verified Buyer';
        description = 'Your profile is fully verified. Explore detailed listings and connect with sellers.';
        actionText = 'View My Profile';
        actionLink = '/dashboard/profile';
        icon = <CheckCircle2 className="h-6 w-6 text-green-500" />;
        break;
      case 'pending_verification':
        progress = isProfileOnboardingConsideredComplete ? 75 : 50;
        progressText = isProfileOnboardingConsideredComplete ? "Verification Processing" : "Onboarding Incomplete";
        progressColor = "bg-yellow-500";
        title = 'Verification Pending';
        description = pendingUserRequest ?
            `Your verification request is ${pendingUserRequest.status.toLowerCase()}. ${pendingUserRequest.can_bump ? 'You can bump it to the top!' : (pendingUserRequest.hours_until_can_bump && pendingUserRequest.hours_until_can_bump > 0) ? `You can bump it in ${VERIFICATION_CONFIG.formatTimeRemaining(pendingUserRequest.hours_until_can_bump)}.` : ''}` :
            'Your profile verification is being reviewed.';
        actionText = 'View Verification Status';
        actionLink = '/dashboard/verification';
        icon = <Clock className="h-6 w-6 text-yellow-500" />;
        break;
      case 'rejected':
        progress = isProfileOnboardingConsideredComplete ? 25 : 10;
        progressText = 'Verification Rejected';
        progressColor = 'bg-red-500';
        title = 'Verification Action Required';
        description = 'There was an issue with your verification. Please review and resubmit.';
        actionText = 'Update Verification';
        actionLink = '/onboarding/buyer/1'; // Restart onboarding
        icon = <AlertCircle className="h-6 w-6 text-red-500" />;
        break;
      default: // anonymous or unverified
        if (profile?.is_onboarding_completed && (profile.onboarding_step_completed || 0) >= 2) {
             // Should have transitioned to pending or other status. If not, likely error or needs manual request.
            progress = 50;
            progressText = "Request Verification";
            title = "Request Profile Verification";
            description = "You've completed the onboarding steps. Submit your request for admin review.";
            actionText = "Go to Verification Page";
            actionLink = "/dashboard/verification"; // where they can formally submit
        }
        break;
    }

    return { icon, title, description, actionText, actionLink, progress, progressColor, progressText, showButton: true };
  };


  if (loading) {
    return (
      <div className="container py-8 text-center min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in to view this page.</p>
        <Button asChild className="mt-4"><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }
  
  if (profile.role !== 'buyer') {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-destructive">Incorrect Role</h1>
        <p className="text-muted-foreground">This dashboard is for buyers. Your role is: {profile.role}</p>
        <Button asChild className="mt-4"><Link href="/">Go to Homepage</Link></Button>
      </div>
    );
  }

  const verificationInfo = getVerificationStatusInfo();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue font-heading">
            Welcome back, {profile.full_name || 'Buyer'}!
          </h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your buyer activity.</p>
        </div>
        <Button variant="outline" asChild className="border-brand-dark-blue/50 text-brand-dark-blue hover:bg-brand-light-gray/70">
          <Link href="/marketplace">
            <Search className="mr-2 h-4 w-4" /> Explore Marketplace
          </Link>
        </Button>
      </div>

      {/* Verification Status Card - Enhanced */}
      <Card className={`lg:col-span-1 shadow-lg border-2 ${
        verificationStatus === 'verified' ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600' :
        verificationStatus === 'pending_verification' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600' :
        verificationStatus === 'rejected' ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600' :
        'border-primary/30 bg-primary/5'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {verificationInfo.icon}
            <CardTitle className="text-lg text-foreground font-heading">{verificationInfo.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{verificationInfo.description}</p>
          <div className="pt-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{verificationInfo.progressText}</span>
                  <span>{verificationInfo.progress}%</span>
              </div>
              <Progress value={verificationInfo.progress} className={`h-2 [&>div]:${verificationInfo.progressColor} bg-muted`} />
          </div>
          {verificationInfo.showButton && (
            <Button variant="default" size="sm" asChild className="w-full mt-3 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href={verificationInfo.actionLink}>
                {verificationInfo.actionText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Active Inquiries</CardTitle>
            <NobridgeIcon icon="interaction" size="sm" className="text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeInquiriesCount}</div>
            <p className="text-xs text-muted-foreground">Track your ongoing interests.</p>
             <Button variant="link" size="sm" asChild className="px-0 mt-1 text-brand-sky-blue text-xs">
                <Link href="/dashboard/inquiries">View All Inquiries <ArrowRight className="ml-1 h-3 w-3"/></Link>
              </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Saved Listings</CardTitle>
            <Bookmark className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{savedListingsCount}</div>
            <p className="text-xs text-muted-foreground">Your shortlisted opportunities.</p>
             <Button variant="link" size="sm" asChild className="px-0 mt-1 text-brand-sky-blue text-xs">
                <Link href="/dashboard/saved-listings">View Saved Listings <ArrowRight className="ml-1 h-3 w-3"/></Link>
              </Button>
          </CardContent>
        </Card>
         <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">New Messages</CardTitle>
            <Inbox className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{newMessagesCount}</div>
            <p className="text-xs text-muted-foreground">Unread messages from sellers.</p>
             <Button variant="link" size="sm" asChild className="px-0 mt-1 text-brand-sky-blue text-xs">
                <Link href="/dashboard/messages">Go to Messages <ArrowRight className="ml-1 h-3 w-3"/></Link>
              </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue font-heading">Recent Inquiries</CardTitle>
            <CardDescription className="text-muted-foreground">Your latest interactions with business listings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentInquiries.length > 0 ? recentInquiries.map(inquiry => (
              <div key={inquiry.id} className="p-3 border border-brand-light-gray rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div>
                    <Link href={`/listings/${inquiry.listingId}`} className="font-semibold text-brand-dark-blue hover:text-brand-sky-blue text-md transition-colors">
                      {inquiry.listingTitleAnonymous}
                    </Link>
                    <p className="text-xs text-muted-foreground">Inquired on: <FormattedTimestamp timestamp={inquiry.inquiryTimestamp} /></p>
                  </div>
                   <Button variant="ghost" size="sm" asChild className="text-brand-sky-blue hover:text-brand-sky-blue/80 text-xs self-start sm:self-center">
                    <Link href={`/dashboard/inquiries#${inquiry.id}`}><Eye className="mr-1.5 h-3.5 w-3.5" />View</Link>
                  </Button>
                </div>
                <p className="text-sm mt-1 text-brand-dark-blue/80">Status: <span className="font-medium">{inquiry.statusBuyerPerspective}</span></p>
              </div>
            )) : (
                 <div className="text-center py-6 text-muted-foreground">
                    <Inbox className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                    No recent inquiries.
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-md bg-brand-white">
            <CardHeader>
                <CardTitle className="text-brand-dark-blue font-heading flex items-center"><UserCheck className="mr-2 h-5 w-5 text-primary"/>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/marketplace"><Search className="mr-2 h-4 w-4"/>Find New Opportunities</Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/dashboard/profile"><UserCircle className="mr-2 h-4 w-4"/>Complete Your Profile</Link>
                </Button>
                 <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/dashboard/inquiries"><MessageSquare className="mr-2 h-4 w-4"/>Manage My Inquiries</Link>
                </Button>
            </CardContent>
        </Card>
      </div>

        <Card className="shadow-md bg-brand-white">
            <CardHeader>
                <CardTitle className="text-brand-dark-blue font-heading flex items-center"><ListFilter className="mr-2 h-5 w-5 text-primary" />Recommended For You</CardTitle>
                <CardDescription className="text-muted-foreground">Listings you might be interested in based on your profile.</CardDescription>
            </CardHeader>
            <CardContent>
                {recommendedListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {recommendedListings.map(listing => (
                          <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-8 text-muted-foreground">
                        <Search className="mx-auto h-10 w-10 mb-3 text-gray-400" />
                        No recommendations available yet. Complete your profile for better suggestions.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
