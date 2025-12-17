// src/components/invoices/PaymentModal.js
"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  CheckCircle,
  RefreshCw,
  XCircle
} from "lucide-react";

/**
 * PaymentModal - Modal for recording payments on invoices
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSubmit - Callback when payment is submitted
 * @param {Object} invoice - Invoice object with balance information
 * @param {boolean} isSubmitting - Whether a submission is in progress
 */
export default function PaymentModal({ isOpen, onClose, onSubmit, invoice, isSubmitting }) {
  const [payment, setPayment] = useState({
    amount: invoice?.balance || 0,
    method: 'credit_card',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && invoice) {
      // Calculate balance if not provided
      const balance = invoice.balance ?? (parseFloat(invoice.total || 0) - parseFloat(invoice.amount_paid || 0));
      setPayment(prevPayment => ({
        ...prevPayment,
        amount: balance > 0 ? balance : 0
      }));
    }
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayment({ ...payment, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(payment);
  };

  // Calculate balance for display
  const balance = invoice?.balance ?? (parseFloat(invoice?.total || 0) - parseFloat(invoice?.amount_paid || 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="bg-green-500 dark:bg-green-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <DollarSign size={20} className="mr-2" />
            Record Payment
          </h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        {/* Invoice Info Summary */}
        {invoice && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Invoice #{invoice.invoice_number}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {invoice.customer}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0"
                max={balance}
                value={payment.amount}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Invoice balance: ${balance.toFixed(2)}
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Method
            </label>
            <select
              id="method"
              name="method"
              value={payment.method}
              onChange={handleChange}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={payment.date}
              onChange={handleChange}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={payment.reference}
              onChange={handleChange}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Optional"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={payment.notes}
              onChange={handleChange}
              rows="2"
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Optional payment notes"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
