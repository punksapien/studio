'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
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
import { useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react"; // Removed CheckCircle2 as it's not used here
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");

    startTransition(async () => {
      console.log("Login values:", values);

      try {
        const result = await auth.signIn(values.email, values.password);

        toast({
          title: "Login Successful!",
          description: "Welcome back!"
        });

        // Determine redirect based on role after successful login
        const userProfile = await auth.getCurrentUserProfile();
        if (userProfile?.role === 'seller') {
            router.push('/seller-dashboard');
        } else if (userProfile?.role === 'buyer') {
            router.push('/dashboard');
        } else if (userProfile?.role === 'admin') {
             router.push('/admin');
        }
        else {
            router.push('/'); // Fallback
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorMessage
        });
      }
    });
  };

  return (
    <AuthPageGuard>
      <AuthCardWrapper
        headerLabel="Welcome back! Please login to your account."
        backButtonLabel="Don't have an account? Register here."
        backButtonHref="/auth/register"
        // showSocial prop is removed to hide the social login section
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="you@example.com"
                      type="email"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="********"
                      type="password"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                  <Button size="sm" variant="link" asChild className="px-0 font-normal">
                    <Link href="/auth/forgot-password">Forgot password?</Link>
                  </Button>
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
              {isPending ? "Processing..." : "Login"}
            </Button>
          </form>
        </Form>
      </AuthCardWrapper>
    </AuthPageGuard>
  );
}
