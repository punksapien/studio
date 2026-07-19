import * as React from "react";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode; // right-side actions (buttons, badges, filters)
}

export function AdminPageHeader({ title, description, children }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight font-heading text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

// AdminPageShell now lives in the shared components as DashboardPageShell.
// Re-exported here under its original name so admin importers stay unchanged.
export { DashboardPageShell as AdminPageShell } from '@/components/shared/dashboard-page-shell';
