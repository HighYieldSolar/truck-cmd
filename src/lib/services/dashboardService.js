// src/lib/services/dashboardService.js
import { supabase } from "../supabaseClient";

export async function fetchDashboardStats(userId) {
  try {
    // Fetch earnings
    const { data: earnings, error: earningsError } = await supabase
      .from('invoices')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'paid');
      
    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId);
      
    // Fetch active loads
    const { data: loads, error: loadsError } = await supabase
      .from('loads')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_transit', 'assigned']);
    
    // Calculate totals
    const totalEarnings = earnings ? earnings.reduce((sum, item) => sum + item.amount, 0) : 0;
    const totalExpenses = expenses ? expenses.reduce((sum, item) => sum + item.amount, 0) : 0;
    const activeLoadsCount = loads ? loads.length : 0;
    
    return {
      earnings: totalEarnings,
      expenses: totalExpenses,
      activeLoads: activeLoadsCount
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}