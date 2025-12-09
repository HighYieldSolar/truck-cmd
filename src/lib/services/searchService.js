// src/lib/services/searchService.js
import { supabase as defaultSupabase } from "../supabaseClient";

/**
 * Entity types available for global search
 */
export const SEARCH_ENTITY_TYPES = {
  LOADS: 'loads',
  INVOICES: 'invoices',
  CUSTOMERS: 'customers',
  EXPENSES: 'expenses',
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  COMPLIANCE: 'compliance',
  FUEL: 'fuel'
};

/**
 * Entity configuration for search
 */
const ENTITY_CONFIG = {
  [SEARCH_ENTITY_TYPES.LOADS]: {
    table: 'loads',
    searchFields: ['load_number', 'customer', 'driver', 'origin', 'destination'],
    displayField: 'load_number',
    secondaryField: 'customer',
    statusField: 'status',
    route: '/dashboard/dispatching',
    icon: 'Truck'
  },
  [SEARCH_ENTITY_TYPES.INVOICES]: {
    table: 'invoices',
    searchFields: ['invoice_number', 'customer'],
    displayField: 'invoice_number',
    secondaryField: 'customer',
    statusField: 'status',
    route: '/dashboard/invoices',
    icon: 'FileText'
  },
  [SEARCH_ENTITY_TYPES.CUSTOMERS]: {
    table: 'customers',
    searchFields: ['company_name', 'contact_name', 'email'],
    displayField: 'company_name',
    secondaryField: 'contact_name',
    statusField: 'status',
    route: '/dashboard/customers',
    icon: 'Users'
  },
  [SEARCH_ENTITY_TYPES.EXPENSES]: {
    table: 'expenses',
    searchFields: ['description', 'category', 'payment_method'],
    displayField: 'description',
    secondaryField: 'category',
    statusField: null,
    route: '/dashboard/expenses',
    icon: 'Wallet'
  },
  [SEARCH_ENTITY_TYPES.DRIVERS]: {
    table: 'drivers',
    searchFields: ['name', 'license_number', 'phone', 'email'],
    displayField: 'name',
    secondaryField: 'license_number',
    statusField: 'status',
    route: '/dashboard/fleet/drivers',
    icon: 'UserCircle'
  },
  [SEARCH_ENTITY_TYPES.VEHICLES]: {
    table: 'vehicles',
    searchFields: ['name', 'make', 'model', 'vin', 'license_plate'],
    displayField: 'name',
    secondaryField: 'make',
    statusField: 'status',
    route: '/dashboard/fleet/trucks',
    icon: 'Package'
  },
  [SEARCH_ENTITY_TYPES.COMPLIANCE]: {
    table: 'compliance_items',
    searchFields: ['title', 'entity_name', 'document_number'],
    displayField: 'title',
    secondaryField: 'entity_name',
    statusField: 'status',
    route: '/dashboard/compliance',
    icon: 'CheckCircle'
  },
  [SEARCH_ENTITY_TYPES.FUEL]: {
    table: 'fuel_entries',
    searchFields: ['location', 'state'],
    displayField: 'location',
    secondaryField: 'state',
    statusField: null,
    route: '/dashboard/fuel',
    icon: 'Fuel'
  }
};

/**
 * Search a single entity type
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {string} entityType - Entity type to search
 * @param {number} limit - Max results to return
 * @param {Object} supabaseClient - Supabase client instance (optional)
 * @returns {Promise<Array>} - Array of matching results
 */
