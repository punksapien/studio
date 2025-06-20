'use client';

import * as React from "react";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Star, CheckCircle, Search as SearchIconLucide, MapPin, Briefcase, ListChecks, DollarSign, ShieldCheck, FileText, MessageSquare, Info, Phone, Home, ExternalLink, Users2 as UsersIcon, Images as ImagesIcon, Banknote, BookOpen, Brain, HandCoins, Globe, Link as LinkIconLucide, ArrowRight, Zap, UsersRound, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react'; // Added TrendingUp
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { NobridgeIcon, NobridgeIconType } from '@/components/ui/nobridge-icon';


const PlaceholderLogo = ({ text = "Logo", className = "" }: { text?: string, className?: string }) => (
  <div
    className={cn("bg-brand-light-gray/30 flex items-center justify-center rounded-md p-4 h-12 md:h-16 w-auto min-w-[120px] md:min-w-[150px]", className)}
    data-ai-hint="company logo"
  >
    <span className="text-brand-dark-blue/70 text-xs md:text-sm font-medium text-center">{text}</span>
  </div>
);

// Listing interface for real data from API response
interface FeaturedListing {
  id: string;
  title: string; // API returns 'title' not 'listing_title_anonymous'
  industry: string;
  location_city: string; // API returns 'location_city'
  location_country: string;
  asking_price: number;
  annual_revenue_range?: string;
  images?: string; // API returns 'images' as JSON string
  verification_status: string; // API returns 'verification_status'
  short_description?: string; // API returns 'short_description'
}

const featuredCompanyLogos = [
  { src: "/assets/1.png", alt: "Featured Company Logo 1", dataAiHint: "company logo" },
  { src: "/assets/2.png", alt: "Featured Company Logo 2", dataAiHint: "company logo" },
  { src: "/assets/3.png", alt: "Featured Company Logo 3", dataAiHint: "company logo" },
  { src: "/assets/4.png", alt: "Featured Company Logo 4", dataAiHint: "company logo" },
  { src: "/assets/5.png", alt: "Featured Company Logo 5", dataAiHint: "company logo" },
];

