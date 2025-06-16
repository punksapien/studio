
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

  const { user, profile, isLoading, error, hasRole } = useRequiredRole('seller');

  const handleBack = () => {
    router.push('/seller-dashboard/messages'); // Changed to go back to messages list
  };

  const currentUser: User | null = user && profile && hasRole ? {
    id: user.id,
    full_name: profile.full_name || 'Seller',
    avatar_url: profile.avatar_url,
    role: 'seller',
    verification_status: profile.verification_status || 'anonymous'
  } : null;

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading conversation...</span>
        </div>
      </div>
    );
  }

  if (error || !hasRole) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">Access Error</h2>
            <p className="text-muted-foreground mb-4">{error || 'This page is for sellers only'}</p>
            <div className="space-y-2">
              <Button asChild>
                <Link href="/seller-dashboard">
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
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
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
    <div className="flex flex-col h-full"> {/* Make page take full height */}
      {/* Chat Interface - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          conversationId={conversationId}
          currentUser={currentUser}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
