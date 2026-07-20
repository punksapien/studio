'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { DashboardPageShell } from "@/components/shared/dashboard-page-shell";

const settingsMenu = [
  {
    href: "/seller-dashboard/settings/profile-preferences",
    icon: SlidersHorizontal,
    title: "Profile Preferences",
    description: "Your business profile and notification preferences.",
  },
  {
    href: "/seller-dashboard/settings/account-management",
    icon: ShieldCheck,
    title: "Account Management",
    description: "Your name, phone, password, and account status.",
  },
];

export default function SellerSettingsPage() {
  return (
    <DashboardPageShell scrollable title="Settings" description="Manage your profile preferences and account.">
      <div className="space-y-4">
        {settingsMenu.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </DashboardPageShell>
  );
}
