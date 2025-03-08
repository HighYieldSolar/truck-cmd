import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  fetchInvoices, 
  getInvoiceById, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice,
  getInvoiceStats
} from '@/lib/services/invoiceService';

export default function useInvoices(userId) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    count: 0
  });

  // Fetch all invoices
  const loadInvoices = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await fetchInvoices(userId, filters);
      setInvoices(data);
      return data;
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch invoice stats
  const loadStats = useCallback(async () => {
    try {
      const stats = await getInvoiceStats(userId);
      setStats(stats);
      return stats;
    } catch (err) {
      console.error('Error loading invoice stats:', err);
      return {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        count: 0
      };
    }
  }, [userId]);

  // Get a single invoice
  const getInvoice = useCallback(async (id) => {
    try {
      setLoading(true);
      const invoice = await getInvoiceById(id);
      return invoice;
    } catch (err) {
      console.error('Error getting invoice:', err);
      setError('Failed to load invoice');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new invoice
  const addInvoice = useCallback(async (invoiceData) => {
    try {
      setLoading(true);
      // Add user_id to the invoice data
      const invoice = await createInvoice({
        ...invoiceData,
        user_id: userId
      });
      
      // Update local state
      setInvoices(prev => [invoice, ...prev]);
      await loadStats();
      
      return invoice;
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Failed to create invoice');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStats]);

  // Update an existing invoice
  const updateInvoiceData = useCallback(async (id, invoiceData) => {
    try {
      setLoading(true);
      const updatedInvoice = await updateInvoice(id, invoiceData);
      
      // Update local state
      setInvoices(prev => 
        prev.map(invoice => invoice.id === id ? updatedInvoice : invoice)
      );
      
      await loadStats();
      return updatedInvoice;
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError('Failed to update invoice');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Delete an invoice
  const removeInvoice = useCallback(async (id) => {
    try {
      setLoading(true);
      await deleteInvoice(id);
      
      // Update local state
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      await loadStats();
      
      return true;
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Failed to delete invoice');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Initial data loading
  useEffect(() => {
    if (userId) {
      (async () => {
        await loadInvoices();
        await loadStats();
      })();
    }
  }, [userId, loadInvoices, loadStats]);

  return {
    invoices,
    stats,
    loading,
    error,
    loadInvoices,
    loadStats,
    getInvoice,
    addInvoice,
    updateInvoice: updateInvoiceData,
    deleteInvoice: removeInvoice,
    setError
  };
}