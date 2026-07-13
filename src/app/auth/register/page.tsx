import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, Briefcase } from 'lucide-react';
import { AuthPageGuard } from '@/components/auth/auth-page-guard';

export default function RegisterPage() {
  return (
    <AuthPageGuard>
      <div className="flex flex-col items-center space-y-8">
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl md:items-stretch">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"> {/* Added flex flex-col h-full */}
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Briefcase className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">I am a Seller</CardTitle>
              </div>
              <CardDescription>
                List your business for sale and connect with verified investors and buyers.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow"> {/* Added flex-grow */}
              <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-muted-foreground mb-6 text-left">
                <li>Get exposure to a target audience of strategic buyers and investors.</li>
                <li>Maintain anonymity until you are ready to sell.</li>
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
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <User className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">I am a Buyer</CardTitle>
              </div>
              <CardDescription>
                Discover investment opportunities and acquire businesses in Asia.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow"> {/* Added flex-grow */}
              <ul className="list-disc list-outside pl-5 space-y-1 text-sm text-muted-foreground mb-6 text-left">
                <li>Browse a curated list of businesses for sale and get updated with new listings.</li>
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
