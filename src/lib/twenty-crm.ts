/**
 * Twenty CRM client — pushes verified website sign-ups into the CRM as leads.
 *
 * Lookups go through Twenty's core GraphQL endpoint (`/graphql`) and creates go
 * through the REST endpoint (`/rest/*`) — the same split the CRM's own scripts use
 * (`.crm-fulfillment/import_kmp.py` for lookups, `.crm-migrate/create.py` for creates).
 *
 * Auth is a long-lived API-key JWT in TWENTY_API_TOKEN (minted from the CRM's
 * APP_SECRET; see CRM/.crm-sales-engine/mint_website_token.py). If the token or URL
 * is unset the caller (crm-sync.ts) skips CRM entirely, so this module assumes both
 * are present by the time it runs.
 */

const TWENTY_API_URL = (process.env.TWENTY_API_URL || 'https://crm.nobridge.co').replace(/\/$/, '');
const TWENTY_API_TOKEN = process.env.TWENTY_API_TOKEN || '';
const TWENTY_DEFAULT_OWNER_ID = process.env.TWENTY_DEFAULT_OWNER_ID || '';

const REQUEST_TIMEOUT_MS = 10_000;

export interface SignupLead {
  email: string;
  fullName: string;
  phoneNumber?: string;
  country?: string;
  role: 'buyer' | 'seller';
  companyName?: string;
}

export interface CreatedLead {
  opportunityId: string;
  personId: string;
  /** false when an opportunity already existed for this person (deduped, nothing created) */
  created: boolean;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function twentyFetch(path: string, init: RequestInit): Promise<{ status: number; body: any }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(TWENTY_API_URL + path, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${TWENTY_API_TOKEN}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};
    return { status: res.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

async function graphql(query: string, variables: Record<string, unknown> = {}): Promise<any> {
  const { status, body } = await twentyFetch('/graphql', {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  });
  if (status !== 200 || body.errors) {
    throw new Error(`Twenty GraphQL failed (${status}): ${JSON.stringify(body).slice(0, 500)}`);
  }
  return body.data;
}

async function restCreate(path: string, payload: Record<string, unknown>): Promise<{ id: string }> {
  const { status, body } = await twentyFetch('/rest' + path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const rec = extractRecord(body);
  if (status >= 300 || !rec) {
    throw new Error(`Twenty REST POST ${path} failed (${status}): ${JSON.stringify(body).slice(0, 500)}`);
  }
  return rec;
}

/**
 * Twenty REST wraps a created record as `{ data: { createPerson: {...} } }`.
 * Mirrors the `extract()` helper in the CRM's create.py / import_kmp.py.
 */
function extractRecord(res: any): { id: string } | null {
  if (!res || typeof res !== 'object') return null;
  if (typeof res.id === 'string') return res;
  const data = res.data;
  if (data && typeof data === 'object') {
    for (const value of Object.values(data)) {
      if (value && typeof value === 'object' && typeof (value as any).id === 'string') {
        return value as { id: string };
      }
    }
  }
  return null;
}

export async function findPersonByEmail(email: string): Promise<{ id: string } | null> {
  const data = await graphql(
    `query ($email: String!) {
      people(filter: { emails: { primaryEmail: { eq: $email } } }, first: 1) {
        edges { node { id } }
      }
    }`,
    { email: email.trim().toLowerCase() }
  );
  const edge = data?.people?.edges?.[0];
  return edge ? { id: edge.node.id } : null;
}

export async function findCompanyByName(name: string): Promise<{ id: string } | null> {
  const data = await graphql(
    `query ($name: String!) {
      companies(filter: { name: { eq: $name } }, first: 1) {
        edges { node { id } }
      }
    }`,
    { name: name.trim() }
  );
  const edge = data?.companies?.edges?.[0];
  return edge ? { id: edge.node.id } : null;
}

async function personHasOpportunity(personId: string): Promise<boolean> {
  const data = await graphql(
    `query ($id: UUID!) {
      opportunities(filter: { pointOfContactId: { eq: $id } }, first: 1) {
        edges { node { id } }
      }
    }`,
    { id: personId }
  );
  return Boolean(data?.opportunities?.edges?.length);
}

/**
 * Find-or-create Person (+ Company for sellers) and create an Opportunity at the
 * NEW_LEAD stage tagged source=SIGN_UPS. Idempotent: if the person already has an
 * opportunity we return { created: false } and create nothing new.
 */
export async function createSignupLead(lead: SignupLead): Promise<CreatedLead> {
  const clientType = lead.role === 'seller' ? 'SELL_SIDE' : 'BUY_SIDE';

  // 1. Person — reuse if one already exists for this email.
  const existingPerson = await findPersonByEmail(lead.email);
  let personId: string;
  let companyId: string | undefined;

  // 2. Company (sellers only) — created before the person so we can link them.
  if (lead.role === 'seller' && lead.companyName?.trim()) {
    const existingCompany = await findCompanyByName(lead.companyName);
    companyId = existingCompany
      ? existingCompany.id
      : (await restCreate('/companies', { name: lead.companyName.trim(), clientType })).id;
  }

  if (existingPerson) {
    personId = existingPerson.id;
    // Dedup: an opportunity already exists for this contact — do not create a second.
    if (await personHasOpportunity(personId)) {
      return { opportunityId: '', personId, created: false };
    }
  } else {
    const { firstName, lastName } = splitName(lead.fullName);
    const personPayload: Record<string, unknown> = {
      name: { firstName, lastName },
      emails: { primaryEmail: lead.email.trim() },
    };
    if (lead.phoneNumber?.trim()) {
      personPayload.phones = { primaryPhoneNumber: lead.phoneNumber.trim() };
    }
    if (companyId) personPayload.companyId = companyId;
    personId = (await restCreate('/people', personPayload)).id;
  }

  // 3. Opportunity at the top of the pipeline, tagged as a website sign-up.
  const opportunityName =
    lead.role === 'seller' && lead.companyName?.trim()
      ? `${lead.companyName.trim()} (Website Sign-Up)`
      : `${lead.fullName.trim() || lead.email} (Website Sign-Up)`;

  const opportunityPayload: Record<string, unknown> = {
    name: opportunityName,
    stage: 'NEW_LEAD',
    clientType,
    source: 'SIGN_UPS',
    pointOfContactId: personId,
  };
  if (companyId) opportunityPayload.companyId = companyId;
  if (TWENTY_DEFAULT_OWNER_ID) opportunityPayload.ownerId = TWENTY_DEFAULT_OWNER_ID;

  const opportunity = await restCreate('/opportunities', opportunityPayload);
  return { opportunityId: opportunity.id, personId, created: true };
}
