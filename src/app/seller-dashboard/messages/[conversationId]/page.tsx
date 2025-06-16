'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatInterface from '@/components/shared/ChatInterface';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRequiredRole } from '@/hooks/use-auth-store';

interface User {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: 'buyer' | 'seller';
  verification_status: string;
}

export default function SellerMessagePage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  // Use centralized auth store - prevents redundant API calls
  const { user, profile, isLoading, error, hasRole } = useRequiredRole('seller');

  const handleBack = () => {
    router.push('/seller-dashboard/inquiries');
  };

  // Format user data for ChatInterface
  const currentUser: User | null = user && profile && hasRole ? {
    id: user.id,
    full_name: profile.full_name || 'Seller',
    avatar_url: profile.avatar_url,
    role: 'seller',
    verification_status: profile.verification_status || 'anonymous'
  } : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading conversation...</span>
        </div>
      </div>
    );
  }

  // Error state or role mismatch
  if (error || !hasRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Access Error
            </h2>
            <p className="text-muted-foreground mb-4">{error || 'This page is for sellers only'}</p>
            <div className="space-y-2">
              <Button asChild>
                <Link href="/seller-dashboard/inquiries">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Inquiries
                </Link>
              </Button>
              {!user && (
                <Button variant="outline" asChild>
                  <Link href="/auth/login">
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Auth check
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You must be logged in as a seller to view this conversation.
            </p>
            <Button asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inquiries
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-brand-dark-blue">
          Conversation
        </h1>
        <p className="text-muted-foreground">
          Chat with your potential buyer about the business opportunity.
        </p>
      </div>

      {/* Chat Interface */}
      <ChatInterface
        conversationId={conversationId}
        currentUser={currentUser}
        onBack={handleBack}
      />

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          This conversation is facilitated by our admin team.
          Please maintain professional communication at all times.
        </p>
      </div>
    </div>
  );
}
