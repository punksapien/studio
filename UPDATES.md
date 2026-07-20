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

---

# UPDATES — Admin-Managed Listings + Seller Concierge Onboarding (July 19–20, 2026)

> Second push on top of the dashboard rework. Committed to VAV-2-TECH (feature branch). Two DB migrations are PENDING — they must be applied with `supabase db push` at deploy time (validated via `--dry-run` only; local Docker unavailable).

## Concierge model: sellers are hands-off, admins run listings
- **Sellers can no longer create/edit/deactivate/appeal listings.** All those paths return 403 server-side (`POST /api/listings`, `PUT/PATCH/DELETE /api/listings/[id]`, `PUT /api/listings/[id]/status`); appeal POST returns 410. The seller-create/edit pages were deleted (seller + legacy buyer). Seller "My Listings" is now read-only with a "managed by the Nobridge team" notice and a public-listing link when live.
- **Admins own the full lifecycle.** New `POST /api/admin/listings` (create on behalf of a seller) + new page `src/app/admin/listings/create/` with a `SellerPicker` (`src/components/admin/seller-picker.tsx`); existing edit/approve/reject/status tools unchanged. The `~45` editable-field whitelist was extracted to `src/lib/admin-listing-fields.ts` (shared by create + edit). Fixed a latent bug: the admin edit PATCH audit insert used non-existent columns (`admin_id`/`action`/`details`) and silently failed — now writes the real schema (`admin_user_id`/`action_type: 'edited'`/`admin_notes`) and the GET join FK was corrected.
- **Direct seller verification (no request needed).** New `PATCH /api/admin/users/[userId]` (`action: 'verify_seller' | 'revoke_seller_verification'`) sets `user_profiles.verification_status` via service role; a DB trigger syncs `listings.is_seller_verified`; closes any open queue requests; audits to `admin_actions`; notifies the seller. UI card on `src/app/admin/users/[userId]/page.tsx`.

## Verification is team-initiated + pre-verification lockdown
- Seller "Verification" nav item removed. Sellers can no longer self-request verification (`POST /api/verification/request` 403s sellers; buyers unaffected). The seller verification page is now a passive status display.
- **New Onboarding page** `src/app/seller-dashboard/onboarding/page.tsx`: greets the seller by name, explains the team will verify them within 72 hours, and offers optional extra contact fields (Additional Email / Additional Phone).
- **Pre-verification lockdown, enforced in TWO layers:**
  - Client: seller layout (`src/app/seller-dashboard/layout.tsx`) pins "Onboarding" on top and greys/disables every nav item except Settings (no lock icon, non-clickable).
  - Server: `src/middleware.ts` redirects any unverified seller hitting a locked `/seller-dashboard/*` route to `/seller-dashboard/onboarding` (allowed prefixes: onboarding, settings, profile). This closes the JS-off / direct-URL / re-login bypass. Auto-unlocks the moment `verification_status === 'verified'`; the onboarding page also refreshes auth on focus + every 60s so a just-verified seller unlocks within ~1 min.
- **Verified end-to-end** with a throwaway remote seller (created via service role to avoid firing the signup→CRM/Chat integration, then deleted): unverified → locked routes 307 to onboarding, allowed routes 200, write APIs 403; flipped to verified → all routes 200. `npm run build` green; typecheck steady at the ~132 baseline (down from ~190).

## New DB migrations (PENDING — apply at deploy)
1. `supabase/migrations/20260719092739_admin_managed_listings.sql` — drops the seller INSERT/UPDATE RLS policies on `listings`; widens `admin_listing_actions_action_type_check` to add `created`/`edited`.
2. `supabase/migrations/20260720050554_seller_additional_contact.sql` — adds `user_profiles.additional_email` / `additional_phone` (whitelisted in `PUT /api/auth/update-profile`, shown on the admin user page).
Until these are pushed, seller listing writes are blocked at the API layer regardless; the RLS drop is defense-in-depth.

## Signup-flow rework — now committed
The previously-deferred signup-flow files (item 3 of the prior push: `verify-email`, `onboarding/{buyer,seller}`, `auth-card-wrapper`, `contact-step`, plus the middleware changes) are included in this commit since they are intertwined with the new middleware verification gate and the tree builds green.

## Still NOT committed (local-only)
- `src/app/dev-preview/**` — no-login previews (now includes a seller Onboarding preview + a dev-only `?preview_status=` override on the verification/onboarding pages). Still `// TEMPORARY DEV PREVIEW`. `src/middleware.ts` `/dev-preview` whitelist and the `GlobalLayoutWrapper.tsx` dev-preview exclusion ARE committed (harmless in prod — a whitelisted path with no committed page just 404s), but the preview page tree itself is not. Strip/ignore before Studio go-live.

## Go-live additions for this push
1. `supabase db push` the two pending migrations (verify with `supabase migration list` first).
2. Delete `src/app/dev-preview/**` (and optionally the middleware `/dev-preview` whitelist + `GlobalLayoutWrapper` lines) before Studio deploy.
3. Smoke-test: unverified seller sees only Onboarding + Settings and is redirected off locked routes; admin can create a listing on behalf of a seller and verify a seller directly; verified seller has full access.
- Mobile (<768px): listing titles truncate aggressively; sidebar collapses into a Sheet (works, but not polished).
- `/admin/login` shows an endless spinner in HEADLESS screenshot tools only (real-network wait vs virtual time) — renders fine in a real browser.
