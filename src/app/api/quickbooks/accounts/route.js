/**
 * QuickBooks Accounts Route
 *
 * Fetch QuickBooks Chart of Accounts for category mapping.
 * Returns expense accounts that can be mapped to Truck Command categories.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConnection } from '@/lib/services/quickbooks/quickbooksConnectionService';
import { fetchQbExpenseAccounts } from '@/lib/services/quickbooks/quickbooksMappingService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/accounts]', ...args);

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
 * Check if user has QuickBooks access
 */
async function checkQuickBooksAccess(userId) {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  const userPlan = subscription?.plan || 'basic';
  return hasFeature(userPlan, 'quickbooksIntegration');
}

/**
 * GET /api/quickbooks/accounts
 *
 * Get QuickBooks expense accounts for category mapping.
 * Returns list of available expense accounts from QuickBooks.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await checkQuickBooksAccess(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'QuickBooks integration requires Premium or higher plan' },
        { status: 403 }
      );
    }

    const connectionResult = await getConnection(user.id);
    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json(
        { error: 'QuickBooks not connected' },
        { status: 400 }
      );
    }

    const connection = connectionResult.data;

    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: `QuickBooks connection is ${connection.status}. Please reconnect.` },
        { status: 400 }
      );
    }

    log('Fetching QuickBooks expense accounts');
    const result = await fetchQbExpenseAccounts(connection.id);

    if (result.error) {
      return NextResponse.json({ error: result.errorMessage }, { status: 500 });
    }

    return NextResponse.json({
      accounts: result.accounts || [],
      companyName: connection.company_name
    });

  } catch (error) {
    log('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QuickBooks accounts' },
      { status: 500 }
    );
  }
}
