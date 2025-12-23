"use client";

import {
  FileText,
  Plus,
  RefreshCw
} from "lucide-react";
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import TableActions from "@/components/shared/TableActions";
import { useTranslation } from "@/context/LanguageContext";

export default function ComplianceTable({ complianceItems, filteredItems, onEdit, onDelete, onView, onAddNew }) {
  const { t } = useTranslation('compliance');
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('table.complianceRecords')}</h2>
        <button
          onClick={onAddNew}
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          <Plus size={16} className="mr-1.5" />
          {t('table.addNew')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                {t('table.complianceItem')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                {t('table.entity')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                {t('table.issueDate')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                {t('table.expirationDate')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                {t('table.status')}
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                {t('table.actions')}
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
                      <p className="text-lg font-medium text-gray-900 mb-1">{t('emptyState.noRecords')}</p>
                      <p className="text-gray-500 mb-4">{t('emptyState.startTracking')}</p>
                      <button
                        onClick={onAddNew}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus size={16} className="mr-2" />
                        {t('table.addComplianceRecord')}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-1">{t('emptyState.noMatchingRecords')}</p>
                      <p className="text-gray-500 mb-4">{t('emptyState.tryAdjustingFilters')}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <RefreshCw size={16} className="mr-2" />
                        {t('table.resetFilters')}
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
                const issueDate = item.issue_date ? formatDateForDisplayMMDDYYYY(item.issue_date) : t('table.notAvailable');
                const expirationDate = item.expiration_date ? formatDateForDisplayMMDDYYYY(item.expiration_date) : t('table.notAvailable');
                
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
                        {item.status ? t(`status.${item.status.toLowerCase().replace(' ', '')}`, { defaultValue: item.status }) : t('status.active')}
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
        {t('table.showingRecords', { filtered: filteredItems.length, total: complianceItems.length })}
      </div>
    </div>
  );
}