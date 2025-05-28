
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Briefcase, UserCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, Listing, Message as MessageType } from '@/lib/types';
import { sampleUsers, sampleListings, sampleMessages, sampleConversations } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


interface ExtendedMessage extends MessageType {
  senderName: string;
  isOwnMessage?: boolean; // Not relevant for admin view, but keep for consistency if reusing components
}

interface ConversationDetails {
  id: string;
  buyer: User;
  seller: User;
  listing: Listing;
  messages: ExtendedMessage[];
  status: string;
}

// Helper to format timestamp
const formatTimestamp = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
};


export default function AdminConversationViewPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = React.useState<ConversationDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const convData = sampleConversations.find(c => c.conversationId === conversationId);
      if (!convData) {
        setConversation(null);
        setIsLoading(false);
        return;
      }

      const buyer = sampleUsers.find(u => u.id === convData.buyerId);
      const seller = sampleUsers.find(u => u.id === convData.sellerId);
      const listing = sampleListings.find(l => l.id === convData.listingId);

      if (!buyer || !seller || !listing) {
        setConversation(null);
        setIsLoading(false);
        return;
      }

      const conversationMessages = sampleMessages
        .filter(m => m.conversationId === conversationId)
        .map(m => ({
          ...m,
          senderName: sampleUsers.find(u => u.id === m.senderId)?.fullName || 'Unknown User',
          timestamp: new Date(m.timestamp), // Ensure timestamp is a Date object
        }))
        .sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());

      setConversation({
        id: convData.conversationId,
        buyer,
        seller,
        listing,
        messages: conversationMessages,
        status: convData.status || 'ACTIVE',
      });
      setIsLoading(false);
    }, 500);
  }, [conversationId]);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [conversation?.messages.length]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-6">Loading conversation details...</div>;
  }

  if (!conversation) {
    return <div className="flex h-full items-center justify-center p-6">Conversation not found.</div>;
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-var(--admin-sidebar-header-height,theme(spacing.20))-theme(spacing.12))] bg-brand-light-gray/30">
      <header className="flex items-center p-3 md:p-4 border-b border-brand-light-gray bg-brand-white shadow-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-grow">
          <h2 className="font-semibold text-base md:text-lg text-brand-dark-blue">Admin View: Conversation</h2>
          <p className="text-xs text-muted-foreground">
            Between: {conversation.buyer.fullName} (Buyer) & {conversation.seller.fullName} (Seller)
          </p>
          <p className="text-xs text-muted-foreground">
            Regarding: <Link href={`/listings/${conversation.listing.id}`} className="hover:underline text-brand-sky-blue">{conversation.listing.listingTitleAnonymous}</Link>
          </p>
        </div>
        <Badge variant={conversation.status === 'ACTIVE' ? 'default' : 'secondary'}
               className={conversation.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
            Status: {conversation.status}
        </Badge>
      </header>

      <ScrollArea className="flex-grow p-3 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {conversation.messages.map((msg) => {
            const isBuyerSender = msg.senderId === conversation.buyer.id;
            return (
            <div
              key={msg.messageId}
              className={cn(
                "flex w-full max-w-[85%] md:max-w-[70%] flex-col gap-1",
                isBuyerSender ? "mr-auto items-start" : "ml-auto items-end" // Buyer on left, Seller on right
              )}
            >
              <div className="text-xs text-muted-foreground px-1 mb-0.5 font-medium">
                {msg.senderName} ({isBuyerSender ? 'Buyer' : 'Seller'})
              </div>
              <div
                className={cn(
                  "rounded-xl px-3 py-2 md:px-4 md:py-2.5 shadow-sm text-sm",
                  isBuyerSender
                    ? "bg-brand-white text-brand-dark-blue border border-slate-200 dark:border-slate-700 rounded-bl-none" // Buyer messages
                    : "bg-brand-sky-blue/90 text-brand-white rounded-br-none" // Seller messages
                )}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.contentText}</p>
              </div>
              <span className="text-xs text-muted-foreground/80 px-1">
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
          )})}
          {conversation.messages.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>No messages in this conversation yet.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-3 md:p-4 border-t border-brand-light-gray bg-brand-white">
        <p className="text-xs text-muted-foreground text-center">
          This is a read-only admin view of the conversation. Actions like sending messages or archiving are placeholders.
        </p>
        {/* Placeholder for admin actions */}
        <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled>Archive Conversation (Placeholder)</Button>
        </div>
      </footer>
    </div>
  );
}

