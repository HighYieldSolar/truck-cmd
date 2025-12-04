'use client';

import { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle,
  FileText,
  AlertCircle,
  Info,
  Wallet,
  Upload,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { createExpense, updateExpense, uploadReceiptImage } from '@/lib/services/expenseService';
import { getUserFriendlyError } from '@/lib/utils/errorMessages';
import { getCurrentDateLocal, formatDateLocal, prepareDateForDB } from '@/lib/utils/dateUtils';

// LocalStorage helpers
const getFormDataFromLocalStorage = (formKey) => {
  try {
    if (typeof window === 'undefined') return null;
    const formDataString = localStorage.getItem(formKey);
    return formDataString ? JSON.parse(formDataString) : null;
  } catch (error) {
    console.error('Error retrieving from localStorage:', error);
    return null;
  }
};

const setFormDataToLocalStorage = (formKey, data) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(formKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const clearFormDataFromLocalStorage = (formKey) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(formKey);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Expense Form Modal
 *
 * Modal for creating and editing expenses with dark mode support.
 * Follows the design spec modal pattern.
 */
export default function ExpenseFormModal({ isOpen, onClose, expense, onSave }) {
  // Initial form state
  const initialFormData = {
    description: '',
    amount: '',
    date: getCurrentDateLocal(),
    category: 'Fuel',
    payment_method: 'Credit Card',
    notes: '',
    receipt_image: null,
    receipt_file: null,
    vehicle_id: '',
    deductible: true
  };

  // Form key for localStorage
  const formKey = expense ? `expenseForm-${expense.id}` : 'expenseForm-new';

  // State
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [hasRestoredData, setHasRestoredData] = useState(false);

  // Load initial data
  useEffect(() => {
    if (!isOpen) return;

    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount?.toString() || '',
        date: formatDateLocal(expense.date) || getCurrentDateLocal(),
        category: expense.category || 'Fuel',
        payment_method: expense.payment_method || 'Credit Card',
        notes: expense.notes || '',
        receipt_image: expense.receipt_image || null,
        receipt_file: null,
        vehicle_id: expense.vehicle_id || '',
        deductible: expense.deductible !== false
      });
      clearFormDataFromLocalStorage('expenseForm-new');
      setInitialDataLoaded(true);
    } else if (!initialDataLoaded) {
      const storedData = getFormDataFromLocalStorage(formKey);
      if (storedData && (storedData.description || storedData.amount)) {
        setFormData(storedData);
        setHasRestoredData(true);
      }
      setInitialDataLoaded(true);
    }
  }, [expense, isOpen, initialDataLoaded, formKey]);

  // Save form data to localStorage
  useEffect(() => {
    if (initialDataLoaded && isOpen) {
      const dataToStore = { ...formData };
      if (dataToStore.receipt_file) {
        delete dataToStore.receipt_file;
      }
      setFormDataToLocalStorage(formKey, dataToStore);
    }
  }, [formData, initialDataLoaded, isOpen, formKey]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInitialDataLoaded(false);
      setHasRestoredData(false);
      setError(null);
    }
  }, [isOpen]);

  // Load vehicles
  useEffect(() => {
    async function loadVehicles() {
      if (!isOpen) return;

      try {
        setVehiclesLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const userId = session.user.id;

        // Try vehicles table first
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, name, license_plate')
          .eq('user_id', userId);

        setVehicles(data || []);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setVehiclesLoading(false);
      }
    }

    loadVehicles();
  }, [isOpen]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file' && files && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        receipt_file: file,
        receipt_image: previewUrl
      });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let receiptImageUrl = formData.receipt_image;

      // Upload receipt if new file
      if (formData.receipt_file) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');
        receiptImageUrl = await uploadReceiptImage(session.user.id, formData.receipt_file);
      }

      // Prepare expense data
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: prepareDateForDB(formData.date),
        category: formData.category,
        payment_method: formData.payment_method,
        notes: formData.notes,
        receipt_image: receiptImageUrl,
        vehicle_id: formData.vehicle_id || null,
        deductible: formData.deductible
      };

      // Add user_id for new expenses
      if (!expense) {
        const { data: { session } } = await supabase.auth.getSession();
        expenseData.user_id = session.user.id;
      }

      let result;
      if (expense) {
        result = await updateExpense(expense.id, expenseData);
      } else {
        result = await createExpense(expenseData);
      }

      clearFormDataFromLocalStorage(formKey);
      onSave(result);
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove receipt
  const handleRemoveReceipt = () => {
    setFormData({ ...formData, receipt_file: null, receipt_image: null });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-t-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {expense ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Restored Data Notice */}
            {hasRestoredData && !expense && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your previous form data has been restored.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Fuel for Truck #123"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="Fuel">Fuel</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Tolls">Tolls</option>
                      <option value="Office">Office</option>
                      <option value="Permits">Permits</option>
                      <option value="Meals">Meals</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Method
                    </label>
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="EFT">EFT</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle & Receipt Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Vehicle & Receipt
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vehicle
                    </label>
                    <select
                      name="vehicle_id"
                      value={formData.vehicle_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select Vehicle (optional)</option>
                      {vehiclesLoading ? (
                        <option disabled>Loading...</option>
                      ) : (
                        vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.name} {vehicle.license_plate ? `(${vehicle.license_plate})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Receipt Image
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name="receipt_image"
                        accept="image/*"
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Receipt Preview */}
                {formData.receipt_image && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Receipt Preview
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveReceipt}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                    <div className="relative aspect-video max-h-48 overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <img
                        src={formData.receipt_image}
                        alt="Receipt preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Tax Deductible Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="deductible"
                    checked={formData.deductible}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Tax Deductible
                  </span>
                </label>
              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Additional Notes
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional information..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {expense ? 'Update Expense' : 'Save Expense'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
