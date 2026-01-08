/**
 * QuickBooks Disconnect Route
 *
 * Disconnects user's QuickBooks Online integration.
 * Revokes OAuth tokens and clears connection data.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { disconnectConnection, deleteConnection, getConnection } from '@/lib/services/quickbooks/quickbooksConnectionService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/disconnect]', ...args);

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
 * Get the authenticated user from the Authorization header
 */
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * POST /api/quickbooks/disconnect
 *
 * Disconnect QuickBooks integration.
 * Body:
 *   - permanent: boolean - If true, permanently delete all data; otherwise soft disconnect
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is ok
    }

    const { permanent } = body;

    // Get existing connection
    const connectionResult = await getConnection(user.id);
    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json(
        { error: 'No QuickBooks connection found' },
        { status: 404 }
      );
    }

    let result;
    if (permanent) {
      // Permanently delete connection and all associated data
      log(`Permanently deleting QuickBooks connection for user: ${user.id}`);
      result = await deleteConnection(user.id);
    } else {
      // Soft disconnect - preserve sync history but invalidate tokens
      log(`Soft disconnecting QuickBooks for user: ${user.id}`);
      result = await disconnectConnection(user.id);
    }

    if (result.error) {
      return NextResponse.json({ error: result.errorMessage }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'QuickBooks connection deleted' : 'QuickBooks disconnected'
    });

  } catch (error) {
    log('Error in disconnect:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect QuickBooks' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quickbooks/disconnect
 *
 * Alias for POST with permanent=true
 */
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing connection
    const connectionResult = await getConnection(user.id);
    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json(
        { error: 'No QuickBooks connection found' },
        { status: 404 }
      );
    }

    // Permanently delete connection
    log(`Permanently deleting QuickBooks connection for user: ${user.id}`);
    const result = await deleteConnection(user.id);

    if (result.error) {
      return NextResponse.json({ error: result.errorMessage }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'QuickBooks connection deleted'
    });

  } catch (error) {
    log('Error in delete:', error);
    return NextResponse.json(
      { error: 'Failed to delete QuickBooks connection' },
      { status: 500 }
    );
  }
}
