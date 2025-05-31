import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="container py-12 md:py-16">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center text-primary">About Nobridge</CardTitle>
          <CardDescription className="text-center text-lg">
            Connecting SME owners with motivated buyers across Asia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-lg">
            Nobridge was founded with a clear vision: to create a trusted and efficient platform that bridges the gap between Small and Medium Enterprise (SME) owners looking to sell their businesses and motivated buyers seeking promising opportunities.
          </p>

          <div className="mx-auto max-w-2xl">
            <img
              src="/api/placeholder/600/300"
              alt="Nobridge Team Meeting"
              className="rounded-lg shadow-lg w-full"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="text-xl font-semibold mb-3">For Business Sellers</h3>
              <p>We provide a secure, professional environment where you can showcase your business to qualified buyers while maintaining confidentiality throughout the process.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">For Business Buyers</h3>
              <p>Access vetted business opportunities, detailed financial information, and direct communication channels with verified sellers across Asia's dynamic markets.</p>
            </div>
          </div>

          <p className="text-lg font-medium">
            Whether you are an entrepreneur looking for your next chapter or an investor seeking promising ventures, Nobridge is your dedicated partner in navigating the Asian business marketplace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
