/**
 * Verification-lockdown routing — single source of truth.
 *
 * Pure, dependency-free helpers shared by the edge middleware and the client
 * dashboard layouts so the seller/buyer lockdown rules can never drift between
 * server and client. No I/O, no framework imports — safe to import anywhere.
 */

// Path prefixes an unverified buyer is allowed to reach without being bounced to Onboarding.
export const BUYER_UNVERIFIED_ALLOWED_PREFIXES = [
  '/dashboard/onboarding',
  '/dashboard/settings',
  '/dashboard/profile',
];

// Path prefixes an unverified seller is allowed to reach without being bounced to Onboarding.
export const SELLER_UNVERIFIED_ALLOWED_PREFIXES = [
  '/seller-dashboard/onboarding',
  '/seller-dashboard/settings',
  '/seller-dashboard/profile',
];

/**
 * True when `pathname` sits on (or under) one of the allowed prefixes.
 * Matches an exact prefix or a path-boundary sub-path (prefix + '/').
 */
export function isUnverifiedAllowedPath(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/** True when the buyer verification lockdown feature flag is enabled. */
export function isBuyerLockdownFlagOn(): boolean {
  return process.env.NEXT_PUBLIC_BUYER_VERIFICATION_LOCKDOWN === 'true';
}

/**
 * Returns the onboarding path an unverified user should be redirected to, or
 * null when no redirect is required.
 *
 * - Seller lockdown is always on (no flag).
 * - Buyer lockdown is gated on `buyerFlagOn`.
 * Buyer and seller dashboards don't prefix-collide, so evaluation order is
 * irrelevant — role decides which branch applies.
 */
export function getLockdownRedirect(args: {
  role: string | null | undefined;
  verificationStatus: string | null | undefined;
  pathname: string;
  buyerFlagOn: boolean;
}): string | null {
  const { role, verificationStatus, pathname, buyerFlagOn } = args;

  if (
    role === 'seller' &&
    verificationStatus !== 'verified' &&
    pathname.startsWith('/seller-dashboard') &&
    !isUnverifiedAllowedPath(pathname, SELLER_UNVERIFIED_ALLOWED_PREFIXES)
  ) {
    return '/seller-dashboard/onboarding';
  }

  if (
    buyerFlagOn &&
    role === 'buyer' &&
    verificationStatus !== 'verified' &&
    pathname.startsWith('/dashboard') &&
    !isUnverifiedAllowedPath(pathname, BUYER_UNVERIFIED_ALLOWED_PREFIXES)
  ) {
    return '/dashboard/onboarding';
  }

  return null;
}
