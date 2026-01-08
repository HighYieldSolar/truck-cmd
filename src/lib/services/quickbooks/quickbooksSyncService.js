/**
 * QuickBooks Sync Service
 *
 * Handles syncing expenses and invoices from Truck Command to QuickBooks Online.
 * One-way push sync: TC -> QuickBooks
 */

import { createClient } from '@supabase/supabase-js';
import {
  createClientWithRefresh,
  createPurchase,
  createInvoice,
  findOrCreateCustomer,
  getBankAccounts,
  getCreditCardAccounts
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
      persistSession: false
    }
  }
);

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
  'Other': 'Cash'
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
      name: paymentAccount.Name
    },
    PrivateNote: [
      expense.notes,
      expense.deductible ? '(Tax Deductible)' : null,
      `TC ID: ${expense.id}`
    ].filter(Boolean).join(' | '),
    Line: [{
      DetailType: 'AccountBasedExpenseLineDetail',
      Amount: parseFloat(expense.amount),
      Description: expense.description,
      AccountBasedExpenseLineDetail: {
        // This AccountRef categorizes the expense (Fuel, Maintenance, etc.)
        AccountRef: {
          value: mapping.qb_account_id,
          name: mapping.qb_account_name
        }
      }
    }]
  };
}

/**
 * Map TC invoice to QB Invoice object
 * @param {Object} invoice - TC invoice object
 * @param {string} qbCustomerId - QB Customer ID
 * @returns {Object} QB Invoice object
 */
function mapInvoiceToQbInvoice(invoice, qbCustomerId) {
  // Parse line items from invoice
  const lineItems = invoice.line_items || [];

  // If no line items, create a single line from total
  const lines = lineItems.length > 0
    ? lineItems.map((item, index) => ({
        DetailType: 'SalesItemLineDetail',
        Amount: parseFloat(item.amount || item.quantity * item.unit_price || 0),
        Description: item.description || invoice.description || 'Transportation Services',
        LineNum: index + 1,
        SalesItemLineDetail: {
          Qty: parseFloat(item.quantity || 1),
          UnitPrice: parseFloat(item.unit_price || item.amount || 0),
          ItemRef: {
            value: '1', // Default Services item
            name: 'Services'
          }
        }
      }))
    : [{
        DetailType: 'SalesItemLineDetail',
        Amount: parseFloat(invoice.total_amount || invoice.amount || 0),
        Description: invoice.description || 'Transportation Services',
        LineNum: 1,
        SalesItemLineDetail: {
          Qty: 1,
          UnitPrice: parseFloat(invoice.total_amount || invoice.amount || 0),
          ItemRef: {
            value: '1',
            name: 'Services'
          }
        }
      }];

  return {
    CustomerRef: {
      value: qbCustomerId
    },
    TxnDate: invoice.invoice_date || invoice.created_at?.split('T')[0],
    DueDate: invoice.due_date,
    DocNumber: invoice.invoice_number,
    PrivateNote: `TC Invoice ID: ${invoice.id}`,
    Line: lines,
    CustomerMemo: invoice.notes ? { value: invoice.notes } : undefined
  };
}

/**
 * Record a sync operation in sync_records table
 */
async function recordSync(connectionId, userId, entityType, localEntityId, qbEntityId, status, errorMessage = null) {
  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .upsert({
        connection_id: connectionId,
        user_id: userId,
        entity_type: entityType,
        local_entity_id: localEntityId,
        qb_entity_id: qbEntityId,
        qb_entity_type: entityType === 'expense' ? 'Purchase' : 'Invoice',
        sync_status: status,
        last_synced_at: new Date().toISOString(),
        error_message: errorMessage,
        local_updated_at: new Date().toISOString()
      }, {
        onConflict: 'connection_id,entity_type,local_entity_id'
      })
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
    const { data, error } = await supabaseAdmin
      .from('quickbooks_sync_history')
      .insert({
        connection_id: connectionId,
        user_id: userId,
        sync_type: syncType,
        entity_types: entityTypes,
        status: 'started',
        started_at: new Date().toISOString()
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
        completed_at: new Date().toISOString()
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
        last_sync_at: new Date().toISOString()
      })
      .eq('id', connectionId);

  } catch (error) {
    log('Error updating last sync:', error);
  }
}

/**
 * Get the appropriate payment account based on payment type
 * @param {QuickBooks} client - QuickBooks client
 * @param {string} paymentMethod - TC payment method
 * @param {Object} connection - Connection object with cached accounts
 * @returns {Object} Payment account or null
 */
