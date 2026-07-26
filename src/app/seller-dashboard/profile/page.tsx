'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SellerProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/seller-dashboard/settings');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting…</p>
      </div>
    </div>
  );
}
