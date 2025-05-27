import * as React from 'react';
import { sampleUsers, sampleListings } from "@/lib/placeholder-data";
import type { User, Listing } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, CalendarDays, Briefcase, DollarSign, UserCircle, ShieldCheck, ShieldAlert, Edit, MessageSquare, Trash2, KeyRound, Edit3, FileText, Clock, Building, Brain, Globe, Users2, TrendingUp, Handshake, Wallet, Target } from "lucide-react";
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <Button variant="outline"><Edit className="h-4 w-4 mr-2"/> Edit User Profile</Button>
             <Button variant={user.verificationStatus !== 'verified' ? 'default' : 'secondary'}>
                {user.verificationStatus !== 'verified' ? <ShieldCheck className="h-4 w-4 mr-2"/> : <ShieldAlert className="h-4 w-4 mr-2"/>}
                Mark as {user.verificationStatus !== 'verified' ? 'Verified' : 'Pending'}
            </Button>
             <Button variant="outline">
                <DollarSign className="h-4 w-4 mr-2"/> Toggle Paid Status (is {user.isPaid ? 'Paid' : 'Free'})
             </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
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
             <p className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-foreground">Email Verified:</span>&nbsp;{user.isEmailVerified ? 'Yes' : 'No'}</p>
             {user.lastLogin && <p className="flex items-center"><Clock className="h-4 w-4 mr-2 text-muted-foreground" /> <span className="font-medium text-foreground">Last Login:</span>&nbsp;{new Date(user.lastLogin).toLocaleString()}</p>}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile_details">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profile_details">Profile & Activity</TabsTrigger>
          {user.role === 'buyer' && <TabsTrigger value="buyer_persona">Buyer Persona</TabsTrigger>}
          <TabsTrigger value="verification_docs" disabled={user.verificationStatus === 'anonymous'}>Verification Data</TabsTrigger>
          <TabsTrigger value="admin_actions">Admin Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile_details">
          {user.role === 'seller' && (
            <Card className="shadow-md mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Business Listings by {user.fullName}</CardTitle>
                   <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/listings?sellerId=${user.id}`}>View All Listings ({userListings.length})</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {userListings.length > 0 ? (
                  <ul className="space-y-4">
                    {userListings.slice(0,3).map(listing => ( 
                      <li key={listing.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors">
                        <div>
                          <Link href={`/admin/listings/${listing.id}`} className="font-medium text-primary hover:underline">{listing.listingTitleAnonymous}</Link>
                          <p className="text-xs text-muted-foreground">{listing.industry} | Status: {listing.status}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/listings/${listing.id}`}>View Listing</Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center py-4">This seller has no listings.</p>
                )}
              </CardContent>
            </Card>
          )}
          {user.role === 'buyer' && (
             <Card className="shadow-md mt-6">
                <CardHeader><CardTitle>Inquiries Made by {user.fullName}</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">Placeholder: Table/List of inquiries made by this buyer. (Total: {user.inquiryCount || 0})</p>
                     <Button variant="outline">View All Inquiries (Not Implemented)</Button>
                </CardContent>
             </Card>
          )}
        </TabsContent>

        {user.role === 'buyer' && (
          <TabsContent value="buyer_persona">
            <Card className="shadow-md mt-6">
              <CardHeader>
                <CardTitle className="flex items-center"><Target className="h-5 w-5 mr-2 text-primary"/>Buyer Persona Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><span className="font-medium text-foreground">Primary Role / Buyer Type:</span> {user.buyerPersonaType || 'N/A'} {user.buyerPersonaType === 'Other' && user.buyerPersonaOther ? `(${user.buyerPersonaOther})` : ''}</p>
                <div>
                    <p className="font-medium text-foreground mb-1">Investment Focus / Description:</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{user.investmentFocusDescription || 'N/A'}</p>
                </div>
                <p><span className="font-medium text-foreground">Preferred Investment Size:</span> {user.preferredInvestmentSize || 'N/A'}</p>
                <div>
                    <p className="font-medium text-foreground mb-1">Key Industries of Interest:</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{user.keyIndustriesOfInterest || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="verification_docs">
           <Card className="shadow-md mt-6">
                <CardHeader><CardTitle>Verification Application Data</CardTitle></CardHeader>
                <CardContent>
                    {user.verificationStatus !== 'anonymous' ? (
                        <div className="space-y-2">
                            <p><span className="font-medium">Registered Name (if provided):</span> {user.initialCompanyName || user.fullName}</p>
                            {user.role === 'buyer' && user.buyerPersonaType && <p><span className="font-medium">Stated Buyer Persona:</span> {user.buyerPersonaType}</p>}
                            <p className="font-medium mt-4">Uploaded Documents (Placeholders):</p>
                            <ul className="list-disc list-inside pl-4 text-muted-foreground">
                                <li><Link href="#" className="text-primary hover:underline flex items-center gap-1"><FileText size={16}/> ID_Proof_Document.pdf</Link></li>
                                {user.role === 'seller' && <li><Link href="#" className="text-primary hover:underline flex items-center gap-1"><FileText size={16}/> Business_Registration.pdf</Link></li>}
                            </ul>
                        </div>
                    ) : (
                         <p className="text-muted-foreground text-center py-4">No verification data submitted as user is anonymous.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="admin_actions">
            <Card className="shadow-md mt-6">
              <CardHeader>
                <CardTitle>Admin Actions on User</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button variant="outline"><MessageSquare className="h-4 w-4 mr-2"/> Send Message</Button>
                <Button variant="outline"><KeyRound className="h-4 w-4 mr-2"/> Send Password Reset</Button>
                <Button variant="outline">View Activity Log</Button>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700"><Trash2 className="h-4 w-4 mr-2" /> Delete User</Button>
                <Button variant="destructive">Suspend User</Button>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
