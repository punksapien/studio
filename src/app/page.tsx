
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Zap, BarChart, BookText, Target, User, Briefcase, Search, Star, Building, MessageSquare, MapPin, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image'; 
import { Badge } from '@/components/ui/badge'; // Added Badge import

// Placeholder for simple gray box image
const PlaceholderImage = ({ width = 600, height = 400, text = "Placeholder Image" }: { width?: number, height?: number, text?: string }) => (
  <div
    className="bg-muted flex items-center justify-center rounded-lg"
    style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }}
    data-ai-hint="abstract business"
  >
    <span className="text-muted-foreground text-sm">{text}</span>
  </div>
);

const PlaceholderLogo = ({ text = "Logo" }: { text?: string }) => (
  <div
    className="bg-muted flex items-center justify-center rounded-md p-4 h-16 w-32"
    data-ai-hint="company logo"
  >
    <span className="text-muted-foreground text-xs">{text}</span>
  </div>
);

export default function HomePage() {
  const testimonials = [
    { quote: "BizMatch Asia made selling my e-commerce store incredibly smooth and connected me with serious, verified buyers.", name: "Aisha Khan", role: "Former E-commerce Owner, Singapore" },
    { quote: "Finding the right investment in the SEA market was challenging until I found BizMatch Asia. Their verified listings saved me so much time.", name: "Raj Patel", role: "Investor, Malaysia" },
    { quote: "The platform is intuitive, and the support for getting my business listed and verified was top-notch.", name: "Nguyen Van Minh", role: "SME Owner, Vietnam" },
  ];

  const featuredContent = [
    { imageHint: "market analysis graph", category: "Market Trends", title: "Key Growth Sectors in Southeast Asia for 2025", excerpt: "Discover the industries poised for significant expansion and investment opportunities across the ASEAN region." },
    { imageHint: "business negotiation handshake", category: "Seller Tips", title: "Preparing Your Business for a Successful Sale", excerpt: "Essential steps to maximize your business's value and attract the right buyers in the Asian market." },
    { imageHint: "business team success", category: "Success Story", title: "How a Tech Startup Found its Strategic Acquirer via BizMatch", excerpt: "Read about the journey of 'Innovate Solutions' and their successful exit facilitated by our platform." },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Buy or Sell Your Next Business Venture in Asia with Certainty
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            BizMatch Asia is the premier platform connecting SME owners with motivated investors and buyers. Discover, inquire, and engage with verified opportunities.
          </p>
          <div className="mt-8 space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-center sm:justify-start">
              <Shield className="h-5 w-5 mr-2 text-accent" /> Verified Network: Connect with trusted parties.
            </div>
            <div className="hidden sm:block">|</div>
            <div className="flex items-center justify-center sm:justify-start">
              <Zap className="h-5 w-5 mr-2 text-accent" /> Efficient Process: Streamlined steps.
            </div>
            <div className="hidden sm:block">|</div>
            <div className="flex items-center justify-center sm:justify-start">
              <CheckCircle className="h-5 w-5 mr-2 text-accent" /> Expert Support: Guidance throughout.
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/auth/register/seller">List Your Business <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/marketplace">Browse Businesses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4">
          <h2 className="text-3xl font-semibold tracking-tight text-center mb-4">Trusted by Entrepreneurs and Investors Across Asia</h2>
          <p className="text-center text-muted-foreground mb-12">Hear from those who've found success with BizMatch Asia.</p>
          {/* Optional Trustpilot Placeholder: 
          <div className="text-center mb-12">
            <PlaceholderImage width={200} height={50} text="Trustpilot Rating Placeholder" />
          </div> 
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">&quot;{testimonial.quote}&quot;</p>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* "As Mentioned In" / Credibility Logos */}
      <section className="py-12 bg-secondary/30">
        <div className="container px-4 text-center">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-8">Featured In</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
            <PlaceholderLogo text="TechAsia Today" />
            <PlaceholderLogo text="Business Times SEA" />
            <PlaceholderLogo text="Startup Insights SG" />
            <PlaceholderLogo text="Investor Daily VN" />
            <PlaceholderLogo text="ASEAN Finance Hub" />
          </div>
          {/* <Button variant="link" className="mt-8 text-primary">View Our Press Highlights <ArrowRight className="ml-2 h-4 w-4" /></Button> */}
        </div>
      </section>

      {/* How BizMatch Asia Works */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">Streamlining Business Transactions in Asia</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Whether you're selling your life's work or seeking your next strategic investment, BizMatch Asia provides the tools and network you need.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex items-center mb-3">
                   <div className="p-3 bg-primary/10 rounded-full mr-4"><Briefcase className="h-6 w-6 text-primary" /></div>
                  <CardTitle className="text-2xl">For Business Sellers</CardTitle>
                </div>
                <CardDescription>List your business with confidence and reach a targeted audience of verified buyers across Asia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm flex-grow">
                <p className="text-muted-foreground">Our platform guides you through creating compelling, confidential listings and managing inquiries efficiently.</p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-muted-foreground">
                  <li><span className="font-medium text-foreground">Access to Verified Buyers:</span> Connect with serious, pre-vetted investors.</li>
                  <li><span className="font-medium text-foreground">Step-by-Step Listing Guidance:</span> Create professional listings with ease.</li>
                  <li><span className="font-medium text-foreground">Secure Inquiry Management:</span> Control who sees your detailed information.</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/how-selling-works">Learn More About Selling <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                 <div className="flex items-center mb-3">
                   <div className="p-3 bg-accent/10 rounded-full mr-4"><Search className="h-6 w-6 text-accent" /></div>
                  <CardTitle className="text-2xl">For Business Buyers</CardTitle>
                </div>
                <CardDescription>Discover your next investment opportunity from a diverse range of SMEs for sale in the Asian market.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm flex-grow">
                <p className="text-muted-foreground">Explore listings, get access to detailed information on verified businesses, and engage directly with sellers.</p>
                 <ul className="list-disc list-inside space-y-1 pl-1 text-muted-foreground">
                  <li><span className="font-medium text-foreground">Vetted Business Listings:</span> Focus on quality, verified opportunities.</li>
                  <li><span className="font-medium text-foreground">Advanced Search & Filters:</span> Find exactly what you&apos;re looking for.</li>
                  <li><span className="font-medium text-foreground">Direct Seller Engagement (Post-Verification):</span> Connect post-verification to explore deals.</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/how-buying-works">Learn More About Buying <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Content / Blog Snippets */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">Insights & Success Stories</h2>
            <p className="text-muted-foreground mt-2">From Our Knowledge Hub</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredContent.map((item, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden flex flex-col">
                 <PlaceholderImage width={300} height={200} text={item.imageHint} />
                <CardHeader>
                  <Badge variant="outline" className="mb-2 w-fit">{item.category}</Badge>
                  <CardTitle className="text-xl leading-tight">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground flex-grow">
                  <p>{item.excerpt}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="link" asChild className="text-primary p-0">
                    <Link href="#">Read More <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link href="#">Explore All Insights</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 md:py-32 bg-brand-dark text-primary-foreground"> {/* Uses custom class */}
        <div className="container px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-300 mb-3">OUR COMMITMENT</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Empowering SME Growth and Transitions Across Asia</h2>
          <p className="text-lg md:text-xl text-sky-100/90 max-w-3xl mx-auto mb-8">
            At BizMatch Asia, we believe in the power of small and medium-sized enterprises. Our mission is to provide a transparent, efficient, and supportive platform that connects business owners with the right investors and buyers, fostering growth and successful transitions throughout the continent.
          </p>
          <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
            <Link href="/about">Learn More About Us</Link>
          </Button>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">Ready to Take the Next Step?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Whether you&apos;re looking to sell your business, find your next investment, or simply learn more, our team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/register">Register Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Our Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
    
