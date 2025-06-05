
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
import type { VerificationRequestItem, VerificationQueueStatus, User, VerificationStatus, AdminNote } from "@/lib/types";
import Link from "next/link";
import { Eye, Edit, ShieldCheck, AlertTriangle, MailOpen, MessageSquare, Clock, FileSearch } from "lucide-react";
import { UpdateVerificationStatusDialog } from "@/components/admin/update-verification-status-dialog";
import { useToast } from "@/hooks/use-toast";

function FormattedTimestamp({ timestamp }: { timestamp: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);
  React.useEffect(() => {
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);
  if (!formattedDate) return <span className="italic text-xs">Loading...</span>;
  return <>{formattedDate}</>;
}

const getUserDetails = (userId: string): User | undefined => {
  return sampleUsers.find(u => u.id === userId);
}

export default function AdminBuyerVerificationQueuePage() {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState<VerificationRequestItem[]>(
    sampleVerificationRequests.filter(req => req.userRole === 'buyer')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<VerificationRequestItem | null>(null);

  const handleManageStatus = (request: VerificationRequestItem) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleSaveStatusUpdate = (
    requestId: string,
    newOperationalStatus: VerificationQueueStatus,
    newProfileStatus: VerificationStatus,
    updatedAdminNotes: AdminNote[]
  ) => {
    let userName = "User";
    setRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          userName = req.userName;
          return { ...req, operationalStatus: newOperationalStatus, profileStatus: newProfileStatus, adminNotes: updatedAdminNotes, updatedAt: new Date() };
        }
        return req;
      })
    );
    
    const requestToUpdate = requests.find(r => r.id === requestId);
    if (requestToUpdate) {
        const userIndex = sampleUsers.findIndex(u => u.id === requestToUpdate.userId);
        if (userIndex !== -1) {
            sampleUsers[userIndex].verificationStatus = newProfileStatus;
            sampleUsers[userIndex].updatedAt = new Date();
        }
    }
    toast({ title: "Status Updated", description: `Verification for ${userName} updated.` });
  };

  const getOperationalStatusBadge = (status: VerificationQueueStatus) => {
    switch (status) {
      case 'New Request': return <Badge variant="destructive" className="text-xs bg-red-100 text-red-700 border-red-300"><Clock className="h-3 w-3 mr-1" />New</Badge>;
      case 'Contacted': return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-300"><MailOpen className="h-3 w-3 mr-1" />Contacted</Badge>;
      case 'Docs Under Review': return <Badge className="bg-purple-100 text-purple-700 text-xs border-purple-300"><FileSearch className="h-3 w-3 mr-1" />Docs Review</Badge>;
      case 'More Info Requested': return <Badge className="bg-yellow-100 text-yellow-700 text-xs border-yellow-300"><MessageSquare className="h-3 w-3 mr-1" />More Info</Badge>;
      case 'Approved': return <Badge className="bg-green-100 text-green-700 text-xs border-green-300"><ShieldCheck className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'Rejected': return <Badge variant="destructive" className="text-xs bg-red-700 text-white border-red-500"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge className="text-xs">{status}</Badge>;
    }
  };

  const getProfileStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200 border-green-300 dark:border-green-500 text-xs"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending_verification': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200 border-yellow-300 dark:border-yellow-500 text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'anonymous': return <Badge variant="outline" className="text-xs">Anonymous</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      default: return <Badge variant="outline" className="capitalize text-xs">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-brand-white">
        <CardHeader>
          <CardTitle className="text-brand-dark-blue font-heading">Buyer Verification Queue</CardTitle>
          <CardDescription>Manage buyers awaiting verification. Total pending: {requests.filter(r => r.operationalStatus !== 'Approved' && r.operationalStatus !== 'Rejected').length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-brand-light-gray/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap text-brand-dark-blue/80">Date Requested</TableHead>
                  <TableHead className="whitespace-nowrap text-brand-dark-blue/80">Buyer Name</TableHead>
                  <TableHead className="text-brand-dark-blue/80">Email</TableHead>
                  <TableHead className="whitespace-nowrap text-brand-dark-blue/80">Operational Status</TableHead>
                  <TableHead className="whitespace-nowrap text-brand-dark-blue/80">Profile Status</TableHead>
                  <TableHead className="text-right text-brand-dark-blue/80">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const user = getUserDetails(req.userId);
                  return (
                  <TableRow key={req.id} className="hover:bg-brand-light-gray/30">
                    <TableCell className="text-xs whitespace-nowrap"><FormattedTimestamp timestamp={req.timestamp} /></TableCell>
                    <TableCell className="font-medium whitespace-nowrap text-brand-dark-blue">
                        <Link href={`/admin/users/${req.userId}`} className="hover:underline hover:text-brand-sky-blue">{req.userName}</Link>
                    </TableCell>
                     <TableCell className="text-xs text-muted-foreground">{user?.email}</TableCell>
                    <TableCell>{getOperationalStatusBadge(req.operationalStatus)}</TableCell>
                    <TableCell>{getProfileStatusBadge(req.profileStatus)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="outline" size="sm" onClick={() => handleManageStatus(req)} className="border-brand-sky-blue text-brand-sky-blue hover:bg-brand-sky-blue/10 hover:text-brand-sky-blue">
                        <Edit className="h-3.5 w-3.5 mr-1.5"/> Manage
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="View Buyer Details" className="text-brand-dark-blue/70 hover:text-brand-sky-blue">
                        <Link href={`/admin/users/${req.userId}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )})}
                 {requests.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                            The buyer verification queue is empty. Great job!
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <UpdateVerificationStatusDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        request={selectedRequest}
        onSave={handleSaveStatusUpdate}
      />
    </div>
  );
}
