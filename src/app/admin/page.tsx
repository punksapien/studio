'use client'
import * as React from "react";
import { MetricCard } from "@/components/admin/metric-card";
import useSWR from 'swr';
import type { AdminDashboardMetrics } from '@/lib/types';
import { Users, BellRing, LineChart, ListChecks, UserCheck, Building, DollarSign, Banknote, ListX, Handshake, Clock, AlertTriangle, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Inquiry } from "@/lib/types";
import { NobridgeIcon, NobridgeIconType } from "@/components/ui/nobridge-icon";

// Simple fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminDashboardPage() {
  const { data: metrics, isLoading, error } = useSWR<AdminDashboardMetrics>('/api/admin/metrics', fetcher, { refreshInterval: 300000 }); // 5-min re-fetch

  // NEW: Fetch cleanup queue data
  const { data: cleanupData, isLoading: cleanupLoading, error: cleanupError } = useSWR(
    '/api/admin/cleanup-queue',
    fetcher,
    { refreshInterval: 60000 } // 1-min refresh for cleanup queue
  );

  // NEW: Fetch real verification queue data
  const { data: buyerVerificationData, isLoading: buyerVerificationLoading } = useSWR(
    '/api/admin/verification-queue/buyers?limit=5&status=all',
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: sellerVerificationData, isLoading: sellerVerificationLoading } = useSWR(
    '/api/admin/verification-queue/sellers?limit=5&status=all',
    fetcher,
    { refreshInterval: 60000 }
  );

  if (error) {
    return <div className="p-8 text-red-600">Failed to load metrics: {error.message}</div>;
  }

  if (isLoading || !metrics) {
    return <div className="p-8">Loading admin metrics...</div>;
  }

  // Use real data from API instead of placeholder data
  const buyerVerificationRequests = buyerVerificationData?.requests?.filter((req: any) =>
    req.operationalStatus !== 'approved' && req.operationalStatus !== 'rejected'
  ) || [];

  const sellerVerificationRequests = sellerVerificationData?.requests?.filter((req: any) =>
    req.operationalStatus !== 'approved' && req.operationalStatus !== 'rejected'
  ) || [];

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // For now, we'll show placeholder data for engagement queue since we don't have real data yet
  const adminPageReadyToEngageItems = [
    // This will be replaced with real engagement queue data when that feature is implemented
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-heading">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="New Sellers (7d)"
          value={metrics.newUserRegistrations7dSellers}
          icon={Users}
          description={`${metrics.newUserRegistrations24hSellers} in last 24h`}
        />
         <MetricCard
          title="New Buyers (7d)"
          value={metrics.newUserRegistrations7dBuyers}
          icon={Users}
          description={`${metrics.newUserRegistrations24hBuyers} in last 24h`}
        />
        <MetricCard
          title="New Listings (7d)"
          value={metrics.newListingsCreated7d}
          icon={() => <NobridgeIcon icon="business-listing" size="sm" className="h-5 w-5 text-muted-foreground" />}
          description={`${metrics.newListingsCreated24h} in last 24h`}
        />
        <MetricCard
          title="Total Listings (All Statuses)"
          value={metrics.totalListingsAllStatuses}
          icon={ListChecks}
          description={`${metrics.totalActiveListingsVerified + metrics.totalActiveListingsAnonymous} active`}
        />
        <MetricCard
          title="Closed/Deactivated Listings"
          value={metrics.closedOrDeactivatedListings}
          icon={ListX}
          description="Inactive or deal finalized"
        />
         <MetricCard
          title="Total Platform Revenue (MTD)"
          value={`$${(metrics.totalRevenueMTD || 0).toLocaleString()}`}
          icon={() => <NobridgeIcon icon="revenue" size="sm" className="h-5 w-5 text-muted-foreground" />}
          description="Sum of buyer & seller revenue"
        />
        <MetricCard
          title="Revenue from Buyers (MTD)"
          value={`$${(metrics.revenueFromBuyers || 0).toLocaleString()}`}
          icon={() => <NobridgeIcon icon="investment" size="sm" className="h-5 w-5 text-muted-foreground" />}
          description="From buyer subscriptions"
        />
        <MetricCard
          title="Revenue from Sellers (MTD)"
          value={`$${(metrics.revenueFromSellers || 0).toLocaleString()}`}
          icon={DollarSign}
          description="From seller subscriptions/services"
        />
        <MetricCard
          title="Buyer Verification Queue"
          value={metrics.buyerVerificationQueueCount}
          icon={() => <NobridgeIcon icon="verification" size="sm" className="h-5 w-5 text-muted-foreground" />}
          description="Buyers awaiting verification"
        />
        <MetricCard
          title="Seller/Listing Verification Queue"
          value={metrics.sellerVerificationQueueCount}
          icon={() => <NobridgeIcon icon="due-diligence" size="sm" className="h-5 w-5 text-muted-foreground" />}
          description="Sellers/listings awaiting verification"
        />
         <MetricCard
          title="Ready to Engage Queue"
          value={metrics.readyToEngageQueueCount}
          icon={BellRing}
          description="Pairs ready for admin connection"
        />
        <MetricCard
          title="Total Facilitated Connections"
          value={metrics.successfulConnectionsMTD}
          icon={Handshake}
          description={`${metrics.activeSuccessfulConnections} active, ${metrics.closedSuccessfulConnections} closed (MTD)`}
        />

        {/* NEW: Cleanup Queue Metrics */}
        <MetricCard
          title="Unverified Accounts"
          value={cleanupData?.data?.statistics?.unverified || 0}
          icon={Clock}
          description="Need email verification"
          className={cleanupData?.data?.statistics?.unverified > 5 ? "border-orange-200 bg-orange-50/50" : ""}
        />
        <MetricCard
          title="Pending Deletion"
          value={cleanupData?.data?.statistics?.pending_deletion || 0}
          icon={AlertTriangle}
          description="Scheduled for cleanup"
          className={cleanupData?.data?.statistics?.pending_deletion > 0 ? "border-red-200 bg-red-50/50" : ""}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
         <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="font-heading">Pending Buyer Verifications</CardTitle>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/verification-queue/buyers">View All</Link>
                </Button>
            </div>
            <CardDescription>
              {buyerVerificationLoading ? 'Loading...' : `${buyerVerificationRequests.length} buyers needing admin review.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyerVerificationLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">Loading...</TableCell>
                  </TableRow>
                ) : buyerVerificationRequests.slice(0, 3).map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.userName}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusColor(req.operationalStatus)}`}>
                        {req.operationalStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(req.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {!buyerVerificationLoading && buyerVerificationRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      ✅ No pending buyer verifications.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="font-heading">Pending Seller/Listing Verifications</CardTitle>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/verification-queue/sellers">View All</Link>
                </Button>
            </div>
            <CardDescription>
              {sellerVerificationLoading ? 'Loading...' : `${sellerVerificationRequests.length} sellers/listings needing admin review.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller Name</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerVerificationLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">Loading...</TableCell>
                  </TableRow>
                ) : sellerVerificationRequests.slice(0, 3).map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.userName}</TableCell>
                    <TableCell>{req.listingTitle || 'N/A (Profile)'}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusColor(req.operationalStatus)}`}>
                        {req.operationalStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(req.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {!sellerVerificationLoading && sellerVerificationRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      ✅ No pending seller/listing verifications.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle className="font-heading">Ready for Connection</CardTitle>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/engagement-queue">View All</Link>
                </Button>
            </div>
            <CardDescription>0 engagements ready for admin facilitation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Listing</TableHead>
                   <TableHead>Date Ready</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminPageReadyToEngageItems.slice(0,3).map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.buyerName}</TableCell>
                    <TableCell>{item.sellerName}</TableCell>
                    <TableCell>{item.listingTitle}</TableCell>
                    <TableCell>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {adminPageReadyToEngageItems.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No engagements ready for connection.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* NEW: Account Cleanup Queue Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-heading flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Account Cleanup Queue
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/cleanup-queue">Manage All</Link>
              </Button>
            </div>
            <CardDescription>
              {cleanupLoading ? 'Loading...' : `${cleanupData?.data?.statistics?.total || 0} accounts need attention`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cleanupError && (
              <div className="text-red-600 text-sm">Failed to load cleanup queue</div>
            )}
            {cleanupLoading && (
              <div className="text-muted-foreground text-sm">Loading cleanup queue...</div>
            )}
            {cleanupData?.data?.queue && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleanupData.data.queue.slice(0, 3).map((account: any) => {
                    const timeLeft = account.time_until_deletion ?
                      Math.floor(account.time_until_deletion / (1000 * 60 * 60)) : // Convert to hours
                      (account.time_until_permanent_deletion ?
                        Math.floor(account.time_until_permanent_deletion / (1000 * 60 * 60)) : 0);

                    return (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={account.account_status === 'unverified' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {account.account_status === 'unverified' ? 'Unverified' : 'Pending Deletion'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {timeLeft > 0 ? (
                            <span className={timeLeft < 2 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                              {timeLeft}h
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">Expired</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!cleanupData.data.queue || cleanupData.data.queue.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                        ✅ No accounts in cleanup queue
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-heading">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="flex-col h-24"><Link href="/admin/users"><Users className="mb-1"/> User Management</Link></Button>
            <Button variant="outline" asChild className="flex-col h-24"><Link href="/admin/listings"><ListChecks className="mb-1"/> Listing Management</Link></Button>
            <Button variant="outline" asChild className="flex-col h-24"><Link href="/admin/analytics"><LineChart className="mb-1"/> View Full Analytics</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
