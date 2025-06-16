'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadWithProgressProps {
  label: string;
  description?: string;
  accept: string;
  maxSize?: number; // in bytes, defaults to 5MB
  currentFile?: File | null;
  currentUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onUploadComplete?: (url: string, filePath: string) => void;
  disabled?: boolean;
  required?: boolean;
  uploadEndpoint: string;
  documentType: string;
  authToken?: string;
  listingId?: string;
  className?: string;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function FileUploadWithProgress({
  label,
  description,
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  currentFile,
  currentUrl,
  onFileChange,
  onUploadComplete,
  disabled = false,
  required = false,
  uploadEndpoint,
  documentType,
  authToken,
  listingId,
  className
}: FileUploadWithProgressProps) {
  const [uploadState, setUploadState] = React.useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(currentUrl || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleButtonClick = () => {
    if (uploadState === 'uploading') return;
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`;
    }

    const allowedTypes = accept.split(',').map(type => type.trim());
    const isValidType = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `Invalid file type. Allowed: ${accept}`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<void> => {
    if (!authToken) {
      throw new Error('Authentication required for upload');
    }

    setUploadState('uploading');
    setUploadProgress(0);
    setUploadError(null);

    try {
              const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);
        if (listingId) {
          formData.append('listing_id', listingId);
          console.log('[FileUpload] Adding listing_id:', listingId);
        } else {
          console.log('[FileUpload] WARNING: No listing_id provided!');
        }

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.signedUrl) {
                setUploadedUrl(response.signedUrl);
                setUploadState('success');
                onUploadComplete?.(response.signedUrl, response.filePath);
                toast({
                  title: 'Upload Successful',
                  description: `${file.name} has been uploaded successfully.`
                });
                resolve();
              } else {
                throw new Error(response.error || 'Upload failed');
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

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timeout'));
        });

        xhr.open('POST', uploadEndpoint);
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        xhr.timeout = 60000; // 60 second timeout

        // Debug logging
        console.log('[FileUpload] FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
        }

        xhr.send(formData);
      });
    } catch (error) {
      throw error;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      onFileChange(null);
      setUploadedUrl(null);
      setUploadState('idle');
      setUploadProgress(0);
      return;
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      setUploadState('error');
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: validationError
      });
      return;
    }

    // Update file selection
    onFileChange(file);

    // Auto-upload if auth token is available
    if (authToken) {
      try {
        await uploadFile(file);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setUploadError(errorMessage);
        setUploadState('error');
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: errorMessage
        });
      }
    }
  };

  const getStatusIcon = () => {
    switch (uploadState) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadState) {
      case 'uploading':
        return 'border-blue-300 bg-blue-50';
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-white hover:bg-gray-50';
    }
  };

  const displayName = React.useMemo(() => {
    if (currentFile) return currentFile.name;
    if (uploadedUrl || currentUrl) {
      const url = uploadedUrl || currentUrl;
      return url?.split('/').pop()?.split('?')[0] || 'Uploaded file';
    }
    return null;
  }, [currentFile, uploadedUrl, currentUrl]);

  return (
    <FormItem className={className}>
      <FormLabel className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </FormLabel>

      <div className="space-y-3">
        {/* Upload Button */}
        <div className={cn(
          "flex items-center justify-between p-3 border rounded-lg transition-colors",
          getStatusColor()
        )}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              {displayName ? (
                <div>
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  {uploadState === 'success' && (
                    <p className="text-xs text-green-600">Upload complete</p>
                  )}
                  {uploadState === 'error' && uploadError && (
                    <p className="text-xs text-red-600">{uploadError}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No file selected</p>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={disabled || uploadState === 'uploading'}
            className="ml-3"
          >
            {uploadState === 'uploading' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {uploadState === 'uploading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          disabled={disabled}
        />
      </div>

      {description && (
        <FormDescription>{description}</FormDescription>
      )}

      <FormMessage />
    </FormItem>
  );
}
