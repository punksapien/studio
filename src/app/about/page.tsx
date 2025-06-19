
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { NobridgeIcon } from "@/components/ui/nobridge-icon";

export default function AboutPage() {
  return (
    <div className="container py-12 md:py-16">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center text-primary font-heading">About Nobridge</CardTitle>
          <CardDescription className="text-center text-lg">
            Connecting SME owners with motivated buyers across Asia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-lg">
            Nobridge was founded with a clear vision: to create a trusted and efficient platform that bridges the gap between Small and Medium Enterprise (SME) owners looking to sell their businesses and motivated buyers seeking promising opportunities.
          </p>

          <div className="mx-auto max-w-2xl">
            <Image
              src="/assets/about-us.jpg"
              alt="Nobridge Team Working"
              width={600}
              height={300}
              className="rounded-lg shadow-lg w-full"
              data-ai-hint="team collaboration office"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-left pt-6">
            <div className="flex flex-col items-center md:items-start p-4">
              <NobridgeIcon icon="business-listing" size="xl" className="mb-3" />
              <h3 className="text-xl font-semibold mb-3 font-heading">For Business Sellers</h3>
              <p className="text-center md:text-left">We provide a secure, professional environment where you can showcase your business to qualified buyers while maintaining confidentiality throughout the process.</p>
            </div>
            <div className="flex flex-col items-center md:items-start p-4">
               <NobridgeIcon icon="investment" size="xl" className="mb-3" />
              <h3 className="text-xl font-semibold mb-3 font-heading">For Business Buyers</h3>
              <p className="text-center md:text-left">Access vetted business opportunities, detailed financial information, and direct communication channels with verified sellers across Asia&apos;s dynamic markets.</p>
            </div>
          </div>

          <p className="text-lg font-medium pt-4">
            Whether you are an entrepreneur looking for your next chapter or an investor seeking promising ventures, Nobridge is your dedicated partner in navigating the Asian business marketplace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
