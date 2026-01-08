'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabaseClient';
import {
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Wand2,
  Save,
  ChevronDown
} from 'lucide-react';

// Truck Command expense categories
const TC_CATEGORIES = [
  { id: 'Fuel', name: 'Fuel', description: 'Diesel, gas, DEF' },
  { id: 'Maintenance', name: 'Maintenance', description: 'Repairs, oil changes, tires' },
  { id: 'Insurance', name: 'Insurance', description: 'Truck, cargo, liability' },
  { id: 'Tolls', name: 'Tolls', description: 'Highway tolls, bridge fees' },
  { id: 'Office', name: 'Office', description: 'Supplies, software, admin' },
  { id: 'Permits', name: 'Permits', description: 'DOT, IFTA, oversize' },
  { id: 'Meals', name: 'Meals', description: 'Per diem, food on road' },
  { id: 'Other', name: 'Other', description: 'Miscellaneous expenses' }
];

/**
 * QuickBooksCategoryMappingModal - Modal for mapping TC categories to QB accounts
 */
export default function QuickBooksCategoryMappingModal({ isOpen, onClose, onSave }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoMapping, setAutoMapping] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data state
  const [qbAccounts, setQbAccounts] = useState([]);
  const [mappings, setMappings] = useState({});
  const [localMappings, setLocalMappings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Get auth token
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  // Fetch QB accounts and current mappings
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();

      // Fetch accounts
      const accountsResponse = await fetch('/api/quickbooks/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const accountsData = await accountsResponse.json();

      if (accountsData.error) {
        setError(accountsData.error);
        return;
      }

      setQbAccounts(accountsData.accounts || []);

      // Fetch mappings
      const mappingsResponse = await fetch('/api/quickbooks/mappings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mappingsData = await mappingsResponse.json();

      if (mappingsData.error) {
        setError(mappingsData.error);
        return;
      }

      setMappings(mappingsData.mappings || {});
      setLocalMappings(mappingsData.mappings || {});
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchData();
      setHasChanges(false);
    }
  }, [isOpen, fetchData]);

  // Handle mapping change
  const handleMappingChange = (tcCategory, qbAccountId) => {
    const selectedAccount = qbAccounts.find(acc => acc.id === qbAccountId);

    setLocalMappings(prev => {
      const updated = { ...prev };
      if (qbAccountId) {
        updated[tcCategory] = {
          qbAccountId,
          qbAccountName: selectedAccount?.name || '',
          qbAccountType: selectedAccount?.type || 'Expense'
        };
      } else {
        delete updated[tcCategory];
      }
      return updated;
    });

    setHasChanges(true);
  };

  // Auto-map categories
  const handleAutoMap = async () => {
    try {
      setAutoMapping(true);
      setError(null);

      const token = await getAuthToken();
      const response = await fetch('/api/quickbooks/mappings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'auto-map' })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess(`Auto-mapped ${data.mapped?.length || 0} categories`);
      await fetchData();
      setHasChanges(false);
    } catch (err) {
      setError('Auto-mapping failed');
    } finally {
      setAutoMapping(false);
    }
  };

  // Save all mappings
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = await getAuthToken();

      // Save each changed mapping
      for (const [tcCategory, mapping] of Object.entries(localMappings)) {
        // Check if this is a new or changed mapping
        const existingMapping = mappings[tcCategory];
        if (!existingMapping || existingMapping.qbAccountId !== mapping.qbAccountId) {
          const response = await fetch('/api/quickbooks/mappings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'set',
              tcCategory,
              qbAccountId: mapping.qbAccountId,
              qbAccountName: mapping.qbAccountName,
              qbAccountType: mapping.qbAccountType
            })
          });

          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
        }
      }

      setSuccess('Mappings saved successfully');
      setHasChanges(false);
      setMappings(localMappings);

      if (onSave) {
        setTimeout(() => onSave(), 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to save mappings');
    } finally {
      setSaving(false);
    }
  };

  // Count mapped/unmapped
  const mappedCount = Object.keys(localMappings).length;
  const unmappedCount = TC_CATEGORIES.length - mappedCount;

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
              <Dialog.Panel className="relative transform rounded-xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Category Mappings
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Map your expense categories to QuickBooks accounts
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
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                  {/* Messages */}
                  {error && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      {success}
                    </div>
                  )}

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Status summary */}
                      <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-sm">
                          <span className="text-green-600 dark:text-green-400 font-medium">{mappedCount} mapped</span>
                          {unmappedCount > 0 && (
                            <span className="text-gray-500 dark:text-gray-400"> / {unmappedCount} unmapped</span>
                          )}
                        </div>
                        <button
                          onClick={handleAutoMap}
                          disabled={autoMapping}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {autoMapping ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                          Auto-Map
                        </button>
                      </div>

                      {/* Mapping table */}
                      <div className="space-y-3">
                        {TC_CATEGORIES.map((category) => {
                          const mapping = localMappings[category.id];

                          return (
                            <div
                              key={category.id}
                              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {category.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {category.description}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">→</span>

                                <div className="relative">
                                  <select
                                    value={mapping?.qbAccountId || ''}
                                    onChange={(e) => handleMappingChange(category.id, e.target.value)}
                                    className="appearance-none w-64 px-3 py-2 pr-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select QB Account...</option>
                                    {qbAccounts.map((account) => (
                                      <option key={account.id} value={account.id}>
                                        {account.name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>

                                {mapping && (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Mappings
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
