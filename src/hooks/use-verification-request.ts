'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface VerificationRequest {
  id: string;
  listing_id?: string;
  request_type: 'user_verification' | 'listing_verification';
  status: string;
  reason: string;
  admin_notes?: string;
  documents_submitted: any[];
  created_at: string;
  updated_at: string;
  last_request_time: string;
  bump_count: number;
  last_bump_time?: string;
  priority_score: number;
  can_bump: boolean;
  hours_until_can_bump: number;
  is_pending: boolean;
  listings?: {
    listing_title_anonymous: string;
    status: string;
  };
}

interface VerificationRequestPayload {
  request_type: 'user_verification' | 'listing_verification';
  listing_id?: string;
  reason: string;
  action?: 'submit' | 'bump';
}

interface UseVerificationRequestReturn {
  requests: VerificationRequest[];
  currentStatus: string;
  isLoading: boolean;
  error: string | null;
  submitRequest: (payload: VerificationRequestPayload, onSuccessCallback?: () => void) => Promise<boolean>;
  bumpRequest: (requestId: string, onSuccessCallback?: () => void) => Promise<boolean>;
  refreshRequests: () => Promise<void>;
  canSubmitNewRequest: (requestType: 'user_verification' | 'listing_verification', listingId?: string) => { canSubmit: boolean; hoursRemaining?: number; message?: string };
}

export function useVerificationRequest(): UseVerificationRequestReturn {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('anonymous');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const requestInProgressRef = useRef(false);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (url: string, retries = 2, delay = 1000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);

        // Handle rate limiting
        if (response.status === 429) {
          if (i === retries - 1) throw new Error('Rate limited - please try again in a moment');

          console.log(`[VERIFICATION-RATE-LIMIT] Request rate limited, retrying in ${delay}ms (attempt ${i + 1}/${retries})`);
          await sleep(delay);
          delay *= 2;
          continue;
        }

        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await sleep(delay);
        delay *= 2;
      }
    }
    throw new Error('Max retries exceeded');
  };

  const fetchRequests = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (requestInProgressRef.current) {
      console.log('[VERIFICATION] Request already in progress, skipping');
      return;
    }

    try {
      requestInProgressRef.current = true;
      setIsLoading(true);
      setError(null);

      const response = await fetchWithRetry('/api/verification/request');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch verification requests');
      }

      const data = await response.json();
      setRequests(data.requests || []);
      setCurrentStatus(data.current_status || 'anonymous');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch verification requests';
      setError(errorMessage);
      console.error('Error fetching verification requests:', err);
    } finally {
      setIsLoading(false);
      requestInProgressRef.current = false;
    }
  }, []);

  const submitRequest = async (payload: VerificationRequestPayload, onSuccessCallback?: () => void): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/verification/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, action: 'submit' }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Handle cooldown
          toast({
            title: "Request Cooldown Active",
            description: data.message || "You must wait before submitting another request.",
            variant: "destructive",
          });
          return false;
        } else if (response.status === 409) {
          toast({
            title: "Request Already Exists",
            description: data.error || "You already have a pending verification request of this type.",
            variant: "destructive",
          });
          return false;
        }
        throw new Error(data.error || 'Failed to submit verification request');
      }

      toast({
        title: "Verification Request Submitted!",
        description: data.message || "Your verification request has been submitted successfully. Our team will review it and contact you soon.",
      });

      await fetchRequests();
      if (onSuccessCallback) {
        onSuccessCallback();
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit verification request';
      setError(errorMessage);

      toast({
        title: "Error Submitting Request",
        description: errorMessage,
        variant: "destructive",
      });

      console.error('Error submitting verification request:', err);
      return false;
    }
  };

  const bumpRequest = async (requestId: string, onSuccessCallback?: () => void): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/verification/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'bump', request_id: requestId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Bump Cooldown Active",
            description: data.message || "You must wait before bumping your request again.",
            variant: "destructive",
          });
          return false;
        }
        throw new Error(data.error || 'Failed to bump verification request');
      }

      toast({
        title: "Request Bumped!",
        description: data.message || "Your verification request has been moved to the top of the queue.",
      });

      await fetchRequests();
      if (onSuccessCallback) {
        onSuccessCallback();
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bump verification request';
      setError(errorMessage);

      toast({
        title: "Error Bumping Request",
        description: errorMessage,
        variant: "destructive",
      });

      console.error('Error bumping verification request:', err);
      return false;
    }
  };

  const canSubmitNewRequest = useCallback((requestType: 'user_verification' | 'listing_verification', listingId?: string) => {
    const existingRequest = requests.find(r => {
      if (r.request_type !== requestType) return false;
      if (requestType === 'listing_verification' && r.listing_id !== listingId) return false;
      if (requestType === 'user_verification' && r.listing_id !== null) return false;
      return r.is_pending;
    });

    if (!existingRequest) {
      return { canSubmit: true };
    }

    if (existingRequest.hours_until_can_bump > 0) {
      return {
        canSubmit: false,
        hoursRemaining: existingRequest.hours_until_can_bump,
        message: `You have a pending request. You can bump it to the top in ${existingRequest.hours_until_can_bump} hours.`
      };
    }

    return {
      canSubmit: false,
      message: 'You have a pending request. You can bump it to the top of the queue.'
    };
  }, [requests]);

  // Set up real-time polling for status updates
  useEffect(() => {
    fetchRequests();

    // Poll every 45 seconds for real-time updates (offset from dashboard polling)
    // Adding a 15-second delay to offset from dashboard hook timing
    const pollInterval = setInterval(() => {
      fetchRequests();
    }, 45000); // Increased from 30s to prevent concurrent requests with dashboard

    return () => clearInterval(pollInterval);
  }, [fetchRequests]);

  return {
    requests,
    currentStatus,
    isLoading,
    error,
    submitRequest,
    bumpRequest,
    refreshRequests: fetchRequests,
    canSubmitNewRequest,
  };
}
