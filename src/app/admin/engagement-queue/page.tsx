
'use client';
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleReadyToEngageItems, sampleConversations, sampleInquiries, sampleUsers, sampleListings } from "@/lib/placeholder-data"; // Updated to sampleInquiries, added sampleUsers, sampleListings
import type { Inquiry, User, VerificationStatus, ListingStatus } from "@/lib/types"; // Updated to Inquiry
import Link from "next/link";
import { Eye, Mail, Archive, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Helper component for client-side date formatting
function FormattedTimestamp({ timestamp }: { timestamp: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  if (!formattedDate) {
    return <span className="italic text-xs">Loading...</span>;
  }
  return <>{formattedDate}</>;
}

export default function AdminEngagementQueuePage() {
  const { toast } = useToast();
  // Use sampleInquiries and filter for those ready for connection
  const [engagements, setEngagements] = React.useState<Inquiry[]>(
    sampleInquiries.filter(i => i.status === 'ready_for_admin_connection')
  );

  const handleFacilitateConnection = (inquiryId: string) => {
    // Simulate backend action
    console.log(`Admin facilitating connection for inquiry ID: ${inquiryId}`);

    // Update the inquiry status in our placeholder data
    const inquiryIndex = sampleInquiries.findIndex(i => i.id === inquiryId);
    if (inquiryIndex !== -1) {
      const updatedInquiry = {
        ...sampleInquiries[inquiryIndex],
        status: 'connection_facilitated_in_app_chat_opened' as Inquiry['status'], // Cast to InquiryStatusSystem
        conversationId: `conv-${inquiryId}-${Date.now()}` // Generate a unique conversation ID
      };
      sampleInquiries[inquiryIndex] = updatedInquiry;

      // Also update the local state for the UI
      setEngagements(prevEngagements =>
        prevEngagements.filter(e => e.id !== inquiryId) // Remove from "ready" queue
      );
      
      // Add to sampleConversations if it doesn't exist (for UI demo purposes)
      if (!sampleConversations.find(c => c.inquiryId === inquiryId)) {
        sampleConversations.push({
          conversationId: updatedInquiry.conversationId!,
          inquiryId: updatedInquiry.id,
          listingId: updatedInquiry.listingId,
          buyerId: updatedInquiry.buyerId,
          sellerId: updatedInquiry.sellerId,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessageSnippet: "Chat initiated by Admin.",
          buyerUnreadCount: 0,
          sellerUnreadCount: 0,
          status: 'ACTIVE' // Add status
        });
      }
      
      toast({
        title: "Connection Facilitated",
        description: `Chat has been opened for Inquiry ID: ${inquiryId}. Buyer and Seller notified.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not find inquiry ID: ${inquiryId} to facilitate connection.`,
      });
    }
  };


  const getVerificationBadge = (status?: VerificationStatus) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    if (status === 'verified') return <Badge className="bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200 border-green-300 dark:border-green-500"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>;
    return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />{status.replace(/_/g, ' ')}</Badge>;
  };

  // Find listing based on listingId from the inquiry
  const getListingDetails = (listingId: string) => {
    // This would typically be a more complex lookup, e.g., from sampleListings
    return { title: `Listing ${listingId}`, status: 'verified_public' as ListingStatus };
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Engagement Queue: Ready for Connection</CardTitle>
          <CardDescription>Manage engagements where both buyer and seller are verified and ready for connection. Total pending: {engagements.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Inquiry ID</TableHead>
                  <TableHead className="whitespace-nowrap">Date Ready</TableHead>
                  <TableHead className="whitespace-nowrap">Buyer Name</TableHead>
                  <TableHead className="whitespace-nowrap">Buyer Status</TableHead>
                  <TableHead className="whitespace-nowrap">Seller Name</TableHead>
                  <TableHead className="whitespace-nowrap">Seller Status</TableHead>
                  <TableHead className="whitespace-nowrap">Listing Title</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagements.map((item) => {
                    // Assuming buyerName and sellerName are part of Inquiry or can be fetched
                    const buyer = sampleUsers.find(u => u.id === item.buyerId);
                    const seller = sampleUsers.find(u => u.id === item.sellerId);
                    const listing = sampleListings.find(l => l.id === item.listingId);

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs whitespace-nowrap">{item.id}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {item.engagementTimestamp ? <FormattedTimestamp timestamp={item.engagementTimestamp} /> : 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                            <Link href={`/admin/users/${item.buyerId}`} className="hover:underline">{buyer?.fullName || item.buyerId}</Link>
                        </TableCell>
                        <TableCell>{getVerificationBadge(buyer?.verificationStatus)}</TableCell>
                         <TableCell className="font-medium whitespace-nowrap">
                            <Link href={`/admin/users/${item.sellerId}`} className="hover:underline">{seller?.fullName || item.sellerId}</Link>
                        </TableCell>
                        <TableCell>{getVerificationBadge(seller?.verificationStatus)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                            <Link href={`/admin/listings/${item.listingId}`} className="hover:underline">{listing?.listingTitleAnonymous || item.listingId}</Link>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Facilitate Connection & Open Chat"
                            onClick={() => handleFacilitateConnection(item.id)}
                          >
                            <Mail className="h-4 w-4 text-green-600" />
                          </Button>
                           <Button variant="ghost" size="icon" title="Archive Engagement (Not Implemented)">
                            <Archive className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                })}
                {engagements.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            The engagement queue is empty. All connections are up to date!
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

