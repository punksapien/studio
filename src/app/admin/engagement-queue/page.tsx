
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
import { sampleInquiries, sampleUsers, sampleListings, sampleConversations } from "@/lib/placeholder-data";
import type { Inquiry, User, VerificationStatus as UserVerificationStatus, ListingStatus } from "@/lib/types"; // Renamed VerificationStatus to UserVerificationStatus
import Link from "next/link";
import { Eye, Mail, Archive, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

function FormattedTimestamp({ timestamp }: { timestamp: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);
  React.useEffect(() => {
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);
  if (!formattedDate) return <span className="italic text-xs">Loading...</span>;
  return <>{formattedDate}</>;
}

export default function AdminEngagementQueuePage() {
  const { toast } = useToast();
  const [engagements, setEngagements] = React.useState<Inquiry[]>(
    sampleInquiries.filter(i => i.status === 'ready_for_admin_connection')
  );

  const handleFacilitateConnection = (inquiryId: string) => {
    console.log(`Admin facilitating connection for inquiry ID: ${inquiryId}`);
    const inquiryIndex = sampleInquiries.findIndex(i => i.id === inquiryId);
    if (inquiryIndex !== -1) {
      const updatedInquiry = {
        ...sampleInquiries[inquiryIndex],
        status: 'connection_facilitated_in_app_chat_opened' as Inquiry['status'],
        conversationId: `conv-${inquiryId}-${Date.now()}`
      };
      sampleInquiries[inquiryIndex] = updatedInquiry;
      setEngagements(prevEngagements =>
        prevEngagements.filter(e => e.id !== inquiryId)
      );
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
          status: 'ACTIVE'
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

  // Use UserVerificationStatus for user profiles
  const getProfileVerificationBadge = (status?: UserVerificationStatus) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    if (status === 'verified') return <Badge className="bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200 border-green-300 dark:border-green-500"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>;
    if (status === 'pending_verification') return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200 border-yellow-300 dark:border-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
    return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />{status.replace(/_/g, ' ')}</Badge>;
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
                  <TableHead className="whitespace-nowrap">Buyer Profile Status</TableHead>
                  <TableHead className="whitespace-nowrap">Seller Name</TableHead>
                  <TableHead className="whitespace-nowrap">Seller Profile Status</TableHead>
                  <TableHead className="whitespace-nowrap">Listing Title</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagements.map((item) => {
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
                        <TableCell>{getProfileVerificationBadge(buyer?.verificationStatus)}</TableCell>
                         <TableCell className="font-medium whitespace-nowrap">
                            <Link href={`/admin/users/${item.sellerId}`} className="hover:underline">{seller?.fullName || item.sellerId}</Link>
                        </TableCell>
                        <TableCell>{getProfileVerificationBadge(seller?.verificationStatus)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                            <Link href={`/admin/listings/${item.listingId}`} className="hover:underline">{listing?.listingTitleAnonymous || item.listingId}</Link>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="outline" // Changed from ghost to outline for better visibility
                            size="sm" // Ensure button is not too small
                            title="Facilitate Connection & Open Chat"
                            onClick={() => handleFacilitateConnection(item.id)}
                          >
                            <Mail className="h-4 w-4 mr-2 text-green-600" /> Facilitate
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

    