async function getPaymentAccount(client, paymentMethod, connection) {
  const paymentType = PAYMENT_METHOD_MAP[paymentMethod] || 'Cash';

  // Check if we have cached payment accounts in the connection
  let bankAccountId = connection.default_bank_account_id;
  let bankAccountName = connection.default_bank_account_name;
  let creditCardAccountId = connection.default_cc_account_id;
  let creditCardAccountName = connection.default_cc_account_name;

  // For Credit Card payments, use Credit Card account
  if (paymentType === 'CreditCard') {
    if (creditCardAccountId) {
      return { Id: creditCardAccountId, Name: creditCardAccountName };
    }

    // Fetch credit card accounts from QB
    const ccAccounts = await getCreditCardAccounts(client);
    if (ccAccounts.length > 0) {
      const account = ccAccounts[0];
      // Cache it for future use
      await cachePaymentAccount(connection.id, 'credit_card', account);
      return account;
    }

    // Fall back to bank account if no CC account exists
    log('No Credit Card accounts found, falling back to Bank account');
  }

  // For Cash/Check payments (or fallback), use Bank account
  if (bankAccountId) {
    return { Id: bankAccountId, Name: bankAccountName };
  }

  // Fetch bank accounts from QB
  const bankAccounts = await getBankAccounts(client);
  if (bankAccounts.length > 0) {
    const account = bankAccounts[0];
    // Cache it for future use
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
    const updateData = type === 'bank'
      ? { default_bank_account_id: account.Id, default_bank_account_name: account.Name }
      : { default_cc_account_id: account.Id, default_cc_account_name: account.Name };

    await supabaseAdmin
      .from('quickbooks_connections')
      .update(updateData)
      .eq('id', connectionId);

    log(`Cached ${type} account: ${account.Name} (${account.Id})`);
  } catch (error) {
    log('Failed to cache payment account:', error);
    // Non-fatal - continue without caching
  }
}

/**
 * Sync a single expense to QuickBooks
 * @param {string} connectionId - Connection UUID
 * @param {Object} expense - Expense object from TC
 * @returns {Object} Sync result
 */
export async function syncExpense(connectionId, expense) {
  try {
    // Get category mapping
    const mapping = await getMappingForCategory(connectionId, expense.category);

    if (!mapping) {
      return {
        error: true,
        errorMessage: `No QuickBooks account mapped for category: ${expense.category}`
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
        errorMessage: 'No Bank or Credit Card account found in QuickBooks. Please create one first.'
      };
    }

    log(`Using payment account: ${paymentAccount.Name} (${paymentAccount.Id}) for ${expense.payment_method}`);

    // Map and create purchase
    const purchaseData = mapExpenseToPurchase(expense, mapping, paymentAccount);

    const result = await createPurchase(client, purchaseData);

    if (!result || !result.Id) {
      return {
        error: true,
        errorMessage: 'Failed to create purchase in QuickBooks'
      };
    }

    // Record successful sync
    await recordSync(
      connectionId,
      connection.user_id,
      'expense',
      expense.id,
      result.Id,
      'synced'
    );

    log(`Synced expense ${expense.id} -> QB Purchase ${result.Id}`);

    return {
      success: true,
      qbEntityId: result.Id,
      qbEntityType: 'Purchase'
    };

  } catch (error) {
    log('Error syncing expense:', error);

    // Record failed sync
    try {
      const { data: conn } = await supabaseAdmin
        .from('quickbooks_connections')
        .select('user_id')
        .eq('id', connectionId)
        .single();

      if (conn) {
        await recordSync(
          connectionId,
          conn.user_id,
          'expense',
          expense.id,
          'error',
          'failed',
          error.message
        );
      }
    } catch (e) {
      // Ignore
    }

    return {
      error: true,
      errorMessage: error.message || 'Failed to sync expense'
    };
  }
}

/**
 * Sync a single invoice to QuickBooks
 * @param {string} connectionId - Connection UUID
 * @param {Object} invoice - Invoice object from TC
 * @returns {Object} Sync result
 */
