'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2 } from 'lucide-react';

interface AdminSetPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export function AdminSetPasswordDialog({ isOpen, onOpenChange, targetUser }: AdminSetPasswordDialogProps) {
  const { toast } = useToast();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const reset = () => {
    setPassword('');
    setConfirmPassword('');
    setIsSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    if (!targetUser) return;

    if (password.length < 8) {
      toast({ title: 'Invalid password', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please re-enter the same password in both fields.', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/users/${targetUser.id}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      toast({ title: 'Password changed', description: `New password set for ${targetUser.fullName}.` });
      handleOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update password',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Set a new password for <span className="font-medium">{targetUser?.fullName}</span> ({targetUser?.email}).
            They will be able to log in with it immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-new-password">New Password</Label>
            <Input
              id="admin-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password">Confirm Password</Label>
            <Input
              id="admin-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter the new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !password || !confirmPassword}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
