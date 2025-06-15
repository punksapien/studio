
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, CheckCircle2, Loader2, ArrowRight, Clock, AlertCircle, MessageSquare, FileText } from "lucide-react"; // Added icons
import { useState, useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerificationRequest } from "@/hooks/use-verification-request"; // Import the specific hook
import VerificationRequestCard from "@/components/verification/VerificationRequestCard"; // Import the new card

// Fallback if Suspense is not wrapping this page for searchParams
function BuyerVerificationContent() {
  const { toast } = useToast();
  const { profile, loading: isLoadingUser } = useCurrentUser();
  const {
    requests,
    currentStatus: userProfileVerificationStatus,
    isLoading: isLoadingRequests,
    submitRequest,
    bumpRequest,
    refreshRequests
  } = useVerificationRequest(); // Use the specific hook for verification logic
  const router = useRouter();

  const isLoading = isLoadingUser || isLoadingRequests;

  useEffect(() => {
    if (!isLoading && profile && profile.role === 'buyer') {
      if (userProfileVerificationStatus === 'anonymous' || userProfileVerificationStatus === 'rejected') {
        // If user is anonymous or rejected, guide them to the onboarding start
        router.replace('/onboarding/buyer/1');
      }
    }
  }, [profile, userProfileVerificationStatus, isLoading, router]);

  const handleBump = async (requestId: string, reason?: string) => {
    const success = await bumpRequest(requestId, reason, () => {
      // Optionally do something on success, like refresh data again if needed
      refreshRequests();
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
            <CardContent>
              <p className="text-blue-600 dark:text-blue-400 mb-1">
                Your verification request is currently being processed.
              </p>
              <p className="text-sm text-blue-500 dark:text-blue-300 mb-4">
                Our team is reviewing your information and will contact you soon. Please check your email for updates.
              </p>
               {requests.filter(r => r.request_type === 'user_verification' && r.is_pending).map(req => (
                <VerificationRequestCard key={req.id} request={req} onBump={handleBump} />
              ))}
              <Button asChild variant="outline" className="mt-3">
                  <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        );
      // If anonymous or rejected, user should have been redirected by useEffect.
      // This is a fallback.
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
                Redirecting you to the verification process...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
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

