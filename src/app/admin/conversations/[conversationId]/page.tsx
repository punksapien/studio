'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import ChatInterface from '@/components/shared/ChatInterface';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: 'buyer' | 'seller' | 'admin';
  verification_status: string;
}

interface Listing {
  id: string;
  listing_title_anonymous: string;
  asking_price: number;
  industry: string;
}

interface ConversationData {
  id: string;
  inquiryId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  createdAt: string;
  listing?: Listing;
  buyer?: User;
  seller?: User;
}

export default function AdminConversationViewPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const routeId = params.conversationId as string; // Could be conversation ID or inquiry ID

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock admin user for ChatInterface
  const adminUser: User = {
    id: 'admin-user',
    full_name: 'Admin',
    role: 'admin',
    verification_status: 'verified'
  };

  useEffect(() => {
    const fetchConversation = async () => {
      try {
    setIsLoading(true);
        setError(null);

        // First, try to fetch as conversation ID
        let response = await fetch(`/api/conversations/${routeId}`, {
          credentials: 'include'
        });

        if (response.ok) {
          // It's a conversation ID
          const data = await response.json();
          setConversation(data.conversation);
          setConversationId(routeId);
        return;
      }

        // If that failed, try to find conversation by inquiry ID
        response = await fetch(`/api/inquiries/${routeId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Neither conversation nor inquiry found with this ID');
        }

        const inquiryData = await response.json();
        const inquiry = inquiryData.inquiry;

        if (!inquiry.conversation_id) {
          throw new Error('This inquiry does not have an associated conversation yet');
        }

        // Now fetch the conversation using the conversation_id from the inquiry
        const conversationResponse = await fetch(`/api/conversations/${inquiry.conversation_id}`, {
          credentials: 'include'
        });

        if (!conversationResponse.ok) {
          throw new Error('Failed to fetch conversation details');
        }

        const conversationData = await conversationResponse.json();
        setConversation(conversationData.conversation);
        setConversationId(inquiry.conversation_id);

      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };

    if (routeId) {
      fetchConversation();
    }
  }, [routeId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading conversation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Conversation</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!conversation || !conversationId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Conversation Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The conversation you're looking for doesn't exist or hasn't been created yet.
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-semibold">Admin Conversation View</h1>
            <Badge variant={conversation.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {conversation.status}
            </Badge>
        </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <strong>Buyer:</strong> {conversation.buyer?.full_name}
            </span>
            <span>•</span>
            <span>
              <strong>Seller:</strong> {conversation.seller?.full_name}
            </span>
            {conversation.listing && (
              <>
                <span>•</span>
                <Link
                  href={`/listings/${conversation.listingId}`}
                  className="hover:underline text-primary flex items-center gap-1"
                  target="_blank"
                >
                  {conversation.listing.listing_title_anonymous}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            )}
              </div>
              </div>

        {conversation.listing && (
          <div className="text-right">
            <div className="text-sm font-medium">
              {formatPrice(conversation.listing.asking_price)}
            </div>
            <div className="text-xs text-muted-foreground">
              {conversation.listing.industry}
            </div>
            </div>
          )}
        </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          conversationId={conversationId}
          currentUser={adminUser}
          onBack={() => router.back()}
        />
      </div>

      {/* Admin Footer */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Admin view - You can observe this conversation between the buyer and seller.
        </p>
        </div>
    </div>
  );
}

