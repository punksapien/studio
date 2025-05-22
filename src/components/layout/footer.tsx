
import Link from 'next/link';
import { Briefcase } from 'lucide-react'; // Using Briefcase for generic Nobridge logo

const NobridgeLogoFooter = () => (
  <Link href="/" className="flex items-center gap-2 text-xl font-bold text-brand-light-gray hover:opacity-80 transition-opacity">
    <Briefcase className="h-6 w-6" />
    <span>Nobridge</span>
  </Link>
);

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark-blue text-brand-light-gray/80">
      <div className="container mx-auto py-16 md:py-20 px-6 md:px-8">
        <div className="grid gap-10 row-gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-5"> {/* Adjusted to 5 columns for better balance */}
          <div className="sm:col-span-2 lg:col-span-1"> {/* Logo takes 1 full col on lg */}
            <NobridgeLogoFooter />
            <p className="mt-4 text-sm ">
              Connecting SME owners with investors and buyers across Asia. Your trusted partner for business transitions.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-base font-semibold tracking-wide text-brand-white">
              Sell Your Business
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/seller-dashboard/listings/create" className="hover:text-brand-white transition-colors duration-300">
                List Your Business
              </Link>
              <Link href="/how-selling-works" className="hover:text-brand-white transition-colors duration-300">
                How Selling Works
              </Link>
              <Link href="/seller-faq" className="hover:text-brand-white transition-colors duration-300">
                Seller FAQ <span className="text-xs opacity-70">[Future]</span>
              </Link>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-base font-semibold tracking-wide text-brand-white">
              Buy a Business
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/marketplace" className="hover:text-brand-white transition-colors duration-300">
                Browse Listings
              </Link>
              <Link href="/how-buying-works" className="hover:text-brand-white transition-colors duration-300">
                How Buying Works
              </Link>
              <Link href="/buyer-faq" className="hover:text-brand-white transition-colors duration-300">
                Buyer FAQ <span className="text-xs opacity-70">[Future]</span>
              </Link>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="text-base font-semibold tracking-wide text-brand-white">
              Company
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/about" className="hover:text-brand-white transition-colors duration-300">
                About Us
              </Link>
              <Link href="/contact" className="hover:text-brand-white transition-colors duration-300">
                Contact Us
              </Link>
              <Link href="/blog" className="hover:text-brand-white transition-colors duration-300">
                Blog <span className="text-xs opacity-70">[Future]</span>
              </Link>
              <Link href="/careers" className="hover:text-brand-white transition-colors duration-300">
                Careers <span className="text-xs opacity-70">[Future]</span>
              </Link>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-base font-semibold tracking-wide text-brand-white">
              Legal
            </p>
            <div className="flex flex-col space-y-2">
               <Link href="/terms" className="hover:text-brand-white transition-colors duration-300">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-brand-white transition-colors duration-300">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-light-gray/20 pt-8 flex flex-col-reverse justify-between items-center sm:flex-row">
          <p className="text-sm">
            © {currentYear} Nobridge. All rights reserved.
          </p>
          {/* Optional: Social media icons 
          <div className="flex items-center space-x-4">
            <Link href="#" className="hover:text-brand-white"><Twitter className="h-5 w-5" /></Link>
            <Link href="#" className="hover:text-brand-white"><Linkedin className="h-5 w-5" /></Link>
            <Link href="#" className="hover:text-brand-white"><Facebook className="h-5 w-5" /></Link>
          </div>
          */}
        </div>
      </div>
    </footer>
  );
}

    