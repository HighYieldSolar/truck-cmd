/**
 * Rate limiter for public (unauthenticated) form endpoints.
 *
 * In-memory IP-based token bucket. Mirrors the shape of
 * `quickbooksRateLimit.js` but keyed on client IP instead of user ID,
 * since these endpoints are called pre-auth.
 *
 * NOTE: In-memory state — resets on serverless cold starts, and is
 * per-instance on Vercel. For strict distributed enforcement, swap
 * for Redis/Upstash post-launch.
 */

const RATE_LIMITS = {
  contact: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  feedback: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
};

const buckets = new Map();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) {
      buckets.delete(key);
    }
  }
  lastCleanup = now;
}

/**
 * Extract client IP from a Next.js Request.
 *
 * Vercel sets `x-forwarded-for` and `x-real-ip`. The first entry of
 * `x-forwarded-for` is the original client. Falls back to 'unknown'
 * in local dev where neither header is set.
 */
export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

/**
 * Check and increment a rate limit bucket for a public form.
 *
 * @param {string} ip - Client IP
 * @param {string} formName - 'contact' | 'feedback'
 * @returns {Object} { allowed, remaining, retryAfterSeconds }
 */
export function enforcePublicFormRateLimit(ip, formName) {
  cleanup();

  const limits = RATE_LIMITS[formName] || { maxRequests: 5, windowMs: 15 * 60 * 1000 };
  const key = `${formName}:${ip}`;
  const now = Date.now();

  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    bucket = {
      count: 0,
      resetAt: now + limits.windowMs,
    };
    buckets.set(key, bucket);
  }

  if (bucket.count >= limits.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  bucket.count++;
  return {
    allowed: true,
    remaining: limits.maxRequests - bucket.count,
    retryAfterSeconds: 0,
  };
}
