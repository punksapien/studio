'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, CheckCircle2, Mail, FileText, Loader2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useVerificationRequest } from "@/hooks/use-verification-request";

function SellerVerificationContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, profile, loading: isLoadingUser } = useCurrentUser();
  const { requests, currentStatus, isLoading: isLoadingRequests } = useVerificationRequest();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationType, setVerificationType] = useState<'profile' | 'listing'>('profile');
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>(searchParams.get('listingId') || undefined);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);

  // Fetch user's listings
  useEffect(() => {
    if (user && profile && profile.role === 'seller') {
      setIsLoadingListings(true);
      fetch('/api/user/listings')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.listings) {
            // Filter for unverified listings that aren't already pending verification
            const unverifiedListings = data.listings.filter((l: any) =>
              !l.is_seller_verified &&
              l.status !== 'pending_verification' &&
              l.status !== 'rejected_by_admin'
            );
            setUserListings(unverifiedListings);

            // Set initial listing if specified in URL
            const initialListingId = searchParams.get('listingId');
            if (initialListingId && unverifiedListings.find((l: any) => l.id === initialListingId)) {
              setVerificationType('listing');
              setSelectedListingId(initialListingId);
            }
          }
        })
        .catch(error => {
          console.error('Failed to fetch listings:', error);
          toast({
            title: "Error",
            description: "Failed to load your listings",
            variant: "destructive"
          });
        })
        .finally(() => setIsLoadingListings(false));
    }
  }, [user, profile, searchParams, toast]);

  const handleRequestVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !profile) return;

    const formData = new FormData(event.currentTarget);
    const phoneNumber = formData.get('phoneNumber') as string;
    const bestTimeToCall = formData.get('bestTimeToCall') as string;
    const notes = formData.get('notes') as string;

    setIsSubmitting(true);

    try {
      const requestData = {
        request_type: verificationType === 'profile' ? 'user_verification' : 'listing_verification',
        listing_id: verificationType === 'listing' ? selectedListingId : undefined,
        reason: verificationType === 'profile'
          ? 'Seller profile verification request'
          : `Listing verification request for listing ID: ${selectedListingId}`,
        phone_number: phoneNumber,
        best_time_to_call: bestTimeToCall,
        user_notes: notes
      };

      const response = await fetch('/api/verification/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Verification Request Submitted",
          description: "Our team has received your request and will contact you soon.",
        });

        // Refresh the page to show updated status
        window.location.reload();
      } else {
        throw new Error(result.error || 'Failed to submit verification request');
      }
    } catch (error) {
      console.error('Verification request error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit verification request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has a pending verification request
  const hasPendingRequest = requests.some(r =>
    ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'].includes(r.status)
  );

  if (isLoadingUser || isLoadingRequests) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Remove redundant auth check - middleware already handles this!
  // If user reaches here, they're authenticated as a seller

  const renderStatusCard = () => {
    // If user already has a pending request, show pending status
    if (hasPendingRequest || currentStatus === 'pending_verification') {
      const pendingRequest = requests.find(r =>
        ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'].includes(r.status)
      );

      return (
        <Card className="shadow-lg bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Mail className="h-7 w-7" /> Verification Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-600 dark:text-blue-400">
              Your verification request has been submitted and is currently {pendingRequest?.status.toLowerCase() || 'being processed'}.
              Our team will contact you at the phone number provided.
            </p>
            {pendingRequest?.best_time_to_call && (
              <p className="text-sm text-blue-500 dark:text-blue-300 mt-2">
                Best time to call: {pendingRequest.best_time_to_call}
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    // If user is already verified
    if (currentStatus === 'verified') {
      return (
        <Card className="shadow-lg bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-7 w-7" /> You are a Verified Seller!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 dark:text-green-400">
              Congratulations! Your seller profile is fully verified.
              You can now create verified listings that will display full details to buyers.
            </p>
            {userListings.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                  You have {userListings.length} listing(s) that can be verified:
                </p>
                <Button
                  onClick={() => {
                    setVerificationType('listing');
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }}
                  variant="outline"
                >
                  Verify a Listing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    // Show verification form for anonymous or rejected users
    return renderVerificationForm();
  };

  const renderVerificationForm = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" /> Become a Verified Seller / Verify Listing
        </CardTitle>
        <CardDescription>
          Unlock full platform access and build trust. Verified sellers and listings gain more visibility and credibility.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRequestVerification} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormItemDisabled label="Full Name" value={profile?.full_name} />
            <FormItemDisabled label="Email" value={profile?.email || user?.email} />
            <FormItemDisabled label="Phone Number" value={profile?.phone_number} />
          </div>

          <div>
            <Label htmlFor="verificationType">What would you like to verify?</Label>
            <Select
              value={verificationType}
              onValueChange={(value) => {
                setVerificationType(value as 'profile' | 'listing');
                if (value === 'profile') setSelectedListingId(undefined);
              }}
            >
              <SelectTrigger id="verificationType">
                <SelectValue placeholder="Select verification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profile">General Seller Profile Verification</SelectItem>
                <SelectItem value="listing" disabled={userListings.length === 0}>
                  Specific Listing Verification {userListings.length === 0 && '(No listings available)'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {verificationType === 'listing' && userListings.length > 0 && (
            <div>
              <Label htmlFor="listingToVerify">Select Listing to Verify</Label>
              <Select value={selectedListingId} onValueChange={setSelectedListingId}>
                <SelectTrigger id="listingToVerify">
                  <SelectValue placeholder="Select an unverified listing" />
                </SelectTrigger>
                <SelectContent>
                  {userListings.map(listing => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.listing_title_anonymous} ({listing.industry})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="bestTimeToCall">Best Time to Call (Optional)</Label>
            <Input
              id="bestTimeToCall"
              name="bestTimeToCall"
              placeholder="e.g., Weekdays 2-4 PM SGT"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any specific information or questions for our team?"
              className="resize-none"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isSubmitting || (verificationType === 'listing' && !selectedListingId)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Request Verification Call'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Seller & Listing Verification</h1>
      {renderStatusCard()}
    </div>
  );
}

function FormItemDisabled({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Input value={value || 'N/A'} disabled className="mt-1 bg-muted/50" />
    </div>
  );
}

export default function SellerVerificationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SellerVerificationContent />
    </Suspense>
  );
}

