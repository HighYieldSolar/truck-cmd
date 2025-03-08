"use client";

import React from "react";
import { CheckCircle, Clock, AlertCircle, Mail, FileText, Send } from "lucide-react";

/**
 * A reusable status badge component for invoices with consistent styling.
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - The invoice status ('paid', 'pending', 'overdue', 'draft', 'sent', 'partially paid')
 * @param {string} props.size - The size of the badge ('sm', 'md', 'lg')
 * @param {boolean} props.showIcon - Whether to show the status icon
 * @param {boolean} props.animate - Whether to animate the pending/overdue statuses
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} The status badge component
 */
export default function InvoiceStatusBadge({ 
  status, 
  size = "md", 
  showIcon = true,
  animate = false,
  className = ""
}) {
  // Default to 'pending' if no status is provided
  const statusLower = (status || 'pending').toLowerCase();
  
  // Configure styles based on status
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let icon = null;
  let pulseAnimation = animate ? 'animate-pulse' : '';

  switch (statusLower) {
    case 'paid':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      icon = <CheckCircle size={getSizeInPixels(size) - 4} className="mr-1" />;
      break;
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      icon = <Clock size={getSizeInPixels(size) - 4} className="mr-1" />;
      break;
    case 'overdue':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      icon = <AlertCircle size={getSizeInPixels(size) - 4} className={`mr-1 ${animate ? 'animate-pulse' : ''}`} />;
      pulseAnimation = ''; // We only animate the icon for overdue
      break;
    case 'draft':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = <FileText size={getSizeInPixels(size) - 4} className="mr-1" />;
      break;
    case 'sent':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      icon = <Send size={getSizeInPixels(size) - 4} className="mr-1" />;
      break;
    case 'partially paid':
      bgColor = 'bg-indigo-100';
      textColor = 'text-indigo-800';
      icon = <CheckCircle size={getSizeInPixels(size) - 4} className="mr-1" />;
      break;
    case 'voided':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      icon = <AlertCircle size={getSizeInPixels(size) - 4} className="mr-1" />;
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      icon = <FileText size={getSizeInPixels(size) - 4} className="mr-1" />;
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };
  
  // Format the display text with proper capitalization
  const formatStatusText = (status) => {
    if (status === 'overdue' && animate) {
      return 'OVERDUE';
    }
    
    return status
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size] || sizeClasses.md} ${bgColor} ${textColor} ${pulseAnimation} ${className}`}>
      {showIcon && icon}
      {formatStatusText(statusLower)}
    </span>
  );
}

// Helper function to get icon size in pixels based on badge size
function getSizeInPixels(size) {
  switch (size) {
    case 'sm': return 14;
    case 'md': return 16;
    case 'lg': return 18;
    default: return 16;
  }
}