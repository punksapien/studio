
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ShoppingCart, LogIn, UserPlus } from 'lucide-react';
// Removed Clerk imports

export function Navbar() {
  // Placeholder for future authentication state logic
  const isAuthenticated = false; 

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/marketplace" className="transition-colors hover:text-primary flex items-center">
            <ShoppingCart className="mr-2 h-4 w-4" /> Marketplace
          </Link>
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
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {/* Placeholder for UserButton or similar component */}
              {/* <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">U</div> */}
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
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8">
                <Link href="/marketplace" className="text-lg font-medium transition-colors hover:text-primary flex items-center">
                 <ShoppingCart className="mr-2 h-5 w-5" /> Marketplace
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
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="text-lg font-medium transition-colors hover:text-primary">
                     Dashboard
                    </Link>
                    {/* Placeholder for UserButton or logout link */}
                    {/* <Button variant="ghost" className="justify-start text-lg">Logout</Button> */}
                  </>
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
