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
import { AlertTriangle, CheckCircle2, Mail, KeyRound, Loader2, ArrowRight } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    // Prefill OTP if provided in URL (for magic link auto-submit or testing)
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl && email && type === 'register') {
      form.setValue('otp', tokenFromUrl.substring(0, 6)); // Supabase OTPs are 6 digits
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
    setIsLoading(true);

    startTransition(async () => {
      try {
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
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleResendEmail = () => {
    setError("");
    setSuccess("");
    setResendLoading(true);

    startTransition(async () => {
      try {
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
      } finally {
        setResendLoading(false);
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-3xl font-bold text-primary-900 mb-4">
            Verify Your Email
          </h1>
          <p className="text-gray-600 mb-2">
            We've sent a verification email to:
          </p>
          <p className="font-semibold text-primary-700 mb-6 text-lg">{email}</p>
        </div>

        {/* Email Instructions Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-primary-800">
              <Mail className="w-5 h-5 mr-2" />
              📬 Check Your Email - Two Ways to Verify!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Method 1: OTP Code */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <KeyRound className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="font-semibold text-blue-800">Option 1: Enter Code</span>
                </div>
                <p className="text-sm text-blue-700">
                  Copy the <strong>6-digit code</strong> from the email and enter it below.
                </p>
              </div>

              {/* Method 2: Magic Link */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <ArrowRight className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-semibold text-green-800">Option 2: One Click</span>
                </div>
                <p className="text-sm text-green-700">
                  Or simply <strong>click the verification button</strong> in the email.
                </p>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              💡 <strong>Tip:</strong> Can't find the email? Check your spam/junk folder or try resending below.
            </div>
          </CardContent>
        </Card>

        {/* OTP Form */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Enter Your Verification Code
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Type the 6-digit code from your email
            </p>
          </div>

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
                        disabled={isLoading}
                        maxLength={6}
                        className="text-center text-lg tracking-[0.3em] h-12"
                        autoComplete="one-time-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Resend Option */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600 mb-3">
            Didn't receive the email?
          </p>
          <Button
            onClick={handleResendEmail}
            variant="outline"
            className="w-full"
            disabled={resendLoading}
          >
            {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resendLoading ? "Sending..." : "📤 Resend Verification Email"}
          </Button>
        </div>

        {/* Status Messages */}
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

