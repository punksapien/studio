'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
import { AuthPageGuard } from "@/components/auth/auth-page-guard";
import { CommonRegistrationFields } from "@/components/auth/common-registration-fields";
import { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, type RegisterData } from "@/lib/auth";

const SellerRegisterSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  initialCompanyName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function SellerRegisterPage() {
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof SellerRegisterSchema>>({
    resolver: zodResolver(SellerRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      country: "",
      initialCompanyName: "",
    },
  });

  const onSubmit = (values: z.infer<typeof SellerRegisterSchema>) => {
    setError("");

    startTransition(async () => {
      console.log("Seller Register values:", values);

      try {
        const registerData: RegisterData = {
          email: values.email,
          password: values.password,
          full_name: values.fullName,
          phone_number: values.phoneNumber,
          country: values.country,
          role: 'seller',
          initial_company_name: values.initialCompanyName || undefined,
        };

        const result = await auth.signUp(registerData);

        // Handle existing user attempting to register
        if (result.error === 'USER_EXISTS_LOGIN_FAILED') {
          setError("This email is already registered but the password is incorrect.");
          toast({
            variant: "destructive",
            title: "Account Exists",
            description: (
              <div className="space-y-2">
                <p>This email is already registered.</p>
                <p className="text-sm">Try logging in or reset your password if you've forgotten it.</p>
              </div>
            ) as any,
            action: (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push('/auth/login')}>
                  Go to Login
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push('/auth/forgot-password')}>
                  Reset Password
                </Button>
              </div>
            ) as any
          });
          return;
        }

        // Handle successful auto-login for existing users
        if (result.session) {
          toast({
            title: "Welcome Back!",
            description: "You've been automatically logged in with your existing account."
          });
          router.push('/seller-dashboard?login_success=true');
          return;
        }

        // Handle new registration needing email verification
        if (result.user && result.needsVerification) {
          toast({
            title: "Almost There!",
            description: "Please check your email to verify your account."
          });
          // Include the verification token in the redirect URL if available
          const verifyEmailUrl = new URL(`/verify-email`, window.location.origin);
          verifyEmailUrl.searchParams.set('email', values.email);
          verifyEmailUrl.searchParams.set('type', 'register');
          verifyEmailUrl.searchParams.set('from', 'register');

          // Add the secure verification token if provided
          if (result.verificationToken) {
            verifyEmailUrl.searchParams.set('token', result.verificationToken);
          }

          router.push(verifyEmailUrl.toString());
          return;
        }

        // Handle other errors
        setError(result.error || "Registration failed. Please try again.");
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.error || "Something went wrong. Please try again."
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during registration.';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: errorMessage
        });
      }
    });
  };

  return (
    <AuthPageGuard>
      <AuthCardWrapper
        headerLabel="Create your Seller account to list your business."
        backButtonLabel="Already have an account? Login here."
        backButtonHref="/auth/login"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CommonRegistrationFields control={form.control} isPending={isPending} />
            <FormField
              control={form.control}
              name="initialCompanyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Company Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My Awesome Business" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Processing..." : "Register as Seller"}
            </Button>
          </form>
        </Form>
      </AuthCardWrapper>
    </AuthPageGuard>
  );
}
