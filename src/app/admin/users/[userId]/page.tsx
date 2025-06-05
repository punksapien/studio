
'use client';

import * as React from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { sampleUsers, sampleListings, sampleInquiries, sampleVerificationRequests } from "@/lib/placeholder-data";
import type { User, Listing, Inquiry, VerificationStatus, VerificationRequestItem, AdminNote } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, CalendarDays, Briefcase, DollarSign, UserCircle, ShieldCheck, ShieldAlert, Edit, MessageSquare, Trash2, KeyRound, FileText, Clock, Building2, Users2, TrendingUp, Handshake, Wallet, Target, Edit3, Eye, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

function FormattedDate({ dateString }: { dateString?: Date | string }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (dateString) {
      const dateObj = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (!isNaN(dateObj.getTime())) {
        setFormattedDate(dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      } else {
        setFormattedDate('N/A');
      }
    } else {
      setFormattedDate('N/A');
    }
  }, [dateString]);

  if (dateString && !formattedDate) {
    return <span className="italic text-xs">Loading date...</span>;
  }
  return <>{formattedDate || 'N/A'}</>;
}

const getProfileVerificationBadge = (status: User["verificationStatus"], large: boolean = false) => {
  const iconSize = large ? "h-5 w-5 mr-2" : "h-3 w-3 mr-1";
  const textSize = large ? 'p-2 text-lg' : 'text-xs';
  switch (status) {
    case 'verified':
      return <Badge className={`text-base ${textSize} bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600`}><ShieldCheck className={iconSize} /> Verified</Badge>;
    case 'pending_verification':
      return <Badge variant="secondary" className={`text-base ${textSize} bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600`}><ShieldAlert className={iconSize} /> Pending</Badge>;
    case 'anonymous':
      return <Badge variant="outline" className={`text-base ${textSize}`}>Anonymous</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className={`text-base ${textSize}`}>Rejected</Badge>;
    default:
      return <Badge variant="outline" className={`text-base ${textSize}`}>{status}</Badge>;
  }
};

const getOperationalStatusBadge = (status: VerificationRequestItem["operationalStatus"]) => {
  switch (status) {
    case 'New Request': return <Badge variant="destructive" className="text-xs">New</Badge>;
    case 'Contacted': return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Contacted</Badge>;
    case 'Docs Under Review': return <Badge className="bg-purple-100 text-purple-700 text-xs">Docs Review</Badge>;
    case 'More Info Requested': return <Badge className="bg-yellow-100 text-yellow-700 text-xs">More Info</Badge>;
    case 'Approved': return <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>;
    case 'Rejected': return <Badge variant="destructive" className="text-xs bg-red-100 text-red-700">Rejected</Badge>;
    default: return <Badge className="text-xs">{status}</Badge>;
  }
};


