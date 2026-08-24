/**
 * Simple in-memory rate limiter for AI Stylist
 * Limits messages per session to prevent abuse
 */

interface RateLimitEntry {
    count: number
    windowStart: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

const RATE_LIMIT = {
    maxRequests: 15,        // Max messages per window
    windowMs: 60 * 1000,    // 1 minute window
    cleanupInterval: 5 * 60 * 1000  // Clean old entries every 5 mins
}

// Cleanup old entries periodically
let lastCleanup = Date.now()

function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < RATE_LIMIT.cleanupInterval) return

    for (const [key, entry] of rateLimitMap.entries()) {
        if (now - entry.windowStart > RATE_LIMIT.windowMs * 2) {
            rateLimitMap.delete(key)
        }
    }
    lastCleanup = now
}

/**
 * Check if a session is rate limited
 * @param sessionId - Unique session identifier (can use IP or session cookie)
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(sessionId: string): {
    allowed: boolean
    remaining: number
    resetIn: number
} {
    cleanup()

    const now = Date.now()
    const entry = rateLimitMap.get(sessionId)

    if (!entry || now - entry.windowStart > RATE_LIMIT.windowMs) {
        // New window
        rateLimitMap.set(sessionId, { count: 1, windowStart: now })
        return {
            allowed: true,
            remaining: RATE_LIMIT.maxRequests - 1,
            resetIn: RATE_LIMIT.windowMs
        }
    }

    if (entry.count >= RATE_LIMIT.maxRequests) {
        const resetIn = RATE_LIMIT.windowMs - (now - entry.windowStart)
        return {
            allowed: false,
            remaining: 0,
            resetIn
        }
    }

    entry.count++
    return {
        allowed: true,
        remaining: RATE_LIMIT.maxRequests - entry.count,
        resetIn: RATE_LIMIT.windowMs - (now - entry.windowStart)
    }
}

/**
 * Get rate limit exceeded message
 */
export function getRateLimitMessage(resetIn: number): string {
    const seconds = Math.ceil(resetIn / 1000)
    return `I need a quick breather! 😅 Let's continue in ${seconds} seconds. Meanwhile, feel free to browse our collections!`
}
