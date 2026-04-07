/**
 * QuickBooks OAuth Discovery Document Service
 *
 * Fetches and caches OAuth endpoints from Intuit's OpenID Connect
 * discovery document instead of hardcoding URLs.
 *
 * Discovery doc: https://developer.api.intuit.com/.well-known/openid_configuration
 *
 * This satisfies Intuit's compliance requirement:
 * "Did you use the Intuit discovery document to get the latest endpoints?"
 */

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/discovery]', ...args);

const DISCOVERY_URL = 'https://developer.api.intuit.com/.well-known/openid_configuration';

// Cache duration: 24 hours (endpoints rarely change)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// In-memory cache
let cachedEndpoints = null;
let cacheTimestamp = 0;

// Fallback endpoints (used only if discovery fetch fails)
const FALLBACK_ENDPOINTS = {
  authorization_endpoint: 'https://appcenter.intuit.com/connect/oauth2',
  token_endpoint: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  revocation_endpoint: 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
  userinfo_endpoint: 'https://accounts.platform.intuit.com/v1/openid_connect/userinfo',
  jwks_uri: 'https://oauth.platform.intuit.com/op/v1/jwks',
  issuer: 'https://oauth.platform.intuit.com/op/v1',
};

/**
 * Fetch the OpenID Connect discovery document from Intuit
 * @returns {Object} Discovery document endpoints
 */
async function fetchDiscoveryDocument() {
  try {
    const response = await fetch(DISCOVERY_URL, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`Discovery fetch failed: ${response.status}`);
    }

    const doc = await response.json();

    // Validate required fields
    if (!doc.authorization_endpoint || !doc.token_endpoint) {
      throw new Error('Discovery document missing required endpoints');
    }

    log('Discovery document fetched successfully');
    return doc;

  } catch (error) {
    console.error('[quickbooks/discovery] Failed to fetch discovery document:', error.message);
    return null;
  }
}

/**
 * Get OAuth endpoints, using cached discovery document or fetching fresh
 * @returns {Object} { authEndpoint, tokenEndpoint, revokeEndpoint, userinfoEndpoint, jwksUri, issuer }
 */
export async function getOAuthEndpoints() {
  const now = Date.now();

  // Return cache if still valid
  if (cachedEndpoints && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedEndpoints;
  }

  // Fetch fresh discovery document
  const doc = await fetchDiscoveryDocument();

  const endpoints = {
    authEndpoint: doc?.authorization_endpoint || FALLBACK_ENDPOINTS.authorization_endpoint,
    tokenEndpoint: doc?.token_endpoint || FALLBACK_ENDPOINTS.token_endpoint,
    revokeEndpoint: doc?.revocation_endpoint || FALLBACK_ENDPOINTS.revocation_endpoint,
    userinfoEndpoint: doc?.userinfo_endpoint || FALLBACK_ENDPOINTS.userinfo_endpoint,
    jwksUri: doc?.jwks_uri || FALLBACK_ENDPOINTS.jwks_uri,
    issuer: doc?.issuer || FALLBACK_ENDPOINTS.issuer,
    // Track whether we used the live document or fallback
    fromDiscovery: !!doc,
  };

  // Update cache
  cachedEndpoints = endpoints;
  cacheTimestamp = now;

  return endpoints;
}

/**
 * Force refresh the cached discovery endpoints
 * @returns {Object} Fresh endpoints
 */
export async function refreshEndpoints() {
  cachedEndpoints = null;
  cacheTimestamp = 0;
  return getOAuthEndpoints();
}
