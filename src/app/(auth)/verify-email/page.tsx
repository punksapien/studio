
'use client';

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
import { useState, useTransition, Suspense, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Mail, KeyRound, Loader2 } from "lucide-react"; // Changed Key to KeyRound
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OTPSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be 6 digits." }).max(6, { message: "OTP must be 6 digits." }),
});

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const type = searchParams.get("type") || 'register'; // Default to register if type is missing

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isResendPending, startResendTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    // Prefill OTP if provided in URL (for magic link auto-submit or testing)
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl && email && type === 'register') {
      form.setValue("otp", tokenFromUrl.substring(0, 6)); // Supabase OTPs are 6 digits
      // Optionally auto-submit if desired, or just prefill
      // form.handleSubmit(onSubmit)(); 
    }
  }, [searchParams, email, type]);


  // Security check: ensure email is present
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

  // Validate verification type
  const validTypes = ['register', 'login', 'password-reset', 'email_change', 'recovery'];
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

  const form = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = (values: z.infer<typeof OTPSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        // Supabase uses verifyOtp for email confirmation links as well (type: 'email')
        // and for OTPs sent to email.
        await auth.verifyEmailOtp(email, values.otp);
        setSuccess("Email verified successfully! Redirecting...");
        toast({
          title: "Email Verified!",
          description: "Your account has been activated. Redirecting to login..."
        });
        setTimeout(() => router.push('/auth/login'), 2000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Verification failed. The code may be invalid or expired.';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: errorMessage
        });
      }
    });
  };

  const handleResendEmail = () => {
    setError("");
    setSuccess("");

    startResendTransition(async () => {
      try {
        // This method resends the confirmation email for the currently signed-up user
        // If the user isn't "partially signed up" (i.e., email exists but not confirmed), this might need adjustment
        // For a generic resend to a specific email if it's in an unconfirmed state:
        await auth.resendVerificationForEmail(email); 
        toast({
          title: "Verification Email Resent",
          description: `A new verification email has been sent to ${email}. Please check your inbox and spam folder.`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to resend. Please ensure the email is correct or contact support.';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Resend Failed",
          description: errorMessage
        });
      }
    });
  };

  return (
    <AuthCardWrapper
      headerLabel={`Verify Your Email`}
      backButtonLabel={type === 'login' ? "Back to Login" : "Back to Registration"}
      backButtonHref={type === 'login' ? "/auth/login" : "/auth/register"}
    >
      <div className="space-y-6">
        <p className="text-center text-sm text-muted-foreground">
          We've sent a verification email to <strong className="text-foreground">{email}</strong>.
          It includes a magic link and a 6-digit code.
        </p>

        <Tabs defaultValue="magic-link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="magic-link">
              <Mail className="w-4 h-4 mr-2" />
              Use Magic Link
            </TabsTrigger>
            <TabsTrigger value="otp">
              <KeyRound className="w-4 h-4 mr-2" />
              Enter 6-Digit Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="magic-link" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-primary" />
                  Check Your Email Inbox
                </CardTitle>
                <CardDescription>
                  The easiest way to verify is by clicking the magic link in the email we sent.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary/90">
                    💡 <strong>Click the link in the email</strong> from Nobridge to instantly verify your account. No typing needed!
                  </p>
                </div>

                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                  <li>If you don't see the email, please check your spam or junk folder.</li>
                  <li>The verification link and code will expire in 1 hour.</li>
                  <li>Still having trouble? Try the 6-digit code option or resend the email.</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                  disabled={isResendPending}
                >
                  {isResendPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isResendPending ? "Sending..." : "Resend Verification Email"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="otp" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <KeyRound className="w-5 h-5 mr-2 text-primary" />
                  Enter 6-Digit Code
                </CardTitle>
                <CardDescription>
                  Alternatively, find the 6-digit code in the verification email and enter it below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="123456"
                              disabled={isPending}
                              maxLength={6}
                              className="text-center text-lg tracking-[0.3em] h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isPending ? "Verifying..." : "Verify Code"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="mt-6 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-700 dark:text-green-300">Success!</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </AuthCardWrapper>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading verification options...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

    