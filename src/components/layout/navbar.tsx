
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, ChevronDown, FileText, Phone, Info, ShoppingCart, UserCircle, LogIn, UserPlus, LogOut, Search as SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { auth, type UserProfile } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/shared/logo';
import { NobridgeIcon, NobridgeIconType } from '@/components/ui/nobridge-icon';

interface NavLinkItem {
  href: string;
  label: string;
  icon?: React.ElementType;
  iconProps?: any; // For NobridgeIcon specific props
  isNobridgeIcon?: boolean;
}

interface NavLinkGroup {
  label: string;
  triggerIcon?: React.ElementType;
  triggerIconProps?: any;
  isNobridgeTriggerIcon?: boolean;
  items: NavLinkItem[];
}

const navLinks: (NavLinkItem | NavLinkGroup)[] = [
  {
    label: "Sell Your Business",
    isNobridgeTriggerIcon: true,
    triggerIcon: NobridgeIcon,
    triggerIconProps: { icon: 'business-listing' as NobridgeIconType, variant: 'blue' },
    items: [
      { href: "/seller-dashboard/listings/create", label: "List Your Business", icon: FileText },
      { href: "/how-selling-works", label: "How Selling Works", icon: Info },
    ],
  },
  {
    label: "Buy a Business",
    isNobridgeTriggerIcon: true,
    triggerIcon: NobridgeIcon,
    triggerIconProps: { icon: 'core-details' as NobridgeIconType, variant: 'blue' },
    items: [
      { href: "/marketplace", label: "Browse Listings", icon: ShoppingCart },
      { href: "/how-buying-works", label: "How Buying Works", icon: Info },
    ],
  },
  {
    label: "Company",
    isNobridgeTriggerIcon: true,
    triggerIcon: NobridgeIcon,
    triggerIconProps: { icon: 'growth' as NobridgeIconType, variant: 'blue' },
    items: [
      { href: "/about", label: "About Us", icon: Info },
      { href: "/contact", label: "Contact Us", icon: Phone },
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const user = await auth.getCurrentUser();
        if (user) {
          const profile = await auth.getCurrentUserProfile();
          setIsAuthenticated(true);
          setUserProfile(profile);
        } else {
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setIsAuthenticated(false);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();

    const { data: { subscription } } = auth.onAuthStateChange(async (_event, session) => { 
      if (session?.user) {
        const profile = await auth.getCurrentUserProfile();
        setIsAuthenticated(true);
        setUserProfile(profile);
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account."
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An error occurred"
      });
    }
  };

  const getUserInitials = (profile: UserProfile | null) => {
    if (!profile?.full_name) return 'U';
    return profile.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDashboardUrl = (profile: UserProfile | null) => {
    if (!profile) return '/dashboard'; 
    switch (profile.role) {
      case 'seller':
        return '/seller-dashboard';
      case 'buyer':
        return '/dashboard'; 
      case 'admin':
        return '/admin'; 
      default:
        return '/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-light-gray/60 bg-brand-white text-brand-dark-blue shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-x-6 lg:gap-x-8">
          <Logo size="xl" forceTheme="light" />
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((linkOrGroup) =>
              'items' in linkOrGroup ? (
                <DropdownMenu key={linkOrGroup.label}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="px-3 py-2 text-sm font-medium text-brand-dark-blue hover:bg-brand-light-gray/50 hover:text-brand-dark-blue/90 focus-visible:ring-brand-sky-blue">
                      {linkOrGroup.isNobridgeTriggerIcon && linkOrGroup.triggerIcon && React.createElement(linkOrGroup.triggerIcon, { ...(linkOrGroup.triggerIconProps || {}), size: "sm", className: "mr-1.5 opacity-80"})}
                      {!linkOrGroup.isNobridgeTriggerIcon && linkOrGroup.triggerIcon && React.createElement(linkOrGroup.triggerIcon, { className: "mr-1.5 h-4 w-4 opacity-80"})}
                      {linkOrGroup.label}
                      <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-brand-white text-brand-dark-blue border-brand-light-gray/80 shadow-lg rounded-md w-56">
                    {linkOrGroup.items.map((item) => (
                      <DropdownMenuItem key={item.label} asChild className="text-sm hover:bg-brand-light-gray focus:bg-brand-light-gray cursor-pointer">
                        <Link href={item.href} className="flex items-center text-brand-dark-blue hover:text-brand-dark-blue px-3 py-2">
                          {item.isNobridgeIcon && item.icon && React.createElement(item.icon, { ...(item.iconProps || {}), size:"sm", className: "mr-2 opacity-80"})}
                          {!item.isNobridgeIcon && item.icon && React.createElement(item.icon, { className: "mr-2 h-4 w-4 opacity-80"})}
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" asChild key={linkOrGroup.label} className={cn("px-3 py-2 text-sm font-medium text-brand-dark-blue hover:bg-brand-light-gray/50 hover:text-brand-dark-blue/90 focus-visible:ring-brand-sky-blue", pathname === linkOrGroup.href && "bg-brand-light-gray/70 font-semibold")}>
                  <Link href={linkOrGroup.href} className="flex items-center">
                     {linkOrGroup.isNobridgeIcon && linkOrGroup.icon && React.createElement(linkOrGroup.icon, { ...(linkOrGroup.iconProps || {}), size:"sm", className: "mr-1.5 opacity-80"})}
                     {!linkOrGroup.isNobridgeIcon && linkOrGroup.icon && React.createElement(linkOrGroup.icon, { className: "mr-1.5 h-4 w-4 opacity-80"})}
                    {linkOrGroup.label}
                  </Link>
                </Button>
              )
            )}
          </nav>
        </div>

        <div className="hidden md:flex items-center space-x-3">
          {!isLoading && (
            isAuthenticated ? (
            <>
              <Button variant="outline" asChild className="border-brand-dark-blue/30 text-brand-dark-blue hover:bg-brand-light-gray/50 hover:border-brand-dark-blue/50 py-2 px-4 font-medium text-sm">
                  <Link href={getDashboardUrl(userProfile)}>Dashboard</Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9 rounded-full bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 text-sm font-semibold">
                      {getUserInitials(userProfile)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-brand-white text-brand-dark-blue border-brand-light-gray/80 shadow-lg rounded-md w-56">
                    <div className="px-3 py-2 text-sm">
                      <div className="font-medium">{userProfile?.full_name || 'User'}</div>
                      <div className="text-brand-dark-blue/60 text-xs">{userProfile?.email}</div>
                      <div className="text-brand-dark-blue/60 text-xs capitalize">{userProfile?.role}</div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href={getDashboardUrl(userProfile)} className="flex items-center px-3 py-2">
                        <UserCircle className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-brand-dark-blue hover:bg-brand-light-gray/50 px-4 py-2 text-sm font-medium hover:text-brand-dark-blue/90">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 px-4 py-2 text-sm font-medium rounded-md">
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
            )
          )}
        </div>

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
                <Logo size="xl" forceTheme="light" />
              </div>
              <nav className="flex flex-col space-y-1 p-4">
                {navLinks.map((linkOrGroup) =>
                  'items' in linkOrGroup ? (
                    <div key={linkOrGroup.label} className="flex flex-col space-y-1">
                       <h4 className="text-base font-medium px-3 py-3 w-full text-brand-dark-blue flex items-center">
                        {linkOrGroup.isNobridgeTriggerIcon && linkOrGroup.triggerIcon && React.createElement(linkOrGroup.triggerIcon, { ...(linkOrGroup.triggerIconProps || {}), size:"sm", className: "mr-2 opacity-80"})}
                        {!linkOrGroup.isNobridgeTriggerIcon && linkOrGroup.triggerIcon && React.createElement(linkOrGroup.triggerIcon, { className: "mr-2 h-5 w-5 opacity-80"})}
                        {linkOrGroup.label}
                      </h4>
                      <div className="pl-4 flex flex-col space-y-1">
                        {linkOrGroup.items.map((item) => (
                          <SheetClose asChild key={item.label}>
                           <Button variant="ghost" asChild className={cn("justify-start text-base font-normal px-3 py-2 text-brand-dark-blue/80 hover:text-brand-dark-blue hover:bg-brand-light-gray", pathname === item.href && "bg-brand-light-gray font-medium")}>
                            <Link href={item.href} className="flex items-center">
                               {item.isNobridgeIcon && item.icon && React.createElement(item.icon, { ...(item.iconProps || {}), size:"sm", className: "mr-2 opacity-80"})}
                               {!item.isNobridgeIcon && item.icon && React.createElement(item.icon, { className: "mr-2 h-4 w-4 opacity-80"})}
                              {item.label}
                            </Link>
                           </Button>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <SheetClose asChild key={linkOrGroup.label}>
                     <Button variant="ghost" asChild className={cn("text-lg font-medium justify-start px-3 py-3 w-full text-brand-dark-blue hover:bg-brand-light-gray", pathname === linkOrGroup.href && "bg-brand-light-gray/70 font-semibold")}>
                       <Link href={linkOrGroup.href} className="flex items-center">
                        {linkOrGroup.isNobridgeIcon && linkOrGroup.icon && React.createElement(linkOrGroup.icon, { ...(linkOrGroup.iconProps || {}), size:"sm", className: "mr-2 opacity-80"})}
                        {!linkOrGroup.isNobridgeIcon && linkOrGroup.icon && React.createElement(linkOrGroup.icon, { className: "mr-2 h-5 w-5 opacity-80"})}
                        {linkOrGroup.label}
                      </Link>
                     </Button>
                    </SheetClose>
                  )
                )}
                <DropdownMenuSeparator className="my-4 bg-brand-light-gray/80"/>
                {!isLoading && (
                  isAuthenticated ? (
                  <>
                      <div className="px-3 py-2 text-sm border-b border-brand-light-gray/60 mb-2">
                        <div className="font-medium">{userProfile?.full_name || 'User'}</div>
                        <div className="text-brand-dark-blue/60 text-xs">{userProfile?.email}</div>
                        <div className="text-brand-dark-blue/60 text-xs capitalize">{userProfile?.role}</div>
                      </div>
                    <SheetClose asChild>
                     <Button variant="ghost" asChild className="justify-start text-lg px-3 py-3 text-brand-dark-blue hover:bg-brand-light-gray">
                         <Link href={getDashboardUrl(userProfile)} className="flex items-center"><UserCircle className="mr-2 h-5 w-5" />Dashboard</Link>
                     </Button>
                    </SheetClose>
                       <Button
                         variant="ghost"
                         onClick={handleLogout}
                         className="justify-start text-lg px-3 py-3 text-red-600 hover:bg-red-100 hover:text-red-700"
                       >
                        <LogOut className="mr-2 h-5 w-5" /> Logout
                     </Button>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                    <Button variant="ghost" asChild className="justify-start text-lg px-3 py-3 text-brand-dark-blue hover:bg-brand-light-gray">
                      <Link href="/auth/login" className="flex items-center"><LogIn className="mr-2 h-5 w-5" /> Login</Link>
                    </Button>
                    </SheetClose>
                    <SheetClose asChild>
                    <Button asChild className="justify-start text-lg px-3 py-3 bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                      <Link href="/auth/register" className="flex items-center"><UserPlus className="mr-2 h-5 w-5" /> Register</Link>
                    </Button>
                    </SheetClose>
                  </>
                  )
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
