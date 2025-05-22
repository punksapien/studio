
import Link from 'next/link';
import { Logo } from '@/components/shared/logo';

export function Footer() {
  return (
    <footer className="border-t bg-secondary/50 text-secondary-foreground">
      <div className="container py-12 md:py-16 px-4 md:px-6">
        <div className="grid gap-10 row-gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <Logo size="lg" />
            <p className="mt-3 text-sm text-muted-foreground">
              Connecting SME owners with investors and buyers across Asia. Your trusted partner for business transitions.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-base font-bold tracking-wide text-foreground">
              Sell Your Business
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/seller-dashboard/listings/create" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                List Your Business
              </Link>
              <Link href="/how-selling-works" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                How Selling Works
              </Link>
              <Link href="/seller-faq" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Seller FAQ [Future]
              </Link>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-base font-bold tracking-wide text-foreground">
              Buy a Business
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/marketplace" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Browse Listings
              </Link>
              <Link href="/how-buying-works" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                How Buying Works
              </Link>
              <Link href="/buyer-faq" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Buyer FAQ [Future]
              </Link>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="text-base font-bold tracking-wide text-foreground">
              Platform
            </p>
            <div className="flex flex-col space-y-2">
               <Link href="/marketplace" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Marketplace
              </Link>
              <Link href="/auth/login" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Login
              </Link>
              <Link href="/auth/register" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Register
              </Link>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-base font-bold tracking-wide text-foreground">
              Company
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/about" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                About Us
              </Link>
              <Link href="/contact" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Contact Us
              </Link>
              <Link href="/blog" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Blog [Future]
              </Link>
              <Link href="/careers" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Careers [Future]
              </Link>
               <Link href="/terms" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-muted-foreground transition-colors duration-300 hover:text-primary">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-8 flex flex-col-reverse justify-between items-center sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BizMatch Asia. All rights reserved.
          </p>
          {/* Optional: Social media icons 
          <div className="flex items-center space-x-4">
            <Link href="#" className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></Link>
            <Link href="#" className="text-muted-foreground hover:text-primary"><Linkedin className="h-5 w-5" /></Link>
            <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>
          </div>
          */}
        </div>
      </div>
    </footer>
  );
}

    