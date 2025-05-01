// src/components/expenses/TopExpenses.js
"use client";

import { 
  Fuel, 
  Wrench, 
  Shield, 
  MapPin, 
  Briefcase, 
  FileCheck,
  Coffee,
  Tag,
  Image,
  Edit
} from "lucide-react";

export default function TopExpenses({ 
  expenses, 
  onViewReceipt, 
  onEditExpense 
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Fuel':
        return <Fuel size={16} className="text-yellow-600" />;
      case 'Maintenance':
        return <Wrench size={16} className="text-blue-600" />;
      case 'Insurance':
        return <Shield size={16} className="text-green-600" />;
      case 'Tolls':
        return <MapPin size={16} className="text-purple-600" />;
      case 'Office':
        return <Briefcase size={16} className="text-gray-600" />;
      case 'Permits':
        return <FileCheck size={16} className="text-indigo-600" />;
      case 'Meals':
        return <Coffee size={16} className="text-red-600" />;
      default:
        return <Tag size={16} className="text-gray-600" />;
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Tag size={36} className="mx-auto mb-2 text-gray-400" />
        <p>No expenses found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map(expense => (
        <div 
          key={expense.id}
          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                {getCategoryIcon(expense.category)}
                <span className="ml-2 text-sm font-medium text-gray-900 truncate max-w-[150px]">
                  {expense.description}
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <span>{formatDate(expense.date)}</span>
                <span className="mx-1">•</span>
                <span>{expense.payment_method}</span>
              </p>
            </div>
            <span className="text-sm font-medium text-red-600">
              {formatCurrency(expense.amount)}
            </span>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-end space-x-2">
            {expense.receipt_image && (
              <button
                onClick={() => onViewReceipt(expense)}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="View Receipt"
              >
                <Image size={14} alt="View Receipt" />
              </button>
            )}
            <button
              onClick={() => onEditExpense(expense)}
              className="text-green-600 hover:text-green-800 p-1"
              title="Edit Expense"
            >
              <Edit size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}