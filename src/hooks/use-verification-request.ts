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
  bump_enabled: boolean;
  bump_disabled_reason?: string;
  admin_locked_at?: string;
  admin_lock_reason?: string;
  user_notes?: string;
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
  bumpRequest: (requestId: string, reason?: string, onSuccessCallback?: () => void) => Promise<boolean>;
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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fastPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const bumpRequest = async (requestId: string, reason?: string, onSuccessCallback?: () => void): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/verification/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bump',
          request_id: requestId,
          reason: reason || null
        }),
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
    // First check if there's an existing pending request
    const existingRequest = requests.find(r => {
      if (r.request_type !== requestType) return false;
      if (requestType === 'listing_verification' && r.listing_id !== listingId) return false;
      if (requestType === 'user_verification' && r.listing_id !== null) return false;
      return r.is_pending;
    });

    if (!existingRequest) {
      // No existing request - check if they can submit based on most recent request of this type
      const mostRecentRequest = requests
        .filter(r => {
          if (r.request_type !== requestType) return false;
          if (requestType === 'listing_verification' && r.listing_id !== listingId) return false;
          if (requestType === 'user_verification' && r.listing_id !== null) return false;
          return true;
        })
        .sort((a, b) => new Date(b.last_request_time).getTime() - new Date(a.last_request_time).getTime())[0];

      if (!mostRecentRequest) {
        return { canSubmit: true };
      }

      // Calculate if enough time has passed since the last request
      const now = new Date();
      const lastRequestTime = new Date(mostRecentRequest.last_request_time);
      const timeDiff = (now.getTime() - lastRequestTime.getTime()) / 1000; // in seconds
      const timeoutSeconds = 20; // This should match VERIFICATION_REQUEST_TIMEOUT

      const canSubmit = timeDiff >= timeoutSeconds;
      const hoursRemaining = canSubmit ? 0 : Math.ceil((timeoutSeconds - timeDiff) / 3600 * 100) / 100;

      if (canSubmit) {
        return { canSubmit: true };
      } else {
        return {
          canSubmit: false,
          hoursRemaining,
          message: `You must wait ${timeoutSeconds} seconds between verification requests. Try again in ${Math.ceil(timeoutSeconds - timeDiff)} seconds.`
        };
      }
    }

    // There is an existing pending request - check if they can bump it
    if (existingRequest.can_bump) {
      return {
        canSubmit: false,
        message: 'You have a pending request. You can bump it to the top of the queue.'
      };
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

    // Regular polling every 90 seconds for status updates (increased to avoid conflicts)
    pollingIntervalRef.current = setInterval(() => {
      fetchRequests();
    }, 90000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchRequests]);

  // Set up fast polling for countdown timers when there are pending requests with bump timers
  useEffect(() => {
    const hasActiveCountdowns = requests.some(req =>
      req.is_pending &&
      req.hours_until_can_bump > 0 &&
      req.hours_until_can_bump < 24 // Only fast poll if less than 24 hours remaining
    );

    if (hasActiveCountdowns) {
      console.log('[VERIFICATION] Starting fast polling for countdown timers');
      fastPollingIntervalRef.current = setInterval(() => {
        fetchRequests();
      }, 20000); // Poll every 20 seconds for countdown updates (increased from 10s)
    } else {
      if (fastPollingIntervalRef.current) {
        console.log('[VERIFICATION] Stopping fast polling - no active countdowns');
        clearInterval(fastPollingIntervalRef.current);
        fastPollingIntervalRef.current = null;
      }
    }

    return () => {
      if (fastPollingIntervalRef.current) {
        clearInterval(fastPollingIntervalRef.current);
        fastPollingIntervalRef.current = null;
      }
    };
  }, [requests, fetchRequests]);

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
