interface RateLimitRule {
  windowMs: number
  maxRequests: number
  message: string
}

interface RateLimitEntry {
  count: number
  windowStart: number
}

export class RateLimiter {
  private static instance: RateLimiter
  private cache = new Map<string, RateLimitEntry>()
  private rules: Record<string, RateLimitRule> = {
    'auth': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 auth attempts per 15 minutes
      message: 'Too many authentication attempts. Please try again in 15 minutes.'
    },
    'auth-per-ip': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 25, // 25 requests per IP per 5 minutes
      message: 'Too many requests from this IP. Please try again in 5 minutes.'
    },
    'general': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      message: 'Too many requests. Please slow down.'
    }
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  async checkRateLimit(
    identifier: string,
    ruleType: keyof typeof this.rules = 'general'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; message?: string }> {
    const rule = this.rules[ruleType]
    const now = Date.now()
    const key = `${ruleType}:${identifier}`

    // Clean up old entries periodically
    this.cleanup()

    let entry = this.cache.get(key)

    // Initialize or reset window if expired
    if (!entry || (now - entry.windowStart) >= rule.windowMs) {
      entry = {
        count: 0,
        windowStart: now
      }
    }

    entry.count++
    this.cache.set(key, entry)

    const allowed = entry.count <= rule.maxRequests
    const remaining = Math.max(0, rule.maxRequests - entry.count)
    const resetTime = entry.windowStart + rule.windowMs

    return {
      allowed,
      remaining,
      resetTime,
      message: allowed ? undefined : rule.message
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      const ruleType = key.split(':')[0] as keyof typeof this.rules
      const rule = this.rules[ruleType]

      if (rule && (now - entry.windowStart) >= rule.windowMs * 2) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  getRateLimitHeaders(result: { remaining: number; resetTime: number }): Record<string, string> {
    return {
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      'X-RateLimit-Reset-Time': new Date(result.resetTime).toISOString()
    }
  }

  // Development/debugging methods
  getStats(): { totalEntries: number; entries: Array<{ key: string; count: number; age: number }> } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      count: entry.count,
      age: now - entry.windowStart
    }))

    return {
      totalEntries: this.cache.size,
      entries
    }
  }

  reset(identifier?: string): void {
    if (identifier) {
      // Reset specific identifier across all rule types
      for (const ruleType of Object.keys(this.rules)) {
        this.cache.delete(`${ruleType}:${identifier}`)
      }
    } else {
      // Reset everything
      this.cache.clear()
    }
  }
}

// Helper function for middleware usage
export function getClientIdentifier(request: Request): { ip: string; userAgent: string } {
  // Get IP address with fallbacks for different hosting environments
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for') // Vercel

  const ip = cfConnectingIp || vercelForwarded || realIp || forwarded?.split(',')[0] || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  return { ip, userAgent }
}
