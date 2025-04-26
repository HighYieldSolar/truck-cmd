"use client";

import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants"; 
import StatusBadge from "./StatusBadge";
import { FileText } from "lucide-react";
export default function UpcomingExpirations({ expirations, onViewItem }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Upcoming Expirations
      </h2>
      <div>
        {expirations.length === 0 ? (
          <div className="text-gray-500 text-center">
            No upcoming expirations
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {expirations.map((item) => {
              const itemStatus =
                Math.ceil(
                  (new Date(item.expiration_date) - new Date()) /
                    (1000 * 3600 * 24)
                ) <= 7
                  ? "Expiring Soon"
                  : "Active";
              return (
                <li
                  key={`upcoming-expiration-${item.id}`}
                  className="border-b border-gray-200 pb-2 mb-2 last:border-b-0 last:pb-0"
                  onClick={() => onViewItem(item)}
                >
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="text-gray-600">
                      {item.title ||
                        COMPLIANCE_TYPES[item.compliance_type]?.name ||
                        "Compliance Record"}
                    </div>
                    <div className="flex items-center">
                      <StatusBadge status={itemStatus} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}