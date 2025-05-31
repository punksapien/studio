
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container py-12 md:py-16">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center text-primary font-heading">Terms of Service</CardTitle>
          <p className="text-muted-foreground text-center mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-4xl font-bold text-center text-primary mb-8 font-heading">Terms of Service</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 font-heading">1. Introduction</h2>
              <p>Welcome to Nobridge! These Terms of Service ("Terms") govern your use of our website, platform, and services (collectively, "Services"). Please read them carefully.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 font-heading">2. Services</h2>
              <p>Nobridge provides an online marketplace to connect individuals and entities looking to sell businesses (Sellers) with those interested in acquiring or investing in businesses (Buyers). We facilitate introductions but do not participate in transactions.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 font-heading">3. User Responsibilities</h2>
              <p>Sellers are solely responsible for the accuracy, legality, and content of their business listings. Nobridge does not guarantee the accuracy of any listing or the financial viability of any business opportunity presented.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 font-heading">4. Verification</h2>
              <p>Nobridge may offer verification services for Sellers and Buyers. This process involves manual checks and aims to enhance trust but does not constitute an endorsement or guarantee of any user or listing.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 font-heading">5. Disclaimer</h2>
              <p>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. NOBRIDGE DISCLAIMS ALL WARRANTIES, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 font-heading">6. Limitation of Liability</h2>
              <p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, NOBRIDGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 font-heading">7. Changes to Terms</h2>
              <p>Nobridge reserves the right to modify these Terms at any time. We will provide notice of any significant changes. Your continued use of the Services after such changes constitutes your acceptance of the new Terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 font-heading">8. Contact</h2>
              <p>If you have any questions about these Terms, please contact us at <a href="mailto:legal@nobridge.asia" className="text-primary hover:underline">legal@nobridge.asia</a>.</p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
