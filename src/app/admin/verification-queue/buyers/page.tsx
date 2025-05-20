
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
import type { VerificationRequestItem, VerificationQueueStatus } from "@/lib/types";
import Link from "next/link";
import { Eye, CheckCircle2, XCircle, MessageSquare, FileText, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const buyerRequests: VerificationRequestItem[] = sampleVerificationRequests.filter(req => req.userRole === 'buyer');

export default function AdminBuyerVerificationQueuePage() {
  const getStatusBadge = (status: VerificationQueueStatus) => {
    switch (status) {
      case 'New Request': return <Badge variant="destructive">New Request</Badge>;
      case 'Contacted': return <Badge variant="secondary">Contacted</Badge>;
      case 'Docs Under Review': return <Badge className="bg-blue-500 text-white">Docs Review</Badge>;
      case 'Approved': return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'Rejected': return <Badge variant="destructive" className="bg-red-700 text-white">Rejected</Badge>;
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Requested</TableHead>
                  <TableHead>Buyer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Buyer Type</TableHead>
                  <TableHead>Docs Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyerRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{new Date(req.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                        <Link href={`/admin/users/${req.userId}`} className="hover:underline">{req.userName}</Link>
                    </TableCell>
                     <TableCell className="text-xs">{sampleUsers.find(u=>u.id === req.userId)?.email}</TableCell>
                     <TableCell className="text-xs">{sampleUsers.find(u=>u.id === req.userId)?.buyerType || 'N/A'}</TableCell>
                     <TableCell className="text-xs">
                        {req.documentsSubmitted?.length ? `${req.documentsSubmitted.length} doc(s)` : 'None'}
                     </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Buyer Details">
                        <Link href={`/admin/users/${req.userId}`}>
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
                ))}
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
