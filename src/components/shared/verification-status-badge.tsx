'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import type { VerificationStatus } from '@/lib/types';

// Single source of truth for user verification status display labels, platform-wide.
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  anonymous: 'Not Verified',
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Rejected',
};

export function verificationStatusLabel(status?: string | null): string {
  return VERIFICATION_STATUS_LABELS[status as VerificationStatus] || 'Not Verified';
}

interface VerificationStatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'lg';
}

export function VerificationStatusBadge({ status, size = 'sm' }: VerificationStatusBadgeProps) {
  const iconSize = size === 'lg' ? 'h-5 w-5 mr-2' : 'h-3 w-3 mr-1';
  const textSize = size === 'lg' ? 'p-2 text-lg' : 'text-xs';

  switch (status) {
    case 'verified':
      return (
        <Badge variant="outline" className={`${textSize} bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600`}>
          <ShieldCheck className={iconSize} /> {VERIFICATION_STATUS_LABELS.verified}
        </Badge>
      );
    case 'pending_verification':
      return (
        <Badge variant="outline" className={`${textSize} bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600`}>
          <ShieldAlert className={iconSize} /> {VERIFICATION_STATUS_LABELS.pending_verification}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className={textSize}>
          <ShieldX className={iconSize} /> {VERIFICATION_STATUS_LABELS.rejected}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={`${textSize} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600`}>
          {verificationStatusLabel(status)}
        </Badge>
      );
  }
}
