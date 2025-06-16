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
import { useState, useTransition, Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";

const OTPSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be 6 digits." }).max(6, { message: "OTP must be 6 digits." }),
});

function VerifyOTPFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const type = searchParams.get("type");

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isResendPending, startResendTransition] = useTransition();
  const { toast } = useToast();

  // Security check: ensure required parameters are present
  if (!email || !type) {
    return (
      <AuthCardWrapper
        headerLabel="Invalid Verification Link"
        backButtonLabel="Go to Registration"
        backButtonHref="/auth/register"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Access</AlertTitle>
          <AlertDescription>
            This verification page requires an email and verification type.
            Please register or request a password reset to get a proper verification link.
          </AlertDescription>
        </Alert>
      </AuthCardWrapper>
    );
  }

  // Validate verification type
  if (type !== 'register' && type !== 'login' && type !== 'password-reset') {
    return (
      <AuthCardWrapper
        headerLabel="Invalid Verification Type"
        backButtonLabel="Go to Registration"
        backButtonHref="/auth/register"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Verification Type</AlertTitle>
          <AlertDescription>
            The verification type "{type}" is not supported. Please use a valid verification link.
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

    if (!email) {
      setError("Email is required for verification.");
      return;
    }

    startTransition(async () => {
      try {
        if (type === 'register') {
          // For registration, verify the email OTP
          await auth.verifyEmailOtp(email, values.otp);
          setSuccess("Email verified successfully! You can now log in.");
          toast({
            title: "Email Verified!",
            description: "Your account has been activated. Redirecting to login..."
          });
          setTimeout(() => router.push('/auth/login'), 2000);
        } else if (type === 'login') {
          // For login, this would be handled differently (not typical for Supabase)
          // Supabase typically handles login via direct email/password
          setError("Direct OTP login is not supported. Please use email and password login.");
        } else {
          setError("Invalid verification type.");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Verification failed';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: errorMessage
        });
      }
    });
  };

  const handleResendOTP = () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required to resend verification.");
      return;
    }

    startResendTransition(async () => {
      try {
        await auth.resendEmailVerification();
        toast({
          title: "Verification Email Resent",
          description: `A new verification email has been sent to ${email}.`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
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
      headerLabel={`A verification code has been sent to ${email || 'your email'}. Please enter it below to ${type === 'login' ? 'complete login' : 'verify your account'}.`}
      backButtonLabel={type === 'login' ? "Back to Login" : "Back to Registration"}
      backButtonHref={type === 'login' ? "/auth/login" : (email ? `/auth/register/buyer?email=${email}` : "/auth/register")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter 6-digit code"
                    disabled={isPending || isResendPending}
                    maxLength={6}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
             <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700">
               <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-700 dark:text-green-300">Success</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isPending || isResendPending}>
            {isPending ? "Verifying..." : "Verify Email"}
          </Button>
           <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={handleResendOTP}
            disabled={isPending || isResendPending}
          >
            {isResendPending ? "Sending..." : "Resend Verification Email"}
          </Button>
        </form>
      </Form>
    </AuthCardWrapper>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOTPFormContent />
    </Suspense>
  );
}
