
'use client';

import * as React from 'react'; // Added this line
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ChevronDown, Briefcase, ShoppingCart, Building, FileText, Phone, Users, UserCircle, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

// Placeholder for authentication state logic - adjust as per your auth solution
const isAuthenticated = false; 

const NobridgeLogo = () => (
  <Link href="/" className="flex items-center gap-2 text-3xl font-bold text-brand-dark-blue hover:opacity-80 transition-opacity tracking-tight">
    Nobridge
  </Link>
);

interface NavLinkItem {
  href: string;
  label: string;
  icon?: React.ElementType; // Optional icon for the link itself
}

interface NavLinkGroup {
  label: string;
  triggerIcon?: React.ElementType; // Icon for the dropdown trigger
  items: NavLinkItem[];
}

const navLinks: (NavLinkItem | NavLinkGroup)[] = [
  { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
  {
    label: "Sell Your Business",
    triggerIcon: Briefcase,
    items: [
      { href: "/seller-dashboard/listings/create", label: "List Your Business" },
      { href: "/how-selling-works", label: "How Selling Works" },
      // { href: "/valuation-services", label: "Valuation Services [Future]" },
    ],
  },
  {
    label: "Buy a Business",
    triggerIcon: Building,
    items: [
      { href: "/marketplace", label: "Browse Listings" },
      { href: "/how-buying-works", label: "How Buying Works" },
      // { href: "/buyer-resources", label: "Buyer Resources [Future]" },
    ],
  },
  { href: "#pricing", label: "Pricing", icon: FileText }, // Placeholder link
  {
    label: "Company",
    triggerIcon: Users,
    items: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
      // { href: "/blog", label: "Blog [Future]" },
      // { href: "/careers", label: "Careers [Future]" },
    ],
  },
];


export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-light-gray/60 bg-brand-white text-brand-dark-blue shadow-sm">
      <div className="container flex h-20 items-center justify-between px-6 md:px-8">
        <NobridgeLogo />
        <nav className="hidden md:flex items-center space-x-1 text-sm">
          {navLinks.map((link) =>
            'items' in link ? ( // This is a NavLinkGroup
              <DropdownMenu key={link.label}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-3 py-2 text-base font-medium text-brand-dark-blue hover:bg-brand-light-gray/50 hover:text-brand-dark-blue focus-visible:ring-brand-dark-blue">
                    {link.triggerIcon && React.createElement(link.triggerIcon, { className: "mr-2 h-4 w-4"})}
                    {link.label}
                    <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-brand-white text-brand-dark-blue border-brand-light-gray/80 shadow-lg rounded-md w-56">
                  {link.items.map((item) => (
                    <DropdownMenuItem key={item.label} asChild className="text-sm hover:bg-brand-light-gray focus:bg-brand-light-gray cursor-pointer">
                      <Link href={item.href} className="flex items-center text-brand-dark-blue hover:text-brand-dark-blue px-3 py-2">
                        {item.icon && React.createElement(item.icon, { className: "mr-2 h-4 w-4"})}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : ( // This is a NavLinkItem
              <Button variant="ghost" asChild key={link.label} className={cn("px-3 py-2 text-base font-medium text-brand-dark-blue hover:bg-brand-light-gray/50 hover:text-brand-dark-blue focus-visible:ring-brand-dark-blue", pathname === link.href && "bg-brand-light-gray/70 font-semibold")}>
                <Link href={link.href} className="flex items-center">
                   {link.icon && React.createElement(link.icon, { className: "mr-1.5 h-4 w-4"})}
                  {link.label}
                </Link>
              </Button>
            )
          )}
        </nav>
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <Button variant="outline" asChild className="border-brand-dark-blue/30 text-brand-dark-blue hover:bg-brand-light-gray/50 hover:border-brand-dark-blue/50 py-2 px-4 font-medium">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {/* Placeholder for UserButton if Clerk or similar is used */}
              <div className="h-9 w-9 bg-brand-dark-blue rounded-full flex items-center justify-center text-brand-white text-sm font-semibold">
                U
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-brand-dark-blue hover:bg-brand-light-gray/50 px-4 py-2 text-sm font-medium">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 px-4 py-2 text-sm font-medium rounded-md">
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          )}
        </div>
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-brand-dark-blue hover:bg-brand-light-gray/50">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 bg-brand-white text-brand-dark-blue">
              <div className="p-6 border-b border-brand-light-gray">
                <NobridgeLogo />
              </div>
              <nav className="flex flex-col space-y-1 p-4">
                {navLinks.map((link) =>
                  'items' in link ? ( // NavLinkGroup
                    <div key={link.label} className="flex flex-col space-y-1">
                       <Button variant="ghost" className="text-lg font-medium justify-start px-3 py-3 w-full text-brand-dark-blue hover:bg-brand-light-gray">
                        {link.triggerIcon && React.createElement(link.triggerIcon, { className: "mr-2 h-5 w-5"})}
                        {link.label}
                      </Button>
                      <div className="pl-8 flex flex-col space-y-1">
                        {link.items.map((item) => (
                           <Button variant="ghost" asChild key={item.label} className="justify-start text-base font-normal px-3 py-2 text-brand-dark-blue/80 hover:text-brand-dark-blue hover:bg-brand-light-gray">
                            <Link href={item.href}>
                               {item.icon && React.createElement(item.icon, { className: "mr-2 h-4 w-4"})}
                              {item.label}
                            </Link>
                           </Button>
                        ))}
                      </div>
                    </div>
                  ) : ( // NavLinkItem
                     <Button variant="ghost" asChild key={link.label} className={cn("text-lg font-medium justify-start px-3 py-3 w-full text-brand-dark-blue hover:bg-brand-light-gray", pathname === link.href && "bg-brand-light-gray/70 font-semibold")}>
                       <Link href={link.href} className="flex items-center">
                        {link.icon && React.createElement(link.icon, { className: "mr-2 h-5 w-5"})}
                        {link.label}
                      </Link>
                     </Button>
                  )
                )}
                <DropdownMenuSeparator className="my-4 bg-brand-light-gray/80"/>
                {isAuthenticated ? (
                  <>
                     <Button variant="ghost" asChild className="justify-start text-lg px-3 py-3 text-brand-dark-blue hover:bg-brand-light-gray">
                       <Link href="/dashboard" className="flex items-center"><UserCircle className="mr-2 h-5 w-5" />Dashboard</Link>
                     </Button>
                     <Button variant="ghost" className="justify-start text-lg px-3 py-3 text-red-600 hover:bg-red-100 hover:text-red-700">
                        <LogIn className="mr-2 h-5 w-5" /> Logout
                     </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start text-lg px-3 py-3 text-brand-dark-blue hover:bg-brand-light-gray">
                      <Link href="/auth/login" className="flex items-center"><LogIn className="mr-2 h-5 w-5" /> Login</Link>
                    </Button>
                    <Button asChild className="justify-start text-lg px-3 py-3 bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                      <Link href="/auth/register" className="flex items-center"><UserPlus className="mr-2 h-5 w-5" /> Register</Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
