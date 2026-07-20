'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { DashboardPageShell } from '@/components/shared/dashboard-page-shell';
import { VerificationStatusBadge } from '@/components/shared/verification-status-badge';

const VERIFICATION_DESCRIPTION = 'Your verification is handled by the Nobridge team.';

// Request statuses that mean the team is actively working a verification.
const OPEN_REQUEST_STATUSES = ['New Request', 'Contacted', 'Docs Under Review', 'More Info Requested'];

export default function SellerVerificationPage() {
  const searchParams = useSearchParams();
  // TEMPORARY DEV PREVIEW — dev-only state override (?preview_status=anonymous|pending_verification|verified|rejected)
  const previewStatus =
    process.env.NODE_ENV === 'development' ? searchParams.get('preview_status') : null;
  const [status, setStatus] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (previewStatus) {
      setStatus(previewStatus);
      setIsLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/verification/request');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load verification status (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (!active) return;
        setStatus(data.current_status ?? null);
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load verification status');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [previewStatus]);

  if (isLoading) {
    return (
      <DashboardPageShell title="Verification" description={VERIFICATION_DESCRIPTION} scrollable>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading verification status...</span>
        </div>
      </DashboardPageShell>
    );
  }

  if (error) {
    return (
      <DashboardPageShell title="Verification" description={VERIFICATION_DESCRIPTION} scrollable>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardPageShell>
    );
  }

  const hasOpenRequest = requests.some((r) => OPEN_REQUEST_STATUSES.includes(r?.status));
  const isVerified = status === 'verified';
  const isPending = status === 'pending_verification' || hasOpenRequest;

  return (
    <DashboardPageShell
      title="Verification"
      description={VERIFICATION_DESCRIPTION}
      scrollable
      actions={<VerificationStatusBadge status={status} />}
    >
      {isVerified ? (
        <Card className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-7 w-7" /> You&apos;re verified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-green-600 dark:text-green-400">
              Your seller profile has been verified by the Nobridge team. Your listings can now display full,
              verified business details to buyers.
            </p>
            <div className="bg-white/50 dark:bg-black/20 p-4">
              <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">What this unlocks:</h4>
              <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                <li>• A verified badge on your listings</li>
                <li>• Full business details shown to buyers</li>
                <li>• Higher visibility in search results</li>
                <li>• Direct buyer inquiries and messaging</li>
              </ul>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                <Link href="/seller-dashboard/listings">View My Listings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isPending ? (
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Clock className="h-7 w-7" /> Verification in progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-600 dark:text-blue-400">
              Our team is reviewing your verification. We&apos;ll contact you if we need anything further —
              there&apos;s nothing you need to do here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" /> Verification is handled by our team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Verification is handled by the Nobridge team — we&apos;ll contact you to complete it. You don&apos;t
              need to submit anything from here.
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardPageShell>
  );
}
