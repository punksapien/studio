
'use client';
import * as React from "react";
import useSWR from 'swr';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VerificationRequestItem, VerificationQueueStatus, VerificationStatus, UserRole, AdminNote } from "@/lib/types";
import Link from "next/link";
import { Eye, FileText, Edit, ShieldCheck, AlertTriangle, MailOpen, MessageSquare, Clock, FileSearch, Briefcase, RefreshCw, Loader2, Users, InboxIcon } from "lucide-react";
import { UpdateVerificationStatusDialog } from "@/components/admin/update-verification-status-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminVerification } from "@/hooks/use-admin-verification";
import { cn } from "@/lib/utils";

function FormattedTimestamp({ timestamp, short = false }: { timestamp: Date | string, short?: boolean }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);
  React.useEffect(() => {
    const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (!isNaN(dateObj.getTime())) {
      if (short) {
        setFormattedDate(dateObj.toLocaleDateString());
      } else {
        setFormattedDate(dateObj.toLocaleString());
      }
    } else {
      setFormattedDate('N/A');
    }
  }, [timestamp, short]);

  if (timestamp && !formattedDate) return <span className="italic text-xs">Loading...</span>;
  return <>{formattedDate || 'N/A'}</>;
}

interface VerificationQueueResponse {
  requests: VerificationRequestItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  responseTime: number;
}

