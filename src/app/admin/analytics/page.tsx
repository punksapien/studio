
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart, Users, Briefcase, DollarSign, CheckCircle, TrendingUp, UserMinus, UserPlus, Banknote } from "lucide-react";
import { sampleAdminDashboardMetrics } from "@/lib/placeholder-data";

// Assuming you have Chart components from shadcn/ui or recharts
// For MVP, we'll use placeholders.
// import { ChartContainer, ChartTooltip, ChartTooltipContent, Bar, XAxis, YAxis } from "@/components/ui/chart"; // Example if using shadcn charts

const chartConfigPlaceholder = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
  listings: { label: "Listings", color: "hsl(var(--chart-2))" },
};

export default function AdminAnalyticsPage() {
  const metrics = sampleAdminDashboardMetrics;

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
            <div className="text-2xl font-bold">{metrics.totalActiveBuyers + metrics.totalActiveSellers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
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
            <CardTitle className="text-sm font-medium">Successful Connections</CardTitle>
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successfulConnectionsCount}</div>
            <p className="text-xs text-muted-foreground">Admin facilitated connections</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.closedDealsCount}</div>
            <p className="text-xs text-muted-foreground">Reported or tracked</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold tracking-tight pt-4">User Segmentation</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Buyers</CardTitle>
            <UserPlus className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.paidBuyersCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Buyers</CardTitle>
            <UserMinus className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.freeBuyersCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Sellers</CardTitle>
            <UserPlus className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.paidSellersCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Sellers</CardTitle>
            <UserMinus className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.freeSellersCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-2xl font-semibold tracking-tight pt-4">Financials</h2>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         <Card className="shadow-md md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Generated</CardTitle>
            <Banknote className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From subscriptions and services</p>
          </CardContent>
        </Card>
      </div>


      <h2 className="text-2xl font-semibold tracking-tight pt-4">Activity Charts</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
            <CardDescription>Monthly new user registrations.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
            <LineChart className="h-24 w-24 text-muted-foreground" />
            <p className="text-muted-foreground ml-4">User Growth Chart (Placeholder)</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Listing by Industry</CardTitle>
            <CardDescription>Distribution of active listings across industries.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
            <BarChart className="h-24 w-24 text-muted-foreground" />
            <p className="text-muted-foreground ml-4">Listings by Industry Chart (Placeholder)</p>
          </CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly recurring revenue (MRR) or total revenue.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
            <TrendingUp className="h-24 w-24 text-muted-foreground" />
            <p className="text-muted-foreground ml-4">Revenue Chart (Placeholder)</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Breakdown of sellers vs. buyers.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
            <PieChart className="h-24 w-24 text-muted-foreground" />
            <p className="text-muted-foreground ml-4">User Role Distribution (Placeholder)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
