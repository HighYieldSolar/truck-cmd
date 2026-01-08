'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabaseClient';
import {
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
  Filter,
  FileText,
  Receipt,
  ChevronDown
} from 'lucide-react';

// Available categories
const CATEGORIES = ['All', 'Fuel', 'Maintenance', 'Insurance', 'Tolls', 'Office', 'Permits', 'Meals', 'Other'];

/**
 * QuickBooksBulkSyncModal - Modal for bulk syncing expenses and invoices
 */
export default function QuickBooksBulkSyncModal({ isOpen, onClose, onSyncComplete }) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [syncResults, setSyncResults] = useState(null);

  // Filter state
  const [entityType, setEntityType] = useState('expenses');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('All');

  // Preview state
  const [previewCount, setPreviewCount] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Get auth token
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSyncResults(null);
      setError(null);
      setPreviewCount(null);

      // Set default date range (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      setDateTo(today.toISOString().split('T')[0]);
      setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Fetch preview count when filters change
  const fetchPreview = useCallback(async () => {
    if (!isOpen) return;

    try {
      setPreviewLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Build query based on entity type
      let query;
      if (entityType === 'expenses') {
        query = supabase
          .from('expenses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (dateFrom) query = query.gte('date', dateFrom);
        if (dateTo) query = query.lte('date', dateTo);
        if (category && category !== 'All') query = query.eq('category', category);
      } else {
        query = supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (dateFrom) query = query.gte('invoice_date', dateFrom);
        if (dateTo) query = query.lte('invoice_date', dateTo);
      }

      const { count } = await query;
      setPreviewCount(count || 0);
    } catch (err) {
      console.error('Error fetching preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [isOpen, entityType, dateFrom, dateTo, category]);

  useEffect(() => {
    const timeout = setTimeout(fetchPreview, 300);
    return () => clearTimeout(timeout);
  }, [fetchPreview]);

  // Handle bulk sync
  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSyncResults(null);

      const token = await getAuthToken();
      const action = entityType === 'expenses' ? 'bulk-expenses' : 'bulk-invoices';

      const body = {
        action,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      if (entityType === 'expenses' && category !== 'All') {
        body.category = category;
      }

      const response = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSyncResults({
        synced: data.synced || 0,
        failed: data.failed || 0,
        message: data.message
      });

    } catch (err) {
      setError('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // Handle close after successful sync
  const handleClose = () => {
    if (syncResults && syncResults.synced > 0 && onSyncComplete) {
      onSyncComplete();
    } else {
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Bulk Sync to QuickBooks
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sync multiple records at once
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Sync Results */}
                  {syncResults && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                        <CheckCircle className="h-5 w-5" />
                        Sync Complete
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {syncResults.synced}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">Synced</p>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {syncResults.failed}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">Failed</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filters (hide after sync) */}
                  {!syncResults && (
                    <>
                      {/* Entity Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          What to Sync
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setEntityType('expenses')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                              entityType === 'expenses'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <Receipt className="h-5 w-5" />
                            <span className="font-medium">Expenses</span>
                          </button>
                          <button
                            onClick={() => setEntityType('invoices')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                              entityType === 'invoices'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <FileText className="h-5 w-5" />
                            <span className="font-medium">Invoices</span>
                          </button>
                        </div>
                      </div>

                      {/* Date Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Category Filter (expenses only) */}
                      {entityType === 'expenses' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Filter className="h-4 w-4 inline mr-1" />
                            Category
                          </label>
                          <div className="relative">
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="appearance-none w-full px-3 py-2 pr-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      )}

                      {/* Preview Count */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                        {previewLoading ? (
                          <RefreshCw className="h-5 w-5 text-gray-400 animate-spin mx-auto" />
                        ) : (
                          <>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                              {previewCount ?? '—'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {entityType === 'expenses' ? 'expenses' : 'invoices'} to sync
                            </p>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {syncResults ? 'Done' : 'Cancel'}
                  </button>

                  {!syncResults && (
                    <button
                      onClick={handleSync}
                      disabled={syncing || !previewCount}
                      className="inline-flex items-center px-4 py-2 bg-[#2CA01C] text-white rounded-lg hover:bg-[#239016] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {syncing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Sync {previewCount || 0} {entityType === 'expenses' ? 'Expenses' : 'Invoices'}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
