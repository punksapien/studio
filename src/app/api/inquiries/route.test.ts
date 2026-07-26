import { describe, it, expect, beforeEach, vi } from 'vitest';

// Shared mock for AuthenticationService — the inquiries route calls
// `AuthenticationService.getInstance().authenticateUser(request)`.
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock('@/lib/auth-service', () => {
  class AuthenticationService {
    authenticateUser = authMock;
    static getInstance() {
      return { authenticateUser: authMock };
    }
  }
  return { AuthenticationService };
});

import { POST } from '@/app/api/inquiries/route';

function makeRequest() {
  return new Request('http://x/api/inquiries', {
    method: 'POST',
    body: JSON.stringify({ listing_id: 'x' }),
  });
}

describe('POST /api/inquiries — buyer verification lockdown', () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('returns 403 verification_required for an unverified buyer', async () => {
    authMock.mockResolvedValue({
      success: true,
      user: { id: 'b1' },
      profile: { role: 'buyer', verification_status: 'pending_verification' },
    });

    const res = await POST(makeRequest() as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('verification_required');
  });

  it('does not return the verification 403 for a verified buyer', async () => {
    authMock.mockResolvedValue({
      success: true,
      user: { id: 'b1' },
      profile: { role: 'buyer', verification_status: 'verified' },
    });

    const res = await POST(makeRequest() as any);
    // Verified buyers pass the lockdown gate; the request then fails later on
    // the mocked/unreachable DB. Assert only that it is NOT the verification 403.
    const notVerification403 = res.status !== 403;
    let body: any = {};
    try {
      body = await res.json();
    } catch {
      // ignore body parse issues — status check is sufficient
    }
    expect(notVerification403 || body.code !== 'verification_required').toBe(true);
  });
});
