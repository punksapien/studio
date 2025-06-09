/**
 * Centralized configuration for verification request settings
 */

export const VERIFICATION_CONFIG = {
  /**
   * Cooldown period in seconds between verification requests/bumps
   * Default: 24 hours (86400 seconds) for production
   * Can be overridden via VERIFICATION_REQUEST_TIMEOUT environment variable
   */
  get COOLDOWN_SECONDS(): number {
    const envValue = process.env.VERIFICATION_REQUEST_TIMEOUT;
    if (envValue) {
      const parsed = parseInt(envValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    // Default to 24 hours in production
    return 86400; // 24 * 60 * 60
  },

  /**
   * Cooldown period in hours (for UI display compatibility)
   */
  get COOLDOWN_HOURS(): number {
    return this.COOLDOWN_SECONDS / 3600;
  },

  /**
   * Check if cooldown is active based on last action time
   */
  isCooldownActive(lastActionTime: Date): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - lastActionTime.getTime();
    const secondsDiff = timeDiff / 1000;
    return secondsDiff < this.COOLDOWN_SECONDS;
  },

  /**
   * Get remaining seconds until cooldown expires
   */
  getCooldownRemainingSeconds(lastActionTime: Date): number {
    const now = new Date();
    const timeDiff = now.getTime() - lastActionTime.getTime();
    const secondsDiff = timeDiff / 1000;
    const remaining = Math.ceil(this.COOLDOWN_SECONDS - secondsDiff);
    return Math.max(0, remaining);
  },

  /**
   * Get remaining hours until cooldown expires (for UI compatibility)
   */
  getCooldownRemainingHours(lastActionTime: Date): number {
    const remainingSeconds = this.getCooldownRemainingSeconds(lastActionTime);
    return Math.ceil(remainingSeconds / 3600 * 100) / 100; // Convert to fractional hours
  },

  /**
   * Format time remaining for display
   */
  formatTimeRemaining(hours: number): string {
    if (hours <= 0) return 'Available now';

    const seconds = Math.ceil(hours * 3600);
    const minutes = Math.ceil(hours * 60);

    if (seconds < 60) return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    if (hours < 1) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
};
