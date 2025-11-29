"use client";

import Link from "next/link";
import { Bell } from "lucide-react"; // For the empty state icon

export default function NotificationDropdown({
  notifications,
  onMarkAllReadClick,
  onViewAllClick,
  onNotificationItemClick, // Expected to handle marking as read and navigation
}) {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 z-20">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notifications</h3>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={onMarkAllReadClick}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-gray-500 dark:text-gray-400">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
              <Bell size={24} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => onNotificationItemClick(notification)}
              >
                <div className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notification.is_read ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.title}
                      </p>
                      {/* We might want to format time more nicely later */}
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{notification.time || new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{notification.message || notification.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={onViewAllClick}
          className="block w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
} 