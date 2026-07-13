'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Ban, Loader2, Trash2 } from 'lucide-react';

interface AdminDeleteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** true = Delete & Block (email permanently banned), false = plain delete */
  block: boolean;
  targetUser: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  /** Called after a successful deletion (e.g. close the details popup, refresh the users list) */
  onDeleted?: () => void;
}

export function AdminDeleteUserDialog({ isOpen, onOpenChange, block, targetUser, onDeleted }: AdminDeleteUserDialogProps) {
  const { toast } = useToast();
  const [confirmEmail, setConfirmEmail] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmEmail('');
      setIsDeleting(false);
    }
    onOpenChange(open);
  };

  const emailMatches =
    !!targetUser && confirmEmail.trim().toLowerCase() === targetUser.email.trim().toLowerCase();

  const handleDelete = async () => {
    if (!targetUser || !emailMatches) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast({
        title: block ? 'User Deleted & Blocked' : 'User Deleted',
        description: block
          ? `${targetUser.fullName} was deleted and ${targetUser.email} is permanently blocked from re-registering.`
          : `${targetUser.fullName} was deleted. The email can be used to sign up again.`,
      });
      handleOpenChange(false);
      onDeleted?.();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete user',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-destructive">
            {block ? <Ban className="mr-2 h-5 w-5" /> : <Trash2 className="mr-2 h-5 w-5" />}
            {block ? 'Delete & Block User' : 'Delete User'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                This will <span className="font-semibold">permanently delete</span>{' '}
                <span className="font-medium">{targetUser?.fullName}</span> and all of their data —
                profile, listings, inquiries, conversations, and messages. This cannot be undone.
              </p>
              {block ? (
                <p className="font-medium text-destructive">
                  Their email ({targetUser?.email}) will also be permanently blocked from signing up again.
                </p>
              ) : (
                <p>Their email ({targetUser?.email}) will be free to sign up again afterwards.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-delete-email">
            Type the user's email to confirm
          </Label>
          <Input
            id="confirm-delete-email"
            placeholder={targetUser?.email}
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!emailMatches || isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {block ? 'Delete & Block' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
