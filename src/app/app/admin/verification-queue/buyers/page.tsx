
'use client';
import * as React from "react"; 
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
import { sampleVerificationRequests, sampleUsers } from "@/lib/placeholder-data";
import type { VerificationRequestItem, VerificationQueueStatus, User } from "@/lib/types";
import Link from "next/link";
import { Eye, CheckCircle2, XCircle, MessageSquare, FileText, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const buyerRequests: VerificationRequestItem[] = sampleVerificationRequests.filter(req => req.userRole === 'buyer');

// Helper component for client-side date formatting
function FormattedTimestamp({ timestamp }: { timestamp: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  if (!formattedDate) {
    return <span className="italic text-xs">Loading...</span>; 
  }
  return <>{formattedDate}</>;
}

const getUserDetails = (userId: string): User | undefined => {
  return sampleUsers.find(u => u.id === userId);
}

export default function AdminBuyerVerificationQueuePage() {
  const getStatusBadge = (status: VerificationQueueStatus) => {
    switch (status) {
      case 'New Request': return <Badge variant="destructive">New Request</Badge>;
      case 'Contacted': return <Badge variant="secondary">Contacted</Badge>;
      case 'Docs Under Review': return <Badge className="bg-blue-500 text-white dark:bg-blue-700 dark:text-blue-100">Docs Review</Badge>;
      case 'More Info Requested': return <Badge className="bg-yellow-500 text-white dark:bg-yellow-600 dark:text-yellow-100">More Info</Badge>;
      case 'Approved': return <Badge className="bg-green-500 text-white dark:bg-green-600 dark:text-green-100">Approved</Badge>;
      case 'Rejected': return <Badge variant="destructive" className="bg-red-700 text-white dark:bg-red-800 dark:text-red-200">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Buyer Verification Queue</CardTitle>
          <CardDescription>Manage buyers awaiting verification. Total pending: {buyerRequests.filter(r => r.status !== 'Approved' && r.status !== 'Rejected').length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date Requested</TableHead>
                  <TableHead className="whitespace-nowrap">Buyer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="whitespace-nowrap">Buyer Persona</TableHead>
                  <TableHead className="whitespace-nowrap">Docs Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyerRequests.map((req) => {
                  const user = getUserDetails(req.userId);
                  return (
                  <TableRow key={req.id}>
                    <TableCell className="text-xs whitespace-nowrap"><FormattedTimestamp timestamp={req.timestamp} /></TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                        <Link href={`/app/admin/users/${req.userId}`} className="hover:underline">{req.userName}</Link>
                    </TableCell>
                     <TableCell className="text-xs">{user?.email}</TableCell>
                     <TableCell className="text-xs whitespace-nowrap">{user?.buyerPersonaType || 'N/A'}</TableCell>
                     <TableCell className="text-xs whitespace-nowrap">
                        {req.documentsSubmitted?.length ? `${req.documentsSubmitted.length} doc(s)` : 'None'}
                     </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" asChild title="View Buyer Details">
                        <Link href={`/app/admin/users/${req.userId}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" title="Mark as Contacted">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Select defaultValue={req.status} onValueChange={(newStatus) => console.log(`Update ${req.id} to ${newStatus}`)}>
                        <SelectTrigger className="h-8 w-[120px] text-xs inline-flex ml-2">
                            <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {(["New Request", "Contacted", "Docs Under Review", "More Info Requested", "Approved", "Rejected"] as VerificationQueueStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )})}
                 {buyerRequests.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            The buyer verification queue is empty.
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
