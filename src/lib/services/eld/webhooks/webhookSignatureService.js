/**
 * ELD Webhook Signature Validation Service
 *
 * Validates webhook signatures for Motive and Samsara providers.
 * Each provider uses different signature algorithms:
 * - Motive: HMAC-SHA1 of JSON payload
 * - Samsara: HMAC-SHA256 of "v1:{timestamp}:{body}" with Base64-decoded secret
 */

import crypto from 'crypto';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[WebhookSignature]', ...args);

/**
 * Validate Motive webhook signature
 *
 * Motive uses HMAC-SHA1 of the JSON payload body.
 * Signature is in the X-KT-Webhook-Signature header.
 *
 * @param {string} body - Raw request body
 * @param {string} signature - X-KT-Webhook-Signature header value
 * @param {string} secret - Webhook shared secret
 * @returns {boolean} - Whether signature is valid
 */
export function validateMotiveSignature(body, signature, secret) {
  // Check if this is a Motive test/validation request
  // Motive sends '[vehicle_location_updated]' or '["vehicle_location_updated"]' as test payload
  const isMotiveTestPayload = body && (
    body.includes('[vehicle_location_updated]') ||
    body.includes('["vehicle_location_updated"]') ||
    body.includes("['vehicle_location_updated']")
  );

  if (isMotiveTestPayload) {
    log('Detected Motive test/validation request - allowing');
    return true;
  }

  if (!secret) {
    log('Warning: Motive webhook secret not configured');
    // In development, allow unsigned webhooks for testing
    // Also allow verification requests (empty or minimal body)
    if (process.env.NODE_ENV === 'development') return true;

    // Allow verification requests when no secret is configured
    // These are typically empty body or ping events
    try {
      const parsed = JSON.parse(body);
      // Handle array payloads (Motive test requests) or objects without event_type
      if (Array.isArray(parsed) || (!parsed.event_type && !parsed.type)) {
        log('Allowing verification request (array or no event_type)');
        return true;
      }
    } catch {
      // If body isn't valid JSON, might be a simple ping
      if (!body || body.length < 10) {
        log('Allowing verification request (minimal body)');
        return true;
      }
    }
    return false;
  }

  if (!signature) {
    log('Missing X-KT-Webhook-Signature header');
    // Allow verification/ping requests without signature
    try {
      const parsed = JSON.parse(body);
      // Handle array payloads (Motive test requests)
      if (Array.isArray(parsed)) {
        log('Allowing test request (array payload) without signature');
        return true;
      }
      if (parsed.event_type === 'ping' || parsed.type === 'ping' || parsed.event_type === 'test') {
        log('Allowing ping/test request without signature');
        return true;
      }
    } catch {
      // If body isn't valid JSON and is minimal, allow it
      if (!body || body.length < 10) {
        return true;
      }
    }
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha1', secret)
      .update(body, 'utf8')
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );

    if (!isValid) {
      log('Invalid Motive signature');
      log(`Expected: ${expectedSignature.substring(0, 10)}...`);
      log(`Received: ${signature.substring(0, 10)}...`);
    }

    return isValid;
  } catch (error) {
    log('Error validating Motive signature:', error.message);
    return false;
  }
}

/**
 * Validate Samsara webhook signature
 *
 * Samsara uses HMAC-SHA256 of "v1:{timestamp}:{body}".
 * The secret key is Base64 encoded and must be decoded first.
 * Signature format: "v1={hex_signature}"
 *
 * @param {string} body - Raw request body
 * @param {string} signature - X-Samsara-Signature header value (format: "v1=...")
 * @param {string} timestamp - X-Samsara-Timestamp header value
 * @param {string} secret - Webhook secret (Base64 encoded)
 * @returns {boolean} - Whether signature is valid
 */
export function validateSamsaraSignature(body, signature, timestamp, secret) {
  if (!secret) {
    log('Warning: Samsara webhook secret not configured');
    return process.env.NODE_ENV === 'development';
  }

  if (!signature || !timestamp) {
    log('Missing Samsara signature or timestamp header');
    return false;
  }

  // Samsara signature has "v1=" prefix
  if (!signature.startsWith('v1=')) {
    log('Invalid Samsara signature format (missing v1= prefix)');
    return false;
  }

  try {
    // Decode the Base64-encoded secret
    const decodedSecret = Buffer.from(secret, 'base64');

    // Construct the message: "v1:{timestamp}:{body}"
    const message = `v1:${timestamp}:${body}`;

    // Compute the expected signature
    const expectedSignature = 'v1=' + crypto
      .createHmac('sha256', decodedSecret)
      .update(message, 'utf8')
      .digest('hex');

    // Use timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );

    if (!isValid) {
      log('Invalid Samsara signature');
      log(`Expected: ${expectedSignature.substring(0, 15)}...`);
      log(`Received: ${signature.substring(0, 15)}...`);
    }

    return isValid;
  } catch (error) {
    log('Error validating Samsara signature:', error.message);
    return false;
  }
}

/**
 * Check if webhook timestamp is within acceptable window
 * Prevents replay attacks by rejecting old webhooks
 *
 * @param {string|number} timestamp - Unix timestamp (seconds)
 * @param {number} maxAgeSeconds - Maximum acceptable age (default: 5 minutes)
 * @returns {boolean} - Whether timestamp is within window
 */
export function isTimestampValid(timestamp, maxAgeSeconds = 300) {
  if (!timestamp) return false;

  const webhookTime = parseInt(timestamp, 10) * 1000; // Convert to milliseconds
  const now = Date.now();
  const age = now - webhookTime;

  // Allow webhooks up to maxAgeSeconds old, and up to 60 seconds in the future (clock skew)
  const isValid = age >= -60000 && age <= maxAgeSeconds * 1000;

  if (!isValid) {
    log(`Webhook timestamp outside acceptable window: ${age}ms old`);
  }

  return isValid;
}

/**
 * Validate webhook based on provider
 *
 * @param {string} provider - 'motive' or 'samsara'
 * @param {string} body - Raw request body
 * @param {object} headers - Request headers
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateWebhook(provider, body, headers) {
  const getHeader = (name) => {
    // Handle both Map-like and object-like headers
    if (typeof headers.get === 'function') {
      return headers.get(name);
    }
    return headers[name] || headers[name.toLowerCase()];
  };

  if (provider === 'motive') {
    const signature = getHeader('x-kt-webhook-signature') || getHeader('X-KT-Webhook-Signature');
    const secret = process.env.MOTIVE_WEBHOOK_SECRET;

    if (!validateMotiveSignature(body, signature, secret)) {
      return { valid: false, error: 'Invalid Motive webhook signature' };
    }

    return { valid: true };
  }

  if (provider === 'samsara') {
    const signature = getHeader('x-samsara-signature') || getHeader('X-Samsara-Signature');
    const timestamp = getHeader('x-samsara-timestamp') || getHeader('X-Samsara-Timestamp');
    const secret = process.env.SAMSARA_WEBHOOK_SECRET;

    // Validate timestamp first (prevents replay attacks)
    if (!isTimestampValid(timestamp)) {
      return { valid: false, error: 'Webhook timestamp expired or invalid' };
    }

    if (!validateSamsaraSignature(body, signature, timestamp, secret)) {
      return { valid: false, error: 'Invalid Samsara webhook signature' };
    }

    return { valid: true };
  }

  return { valid: false, error: `Unknown provider: ${provider}` };
}

export default {
  validateMotiveSignature,
  validateSamsaraSignature,
  isTimestampValid,
  validateWebhook
};
