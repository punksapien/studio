
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart, Users, Briefcase, DollarSign, CheckCircle, TrendingUp, UserMinus, UserPlus, Banknote, ShieldCheck } from "lucide-react";
import { sampleAdminDashboardMetrics, sampleUsers } from "@/lib/placeholder-data";
import { Separator } from "@/components/ui/separator";

// Assuming you have Chart components from shadcn/ui or recharts
// For MVP, we'll use placeholders.
// import { ChartContainer, ChartTooltip, ChartTooltipContent, Bar, XAxis, YAxis } from "@/components/ui/chart"; // Example if using shadcn charts

const chartConfigPlaceholder = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
  listings: { label: "Listings", color: "hsl(var(--chart-2))" },
};

export default function AdminAnalyticsPage() {
  const metrics = sampleAdminDashboardMetrics;
  const totalUsers = metrics.totalActiveBuyers + metrics.totalActiveSellers;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">{metrics.totalActiveSellers} Sellers, {metrics.totalActiveBuyers} Buyers</p>
          </CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings (Verified)</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActiveListingsVerified}</div>
            <p className="text-xs text-muted-foreground">{metrics.totalActiveListingsAnonymous} anonymous</p>
          </CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Connections (MTD)</CardTitle>
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successfulConnectionsMTD}</div>
            <p className="text-xs text-muted-foreground">Admin facilitated connections</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Deals (MTD)</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dealsClosedMTD || 0}</div>
            <p className="text-xs text-muted-foreground">Reported or tracked</p>
          </CardContent>
        </Card>
      </div>

      <Separator/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4">User Segmentation</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between">Paid Buyers <UserPlus className="h-5 w-5 text-green-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.totalPaidBuyers}</div></CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between">Free Buyers <UserMinus className="h-5 w-5 text-orange-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.totalFreeBuyers}</div></CardContent>
        </Card>
        <Card className="shadow-md">
         <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between">Paid Sellers <UserPlus className="h-5 w-5 text-green-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.totalPaidSellers}</div></CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between">Free Sellers <UserMinus className="h-5 w-5 text-orange-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.totalFreeSellers}</div></CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Card className="shadow-md">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between">Verified Buyers <ShieldCheck className="h-5 w-5 text-blue-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{sampleUsers.filter(u => u.role === 'buyer' && u.verificationStatus === 'verified').length}</div></CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between">Verified Sellers <ShieldCheck className="h-5 w-5 text-blue-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{sampleUsers.filter(u => u.role === 'seller' && u.verificationStatus === 'verified').length}</div></CardContent>
        </Card>
      </div>
      
      <Separator/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4">Financials</h2>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         <Card className="shadow-md md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Generated (MTD)</CardTitle>
            <Banknote className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.totalRevenueMTD || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From subscriptions and services (Conceptual)</p>
          </CardContent>
        </Card>
      </div>

      <Separator/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4">Activity Charts (Placeholders)</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
            <CardDescription>Monthly new user registrations (Sellers vs Buyers).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
            <LineChart className="h-24 w-24 text-muted-foreground" />
            <p className="text-muted-foreground ml-4">User Growth Chart</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Listing by Industry</CardTitle>
            <CardDescription>Distribution of active listings across industries.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
            <BarChart className="h-24 w-24 text-muted-foreground" />
            <p className="text-muted-foreground ml-4">Listings by Industry Chart</p>
          </CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly recurring revenue (MRR) or total revenue.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
            <TrendingUp className="h-24 w-24 text-muted-foreground" />
            <p className="text-muted-foreground ml-4">Revenue Chart</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Overall breakdown of sellers vs. buyers.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
            <PieChart className="h-24 w-24 text-muted-foreground" />
            <p className="text-muted-foreground ml-4">User Role Distribution Chart</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
