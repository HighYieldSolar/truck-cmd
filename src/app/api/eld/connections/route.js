/**
 * ELD Connections Route
 *
 * CRUD operations for ELD connections with multi-provider OAuth support.
 * Supports Motive, Samsara direct API integrations.
 * Requires authenticated user with Premium+ subscription.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getConnection,
  getAllConnections,
  disconnectConnection,
  deleteConnection,
  verifyConnection,
  getConnectionStatus,
  getAuthorizationUrl
} from '@/lib/services/eld/eldConnectionService';
import { getMappings, autoMatchVehicles, autoMatchDrivers } from '@/lib/services/eld/eldMappingService';
import { getSupportedProviders, getProviderInfo } from '@/lib/services/eld/providers';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eld/connections]', ...args);

// Initialize Supabase admin client
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
 * Create an authenticated Supabase client with the user's token
 */
function createAuthenticatedClient(accessToken) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
}

/**
 * Get the authenticated user from the Authorization header
 */
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createAuthenticatedClient(token);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Check if user has ELD access
 */
async function checkEldAccess(userId) {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  const userPlan = subscription?.plan || 'basic';
  return hasFeature(userPlan, 'eldIntegration');
}

/**
 * GET /api/eld/connections
 *
 * Get user's ELD connections and status.
 * Query params:
 *   - provider: Filter by provider (optional)
 *   - includeMapping: Include entity mappings (optional)
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ELD access
    const hasAccess = await checkEldAccess(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'ELD integration requires Premium or higher plan' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const includeMappings = searchParams.get('includeMappings') === 'true';

    // Get connection status summary
    const statusResult = await getConnectionStatus(user.id);
    if (statusResult.error) {
      return NextResponse.json({ error: statusResult.errorMessage }, { status: 500 });
    }

    // Get all connections or specific provider
    let connections;
    if (provider) {
      const result = await getConnection(user.id, provider);
      connections = result.data ? [result.data] : [];
    } else {
      const result = await getAllConnections(user.id);
      connections = result.data || [];
    }

    // Optionally include mappings for each connection
    if (includeMappings) {
      for (const connection of connections) {
        const mappingsResult = await getMappings(connection.id);
        connection.mappings = mappingsResult.data || [];
      }
    }

    return NextResponse.json({
      connected: statusResult.connected,
      hasError: statusResult.hasError,
      primaryConnection: statusResult.primaryConnection,
      connections: connections,
      supportedProviders: getSupportedProviders()
    });

  } catch (error) {
    log('Error getting connections:', error);
    return NextResponse.json(
      { error: 'Failed to get connections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/eld/connections
 *
 * Create a new connection or trigger actions on existing connection.
 * Body:
 *   - action: 'verify' | 'auto-match' | 'initiate-oauth' | 'list-providers'
 *   - connectionId: For verify/auto-match actions
 *   - provider: For initiate-oauth action (motive, samsara)
 *   - reconnect: For reconnection flow
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ELD access
    const hasAccess = await checkEldAccess(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'ELD integration requires Premium or higher plan' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, connectionId, provider, reconnect } = body;

    switch (action) {
      case 'verify': {
        // Verify an existing connection is still valid
        if (!connectionId) {
          return NextResponse.json({ error: 'connectionId required' }, { status: 400 });
        }

        const result = await verifyConnection(connectionId);
        return NextResponse.json(result);
      }

      case 'auto-match': {
        // Auto-match vehicles and drivers for a connection
        if (!connectionId) {
          return NextResponse.json({ error: 'connectionId required' }, { status: 400 });
        }

        const vehicleMatches = await autoMatchVehicles(user.id, connectionId);
        const driverMatches = await autoMatchDrivers(user.id, connectionId);

        return NextResponse.json({
          success: true,
          vehicleMatches: vehicleMatches.data || [],
          driverMatches: driverMatches.data || []
        });
      }

      case 'initiate-oauth': {
        // Initiate OAuth flow with a specific provider
        if (!provider) {
          return NextResponse.json({ error: 'provider required' }, { status: 400 });
        }

        // Validate provider
        const providerInfo = getProviderInfo(provider);
        if (!providerInfo) {
          return NextResponse.json(
            { error: `Unsupported provider: ${provider}. Supported: motive, samsara` },
            { status: 400 }
          );
        }

        // Get OAuth authorization URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${baseUrl}/api/eld/callback`;

        const result = getAuthorizationUrl(provider, user.id, redirectUri, {
          reconnect,
          connectionId
        });

        if (result.error) {
          return NextResponse.json(
            { error: result.errorMessage || 'Failed to generate authorization URL' },
            { status: 500 }
          );
        }

        log('Generated OAuth URL for provider:', provider);

        return NextResponse.json({
          authUrl: result.authUrl,
          provider: providerInfo.id,
          providerName: providerInfo.name
        });
      }

      case 'list-providers': {
        // Return list of supported providers
        return NextResponse.json({
          providers: getSupportedProviders()
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    log('Error in POST:', error);
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/eld/connections
 *
 * Disconnect or delete an ELD connection.
 * Body:
 *   - connectionId: Connection UUID
 *   - permanent: If true, permanently delete; otherwise soft disconnect
 */
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, permanent } = body;

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId required' }, { status: 400 });
    }

    let result;
    if (permanent) {
      // Permanently delete connection and all associated data
      result = await deleteConnection(user.id, connectionId);
    } else {
      // Soft disconnect - preserve data but invalidate token
      result = await disconnectConnection(user.id, connectionId);
    }

    if (result.error) {
      return NextResponse.json({ error: result.errorMessage }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Connection deleted' : 'Connection disconnected'
    });

  } catch (error) {
    log('Error in DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
