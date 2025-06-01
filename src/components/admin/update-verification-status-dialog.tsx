
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { VerificationRequestItem, VerificationStatus, VerificationQueueStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface UpdateVerificationStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  request: VerificationRequestItem | null;
  onSave: (requestId: string, newOperationalStatus: VerificationQueueStatus, newProfileStatus: VerificationStatus, adminNotes: string) => void;
}

export function UpdateVerificationStatusDialog({
  isOpen,
  onOpenChange,
  request,
  onSave,
}: UpdateVerificationStatusDialogProps) {
  const { toast } = useToast();
  const [selectedOperationalStatus, setSelectedOperationalStatus] = React.useState<VerificationQueueStatus | undefined>(undefined);
  const [selectedProfileStatus, setSelectedProfileStatus] = React.useState<VerificationStatus | undefined>(undefined);
  const [adminNotes, setAdminNotes] = React.useState('');
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  React.useEffect(() => {
    if (request) {
      setSelectedOperationalStatus(request.operationalStatus);
      setSelectedProfileStatus(request.profileStatus);
      setAdminNotes(request.adminNotes || '');
    }
  }, [request]);

  if (!request) return null;

  const hasOperationalStatusChanged = selectedOperationalStatus !== request.operationalStatus;
  const hasProfileStatusChanged = selectedProfileStatus !== request.profileStatus;
  const hasAdminNotesChanged = adminNotes !== (request.adminNotes || '');
  const hasAnyChange = hasOperationalStatusChanged || hasProfileStatusChanged || hasAdminNotesChanged;


  const handleAttemptSave = () => {
    if (!selectedOperationalStatus || !selectedProfileStatus) {
        toast({ variant: "destructive", title: "Error", description: "Please select both operational and profile statuses." });
        return;
    }
    if (hasAnyChange) {
        setShowConfirmation(true);
    } else {
        toast({ title: "No Changes", description: "No changes were made to the statuses or notes." });
        onOpenChange(false); // Close dialog if no changes
    }
  };

  const handleConfirmSave = () => {
    if (!selectedOperationalStatus || !selectedProfileStatus) return; // Should not happen if button enabled
    onSave(request.id, selectedOperationalStatus, selectedProfileStatus, adminNotes);
    setShowConfirmation(false);
    onOpenChange(false); // Close main dialog
  };
  
  const handleCancel = () => {
    // Reset state to original values when dialog is closed without saving
    if (request) {
        setSelectedOperationalStatus(request.operationalStatus);
        setSelectedProfileStatus(request.profileStatus);
        setAdminNotes(request.adminNotes || '');
    }
    setShowConfirmation(false);
    onOpenChange(false);
  };


  const operationalStatusOptions: VerificationQueueStatus[] = ["New Request", "Contacted", "Docs Under Review", "More Info Requested", "Approved", "Rejected"];
  const profileStatusOptions: VerificationStatus[] = ['anonymous', 'pending_verification', 'verified', 'rejected'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); else onOpenChange(true);}}>
      <DialogContent className="sm:max-w-[525px]">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle>Manage Verification Status for {request.userName}</DialogTitle>
              <DialogDescription>
                Update operational and profile statuses for {request.userRole} (ID: {request.userId.substring(0,8)}...).
                {request.listingId && ` Listing: ${request.listingTitle || request.listingId.substring(0,8)}...`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-ops-status" className="text-right col-span-1">Current Ops Status</Label>
                <Input id="current-ops-status" value={request.operationalStatus} disabled className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="operationalStatus" className="text-right col-span-1">New Ops Status</Label>
                <Select value={selectedOperationalStatus} onValueChange={(value) => setSelectedOperationalStatus(value as VerificationQueueStatus)}>
                  <SelectTrigger id="operationalStatus" className="col-span-3">
                    <SelectValue placeholder="Select operational status" />
                  </SelectTrigger>
                  <SelectContent>
                    {operationalStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-profile-status" className="text-right col-span-1">Current Profile Status</Label>
                <Input id="current-profile-status" value={request.profileStatus} disabled className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="profileStatus" className="text-right col-span-1">New Profile Status</Label>
                <Select value={selectedProfileStatus} onValueChange={(value) => setSelectedProfileStatus(value as VerificationStatus)}>
                  <SelectTrigger id="profileStatus" className="col-span-3">
                    <SelectValue placeholder="Select profile status" />
                  </SelectTrigger>
                  <SelectContent>
                    {profileStatusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="adminNotes" className="text-right col-span-1 pt-2">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="col-span-3"
                  placeholder="Internal notes about this verification request..."
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button></DialogClose>
              <Button type="button" onClick={handleAttemptSave} disabled={!hasAnyChange || !selectedOperationalStatus || !selectedProfileStatus}>
                Save Changes
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Status Changes</DialogTitle>
              <DialogDescription>
                Please review the changes before confirming.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              {hasOperationalStatusChanged && (
                <p><strong>Operational Status:</strong> <span className="text-muted-foreground line-through">{request.operationalStatus}</span> <span className="text-primary font-semibold">{selectedOperationalStatus}</span></p>
              )}
              {hasProfileStatusChanged && (
                 <p><strong>Profile Status:</strong> <span className="text-muted-foreground line-through">{request.profileStatus}</span> <span className="text-primary font-semibold">{selectedProfileStatus}</span></p>
              )}
              {hasAdminNotesChanged && (
                <div>
                  <p><strong>Admin Notes:</strong></p>
                  <p className="text-sm text-muted-foreground p-2 border rounded bg-muted/50 whitespace-pre-wrap">{adminNotes || "(Notes will be cleared)"}</p>
                </div>
              )}
              {!hasOperationalStatusChanged && !hasProfileStatusChanged && hasAdminNotesChanged && (
                 <p>Only admin notes will be updated.</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowConfirmation(false)}>Back to Edit</Button>
              <Button type="button" onClick={handleConfirmSave} className="bg-primary text-primary-foreground">Confirm & Save</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

    