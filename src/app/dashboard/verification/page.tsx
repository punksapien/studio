
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, CheckCircle2, Loader2, ArrowRight, Clock, AlertCircle, MessageSquare, FileText, Send, TrendingUp, Timer } from "lucide-react"; // Added icons
import { useState, useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerificationRequest } from "@/hooks/use-verification-request"; // Import the specific hook
import VerificationRequestCard from "@/components/verification/VerificationRequestCard"; // Import the new card
import { VERIFICATION_CONFIG } from "@/lib/verification-config";

// Fallback if Suspense is not wrapping this page for searchParams
function BuyerVerificationContent() {
  const { toast } = useToast();
  const { profile, loading: isLoadingUser } = useCurrentUser();
  const {
    requests,
    currentStatus: userProfileVerificationStatus,
    isLoading: isLoadingRequests,
    bumpRequest, // Using bumpRequest from the hook
    refreshRequests
  } = useVerificationRequest(); // Use the specific hook for verification logic
  const router = useRouter();

  const isLoading = isLoadingUser || isLoadingRequests;

  useEffect(() => {
    if (!isLoading && profile && profile.role === 'buyer') {
      // If user is anonymous or rejected, AND onboarding is not complete (step 0 means not started or reset)
      // guide them to the onboarding start.
      // If onboarding_step_completed is 1 or more, it implies they are in or have passed the onboarding process.
      if ((userProfileVerificationStatus === 'anonymous' || userProfileVerificationStatus === 'rejected') && 
          (profile.onboarding_step_completed || 0) < 2) { // Buyer onboarding has 2 steps before success
        router.replace('/onboarding/buyer/1');
      }
    }
  }, [profile, userProfileVerificationStatus, isLoading, router]);

  const handleBump = async (requestId: string, reason?: string) => {
    const success = await bumpRequest(requestId, reason, () => {
      refreshRequests(); // Refresh after successful bump
    });
    return success;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading verification status...</p>
      </div>
    );
  }

  if (!profile || profile.role !== 'buyer') {
     return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in as a buyer to view this page.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }

  const renderStatusCard = () => {
    const pendingUserRequests = requests.filter(r => 
        r.request_type === 'user_verification' && 
        ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'].includes(r.status)
    );

    switch (userProfileVerificationStatus) {
      case 'verified':
        return (
          <Card className="shadow-lg bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 font-heading">
                <CheckCircle2 className="h-7 w-7" /> You are a Verified Buyer!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 dark:text-green-400 mb-4">
                Congratulations! Your buyer profile is fully verified.
                You have access to all platform features.
              </p>
              <Button asChild className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                <Link href="/marketplace">
                  Explore Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      case 'pending_verification':
        return (
          <Card className="shadow-lg bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-heading">
                <Clock className="h-7 w-7" /> Verification Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-600 dark:text-blue-400 mb-1">
                Your verification request is currently being processed.
              </p>
              <p className="text-sm text-blue-500 dark:text-blue-300 mb-4">
                Our team is reviewing your information and will contact you soon. Please check your email for updates.
              </p>
              {pendingUserRequests.length > 0 ? (
                pendingUserRequests.map(req => (
                  <VerificationRequestCard key={req.id} request={req} onBump={handleBump} isProcessing={isLoadingRequests} />
                ))
              ) : (
                <p className="text-sm text-blue-500 dark:text-blue-300">No active verification request details found, but your profile is pending review.</p>
              )}
              <Button asChild variant="outline" className="mt-3">
                  <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        );
      // If anonymous or rejected, user should have been redirected by useEffect.
      // This is a fallback if redirect hasn't happened yet or for direct navigation.
      default:
        return (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <User className="h-7 w-7 text-primary" /> Start Your Verification
              </CardTitle>
              <CardDescription>
                Complete a few simple steps to become a verified buyer on Nobridge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {userProfileVerificationStatus === 'rejected'
                  ? 'Your previous verification was rejected. Please restart the process.'
                  : 'Please complete your profile verification to access more features.'}
              </p>
              <Button asChild className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                <Link href="/onboarding/buyer/1">
                   Start Buyer Verification <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-center text-brand-dark-blue font-heading">Buyer Account Verification</h1>
      {renderStatusCard()}
    </div>
  );
}


export default function BuyerVerificationPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/> Loading...</div>}>
      <BuyerVerificationContent />
    </Suspense>
  );
}
