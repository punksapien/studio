
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Paperclip, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, Listing, Message as MessageType } from '@/lib/types';
import { sampleUsers, sampleListings, sampleConversations, sampleMessages } from '@/lib/placeholder-data';

interface ExtendedMessage extends MessageType {
  senderName: string;
  isOwnMessage: boolean;
}

interface ConversationDetails {
  id: string;
  otherParty: {
    id: string;
    name: string;
    role: 'buyer' | 'seller';
    avatarUrl?: string;
  };
  listing: {
    id: string;
    title: string;
  };
  messages: ExtendedMessage[];
}

// Placeholder current user ID - BUYER for this page
const currentUserId = 'user2'; // Jane Smith (Buyer) for sample conv1

// Helper to format timestamp
const formatTimestamp = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (messageDate.getTime() === new Date(today.getTime() - 24 * 60 * 60 * 1000).getTime()) {
    return 'Yesterday, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};


export default function BuyerConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = React.useState<ConversationDetails | null>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const convData = sampleConversations.find(c => c.conversationId === conversationId && c.buyerId === currentUserId);
      if (!convData) {
        setConversation(null);
        setIsLoading(false);
        return;
      }

      const buyer = sampleUsers.find(u => u.id === convData.buyerId); // Should be currentUserId
      const seller = sampleUsers.find(u => u.id === convData.sellerId);
      const listing = sampleListings.find(l => l.id === convData.listingId);

      if (!buyer || !seller || !listing) {
        setConversation(null);
        setIsLoading(false);
        return;
      }

      const otherPartyDetails = seller; // For buyer, other party is seller

      const conversationMessages = sampleMessages
        .filter(m => m.conversationId === conversationId)
        .map(m => ({
          ...m,
          senderName: sampleUsers.find(u => u.id === m.senderId)?.fullName || 'Unknown',
          timestamp: new Date(m.timestamp),
          isOwnMessage: m.senderId === currentUserId,
        }))
        .sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());

      const placeholderConversation: ConversationDetails = {
        id: conversationId,
        otherParty: {
          id: otherPartyDetails.id,
          name: otherPartyDetails.fullName,
          role: otherPartyDetails.role,
          avatarUrl: `https://placehold.co/40x40.png?text=${otherPartyDetails.fullName.charAt(0)}`
        },
        listing: {
          id: listing.id,
          title: listing.listingTitleAnonymous,
        },
        messages: conversationMessages,
      };
      setConversation(placeholderConversation);
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


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !conversation) return;

    const messageToSend: ExtendedMessage = {
      messageId: `m${conversation.messages.length + 1 + Date.now()}`,
      conversationId: conversation.id,
      senderId: currentUserId,
      receiverId: conversation.otherParty.id,
      senderName: sampleUsers.find(u => u.id === currentUserId)?.fullName || "Me",
      contentText: newMessage,
      timestamp: new Date(),
      isRead: false,
      isOwnMessage: true,
    };
    
    // Update local state for UI
    setConversation(prev => prev ? { ...prev, messages: [...prev.messages, messageToSend] } : null);
    // Add to placeholder data (simulating DB update)
    sampleMessages.push({
      messageId: messageToSend.messageId,
      conversationId: messageToSend.conversationId,
      senderId: messageToSend.senderId,
      receiverId: messageToSend.receiverId,
      contentText: messageToSend.contentText,
      timestamp: messageToSend.timestamp,
      isRead: false,
    });

    setNewMessage('');
    console.log('Sending message:', messageToSend);
  };
  
  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-6">Loading conversation...</div>;
  }

  if (!conversation) {
    return <div className="flex h-full items-center justify-center p-6">Conversation not found or access denied.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--sidebar-header-height,theme(spacing.20))-theme(spacing.12))] md:h-[calc(100vh-var(--sidebar-header-height,theme(spacing.20))-theme(spacing.16))] bg-brand-light-gray/30">
      <header className="flex items-center p-3 md:p-4 border-b border-brand-light-gray bg-brand-white shadow-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/messages')} className="mr-2 md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8 md:h-10 md:w-10 mr-3">
          <AvatarImage src={conversation.otherParty.avatarUrl} alt={conversation.otherParty.name} data-ai-hint="person avatar" />
          <AvatarFallback>{conversation.otherParty.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h2 className="font-semibold text-base md:text-lg text-brand-dark-blue">{conversation.otherParty.name} ({conversation.otherParty.role})</h2>
          <p className="text-xs text-muted-foreground">
            Regarding: <Link href={`/listings/${conversation.listing.id}`} className="hover:underline text-brand-sky-blue">{conversation.listing.title}</Link>
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="border-brand-dark-blue/30 text-brand-dark-blue hover:bg-brand-light-gray/70">
          <Link href={`/listings/${conversation.listing.id}`}>
            <Briefcase className="h-4 w-4 mr-2" /> View Listing
          </Link>
        </Button>
      </header>

      <ScrollArea className="flex-grow p-3 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-3"> {/* Reduced space-y-4 to space-y-3 */}
          {conversation.messages.map((msg) => (
            <div
              key={msg.messageId}
              className={cn(
                "flex w-full max-w-[85%] md:max-w-[70%] flex-col gap-1",
                msg.isOwnMessage ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-xl px-3.5 py-2.5 md:px-4 md:py-3 shadow-sm text-sm", // Increased padding slightly
                  msg.isOwnMessage
                    ? "bg-[hsl(var(--brand-light-gray-hsl))] text-brand-dark-blue rounded-br-none" // Own messages: light gray bg, dark blue text
                    : "bg-brand-white text-brand-dark-blue border border-slate-200 dark:border-slate-700 rounded-bl-none" // Other's messages: white bg, dark blue text
                )}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.contentText}</p>
              </div>
              <span className="text-xs text-muted-foreground/80 px-1">
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-3 md:p-4 border-t border-brand-light-gray bg-brand-white">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" type="button" className="text-muted-foreground hover:text-brand-sky-blue">
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow h-10 md:h-11 text-sm md:text-base bg-brand-white border-brand-light-gray focus:ring-brand-sky-blue focus:border-brand-sky-blue"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="bg-brand-dark-blue hover:bg-brand-dark-blue/90 text-brand-white h-10 w-10 md:h-11 md:w-11 rounded-full">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
