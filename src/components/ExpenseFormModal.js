"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; // Add this import
import { createExpense, updateExpense, uploadReceiptImage } from "@/lib/services/expenseService";

export default function ExpenseFormModal({ isOpen, onClose, expense, onSave }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    category: 'Fuel',
    payment_method: 'Credit Card',
    notes: '',
    receipt_image: null,
    receipt_file: null, // To store the actual file
    vehicle_id: '',
    deductible: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (expense) {
      setFormData({
        ...expense,
        // Format date to YYYY-MM-DD for the date input
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        amount: expense.amount.toString(),
        receipt_file: null // Reset file input when editing
      });
    } else {
      // Reset form for new expense
      setFormData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0], // Today's date
        category: 'Fuel',
        payment_method: 'Credit Card',
        notes: '',
        receipt_image: null,
        receipt_file: null,
        vehicle_id: '',
        deductible: true
      });
    }
    
    // Clear any previous errors
    setError(null);
  }, [expense, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files?.length > 0) {
      setFormData({
        ...formData,
        receipt_file: files[0], // Store the file object
        receipt_image: URL.createObjectURL(files[0]) // Create preview URL
      });
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      let receiptImageUrl = formData.receipt_image;
      
      // If there's a new receipt file, upload it to Supabase storage
      if (formData.receipt_file) {
        // Get the current user ID from Supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated");
        }
        
        receiptImageUrl = await uploadReceiptImage(session.user.id, formData.receipt_file);
      }
      
      // Prepare expense data for Supabase
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        payment_method: formData.payment_method,
        notes: formData.notes,
        receipt_image: receiptImageUrl,
        vehicle_id: formData.vehicle_id,
        deductible: formData.deductible
      };
      
      // Add user_id for new expenses
      if (!expense) {
        const { data: { session } } = await supabase.auth.getSession();
        expenseData.user_id = session.user.id;
      }
      
      let result;
      
      if (expense) {
        // Update existing expense
        result = await updateExpense(expense.id, expenseData);
      } else {
        // Create new expense
        result = await createExpense(expenseData);
      }
      
      // Call the parent component's onSave callback with the result
      onSave(result);
      onClose();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {expense ? "Edit Expense" : "Add New Expense"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Show error message if exists */}
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount ($) *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
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
            
            <div className="space-y-2">
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="EFT">EFT</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700">
                Vehicle ID
              </label>
              <input
                type="text"
                id="vehicle_id"
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="receipt_image" className="block text-sm font-medium text-gray-700">
                Upload Receipt (optional)
              </label>
              <input
                type="file"
                id="receipt_image"
                name="receipt_image"
                accept="image/*"
                onChange={handleChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {/* Show receipt preview if available */}
              {formData.receipt_image && (
                <div className="mt-2">
                  {typeof formData.receipt_image === 'string' && formData.receipt_image.startsWith('blob') ? (
                    <image 
                      src={formData.receipt_image} 
                      alt="Receipt Preview" 
                      className="h-32 object-contain border rounded-md" 
                    />
                  ) : formData.receipt_image ? (
                    <div className="flex items-center">
                      <image 
                        src="/images/receipt-icon.png" 
                        alt="Receipt" 
                        className="h-6 mr-2" 
                      />
                      <span className="text-sm text-gray-600">Receipt uploaded</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  id="deductible"
                  name="deductible"
                  type="checkbox"
                  checked={formData.deductible}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="deductible" className="ml-2 block text-sm text-gray-700">
                  Tax Deductible
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                expense ? "Update Expense" : "Save Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}