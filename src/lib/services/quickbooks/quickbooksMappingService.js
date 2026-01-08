/**
 * QuickBooks Mapping Service
 *
 * Maps Truck Command expense categories to QuickBooks Chart of Accounts.
 * Provides smart defaults for trucking-specific expense categories.
 */

import { createClient } from '@supabase/supabase-js';
import { createClientWithRefresh, getExpenseAccounts } from './quickbooksApiClient';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[quickbooks/mapping]', ...args);

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
 * Truck Command expense categories
 */
export const TC_EXPENSE_CATEGORIES = [
  'Fuel',
  'Maintenance',
  'Insurance',
  'Tolls',
  'Office',
  'Permits',
  'Meals',
  'Other'
];

/**
 * Default mappings for trucking expense categories
 * These map to common QuickBooks account names
 */
export const TRUCKING_CATEGORY_DEFAULTS = {
  'Fuel': {
    keywords: ['fuel', 'gas', 'diesel', 'petroleum'],
    defaultName: 'Fuel and Oil',
    fallbackName: 'Automobile Expense'
  },
  'Maintenance': {
    keywords: ['maintenance', 'repair', 'service'],
    defaultName: 'Repairs and Maintenance',
    fallbackName: 'Equipment Repairs'
  },
  'Insurance': {
    keywords: ['insurance'],
    defaultName: 'Insurance Expense',
    fallbackName: 'Insurance'
  },
  'Tolls': {
    keywords: ['toll', 'travel', 'highway'],
    defaultName: 'Travel Expense',
    fallbackName: 'Automobile Expense'
  },
  'Office': {
    keywords: ['office', 'supplies', 'administrative'],
    defaultName: 'Office Supplies',
    fallbackName: 'Office Expense'
  },
  'Permits': {
    keywords: ['permit', 'license', 'registration', 'fees'],
    defaultName: 'Licenses and Permits',
    fallbackName: 'Legal and Professional Fees'
  },
  'Meals': {
    keywords: ['meal', 'food', 'entertainment', 'per diem'],
    defaultName: 'Meals and Entertainment',
    fallbackName: 'Travel Expense'
  },
  'Other': {
    keywords: ['other', 'miscellaneous', 'misc'],
    defaultName: 'Other Expense',
    fallbackName: 'Miscellaneous'
  }
};

/**
 * Find best matching QuickBooks account for a category
 * @param {Array} qbAccounts - List of QB expense accounts
 * @param {string} tcCategory - Truck Command category
 * @returns {Object|null} Best matching account or null
 */
function findBestMatch(qbAccounts, tcCategory) {
  const categoryConfig = TRUCKING_CATEGORY_DEFAULTS[tcCategory];
  if (!categoryConfig) return null;

  // First, try exact match on default name
  let match = qbAccounts.find(acc =>
    acc.Name.toLowerCase() === categoryConfig.defaultName.toLowerCase()
  );

  if (match) return match;

  // Try fallback name
  match = qbAccounts.find(acc =>
    acc.Name.toLowerCase() === categoryConfig.fallbackName.toLowerCase()
  );

  if (match) return match;

  // Try keyword matching
  for (const keyword of categoryConfig.keywords) {
    match = qbAccounts.find(acc =>
      acc.Name.toLowerCase().includes(keyword.toLowerCase())
    );
    if (match) return match;
  }

  return null;
}

/**
 * Get all mappings for a connection
 * @param {string} connectionId - Connection UUID
 * @returns {Object} { data: mappings[], error }
 */
export async function getMappings(connectionId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_account_mappings')
      .select('*')
      .eq('connection_id', connectionId)
      .order('tc_category');

    if (error) {
      log('Error fetching mappings:', error);
      return { error: true, errorMessage: error.message };
    }

    return { data: data || [] };

  } catch (error) {
    log('Error in getMappings:', error);
    return { error: true, errorMessage: 'Failed to fetch mappings' };
  }
}

/**
 * Get mapping for a specific category
 * @param {string} connectionId - Connection UUID
 * @param {string} tcCategory - Truck Command category
 * @returns {Object} Mapping or null
 */
export async function getMappingForCategory(connectionId, tcCategory) {
  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_account_mappings')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('tc_category', tcCategory)
      .single();

    if (error && error.code !== 'PGRST116') {
      log('Error fetching mapping:', error);
      return null;
    }

    return data;

  } catch (error) {
    log('Error in getMappingForCategory:', error);
    return null;
  }
}

/**
 * Create or update a category mapping
 * @param {string} connectionId - Connection UUID
 * @param {string} userId - User ID
 * @param {string} tcCategory - Truck Command category
 * @param {string} qbAccountId - QuickBooks account ID
 * @param {string} qbAccountName - QuickBooks account name
 * @param {string} qbAccountType - QuickBooks account type
 * @returns {Object} Created/updated mapping or error
 */
