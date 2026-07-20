'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthCardWrapper } from "@/components/auth/auth-card-wrapper";
import { useState, useTransition, Suspense, useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Mail, KeyRound, Loader2, Info } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OTPSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be 6 digits." }).max(6, { message: "OTP must be 6 digits." }),
});

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || '';
  const type = searchParams.get("type") || 'register';
  const pkceError = searchParams.get("error") === 'pkce_failed';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const { toast } = useToast();
  const hasAutoSent = useRef(false); // Prevent multiple auto-sends
  // Redirect if already verified
  const redirectTo = searchParams.get("redirectTo") || "/";

  // Countdown timer for rate limiting
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCountdown(rateLimitCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitCountdown]);

  const form = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Removed auto-fill behavior for security - users must manually enter their verification code

  // Automatically send verification email when user arrives at page (for unverified redirects)
  const autoSend = searchParams.get("auto_send") === "true";

  useEffect(() => {
    // Only auto-send if explicitly requested and we haven't already sent
    if (autoSend && email && !hasAutoSent.current && !resendLoading) {
      hasAutoSent.current = true; // Mark as attempted immediately to prevent race conditions

      console.log('[AUTO-SEND] Initiating automatic verification email for:', email);

      setError("");
      setResendLoading(true);

      // Use startTransition for better UX during auto-send
      startTransition(async () => {
        try {
          console.log('[AUTO-SEND] Calling resend verification API...');

          const response = await fetch('/api/email/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          const result = await response.json();
          console.log('[AUTO-SEND] API response:', {
            status: response.status,
            success: result.success,
            debugInfo: result.debugInfo
          });

          if (!response.ok) {
            // Handle rate limiting specifically
            if (response.status === 429 && result.type === 'rate_limited') {
              const waitTime = result.cooldownSeconds || 20;
              console.log(`[AUTO-SEND] Rate limited, user must wait ${waitTime} seconds`);

              setError(`Please wait ${waitTime} seconds before requesting another verification email.`);
              toast({
                variant: "destructive",
                title: "Rate Limited",
                description: `Please wait ${waitTime} seconds before requesting another verification email.`,
              });
              return;
            }

            throw new Error(result.error || 'Failed to send verification email');
          }

          console.log('[AUTO-SEND] Success! Email sent successfully');
          toast({
            title: "Verification Email Sent",
            description: `A verification email has been sent to ${email}. Please check your inbox and spam folder.`,
          });

          // Show success message without setting success state (to avoid UI confusion)
          console.log('[AUTO-SEND] Auto-send completed successfully');

        } catch (error) {
          console.error('[AUTO-SEND] Error occurred:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email. Please try the resend button.';

          setError(errorMessage);
          toast({
            variant: "destructive",
            title: "Auto-Send Failed",
            description: errorMessage
          });

          // Reset the auto-send flag on error so user can try manual resend
          hasAutoSent.current = false;
        } finally {
          setResendLoading(false);
          console.log('[AUTO-SEND] Auto-send process completed');
        }
      });
    }
  }, [email, autoSend, resendLoading]); // Correct dependency array with primitive values

  useEffect(() => {
    (async () => {
      try {
        const profile = await auth.getCurrentUserProfile();
        if (profile?.is_email_verified) {
          console.log("[VERIFY-EMAIL] User already verified, redirecting to:", redirectTo);
          router.replace(redirectTo);
        }
      } catch (e) {
        console.error("[VERIFY-EMAIL] Error checking verification status:", e);
      }
    })();
  }, []);

  if (!email) {
    return (
      <AuthCardWrapper
        headerLabel="Invalid Verification Link"
        backButtonLabel="Go to Registration"
        backButtonHref="/auth/register"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email Missing</AlertTitle>
          <AlertDescription>
            An email address is required for verification. Please try the registration or password reset process again.
          </AlertDescription>
        </Alert>
      </AuthCardWrapper>
    );
  }

  const validTypes = ['register', 'login', 'password-reset', 'email_change', 'recovery', 'email', 'resend'];
  if (!validTypes.includes(type)) {
    return (
      <AuthCardWrapper
        headerLabel="Invalid Verification Type"
        backButtonLabel="Go to Registration"
        backButtonHref="/auth/register"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Type</AlertTitle>
          <AlertDescription>
            The verification type "{type}" is not supported. Please use a valid link.
          </AlertDescription>
        </Alert>
      </AuthCardWrapper>
    );
  }

  const onSubmit = (values: z.infer<typeof OTPSchema>) => {
    setError("");
    setIsLoading(true);

    startTransition(async () => {
      try {
        const verificationTypeForSupabase = type === 'register' ? 'email' : type;

        console.log('[EMAIL-VERIFICATION] Starting OTP verification for:', email, 'Type:', type);

        const result = await auth.verifyEmailOtp(email, values.otp, type === 'register' ? 'register' : 'email_change');

        console.log('[EMAIL-VERIFICATION] OTP verification result:', {
          hasUser: !!result.user,
          hasSession: !!result.session,
          userId: result.user?.id,
          userEmail: result.user?.email
        });

        if (result.user) {
          toast({
            title: "Email Verified!",
            description: "Your email has been successfully verified."
          });

          // CRITICAL: Wait a moment for session to fully establish before fetching profile
          console.log('[EMAIL-VERIFICATION] Waiting for session to establish before profile fetch...');
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

          // Fetch profile to determine role for redirect
          console.log('[EMAIL-VERIFICATION] Fetching user profile after session establishment...');
          let profile = await auth.getCurrentUserProfile();

          console.log('[EMAIL-VERIFICATION] Profile fetch result:', {
            hasProfile: !!profile,
            role: profile?.role,
            isEmailVerified: profile?.is_email_verified,
            profileId: profile?.id
          });

          let redirectUrl = '/'; // Default redirect

          // Handle different scenarios based on profile availability
          if (!profile) {
            console.warn('[EMAIL-VERIFICATION] No profile found after verification - this should not happen');
            // Fallback: try to refresh and get profile again
            console.log('[EMAIL-VERIFICATION] Attempting profile recovery...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Additional wait
            const retryProfile = await auth.getCurrentUserProfile();

            if (!retryProfile) {
              console.error('[EMAIL-VERIFICATION] Profile recovery failed - redirecting to registration');
              setError('Profile not found after verification. Please try registering again.');
              redirectUrl = '/auth/register';
            } else {
              console.log('[EMAIL-VERIFICATION] Profile recovery successful:', retryProfile.role);
              profile = retryProfile; // Use recovered profile
            }
          }

          if (profile) {
            console.log('[EMAIL-VERIFICATION] Determining redirect for role:', profile.role);

            if (profile.role === 'admin') {
              redirectUrl = '/admin';
              console.log('[EMAIL-VERIFICATION] Admin verified - redirecting to admin dashboard');
            } else if (profile.role === 'seller' || profile.role === 'buyer') {
              if (!profile.is_onboarding_completed) {
                // Fresh sign-up: enter the (skippable) profile wizard at their next step
                const nextStep = (profile.onboarding_step_completed || 0) + 1;
                redirectUrl = `/onboarding/${profile.role}/${nextStep}`;
                console.log(`[EMAIL-VERIFICATION] ${profile.role} verified - entering onboarding step ${nextStep}`);
              } else {
                redirectUrl = profile.role === 'seller' ? '/seller-dashboard' : '/dashboard';
                console.log(`[EMAIL-VERIFICATION] ${profile.role} verified - redirecting to dashboard`);
              }
            } else {
              console.warn('[EMAIL-VERIFICATION] Unknown role:', profile.role, '- redirecting to home');
              redirectUrl = '/';
            }
          }

          // Allow override redirect if 'next' parameter is present
          const nextQueryParam = searchParams.get("next");
          if (nextQueryParam) {
            console.log('[EMAIL-VERIFICATION] Override redirect detected:', nextQueryParam);
            redirectUrl = nextQueryParam;
          }

          console.log('[EMAIL-VERIFICATION] Final redirect URL:', redirectUrl);
          console.log('[EMAIL-VERIFICATION] Redirecting in 2 seconds to ensure session persistence...');

          // Slightly longer delay to ensure session is fully persisted
          setTimeout(() => {
            console.log('[EMAIL-VERIFICATION] Executing redirect to:', redirectUrl);
            router.push(redirectUrl);
          }, 2000); // Increased from 1500ms to 2000ms

        } else {
          throw new Error('Verification succeeded but no user session was created');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Verification failed. The code may be invalid or expired.';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: errorMessage
        });
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleResendEmail = () => {
    console.log('[MANUAL-RESEND] User clicked resend button for:', email);

    setError("");
    setResendLoading(true);

    startTransition(async () => {
      try {
        console.log('[MANUAL-RESEND] Calling resend verification API...');

        const response = await fetch('/api/email/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const result = await response.json();
        console.log('[MANUAL-RESEND] API response:', {
          status: response.status,
          success: result.success,
          debugInfo: result.debugInfo
        });

        if (!response.ok) {
          // Handle rate limiting with specific user feedback
          if (response.status === 429 && result.type === 'rate_limited') {
            const waitTime = result.cooldownSeconds || 20;
            const resetTime = result.resetTimeFormatted || 'shortly';

            console.log(`[MANUAL-RESEND] Rate limited, user must wait ${waitTime} seconds (reset at ${resetTime})`);

            // Start the countdown timer
            setRateLimitCountdown(waitTime);

            const rateLimitMessage = `You can request another verification email in ${waitTime} seconds (at ${resetTime}).`;
            setError(rateLimitMessage);
            toast({
              variant: "destructive",
              title: "Please Wait",
              description: rateLimitMessage,
            });
            return;
          }

          throw new Error(result.error || 'Failed to resend verification email');
        }

        console.log('[MANUAL-RESEND] Success! Email sent successfully');

        // Show success toast
        toast({
          title: "Email Sent!",
          description: `A new verification email has been sent to ${email}. Please check your inbox and spam folder.`,
        });

      } catch (error) {
        console.error('[MANUAL-RESEND] Error occurred:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to resend. Please ensure the email is correct or contact support.';

        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Resend Failed",
          description: errorMessage
        });
      } finally {
        setResendLoading(false);
        console.log('[MANUAL-RESEND] Manual resend process completed');
      }
    });
  };

  return (
    <AuthCardWrapper
      hideLogo
      backButtonLabel={
        type === 'login' ? "Back to Login" :
        type === 'resend' ? "Try Login Instead" :
        "Back to Registration"
      }
      backButtonHref={
        type === 'login' ? "/auth/login" :
        type === 'resend' ? "/auth/login" :
        (email ? `/auth/register?email=${encodeURIComponent(email)}` : "/auth/register")
      }
    >
      <div className="space-y-4">
        <div className="text-center">
          <Mail className="mx-auto h-8 w-8 text-primary mb-2" />
          <h1 className="text-xl font-semibold text-foreground mb-1">Verify your email address</h1>
          <p className="text-sm text-muted-foreground">
            Check your inbox, we have sent a verification email to{' '}
            <span className="font-medium text-primary">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground italic mt-1">Please check your spam folder as well.</p>
        </div>

        <Alert className="bg-primary/5 border-primary/20 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2">
          <Info className="h-4 w-4 text-primary/80" />
          <AlertDescription className="text-sm text-primary/80">
            The email contains a <span className="font-semibold">6-digit code</span> to enter below, or there is a{' '}
            <span className="font-semibold">one-click link</span> that you can use to verify instantly.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-center">Enter Verification Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="123456"
                          disabled={isLoading || isPending}
                          maxLength={6}
                          className="text-center text-2xl tracking-[0.3em] h-12 font-mono border border-input focus:border-primary"
                          autoComplete="one-time-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11" disabled={isLoading || isPending}>
                  {(isLoading || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {(isLoading || isPending) ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
            </Form>

            <div className="border-t mt-4 pt-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn&apos;t receive the email or need a new code?
              </p>
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
                disabled={resendLoading || rateLimitCountdown > 0}
              >
                {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {resendLoading ? "Sending..." :
                 rateLimitCountdown > 0 ? `Wait ${rateLimitCountdown}s` :
                 "Resend Verification Email"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Special alert for PKCE errors */}
        {pkceError && (
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Magic Link Issue</AlertTitle>
            <AlertDescription className="text-amber-700">
              The magic link verification encountered a technical issue. Please use the 6-digit verification code from your email instead.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AuthCardWrapper>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/> Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
