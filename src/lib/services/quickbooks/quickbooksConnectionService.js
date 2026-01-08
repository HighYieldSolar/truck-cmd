/**
 * QuickBooks Connection Service
 *
 * Manages OAuth flow, token storage/refresh, and connection lifecycle
 * for QuickBooks Online integration.
 *
 * Follows the pattern established in: src/lib/services/eld/eldConnectionService.js
 */

import { createClient } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/connection]', ...args);

// QuickBooks OAuth endpoints
const QB_AUTH_ENDPOINT = 'https://appcenter.intuit.com/connect/oauth2';
const QB_TOKEN_ENDPOINT = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QB_REVOKE_ENDPOINT = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

// Environment-based API URL
const QB_API_BASE = process.env.QUICKBOOKS_ENVIRONMENT === 'production'
  ? 'https://quickbooks.api.intuit.com'
  : 'https://sandbox-quickbooks.api.intuit.com';

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
 * Encode state parameter for OAuth flow
 * @param {Object} stateData - State data to encode
 * @returns {string} Base64 encoded state
 */
function encodeState(stateData) {
  return Buffer.from(JSON.stringify(stateData)).toString('base64');
}

/**
 * Decode state parameter from OAuth callback
 * @param {string} stateParam - Base64 encoded state
 * @returns {Object|null} Decoded state data or null
 */
export function decodeState(stateParam) {
  try {
    const decoded = Buffer.from(stateParam, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (err) {
    log('Error decoding state:', err);
    return null;
  }
}

/**
 * Generate QuickBooks OAuth authorization URL
 * @param {string} userId - User ID initiating the connection
 * @param {string} redirectUri - OAuth callback URI
 * @param {Object} options - Additional options (reconnect, etc.)
 * @returns {Object} { authUrl, state } or { error, errorMessage }
 */
export function getAuthorizationUrl(userId, redirectUri, options = {}) {
  try {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;

    if (!clientId) {
      return {
        error: true,
        errorMessage: 'QuickBooks client ID not configured'
      };
    }

    // Build state with user info and timestamp for CSRF protection
    const state = encodeState({
      userId,
      timestamp: Date.now(),
      reconnect: options.reconnect || false,
      connectionId: options.connectionId || null
    });

    // OAuth 2.0 scopes for QuickBooks Online Accounting
    const scopes = [
      'com.intuit.quickbooks.accounting',
      'openid',
      'profile',
      'email'
    ].join(' ');

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: scopes,
      redirect_uri: redirectUri,
      state: state
    });

    const authUrl = `${QB_AUTH_ENDPOINT}?${params.toString()}`;

    log('Generated OAuth URL for user:', userId);

    return {
      authUrl,
      state
    };

  } catch (error) {
    log('Error generating auth URL:', error);
    return {
      error: true,
      errorMessage: 'Failed to generate authorization URL'
    };
  }
}

/**
 * Exchange authorization code for access/refresh tokens
 * @param {string} code - Authorization code from OAuth callback
 * @param {string} redirectUri - Redirect URI used in initial request
 * @returns {Object} Token response or error
 */
async function exchangeCodeForTokens(code, redirectUri) {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      error: true,
      errorMessage: 'QuickBooks credentials not configured'
    };
  }

  // Build Basic auth header
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch(QB_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    const data = await response.json();

    if (!response.ok) {
      log('Token exchange failed:', data);
      return {
        error: true,
        errorMessage: data.error_description || data.error || 'Token exchange failed'
      };
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in, // seconds until access token expires (3600)
      refreshTokenExpiresIn: data.x_refresh_token_expires_in // seconds (8726400 = 100 days)
    };

  } catch (error) {
    log('Token exchange error:', error);
    return {
      error: true,
      errorMessage: 'Failed to exchange authorization code'
    };
  }
}

/**
 * Fetch QuickBooks company info
 * @param {string} accessToken - Valid access token
 * @param {string} realmId - QuickBooks company ID
 * @returns {Object} Company info or error
 */
