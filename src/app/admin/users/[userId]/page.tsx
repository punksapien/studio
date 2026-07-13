'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import * as React from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Mail, Phone, MapPin, CalendarDays, UserCircle,
  ShieldCheck, ShieldAlert, Edit3, Building2, Users2,
  Clock, Loader2, ArrowLeft, RefreshCw, AlertCircle, Eye, Target,
  FileText, User, Activity, Crown, Sparkles, Zap, Key,
  KeyRound, Trash2, Ban, MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminPageShell } from "@/components/admin/page-header";
import { AdminLoginLinkDialog } from "@/components/admin/admin-login-link-dialog";
import { VerificationStatusBadge } from "@/components/shared/verification-status-badge";
import { AdminSetPasswordDialog } from "@/components/admin/admin-set-password-dialog";
import { AdminDeleteUserDialog } from "@/components/admin/admin-delete-user-dialog";

// Types for API response
interface UserDetailResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
    verificationStatus: string;
    country: string;
    isEmailVerified: boolean;
    lastLogin: string | null;
    initialCompanyName?: string;
    buyerPersonaType?: string;
    buyerPersonaOther?: string;
    investmentFocusDescription?: string;
    preferredInvestmentSize?: string;
    keyIndustriesOfInterest?: string;
    is_onboarding_completed: boolean;
    isOnboardingCompleted: boolean;
    onboarding_step_completed: number;
    onboardingStep: number;
    onboardingCompletedAt?: string;
    submittedDocuments?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    listingCount: number;
    inquiryCount: number;
    verificationRequestCount: number;
    conversationCount: number;
  };
  metadata: {
    fetchedAt: string;
    source: string;
  };
}

