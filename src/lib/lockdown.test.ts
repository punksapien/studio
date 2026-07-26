import { describe, it, expect } from 'vitest';
import {
  BUYER_UNVERIFIED_ALLOWED_PREFIXES,
  SELLER_UNVERIFIED_ALLOWED_PREFIXES,
  getLockdownRedirect,
  isUnverifiedAllowedPath,
} from '@/lib/lockdown';

describe('isUnverifiedAllowedPath', () => {
  it('matches exact prefixes and path-boundary sub-paths', () => {
    expect(isUnverifiedAllowedPath('/dashboard/settings', BUYER_UNVERIFIED_ALLOWED_PREFIXES)).toBe(true);
    expect(
      isUnverifiedAllowedPath('/dashboard/settings/account-management', BUYER_UNVERIFIED_ALLOWED_PREFIXES)
    ).toBe(true);
    expect(isUnverifiedAllowedPath('/dashboard/onboarding', BUYER_UNVERIFIED_ALLOWED_PREFIXES)).toBe(true);
    expect(isUnverifiedAllowedPath('/dashboard/profile', BUYER_UNVERIFIED_ALLOWED_PREFIXES)).toBe(true);
  });

  it('does not match unrelated or non-boundary paths', () => {
    expect(isUnverifiedAllowedPath('/dashboard/inquiries', BUYER_UNVERIFIED_ALLOWED_PREFIXES)).toBe(false);
    expect(isUnverifiedAllowedPath('/dashboard', BUYER_UNVERIFIED_ALLOWED_PREFIXES)).toBe(false);
    // guards against naive startsWith: '/dashboard/settings-x' must NOT match '/dashboard/settings'
    expect(isUnverifiedAllowedPath('/dashboard/settings-x', BUYER_UNVERIFIED_ALLOWED_PREFIXES)).toBe(false);
  });

  it('works with the seller prefix set', () => {
    expect(
      isUnverifiedAllowedPath('/seller-dashboard/settings/profile-preferences', SELLER_UNVERIFIED_ALLOWED_PREFIXES)
    ).toBe(true);
    expect(isUnverifiedAllowedPath('/seller-dashboard/listings', SELLER_UNVERIFIED_ALLOWED_PREFIXES)).toBe(false);
  });
});

describe('getLockdownRedirect — buyer', () => {
  const unverifiedBuyer = { role: 'buyer', verificationStatus: 'pending_verification' };

  it('redirects unverified buyer with flag ON on a locked path', () => {
    expect(getLockdownRedirect({ ...unverifiedBuyer, pathname: '/dashboard', buyerFlagOn: true })).toBe(
      '/dashboard/onboarding'
    );
    expect(
      getLockdownRedirect({ ...unverifiedBuyer, pathname: '/dashboard/inquiries', buyerFlagOn: true })
    ).toBe('/dashboard/onboarding');
  });

  it('returns null on allowed paths (flag ON, unverified)', () => {
    for (const pathname of [
      '/dashboard/settings',
      '/dashboard/settings/account-management',
      '/dashboard/onboarding',
      '/dashboard/profile',
    ]) {
      expect(getLockdownRedirect({ ...unverifiedBuyer, pathname, buyerFlagOn: true })).toBeNull();
    }
  });

  it('returns null when buyer is verified', () => {
    for (const pathname of ['/dashboard', '/dashboard/inquiries']) {
      expect(
        getLockdownRedirect({ role: 'buyer', verificationStatus: 'verified', pathname, buyerFlagOn: true })
      ).toBeNull();
    }
  });

  it('returns null when the flag is OFF', () => {
    for (const pathname of ['/dashboard', '/dashboard/inquiries']) {
      expect(getLockdownRedirect({ ...unverifiedBuyer, pathname, buyerFlagOn: false })).toBeNull();
    }
  });

  it('returns null for non-dashboard paths', () => {
    for (const pathname of ['/marketplace', '/listings/x']) {
      expect(getLockdownRedirect({ ...unverifiedBuyer, pathname, buyerFlagOn: true })).toBeNull();
    }
  });
});

describe('getLockdownRedirect — seller (always on, no flag)', () => {
  const unverifiedSeller = { role: 'seller', verificationStatus: 'pending_verification' };

  it('redirects unverified seller on a locked path regardless of buyer flag', () => {
    expect(getLockdownRedirect({ ...unverifiedSeller, pathname: '/seller-dashboard', buyerFlagOn: false })).toBe(
      '/seller-dashboard/onboarding'
    );
    expect(getLockdownRedirect({ ...unverifiedSeller, pathname: '/seller-dashboard', buyerFlagOn: true })).toBe(
      '/seller-dashboard/onboarding'
    );
  });

  it('returns null on allowed seller paths', () => {
    expect(
      getLockdownRedirect({
        ...unverifiedSeller,
        pathname: '/seller-dashboard/settings/profile-preferences',
        buyerFlagOn: false,
      })
    ).toBeNull();
  });

  it('returns null when the seller is verified', () => {
    expect(
      getLockdownRedirect({
        role: 'seller',
        verificationStatus: 'verified',
        pathname: '/seller-dashboard',
        buyerFlagOn: false,
      })
    ).toBeNull();
  });
});
