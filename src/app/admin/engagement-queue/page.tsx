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
import { sampleReadyToEngageItems } from "@/lib/placeholder-data";
import type { ReadyToEngageItem } from "@/lib/types";
import Link from "next/link";
import { Eye, CheckSquare, Mail, Archive } from "lucide-react";

const engagements: ReadyToEngageItem[] = sampleReadyToEngageItems;

export default function AdminEngagementQueuePage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Engagement Queue: Ready for Connection</CardTitle>
          <CardDescription>Manage engagements where both buyer and seller are verified and have agreed to connect. Total pending: {engagements.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters could be added here: by date range, specific listing etc. */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Ready</TableHead>
                  <TableHead>Buyer Name</TableHead>
                  <TableHead>Seller Name</TableHead>
                  <TableHead>Listing Title</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engagements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                        <Link href={`/admin/users/${item.buyerId}`} className="hover:underline">{item.buyerName}</Link>
                    </TableCell>
                     <TableCell className="font-medium">
                        <Link href={`/admin/users/${item.sellerId}`} className="hover:underline">{item.sellerName}</Link>
                    </TableCell>
                    <TableCell>
                        <Link href={`/admin/listings/${item.listingId}`} className="hover:underline">{item.listingTitle}</Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Engagement Details (Not Implemented)">
                        <Link href={`#`}> {/* Placeholder for engagement detail page if any */}
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" title="Mark Connection Initiated">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </Button>
                       <Button variant="ghost" size="icon" title="Resolve/Archive Engagement">
                        <Archive className="h-4 w-4 text-green-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {engagements.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
