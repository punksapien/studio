'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthCardWrapper } from "@/components/auth/auth-card-wrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerificationSuccessPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Email Verified!",
      description: "Your account has been successfully activated. Redirecting to login...",
    });

    const timer = setTimeout(() => {
      router.push('/auth/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, toast]);

  return (
    <AuthCardWrapper
      headerLabel="Email Verification Successful!"
      backButtonLabel="Go to Login Now"
      backButtonHref="/auth/login"
    >
      <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-700 dark:text-green-300">
          🎉 Verification Complete!
        </AlertTitle>
        <AlertDescription className="text-green-600 dark:text-green-400">
          Your email has been successfully verified. You can now log in to your account.
          <br />
          <br />
          <em>Redirecting to login page in a few seconds...</em>
        </AlertDescription>
      </Alert>
    </AuthCardWrapper>
  );
}
