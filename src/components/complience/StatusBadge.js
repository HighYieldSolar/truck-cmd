"use client";

import { CheckCircle, AlertCircle, Clock, FileText } from "lucide-react";

export default function StatusBadge({ status }) {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let icon = null;

  switch (status.toLowerCase()) {
    case "active":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      icon = <CheckCircle size={12} className="mr-1" />;
      break;
    case "expired":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      icon = <AlertCircle size={12} className="mr-1" />;
      break;
    case "expiring soon":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      icon = <Clock size={12} className="mr-1" />;
      break;
    case "pending":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      icon = <Clock size={12} className="mr-1" />;
      break;
    default:
      icon = <FileText size={12} className="mr-1" />;
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
}