# UPDATES — Dashboard Rework (July 18–19, 2026)

> Session-handoff file. Read this first in the next session before going live (Studio deploy).
> Status: pushed to VAV-2-TECH `master`; NOT yet deployed live.

## What shipped in this push

### Flat admin-style redesign of BOTH dashboards
- **Seller** (`src/app/seller-dashboard/**`) and **Buyer** (`src/app/dashboard/**`) fully restyled to match the admin design language: sharp edges + zero shadows (enforced by per-area `seller-flat` / `buyer-flat` body classes injected by each layout, same mechanism as admin's `admin-flat`), dark-blue backdrop with white title strip, white bordered "master content holder" on every page, `font-semibold` max, flat `h-11 rounded-none` sidebar items with dark-blue active fill, logout (red) + "Back to Homepage" pinned to the sidebar footer.
- **Shared components extracted**: `src/components/shared/dashboard-page-shell.tsx` (`DashboardPageShell` — the master holder; has an `actions` slot inside the holder and a `headerActions` slot on the dark title strip) and `src/components/shared/metric-card.tsx`. Admin files re-export them (`src/components/admin/page-header.tsx`, `metric-card.tsx` are now shims) — zero admin page changes.
- **Sidebar width fix**: `shrink-0` added to the `<Sidebar>` in all three layouts (admin/buyer/seller) — they were being flex-squeezed to different widths per dashboard; all now render at the intended 19rem/304px.

### Seller UX declutter (most sellers have 0–1 listings)
- **Nav merged to 6 items**: "Create Listing" merged into "My Listings"; "My Profile" merged into Settings ("Profile & Account Management" is the first Settings card → "Edit My Seller Profile" opens the profile flow, which has a "Back to Settings" strip button). Settings stays highlighted on `/seller-dashboard/profile`.
- **My Listings = one listing per page**: full-holder card (image = top-left quarter, edge-to-edge; status + title + location + quick facts beside it; About/Key Strengths/Growth Opportunities + light-blue stat tiles (`bg-brand-light-gray`) + equal-width action row below). Pager ("‹ Listing N of M ›") only when >1 listing; 0 listings = full-page create CTA; "Create New Listing" as a white-outline button on the title strip (only when listings exist). Create page has "Back to My Listings" + draft auto-restore via `useFormPersistence` (verified: restores on mount, clears only on submit).
- **Badges unified**: verification badge (on image) and status badges share one geometry (`text-xs font-medium py-1 px-2.5`, 3.5-icon), aligned at the same top offset.
- **My Inquiries**: all action-row buttons equalized (`grid grid-flow-col auto-cols-fr`); "Engage in Conversation" → "Engage".

### Notifications (both dashboards)
- **New API**: `src/app/api/notifications/route.ts` — GET (list + `unread_count`, `?limit=`, `?unread_only=`) and PATCH (mark-one / `mark_all`), auth-gated via `AuthenticationService`, scoped to the user, works for both roles. The `notifications` table + RLS already existed (`001_initial_schema.sql`); NO migration was needed.
- Both notifications pages rebuilt on the real API (placeholder data removed) with optimistic mark-read, "Mark all as read", and a boxed internally-scrolling list.

## NOT committed (still local-only in the working tree)

1. **`src/app/dev-preview/**`** — no-login previews of both dashboards (mock fetch + supabase session stub + click-rewriter). Marked `// TEMPORARY DEV PREVIEW — do not commit / remove before deploy`. Kept local for QA: `localhost:9002/dev-preview` (index), `/dev-preview/seller-dashboard/listings` (+ `?preview_empty=1`), `/dev-preview/dashboard`.
2. **`src/components/layout/GlobalLayoutWrapper.tsx`** — its only uncommitted change is the dev-preview navbar exclusion (temporary, preview-only).
3. **Signup-flow rework files (pre-existing, separate workstream)**: `src/app/(auth)/verify-email/page.tsx`, `src/app/onboarding/{buyer,seller}/**`, `src/components/auth/auth-card-wrapper.tsx`, `src/components/onboarding/steps/contact-step.tsx`, `src/middleware.ts` (also carries the temporary `/dev-preview` whitelist at ~line 65). See `../SIGNUP-CRM-CHAT-DEPLOY-HANDOFF.md`. Decide separately when to commit these.

## Go-live checklist (next session, before Studio deploy)

1. Confirm VAV-2-TECH master builds green (this push was locally `npm run build`-verified; typecheck baseline remains dirty ~178 pre-existing errors — none introduced by this work; one pre-existing error even fixed: missing `Briefcase` import in buyer listings).
2. Decide on the signup-flow files (item 3 above) — commit/push them or hold.
3. Delete `src/app/dev-preview/` + revert the `GlobalLayoutWrapper.tsx` dev-preview lines + remove middleware's `/dev-preview` whitelist line before/when going live (they're not in the pushed commit, so live deploy from a clean clone is already safe — this is local hygiene).
4. Verification status labels: keep using shared `VerificationStatusBadge` semantics (Not Verified / Pending Verification / Verified / Rejected).
5. Smoke-test as a real seller + buyer on staging: sidebar (6 seller items), listings pager + create draft-restore, notifications mark-read, inquiries engage flow.

## Known nits (non-blocking, deliberate deferrals)
- Messages inbox (both dashboards) still placeholder data and hidden from nav — needs a conversations-list endpoint.
- Settings "Deactivate/Delete Account" buttons visibly disabled ("Coming soon") — endpoints not built.
- Draft listings show "Processing" as the 4th action button label (pre-existing status-label fallback; reads oddly for drafts).
- Mobile (<768px): listing titles truncate aggressively; sidebar collapses into a Sheet (works, but not polished).
- `/admin/login` shows an endless spinner in HEADLESS screenshot tools only (real-network wait vs virtual time) — renders fine in a real browser.
