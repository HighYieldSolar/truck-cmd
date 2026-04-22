/**
 * QuickBooks Sync Service
 *
 * Handles syncing expenses from Truck Command to QuickBooks Online.
 * One-way push sync: TC -> QuickBooks (Purchase entity)
 *
 * Invoice sync was removed. This service handles expenses only.
 */

import { createClient } from '@supabase/supabase-js';
import {
  createClientWithRefresh,
  createPurchase,
  getBankAccounts,
  getCreditCardAccounts,
} from './quickbooksApiClient';
import { getMappingForCategory } from './quickbooksMappingService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/sync]', ...args);

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Pagination size for bulk sync (prevents memory/timeout issues)
const BULK_SYNC_PAGE_SIZE = 50;

// In-memory lock to prevent concurrent syncs of the same entity
const syncLocks = new Set();

function acquireSyncLock(key) {
  if (syncLocks.has(key)) return false;
  syncLocks.add(key);
  return true;
}

function releaseSyncLock(key) {
  syncLocks.delete(key);
}

/**
 * Map TC payment method to QB PaymentType
 */
const PAYMENT_METHOD_MAP = {
  'Credit Card': 'CreditCard',
  'Debit Card': 'CreditCard',
  'Cash': 'Cash',
  'Check': 'Check',
  'Bank Transfer': 'Check',
  'EFT': 'Check',
  'Fuel Card': 'CreditCard',
  'Other': 'Cash',
};

/**
 * Map TC expense to QB Purchase object
 * @param {Object} expense - TC expense object
 * @param {Object} mapping - Category mapping (expense account)
 * @param {Object} paymentAccount - Payment source account (Bank or Credit Card)
 * @returns {Object} QB Purchase object
 */
function mapExpenseToPurchase(expense, mapping, paymentAccount) {
  const paymentType = PAYMENT_METHOD_MAP[expense.payment_method] || 'Cash';

  return {
    PaymentType: paymentType,
    TxnDate: expense.date,
    TotalAmt: parseFloat(expense.amount),
    // Root-level AccountRef is REQUIRED - specifies which Bank/Credit Card the payment comes FROM
    AccountRef: {
      value: paymentAccount.Id,
      name: paymentAccount.Name,
    },
    PrivateNote: [
      expense.notes,
      expense.deductible ? '(Tax Deductible)' : null,
      `TC ID: ${expense.id}`,
    ]
      .filter(Boolean)
      .join(' | '),
    Line: [
      {
        DetailType: 'AccountBasedExpenseLineDetail',
        Amount: parseFloat(expense.amount),
        Description: expense.description,
        AccountBasedExpenseLineDetail: {
          // This AccountRef categorizes the expense (Fuel, Maintenance, etc.)
          AccountRef: {
            value: mapping.qb_account_id,
            name: mapping.qb_account_name,
          },
        },
      },
    ],
  };
}

/**
 * Record a sync operation in sync_records table
 */
async function recordSync(connectionId, userId, entityType, localEntityId, qbEntityId, status, errorMessage = null) {
  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .upsert(
        {
          connection_id: connectionId,
          user_id: userId,
          entity_type: entityType,
          local_entity_id: localEntityId,
          qb_entity_id: qbEntityId,
          qb_entity_type: 'Purchase',
          sync_status: status,
          last_synced_at: new Date().toISOString(),
          error_message: errorMessage,
          local_updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'connection_id,entity_type,local_entity_id',
        }
      )
      .select()
      .single();

    return { data, error };
  } catch (error) {
    log('Error recording sync:', error);
    return { error };
  }
}

/**
 * Start a sync history record
 */