export async function syncInvoice(connectionId, invoice) {
  try {
    // Get QB client
    const { client, connection, error: clientError, errorMessage } = await createClientWithRefresh(connectionId);

    if (clientError) {
      return { error: true, errorMessage };
    }

    // Get customer info from TC invoice
    let customerName = invoice.customer_name;

    // If no customer name, try to fetch from customers table
    if (!customerName && invoice.customer_id) {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('name, company_name')
        .eq('id', invoice.customer_id)
        .single();

      customerName = customer?.company_name || customer?.name || 'Unknown Customer';
    }

    if (!customerName) {
      customerName = 'Unknown Customer';
    }

    // Find or create customer in QuickBooks
    const qbCustomer = await findOrCreateCustomer(client, customerName);

    if (!qbCustomer || !qbCustomer.Id) {
      return {
        error: true,
        errorMessage: 'Failed to find or create customer in QuickBooks'
      };
    }

    // Map and create invoice
    const invoiceData = mapInvoiceToQbInvoice(invoice, qbCustomer.Id);

    const result = await createInvoice(client, invoiceData);

    if (!result || !result.Id) {
      return {
        error: true,
        errorMessage: 'Failed to create invoice in QuickBooks'
      };
    }

    // Record successful sync
    await recordSync(
      connectionId,
      connection.user_id,
      'invoice',
      invoice.id,
      result.Id,
      'synced'
    );

    log(`Synced invoice ${invoice.id} -> QB Invoice ${result.Id}`);

    return {
      success: true,
      qbEntityId: result.Id,
      qbEntityType: 'Invoice'
    };

  } catch (error) {
    log('Error syncing invoice:', error);

    // Record failed sync
    try {
      const { data: conn } = await supabaseAdmin
        .from('quickbooks_connections')
        .select('user_id')
        .eq('id', connectionId)
        .single();

      if (conn) {
        await recordSync(
          connectionId,
          conn.user_id,
          'invoice',
          invoice.id,
          'error',
          'failed',
          error.message
        );
      }
    } catch (e) {
      // Ignore
    }

    return {
      error: true,
      errorMessage: error.message || 'Failed to sync invoice'
    };
  }
}

/**
 * Bulk sync expenses to QuickBooks
 * @param {string} connectionId - Connection UUID
 * @param {string} userId - User ID
 * @param {Object} options - Sync options (expenseIds, dateRange, etc.)
 * @returns {Object} Bulk sync result
 */
