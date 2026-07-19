
'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatInterface from '@/components/shared/ChatInterface';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRequiredRole } from '@/hooks/use-auth-store';
import { DashboardPageShell } from '@/components/shared/dashboard-page-shell';

interface User {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: 'buyer' | 'seller';
  verification_status: string;
}

export default function BuyerMessagePage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const { user, profile, isLoading, error, hasRole } = useRequiredRole('buyer');

  const handleBack = () => {
    router.push('/dashboard/messages'); // Changed to go back to messages list
  };

  const currentUser: User | null = user && profile && hasRole ? {
    id: user.id,
    full_name: profile.full_name || 'Buyer',
    avatar_url: profile.avatar_url,
    role: 'buyer',
    verification_status: profile.verification_status || 'anonymous'
  } : null;

  if (isLoading) {
    return (
      <DashboardPageShell title="Conversation" description="Your conversation with the seller.">
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading conversation...</span>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  if (error || !hasRole) {
    return (
      <DashboardPageShell title="Conversation" description="Your conversation with the seller.">
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-destructive mb-2">Access Error</h2>
              <p className="text-muted-foreground mb-4">{error || 'This page is for buyers only'}</p>
              <div className="space-y-2">
                <Button asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                  </Link>
                </Button>
                {!user && (
                  <Button variant="outline" asChild>
                    <Link href="/auth/login">Login</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardPageShell>
    );
  }

  if (!currentUser) {
    return (
      <DashboardPageShell title="Conversation" description="Your conversation with the seller.">
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-12">
              <h2 className="text-lg font-semibold mb-4">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You must be logged in as a buyer to view this conversation.
              </p>
              <Button asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell title="Conversation" description="Your conversation with the seller.">
      <div className="flex-1 min-h-0">
        <ChatInterface
          conversationId={conversationId}
          currentUser={currentUser}
          onBack={handleBack}
        />
      </div>
    </DashboardPageShell>
  );
}
