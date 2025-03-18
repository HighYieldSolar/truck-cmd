// src/lib/services/dashboardService.js
import { supabase } from "../supabaseClient";

/**
 * Fetches dashboard statistics for the authenticated user
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Dashboard statistics
 */
export async function fetchDashboardStats(userId) {
  try {
    // Get current month date range for MTD calculations
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    
    // For comparison with previous month
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const firstDayOfLastMonthStr = firstDayOfLastMonth.toISOString().split('T')[0];
    const lastDayOfLastMonthStr = lastDayOfLastMonth.toISOString().split('T')[0];
    
    // Fetch invoices for earnings calculation (current month)
    const { data: currentInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total, amount_paid, status, invoice_date')
      .eq('user_id', userId)
      .gte('invoice_date', firstDayOfMonthStr)
      .lte('invoice_date', todayStr);
      
    if (invoicesError) throw invoicesError;
    
    // Fetch invoices for last month (for comparison)
    const { data: lastMonthInvoices, error: lastMonthInvoicesError } = await supabase
      .from('invoices')
      .select('total, amount_paid')
      .eq('user_id', userId)
      .gte('invoice_date', firstDayOfLastMonthStr)
      .lte('invoice_date', lastDayOfLastMonthStr);
    
    if (lastMonthInvoicesError) throw lastMonthInvoicesError;
    
    // IMPORTANT: Also fetch factored earnings for current month
    const { data: currentFactoredEarnings, error: factoredError } = await supabase
    .from('earnings')
    .select('amount, date')
    .eq('user_id', userId)
    .eq('source', 'Factoring')
    .gte('date', firstDayOfMonthStr)
    .lte('date', todayStr);
    
  if (factoredError) throw factoredError;
    
    // Fetch factored earnings for last month (for comparison)
    const { data: lastMonthFactoredEarnings, error: lastMonthFactoredError } = await supabase
    .from('earnings')
    .select('amount, date')
    .eq('user_id', userId)
    .eq('source', 'Factoring')
    .gte('date', firstDayOfLastMonthStr)
    .lte('date', lastDayOfLastMonthStr);
    
  if (lastMonthFactoredError) throw lastMonthFactoredError;
    
    // Fetch current month expenses
    const { data: currentExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, date')
      .eq('user_id', userId)
      .gte('date', firstDayOfMonthStr)
      .lte('date', todayStr);
      
    if (expensesError) throw expensesError;
    
    // Fetch last month expenses (for comparison)
    const { data: lastMonthExpenses, error: lastMonthExpensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', firstDayOfLastMonthStr)
      .lte('date', lastDayOfLastMonthStr);
      
    if (lastMonthExpensesError) throw lastMonthExpensesError;
    
    // Fetch active loads
    const { data: activeLoads, error: loadsError } = await supabase
      .from('loads')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['Pending', 'Assigned', 'In Transit']);
    
    if (loadsError) throw loadsError;
    
    // Fetch pending invoices
    const { data: pendingInvoices, error: pendingInvoicesError } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'Pending');
      
    if (pendingInvoicesError) throw pendingInvoicesError;
    
    // Fetch upcoming deliveries (deliveries scheduled for today or in the future)
    const { data: upcomingDeliveries, error: deliveryError } = await supabase
      .from('loads')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['Assigned', 'In Transit'])
      .gte('delivery_date', todayStr);
      
    if (deliveryError) throw deliveryError;
    
    // Calculate current month totals
    // Calculate invoice-based earnings (paid amounts)
    const currentMonthPaidInvoices = currentInvoices
      .filter(invoice => invoice.status === 'Paid' || invoice.status === 'Partially Paid')
      .reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0);
    
    // Calculate factored earnings
    const currentMonthFactoredEarnings = currentFactoredEarnings
    ? currentFactoredEarnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0)
    : 0;
    
    // Total earnings = paid invoices + factored earnings
    const currentMonthEarnings = currentMonthPaidInvoices + currentMonthFactoredEarnings;
    
    // Calculate expenses total
    const currentMonthExpensesTotal = currentExpenses
      ? currentExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
      : 0;
    
    // Calculate profit
    const currentProfit = currentMonthEarnings - currentMonthExpensesTotal;
    
    // Calculate last month totals for comparison
    // Last month paid invoices
    const lastMonthPaidInvoices = lastMonthInvoices
      ? lastMonthInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0)
      : 0;
    
    // Last month factored earnings
    const lastMonthFactoredEarningsTotal = lastMonthFactoredEarnings
    ? lastMonthFactoredEarnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0)
    : 0;
    
    // Last month total earnings
    const lastMonthEarnings = lastMonthPaidInvoices + lastMonthFactoredEarningsTotal;
    
    // Last month expenses
    const lastMonthExpensesTotal = lastMonthExpenses
      ? lastMonthExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
      : 0;
    
    // Last month profit
    const lastMonthProfit = lastMonthEarnings - lastMonthExpensesTotal;
    
    // Calculate percentage changes
    const earningsChange = lastMonthEarnings > 0 
      ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)
      : null;
      
    const expensesChange = lastMonthExpensesTotal > 0 
      ? ((currentMonthExpensesTotal - lastMonthExpensesTotal) / lastMonthExpensesTotal * 100).toFixed(1)
      : null;
      
    const profitChange = lastMonthProfit > 0 
      ? ((currentProfit - lastMonthProfit) / lastMonthProfit * 100).toFixed(1)
      : null;
    
    return {
      earnings: currentMonthEarnings,
      earningsChange: earningsChange,
      earningsPositive: earningsChange > 0,
      expenses: currentMonthExpensesTotal,
      expensesChange: expensesChange,
      expensesPositive: expensesChange < 0, // For expenses, negative change is positive
      profit: currentProfit,
      profitChange: profitChange,
      profitPositive: profitChange > 0,
      activeLoads: activeLoads?.length || 0,
      pendingInvoices: pendingInvoices?.length || 0,
      upcomingDeliveries: upcomingDeliveries?.length || 0,
      // Add detailed earnings breakdown
      paidInvoices: currentMonthPaidInvoices,
      factoredEarnings: currentMonthFactoredEarnings
      };
    }
  
    catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values in case of error
    return {
      earnings: 0,
      earningsChange: null,
      earningsPositive: false,
      expenses: 0,
      expensesChange: null,
      expensesPositive: false,
      profit: 0,
      profitChange: null,
      profitPositive: false,
      activeLoads: 0,
      pendingInvoices: 0,
      upcomingDeliveries: 0,
      paidInvoices: 0,
      factoredEarnings: 0
    };
  }
}

