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
      const response = await fetch(`/api/admin/verification-queue/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

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

  return {
    updateVerificationRequest,
    isUpdating,
    error,
  };
}
