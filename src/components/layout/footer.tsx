
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Linkedin } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const isMarketplace = pathname === '/marketplace' || pathname.startsWith('/listings/');

  return (
    <footer className={`bg-brand-dark-blue text-brand-light-gray/80${isMarketplace ? '' : ' section-lines-light'}`}>
      <div className="container mx-auto py-12">
        <div className="flex flex-col lg:flex-row mb-8">
          {/* Logo + description */}
          <div className="lg:w-1/3 p-6 sm:p-8 md:p-10 border border-white/15">
            <Logo size="2xl" forceTheme="dark" />
            <div className="border-t border-white/15 mt-4 mb-4" />
            <p className="text-sm">
              Empowering growth and exits through M&A. We partner with buyers and sellers to move deals from ambition to completion.
            </p>
            <div className="mt-5 space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-white/40" />
                <div>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-brand-white/90">ID</span>
                    <span className="h-3.5 w-px bg-white/30" aria-hidden="true" />
                    <span>PT VAV Technologies Indonesia</span>
                  </p>
                  <p className="mt-0.5 text-brand-light-gray/60">
                    Kota Kasablanka Lantai 22, Jakarta 12870, Republic of Indonesia
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-white/40" />
                <div>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-brand-white/90">US</span>
                    <span className="h-3.5 w-px bg-white/30" aria-hidden="true" />
                    <span>Nobridge LLC</span>
                  </p>
                  <p className="mt-0.5 text-brand-light-gray/60">
                    30 N Gold St, Sheridan, Wyoming 82801, United States of America
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Nav columns in a 4-col grid */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4">
            <div className="border border-white/15 border-t-0 lg:border-t lg:border-l-0 p-4 sm:p-6 lg:p-8 text-sm space-y-3">
              <p className="text-base font-medium tracking-wide text-brand-white">
                Sell Your Business
              </p>
              <div className="flex flex-col space-y-2">
                <Link href="/how-selling-works" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> Sell Your Business
                </Link>
                <Link href="/seller-services" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> Services for sellers
                </Link>
                <Link href="/how-selling-works" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> How Selling Works
                </Link>
              </div>
            </div>

            <div className="border border-white/15 border-t-0 border-l-0 lg:border-t p-4 sm:p-6 lg:p-8 text-sm space-y-3">
              <p className="text-base font-medium tracking-wide text-brand-white">
                Buy a Business
              </p>
              <div className="flex flex-col space-y-2">
                <Link href="/marketplace" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> Browse Listings
                </Link>
                <Link href="/buyer-services" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> Services for buyers
                </Link>
                <Link href="/how-buying-works" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> How Buying Works
                </Link>
              </div>
            </div>

            <div className="border border-white/15 border-t-0 lg:border-t lg:border-l-0 p-4 sm:p-6 lg:p-8 text-sm space-y-3">
              <p className="text-base font-medium tracking-wide text-brand-white">
                Company
              </p>
              <div className="flex flex-col space-y-2">
                <Link href="/about" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> About Us
                </Link>
                <Link href="/contact" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> Contact Us
                </Link>
                <Link href="/faq" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> FAQ
                </Link>
                <Link href="/acfi-certificate" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> ACFI Certificate
                </Link>
                <Link href="/resources" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> Resources
                </Link>
              </div>
            </div>

            <div className="border border-white/15 border-t-0 border-l-0 lg:border-t p-4 sm:p-6 lg:p-8 text-sm space-y-3">
              <p className="text-base font-medium tracking-wide text-brand-white">
                Legal
              </p>
              <div className="flex flex-col space-y-2">
                <Link href="/terms" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> Terms of Service
                </Link>
                <Link href="/privacy" className="flex items-center gap-2 hover:text-brand-white transition-colors duration-300">
                  <span className="text-white/40 text-[5px] shrink-0">&#x25CF;</span> Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-light-gray/20 pt-8 flex flex-row justify-between items-center">
          <p className="text-sm">
            © {currentYear} Nobridge LLC. All rights reserved.
          </p>
          <a
            href="https://www.linkedin.com/company/nobridgeco"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nobridge on LinkedIn"
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/40 text-brand-white hover:bg-white/10 transition-colors duration-300 ml-4"
          >
            <Linkedin className="h-4 w-4" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}
