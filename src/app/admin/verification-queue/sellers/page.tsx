
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleVerificationRequests } from "@/lib/placeholder-data";
import type { VerificationRequestItem } from "@/lib/types";
import Link from "next/link";
import { Eye, CheckCircle2, XCircle, MessageSquare } from "lucide-react";

const sellerRequests: VerificationRequestItem[] = sampleVerificationRequests.filter(req => req.userRole === 'seller');

export default function AdminSellerVerificationQueuePage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Seller & Listing Verification Queue</CardTitle>
          <CardDescription>Manage sellers and their listings awaiting verification. Total pending: {sellerRequests.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Requested</TableHead>
                  <TableHead>Seller Name</TableHead>
                  <TableHead>Associated Listing</TableHead>
                  <TableHead>Reason / Trigger</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{new Date(req.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                        <Link href={`/admin/users/${req.userId}`} className="hover:underline">{req.userName}</Link>
                    </TableCell>
                    <TableCell>
                        {req.listingId && req.listingTitle ? (
                            <Link href={`/admin/listings/${req.listingId}`} className="hover:underline">{req.listingTitle}</Link>
                        ) : "N/A (Profile Only)"}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs truncate" title={req.reason}>{req.reason}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Details">
                        <Link href={`/admin/users/${req.userId}${req.listingId ? `?listing=${req.listingId}` : ''}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" title="Mark as Contacted (Not Implemented)">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Approve Verification (Not Implemented)">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Reject Verification (Not Implemented)">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {sellerRequests.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            The seller verification queue is empty.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
