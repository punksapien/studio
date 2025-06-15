"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "@/hooks/use-toast";

function NoticeListenerContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const notice = searchParams.get("notice");
    if (notice === "complete_onboarding") {
      toast({
        title: "Complete onboarding first",
        description: "Please finish onboarding before accessing your dashboard or the marketplace.",
      });
    }

    if (notice === "complete_previous_step") {
      toast({
        title: "Please follow the onboarding steps in order",
        description: "Complete the current step before moving to the next one.",
      });
    }

    // Remove the notice param to avoid repeated toasts on navigation
    const params = new URLSearchParams(searchParams.toString());
    params.delete("notice");
    router.replace(pathname + (params.toString() ? `?${params.toString()}` : ""), { scroll: false });
  }, [searchParams, pathname, router]);

  return null;
}

export default function NoticeListener() {
  return (
    <Suspense fallback={null}>
      <NoticeListenerContent />
    </Suspense>
  );
}
