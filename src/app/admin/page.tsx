'use client'
import * as React from "react";
import { MetricCard } from "@/components/admin/metric-card";
import useSWR from 'swr';
import type { AdminDashboardMetrics } from '@/lib/types';
import { sampleVerificationRequests, sampleInquiries, sampleListings, sampleUsers } from "@/lib/placeholder-data";
import { Users, BellRing, LineChart, ListChecks, UserCheck, Building, DollarSign, Banknote, ListX, Handshake } from "lucide-react";
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
import type { Inquiry } from "@/lib/types";
import { NobridgeIcon, NobridgeIconType } from "@/components/ui/nobridge-icon";

// Simple fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminDashboardPage() {
  const { data: metrics, isLoading, error } = useSWR<AdminDashboardMetrics>('/api/admin/metrics', fetcher, { refreshInterval: 300000 }); // 5-min re-fetch

  if (error) {
    return <div className="p-8 text-red-600">Failed to load metrics: {error.message}</div>;
  }

  if (isLoading || !metrics) {
    return <div className="p-8">Loading admin metrics...</div>;
  }

  const buyerVerificationRequests = sampleVerificationRequests.filter(req => req.userRole === 'buyer' && req.status !== 'Approved' && req.status !== 'Rejected');
  const sellerVerificationRequests = sampleVerificationRequests.filter(req => req.userRole === 'seller' && req.status !== 'Approved' && req.status !== 'Rejected');

  const adminPageReadyToEngageItems = sampleInquiries
    .filter(i => i.status === 'ready_for_admin_connection')
    .map(inquiry => {
      const buyer = sampleUsers.find(u => u.id === inquiry.buyerId);
      const seller = sampleUsers.find(u => u.id === inquiry.sellerId);
      const listing = sampleListings.find(l => l.id === inquiry.listingId);
      return {
        id: inquiry.id,
        buyerName: buyer?.fullName || inquiry.buyerId,
        sellerName: seller?.fullName || inquiry.sellerId,
        listingTitle: listing?.listingTitleAnonymous || inquiry.listingId,
        timestamp: inquiry.engagementTimestamp || inquiry.inquiryTimestamp,
      };
    });

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
            <CardDescription>Top {buyerVerificationRequests.slice(0,3).length} buyers needing admin review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer Name</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyerVerificationRequests.slice(0,3).map(req => (
                  <TableRow key={req.id}>
                    <TableCell>{req.userName}</TableCell>
                    <TableCell className="truncate max-w-xs">{req.reason}</TableCell>
                    <TableCell>{new Date(req.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                 {buyerVerificationRequests.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">No pending buyer verifications.</TableCell></TableRow>}
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
            <CardDescription>Top {sellerVerificationRequests.slice(0,3).length} sellers/listings needing admin review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller Name</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerVerificationRequests.slice(0,3).map(req => (
                  <TableRow key={req.id}>
                    <TableCell>{req.userName}</TableCell>
                    <TableCell>{req.listingTitle || 'N/A (Profile)'}</TableCell>
                    <TableCell>{new Date(req.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                 {sellerVerificationRequests.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">No pending seller/listing verifications.</TableCell></TableRow>}
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
            <CardDescription>Top {adminPageReadyToEngageItems.slice(0,3).length} engagements ready for admin facilitation.</CardDescription>
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
