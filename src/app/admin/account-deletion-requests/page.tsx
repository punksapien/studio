'use client'

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import * as React from "react";
import { useState } from "react";
import useSWR, { mutate } from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageShell } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserX } from "lucide-react";
import { toast } from "sonner";

// Simple fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DeletionRequest {
  id: string;
  user_id: string;
  email: string | null;
  role: string | null;
  reason: string | null;
  requested_at: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

export default function AccountDeletionRequestsPage() {
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [selectedAction, setSelectedAction] = useState<'delete' | 'dismiss' | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error } = useSWR(
    '/api/admin/account-deletion-requests',
    fetcher,
    { refreshInterval: 30000 } // 30-second refresh
  );

  const displayName = (req: DeletionRequest) => {
    if (req.first_name && req.last_name) {
      return `${req.first_name} ${req.last_name}`;
    }
    return req.full_name || 'N/A';
  };

  const openActionDialog = (req: DeletionRequest, action: 'delete' | 'dismiss') => {
    setSelectedRequest(req);
    setSelectedAction(action);
    setReason('');
    setActionDialogOpen(true);
  };

  const handleActionSubmit = async () => {
    if (!selectedRequest || !selectedAction) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/account-deletion-requests/${selectedRequest.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: selectedAction, reason: reason || undefined })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Action failed');
      }

      toast.success(
        selectedAction === 'delete'
          ? 'Account deleted successfully'
          : 'Deletion request dismissed'
      );

      mutate('/api/admin/account-deletion-requests');

      setActionDialogOpen(false);
      setSelectedRequest(null);
      setSelectedAction(null);
      setReason('');
    } catch (err) {
      console.error('Action failed:', err);
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <AdminPageShell title="Account Deletion Requests" description="Review and process user-requested account deletions">
        <div className="text-red-600">Failed to load deletion requests: {error.message}</div>
      </AdminPageShell>
    );
  }

  const requests: DeletionRequest[] = data?.requests || [];

  return (
    <AdminPageShell
      title="Account Deletion Requests"
      description="Review and process user-requested account deletions"
      actions={
        <Button
          onClick={() => mutate('/api/admin/account-deletion-requests')}
          variant="outline"
        >
          Refresh
        </Button>
      }
    >

      {/* Statistics Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isLoading ? '...' : data?.statistics?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting admin review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="flex flex-1 min-h-0 flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Deletion Requests</CardTitle>
          <CardDescription>
            Users who have requested permanent deletion of their account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 min-h-0 flex-col">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading deletion requests...
            </div>
          )}

          {!isLoading && (
            <div className="flex-1 min-h-0 border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">{displayName(req)}</div>
                        <div className="text-sm text-muted-foreground">{req.email || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {req.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm text-muted-foreground">
                          {req.reason || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(req.requested_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openActionDialog(req, 'delete')}
                            className="h-8"
                          >
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(req, 'dismiss')}
                            className="h-8"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No pending deletion requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'delete' ? 'Delete Account' : 'Dismiss Request'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'delete'
                ? `This will permanently soft-delete the account for ${selectedRequest?.email}. This action cannot be undone.`
                : `Dismiss the deletion request for ${selectedRequest?.email}. The account will remain active.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter a reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleActionSubmit}
              disabled={isSubmitting}
              variant={selectedAction === 'delete' ? 'destructive' : 'default'}
            >
              {isSubmitting
                ? 'Processing...'
                : selectedAction === 'delete'
                  ? 'Confirm Delete'
                  : 'Confirm Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
