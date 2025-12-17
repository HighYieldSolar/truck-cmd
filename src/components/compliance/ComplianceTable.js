"use client";

import {
  FileText,
  Plus,
  RefreshCw
} from "lucide-react";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import TableActions from "@/components/shared/TableActions";

export default function ComplianceTable({ complianceItems, filteredItems, onEdit, onDelete, onView, onAddNew }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Compliance Records</h2>
        <button
          onClick={onAddNew}
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          <Plus size={16} className="mr-1.5" />
          Add New
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Compliance Item
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Entity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Issue Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Expiration Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                  {complianceItems.length === 0 ? (
                    <div>
                      <FileText size={32} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-1">No compliance records found</p>
                      <p className="text-gray-500 mb-4">Start tracking your compliance documents</p>
                      <button
                        onClick={onAddNew}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Compliance Record
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-1">No matching records found</p>
                      <p className="text-gray-500 mb-4">Try adjusting your filters</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <RefreshCw size={16} className="mr-2" />
                        Reset Filters
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredItems.map(item => {
                // Calculate status class
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
                
                // Format dates (fixed timezone issue)
                const issueDate = item.issue_date ? formatDateForDisplayMMDDYYYY(item.issue_date) : 'N/A';
                const expirationDate = item.expiration_date ? formatDateForDisplayMMDDYYYY(item.expiration_date) : 'N/A';
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a
                        onClick={() => onView(item)}
                        className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        {item.title}
                      </a>
                    </td>
                    
                    <td className="px-6 py-4 text-gray-900">
                      {item.entity_name}
                    </td>
                    
                    <td className="px-6 py-4 text-gray-900">
                      {issueDate}
                    </td>
                    
                    <td className="px-6 py-4 text-gray-900">
                      {expirationDate}
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass} ${statusTextColor}`}>
                        {item.status || "Active"}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
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
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-gray-700 text-sm">
        Showing {filteredItems.length} of {complianceItems.length} records
      </div>
    </div>
  );
}