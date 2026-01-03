/**
 * ELD Provider Factory
 *
 * Central registry for all ELD provider implementations.
 * Makes it easy to add new providers and select the appropriate one.
 */

import { MotiveProvider } from './motiveProvider';
import { SamsaraProvider } from './samsaraProvider';
import { BaseELDProvider, ELDError, ELDAuthError, ELDAPIError, ELDRateLimitError } from './baseProvider';

/**
 * Registry of all available ELD providers
 */
export const PROVIDERS = {
  motive: {
    id: 'motive',
    name: 'Motive (KeepTruckin)',
    description: 'The #1 ELD provider with ~20% market share. Has dedicated IFTA endpoints.',
    logo: '/images/eld/motive-logo.png',
    class: MotiveProvider,
    features: ['vehicles', 'drivers', 'gps', 'hos', 'ifta', 'ifta_trips', 'ifta_summary', 'fault_codes', 'fuel_purchases', 'webhooks'],
    authType: 'oauth2',
    docsUrl: 'https://developer.gomotive.com',
    requiresClientId: true,
    requiresClientSecret: true
  },
  samsara: {
    id: 'samsara',
    name: 'Samsara',
    description: 'The #2 ELD provider with ~15% market share. Great real-time GPS feeds.',
    logo: '/images/eld/samsara-logo.png',
    class: SamsaraProvider,
    features: ['vehicles', 'drivers', 'gps', 'gps_feed', 'gps_history', 'hos', 'ifta', 'fault_codes', 'webhooks'],
    authType: 'oauth2',
    docsUrl: 'https://developers.samsara.com',
    requiresClientId: true,
    requiresClientSecret: true
  }
};

/**
 * Get list of all supported providers
 * @returns {Object[]} Array of provider metadata
 */
export function getSupportedProviders() {
  return Object.values(PROVIDERS).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    logo: p.logo,
    features: p.features,
    authType: p.authType,
    docsUrl: p.docsUrl
  }));
}

/**
 * Get provider metadata by ID
 * @param {string} providerId - Provider ID (e.g., 'motive', 'samsara')
 * @returns {Object|null} Provider metadata or null if not found
 */
export function getProviderInfo(providerId) {
  const provider = PROVIDERS[providerId?.toLowerCase()];
  if (!provider) return null;

  return {
    id: provider.id,
    name: provider.name,
    description: provider.description,
    logo: provider.logo,
    features: provider.features,
    authType: provider.authType,
    docsUrl: provider.docsUrl,
    requiresClientId: provider.requiresClientId,
    requiresClientSecret: provider.requiresClientSecret
  };
}

/**
 * Create a provider instance
 * @param {string} providerId - Provider ID (e.g., 'motive', 'samsara')
 * @param {Object} config - Provider configuration
 * @param {string} config.accessToken - OAuth access token
 * @param {string} config.refreshToken - OAuth refresh token
 * @param {string} config.tokenExpiresAt - Token expiration timestamp
 * @param {string} config.clientId - OAuth client ID (optional, uses env vars)
 * @param {string} config.clientSecret - OAuth client secret (optional, uses env vars)
 * @returns {BaseELDProvider} Provider instance
 * @throws {ELDError} If provider ID is not supported
 */
export function createProvider(providerId, config = {}) {
  const providerDef = PROVIDERS[providerId?.toLowerCase()];

  if (!providerDef) {
    throw new ELDError(
      `Unsupported ELD provider: ${providerId}. Supported providers: ${Object.keys(PROVIDERS).join(', ')}`,
      'UNSUPPORTED_PROVIDER'
    );
  }

  return new providerDef.class(config);
}

/**
 * Check if a provider supports a specific feature
 * @param {string} providerId - Provider ID
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
export function providerSupportsFeature(providerId, feature) {
  const provider = PROVIDERS[providerId?.toLowerCase()];
  return provider?.features?.includes(feature) || false;
}

/**
 * Get all providers that support a specific feature
 * @param {string} feature - Feature name
 * @returns {Object[]} Array of provider metadata
 */
export function getProvidersWithFeature(feature) {
  return Object.values(PROVIDERS)
    .filter(p => p.features.includes(feature))
    .map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      logo: p.logo
    }));
}

/**
 * Get providers that support IFTA data
 * @returns {Object[]} Array of IFTA-capable providers
 */
export function getIFTACapableProviders() {
  return getProvidersWithFeature('ifta');
}

/**
 * Validate provider configuration
 * @param {string} providerId - Provider ID
 * @param {Object} config - Configuration to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProviderConfig(providerId, config) {
  const provider = PROVIDERS[providerId?.toLowerCase()];
  const errors = [];

  if (!provider) {
    return { valid: false, errors: [`Unknown provider: ${providerId}`] };
  }

  // Check required OAuth credentials
  if (provider.authType === 'oauth2') {
    if (!config.accessToken) {
      errors.push('Access token is required');
    }
  }

  // Check for client credentials (either in config or env)
  if (provider.requiresClientId) {
    const clientId = config.clientId || getEnvClientId(providerId);
    if (!clientId) {
      errors.push(`Client ID is required for ${provider.name}. Set via config or ${providerId.toUpperCase()}_CLIENT_ID env var.`);
    }
  }

  if (provider.requiresClientSecret) {
    const clientSecret = config.clientSecret || getEnvClientSecret(providerId);
    if (!clientSecret) {
      errors.push(`Client Secret is required for ${provider.name}. Set via config or ${providerId.toUpperCase()}_CLIENT_SECRET env var.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get OAuth client ID from environment
 */
function getEnvClientId(providerId) {
  const envKey = `${providerId.toUpperCase()}_CLIENT_ID`;
  return process.env[envKey];
}

/**
 * Get OAuth client secret from environment
 */
function getEnvClientSecret(providerId) {
  const envKey = `${providerId.toUpperCase()}_CLIENT_SECRET`;
  return process.env[envKey];
}

// Re-export error classes for convenience
export { ELDError, ELDAuthError, ELDAPIError, ELDRateLimitError };

// Default export
export default {
  PROVIDERS,
  getSupportedProviders,
  getProviderInfo,
  createProvider,
  providerSupportsFeature,
  getProvidersWithFeature,
  getIFTACapableProviders,
  validateProviderConfig
};