async function startSyncHistory(connectionId, userId, syncType, entityTypes) {
  try {
    const { data } = await supabaseAdmin
      .from('quickbooks_sync_history')
      .insert({
        connection_id: connectionId,
        user_id: userId,
        sync_type: syncType,
        entity_types: entityTypes,
        status: 'started',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    return data?.id;
  } catch (error) {
    log('Error starting sync history:', error);
    return null;
  }
}

/**
 * Complete a sync history record
 */
async function completeSyncHistory(historyId, status, recordsSynced, recordsFailed, errorMessage = null) {
  try {
    await supabaseAdmin
      .from('quickbooks_sync_history')
      .update({
        status,
        records_synced: recordsSynced,
        records_failed: recordsFailed,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', historyId);
  } catch (error) {
    log('Error completing sync history:', error);
  }
}

/**
 * Update connection's last sync timestamp
 */
async function updateLastSync(connectionId) {
  try {
    await supabaseAdmin
      .from('quickbooks_connections')
      .update({
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', connectionId);
  } catch (error) {
    log('Error updating last sync:', error);
  }
}

/**
 * Get the appropriate payment account based on payment type
 */
async function getPaymentAccount(client, paymentMethod, connection) {
  const paymentType = PAYMENT_METHOD_MAP[paymentMethod] || 'Cash';

  let bankAccountId = connection.default_bank_account_id;
  let bankAccountName = connection.default_bank_account_name;
  let creditCardAccountId = connection.default_cc_account_id;
  let creditCardAccountName = connection.default_cc_account_name;

  if (paymentType === 'CreditCard') {
    if (creditCardAccountId) {
      return { Id: creditCardAccountId, Name: creditCardAccountName };
    }

    const ccAccounts = await getCreditCardAccounts(client);
    if (ccAccounts.length > 0) {
      const account = ccAccounts[0];
      await cachePaymentAccount(connection.id, 'credit_card', account);
      return account;
    }

    log('No Credit Card accounts found, falling back to Bank account');
  }

  if (bankAccountId) {
    return { Id: bankAccountId, Name: bankAccountName };
  }

  const bankAccounts = await getBankAccounts(client);
  if (bankAccounts.length > 0) {
    const account = bankAccounts[0];
    await cachePaymentAccount(connection.id, 'bank', account);
    return account;
  }

  return null;
}

/**
 * Cache a payment account on the connection for future use
 */
async function cachePaymentAccount(connectionId, type, account) {
  try {
    const updateData =
      type === 'bank'
        ? { default_bank_account_id: account.Id, default_bank_account_name: account.Name }
        : { default_cc_account_id: account.Id, default_cc_account_name: account.Name };

    await supabaseAdmin.from('quickbooks_connections').update(updateData).eq('id', connectionId);
  } catch (error) {
    log('Failed to cache payment account:', error);
  }
}

/**
 * Sync a single expense to QuickBooks.
 * Protected against concurrent syncs of the same expense.
 *
 * @param {string} connectionId - Connection UUID
 * @param {Object} expense - Expense object from TC
 * @returns {Object} Sync result
 */
export async function syncExpense(connectionId, expense) {
  const lockKey = `expense:${connectionId}:${expense.id}`;

  if (!acquireSyncLock(lockKey)) {
    return {
      error: true,
      errorMessage: 'This expense is already being synced. Please wait.',
      concurrent: true,
    };
  }

  try {
    // Check if this expense is already successfully synced (prevent duplicates)
    const { data: existingRecord } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('sync_status, qb_entity_id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'expense')
      .eq('local_entity_id', expense.id)
      .maybeSingle();

    if (existingRecord?.sync_status === 'synced' && existingRecord.qb_entity_id) {
      log(`Expense ${expense.id} already synced (QB ID: ${existingRecord.qb_entity_id})`);
      return {
        success: true,
        alreadySynced: true,
        qbEntityId: existingRecord.qb_entity_id,
        qbEntityType: 'Purchase',
      };
    }

    // Get category mapping
    const mapping = await getMappingForCategory(connectionId, expense.category);

    if (!mapping) {
      const errorMsg = `No QuickBooks account mapped for category: ${expense.category}`;

      // Record the mapping error so user can see it
      try {
        const { data: conn } = await supabaseAdmin
          .from('quickbooks_connections')
          .select('user_id')
          .eq('id', connectionId)
          .single();

        if (conn) {
          await recordSync(connectionId, conn.user_id, 'expense', expense.id, null, 'failed', errorMsg);
        }
      } catch (e) {
        // Ignore
      }

      return {
        error: true,
        errorMessage: errorMsg,
        missingMapping: true,
        category: expense.category,
      };
    }

    // Get QB client
    const { client, connection, error: clientError, errorMessage } = await createClientWithRefresh(connectionId);

    if (clientError) {
      return { error: true, errorMessage };
    }

    // Get appropriate payment account (Bank or Credit Card)
    const paymentAccount = await getPaymentAccount(client, expense.payment_method, connection);

    if (!paymentAccount) {
      return {
        error: true,
        errorMessage: 'No Bank or Credit Card account found in QuickBooks. Please create one first.',
      };
    }

    // Map and create purchase
    const purchaseData = mapExpenseToPurchase(expense, mapping, paymentAccount);
    const result = await createPurchase(client, purchaseData);

    if (!result || !result.Id) {
      return {
        error: true,
        errorMessage: 'Failed to create purchase in QuickBooks',
      };
    }

    // Record successful sync
    await recordSync(connectionId, connection.user_id, 'expense', expense.id, result.Id, 'synced');

    log(`Synced expense ${expense.id} -> QB Purchase ${result.Id}`);

    return {
      success: true,
      qbEntityId: result.Id,
      qbEntityType: 'Purchase',
    };
  } catch (error) {
    log('Error syncing expense:', error);

    try {
      const { data: conn } = await supabaseAdmin
        .from('quickbooks_connections')
        .select('user_id')
        .eq('id', connectionId)
        .single();

      if (conn) {
        await recordSync(connectionId, conn.user_id, 'expense', expense.id, null, 'failed', error.message);
      }
    } catch (e) {
      // Ignore
    }

    return {
      error: true,
      errorMessage: error.message || 'Failed to sync expense',
    };
  } finally {
    releaseSyncLock(lockKey);
  }
}

/**
 * Bulk sync expenses to QuickBooks with pagination.
 *
 * Paginates through expenses in chunks of BULK_SYNC_PAGE_SIZE to avoid
 * Vercel timeout (10s for hobby, 60s for pro) on large datasets.
 *
 * @param {string} connectionId - Connection UUID
 * @param {string} userId - User ID
 * @param {Object} options - Sync options (expenseIds, dateRange, etc.)
 * @returns {Object} Bulk sync result
 */
export async function bulkSyncExpenses(connectionId, userId, options = {}) {
  const { expenseIds, startDate, endDate, categories, maxRecords } = options;

  try {
    // Get already synced expense IDs (we'll check once upfront)
    const { data: syncedRecords } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('local_entity_id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'expense')
      .eq('sync_status', 'synced');

    const syncedIds = new Set(syncedRecords?.map((r) => r.local_entity_id) || []);

    // Start sync history
    const historyId = await startSyncHistory(connectionId, userId, 'bulk', ['expense']);

    let synced = 0;
    let failed = 0;
    let totalProcessed = 0;
    const errors = [];
    const hardCap = maxRecords || 500; // Cap total records per bulk sync to prevent abuse

    // Paginate through expenses
    let offset = 0;
    let hasMore = true;

    while (hasMore && totalProcessed < hardCap) {
      let query = supabaseAdmin.from('expenses').select('*').eq('user_id', userId);

      if (expenseIds && expenseIds.length > 0) {
        query = query.in('id', expenseIds);
      }
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      if (categories && categories.length > 0) {
        query = query.in('category', categories);
      }

      query = query.order('date', { ascending: true }).range(offset, offset + BULK_SYNC_PAGE_SIZE - 1);

      const { data: expensesPage, error: queryError } = await query;

      if (queryError) {
        await completeSyncHistory(historyId, 'failed', synced, failed, queryError.message);
        return { error: true, errorMessage: queryError.message };
      }

      if (!expensesPage || expensesPage.length === 0) {
        hasMore = false;
        break;
      }

      // Filter out already-synced expenses
      const toSync = expensesPage.filter((e) => !syncedIds.has(e.id));

      for (const expense of toSync) {
        if (totalProcessed >= hardCap) {
          hasMore = false;
          break;
        }

        const result = await syncExpense(connectionId, expense);
        totalProcessed++;

        if (result.success) {
          synced++;
        } else if (!result.concurrent) {
          failed++;
          errors.push({
            expenseId: expense.id,
            description: expense.description,
            error: result.errorMessage,
            missingMapping: result.missingMapping,
          });
        }

        // Rate limit courtesy: small delay between syncs
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // If this page was smaller than page size, we're done
      if (expensesPage.length < BULK_SYNC_PAGE_SIZE) {
        hasMore = false;
      }

      offset += BULK_SYNC_PAGE_SIZE;
    }

    // Complete sync history
    const status = failed === 0 ? 'completed' : synced > 0 ? 'partial' : 'failed';
    await completeSyncHistory(historyId, status, synced, failed);
    await updateLastSync(connectionId);

    log(`Bulk sync complete: ${synced} synced, ${failed} failed (${totalProcessed} processed)`);

    return {
      success: true,
      synced,
      failed,
      total: totalProcessed,
      reachedCap: totalProcessed >= hardCap,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    log('Error in bulk sync expenses:', error);
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get sync status for a user
 * @param {string} userId - User ID
 * @returns {Object} Sync status summary
 */
export async function getSyncStatus(userId) {
  try {
    const { data: connection } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('id, status, last_sync_at')
      .eq('user_id', userId)
      .single();

    if (!connection) {
      return { connected: false };
    }

    const { count: expensesSynced } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connection.id)
      .eq('entity_type', 'expense')
      .eq('sync_status', 'synced');

    const { count: pendingCount } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connection.id)
      .eq('sync_status', 'pending');

    const { count: failedCount } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connection.id)
      .eq('sync_status', 'failed');

    return {
      connected: connection.status === 'active',
      lastSyncAt: connection.last_sync_at,
      stats: {
        expensesSynced: expensesSynced || 0,
        pending: pendingCount || 0,
        failed: failedCount || 0,
      },
    };
  } catch (error) {
    log('Error getting sync status:', error);
    return { error: true, errorMessage: 'Failed to get sync status' };
  }
}

/**
 * Get sync history for a connection
 */
export async function getSyncHistory(connectionId, limit = 10) {
  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_sync_history')
      .select('*')
      .eq('connection_id', connectionId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    log('Error getting sync history:', error);
    return { error: true, errorMessage: 'Failed to get sync history' };
  }
}

/**
 * Get sync record for a specific entity
 */
export async function getSyncRecord(connectionId, entityType, localEntityId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('entity_type', entityType)
      .eq('local_entity_id', localEntityId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return null;
    }

    return data;
  } catch (error) {
    log('Error getting sync record:', error);
    return null;
  }
}

/**
 * Retry failed syncs
 */
export async function retryFailedSyncs(connectionId) {
  try {
    const { data: failedRecords, error } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'expense')
      .eq('sync_status', 'failed');

    if (error || !failedRecords || failedRecords.length === 0) {
      return { success: true, retried: 0, message: 'No failed syncs to retry' };
    }

    let succeeded = 0;
    let stillFailed = 0;

    for (const record of failedRecords) {
      const { data: expense } = await supabaseAdmin
        .from('expenses')
        .select('*')
        .eq('id', record.local_entity_id)
        .single();

      if (!expense) {
        continue;
      }

      const result = await syncExpense(connectionId, expense);

      if (result.success) {
        succeeded++;
      } else {
        stillFailed++;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      success: true,
      retried: failedRecords.length,
      succeeded,
      stillFailed,
    };
  } catch (error) {
    log('Error retrying failed syncs:', error);
    return { error: true, errorMessage: 'Failed to retry syncs' };
  }
}
