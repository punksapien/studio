'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  FileText,
  MessageSquare,
  PlusCircle,
  ExternalLink,
  BarChart3,
  Verified,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Timer,
  TrendingUp,
  ShieldCheck,
  Eye,
  Send
} from 'lucide-react';
import { useSellerDashboard } from '@/hooks/use-seller-dashboard';
import { useVerificationRequest } from '@/hooks/use-verification-request';
import { VerificationRequestModal } from '@/components/verification/verification-request-modal';
import React from 'react';

export default function SellerDashboard() {
  const { user, stats, recentListings, isLoading, error, refreshData, isPolling } = useSellerDashboard();
  const { requests: verificationRequests, currentStatus: verificationStatus, canSubmitNewRequest } = useVerificationRequest();

  // Prepare listings for verification modal
  const userListingsForVerification = recentListings.map(l => ({
    id: l.id,
    listing_title_anonymous: l.title,
    status: l.status
  }));

  const getVerificationStatusInfo = () => {
    const pendingUserRequest = verificationRequests.find(r =>
      r.request_type === 'user_verification' &&
      ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'].includes(r.status)
    );

    switch (verificationStatus) {
      case 'verified':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          status: 'Verified Seller',
          description: 'Your profile has been verified by our team',
          badgeVariant: 'default' as const,
          badgeColor: 'bg-green-100 text-green-800 border-green-200',
          actionText: 'Manage Verification',
          showButton: false
        };
      case 'pending_verification':
        return {
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          status: 'Verification Pending',
          description: pendingUserRequest ?
            `Your verification request is ${pendingUserRequest.status.toLowerCase()}. ${pendingUserRequest.can_bump ? 'You can bump it to the top!' : (pendingUserRequest.hours_until_can_bump && pendingUserRequest.hours_until_can_bump > 0) ? `You can bump it in ${pendingUserRequest.hours_until_can_bump} hours.` : ''}` :
            'Your profile verification is being reviewed',
          badgeVariant: 'outline' as const,
          badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          actionText: pendingUserRequest?.can_bump ? 'Bump Request' : (pendingUserRequest?.hours_until_can_bump && pendingUserRequest.hours_until_can_bump > 0) ? `Bump in ${pendingUserRequest.hours_until_can_bump}h` : 'View Status',
          showButton: true,
          canBump: pendingUserRequest?.can_bump || false,
          hoursUntilBump: pendingUserRequest?.hours_until_can_bump || 0
        };
      default: // anonymous
        const canSubmit = canSubmitNewRequest('user_verification');
        // Better logic for action text - avoid showing "0h"
        let actionText = 'Request Verification';
        if (!canSubmit.canSubmit) {
          if (canSubmit.hoursRemaining && canSubmit.hoursRemaining > 0) {
            actionText = `Available in ${canSubmit.hoursRemaining}h`;
          } else {
            // If no hours remaining but still can't submit, it means there's a pending request
            actionText = 'Request Pending';
          }
        }

        return {
          icon: <User className="h-5 w-5 text-gray-600" />,
          status: 'Anonymous Seller',
          description: canSubmit.canSubmit ?
            'Get verified to build trust and increase visibility' :
            canSubmit.message || 'Verification request pending',
          badgeVariant: 'outline' as const,
          badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
          actionText,
          showButton: true,
          disabled: !canSubmit.canSubmit,
          hoursRemaining: canSubmit.hoursRemaining || 0
        };
    }
  };

  const verificationInfo = getVerificationStatusInfo();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={refreshData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with Real-time Indicator */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <div className="text-muted-foreground mt-1">
              Welcome back, {user?.fullName || 'User'}
              {isPolling && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Live updates
                </span>
              )}
            </div>
          </div>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Enhanced Verification Status Card - Updated */}
        <Card className={`mb-8 border-2 ${
          verificationInfo.badgeColor.includes('green') ? 'border-green-200 bg-green-50/50' :
          verificationInfo.badgeColor.includes('yellow') ? 'border-yellow-200 bg-yellow-50/50' :
          (verificationStatus === 'anonymous' && verificationRequests.some(r => r.request_type === 'user_verification' && ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'].includes(r.status))) ? 'border-yellow-200 bg-yellow-50/50' :
          'border-gray-200'
        }`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {verificationInfo.icon}
                <div>
                  <CardTitle className="text-lg">{verificationInfo.status}</CardTitle>
                  <CardDescription className="mt-1">
                    {verificationInfo.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={verificationInfo.badgeColor}>
                  {verificationStatus === 'verified' && <Verified className="h-3 w-3 mr-1" />}
                  {verificationStatus === 'pending_verification' && <Clock className="h-3 w-3 mr-1" />}
                  {verificationStatus === 'anonymous' && <User className="h-3 w-3 mr-1" />}
                  {verificationInfo.status}
                </Badge>
              </div>
            </div>
          </CardHeader>

          {verificationInfo.showButton && (
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {(verificationInfo.hoursRemaining !== undefined && verificationInfo.hoursRemaining > 0) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Timer className="h-4 w-4" />
                      <span>Cooldown: {verificationInfo.hoursRemaining} hours remaining</span>
                      <Progress value={(24 - (verificationInfo.hoursRemaining || 0)) / 24 * 100} className="w-24 h-2" />
                    </div>
                  )}
                  {(verificationInfo.hoursUntilBump !== undefined && verificationInfo.hoursUntilBump > 0) && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 mb-2">
                      <Timer className="h-4 w-4" />
                      <span>Can bump request in {verificationInfo.hoursUntilBump} hours</span>
                      <Progress value={(24 - (verificationInfo.hoursUntilBump || 0)) / 24 * 100} className="w-24 h-2" />
                    </div>
                  )}
                </div>

                <VerificationRequestModal
                  userListings={userListingsForVerification}
                  onSuccess={refreshData}
                >
                  <Button
                    disabled={verificationInfo.disabled && !verificationInfo.canBump}
                    variant={verificationInfo.canBump ? "default" : "outline"}
                    className={`
                      ${verificationInfo.canBump ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                      ${!verificationInfo.canBump && !verificationInfo.disabled ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600" : ""}
                      ${verificationInfo.disabled && !verificationInfo.canBump ?
                        "!bg-gray-200 !text-gray-500 !border-gray-300 !opacity-60 !cursor-not-allowed hover:!bg-gray-200 hover:!text-gray-500 hover:!border-gray-300" : ""
                      }
                    `}
                    style={verificationInfo.disabled && !verificationInfo.canBump ? {
                      pointerEvents: 'none',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      borderColor: '#d1d5db'
                    } : undefined}
                  >
                    {verificationInfo.canBump ? (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Bump to Top
                      </>
                    ) : verificationInfo.disabled ? (
                      <>
                        <Timer className="h-4 w-4 mr-2" />
                        {verificationInfo.actionText}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {verificationInfo.actionText}
                      </>
                    )}
                  </Button>
                </VerificationRequestModal>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListingsCount}</div>
              <p className="text-xs text-muted-foreground">
                Listings currently visible to buyers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInquiriesReceived}</div>
              <p className="text-xs text-muted-foreground">
                All-time inquiries received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Response</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inquiriesAwaitingEngagement}</div>
              <p className="text-xs text-muted-foreground">
                New inquiries needing attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/seller-dashboard/listings/create">
                <Button className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Create New Listing
                </Button>
              </Link>
              <Link href="/seller-dashboard/inquiries">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View All Inquiries
                </Button>
              </Link>
              <Link href="/seller-dashboard/settings">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Profile Completion</span>
                  <span>{verificationStatus === 'verified' ? '100%' : verificationStatus === 'pending_verification' ? '80%' : '60%'}</span>
                </div>
                <Progress value={verificationStatus === 'verified' ? 100 : verificationStatus === 'pending_verification' ? 80 : 60} />
                <p className="text-xs text-muted-foreground">
                  {verificationStatus === 'verified'
                    ? 'Your profile is fully verified and optimized for maximum trust.'
                    : verificationStatus === 'pending_verification'
                    ? 'Your verification is pending. Verified profiles get 3x more inquiries.'
                    : 'Complete verification to increase buyer trust and inquiry rates.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Listings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Listings
            </CardTitle>
            <Link href="/seller-dashboard/listings">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentListings.length > 0 ? (
              <div className="space-y-4">
                {recentListings.map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{listing.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {listing.status.replace('_', ' ')}
                        </Badge>
                        {listing.asking_price && (
                          <span className="text-sm text-muted-foreground">
                            ${listing.asking_price.toLocaleString()}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {listing.inquiry_count || 0} inquiries
                        </span>
                      </div>
                    </div>
                    <Link href={`/seller-dashboard/listings/${listing.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first listing to start connecting with buyers.
                </p>
                <Link href="/seller-dashboard/listings/create">
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
