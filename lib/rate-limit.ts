/**
 * Simple in-memory rate limiter for API routes.
 * Works per-IP with a sliding window approach.
 * 
 * Note: On Vercel serverless, each function instance has its own memory,
 * so this provides per-instance rate limiting. For a small site this is
 * more than enough. For high-traffic sites, use Redis-based solutions
 * like @upstash/ratelimit.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60_000)

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

/**
 * Check if a request from a given IP is within rate limits.
 * 
 * @param ip - The client IP address
 * @param endpoint - The API endpoint identifier (used as namespace)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and remaining quota
 */
export function checkRateLimit(
  ip: string,
  endpoint: string,
  config: RateLimitConfig = { maxRequests: 60, windowSeconds: 60 }
): RateLimitResult {
  const key = `${endpoint}:${ip}`
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  const existing = rateLimitMap.get(key)

  if (!existing || now > existing.resetTime) {
    // First request or window expired — start new window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetInSeconds: config.windowSeconds,
    }
  }

  // Within existing window
  existing.count++
  const resetInSeconds = Math.ceil((existing.resetTime - now) / 1000)

  if (existing.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetInSeconds,
  }
}

/**
 * Extract client IP from request headers.
 * On Vercel, the real IP is in x-forwarded-for or x-real-ip.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}
