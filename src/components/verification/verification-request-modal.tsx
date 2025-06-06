'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  User,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useVerificationRequest } from '@/hooks/use-verification-request';

interface VerificationRequestModalProps {
  children: React.ReactNode;
  userListings?: Array<{
    id: string;
    listing_title_anonymous: string;
    status: string;
  }>;
}

export function VerificationRequestModal({ children, userListings = [] }: VerificationRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestType, setRequestType] = useState<'user_verification' | 'listing_verification'>('user_verification');
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [reason, setReason] = useState('');

  const { requests, submitRequest } = useVerificationRequest();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      request_type: requestType,
      reason: reason.trim(),
      ...(requestType === 'listing_verification' && selectedListingId && { listing_id: selectedListingId })
    };

    const success = await submitRequest(payload);

    if (success) {
      setIsOpen(false);
      setReason('');
      setSelectedListingId('');
      setRequestType('user_verification');
    }

    setIsSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New Request':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Docs Under Review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'More Info Requested':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New Request':
        return <Clock className="h-3 w-3" />;
      case 'Contacted':
        return <AlertCircle className="h-3 w-3" />;
      case 'Docs Under Review':
        return <FileText className="h-3 w-3" />;
      case 'More Info Requested':
        return <AlertCircle className="h-3 w-3" />;
      case 'Approved':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'Rejected':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Check for existing pending requests
  const hasPendingUserVerification = requests.some(
    r => r.request_type === 'user_verification' &&
    ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'].includes(r.status)
  );

  const eligibleListings = userListings.filter(l =>
    l.status === 'active' || l.status === 'verified_anonymous'
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
            Request Verification
          </DialogTitle>
          <DialogDescription>
            Submit a verification request to unlock full seller benefits and gain buyer trust.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Verification Status */}
          {requests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Verification Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {requests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {request.request_type === 'user_verification' ? (
                          <><User className="inline h-4 w-4 mr-1" />Profile Verification</>
                        ) : (
                          <><FileText className="inline h-4 w-4 mr-1" />Listing Verification</>
                        )}
                      </p>
                      {request.listings && (
                        <p className="text-xs text-muted-foreground">
                          Listing: {request.listings.listing_title_anonymous}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Verification Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Verification Type</Label>
            <RadioGroup value={requestType} onValueChange={(value: 'user_verification' | 'listing_verification') => setRequestType(value)}>
              <Card className={`cursor-pointer transition-colors ${requestType === 'user_verification' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="flex items-start space-x-3 pt-4">
                  <RadioGroupItem value="user_verification" id="user_verification" disabled={hasPendingUserVerification} />
                  <div className="flex-1">
                    <Label htmlFor="user_verification" className="cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Profile Verification</span>
                        {hasPendingUserVerification && (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verify your business identity and credentials. Required for listing verification.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`cursor-pointer transition-colors ${requestType === 'listing_verification' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="flex items-start space-x-3 pt-4">
                  <RadioGroupItem value="listing_verification" id="listing_verification" disabled={eligibleListings.length === 0} />
                  <div className="flex-1">
                    <Label htmlFor="listing_verification" className="cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Listing Verification</span>
                        {eligibleListings.length === 0 && (
                          <Badge variant="outline" className="text-xs">No Eligible Listings</Badge>
                        )}
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verify specific business listings with financial documentation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Listing Selection for Listing Verification */}
          {requestType === 'listing_verification' && eligibleListings.length > 0 && (
            <div className="space-y-2">
              <Label>Select Listing to Verify</Label>
              <Select value={selectedListingId} onValueChange={setSelectedListingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a listing to verify" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleListings.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.listing_title_anonymous} ({listing.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Verification Request</Label>
            <Textarea
              id="reason"
              placeholder={
                requestType === 'user_verification'
                  ? "Tell us about your business background, why you're selling, and any relevant credentials..."
                  : "Provide details about your business, revenue metrics, and why you're seeking verification for this listing..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Provide detailed information to help our team process your verification request efficiently.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !reason.trim() ||
                (requestType === 'listing_verification' && !selectedListingId) ||
                (requestType === 'user_verification' && hasPendingUserVerification)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
