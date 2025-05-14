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
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden border border-gray-200 z-20">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={onMarkAllReadClick}
            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-gray-500">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Bell size={24} className="text-gray-400" />
            </div>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                onClick={() => onNotificationItemClick(notification)}
              >
                <div className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notification.is_read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      {/* We might want to format time more nicely later */}
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{notification.time || new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{notification.message || notification.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onViewAllClick}
          className="block w-full text-center text-sm text-blue-600 hover:text-blue-800"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
} 