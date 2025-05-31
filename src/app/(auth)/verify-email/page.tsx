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
import { AlertTriangle, CheckCircle2, Mail, Key } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OTPSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be 6 digits." }).max(6, { message: "OTP must be 6 digits." }),
});

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const type = searchParams.get("type");

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isResendPending, startResendTransition] = useTransition();
  const [showOtpForm, setShowOtpForm] = useState(false);
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

  const handleResendEmail = () => {
    setError("");
    setSuccess("");

    startResendTransition(async () => {
      try {
        await auth.resendVerificationForEmail(email);
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
      headerLabel={`We've sent a verification email to ${email}`}
      backButtonLabel={type === 'login' ? "Back to Login" : "Back to Registration"}
      backButtonHref={type === 'login' ? "/auth/login" : "/auth/register"}
    >
      <div className="space-y-6">
        <Tabs defaultValue="magic-link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="magic-link">
              <Mail className="w-4 h-4 mr-2" />
              Magic Link
            </TabsTrigger>
            <TabsTrigger value="otp">
              <Key className="w-4 h-4 mr-2" />
              6-Digit Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="magic-link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  Check Your Email
                </CardTitle>
                <CardDescription>
                  We've sent a verification email with a magic link to <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Simply click the link in your email</strong> - no typing required!
                  </p>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>• Check your spam/junk folder if you don't see it</p>
                  <p>• The link will expire in 1 hour</p>
                  <p>• Having trouble? Use the 6-digit code option instead</p>
                </div>

                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                  disabled={isResendPending}
                >
                  {isResendPending ? "Sending..." : "Resend Email"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="otp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Key className="w-5 h-5 mr-2 text-green-600" />
                  Enter 6-Digit Code
                </CardTitle>
                <CardDescription>
                  If the magic link doesn't work, look for a 6-digit code in your email
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
                              className="text-center text-lg tracking-widest"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending ? "Verifying..." : "Verify Code"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
      </div>
    </AuthCardWrapper>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
