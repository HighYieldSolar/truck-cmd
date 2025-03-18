import { supabase } from "../supabaseClient";

/**
 * Fetches dashboard statistics for the authenticated user
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Dashboard statistics
 */
export async function fetchDashboardStats(userId) {
  try {
    console.log("Fetching dashboard stats for user:", userId);
    
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
    
    // Run parallel queries for better performance
    const [
      invoicesResult, 
      factoringsResult, 
      lastMonthInvoicesResult, 
      lastMonthFactoringsResult,
      expensesResult,
      lastMonthExpensesResult,
      activeLoadsResult,
      pendingInvoicesResult,
      upcomingDeliveriesResult
    ] = await Promise.all([
      // Current month invoices
      supabase
        .from('invoices')
        .select('total, amount_paid, status, invoice_date')
        .eq('user_id', userId)
        .gte('invoice_date', firstDayOfMonthStr)
        .lte('invoice_date', todayStr),
        
      // Current month factored earnings
      supabase
        .from('earnings')
        .select('amount, date')
        .eq('user_id', userId)
        .eq('source', 'Factoring')
        .gte('date', firstDayOfMonthStr)
        .lte('date', todayStr),
      
      // Last month invoices
      supabase
        .from('invoices')
        .select('total, amount_paid')
        .eq('user_id', userId)
        .gte('invoice_date', firstDayOfLastMonthStr)
        .lte('invoice_date', lastDayOfLastMonthStr),
      
      // Last month factored earnings
      supabase
        .from('earnings')
        .select('amount, date')
        .eq('user_id', userId)
        .eq('source', 'Factoring')
        .gte('date', firstDayOfLastMonthStr)
        .lte('date', lastDayOfLastMonthStr),
      
      // Current month expenses
      supabase
        .from('expenses')
        .select('amount, date')
        .eq('user_id', userId)
        .gte('date', firstDayOfMonthStr)
        .lte('date', todayStr),
      
      // Last month expenses
      supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .gte('date', firstDayOfLastMonthStr)
        .lte('date', lastDayOfLastMonthStr),
      
      // Active loads
      supabase
        .from('loads')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['Pending', 'Assigned', 'In Transit']),
      
      // Pending invoices
      supabase
        .from('invoices')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'Pending'),
      
      // Upcoming deliveries
      supabase
        .from('loads')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['Assigned', 'In Transit'])
        .gte('delivery_date', todayStr)
    ]);
    
    // Destructure results
    const { data: currentInvoices, error: invoicesError } = invoicesResult;
    const { data: currentFactoredEarnings, error: factoredError } = factoringsResult; 
    const { data: lastMonthInvoices, error: lastMonthInvoicesError } = lastMonthInvoicesResult;
    const { data: lastMonthFactoredEarnings, error: lastMonthFactoredError } = lastMonthFactoringsResult;
    const { data: currentExpenses, error: expensesError } = expensesResult;
    const { data: lastMonthExpenses, error: lastMonthExpensesError } = lastMonthExpensesResult;
    const { data: activeLoads, error: loadsError } = activeLoadsResult;
    const { data: pendingInvoices, error: pendingInvoicesError } = pendingInvoicesResult;
    const { data: upcomingDeliveries, error: deliveryError } = upcomingDeliveriesResult;
    
    // Handle query errors
    if (invoicesError) throw invoicesError;
    if (factoredError) throw factoredError;
    if (lastMonthInvoicesError) throw lastMonthInvoicesError;
    if (lastMonthFactoredError) throw lastMonthFactoredError;
    if (expensesError) throw expensesError;
    if (lastMonthExpensesError) throw lastMonthExpensesError;
    if (loadsError) throw loadsError;
    if (pendingInvoicesError) throw pendingInvoicesError;
    if (deliveryError) throw deliveryError;
    
    // Log factored earnings data for debugging
    console.log("Current month factored earnings:", currentFactoredEarnings);
    
    // Calculate current month totals
    // Calculate invoice-based earnings (paid amounts)
    const currentMonthPaidInvoices = currentInvoices
      ? currentInvoices
          .filter(invoice => invoice.status === 'Paid' || invoice.status === 'Partially Paid')
          .reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0)
      : 0;
    
    // Calculate factored earnings
    const currentMonthFactoredEarnings = currentFactoredEarnings
      ? currentFactoredEarnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0)
      : 0;
    
    console.log("Calculated earnings:", {
      paidInvoices: currentMonthPaidInvoices,
      factoredEarnings: currentMonthFactoredEarnings
    });
    
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
    
    // Log final stats for debugging
    console.log("Final dashboard stats:", {
      earnings: currentMonthEarnings,
      paidInvoices: currentMonthPaidInvoices,
      factoredEarnings: currentMonthFactoredEarnings,
      expenses: currentMonthExpensesTotal,
      profit: currentProfit
    });
    
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
  } catch (error) {
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
      .select('id, description, amount, date, created_at, factoring_company')
      .eq('user_id', userId)
      .eq('source', 'Factoring')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (factoredError) throw factoredError;
    
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
      })),
      ...(factoredActivity || []).map(item => ({
        id: `factored-${item.id}`,
        type: 'factored',
        title: `Factored load earnings recorded`,
        amount: `$${parseFloat(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        description: item.description,
        company: item.factoring_company,
        date: timeAgo(new Date(item.created_at || item.date)),
        status: 'success'
      }))
    ];
    
    // Sort by date, newest first (using the raw data's created_at before it was converted)
    const rawItems = [
      ...(invoiceActivity || []).map(item => ({ ...item, activityType: 'invoice' })),
      ...(expenseActivity || []).map(item => ({ ...item, activityType: 'expense' })),
      ...(loadActivity || []).map(item => ({ ...item, activityType: 'load' })),
      ...(factoredActivity || []).map(item => ({ ...item, activityType: 'factored', created_at: item.created_at || new Date(item.date).toISOString() }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Map the sorted items to the formatted activities
    const sortedActivities = rawItems.slice(0, limit).map(item => {
      if (item.activityType === 'invoice') {
        return combinedActivity.find(activity => activity.id === `inv-${item.id}`);
      } else if (item.activityType === 'expense') {
        return combinedActivity.find(activity => activity.id === `exp-${item.id}`);
      } else if (item.activityType === 'load') {
        return combinedActivity.find(activity => activity.id === `load-${item.id}`);
      } else if (item.activityType === 'factored') {
        return combinedActivity.find(activity => activity.id === `factored-${item.id}`);
      }
      return null;
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