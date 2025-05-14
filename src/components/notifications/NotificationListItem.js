"use client";

import Link from "next/link";
import {
  CheckCircle, Info, FileText, AlertTriangle,
  CalendarClock, TruckIcon, ServerCrash // Added ServerCrash for default/error icon
} from "lucide-react";

export function NotificationListItem({ notification, onMarkAsRead }) {
  const getIcon = () => {
    let iconDetails = { icon: <Info size={20} className="text-gray-500" />, bgColor: "bg-gray-100", textColor: "text-gray-500" };

    switch (notification.notification_type) {
      case 'DELIVERY_UPCOMING':
        iconDetails = { icon: <TruckIcon size={20} />, bgColor: "bg-blue-100", textColor: "text-blue-600" };
        break;
      case 'COMPLIANCE_DUE':
        iconDetails = { icon: <FileText size={20} />, bgColor: "bg-red-100", textColor: "text-red-600" };
        break;
      case 'IFTA_DEADLINE':
        iconDetails = { icon: <CalendarClock size={20} />, bgColor: "bg-orange-100", textColor: "text-orange-600" };
        break;
      case 'DOCUMENT_EXPIRY_USER':
      case 'DOCUMENT_EXPIRY_DRIVER':
        iconDetails = { icon: <AlertTriangle size={20} />, bgColor: "bg-yellow-100", textColor: "text-yellow-600" };
        break;
      case 'SYSTEM_ERROR': // Example of another type
        iconDetails = { icon: <ServerCrash size={20} />, bgColor: "bg-red-100", textColor: "text-red-700" };
        break;
      // Add more cases for other notification_types and urgencies
      default:
        // Default icon if type not matched, consider notification.urgency here too
        if (notification.urgency === 'HIGH' || notification.urgency === 'CRITICAL') {
          iconDetails = { icon: <AlertTriangle size={20} />, bgColor: "bg-red-100", textColor: "text-red-600" };
        } else if (notification.urgency === 'LOW') {
          iconDetails = { icon: <Info size={20} />, bgColor: "bg-green-100", textColor: "text-green-600" };
        }
        break;
    }
    return (
      <div className={`p-3 rounded-lg ${iconDetails.bgColor} ${iconDetails.textColor}`}>
        {iconDetails.icon}
      </div>
    );
  };

  const cardBaseClass = "bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 transition-all hover:shadow-md";
  const unreadIndicatorClass = !notification.is_read ? "border-l-4 border-blue-500" : "border-l-4 border-transparent";

  return (
    <li className={`${cardBaseClass} ${unreadIndicatorClass}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className={`text-md font-semibold ${!notification.is_read ? 'text-gray-800' : 'text-gray-600'} break-words`}>
              {notification.link_to ? (
                <Link
                  href={notification.link_to}
                  className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                  onClick={() => {
                    if (!notification.is_read) onMarkAsRead(notification.id);
                    // Potentially add router.push here if Link alone is not enough or causes issues with state update for read status
                  }}
                >
                  {notification.title}
                </Link>
              ) : (
                notification.title
              )}
            </h4>
            {!notification.is_read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="ml-3 p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                title="Mark as read"
              >
                <CheckCircle size={20} />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 mb-1.5 break-words">{notification.message}</p>
          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2">
            <span>{new Date(notification.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span>·</span>
            <span>{new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {notification.due_date && (
              <>
                <span>·</span>
                <span className="font-medium text-red-600">
                  Due: {new Date(notification.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function NotificationListItemSkeleton() {
  return (
    <li className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="rounded-lg bg-gray-300 h-10 w-10 flex-shrink-0"></div>
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex justify-between items-start">
            <div className="h-4 bg-gray-300 rounded w-3/5"></div>
            <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
          </div>
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    </li>
  );
} 