
import * as React from "react";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Star, CheckCircle, Zap, UsersRound, MapPin, Briefcase, ListChecks, CircleDollarSign, ShieldCheck, FileText, MessageSquare, Info, Phone, Home, ExternalLink, Users2 as UsersIcon, Images as ImagesIcon, Banknote, BookOpen, Brain, HandCoins, Globe, Link as LinkIconLucide } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { sampleListings } from '@/lib/placeholder-data';
import { NobridgeIcon, NobridgeIconType } from '@/components/ui/nobridge-icon';


const PlaceholderLogo = ({ text = "Logo", className = "" }: { text?: string, className?: string }) => (
  <div
    className={cn("bg-brand-light-gray/30 flex items-center justify-center rounded-md p-4 h-12 md:h-16 w-auto min-w-[120px] md:min-w-[150px]", className)}
    data-ai-hint="company logo"
  >
    <span className="text-brand-dark-blue/70 text-xs md:text-sm font-medium text-center">{text}</span>
  </div>
);

const previewListings = sampleListings.slice(0, 3);

export default function HomePage() {
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
              <NobridgeIcon icon="verification" size="sm" className="mr-2 opacity-80" /> Verified Network
            </div>
            <span className="hidden sm:inline text-brand-light-gray/50">|</span>
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-brand-light-gray" /> Efficient Process
            </div>
            <span className="hidden sm:inline text-brand-light-gray/50">|</span>
            <div className="flex items-center">
              <UsersRound className="h-5 w-5 mr-2 text-brand-light-gray" /> Expert Support
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-brand-white text-brand-dark-blue hover:bg-brand-light-gray/90 font-semibold py-3 px-8 rounded-md text-base">
              <Link href="/seller-dashboard/listings/create">List Your Business <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-brand-white text-brand-dark-blue hover:bg-brand-white/10 hover:text-brand-white font-semibold py-3 px-8 rounded-md text-base">
              <Link href="/marketplace">Browse Businesses</Link>
            </Button>
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
            {previewListings.map((listing) => (
              <Card key={listing.id} className="bg-brand-white shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg flex flex-col overflow-hidden">
                <CardHeader className="p-0 relative">
                  <Image
                    src={listing.imageUrls?.[0] || "https://placehold.co/400x250.png"}
                    alt={listing.listingTitleAnonymous}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover"
                    data-ai-hint={listing.industry ? listing.industry.toLowerCase().replace(/\s+/g, '-') : "business"}
                  />
                   {listing.isSellerVerified && (
                      <Badge variant="outline" className="absolute top-3 right-3 text-xs border-green-600 text-green-700 bg-green-100 dark:bg-green-700/20 dark:text-green-300 dark:border-green-500/50">
                        <NobridgeIcon icon="verification" size="sm" className="mr-1 opacity-80" /> Verified
                      </Badge>
                    )}
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-brand-dark-blue/5 text-brand-dark-blue text-xs">{listing.industry}</Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold text-brand-dark-blue mb-2 leading-tight hover:text-brand-sky-blue transition-colors font-heading">
                    <Link href={`/listings/${listing.id}`}>{listing.listingTitleAnonymous}</Link>
                  </CardTitle>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-brand-dark-blue/70" /> {listing.locationCityRegionGeneral}, {listing.locationCountry}</p>
                    <p className="flex items-center"><NobridgeIcon icon="revenue" size="sm" className="mr-2 opacity-70" /> Asking: {listing.askingPrice ? `$${listing.askingPrice.toLocaleString()} USD` : 'Contact for Price'}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-6 border-t border-brand-light-gray/80 mt-auto">
                  <Button asChild className="w-full bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                    <Link href={`/listings/${listing.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Button size="lg" variant="outline" asChild className="border-brand-dark-blue text-brand-dark-blue hover:bg-brand-dark-blue/5 font-semibold py-3 px-8 rounded-md text-base">
              <Link href="/marketplace">Explore Full Marketplace</Link>
            </Button>
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
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            <Card className="bg-brand-light-gray/50 rounded-lg shadow-lg flex flex-col">
              <CardContent className="p-6 md:p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-semibold text-brand-dark-blue mb-3 font-heading">List Your Business with Confidence</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed flex-grow">
                  Nobridge provides a secure and efficient platform to connect with verified buyers across Asia, guiding you through every step.
                </p>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <NobridgeIcon icon="secure-docs" size="sm" className="mr-2 opacity-80" /> Access to Verified Buyers
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-brand-sky-blue" /> Step-by-Step Listing Guidance
                  </li>
                  <li className="flex items-center">
                    <NobridgeIcon icon="interaction" size="sm" className="mr-2 opacity-80" /> Secure Inquiry Management
                  </li>
                </ul>
                <Button className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 mt-auto">
                  <Link href="/seller-dashboard/listings/create">Learn More About Selling</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-brand-light-gray/50 rounded-lg shadow-lg flex flex-col">
              <CardContent className="p-6 md:p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-semibold text-brand-dark-blue mb-3 font-heading">Discover Your Next Investment Opportunity</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed flex-grow">
                  Explore a curated marketplace of businesses for sale. Get access to detailed information on verified businesses and engage directly with sellers.
                </p>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <NobridgeIcon icon="core-details" size="sm" className="mr-2 opacity-80" /> Vetted Business Listings
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-brand-sky-blue" /> Advanced Search & Filters
                  </li>
                  <li className="flex items-center">
                    <NobridgeIcon icon="verification" size="sm" className="mr-2 opacity-80" /> Direct Seller Engagement (Post-Verification)
                  </li>
                </ul>
                <Button className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 mt-auto">
                  <Link href="/marketplace">Learn More About Buying</Link>
                </Button>
              </CardContent>
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

      {/* "As Mentioned In" / Credibility Logos */}
      <section className="py-12 md:py-16 bg-brand-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-8 font-heading">Featured In</h3>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 md:gap-x-16 lg:gap-x-20">
            <PlaceholderLogo text="TechJournal Asia" />
            <PlaceholderLogo text="Enterprise SG" />
            <PlaceholderLogo text="Finance Today SEA" />
            <PlaceholderLogo text="Startup Weekly" />
            <PlaceholderLogo text="Global Business Review" />
          </div>
        </div>
      </section>

      {/* Featured Content / Blog Snippets */}
      <section className="py-16 md:py-24 bg-brand-light-gray">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue font-heading">Insights & Success Stories</h2>
            <p className="text-muted-foreground mt-3 text-lg">From Our Knowledge Hub</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { imageHint: "market analysis graph", category: "Market Trends", title: "Key Growth Sectors in Southeast Asia for 2025", excerpt: "Discover the industries poised for significant expansion and investment opportunities across the ASEAN region.", icon: "growth" as NobridgeIconType },
              { imageHint: "business negotiation handshake", category: "Seller Tips", title: "Preparing Your Business for a Successful Sale", excerpt: "Essential steps to maximize your business's value and attract the right buyers in the Asian market.", icon: "due-diligence" as NobridgeIconType },
              { imageHint: "business team success", category: "Success Story", title: "How a Tech Startup Found its Strategic Acquirer via Nobridge", excerpt: "Read about the journey of 'Innovate Solutions' and their successful exit facilitated by our platform.", icon: "featured" as NobridgeIconType },
            ].map((item, index) => (
              <Card key={index} className="bg-brand-white shadow-xl hover:shadow-2xl transition-shadow overflow-hidden flex flex-col rounded-lg">
                <CardContent className="w-full h-48 bg-brand-dark-blue/10 flex items-center justify-center p-0">
                  <NobridgeIcon icon={item.icon} size="xl" />
                </CardContent>
                <CardHeader className="p-6">
                  <Badge variant="outline" className="mb-2 w-fit border-brand-dark-blue/30 text-brand-dark-blue/80">{item.category}</Badge>
                  <CardTitle className="text-xl font-semibold leading-tight text-brand-dark-blue hover:text-brand-sky-blue transition-colors font-heading">
                    <Link href="#">{item.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground flex-grow p-6 pt-0">
                  <p>{item.excerpt}</p>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button variant="link" asChild className="text-brand-dark-blue hover:text-brand-sky-blue p-0 font-medium">
                    <Link href="#">Read More <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="text-center mt-16">
            <Button size="lg" variant="outline" asChild className="border-brand-dark-blue text-brand-dark-blue hover:bg-brand-dark-blue/5 font-semibold py-3 px-8 rounded-md text-base">
              <Link href="#">Explore All Insights</Link>
            </Button>
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
          <Button size="lg" variant="outline" className="border-brand-white text-brand-dark-blue bg-brand-white hover:bg-brand-light-gray font-semibold py-3 px-8 rounded-md text-base" asChild>
            <Link href="/about">Learn More About Us</Link>
          </Button>
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
            <Button size="lg" asChild className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90 font-semibold py-3 px-8 rounded-md text-base">
              <Link href="/auth/register">Register Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-brand-dark-blue text-brand-dark-blue hover:bg-brand-dark-blue/5 font-semibold py-3 px-8 rounded-md text-base">
              <Link href="/contact">Contact Our Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

    