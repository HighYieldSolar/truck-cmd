// src/lib/services/expenseService.js
import { supabase } from "../supabaseClient";

/**
 * Helper function to ensure dates are formatted correctly for storage
 * @param {string} dateString - The date string to format
 * @returns {string} - Properly formatted date string
 */
function formatDateForStorage(dateString) {
  if (!dateString) return null;
  
  // If already in YYYY-MM-DD format, just return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  try {
    // Parse the date string and ensure it's in YYYY-MM-DD format
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return dateString; // Return original if there's an error
  }
}

/**
 * Fetch all expenses for the current user with optional filters
 * @param {string} userId - The authenticated user's ID
 * @param {Object} filters - Filters to apply to the query
 * @returns {Promise<Array>} - Array of expense objects
 */
export async function fetchExpenses(userId, filters = {}) {
  try {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId);

    // Apply filters if provided
    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    }

    if (filters.dateRange === 'This Month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      query = query
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
    } else if (filters.dateRange === 'Last Month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      
      query = query
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
    } else if (filters.dateRange === 'This Quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
      const lastDay = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      
      query = query
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
    } else if (filters.dateRange === 'Last Quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) - 1;
      const year = quarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const firstDay = new Date(year, (quarter < 0 ? 4 : 0) + quarter * 3, 1);
      const lastDay = new Date(year, (quarter < 0 ? 4 : 0) + quarter * 3 + 3, 0);
      
      query = query
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
    } else if (filters.dateRange === 'This Year') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      
      query = query
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
    } else if (filters.dateRange === 'Custom' && filters.startDate && filters.endDate) {
      query = query
        .gte('date', filters.startDate)
        .lte('date', filters.endDate);
    }

    // Apply sorting
    if (filters.sortBy) {
      const order = filters.sortDirection === 'desc' ? { ascending: false } : { ascending: true };
      query = query.order(filters.sortBy, order);
    } else {
      // Default sort by date, newest first
      query = query.order('date', { ascending: false });
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get expense by ID
 * @param {string} userId - The authenticated user's ID
 * @param {string} id - Expense ID
 * @returns {Promise<Object|null>} - Expense object or null
 */
export async function getExpenseById(userId, id) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Create a new expense
 * @param {Object} expenseData - Expense data
 * @returns {Promise<Object|null>} - Created expense or null
 */
export async function createExpense(expenseData) {
  try {
    // Format the date properly before submitting
    const formattedData = {
      ...expenseData,
      date: formatDateForStorage(expenseData.date)
    };
    
    const { data, error } = await supabase
      .from('expenses')
      .insert([formattedData])
      .select();
      
    if (error) throw error;
    
    return data?.[0] || null;
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing expense
 * @param {string} userId - The authenticated user's ID
 * @param {string} id - Expense ID
 * @param {Object} expenseData - Updated expense data
 * @returns {Promise<Object|null>} - Updated expense or null
 */
export async function updateExpense(userId, id, expenseData) {
  try {
    // Format the date properly before submitting
    const formattedData = {
      ...expenseData,
      date: formatDateForStorage(expenseData.date)
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(formattedData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
      
    if (error) throw error;
    
    return data?.[0] || null;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete an expense
 * @param {string} userId - The authenticated user's ID
 * @param {string} id - Expense ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteExpense(userId, id) {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Get expense statistics
 * @param {string} userId - The authenticated user's ID
 * @param {string} period - 'month', 'year', or 'all'
 * @returns {Promise<Object>} - Expense statistics
 */
export async function getExpenseStats(userId, period = 'month') {
  try {
    let query = supabase
      .from('expenses')
      .select('amount, category, date')
      .eq('user_id', userId);
    
    // Apply time period filter
    if (period === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      query = query
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
    } else if (period === 'quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
      const lastDay = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      
      query = query
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
    } else if (period === 'year') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      
      query = query
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Ensure data is an array even if null/undefined
    const expenseData = data || [];
    
    // Calculate total expenses, safely handling null/undefined values
    const total = expenseData.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    
    // Calculate expenses by category, safely initializing
    const byCategory = {};
    
    // Populate with all known categories
    ['Fuel', 'Maintenance', 'Insurance', 'Tolls', 'Office', 'Permits', 'Meals', 'Other'].forEach(cat => {
      byCategory[cat] = 0;
    });
    
    // Add actual values
    expenseData.forEach(expense => {
      if (expense.category) {
        const category = expense.category;
        if (!byCategory[category]) {
          byCategory[category] = 0;
        }
        byCategory[category] += parseFloat(expense.amount) || 0;
      }
    });
    
    return {
      total,
      byCategory
    };
  } catch (error) {
    // Return safe default values
    return {
      total: 0,
      byCategory: {
        Fuel: 0,
        Maintenance: 0,
        Insurance: 0,
        Tolls: 0,
        Office: 0,
        Permits: 0,
        Meals: 0,
        Other: 0
      }
    };
  }
}

/**
 * Upload receipt image to Supabase storage
 * @param {string} userId - User ID
 * @param {File} file - Receipt image file
 * @returns {Promise<string|null>} - Public URL of the uploaded image or null
 */
export async function uploadReceiptImage(userId, file) {
  try {
    // Create a unique file path
    const filePath = `${userId}/receipts/${Date.now()}_${file.name}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);
      
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    return null;
  }
}

/**
 * Get expense summaries by time period
 * @param {string} userId - User ID
 * @param {string} groupBy - 'day', 'week', 'month', or 'year'
 * @param {Object} range - { start, end } date range
 * @returns {Promise<Array>} - Array of expense summaries
 */
export async function getExpenseSummaries(userId, groupBy = 'month', range = null) {
  try {
    // Base query to get all expenses for the user
    let query = supabase
      .from('expenses')
      .select('amount, date')
      .eq('user_id', userId);
    
    // Apply date range filter if provided
    if (range?.start && range?.end) {
      query = query
        .gte('date', range.start)
        .lte('date', range.end);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Group expenses by the specified time period
    const groupedExpenses = {};
    
    data.forEach(expense => {
      const date = new Date(expense.date);
      let key;
      
      if (groupBy === 'day') {
        key = expense.date; // YYYY-MM-DD format
      } else if (groupBy === 'week') {
        // Get the week number
        const janFirst = new Date(date.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((date - janFirst) / 86400000) + janFirst.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${weekNum}`;
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'year') {
        key = `${date.getFullYear()}`;
      }
      
      if (!groupedExpenses[key]) {
        groupedExpenses[key] = 0;
      }
      
      groupedExpenses[key] += expense.amount;
    });
    
    // Convert to array format for charts
    const result = Object.entries(groupedExpenses).map(([period, amount]) => ({
      period,
      amount
    }));
    
    // Sort by period
    return result.sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    return [];
  }
}