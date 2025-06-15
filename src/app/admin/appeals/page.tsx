'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
  Building,
  DollarSign,
  Calendar,
  AlertTriangle,
  Loader2,
  FileText,
  Eye
} from "lucide-react";

interface Appeal {
  id: string;
  listing_id: string;
  seller_id: string;
  appeal_message: string;
  original_rejection_reason: string;
  original_rejection_category: string;
  status: 'pending' | 'under_review' | 'approved' | 'denied';
  admin_response?: string;
  reviewed_by?: string;
  created_at: string;
  reviewed_at?: string;
  listing?: {
    id: string;
    title: string;
    industry: string;
    asking_price: number;
    status: string;
    admin_notes?: string;
    rejection_category?: string;
    admin_action_at?: string;
  };
  seller?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    verification_status: string;
  };
  reviewer?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface AppealSummary {
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  denied: number;
}

export default function AdminAppealsPage() {
  const { toast } = useToast();

  // State management
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [summary, setSummary] = useState<AppealSummary>({
    total: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    denied: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review dialog state
  const [reviewDialog, setReviewDialog] = useState<{
    isOpen: boolean;
    appeal: Appeal | null;
    action: 'approve' | 'deny' | null;
  }>({
    isOpen: false,
    appeal: null,
    action: null
  });
  const [adminResponse, setAdminResponse] = useState('');

  // Fetch appeals data
  const fetchAppeals = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/admin/appeals?${params}`);

      if (response.ok) {
        const data = await response.json();
        setAppeals(data.appeals || []);
        setSummary(data.summary || {});
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        throw new Error('Failed to fetch appeals');
      }
    } catch (error) {
      console.error('Error fetching appeals:', error);
      toast({
        title: "Error Loading Appeals",
        description: "Failed to load appeals. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and refresh on filter changes
  useEffect(() => {
    fetchAppeals();
  }, [currentPage, statusFilter, searchQuery]);

  // Handle appeal review (approve/deny)
  const handleAppealReview = async () => {
    if (!reviewDialog.appeal || !reviewDialog.action || !adminResponse.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide a detailed response explaining your decision.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(reviewDialog.appeal.id);

      const endpoint = reviewDialog.action === 'approve' ? 'approve' : 'deny';
      const response = await fetch(`/api/admin/appeals/${reviewDialog.appeal.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminResponse: adminResponse.trim() })
      });

      if (response.ok) {
        const result = await response.json();

        // Update local state
        setAppeals(prev => prev.map(appeal =>
          appeal.id === reviewDialog.appeal!.id
            ? {
                ...appeal,
                status: result.appeal.status,
                admin_response: result.appeal.admin_response,
                reviewed_by: result.appeal.reviewed_by,
                reviewed_at: result.appeal.reviewed_at
              }
            : appeal
        ));

        // Update summary
        setSummary(prev => ({
          ...prev,
          [reviewDialog.appeal!.status]: prev[reviewDialog.appeal!.status as keyof AppealSummary] - 1,
          [result.appeal.status]: prev[result.appeal.status as keyof AppealSummary] + 1
        }));

        toast({
          title: `✅ Appeal ${reviewDialog.action === 'approve' ? 'Approved' : 'Denied'}`,
          description: result.message
        });

        // Close dialog
        setReviewDialog({ isOpen: false, appeal: null, action: null });
        setAdminResponse('');

      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${reviewDialog.action} appeal`);
      }
    } catch (error) {
      console.error(`Error ${reviewDialog.action}ing appeal:`, error);
      toast({
        title: `❌ ${reviewDialog.action === 'approve' ? 'Approval' : 'Denial'} Failed`,
        description: error instanceof Error ? error.message : `Failed to ${reviewDialog.action} appeal`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  // Open review dialog
  const openReviewDialog = (appeal: Appeal, action: 'approve' | 'deny') => {
    setReviewDialog({ isOpen: true, appeal, action });
    setAdminResponse('');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'under_review':
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-700/20 dark:text-purple-300">
            <Eye className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Denied
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get rejection category display
  const getRejectionCategoryDisplay = (category?: string) => {
    const categoryMap: Record<string, string> = {
      'quality': 'Poor Quality',
      'compliance': 'Policy Violation',
      'incomplete': 'Incomplete Information',
      'fraud': 'Suspected Fraud',
      'duplicate': 'Duplicate Listing',
      'inappropriate': 'Inappropriate Content',
      'other': 'Other'
    };
    return category ? categoryMap[category] || category : 'Not specified';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Summary cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Appeals list skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appeal Management</h1>
          <p className="text-muted-foreground">Review and manage listing rejection appeals</p>
        </div>
        <Button onClick={fetchAppeals} variant="outline">
          <MessageCircle className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Appeals</div>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-blue-600">Pending</div>
            <div className="text-2xl font-bold text-blue-600">{summary.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-purple-600">Under Review</div>
            <div className="text-2xl font-bold text-purple-600">{summary.under_review}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-green-600">Approved</div>
            <div className="text-2xl font-bold text-green-600">{summary.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-red-600">Denied</div>
            <div className="text-2xl font-bold text-red-600">{summary.denied}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search appeals, listings, or sellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appeals List */}
      {appeals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Appeals Found</h3>
            <p className="text-muted-foreground">
              {statusFilter !== 'all' || searchQuery
                ? 'No appeals match your current filters.'
                : 'No appeals have been submitted yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appeals.map((appeal) => (
            <Card key={appeal.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {appeal.listing?.title || 'Unknown Listing'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {appeal.seller?.first_name} {appeal.seller?.last_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${appeal.listing?.asking_price?.toLocaleString() || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(appeal.created_at).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(appeal.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Original Rejection Info */}
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                      Original Rejection: {getRejectionCategoryDisplay(appeal.original_rejection_category)}
                    </div>
                    {appeal.original_rejection_reason && (
                      <div className="text-red-700 dark:text-red-300 text-sm">
                        {appeal.original_rejection_reason}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Appeal Message */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Seller's Appeal
                  </h4>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    {appeal.appeal_message}
                  </div>
                </div>

                {/* Admin Response (if exists) */}
                {appeal.admin_response && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Admin Response
                      {appeal.reviewer && (
                        <span className="text-sm text-muted-foreground font-normal">
                          by {appeal.reviewer.first_name} {appeal.reviewer.last_name}
                        </span>
                      )}
                    </h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                      {appeal.admin_response}
                    </div>
                    {appeal.reviewed_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Reviewed on {new Date(appeal.reviewed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {(appeal.status === 'pending' || appeal.status === 'under_review') && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => openReviewDialog(appeal, 'approve')}
                      disabled={isProcessing === appeal.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isProcessing === appeal.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Approve Appeal
                    </Button>
                    <Button
                      onClick={() => openReviewDialog(appeal, 'deny')}
                      disabled={isProcessing === appeal.id}
                      variant="destructive"
                    >
                      {isProcessing === appeal.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Deny Appeal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setReviewDialog({ isOpen: false, appeal: null, action: null });
          setAdminResponse('');
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewDialog.action === 'approve' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {reviewDialog.action === 'approve' ? 'Approve' : 'Deny'} Appeal
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.action === 'approve'
                ? 'Approving this appeal will restore the listing to active status.'
                : 'Denying this appeal will keep the listing rejected.'
              } Please provide a detailed response to the seller.
            </DialogDescription>
          </DialogHeader>

          {reviewDialog.appeal && (
            <div className="space-y-4">
              {/* Appeal Summary */}
              <Alert>
                <MessageCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">
                    Appeal for: {reviewDialog.appeal.listing?.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Seller: {reviewDialog.appeal.seller?.first_name} {reviewDialog.appeal.seller?.last_name}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Admin Response Input */}
              <div className="space-y-2">
                <label htmlFor="admin-response" className="text-sm font-medium">
                  Your Response to Seller *
                </label>
                <Textarea
                  id="admin-response"
                  placeholder={
                    reviewDialog.action === 'approve'
                      ? "Explain why the appeal was approved and any conditions or next steps..."
                      : "Explain why the appeal was denied and what the seller needs to address..."
                  }
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="text-xs text-muted-foreground">
                  {adminResponse.length}/1000 characters
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialog({ isOpen: false, appeal: null, action: null });
                setAdminResponse('');
              }}
              disabled={isProcessing !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAppealReview}
              disabled={isProcessing !== null || !adminResponse.trim() || adminResponse.length > 1000}
              className={reviewDialog.action === 'approve'
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {isProcessing !== null ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewDialog.action === 'approve' ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {reviewDialog.action === 'approve' ? 'Approve Appeal' : 'Deny Appeal'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
