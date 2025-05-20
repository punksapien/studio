import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, MessageSquare, PlusCircle, ShieldCheck } from "lucide-react";

// Placeholder data - replace with actual user data
const user = {
  name: "John Doe",
  role: "seller", // or "buyer"
  isVerified: true,
  activeListings: 2,
  pendingInquiries: 3,
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your account activity.</p>
        </div>
        {user.role === 'seller' && (
          <Button asChild>
            <Link href="/dashboard/listings/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Listing
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user.role === 'seller' && (
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.activeListings}</div>
              <p className="text-xs text-muted-foreground">
                Your businesses currently on the marketplace.
              </p>
              <Button variant="link" asChild className="px-0 mt-2">
                <Link href="/dashboard/listings">Manage Listings</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inquiries</CardTitle>
            <MessageSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.pendingInquiries}</div>
            <p className="text-xs text-muted-foreground">
              New interests from potential {user.role === 'seller' ? 'buyers' : 'sellers'}.
            </p>
             <Button variant="link" asChild className="px-0 mt-2">
                <Link href="/dashboard/inquiries">View Inquiries</Link>
              </Button>
          </CardContent>
        </Card>

        <Card className={`shadow-lg ${user.isVerified ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
            <ShieldCheck className={`h-5 w-5 ${user.isVerified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${user.isVerified ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {user.isVerified ? 'Verified' : 'Pending Verification'}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.isVerified 
                ? 'Your account is verified, enjoy full platform access.' 
                : 'Complete verification to unlock more features.'}
            </p>
            {!user.isVerified && (
              <Button variant="link" asChild className="px-0 mt-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                <Link href="/dashboard/verification">Complete Verification</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions or Recent Activity Section (Placeholder) */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A summary of your latest interactions on BizMatch Asia.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {/* Placeholder content, e.g., a list of recent inquiries or listing updates. */}
            No recent activity to display.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
