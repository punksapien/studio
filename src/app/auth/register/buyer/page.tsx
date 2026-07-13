'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AuthCardWrapper } from "@/components/auth/auth-card-wrapper";
import { AuthPageGuard } from "@/components/auth/auth-page-guard";
import { RegistrationCredentialsFields } from "@/components/auth/registration-credentials-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, type RegisterData } from "@/lib/auth";

const BuyerRegisterSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export default function BuyerRegisterPage() {
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof BuyerRegisterSchema>>({
    resolver: zodResolver(BuyerRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof BuyerRegisterSchema>) => {
    setError("");

    startTransition(async () => {
      try {
        const registerData: RegisterData = {
          email: values.email,
          password: values.password,
          role: 'buyer',
        };

        const result = await auth.signUp(registerData);

        if (result.error === 'USER_EXISTS_LOGIN_FAILED') {
          setError("This email is already registered. The password you entered was incorrect. Please try logging in or reset your password.");
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "This account already exists. Please check your password or use the 'Forgot Password' link to reset it."
          });
          return; // Stop execution
        }

        if (result.user) {
           toast({
            title: "Registration Successful!",
            description: "Please check your email to verify your account."
          });
          const verifyEmailUrl = new URL(`/verify-email`, window.location.origin);
          verifyEmailUrl.searchParams.set('email', values.email);
          verifyEmailUrl.searchParams.set('type', 'register');
          verifyEmailUrl.searchParams.set('from', 'register');

          router.push(verifyEmailUrl.toString());
        } else {
          setError(result.error || "An unknown error occurred during registration.");
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: result.error || "Something went wrong. Please try again."
          });
        }

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
        headerLabel="Create your Buyer account to discover opportunities."
        backButtonLabel="Already have an account? Login here."
        backButtonHref="/auth/login"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <RegistrationCredentialsFields control={form.control} isPending={isPending} />

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
               {isPending ? "Processing..." : "Register as Buyer"}
            </Button>
          </form>
        </Form>
      </AuthCardWrapper>
    </AuthPageGuard>
  );
}