const fetcher = async (url: string): Promise<VerificationQueueResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export default function AdminSellerVerificationQueuePage() {
  const { toast } = useToast();
  const { updateVerificationRequest, isUpdating } = useAdminVerification();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<VerificationRequestItem | null>(null);

  const apiUrl = `/api/admin/verification-queue/sellers?page=${page}&limit=10&status=${statusFilter}`;

  const { data, error, isLoading, mutate } = useSWR<VerificationQueueResponse>(
    apiUrl,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: true,
    }
  );

  const handleManageStatus = (request: VerificationRequestItem) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleSaveStatusUpdate = async (
    requestId: string,
    newOperationalStatus: VerificationQueueStatus,
    newProfileStatus: VerificationStatus,
    updatedAdminNotes: AdminNote[]
  ) => {
    try {
      const currentRequest = data?.requests.find(r => r.id === requestId);
      if (!currentRequest) {
        throw new Error('Request not found');
      }

      const updates: any = {};
      if (newOperationalStatus !== currentRequest.operationalStatus) {
        updates.operationalStatus = newOperationalStatus;
      }
      if (newProfileStatus !== currentRequest.profileStatus) {
        updates.profileStatus = newProfileStatus;
      }
      
      const currentNotesCount = currentRequest.adminNotes?.length || 0;
      const newNotesCount = updatedAdminNotes.length;
      if (newNotesCount > currentNotesCount) {
        const latestNote = updatedAdminNotes[newNotesCount - 1];
        if (latestNote && 'note' in latestNote) updates.adminNote = latestNote.note;
        else if (latestNote && 'content' in latestNote) updates.adminNote = latestNote.content;
        updates.adminName = 'Admin';
      }


      if (Object.keys(updates).length > 0) {
        const success = await updateVerificationRequest(requestId, updates);
        if (success) {
          mutate();
          setIsDialogOpen(false);
        }
      } else {
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    mutate();
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const OperationalStatusBadge = ({ status }: { status: VerificationQueueStatus }) => {
    const badgeBaseClasses = "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1";
    switch (status) {
      case 'New Request': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-blue-100 text-blue-700 border-blue-300")}><Clock className="h-3 w-3" />New</Badge>;
      case 'Contacted': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-sky-100 text-sky-700 border-sky-300")}><MailOpen className="h-3 w-3" />Contacted</Badge>;
      case 'Docs Under Review': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-purple-100 text-purple-700 border-purple-300")}><FileSearch className="h-3 w-3" />Docs Review</Badge>;
      case 'More Info Requested': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-orange-100 text-orange-700 border-orange-300")}><MessageSquare className="h-3 w-3" />More Info</Badge>;
      case 'Approved': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-green-100 text-green-700 border-green-300")}><ShieldCheck className="h-3 w-3" />Approved</Badge>;
      case 'Rejected': return <Badge variant="destructive" className={cn(badgeBaseClasses, "bg-red-100 text-red-700 border-red-300")}><AlertTriangle className="h-3 w-3" />Rejected</Badge>;
      default: return <Badge className={cn(badgeBaseClasses)}>{status}</Badge>;
    }
  };

  const ProfileStatusBadge = ({ status }: { status?: VerificationStatus }) => {
    const badgeBaseClasses = "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1";
    if (!status) return <Badge variant="outline" className={cn(badgeBaseClasses)}>Unknown</Badge>;
    switch (status) {
      case 'verified': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-green-100 text-green-700 border-green-300")}><ShieldCheck className="h-3 w-3" />Verified</Badge>;
      case 'pending_verification': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-yellow-100 text-yellow-700 border-yellow-300")}><AlertTriangle className="h-3 w-3" />Pending</Badge>;
      case 'rejected': return <Badge variant="destructive" className={cn(badgeBaseClasses, "bg-red-100 text-red-700 border-red-300")}><AlertTriangle className="h-3 w-3" />Rejected</Badge>;
      case 'anonymous':
      default: return <Badge variant="outline" className={cn(badgeBaseClasses, "capitalize")}>{(status as string).replace(/_/g, ' ')}</Badge>;
    }
  };

  const pendingCount = data?.requests.filter(r =>
    r.operationalStatus !== 'Approved' && r.operationalStatus !== 'Rejected'
  ).length || 0;

  if (error) {
    return (
      <div className="space-y-8">
        <Card className="shadow-md bg-card">
          <CardHeader>
            <CardTitle className="text-foreground font-heading flex items-center"><Users className="mr-2 h-6 w-6 text-accent" />Seller & Listing Verification Queue</CardTitle>
            <CardDescription className="text-muted-foreground">Failed to load verification requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-destructive mb-4">Error loading verification queue: {error.message}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requests = data?.requests || [];

  return (
    <div className="space-y-8">
      <Card className="shadow-md bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-foreground font-heading flex items-center"><Users className="mr-3 h-7 w-7 text-accent" />Seller & Listing Verification Queue</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage sellers and their listings awaiting verification. Total pending: {pendingCount} | Total requests: {data?.pagination.total || 0}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-48 h-9 text-xs bg-background border-input"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>{["all", "New Request", "Contacted", "Docs Under Review", "More Info Requested", "Approved", "Rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="h-9 text-xs">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap w-36 text-muted-foreground">Date Requested</TableHead>
                  <TableHead className="whitespace-nowrap w-44 text-muted-foreground">Seller Name</TableHead>
                  <TableHead className="whitespace-nowrap w-48 text-muted-foreground">Associated Listing</TableHead>
                  <TableHead className="whitespace-nowrap w-40 text-muted-foreground">Operational Status</TableHead>
                  <TableHead className="whitespace-nowrap w-36 text-muted-foreground">Profile Status</TableHead>
                  <TableHead className="text-right w-40 text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2 text-accent" />
                        <span className="text-sm text-muted-foreground">Loading verification requests...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                       <div className="flex flex-col items-center justify-center gap-2">
                        <InboxIcon className="h-8 w-8 text-muted-foreground/60 mb-1" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-foreground">The seller verification queue is empty.</p>
                        <p className="text-xs text-muted-foreground">
                          {statusFilter === 'all'
                            ? 'New verification requests will appear here.'
                            : `No requests found with status "${statusFilter}". Try selecting a different filter.`}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id} className="text-sm hover:bg-muted/50">
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground"><FormattedTimestamp timestamp={req.timestamp} /></TableCell>
                      <TableCell className="font-medium whitespace-nowrap text-foreground">
                        <Link href={`/admin/users/${req.userId}`} className="hover:underline text-accent">{req.userName}</Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {req.listingId && req.listingTitle ? (
                          <Link href={`/admin/listings/${req.listingId}`} className="hover:underline text-accent flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground"/>
                            <span className="truncate max-w-[180px]">{req.listingTitle}</span>
                          </Link>
                        ) : <span className="text-xs text-muted-foreground">N/A (Profile Only)</span>}
                      </TableCell>
                      <TableCell><OperationalStatusBadge status={req.operationalStatus} /></TableCell>
                      <TableCell><ProfileStatusBadge status={req.profileStatus} /></TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => handleManageStatus(req)} className="text-xs h-8 px-3">
                          <Edit className="h-3.5 w-3.5 mr-1.5"/> Manage
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="View Seller Details" className="text-muted-foreground hover:text-accent ml-1">
                          <Link href={`/admin/users/${req.userId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {req.listingId && (
                          <Button variant="ghost" size="icon" asChild title="View Listing Details" className="text-muted-foreground hover:text-accent">
                            <Link href={`/admin/listings/${req.listingId}`}>
                              <FileText className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {requests.length > 0 ? ((data.pagination.page - 1) * data.pagination.limit) + 1 : 0} to{' '}
                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                {data.pagination.total} requests
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page >= data.pagination.totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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

