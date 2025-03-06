// src/lib/services/dashboardService.js
import { supabase } from "../supabaseClient";

export async function fetchDashboardStats(userId) {
  try {
    // Fetch earnings from paid invoices
    const { data: earnings, error: earningsError } = await supabase
      .from('invoices')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'paid');
      
    if (earningsError) throw earningsError;
      
    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId);
      
    if (expensesError) throw expensesError;
      
    // Fetch active loads
    const { data: activeLoads, error: loadsError } = await supabase
      .from('loads')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['pending', 'assigned', 'in transit']);
    
    if (loadsError) throw loadsError;
    
    // Fetch pending invoices
    const { data: pendingInvoices, error: pendingInvoicesError } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending');
      
    if (pendingInvoicesError) throw pendingInvoicesError;
    
    // Fetch upcoming deliveries
    const { data: upcomingDeliveries, error: deliveryError } = await supabase
      .from('loads')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['assigned', 'in transit'])
      .gte('delivery_date', new Date().toISOString().split('T')[0]);
      
    if (deliveryError) throw deliveryError;
    
    // Calculate totals
    const totalEarnings = earnings ? earnings.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : 0;
    const totalExpenses = expenses ? expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : 0;
    const profit = totalEarnings - totalExpenses;
    
    return {
      earnings: totalEarnings,
      expenses: totalExpenses,
      profit: profit,
      activeLoads: activeLoads?.length || 0,
      pendingInvoices: pendingInvoices?.length || 0,
      upcomingDeliveries: upcomingDeliveries?.length || 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

export async function fetchRecentActivity(userId, limit = 5) {
  try {
    // Get recent invoice activities
    const { data: invoiceActivity, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, created_at, status')
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
    
    // Combine all activities and sort by created_at
    const combinedActivity = [
      ...invoiceActivity.map(item => ({
        id: `inv-${item.id}`,
        type: 'invoice',
        title: `Invoice #${item.invoice_number} ${item.status}`,
        amount: `$${parseFloat(item.amount).toLocaleString()}`,
        date: timeAgo(new Date(item.created_at)),
        status: getStatusType(item.status)
      })),
      ...expenseActivity.map(item => ({
        id: `exp-${item.id}`,
        type: 'expense',
        title: `${item.category} expense recorded`,
        amount: `$${parseFloat(item.amount).toLocaleString()}`,
        date: timeAgo(new Date(item.created_at)),
        status: 'neutral'
      })),
      ...loadActivity.map(item => ({
        id: `load-${item.id}`,
        type: 'load',
        title: `Load #${item.load_number} ${item.status}`,
        client: item.customer,
        date: timeAgo(new Date(item.created_at)),
        status: getStatusType(item.status)
      }))
    ];
    
    // Sort by date, newest first
    return combinedActivity.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, limit);
    
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
}

export async function fetchUpcomingDeliveries(userId, limit = 3) {
  try {
    const { data, error } = await supabase
      .from('loads')
      .select('id, load_number, customer, destination, delivery_date, status')
      .eq('user_id', userId)
      .in('status', ['assigned', 'in transit'])
      .gte('delivery_date', new Date().toISOString().split('T')[0])
      .order('delivery_date', { ascending: true })
      .limit(limit);
      
    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      client: item.customer,
      destination: item.destination,
      date: formatDate(item.delivery_date),
      status: item.status
    }));
    
  } catch (error) {
    console.error('Error fetching upcoming deliveries:', error);
    throw error;
  }
}

export async function fetchRecentInvoices(userId, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, created_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      number: item.invoice_number,
      amount: parseFloat(item.amount) || 0,
      date: formatDate(item.created_at),
      status: item.status
    }));
    
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    throw error;
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
      year: 'numeric'
    });
  }
}

function getStatusType(status) {
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