async function fetchCompanyInfo(accessToken, realmId) {
  try {
    const url = `${QB_API_BASE}/v3/company/${realmId}/companyinfo/${realmId}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      log('Failed to fetch company info');
      return null;
    }

    const data = await response.json();
    return data.CompanyInfo;

  } catch (error) {
    log('Error fetching company info:', error);
    return null;
  }
}

/**
 * Handle OAuth callback - exchange code for tokens and create/update connection
 * @param {string} code - Authorization code
 * @param {string} stateParam - Encoded state parameter
 * @param {string} realmId - QuickBooks company ID (realm ID)
 * @param {string} redirectUri - Redirect URI used in initial request
 * @returns {Object} Result with connection data or error
 */
export async function handleOAuthCallback(code, stateParam, realmId, redirectUri) {
  try {
    // Decode and validate state
    const state = decodeState(stateParam);
    if (!state || !state.userId) {
      return {
        error: true,
        errorMessage: 'Invalid callback state'
      };
    }

    const { userId, reconnect, connectionId } = state;

    // Validate timestamp (state should be less than 10 minutes old)
    const stateAge = Date.now() - state.timestamp;
    if (stateAge > 10 * 60 * 1000) {
      return {
        error: true,
        errorMessage: 'Authorization request expired'
      };
    }

    // Exchange code for tokens
    const tokenResult = await exchangeCodeForTokens(code, redirectUri);
    if (tokenResult.error) {
      return tokenResult;
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + tokenResult.expiresIn * 1000);

    // Fetch company info
    const companyInfo = await fetchCompanyInfo(tokenResult.accessToken, realmId);
    const companyName = companyInfo?.CompanyName || 'Unknown Company';

    // Check for existing connection
    const { data: existingConnection } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;

    if (existingConnection) {
      // Update existing connection
      const { data, error } = await supabaseAdmin
        .from('quickbooks_connections')
        .update({
          access_token: tokenResult.accessToken,
          refresh_token: tokenResult.refreshToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          realm_id: realmId,
          company_name: companyName,
          status: 'active',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        log('Error updating connection:', error);
        return {
          error: true,
          errorMessage: 'Failed to update connection'
        };
      }

      result = { data, updated: true };

    } else {
      // Create new connection
      const { data, error } = await supabaseAdmin
        .from('quickbooks_connections')
        .insert({
          user_id: userId,
          access_token: tokenResult.accessToken,
          refresh_token: tokenResult.refreshToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          realm_id: realmId,
          company_name: companyName,
          status: 'active',
          auto_sync_expenses: true,
          auto_sync_invoices: true
        })
        .select()
        .single();

      if (error) {
        log('Error creating connection:', error);
        return {
          error: true,
          errorMessage: 'Failed to create connection'
        };
      }

      result = { data, updated: false };
    }

    log(`Connection ${result.updated ? 'updated' : 'created'} for user ${userId}`);

    return {
      success: true,
      connection: result.data,
      updated: result.updated,
      companyName
    };

  } catch (error) {
    log('OAuth callback error:', error);
    return {
      error: true,
      errorMessage: 'Connection failed'
    };
  }
}

/**
 * Get user's QuickBooks connection
 * @param {string} userId - User ID
 * @returns {Object} Connection data or null
 */
export async function getConnection(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      log('Error fetching connection:', error);
      return { error: true, errorMessage: error.message };
    }

    return { data };

  } catch (error) {
    log('Error in getConnection:', error);
    return { error: true, errorMessage: 'Failed to fetch connection' };
  }
}

/**
 * Get connection by ID
 * @param {string} connectionId - Connection UUID
 * @returns {Object} Connection data or null
 */
export async function getConnectionById(connectionId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error) {
      log('Error fetching connection by ID:', error);
      return { error: true, errorMessage: error.message };
    }

    return { data };

  } catch (error) {
    log('Error in getConnectionById:', error);
    return { error: true, errorMessage: 'Failed to fetch connection' };
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} connectionId - Connection UUID
 * @returns {Object} New tokens or error
 */
export async function refreshTokens(connectionId) {
  try {
    // Get current connection
    const { data: connection, error: fetchError } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      return {
        error: true,
        errorMessage: 'Connection not found'
      };
    }

    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(QB_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token
      })
    });

    const data = await response.json();

    if (!response.ok) {
      log('Token refresh failed:', data);

      // Update connection status to token_expired
      await supabaseAdmin
        .from('quickbooks_connections')
        .update({
          status: 'token_expired',
          error_message: 'Refresh token expired. Please reconnect.',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);

      return {
        error: true,
        errorMessage: 'Token refresh failed. Please reconnect to QuickBooks.'
      };
    }

    // Calculate new expiry
    const tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Update connection with new tokens
    const { error: updateError } = await supabaseAdmin
      .from('quickbooks_connections')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: tokenExpiresAt.toISOString(),
        status: 'active',
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (updateError) {
      log('Error updating tokens:', updateError);
      return {
        error: true,
        errorMessage: 'Failed to save new tokens'
      };
    }

    log('Tokens refreshed for connection:', connectionId);

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: tokenExpiresAt
    };

  } catch (error) {
    log('Token refresh error:', error);
    return {
      error: true,
      errorMessage: 'Token refresh failed'
    };
  }
}

/**
 * Disconnect QuickBooks connection (revoke tokens)
 * @param {string} userId - User ID
 * @returns {Object} Success or error
 */
export async function disconnectConnection(userId) {
  try {
    // Get current connection
    const { data: connection } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!connection) {
      return {
        error: true,
        errorMessage: 'No connection found'
      };
    }

    // Revoke token at QuickBooks (best effort)
    try {
      const clientId = process.env.QUICKBOOKS_CLIENT_ID;
      const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      await fetch(QB_REVOKE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: connection.refresh_token
        })
      });
    } catch (revokeError) {
      log('Token revocation failed (continuing):', revokeError);
    }

    // Update connection status
    const { error: updateError } = await supabaseAdmin
      .from('quickbooks_connections')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      log('Error updating connection status:', updateError);
      return {
        error: true,
        errorMessage: 'Failed to disconnect'
      };
    }

    log('Disconnected QuickBooks for user:', userId);

    return { success: true };

  } catch (error) {
    log('Disconnect error:', error);
    return {
      error: true,
      errorMessage: 'Failed to disconnect'
    };
  }
}

/**
 * Delete QuickBooks connection and all related data
 * @param {string} userId - User ID
 * @returns {Object} Success or error
 */
export async function deleteConnection(userId) {
  try {
    // First disconnect (revoke tokens)
    await disconnectConnection(userId);

    // Delete connection (cascades to mappings, sync records, history)
    const { error } = await supabaseAdmin
      .from('quickbooks_connections')
      .delete()
      .eq('user_id', userId);

    if (error) {
      log('Error deleting connection:', error);
      return {
        error: true,
        errorMessage: 'Failed to delete connection'
      };
    }

    log('Deleted QuickBooks connection for user:', userId);

    return { success: true };

  } catch (error) {
    log('Delete connection error:', error);
    return {
      error: true,
      errorMessage: 'Failed to delete connection'
    };
  }
}

/**
 * Verify connection is valid and active
 * @param {string} connectionId - Connection UUID
 * @returns {Object} Verification result
 */
export async function verifyConnection(connectionId) {
  try {
    const { data: connection, error } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !connection) {
      return {
        valid: false,
        error: 'Connection not found'
      };
    }

    // Check if token is expired
    const tokenExpiry = new Date(connection.token_expires_at);
    const now = new Date();

    if (tokenExpiry < now) {
      // Token expired, try to refresh
      const refreshResult = await refreshTokens(connectionId);
      if (refreshResult.error) {
        return {
          valid: false,
          status: 'token_expired',
          error: refreshResult.errorMessage
        };
      }
    }

    // Try to make a test API call
    const companyInfo = await fetchCompanyInfo(
      connection.access_token,
      connection.realm_id
    );

    if (!companyInfo) {
      return {
        valid: false,
        status: 'api_error',
        error: 'Failed to verify connection with QuickBooks'
      };
    }

    return {
      valid: true,
      status: 'active',
      companyName: companyInfo.CompanyName
    };

  } catch (error) {
    log('Verify connection error:', error);
    return {
      valid: false,
      error: 'Verification failed'
    };
  }
}

/**
 * Update connection status
 * @param {string} connectionId - Connection UUID
 * @param {string} status - New status
 * @param {string} errorMessage - Optional error message
 */
export async function updateConnectionStatus(connectionId, status, errorMessage = null) {
  try {
    await supabaseAdmin
      .from('quickbooks_connections')
      .update({
        status,
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);

    log(`Updated connection ${connectionId} status to: ${status}`);

  } catch (error) {
    log('Error updating connection status:', error);
  }
}

/**
 * Get connection status summary for a user
 * @param {string} userId - User ID
 * @returns {Object} Status summary
 */
export async function getConnectionStatus(userId) {
  try {
    const { data: connection } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('id, status, company_name, last_sync_at, error_message, created_at')
      .eq('user_id', userId)
      .single();

    if (!connection) {
      return {
        connected: false,
        status: 'not_connected'
      };
    }

    // Get sync stats
    const { count: expensesSynced } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connection.id)
      .eq('entity_type', 'expense')
      .eq('sync_status', 'synced');

    const { count: invoicesSynced } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connection.id)
      .eq('entity_type', 'invoice')
      .eq('sync_status', 'synced');

    return {
      connected: connection.status === 'active',
      status: connection.status,
      companyName: connection.company_name,
      lastSyncAt: connection.last_sync_at,
      errorMessage: connection.error_message,
      connectedAt: connection.created_at,
      syncStats: {
        expenses: expensesSynced || 0,
        invoices: invoicesSynced || 0
      }
    };

  } catch (error) {
    log('Error getting connection status:', error);
    return {
      connected: false,
      status: 'error',
      errorMessage: 'Failed to get connection status'
    };
  }
}
