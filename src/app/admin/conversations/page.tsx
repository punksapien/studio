'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

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
import { sampleConversations, sampleUsers, sampleListings } from "@/lib/placeholder-data";
import type { Conversation } from "@/lib/types";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function FormattedTimestamp({ timestamp }: { timestamp?: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (timestamp) {
      setFormattedDate(new Date(timestamp).toLocaleString());
    } else {
      setFormattedDate('N/A');
    }
  }, [timestamp]);

  if (timestamp && !formattedDate) {
    return <span className="italic text-xs">Loading...</span>;
  }
  return <>{formattedDate}</>;
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>(sampleConversations);
  // Add filter/search state if needed

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>All Platform Conversations</CardTitle>
          <CardDescription>Monitor and manage all active and archived conversations. Total: {conversations.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by User ID, Listing ID, or Conversation ID..." className="pl-8" />
            </div>
            {/* Add filters for status if needed */}
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Conv. ID</TableHead>
                  <TableHead className="whitespace-nowrap">Buyer</TableHead>
                  <TableHead className="whitespace-nowrap">Seller</TableHead>
                  <TableHead className="whitespace-nowrap">Listing</TableHead>
                  <TableHead className="whitespace-nowrap">Last Message</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conv) => {
                  const buyer = sampleUsers.find(u => u.id === conv.buyerId);
                  const seller = sampleUsers.find(u => u.id === conv.sellerId);
                  const listing = sampleListings.find(l => l.id === conv.listingId);
                  return (
                    <TableRow key={conv.conversationId}>
                      <TableCell className="text-xs whitespace-nowrap font-mono">{conv.conversationId.substring(0, 8)}...</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/admin/users/${conv.buyerId}`} className="hover:underline text-primary">
                          {buyer?.fullName || conv.buyerId}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/admin/users/${conv.sellerId}`} className="hover:underline text-primary">
                          {seller?.fullName || conv.sellerId}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/admin/listings/${conv.listingId}`} className="hover:underline">
                          {listing?.listingTitleAnonymous.substring(0, 25) || conv.listingId}...
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <FormattedTimestamp timestamp={conv.updatedAt} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={conv.status === 'ACTIVE' ? 'default' : 'secondary'}
                               className={conv.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                          {conv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" title="View Chat" asChild>
                          <Link href={`/admin/conversations/${conv.conversationId}`}>
                            <Eye className="h-4 w-4 text-brand-sky-blue" />
                          </Link>
                        </Button>
                        {/* Add Archive button here if implementing */}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {conversations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No conversations found on the platform.
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
