'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2, Loader2, Mail, AlertCircle, Pencil, Check, X, Plus } from "lucide-react";
import { useState, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useCurrentUser, updateUserProfile } from "@/hooks/use-current-user";
import { useVerificationRequest } from "@/hooks/use-verification-request";
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";

const VERIFICATION_DESCRIPTION = 'Get verified to unlock full marketplace access and build trust with sellers.';

// Fallback if Suspense is not wrapping this page for searchParams
function BuyerVerificationContent() {
  const { toast } = useToast();
  const { user, profile, loading: isLoadingUser, refreshAuth } = useCurrentUser();
  const {
    requests,
    currentStatus: userProfileVerificationStatus,
    isLoading: isLoadingRequests,
    bumpRequest,
    refreshRequests
  } = useVerificationRequest();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Optional additional contact fields
  const [additionalEmail, setAdditionalEmail] = useState('');
  const [additionalPhone, setAdditionalPhone] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const isLoading = isLoadingUser || isLoadingRequests;

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      toast({
        title: "Name Required",
        description: "Your name cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingName(true);
    try {
      await updateUserProfile({ full_name: trimmed });
      await refreshAuth();
      setIsEditingName(false);
      toast({
        title: "Name Updated",
        description: "Your name has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update your name. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleBump = async (requestId: string, reason?: string) => {
    const success = await bumpRequest(requestId, reason, () => {
      refreshRequests(); // Refresh after successful bump
    });
    return success;
  };

  const handleRequestVerification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 🔒 TRUST MIDDLEWARE: If we're here, user is authenticated
    // Only validate that we have the necessary data, don't block on auth checks
    if (!profile?.phone_number) {
      toast({
        title: "Phone Number Required",
        description: "Please add a phone number to your profile before requesting verification.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        request_type: 'user_verification',
        reason: 'Buyer profile verification request',
        phone_number: profile.phone_number, // Use phone number from profile
        additional_email: additionalEmail.trim() || undefined,
        additional_phone: additionalPhone.trim() || undefined
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

        // Refresh verification requests to show updated status
        refreshRequests();
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

  // 🚀 GRACEFUL LOADING: Show loading state while auth context initializes
  if (isLoading) {
    return (
      <DashboardPageShell title="Verification" description={VERIFICATION_DESCRIPTION} scrollable>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading verification status...</p>
        </div>
      </DashboardPageShell>
    );
  }

  // 🔒 TRUST MIDDLEWARE: Only handle genuine data loading issues
  // If middleware allowed access, user is authenticated as buyer
  if (!profile && !isLoadingUser) {
    return (
      <DashboardPageShell title="Verification" description={VERIFICATION_DESCRIPTION} scrollable>
        <div className="space-y-8 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Profile Loading Issue</h2>
            <p className="text-muted-foreground mt-2">
              We're having trouble loading your profile data. This is usually temporary.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  // 🛡️ ROLE VALIDATION: Only validate role if we have profile data
  if (profile && profile.role !== 'buyer') {
     return (
      <DashboardPageShell title="Verification" description={VERIFICATION_DESCRIPTION} scrollable>
        <div className="space-y-8 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Incorrect Role</h2>
            <p className="text-muted-foreground mt-2">
              This is the buyer verification page. Your current role: {profile.role}
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href={profile.role === 'seller' ? '/seller-dashboard' : '/dashboard'}>
              Go to {profile.role === 'seller' ? 'Seller' : 'Main'} Dashboard
            </Link>
          </Button>
        </div>
      </DashboardPageShell>
    );
  }

  // Check if user has a pending verification request
  const hasPendingRequest = requests.some((r: any) =>
    r.request_type === 'user_verification' &&
    ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'].includes(r.status)
  );

      const renderStatusCard = () => {
    // If user already has a pending request, show pending status
    if (hasPendingRequest || userProfileVerificationStatus === 'pending_verification') {
      const pendingRequest = requests.find((r: any) =>
        ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'].includes(r.status)
      );

      return (
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300">
              <Mail className="h-7 w-7" /> Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-600 dark:text-blue-400">
              Your verification request has been submitted and is currently {pendingRequest?.status.toLowerCase() || 'being processed'}.
              Our team will contact you at the phone number provided.
            </p>
          </CardContent>
        </Card>
      );
    }

    // If user is already verified
    if (userProfileVerificationStatus === 'verified') {
      return (
        <Card className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-7 w-7" /> You are a Verified Buyer!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 dark:text-green-400">
              Congratulations! Your buyer profile is fully verified.
              You now have access to all platform features and can view complete listing details.
            </p>
          </CardContent>
        </Card>
      );
    }

    // Under the concierge model, buyer verification is team-handled: show a
    // passive informational card instead of the self-service request form.
    if (process.env.NEXT_PUBLIC_BUYER_VERIFICATION_LOCKDOWN === 'true') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-7 w-7 text-primary" /> Verification in progress
            </CardTitle>
            <CardDescription>
              Our team reviews and verifies every buyer account. We'll be in touch within 72 hours — nothing else is required from you right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Want to speed things up? Completing your details helps our team verify you faster.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/onboarding">Finish your details</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Show verification form for anonymous or rejected users
    return renderVerificationForm();
  };

    const renderVerificationForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-7 w-7 text-primary" /> Become a Verified Buyer
        </CardTitle>
        <CardDescription>
          Unlock full platform access and build trust. Verified buyers gain access to detailed listings and seller contact information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRequestVerification} className="space-y-6">
          <div className="rounded-lg border divide-y">
            {/* Name row (inline editable) */}
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                {isEditingName ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      disabled={isSavingName}
                      autoFocus
                      placeholder="Your full name"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      aria-label="Save name"
                    >
                      {isSavingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsEditingName(false)}
                      disabled={isSavingName}
                      aria-label="Cancel editing name"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="mt-1 text-sm">{profile?.full_name || 'Not provided'}</p>
                )}
              </div>
              {!isEditingName && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setNameValue(profile?.full_name || '');
                    setIsEditingName(true);
                  }}
                  aria-label="Edit name"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Email row */}
            <div className="p-4">
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="mt-1 text-sm">{profile?.email || user?.email || 'Not provided'}</p>
              {showEmailInput ? (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="Additional email (optional)"
                    value={additionalEmail}
                    onChange={(e) => setAdditionalEmail(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setShowEmailInput(false);
                      setAdditionalEmail('');
                    }}
                    aria-label="Remove additional email"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-primary"
                  onClick={() => setShowEmailInput(true)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add another email
                </Button>
              )}
            </div>

            {/* Phone row */}
            <div className="p-4">
              <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
              <p className="mt-1 text-sm">{profile?.phone_number || 'Not provided'}</p>
              {showPhoneInput ? (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="tel"
                    placeholder="Additional phone (optional)"
                    value={additionalPhone}
                    onChange={(e) => setAdditionalPhone(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setShowPhoneInput(false);
                      setAdditionalPhone('');
                    }}
                    aria-label="Remove additional phone"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-primary"
                  onClick={() => setShowPhoneInput(true)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add another phone
                </Button>
              )}
            </div>
          </div>

          {!profile?.phone_number && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="pt-4">
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  <strong>Phone number required:</strong> Please add a phone number to your profile before requesting verification.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/dashboard/profile">Update Profile</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !profile?.phone_number}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Request Verification
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

    return (
    <DashboardPageShell title="Verification" description={VERIFICATION_DESCRIPTION} scrollable>
      {renderStatusCard()}
    </DashboardPageShell>
    );
  }

export default function BuyerVerificationPage() {
  return (
    <Suspense
      fallback={
        <DashboardPageShell title="Verification" description={VERIFICATION_DESCRIPTION} scrollable>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading...</p>
          </div>
        </DashboardPageShell>
      }
    >
      <BuyerVerificationContent />
    </Suspense>
  );
}
