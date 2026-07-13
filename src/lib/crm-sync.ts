/**
 * CRM sync orchestrator — runs after a website sign-up's email is verified.
 *
 * Wiring: the verify-otp and verify-email-bypass API routes call
 * `after(() => handleVerifiedSignup(email, requestId))` (Next.js `after()`), so this
 * runs AFTER the HTTP response is sent. Verification therefore never fails or slows
 * down because the CRM or Google Chat is unreachable.
 *
 * Behaviour:
 *  - No-ops silently if the integration env vars are unset (local dev / preview).
 *  - Idempotent: skips if the user's metadata already has `crm_synced_at`, and the
 *    CRM push itself dedups by email (see twenty-crm.ts).
 *  - Best-effort: each step is isolated; errors are logged as [CRM-SYNC-*], never thrown.
 *  - `crm_synced_at` is only stamped when BOTH the CRM push and Chat ping succeed, so a
 *    re-verification naturally retries a partial failure.
 */
import { supabaseAdmin } from './supabase-admin';
import { createSignupLead, type SignupLead } from './twenty-crm';
import { postSignupCard, hasAnyChatWebhook } from './google-chat';

function isConfigured(): boolean {
  return Boolean(process.env.TWENTY_API_TOKEN) && hasAnyChatWebhook();
}

/** Supabase admin has no getUserByEmail, so page through listUsers (mirrors register/route.ts). */
async function findUserByEmail(email: string) {
  const target = email.trim().toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < perPage) break; // last page reached
  }
  return null;
}

export async function handleVerifiedSignup(email: string, requestId: string): Promise<void> {
  const tag = `[CRM-SYNC-${requestId}]`;
  try {
    if (!isConfigured()) {
      console.log(`${tag} Skipping — CRM/Chat env vars not configured`);
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      console.error(`${tag} No auth user found for ${email} — cannot sync`);
      return;
    }

    const metadata = (user.user_metadata || {}) as Record<string, unknown>;
    if (metadata.crm_synced_at) {
      console.log(`${tag} Already synced at ${metadata.crm_synced_at} — skipping`);
      return;
    }

    const role = metadata.role === 'seller' ? 'seller' : 'buyer';
    const lead: SignupLead = {
      email,
      fullName: (metadata.full_name as string) || '',
      phoneNumber: (metadata.phone_number as string) || undefined,
      country: (metadata.country as string) || undefined,
      role,
      companyName: (metadata.initial_company_name as string) || undefined,
    };

    // 1. Create the CRM lead. On failure, still post a degraded Chat card so the
    //    human action item survives, then bail (no crm_synced_at → retry next time).
    let opportunityId: string | undefined;
    let crmOk = false;
    try {
      const result = await createSignupLead(lead);
      opportunityId = result.opportunityId || undefined;
      crmOk = true;
      console.log(
        `${tag} CRM ${result.created ? 'created' : 'deduped'} lead for ${email}` +
          (result.opportunityId ? ` (opp ${result.opportunityId})` : '')
      );
    } catch (err) {
      console.error(`${tag} CRM push failed:`, err);
    }

    // 2. Post the Google Chat notification (degraded card if CRM failed).
    let chatOk = false;
    try {
      await postSignupCard(lead, opportunityId);
      chatOk = true;
      console.log(`${tag} Google Chat notified for ${email}`);
    } catch (err) {
      console.error(`${tag} Google Chat post failed:`, err);
    }

    // 3. Stamp crm_synced_at only on full success (preserve existing metadata).
    if (crmOk && chatOk) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...metadata, crm_synced_at: new Date().toISOString() },
      });
      if (error) console.error(`${tag} Failed to stamp crm_synced_at:`, error.message);
    } else {
      console.warn(`${tag} Partial sync (crm=${crmOk}, chat=${chatOk}) — will retry on re-verification`);
    }
  } catch (err) {
    // Absolute backstop — this runs in after(), must never surface.
    console.error(`${tag} Unexpected error:`, err);
  }
}
