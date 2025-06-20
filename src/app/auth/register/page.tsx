import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, Briefcase } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { AuthPageGuard } from '@/components/auth/auth-page-guard';

export default function RegisterPage() {
  return (
    <AuthPageGuard>
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
              {/* Logo in AuthCardWrapper will handle its theme based on wrapper context */}
              {/* This direct Logo call is for the main register choice page, which is inside (auth) layout (light bg) */}
              <Logo size="2xl" forceTheme="light"/>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Join Nobridge</h1>
          <p className="text-muted-foreground mt-2">
            Connect with business opportunities across Asia. Choose your role to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl md:items-stretch"> {/* Added md:items-stretch */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"> {/* Added flex flex-col h-full */}
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">I am a Seller</CardTitle>
              </div>
              <CardDescription>
                List your business for sale and connect with verified investors and buyers.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow"> {/* Added flex-grow */}
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-6">
                <li>Reach a targeted audience of Asian market investors.</li>
                <li>Maintain anonymity until you are ready.</li>
                <li>Access support through our verification process.</li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto"> {/* Added mt-auto to push footer down */}
              <Button asChild className="w-full">
                <Link href="/auth/register/seller">
                  Register as a Seller <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"> {/* Added flex flex-col h-full */}
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <User className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">I am a Buyer</CardTitle>
              </div>
              <CardDescription>
                Discover investment opportunities and acquire businesses in Asia.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow"> {/* Added flex-grow */}
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-6">
                <li>Browse a curated list of businesses for sale.</li>
                <li>View detailed information on verified listings.</li>
                <li>Connect with sellers through a secure platform.</li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto"> {/* Added mt-auto to push footer down */}
              <Button asChild className="w-full">
                <Link href="/auth/register/buyer">
                  Register as a Buyer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
         <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </AuthPageGuard>
  );
}
