'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Key,
  Copy,
  ExternalLink,
  AlertTriangle,
  Shield,
  Clock,
  User,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MagicLinkResponse {
  success: boolean;
  impersonationUrl?: string;
  targetUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  expiresAt?: string;
  expiresInMinutes?: number;
  correlationId?: string;
  warning?: string;
  error?: string;
  message?: string;
}

interface AdminLoginLinkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export function AdminLoginLinkDialog({
  isOpen,
  onOpenChange,
  targetUser
}: AdminLoginLinkDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkData, setMagicLinkData] = useState<MagicLinkResponse | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'confirm' | 'generate'>('confirm');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setMagicLinkData(null);
      setHasCopied(false);
      setIsLoading(false);
      setError(null);
      setStep('confirm');
    }
  }, [isOpen]);

  const handleGenerateLink = async () => {
    if (!targetUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${targetUser.id}/generate-login-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types with specific messages
        const errorMessage = (() => {
          switch (data.error) {
            case 'AUTHENTICATION_FAILED':
              return 'Authentication failed. Please refresh the page and try again.';
            case 'INSUFFICIENT_PERMISSIONS':
              return 'You do not have admin permissions to perform this action.';
            case 'INVALID_USER_ID':
              return 'Invalid user ID provided.';
            case 'TARGET_USER_NOT_FOUND':
              return 'Target user no longer exists.';
            case 'TARGET_PROFILE_NOT_FOUND':
              return 'Target user profile not found.';
            default:
              return data.message || data.error || 'Failed to generate login link. Please try again.';
          }
        })();

        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: errorMessage,
        });
        return;
      }

      // Validate response structure
      if (!data.success || !data.impersonationUrl) {
        setError('Invalid response received from server.');
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'Invalid response from server.',
        });
        return;
      }

      toast({
        title: 'Redirecting...',
        description: `You will now be logged in as ${data.targetUser?.name}.`,
      });

      // Redirect to the impersonation URL
      window.location.href = data.impersonationUrl;

    } catch (error) {
      console.error('Failed to generate login link:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'A network error occurred. Please check your connection.';

      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    // This function is no longer needed with direct redirection.
    // Kept here to avoid breaking changes if called elsewhere, but can be removed.
    toast({
      title: 'Action Not Supported',
      description: 'Direct redirection is now used for impersonation.',
    });
  };

  const handleOpenLink = () => {
    // This function is no longer needed with direct redirection.
    // Kept here to avoid breaking changes if called elsewhere, but can be removed.
     toast({
      title: 'Action Not Supported',
      description: 'Direct redirection is now used for impersonation.',
    });
  };

  const formatExpiryTime = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMinutes = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60)));

    if (diffMinutes <= 0) {
      return "Expired";
    } else if (diffMinutes === 1) {
      return "1 minute";
    } else {
      return `${diffMinutes} minutes`;
    }
  };

  const renderContent = () => {
    if (step === 'confirm') {
      return (
        <>
          <DialogHeader>
            <DialogTitle>
              <Shield className="inline-block mr-2" />
              Confirm Impersonation
            </DialogTitle>
            <DialogDescription>
              You are about to generate a secure link to log in as the following user.
              This action will be audited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <User className="h-8 w-8" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {targetUser?.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {targetUser?.email}
                </p>
              </div>
              <Badge>{targetUser?.role}</Badge>
            </div>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                By proceeding, you will be logged out of your admin account and logged in as this user.
                You will need to log out and log back in to restore your admin session.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setStep('generate');
                handleGenerateLink();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : 'Confirm and Proceed'}
            </Button>
          </DialogFooter>
        </>
      );
    }

    if (step === 'generate') {
      return (
        <>
          <DialogHeader>
            <DialogTitle>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initiating Impersonation
            </DialogTitle>
            <DialogDescription>
              Please wait while we securely log you in as {targetUser?.fullName}. You will be redirected shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="space-y-4 text-center">
              <Loader2 className="h-16 w-16 animate-spin text-gray-400" />
              <p className="text-muted-foreground">Redirecting...</p>
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
