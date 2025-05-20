import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleListings, sampleUsers } from "@/lib/placeholder-data";
import type { Listing } from "@/lib/types";
import Link from "next/link";
import { Eye, Edit3, Trash2, Filter, Search, ShieldCheck, AlertTriangle } from "lucide-react";
import { industries } from "@/lib/types";

// In a real app, listings would be fetched and paginated.
const listings: Listing[] = sampleListings;

export default function AdminListingsPage() {
  const getSellerName = (sellerId: string) => {
    const seller = sampleUsers.find(u => u.id === sellerId);
    return seller ? seller.fullName : 'Unknown Seller';
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Listing Management</CardTitle>
          <CardDescription>View, search, filter, and manage all business listings on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by title or Listing ID..." className="pl-8 sm:w-full md:w-[300px]" />
            </div>
            <div className="flex gap-4">
                <Select>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by Industry" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map(industry => (
                        <SelectItem key={industry} value={industry.toLowerCase().replace(' ','-')}>{industry}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Select>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Seller Verification" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Sellers</SelectItem>
                    <SelectItem value="verified">Verified Seller</SelectItem>
                    <SelectItem value="not-verified">Not Verified Seller</SelectItem>
                </SelectContent>
                </Select>
                <Button variant="outline" className="hidden sm:inline-flex"><Filter className="h-4 w-4 mr-2"/>Apply</Button>
            </div>
             <Button variant="outline" className="sm:hidden w-full"><Filter className="h-4 w-4 mr-2"/>Apply Filters</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anonymous Title</TableHead>
                  <TableHead>Seller Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Seller Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium max-w-xs truncate" title={listing.listingTitleAnonymous}>
                        <Link href={`/admin/listings/${listing.id}`} className="hover:underline">{listing.listingTitleAnonymous}</Link>
                    </TableCell>
                    <TableCell>
                        <Link href={`/admin/users/${listing.sellerId}`} className="hover:underline">{getSellerName(listing.sellerId)}</Link>
                    </TableCell>
                    <TableCell>{listing.industry}</TableCell>
                    <TableCell>{listing.askingPriceRange}</TableCell>
                    <TableCell><Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className={`capitalize ${listing.status === 'active' ? 'bg-accent text-accent-foreground' : ''}`}>{listing.status}</Badge></TableCell>
                    <TableCell>
                      {listing.isSellerVerified ? 
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600"><ShieldCheck className="h-3 w-3 mr-1" /> Yes</Badge> :
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" /> No</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Listing Details">
                        <Link href={`/admin/listings/${listing.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                       {/* More actions like Edit, Deactivate would go here */}
                        <Button variant="ghost" size="icon" title="Edit Listing (Not Implemented)">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" title="Deactivate Listing (Not Implemented)">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Placeholder for PaginationControls */}
          <div className="mt-6 text-center text-muted-foreground">
            Pagination (10 listings per page) - Total listings: {listings.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
