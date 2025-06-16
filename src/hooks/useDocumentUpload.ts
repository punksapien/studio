'use client';

import { useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  success: boolean;
  signedUrl?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  listingUpdated?: boolean;
  error?: string;
}

interface UseDocumentUploadReturn {
  uploadDocument: (file: File, documentType: string, listingId?: string) => Promise<UploadResult>;
  uploadProgress: UploadProgress | null;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

export function useDocumentUpload(): UseDocumentUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const reset = useCallback(() => {
    setUploadProgress(null);
    setIsUploading(false);
    setError(null);
  }, []);

  const uploadDocument = useCallback(async (
    file: File,
    documentType: string,
    listingId?: string
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Get the current session for auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`);
      }

      const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/jpeg',
        'image/png'
      ];

      if (!allowedMimeTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PDF, XLSX, CSV, JPG, and PNG files allowed.');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      if (listingId) {
        formData.append('listing_id', listingId);
      }

      // Create upload request with progress tracking
      const uploadResult = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setUploadProgress({
              loaded: event.loaded,
              total: event.total,
              percentage
            });
          }
        });

        // Handle successful response
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve({
                  success: true,
                  signedUrl: response.signedUrl,
                  filePath: response.filePath,
                  fileName: response.fileName,
                  fileSize: response.fileSize,
                  listingUpdated: response.listingUpdated
                });
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch (parseError) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        // Handle network errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        // Handle timeout
        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timeout - please try again'));
        });

        // Configure and send request
        xhr.open('POST', '/api/listings/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.timeout = 120000; // 2 minute timeout for large files
        xhr.send(formData);
      });

      // Success notification
      toast({
        title: 'Upload Successful',
        description: `${file.name} has been uploaded successfully.`
      });

      return uploadResult;

    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      setError(errorMessage);

      // Error notification
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsUploading(false);
    }
  }, [supabase, toast]);

  return {
    uploadDocument,
    uploadProgress,
    isUploading,
    error,
    reset
  };
}

export default useDocumentUpload;
