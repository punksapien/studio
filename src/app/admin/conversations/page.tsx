'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

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

interface AdminConversation {
  id: string;
  status: string;
  lastMessageSnippet: string | null;
  createdAt: string;
  updatedAt: string;
  listing: { id: string; title: string } | null;
  buyer: { id: string; fullName: string; email: string };
  seller: { id: string; fullName: string; email: string };
}

interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: AdminConversation[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  ARCHIVED_BY_ADMIN: 'Archived by Admin',
  CLOSED_BY_PARTICIPANT: 'Closed by Participant',
};

function ConversationStatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status.replace(/_/g, ' ');
  const colorMap: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-300',
    ARCHIVED_BY_ADMIN: 'bg-gray-100 text-gray-700 border-gray-300',
    CLOSED_BY_PARTICIPANT: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  };
  return (
    <Badge variant="outline" className={colorMap[status] || ''}>
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

function AdminConversationsPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Optional user filter passed from the user details page (?userId=...)
  const [userId, setUserId] = React.useState<string | null>(searchParams.get('userId'));

  const [conversations, setConversations] = React.useState<AdminConversation[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState('all');

  const fetchConversations = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: '1', limit: '1000' });
      if (userId) params.append('user_id', userId);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/conversations?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`);
      }

      const data: ConversationsResponse = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch conversations');
      }

      setConversations(data.data.conversations);
      setTotalCount(data.data.pagination.totalCount);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      toast({
        title: "Error",
        description: "Failed to fetch conversations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, statusFilter, toast]);

  React.useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // The filtered user could be the buyer or the seller of any row
  const filteredUserName = userId
    ? (conversations.find(c => c.buyer.id === userId)?.buyer.fullName
      || conversations.find(c => c.seller.id === userId)?.seller.fullName
      || userId)
    : null;

  if (error) {
    return (
      <AdminPageShell title="Conversation Management" description="Oversee active and archived conversations between buyers and sellers.">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={fetchConversations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title="Conversation Management" description="Oversee active and archived conversations between buyers and sellers.">
      {/* User filter chip (from user details page) */}
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
          <span className="ml-2">Loading conversations...</span>
        </div>
      )}

      {/* Conversations Table */}
      {!loading && (
        <>
          <div className="flex-1 min-h-0 border overflow-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Buyer</TableHead>
                  <TableHead className="min-w-[150px]">Seller</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[180px]">Listing</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[220px]">Last Message</TableHead>
                  <TableHead className="min-w-[130px]">Status</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">Updated</TableHead>
                  <TableHead className="text-right sticky right-0 bg-background min-w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No conversations found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  conversations.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="min-w-[150px]">
                        <Link href={`/admin/users/${conv.buyer.id}`} className="text-primary hover:underline">
                          {conv.buyer.fullName}
                        </Link>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <Link href={`/admin/users/${conv.seller.id}`} className="text-primary hover:underline">
                          {conv.seller.fullName}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell min-w-[180px]">
                        {conv.listing ? (
                          <Link href={`/listings/${conv.listing.id}`} className="text-primary hover:underline">
                            {conv.listing.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell min-w-[220px] max-w-[300px]">
                        <span className="block truncate text-sm text-muted-foreground" title={conv.lastMessageSnippet || ''}>
                          {conv.lastMessageSnippet || 'No messages yet'}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[130px]">
                        <ConversationStatusBadge status={conv.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell min-w-[100px] text-sm">
                        <FormattedDate dateString={conv.updatedAt} />
                      </TableCell>
                      <TableCell className="text-right sticky right-0 bg-background">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="View conversation">
                          <Link href={`/admin/conversations/${conv.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View conversation</span>
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
            Total: {totalCount} conversations
          </p>
        </>
      )}
    </AdminPageShell>
  );
}

export default function AdminConversationsPage() {
  // useSearchParams requires a Suspense boundary for prerendering
  return (
    <React.Suspense fallback={null}>
      <AdminConversationsPageContent />
    </React.Suspense>
  );
}
