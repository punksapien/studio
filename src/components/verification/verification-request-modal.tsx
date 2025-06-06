
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
  Loader2,
  Info
} from 'lucide-react';
import { useVerificationRequest } from '@/hooks/use-verification-request';

interface VerificationRequestModalProps {
  children: React.ReactNode;
  userListings?: Array<{
    id: string;
    listing_title_anonymous: string;
    status: string; // Listing's own status, e.g., 'active', 'pending_verification'
  }>;
  onSuccess?: () => void; // Callback to refresh dashboard data
}

export function VerificationRequestModal({ children, userListings = [], onSuccess }: VerificationRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestType, setRequestType] = useState<'user_verification' | 'listing_verification'>('user_verification');
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [reason, setReason] = useState('');

  const { requests, submitRequest, isLoading: isLoadingRequests, currentStatus: userProfileVerificationStatus } = useVerificationRequest();

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

    const success = await submitRequest(payload, onSuccess); // Pass onSuccess callback

    if (success) {
      setIsOpen(false); // Close modal on success
      // Reset form state after successful submission
      setReason('');
      setSelectedListingId('');
      // Optionally reset requestType or keep it based on UX preference
      // setRequestType('user_verification'); 
    }

    setIsSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New Request': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Docs Under Review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'More Info Requested': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New Request': return <Clock className="h-3 w-3" />;
      case 'Docs Under Review': return <FileText className="h-3 w-3" />;
      case 'Approved': return <CheckCircle2 className="h-3 w-3" />;
      case 'Contacted': case 'More Info Requested': case 'Rejected': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const pendingStatuses = ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'];

  const hasPendingUserVerification = useMemo(() => 
    requests.some(r => r.request_type === 'user_verification' && pendingStatuses.includes(r.status)) || userProfileVerificationStatus === 'pending_verification'
  , [requests, userProfileVerificationStatus]);

  const getPendingListingVerificationStatus = (listingId: string): string | null => {
    const req = requests.find(r => r.request_type === 'listing_verification' && r.listing_id === listingId && pendingStatuses.includes(r.status));
    return req ? req.status : null;
  };
  
  const isListingVerifiedOrPending = (listingId: string): boolean => {
    const listing = userListings.find(l => l.id === listingId);
    if (!listing) return false;
    // Check if there's an 'Approved' verification_request for this listing
    const hasApprovedRequest = requests.some(r => r.request_type === 'listing_verification' && r.listing_id === listingId && r.status === 'Approved');
    // Or check the listing's own status field
    const isListingStatusVerified = ['verified_anonymous', 'verified_with_financials', 'verified_public'].includes(listing.status);
    return hasApprovedRequest || isListingStatusVerified || !!getPendingListingVerificationStatus(listingId);
  };

  const eligibleListingsForNewRequest = useMemo(() => 
    userListings.filter(l => !isListingVerifiedOrPending(l.id))
  , [userListings, requests]);

  const isProfileVerificationDisabled = hasPendingUserVerification;
  const isListingVerificationEffectivelyDisabled = requestType === 'listing_verification' && (!selectedListingId || isListingVerifiedOrPending(selectedListingId));
  const isAnyListingVerificationDisabled = eligibleListingsForNewRequest.length === 0;

  // Determine if the selected listing for verification already has a pending request
  const selectedListingPendingStatus = selectedListingId ? getPendingListingVerificationStatus(selectedListingId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-semibold">
            <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
            Request Account or Listing Verification
          </DialogTitle>
          <DialogDescription>
            Submit a verification request to our team. Verified profiles and listings gain more trust and visibility.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto space-y-6 p-1 pr-3 -mr-1">
          {/* Current Verification Status Section */}
          {isLoadingRequests ? (
            <div className="flex justify-center items-center p-4"><Loader2 className="h-5 w-5 animate-spin" /> Loading current requests...</div>
          ) : requests.length > 0 ? (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <Info className="mr-2 h-4 w-4" /> Current Verification Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2.5 border bg-background rounded-md text-xs">
                    <div className="flex-1">
                      <p className="font-medium">
                        {request.request_type === 'user_verification' ? (
                          <><User className="inline h-3.5 w-3.5 mr-1.5" />Profile Verification</>
                        ) : (
                          <><FileText className="inline h-3.5 w-3.5 mr-1.5" />Listing: {request.listings?.listing_title_anonymous || 'N/A'}</>
                        )}
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 text-xs`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
             <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground text-center">No active verification requests found.</div>
          )}

          {/* Verification Type Selection */}
          <div className="space-y-3">
            <Label className="text-md font-semibold">What would you like to verify?</Label>
            <RadioGroup value={requestType} onValueChange={(value: 'user_verification' | 'listing_verification') => setRequestType(value)}>
              <Card className={`cursor-pointer transition-colors ${requestType === 'user_verification' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <CardContent className="flex items-start space-x-3 pt-4">
                  <RadioGroupItem value="user_verification" id="user_verification" disabled={isProfileVerificationDisabled} />
                  <div className="flex-1">
                    <Label htmlFor="user_verification" className={`cursor-pointer ${isProfileVerificationDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Profile Verification</span>
                        {isProfileVerificationDisabled && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 bg-yellow-100">Pending</Badge>
                        )}
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verify your business identity and credentials. This is generally required before verifying specific listings.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`cursor-pointer transition-colors ${requestType === 'listing_verification' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <CardContent className="flex items-start space-x-3 pt-4">
                  <RadioGroupItem value="listing_verification" id="listing_verification" disabled={isAnyListingVerificationDisabled} />
                  <div className="flex-1">
                    <Label htmlFor="listing_verification" className={`cursor-pointer ${isAnyListingVerificationDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Specific Listing Verification</span>
                        {isAnyListingVerificationDisabled && eligibleListingsForNewRequest.length === 0 && (
                          <Badge variant="outline" className="text-xs">No listings eligible</Badge>
                        )}
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verify specific business listings with financial documentation. Requires profile verification first.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Listing Selection for Listing Verification */}
          {requestType === 'listing_verification' && (
            <div className="space-y-2">
              <Label htmlFor="listing_select">Select Listing to Verify</Label>
              {eligibleListingsForNewRequest.length > 0 ? (
                <Select value={selectedListingId} onValueChange={setSelectedListingId} disabled={isAnyListingVerificationDisabled}>
                  <SelectTrigger id="listing_select">
                    <SelectValue placeholder="Choose a listing..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleListingsForNewRequest.map((listing) => (
                      <SelectItem key={listing.id} value={listing.id} disabled={isListingVerifiedOrPending(listing.id)}>
                        {listing.listing_title_anonymous}
                        {isListingVerifiedOrPending(listing.id) && (
                           <span className="ml-2 text-xs opacity-70">({getPendingListingVerificationStatus(listing.id) || 'Already Verified/Pending'})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/30">
                  {userListings.length === 0 ? "You have no listings." : "All your current listings are either already verified or have a pending verification request."} Create a new listing or check back later.
                </p>
              )}
               {selectedListingId && selectedListingPendingStatus && (
                <p className="text-sm text-yellow-600 mt-1">
                  This listing already has a verification request with status: <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 bg-yellow-100">{selectedListingPendingStatus}</Badge>.
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Verification / Additional Information</Label>
            <Textarea
              id="reason"
              placeholder={
                requestType === 'user_verification'
                  ? "Please tell us about your business background, why you're selling, and any relevant credentials or information that can help us verify your profile (e.g., company registration number, LinkedIn profile)."
                  : "Provide details about this listing, key financial metrics you can verify, and why you're seeking verification for this specific business (e.g., readiness to share financials, recent audit completion)."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={isProfileVerificationDisabled && requestType === 'user_verification' || isListingVerificationEffectivelyDisabled && requestType === 'listing_verification'}
            />
            <p className="text-xs text-muted-foreground">
              The more details you provide, the faster our team can process your request.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t mt-auto">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !reason.trim() ||
              (requestType === 'listing_verification' && (!selectedListingId || selectedListingPendingStatus)) || // Disable if listing is selected but already pending
              (requestType === 'user_verification' && isProfileVerificationDisabled)
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

