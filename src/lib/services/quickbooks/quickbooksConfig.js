/**
 * QuickBooks Configuration & Environment Validation
 *
 * Centralizes all QuickBooks env vars and validates them at module load.
 * Fails fast with a clear error if critical config is missing.
 */

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/config]', ...args);

const isProduction = process.env.QUICKBOOKS_ENVIRONMENT === 'production';

export const QB_CONFIG = {
  clientId: process.env.QUICKBOOKS_CLIENT_ID,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
  // HMAC secret used to sign OAuth state parameter (prevents forgery/account linking).
  // Required in production. Should be 32+ random bytes (hex/base64).
  stateSecret: process.env.QUICKBOOKS_STATE_SECRET,
  environment: isProduction ? 'production' : 'sandbox',
  isProduction,
  apiBase: isProduction
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com',
};

/**
 * Validate that required QuickBooks env vars are set.
 * Call this at the start of any QB operation that needs credentials.
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateQbConfig() {
  const missing = [];

  if (!QB_CONFIG.clientId) missing.push('QUICKBOOKS_CLIENT_ID');
  if (!QB_CONFIG.clientSecret) missing.push('QUICKBOOKS_CLIENT_SECRET');
  if (!QB_CONFIG.stateSecret) missing.push('QUICKBOOKS_STATE_SECRET');

  if (missing.length > 0) {
    return {
      valid: false,
      error: `QuickBooks integration is not configured. Missing env vars: ${missing.join(', ')}`,
    };
  }

  // Enforce a minimum entropy for the HMAC secret
  if (QB_CONFIG.stateSecret.length < 32) {
    return {
      valid: false,
      error:
        'QUICKBOOKS_STATE_SECRET must be at least 32 characters. Generate with `openssl rand -hex 32`.',
    };
  }

  return { valid: true };
}

/**
 * Throw if QB config is invalid. Use at entry points that require QB.
 */
export function assertQbConfig() {
  const { valid, error } = validateQbConfig();
  if (!valid) {
    throw new Error(error);
  }
}

// Log config state once at module load (no secrets)
if (DEBUG) {
  const { valid, error } = validateQbConfig();
  log(
    `Environment: ${QB_CONFIG.environment}`,
    `| Configured: ${valid}`,
    error ? `| Error: ${error}` : ''
  );
}
