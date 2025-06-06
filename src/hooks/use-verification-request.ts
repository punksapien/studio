'use client';

import { useState, useEffect } from 'react';
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
  listings?: {
    listing_title_anonymous: string;
    status: string;
  };
}

interface VerificationRequestPayload {
  request_type: 'user_verification' | 'listing_verification';
  listing_id?: string;
  reason: string;
}

interface UseVerificationRequestReturn {
  requests: VerificationRequest[];
  currentStatus: string;
  isLoading: boolean;
  error: string | null;
  submitRequest: (payload: VerificationRequestPayload) => Promise<boolean>;
  refreshRequests: () => Promise<void>;
}

export function useVerificationRequest(): UseVerificationRequestReturn {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('anonymous');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/verification/request', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
    }
  };

  const submitRequest = async (payload: VerificationRequestPayload): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/verification/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
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
        title: "Verification Request Submitted",
        description: data.message || "Your verification request has been submitted successfully.",
      });

      // Refresh the requests list
      await fetchRequests();
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

  const refreshRequests = async () => {
    await fetchRequests();
  };

  // Fetch requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    currentStatus,
    isLoading,
    error,
    submitRequest,
    refreshRequests,
  };
}
