// src/hooks/useInvoices.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  fetchInvoices, 
  getInvoiceStats,
  getRecentInvoices,
  subscribeToInvoices,
  deleteInvoice,
  updateInvoiceStatus
} from '@/lib/services/invoiceService';

/**
 * Custom hook for managing invoices with real-time updates
 * @param {string} userId - The authenticated user's ID
 * @param {Object} initialFilters - Initial filter settings
 * @returns {Object} - Invoice state and functions
 */
export function useInvoices(userId, initialFilters = {}) {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateRange: 'all',
    sortBy: 'invoice_date',
    sortDirection: 'desc',
    ...initialFilters
  });

  // Fetch invoices based on current filters
  const loadInvoices = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchInvoices(userId, filters);
      setInvoices(data);
      
      // Also update stats whenever invoices are loaded
      const statsData = await getInvoiceStats(userId);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, filters]);

  // Load invoices when component mounts or filters change
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = subscribeToInvoices(userId, (payload) => {
      // Handle different events
      if (payload.eventType === 'INSERT') {
        setInvoices(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setInvoices(prev => 
          prev.map(invoice => 
            invoice.id === payload.new.id ? payload.new : invoice
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setInvoices(prev => 
          prev.filter(invoice => invoice.id !== payload.old.id)
        );
      }
      
      // Refresh stats after any change
      getInvoiceStats(userId).then(statsData => setStats(statsData));
    });
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Handle invoice deletion with optimistic UI update
  const handleDeleteInvoice = async (id) => {
    try {
      // Optimistic UI update
      const invoiceToDelete = invoices.find(inv => inv.id === id);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      
      // Delete from database
      await deleteInvoice(id);
      
      // Update stats after deletion
      const statsData = await getInvoiceStats(userId);
      setStats(statsData);
      
      return true;
    } catch (err) {
      // Revert optimistic update on error
      loadInvoices();
      throw err;
    }
  };

  // Handle invoice status change with optimistic UI update
  const handleStatusChange = async (id, newStatus) => {
    try {
      // Optimistic UI update
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === id ? { ...invoice, status: newStatus } : invoice
        )
      );
      
      // Update in database
      await updateInvoiceStatus(id, newStatus);
      
      // Update stats after status change
      const statsData = await getInvoiceStats(userId);
      setStats(statsData);
      
      return true;
    } catch (err) {
      // Revert optimistic update on error
      loadInvoices();
      throw err;
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Reset filters to default
  const resetFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      dateRange: 'all',
      sortBy: 'invoice_date',
      sortDirection: 'desc'
    });
  };

  return {
    invoices,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refreshInvoices: loadInvoices,
    deleteInvoice: handleDeleteInvoice,
    updateStatus: handleStatusChange
  };
}

/**
 * Custom hook for fetching a single invoice by ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Object} - Invoice state and functions
 */
export function useInvoice(invoiceId) {
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      setInvoice(invoiceData);
      
      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('id');
        
      if (itemsError) throw itemsError;
      
      setItems(itemsData || []);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Set up real-time subscription for this specific invoice
  useEffect(() => {
    if (!invoiceId) return;
    
    const invoiceChannel = supabase
      .channel(`invoice-${invoiceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `id=eq.${invoiceId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setInvoice(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setInvoice(null);
            setError('This invoice has been deleted');
          }
        }
      )
      .subscribe();
      
    const itemsChannel = supabase
      .channel(`invoice-items-${invoiceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoice_items',
          filter: `invoice_id=eq.${invoiceId}`
        },
        (payload) => {
          fetchInvoice(); // Reload all items when any change happens
        }
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(invoiceChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [invoiceId, fetchInvoice]);

  return {
    invoice,
    items,
    loading,
    error,
    refreshInvoice: fetchInvoice
  };
}

/**
 * Custom hook for recent invoices on dashboard
 * @param {string} userId - User ID
 * @param {number} limit - Number of invoices to fetch
 * @returns {Object} - Recent invoices state
 */
export function useRecentInvoices(userId, limit = 5) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentInvoices = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getRecentInvoices(userId, limit);
      setInvoices(data);
    } catch (err) {
      console.error('Error fetching recent invoices:', err);
      setError('Failed to load recent invoices');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchRecentInvoices();
  }, [fetchRecentInvoices]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = subscribeToInvoices(userId, () => {
      // Refresh the list whenever any invoice changes
      fetchRecentInvoices();
    });
    
    return () => unsubscribe();
  }, [userId, fetchRecentInvoices]);

  return {
    invoices,
    loading,
    error,
    refresh: fetchRecentInvoices
  };
}