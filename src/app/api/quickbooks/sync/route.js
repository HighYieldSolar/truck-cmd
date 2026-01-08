/**
 * QuickBooks Sync Route
 *
 * Trigger sync operations between Truck Command and QuickBooks.
 * Supports syncing expenses, invoices, or bulk operations.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConnection } from '@/lib/services/quickbooks/quickbooksConnectionService';
import {
  syncExpense,
  syncInvoice,
  bulkSyncExpenses,
  bulkSyncInvoices,
  retryFailedSyncs,
  getSyncHistory
} from '@/lib/services/quickbooks/quickbooksSyncService';
import { hasFeature } from '@/config/tierConfig';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/sync]', ...args);

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
 * GET /api/quickbooks/sync
 *
 * Get sync history and status.
 * Query params:
 *   - limit: Number of history records to return (default: 20)
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const historyResult = await getSyncHistory(connectionResult.data.id, limit);

    return NextResponse.json({
      history: historyResult.data || []
    });

  } catch (error) {
    log('Error getting sync history:', error);
    return NextResponse.json(
      { error: 'Failed to get sync history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quickbooks/sync
 *
 * Trigger sync operation.
 * Body:
 *   - action: 'single-expense' | 'single-invoice' | 'bulk-expenses' | 'bulk-invoices' | 'retry-failed'
 *   - expenseId: For single expense sync
 *   - invoiceId: For single invoice sync
 *   - expenseIds: For bulk expense sync (optional, defaults to all unsynced)
 *   - invoiceIds: For bulk invoice sync (optional, defaults to all unsynced)
 *   - dateFrom: Filter for bulk sync
 *   - dateTo: Filter for bulk sync
 *   - category: Filter expenses by category for bulk sync
 */
export async function POST(request) {
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

    const body = await request.json();
    const { action, expenseId, invoiceId, expenseIds, invoiceIds, dateFrom, dateTo, category } = body;

    switch (action) {
      case 'single-expense': {
        if (!expenseId) {
          return NextResponse.json({ error: 'expenseId required' }, { status: 400 });
        }

        // Get the expense
        const { data: expense, error: expError } = await supabaseAdmin
          .from('expenses')
          .select('*')
          .eq('id', expenseId)
          .eq('user_id', user.id)
          .single();

        if (expError || !expense) {
          return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        log(`Syncing single expense: ${expenseId}`);
        const result = await syncExpense(connection.id, expense);

        if (result.error) {
          return NextResponse.json({ error: result.errorMessage }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Expense synced to QuickBooks',
          qbEntityId: result.qbEntityId
        });
      }

      case 'single-invoice': {
        if (!invoiceId) {
          return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });
        }

        // Get the invoice with items
        const { data: invoice, error: invError } = await supabaseAdmin
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('id', invoiceId)
          .eq('user_id', user.id)
          .single();

        if (invError || !invoice) {
          return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        log(`Syncing single invoice: ${invoiceId}`);
        const result = await syncInvoice(connection.id, invoice);

        if (result.error) {
          return NextResponse.json({ error: result.errorMessage }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Invoice synced to QuickBooks',
          qbEntityId: result.qbEntityId
        });
      }

      case 'bulk-expenses': {
        // If specific IDs provided, use them; otherwise fetch unsynced
        let expensesToSync;

        if (expenseIds && expenseIds.length > 0) {
          const { data, error } = await supabaseAdmin
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .in('id', expenseIds);

          if (error) {
            return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
          }
          expensesToSync = data || [];
        } else {
          // Build query for unsynced expenses
          let query = supabaseAdmin
            .from('expenses')
            .select('*')
            .eq('user_id', user.id);

          if (dateFrom) {
            query = query.gte('date', dateFrom);
          }
          if (dateTo) {
            query = query.lte('date', dateTo);
          }
          if (category) {
            query = query.eq('category', category);
          }

          const { data, error } = await query.order('date', { ascending: false });

          if (error) {
            return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
          }

          // Filter out already synced expenses
          const { data: syncedRecords } = await supabaseAdmin
            .from('quickbooks_sync_records')
            .select('local_entity_id')
            .eq('connection_id', connection.id)
            .eq('entity_type', 'expense')
            .eq('sync_status', 'synced');

          const syncedIds = new Set((syncedRecords || []).map(r => r.local_entity_id));
          expensesToSync = (data || []).filter(e => !syncedIds.has(e.id));
        }

        if (expensesToSync.length === 0) {
          return NextResponse.json({
            success: true,
            message: 'No expenses to sync',
            synced: 0,
            failed: 0
          });
        }

        log(`Bulk syncing ${expensesToSync.length} expenses`);
        const result = await bulkSyncExpenses(connection.id, user.id, expensesToSync.map(e => e.id));

        return NextResponse.json({
          success: true,
          message: `Synced ${result.synced} expenses to QuickBooks`,
          synced: result.synced,
          failed: result.failed,
          results: result.results
        });
      }

      case 'bulk-invoices': {
        // If specific IDs provided, use them; otherwise fetch unsynced
        let invoicesToSync;

        if (invoiceIds && invoiceIds.length > 0) {
          const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('*, invoice_items(*)')
            .eq('user_id', user.id)
            .in('id', invoiceIds);

          if (error) {
            return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
          }
          invoicesToSync = data || [];
        } else {
          // Build query for unsynced invoices
          let query = supabaseAdmin
            .from('invoices')
            .select('*, invoice_items(*)')
            .eq('user_id', user.id);

          if (dateFrom) {
            query = query.gte('invoice_date', dateFrom);
          }
          if (dateTo) {
            query = query.lte('invoice_date', dateTo);
          }

          const { data, error } = await query.order('invoice_date', { ascending: false });

          if (error) {
            return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
          }

          // Filter out already synced invoices
          const { data: syncedRecords } = await supabaseAdmin
            .from('quickbooks_sync_records')
            .select('local_entity_id')
            .eq('connection_id', connection.id)
            .eq('entity_type', 'invoice')
            .eq('sync_status', 'synced');

          const syncedIds = new Set((syncedRecords || []).map(r => r.local_entity_id));
          invoicesToSync = (data || []).filter(i => !syncedIds.has(i.id));
        }

        if (invoicesToSync.length === 0) {
          return NextResponse.json({
            success: true,
            message: 'No invoices to sync',
            synced: 0,
            failed: 0
          });
        }

        log(`Bulk syncing ${invoicesToSync.length} invoices`);
        const result = await bulkSyncInvoices(connection.id, user.id, invoicesToSync.map(i => i.id));

        return NextResponse.json({
          success: true,
          message: `Synced ${result.synced} invoices to QuickBooks`,
          synced: result.synced,
          failed: result.failed,
          results: result.results
        });
      }

      case 'retry-failed': {
        log('Retrying failed syncs');
        const result = await retryFailedSyncs(connection.id);

        return NextResponse.json({
          success: true,
          message: `Retried ${result.retried} failed syncs`,
          retried: result.retried,
          succeeded: result.succeeded,
          stillFailed: result.stillFailed
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: single-expense, single-invoice, bulk-expenses, bulk-invoices, retry-failed' },
          { status: 400 }
        );
    }

  } catch (error) {
    log('Error in sync:', error);
    return NextResponse.json(
      { error: 'Sync operation failed' },
      { status: 500 }
    );
  }
}
