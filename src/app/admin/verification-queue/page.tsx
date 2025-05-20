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

const requests: VerificationRequestItem[] = sampleVerificationRequests;

export default function AdminVerificationQueuePage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
          <CardDescription>Manage users and listings awaiting verification by the admin team. Total pending: {requests.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters could be added here: by user role, by type (user/listing), date range */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Requested</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>User Role</TableHead>
                  <TableHead>Associated Listing</TableHead>
                  <TableHead>Reason / Trigger</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{new Date(req.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                        <Link href={`/admin/users/${req.userId}`} className="hover:underline">{req.userName}</Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{req.userRole}</Badge></TableCell>
                    <TableCell>
                        {req.listingId && req.listingTitle ? (
                            <Link href={`/admin/listings/${req.listingId}`} className="hover:underline">{req.listingTitle}</Link>
                        ) : "N/A (Profile Verification)"}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs truncate" title={req.reason}>{req.reason}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Details">
                        <Link href={`/admin/users/${req.userId}${req.listingId ? `?listing=${req.listingId}` : ''}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" title="Mark as Contacted">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Approve Verification">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Reject Verification">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {requests.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            The verification queue is empty. Great job!
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