// Types for meme API
interface MemeResponse {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  nsfw: boolean;
  spoiler: boolean;
  author: string;
  ups: number;
  preview: string[];
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<UserDetailResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('USER_NOT_FOUND');
    }
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Meme fetcher function
const memeFetcher = async (url: string): Promise<MemeResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Meme API Error: ${res.status}`);
  }
  return res.json();
};

// Utility component for formatted dates
function FormattedDate({ dateString }: { dateString?: string | null }) {
  const [formattedDate, setFormattedDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (dateString) {
      const dateObj = new Date(dateString);
      if (!isNaN(dateObj.getTime())) {
        setFormattedDate(dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }));
      } else {
        setFormattedDate('Invalid Date');
      }
    } else {
      setFormattedDate('N/A');
    }
  }, [dateString]);

  return <span>{formattedDate || 'N/A'}</span>;
}

// Bordered key-value row primitives (label left, value right, divided rows).
// Fixed min row height so every row lines up regardless of text vs badge content.
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-4 px-3 py-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right break-words">{children}</div>
    </div>
  );
}

// Section stretches to fill its grid cell so side-by-side blocks share the same border height.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
      <div className="flex-1 divide-y border text-sm">{children}</div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { toast } = useToast();

  // State for admin action dialogs
  const [isLoginLinkDialogOpen, setIsLoginLinkDialogOpen] = React.useState(false);
  const [isSetPasswordDialogOpen, setIsSetPasswordDialogOpen] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; block: boolean }>({ open: false, block: false });

  // Fetch user data with SWR
  const {
    data,
    error,
    isLoading,
    mutate: refetchUser
  } = useSWR<UserDetailResponse>(
    userId ? `/api/admin/users/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  // Fetch a random meme for admin users
  const {
    data: memeData,
    error: memeError,
    isLoading: memeLoading,
    mutate: refreshMeme
  } = useSWR<MemeResponse>(
    data?.user?.role === 'admin' ? 'https://meme-api.com/gimme/wholesomememes' : null,
    memeFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Handle loading state
  if (isLoading) {
    return (
      <AdminPageShell title="User Details" description="Full profile, activity and management actions for this user." scrollable>
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Loading user details...</h3>
              <p className="text-muted-foreground text-sm">Fetching comprehensive user information</p>
            </div>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  // Handle error states
  if (error) {
    if (error.message === 'USER_NOT_FOUND') {
      notFound();
      return null;
    }

    return (
      <AdminPageShell title="User Details" description="Full profile, activity and management actions for this user." scrollable>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/admin/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load user details: {error.message}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetchUser()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/users')}>
              Return to User List
            </Button>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  // Ensure data exists before rendering
  if (!data?.user) {
    notFound();
    return null;
  }

  const user = data.user;

  const handleRefreshData = () => {
    refetchUser();
    toast({
      title: "Data Refreshed",
      description: "User information has been updated.",
    });
  };

  return (
    <AdminPageShell title="User Details" description="Full profile, activity and management actions for this user." scrollable>
      <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center text-brand-dark-blue">
              <UserCircle className="h-5 w-5 mr-2 text-primary" />
              {user.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: <FormattedDate dateString={data.metadata.fetchedAt} />
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {user.role === 'admin' && (
            <Button variant="outline" disabled className="opacity-50">
              <Crown className="h-4 w-4 mr-2" />
              Admin Account
            </Button>
          )}
          <Button variant="outline" size="icon" title="Refresh" onClick={handleRefreshData}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {/* User Settings & Quick Access */}
      {user.role !== 'admin' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">User Settings</CardTitle>
            <CardDescription>
              Account management actions for this user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLoginLinkDialogOpen(true)}
                className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              >
                <Key className="mr-2 h-4 w-4" />
                Generate Login Link
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSetPasswordDialogOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialog({ open: true, block: false })}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteDialog({ open: true, block: true })}>
                <Ban className="mr-2 h-4 w-4" />
                Delete & Block
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Profile Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-lg text-brand-dark-blue">
              {user.fullName}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {user.role}
              </Badge>
              {user.role === 'admin' && (
                <>
                  <Badge className="bg-purple-500 text-white">Platform Admin</Badge>
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Full Access
                  </Badge>
                </>
              )}
              <VerificationStatusBadge status={user.verificationStatus} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Section title="Contact Information">
              <Row label="Email"><span className="break-all">{user.email}</span></Row>
              <Row label="Phone">{user.phoneNumber || 'Not provided'}</Row>
              <Row label="Country">{user.country || 'Not provided'}</Row>
            </Section>

            <Section title="Account Information">
              <Row label="Email Verified">
                {user.isEmailVerified
                  ? <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Confirmed</Badge>
                  : <Badge variant="secondary">Unconfirmed</Badge>}
              </Row>
              <Row label="Registered"><FormattedDate dateString={user.createdAt} /></Row>
              {user.lastLogin && (
                <Row label="Last Login"><FormattedDate dateString={user.lastLogin} /></Row>
              )}
            </Section>

            {user.role === 'admin' ? (
              <Section title="Admin Status">
                <Row label="Access Level"><Badge className="bg-purple-100 text-purple-700">Maximum</Badge></Row>
                <Row label="Privileges"><span className="text-purple-700 font-medium">All Systems</span></Row>
                <Row label="Security Clearance"><Badge className="bg-green-100 text-green-700">Maximum</Badge></Row>
                <Row label="Role"><span className="text-purple-700 font-medium">Platform Administrator</span></Row>
              </Section>
            ) : (
              <Section title="Platform Activity">
                <Row label="Onboarding">
                  {user.is_onboarding_completed ? 'Completed' : `Step ${user.onboarding_step_completed}`}
                </Row>
                {user.role === 'seller' && <Row label="Listings">{user.listingCount}</Row>}
                <Row label={user.role === 'buyer' ? 'Inquiries Sent' : 'Inquiries Received'}>{user.inquiryCount}</Row>
                {user.role === 'seller' && user.initialCompanyName && (
                  <Row label="Company">{user.initialCompanyName}</Row>
                )}
              </Section>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Special Admin Section with Personality and Memes */}
      {user.role === 'admin' && (
        <Card className="shadow-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <Crown className="h-5 w-5 mr-2 animate-pulse" />
                You Are Admin LOL!
                <Sparkles className="h-5 w-5 ml-2 animate-bounce" />
              </div>
              {memeData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshMeme()}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Meme
                </Button>
              )}
            </CardTitle>
            <CardDescription className="text-purple-100">
              🎉 You're looking at a fellow admin's profile! Here's some wholesome content to brighten your day.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Admin Personality Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-purple-700">
                  <Zap className="h-4 w-4" />
                  <h4 className="text-sm font-semibold">Admin Powers Activated!</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-100 text-purple-700">🚀 Super User</Badge>
                    <span>Can access all admin features</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-pink-100 text-pink-700">👑 Platform Master</Badge>
                    <span>Ultimate platform control</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-700">🔍 Data Detective</Badge>
                    <span>Can see all user analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-700">🛡️ Security Guardian</Badge>
                    <span>Verification queue master</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                  <p className="text-purple-800 text-sm font-medium">
                    💝 Fun Fact: You're viewing {user.fullName}'s admin profile. They probably know all the platform secrets!
                  </p>
                </div>
              </div>

              {/* Meme Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-pink-700">
                  <Sparkles className="h-4 w-4" />
                  <h4 className="text-sm font-semibold">Admin Mood Booster</h4>
                </div>

                {memeLoading && (
                  <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-2" />
                      <p className="text-sm text-gray-600">Loading wholesome meme...</p>
                    </div>
                  </div>
                )}

                {memeError && (
                  <div className="h-48 bg-red-50 rounded-lg border-2 border-red-200 flex items-center justify-center">
                    <div className="text-center text-red-600">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Memes are taking a break! 😴</p>
                    </div>
                  </div>
                )}

                {memeData && !memeLoading && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                      <img
                        src={memeData.url}
                        alt={memeData.title}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <h5 className="font-medium text-gray-800 text-sm mb-2">
                        {memeData.title}
                      </h5>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>r/{memeData.subreddit}</span>
                        <span>👍 {memeData.ups}</span>
                      </div>
                    </div>
                    <p className="text-xs text-center text-gray-500 italic">
                      Fresh meme delivered with admin love! 💖
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="profile_details" className="w-full">
        <TabsList className={`grid w-full gap-2 mb-6 ${
          user.role === 'buyer' ? 'grid-cols-2 md:grid-cols-4'
          : user.role === 'seller' ? 'grid-cols-3'
          : 'grid-cols-2'
        }`}>
          <TabsTrigger value="profile_details">
            <User className="h-4 w-4 mr-2" />
            Profile Details
          </TabsTrigger>
          {user.role === 'buyer' && (
            <TabsTrigger value="buyer_persona">
              <Target className="h-4 w-4 mr-2" />
              Buyer Persona
            </TabsTrigger>
          )}
          {user.role !== 'admin' && (
            <TabsTrigger value="onboarding_info">
              <FileText className="h-4 w-4 mr-2" />
              Onboarding
            </TabsTrigger>
          )}
          <TabsTrigger value="activity_history">
            <Activity className="h-4 w-4 mr-2" />
            {user.role === 'admin' ? 'Admin Activity' : 'Activity'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile_details" className="space-y-6">
          <Card>
              <CardHeader>
              <CardTitle className="text-lg">Complete Profile Information</CardTitle>
              <CardDescription>
                Comprehensive view of user's profile data
              </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <Section title="Basic Information">
                  <Row label="User ID"><span className="font-mono text-xs">{user.id}</span></Row>
                  <Row label="Full Name">{user.fullName}</Row>
                  <Row label="Email"><span className="break-all">{user.email}</span></Row>
                  <Row label="Phone">{user.phoneNumber || 'Not provided'}</Row>
                  <Row label="Country">{user.country || 'Not provided'}</Row>
                  <Row label="Role"><span className="capitalize">{user.role}</span></Row>
                </Section>

                <Section title="Account Status">
                  <Row label="Verification Status">
                    {user.role === 'admin' ? (
                      <Badge className="bg-purple-100 text-purple-700">Admin Account</Badge>
                    ) : (
                      <VerificationStatusBadge status={user.verificationStatus} />
                    )}
                  </Row>
                  <Row label="Email Verified">
                    <Badge variant={user.isEmailVerified ? "default" : "secondary"}>
                      {user.isEmailVerified ? "Yes" : "No"}
                    </Badge>
                  </Row>
                  <Row label="Created"><FormattedDate dateString={user.createdAt} /></Row>
                  <Row label="Last Updated"><FormattedDate dateString={user.updatedAt} /></Row>
                  {user.lastLogin && (
                    <Row label="Last Login"><FormattedDate dateString={user.lastLogin} /></Row>
                  )}
                </Section>
              </div>
                </CardContent>
           </Card>
        </TabsContent>

        {user.role === 'buyer' && (
          <TabsContent value="buyer_persona" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Buyer Persona Information</CardTitle>
                <CardDescription>
                  Investment preferences and buyer profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y border text-sm">
                  {user.buyerPersonaType && <Row label="Buyer Type">{user.buyerPersonaType}</Row>}
                  {user.buyerPersonaOther && <Row label="Other Buyer Type">{user.buyerPersonaOther}</Row>}
                  {user.investmentFocusDescription && <Row label="Investment Focus">{user.investmentFocusDescription}</Row>}
                  {user.preferredInvestmentSize && <Row label="Preferred Investment Size">{user.preferredInvestmentSize}</Row>}
                  {user.keyIndustriesOfInterest && <Row label="Industries of Interest">{user.keyIndustriesOfInterest}</Row>}
                  {!user.buyerPersonaType && !user.buyerPersonaOther && !user.investmentFocusDescription && !user.preferredInvestmentSize && !user.keyIndustriesOfInterest && (
                    <div className="px-3 py-2 text-muted-foreground">No buyer persona information provided.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="onboarding_info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Onboarding Information</CardTitle>
              <CardDescription>
                User's onboarding progress and submitted documents
              </CardDescription>
            </CardHeader>
                <CardContent className="space-y-6">
              <div className="divide-y border text-sm">
                <Row label="Onboarding Status">
                  <Badge variant={user.is_onboarding_completed ? "default" : "secondary"}>
                    {user.is_onboarding_completed ? "Completed" : "In Progress"}
                  </Badge>
                </Row>
                <Row label="Current Step">{user.onboarding_step_completed}</Row>
                {user.onboardingCompletedAt && (
                  <Row label="Completed At"><FormattedDate dateString={user.onboardingCompletedAt} /></Row>
                )}
              </div>
              {user.submittedDocuments && Object.keys(user.submittedDocuments).length > 0 && (
                <Section title="Submitted Documents">
                  {Object.entries(user.submittedDocuments).map(([key, value]) => (
                    <Row key={key} label={key}>{String(value)}</Row>
                  ))}
                </Section>
              )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="activity_history" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {user.role === 'admin' ? 'Administrative Activity' : 'Platform Activity Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.role === 'admin' ? (
                  <div className="divide-y border text-sm">
                    <Row label="Access Level"><Badge className="bg-purple-100 text-purple-700">System Administrator</Badge></Row>
                    <Row label="Admin Privileges"><Badge className="bg-green-100 text-green-700">Full Platform Control</Badge></Row>
                    <Row label="Data Access"><Badge className="bg-blue-100 text-blue-700">All Users & Analytics</Badge></Row>
                    <Row label="Management"><Badge className="bg-orange-100 text-orange-700">Verification & Content</Badge></Row>
                  </div>
                ) : (
                  <div className="divide-y border text-sm">
                    {user.role === 'seller' && <Row label="Total Listings"><Badge variant="outline">{user.listingCount}</Badge></Row>}
                    <Row label={user.role === 'buyer' ? 'Inquiries Sent' : 'Inquiries Received'}><Badge variant="outline">{user.inquiryCount}</Badge></Row>
                    <Row label="Conversations"><Badge variant="outline">{user.conversationCount}</Badge></Row>
                    <Row label="Verification Requests"><Badge variant="outline">{user.verificationRequestCount}</Badge></Row>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.role === 'admin' ? (
                  <>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/admin/analytics">
                        <Activity className="h-4 w-4 mr-2" />
                        View Analytics Dashboard
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/admin/users">
                        <Users2 className="h-4 w-4 mr-2" />
                        Manage All Users
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/admin/verification-queue/buyers">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Verification Queue
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    {user.role === 'seller' && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/admin/listings?sellerId=${user.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View User's Listings
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/admin/inquiries?userId=${user.id}`}>
                        <Activity className="h-4 w-4 mr-2" />
                        View Inquiries
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/admin/conversations?userId=${user.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Conversations
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Admin action dialogs */}
      <AdminLoginLinkDialog
        isOpen={isLoginLinkDialogOpen}
        onOpenChange={setIsLoginLinkDialogOpen}
        targetUser={user.role !== 'admin' ? {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        } : null}
      />
      <AdminSetPasswordDialog
        isOpen={isSetPasswordDialogOpen}
        onOpenChange={setIsSetPasswordDialogOpen}
        targetUser={user.role !== 'admin' ? {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        } : null}
      />
      <AdminDeleteUserDialog
        isOpen={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        block={deleteDialog.block}
        targetUser={user.role !== 'admin' ? {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        } : null}
        onDeleted={() => router.push('/admin/users')}
      />
      </div>
    </AdminPageShell>
  );
}

