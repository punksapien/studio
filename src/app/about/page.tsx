import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="container py-12 md:py-16">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center text-primary">About BizMatch Asia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-lg text-foreground">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="leading-relaxed">
                BizMatch Asia was founded with a clear vision: to create a trusted and efficient platform that bridges the gap between Small and Medium Enterprise (SME) owners looking to sell their businesses and motivated investors or buyers across the dynamic Asian market.
              </p>
              <p className="mt-4 leading-relaxed">
                We understand the unique challenges and opportunities within the Asian business landscape. Our mission is to simplify the complex process of business acquisition by providing a secure marketplace, robust verification processes, and fostering meaningful connections.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-md">
              <Image 
                src="https://placehold.co/600x400.png" 
                alt="BizMatch Asia Team Meeting" 
                width={600} 
                height={400}
                className="object-cover w-full h-full"
                data-ai-hint="team meeting office" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Our Values</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><span className="font-medium text-foreground">Trust & Transparency:</span> We prioritize building a secure environment through manual verification and clear communication.</li>
              <li><span className="font-medium text-foreground">Connection & Opportunity:</span> We believe in the power of connecting the right people to unlock business potential.</li>
              <li><span className="font-medium text-foreground">Simplicity & Efficiency:</span> We strive to make the process of buying or selling a business as straightforward as possible.</li>
              <li><span className="font-medium text-foreground">Focus on Asia:</span> Our expertise is dedicated to the unique dynamics of the Asian SME market.</li>
            </ul>
          </div>
          
          <p className="leading-relaxed">
            Whether you are an entrepreneur looking for your next chapter or an investor seeking promising ventures, BizMatch Asia is your dedicated partner in navigating the Asian business marketplace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
