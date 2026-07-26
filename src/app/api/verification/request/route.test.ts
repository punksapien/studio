import { describe, it, expect, beforeEach, vi } from 'vitest';

// The verification/request route constructs `new AuthenticationService()` then
// calls `authService.authenticateUser(request)`.
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

import { POST } from '@/app/api/verification/request/route';

function makeRequest() {
  return new Request('http://x/api/verification/request', {
    method: 'POST',
    body: JSON.stringify({ request_type: 'user_verification', reason: 'test' }),
  });
}

describe('POST /api/verification/request — buyer lockdown', () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('returns 403 with the team message for an unverified buyer under lockdown', async () => {
    authMock.mockResolvedValue({
      success: true,
      user: { id: 'b1' },
      profile: { role: 'buyer', verification_status: 'pending_verification' },
    });

    const res = await POST(makeRequest() as any);
    if (!res) throw new Error('expected a response from POST');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('team');
  });
});
