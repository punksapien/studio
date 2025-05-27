
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Using Input for simplicity, can be Textarea
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Paperclip, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, Listing, Inquiry } from '@/lib/types'; // Assuming these types exist
import { sampleUsers, sampleListings, sampleBuyerInquiries } from '@/lib/placeholder-data'; // Assuming these exist

// Placeholder types for Conversation and Message for UI prototyping
interface Message {
  id: string;
  senderId: string;
  senderName: string; // Added for display
  contentText: string;
  timestamp: Date;
  isOwnMessage: boolean; // Helper for UI
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
  messages: Message[];
}

// Placeholder current user ID
const currentUserId = 'user2'; // Jane Smith (Buyer)

// Helper to format timestamp
const formatTimestamp = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (messageDate.getTime() === new Date(today.getTime() - 24 * 60 * 60 * 1000).getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};


export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = React.useState<ConversationDetails | null>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Simulate fetching conversation details
    setIsLoading(true);
    setTimeout(() => {
      // Find the inquiry that led to this conversation (conceptual)
      // For this placeholder, let's assume conversationId 'conv1' links to inquiry 'inq_b1'
      const linkedInquiry = sampleBuyerInquiries.find(iq => iq.id === 'inq_b1' && conversationId === 'conv1');
      if (!linkedInquiry) {
        setConversation(null); // Or handle error
        setIsLoading(false);
        return;
      }

      const buyer = sampleUsers.find(u => u.id === linkedInquiry.buyerId);
      const seller = sampleUsers.find(u => u.id === linkedInquiry.sellerId);
      const listing = sampleListings.find(l => l.id === linkedInquiry.listingId);

      if (!buyer || !seller || !listing) {
        setConversation(null);
        setIsLoading(false);
        return;
      }

      const otherPartyDetails = currentUserId === buyer.id ? seller : buyer;

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
        messages: [
          { id: 'm1', senderId: seller.id, senderName: seller.fullName, contentText: 'Hello Jane, thanks for your interest in the E-commerce Store. What specifically are you looking for?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), isOwnMessage: seller.id === currentUserId },
          { id: 'm2', senderId: buyer.id, senderName: buyer.fullName, contentText: 'Hi John, I\'m interested in the financials and growth potential. Could you share more details?', timestamp: new Date(Date.now() - 1000 * 60 * 55), isOwnMessage: buyer.id === currentUserId },
          { id: 'm3', senderId: seller.id, senderName: seller.fullName, contentText: 'Certainly. I can provide access to the data room once we\'ve had an initial chat. Are you available for a quick call this week?', timestamp: new Date(Date.now() - 1000 * 60 * 30), isOwnMessage: seller.id === currentUserId },
          { id: 'm4', senderId: buyer.id, senderName: buyer.fullName, contentText: 'Yes, Thursday afternoon works for me. How about 2 PM SGT?', timestamp: new Date(Date.now() - 1000 * 60 * 5), isOwnMessage: buyer.id === currentUserId },
        ],
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

    const messageToSend: Message = {
      id: `m${conversation.messages.length + 1}`,
      senderId: currentUserId,
      senderName: sampleUsers.find(u => u.id === currentUserId)?.fullName || "Me",
      contentText: newMessage,
      timestamp: new Date(),
      isOwnMessage: true,
    };

    setConversation(prev => prev ? { ...prev, messages: [...prev.messages, messageToSend] } : null);
    setNewMessage('');
    // Simulate API call
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
      {/* Header */}
      <header className="flex items-center p-3 md:p-4 border-b border-brand-light-gray bg-brand-white shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8 md:h-10 md:w-10 mr-3">
          <AvatarImage src={conversation.otherParty.avatarUrl} alt={conversation.otherParty.name} />
          <AvatarFallback>{conversation.otherParty.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h2 className="font-semibold text-base md:text-lg text-brand-dark-blue">{conversation.otherParty.name}</h2>
          <p className="text-xs text-muted-foreground">
            Regarding: <Link href={`/app/listings/${conversation.listing.id}`} className="hover:underline text-brand-sky-blue">{conversation.listing.title}</Link>
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/app/listings/${conversation.listing.id}`}>
            <Briefcase className="h-4 w-4 mr-2" /> View Listing
          </Link>
        </Button>
      </header>

      {/* Message Display Area */}
      <ScrollArea className="flex-grow p-3 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full max-w-[85%] md:max-w-[70%] flex-col gap-1",
                msg.isOwnMessage ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-xl px-3 py-2 md:px-4 md:py-2.5 shadow-sm",
                  msg.isOwnMessage
                    ? "bg-brand-sky-blue text-brand-white rounded-br-none"
                    : "bg-brand-white text-brand-dark-blue border border-brand-light-gray rounded-bl-none"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.contentText}</p>
              </div>
              <span className="text-xs text-muted-foreground/80 px-1">
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input Area */}
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
            className="flex-grow h-10 md:h-11 text-sm md:text-base bg-brand-light-gray/50 border-brand-light-gray focus:ring-brand-sky-blue focus:border-brand-sky-blue"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="bg-brand-dark-blue hover:bg-brand-dark-blue/90 text-brand-white h-10 w-10 md:h-11 md:w-11">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}

    