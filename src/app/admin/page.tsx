
import { MetricCard } from "@/components/admin/metric-card";
import { sampleAdminDashboardMetrics, sampleVerificationRequests, sampleReadyToEngageItems } from "@/lib/placeholder-data";
import { Users, Briefcase, BellRing, LineChart, ListChecks, UserCheck, Building } from "lucide-react";
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

export default function AdminDashboardPage() {
  const metrics = sampleAdminDashboardMetrics;
  const buyerVerificationRequests = sampleVerificationRequests.filter(req => req.userRole === 'buyer');
  const sellerVerificationRequests = sampleVerificationRequests.filter(req => req.userRole === 'seller');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="New Users (7d)"
          value={metrics.newUserRegistrations7d}
          icon={Users}
          description={`${metrics.newUserRegistrations24h} in last 24h`}
        />
        <MetricCard
          title="New Listings (7d)"
          value={metrics.newListingsCreated7d}
          icon={Briefcase}
          description={`${metrics.newListingsCreated24h} in last 24h`}
        />
        <MetricCard
          title="Buyer Verification Queue"
          value={metrics.buyerVerificationQueueCount}
          icon={UserCheck}
          description="Buyers awaiting verification"
        />
        <MetricCard
          title="Seller Verification Queue"
          value={metrics.sellerVerificationQueueCount}
          icon={Building}
          description="Sellers/listings awaiting verification"
        />
         <MetricCard
          title="Ready to Engage Queue"
          value={metrics.readyToEngageQueueCount}
          icon={BellRing}
          description="Pairs ready for admin connection"
        />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
         <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Pending Buyer Verifications</CardTitle>
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
              </TableBody>
            </Table>
             {buyerVerificationRequests.length === 0 && <p className="text-muted-foreground text-center py-4">No pending buyer verifications.</p>}
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Pending Seller Verifications</CardTitle>
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
                    <TableCell>{req.listingTitle || 'N/A'}</TableCell>
                    <TableCell>{new Date(req.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {sellerVerificationRequests.length === 0 && <p className="text-muted-foreground text-center py-4">No pending seller verifications.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle>Ready for Connection</CardTitle>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/engagement-queue">View All</Link>
                </Button>
            </div>
            <CardDescription>Top {sampleReadyToEngageItems.slice(0,3).length} engagements ready for admin facilitation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Listing</TableHead>
                   <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleReadyToEngageItems.slice(0,3).map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.buyerName}</TableCell>
                    <TableCell>{item.sellerName}</TableCell>
                    <TableCell>{item.listingTitle}</TableCell>
                    <TableCell>{new Date(item.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {sampleReadyToEngageItems.length === 0 && <p className="text-muted-foreground text-center py-4">No engagements ready for connection.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="flex-col h-24"><Link href="/admin/users"><Users className="mb-1"/> User Management</Link></Button>
            <Button variant="outline" asChild className="flex-col h-24"><Link href="/admin/listings"><ListChecks className="mb-1"/> Listing Management</Link></Button>
            <Button variant="outline" asChild className="flex-col h-24"><Link href="/admin/analytics"><LineChart className="mb-1"/> View Analytics</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
