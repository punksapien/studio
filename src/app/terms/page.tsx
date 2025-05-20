import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container py-12 md:py-16">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center text-primary">Terms of Service</CardTitle>
          <p className="text-muted-foreground text-center mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert">
          <p>Welcome to BizMatch Asia! These Terms of Service ("Terms") govern your use of our website, platform, and services (collectively, "Services"). Please read them carefully.</p>

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, do not use our Services.</p>

          <h2>2. Description of Service</h2>
          <p>BizMatch Asia provides an online marketplace to connect individuals and entities looking to sell businesses (Sellers) with those interested in acquiring or investing in businesses (Buyers). We facilitate initial introductions and may offer verification services.</p>

          <h2>3. User Accounts and Registration</h2>
          <p>You must register for an account to access certain features. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for safeguarding your password and for all activities that occur under your account.</p>

          <h2>4. User Conduct</h2>
          <p>You agree not to misuse the Services or help anyone else to do so. This includes, but is not limited to: posting false or misleading information, infringing on intellectual property rights, harassing others, or engaging in any illegal activities.</p>
          
          <h2>5. Listings and Content</h2>
          <p>Sellers are solely responsible for the accuracy, legality, and content of their business listings. BizMatch Asia does not guarantee the accuracy of any listing or the financial viability of any business opportunity presented.</p>
          <p>Buyers are responsible for conducting their own due diligence before entering into any transaction.</p>

          <h2>6. Verification Services</h2>
          <p>BizMatch Asia may offer verification services for Sellers and Buyers. This process involves manual checks and aims to enhance trust but does not constitute an endorsement or guarantee of any user or listing.</p>

          <h2>7. Fees and Payments</h2>
          <p>Certain services, such as "Verified Seller" or "Verified Buyer" status, may require a subscription fee. All fees are non-refundable except as required by law. We use third-party payment processors (e.g., Stripe) to handle payments.</p>

          <h2>8. Disclaimers</h2>
          <p>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. BIZMATCH ASIA DISCLAIMS ALL WARRANTIES, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>

          <h2>9. Limitation of Liability</h2>
          <p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, BIZMATCH ASIA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES; OR (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</p>
          
          <h2>10. Modifications to Terms</h2>
          <p>BizMatch Asia reserves the right to modify these Terms at any time. We will provide notice of any significant changes. Your continued use of the Services after such changes constitutes your acceptance of the new Terms.</p>

          <h2>11. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of Singapore, without regard to its conflict of law principles.</p>

          <h2>12. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at <a href="mailto:legal@bizmatch.asia" className="text-primary hover:underline">legal@bizmatch.asia</a>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
