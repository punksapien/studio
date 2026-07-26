/**
 * Google Chat notifier — posts a "new website sign-up" card to a dedicated space.
 *
 * Uses a Google Chat incoming webhook (GOOGLE_CHAT_SIGNUPS_WEBHOOK_URL); no OAuth or
 * Google API client needed. Card format (cardsV2) mirrors the CRM's own digest.py.
 *
 * If opportunityId is omitted (the CRM push failed), the card degrades to a
 * "create this lead manually" warning so the human action item survives a CRM outage.
 */
import type { SignupLead } from './twenty-crm';

// Sign-ups are routed to side-specific spaces: sellers → sell-side, buyers → buy-side.
const BUYSIDE_WEBHOOK_URL = process.env.GOOGLE_CHAT_BUYSIDE_WEBHOOK_URL || '';
const SELLSIDE_WEBHOOK_URL = process.env.GOOGLE_CHAT_SELLSIDE_WEBHOOK_URL || '';
// Dedicated space for M&A assessment popup leads (separate from sign-up spaces).
const LEADS_WEBHOOK_URL = process.env.GOOGLE_CHAT_LEADS_WEBHOOK_URL || '';
const CRM_BASE = (process.env.TWENTY_API_URL || 'https://crm.nobridge.co').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 10_000;

function webhookForRole(role: SignupLead['role']): string {
  return role === 'seller' ? SELLSIDE_WEBHOOK_URL : BUYSIDE_WEBHOOK_URL;
}

/** True if at least one side's webhook is configured (used by the caller's env guard). */
export function hasAnyChatWebhook(): boolean {
  return Boolean(BUYSIDE_WEBHOOK_URL || SELLSIDE_WEBHOOK_URL);
}

/** True if the M&A assessment leads webhook is configured (used by the caller's env guard). */
export function hasLeadsChatWebhook(): boolean {
  return Boolean(LEADS_WEBHOOK_URL);
}

/** Escape user-supplied text for Google Chat's limited HTML-ish formatting. */
function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Post a "new M&A assessment request" card to the leads Google Chat space. */
export async function postMaAssessmentCard(email: string): Promise<void> {
  if (!LEADS_WEBHOOK_URL) {
    throw new Error(
      'No Google Chat webhook configured for M&A assessment leads ' +
        '(set GOOGLE_CHAT_LEADS_WEBHOOK_URL)'
    );
  }

  const card = {
    cardsV2: [
      {
        cardId: `ma-assessment-${email}`,
        card: {
          header: {
            title: '🆕 New M&A Assessment Request',
            subtitle: 'Action: follow up with this lead',
          },
          sections: [
            {
              widgets: [{ decoratedText: { topLabel: 'Email', text: esc(email) } }],
            },
          ],
        },
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(LEADS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(card),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      throw new Error(`Google Chat post failed (${res.status}): ${detail}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function postSignupCard(lead: SignupLead, opportunityId?: string): Promise<void> {
  const webhookUrl = webhookForRole(lead.role);
  if (!webhookUrl) {
    throw new Error(
      `No Google Chat webhook configured for ${lead.role} ` +
        `(set GOOGLE_CHAT_${lead.role === 'seller' ? 'SELLSIDE' : 'BUYSIDE'}_WEBHOOK_URL)`
    );
  }

  const roleLabel = lead.role === 'seller' ? 'SELLER' : 'BUYER';

  const widgets: Record<string, unknown>[] = [
    { decoratedText: { topLabel: 'Name', text: `<b>${esc(lead.fullName || '—')}</b>` } },
    { decoratedText: { topLabel: 'Email', text: esc(lead.email) } },
  ];
  if (lead.country?.trim()) {
    widgets.push({ decoratedText: { topLabel: 'Country', text: esc(lead.country.trim()) } });
  }
  if (lead.phoneNumber?.trim()) {
    widgets.push({ decoratedText: { topLabel: 'Phone', text: esc(lead.phoneNumber.trim()) } });
  }
  if (lead.role === 'seller' && lead.companyName?.trim()) {
    widgets.push({ decoratedText: { topLabel: 'Company', text: esc(lead.companyName.trim()) } });
  }

  if (opportunityId) {
    widgets.push({
      buttonList: {
        buttons: [
          {
            text: 'Open in CRM',
            onClick: { openLink: { url: `${CRM_BASE}/object/opportunity/${opportunityId}` } },
          },
        ],
      },
    });
  } else {
    widgets.push({
      decoratedText: {
        text: '⚠️ <b>CRM sync failed</b> — create this lead manually.',
        wrapText: true,
      },
    });
  }

  const card = {
    cardsV2: [
      {
        cardId: `signup-${opportunityId || lead.email}`,
        card: {
          header: {
            title: `🆕 New Website Sign-Up — ${roleLabel}`,
            subtitle: 'Action: contact this lead (24h SLA)',
          },
          sections: [{ widgets }],
        },
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(card),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      throw new Error(`Google Chat post failed (${res.status}): ${detail}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
