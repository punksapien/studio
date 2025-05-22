
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, ShoppingCart, Briefcase, Search, Info, Phone, UserCircle, ChevronDown, Landmark, Newspaper, BriefcaseBusiness, CircleDollarSign, Users } from 'lucide-react';

// Placeholder for authentication state logic
const isAuthenticated = false; // Set to false to show Login/Register by default

const navLinks = [
  { href: "/marketplace", label: "Marketplace", icon: Search },
  {
    label: "Sell Your Business",
    icon: BriefcaseBusiness,
    dropdown: true,
    items: [
      { href: "/seller-dashboard/listings/create", label: "List Your Business" },
      { href: "/how-selling-works", label: "How Selling Works" },
      { href: "/valuation-services", label: "Valuation Services [Future]" },
    ],
  },
  {
    label: "Buy a Business",
    icon: CircleDollarSign,
    dropdown: true,
    items: [
      { href: "/marketplace", label: "Browse Listings" },
      { href: "/how-buying-works", label: "How Buying Works" },
      { href: "/buyer-resources", label: "Buyer Resources [Future]" },
    ],
  },
  { href: "/pricing", label: "Pricing", icon: CircleDollarSign },
  {
    label: "Company",
    icon: Landmark,
    dropdown: true,
    items: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
      { href: "/blog", label: "Blog [Future]" },
      { href: "/careers", label: "Careers [Future]" },
    ],
  },
];

// Simple text logo for Nobridge
const NobridgeLogo = () => (
  <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity tracking-tight">
    Nobridge
  </Link>
);


export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card text-card-foreground shadow-sm"> {/* Use card for light bg */}
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <NobridgeLogo />
        <nav className="hidden md:flex items-center space-x-1 text-sm">
          {navLinks.map((link) =>
            link.dropdown ? (
              <DropdownMenu key={link.label}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground">
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.label}
                    <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover text-popover-foreground">
                  {link.items?.map((item) => (
                    <DropdownMenuItem key={item.label} asChild className="hover:bg-accent focus:bg-accent">
                      <Link href={item.href} className="text-popover-foreground hover:text-accent-foreground">
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" asChild key={link.label} className="px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground">
                <Link href={link.href}>
                  <link.icon className="mr-2 h-4 w-4" />
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
              {/* UserButton would go here if using Clerk and authenticated */}
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-foreground hover:bg-accent hover:text-accent-foreground">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          )}
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6 bg-card text-card-foreground">
              <nav className="flex flex-col space-y-2 mt-8">
                {navLinks.map((link) =>
                  link.dropdown ? (
                    <div key={link.label} className="flex flex-col space-y-1">
                       <Button variant="ghost" className="text-lg font-medium justify-start px-2 py-3 w-full text-card-foreground hover:bg-accent hover:text-accent-foreground">
                        <link.icon className="mr-2 h-5 w-5" />
                        {link.label}
                      </Button>
                      <div className="pl-6 flex flex-col space-y-1">
                        {link.items?.map((item) => (
                           <Button variant="ghost" asChild key={item.label} className="justify-start text-base font-normal px-2 py-2 text-muted-foreground hover:text-accent-foreground hover:bg-accent">
                            <Link href={item.href}>{item.label}</Link>
                           </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                     <Button variant="ghost" asChild key={link.label} className="text-lg font-medium justify-start px-2 py-3 w-full text-card-foreground hover:bg-accent hover:text-accent-foreground">
                       <Link href={link.href}>
                        <link.icon className="mr-2 h-5 w-5" />
                        {link.label}
                      </Link>
                     </Button>
                  )
                )}
                <hr className="my-4 border-border"/>
                {isAuthenticated ? (
                  <>
                     <Button variant="ghost" asChild className="justify-start text-lg px-2 py-3 text-card-foreground hover:bg-accent hover:text-accent-foreground">
                       <Link href="/dashboard">Dashboard</Link>
                     </Button>
                    {/* Placeholder for logout link */}
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start text-lg px-2 py-3 text-card-foreground hover:bg-accent hover:text-accent-foreground">
                      <Link href="/auth/login">Login</Link>
                    </Button>
                    <Button asChild className="justify-start text-lg px-2 py-3 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link href="/auth/register">Register</Link>
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

    