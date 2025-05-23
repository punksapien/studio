
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
import { useState, useTransition, Suspense } from "react"; // Added Suspense
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

const OTPSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be 6 digits." }).max(6, { message: "OTP must be 6 digits." }),
});

function VerifyOTPFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const type = searchParams.get("type"); // 'register' or 'login'

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isResendPending, startResendTransition] = useTransition();

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
      console.log("Verify OTP values:", { ...values, email, type });
      // Placeholder for actual OTP verification server action
      // This would call something like /api/auth/verify-otp
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (values.otp === "000000") { // Simulate incorrect OTP
        setError("Invalid or expired OTP. Please try again or request a new one.");
      } else { // Simulate correct OTP
        if (type === 'register') {
          setSuccess("Account verified successfully! Redirecting to login...");
          setTimeout(() => router.push('/auth/login'), 2000);
        } else if (type === 'login') {
          setSuccess("Login successful! Redirecting to dashboard...");
          // TODO: Determine redirect based on user role from actual auth response
          setTimeout(() => router.push('/dashboard'), 2000); 
        } else {
          setSuccess("OTP verified successfully!");
        }
      }
    });
  };

  const handleResendOTP = () => {
    setError("");
    setSuccess("");
    startResendTransition(async () => {
      console.log("Resend OTP for:", email);
      // Placeholder for actual resend OTP server action
      // This would call something like /api/auth/send-otp
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "OTP Resent",
        description: `A new OTP has been sent to ${email}.`,
      });
    });
  };
  
  const { toast } = useToast(); // Moved useToast here as it's client-side

  return (
    <AuthCardWrapper
      headerLabel={`An OTP has been sent to ${email || 'your email'}. Please enter it below to ${type === 'login' ? 'complete login' : 'verify your account'}.`}
      backButtonLabel={type === 'login' ? "Back to Login" : "Back to Registration"}
      backButtonHref={type === 'login' ? "/auth/login" : (email ? `/auth/register/buyer?email=${email}` : "/auth/register")} // A bit generic, might need refinement
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One-Time Password (OTP)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Enter 6-digit OTP" 
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
            {isPending ? "Verifying..." : "Verify OTP"}
          </Button>
           <Button 
            type="button" 
            variant="link" 
            className="w-full" 
            onClick={handleResendOTP}
            disabled={isPending || isResendPending}
          >
            {isResendPending ? "Sending..." : "Resend OTP"}
          </Button>
        </form>
      </Form>
    </AuthCardWrapper>
  );
}


export default function VerifyOTPPage() {
  return (
    // Suspense is required by Next.js when using useSearchParams in a page.
    <Suspense fallback={<div>Loading...</div>}> 
      <VerifyOTPFormContent />
    </Suspense>
  );
}

    