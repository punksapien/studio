
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, ShoppingCart, LogIn, UserPlus, ChevronDown, Briefcase, Search, HelpCircle, Info, Phone, BookOpen, Award, Users, DollarSign } from 'lucide-react';

// Placeholder for authentication state logic
const isAuthenticated = false; // Set to false to show Login/Register by default

const navLinks = [
  { href: "/marketplace", label: "Marketplace", icon: <ShoppingCart className="mr-2 h-4 w-4" /> },
  {
    label: "Sell Your Business",
    icon: <Briefcase className="mr-2 h-4 w-4" />,
    dropdown: true,
    items: [
      { href: "/seller-dashboard/listings/create", label: "List Your Business" },
      { href: "/how-selling-works", label: "How Selling Works" },
      { href: "/valuation-services", label: "Valuation Services [Future]" },
    ],
  },
  {
    label: "Buy a Business",
    icon: <Search className="mr-2 h-4 w-4" />,
    dropdown: true,
    items: [
      { href: "/marketplace", label: "Browse Listings" },
      { href: "/how-buying-works", label: "How Buying Works" },
      { href: "/buyer-resources", label: "Buyer Resources [Future]" },
    ],
  },
  { href: "/pricing", label: "Pricing", icon: <DollarSign className="mr-2 h-4 w-4" /> },
  {
    label: "Company",
    icon: <Users className="mr-2 h-4 w-4" />,
    dropdown: true,
    items: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
      { href: "/blog", label: "Blog [Future]" },
      { href: "/careers", label: "Careers [Future]" },
    ],
  },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
          {navLinks.map((link) =>
            link.dropdown ? (
              <DropdownMenu key={link.label}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-3 transition-colors hover:text-primary">
                    {link.icon && React.cloneElement(link.icon, { className: "mr-1 h-4 w-4"})}
                    {link.label}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {link.items?.map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" asChild key={link.label} className="px-3 transition-colors hover:text-primary">
                <Link href={link.href}>
                   {link.icon && React.cloneElement(link.icon, { className: "mr-1 h-4 w-4"})}
                  {link.label}
                </Link>
              </Button>
            )
          )}
        </nav>
        <div className="hidden md:flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {/* Add UserButton here if using Clerk later */}
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          )}
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6">
              <nav className="flex flex-col space-y-2 mt-8">
                {navLinks.map((link) =>
                  link.dropdown ? (
                    <div key={link.label} className="flex flex-col space-y-1">
                       <Button variant="ghost" className="text-lg font-medium justify-start px-2 py-3 w-full">
                        {link.icon && React.cloneElement(link.icon, { className: "mr-2 h-5 w-5"})}
                        {link.label}
                      </Button>
                      <div className="pl-6 flex flex-col space-y-1">
                        {link.items?.map((item) => (
                           <Button variant="ghost" asChild key={item.label} className="justify-start text-base font-normal px-2 py-2 text-muted-foreground hover:text-primary">
                            <Link href={item.href}>{item.label}</Link>
                           </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                     <Button variant="ghost" asChild key={link.label} className="text-lg font-medium justify-start px-2 py-3 w-full">
                       <Link href={link.href}>
                        {link.icon && React.cloneElement(link.icon, { className: "mr-2 h-5 w-5"})}
                        {link.label}
                      </Link>
                     </Button>
                  )
                )}
                <hr className="my-4"/>
                {isAuthenticated ? (
                  <>
                     <Button variant="ghost" asChild className="justify-start text-lg px-2 py-3">
                       <Link href="/dashboard">Dashboard</Link>
                     </Button>
                    {/* Placeholder for logout link */}
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start text-lg px-2 py-3">
                      <Link href="/auth/login"><LogIn className="mr-2 h-5 w-5" />Login</Link>
                    </Button>
                    <Button asChild className="justify-start text-lg px-2 py-3">
                      <Link href="/auth/register"><UserPlus className="mr-2 h-5 w-5" />Register</Link>
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

    