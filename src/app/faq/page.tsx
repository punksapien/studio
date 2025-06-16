
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Phone, Search, ShieldCheck, Briefcase, DollarSign, Users } from "lucide-react";

const faqs = [
  {
    category: "General",
    icon: <Info className="h-5 w-5 mr-2 text-primary" />,
    questions: [
      {
        q: "What is Nobridge?",
        a: "Nobridge is a premier marketplace platform connecting SME (Small and Medium Enterprise) owners looking to sell their businesses with motivated investors and buyers, primarily across Asia.",
      },
      {
        q: "Who can use Nobridge?",
        a: "Nobridge is for business sellers looking to exit or find investment, and for buyers/investors (individuals, PEs, corporations) seeking acquisition opportunities. We also have platform administrators who manage the marketplace.",
      },
      {
        q: "Is there a fee to use Nobridge?",
        a: "Nobridge offers different plans. There's a free tier for basic valuation and listing. Paid plans (Lite, Pro, Premium) for sellers include monthly retainers and success fees. Please see our Pricing page for detailed information.",
      },
    ],
  },
  {
    category: "For Sellers",
    icon: <Briefcase className="h-5 w-5 mr-2 text-primary" />,
    questions: [
      {
        q: "How do I list my business for sale?",
        a: "Register as a seller, complete your profile verification, and then use the 'Create New Listing' feature in your Seller Dashboard. Our platform will guide you through providing the necessary business details.",
      },
      {
        q: "Can I list my business anonymously?",
        a: "Yes, Nobridge allows sellers to create anonymous listings initially. Certain sensitive details will only be revealed to verified buyers after mutual interest is established and, in some cases, after admin facilitation.",
      },
      {
        q: "What is the verification process for sellers?",
        a: "Seller verification involves submitting identity proof, business registration documents, and potentially financial snapshots. Our admin team reviews these to ensure the legitimacy of sellers and their businesses, building trust within the marketplace.",
      },
      {
        q: "How do I handle inquiries from buyers?",
        a: "You will receive notifications for new inquiries in your Seller Dashboard. You can review the buyer's initial interest and choose to 'Engage'. Further communication is typically facilitated by a Nobridge admin once both parties are verified and express mutual interest.",
      },
    ],
  },
  {
    category: "For Buyers",
    icon: <Search className="h-5 w-5 mr-2 text-primary" />,
    questions: [
      {
        q: "How do I find business opportunities?",
        a: "You can browse our Marketplace, use advanced filters (industry, location, price, keywords), and search for listings that match your investment criteria.",
      },
      {
        q: "What information can I see on a listing?",
        a: "Anonymous users and unverified buyers see general, anonymized information. Verified buyers (especially those on paid plans) gain access to more detailed business information, financials, and seller-provided documents for verified listings.",
      },
      {
        q: "How do I contact a seller?",
        a: "First, you express interest by making an 'Inquiry' on a listing. If the seller engages and both parties meet verification requirements, a Nobridge admin will facilitate a direct communication channel (in-app messaging).",
      },
      {
        q: "What is the verification process for buyers?",
        a: "Buyer verification typically involves confirming your identity and, for certain access levels, providing information about your investment capacity or focus. This helps sellers engage with serious, credible buyers.",
      },
    ],
  },
  {
    category: "Account & Security",
    icon: <ShieldCheck className="h-5 w-5 mr-2 text-primary" />,
    questions: [
      {
        q: "How is my data protected?",
        a: "Nobridge takes data security seriously. We use industry-standard practices to protect your personal and business information. Please refer to our Privacy Policy for details.",
      },
      {
        q: "How do I reset my password?",
        a: "You can reset your password by clicking the 'Forgot Password' link on the login page and following the instructions sent to your registered email address.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="container py-12 md:py-16">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary font-heading">
            Frequently Asked Questions
          </CardTitle>
          <CardDescription className="text-lg">
            Find answers to common questions about using Nobridge.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-3xl mx-auto">
          {faqs.map((category) => (
            <div key={category.category} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-brand-dark-blue font-heading">
                {category.icon}
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, index) => (
                  <AccordionItem value={`${category.category}-${index}`} key={index}>
                    <AccordionTrigger className="text-left hover:no-underline text-base">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
          
          <div className="mt-12 text-center border-t pt-8">
            <h3 className="text-xl font-semibold mb-3 font-heading">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              If you can't find the answer you're looking for, please don't hesitate to reach out to our support team.
            </p>
            <Button asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
