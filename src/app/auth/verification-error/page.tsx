'use client';

import { AuthCardWrapper } from "@/components/auth/auth-card-wrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function VerificationErrorPage() {
  const router = useRouter();

  return (
    <AuthCardWrapper
      headerLabel="Email Verification Failed"
      backButtonLabel="Back to Registration"
      backButtonHref="/auth/register"
    >
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Verification Link Invalid or Expired</AlertTitle>
          <AlertDescription>
            The verification link you clicked is either invalid or has expired.
            This can happen if:
            <br />
            <br />
            • The link is older than 1 hour
            <br />
            • You've already used this link
            <br />
            • The link was corrupted in your email client
          </AlertDescription>
        </Alert>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No worries! You can request a new verification email or try entering the 6-digit code manually.
          </p>

          <div className="flex flex-col space-y-2">
            <Button
              onClick={() => router.push('/auth/register')}
              className="w-full"
            >
              Register Again
            </Button>

            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
              className="w-full"
            >
              Try Logging In
            </Button>
          </div>
        </div>
      </div>
    </AuthCardWrapper>
  );
}
