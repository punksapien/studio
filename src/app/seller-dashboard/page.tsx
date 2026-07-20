
'use client'

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  FileText,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useSellerDashboard } from '@/hooks/use-seller-dashboard';
import { useVerificationRequest } from '@/hooks/use-verification-request';
import { NobridgeIcon } from '@/components/ui/nobridge-icon';
import { DashboardPageShell } from '@/components/shared/dashboard-page-shell';
import { MetricCard } from '@/components/shared/metric-card';
import { VerificationStatusBadge } from '@/components/shared/verification-status-badge';

export default function SellerDashboard() {
  const { user, stats, recentListings, isLoading, error, refreshData, isPolling } = useSellerDashboard();
  const { currentStatus: verificationStatus } = useVerificationRequest();

  // Verification is entirely team-driven now; this only powers the read-only status
  // messaging and the profile-completeness progress bar.
  const getVerificationStatusInfo = () => {
    switch (verificationStatus) {
      case 'verified':
        return {
          description: 'Your profile has been verified by our team.',
          progress: 100,
          progressColor: 'bg-green-500',
          progressText: 'Profile 100% Verified & Optimized!'
        };
      case 'pending_verification':
        return {
          description: 'Our team is reviewing your verification.',
          progress: 80,
          progressColor: 'bg-yellow-500',
          progressText: 'Profile 80% Complete (Pending Verification)'
        };
      case 'rejected':
        return {
          description: 'Your verification needs attention — our team will be in touch.',
          progress: 40,
          progressColor: 'bg-red-500',
          progressText: 'Profile Needs Attention (Verification Rejected)'
        };
      default: // anonymous
        return {
          description: "Verification is handled by the Nobridge team — we'll contact you to complete it.",
          progress: 60,
          progressColor: 'bg-primary',
          progressText: 'Profile 60% Complete (Verification Pending)'
        };
    }
  };

  const verificationInfo = getVerificationStatusInfo();

  if (isLoading) {
    return (
      <DashboardPageShell title="Overview" description="Here's an overview of your seller activity.">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  if (error) {
    return (
      <DashboardPageShell title="Overview" description="Here's an overview of your seller activity.">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h2 className="text-lg font-semibold text-destructive">Error Loading Dashboard</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={refreshData} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      scrollable
      title="Overview"
      description="Here's an overview of your seller activity."
      actions={
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isPolling && !isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
        {/* Verification Status Card */}
         <Card className={`border-2 ${
          verificationStatus === 'verified' ? 'border-green-500/50 bg-green-500/5' :
          verificationStatus === 'pending_verification' ? 'border-yellow-500/50 bg-yellow-500/5' :
          verificationStatus === 'rejected' ? 'border-red-500/50 bg-red-500/5' :
          'border-border bg-card'
        }`}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-foreground">Verification</CardTitle>
                <CardDescription className="mt-1 text-sm">
                  {verificationInfo.description}
                </CardDescription>
              </div>
              <VerificationStatusBadge status={verificationStatus} />
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <Link href="/seller-dashboard/verification">
              <Button variant="outline" size="sm">
                <ShieldCheck className="h-4 w-4 mr-2" />
                View verification status
              </Button>
            </Link>
          </CardContent>
        </Card>


        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Active Listings"
            value={stats.activeListingsCount}
            icon={FileText}
            description="Listings currently visible to buyers"
          />
          <MetricCard
            title="Total Inquiries"
            value={stats.totalInquiriesReceived}
            icon={MessageSquare}
            description="All-time inquiries received"
          />
          <MetricCard
            title="Awaiting Response"
            value={stats.inquiriesAwaitingEngagement}
            icon={AlertCircle}
            description="New inquiries needing attention"
          />
        </div>

        {/* Quick Actions & Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground font-heading">
                <NobridgeIcon icon="core-details" size="md" className="text-accent" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/seller-dashboard/listings">
                <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                  <FileText className="h-4 w-4 mr-2" />
                  View My Listings
                </Button>
              </Link>
              <Link href="/seller-dashboard/inquiries">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View All Inquiries{stats.totalInquiriesReceived > 0 ? ` (${stats.totalInquiriesReceived})` : ''}
                </Button>
              </Link>
              <Link href="/seller-dashboard/settings">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground font-heading">
                <NobridgeIcon icon="growth" size="md" className="text-accent" />
                Profile Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{verificationInfo.progressText}</span>
                  <span className={`font-medium ${verificationStatus === 'verified' ? 'text-green-600' : verificationStatus === 'pending_verification' ? 'text-yellow-600' : verificationStatus === 'rejected' ? 'text-red-600' : 'text-primary'}`}>
                    {verificationInfo.progress}%
                  </span>
                </div>
                <Progress value={verificationInfo.progress} className={`[&>div]:${verificationInfo.progressColor} bg-muted`} />
                <p className="text-xs text-muted-foreground">
                  {verificationStatus === 'verified'
                    ? 'Your profile is fully verified and optimized for maximum trust.'
                    : verificationStatus === 'pending_verification'
                    ? 'Your verification is pending. Verified profiles get more inquiries.'
                    : verificationStatus === 'rejected'
                    ? 'Action required. Update your information to complete verification.'
                    : 'Complete verification to increase buyer trust and inquiry rates.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Listings */}
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground font-heading">
              <NobridgeIcon icon="transactions" size="md" className="text-accent" />
              Recent Listings
            </CardTitle>
            <Link href="/seller-dashboard/listings">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentListings.length > 0 ? (
              <div className="space-y-4">
                {recentListings.map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-4 border">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{listing.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {listing.status.replace('_', ' ')}
                        </Badge>
                        {listing.asking_price && (
                          <span className="text-sm text-muted-foreground">
                            ${listing.asking_price.toLocaleString()}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {listing.inquiry_count || 0} inquiries
                        </span>
                      </div>
                    </div>
                    <Link href="/seller-dashboard/listings">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">No listings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Our team will set up your listing once you&apos;re verified.
                </p>
                <Link href="/seller-dashboard/listings">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <FileText className="h-4 w-4 mr-2" />
                    View My Listings
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
    </DashboardPageShell>
  );
}

