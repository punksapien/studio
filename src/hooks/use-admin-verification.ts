import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface UpdateVerificationRequest {
  operationalStatus?: string;
  profileStatus?: string;
  adminNote?: string;
  adminName?: string;
}

interface AdminVerificationHook {
  updateVerificationRequest: (id: string, updates: UpdateVerificationRequest) => Promise<boolean>;
  isUpdating: boolean;
  error: string | null;
  lockVerificationRequest: (id: string, lockReason?: string) => Promise<boolean>;
  unlockVerificationRequest: (id: string) => Promise<boolean>;
}

export function useAdminVerification(): AdminVerificationHook {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateVerificationRequest = async (
    id: string,
    updates: UpdateVerificationRequest
  ): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);

    try {
      console.log(`[ADMIN-VERIFICATION-UPDATE] Attempting to update request ID: ${id} with updates:`, updates);

      const response = await fetch(`/api/admin/verification-queue/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      console.log(`[ADMIN-VERIFICATION-UPDATE] Response status: ${response.status}, result:`, result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update verification request');
      }

      // Show success toast
      const changes = [];
      if (updates.operationalStatus) changes.push(`Status: ${updates.operationalStatus}`);
      if (updates.profileStatus) changes.push(`Profile: ${updates.profileStatus}`);
      if (updates.adminNote) changes.push('Added note');

      toast({
        title: 'Verification Updated',
        description: `Successfully updated: ${changes.join(', ')}`,
        duration: 3000,
      });

      console.log(`[ADMIN-VERIFICATION-UPDATE] Request ${id} updated successfully:`, result.data);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });

      console.error('[ADMIN-VERIFICATION-UPDATE] Error:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const lockVerificationRequest = async (
    id: string,
    lockReason?: string
  ): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);

    try {
      console.log(`[ADMIN-VERIFICATION-LOCK] Locking request ID: ${id}`, { lockReason });

      const response = await fetch(`/api/admin/verification-queue/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lockRequest: true,
          lockReason: lockReason || 'Admin is reviewing this request'
        }),
      });

      const result = await response.json();

      console.log(`[ADMIN-VERIFICATION-LOCK] Response:`, { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to lock verification request');
      }

      // Show success toast
      toast({
        title: "Request Locked",
        description: "Verification request has been locked for admin review.",
      });

      // Refresh data
      await fetchVerificationRequests();

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lock verification request';
      setError(errorMessage);

      toast({
        title: "Error Locking Request",
        description: errorMessage,
        variant: "destructive",
      });

      console.error('Error locking verification request:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const unlockVerificationRequest = async (
    id: string
  ): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);

    try {
      console.log(`[ADMIN-VERIFICATION-UNLOCK] Unlocking request ID: ${id}`);

      const response = await fetch(`/api/admin/verification-queue/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unlockRequest: true
        }),
      });

      const result = await response.json();

      console.log(`[ADMIN-VERIFICATION-UNLOCK] Response:`, { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unlock verification request');
      }

      // Show success toast
      toast({
        title: "Request Unlocked",
        description: "Verification request has been unlocked and bump functionality restored.",
      });

      // Refresh data
      await fetchVerificationRequests();

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlock verification request';
      setError(errorMessage);

      toast({
        title: "Error Unlocking Request",
        description: errorMessage,
        variant: "destructive",
      });

      console.error('Error unlocking verification request:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateVerificationRequest,
    isUpdating,
    error,
    lockVerificationRequest,
    unlockVerificationRequest,
  };
}
