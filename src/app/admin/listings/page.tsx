
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
import type { Listing, User } from "@/lib/types";
import Link from "next/link";
import { Eye, Edit3, Trash2, Filter, Search, ShieldCheck, AlertTriangle, DollarSign } from "lucide-react";
import { industries } from "@/lib/types";

// In a real app, listings would be fetched and paginated.
const listings: Listing[] = sampleListings;

export default function AdminListingsPage() {
  const getSellerDetails = (sellerId: string): User | undefined => {
    return sampleUsers.find(u => u.id === sellerId);
  };

  const getListingStatusBadge = (status: Listing['status'], isSellerVerified: boolean) => {
    if (status === 'verified_public') return <Badge className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600"><ShieldCheck className="h-3 w-3 mr-1" /> Verified Public</Badge>;
    if (status === 'verified_anonymous') return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600"><ShieldCheck className="h-3 w-3 mr-1" /> Verified (Anon)</Badge>;
    if (status === 'pending_verification') return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" /> Pending Verification</Badge>;
    if (status === 'active' && !isSellerVerified) return <Badge variant="outline">Active (Anonymous)</Badge>;
    if (status === 'inactive') return <Badge variant="destructive">Inactive</Badge>;
    return <Badge variant="outline" className="capitalize">{status}</Badge>;
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
            <div className="flex flex-wrap gap-4">
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
                 <Select>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Listing Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    <SelectItem value="verified_public">Verified (Public)</SelectItem>
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
                  <TableHead>Seller Paid</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Listing Status</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => {
                  const seller = getSellerDetails(listing.sellerId);
                  return (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium max-w-xs truncate" title={listing.listingTitleAnonymous}>
                        <Link href={`/admin/listings/${listing.id}`} className="hover:underline">{listing.listingTitleAnonymous}</Link>
                    </TableCell>
                    <TableCell>
                        {seller ? <Link href={`/admin/users/${listing.sellerId}`} className="hover:underline">{seller.fullName}</Link> : 'Unknown Seller'}
                    </TableCell>
                    <TableCell>
                      {seller?.isPaid ? <Badge className="bg-green-500 text-white">Yes</Badge> : <Badge variant="secondary">No</Badge>}
                    </TableCell>
                    <TableCell>{listing.industry}</TableCell>
                    <TableCell>{listing.askingPriceRange}</TableCell>
                    <TableCell>{getListingStatusBadge(listing.status, listing.isSellerVerified)}</TableCell>
                    <TableCell>{new Date(listing.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Listing Details">
                        <Link href={`/admin/listings/${listing.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                        <Button variant="ghost" size="icon" title="Edit Listing (Not Implemented)">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" title="Deactivate Listing (Not Implemented)">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </TableCell>
                  </TableRow>
                )})}
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
