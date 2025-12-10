"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, FileText, TruckIcon, User, Calendar, Wrench,
  CreditCard, AlertTriangle, Info, CheckCircle, Package
} from "lucide-react";

// Get icon and colors based on notification type
function getNotificationIcon(notification) {
  const iconProps = { size: 16 };

  switch (notification.notification_type) {
    case 'DELIVERY_UPCOMING':
    case 'LOAD_STATUS_UPDATE':
      return { icon: <TruckIcon {...iconProps} />, bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400' };
    case 'DOCUMENT_EXPIRY_COMPLIANCE':
      return { icon: <FileText {...iconProps} />, bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-400' };
    case 'DOCUMENT_EXPIRY_DRIVER_LICENSE':
    case 'DOCUMENT_EXPIRY_DRIVER_MEDICAL':
      return { icon: <User {...iconProps} />, bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-600 dark:text-orange-400' };
    case 'IFTA_DEADLINE':
      return { icon: <Calendar {...iconProps} />, bgColor: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-400' };
    case 'LOAD_ASSIGNED':
      return { icon: <Package {...iconProps} />, bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', textColor: 'text-indigo-600 dark:text-indigo-400' };
    case 'MAINTENANCE_DUE':
      return { icon: <Wrench {...iconProps} />, bgColor: 'bg-amber-100 dark:bg-amber-900/30', textColor: 'text-amber-600 dark:text-amber-400' };
    case 'SYSTEM_ERROR':
      return { icon: <AlertTriangle {...iconProps} />, bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-400' };
    case 'INVOICE_OVERDUE':
    case 'PAYMENT_RECEIVED':
      return { icon: <CreditCard {...iconProps} />, bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', textColor: 'text-emerald-600 dark:text-emerald-400' };
    default:
      // Default based on urgency
      if (notification.urgency === 'HIGH' || notification.urgency === 'CRITICAL') {
        return { icon: <AlertTriangle {...iconProps} />, bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-400' };
      }
      return { icon: <Bell {...iconProps} />, bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-500 dark:text-gray-400' };
  }
}

// Format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationDropdown({
  notifications,
  onMarkAllReadClick,
  onViewAllClick,
  onNotificationItemClick,
  unreadCount = 0,
  isLoading = false,
}) {
  const router = useRouter();
  const hasUnread = notifications.some(n => !n.is_read) || unreadCount > 0;

  return (
    <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 max-w-none sm:max-w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 z-50">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-white" />
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {hasUnread && (
          <button
            onClick={onMarkAllReadClick}
            className="text-xs text-white/90 hover:text-white flex items-center gap-1 transition-colors p-2 -mr-2 rounded-lg hover:bg-white/10 min-h-[36px]"
          >
            <CheckCircle size={14} />
            <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">Read all</span>
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          // Loading skeleton
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-3 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
              <Bell size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All caught up!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.slice(0, 5).map((notification) => {
              const iconInfo = getNotificationIcon(notification);

              return (
                <div
                  key={notification.id}
                  className={`px-3 sm:px-4 py-3.5 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => onNotificationItemClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${iconInfo.bgColor}`}>
                      <span className={iconInfo.textColor}>{iconInfo.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm line-clamp-1 ${
                          !notification.is_read
                            ? 'font-semibold text-gray-900 dark:text-gray-100'
                            : 'font-medium text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Urgency Badge */}
                      {(notification.urgency === 'CRITICAL' || notification.urgency === 'HIGH') && (
                        <span className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 text-xs font-medium rounded ${
                          notification.urgency === 'CRITICAL'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>
                          {notification.urgency === 'CRITICAL' ? 'Critical' : 'High Priority'}
                        </span>
                      )}
                    </div>

                    {/* Unread Indicator */}
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={onViewAllClick}
          className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors py-2 min-h-[44px] flex items-center justify-center"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}
