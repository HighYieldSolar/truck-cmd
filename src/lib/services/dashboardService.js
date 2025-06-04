import { supabase } from "../supabaseClient";

/**
 * Fetches dashboard statistics for the authenticated user
 * @param {string} userId - The authenticated user's ID
 * @param {string} dateRange - The date range to filter by ('month', 'quarter', 'year', 'all')
 * @returns {Promise<Object>} Dashboard statistics
 */
export async function fetchDashboardStats(userId, dateRange = 'month') {
  try {
    console.log("Fetching dashboard stats for user:", userId, "dateRange:", dateRange);
    
    // Get date range for calculations based on the dateRange parameter
    const now = new Date();
    let startDate, endDate, previousStartDate, previousEndDate;
    
    switch (dateRange) {
      case 'quarter':
        // Current quarter
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        startDate = quarterStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        
        // Previous quarter for comparison
        const prevQuarterStart = new Date(quarterStart);
        prevQuarterStart.setMonth(prevQuarterStart.getMonth() - 3);
        const prevQuarterEnd = new Date(quarterStart);
        prevQuarterEnd.setDate(prevQuarterEnd.getDate() - 1);
        previousStartDate = prevQuarterStart.toISOString().split('T')[0];
        previousEndDate = prevQuarterEnd.toISOString().split('T')[0];
        break;
        
      case 'year':
        // Current year
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        
        // Previous year for comparison
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
        
      case 'all':
        // All time - no date filtering
        startDate = '1900-01-01'; // Far back start date
        endDate = now.toISOString().split('T')[0];
        
        // For comparison, use data from 30 days ago to yesterday
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        previousStartDate = thirtyDaysAgo.toISOString().split('T')[0];
        previousEndDate = yesterday.toISOString().split('T')[0];
        break;
        
      default: // 'month'
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        
        // Previous month for comparison
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        previousStartDate = firstDayOfLastMonth.toISOString().split('T')[0];
        previousEndDate = lastDayOfLastMonth.toISOString().split('T')[0];
        break;
    }
    
    console.log("Date ranges:", { startDate, endDate, previousStartDate, previousEndDate });
    
    // Run parallel queries for better performance
    const [
      invoicesResult, 
      factoringsResult, 
      previousInvoicesResult, 
      previousFactoringsResult,
      expensesResult,
      previousExpensesResult,
      activeLoadsResult,
      pendingInvoicesResult,
      upcomingDeliveriesResult
    ] = await Promise.all([
      // Current period invoices
      supabase
        .from('invoices')
        .select('total, amount_paid, status, invoice_date')
        .eq('user_id', userId)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate),
        
      // Current period factored earnings
      supabase
        .from('earnings')
        .select('amount, date')
        .eq('user_id', userId)
        .eq('source', 'Factoring')
        .gte('date', startDate)
        .lte('date', endDate),
      
      // Previous period invoices
      supabase
        .from('invoices')
        .select('total, amount_paid')
        .eq('user_id', userId)
        .gte('invoice_date', previousStartDate)
        .lte('invoice_date', previousEndDate),
      
      // Previous period factored earnings
      supabase
        .from('earnings')
        .select('amount, date')
        .eq('user_id', userId)
        .eq('source', 'Factoring')
        .gte('date', previousStartDate)
        .lte('date', previousEndDate),
      
      // Current period expenses
      supabase
        .from('expenses')
        .select('amount, date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate),
      
      // Previous period expenses
      supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .gte('date', previousStartDate)
        .lte('date', previousEndDate),
      
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
        .gte('delivery_date', endDate)
    ]);
    
    // Destructure results
    const { data: currentInvoices, error: invoicesError } = invoicesResult;
    const { data: currentFactoredEarnings, error: factoredError } = factoringsResult; 
    const { data: previousInvoices, error: previousInvoicesError } = previousInvoicesResult;
    const { data: previousFactoredEarnings, error: previousFactoredError } = previousFactoringsResult;
    const { data: currentExpenses, error: expensesError } = expensesResult;
    const { data: previousExpenses, error: previousExpensesError } = previousExpensesResult;
    const { data: activeLoads, error: loadsError } = activeLoadsResult;
    const { data: pendingInvoices, error: pendingInvoicesError } = pendingInvoicesResult;
    const { data: upcomingDeliveries, error: deliveryError } = upcomingDeliveriesResult;
    
    // Handle query errors
    if (invoicesError) throw invoicesError;
    if (factoredError) throw factoredError;
    if (previousInvoicesError) throw previousInvoicesError;
    if (previousFactoredError) throw previousFactoredError;
    if (expensesError) throw expensesError;
    if (previousExpensesError) throw previousExpensesError;
    if (loadsError) throw loadsError;
    if (pendingInvoicesError) throw pendingInvoicesError;
    if (deliveryError) throw deliveryError;
    
    // Log factored earnings data for debugging
    console.log("Current period factored earnings:", currentFactoredEarnings);
    
    // Calculate current period totals
    // Calculate invoice-based earnings (paid amounts)
    const currentPaidInvoices = currentInvoices
      ? currentInvoices
          .filter(invoice => invoice.status === 'Paid' || invoice.status === 'Partially Paid')
          .reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0)
      : 0;
    
    // Calculate factored earnings
    const currentFactoredEarningsTotal = currentFactoredEarnings
      ? currentFactoredEarnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0)
      : 0;
    
    console.log("Calculated earnings:", {
      paidInvoices: currentPaidInvoices,
      factoredEarnings: currentFactoredEarningsTotal,
      dateRange,
      startDate,
      endDate
    });
    
    // Total earnings = paid invoices + factored earnings
    const currentEarnings = currentPaidInvoices + currentFactoredEarningsTotal;
    
    // Calculate expenses total
    const currentExpensesTotal = currentExpenses
      ? currentExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
      : 0;
    
    // Calculate profit
    const currentProfit = currentEarnings - currentExpensesTotal;
    
    // Calculate previous period totals for comparison
    // Previous period paid invoices
    const previousPaidInvoices = previousInvoices
      ? previousInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0)
      : 0;
    
    // Previous period factored earnings
    const previousFactoredEarningsTotal = previousFactoredEarnings
      ? previousFactoredEarnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0)
      : 0;
    
    // Previous period total earnings
    const previousEarnings = previousPaidInvoices + previousFactoredEarningsTotal;
    
    // Previous period expenses
    const previousExpensesTotal = previousExpenses
      ? previousExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
      : 0;
    
    // Previous period profit
    const previousProfit = previousEarnings - previousExpensesTotal;
    
    // Calculate percentage changes
    const earningsChange = previousEarnings > 0 
      ? ((currentEarnings - previousEarnings) / previousEarnings * 100).toFixed(1)
      : null;
      
    const expensesChange = previousExpensesTotal > 0 
      ? ((currentExpensesTotal - previousExpensesTotal) / previousExpensesTotal * 100).toFixed(1)
      : null;
      
    const profitChange = previousProfit > 0 
      ? ((currentProfit - previousProfit) / previousProfit * 100).toFixed(1)
      : null;
    
    // Log final stats for debugging
    console.log("Final dashboard stats:", {
      earnings: currentEarnings,
      paidInvoices: currentPaidInvoices,
      factoredEarnings: currentFactoredEarningsTotal,
      expenses: currentExpensesTotal,
      profit: currentProfit,
      dateRange
    });
    
    return {
      earnings: currentEarnings,
      earningsChange: earningsChange,
      earningsPositive: earningsChange > 0,
      expenses: currentExpensesTotal,
      expensesChange: expensesChange,
      expensesPositive: expensesChange < 0, // For expenses, negative change is positive
      profit: currentProfit,
      profitChange: profitChange,
      profitPositive: profitChange > 0,
      activeLoads: activeLoads?.length || 0,
      pendingInvoices: pendingInvoices?.length || 0,
      upcomingDeliveries: upcomingDeliveries?.length || 0,
      // Add detailed earnings breakdown
      paidInvoices: currentPaidInvoices,
      factoredEarnings: currentFactoredEarningsTotal
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