
import { sampleUsers, sampleListings } from "@/lib/placeholder-data";
import type { User, Listing } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, CalendarDays, Briefcase, DollarSign, UserCircle, ShieldCheck, ShieldAlert, Edit, MessageSquare, Trash2, KeyRound, Edit3 } from "lucide-react";
import { notFound } from 'next/navigation';

async function getUserDetails(userId: string): Promise<User | undefined> {
  return sampleUsers.find(user => user.id === userId);
}

async function getUserListings(userId: string): Promise<Listing[]> {
  return sampleListings.filter(listing => listing.sellerId === userId);
}

export default async function AdminUserDetailPage({ params }: { params: { userId: string } }) {
  const user = await getUserDetails(params.userId);

  if (!user) {
    notFound();
  }

  const userListings = user.role === 'seller' ? await getUserListings(user.id) : [];
  
  const getVerificationBadge = (status: User["verificationStatus"], large: boolean = false) => {
    const iconSize = large ? "h-5 w-5 mr-2" : "h-3 w-3 mr-1";
    switch (status) {
      case 'verified':
        return <Badge className={`text-base ${large ? 'p-2 text-lg' : ''} bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600`}><ShieldCheck className={iconSize} /> Verified</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className={`text-base ${large ? 'p-2 text-lg' : ''} bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600`}><ShieldAlert className={iconSize} /> Pending Verification</Badge>;
      case 'anonymous':
        return <Badge variant="outline" className={`text-base ${large ? 'p-2 text-lg' : ''}`}>Anonymous</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className={`text-base ${large ? 'p-2 text-lg' : ''}`}>Rejected</Badge>;
      default:
        return <Badge variant="outline" className={`text-base ${large ? 'p-2 text-lg' : ''}`}>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <UserCircle className="h-8 w-8 mr-3 text-primary" /> User Details: {user.fullName}
        </h1>
        <div className="flex gap-2 mt-2 md:mt-0">
            <Button variant="outline"><Edit className="h-4 w-4 mr-2"/> Edit User Info (Not Implemented)</Button>
             <Button variant={user.verificationStatus !== 'verified' ? 'default' : 'secondary'}>
                {user.verificationStatus !== 'verified' ? <ShieldCheck className="h-4 w-4 mr-2"/> : <ShieldAlert className="h-4 w-4 mr-2"/>}
                Mark as {user.verificationStatus !== 'verified' ? 'Verified' : 'Pending'} (Not Implemented)
            </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-2xl">{user.fullName}</CardTitle>
                <CardDescription className="capitalize">{user.role} ({user.isPaid ? 'Paid User' : 'Free User'})</CardDescription>
            </div>
            {getVerificationBadge(user.verificationStatus, true)}
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-foreground">Email:</span>&nbsp;{user.email}</p>
            <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-foreground">Phone:</span>&nbsp;{user.phoneNumber}</p>
          </div>
          <div className="space-y-2">
            <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-foreground">Country:</span>&nbsp;{user.country}</p>
            <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-foreground">Registered:</span>&nbsp;{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="space-y-2">
            {user.role === 'seller' && user.initialCompanyName && (
              <p className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-foreground">Company (Initial):</span>&nbsp;{user.initialCompanyName}</p>
            )}
            {user.role === 'buyer' && user.buyerType && (
              <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-foreground">Buyer Type:</span>&nbsp;{user.buyerType}</p>
            )}
             <p className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-foreground">Email Verified:</span>&nbsp;{user.isEmailVerified ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      </Card>

      {user.role === 'seller' && (
        <>
          <Separator />
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Business Listings by {user.fullName}</CardTitle>
                {userListings.length > 0 && (
                  <Button variant="outline" size="sm">
                     <Edit3 className="h-4 w-4 mr-2"/> Edit All Listings (Not Implemented)
                  </Button>
                )}
              </div>
              <CardDescription>Total Listings: {userListings.length}</CardDescription>
            </CardHeader>
            <CardContent>
              {userListings.length > 0 ? (
                <ul className="space-y-4">
                  {userListings.map(listing => (
                    <li key={listing.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors">
                      <div>
                        <Link href={`/admin/listings/${listing.id}`} className="font-medium text-primary hover:underline">{listing.listingTitleAnonymous}</Link>
                        <p className="text-xs text-muted-foreground">{listing.industry} | Revenue: {listing.annualRevenueRange}</p>
                      </div>
                       <div className="flex gap-1">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/listings/${listing.id}`}>View Listing</Link>
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit Business Details (Not Implemented)" asChild>
                           <Link href={`/admin/listings/${listing.id}/edit`}> {/* Assuming admin edit page exists */}
                            <Edit3 className="h-4 w-4" />
                           </Link>
                        </Button>
                       </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">This seller has no active listings.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      <Separator />
       <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Admin Actions on User</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="outline"><MessageSquare className="h-4 w-4 mr-2"/> Send Message (Not Implemented)</Button>
            <Button variant="outline"><KeyRound className="h-4 w-4 mr-2"/> Change Password (Not Implemented)</Button>
            <Button variant="outline">View Activity Log (Not Implemented)</Button>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700"><Trash2 className="h-4 w-4 mr-2" /> Delete User (Not Implemented)</Button>
            <Button variant="destructive">Suspend User (Not Implemented)</Button>
          </CardContent>
        </Card>
    </div>
  );
}