export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { toast } = useToast();

  const [user, setUser] = React.useState<User | undefined>(undefined);
  const [userListings, setUserListings] = React.useState<Listing[]>([]);
  const [userInquiries, setUserInquiries] = React.useState<Inquiry[]>([]);
  const [userVerificationRequests, setUserVerificationRequests] = React.useState<VerificationRequestItem[]>([]);

  React.useEffect(() => {
    const fetchedUser = sampleUsers.find(u => u.id === userId);
    setUser(fetchedUser);

    if (fetchedUser) {
      if (fetchedUser.role === 'seller') {
        setUserListings(sampleListings.filter(l => l.sellerId === userId));
      } else if (fetchedUser.role === 'buyer') {
        setUserInquiries(sampleInquiries.filter(i => i.buyerId === userId));
      }
      setUserVerificationRequests(sampleVerificationRequests.filter(req => req.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  }, [userId]);

  if (user === undefined) {
    return <div>Loading user details...</div>;
  }

  if (!user) {
    notFound();
    return null;
  }

  const handleTogglePaidStatus = () => {
    // Placeholder: In a real app, this would call an API
    setUser(prevUser => prevUser ? {...prevUser, isPaid: !prevUser.isPaid} : undefined);
    toast({
      title: "Paid Status Updated",
      description: `${user.fullName}'s paid status is now ${!user.isPaid ? 'Paid' : 'Free'}.`
    });
  };
  
  const handleSuspendUser = () => {
     toast({
      variant: "destructive",
      title: "Suspend User (Placeholder)",
      description: `Action to suspend ${user.fullName} would be triggered here.`
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center text-brand-dark-blue font-heading">
            <UserCircle className="h-8 w-8 mr-3 text-primary" /> {user.fullName}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <Button variant="outline" asChild>
              <Link href={`/admin/verification-queue/${user.role === 'buyer' ? 'buyers' : 'sellers'}?userId=${user.id}`}>
                <Edit3 className="h-4 w-4 mr-2"/> Manage Verification
              </Link>
            </Button>
             <Button variant="outline" onClick={handleTogglePaidStatus}>
                <Wallet className="h-4 w-4 mr-2"/> Make {user.isPaid ? 'Free' : 'Paid'}
             </Button>
        </div>
      </div>

      <Card className="shadow-lg bg-brand-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
                <CardTitle className="text-2xl text-brand-dark-blue font-heading">{user.fullName}</CardTitle>
                <CardDescription className="capitalize">{user.role} ({user.isPaid ? <Badge className="bg-accent text-accent-foreground">Paid User</Badge> : <Badge variant="secondary">Free User</Badge>})</CardDescription>
            </div>
            {getProfileVerificationBadge(user.verificationStatus, true)}
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <p className="flex items-center"><Mail className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-brand-dark-blue">Email:</span>&nbsp;{user.email}</p>
            <p className="flex items-center"><Phone className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-brand-dark-blue">Phone:</span>&nbsp;{user.phoneNumber}</p>
          </div>
          <div className="space-y-2">
            <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-brand-dark-blue">Country:</span>&nbsp;{user.country}</p>
            <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-brand-dark-blue">Registered:</span>&nbsp;<FormattedDate dateString={user.createdAt} /></p>
          </div>
          <div className="space-y-2">
            {user.role === 'seller' && user.initialCompanyName && (
              <p className="flex items-center"><Building2 className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-brand-dark-blue">Company (Initial):</span>&nbsp;{user.initialCompanyName}</p>
            )}
             <p className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-brand-dark-blue">Email Verified:</span>&nbsp;{user.isEmailVerified ? 'Yes' : 'No'}</p>
             {user.lastLogin && <p className="flex items-center"><Clock className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-brand-dark-blue">Last Login:</span>&nbsp;<FormattedDate dateString={user.lastLogin} /></p>}
             <p className="flex items-center"><Users2 className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-brand-dark-blue">Onboarding:</span>&nbsp;{user.is_onboarding_completed ? 'Completed' : `Step ${user.onboarding_step_completed || 0}`}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile_details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <TabsTrigger value="profile_details">Profile & Activity</TabsTrigger>
          {user.role === 'buyer' && <TabsTrigger value="buyer_persona">Buyer Persona</TabsTrigger>}
          <TabsTrigger value="verification_history">Verification History</TabsTrigger>
          <TabsTrigger value="admin_actions">Admin Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile_details">
          {user.role === 'seller' && (
            <Card className="shadow-md mt-6 bg-brand-white">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-brand-dark-blue font-heading flex items-center"><Briefcase className="h-5 w-5 mr-2"/>Business Listings by {user.fullName}</CardTitle>
                   <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/listings?sellerId=${user.id}`}>View All Listings ({userListings.length})</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {userListings.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Industry</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {userListings.slice(0,5).map(listing => (
                          <TableRow key={listing.id}>
                            <TableCell className="font-medium max-w-xs truncate"><Link href={`/admin/listings/${listing.id}`} className="text-primary hover:underline">{listing.listingTitleAnonymous}</Link></TableCell>
                            <TableCell>{listing.industry}</TableCell>
                            <TableCell>{listing.status}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" asChild><Link href={`/admin/listings/${listing.id}`}><Eye className="h-4 w-4"/></Link></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">This seller has no listings.</p>
                )}
              </CardContent>
            </Card>
          )}
          {user.role === 'buyer' && (
             <Card className="shadow-md mt-6 bg-brand-white">
                <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center"><Handshake className="h-5 w-5 mr-2"/>Inquiries Made by {user.fullName}</CardTitle></CardHeader>
                <CardContent>
                  {userInquiries.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto">
                       <Table>
                        <TableHeader><TableRow><TableHead>Listing Title</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {userInquiries.slice(0,5).map(inquiry => {
                            const listing = sampleListings.find(l => l.id === inquiry.listingId);
                            return (
                            <TableRow key={inquiry.id}>
                              <TableCell className="font-medium max-w-xs truncate"><Link href={`/admin/listings/${inquiry.listingId}`} className="text-primary hover:underline">{listing?.listingTitleAnonymous || 'N/A'}</Link></TableCell>
                              <TableCell><FormattedDate dateString={inquiry.inquiryTimestamp}/></TableCell>
                              <TableCell>{inquiry.status}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" title="View Inquiry (Not Implemented)"><Eye className="h-4 w-4"/></Button>
                              </TableCell>
                            </TableRow>
                          )})}
                        </TableBody>
                      </Table>
                    </div>
                  ): (
                    <p className="text-muted-foreground text-center py-4">This buyer has made no inquiries. (Total: {user.inquiryCount || 0})</p>
                  )}
                </CardContent>
             </Card>
          )}
           <Card className="shadow-md mt-6 bg-brand-white">
              <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center"><Clock className="h-5 w-5 mr-2"/>Recent Activity Log</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground text-center py-4">Placeholder: User activity log would appear here (e.g., logins, profile updates, listings created/updated).</p></CardContent>
           </Card>
        </TabsContent>

        {user.role === 'buyer' && (
          <TabsContent value="buyer_persona">
            <Card className="shadow-md mt-6 bg-brand-white">
              <CardHeader>
                <CardTitle className="text-brand-dark-blue font-heading flex items-center"><Target className="h-5 w-5 mr-2 text-primary"/>Buyer Persona Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><span className="font-medium text-brand-dark-blue">Primary Role / Buyer Type:</span> {user.buyerPersonaType || 'N/A'} {user.buyerPersonaType === 'Other' && user.buyerPersonaOther ? `(${user.buyerPersonaOther})` : ''}</p>
                <div>
                    <p className="font-medium text-brand-dark-blue mb-1">Investment Focus / Description:</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{user.investmentFocusDescription || 'N/A'}</p>
                </div>
                <p><span className="font-medium text-brand-dark-blue">Preferred Investment Size:</span> {user.preferredInvestmentSize || 'N/A'}</p>
                <div>
                    <p className="font-medium text-brand-dark-blue mb-1">Key Industries of Interest:</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{user.keyIndustriesOfInterest || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="verification_history">
           <Card className="shadow-md mt-6 bg-brand-white">
                <CardHeader><CardTitle className="text-brand-dark-blue font-heading flex items-center"><FileText className="h-5 w-5 mr-2"/>Verification History &amp; Data</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">Current Profile Verification Status: {getProfileVerificationBadge(user.verificationStatus)}</ColSpan>
                  {userVerificationRequests.length > 0 ? (
                     <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow><TableHead>Request ID</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Op. Status</TableHead><TableHead>Admin Notes</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {userVerificationRequests.map(req => (
                            <TableRow key={req.id}>
                              <TableCell className="font-mono text-xs">{req.id.substring(0,12)}...</TableCell>
                              <TableCell><FormattedDate dateString={req.timestamp}/></TableCell>
                              <TableCell className="capitalize">{req.listingId ? 'Listing' : 'Profile'}</TableCell>
                              <TableCell>{getOperationalStatusBadge(req.operationalStatus)}</TableCell>
                              <TableCell className="max-w-xs truncate text-xs">{req.adminNotes?.[req.adminNotes.length-1]?.note || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ): (
                    <p className="text-muted-foreground text-center py-4">No verification requests found for this user.</p>
                  )}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="admin_actions">
            <Card className="shadow-md mt-6 bg-brand-white">
              <CardHeader>
                <CardTitle className="text-brand-dark-blue font-heading">Admin Actions on User</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button variant="outline"><MessageSquare className="h-4 w-4 mr-2"/> Send Message (Placeholder)</Button>
                <Button variant="outline"><KeyRound className="h-4 w-4 mr-2"/> Send Password Reset (Placeholder)</Button>
                <Button variant="outline">View Full Activity Log (Placeholder)</Button>
                <Button variant="destructive" onClick={handleSuspendUser} className="bg-yellow-500 hover:bg-yellow-600 text-white">Suspend User (Placeholder)</Button>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700"><Trash2 className="h-4 w-4 mr-2" /> Delete User (Placeholder)</Button>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

