"use client";

import { useState } from "react";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Image,
  ExternalLink, 
  CheckCircle, 
  X,
  Fuel,
  Wrench,
  Shield,
  Tag
} from "lucide-react";
import ReceiptViewer from "./ReceiptViewer";

export default function ExpenseItem({ expense, onEdit, onDelete }) {
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Get category icon
  const getCategoryIcon = () => {
    switch (expense.category) {
      case 'Fuel':
        return <Fuel size={18} className="text-yellow-600" />;
      case 'Maintenance':
        return <Wrench size={18} className="text-blue-600" />;
      case 'Insurance':
        return <Shield size={18} className="text-green-600" />;
      default:
        return <Tag size={18} className="text-gray-600" />;
    }
  };
  
  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatDate(expense.date)}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          <div className="flex items-center">
            <span className="mr-2">{getCategoryIcon()}</span>
            <span className="truncate max-w-xs">{expense.description}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {expense.category}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
          {formatCurrency(expense.amount)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {expense.payment_method}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
          {expense.receipt_image && (
            <button
              onClick={() => setReceiptViewerOpen(true)}
              className="text-blue-600 hover:text-blue-900"
              title="View Receipt"
            >
              <Image size={18} alt="View Receipt" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit Expense"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-900"
            title="Delete Expense"
          >
            <Trash2 size={18} />
          </button>
        </td>
      </tr>
      
      {/* Receipt Viewer Modal */}
      <ReceiptViewer
        isOpen={receiptViewerOpen}
        onClose={() => setReceiptViewerOpen(false)}
        receipt={expense.receipt_image}
        expenseDetails={expense}
      />
    </>
  );
}