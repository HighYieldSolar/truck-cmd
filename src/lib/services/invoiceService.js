// src/lib/services/invoiceService.js
import { supabase } from "../supabaseClient";

/**
 * Fetch all invoices for the current user with optional filters
 * @param {string} userId - The authenticated user's ID
 * @param {Object} filters - Filters to apply to the query
 * @returns {Promise<Array>} - Array of invoice objects
 */
export async function fetchInvoices(userId, filters = {}) {
  try {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        loads (load_number, origin, destination)
      `)
      .eq('user_id', userId);

    // Apply filters if provided
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%,customer.ilike.%${filters.search}%`);
    }

    if (filters.dateRange === 'thisMonth') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      query = query
        .gte('invoice_date', firstDay.toISOString().split('T')[0])
        .lte('invoice_date', lastDay.toISOString().split('T')[0]);
    } else if (filters.dateRange === 'last90') {
      const now = new Date();
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      
      query = query.gte('invoice_date', ninetyDaysAgo.toISOString().split('T')[0]);
    } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      query = query
        .gte('invoice_date', filters.startDate)
        .lte('invoice_date', filters.endDate);
    }

    // Apply sorting
    if (filters.sortBy) {
      const order = filters.sortDirection === 'desc' ? { ascending: false } : { ascending: true };
      query = query.order(filters.sortBy, order);
    } else {
      // Default sort by invoice date, newest first
      query = query.order('invoice_date', { ascending: false });
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

/**
 * Get invoice by ID
 * @param {string} id - Invoice ID
 * @returns {Promise<Object|null>} - Invoice object or null
 */
export async function getInvoiceById(id) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        loads (id, load_number, origin, destination, customer, description)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

/**
 * Generate an invoice number
 * @param {string} userId - User ID for querying existing invoice numbers
 * @returns {Promise<string>} - Generated invoice number
 */
export async function generateInvoiceNumber(userId) {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get the highest invoice number for the current year
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', userId)
      .ilike('invoice_number', `INV-${currentYear}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    
    let nextNumber = 1;
    
    if (data && data.length > 0) {
      // Extract the numeric part from the highest invoice number
      const lastInvoice = data[0].invoice_number;
      const matches = lastInvoice.match(/-(\d+)$/);
      
      if (matches && matches[1]) {
        nextNumber = parseInt(matches[1], 10) + 1;
      }
    }
    
    // Format with leading zeros for at least 4 digits
    return `INV-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to a timestamp-based number if there's an error
    return `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
  }
}

/**
 * Create a new invoice
 * @param {Object} invoiceData - Invoice data
 * @returns {Promise<Object|null>} - Created invoice or null
 */
export async function createInvoice(invoiceData) {
  try {
    // Prepare invoice items data for separate insertion
    const items = invoiceData.items || [];
    
    // Remove items from main invoice data
    const { items: _, ...invoiceDataWithoutItems } = invoiceData;
    
    // Insert the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert([invoiceDataWithoutItems])
      .select();
      
    if (error) throw error;
    
    if (!invoice || invoice.length === 0) {
      throw new Error('Failed to create invoice');
    }
    
    const invoiceId = invoice[0].id;
    
    // Insert invoice items if there are any
    if (items.length > 0) {
      // Add invoice_id to each item
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: invoiceId
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);
        
      if (itemsError) throw itemsError;
    }
    
    return invoice[0];
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

/**
 * Update an existing invoice
 * @param {string} id - Invoice ID
 * @param {Object} invoiceData - Updated invoice data
 * @returns {Promise<Object|null>} - Updated invoice or null
 */
export async function updateInvoice(id, invoiceData) {
  try {
    // Prepare invoice items data for separate handling
    const items = invoiceData.items || [];
    
    // Remove items from main invoice data
    const { items: _, ...invoiceDataWithoutItems } = invoiceData;
    
    // Update the invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(invoiceDataWithoutItems)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    if (!invoice || invoice.length === 0) {
      throw new Error('Failed to update invoice');
    }
    
    // Handle invoice items - delete existing and insert new
    if (items.length > 0) {
      // First delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
        
      if (deleteError) throw deleteError;
      
      // Then insert new items
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: id
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);
        
      if (itemsError) throw itemsError;
    }
    
    return invoice[0];
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
}

/**
 * Delete an invoice
 * @param {string} id - Invoice ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteInvoice(id) {
  try {
    // First delete related invoice items
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
      
    if (itemsError) throw itemsError;
    
    // Then delete the invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

/**
 * Get invoice items for a specific invoice
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Array>} - Array of invoice items
 */
export async function getInvoiceItems(invoiceId) {
  try {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    return [];
  }
}

/**
 * Update invoice status
 * @param {string} id - Invoice ID
 * @param {string} status - New status
 * @returns {Promise<Object|null>} - Updated invoice or null
 */
export async function updateInvoiceStatus(id, status) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}

/**
 * Record payment for an invoice
 * @param {string} invoiceId - Invoice ID
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object|null>} - Payment record or null
 */
export async function recordPayment(invoiceId, paymentData) {
  try {
    // Insert payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        ...paymentData,
        invoice_id: invoiceId
      }])
      .select();
      
    if (paymentError) throw paymentError;
    
    // Update invoice payment status
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('total, amount_paid')
      .eq('id', invoiceId)
      .single();
      
    if (invoiceError) throw invoiceError;
    
    const newAmountPaid = (parseFloat(invoice.amount_paid) || 0) + parseFloat(paymentData.amount);
    const newStatus = newAmountPaid >= invoice.total ? 'Paid' : 'Partially Paid';
    
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: newStatus,
        amount_paid: newAmountPaid,
        payment_date: newAmountPaid >= invoice.total ? new Date().toISOString() : null
      })
      .eq('id', invoiceId);
      
    if (updateError) throw updateError;
    
    return payment?.[0] || null;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}

/**
 * Get invoice statistics for dashboard
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Invoice statistics
 */
export async function getInvoiceStats(userId) {
  try {
    // Get all invoices for this user
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, total, amount_paid, status, invoice_date, due_date')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    if (!invoices) return { total: 0, paid: 0, pending: 0, overdue: 0 };
    
    const today = new Date();
    
    // Calculate totals
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    
    invoices.forEach(invoice => {
      const total = parseFloat(invoice.total) || 0;
      totalAmount += total;
      
      if (invoice.status.toLowerCase() === 'paid') {
        paidAmount += total;
      } else if (invoice.status.toLowerCase() === 'pending') {
        // Check if overdue
        const dueDate = new Date(invoice.due_date);
        if (dueDate < today) {
          overdueAmount += total;
        } else {
          pendingAmount += total;
        }
      } else if (invoice.status.toLowerCase() === 'overdue') {
        overdueAmount += total;
      }
    });
    
    return {
      total: totalAmount,
      paid: paidAmount,
      pending: pendingAmount,
      overdue: overdueAmount,
      count: invoices.length
    };
  } catch (error) {
    console.error('Error getting invoice statistics:', error);
    return { total: 0, paid: 0, pending: 0, overdue: 0, count: 0 };
  }
}

/**
 * Set up real-time subscription for invoices
 * @param {string} userId - User ID
 * @param {function} callback - Callback function when data changes
 * @returns {function} - Unsubscribe function
 */
export function subscribeToInvoices(userId, callback) {
  const channel = supabase
    .channel('invoice-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Email an invoice to a client
 * @param {string} invoiceId - Invoice ID
 * @param {Object} emailDetails - Email details (to, subject, message)
 * @returns {Promise<boolean>} - Success status
 */
export async function emailInvoice(invoiceId, emailDetails) {
  try {
    // In a real implementation, this would call a server endpoint
    // that handles the email sending. For now, we'll simulate this.
    
    // First, update the invoice to record that it was sent
    const { data, error } = await supabase
      .from('invoices')
      .update({ 
        last_sent: new Date().toISOString(),
        status: 'Sent'
      })
      .eq('id', invoiceId)
      .select();
      
    if (error) throw error;
    
    // In a real implementation, you would call your email API here
    console.log(`Email sent to ${emailDetails.to}`);
    
    return true;
  } catch (error) {
    console.error('Error emailing invoice:', error);
    throw error;
  }
}

/**
 * Get recent invoices for dashboard
 * @param {string} userId - User ID
 * @param {number} limit - Number of invoices to return
 * @returns {Promise<Array>} - Recent invoices
 */
export async function getRecentInvoices(userId, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer, total, invoice_date, due_date, status')
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting recent invoices:', error);
    return [];
  }
}