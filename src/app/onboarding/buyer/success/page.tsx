
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle2, LayoutDashboard, Search, Mail, FileCheck, Send, Loader2, Info, ArrowRight } from 'lucide-react'; // Added ArrowRight
import { useCurrentUser, updateOnboardingStatus, sendVerificationRequestEmail } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';

export default function BuyerOnboardingSuccessPage() {
  const [buyerName, setBuyerName] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEmailSending, setIsEmailSending] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const { profile, loading } = useCurrentUser();
  const { toast } = useToast();

  React.useEffect(() => {
    const ensureOnboardingComplete = async () => {
      if (loading) return;

      try {
        if (profile && !profile.is_onboarding_completed) {
          await updateOnboardingStatus({
            complete_onboarding: true
          });
        }

        if (typeof window !== 'undefined') {
          const savedDataRaw = sessionStorage.getItem('buyerOnboardingData');
          if (savedDataRaw) {
            sessionStorage.removeItem('buyerOnboardingData');
          }
          setBuyerName(profile?.full_name || 'Buyer');
        } else {
            setBuyerName(profile?.full_name || 'Buyer');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error ensuring onboarding completion:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was an issue completing your onboarding. Please contact support."
        });
        setIsLoading(false);
      }
    };

    ensureOnboardingComplete();
  }, [profile, loading, toast]);

  const handleSendVerificationEmail = async () => {
    setIsEmailSending(true);
    try {
      await sendVerificationRequestEmail();
      setEmailSent(true);
      toast({
        title: "Verification Email Sent!",
        description: "We've sent you an email with verification details and a priority request link.",
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast({
        variant: "destructive",
        title: "Email Send Failed",
        description: error instanceof Error ? error.message : "Failed to send verification email. Please try again."
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center p-6 md:p-8">
        <CardHeader className="pb-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-6" />
          <CardTitle className="text-2xl md:text-3xl font-semibold text-brand-dark-blue mb-2 font-heading">
            Thank You, {buyerName || 'Buyer'}!
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Your buyer verification information has been successfully submitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <FileCheck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">What's Next?</h3>
            </div>
            <p className="text-blue-800 dark:text-blue-200 mb-4 text-sm">
              Our team will review your verification documents. This typically takes <strong>1-2 business days</strong>.
              Once approved, you'll gain access to:
            </p>
            <ul className="text-left text-blue-700 dark:text-blue-300 space-y-1.5 text-sm">
              <li className="flex items-center"><Info className="h-4 w-4 mr-2 flex-shrink-0"/>Detailed business information and financials</li>
              <li className="flex items-center"><Info className="h-4 w-4 mr-2 flex-shrink-0"/>Direct communication with verified sellers (post admin facilitation)</li>
              <li className="flex items-center"><Info className="h-4 w-4 mr-2 flex-shrink-0"/>Enhanced platform features for buyers</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="h-6 w-6 text-green-600 dark:text-green-300" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">Expedite Your Verification (Optional)</h3>
            </div>
            <p className="text-green-800 dark:text-green-200 mb-4 text-sm">
              Want our team to review your request faster? We can send you an email with priority verification options and direct admin contact.
            </p>
            <div className="text-center">
              <Button
                onClick={handleSendVerificationEmail}
                disabled={isEmailSending || emailSent}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isEmailSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {emailSent ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                {emailSent ? 'Verification Details Sent!' : isEmailSending ? 'Sending Email...' : 'Request Priority Review'}
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            While your verification is processing, you can explore anonymous business listings on our marketplace.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button asChild size="lg" className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-5 w-5" /> Go to My Dashboard
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/marketplace">
                <Search className="mr-2 h-5 w-5" /> Browse Marketplace
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
