import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart, Users, Briefcase, DollarSign, CheckCircle, TrendingUp, UserMinus, UserPlus, Banknote, ShieldCheck, Handshake, ListX, ListChecks } from "lucide-react";
import { sampleAdminDashboardMetrics, sampleUsers, sampleListings } from "@/lib/placeholder-data";
import { Separator } from "@/components/ui/separator";

export default function AdminAnalyticsPage() {
  const metrics = sampleAdminDashboardMetrics;
  const totalUsers = metrics.totalActiveBuyers + metrics.totalActiveSellers;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue">Platform Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Total Users</CardTitle>
            <Users className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{totalUsers}</div>
            <p className="text-xs text-brand-dark-blue/70">{metrics.totalActiveSellers} Sellers, {metrics.totalActiveBuyers} Buyers</p>
          </CardContent>
        </Card>
         <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Total Listings (All Statuses)</CardTitle>
            <ListChecks className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.totalListingsAllStatuses}</div>
            <p className="text-xs text-brand-dark-blue/70">{metrics.totalActiveListingsVerified + metrics.totalActiveListingsAnonymous} active</p>
          </CardContent>
        </Card>
         <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Closed/Deactivated Listings</CardTitle>
            <ListX className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.closedOrDeactivatedListings}</div>
            <p className="text-xs text-brand-dark-blue/70">Inactive or deal finalized</p>
          </CardContent>
        </Card>
         <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Total Facilitated Connections</CardTitle>
            <Handshake className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.successfulConnectionsMTD}</div>
            <p className="text-xs text-brand-dark-blue/70">{metrics.activeSuccessfulConnections} active, {metrics.closedSuccessfulConnections} closed (MTD)</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-brand-light-gray/80"/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4 text-brand-dark-blue">User Segmentation</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Paid Buyers <UserPlus className="h-5 w-5 text-green-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-brand-dark-blue">{metrics.totalPaidBuyers}</div></CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Free Buyers <UserMinus className="h-5 w-5 text-orange-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-brand-dark-blue">{metrics.totalFreeBuyers}</div></CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
         <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Paid Sellers <UserPlus className="h-5 w-5 text-green-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-brand-dark-blue">{metrics.totalPaidSellers}</div></CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Free Sellers <UserMinus className="h-5 w-5 text-orange-500" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-brand-dark-blue">{metrics.totalFreeSellers}</div></CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Verified Buyers <ShieldCheck className="h-5 w-5 text-brand-sky-blue" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-brand-dark-blue">{sampleUsers.filter(u => u.role === 'buyer' && u.verificationStatus === 'verified').length}</div></CardContent>
        </Card>
         <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Verified Sellers <ShieldCheck className="h-5 w-5 text-brand-sky-blue" /></CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-brand-dark-blue">{sampleUsers.filter(u => u.role === 'seller' && u.verificationStatus === 'verified').length}</div></CardContent>
        </Card>
      </div>

      <Separator className="bg-brand-light-gray/80"/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4 text-brand-dark-blue">Revenue Breakdown (MTD)</h2>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Total Revenue (MTD)</CardTitle>
            <Banknote className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">${(metrics.totalRevenueMTD || 0).toLocaleString()}</div>
            <p className="text-xs text-brand-dark-blue/70">Sum from subscriptions (Conceptual)</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Revenue from Buyers (MTD)</CardTitle>
            <DollarSign className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">${(metrics.revenueFromBuyers || 0).toLocaleString()}</div>
            <p className="text-xs text-brand-dark-blue/70">Buyer subscriptions (Conceptual)</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Revenue from Sellers (MTD)</CardTitle>
            <DollarSign className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">${(metrics.revenueFromSellers || 0).toLocaleString()}</div>
            <p className="text-xs text-brand-dark-blue/70">Seller subscriptions/services (Conceptual)</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-brand-light-gray/80"/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4 text-brand-dark-blue">Connection Funnel</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md bg-brand-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-dark-blue">Active Successful Connections</CardTitle>
                <Handshake className="h-5 w-5 text-brand-sky-blue"/>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-brand-dark-blue">{metrics.activeSuccessfulConnections}</div>
                <p className="text-xs text-brand-dark-blue/70">Connections facilitated, ongoing</p>
            </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-dark-blue">Deals Closed (MTD)</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-500"/>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-brand-dark-blue">{metrics.closedSuccessfulConnections}</div>
                <p className="text-xs text-brand-dark-blue/70">Connections marked as deal closed/archived</p>
            </CardContent>
        </Card>
      </div>

      <Separator className="bg-brand-light-gray/80"/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4 text-brand-dark-blue">Activity Charts (Placeholders)</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue">User Growth Over Time</CardTitle>
            <CardDescription className="text-brand-dark-blue/80">Monthly new user registrations (Sellers vs Buyers).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-brand-light-gray/30 rounded-md">
            <LineChart className="h-24 w-24 text-brand-dark-blue/50" />
            <p className="text-brand-dark-blue/70 ml-4">User Growth Chart</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue">Listing by Industry</CardTitle>
            <CardDescription className="text-brand-dark-blue/80">Distribution of active listings across industries.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-brand-light-gray/30 rounded-md">
            <BarChart className="h-24 w-24 text-brand-dark-blue/50" />
            <p className="text-brand-dark-blue/70 ml-4">Listings by Industry Chart</p>
          </CardContent>
        </Card>
         <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue">Revenue Over Time</CardTitle>
            <CardDescription className="text-brand-dark-blue/80">Monthly recurring revenue (MRR) or total revenue.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-brand-light-gray/30 rounded-md">
            <TrendingUp className="h-24 w-24 text-brand-dark-blue/50" />
            <p className="text-brand-dark-blue/70 ml-4">Revenue Chart</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue">User Role Distribution</CardTitle>
            <CardDescription className="text-brand-dark-blue/80">Overall breakdown of sellers vs. buyers.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-brand-light-gray/30 rounded-md">
            <PieChart className="h-24 w-24 text-brand-dark-blue/50" />
            <p className="text-brand-dark-blue/70 ml-4">User Role Distribution Chart</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
