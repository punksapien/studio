
'use client';

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, ShieldCheck, CheckCircle2, Eye, Search, LayoutDashboard, ExternalLink } from "lucide-react";
import type { User, Inquiry } from "@/lib/types";
import { sampleUsers, sampleBuyerInquiries } from "@/lib/placeholder-data";
import { useCurrentUser } from "@/hooks/use-current-user"; // Using new cached hook
import { NobridgeIcon } from "@/components/ui/nobridge-icon";

// Helper to format timestamp
function FormattedTimestamp({ timestamp }: { timestamp: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (timestamp) {
      const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
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
  const { user, profile, loading } = useCurrentUser(); // Using the new cached hook

  const [recentInquiries, setRecentInquiries] = React.useState<Inquiry[]>([]);
  const [activeInquiriesCount, setActiveInquiriesCount] = React.useState(0);

  React.useEffect(() => {
    if (profile && profile.role === 'buyer') {
      // Simulate fetching inquiries for the current buyer
      const userInquiries = sampleBuyerInquiries
        .filter(inq => inq.buyerId === profile.id)
        .sort((a, b) => new Date(b.inquiryTimestamp).getTime() - new Date(a.inquiryTimestamp).getTime());
      
      setRecentInquiries(userInquiries.slice(0, 3));
      setActiveInquiriesCount(
        userInquiries.filter(inq =>
          inq.statusBuyerPerspective !== 'Archived' &&
          inq.statusBuyerPerspective !== 'Connection Facilitated - Chat Open' // Assuming this means "closed" for active count
        ).length
      );
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="container py-8 text-center min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    // This should be handled by middleware, but as a fallback:
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


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue font-heading">
            Welcome back, {profile.full_name}!
          </h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your buyer activity.</p>
        </div>
        <Button variant="outline" asChild className="border-brand-dark-blue/50 text-brand-dark-blue hover:bg-brand-light-gray/70">
          <Link href="/marketplace">
            <Search className="mr-2 h-4 w-4" /> Explore Marketplace
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Active Inquiries</CardTitle>
            <NobridgeIcon icon="interaction" size="sm" className="text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeInquiriesCount}</div>
            <p className="text-xs text-muted-foreground">
              Track your ongoing conversations and interests.
            </p>
             <Button variant="link" asChild className="px-0 mt-2 text-brand-sky-blue">
                <Link href="/dashboard/inquiries">View All My Inquiries</Link>
              </Button>
          </CardContent>
        </Card>

        <Card className={`shadow-lg ${profile.verificationStatus === 'verified' ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Verification Status</CardTitle>
             <NobridgeIcon icon="verification" size="sm" className={`${profile.verificationStatus === 'verified' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profile.verificationStatus === 'verified' ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {profile.verificationStatus === 'verified' ? 'Verified Buyer' :
               profile.verificationStatus === 'pending_verification' ? 'Verification Pending' :
               'Anonymous Buyer'}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.verificationStatus === 'verified'
                ? 'Access full details & engage with verified sellers.'
                : 'Complete verification to unlock more features.'}
            </p>
            {profile.verificationStatus !== 'verified' && (
              <Button variant="link" asChild className="px-0 mt-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                <Link href="/dashboard/verification">
                  {profile.verificationStatus === 'pending_verification' ? 'Check Verification Status' : 'Request Verification Call'}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {recentInquiries.length > 0 && (
        <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue font-heading">Recent Inquiries</CardTitle>
            <CardDescription className="text-muted-foreground">Your latest interactions with business listings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentInquiries.map(inquiry => (
              <div key={inquiry.id} className="p-4 border border-brand-light-gray rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div>
                    <Link href={`/listings/${inquiry.listingId}`} className="font-semibold text-brand-dark-blue hover:text-brand-sky-blue text-lg transition-colors">
                      {inquiry.listingTitleAnonymous}
                    </Link>
                    <p className="text-xs text-muted-foreground">Inquired on: <FormattedTimestamp timestamp={inquiry.inquiryTimestamp} /></p>
                  </div>
                   <Button variant="ghost" size="sm" asChild className="text-brand-sky-blue hover:text-brand-sky-blue/80">
                    <Link href={`/dashboard/inquiries#${inquiry.id}`}><Eye className="mr-2 h-4 w-4" />View Inquiry</Link>
                  </Button>
                </div>
                <p className="text-sm mt-2 text-brand-dark-blue/80">Status: <span className="font-medium">{inquiry.statusBuyerPerspective}</span></p>
              </div>
            ))}
             <Button variant="outline" asChild className="w-full mt-6 border-brand-dark-blue/50 text-brand-dark-blue hover:bg-brand-light-gray/70">
                <Link href="/dashboard/inquiries">View All My Inquiries</Link>
              </Button>
          </CardContent>
        </Card>
      )}
       {profile.verificationStatus === 'anonymous' && (
        <Card className="shadow-md bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary flex items-center font-heading"><CheckCircle2 className="mr-2"/> Unlock Full Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Become a Verified Buyer to view detailed business information, access secure documents, and directly engage with sellers through Nobridge.
            </p>
            <Button asChild className="bg-brand-sky-blue text-brand-white hover:bg-brand-sky-blue/90">
              <Link href="/dashboard/verification">Start Verification Process</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    