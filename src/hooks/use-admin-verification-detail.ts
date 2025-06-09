import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface VerificationRequestDetail {
  request: {
    id: string;
    user_id: string;
    request_type: string;
    status: string;
    user_notes: string;
    admin_notes: Array<{
      note: string;
      admin_id: string;
      admin_name: string;
      timestamp: string;
    }>;
    priority_level: string;
    priority_score: number;
    bump_count: number;
    days_old: number;
    created_at: string;
    updated_at: string;
    listing_id?: string;
    user_profile: {
      id: string;
      email: string;
      full_name: string;
      first_name?: string;
      last_name?: string;
      initial_company_name?: string;
      role: string;
      verification_status: string;
      phone_number?: string;
      country?: string;
      created_at: string;
      last_login?: string;
    };
  };
  activities: Array<{
    id: string;
    activity_type: string;
    old_value?: string;
    new_value?: string;
    notes: string;
    created_at: string;
    admin?: {
      full_name?: string;
      first_name?: string;
      last_name?: string;
    };
  }>;
  duplicates: Array<{
    id: string;
    created_at: string;
    status: string;
    user_notes: string;
    bump_count: number;
    priority_score: number;
    request_type: string;
  }>;
  associatedListing?: {
    id: string;
    listing_title_anonymous: string;
    industry: string;
    asking_price: number;
    status: string;
    created_at: string;
    location_country: string;
  };
  summary: {
    totalActivities: number;
    totalDuplicates: number;
    daysOld: number;
    priorityLevel: string;
    priorityScore: number;
    bumpCount: number;
    hasNotes: boolean;
  };
}

interface UseAdminVerificationDetailResult {
  requestDetail: VerificationRequestDetail | null;
  loading: boolean;
  error: string | null;
  refreshDetail: () => Promise<void>;
  updateStatus: (status: string, notes?: string) => Promise<boolean>;
  addAdminNote: (note: string) => Promise<boolean>;
  updatePriority: (priorityScore: number, notes?: string) => Promise<boolean>;
  markAsDuplicate: (duplicateOfId: string, notes?: string) => Promise<boolean>;
}

export function useAdminVerificationDetail(requestId: string): UseAdminVerificationDetailResult {
  const [requestDetail, setRequestDetail] = useState<VerificationRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/verification-requests/${requestId}/detail`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch request details');
      }

      const data = await response.json();
      setRequestDetail(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to load request details: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const performActivity = async (
    activityType: string,
    payload: any,
    successMessage: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/verification-requests/${requestId}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType,
          ...payload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform activity');
      }

      toast.success(successMessage);
      await fetchRequestDetail(); // Refresh data
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Operation failed: ${errorMessage}`);
      return false;
    }
  };

  const updateStatus = async (status: string, notes?: string): Promise<boolean> => {
    return performActivity(
      'status_change',
      { statusUpdate: status, notes },
      `Request status updated to ${status}`
    );
  };

  const addAdminNote = async (note: string): Promise<boolean> => {
    return performActivity(
      'note_added',
      { adminNote: note },
      'Admin note added successfully'
    );
  };

  const updatePriority = async (priorityScore: number, notes?: string): Promise<boolean> => {
    return performActivity(
      'priority_changed',
      { priorityUpdate: priorityScore, notes },
      'Request priority updated'
    );
  };

  const markAsDuplicate = async (duplicateOfId: string, notes?: string): Promise<boolean> => {
    return performActivity(
      'duplicate_marked',
      {
        metadata: { duplicateOf: duplicateOfId },
        notes
      },
      'Request marked as duplicate'
    );
  };

  const refreshDetail = async (): Promise<void> => {
    await fetchRequestDetail();
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  return {
    requestDetail,
    loading,
    error,
    refreshDetail,
    updateStatus,
    addAdminNote,
    updatePriority,
    markAsDuplicate,
  };
}
