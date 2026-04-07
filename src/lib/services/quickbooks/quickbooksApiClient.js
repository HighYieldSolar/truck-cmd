/**
 * QuickBooks API Client
 *
 * Wrapper around the node-quickbooks SDK with automatic token refresh
 * and error handling.
 */

import QuickBooks from 'node-quickbooks';
import { refreshTokens, getConnectionById, updateConnectionStatus } from './quickbooksConnectionService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/api]', ...args);

// Sandbox vs Production
const USE_SANDBOX = process.env.QUICKBOOKS_ENVIRONMENT !== 'production';

/**
 * Create a QuickBooks client instance
 * @param {string} accessToken - OAuth access token
 * @param {string} realmId - QuickBooks company ID
 * @param {string} refreshToken - OAuth refresh token
 * @returns {QuickBooks} QuickBooks client instance
 */
export function createClient(accessToken, realmId, refreshToken) {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;

  return new QuickBooks(
    clientId,
    clientSecret,
    accessToken,
    false, // No token secret for OAuth 2.0
    realmId,
    USE_SANDBOX, // Use sandbox?
    DEBUG, // Enable debugging?
    null, // Minor version (null for latest)
    '2.0', // OAuth version
    refreshToken
  );
}

/**
 * Create a client with automatic token refresh
 * @param {string} connectionId - Database connection ID
 * @returns {Object} { client, connection } or { error }
 */
export async function createClientWithRefresh(connectionId) {
  try {
    const { data: connection, error } = await getConnectionById(connectionId);

    if (error || !connection) {
      return { error: true, errorMessage: 'Connection not found' };
    }

    // Check if token needs refresh (expires in less than 10 minutes)
    const tokenExpiry = new Date(connection.token_expires_at);
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

    if (tokenExpiry < tenMinutesFromNow) {
      log('Token expiring soon, refreshing...');
      const refreshResult = await refreshTokens(connectionId);

      if (refreshResult.error) {
        return { error: true, errorMessage: refreshResult.errorMessage };
      }

      // Get updated connection
      const { data: updatedConnection } = await getConnectionById(connectionId);
      if (!updatedConnection) {
        return { error: true, errorMessage: 'Failed to get updated connection' };
      }

      const client = createClient(
        updatedConnection.access_token,
        updatedConnection.realm_id,
        updatedConnection.refresh_token
      );

      return { client, connection: updatedConnection };
    }

    const client = createClient(
      connection.access_token,
      connection.realm_id,
      connection.refresh_token
    );

    return { client, connection };

  } catch (error) {
    log('Error creating client:', error);
    return { error: true, errorMessage: 'Failed to create QuickBooks client' };
  }
}

// Retryable HTTP status codes (per Intuit best practices)
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Max retries and backoff config
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000; // 1s, 2s, 4s exponential

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract intuit_tid from an error response for logging/support
 * @param {Object} apiError - Error from QuickBooks API
 * @returns {string|null} The intuit_tid value if available
 */
function extractIntuitTid(apiError) {
  return apiError?.headers?.intuit_tid
    || apiError?.intuit_tid
    || apiError?.response?.headers?.get?.('intuit_tid')
    || null;
}

/**
 * Execute a QuickBooks API call with error handling, intuit_tid capture,
 * rate limit backoff, and automatic retry for transient errors.
 *
 * Retry policy (per Intuit best practices):
 * - Max 3 retries with exponential backoff (1s, 2s, 4s)
 * - Retryable: 408, 429, 500, 502, 503, 504
 * - Auth errors (401): refresh token once, retry once
 * - All responses capture intuit_tid for Intuit support debugging
 *
 * @param {string} connectionId - Connection ID
 * @param {Function} apiCall - Function that takes (client) and returns a promise
 * @returns {Object} API result or error
 */
