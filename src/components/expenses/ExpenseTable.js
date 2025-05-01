// src/components/expenses/ExpenseTable.js
"use client";

import { 
  FileText, 
  Image,
  RefreshCw,
  Plus,
  Wallet
} from "lucide-react";
import ExpenseItem from "./ExpenseItem";

export default function ExpenseTable({ 
  expenses, 
  loading, 
  onViewReceipt,
  onEdit,
  onDelete,
  onAddNew
}) {
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Wallet size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No expenses found</h3>
        <p className="text-gray-500 mb-6">Get started by adding your first expense</p>
        <button
          onClick={onAddNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          <Plus size={16} className="mr-2" />
          Add Expense
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Method
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map(expense => (
            <ExpenseItem 
              key={expense.id}
              expense={expense}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewReceipt={onViewReceipt}
            />
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 px-6 py-3 border-t border-gray-200 text-right">
        <p className="text-sm text-gray-500">
          Total: {formatCurrency(expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}
        </p>
      </div>
    </div>
  );
}