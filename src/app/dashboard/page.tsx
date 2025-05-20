
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, MessageSquare, PlusCircle, ShieldCheck, CheckCircle2, Eye } from "lucide-react";
import type { User, Inquiry } from "@/lib/types";
import { sampleUsers, sampleBuyerInquiries } from "@/lib/placeholder-data"; // Using buyer inquiries for demo

// Placeholder data - replace with actual user data fetched based on auth
// For Buyer Dashboard V1, assuming current user is user2 (Jane Smith - Verified Buyer)
// or user6 (Anna Tay - Anonymous Buyer) to test verification CTA
const currentBuyerId = 'user6'; // Change to 'user2' to see verified state
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentBuyerId && u.role === 'buyer');

const recentInquiries: Inquiry[] = sampleBuyerInquiries
  .filter(inq => inq.buyerId === currentBuyerId)
  .sort((a, b) => b.inquiryTimestamp.getTime() - a.inquiryTimestamp.getTime())
  .slice(0, 3);

export default function DashboardPage() {
  if (!currentUser) {
    // This should ideally be handled by auth redirects
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in as a buyer to view this page.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }

  const activeInquiriesCount = sampleBuyerInquiries.filter(inq => 
    inq.buyerId === currentUser.id && 
    inq.statusBuyerPerspective !== 'Archived' && 
    inq.statusBuyerPerspective !== 'Connection Facilitated by Admin'
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {currentUser.fullName}!</h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your buyer activity.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Inquiries</CardTitle>
            <MessageSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInquiriesCount}</div>
            <p className="text-xs text-muted-foreground">
              Track your ongoing conversations and interests.
            </p>
             <Button variant="link" asChild className="px-0 mt-2">
                <Link href="/dashboard/inquiries">View All My Inquiries</Link>
              </Button>
          </CardContent>
        </Card>

        <Card className={`shadow-lg ${currentUser.verificationStatus === 'verified' ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
            <ShieldCheck className={`h-5 w-5 ${currentUser.verificationStatus === 'verified' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentUser.verificationStatus === 'verified' ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {currentUser.verificationStatus === 'verified' ? 'Verified Buyer' : 
               currentUser.verificationStatus === 'pending_verification' ? 'Verification Pending' :
               'Anonymous Buyer'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentUser.verificationStatus === 'verified' 
                ? 'Access full details & engage with verified sellers.' 
                : 'Complete verification to unlock more features.'}
            </p>
            {currentUser.verificationStatus !== 'verified' && (
              <Button variant="link" asChild className="px-0 mt-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                <Link href="/dashboard/verification">
                  {currentUser.verificationStatus === 'pending_verification' ? 'Check Verification Status' : 'Request Verification Call'}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {recentInquiries.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Inquiries</CardTitle>
            <CardDescription>Your latest interactions with business listings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentInquiries.map(inquiry => (
              <div key={inquiry.id} className="p-3 border rounded-md hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/listings/${inquiry.listingId}`} className="font-medium text-primary hover:underline">
                      {inquiry.listingTitleAnonymous}
                    </Link>
                    <p className="text-xs text-muted-foreground">Inquired on: {new Date(inquiry.inquiryTimestamp).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/inquiries#${inquiry.id}`}><Eye className="mr-2 h-4 w-4" />View</Link>
                  </Button>
                </div>
                <p className="text-sm mt-1">Status: <span className="font-medium">{inquiry.statusBuyerPerspective}</span></p>
              </div>
            ))}
             <Button variant="outline" asChild className="w-full mt-4">
                <Link href="/dashboard/inquiries">View All My Inquiries</Link>
              </Button>
          </CardContent>
        </Card>
      )}
       {currentUser.verificationStatus === 'anonymous' && (
        <Card className="shadow-md bg-primary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary flex items-center"><CheckCircle2 className="mr-2"/> Unlock Full Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Become a Verified Buyer to view detailed information on verified listings, engage directly with sellers, and build trust within the BizMatch Asia community.
            </p>
            <Button asChild>
              <Link href="/dashboard/verification">Request Verification Call</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
