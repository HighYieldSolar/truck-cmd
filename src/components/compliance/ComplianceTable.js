"use client";

import { FileText, Plus } from "lucide-react";
import ComplianceItem from "./ComplianceItem";

export default function ComplianceTable({ complianceItems, filteredItems, onEdit, onDelete, onView, onAddNew }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Compliance Item
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiration Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 ">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                  {complianceItems.length === 0 ? (
                    <div>
                      <FileText size={32} className="mx-auto text-gray-400 mb-4 " />
                      <p className="text-lg font-medium text-gray-900 mb-1">No compliance records found</p>
                      <p className="text-gray-500 mb-4">Start tracking your compliance documents</p>
                      <button
                        onClick={onAddNew}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Compliance Record
                      </button>
                     <p className="text-lg font-medium text-gray-900 mb-1">It looks like you don't have any compliance record yet.</p>
                      <p className="text-gray-500 mb-4">You can add one to start tracking your documents</p>
                    </div>
                  ) : (
                    <p className="mb-1">No matching records found. Try adjusting your filters</p>
                  )}
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <ComplianceItem
                  key={item.id}
                  item={item}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item)}
                  onView={() => onView(item)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}