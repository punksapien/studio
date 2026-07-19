import * as React from "react";

interface DashboardPageShellProps {
  title: string;
  description: string;
  actions?: React.ReactNode; // right-side header actions (buttons, badges, filters) rendered INSIDE the content holder
  headerActions?: React.ReactNode; // actions rendered on the dark title strip, to the right of the title
  scrollable?: boolean; // true = whole content area scrolls (multi-card pages); false = content is fixed, only inner elements (tables) scroll
  children: React.ReactNode;
}

/**
 * Master content holder for every dashboard page: a single viewport-sized box
 * containing the page header (pinned) and the content. By default the content
 * area is FIXED (overflow-hidden) — the page never moves; individual elements
 * like tables scroll internally via `flex-1 min-h-0 overflow-auto`. Pages that
 * are long card stacks (Dashboard, Analytics) opt into `scrollable`.
 */
export function DashboardPageShell({ title, description, actions, headerActions, scrollable = false, children }: DashboardPageShellProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Title + subtext live ABOVE the master content holder, on the dark blue backdrop.
          The sidebar header is pinned to 88px, putting the divider under the logo at
          y=88. The content area has 24px top padding, so a 64px strip puts the
          holder's top edge at exactly y=88 — level with the divider. */}
      <div className="shrink-0 flex items-center justify-between gap-4 pb-2 md:h-[64px] md:pb-4">
        <div className="flex flex-col justify-center gap-0.5 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-white" style={{ fontFamily: "'Satoshi', sans-serif" }}>{title}</h1>
          <p className="text-sm text-white/70">{description}</p>
        </div>
        {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
      </div>
      {/* Master content holder */}
      <div className="flex flex-1 min-h-0 w-full flex-col overflow-hidden border bg-card text-card-foreground">
        <div className={scrollable ? "flex-1 min-h-0 overflow-y-auto p-8" : "flex-1 min-h-0 overflow-hidden p-8"}>
          <div className={scrollable ? "flex min-h-full flex-col gap-6" : "flex h-full min-h-0 flex-col gap-6"}>
            {actions && <div className="flex items-center justify-end gap-2 shrink-0">{actions}</div>}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