async function searchEntity(userId, query, entityType, limit = 5, supabaseClient = defaultSupabase) {
  const config = ENTITY_CONFIG[entityType];
  if (!config) return [];

  try {
    // Build the OR query for all search fields
    const searchConditions = config.searchFields
      .map(field => `${field}.ilike.%${query}%`)
      .join(',');

    let dbQuery = supabaseClient
      .from(config.table)
      .select('*')
      .eq('user_id', userId)
      .or(searchConditions)
      .limit(limit);

    // Add ordering based on entity type
    if (config.table === 'loads') {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    } else if (config.table === 'invoices') {
      dbQuery = dbQuery.order('invoice_date', { ascending: false });
    } else if (config.table === 'expenses') {
      dbQuery = dbQuery.order('date', { ascending: false });
    } else if (config.table === 'fuel_entries') {
      dbQuery = dbQuery.order('date', { ascending: false });
    } else if (config.table === 'compliance_items') {
      dbQuery = dbQuery.order('expiration_date', { ascending: true });
    } else {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    // Map results to a consistent format
    return (data || []).map(item => ({
      id: item.id,
      type: entityType,
      title: item[config.displayField] || 'Untitled',
      subtitle: item[config.secondaryField] || '',
      status: config.statusField ? item[config.statusField] : null,
      route: config.route,
      icon: config.icon,
      data: item // Include raw data for additional context
    }));
  } catch (error) {
    console.error(`Search error for ${entityType}:`, error);
    return [];
  }
}

/**
 * Perform a global search across all entity types
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {Array<string>} options.types - Entity types to search (default: all)
 * @param {number} options.limitPerType - Max results per entity type (default: 5)
 * @param {Object} options.supabaseClient - Supabase client instance (optional)
 * @returns {Promise<Object>} - Search results grouped by entity type
 */
export async function globalSearch(userId, query, options = {}) {
  const {
    types = Object.values(SEARCH_ENTITY_TYPES),
    limitPerType = 5,
    supabaseClient = defaultSupabase
  } = options;

  // Validate inputs
  if (!userId) {
    return { results: {}, totalCount: 0, error: 'User ID is required' };
  }

  if (!query || query.trim().length < 2) {
    return { results: {}, totalCount: 0, error: 'Query must be at least 2 characters' };
  }

  const cleanQuery = query.trim();

  try {
    // Run all entity searches in parallel
    const searchPromises = types.map(type =>
      searchEntity(userId, cleanQuery, type, limitPerType, supabaseClient)
    );

    const searchResults = await Promise.all(searchPromises);

    // Build results object
    const results = {};
    let totalCount = 0;

    types.forEach((type, index) => {
      const typeResults = searchResults[index];
      if (typeResults.length > 0) {
        results[type] = typeResults;
        totalCount += typeResults.length;
      }
    });

    return {
      results,
      totalCount,
      query: cleanQuery
    };
  } catch (error) {
    console.error('Global search error:', error);
    return {
      results: {},
      totalCount: 0,
      error: 'Search failed. Please try again.'
    };
  }
}

/**
 * Get search suggestions based on recent searches
 * Note: This uses localStorage on the client side
 * @param {string} key - Storage key for recent searches
 * @returns {Array<string>} - Recent search queries
 */
export function getRecentSearches(key = 'recentSearches') {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a search query to recent searches
 * @param {string} query - Search query to save
 * @param {string} key - Storage key for recent searches
 * @param {number} maxItems - Max items to store
 */
export function saveRecentSearch(query, key = 'recentSearches', maxItems = 5) {
  if (typeof window === 'undefined' || !query?.trim()) return;

  try {
    const recent = getRecentSearches(key);
    const cleanQuery = query.trim();

    // Remove if already exists (to move to top)
    const filtered = recent.filter(q => q.toLowerCase() !== cleanQuery.toLowerCase());

    // Add to beginning and limit
    const updated = [cleanQuery, ...filtered].slice(0, maxItems);

    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear recent searches
 * @param {string} key - Storage key for recent searches
 */
export function clearRecentSearches(key = 'recentSearches') {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get entity display name for UI
 * @param {string} entityType - Entity type
 * @returns {string} - Display name
 */
export function getEntityDisplayName(entityType) {
  const displayNames = {
    [SEARCH_ENTITY_TYPES.LOADS]: 'Loads',
    [SEARCH_ENTITY_TYPES.INVOICES]: 'Invoices',
    [SEARCH_ENTITY_TYPES.CUSTOMERS]: 'Customers',
    [SEARCH_ENTITY_TYPES.EXPENSES]: 'Expenses',
    [SEARCH_ENTITY_TYPES.DRIVERS]: 'Drivers',
    [SEARCH_ENTITY_TYPES.VEHICLES]: 'Vehicles',
    [SEARCH_ENTITY_TYPES.COMPLIANCE]: 'Compliance',
    [SEARCH_ENTITY_TYPES.FUEL]: 'Fuel Entries'
  };
  return displayNames[entityType] || entityType;
}

/**
 * Get entity configuration
 * @param {string} entityType - Entity type
 * @returns {Object} - Entity configuration
 */
export function getEntityConfig(entityType) {
  return ENTITY_CONFIG[entityType] || null;
}