export async function bulkSyncExpenses(connectionId, userId, options = {}) {
  const { expenseIds, startDate, endDate, categories } = options;

  try {
    // Build query for expenses
    let query = supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
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

    // Order by date
    query = query.order('date', { ascending: true });

    const { data: expenses, error: queryError } = await query;

    if (queryError) {
      return { error: true, errorMessage: queryError.message };
    }

    if (!expenses || expenses.length === 0) {
      return { success: true, synced: 0, failed: 0, message: 'No expenses to sync' };
    }

    // Get already synced expense IDs
    const { data: syncedRecords } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('local_entity_id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'expense')
      .eq('sync_status', 'synced');

    const syncedIds = new Set(syncedRecords?.map(r => r.local_entity_id) || []);

    // Filter out already synced expenses
    const expensesToSync = expenses.filter(e => !syncedIds.has(e.id));

    if (expensesToSync.length === 0) {
      return { success: true, synced: 0, failed: 0, message: 'All expenses already synced' };
    }

    // Start sync history
    const historyId = await startSyncHistory(connectionId, userId, 'bulk', ['expense']);

    let synced = 0;
    let failed = 0;
    const errors = [];

    // Sync each expense
    for (const expense of expensesToSync) {
      const result = await syncExpense(connectionId, expense);

      if (result.success) {
        synced++;
      } else {
        failed++;
        errors.push({
          expenseId: expense.id,
          description: expense.description,
          error: result.errorMessage
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Complete sync history
    const status = failed === 0 ? 'completed' : (synced > 0 ? 'partial' : 'failed');
    await completeSyncHistory(historyId, status, synced, failed);

    // Update last sync
    await updateLastSync(connectionId);

    log(`Bulk sync complete: ${synced} synced, ${failed} failed`);

    return {
      success: true,
      synced,
      failed,
      total: expensesToSync.length,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    log('Error in bulk sync expenses:', error);
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Bulk sync invoices to QuickBooks
 * @param {string} connectionId - Connection UUID
 * @param {string} userId - User ID
 * @param {Object} options - Sync options
 * @returns {Object} Bulk sync result
 */
export async function bulkSyncInvoices(connectionId, userId, options = {}) {
  const { invoiceIds, startDate, endDate, status: invoiceStatus } = options;

  try {
    // Build query for invoices
    let query = supabaseAdmin
      .from('invoices')
      .select('*, customers(name, company_name)')
      .eq('user_id', userId);

    // Apply filters
    if (invoiceIds && invoiceIds.length > 0) {
      query = query.in('id', invoiceIds);
    }

    if (startDate) {
      query = query.gte('invoice_date', startDate);
    }

    if (endDate) {
      query = query.lte('invoice_date', endDate);
    }

    if (invoiceStatus) {
      query = query.eq('status', invoiceStatus);
    }

    query = query.order('invoice_date', { ascending: true });

    const { data: invoices, error: queryError } = await query;

    if (queryError) {
      return { error: true, errorMessage: queryError.message };
    }

    if (!invoices || invoices.length === 0) {
      return { success: true, synced: 0, failed: 0, message: 'No invoices to sync' };
    }

    // Get already synced invoice IDs
    const { data: syncedRecords } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('local_entity_id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'invoice')
      .eq('sync_status', 'synced');

    const syncedIds = new Set(syncedRecords?.map(r => r.local_entity_id) || []);

    // Filter out already synced invoices
    const invoicesToSync = invoices.filter(i => !syncedIds.has(i.id));

    if (invoicesToSync.length === 0) {
      return { success: true, synced: 0, failed: 0, message: 'All invoices already synced' };
    }

    // Start sync history
    const historyId = await startSyncHistory(connectionId, userId, 'bulk', ['invoice']);

    let synced = 0;
    let failed = 0;
    const errors = [];

    // Sync each invoice
    for (const invoice of invoicesToSync) {
      // Add customer name from join
      const invoiceWithCustomer = {
        ...invoice,
        customer_name: invoice.customers?.company_name || invoice.customers?.name
      };

      const result = await syncInvoice(connectionId, invoiceWithCustomer);

      if (result.success) {
        synced++;
      } else {
        failed++;
        errors.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          error: result.errorMessage
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Complete sync history
    const status = failed === 0 ? 'completed' : (synced > 0 ? 'partial' : 'failed');
    await completeSyncHistory(historyId, status, synced, failed);

    // Update last sync
    await updateLastSync(connectionId);

    log(`Bulk invoice sync complete: ${synced} synced, ${failed} failed`);

    return {
      success: true,
      synced,
      failed,
      total: invoicesToSync.length,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    log('Error in bulk sync invoices:', error);
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
    // Get connection
    const { data: connection } = await supabaseAdmin
      .from('quickbooks_connections')
      .select('id, status, last_sync_at')
      .eq('user_id', userId)
      .single();

    if (!connection) {
      return { connected: false };
    }

    // Get sync record counts
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
        invoicesSynced: invoicesSynced || 0,
        pending: pendingCount || 0,
        failed: failedCount || 0
      }
    };

  } catch (error) {
    log('Error getting sync status:', error);
    return { error: true, errorMessage: 'Failed to get sync status' };
  }
}

/**
 * Get sync history for a connection
 * @param {string} connectionId - Connection UUID
 * @param {number} limit - Number of records to return
 * @returns {Object} Sync history records
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
 * @param {string} connectionId - Connection UUID
 * @param {string} entityType - 'expense' or 'invoice'
 * @param {string} localEntityId - Local entity ID
 * @returns {Object} Sync record or null
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
 * @param {string} connectionId - Connection UUID
 * @returns {Object} Retry result
 */
export async function retryFailedSyncs(connectionId) {
  try {
    // Get failed sync records
    const { data: failedRecords, error } = await supabaseAdmin
      .from('quickbooks_sync_records')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('sync_status', 'failed');

    if (error || !failedRecords || failedRecords.length === 0) {
      return { success: true, retried: 0, message: 'No failed syncs to retry' };
    }

    let succeeded = 0;
    let stillFailed = 0;

    for (const record of failedRecords) {
      // Fetch the entity
      const table = record.entity_type === 'expense' ? 'expenses' : 'invoices';
      const { data: entity } = await supabaseAdmin
        .from(table)
        .select('*')
        .eq('id', record.local_entity_id)
        .single();

      if (!entity) {
        continue; // Entity no longer exists
      }

      // Retry sync
      const syncFn = record.entity_type === 'expense' ? syncExpense : syncInvoice;
      const result = await syncFn(connectionId, entity);

      if (result.success) {
        succeeded++;
      } else {
        stillFailed++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      retried: failedRecords.length,
      succeeded,
      stillFailed
    };

  } catch (error) {
    log('Error retrying failed syncs:', error);
    return { error: true, errorMessage: 'Failed to retry syncs' };
  }
}
