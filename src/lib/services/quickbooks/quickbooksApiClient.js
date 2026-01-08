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

/**
 * Execute a QuickBooks API call with error handling and retry
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

    // Execute the API call
    try {
      const result = await apiCall(client);
      return { success: true, data: result };

    } catch (apiError) {
      log('API call failed:', apiError);

      // Check if it's an auth error
      if (apiError.statusCode === 401 || apiError.code === 'TOKEN_EXPIRED') {
        // Try refreshing token and retrying once
        log('Auth error, attempting token refresh...');
        const refreshResult = await refreshTokens(connectionId);

        if (refreshResult.error) {
          await updateConnectionStatus(connectionId, 'token_expired', 'Authentication failed');
          return { error: true, errorMessage: 'Authentication failed. Please reconnect to QuickBooks.' };
        }

        // Retry with new token
        const { client: newClient } = await createClientWithRefresh(connectionId);
        if (newClient) {
          try {
            const retryResult = await apiCall(newClient);
            return { success: true, data: retryResult };
          } catch (retryError) {
            log('Retry failed:', retryError);
            return { error: true, errorMessage: retryError.message || 'API call failed after retry' };
          }
        }
      }

      // Handle rate limiting
      if (apiError.statusCode === 429) {
        return { error: true, errorMessage: 'Rate limit exceeded. Please try again later.', retryAfter: 60 };
      }

      return { error: true, errorMessage: apiError.message || 'QuickBooks API call failed' };
    }

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
