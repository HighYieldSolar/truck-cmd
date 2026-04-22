/**
 * QuickBooks API Rate Limiting
 *
 * In-memory token bucket rate limiter per user.
 * Protects QuickBooks API routes from abuse and ensures we stay
 * well under Intuit's 500 req/min per realm limit.
 *
 * Limits are intentionally strict: sync operations are user-triggered,
 * so a legitimate user should never hit these. A user hitting this
 * limit is either buggy client code or an attacker.
 *
 * NOTE: In-memory state — resets on serverless cold starts. For
 * strict enforcement across instances, swap for a Redis/Upstash
 * implementation post-launch.
 */

// Rate limit buckets by operation type
// Format: { maxRequests, windowMs }
const RATE_LIMITS = {
  // Sync operations: 20 per minute per user (generous for bulk sync)
  sync: { maxRequests: 20, windowMs: 60 * 1000 },

  // Connect/disconnect/refresh: 10 per minute per user
  auth: { maxRequests: 10, windowMs: 60 * 1000 },

  // Read operations (status, mappings, accounts): 60 per minute per user
  read: { maxRequests: 60, windowMs: 60 * 1000 },
};

// In-memory store: Map<key, { count, resetAt }>
const buckets = new Map();

// Periodically clean up expired buckets to prevent memory leaks
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
 * Check and increment a rate limit bucket
 *
 * @param {string} userId - User ID to rate limit
 * @param {string} operation - Operation type: 'sync' | 'auth' | 'read'
 * @returns {Object} { allowed, remaining, retryAfterSeconds }
 */
export function enforceQbRateLimit(userId, operation = 'sync') {
  cleanup();

  const limits = RATE_LIMITS[operation] || RATE_LIMITS.sync;
  const key = `${userId}:${operation}`;
  const now = Date.now();

  let bucket = buckets.get(key);

  // Create new bucket or reset expired one
  if (!bucket || bucket.resetAt < now) {
    bucket = {
      count: 0,
      resetAt: now + limits.windowMs,
    };
    buckets.set(key, bucket);
  }

  // Check limit
  if (bucket.count >= limits.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // Increment and allow
  bucket.count++;
  return {
    allowed: true,
    remaining: limits.maxRequests - bucket.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset a user's rate limit (for testing/admin)
 */
export function resetQbRateLimit(userId, operation) {
  if (operation) {
    buckets.delete(`${userId}:${operation}`);
  } else {
    for (const key of buckets.keys()) {
      if (key.startsWith(`${userId}:`)) {
        buckets.delete(key);
      }
    }
  }
}
