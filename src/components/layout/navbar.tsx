import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Briefcase, Users, LogIn, UserPlus } from 'lucide-react';

// Placeholder for actual user session
const user = null; 

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-primary">
            Marketplace
          </Link>
          {/* Placeholder links, can be actual pages or sections */}
          <Link href="/#how-it-works-sellers" className="transition-colors hover:text-primary">
            For Sellers
          </Link>
          <Link href="/#how-it-works-buyers" className="transition-colors hover:text-primary">
            For Buyers
          </Link>
          <Link href="/about" className="transition-colors hover:text-primary">
            About Us
          </Link>
        </nav>
        <div className="hidden md:flex items-center space-x-2">
          {user ? (
            <Button variant="ghost">Dashboard</Button> // Placeholder for UserNav
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
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8">
                <Link href="/" className="text-lg font-medium transition-colors hover:text-primary">
                  Marketplace
                </Link>
                <Link href="/#how-it-works-sellers" className="text-lg font-medium transition-colors hover:text-primary">
                  For Sellers
                </Link>
                <Link href="/#how-it-works-buyers" className="text-lg font-medium transition-colors hover:text-primary">
                  For Buyers
                </Link>
                <Link href="/about" className="text-lg font-medium transition-colors hover:text-primary">
                  About Us
                </Link>
                <hr/>
                {user ? (
                   <Link href="/dashboard" className="text-lg font-medium transition-colors hover:text-primary">
                     Dashboard
                   </Link>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start text-lg">
                      <Link href="/auth/login"><LogIn className="mr-2 h-5 w-5" />Login</Link>
                    </Button>
                    <Button asChild className="justify-start text-lg">
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
