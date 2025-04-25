"use client";

import { Eye, Edit, Trash2, FileText } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";

export default function ComplianceItem({ item, onEdit, onDelete, onView }) {
  // Get type info from constants or use defaults
  const typeInfo = COMPLIANCE_TYPES[item.compliance_type] || {
    name: item.compliance_type || "Unknown Type",
    icon: <FileText size={18} className="text-gray-500" />,
    description: "Compliance document",
    frequency: "Unknown"
  };

  // Calculate days until expiration
  const getDaysUntilExpiration = () => {
    if (!item.expiration_date) return null;
    
    const today = new Date();
    const expirationDate = new Date(item.expiration_date);
    const differenceInTime = expirationDate - today;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  };

  // Determine status based on expiration date (if not explicitly set)
  const getCalculatedStatus = () => {
    const days = getDaysUntilExpiration();
    
    if (days === null) return "Unknown";
    if (days < 0) return "Expired";
    if (days <= 30) return "Expiring Soon";
    return "Active";
  };

  // Use provided status or calculate it
  const status = item.status || getCalculatedStatus();
  const daysLeft = getDaysUntilExpiration();
  
  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString || "N/A";
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            {typeInfo.icon}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{item.title || typeInfo.name}</div>
            <div className="text-xs text-gray-500">{item.description || typeInfo.description}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{item.entity_name || "N/A"}</div>
        <div className="text-xs text-gray-500">{item.entity_type || "N/A"}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {formatDate(item.issue_date)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {formatDate(item.expiration_date)}
        </div>
        {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
          <div className="text-xs text-orange-500 font-medium">
            {daysLeft} days left
          </div>
        )}
        {daysLeft !== null && daysLeft <= 0 && (
          <div className="text-xs text-red-500 font-medium">
            Expired
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onView(item)}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}