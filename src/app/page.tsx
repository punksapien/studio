
import * as React from "react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Zap, Briefcase, Users, MapPin, DollarSign, ShoppingCart, FileText, Info, Phone, Newspaper, Home, UserCircle, LogIn, UserPlus, Search as SearchIcon, BarChart3, HandCoins, Star, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Placeholder for simple gray box image - defined locally for this page to ensure it works
const PlaceholderImage = ({ className = "", text = "Placeholder Image", width = 600, height = 400, aiHint = "abstract business" }: { className?: string, text?: string, width?: number, height?: number, aiHint?: string }) => (
  <div
    className={cn("bg-brand-light-gray/50 flex items-center justify-center rounded-lg overflow-hidden aspect-video", className)}
    style={{
      // Using inline styles for width/height to ensure they apply if Tailwind JIT doesn't pick up dynamic class names
      width: width ? `${width}px` : '100%',
      height: height ? `${height}px` : 'auto',
      maxWidth: '100%'
    }}
    data-ai-hint={aiHint}
  >
    <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
      <span className="text-gray-500 dark:text-gray-400 text-xs">{text}</span>
    </div>
  </div>
);

// Placeholder for logo - defined locally
const PlaceholderLogo = ({ text = "Logo" }: { text?: string }) => (
  <div
    className="bg-brand-light-gray/30 flex items-center justify-center rounded-md p-4 h-16 w-32"
    data-ai-hint="company logo"
  >
    <span className="text-brand-dark-blue/70 text-xs font-medium">{text}</span>
  </div>
);

const previewListings = [
  { id: '1', title: 'High-Growth SaaS Platform in FinTech', industry: 'Technology', location: 'Singapore', price: 1750000, isSellerVerified: true, imageUrls: ['https://placehold.co/400x250.png'], aiHint: 'software interface dashboard' },
  { id: '2', title: 'Luxury Boutique Hotel Chain', industry: 'Hospitality', location: 'Bali, Indonesia', price: 7500000, isSellerVerified: true, imageUrls: ['https://placehold.co/400x250.png'], aiHint: 'hotel resort luxury' },
  { id: '3', title: 'Sustainable Agriculture Enterprise', industry: 'Agriculture', location: 'Vietnam', price: 750000, isSellerVerified: false, imageUrls: ['https://placehold.co/400x250.png'], aiHint: 'farm agriculture sustainable' },
];

const testimonials = [
  { quote: "Nobridge made selling my e-commerce store incredibly smooth and connected me with serious, verified buyers from across the region.", name: "Aisha Khan", role: "Former E-commerce Owner, Singapore" },
  { quote: "Finding the right mid-market investment in Southeast Asia was challenging until I found Nobridge. Their verified listings and clear process saved us significant time.", name: "Raj Patel", role: "Investment Director, Malaysia" },
  { quote: "The platform is intuitive, and the support for getting my business listed and verified was top-notch. Highly recommended for any SME owner considering an exit.", name: "Nguyen Van Minh", role: "SME Owner, Vietnam" },
];

const featuredContent = [
  { imageHint: "market analysis graph", category: "Market Trends", title: "Key Growth Sectors in Southeast Asia for 2025", excerpt: "Discover the industries poised for significant expansion and investment opportunities across the ASEAN region." },
  { imageHint: "business negotiation handshake", category: "Seller Tips", title: "Preparing Your Business for a Successful Sale", excerpt: "Essential steps to maximize your business's value and attract the right buyers in the Asian market." },
  { imageHint: "business team success", category: "Success Story", title: "How a Tech Startup Found its Strategic Acquirer via Nobridge", excerpt: "Read about the journey of 'Innovate Solutions' and their successful exit facilitated by our platform." },
];