/**
 * Fetches recent activity for the dashboard
 * @param {string} userId - The authenticated user's ID
 * @param {number} limit - Maximum number of activities to return
 * @returns {Promise<Array>} Recent activities
 */
export async function fetchRecentActivity(userId, limit = 5) {
  try {
    // Get recent invoice activities
    const { data: invoiceActivity, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, created_at, status, customer')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (invoiceError) throw invoiceError;
    
    // Get recent expense activities
    const { data: expenseActivity, error: expenseError } = await supabase
      .from('expenses')
      .select('id, description, amount, created_at, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (expenseError) throw expenseError;
    
    // Get recent load activities
    const { data: loadActivity, error: loadError } = await supabase
      .from('loads')
      .select('id, load_number, customer, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (loadError) throw loadError;

// Get recent factored earnings
const { data: factoredActivity, error: factoredError } = await supabase
  .from('earnings')
  .select('id, description, amount, created_at, factoring_company')
  .eq('user_id', userId)
  .eq('source', 'Factoring')
  .order('created_at', { ascending: false })
  .limit(limit);
    
    // Combine all activities and sort by created_at
    const combinedActivity = [
      ...(invoiceActivity || []).map(item => ({
        id: `inv-${item.id}`,
        type: 'invoice',
        title: `Invoice #${item.invoice_number} ${formatStatus(item.status)}`,
        amount: `$${parseFloat(item.total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        client: item.customer,
        date: timeAgo(new Date(item.created_at)),
        status: getStatusType(item.status)
      })),
      ...(expenseActivity || []).map(item => ({
        id: `exp-${item.id}`,
        type: 'expense',
        title: `${item.category} expense recorded`,
        amount: `$${parseFloat(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        description: item.description,
        date: timeAgo(new Date(item.created_at)),
        status: 'neutral'
      })),
      ...(loadActivity || []).map(item => ({
        id: `load-${item.id}`,
        type: 'load',
        title: `Load #${item.load_number} ${formatStatus(item.status)}`,
        client: item.customer,
        date: timeAgo(new Date(item.created_at)),
        status: getStatusType(item.status)
      }))
    ];
    
    // Sort by date, newest first (using the raw data's created_at before it was converted)
    const rawItems = [
      ...(invoiceActivity || []).map(item => ({ ...item, activityType: 'invoice' })),
      ...(expenseActivity || []).map(item => ({ ...item, activityType: 'expense' })),
      ...(loadActivity || []).map(item => ({ ...item, activityType: 'load' })),
      ...(factoredActivity || []).map(item => ({ ...item, activityType: 'earnings' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Map the sorted items to the formatted activities
    const sortedActivities = rawItems.slice(0, limit).map(item => {
      const formattedItem = combinedActivity.find(activity => {
        if (item.activityType === 'invoice' && activity.id === `inv-${item.id}`) return true;
        if (item.activityType === 'expense' && activity.id === `exp-${item.id}`) return true;
        if (item.activityType === 'load' && activity.id === `load-${item.id}`) return true;
        return false;
      });
      return formattedItem;
    }).filter(Boolean); // Remove any undefined items
    
    return sortedActivities;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Fetches upcoming deliveries for the dashboard
 * @param {string} userId - The authenticated user's ID
 * @param {number} limit - Maximum number of deliveries to return
 * @returns {Promise<Array>} Upcoming deliveries
 */
export async function fetchUpcomingDeliveries(userId, limit = 3) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('loads')
      .select('id, load_number, customer, destination, delivery_date, status')
      .eq('user_id', userId)
      .in('status', ['Assigned', 'In Transit'])
      .gte('delivery_date', today)
      .order('delivery_date', { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      loadNumber: item.load_number,
      client: item.customer,
      destination: item.destination,
      date: formatDate(item.delivery_date),
      status: item.status
    }));
  } catch (error) {
    console.error('Error fetching upcoming deliveries:', error);
    return [];
  }
}

/**
 * Fetches recent invoices for the dashboard
 * @param {string} userId - The authenticated user's ID
 * @param {number} limit - Maximum number of invoices to return
 * @returns {Promise<Array>} Recent invoices
 */
export async function fetchRecentInvoices(userId, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, invoice_date, due_date, status, customer')
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      number: item.invoice_number,
      customer: item.customer,
      amount: parseFloat(item.total) || 0,
      date: formatDate(item.invoice_date),
      dueDate: formatDate(item.due_date),
      status: item.status
    }));
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    return [];
  }
}

// Helper functions
function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + 'y ago';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + 'mo ago';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + 'd ago';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + 'h ago';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + 'm ago';
  }
  return Math.floor(seconds) + 's ago';
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
}

function getStatusType(status) {
  if (!status) return 'neutral';
  
  const statusMap = {
    'paid': 'success',
    'pending': 'neutral',
    'overdue': 'error',
    'completed': 'success',
    'in transit': 'success',
    'delivered': 'success',
    'cancelled': 'error',
    'delayed': 'warning'
  };
  
  return statusMap[status.toLowerCase()] || 'neutral';
}

function formatStatus(status) {
  if (!status) return '';
  
  // Convert from database format to display format if needed
  // For example: 'in_transit' -> 'In Transit'
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}