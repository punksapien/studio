
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
import { AlertTriangle, CheckCircle2, Mail, KeyRound, Loader2, Info } from "lucide-react";
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
  const type = searchParams.get("type") || 'register'; // Default to 'register' if type is not present
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: {
      otp: "",
    },
  });
  
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl && email && (type === 'register' || type === 'email')) { 
      form.setValue('otp', tokenFromUrl.substring(0, 6)); 
    }
  }, [searchParams, email, type, form]); 

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

  const validTypes = ['register', 'login', 'password-reset', 'email_change', 'recovery', 'email']; 
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
    setSuccess("");
    setIsLoading(true);

    startTransition(async () => {
      try {
        const verificationTypeForSupabase = type === 'register' ? 'email' : type;

        await auth.verifyEmailOtp(email, values.otp); 
        setSuccess("Email verified successfully! Redirecting...");
        toast({
          title: "Email Verified!",
          description: "Your account has been activated. Redirecting to login..."
        });
        const nextUrl = searchParams.get("next") || '/auth/login';
        setTimeout(() => router.push(nextUrl), 2000);

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
      headerLabel="Verify Your Email"
      backButtonLabel={type === 'login' ? "Back to Login" : "Back to Registration"}
      backButtonHref={type === 'login' ? "/auth/login" : (email ? `/auth/register?email=${encodeURIComponent(email)}` : "/auth/register")}
    >
      <div className="space-y-6">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Check Your Inbox
          </h1>
          <p className="text-muted-foreground text-sm mb-1">
            We&apos;ve sent a verification email to:
          </p>
          <p className="font-medium text-primary mb-6">{email}</p>
        </div>

        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary/80" />
          <AlertTitle className="text-primary/90 font-medium">Two Ways to Verify!</AlertTitle>
          <AlertDescription className="text-sm text-primary/80">
            Your email contains a <strong>6-digit code</strong> to enter below, and a 
            <strong> one-click link</strong> to verify instantly.
            <br/>
            Can&apos;t find it? Check your spam/junk folder or resend the email.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Enter Verification Code</CardTitle>
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
                          className="text-center text-2xl tracking-[0.3em] h-14 font-mono border-2 border-input focus:border-primary"
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
          </CardContent>
        </Card>
        
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Didn&apos;t receive the email or need a new code?
          </p>
          <Button
            onClick={handleResendEmail}
            variant="outline"
            className="w-full"
            disabled={resendLoading}
          >
            {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resendLoading ? "Sending..." : "Resend Verification Email"}
          </Button>
        </div>

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
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/> Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
