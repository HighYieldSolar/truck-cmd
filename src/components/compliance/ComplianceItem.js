"use client";

import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import TableActions from "@/components/shared/TableActions";

export default function ComplianceItem({ item, onEdit, onDelete, onView }) {
  // Format dates for better display (fixed timezone issue)
  const issueDate = item.issue_date ? formatDateForDisplayMMDDYYYY(item.issue_date) : 'N/A';
  const expirationDate = item.expiration_date ? formatDateForDisplayMMDDYYYY(item.expiration_date) : 'N/A';

  // Determine status class based on status
  let statusClass = "";
  let statusTextColor = "text-black";
  
  switch (item.status?.toLowerCase() || "") {
    case "active":
      statusClass = "bg-green-100";
      statusTextColor = "text-green-800";
      break;
    case "expiring soon":
      statusClass = "bg-orange-100";
      statusTextColor = "text-orange-800";
      break;
    case "expired":
      statusClass = "bg-red-100";
      statusTextColor = "text-red-800";
      break;
    case "pending":
      statusClass = "bg-blue-100";
      statusTextColor = "text-blue-800";
      break;
    default:
      statusClass = "bg-gray-100";
      statusTextColor = "text-gray-800";
  }

  return (
    <tr key={`compliance-item-${item.id}`} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <a
          onClick={() => onView(item)}
          className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          {item.title}
        </a>
      </td>

      <td className="px-6 py-4 text-gray-900">{item.entity_name}</td>
      
      <td className="px-6 py-4 text-gray-900">{issueDate}</td>
      
      <td className="px-6 py-4 text-gray-900">{expirationDate}</td>

      <td className="px-6 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass} ${statusTextColor}`}>
          {item.status || "Active"}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="flex justify-center">
          <TableActions
            onView={() => onView(item)}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
            size="md"
          />
        </div>
      </td>
    </tr>
  );
}