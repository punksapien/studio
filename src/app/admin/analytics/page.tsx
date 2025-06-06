'use client';

import * as React from "react";
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, LineChart, PieChart, Users, Briefcase, DollarSign, CheckCircle, TrendingUp, UserMinus, UserPlus, Banknote, ShieldCheck, Handshake, ListX, ListChecks, RefreshCw, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, PieChart as RechartsPieChart, Cell, LabelList } from 'recharts';
import type { AdminDashboardMetrics } from '@/lib/types';

// Chart color configurations
const userGrowthChartConfig = {
  sellers: {
    label: "Sellers",
    color: "hsl(var(--brand-dark-blue-hsl))",
  },
  buyers: {
    label: "Buyers",
    color: "hsl(var(--brand-sky-blue-hsl))",
  },
}

const userDistributionChartConfig = {
  sellers: {
    label: "Sellers",
    color: "hsl(var(--brand-dark-blue-hsl))",
  },
  buyers: {
    label: "Buyers",
    color: "hsl(var(--brand-sky-blue-hsl))",
  },
}

// Chart colors for pie chart
const COLORS = {
  sellers: "hsl(var(--brand-dark-blue-hsl))",
  buyers: "hsl(var(--brand-sky-blue-hsl))",
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
};

export default function AdminAnalyticsPage() {
  const { data: metrics, error, isLoading, mutate } = useSWR<AdminDashboardMetrics>(
    '/api/admin/metrics',
    fetcher,
    {
      refreshInterval: 60000, // Auto-refresh every 60 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const { data: userGrowthData, error: userGrowthError, isLoading: userGrowthLoading } = useSWR(
    '/api/admin/user-growth',
    fetcher,
    {
      refreshInterval: 300000, // Auto-refresh every 5 minutes (historical data changes less frequently)
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const handleRefresh = () => {
    mutate();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue">Platform Analytics</h1>
          <Button disabled variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-md bg-brand-white">
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue">Platform Analytics</h1>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="shadow-md bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">Failed to load analytics data</p>
                <p className="text-sm text-red-600">{error.message || 'An error occurred'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const totalUsers = metrics.totalActiveBuyers + metrics.totalActiveSellers;

  // Prepare data for user distribution pie chart
  const userDistributionData = [
    {
      role: 'Buyers',
      count: metrics.totalActiveBuyers,
      fill: COLORS.buyers,
    },
    {
      role: 'Sellers',
      count: metrics.totalActiveSellers,
      fill: COLORS.sellers,
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark-blue">Platform Analytics</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600">
            Live Data
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

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
            {metrics.totalListingsAllStatuses === 0 && (
              <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
            )}
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
            {metrics.closedOrDeactivatedListings === 0 && (
              <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
            )}
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
            {metrics.successfulConnectionsMTD === 0 && (
              <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-brand-light-gray/80"/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4 text-brand-dark-blue">Recent Activity (7 Days)</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">
              New Sellers (7d)
              <UserPlus className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.newUserRegistrations7dSellers}</div>
            <p className="text-xs text-brand-dark-blue/70">{metrics.newUserRegistrations24hSellers} in last 24h</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">
              New Buyers (7d)
              <UserPlus className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.newUserRegistrations7dBuyers}</div>
            <p className="text-xs text-brand-dark-blue/70">{metrics.newUserRegistrations24hBuyers} in last 24h</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">
              New Listings (7d)
              <ListChecks className="h-5 w-5 text-brand-sky-blue" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.newListingsCreated7d}</div>
            <p className="text-xs text-brand-dark-blue/70">{metrics.newListingsCreated24h} in last 24h</p>
            {metrics.newListingsCreated7d === 0 && (
              <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">
              Verification Queue
              <ShieldCheck className="h-5 w-5 text-brand-sky-blue" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.buyerVerificationQueueCount + metrics.sellerVerificationQueueCount}</div>
            <p className="text-xs text-brand-dark-blue/70">{metrics.buyerVerificationQueueCount} buyers, {metrics.sellerVerificationQueueCount} sellers</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-brand-light-gray/80"/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4 text-brand-dark-blue">User Segmentation</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Paid Buyers <UserPlus className="h-5 w-5 text-green-500" /></CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.totalPaidBuyers}</div>
            {metrics.totalPaidBuyers === 0 && (
              <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Free Buyers <UserMinus className="h-5 w-5 text-orange-500" /></CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.totalFreeBuyers}</div>
            <p className="text-xs text-brand-dark-blue/70">All users currently free</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
         <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Paid Sellers <UserPlus className="h-5 w-5 text-green-500" /></CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.totalPaidSellers}</div>
            {metrics.totalPaidSellers === 0 && (
              <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="pb-2"> <CardTitle className="text-sm font-medium flex items-center justify-between text-brand-dark-blue">Free Sellers <UserMinus className="h-5 w-5 text-orange-500" /></CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">{metrics.totalFreeSellers}</div>
            <p className="text-xs text-brand-dark-blue/70">All users currently free</p>
          </CardContent>
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
            <p className="text-xs text-brand-dark-blue/70">Sum from subscriptions</p>
            {(metrics.totalRevenueMTD || 0) === 0 && (
              <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Revenue from Buyers (MTD)</CardTitle>
            <DollarSign className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">${(metrics.revenueFromBuyers || 0).toLocaleString()}</div>
            <p className="text-xs text-brand-dark-blue/70">Buyer subscriptions</p>
            {(metrics.revenueFromBuyers || 0) === 0 && (
              <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-dark-blue">Revenue from Sellers (MTD)</CardTitle>
            <DollarSign className="h-5 w-5 text-brand-dark-blue/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-dark-blue">${(metrics.revenueFromSellers || 0).toLocaleString()}</div>
            <p className="text-xs text-brand-dark-blue/70">Seller subscriptions/services</p>
            {(metrics.revenueFromSellers || 0) === 0 && (
              <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
            )}
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
                {metrics.activeSuccessfulConnections === 0 && (
                  <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
                )}
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
                {metrics.closedSuccessfulConnections === 0 && (
                  <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
                )}
            </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-dark-blue">Ready to Engage Queue</CardTitle>
                <TrendingUp className="h-5 w-5 text-brand-sky-blue"/>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-brand-dark-blue">{metrics.readyToEngageQueueCount}</div>
                <p className="text-xs text-brand-dark-blue/70">Pending admin facilitation</p>
                {metrics.readyToEngageQueueCount === 0 && (
                  <Badge variant="outline" className="text-orange-600 mt-1">Coming Soon</Badge>
                )}
            </CardContent>
        </Card>
      </div>

      <Separator className="bg-brand-light-gray/80"/>
      <h2 className="text-2xl font-semibold tracking-tight pt-4 text-brand-dark-blue">Activity Charts</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Over Time Chart */}
        <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue flex items-center justify-between">
              User Growth Over Time
              <Badge variant="outline" className="text-green-600">Live Data</Badge>
            </CardTitle>
            <CardDescription className="text-brand-dark-blue/80">Monthly new user registrations (Sellers vs Buyers).</CardDescription>
          </CardHeader>
          <CardContent>
            {userGrowthLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-brand-dark-blue/50 animate-spin" />
                <p className="text-brand-dark-blue/70 ml-2">Loading chart data...</p>
              </div>
            ) : userGrowthError ? (
              <div className="h-[300px] flex items-center justify-center bg-red-50 rounded-md">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-red-600 ml-2">Failed to load chart data</p>
              </div>
            ) : userGrowthData && userGrowthData.length > 0 ? (
              <ChartContainer config={userGrowthChartConfig} className="h-[300px]">
                <RechartsLineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="sellers"
                    stroke="var(--color-sellers)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-sellers)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="buyers"
                    stroke="var(--color-buyers)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-buyers)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </RechartsLineChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-brand-light-gray/30 rounded-md">
                <LineChart className="h-24 w-24 text-brand-dark-blue/50" />
                <p className="text-brand-dark-blue/70 ml-4">No historical data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Role Distribution Chart */}
        <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue flex items-center justify-between">
              User Role Distribution
              <Badge variant="outline" className="text-green-600">Live Data</Badge>
            </CardTitle>
            <CardDescription className="text-brand-dark-blue/80">Current breakdown of sellers vs. buyers on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {totalUsers > 0 ? (
              <ChartContainer config={userDistributionChartConfig} className="h-[300px]">
                <RechartsPieChart>
                  <Pie
                    data={userDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ role, count, percent }) =>
                      `${role}: ${count} (${(percent * 100).toFixed(1)}%)`
                    }
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {userDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [
                      `${value} users (${((value as number / totalUsers) * 100).toFixed(1)}%)`,
                      name
                    ]}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-brand-light-gray/30 rounded-md">
                <PieChart className="h-24 w-24 text-brand-dark-blue/50" />
                <p className="text-brand-dark-blue/70 ml-4">No users registered yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placeholder charts for future implementation */}
        <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue flex items-center justify-between">
              Revenue Over Time
              <Badge variant="outline" className="text-orange-600">Coming Soon</Badge>
            </CardTitle>
            <CardDescription className="text-brand-dark-blue/80">Monthly recurring revenue (MRR) or total revenue.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-brand-light-gray/30 rounded-md">
            <TrendingUp className="h-24 w-24 text-brand-dark-blue/50" />
            <p className="text-brand-dark-blue/70 ml-4">Revenue Chart</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-brand-white">
          <CardHeader>
            <CardTitle className="text-brand-dark-blue flex items-center justify-between">
              Listing by Industry
              <Badge variant="outline" className="text-orange-600">Coming Soon</Badge>
            </CardTitle>
            <CardDescription className="text-brand-dark-blue/80">Distribution of active listings across industries.</CardDescription>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-brand-light-gray/30 rounded-md">
            <BarChart className="h-24 w-24 text-brand-dark-blue/50" />
            <p className="text-brand-dark-blue/70 ml-4">Listings by Industry Chart</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