export async function upsertMapping(connectionId, userId, tcCategory, qbAccountId, qbAccountName, qbAccountType = 'Expense') {
  try {
    const { data, error } = await supabaseAdmin
      .from('quickbooks_account_mappings')
      .upsert({
        connection_id: connectionId,
        user_id: userId,
        tc_category: tcCategory,
        qb_account_id: qbAccountId,
        qb_account_name: qbAccountName,
        qb_account_type: qbAccountType,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'connection_id,tc_category'
      })
      .select()
      .single();

    if (error) {
      log('Error upserting mapping:', error);
      return { error: true, errorMessage: error.message };
    }

    log(`Mapped ${tcCategory} -> ${qbAccountName}`);
    return { data };

  } catch (error) {
    log('Error in upsertMapping:', error);
    return { error: true, errorMessage: 'Failed to save mapping' };
  }
}

/**
 * Delete a category mapping
 * @param {string} mappingId - Mapping UUID
 * @returns {Object} Success or error
 */
export async function deleteMapping(mappingId) {
  try {
    const { error } = await supabaseAdmin
      .from('quickbooks_account_mappings')
      .delete()
      .eq('id', mappingId);

    if (error) {
      log('Error deleting mapping:', error);
      return { error: true, errorMessage: error.message };
    }

    return { success: true };

  } catch (error) {
    log('Error in deleteMapping:', error);
    return { error: true, errorMessage: 'Failed to delete mapping' };
  }
}

/**
 * Auto-map categories based on QuickBooks Chart of Accounts
 * Uses smart matching for trucking-specific categories
 * @param {string} connectionId - Connection UUID
 * @param {string} userId - User ID
 * @returns {Object} { mapped, unmapped, error }
 */
export async function autoMapCategories(connectionId, userId) {
  try {
    // Get QuickBooks client
    const { client, error: clientError, errorMessage } = await createClientWithRefresh(connectionId);

    if (clientError) {
      return { error: true, errorMessage };
    }

    // Fetch expense accounts from QuickBooks
    const qbAccounts = await getExpenseAccounts(client);

    if (!qbAccounts || qbAccounts.length === 0) {
      return {
        error: true,
        errorMessage: 'No expense accounts found in QuickBooks'
      };
    }

    log(`Found ${qbAccounts.length} expense accounts in QuickBooks`);

    const mapped = [];
    const unmapped = [];

    // Try to map each TC category
    for (const tcCategory of TC_EXPENSE_CATEGORIES) {
      const match = findBestMatch(qbAccounts, tcCategory);

      if (match) {
        // Create mapping
        await upsertMapping(
          connectionId,
          userId,
          tcCategory,
          match.Id,
          match.Name,
          match.AccountType
        );

        mapped.push({
          tcCategory,
          qbAccount: match.Name,
          qbAccountId: match.Id
        });

      } else {
        unmapped.push(tcCategory);
      }
    }

    log(`Auto-mapped ${mapped.length} categories, ${unmapped.length} unmapped`);

    return {
      success: true,
      mapped,
      unmapped,
      totalQbAccounts: qbAccounts.length
    };

  } catch (error) {
    log('Error in autoMapCategories:', error);
    return { error: true, errorMessage: 'Failed to auto-map categories' };
  }
}

/**
 * Get unmapped categories for a connection
 * @param {string} connectionId - Connection UUID
 * @returns {Object} { unmapped: string[] }
 */
export async function getUnmappedCategories(connectionId) {
  try {
    const { data: mappings } = await getMappings(connectionId);
    const mappedCategories = mappings?.map(m => m.tc_category) || [];

    const unmapped = TC_EXPENSE_CATEGORIES.filter(
      cat => !mappedCategories.includes(cat)
    );

    return { unmapped };

  } catch (error) {
    log('Error in getUnmappedCategories:', error);
    return { unmapped: TC_EXPENSE_CATEGORIES };
  }
}

/**
 * Fetch QuickBooks expense accounts for display in mapping UI
 * @param {string} connectionId - Connection UUID
 * @returns {Object} { accounts: [] } or error
 */
export async function fetchQbExpenseAccounts(connectionId) {
  try {
    const { client, error: clientError, errorMessage } = await createClientWithRefresh(connectionId);

    if (clientError) {
      return { error: true, errorMessage };
    }

    const qbAccounts = await getExpenseAccounts(client);

    // Format for UI display
    const accounts = qbAccounts.map(acc => ({
      id: acc.Id,
      name: acc.Name,
      type: acc.AccountType,
      subType: acc.AccountSubType,
      fullyQualifiedName: acc.FullyQualifiedName
    }));

    // Sort by name
    accounts.sort((a, b) => a.name.localeCompare(b.name));

    return { accounts };

  } catch (error) {
    log('Error fetching QB accounts:', error);
    return { error: true, errorMessage: 'Failed to fetch QuickBooks accounts' };
  }
}

/**
 * Get mapping status summary
 * @param {string} connectionId - Connection UUID
 * @returns {Object} Status summary
 */
export async function getMappingStatus(connectionId) {
  const { data: mappings } = await getMappings(connectionId);
  const { unmapped } = await getUnmappedCategories(connectionId);

  return {
    totalCategories: TC_EXPENSE_CATEGORIES.length,
    mappedCount: mappings?.length || 0,
    unmappedCount: unmapped.length,
    isComplete: unmapped.length === 0,
    mappings: mappings || [],
    unmappedCategories: unmapped
  };
}
