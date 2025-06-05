
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
import type { VerificationRequestItem, VerificationQueueStatus, VerificationStatus, UserRole } from "@/lib/types";
import Link from "next/link";
import { Eye, Edit, ShieldCheck, AlertTriangle, MailOpen, MessageSquare, Clock, FileSearch, RefreshCw, Loader2 } from "lucide-react";
import { UpdateVerificationStatusDialog } from "@/components/admin/update-verification-status-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function FormattedTimestamp({ timestamp }: { timestamp: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);
  React.useEffect(() => {
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);
  if (!formattedDate) return <span className="italic text-xs">Loading...</span>;
  return <>{formattedDate}</>;
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
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<VerificationRequestItem | null>(null);

  const apiUrl = `/api/admin/verification-queue/buyers?page=${page}&limit=20&status=${statusFilter}`;

  const { data, error, isLoading, mutate } = useSWR<VerificationQueueResponse>(
    apiUrl,
    fetcher,
    {
      refreshInterval: 30000,
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
    updatedAdminNotes: any[] // Assuming AdminNote[] type
  ) => {
    try {
      // TODO: Implement API call to update verification status
      // For now, just refresh the data
      await mutate();

      const requestToUpdate = data?.requests.find(r => r.id === requestId);
      const userName = requestToUpdate?.userName || "User";

      toast({
        title: "Status Updated",
        description: `Verification for ${userName} updated successfully.`
      });
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

  const getProfileStatusBadge = (status?: VerificationStatus) => {
    if (!status) return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    switch (status) {
      case 'verified': return <Badge className="bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200 border-green-300 dark:border-green-500 text-xs"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending_verification': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200 border-yellow-300 dark:border-yellow-500 text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'anonymous': return <Badge variant="outline" className="text-xs">Anonymous</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      default: return <Badge variant="outline" className="capitalize text-xs">{(status as string).replace(/_/g, ' ')}</Badge>;
    }
  };

  const pendingCount = data?.requests.filter(r =>
    r.operationalStatus !== 'Approved' && r.operationalStatus !== 'Rejected'
  ).length || 0;

  if (error) {
    return (
      <div className="space-y-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue font-heading">Buyer Verification Queue</CardTitle>
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
      <Card className="shadow-xl bg-brand-white">
        <CardHeader>
            <CardTitle className="text-brand-dark-blue font-heading">Buyer Verification Queue</CardTitle>
            <CardDescription>
            Manage buyers awaiting verification.
            {data && ` Total pending: ${pendingCount} | Total requests: ${data.pagination.total}`}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-full sm:w-48">
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
              </div>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
            </div>
          </div>
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
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Loading requests...
                          </div>
                        </TableCell>
                    </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      {statusFilter === 'all'
                        ? 'The buyer verification queue is empty.'
                        : `No verification requests found with status "${statusFilter}".`}
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-brand-light-gray/30">
                    <TableCell className="text-xs whitespace-nowrap"><FormattedTimestamp timestamp={req.timestamp} /></TableCell>
                    <TableCell className="font-medium whitespace-nowrap text-brand-dark-blue">
                        <Link href={`/admin/users/${req.userId}`} className="hover:underline hover:text-brand-sky-blue">{req.userName}</Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{req.userEmail || 'N/A'}</TableCell>
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
                )))}
              </TableBody>
            </Table>
          </div>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {data.requests.length > 0 ? ((data.pagination.page - 1) * data.pagination.limit) + 1 : 0} to{' '}
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

