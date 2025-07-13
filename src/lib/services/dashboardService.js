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
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = currentQuarter * 3;
        const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
        // Format date maintaining local timezone
        startDate = `${quarterStart.getFullYear()}-${String(quarterStart.getMonth() + 1).padStart(2, '0')}-${String(quarterStart.getDate()).padStart(2, '0')}`;
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Previous quarter for comparison
        const prevQuarterStartMonth = quarterStartMonth - 3;
        const prevQuarterYear = prevQuarterStartMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const adjustedPrevQuarterMonth = prevQuarterStartMonth < 0 ? prevQuarterStartMonth + 12 : prevQuarterStartMonth;
        
        const prevQuarterStart = new Date(prevQuarterYear, adjustedPrevQuarterMonth, 1);
        const prevQuarterEnd = new Date(now.getFullYear(), quarterStartMonth, 0);
        previousStartDate = `${prevQuarterStart.getFullYear()}-${String(prevQuarterStart.getMonth() + 1).padStart(2, '0')}-${String(prevQuarterStart.getDate()).padStart(2, '0')}`;
        previousEndDate = `${prevQuarterEnd.getFullYear()}-${String(prevQuarterEnd.getMonth() + 1).padStart(2, '0')}-${String(prevQuarterEnd.getDate()).padStart(2, '0')}`;
        break;
        
      case 'year':
        // Current year
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Previous year for comparison
        previousStartDate = `${now.getFullYear() - 1}-01-01`;
        previousEndDate = `${now.getFullYear() - 1}-12-31`;
        break;
        
      case 'all':
        // All time - no date filtering
        startDate = '1900-01-01'; // Far back start date
        endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // For comparison, use data from 30 days ago to yesterday
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        previousStartDate = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
        previousEndDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        break;
        
      default: // 'month'
        // Current month - first day of current month
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();
        
        // Format dates as YYYY-MM-DD in local timezone
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Previous month for comparison
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const lastDayPrevMonth = new Date(year, month, 0).getDate();
        
        previousStartDate = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`;
        previousEndDate = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDayPrevMonth).padStart(2, '0')}`;
        
        console.log("Month filter dates:", {
          currentMonth: month + 1,
          year: year,
          startDate,
          endDate,
          previousStartDate,
          previousEndDate
        });
        break;
    }
    
    console.log("Date ranges:", { 
      startDate, 
      endDate, 
      previousStartDate, 
      previousEndDate,
      currentDate: new Date().toISOString().split('T')[0],
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear()
    });
    
    // Validate dates
    if (!startDate || !endDate) {
      console.error("Invalid date range calculated");
      throw new Error("Invalid date range");
    }
    
    // Run parallel queries for better performance
    const [
      completedLoadsResult,
      standaloneInvoicesResult,
      previousCompletedLoadsResult,
      previousStandaloneInvoicesResult,
      expensesResult,
      previousExpensesResult,
      activeLoadsResult,
      pendingInvoicesResult,
      upcomingDeliveriesResult
    ] = await Promise.all([
      // Current period completed loads (main source of earnings)
      supabase
        .from('loads')
        .select('id, rate, final_rate, factored, factoring_company, delivery_date, load_number, customer')
        .eq('user_id', userId)
        .eq('status', 'Completed')
        .gte('delivery_date', startDate)
        .lte('delivery_date', endDate),
        
      // Current period standalone invoices (NOT linked to loads to avoid double counting)
      supabase
        .from('invoices')
        .select('total, amount_paid, status, invoice_date')
        .eq('user_id', userId)
        .is('load_id', null)  // Only invoices NOT linked to loads
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate),
      
      // Previous period completed loads
      supabase
        .from('loads')
        .select('rate, final_rate, factored')
        .eq('user_id', userId)
        .eq('status', 'Completed')
        .gte('delivery_date', previousStartDate)
        .lte('delivery_date', previousEndDate),
      
      // Previous period standalone invoices
      supabase
        .from('invoices')
        .select('total, amount_paid, status')
        .eq('user_id', userId)
        .is('load_id', null)  // Only invoices NOT linked to loads
        .gte('invoice_date', previousStartDate)
        .lte('invoice_date', previousEndDate),
      
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
    const { data: currentLoads, error: currentLoadsError } = completedLoadsResult;
    const { data: standaloneInvoices, error: standaloneInvoicesError } = standaloneInvoicesResult;
    const { data: previousLoads, error: previousLoadsError } = previousCompletedLoadsResult;
    const { data: previousStandaloneInvoices, error: previousStandaloneInvoicesError } = previousStandaloneInvoicesResult;
    const { data: currentExpenses, error: expensesError } = expensesResult;
    const { data: previousExpenses, error: previousExpensesError } = previousExpensesResult;
    const { data: activeLoads, error: activeLoadsError } = activeLoadsResult;
    const { data: pendingInvoices, error: pendingInvoicesError } = pendingInvoicesResult;
    const { data: upcomingDeliveries, error: deliveryError } = upcomingDeliveriesResult;
    
    // Handle query errors
    if (currentLoadsError) throw currentLoadsError;
    if (standaloneInvoicesError) throw standaloneInvoicesError;
    if (previousLoadsError) throw previousLoadsError;
    if (previousStandaloneInvoicesError) throw previousStandaloneInvoicesError;
    if (expensesError) throw expensesError;
    if (previousExpensesError) throw previousExpensesError;
    if (activeLoadsError) throw activeLoadsError;
    if (pendingInvoicesError) throw pendingInvoicesError;
    if (deliveryError) throw deliveryError;
    
    // Log loads data for debugging
    console.log("Dashboard Service Debug:", {
      dateRange,
      startDate,
      endDate,
      completedLoadsCount: currentLoads?.length || 0,
      completedLoads: currentLoads?.map(l => ({
        load_number: l.load_number,
        rate: l.rate,
        final_rate: l.final_rate,
        factored: l.factored,
        factored_type: typeof l.factored,
        factored_value: `"${l.factored}"`,
        delivery_date: l.delivery_date,
        customer: l.customer
      })),
      standaloneInvoicesCount: standaloneInvoices?.length || 0,
      standaloneInvoices: standaloneInvoices?.map(i => ({ 
        date: i.invoice_date, 
        status: i.status, 
        total: i.total, 
        paid: i.amount_paid 
      }))
    });
    
    // Check factored values
    if (currentLoads?.length > 0) {
      const factoredTypes = new Set(currentLoads.map(l => typeof l.factored));
      const factoredValues = new Set(currentLoads.map(l => String(l.factored)));
      console.log("Factored field analysis:", {
        types: Array.from(factoredTypes),
        uniqueValues: Array.from(factoredValues)
      });
    }
    
    // Calculate current period totals
    // Calculate earnings from completed loads (primary source)
    const currentLoadEarnings = currentLoads
      ? currentLoads.reduce((sum, load) => {
          // Use final_rate if available, otherwise use rate
          const finalRate = load.final_rate !== null && load.final_rate !== undefined ? parseFloat(load.final_rate) : null;
          const baseRate = load.rate !== null && load.rate !== undefined ? parseFloat(load.rate) : 0;
          const amount = finalRate !== null ? finalRate : baseRate;
          
          console.log(`Load ${load.load_number}: base rate=${load.rate}, final rate=${load.final_rate}, using=${amount}`);
          
          return sum + amount;
        }, 0)
      : 0;
      
    // Calculate standalone invoice earnings (only paid amounts from invoices NOT linked to loads)
    const currentStandaloneInvoiceEarnings = standaloneInvoices
      ? standaloneInvoices
          .filter(invoice => {
            const status = invoice.status?.toLowerCase();
            return status === 'paid' || status === 'partially paid';
          })
          .reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0)
      : 0;
    
    // Separate factored loads earnings for display
    const currentFactoredEarningsTotal = currentLoads
      ? currentLoads
          .filter(load => {
            // Handle both boolean and string values
            return load.factored === true || load.factored === 'true' || load.factored === 'TRUE';
          })
          .reduce((sum, load) => {
            const finalRate = load.final_rate !== null && load.final_rate !== undefined ? parseFloat(load.final_rate) : null;
            const baseRate = load.rate !== null && load.rate !== undefined ? parseFloat(load.rate) : 0;
            const amount = finalRate !== null ? finalRate : baseRate;
            return sum + amount;
          }, 0)
      : 0;
      
    // Calculate invoiced loads earnings (non-factored completed loads)
    const currentInvoicedLoadEarnings = currentLoads
      ? currentLoads
          .filter(load => {
            // Handle both boolean and string values
            return load.factored !== true && load.factored !== 'true' && load.factored !== 'TRUE';
          })
          .reduce((sum, load) => {
            const finalRate = load.final_rate !== null && load.final_rate !== undefined ? parseFloat(load.final_rate) : null;
            const baseRate = load.rate !== null && load.rate !== undefined ? parseFloat(load.rate) : 0;
            const amount = finalRate !== null ? finalRate : baseRate;
            return sum + amount;
          }, 0)
      : 0;
    
    console.log("Calculated earnings:", {
      loadEarnings: currentLoadEarnings,
      standaloneInvoiceEarnings: currentStandaloneInvoiceEarnings,
      factoredEarnings: currentFactoredEarningsTotal,
      invoicedLoadEarnings: currentInvoicedLoadEarnings,
      totalEarnings: currentLoadEarnings + currentStandaloneInvoiceEarnings,
      dateRange,
      startDate,
      endDate,
      completedLoadsCount: currentLoads?.length || 0,
      standaloneInvoiceStatuses: standaloneInvoices?.map(i => i.status) || []
    });
    
    // Total earnings = completed loads earnings + standalone invoice earnings
    const currentEarnings = currentLoadEarnings + currentStandaloneInvoiceEarnings;
    
    // Calculate expenses total
    const currentExpensesTotal = currentExpenses
      ? currentExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
      : 0;
    
    // Calculate profit
    const currentProfit = currentEarnings - currentExpensesTotal;
    
    // Calculate previous period totals for comparison
    // Previous period load earnings
    const previousLoadEarnings = previousLoads
      ? previousLoads.reduce((sum, load) => {
          const finalRate = load.final_rate !== null && load.final_rate !== undefined ? parseFloat(load.final_rate) : null;
          const baseRate = load.rate !== null && load.rate !== undefined ? parseFloat(load.rate) : 0;
          const amount = finalRate !== null ? finalRate : baseRate;
          return sum + amount;
        }, 0)
      : 0;
    
    // Previous period standalone invoice earnings
    const previousStandaloneInvoiceEarnings = previousStandaloneInvoices
      ? previousStandaloneInvoices
          .filter(invoice => {
            const status = invoice.status?.toLowerCase();
            return status === 'paid' || status === 'partially paid';
          })
          .reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0)
      : 0;
    
    // Previous period total earnings
    const previousEarnings = previousLoadEarnings + previousStandaloneInvoiceEarnings;
    
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
      loadEarnings: currentLoadEarnings,
      standaloneInvoiceEarnings: currentStandaloneInvoiceEarnings,
      factoredEarnings: currentFactoredEarningsTotal,
      invoicedLoadEarnings: currentInvoicedLoadEarnings,
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
      loadEarnings: currentLoadEarnings,
      standaloneInvoiceEarnings: currentStandaloneInvoiceEarnings,
      factoredEarnings: currentFactoredEarningsTotal,
      invoicedLoadEarnings: currentInvoicedLoadEarnings
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
      loadEarnings: 0,
      standaloneInvoiceEarnings: 0,
      factoredEarnings: 0,
      invoicedLoadEarnings: 0
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
      .select('id, load_number, customer, status, created_at, factored, final_rate, rate')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (loadError) throw loadError;
    
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
      ...(loadActivity || []).map(item => {
        const loadAmount = item.final_rate || item.rate || 0;
        const baseActivity = {
          id: `load-${item.id}`,
          type: 'load',
          title: `Load #${item.load_number} ${formatStatus(item.status)}`,
          client: item.customer,
          date: timeAgo(new Date(item.created_at)),
          status: getStatusType(item.status)
        };
        
        // Add amount and factoring info for completed loads
        if (item.status === 'Completed' && loadAmount > 0) {
          baseActivity.amount = `$${parseFloat(loadAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          if (item.factored) {
            baseActivity.title += ' (Factored)';
          }
        }
        
        return baseActivity;
      })
    ];
    
    // Sort by date, newest first (using the raw data's created_at before it was converted)
    const rawItems = [
      ...(invoiceActivity || []).map(item => ({ ...item, activityType: 'invoice' })),
      ...(expenseActivity || []).map(item => ({ ...item, activityType: 'expense' })),
      ...(loadActivity || []).map(item => ({ ...item, activityType: 'load' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Map the sorted items to the formatted activities
    const sortedActivities = rawItems.slice(0, limit).map(item => {
      if (item.activityType === 'invoice') {
        return combinedActivity.find(activity => activity.id === `inv-${item.id}`);
      } else if (item.activityType === 'expense') {
        return combinedActivity.find(activity => activity.id === `exp-${item.id}`);
      } else if (item.activityType === 'load') {
        return combinedActivity.find(activity => activity.id === `load-${item.id}`);
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