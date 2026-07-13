'use client';

import * as React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminLoginLinkDialog } from '@/components/admin/admin-login-link-dialog';
import { AdminSetPasswordDialog } from '@/components/admin/admin-set-password-dialog';
import { AdminDeleteUserDialog } from '@/components/admin/admin-delete-user-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Activity, AlertCircle, Ban, Crown, Eye, Key, KeyRound, Loader2, RefreshCw,
  ShieldAlert, ShieldCheck, Trash2, UserCircle,
} from 'lucide-react';

interface UserDetail {
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
  onboarding_step_completed: number;
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
  listingCount: number;
  inquiryCount: number;
}

interface UserDetailResponse {
  user: UserDetail;
  metadata: { fetchedAt: string; source: string };
}

interface UserDetailsDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the user is deleted so the parent can refresh its list */
  onUserDeleted?: () => void;
}

const fetcher = async (url: string): Promise<UserDetailResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load user (${res.status})`);
  return res.json();
};

function formatDate(dateString?: string | null) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function VerificationBadge({ status }: { status: string }) {
  switch (status) {
    case 'verified':
      return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>;
    case 'pending_verification':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300"><ShieldAlert className="h-3 w-3 mr-1" /> Pending</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline" className="capitalize">{status?.replace(/_/g, ' ') || 'Unknown'}</Badge>;
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right break-words">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
      <div className="divide-y border text-sm">{children}</div>
    </div>
  );
}

export function UserDetailsDialog({ userId, open, onOpenChange, onUserDeleted }: UserDetailsDialogProps) {
  const { toast } = useToast();
  const [isLoginLinkDialogOpen, setIsLoginLinkDialogOpen] = React.useState(false);
  const [isSetPasswordDialogOpen, setIsSetPasswordDialogOpen] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; block: boolean }>({ open: false, block: false });

  const { data, error, isLoading, mutate } = useSWR<UserDetailResponse>(
    open && userId ? `/api/admin/users/${userId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const user = data?.user;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-4xl bg-card text-card-foreground">
          {isLoading && (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">Loading full profile...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
              <p className="mb-4 text-sm text-destructive">{(error as Error).message}</p>
              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
            </div>
          )}

          {user && !isLoading && (
            <>
              <DialogHeader className="border-b px-6 pb-4 pt-7 md:pt-8">
                <DialogTitle className="flex items-center text-xl font-semibold">
                  <UserCircle className="mr-2 h-6 w-6 text-accent" />
                  {user.fullName}
                </DialogTitle>
                <DialogDescription className="sr-only">Full user profile</DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                <Section title="Tags">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    {user.role === 'admin' && (
                      <Badge className="bg-purple-500 text-white"><Crown className="mr-1 h-3 w-3" />Platform Admin</Badge>
                    )}
                  </div>
                </Section>

                {user.role !== 'admin' && (
                  <Section title="User Settings">
                    <div className="flex flex-wrap items-center gap-2 px-3 py-2">
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
                  </Section>
                )}

                <Section title="Verification Status">
                  <div className="flex items-center justify-between gap-4 px-3 py-2">
                    <VerificationBadge status={user.verificationStatus} />
                    {user.role !== 'admin' && (
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild title="View verification">
                        <Link href={`/admin/verification-queue/${user.role === 'buyer' ? 'buyers' : 'sellers'}?userId=${user.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View verification</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </Section>

                <Section title="Contact Information">
                  <Row label="Email">
                    <span className="inline-flex flex-wrap items-center justify-end gap-2">
                      {user.email}
                      {user.isEmailVerified
                        ? <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Confirmed</Badge>
                        : <Badge variant="secondary">Unconfirmed</Badge>}
                    </span>
                  </Row>
                  <Row label="Phone">{user.phoneNumber || 'Not provided'}</Row>
                  <Row label="Country">{user.country || 'Not provided'}</Row>
                </Section>

                <Section title="Account">
                  <Row label="User ID"><span className="font-mono text-xs">{user.id}</span></Row>
                  <Row label="Registered">{formatDate(user.createdAt)}</Row>
                  <Row label="Last Updated">{formatDate(user.updatedAt)}</Row>
                  {user.lastLogin && <Row label="Last Login">{formatDate(user.lastLogin)}</Row>}
                </Section>

                {user.role !== 'admin' && (
                  <Section title="Platform Activity">
                    <Row label="Onboarding">
                      {user.is_onboarding_completed
                        ? <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Completed</Badge>
                        : <span>Step {user.onboarding_step_completed}</span>}
                    </Row>
                    {user.role === 'seller' && (
                      <Row label="Listings">
                        <span className="inline-flex items-center justify-end gap-2">
                          {user.listingCount}
                          <Button variant="outline" size="icon" className="h-7 w-7" asChild title="View listings">
                            <Link href={`/admin/listings?sellerId=${user.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View listings</span>
                            </Link>
                          </Button>
                        </span>
                      </Row>
                    )}
                    <Row label="Inquiries">
                      <span className="inline-flex items-center justify-end gap-2">
                        {user.inquiryCount}
                        <Button variant="outline" size="icon" className="h-7 w-7" asChild title="View inquiries">
                          <Link href={`/admin/inquiries?userId=${user.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View inquiries</span>
                          </Link>
                        </Button>
                      </span>
                    </Row>
                    {user.role === 'seller' && user.initialCompanyName && (
                      <Row label="Company">{user.initialCompanyName}</Row>
                    )}
                  </Section>
                )}

                {user.role === 'buyer' && (user.buyerPersonaType || user.investmentFocusDescription || user.preferredInvestmentSize || user.keyIndustriesOfInterest) && (
                  <Section title="Buyer Persona">
                    {user.buyerPersonaType && <Row label="Buyer Type">{user.buyerPersonaType}</Row>}
                    {user.buyerPersonaOther && <Row label="Other Type">{user.buyerPersonaOther}</Row>}
                    {user.investmentFocusDescription && <Row label="Investment Focus">{user.investmentFocusDescription}</Row>}
                    {user.preferredInvestmentSize && <Row label="Investment Size">{user.preferredInvestmentSize}</Row>}
                    {user.keyIndustriesOfInterest && <Row label="Industries">{user.keyIndustriesOfInterest}</Row>}
                  </Section>
                )}

                {user.role === 'admin' && (
                  <Section title="Admin Status">
                    <Row label="Access Level"><Badge className="bg-purple-100 text-purple-700">System Administrator</Badge></Row>
                    <Row label="Privileges">Full platform control</Row>
                  </Section>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t p-4 px-6">
                <span className="text-xs text-muted-foreground">
                  <Activity className="mr-1 inline h-3 w-3" />
                  Fetched {formatDate(data?.metadata?.fetchedAt)}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    title="Refresh"
                    onClick={() => { mutate(); toast({ title: 'Data Refreshed', description: 'User information has been updated.' }); }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                  <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {user && (
        <>
          <AdminLoginLinkDialog
            isOpen={isLoginLinkDialogOpen}
            onOpenChange={setIsLoginLinkDialogOpen}
            targetUser={user.role !== 'admin' ? {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              role: user.role,
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
            onDeleted={() => {
              onOpenChange(false);
              onUserDeleted?.();
            }}
          />
        </>
      )}
    </>
  );
}
