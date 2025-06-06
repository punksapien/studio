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
import { Eye, Edit, ShieldCheck, AlertTriangle, MailOpen, MessageSquare, Clock, FileSearch, RefreshCw, Loader2, Users, InboxIcon } from "lucide-react";
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

export default function AdminBuyerVerificationQueuePage() {
  const { toast } = useToast();
  const { updateVerificationRequest, isUpdating } = useAdminVerification();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<VerificationRequestItem | null>(null);

  const apiUrl = `/api/admin/verification-queue/buyers?page=${page}&limit=10&status=${statusFilter}`;

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
      // Get the current request to find any changes
      const currentRequest = data?.requests.find(r => r.id === requestId);
      if (!currentRequest) {
        throw new Error('Request not found');
      }

      // Prepare update payload
      const updates: any = {};

      // Only include changed values
      if (newOperationalStatus !== currentRequest.operationalStatus) {
        updates.operationalStatus = newOperationalStatus;
      }

      if (newProfileStatus !== currentRequest.profileStatus) {
        updates.profileStatus = newProfileStatus;
      }

      // Check for new admin notes
      const currentNotesCount = currentRequest.adminNotes?.length || 0;
      const newNotesCount = updatedAdminNotes.length;

      if (newNotesCount > currentNotesCount) {
        // Get the latest note (assume it's the last one added)
        const latestNote = updatedAdminNotes[newNotesCount - 1];
        if (latestNote && 'note' in latestNote) {
          updates.adminNote = latestNote.note;
        } else if (latestNote && 'content' in latestNote) {
          updates.adminNote = latestNote.content;
        }
        updates.adminName = 'Admin'; // You could get this from user context
      }

      // Only make API call if there are actual changes
      if (Object.keys(updates).length > 0) {
        const success = await updateVerificationRequest(requestId, updates);

        if (success) {
          // Refresh the data to show updated values
          mutate();
          setIsDialogOpen(false);
        }
      } else {
        // No changes made
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
    const badgeBaseClasses = "text-xs px-2 py-0.5 rounded-full font-medium";
    switch (status) {
      case 'New Request': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-red-100 text-red-700 border-red-300")}>New</Badge>;
      case 'Contacted': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-blue-100 text-blue-700 border-blue-300")}>Contacted</Badge>;
      case 'Docs Under Review': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-purple-100 text-purple-700 border-purple-300")}>Docs Review</Badge>;
      case 'More Info Requested': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-orange-100 text-orange-700 border-orange-300")}>More Info</Badge>;
      case 'Approved': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-green-100 text-green-700 border-green-300")}>Approved</Badge>;
      case 'Rejected': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-red-100 text-red-700 border-red-300")}>Rejected</Badge>;
      default: return <Badge className={cn(badgeBaseClasses)}>{status}</Badge>;
    }
  };

  const ProfileStatusBadge = ({ status }: { status?: VerificationStatus }) => {
    const badgeBaseClasses = "text-xs px-2 py-0.5 rounded-full font-medium";
    if (!status) return <Badge variant="outline" className={cn(badgeBaseClasses)}>Unknown</Badge>;
    switch (status) {
      case 'verified': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-green-100 text-green-700 border-green-300")}>Verified</Badge>;
      case 'pending_verification': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-yellow-100 text-yellow-700 border-yellow-300")}>Pending</Badge>;
      case 'anonymous': return <Badge variant="outline" className={cn(badgeBaseClasses)}>Anonymous</Badge>;
      case 'rejected': return <Badge variant="outline" className={cn(badgeBaseClasses, "bg-red-100 text-red-700 border-red-300")}>Rejected</Badge>;
      default: return <Badge variant="outline" className={cn(badgeBaseClasses, "capitalize")}>{(status as string).replace(/_/g, ' ')}</Badge>;
    }
  };

  const pendingCount = data?.requests.filter(r =>
    r.operationalStatus !== 'Approved' && r.operationalStatus !== 'Rejected'
  ).length || 0;

  if (error) {
    return (
      <div className="space-y-8">
        <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue font-heading flex items-center"><Users className="mr-2 h-6 w-6 text-primary" />Buyer Verification Queue</CardTitle>
            <CardDescription>Failed to load verification requests</CardDescription>
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
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-brand-dark-blue font-heading flex items-center"><Users className="mr-3 h-7 w-7 text-primary" />Buyer Verification Queue</CardTitle>
              <CardDescription>
                Manage buyers awaiting verification. Total pending: {pendingCount} | Total requests: {data?.pagination.total || 0}
              </CardDescription>
            </div>
             <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="New Request">New Request</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Docs Under Review">Docs Under Review</SelectItem>
                    <SelectItem value="More Info Requested">More Info Requested</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
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
                  <TableHead className="whitespace-nowrap w-36">Date Requested</TableHead>
                  <TableHead className="whitespace-nowrap w-44">Buyer Name</TableHead>
                  <TableHead className="w-52">Email</TableHead>
                  <TableHead className="whitespace-nowrap w-40">Operational Status</TableHead>
                  <TableHead className="whitespace-nowrap w-36">Profile Status</TableHead>
                  <TableHead className="text-right w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                        <span className="text-sm">Loading verification requests...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <InboxIcon className="h-8 w-8 text-muted-foreground/60 mb-1" strokeWidth={1.5} />
                        <p className="text-sm font-medium">The buyer verification queue is empty.</p>
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
                    <TableRow key={req.id} className="text-sm">
                      <TableCell className="text-xs whitespace-nowrap"><FormattedTimestamp timestamp={req.timestamp} /></TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link href={`/admin/users/${req.userId}`} className="hover:underline">{req.userName}</Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{req.userEmail || 'N/A'}</TableCell>
                      <TableCell><OperationalStatusBadge status={req.operationalStatus} /></TableCell>
                      <TableCell><ProfileStatusBadge status={req.profileStatus} /></TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => handleManageStatus(req)} className="text-xs h-8 px-3">
                          <Edit className="h-3.5 w-3.5 mr-1.5"/> Manage Statuses
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="View Buyer Details" className="text-brand-dark-blue/70 hover:text-brand-sky-blue ml-1">
                          <Link href={`/admin/users/${req.userId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
