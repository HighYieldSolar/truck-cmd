"use client";

import { CheckCircle, FileText, COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";

export default function UpcomingExpirations({ expirations, onViewItem }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Upcoming Expirations</h2>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Next 30 Days
        </span>
      </div>
      <div className="p-4">
        {expirations.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
            <p className="text-gray-500">No upcoming expirations!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expirations.map(item => {
              const daysLeft = Math.ceil(
                (new Date(item.expiration_date) - new Date()) / (1000 * 3600 * 24)
              );
              
              const typeInfo = COMPLIANCE_TYPES[item.compliance_type] || {
                icon: <FileText size={16} className="text-blue-600" />
              };
              
              return (
                <div
                  key={item.id}
                  className="flex flex-col p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewItem(item)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        {typeInfo.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                        {item.title || COMPLIANCE_TYPES[item.compliance_type]?.name || "Compliance Record"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {item.entity_name || "Unknown entity"}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      daysLeft <= 7 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {daysLeft === 0 ? "Expires today" : `${daysLeft} days left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}