export async function executeWithRetry(connectionId, apiCall) {
  try {
    const { client, connection, error, errorMessage } = await createClientWithRefresh(connectionId);

    if (error) {
      return { error: true, errorMessage };
    }

    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await apiCall(client);

        // Capture intuit_tid from successful responses if available
        const intuitTid = result?.headers?.intuit_tid || null;
        if (intuitTid) {
          log('API call success, intuit_tid:', intuitTid);
        }

        return { success: true, data: result };

      } catch (apiError) {
        lastError = apiError;
        const intuitTid = extractIntuitTid(apiError);
        const statusCode = apiError.statusCode || apiError.status;

        log(`API call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
          apiError.message || apiError,
          'intuit_tid:', intuitTid,
          'status:', statusCode
        );

        // Auth errors: refresh token and retry once (don't count as retryable)
        if (statusCode === 401 || apiError.code === 'TOKEN_EXPIRED') {
          log('Auth error, attempting token refresh...');
          const refreshResult = await refreshTokens(connectionId);

          if (refreshResult.error) {
            await updateConnectionStatus(connectionId, 'token_expired', 'Authentication failed');
            return {
              error: true,
              errorMessage: 'Authentication failed. Please reconnect to QuickBooks.',
              intuit_tid: intuitTid
            };
          }

          // Retry with new token (one attempt only for auth)
          const { client: newClient } = await createClientWithRefresh(connectionId);
          if (newClient) {
            try {
              const retryResult = await apiCall(newClient);
              return { success: true, data: retryResult };
            } catch (retryError) {
              const retryTid = extractIntuitTid(retryError);
              log('Auth retry failed, intuit_tid:', retryTid);
              return {
                error: true,
                errorMessage: retryError.message || 'API call failed after token refresh',
                intuit_tid: retryTid
              };
            }
          }
          break;
        }

        // Rate limiting (429): use Retry-After header if available, else exponential backoff
        if (statusCode === 429) {
          if (attempt < MAX_RETRIES) {
            const retryAfter = apiError.headers?.['retry-after'];
            const backoffMs = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : BASE_BACKOFF_MS * Math.pow(2, attempt);
            log(`Rate limited (429). Backing off ${backoffMs}ms before retry...`);
            await sleep(backoffMs);
            continue;
          }
          return {
            error: true,
            errorMessage: 'QuickBooks rate limit exceeded. Please try again later.',
            intuit_tid: intuitTid,
            retryAfter: 60
          };
        }

        // Transient server errors: retry with exponential backoff
        if (RETRYABLE_STATUS_CODES.includes(statusCode) && attempt < MAX_RETRIES) {
          const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt);
          log(`Transient error (${statusCode}). Backing off ${backoffMs}ms before retry...`);
          await sleep(backoffMs);
          continue;
        }

        // Non-retryable error, break immediately
        break;
      }
    }

    // All retries exhausted
    const intuitTid = extractIntuitTid(lastError);
    return {
      error: true,
      errorMessage: lastError?.message || 'QuickBooks API call failed',
      intuit_tid: intuitTid
    };

  } catch (error) {
    log('Execute with retry error:', error);
    return { error: true, errorMessage: 'Failed to execute QuickBooks operation' };
  }
}

/**
 * Promisify QuickBooks SDK callback-based methods
 * @param {QuickBooks} client - QuickBooks client
 * @param {string} method - Method name
 * @param {Array} args - Method arguments
 * @returns {Promise} Promisified result
 */
function promisify(client, method, ...args) {
  return new Promise((resolve, reject) => {
    client[method](...args, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// ============================================================================
// Purchase (Expense) Operations
// ============================================================================

/**
 * Create a Purchase (expense) in QuickBooks
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} purchaseData - Purchase data object
 * @returns {Promise<Object>} Created purchase
 */
export async function createPurchase(client, purchaseData) {
  return promisify(client, 'createPurchase', purchaseData);
}

/**
 * Get a Purchase by ID
 * @param {QuickBooks} client - QuickBooks client
 * @param {string} purchaseId - QuickBooks Purchase ID
 * @returns {Promise<Object>} Purchase object
 */
export async function getPurchase(client, purchaseId) {
  return promisify(client, 'getPurchase', purchaseId);
}

/**
 * Update a Purchase
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} purchaseData - Updated purchase data (must include Id and SyncToken)
 * @returns {Promise<Object>} Updated purchase
 */
export async function updatePurchase(client, purchaseData) {
  return promisify(client, 'updatePurchase', purchaseData);
}

/**
 * Delete a Purchase
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} purchaseIdOrEntity - Purchase ID or entity with Id and SyncToken
 * @returns {Promise<Object>} Deletion result
 */
export async function deletePurchase(client, purchaseIdOrEntity) {
  return promisify(client, 'deletePurchase', purchaseIdOrEntity);
}

/**
 * Find Purchases with optional criteria
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} criteria - Query criteria
 * @returns {Promise<Object>} Query response with purchases
 */
export async function findPurchases(client, criteria = {}) {
  return promisify(client, 'findPurchases', criteria);
}

// ============================================================================
// Invoice Operations
// ============================================================================

/**
 * Create an Invoice in QuickBooks
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} invoiceData - Invoice data object
 * @returns {Promise<Object>} Created invoice
 */
export async function createInvoice(client, invoiceData) {
  return promisify(client, 'createInvoice', invoiceData);
}

/**
 * Get an Invoice by ID
 * @param {QuickBooks} client - QuickBooks client
 * @param {string} invoiceId - QuickBooks Invoice ID
 * @returns {Promise<Object>} Invoice object
 */
export async function getInvoice(client, invoiceId) {
  return promisify(client, 'getInvoice', invoiceId);
}

/**
 * Update an Invoice
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} invoiceData - Updated invoice data
 * @returns {Promise<Object>} Updated invoice
 */
export async function updateInvoice(client, invoiceData) {
  return promisify(client, 'updateInvoice', invoiceData);
}

/**
 * Find Invoices with optional criteria
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} criteria - Query criteria
 * @returns {Promise<Object>} Query response with invoices
 */
export async function findInvoices(client, criteria = {}) {
  return promisify(client, 'findInvoices', criteria);
}

// ============================================================================
// Account Operations (for category mapping)
// ============================================================================

/**
 * Find Accounts (Chart of Accounts)
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} criteria - Query criteria (e.g., { AccountType: 'Expense' })
 * @returns {Promise<Object>} Query response with accounts
 */
export async function findAccounts(client, criteria = {}) {
  return promisify(client, 'findAccounts', criteria);
}

/**
 * Get expense accounts specifically
 * @param {QuickBooks} client - QuickBooks client
 * @returns {Promise<Array>} List of expense accounts
 */
export async function getExpenseAccounts(client) {
  const result = await findAccounts(client, {
    AccountType: 'Expense',
    fetchAll: true
  });

  return result.QueryResponse?.Account || [];
}

/**
 * Get bank accounts (for Cash/Check payment sources)
 * @param {QuickBooks} client - QuickBooks client
 * @returns {Promise<Array>} List of bank accounts
 */
export async function getBankAccounts(client) {
  const result = await findAccounts(client, {
    AccountType: 'Bank',
    fetchAll: true
  });

  return result.QueryResponse?.Account || [];
}

/**
 * Get credit card accounts (for Credit Card payment sources)
 * @param {QuickBooks} client - QuickBooks client
 * @returns {Promise<Array>} List of credit card accounts
 */
export async function getCreditCardAccounts(client) {
  const result = await findAccounts(client, {
    AccountType: 'Credit Card',
    fetchAll: true
  });

  return result.QueryResponse?.Account || [];
}

/**
 * Get all payment source accounts (Bank + Credit Card)
 * @param {QuickBooks} client - QuickBooks client
 * @returns {Promise<Object>} { bankAccounts, creditCardAccounts }
 */
export async function getPaymentAccounts(client) {
  const [bankAccounts, creditCardAccounts] = await Promise.all([
    getBankAccounts(client),
    getCreditCardAccounts(client)
  ]);

  return { bankAccounts, creditCardAccounts };
}

// ============================================================================
// Customer Operations (for invoice sync)
// ============================================================================

/**
 * Find Customers
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} criteria - Query criteria
 * @returns {Promise<Object>} Query response with customers
 */
export async function findCustomers(client, criteria = {}) {
  return promisify(client, 'findCustomers', criteria);
}

/**
 * Create a Customer
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>} Created customer
 */
export async function createCustomer(client, customerData) {
  return promisify(client, 'createCustomer', customerData);
}

/**
 * Find or create a customer by name
 * @param {QuickBooks} client - QuickBooks client
 * @param {string} customerName - Customer name
 * @param {Object} customerData - Additional customer data
 * @returns {Promise<Object>} Customer object
 */
export async function findOrCreateCustomer(client, customerName, customerData = {}) {
  // Search for existing customer
  const searchResult = await findCustomers(client, {
    DisplayName: customerName
  });

  const existingCustomer = searchResult.QueryResponse?.Customer?.[0];

  if (existingCustomer) {
    return existingCustomer;
  }

  // Create new customer
  const newCustomer = await createCustomer(client, {
    DisplayName: customerName,
    ...customerData
  });

  return newCustomer;
}

// ============================================================================
// Vendor Operations (optional - for expense attribution)
// ============================================================================

/**
 * Find Vendors
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} criteria - Query criteria
 * @returns {Promise<Object>} Query response with vendors
 */
export async function findVendors(client, criteria = {}) {
  return promisify(client, 'findVendors', criteria);
}

/**
 * Create a Vendor
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} vendorData - Vendor data
 * @returns {Promise<Object>} Created vendor
 */
export async function createVendor(client, vendorData) {
  return promisify(client, 'createVendor', vendorData);
}

// ============================================================================
// Company Info
// ============================================================================

/**
 * Get Company Info
 * @param {QuickBooks} client - QuickBooks client
 * @param {string} realmId - Company realm ID
 * @returns {Promise<Object>} Company info
 */
export async function getCompanyInfo(client, realmId) {
  return promisify(client, 'getCompanyInfo', realmId);
}

// ============================================================================
// Reports (optional - for future analytics)
// ============================================================================

/**
 * Get Profit and Loss Report
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Report data
 */
export async function reportProfitAndLoss(client, options = {}) {
  return promisify(client, 'reportProfitAndLoss', options);
}

/**
 * Get Vendor Expenses Report
 * @param {QuickBooks} client - QuickBooks client
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Report data
 */
export async function reportVendorExpenses(client, options = {}) {
  return promisify(client, 'reportVendorExpenses', options);
}