export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full bg-brand-dark-blue text-brand-white">
        <div className="container mx-auto flex flex-col items-center justify-center text-center min-h-[calc(80vh-theme(spacing.20))] px-4 py-24 md:py-32 lg:py-40"> {/* Increased padding */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight !leading-tight mb-6">
            Find Your Next Business Venture with Nobridge
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-brand-light-gray max-w-3xl mx-auto mb-10">
            Nobridge is the premier marketplace connecting SME owners with motivated investors and buyers. Discover, inquire, and engage with verified opportunities.
          </p>
          <div className="mb-10 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-brand-light-gray">
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-brand-light-gray" /> Verified Network: Connect with trusted parties.
            </div>
            <span className="hidden sm:inline text-brand-light-gray/50">|</span>
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-brand-light-gray" /> Efficient Process: Streamlined steps.
            </div>
            <span className="hidden sm:inline text-brand-light-gray/50">|</span>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-brand-light-gray" /> Expert Support: Guidance throughout.
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-brand-white text-brand-dark-blue hover:bg-brand-light-gray/90 font-semibold py-3 px-8 rounded-md text-base">
              <Link href="/auth/register/seller">List Your Business <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-brand-white text-brand-white hover:bg-brand-white/10 hover:text-brand-white font-semibold py-3 px-8 rounded-md text-base">
              <Link href="/marketplace">Browse Businesses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Business Listings Preview */}
      <section id="marketplace-preview" className="py-16 md:py-24 bg-brand-light-gray">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue">Featured Opportunities</h2>
            <p className="text-muted-foreground mt-3 text-lg">A Glimpse into Our Curated Marketplace</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {previewListings.map((listing) => (
              <Card key={listing.id} className="bg-brand-white shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg flex flex-col overflow-hidden">
                <CardHeader className="p-0 relative">
                  <PlaceholderImage className="w-full" width={400} height={220} text={`Image for ${listing.title}`} aiHint={listing.aiHint || "business operations"} />
                   {listing.isSellerVerified && (
                      <Badge variant="outline" className="absolute top-3 right-3 text-xs border-green-600 text-green-700 bg-green-100 dark:bg-green-700/20 dark:text-green-300 dark:border-green-500/50">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-brand-dark-blue/5 text-brand-dark-blue text-xs">{listing.industry}</Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold text-brand-dark-blue mb-2 leading-tight hover:text-brand-sky-blue transition-colors">
                    <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
                  </CardTitle>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-brand-dark-blue/70" /> {listing.location}</p>
                    <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-brand-dark-blue/70" /> Asking: ${listing.price.toLocaleString()} USD</p>
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
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue">Your Journey with Nobridge</h2>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">Whether you're selling your life's work or seeking your next strategic investment, Nobridge provides the tools and network you need.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
            <Card className="bg-brand-light-gray/50 p-8 rounded-lg shadow-lg">
              <div className="p-3 bg-brand-dark-blue/10 rounded-full w-fit mb-4">
                <Briefcase className="h-8 w-8 text-brand-dark-blue" />
              </div>
              <h3 className="text-2xl font-semibold text-brand-dark-blue mb-3">List Your Business with Confidence</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Nobridge provides a secure and efficient platform to connect with verified buyers across Asia, guiding you through every step.
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-brand-sky-blue" /> Access to Verified Buyers</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-brand-sky-blue" /> Step-by-Step Listing Guidance</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-brand-sky-blue" /> Secure Inquiry Management</li>
              </ul>
              <Button asChild className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                <Link href="/how-selling-works">Learn More About Selling</Link>
              </Button>
            </Card>
            <Card className="bg-brand-light-gray/50 p-8 rounded-lg shadow-lg">
               <div className="p-3 bg-brand-dark-blue/10 rounded-full w-fit mb-4">
                <SearchIcon className="h-8 w-8 text-brand-dark-blue" />
              </div>
              <h3 className="text-2xl font-semibold text-brand-dark-blue mb-3">Discover Your Next Investment Opportunity</h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Explore a curated marketplace of businesses for sale. Get access to detailed information on verified businesses and engage directly with sellers.
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-brand-sky-blue" /> Vetted Business Listings</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-brand-sky-blue" /> Advanced Search & Filters</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-brand-sky-blue" /> Direct Seller Engagement (Post-Verification)</li>
              </ul>
              <Button asChild className="bg-brand-dark-blue text-brand-white hover:bg-brand-dark-blue/90">
                <Link href="/how-buying-works">Learn More About Buying</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-16 md:py-24 bg-brand-light-gray">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue text-center mb-4">Trusted by the Business Community</h2>
          <p className="text-center text-muted-foreground text-lg mb-12 md:mb-16">Hear from entrepreneurs and investors who have found success with Nobridge.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
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
          <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-8">Featured In</h3>
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
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue">Insights & Success Stories</h2>
            <p className="text-muted-foreground mt-3 text-lg">From Our Knowledge Hub</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredContent.map((item, index) => (
              <Card key={index} className="bg-brand-white shadow-xl hover:shadow-2xl transition-shadow overflow-hidden flex flex-col rounded-lg">
                <PlaceholderImage className="w-full" width={300} height={200} text={item.imageHint} aiHint={item.imageHint} />
                <CardHeader className="p-6">
                  <Badge variant="outline" className="mb-2 w-fit border-brand-dark-blue/30 text-brand-dark-blue/80">{item.category}</Badge>
                  <CardTitle className="text-xl font-semibold leading-tight text-brand-dark-blue hover:text-brand-sky-blue transition-colors">
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
      <section className="py-20 md:py-32 bg-brand-dark-blue text-brand-white"> {/* Used direct color class for simplicity */}
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-light-gray/70 mb-3">OUR COMMITMENT</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">Empowering SME Growth and Transitions Across Asia</h2>
          <p className="text-lg md:text-xl text-brand-light-gray/90 max-w-3xl mx-auto mb-10">
            At Nobridge, we believe in the power of small and medium-sized enterprises. Our mission is to provide a transparent, efficient, and supportive platform that connects business owners with the right investors and buyers, fostering growth and successful transitions throughout the continent.
          </p>
          <Button size="lg" variant="outline" className="border-brand-white text-brand-white hover:bg-brand-white/10 hover:text-brand-white font-semibold py-3 px-8 rounded-md text-base" asChild>
            <Link href="/about">Learn More About Us</Link>
          </Button>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-16 md:py-24 bg-brand-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark-blue mb-4">Ready to Begin Your Journey?</h2>
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


    