// src/lib/services/earningsService.js
import { supabase } from "../supabaseClient";

/**
 * Records earnings from factored loads
 * @param {string} userId - User ID
 * @param {string} loadId - Load ID
 * @param {number} amount - Earnings amount
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Created earnings record
 */
export async function recordFactoredEarnings(userId, loadId, amount, options = {}) {
  try {
    // Get load details for reference
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('load_number, origin, destination')
      .eq('id', loadId)
      .single();
      
    if (loadError) {
      console.error('Error fetching load details:', loadError);
      // Continue with minimal data if load details can't be fetched
    }

    // Create earnings data
    const earningsData = {
      user_id: userId,
      load_id: loadId,
      amount: amount,
      date: options.date || new Date().toISOString().split('T')[0],
      source: 'Factoring',
      description: options.description || `Factored load ${load ? `#${load.load_number}: ${load.origin} to ${load.destination}` : ''}`,
      factoring_company: options.factoringCompany || null,
      created_at: new Date().toISOString()
    };

    // Insert the earnings record
    const { data, error } = await supabase
      .from('earnings')
      .insert([earningsData])
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error recording factored earnings:', error);
    throw error;
  }
}

/**
 * Get earnings summary for dashboard
 * @param {string} userId - User ID
 * @param {string} period - Time period (day, week, month, year, all)
 * @returns {Promise<Object>} - Earnings summary
 */
export async function getEarningsSummary(userId, period = 'month') {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Query for invoices within the time period
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total, amount_paid, invoice_date')
      .eq('user_id', userId)
      .gte('invoice_date', startDate.toISOString().split('T')[0])
      .order('invoice_date', { ascending: false });

    if (invoicesError) throw invoicesError;

    // Query for factored earnings within the time period
    const { data: factoredEarnings, error: earningsError } = await supabase
      .from('earnings')
      .select('amount, date')
      .eq('user_id', userId)
      .eq('source', 'Factoring')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (earningsError) throw earningsError;

    // Calculate totals
    let invoiceTotal = 0;
    let paidAmount = 0;
    let factoredAmount = 0;

    // Sum invoice amounts
    if (invoices && invoices.length > 0) {
      invoiceTotal = invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.total) || 0), 0);
      paidAmount = invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0);
    }

    // Sum factored earnings
    if (factoredEarnings && factoredEarnings.length > 0) {
      factoredAmount = factoredEarnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0);
    }

    // Return combined summary
    return {
      invoiceTotal,
      paidAmount,
      factoredAmount,
      totalEarnings: paidAmount + factoredAmount,
      invoiceCount: invoices?.length || 0,
      factoredCount: factoredEarnings?.length || 0
    };
  } catch (error) {
    console.error('Error getting earnings summary:', error);
    return {
      invoiceTotal: 0,
      paidAmount: 0,
      factoredAmount: 0,
      totalEarnings: 0,
      invoiceCount: 0,
      factoredCount: 0
    };
  }
}

/**
 * Get recent earnings transactions
 * @param {string} userId - User ID
 * @param {number} limit - Number of transactions to return
 * @returns {Promise<Array>} - Recent earnings transactions
 */
export async function getRecentEarnings(userId, limit = 5) {
  try {
    // Get recent factored earnings
    const { data: factoredEarnings, error: earningsError } = await supabase
      .from('earnings')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'Factoring')
      .order('date', { ascending: false })
      .limit(limit);

    if (earningsError) throw earningsError;

    // Get recent paid invoices
    const { data: paidInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*, loads(load_number, origin, destination)')
      .eq('user_id', userId)
      .eq('status', 'Paid')
      .order('payment_date', { ascending: false })
      .limit(limit);

    if (invoicesError) throw invoicesError;

    // Format and combine the transactions
    const formattedFactored = (factoredEarnings || []).map(earning => ({
      id: earning.id,
      type: 'factored',
      amount: earning.amount,
      date: earning.date,
      description: earning.description,
      factoring_company: earning.factoring_company,
      source: 'Factoring'
    }));

    const formattedInvoices = (paidInvoices || []).map(invoice => ({
      id: invoice.id,
      type: 'invoice',
      amount: invoice.amount_paid,
      date: invoice.payment_date || invoice.invoice_date,
      description: `Invoice #${invoice.invoice_number} - ${invoice.customer}`,
      invoice_number: invoice.invoice_number,
      customer: invoice.customer,
      source: 'Invoice Payment'
    }));

    // Combine and sort by date (newest first)
    const combined = [...formattedFactored, ...formattedInvoices]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    return combined;
  } catch (error) {
    console.error('Error getting recent earnings:', error);
    return [];
  }
}