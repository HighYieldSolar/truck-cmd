"use client";

import { CheckCircle, AlertCircle, Clock, FileText, PauseCircle } from "lucide-react";

export default function StatusBadge({ status }) {
  // Normalize the status for consistent comparison
  const normalizedStatus = status.toLowerCase();
  
  // Define styles based on status
  let bgColor = "bg-gray-100";
  let borderColor = "border-gray-200";
  let textColor = "text-gray-800";
  let shadowColor = "shadow-gray-200/50";
  let icon = <FileText size={14} className="mr-1.5" />;

  switch (normalizedStatus) {
    case "active":
      bgColor = "bg-green-50";
      borderColor = "border-green-200";
      textColor = "text-green-700";
      shadowColor = "shadow-green-200/50";
      icon = <CheckCircle size={14} className="mr-1.5" />;
      break;
      
    case "expired":
      bgColor = "bg-red-50";
      borderColor = "border-red-200";
      textColor = "text-red-700";
      shadowColor = "shadow-red-200/50";
      icon = <AlertCircle size={14} className="mr-1.5" />;
      break;
      
    case "expiring soon":
      bgColor = "bg-orange-50";
      borderColor = "border-orange-200";
      textColor = "text-orange-700";
      shadowColor = "shadow-orange-200/50";
      icon = <Clock size={14} className="mr-1.5" />;
      break;
      
    case "pending":
      bgColor = "bg-blue-50";
      borderColor = "border-blue-200";
      textColor = "text-blue-700";
      shadowColor = "shadow-blue-200/50";
      icon = <PauseCircle size={14} className="mr-1.5" />;
      break;
  }

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${bgColor} ${borderColor} ${textColor} shadow-sm ${shadowColor}`}
    >
      {icon}
      {status}
    </span>
  );
}