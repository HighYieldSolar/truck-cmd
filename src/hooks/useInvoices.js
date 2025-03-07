// src/hooks/useInvoices.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchInvoices, getInvoiceStats, updateInvoiceStatus, deleteInvoice } from '@/lib/services/invoiceService';

/**
 * Custom hook for managing invoices
 * @param {Object} options - Hook options
 * @param {string} options.userId - User ID
 * @param {Object} options.filters - Initial filters
 * @returns {Object} - Invoices state and operations
 */
export function useInvoices({ userId, filters: initialFilters = {} }) {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    count: 0
  });
  const [filters, setFilters] = useState(initialFilters);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh data
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Load invoices and stats
  useEffect(() => {
    async function loadInvoices() {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch invoices and stats in parallel
        const [invoicesData, invoiceStats] = await Promise.all([
          fetchInvoices(userId, filters),
          getInvoiceStats(userId)
        ]);

        setInvoices(invoicesData || []);
        setFilteredInvoices(invoicesData || []);
        setStats(invoiceStats);
      } catch (err) {
        console.error('Error loading invoices:', err);
        setError('Failed to load invoices. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, [userId, filters, refreshTrigger]);

  // Apply search filter
  useEffect(() => {
    if (filters.search && invoices.length > 0) {
      const searchLower = filters.search.toLowerCase();
      const filtered = invoices.filter(invoice => 
        invoice.invoice_number?.toLowerCase().includes(searchLower) ||
        invoice.customer?.toLowerCase().includes(searchLower)
      );
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(invoices);
    }
  }, [invoices, filters.search]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Mark invoice as paid
  const markAsPaid = useCallback(async (invoiceId) => {
    try {
      await updateInvoiceStatus(invoiceId, 'Paid');
      
      // Update local state
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, status: 'Paid' } 
            : invoice
        )
      );
      
      // Refresh statistics
      const updatedStats = await getInvoiceStats(userId);
      setStats(updatedStats);
      
      return true;
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      throw err;
    }
  }, [userId]);

  // Delete invoice
  const removeInvoice = useCallback(async (invoiceId) => {
    try {
      await deleteInvoice(invoiceId);
      
      // Update local state
      setInvoices(prevInvoices => 
        prevInvoices.filter(invoice => invoice.id !== invoiceId)
      );
      
      // Refresh statistics
      const updatedStats = await getInvoiceStats(userId);
      setStats(updatedStats);
      
      return true;
    } catch (err) {
      console.error('Error deleting invoice:', err);
      throw err;
    }
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

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
        () => {
          // Refresh data when changes occur
          refreshData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshData]);

  return {
    invoices,
    filteredInvoices,
    loading,
    error,
    stats,
    filters,
    updateFilters,
    refreshData,
    markAsPaid,
    removeInvoice
  };
}

/**
 * Custom hook for a single invoice
 * @param {string} invoiceId - Invoice ID to fetch
 * @returns {Object} - Invoice state and operations
 */
export function useInvoice(invoiceId) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh data
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Fetch invoice data
  useEffect(() => {
    async function loadInvoice() {
      if (!invoiceId) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            items:invoice_items(*),
            loads:load_id(id, load_number, origin, destination)
          `)
          .eq('id', invoiceId)
          .single();

        if (error) throw error;
        
        setInvoice(data);
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError('Failed to load invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [invoiceId, refreshTrigger]);

  // Update invoice
  const updateInvoiceStatus = useCallback(async (status) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId)
        .select();

      if (error) throw error;
      
      setInvoice(data[0]);
      return data[0];
    } catch (err) {
      console.error('Error updating invoice status:', err);
      throw err;
    }
  }, [invoiceId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!invoiceId) return;

    const channel = supabase
      .channel(`invoice-${invoiceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `id=eq.${invoiceId}`
        },
        () => {
          // Refresh data when changes occur
          refreshData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [invoiceId, refreshData]);

  return {
    invoice,
    loading,
    error,
    refreshData,
    updateInvoiceStatus
  };
}

/**
 * Custom hook for recent invoices on the dashboard
 * @param {string} userId - User ID
 * @param {number} limit - Number of invoices to fetch
 * @returns {Object} - Recent invoices state
 */
export function useRecentInvoices(userId, limit = 5) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRecentInvoices() {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('invoices')
          .select('id, invoice_number, customer, total, invoice_date, due_date, status')
          .eq('user_id', userId)
          .order('invoice_date', { ascending: false })
          .limit(limit);

        if (error) throw error;
        
        setInvoices(data || []);
      } catch (err) {
        console.error('Error loading recent invoices:', err);
        setError('Failed to load recent invoices.');
      } finally {
        setLoading(false);
      }
    }

    loadRecentInvoices();
  }, [userId, limit]);

  return {
    invoices,
    loading,
    error
  };
}