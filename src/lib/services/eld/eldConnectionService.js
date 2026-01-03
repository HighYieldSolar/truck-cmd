/**
 * ELD Connection Service
 *
 * Manages ELD provider connections including OAuth flow, token storage,
 * connection status, and lifecycle management.
 *
 * Supports multiple providers: Motive, Samsara
 */

import { createClient } from '@supabase/supabase-js';
import {
  createProvider,
  getSupportedProviders,
  getProviderInfo,
  validateProviderConfig,
  ELDError,
  ELDAuthError
} from './providers';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[ELDConnectionService]', ...args);

// Initialize Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Get OAuth authorization URL for a provider
 * @param {string} userId - User ID
 * @param {string} providerId - Provider ID (e.g., 'motive', 'samsara')
 * @param {string} redirectUri - OAuth callback URL
 * @returns {Promise<object>} - Authorization URL and state
 */
export async function getAuthorizationUrl(userId, providerId, redirectUri) {
  try {
    const providerInfo = getProviderInfo(providerId);
    if (!providerInfo) {
      return { error: true, errorMessage: `Unsupported provider: ${providerId}` };
    }

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId,
      providerId,
      timestamp: Date.now()
    })).toString('base64');

    // Create provider instance
    const provider = createProvider(providerId);

    // Get authorization URL
    const authUrl = await provider.getAuthorizationUrl(redirectUri, state);

    return {
      authUrl,
      state,
      provider: providerInfo
    };
  } catch (error) {
    log('Error getting authorization URL:', error);
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Handle OAuth callback - exchange code for tokens and create connection
 * @param {string} code - Authorization code from OAuth callback
 * @param {string} state - State parameter for verification
 * @param {string} redirectUri - Must match original redirect URI
 * @returns {Promise<object>} - Created connection record
 */
export async function handleOAuthCallback(code, state, redirectUri) {
  try {
    // Decode and verify state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch {
      return { error: true, errorMessage: 'Invalid state parameter' };
    }

    const { userId, providerId, timestamp } = stateData;

    // Check state is not too old (30 minute max)
    if (Date.now() - timestamp > 30 * 60 * 1000) {
      return { error: true, errorMessage: 'Authorization expired. Please try again.' };
    }

    // Create provider instance
    const provider = createProvider(providerId);

    // Exchange code for tokens
    const tokens = await provider.exchangeCodeForTokens(code, redirectUri);

    // Verify connection
    provider.accessToken = tokens.accessToken;
    provider.refreshToken = tokens.refreshToken;
    provider.tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();

    const verification = await provider.verifyConnection();

    if (!verification.valid) {
      return { error: true, errorMessage: 'Failed to verify connection with ELD provider' };
    }

    // Store connection in database
    return await createConnection(userId, providerId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      companyName: verification.companyName,
      eldProviderName: verification.eldProvider
    });
  } catch (error) {
    log('OAuth callback error:', error);
    return {
      error: true,
      errorMessage: error instanceof ELDAuthError
        ? 'Authentication failed with ELD provider'
        : error.message
    };
  }
}

/**
 * Create a new ELD connection with OAuth tokens
 * @param {string} userId - User ID
 * @param {string} providerId - Provider ID (e.g., 'motive', 'samsara')
 * @param {object} tokenData - OAuth token data
 * @param {string} tokenData.accessToken - OAuth access token
 * @param {string} tokenData.refreshToken - OAuth refresh token
 * @param {number} tokenData.expiresIn - Token expiration in seconds
 * @param {string} tokenData.companyName - Company name from provider
 * @param {string} tokenData.eldProviderName - ELD provider name
 * @returns {Promise<object>} - Created connection record
 */
