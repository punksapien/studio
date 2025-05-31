import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container py-12 md:py-16">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center text-primary">Privacy Policy</CardTitle>
          <p className="text-muted-foreground text-center mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert">
          <p>Nobridge ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, platform, and services (collectively, "Services").</p>

          <h2>1. Information We Collect</h2>
          <p>We may collect personal information that you provide directly to us, such as:</p>
          <ul>
            <li><strong>Account Information:</strong> Full name, email address, password, phone number, country, role (Seller/Buyer), and other profile details.</li>
            <li><strong>Listing Information (Sellers):</strong> Business details (anonymous and verified), financial summaries, supporting documents, and reasons for selling.</li>
            <li><strong>Application Information (Buyers/Sellers for Verification):</strong> Business registration details, proof of identity, investment thesis, and other information required for verification.</li>
            <li><strong>Communications:</strong> Information you provide when you contact us or communicate with other users through the platform.</li>
          </ul>
          <p>We may also collect certain information automatically when you use our Services, such as IP address, browser type, operating system, usage data, and cookies.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain our Services.</li>
            <li>Process your registration and manage your account.</li>
            <li>Facilitate communication between Buyers and Sellers.</li>
            <li>Conduct verification processes for users and listings.</li>
            <li>Personalize and improve your experience on our platform.</li>
            <li>Send you notifications, updates, and administrative messages.</li>
            <li>Respond to your inquiries and provide customer support.</li>
            <li>Process payments for subscription services.</li>
            <li>Comply with legal obligations and protect our rights.</li>
          </ul>

          <h2>3. How We Share Your Information</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>With Other Users:</strong> Information you choose to display on your profile or listings will be visible to other users as per platform functionality (e.g., anonymous details to all, verified details to verified users).</li>
            <li><strong>Service Providers:</strong> We may share information with third-party vendors and service providers who perform services on our behalf, such as payment processing (e.g., Stripe), data hosting, email delivery, and customer support.</li>
            <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
            <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
            <li><strong>To Protect Our Rights:</strong> We may disclose information to protect and defend our rights or property, or the safety of our users or the public.</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, use, or disclosure. However, no internet transmission or electronic storage is 100% secure, so we cannot guarantee absolute security.</p>

          <h2>5. Data Retention</h2>
          <p>We will retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.</p>

          <h2>6. Your Choices and Rights</h2>
          <p>You may have certain rights regarding your personal information, subject to local data protection laws. These may include the right to access, correct, update, or delete your information. You can typically manage your account information through your dashboard or by contacting us.</p>

          <h2>7. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar tracking technologies to collect information about your browsing activities and preferences. You can manage your cookie preferences through your browser settings.</p>

          <h2>8. Third-Party Links</h2>
          <p>Our Services may contain links to third-party websites or services. We are not responsible for the privacy practices of such third parties. We encourage you to read their privacy policies.</p>

          <h2>9. Children's Privacy</h2>
          <p>Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.</p>

          <h2>10. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on our platform and updating the "Last Updated" date.</p>

          <h2>11. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@nobridge.asia" className="text-primary hover:underline">privacy@nobridge.asia</a>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