export default function HomePage() {
  const [featuredListings, setFeaturedListings] = useState<FeaturedListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch featured listings on component mount
  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        const response = await fetch('/api/listings?limit=3&sort=created_at&order=desc');
        if (response.ok) {
          const data = await response.json();
          setFeaturedListings(data.listings || []);
        } else {
          console.error('Failed to fetch featured listings');
        }
      } catch (error) {
        console.error('Error fetching featured listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedListings();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="w-full bg-brand-dark-blue text-brand-white">
        <div className="container mx-auto flex flex-col items-center justify-center text-center min-h-[calc(80vh-theme(spacing.20))] px-4 py-24 md:py-32 lg:py-40">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight !leading-tight mb-6 font-heading">
            Find Your Next Business Venture with Nobridge
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-brand-light-gray max-w-3xl mx-auto mb-10">
            Nobridge is the premier marketplace connecting SME owners with motivated investors and buyers. Discover, inquire, and engage with verified opportunities.
          </p>
          <div className="mb-10 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-brand-light-gray">
            <div className="flex items-center">
              <NobridgeIcon icon="people" size="sm" className="mr-2 opacity-80" /> Verified Network
            </div>
            <span className="hidden sm:inline text-brand-light-gray/50">|</span>
            <div className="flex items-center">
              <NobridgeIcon icon="process" size="sm" className="mr-2 opacity-80" />Efficient Process
            </div>
            <span className="hidden sm:inline text-brand-light-gray/50">|</span>
            <div className="flex items-center">
              <NobridgeIcon icon="worldwide" size="sm" className="mr-2 opacity-80" /> Expert Support
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/seller-dashboard/listings/create" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-brand-white text-brand-dark-blue hover:bg-brand-light-gray/90 h-11 py-3 px-8 text-base">
                List Your Business <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-brand-white text-brand-white hover:bg-brand-white/10 hover:text-brand-white h-11 py-3 px-8 text-base">
                Browse Businesses <SearchIconLucide className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Business Listings Preview */}
      <section id="marketplace-preview" className="py-16 md:py-24 bg-brand-light-gray">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue font-heading">Featured Opportunities</h2>
            <p className="text-muted-foreground mt-3 text-lg">A Glimpse into Our Curated Marketplace</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="bg-brand-white shadow-xl rounded-lg flex flex-col overflow-hidden">
                  <div className="p-0 relative">
                    <Skeleton className="w-full h-48" />
                  </div>
                  <CardContent className="p-6 flex-grow">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/5" />
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 border-t border-brand-light-gray/80">
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : featuredListings.length > 0 ? (
              featuredListings.map((listing) => (
                <Card key={listing.id} className="bg-brand-white shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg flex flex-col overflow-hidden">
                  <CardHeader className="p-0 relative">
                    <Image
                      src={
                        listing.images
                          ? (typeof listing.images === 'string'
                              ? JSON.parse(listing.images)[0]
                              : listing.images[0]) || "https://placehold.co/400x250.png"
                          : "https://placehold.co/400x250.png"
                      }
                      alt={listing.title}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover"
                      data-ai-hint={listing.industry ? listing.industry.toLowerCase().replace(/\s+/g, '-') : "business"}
                    />
                     {listing.verification_status === 'verified' && (
                        <Badge variant="outline" className="absolute top-3 right-3 text-xs border-green-600 text-green-700 bg-green-100 dark:bg-green-700/20 dark:text-green-300 dark:border-green-500/50">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                  </CardHeader>
                  <CardContent className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-brand-dark-blue/5 text-brand-dark-blue text-xs">{listing.industry}</Badge>
                    </div>
                    <CardTitle className="text-xl font-semibold text-brand-dark-blue mb-2 leading-tight hover:text-brand-sky-blue transition-colors font-heading">
                      <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
                    </CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-brand-dark-blue/70" /> {listing.industry}</p>
                      <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-brand-dark-blue/70" /> {listing.location_city}, {listing.location_country}</p>
                      {listing.annual_revenue_range && (
                        <p className="flex items-center"><TrendingUp className="h-4 w-4 mr-2 text-brand-dark-blue/70" /> Revenue: {listing.annual_revenue_range}</p>
                      )}
                      <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-brand-dark-blue/70" /> Asking: ${(listing.asking_price / 1000000).toFixed(1)}M USD</p>
                    </div>
                    {listing.short_description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {listing.short_description.substring(0, 120)}...
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="p-6 border-t border-brand-light-gray/80 mt-auto">
                    <Link href={`/listings/${listing.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 h-10 px-4 py-2">
                      View Details <SearchIconLucide className="ml-2 h-4 w-4" />
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              // Fallback if no listings
              <div className="col-span-full text-center py-8">
                <div className="flex flex-col items-center gap-4">
                  <Briefcase className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No featured listings available at the moment.</p>
                  <Link href="/marketplace" className="inline-flex items-center text-brand-dark-blue hover:text-brand-sky-blue">
                    Browse all listings <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="mt-16 text-center">
            <Link href="/marketplace" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-brand-dark-blue text-brand-dark-blue hover:bg-brand-dark-blue/5 h-11 py-3 px-8 text-base">
              Explore Full Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* How Nobridge Works Section */}
      <section className="py-16 md:py-24 bg-brand-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue font-heading">Your Journey with Nobridge</h2>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">Whether you're selling your life's work or seeking your next strategic investment, Nobridge provides the tools and network you need.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch"> {/* items-stretch retained */}
            <Card className="bg-brand-light-gray/50 p-6 md:p-8 rounded-lg shadow-lg flex flex-col"> {/* flex flex-col retained */}
              {/* Icon wrapper removed */}
              <div className="flex-grow"> {/* flex-grow retained */}
                <h3 className="text-2xl font-semibold text-brand-dark-blue mb-3 font-heading">List Your Business with Confidence</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Nobridge provides a secure and efficient platform to connect with verified buyers across Asia, guiding you through every step.
                </p>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2 text-brand-sky-blue" /> {/* Added icon */}
                    Access to Verified Buyers
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-brand-sky-blue" /> {/* Added icon */}
                    Step-by-Step Listing Guidance
                  </li>
                  <li className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-brand-sky-blue" /> {/* Added icon */}
                     Secure Inquiry Management
                  </li>
                </ul>
              </div>
              <Link href="/seller-dashboard/listings/create" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 h-10 px-4 py-2 mt-auto">
                Learn More About Selling
              </Link>
            </Card>
            <Card className="bg-brand-light-gray/50 p-6 md:p-8 rounded-lg shadow-lg flex flex-col"> {/* flex flex-col retained */}
              {/* Icon wrapper removed */}
              <div className="flex-grow"> {/* flex-grow retained */}
                <h3 className="text-2xl font-semibold text-brand-dark-blue mb-3 font-heading">Discover Your Next Investment Opportunity</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Explore a curated marketplace of businesses for sale. Get access to detailed information on verified businesses and engage directly with sellers.
                </p>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-brand-sky-blue" /> {/* Added icon */}
                    Vetted Business Listings
                  </li>
                  <li className="flex items-center">
                    <SearchIconLucide className="h-5 w-5 mr-2 text-brand-sky-blue" /> {/* Added icon */}
                    Advanced Search & Filters
                  </li>
                  <li className="flex items-center">
                    <UsersRound className="h-5 w-5 mr-2 text-brand-sky-blue" /> {/* Added icon */}
                    Direct Seller Engagement (Post-Verification)
                  </li>
                </ul>
              </div>
              <Link href="/marketplace" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 h-10 px-4 py-2 mt-auto">
                Learn More About Buying
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-16 md:py-24 bg-brand-light-gray">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue text-center mb-4 font-heading">Trusted by the Business Community</h2>
          <p className="text-center text-muted-foreground text-lg mb-12 md:mb-16">Hear from entrepreneurs and investors who have found success with Nobridge.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "Nobridge made selling my e-commerce store incredibly smooth and connected me with serious, verified buyers from across the region.", name: "Aisha Khan", role: "Former E-commerce Owner, Singapore" },
              { quote: "Finding the right mid-market investment in Southeast Asia was challenging until I found Nobridge. Their verified listings and clear process saved us significant time.", name: "Raj Patel", role: "Investment Director, Malaysia" },
              { quote: "The platform is intuitive, and the support for getting my business listed and verified was top-notch. Highly recommended for any SME owner considering an exit.", name: "Nguyen Van Minh", role: "SME Owner, Vietnam" },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-brand-white shadow-xl hover:shadow-2xl transition-shadow rounded-lg">
                <CardContent className="p-8">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-muted-foreground mb-4 italic text-base leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                  <p className="font-semibold text-brand-dark-blue">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* "As Mentioned In" / Credibility Logos - REPLACED */}
      <section className="py-12 md:py-16 bg-brand-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-10 font-heading">Featured In</h3>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-10 md:gap-x-16 lg:gap-x-20">
            {featuredCompanyLogos.map((logo, index) => (
              <div key={index} className="h-20 md:h-24 lg:h-28 flex items-center"> {/* Made even bigger */}
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={220} // Increased width more
                  height={90} // Increased height more
                  className="object-contain max-h-full"
                  data-ai-hint={logo.dataAiHint}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 md:py-32 bg-brand-dark-blue text-brand-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-light-gray/70 mb-3">OUR COMMITMENT</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 font-heading">Empowering SME Growth and Transitions Across Asia</h2>
          <p className="text-lg md:text-xl text-brand-light-gray/90 max-w-3xl mx-auto mb-10">
            At Nobridge, we believe in the power of small and medium-sized enterprises. Our mission is to provide a transparent, efficient, and supportive platform that connects business owners with the right investors and buyers, fostering growth and successful transitions throughout the continent.
          </p>
          <Link href="/about" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-brand-white text-brand-dark-blue bg-brand-white hover:bg-brand-light-gray h-11 py-3 px-8 text-base">
            Learn More About Us
          </Link>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-16 md:py-24 bg-brand-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue mb-4 font-heading">Ready to Begin Your Journey?</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Whether you&apos;re looking to sell your business, find your next investment, or simply learn more, our team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/auth/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 h-11 py-3 px-8 text-base">
              Register Now
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-brand-dark-blue text-brand-dark-blue hover:bg-brand-dark-blue/5 h-11 py-3 px-8 text-base">
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