export async function createConnection(userId, providerId, tokenData) {
  try {
    const expiresAt = new Date(Date.now() + (tokenData.expiresIn || 3600) * 1000).toISOString();

    // Check if connection already exists for this user/provider
    const { data: existing } = await supabaseAdmin
      .from('eld_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', providerId)
      .single();

    if (existing) {
      // Update existing connection
      const { data, error } = await supabaseAdmin
        .from('eld_connections')
        .update({
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          token_expires_at: expiresAt,
          company_name: tokenData.companyName,
          eld_provider_name: tokenData.eldProviderName,
          status: 'active',
          error_message: null,
          metadata: {
            updatedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return { error: true, errorMessage: error.message };
      }

      log(`Updated existing connection for provider ${providerId}`);
      return { data, updated: true };
    }

    // Create new connection
    const { data, error } = await supabaseAdmin
      .from('eld_connections')
      .insert({
        user_id: userId,
        provider: providerId,
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: expiresAt,
        company_name: tokenData.companyName,
        eld_provider_name: tokenData.eldProviderName,
        status: 'active',
        sync_frequency_minutes: 60,
        metadata: {
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    log(`Created new connection for provider ${providerId}`);
    return { data, created: true };
  } catch (error) {
    log('Error creating ELD connection:', error);
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get a user's ELD connection for a specific provider
 * @param {string} userId - User ID
 * @param {string} providerId - Provider ID
 * @returns {Promise<object>} - Connection record or null
 */
export async function getConnection(userId, providerId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('eld_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', providerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { error: true, errorMessage: error.message };
    }

    return { data };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get all ELD connections for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Array of connection records
 */
export async function getAllConnections(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('eld_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Enhance with provider metadata
    const connections = (data || []).map(conn => {
      const providerInfo = getProviderInfo(conn.provider);
      return {
        ...conn,
        providerName: providerInfo?.name || conn.provider,
        providerLogo: providerInfo?.logo,
        providerFeatures: providerInfo?.features || []
      };
    });

    return { data: connections };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Disconnect/remove an ELD connection
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Success status
 */
export async function disconnectConnection(userId, connectionId) {
  try {
    // Verify ownership
    const { data: connection } = await supabaseAdmin
      .from('eld_connections')
      .select('id, user_id')
      .eq('id', connectionId)
      .single();

    if (!connection || connection.user_id !== userId) {
      return { error: true, errorMessage: 'Connection not found or access denied' };
    }

    // Soft delete - update status to disconnected and clear tokens
    const { error } = await supabaseAdmin
      .from('eld_connections')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    return { success: true };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Permanently delete an ELD connection and all associated data
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Success status
 */
export async function deleteConnection(userId, connectionId) {
  try {
    // Verify ownership
    const { data: connection } = await supabaseAdmin
      .from('eld_connections')
      .select('id, user_id')
      .eq('id', connectionId)
      .single();

    if (!connection || connection.user_id !== userId) {
      return { error: true, errorMessage: 'Connection not found or access denied' };
    }

    // Delete associated data first
    await supabaseAdmin.from('eld_sync_jobs').delete().eq('connection_id', connectionId);
    await supabaseAdmin.from('eld_entity_mappings').delete().eq('connection_id', connectionId);
    await supabaseAdmin.from('eld_vehicle_locations').delete().eq('connection_id', connectionId);
    await supabaseAdmin.from('eld_hos_logs').delete().eq('connection_id', connectionId);
    await supabaseAdmin.from('eld_ifta_mileage').delete().eq('connection_id', connectionId);
    await supabaseAdmin.from('eld_fault_codes').delete().eq('connection_id', connectionId);

    // Delete the connection
    const { error } = await supabaseAdmin
      .from('eld_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    return { success: true };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Update connection status
 * @param {string} connectionId - Connection UUID
 * @param {string} status - New status ('active', 'error', 'disconnected', 'token_expired')
 * @param {string} errorMessage - Error message if status is 'error'
 * @returns {Promise<object>} - Updated connection
 */
export async function updateConnectionStatus(connectionId, status, errorMessage = null) {
  try {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'error' && errorMessage) {
      updates.error_message = errorMessage;
    } else if (status === 'active') {
      updates.error_message = null;
    }

    const { data, error } = await supabaseAdmin
      .from('eld_connections')
      .update(updates)
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    return { data };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Update last sync timestamp
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Updated connection
 */
export async function updateLastSync(connectionId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('eld_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    return { data };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Refresh OAuth tokens for a connection
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Updated tokens
 */
export async function refreshConnectionTokens(connectionId) {
  try {
    const { data: connection, error } = await supabaseAdmin
      .from('eld_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !connection) {
      return { error: true, errorMessage: 'Connection not found' };
    }

    if (!connection.refresh_token) {
      return { error: true, errorMessage: 'No refresh token available' };
    }

    // Create provider instance with refresh token
    const provider = createProvider(connection.provider, {
      refreshToken: connection.refresh_token
    });

    // Refresh tokens
    const tokens = await provider.refreshAccessToken();

    // Update connection with new tokens
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('eld_connections')
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: expiresAt,
        status: 'active',
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (updateError) {
      return { error: true, errorMessage: updateError.message };
    }

    log(`Refreshed tokens for connection ${connectionId}`);
    return { data: updated };
  } catch (error) {
    log('Token refresh error:', error);

    // Update status to indicate token issue
    await updateConnectionStatus(connectionId, 'token_expired', 'Token refresh failed');

    return { error: true, errorMessage: error.message };
  }
}

/**
 * Verify a connection is still valid by testing the token
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Verification result
 */
export async function verifyConnection(connectionId) {
  try {
    const { data: connection, error } = await supabaseAdmin
      .from('eld_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !connection) {
      return { valid: false, error: 'Connection not found' };
    }

    if (!connection.access_token) {
      return { valid: false, error: 'No access token' };
    }

    // Check if token is expired
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt < fiveMinutesFromNow) {
        // Token expired or expiring soon - try to refresh
        log(`Token expiring soon for connection ${connectionId}, attempting refresh`);
        const refreshResult = await refreshConnectionTokens(connectionId);

        if (refreshResult.error) {
          return { valid: false, error: 'Token expired and refresh failed' };
        }

        // Use refreshed token
        connection.access_token = refreshResult.data.access_token;
      }
    }

    // Test the connection
    const provider = createProvider(connection.provider, {
      accessToken: connection.access_token
    });

    const verification = await provider.verifyConnection();

    if (!verification.valid) {
      await updateConnectionStatus(connectionId, 'error', 'Connection verification failed');
      return { valid: false, error: 'Token validation failed' };
    }

    // Update status to active if it was in error state
    if (connection.status !== 'active') {
      await updateConnectionStatus(connectionId, 'active');
    }

    return { valid: true, connectionDetails: verification };
  } catch (error) {
    if (error instanceof ELDAuthError) {
      await updateConnectionStatus(connectionId, 'error', 'Authentication failed');
      return { valid: false, error: 'Authentication failed' };
    }
    return { valid: false, error: error.message };
  }
}

/**
 * Get connection status summary for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Status summary
 */
export async function getConnectionStatus(userId) {
  try {
    const { data: connections, error } = await supabaseAdmin
      .from('eld_connections')
      .select('id, provider, status, eld_provider_name, company_name, last_sync_at, error_message, token_expires_at')
      .eq('user_id', userId)
      .neq('status', 'disconnected');

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Enhance with provider info
    const enhancedConnections = (connections || []).map(c => {
      const providerInfo = getProviderInfo(c.provider);
      return {
        ...c,
        providerName: providerInfo?.name || c.provider,
        providerLogo: providerInfo?.logo,
        tokenExpiresAt: c.token_expires_at,
        isTokenExpired: c.token_expires_at ? new Date(c.token_expires_at) < new Date() : false
      };
    });

    const hasActiveConnection = enhancedConnections.some(c => c.status === 'active');
    const hasError = enhancedConnections.some(c => c.status === 'error' || c.status === 'token_expired');

    return {
      connected: hasActiveConnection,
      hasError,
      connections: enhancedConnections,
      primaryConnection: enhancedConnections.find(c => c.status === 'active') || null,
      availableProviders: getSupportedProviders()
    };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get all active connections that need syncing
 * @param {number} syncThresholdMinutes - Minimum minutes since last sync
 * @returns {Promise<object>} - Connections needing sync
 */
export async function getConnectionsNeedingSync(syncThresholdMinutes = 60) {
  try {
    const thresholdTime = new Date(Date.now() - syncThresholdMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('eld_connections')
      .select(`
        id,
        user_id,
        provider,
        access_token,
        refresh_token,
        token_expires_at,
        eld_provider_name,
        sync_frequency_minutes,
        last_sync_at
      `)
      .eq('status', 'active')
      .or(`last_sync_at.is.null,last_sync_at.lt.${thresholdTime}`);

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Create a provider client for a connection
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<BaseELDProvider|null>} - Provider instance or null
 */
export async function createProviderForConnection(connectionId) {
  try {
    const { data: connection, error } = await supabaseAdmin
      .from('eld_connections')
      .select('provider, access_token, refresh_token, token_expires_at, status')
      .eq('id', connectionId)
      .single();

    if (error || !connection || !connection.access_token) {
      return null;
    }

    if (connection.status !== 'active') {
      return null;
    }

    // Check if token needs refresh
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

      if (expiresAt < fiveMinutesFromNow) {
        const refreshResult = await refreshConnectionTokens(connectionId);
        if (refreshResult.error) {
          return null;
        }
        connection.access_token = refreshResult.data.access_token;
      }
    }

    return createProvider(connection.provider, {
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      tokenExpiresAt: connection.token_expires_at
    });
  } catch (error) {
    log('Error creating provider for connection:', error);
    return null;
  }
}

/**
 * Get available providers list
 * @returns {Object[]} - List of supported providers with metadata
 */
export function getAvailableProviders() {
  return getSupportedProviders();
}

export default {
  getAuthorizationUrl,
  handleOAuthCallback,
  createConnection,
  getConnection,
  getAllConnections,
  disconnectConnection,
  deleteConnection,
  updateConnectionStatus,
  updateLastSync,
  refreshConnectionTokens,
  verifyConnection,
  getConnectionStatus,
  getConnectionsNeedingSync,
  createProviderForConnection,
  getAvailableProviders
};
