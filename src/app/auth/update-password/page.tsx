'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useSearchParams, redirect } from "next/navigation";
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
import { useState, useTransition, useEffect, Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";

const UpdatePasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

function UpdatePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [tokenVerified, setTokenVerified] = useState(false); // To control form visibility

  useEffect(() => {
    // Supabase JS client automatically handles the token from URL fragment
    // when onAuthStateChange or getSession is called.
    // We just need to check if a session exists which indicates token validity for reset.
    const checkSession = async () => {
      const { data: { session } } = await auth.getCurrentUserAndSession(); // Or just auth.getCurrentUser()
      if (session) {
        setTokenVerified(true);
      } else {
        // No valid session or token in URL, redirect or show error
        setError("Invalid or expired password reset link. Please request a new one.");
        toast({
          variant: "destructive",
          title: "Invalid Link",
          description: "The password reset link is invalid or has expired.",
        });
        // Optionally redirect after a delay
        // setTimeout(() => router.push('/auth/forgot-password'), 3000);
      }
    };
    checkSession();
  }, [router, toast]);


  const form = useForm<z.infer<typeof UpdatePasswordSchema>>({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof UpdatePasswordSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        await auth.updatePassword(values.newPassword);
        setSuccess("Your password has been successfully updated! You can now log in with your new password.");
        toast({
          title: "Password Updated!",
          description: "Redirecting to login page...",
        });
        setTimeout(() => router.push('/auth/login'), 3000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update password.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: errorMessage,
        });
      }
    });
  };
  
  if (!tokenVerified && !error) {
    return (
      <AuthCardWrapper
        headerLabel="Verifying reset link..."
        backButtonLabel="Request new link"
        backButtonHref="/auth/forgot-password"
      >
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Verifying...</p>
        </div>
      </AuthCardWrapper>
    );
  }


  return (
    <AuthCardWrapper
      headerLabel="Set Your New Password"
      backButtonLabel="Back to Login"
      backButtonHref="/auth/login"
    >
      {tokenVerified && !success && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="********" 
                      type="password"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="********" 
                      type="password"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Form>
      )}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
         <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700 mt-4">
           <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-700 dark:text-green-300">Password Updated!</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
        </Alert>
      )}
    </AuthCardWrapper>
  );
}


export default function UpdatePasswordPage() {
  return (
    // Suspense is good practice for pages using useSearchParams
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <UpdatePasswordContent />
    </Suspense>
  );
}

// Add a simple helper to auth.ts or use directly for getSession:
// In auth.ts:
// async getCurrentUserAndSession() {
//   return supabase.auth.getSession();
// },
// For now, I'll assume auth.getCurrentUser() or similar gets user if session exists.
// Supabase docs show `onAuthStateChange` for handling URL fragments directly on the client page.
// So the tokenVerified logic should correctly reflect if the token from the URL hash was valid.
