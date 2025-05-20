
// This file is no longer needed as it's been replaced by:
// - src/app/admin/verification-queue/buyers/page.tsx
// - src/app/admin/verification-queue/sellers/page.tsx
// Please remove this file from the project.
// Keeping a placeholder to prevent build errors if old links exist.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function VerificationQueueRedirectPage() {
  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>Verification Queues</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page has been split into specific queues:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><Link href="/admin/verification-queue/buyers" className="text-primary hover:underline">Buyer Verification Queue</Link></li>
            <li><Link href="/admin/verification-queue/sellers" className="text-primary hover:underline">Seller & Listing Verification Queue</Link></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
