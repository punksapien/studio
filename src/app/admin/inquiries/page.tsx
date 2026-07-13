'use client';
import * as React from "react";
import { useSearchParams } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageShell } from "@/components/admin/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminInquiry {
  id: string;
  status: string;
  createdAt: string;
  inquiryTimestamp: string;
  listing: { id: string; title: string };
  buyer: { id: string; fullName: string; email: string };
  seller: { id: string; fullName: string; email: string };
}

interface InquiriesResponse {
  success: boolean;
  data: {
    inquiries: AdminInquiry[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
}

const STATUS_LABELS: Record<string, string> = {
  new_inquiry: 'New Inquiry',
  seller_engaged_buyer_pending_verification: 'Buyer Pending Verification',
  seller_engaged_seller_pending_verification: 'Seller Pending Verification',
  ready_for_admin_connection: 'Ready for Connection',
  connection_facilitated_in_app_chat_opened: 'Connected (Chat Open)',
  archived: 'Archived',
};

function InquiryStatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status.replace(/_/g, ' ');
  const colorMap: Record<string, string> = {
    new_inquiry: 'bg-blue-100 text-blue-700 border-blue-300',
    ready_for_admin_connection: 'bg-orange-100 text-orange-700 border-orange-300',
    connection_facilitated_in_app_chat_opened: 'bg-green-100 text-green-700 border-green-300',
    archived: 'bg-gray-100 text-gray-700 border-gray-300',
  };
  return (
    <Badge variant="outline" className={`capitalize ${colorMap[status] || 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>
      {label}
    </Badge>
  );
}

function FormattedDate({ dateString }: { dateString: string }) {
  const [formatted, setFormatted] = React.useState<string | null>(null);

  React.useEffect(() => {
    const d = new Date(dateString);
    setFormatted(isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString());
  }, [dateString]);

  return <>{formatted || ''}</>;
}

function AdminInquiriesPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Optional user filter passed from the user-details popup (?userId=...)
  const [userId, setUserId] = React.useState<string | null>(searchParams.get('userId'));

  const [inquiries, setInquiries] = React.useState<AdminInquiry[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState('all');

  const fetchInquiries = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: '1', limit: '1000' });
      if (userId) params.append('user_id', userId);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/inquiries?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch inquiries: ${response.statusText}`);
      }

      const data: InquiriesResponse = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch inquiries');
      }

      setInquiries(data.data.inquiries);
      setTotalCount(data.data.pagination.totalCount);
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inquiries');
      toast({
        title: "Error",
        description: "Failed to fetch inquiries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, statusFilter, toast]);

  React.useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // The filtered user could be the buyer or the seller of any row
  const filteredUserName = userId
    ? (inquiries.find(i => i.buyer.id === userId)?.buyer.fullName
      || inquiries.find(i => i.seller.id === userId)?.seller.fullName
      || userId)
    : null;

  if (error) {
    return (
      <AdminPageShell title="Inquiry Management" description="View and manage all buyer inquiries on the platform.">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={fetchInquiries}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title="Inquiry Management" description="View and manage all buyer inquiries on the platform.">
      {/* User filter chip (from user management popup) */}
      {userId && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 py-1 pl-2 pr-1 text-sm font-normal">
            <Filter className="h-3 w-3" />
            Filtered by user: {filteredUserName}
            <button
              type="button"
              onClick={() => setUserId(null)}
              className="ml-1 rounded-sm p-0.5 hover:bg-muted"
              aria-label="Clear user filter"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </Badge>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-auto min-w-[220px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading inquiries...</span>
        </div>
      )}

      {/* Inquiries Table */}
      {!loading && (
        <>
          <div className="flex-1 min-h-0 border overflow-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Listing</TableHead>
                  <TableHead className="min-w-[150px]">Buyer</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[150px]">Seller</TableHead>
                  <TableHead className="min-w-[160px]">Status</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">Date</TableHead>
                  <TableHead className="text-right sticky right-0 bg-background min-w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inquiries found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  inquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell className="min-w-[200px]">
                        <Link href={`/listings/${inquiry.listing.id}`} className="font-medium text-primary hover:underline">
                          {inquiry.listing.title}
                        </Link>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <Link href={`/admin/users/${inquiry.buyer.id}`} className="text-primary hover:underline">
                          {inquiry.buyer.fullName}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell min-w-[150px]">
                        <Link href={`/admin/users/${inquiry.seller.id}`} className="text-primary hover:underline">
                          {inquiry.seller.fullName}
                        </Link>
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <InquiryStatusBadge status={inquiry.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell min-w-[100px] text-sm">
                        <FormattedDate dateString={inquiry.createdAt} />
                      </TableCell>
                      <TableCell className="text-right sticky right-0 bg-background">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="View inquiry">
                          <Link href={`/admin/inquiries/${inquiry.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View inquiry</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            Total: {totalCount} inquiries
          </p>
        </>
      )}
    </AdminPageShell>
  );
}

export default function AdminInquiriesPage() {
  // useSearchParams requires a Suspense boundary for prerendering
  return (
    <React.Suspense fallback={null}>
      <AdminInquiriesPageContent />
    </React.Suspense>
  );
}
