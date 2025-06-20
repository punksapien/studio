'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIcon, ArrowRight } from 'lucide-react';

export default function AdminImpersonatePage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect after a short delay
    const timer = setTimeout(() => {
      router.replace('/admin/users');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRedirect = () => {
    router.replace('/admin/users');
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <InfoIcon className="h-5 w-5 text-blue-500" />
            Feature Moved
          </CardTitle>
          <CardDescription>
            The admin impersonation feature has been updated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Admin impersonation is now available directly from the user management page.
              You'll be redirected automatically in a few seconds.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              To impersonate a user:
            </p>
            <ol className="text-xs text-gray-500 space-y-1 text-left">
              <li>1. Go to Admin → User Management</li>
              <li>2. Find the user you want to impersonate</li>
              <li>3. Click the "Impersonate" button</li>
            </ol>
          </div>

          <Button
            onClick={handleRedirect}
            className="w-full"
          >
            Go to User Management
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
